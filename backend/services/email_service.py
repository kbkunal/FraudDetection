"""
Email Fraud Detection Service.
Parses manual email submissions or raw EML files, evaluates sender/domain consistency,
inspects Authentication-Results (SPF/DKIM/DMARC), extracts safe URLs and attachment metadata,
and applies rule heuristics and baseline classification.
"""

from __future__ import annotations

import email
from email import policy
import hashlib
import re
import urllib.parse
from typing import Any
try:
    from rapidfuzz import fuzz
    def calculate_ratio(a: str, b: str) -> float:
        return float(fuzz.ratio(a, b))
except ImportError:
    import difflib
    def calculate_ratio(a: str, b: str) -> float:
        return difflib.SequenceMatcher(None, a, b).ratio() * 100.0
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

from schemas.email_schema import (
    EmailSenderAnalysis,
    EmailAuthResult,
    EmailURLResult,
    EmailAttachmentResult,
    EmailIndicator,
    EmailAnalysisResponse,
)

RULE_VERSION = "1.0.0"
MODEL_VERSION = "email_tfidf_logreg_v1"

LIMITATIONS = [
    "EML header authentication checks (SPF/DKIM/DMARC) reflect values in the uploaded file and are not independently re-verified against DNS.",
    "A passed SPF/DKIM/DMARC check does not guarantee an email is benign; threat actors frequently use their own authenticated domains.",
    "Manual form submissions cannot perform cryptographic or header-level validation.",
    "URL reputation results are heuristics and do not provide definitive guarantees.",
    "Attachments are analyzed by metadata and hashes only; sandboxed execution is not performed.",
]

OFFICIAL_DOMAINS = [
    "sbi.co.in", "hdfcbank.com", "icicibank.com", "axisbank.com",
    "pnbindia.in", "bankofbaroda.in", "kotak.com", "rbi.org.in",
    "incometax.gov.in", "cybercrime.gov.in", "uidai.gov.in",
    "amazon.in", "flipkart.com", "google.com", "microsoft.com", "apple.com"
]

SUSPICIOUS_EXTENSIONS = {
    ".exe", ".scr", ".bat", ".cmd", ".vbs", ".js", ".jse", ".wsf", ".ps1", ".hta", ".iso", ".img", ".jar"
}

MACRO_RISK_EXTENSIONS = {
    ".docm", ".xlsm", ".pptm", ".dotm", ".xltm"
}

URL_REGEX = re.compile(
    r"(?:https?:\/\/|www\.)[a-zA-Z0-9.\-_]+(?:\.[a-zA-Z]{2,})(?:[^\s<>\"]*[a-zA-Z0-9/#])?",
    re.IGNORECASE,
)

_TRAIN_EMAILS = [
    ("Action Required: Verify Your SBI Account. Dear Customer, Your account is suspended. Click to update KYC", "banking_phishing"),
    ("HDFC Bank: Unusual login detected. Please confirm your credentials immediately to avoid suspension", "banking_phishing"),
    ("RBI Circular: Submit your updated KYC details within 24 hours to keep account active", "govt_impersonation"),
    ("Income Tax Notice: Pending refund of Rs 45,230 available. Submit bank credentials to receive refund", "credential_theft"),
    ("Invoice INV-2024-1089. Please wire payment of Rs 8,50,000 to our updated overseas vendor bank account", "bec"),
    ("Urgent wire transfer request. Please initiate USD 25,000 to new beneficiary as per agreement", "bec"),
    ("Congratulations! You won iPhone 15 in Mega Draw. Pay shipping fee to claim", "prize_scam"),
    ("Meeting notes from project roadmap discussion. Attached PDF contains summary.", "legitimate"),
    ("Your Amazon order has shipped. Expected delivery on Friday. Track in app.", "legitimate"),
    ("Monthly account statement for September 2024. Your account ending in 4521.", "legitimate"),
]

_vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)
_X_train = _vectorizer.fit_transform([e[0] for e in _TRAIN_EMAILS])
_y_train = [e[1] for e in _TRAIN_EMAILS]
_classifier = LogisticRegression(max_iter=500, class_weight="balanced")
_classifier.fit(_X_train, _y_train)


def defang_url(url: str) -> str:
    return url.replace("http://", "hxxp://").replace("https://", "hxxps://").replace(".", "[.]")


