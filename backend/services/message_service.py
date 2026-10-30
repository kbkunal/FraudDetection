"""
Message / SMS Fraud Detection Service.
Extracts entities (URLs, phone numbers, amounts, orgs), runs pattern-based heuristics,
and applies baseline text classification for potential smishing, fake KYC, digital arrest, and OTP theft.
"""

from __future__ import annotations

import re
import urllib.parse
from typing import Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

from schemas.message import (
    MessageEntityResult,
    MessageURLResult,
    MessageIndicator,
    MessageAnalysisResponse,
)

RULE_VERSION = "1.0.0"
MODEL_VERSION = "tfidf_logreg_v1"

LIMITATIONS = [
    "Text analysis is based on pattern heuristics and baseline NLP trained on synthetic examples.",
    "Detection indicators are review priorities, not definitive proof of fraud.",
    "Legitimate bank or service alerts may occasionally share phrases with phishing templates.",
    "Sender ID verification requires carrier or regulatory access and cannot be verified from message body alone.",
    "URL reputation results are heuristics and do not guarantee safety or compromise.",
]

# Patterns
URL_REGEX = re.compile(
    r"(?:https?:\/\/|www\.)[a-zA-Z0-9.\-_]+(?:\.[a-zA-Z]{2,})(?:[^\s]*[a-zA-Z0-9/#])?",
    re.IGNORECASE,
)
PHONE_REGEX = re.compile(
    r"(?:\+?91[\-\s]?)?[6-9]\d{9}\b|\b1800[\-\s]?\d{3}[\-\s]?\d{3,4}\b"
)
AMOUNT_REGEX = re.compile(
    r"(?:Rs\.?|INR|₹)\s*[\d,]+(?:\.\d{1,2})?|\b[\d,]+\s*(?:rupees|lakh|crore)\b",
    re.IGNORECASE,
)
UPI_ID_REGEX = re.compile(
    r"\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b"
)

# Known legitimate shortcode / bank signatures for contrast
KNOWN_BANKS = ["SBI", "HDFC", "ICICI", "AXIS", "PNB", "BOB", "KOTAK", "CANARA", "UNION BANK", "RBI", "NPCI", "BHIM", "PAYTM", "PHONEPE", "GPAY"]

# Training baseline for synthetic fallback
_TRAIN_TEXTS = [
    ("Dear Customer, Your SBI account has been blocked due to incomplete KYC. Update immediately at http://sbi-kyc-update.xyz or account closed", "banking_impersonation"),
    ("HDFC BANK: Your account will be closed in 24 hours. Click here to update KYC: http://hdfcbank-verify.net/kyc", "banking_impersonation"),
    ("Alert: Your Axis Bank account is temporarily blocked. Complete verification at http://axisbank-kyc.in to avoid closure", "banking_impersonation"),
    ("Your ICICI Bank account shows suspicious activity. Verify immediately: http://icicibank-secure.xyz/verify", "banking_impersonation"),
    ("Congratulations! You have won Rs 5,00,000 in SBI Lucky Draw. Call 9876500001 and pay Rs 500 processing fee", "reward_scam"),
    ("DEAR CUSTOMER: You have earned cashback of Rs 2,500 from your recent transaction. Claim now: http://cashback-claim.in/verify", "reward_scam"),
    ("Your KYC is expired. To continue using BHIM UPI services please update KYC immediately. Click: http://bhim-kyc-update.xyz", "fake_kyc"),
    ("NPCI: Your UPI ID has been suspended. To reactivate send OTP to 9876543210 or visit http://npci-upi-restore.com", "otp_theft"),
    ("Your OTP for SBI transaction is 847291. Share this OTP with our customer care executive for verification: 9988001122", "otp_theft"),
    ("PhonePe: Your account will be deactivated. Call helpline 9900000011 and share OTP to verify your account", "otp_theft"),
    ("A payment of Rs 1 has been sent to you. Please enter your UPI PIN to accept the payment", "upi_scam"),
    ("Your refund of Rs 499 is ready. To receive enter your UPI PIN and click accept on payment request", "upi_scam"),
    ("GPay refund: Rs 2000 has been initiated. Click the link to accept: http://gpay-refund.xyz/accept?ref=XY12", "upi_scam"),
    ("CBI Notice: Your mobile number is linked to money laundering. Appear before us or face arrest. Call 9876500000", "digital_arrest"),
    ("ED Office: Your Aadhaar has been misused. You are under digital arrest. Pay Rs 50000 immediately to avoid FIR", "digital_arrest"),
    ("Delivery failed for your package. Pay Rs 35 customs fee at: http://dhl-india-customs.xyz/pay to reschedule", "malicious_link"),
    ("Your account statement for October 2024. Balance: Rs 45,230. For queries call SBI helpline 1800112211", "legitimate"),
    ("Payment of Rs 1,200 received from AMAZON SELLER on 15 Oct. Ref: TXN123456. HDFC Bank", "legitimate"),
    ("Your electricity bill payment of Rs 850 is successful. Reference: BESCOM123456. Thank you for using HDFC Bank", "legitimate"),
    ("OTP for login to your SBI YONO account is 738291. Valid for 10 minutes. Do NOT share with anyone", "legitimate"),
    ("Your Flipkart order #FO123456 has been shipped. Expected delivery: 18 Oct. Track at flipkart.com/track", "legitimate"),
    ("Credit Alert: Rs 15,000 credited to your account XX1234 on 01 Oct. Available balance: Rs 32,456. -ICICI Bank", "legitimate"),
]

