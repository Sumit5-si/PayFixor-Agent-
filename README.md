# PayFixor Agent

> **Detect. Diagnose. Recover. Prove.**

PayFixor Agent is an AI-powered payment revenue recovery system for ecommerce businesses. It bridges the gap between raw payment failure telemetry and intelligent, policy-bounded revenue recovery.

---

## 🏛️ Core Architectural Principle

> **"AI reasons. Deterministic code controls."**

| Area | Controlled By | Description |
|---|---|---|
| **Anomaly Detection & Telemetry** | Deterministic Python Engine | Rolling baseline window calculations, segment failure rate calculations, and confidence score calculation. |
| **Safety & Stopping Rules** | Deterministic Policy Engine | Bounded recovery limits, high-value transaction manual review thresholds (≥ ₹10,000), duplicate prevention, stopping rules. |
| **Payment Link Generation** | Deterministic Razorpay Client | Razorpay Test Mode REST API integration. |
| **Payment Verification & Webhooks** | Deterministic Webhook Handler | HMAC-SHA256 signature verification & idempotent deduplication. |
| **Evaluation & Lift** | Deterministic Experiment Engine | Rigorous A/B split (Control vs Treatment), measured money recovered, and incremental lift calculation. |
| **Investigation Evidence** | Structured Data Tools | Multi-dimensional failure rates by bank, method, error code, and timeline. |
| **Root-Cause Hypothesis** | Gemini AI (Diagnosis Agent) | Structured JSON reasoning distinguishing observed data from hypothesis. |
| **Customer Recovery Messaging** | Gemini AI (Recovery Agent) | Contextual, polite, root-cause-aware recovery notification for treatment cohorts. |

---

## 🚀 Complete Product Flow

```
Synthetic / Live Payment Stream
            ↓
Payment Ingestion & Storage (`/api/payments/ingest`)
            ↓
Anomaly Detection Scan (`/api/incidents/scan`)
            ↓
Incident Created (Status: DETECTED)
            ↓
Investigation Agent gathers multi-dimensional evidence
            ↓
Diagnosis Agent (Gemini AI) generates evidence-backed hypothesis
            ↓
Incident Updated (Status: CONFIRMED or INSUFFICIENT_EVIDENCE)
            ↓
Affected Customer Cohort Identified
            ↓
Deterministic Policy Engine evaluates safety & guardrails
            ↓
50/50 Experiment Split:
  • CONTROL: Generic payment reminder
  • TREATMENT: Root-cause-aware recovery message
            ↓
Razorpay Test Mode Payment Link Created
            ↓
Customer Completes Payment via Link
            ↓
Razorpay Webhook Received (`/api/webhooks/razorpay`)
            ↓
Signature Verified & Status Updated (RECOVERED)
            ↓
Experiment Lift & Measured Money Recovered Recalculated
            ↓
Immutable Audit Trail Updated
```

---

## 📁 Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app & CORS setup
│   │   ├── api/
│   │   │   ├── payments.py          # Payment ingestion & synthetic generator
│   │   │   ├── incidents.py         # Incident scanning, status & investigation
│   │   │   ├── recovery.py          # Recovery batches, actions & simulations
│   │   │   ├── analytics.py         # KPIs, agent activity, audit logs & policies
│   │   │   └── webhooks.py          # Razorpay webhook listener
│   │   ├── agents/
│   │   │   ├── investigation_agent.py # Deterministic multi-dimensional evidence tools
│   │   │   ├── diagnosis_agent.py     # Gemini AI root cause reasoning
│   │   │   └── recovery_agent.py      # Bounded strategy & messaging generator
│   │   ├── detection/
│   │   │   ├── anomaly_detector.py  # Anomaly detection & statistical confidence
│   │   │   ├── baseline.py          # Historical baseline calculation
│   │   │   ├── segmentation.py      # Multi-dimensional aggregation
│   │   │   └── revenue_risk.py      # Revenue at risk computation
│   │   ├── policies/
│   │   │   └── guardrails.py        # Safety rules & stopping conditions
│   │   ├── razorpay/
│   │   │   ├── client.py            # Razorpay SDK wrapper & HMAC validator
│   │   │   ├── payment_links.py     # Payment link generation
│   │   │   └── webhooks.py          # Idempotent webhook event processor
│   │   ├── evaluation/
│   │   │   ├── experiments.py       # A/B Control vs Treatment experiment engine
│   │   │   └── metrics.py           # Measured money recovered metrics
│   │   ├── database/
│   │   │   ├── models.py            # SQLAlchemy 2.0 ORM schemas
│   │   │   └── session.py           # Database connection & policy seeder
│   │   ├── services/
│   │   │   ├── incident_service.py  # Incident lifecycle orchestrator
│   │   │   ├── recovery_service.py  # Recovery campaign orchestrator
│   │   │   ├── analytics_service.py # KPI & agent statistics aggregator
│   │   │   └── audit_service.py     # Immutable audit trail
│   │   ├── data/
│   │   │   └── generator.py         # Realistic synthetic payments & failure injector
│   │   ├── schemas/                 # Pydantic v2 schemas
│   │   └── utils/
│   │       └── config.py            # Pydantic Settings & environment variables
│   ├── tests/                       # Comprehensive Pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml
├── .env.example
├── pytest.ini
└── README.md
```

---

## 🛠️ Setup & Running Locally

### 1. Requirements
- Python 3.10+
- (Optional) PostgreSQL & Docker

### 2. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```

### 4. Run Pytest Suite
```bash
python -m pytest backend/tests -v
```

### 5. Run the Backend API Server
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API documentation will be available at: **http://localhost:8000/docs**

---

## 🧪 Verified Test Coverage

The Phase 1 backend includes automated integration tests for:
- ✅ **Synthetic Data Generation & Incident Injection**
- ✅ **Deterministic Anomaly Detection & Statistical Confidence**
- ✅ **Investigation Agent Structured Tool Gathering**
- ✅ **AI Diagnosis Agent with Structured JSON & Confidence Gating**
- ✅ **Policy Guardrail Engine (High-Value Review, Anti-Spam, Stopping Rules)**
- ✅ **A/B Experiment Engine (Control vs Treatment, Relative Lift, Incremental Revenue)**
- ✅ **Razorpay Payment Link Creation & Webhook Signature Verification**
- ✅ **Idempotent Webhook Processing & Revenue Recovery Accounting**
- ✅ **Immutable Audit Trail Integrity**