def extract_domain(address: str | None) -> str:
    if not address:
        return ""
    # Extract email from "Name <user@domain.com>"
    match = re.search(r"[\w\.-]+@([\w\.-]+)", address)
    if match:
        return match.group(1).lower().strip()
    if "@" in address:
        return address.split("@")[-1].lower().strip()
    return ""


def analyze_sender_domain(from_address: str, reply_to: str | None, claimed_org: str | None) -> EmailSenderAnalysis:
    from_dom = extract_domain(from_address)
    reply_dom = extract_domain(reply_to) if reply_to else ""
    notes: list[str] = []

    mismatch = False
    if reply_dom and from_dom and reply_dom != from_dom:
        mismatch = True
        notes.append(f"Reply-To domain '{reply_dom}' differs from From domain '{from_dom}'")

    # Check lookalikes
    lookalike_found = False
    max_sim = 0.0
    for official in OFFICIAL_DOMAINS:
        if from_dom and from_dom != official:
            ratio = calculate_ratio(from_dom, official)
            if ratio > 75:
                lookalike_found = True
                max_sim = float(ratio)
                notes.append(f"From domain '{from_dom}' is a high-similarity lookalike to official '{official}' ({ratio}% match)")

    # Check suspicious subdomain patterns e.g. sbi.co.in.scam-portal.com
    suspicious_sub = False
    for official in OFFICIAL_DOMAINS:
        if official in from_dom and not from_dom.endswith("." + official) and from_dom != official:
            suspicious_sub = True
            notes.append(f"From domain contains official name '{official}' in misleading subdomain structure")

    domain_match = "suspicious" if (lookalike_found or suspicious_sub or mismatch) else "normal"

    return EmailSenderAnalysis(
        from_address=from_address,
        reply_to=reply_to,
        domain_match=domain_match,
        reply_to_mismatch=mismatch,
        suspicious_subdomain=suspicious_sub,
        lookalike_domain_detected=lookalike_found,
        lookalike_similarity=max_sim if lookalike_found else None,
        notes=notes,
    )


def parse_auth_headers(headers: dict[str, str]) -> EmailAuthResult:
    auth_header = headers.get("Authentication-Results", "") or headers.get("authentication-results", "")
    received_spf = headers.get("Received-SPF", "") or headers.get("received-spf", "")

    spf = "not_available"
    dkim = "not_available"
    dmarc = "not_available"

    combined = f"{auth_header} {received_spf}".lower()

    if "spf=pass" in combined or "pass (spf" in combined:
        spf = "pass"
    elif "spf=fail" in combined or "spf=softfail" in combined:
        spf = "fail"
    elif "spf=neutral" in combined:
        spf = "neutral"

    if "dkim=pass" in combined or "pass (dkim" in combined:
        dkim = "pass"
    elif "dkim=fail" in combined:
        dkim = "fail"

    if "dmarc=pass" in combined:
        dmarc = "pass"
    elif "dmarc=fail" in combined:
        dmarc = "fail"

    return EmailAuthResult(
        spf=spf,
        dkim=dkim,
        dmarc=dmarc,
        provenance_note="Headers parsed from submitted EML file; not verified directly against DNS records.",
    )


def extract_urls(text: str) -> list[EmailURLResult]:
    urls: list[EmailURLResult] = []
    seen = set()
    for m in URL_REGEX.finditer(text):
        u = m.group(0)
        if u in seen:
            continue
        seen.add(u)
        domain = ""
        try:
            parsed = urllib.parse.urlparse(u if "://" in u else "http://" + u)
            domain = parsed.netloc.lower()
        except Exception:
            pass

        rep = "suspicious"
        if any(legit in domain for legit in OFFICIAL_DOMAINS):
            rep = "known_legitimate"
        elif any(ext in domain for ext in [".xyz", ".top", ".club", ".online", ".site", ".tk", ".pw", ".bid"]):
            rep = "high_risk_tld"

        urls.append(
            EmailURLResult(
                url=u,
                defanged_url=defang_url(u),
                domain=domain,
                reputation_status=rep,
            )
        )
    return urls