# Initialize pipeline
_vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)
_X_train = _vectorizer.fit_transform([t[0] for t in _TRAIN_TEXTS])
_y_train = [t[1] for t in _TRAIN_TEXTS]
_classifier = LogisticRegression(max_iter=500, class_weight="balanced")
_classifier.fit(_X_train, _y_train)


def defang_url(url: str) -> str:
    """Defang URL for safe display (e.g. hxxp://example[.]com)."""
    return url.replace("http://", "hxxp://").replace("https://", "hxxps://").replace(".", "[.]")


def extract_entities(text: str) -> tuple[list[MessageEntityResult], list[MessageURLResult]]:
    entities: list[MessageEntityResult] = []
    urls: list[MessageURLResult] = []

    # URLs
    for match in URL_REGEX.finditer(text):
        url = match.group(0)
        domain = ""
        try:
            parsed = urllib.parse.urlparse(url if "://" in url else "http://" + url)
            domain = parsed.netloc.lower()
        except Exception:
            pass

        # Simple heuristic reputation status
        reputation = "suspicious"
        if any(legit in domain for legit in ["sbi.co.in", "hdfcbank.com", "icicibank.com", "axisbank.com", "amazon.in", "flipkart.com", "gov.in", "nic.in"]):
            reputation = "known_legitimate"
        elif any(ext in domain for ext in [".xyz", ".top", ".club", ".fit", ".online", ".site", ".tk", ".ml"]):
            reputation = "high_risk_tld"

        urls.append(
            MessageURLResult(
                url=url,
                defanged_url=defang_url(url),
                domain=domain,
                reputation_status=reputation,
            )
        )
        entities.append(
            MessageEntityResult(
                entity_type="url",
                value=url,
                start_pos=match.start(),
                end_pos=match.end(),
            )
        )

    # Phone numbers
    for match in PHONE_REGEX.finditer(text):
        phone = match.group(0)
        entities.append(
            MessageEntityResult(
                entity_type="phone_number",
                value=phone,
                start_pos=match.start(),
                end_pos=match.end(),
            )
        )

    # Amounts
    for match in AMOUNT_REGEX.finditer(text):
        entities.append(
            MessageEntityResult(
                entity_type="amount",
                value=match.group(0),
                start_pos=match.start(),
                end_pos=match.end(),
            )
        )

    # UPI IDs
    for match in UPI_ID_REGEX.finditer(text):
        entities.append(
            MessageEntityResult(
                entity_type="upi_id",
                value=match.group(0),
                start_pos=match.start(),
                end_pos=match.end(),
            )
        )

    # Banks mentioned
    lower_text = text.lower()
    for bank in KNOWN_BANKS:
        pattern = r"\b" + re.escape(bank.lower()) + r"\b"
        for m in re.finditer(pattern, lower_text):
            entities.append(
                MessageEntityResult(
                    entity_type="organization",
                    value=bank,
                    start_pos=m.start(),
                    end_pos=m.end(),
                )
            )

    return entities, urls


