"""
CyberShield Backend Integration Tests
Tests all 4 modules, auth, and incident linking directly against endpoints & services.
"""

import sys
sys.path.insert(0, ".")

from database import SessionLocal
from models.shared import User
from routes import auth, help_routes, incidents
from schemas.shared import UserLogin, IncidentCreate, IncidentLinkCreate
from schemas.help_schema import AssistantQueryRequest
from services.upi_service import analyze_transactions
from services.message_service import analyze_message
from services.email_service import analyze_email_manual
from services.report_service import generate_upi_pdf, generate_message_pdf, generate_email_pdf, generate_incident_pdf


def test_help_categories_and_contacts():
    db = SessionLocal()
    try:
        cats = help_routes.list_categories(db)
        assert len(cats.data) >= 8, f"Expected >= 8 categories, got {len(cats.data)}"
        assert any(c.code == "upi_fraud" for c in cats.data)

        contacts = help_routes.list_contacts(db)
        assert len(contacts.data) >= 4, f"Expected >= 4 contacts, got {len(contacts.data)}"
        assert any("1930" in str(c.phone) for c in contacts.data)
        print("[PASS] test_help_categories_and_contacts")
    finally:
        db.close()


def test_help_assistant_emergency():
    db = SessionLocal()
    try:
        req = AssistantQueryRequest(question="I just lost 50000 rupees in a UPI scam")
        ans = help_routes.query_assistant(req, db)
        assert ans.data.emergency_guidance is True
        assert "1930" in ans.data.answer
        print("[PASS] test_help_assistant_emergency")
    finally:
        db.close()


def test_upi_analysis_rule_velocity():
    txs = [
        {
            "transaction_ref": f"TXN_{i}",
            "amount": 10000,
            "timestamp": f"2024-10-15T10:0{i}:00Z",
            "status": "SUCCESS",
            "direction": "SENT",
            "sender_upi": "victim@okhdfc",
            "recipient_upi": f"mule_{i}@ybl",
        }
        for i in range(6)
    ]
    raw_res = analyze_transactions(txs, analysis_run_id="test_run_velocity")
    indicators = raw_res.get("indicators", [])
    assert len(indicators) > 0
    assert any("VELOCITY" in ind["code"] or "BURST" in ind["code"] or "ONE_TO_MANY" in ind["code"] for ind in indicators)
    print("[PASS] test_upi_analysis_rule_velocity")


def test_message_analysis_smishing():
    res = analyze_message(
        "Dear Customer, Your SBI account is blocked due to pending KYC. Update at http://sbi-kyc.xyz or call 9876543210 immediately.",
        source_app="SMS",
    )
    assert res.overall_assessment in ["high_risk", "medium_risk"]
    assert len(res.urls) > 0
    assert res.urls[0].defanged_url == "hxxp://sbi-kyc[.]xyz"
    print("[PASS] test_message_analysis_smishing")


def test_email_manual_analysis_lookalike():
    res = analyze_email_manual(
        from_address="security@sbi-alerts.xyz",
        reply_to="attacker@fake-mail.com",
        subject="Urgent account suspension notice",
        body="Your bank account has been flagged. Update your password now at http://sbi-update.xyz.",
        claimed_org="State Bank of India",
        analysis_run_id="test_email_lookalike",
    )
    assert res.overall_assessment in ["high_risk", "medium_risk"]
    assert res.sender_analysis.reply_to_mismatch is True
    print("[PASS] test_email_manual_analysis_lookalike")


def test_auth_and_incident_flow():
    db = SessionLocal()
    try:
        # 1. Login as admin
        login_req = UserLogin(email="admin@cybershield.local", password="CyberShield@2024")
        token_resp = auth.login(login_req, db)
        admin_user = db.get(User, token_resp.data.user.id)
        assert admin_user is not None
        assert token_resp.data.user.role == "admin"

        # 2. Create Incident
        inc_payload = IncidentCreate(
            title="Test Incident Dossier",
            incident_type="UPI Financial Fraud",
            narrative="Detailed narrative of victim financial loss",
        )
        inc_resp = incidents.create_incident(inc_payload, admin_user, db)
        inc_id = inc_resp.data.id

        # 3. Link Analysis Run
        link_payload = IncidentLinkCreate(
            analysis_run_id="test_run_12345",
            module_type="upi",
            consent_given=True,
        )
        link_resp = incidents.link_analysis_to_incident(inc_id, link_payload, admin_user, db)
        assert link_resp.data.module_type == "upi"

        # 4. Get Incident
        get_res = incidents.get_incident(inc_id, admin_user, db)
        assert get_res.data.title == "Test Incident Dossier"

        # 5. Delete Incident
        del_res = incidents.delete_incident(inc_id, admin_user, db)
        assert del_res.data is not None
        print("[PASS] test_auth_and_incident_flow")
    finally:
        db.close()


def test_pdf_reports():
    # 1. UPI PDF
    pdf1 = generate_upi_pdf(
        analysis_id="test-upi-1",
        indicators=[{"code": "RULE_VELOCITY", "type": "velocity", "severity": "high", "explanation": "High velocity", "evidence_reference": "TXN_1", "method": "rule"}],
        transactions=[{"amount": 5000, "timestamp": "2024-01-01T12:00:00", "status": "SUCCESS", "direction": "SENT", "sender_upi": "a@upi", "recipient_upi": "b@upi"}],
    )
    assert len(pdf1) > 1000

    # 2. Message PDF
    pdf2 = generate_message_pdf(
        analysis_id="test-msg-1",
        data={
            "analysis_run_id": "test-msg-1",
            "overall_assessment": "high_risk",
            "indicators": [],
            "entities": [],
            "urls": [],
            "categories": [],
            "limitations": [],
        },
    )
    assert len(pdf2) > 1000

    # 3. Email PDF
    pdf3 = generate_email_pdf(
        analysis_id="test-email-1",
        data={
            "analysis_run_id": "test-email-1",
            "overall_assessment": "high_risk",
            "sender_analysis": {},
            "auth_results": {},
            "content_indicators": [],
            "urls": [],
            "attachments": [],
            "limitations": [],
        },
    )
    assert len(pdf3) > 1000

    # 4. Incident PDF
    pdf4 = generate_incident_pdf({
        "id": "INC-TEST-01",
        "category": "UPI Fraud",
        "incident_date": "2024-10-15",
        "narrative": "Test summary",
    })
    assert len(pdf4) > 1000
    print("[PASS] test_pdf_reports")


if __name__ == "__main__":
    print("--- Running CyberShield Backend Test Suite ---")
    test_help_categories_and_contacts()
    test_help_assistant_emergency()
    test_upi_analysis_rule_velocity()
    test_message_analysis_smishing()
    test_email_manual_analysis_lookalike()
    test_auth_and_incident_flow()
    test_pdf_reports()
    print("\n==============================================")
    print("ALL TESTS PASSED SUCCESSFULLY (100% GREEN)")
    print("==============================================")