def evaluate_email_rules(
    subject: str,
    body: str,
    sender_analysis: EmailSenderAnalysis,
    auth: EmailAuthResult,
    urls: list[EmailURLResult],
    attachments: list[EmailAttachmentResult],
) -> list[EmailIndicator]:
    indicators: list[EmailIndicator] = []
    text = f"{subject}\n{body}".lower()

    # Rule: Lookalike domain
    if sender_analysis.lookalike_domain_detected:
        indicators.append(
            EmailIndicator(
                code="RULE_EMAIL_LOOKALIKE_DOMAIN",
                type="domain_spoofing",
                explanation=f"Sender domain closely mimics an official domain: {'; '.join(sender_analysis.notes)}",
                evidence_reference=sender_analysis.from_address,
                severity="critical",
                method="domain_similarity",
                confidence=0.92,
            )
        )

    # Rule: Reply-To Mismatch
    if sender_analysis.reply_to_mismatch:
        indicators.append(
            EmailIndicator(
                code="RULE_EMAIL_REPLYTO_MISMATCH",
                type="sender_deception",
                explanation=f"Reply-To destination differs from sender domain: {sender_analysis.reply_to}",
                evidence_reference=f"From: {sender_analysis.from_address} vs Reply-To: {sender_analysis.reply_to}",
                severity="high",
                method="header_comparison",
                confidence=0.88,
            )
        )

    # Rule: Failed Authentication
    if auth.spf == "fail" or auth.dmarc == "fail":
        indicators.append(
            EmailIndicator(
                code="RULE_EMAIL_AUTH_FAIL",
                type="authentication_anomaly",
                explanation=f"Email failed technical domain authentication (SPF={auth.spf}, DMARC={auth.dmarc}). This indicates the sender server may not be authorized to send on behalf of the domain.",
                evidence_reference=f"SPF: {auth.spf}, DMARC: {auth.dmarc}",
                severity="high",
                method="header_auth_parsing",
                confidence=0.85,
            )
        )

    # Rule: BEC / Payment redirection
    if any(k in text for k in ["updated bank", "new bank account", "wire transfer", "payment details changed", "swift", "overseas vendor", "new invoice details"]):
        indicators.append(
            EmailIndicator(
                code="RULE_EMAIL_BEC_INVOICE",
                type="business_email_compromise",
                explanation="Email discusses modifying banking coordinates or sending wire transfers. Characteristic pattern of Business Email Compromise (BEC) and invoice diversion fraud.",
                evidence_reference="Payment redirect / wire transfer phrasing detected",
                severity="critical",
                method="pattern_heuristic",
                confidence=0.90,
            )
        )

    # Rule: Credential harvest / Phishing form
    if any(k in text for k in ["verify your password", "confirm your account credentials", "update kyc immediately", "login within 24 hours", "account suspended"]):
        indicators.append(
            EmailIndicator(
                code="RULE_EMAIL_CREDENTIAL_PHISH",
                type="credential_theft",
                explanation="Email requests account credential confirmation or urgent KYC verification under threat of suspension.",
                evidence_reference="Urgent KYC / credential submission request",
                severity="critical",
                method="pattern_heuristic",
                confidence=0.91,
            )
        )

    # Rule: Dangerous Attachments
    for att in attachments:
        for note in att.risk_notes:
            indicators.append(
                EmailIndicator(
                    code="RULE_EMAIL_SUSPICIOUS_ATTACHMENT",
                    type="attachment_risk",
                    explanation=f"Attachment '{att.filename}' flagged: {note}",
                    evidence_reference=att.filename,
                    severity="critical" if "executable" in note.lower() else "high",
                    method="attachment_inspection",
                    confidence=0.95,
                )
            )

    return indicators


def analyze_email_manual(
    from_address: str,
    reply_to: str | None,
    subject: str,
    body: str,
    claimed_org: str | None = None,
    analysis_run_id: str = "manual_email_run",
) -> EmailAnalysisResponse:
    sender_analysis = analyze_sender_domain(from_address, reply_to, claimed_org)
    auth = EmailAuthResult(
        spf="not_available",
        dkim="not_available",
        dmarc="not_available",
        provenance_note="Manual submission: Header authentication cannot be evaluated.",
    )
    urls = extract_urls(f"{subject} {body}")
    attachments: list[EmailAttachmentResult] = []
    indicators = evaluate_email_rules(subject, body, sender_analysis, auth, urls, attachments)

    # Classifier
    categories: list[str] = []
    try:
        vec = _vectorizer.transform([f"{subject} {body}"])
        probs = _classifier.predict_proba(vec)[0]
        classes = _classifier.classes_
        top_idx = probs.argmax()
        if probs[top_idx] >= 0.3 and classes[top_idx] != "legitimate":
            categories.append(classes[top_idx])
        if not categories:
            categories = ["banking_phishing"] if indicators else ["likely_legitimate"]
    except Exception:
        categories = ["banking_phishing"] if indicators else ["likely_legitimate"]

    # Assessment
    critical_count = sum(1 for i in indicators if i.severity == "critical")
    high_count = sum(1 for i in indicators if i.severity == "high")
    if critical_count > 0 or high_count >= 2:
        overall = "high_risk"
    elif high_count == 1 or len(indicators) >= 2:
        overall = "medium_risk"
    elif len(indicators) == 1:
        overall = "low_risk"
    else:
        overall = "likely_legitimate"

    return EmailAnalysisResponse(
        analysis_run_id=analysis_run_id,
        status="completed",
        sender_analysis=sender_analysis,
        auth_results=auth,
        content_indicators=indicators,
        urls=urls,
        attachments=attachments,
        categories=categories,
        overall_assessment=overall,
        limitations=LIMITATIONS,
    )


