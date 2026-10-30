# CyberShield — Technical Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CyberShield Platform                          │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   React Frontend (Port 5173)                  │   │
│  │                                                               │   │
│  │  Public Pages     │  Auth Pages    │  ERP Application Shell  │   │
│  │  ─ Home           │  ─ Login       │  ─ Dashboard             │   │
│  │  ─ Help Centre    │  ─ Register    │  ─ UPI Analysis          │   │
│  │  ─ Emergency      │               │  ─ Message Analysis      │   │
│  │  ─ About/Privacy  │               │  ─ Email Analysis        │   │
│  │                   │               │  ─ Incidents             │   │
│  │                   │               │  ─ Admin                 │   │
│  └───────────────────────────────────────────────────────────────┘  │
│                             ↕ HTTP/JSON (API proxy)                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  FastAPI Backend (Port 8000)                   │   │
│  │                                                               │   │
│  │  /api/v1/auth      │  /api/v1/upi       │  /api/v1/messages  │   │
│  │  /api/v1/emails    │  /api/v1/help      │  /api/v1/incidents │   │
│  │  /api/v1/admin     │                    │                    │   │
│  │                                                               │   │
│  │  Services:                                                    │   │
│  │  ─ UPI Service      (rules + IsolationForest + NetworkX)      │   │
│  │  ─ Message Service  (rules + TF-IDF + LogReg)                 │   │
│  │  ─ Email Service    (EML parser + domain checks + classifier) │   │
│  │  ─ Help Service     (articles + contacts + assistant)         │   │
│  │  ─ Report Service   (ReportLab PDF generation)                │   │
│  │  ─ Auth Service     (JWT + bcrypt)                            │   │
│  └───────────────────────────────────────────────────────────────┘  │
│                             ↕ SQLAlchemy ORM                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              SQLite (dev) / PostgreSQL (prod)                  │   │
│  │                                                               │   │
│  │  Shared: users, incidents, analysis_runs, indicators, reports │   │
│  │  UPI: transactions, participants, relationships, alerts        │   │
│  │  Message: messages, entities, urls, analyses                  │   │
│  │  Email: emails, headers, urls, attachments, analyses          │   │
│  │  Help: categories, articles, guides, contacts, checklists     │   │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Module Detection Logic

### Module 1: UPI Transaction Fraud Detection

**Input**: User-provided transaction records (manual or CSV)
**Output**: Indicators with explanations and evidence references

Detection layers (in order):
1. **Rule Engine** — explicit conditions, always shows what fired
   - Velocity check: >5 transactions in 60 minutes
   - Many-to-one: >3 senders → 1 recipient
   - One-to-many: 1 sender → >5 new recipients in 24h
   - Off-hours: transactions between 1 AM and 5 AM
   - Round amounts: multiples of ₹1,000
   - Rapid succession: <5 minutes between transfers
   
2. **Anomaly Detection** — Isolation Forest on feature vectors
   - Features: amount, hour, velocity_1h, is_round, day_of_week
   - Anomaly ≠ fraud; labeled as "unusual pattern"

3. **Graph Analysis** — NetworkX on pseudonymized accounts
   - Hub detection (high-degree nodes)
   - Chain patterns (linear transaction flows)
   - Visualization data for frontend

### Module 2: Message Fraud Detection

**Input**: Pasted text message
**Output**: Category labels + triggered indicators + extracted entities

Processing pipeline:
1. Entity extraction (URLs, phone numbers, amounts, organization names)
2. Rule engine (keyword/pattern matching):
   - Urgency language
   - OTP/PIN request
   - Fake KYC patterns
   - Reward/lottery scam patterns
   - Digital arrest threats
   - Bank impersonation indicators
3. TF-IDF + Logistic Regression classifier
   - 8 categories: banking_impersonation, fake_kyc, otp_theft, upi_scam, reward_scam, digital_arrest, malicious_link, legitimate
   - Trained on synthetic data (NOT calibrated probabilities)

### Module 3: Email Fraud Detection

