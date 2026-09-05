<div align="center">

# 🔧 PayFixor Agent

### *Detect. Diagnose. Recover. Prove.*

**An AI-powered autonomous payment revenue recovery system for Indian e-commerce — built on top of a real Razorpay-integrated store.**

<br/>

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-1.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Razorpay](https://img.shields.io/badge/Razorpay-Test_Mode-02042B?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

> 🏆 **Built for the Razorpay AI Buildathon 2026**

</div>

---

## 📖 What Is This Project?

This repository is **two things working together:**

| Part | What It Is |
|---|---|
| 🛍️ **GharSansar** | A real, production-ready Indian artisan e-commerce store (Next.js 15 + Razorpay) |
| 🤖 **PayFixor Agent** | An AI agent that monitors GharSansar's payment failures and autonomously recovers lost revenue |

**The full story in one line:**  
When a customer's payment fails on GharSansar, PayFixor Agent detects it, uses Gemini AI to figure out *why*, and sends the customer a Razorpay Payment Link — automatically, without any human involvement.

---

## 🧠 Core Design Principle

<div align="center">

> ### `"AI reasons. Deterministic code controls."`

</div>

This is not just a chatbot wrapper. PayFixor has a strict boundary between what AI does and what code does:

| Responsibility | Owner | Why |
|---|---|---|
| Root cause hypothesis | 🤖 Gemini AI | Requires reasoning over messy data |
| Personalized recovery message | 🤖 Gemini AI | Requires natural language generation |
| Anomaly detection & statistics | 🔵 Deterministic Python | Zero tolerance for errors |
| Money calculations & revenue math | 🔵 Deterministic Python | Must be exact, auditable |
| Razorpay API calls & webhook verification | 🔵 Deterministic Python | Security-critical |
| Policy guardrails & stopping rules | 🔵 Deterministic Python | AI cannot override safety |
| A/B experiment engine | 🔵 Deterministic Python | Statistical integrity required |
| Immutable audit trail | 🔵 Deterministic Python | Legal & operational requirement |

---

## 🌊 The Complete Flow

```
GharSansar Customer attempts to pay
            ↓
Payment fails (UPI timeout / Card decline / Bank error)
            ↓
GharSansar → /api/record-failure → PayFixor Agent notified
            ↓
┌─────────────────────────────────────────────────────────┐
│                   PAYFIXOR AGENT                        │
│                                                         │
│  [1] Anomaly Detection Engine (Deterministic)           │
│      → Rolling baseline window calculation              │
│      → Binomial z-score for statistical significance    │
│      → Incident created if failure rate > 2x baseline  │
│            ↓                                            │
│  [2] Investigation Agent (Evidence Gathering)           │
│      → Failure rates by bank, method, error code        │
│      → Hourly time-series trend                         │
│      → Affected customer list + revenue at risk         │
│            ↓                                            │
│  [3] Diagnosis Agent — Gemini AI                        │
│      → Structured JSON root-cause hypothesis            │
│      → Confidence score (0.0 – 1.0)                    │
│      → Recovery strategy recommendation                 │
│            ↓                                            │
│  [4] Policy / Guardrail Engine (Deterministic)          │
│      → ≥ ₹10,000 → flagged for manual review           │
│      → Anti-spam: max 1 message per customer            │
│      → Duplicate prevention & stopping rules            │
│            ↓                                            │
│  [5] Recovery Agent — Gemini AI                         │
│      → 50/50 A/B split:                                 │
│         • CONTROL  → Generic payment reminder           │
│         • TREATMENT → Root-cause-aware AI message       │
│      → Razorpay Payment Link generated (Test Mode)      │
│            ↓                                            │
│  [6] Webhook Handler (Deterministic)                    │
│      → HMAC-SHA256 signature verified                   │
│      → Idempotent deduplication                         │
│      → Status updated: RECOVERED                        │
│            ↓                                            │
│  [7] Experiment Engine (Deterministic)                  │
│      → Control vs Treatment lift calculated             │
│      → Incremental revenue measured                     │
│      → Immutable audit trail updated                    │
└─────────────────────────────────────────────────────────┘
            ↓
Admin Dashboard — real-time view of all recoveries
```

---

## 🛍️ Part 1 — GharSansar (The E-Commerce Store)

> **"Handcrafted Comforts for Your Living Sanctuaries"**  
> A curated Indian artisan store — the real-world context where payment failures happen.

### What GharSansar Is

GharSansar is a minimal, production-grade e-commerce website selling 5 handcrafted Indian home goods:

- 🪔 Brass Diya Set
- 🌿 Terracotta Planter
- 🛋️ Linen Cushion Set
- 🧺 Jute Table Runner
- 🕯️ Spiced Soy Candle

It is built for **zero friction** — no login, no signup, full checkout in under 30 seconds.

### GharSansar Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3.4 (Custom Terracotta palette) |
| UI Components | Lucide React icons |
| Payment Gateway | Razorpay Checkout.js + Node.js SDK |
| Database / CMS | Google Sheets API v4 (Service Account JWT) |
| Cart Persistence | React Context + localStorage |
| Security | Server-side HMAC-SHA256 payment verification |

### GharSansar Features

- ✅ **Guest Checkout** — no account required, order in 30 seconds
- ✅ **Razorpay Integration** — UPI, Credit/Debit Card, Netbanking, Wallets
- ✅ **Google Sheets as Database** — products tab + orders tab, zero hosting cost
- ✅ **Payment Failure Logging** — every failure recorded with exact bank error reason
- ✅ **HMAC-SHA256 Verification** — payment signature cryptographically verified server-side
- ✅ **Dual Mode** — runs in mock sandbox mode (no keys needed) or live Razorpay mode
- ✅ **Cart Persistence** — survives page refresh and browser close via localStorage
- ✅ **Auto-dismiss Modal** — Razorpay modal cleanly dismissed on success and failure
- ✅ **Indian-specific Validation** — 10-digit phone (`^[6-9]\d{9}$`), 6-digit pincode

### GharSansar Data Flow

```
User visits /           → Google Sheets 'Products' tab → rendered on page
User adds to cart       → React CartContext + localStorage
User fills checkout     → Client-side validation (phone, pincode)
User clicks Pay         → /api/create-order → Razorpay order_id
Razorpay modal opens    → Customer pays (card / UPI / netbanking)
Payment SUCCESS         → /api/verify-payment → HMAC verified → Google Sheets 'Orders' tab
Payment FAILURE         → /api/record-failure → failure reason logged → PayFixor notified
```

### Google Sheets Database Schema

**Tab 1 — Products**
| id | name | price | image_url | description | stock | rating | dimensions |

**Tab 2 — Orders** *(+ 3 AI columns added by PayFixor)*
| order_id | razorpay_order_id | razorpay_payment_id | customer_name | phone | address | pincode | product_id | quantity | amount | status | timestamp | **ai_diagnosis** | **recovery_link** | **recovery_status** |

---

## 🤖 Part 2 — PayFixor Agent (The AI Recovery System)

### Architecture Overview

```
backend/
└── app/
    ├── agents/
    │   ├── investigation_agent.py   # Detective: gathers multi-dimensional evidence
    │   ├── diagnosis_agent.py       # Doctor: Gemini AI root-cause reasoning
    │   └── recovery_agent.py        # Communicator: personalized message + Razorpay link
    ├── detection/
    │   ├── anomaly_detector.py      # Alarm: detects failure spikes statistically
    │   ├── baseline.py              # Normal: calculates 7-day historical baseline
    │   ├── segmentation.py          # Sorter: breaks down failures by bank/method/error
    │   └── revenue_risk.py          # Calculator: how much money is at risk?
    ├── policies/
    │   └── guardrails.py            # Rulebook: safety checks before every action
    ├── razorpay/
    │   ├── client.py                # Connector: Razorpay SDK wrapper
    │   ├── payment_links.py         # Link maker: generates recovery payment links
    │   └── webhooks.py              # Listener: idempotent webhook processor
    ├── evaluation/
    │   ├── experiments.py           # Scientist: 50/50 A/B experiment engine
    │   └── metrics.py               # Scorecard: revenue recovered + lift calculation
    ├── services/
    │   ├── incident_service.py      # Orchestrator: full incident lifecycle
    │   ├── recovery_service.py      # Orchestrator: full recovery campaign lifecycle
    │   ├── analytics_service.py     # Reporter: KPIs and agent statistics
    │   └── audit_service.py         # Recorder: immutable audit trail
    ├── api/
    │   ├── payments.py              # API: payment ingestion & synthetic generator
    │   ├── incidents.py             # API: incident scan, status, investigation
    │   ├── recovery.py              # API: recovery batches, actions, simulations
    │   ├── analytics.py             # API: KPIs, agent activity, audit logs, policies
    │   └── webhooks.py              # API: Razorpay webhook listener
    └── database/
        ├── models.py                # Schema: SQLAlchemy 2.0 ORM
        └── session.py               # Connection: async DB + policy seeder
```

### The Three AI Agents

#### 🔍 Agent 1 — Investigation Agent (Evidence Gatherer)
Collects hard evidence *before* any AI reasoning happens.
- Failure rates broken down by bank, payment method, and error code
- Hourly time-series trend (when did it start?)
- Comparison against other banks (is it isolated or widespread?)
- Affected customer list with contact details
- Revenue at risk calculation in INR

#### 🧠 Agent 2 — Diagnosis Agent (Gemini AI)
Takes the evidence bundle and produces a structured diagnosis.
- Sends evidence to Gemini 1.5 Flash in **structured JSON mode**
- Returns: root cause hypothesis, confidence score, affected segment
- Falls back to deterministic logic if Gemini is unavailable
- Incident status updated: `DETECTED` → `CONFIRMED` or `INSUFFICIENT_EVIDENCE`

#### 💬 Agent 3 — Recovery Agent (Gemini AI)
Generates the customer recovery communication.
- **TREATMENT** group: AI-written, root-cause-aware, bank-specific message
- **CONTROL** group: Generic payment retry reminder
- Razorpay Payment Link embedded in every message
- No fake discounts, no misleading claims — guardrails enforced

### Policy Guardrail Engine

Every recovery action passes through a mandatory policy check:

| Rule | Action |
|---|---|
| Transaction ≥ ₹10,000 | → `HUMAN_REVIEW` (not automated) |
| Customer already messaged | → `REJECTED` (anti-spam) |
| Incident already resolved | → `STOPPED` |
| Customer marked high-risk | → `HUMAN_REVIEW` |
| All checks pass | → `APPROVED` |

### A/B Experiment Engine

The system proves its own value:

```
Affected Customers
      ↓
  Random 50/50 Split
      ↙         ↘
CONTROL       TREATMENT
Generic msg   AI root-cause msg
      ↓             ↓
Recovery %    Recovery %
      ↓             ↓
  Fisher's Exact Test
      ↓
Incremental Revenue = (Treatment - Control) × avg_order_value
```

---

## 🛠️ Tech Stack

### PayFixor Agent Backend

| Layer | Technology | Version |
|---|---|---|
| API Framework | FastAPI | 0.110+ |
| Language | Python | 3.11+ |
| ORM | SQLAlchemy (async) | 2.0+ |
| Database | SQLite (demo) / PostgreSQL (prod) | — |
| AI | Google Gemini 1.5 Flash | Structured JSON mode |
| Payments | Razorpay Python SDK + REST API | 1.4+ |
| Validation | Pydantic v2 | 2.6+ |
| Testing | Pytest + pytest-asyncio + httpx | 8.1+ |
| Containerization | Docker + docker-compose | — |
| Security | HMAC-SHA256 webhook verification | — |

### GharSansar Frontend

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | 3.4 |
| Icons | Lucide React | 0.475 |
| Payment | Razorpay Checkout.js | Latest |
| Database | Google Sheets API v4 | googleapis v178 |

---

## 🗺️ Production Upgrade Path

| What | Demo (Now) | Production (Future) |
|---|---|---|
| Database | SQLite | PostgreSQL + Redis Cache |
| Frontend | Vanilla HTML/JS admin | React 18 + Vite + Tailwind |
| Job Queue | Synchronous | Celery + Redis (async) |
| Scaling | Single server | Kubernetes / Cloud Run |
| Auth | None | JWT + Role-Based Access Control |
| Secrets | .env file | AWS Secrets Manager / Vault |
| Monitoring | Logs | Prometheus + Grafana |
| Recovery Channels | Simulated | Real Email / WhatsApp / SMS |
| AI Model | Gemini Flash | Gemini Pro / Fine-tuned |
| Audit Logs | SQLite table | Immutable S3 log store |

---

## ✅ Test Coverage

```bash
python -m pytest backend/tests -v
```

| Test Category | Status |
|---|---|
| Synthetic Data Generation & Failure Injection | ✅ Passing |
| Deterministic Anomaly Detection & Statistical Confidence | ✅ Passing |
| Investigation Agent Structured Evidence Gathering | ✅ Passing |
| Diagnosis Agent — Gemini AI Structured JSON & Confidence Gating | ✅ Passing |
| Policy Guardrail Engine (High-Value, Anti-Spam, Stopping Rules) | ✅ Passing |
| A/B Experiment Engine (Control vs Treatment, Lift, Incremental Revenue) | ✅ Passing |
| Razorpay Payment Link Creation | ✅ Passing |
| Webhook HMAC-SHA256 Signature Verification | ✅ Passing |
| Idempotent Webhook Processing & Revenue Accounting | ✅ Passing |
| Immutable Audit Trail Integrity | ✅ Passing |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ (for GharSansar)
- Docker (optional)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/payfixor-agent.git
cd payfixor-agent
```

### 2. Set Up Environment Variables

```bash
cp .env.example backend/.env
```

Open `backend/.env` and fill in:

```env
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Razorpay (Test Mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Database
DATABASE_URL=sqlite+aiosqlite:///./payfixor.db

# Detection Thresholds
MIN_ANOMALY_RATIO=0.15
MIN_SAMPLE_SIZE=10
```

### 3. Install Backend Dependencies

```bash
pip install -r backend/requirements.txt
```

### 4. Run the Backend Server

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Open the Admin Dashboard

```
http://localhost:8000/dashboard
```

### 6. Run with Docker (Alternative)

```bash
docker-compose up --build
```

---

## 🧪 Run the Test Suite

```bash
python -m pytest backend/tests -v
```

---

## 📡 Key API Endpoints

| Method | Endpoint | What It Does |
|---|---|---|
| `POST` | `/api/payments/ingest` | Ingest a payment event |
| `POST` | `/api/payments/generate-synthetic` | Generate synthetic test payments |
| `POST` | `/api/incidents/scan` | Run anomaly detection scan |
| `GET` | `/api/incidents` | List all incidents |
| `POST` | `/api/incidents/{id}/investigate` | Run investigation agent |
| `POST` | `/api/recovery/batches` | Create a recovery campaign |
| `GET` | `/api/analytics/kpis` | Get revenue recovery KPIs |
| `GET` | `/api/analytics/audit-log` | View the full audit trail |
| `POST` | `/api/webhooks/razorpay` | Razorpay webhook endpoint |

**Interactive API docs:** `http://localhost:8000/docs`

---

## 🔐 Security Highlights

- **No AI touches money** — all financial operations are deterministic code
- **HMAC-SHA256 webhook verification** — fake webhooks are rejected at the door
- **Idempotent webhook processing** — same event can never be processed twice
- **Policy guardrails** — high-value transactions always go to human review
- **Immutable audit trail** — every agent action is permanently logged
- **Pydantic v2 validation** — all inputs validated before any processing

---

## 📊 How PayFixor Proves Its Own Value

The built-in A/B experiment engine answers the question every business asks:

> *"Did the AI actually help, or would customers have paid anyway?"*

- **Control group** gets a generic "your payment failed, try again" message
- **Treatment group** gets a Gemini AI-written, root-cause-specific message
- The system tracks recovery rates for both groups and calculates:
  - **Relative lift** (Treatment % vs Control %)
  - **Incremental revenue** (extra money recovered because of AI)
  - **Statistical significance** (Fisher's exact test)

---

## 🗂️ Repository Structure

```
payfixor-agent/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry point
│   │   ├── api/                     # HTTP route handlers
│   │   ├── agents/                  # The three AI + evidence agents
│   │   ├── detection/               # Anomaly detection engine
│   │   ├── policies/                # Guardrail & safety engine
│   │   ├── razorpay/                # Razorpay SDK integration
│   │   ├── evaluation/              # A/B experiment engine
│   │   ├── services/                # Business logic orchestrators
│   │   ├── database/                # ORM models & async session
│   │   ├── schemas/                 # Pydantic v2 request/response models
│   │   └── utils/                   # Config & environment settings
│   ├── tests/                       # Full Pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── index.html                   # Admin dashboard
│   ├── css/                         # Dashboard styles
│   └── js/                          # Dashboard logic
├── docker-compose.yml
├── .env.example
├── pytest.ini
└── README.md
```

---

## 🤔 FAQ

**Q: Is GharSansar a separate project?**  
A: GharSansar is the e-commerce store that generates the real payment data. PayFixor is the agent that monitors and recovers from failures on that store. They are designed to work together.

**Q: Does this use real money?**  
A: No. The Razorpay integration runs in Test Mode. No real transactions happen.

**Q: What happens if Gemini AI is unavailable?**  
A: The Diagnosis Agent has a deterministic fallback. The system continues to detect and recover payments using rule-based logic even without the AI.

**Q: Can this work with any e-commerce store?**  
A: Yes. Any store that calls `/api/payments/ingest` when a payment fails can use PayFixor. The GharSansar integration is a reference implementation.

**Q: Why not just retry the payment automatically?**  
A: Automatic retries without understanding the root cause have low success rates and can trigger fraud flags. PayFixor diagnoses *why* it failed before choosing a recovery strategy — that's the core insight.

---

## 👨‍💻 Author

**Sumit** — Built for the Razorpay AI Buildathon 2026

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**Built with 🤖 Gemini AI + 💳 Razorpay + ❤️ Python**

*"AI reasons. Deterministic code controls."*

</div>