def evaluate_rules(text: str, urls: list[MessageURLResult], sender_id: str | None) -> list[MessageIndicator]:
    indicators: list[MessageIndicator] = []
    t_lower = text.lower()

    # Rule 1: OTP / PIN Request
    if re.search(r"\b(share|send|provide|give)\b.*\b(otp|pin|password|cvv)\b", t_lower) or \
       re.search(r"\b(enter\s+your\s+upi\s+pin\s+to\s+(receive|claim|accept))\b", t_lower):
        indicators.append(
            MessageIndicator(
                code="RULE_MSG_OTP_PIN_THEFT",
                type="credential_theft",
                explanation="Message requests sharing an OTP, PIN, or entering a UPI PIN to receive money. Official banks and legitimate platforms never ask to share OTPs or enter a PIN to receive payments.",
                evidence_reference="Text pattern matches credential request",
                severity="critical",
                method="pattern_heuristic",
                confidence=0.95,
            )
        )

    # Rule 2: Fake KYC / Account Suspension Threat
    if ("kyc" in t_lower or "pan" in t_lower or "aadhaar" in t_lower) and \
       any(w in t_lower for w in ["blocked", "suspended", "deactivated", "expire", "closed", "immediate"]):
        indicators.append(
            MessageIndicator(
                code="RULE_MSG_FAKE_KYC",
                type="urgency_coercion",
                explanation="Message threatens account blockage, deactivation, or suspension due to pending KYC/Aadhaar/PAN update. Fraudsters use artificial urgency to push victims toward phishing portals.",
                evidence_reference="Urgent KYC/blockage phrasing detected",
                severity="high",
                method="pattern_heuristic",
                confidence=0.90,
            )
        )

    # Rule 3: Digital Arrest / Legal Threat
    if any(auth in t_lower for auth in ["cbi", "police", "ed office", "enforcement directorate", "cyber crime cell", "fir", "arrest", "court notice", "money laundering"]):
        indicators.append(
            MessageIndicator(
                code="RULE_MSG_DIGITAL_ARREST",
                type="extortion_intimidation",
                explanation="Message mentions law enforcement agencies (CBI, Police, ED) or threatens legal arrest/FIR. Law enforcement does not issue arrest threats or financial settlement demands via SMS or messaging apps.",
                evidence_reference="Extortion/authority impersonation keywords detected",
                severity="critical",
                method="pattern_heuristic",
                confidence=0.92,
            )
        )

    # Rule 4: Lottery, Rewards, or Lucky Draw Scam
    if any(term in t_lower for term in ["lucky draw", "lottery", "won rs", "winner of", "cashback of rs", "prize claim"]) and \
       any(fee in t_lower for fee in ["fee", "charge", "click", "claim", "processing"]):
        indicators.append(
            MessageIndicator(
                code="RULE_MSG_REWARD_SCAM",
                type="advance_fee_scam",
                explanation="Message promises unexpected financial rewards, lottery winnings, or cashback, often requesting a nominal fee or link click. A common advance-fee fraud pattern.",
                evidence_reference="Lottery/cashback promise with action trigger",
                severity="high",
                method="pattern_heuristic",
                confidence=0.88,
            )
        )

    # Rule 5: Suspicious Link / Unofficial Domain
    for u in urls:
        if u.reputation_status in ["high_risk_tld", "suspicious"]:
            indicators.append(
                MessageIndicator(
                    code="RULE_MSG_SUSPICIOUS_LINK",
                    type="malicious_url",
                    explanation=f"Contains link to '{u.defanged_url}'. Unofficial or high-risk domain used in financial context. Do not click or input any sensitive details.",
                    evidence_reference=u.defanged_url,
                    severity="high",
                    method="url_heuristic",
                    confidence=0.85,
                )
            )

    # Rule 6: Urgency phrasing without specifics
    if any(phrase in t_lower for phrase in ["in 24 hours", "immediate action required", "valid today only", "urgent alert"]):
        if not any(i.code == "RULE_MSG_FAKE_KYC" for i in indicators):
            indicators.append(
                MessageIndicator(
                    code="RULE_MSG_PRESSURE_TACTIC",
                    type="social_engineering",
                    explanation="Message uses strict time-pressure tactics ('within 24 hours', 'immediate action required') intended to rush critical judgment.",
                    evidence_reference="High-urgency language detected",
                    severity="medium",
                    method="pattern_heuristic",
                    confidence=0.75,
                )
            )

    return indicators


def analyze_message(
    text: str,
    source_app: str | None = None,
    sender_id: str | None = None,
    language: str | None = "en",
    context: str | None = None,
    analysis_run_id: str = "local_run",
) -> MessageAnalysisResponse:
    entities, urls = extract_entities(text)
    indicators = evaluate_rules(text, urls, sender_id)

    # ML Classifier Prediction
    categories: list[str] = []
    try:
        vec = _vectorizer.transform([text])
        probs = _classifier.predict_proba(vec)[0]
        classes = _classifier.classes_
        top_indices = probs.argsort()[::-1]

        # Take top predictions above threshold
        for idx in top_indices[:2]:
            if probs[idx] >= 0.25 and classes[idx] != "legitimate":
                categories.append(classes[idx])

        if not categories:
            if any(i.severity in ["critical", "high"] for i in indicators):
                # Infer category from rule indicators
                for ind in indicators:
                    if "OTP" in ind.code:
                        categories.append("otp_theft")
                    elif "KYC" in ind.code:
                        categories.append("fake_kyc")
                    elif "ARREST" in ind.code:
                        categories.append("digital_arrest")
                    elif "REWARD" in ind.code:
                        categories.append("reward_scam")
                categories = list(set(categories))
            else:
                categories.append("likely_legitimate" if not indicators else "suspicious_communication")
    except Exception:
        categories = ["suspicious_communication"] if indicators else ["likely_legitimate"]

    # Overall assessment
    critical_count = sum(1 for i in indicators if i.severity == "critical")
    high_count = sum(1 for i in indicators if i.severity == "high")

    if critical_count > 0 or high_count >= 2:
        overall_assessment = "high_risk"
    elif high_count == 1 or len(indicators) >= 2:
        overall_assessment = "medium_risk"
    elif len(indicators) == 1:
        overall_assessment = "low_risk"
    else:
        overall_assessment = "likely_legitimate"

    return MessageAnalysisResponse(
        analysis_run_id=analysis_run_id,
        status="completed",
        categories=categories,
        indicators=indicators,
        urls=urls,
        entities=entities,
        overall_assessment=overall_assessment,
        limitations=LIMITATIONS,
    )