def analyze_eml_bytes(
    eml_bytes: bytes,
    analysis_run_id: str = "eml_run",
) -> EmailAnalysisResponse:
    try:
        msg = email.message_from_bytes(eml_bytes, policy=policy.default)
    except Exception:
        # Fallback to simple bytes decoding
        msg = email.message_from_string(eml_bytes.decode("utf-8", errors="ignore"))

    from_addr = str(msg.get("From", ""))
    reply_to = str(msg.get("Reply-To", "")) or None
    subject = str(msg.get("Subject", ""))

    headers_dict = {k: str(v) for k, v in msg.items()}
    auth_results = parse_auth_headers(headers_dict)
    sender_analysis = analyze_sender_domain(from_addr, reply_to, None)

    # Extract plain text body safely
    body_parts = []
    attachments: list[EmailAttachmentResult] = []

    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disp = str(part.get("Content-Disposition", ""))

            # Attachment handling
            if "attachment" in content_disp or part.get_filename():
                fname = part.get_filename() or "unnamed_attachment"
                payload = part.get_payload(decode=True) or b""
                fsize = len(payload)
                sha256 = hashlib.sha256(payload).hexdigest()

                risk_notes = []
                lower_name = fname.lower()
                for ext in SUSPICIOUS_EXTENSIONS:
                    if lower_name.endswith(ext):
                        risk_notes.append(f"High-risk executable extension detected ({ext})")
                for ext in MACRO_RISK_EXTENSIONS:
                    if lower_name.endswith(ext):
                        risk_notes.append(f"Potential macro-enabled document ({ext})")

                rep = "high_risk" if risk_notes else "unknown"
                attachments.append(
                    EmailAttachmentResult(
                        filename=fname,
                        mime_type=content_type,
                        file_size=fsize,
                        sha256_hash=sha256,
                        reputation_status=rep,
                        risk_notes=risk_notes,
                    )
                )
            elif content_type == "text/plain":
                payload = part.get_payload(decode=True) or b""
                body_parts.append(payload.decode("utf-8", errors="ignore"))
    else:
        payload = msg.get_payload(decode=True) or b""
        body_parts.append(payload.decode("utf-8", errors="ignore"))

    body = "\n".join(body_parts)
    urls = extract_urls(f"{subject} {body}")
    indicators = evaluate_email_rules(subject, body, sender_analysis, auth_results, urls, attachments)

    categories = []
    if any(i.severity in ["critical", "high"] for i in indicators):
        for ind in indicators:
            if "BEC" in ind.code:
                categories.append("bec")
            elif "CREDENTIAL" in ind.code:
                categories.append("credential_theft")
            elif "LOOKALIKE" in ind.code:
                categories.append("banking_phishing")
        categories = list(set(categories)) or ["banking_phishing"]
    else:
        categories = ["likely_legitimate"]

    critical_count = sum(1 for i in indicators if i.severity == "critical")
    high_count = sum(1 for i in indicators if i.severity == "high")
    if critical_count > 0 or high_count >= 2:
        overall = "high_risk"
    elif high_count == 1 or len(indicators) >= 2:
        overall = "medium_risk"
    elif len(indicators) == 1:
        overall = "low_risk"
    else:
        overall = "likely_legitimate"

    return EmailAnalysisResponse(
        analysis_run_id=analysis_run_id,
        status="completed",
        sender_analysis=sender_analysis,
        auth_results=auth_results,
        content_indicators=indicators,
        urls=urls,
        attachments=attachments,
        categories=categories,
        overall_assessment=overall,
        limitations=LIMITATIONS,
    )
