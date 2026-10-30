# CyberShield

**Cyber Fraud Analysis and Victim Assistance Platform**

> ⚠️ **Important**: CyberShield is a prototype analysis and assistance tool. It is **not** an official government platform, law enforcement system, or replacement for the [National Cyber Crime Reporting Portal](https://cybercrime.gov.in/).

---

## Emergency Help

If you have lost money to cyber fraud:
- **Call 1930** — Indian Cyber Financial Fraud Helpline
- **Report at**: https://cybercrime.gov.in/
- **Physical emergency**: Call **112**

---

## Project Overview

CyberShield is a web-based cyber-fraud analysis and victim-assistance platform with four modules:

| Module | Purpose |
|--------|---------|
| UPI Transaction Fraud Detection | Analyze UPI transaction patterns for suspicious indicators |
| Message Fraud Detection | Detect smishing, banking impersonation, OTP theft in messages |
| Email Fraud Detection | Analyze phishing, BEC, credential theft in emails |
| Fraud Victim Help Centre | Guide victims on immediate actions, evidence preservation, and reporting |

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (Swiss ERP design system) |
| Backend | Python FastAPI |
| Database | SQLite (development) / PostgreSQL (production) |
| ML | scikit-learn, pandas |
| Graph | NetworkX |
| PDF | ReportLab |

## Project Structure

```
cybershield/
├── frontend/          # React + TypeScript frontend
│   └── src/
│       ├── pages/     # Page components
│       ├── components/ # Shared UI components
│       └── lib/       # API client, auth context
├── backend/           # FastAPI backend
│   ├── routes/        # API route handlers
│   ├── services/      # Business logic
│   ├── models/        # SQLAlchemy models
│   └── schemas/       # Pydantic schemas
├── ml/                # ML datasets and training
│   ├── datasets/      # Synthetic training data
│   ├── training/      # Training scripts
│   └── model_registry/ # Saved model artifacts
└── documentation/     # Project documentation
```

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
cp .env.example .env
python seed_data.py          # Seed the database
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                  # Starts on http://localhost:5173
```

### Default Admin Account

- **Email**: admin@cybershield.local
- **Password**: CyberShield@2024
- **Role**: Administrator

> Change the default password immediately in any deployment.

## Development Roadmap

| Sprint | Deliverables | Status |
|--------|-------------|--------|
| 1 | Repository, React shell, FastAPI, SQLite | ✅ Complete |
| 2 | Help Centre emergency info and guides | ✅ Complete |
| 3 | UPI manual input, CSV, rule engine | ✅ Complete |
| 4 | Message scanner, NLP baseline | ✅ Complete |
| 5 | Email parser, header analysis | ✅ Complete |
| 6 | PDF reports, incident workspace | ✅ Complete |
| 7 | Admin content management | ✅ Complete |
| 8 | Graph visualization, cross-module linking | 🔄 In Progress |
| 9 | RAG assistant | 📋 Planned |
| 10 | Security hardening, deployment | 📋 Planned |

## Key Limitations

- A UTR alone does not verify fraud or access private bank records
- Anomaly detection results are not proof of fraud
- SPF/DKIM/DMARC passing does not guarantee an email is benign
- Public datasets ≠ real UPI or Indian banking data
- CyberShield **cannot** freeze accounts, recover funds, or file official complaints
- All AI/ML outputs require human review

## Official Resources

- **National Cyber Crime Portal**: https://cybercrime.gov.in/
- **Cyber Financial Fraud Helpline**: 1930
- **Emergency**: 112

## License

This is a student prototype project. Not for production use without proper security review, authorized data, and compliance assessment.

---

*Last updated: October 2026*

