"""
Help Centre Service.
Manages fraud categories, action guides, official contacts, evidence checklists,
and retrieval-augmented assistance queries.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select

from models.help import (
    FraudCategory,
    HelpArticle,
    ActionGuide,
    OfficialContact,
    EvidenceChecklist,
    IncidentSummary,
)
from schemas.help_schema import (
    AssistantQueryResponse,
    IncidentSummaryCreate,
)


def seed_database(db: Session):
    """Seed the database with standard Indian cybercrime categories and official procedures if empty."""
    existing_cat = db.execute(select(FraudCategory)).first()
    if existing_cat:
        return

    # 1. Categories
    categories_data = [
        ("upi_fraud", "UPI & Payment Fraud", "Unauthorized UPI transfers, QR code scams, collect-request fraud, and fake cashback scams.", "CreditCard", 1),
        ("banking_fraud", "Banking & Account Takeover", "Unauthorized netbanking access, SIM swap, fake KYC blockage threats, and unauthorized debits.", "Building2", 2),
        ("card_fraud", "Credit / Debit Card Fraud", "Card skimming, unauthorized online card charges, CVV theft, and international unauthorized transactions.", "CreditCard", 3),
        ("sms_whatsapp_scam", "SMS & WhatsApp Smishing", "Deceptive messages promising lottery wins, electricity disconnection, job offers, or APK download links.", "MessageSquare", 4),
        ("email_phishing", "Email Phishing & BEC", "Deceptive emails spoofing banks, income tax, employers, or business invoice alteration.", "Mail", 5),
        ("social_media_fraud", "Social Media Impersonation", "Cloned social media profiles asking friends for emergency money, crypto investment schemes, and honeytraps.", "Share2", 6),
        ("digital_arrest", "Digital Arrest & Extortion", "Threatening calls or video calls posing as Police, CBI, ED, Customs, or TRAI demanding bail/settlement money.", "ShieldAlert", 7),
        ("online_shopping", "Online Shopping & Delivery Fraud", "Fake e-commerce websites, counterfeit products, advance fee courier scams, and non-delivery of goods.", "ShoppingBag", 8),
        ("digital_extortion", "Loan App & Sextortion", "Blackmail using morphed photos, illegal loan apps accessing contact lists, and ransomware threats.", "Lock", 9),
    ]

    cat_map: dict[str, FraudCategory] = {}
    for code, name, desc, icon, sort_order in categories_data:
        cat = FraudCategory(
            id=str(uuid.uuid4()),
            code=code,
            name=name,
            description=desc,
            icon=icon,
            sort_order=sort_order,
            is_active=True,
        )
        db.add(cat)
        cat_map[code] = cat
    db.commit()

    # 2. Official Contacts
    contacts_data = [
        ("National Cyber Crime Helpline", "helpline", "1930", "https://cybercrime.gov.in/", "Dedicated 24/7 financial cyber fraud reporting helpline for immediate freezing of stolen funds.", "MHA / I4C", "I4C Government Portal"),
        ("National Cyber Crime Reporting Portal", "portal", None, "https://cybercrime.gov.in/", "Official Government of India portal for filing formal complaints regarding all cybercrimes.", "Ministry of Home Affairs", "cybercrime.gov.in"),
        ("Emergency Response Support System (ERSS)", "emergency", "112", "https://112.gov.in/", "All-India emergency number for immediate physical threats, danger, or severe extortion.", "MHA", "112.gov.in"),
        ("Reserve Bank of India (CMS)", "regulator", "14440", "https://cms.rbi.org.in/", "RBI Complaint Management System for unresolved banking and payment complaints.", "RBI", "rbi.org.in"),
        ("Chakshu - Sanchar Saathi", "portal", None, "https://sancharsaathi.gov.in/", "Department of Telecommunications portal for reporting suspected fraud communications received via SMS/Call/WhatsApp.", "DoT", "sancharsaathi.gov.in"),
    ]

    for name, ctype, phone, url, desc, ver_by, src_url in contacts_data:
        contact = OfficialContact(
            id=str(uuid.uuid4()),
            name=name,
            type=ctype,
            phone=phone,
            url=url,
            description=desc,
            source_url=src_url,
            verified_by=ver_by,
            verified_at=datetime.now(timezone.utc),
            is_active=True,
        )
        db.add(contact)
    db.commit()

    # 3. Action Guides (Steps)
    guides = {
        "upi_fraud": [
            (1, "Call 1930 Immediately", "Call the National Cyber Crime Helpline (1930) within the first golden hours. Report the transaction UTR number, your bank name, debit time, and recipient UPI ID. 1930 coordinates with the Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS) to freeze the recipient account.", "urgent_call", True),
            (2, "Contact Your Bank & Payment App", "Notify your bank's 24/7 fraud helpline and the UPI app (GPay/PhonePe/Paytm). Request them to flag the transaction, block the affected UPI handle if compromised, and get an official dispute reference ID.", "bank_dispute", True),
            (3, "File Complaint on cybercrime.gov.in", "Register a formal cyber financial fraud complaint online at https://cybercrime.gov.in. Upload bank statements highlighting the transaction and screenshots of payment confirmation.", "portal_report", True),
            (4, "Preserve Transaction Evidence", "Take complete screenshots of the transaction receipt showing the 12-digit UTR, date/time, recipient VPA, and any deceptive SMS/chat that prompted the transfer.", "evidence_preservation", False),
            (5, "DO NOT Enter UPI PIN to 'Receive' Refunds", "Remember: You NEVER need to enter your UPI PIN to receive money or get a refund. Entering a PIN always debits money from your account.", "caution", False),
        ],
        "digital_arrest": [
            (1, "Recognize the Scam — Disconnect the Call", "NO police officer, CBI official, ED investigator, customs officer, or judge conducts judicial proceedings or arrests via Skype, WhatsApp, or video calls. 'Digital Arrest' is completely fictitious and illegal.", "urgent_action", True),
            (2, "DO NOT Transfer 'Verification' or 'Bail' Money", "Scammers falsely claim you must deposit funds to a 'government safety account' or 'RBI verification account' to prove innocence. The government never asks citizens to transfer money to prove innocence.", "caution", True),
            (3, "Call 1930 or 112 Immediately", "If you were intimidated into sending money, immediately call 1930. If you feel in immediate physical danger, call 112.", "urgent_call", True),
            (4, "Report Suspected Numbers on Chakshu", "Report the caller's phone number and WhatsApp profile on the Department of Telecommunications Chakshu portal (sancharsaathi.gov.in).", "portal_report", False),
            (5, "Preserve Call Logs and Threat Messages", "Save screenshots of the incoming numbers, threatening messages, fake court notices or arrest warrants sent to you.", "evidence_preservation", False),
        ],
        "email_phishing": [
            (1, "Do Not Click Further Links or Open Attachments", "Isolate the email. Do not click links, submit credentials, or run any attached files (e.g. .exe, .zip, .html, .docm).", "caution", True),
            (2, "Change Compromised Credentials", "If you entered passwords or banking credentials, immediately change passwords from a separate, trusted device and revoke active sessions.", "security_action", True),
            (3, "Preserve Original EML / Headers", "Export the complete email as an .eml file or copy the full internet headers (including Authentication-Results, Received-SPF, and Return-Path).", "evidence_preservation", False),
            (4, "Notify Your Bank or IT Security Team", "If banking information was exposed, contact your bank immediately to block affected cards/netbanking. If corporate email, alert your IT security department.", "contact_bank", True),
            (5, "Report Phishing to CERT-In and Provider", "Forward phishing emails to CERT-In (incident@cert-in.org.in) and use the email provider's 'Report Phishing' feature.", "portal_report", False),
        ],
        "banking_fraud": [
            (1, "Call 1930 & Bank Fraud Desk Immediately", "Report unauthorized netbanking debits to 1930 instantly. Call your bank's emergency phone banking to block your netbanking user ID and debit cards.", "urgent_call", True),
            (2, "File Official Dispute with Bank", "Visit your home branch or log an official written dispute within 3 working days. Under RBI circular on limiting customer liability in unauthorized electronic transactions, zero liability applies if reported promptly without negligence.", "bank_dispute", True),
            (3, "Register on cybercrime.gov.in", "Lodge an online complaint on the National Cyber Crime Reporting Portal under 'Financial Fraud'.", "portal_report", True),
            (4, "Preserve Bank SMS Alerts and Statements", "Do not delete SMS alerts received from the bank. Download an official PDF statement from your netbanking showing the unauthorized debits.", "evidence_preservation", False),
        ],
    }

    for cat_code, steps in guides.items():
        if cat_code in cat_map:
            cat_id = cat_map[cat_code].id
            for order, title, desc, atype, crit in steps:
                ag = ActionGuide(
                    id=str(uuid.uuid4()),
                    category_id=cat_id,
                    step_order=order,
                    title=title,
                    description=desc,
                    action_type=atype,
                    is_critical=crit,
                )
                db.add(ag)
    db.commit()

    # 4. Evidence Checklists
    checklists = {
        "upi_fraud": [
            ("Bank Statement", "Official statement reflecting debit, timestamp, and amount", "Download PDF statement from netbanking or bank app", True, 1),
            ("Transaction UTR", "12-digit Unique Transaction Reference number", "Found in UPI app transaction receipt details", True, 2),
            ("Payment Receipt Screenshot", "Full screen capture of UPI app confirmation screen", "Ensure timestamp and recipient UPI VPA are clearly visible", True, 3),
            ("Chat / Communication Records", "Screenshots of chat or message demanding payment", "Preserve phone numbers and usernames", False, 4),
        ],
        "digital_arrest": [
            ("Caller Phone Numbers", "Records of phone numbers or WhatsApp calls received", "Export call log or take screenshots", True, 1),
            ("Fake Documents / Warrants", "Images of fake letters, CBI notices, or court warrants sent by scammers", "Preserve original image files without cropping", True, 2),
            ("Payment Transfer Receipts", "Bank statements or UPI receipts if funds were coerced", "Include UTR and recipient account details", True, 3),
        ],
        "email_phishing": [
            ("Original EML File", "Raw RFC 822 email file with complete headers", "In Outlook/Gmail: More -> Download message / Show original", True, 1),
            ("Phishing URL Screenshot", "Screenshot of fake web portal, including browser address bar", "Do not enter test credentials", False, 2),
        ],
    }

    for cat_code, items in checklists.items():
        if cat_code in cat_map:
            cat_id = cat_map[cat_code].id
            for etype, desc, inst, req, order in items:
                ec = EvidenceChecklist(
                    id=str(uuid.uuid4()),
                    category_id=cat_id,
                    evidence_type=etype,
                    description=desc,
                    instructions=inst,
                    is_required=req,
                    sort_order=order,
                )
                db.add(ec)
    db.commit()

    # 5. Articles
    articles_data = [
        ("upi_fraud", "Understanding Golden Hours in Cyber Financial Fraud", "When money is lost in an unauthorized electronic fund transfer or UPI scam, the first 2 to 4 hours are known as the 'Golden Hours'. Calling 1930 during this window allows law enforcement and banks through the CFCFRMS platform to intervene before the cyber fraudsters can withdraw or layer the funds through mule accounts.", "https://cybercrime.gov.in/"),
        ("digital_arrest", "What You Need to Know About 'Digital Arrest' Scams", "Indian law does not recognize 'Digital Arrest'. Genuine law enforcement agencies (Police, CBI, ED, NIA, Income Tax) never place citizens under arrest via video conference or demand online money transfers for security deposits. If you receive such a call, disconnect immediately and report it on 1930 and the Chakshu portal.", "https://sancharsaathi.gov.in/"),
        ("email_phishing", "How to Spot Lookalike Email Domains in Financial Phishing", "Attackers register typo-squatted domains that mimic real institutions (e.g. sbi-alerts.xyz instead of sbi.co.in). Always verify the domain suffix after the @ symbol, check the Reply-To address, and remember that banks never ask you to verify internet banking passwords via email links.", "https://www.rbi.org.in/"),
    ]

    for cat_code, title, content, src in articles_data:
        if cat_code in cat_map:
            art = HelpArticle(
                id=str(uuid.uuid4()),
                category_id=cat_map[cat_code].id,
                title=title,
                content=content,
                source_url=src,
                reviewer="CyberShield Legal & Investigation Intelligence Team",
                review_date=datetime.now(timezone.utc),
                is_published=True,
            )
            db.add(art)
    db.commit()


def get_categories(db: Session) -> list[FraudCategory]:
    return list(db.scalars(select(FraudCategory).where(FraudCategory.is_active == True).order_by(FraudCategory.sort_order)).all())


def get_action_guide(db: Session, category_code: str) -> list[ActionGuide]:
    cat = db.scalar(select(FraudCategory).where(FraudCategory.code == category_code))
    if not cat:
        return []
    return list(db.scalars(select(ActionGuide).where(ActionGuide.category_id == cat.id).order_by(ActionGuide.step_order)).all())


def get_official_contacts(db: Session) -> list[OfficialContact]:
    return list(db.scalars(select(OfficialContact).where(OfficialContact.is_active == True)).all())


def get_checklist(db: Session, category_code: str) -> list[EvidenceChecklist]:
    cat = db.scalar(select(FraudCategory).where(FraudCategory.code == category_code))
    if not cat:
        return []
    return list(db.scalars(select(EvidenceChecklist).where(EvidenceChecklist.category_id == cat.id).order_by(EvidenceChecklist.sort_order)).all())


def get_articles(db: Session, category_code: str | None = None) -> list[HelpArticle]:
    query = select(HelpArticle).where(HelpArticle.is_published == True)
    if category_code:
        cat = db.scalar(select(FraudCategory).where(FraudCategory.code == category_code))
        if cat:
            query = query.where(HelpArticle.category_id == cat.id)
    return list(db.scalars(query).all())


def answer_assistant_query(db: Session, question: str, category: str | None = None) -> AssistantQueryResponse:
    q_lower = question.lower()

    # Priority 1: Check for financial loss emergency
    if any(k in q_lower for k in ["lost", "transferred", "debited", "scammed", "stolen", "sent money", "unauthorized transfer", "rupees", "fraud"]):
        return AssistantQueryResponse(
            answer=(
                "🚨 CRITICAL EMERGENCY ACTION REQUIRED:\n\n"
                "1. Immediately call the National Cyber Crime Helpline at 1930 to report the unauthorized financial transaction. Have your transaction UTR, bank account number, and debit time ready.\n"
                "2. Call your bank's 24/7 fraud helpline immediately and request them to freeze the transaction or block your account/card.\n"
                "3. Register your complaint online at https://cybercrime.gov.in.\n\n"
                "Acting within the 'Golden Hours' drastically increases the chance of law enforcement freezing the funds in the recipient account."
            ),
            sources=["National Cyber Crime Helpline 1930", "https://cybercrime.gov.in/"],
            emergency_guidance=True,
        )

    # Priority 2: Check for Digital Arrest intimidation
    if any(k in q_lower for k in ["digital arrest", "police call", "cbi", "ed video call", "customs parcel", "arrest warrant", "money laundering"]):
        return AssistantQueryResponse(
            answer=(
                "⚠️ CRITICAL: 'Digital Arrest' is completely fake and illegal.\n\n"
                "- Genuine police, CBI, ED, or court authorities NEVER interrogate, arrest, or hold trials over Skype, WhatsApp, or video calls.\n"
                "- Government agencies will NEVER ask you to transfer money to a 'clearing account', 'RBI verification account', or 'bail fund'.\n"
                "- Disconnect the call immediately. Do NOT send any funds. Call 1930 or report on Chakshu (sancharsaathi.gov.in)."
            ),
            sources=["Ministry of Home Affairs Advisory on Digital Arrest", "Chakshu Portal (sancharsaathi.gov.in)"],
            emergency_guidance=True,
        )

    # Priority 3: Check for UPI PIN misunderstanding
    if "pin" in q_lower and any(k in q_lower for k in ["receive", "refund", "claim", "accept"]):
        return AssistantQueryResponse(
            answer=(
                "⚠️ IMPORTANT SAFETY RULE: You NEVER need to enter your UPI PIN to receive money or get a refund.\n\n"
                "Entering a UPI PIN is exclusively used to authorize deductions from your own account. If someone asks you to enter your PIN or scan a QR code to receive a refund, prize, or payment, it is an active scam attempt."
            ),
            sources=["NPCI UPI Safety Guidelines", "Reserve Bank of India"],
            emergency_guidance=False,
        )

    # General Knowledge Retrieval from Articles
    articles = get_articles(db, category)
    matched_articles = []
    for art in articles:
        words = set(re.findall(r"\w+", q_lower))
        art_words = set(re.findall(r"\w+", (art.title + " " + art.content).lower()))
        common = words.intersection(art_words)
        if len(common) >= 2:
            matched_articles.append((art, len(common)))

    matched_articles.sort(key=lambda x: x[1], reverse=True)

    if matched_articles:
        top_art = matched_articles[0][0]
        return AssistantQueryResponse(
            answer=f"**{top_art.title}**\n\n{top_art.content}\n\n*Reviewer:* {top_art.reviewer or 'CyberShield Intelligence Team'}",
            sources=[top_art.source_url] if top_art.source_url else ["CyberShield Verified Knowledge Base"],
            emergency_guidance=False,
        )

    return AssistantQueryResponse(
        answer=(
            "If you suspect cyber fraud or have experienced an incident:\n\n"
            "- For unauthorized money loss: Call 1930 immediately.\n"
            "- For official complaint filing: Visit https://cybercrime.gov.in.\n"
            "- For suspected deceptive calls/SMS: Report on Chakshu (sancharsaathi.gov.in).\n"
            "- For life-threatening emergencies or severe extortion: Call 112."
        ),
        sources=["https://cybercrime.gov.in/", "Helpline 1930"],
        emergency_guidance=False,
    )