**Input**: Manual form or .eml file upload
**Output**: Header analysis + content indicators + category classification

EML processing pipeline:
1. Parse with Python `email` package (BytesParser)
2. Extract: from, reply_to, return_path, subject, body (text only)
3. Parse Authentication-Results header (SPF/DKIM/DMARC) with provenance caveat
4. Domain analysis: lookalike detection (rapidfuzz), subdomain analysis
5. URL extraction and defanging (never execute, SSRF-protected)
6. Attachment metadata (extension, MIME, SHA-256) — NEVER executed
7. TF-IDF + LogReg classifier on subject + body
8. Combine into explainable result

**Critical limitations displayed to users**:
- Manual entry cannot verify authentication headers
- DKIM pass ≠ email is safe (attacker domains can authenticate)
- SPF pass ≠ email is safe
- Unknown URL reputation ≠ URL is safe

### Module 4: Fraud Victim Help Centre

**Structure**:
- Emergency guidance (no login required, always visible)
- 9 fraud categories with guided action steps
- Evidence checklists per category
- Incident summary PDF generator
- Keyword-based help assistant (retrieval from reviewed articles)

**Emergency contacts** (always shown):
- **1930** — Cyber Financial Fraud Helpline
- **cybercrime.gov.in** — National Cyber Crime Reporting Portal
- **112** — Emergency (physical danger)

## Database Schema Summary

### Shared Tables
| Table | Purpose |
|-------|---------|
| users | Registered users with roles |
| incidents | User-created incident workspaces |
| incident_links | Links between incidents and analyses |
| evidence_items | References to preserved evidence |
| analysis_runs | Record of each analysis execution |
| analysis_indicators | Individual findings from analysis runs |
| reports | Generated PDF report metadata |
| consent_records | User consent for data linking/sharing |
| audit_logs | Privileged access and change history |

### Module Tables
| Module | Tables |
|--------|--------|
| UPI | transactions, transaction_participants, transaction_relationships, upi_alerts |
| Message | messages, message_entities, message_urls, message_analyses |
| Email | emails, email_headers, email_urls, email_attachments, email_analyses |
| Help | fraud_categories, help_articles, action_guides, official_contacts, evidence_checklists |

## API Conventions

All responses follow this envelope:
```json
{
  "request_id": "uuid-v4",
  "status": "completed | processing | error",
  "data": { ... },
  "errors": []
}
```

Never expose:
- Stack traces
- Internal file paths
- Database error messages
- API keys or secrets

## Security Controls

| Control | Implementation |
|---------|---------------|
| Authentication | JWT tokens (HS256), bcrypt passwords |
| Authorization | Role-based (public/registered/analyst/admin), server-side checks |
| CORS | Restricted to frontend origin |
| Input validation | Pydantic schemas on all endpoints |
| File uploads | Extension + MIME check, size limits, server-side random names |
| XSS prevention | Sanitize all rendered content, never render uploaded HTML |
| SSRF prevention | URL checks restricted to public internet targets |
| SQL injection | SQLAlchemy ORM (parameterized queries) |
| Secrets | Environment variables, never hardcoded or logged |
| Audit | All privileged actions logged with actor, action, timestamp |

## Development Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- npm or pnpm

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: change SECRET_KEY
python seed_data.py
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### ML Model Training (optional)
```bash
cd ml/training
pip install -r ../../backend/requirements.txt
python train_models.py
```

## Important Disclaimers

> These must be preserved in the UI and documentation:

1. CyberShield is a **prototype** and not an official government platform
2. Analysis results are **review-priority indicators**, not proof of fraud
3. A UTR alone does **not** verify fraud or access bank records
4. Anomalies are **not** proof of fraud
5. SPF/DKIM/DMARC passing does **not** guarantee email safety
6. Unknown URL reputation does **not** mean the URL is safe
7. CyberShield **cannot** freeze accounts, recover funds, or file official complaints
8. All ML outputs require **human review**
9. Synthetic training data results do **not** represent real-world accuracy
10. A shared identifier does **not** prove shared offender identity

