# HireLogix 🚀

> **Autonomous Career Intelligence Platform:** Two-Tier Privacy Gatekeeper, Google Gemini AI Semantic Engine, and Resilient Gmail Delta Synchronization.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![Django Version](https://img.shields.io/badge/django-5.0.6-green.svg)](https://www.djangoproject.com/)
[![React Version](https://img.shields.io/badge/react-18.x-61dafb.svg)](https://react.dev/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-3.5--flash--lite%20%2F%203.6--flash-orange.svg)](https://ai.google.dev/)
[![Verification Suite](https://img.shields.io/badge/tests-19%2F19%20passed%20(100%25)-brightgreen.svg)]()

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [The Two-Tier Architecture (Zero-Leakage Privacy)](#-the-two-tier-architecture-zero-leakage-privacy)
- [System Architecture & Dataflow](#-system-architecture--dataflow)
- [Tech Stack](#-tech-stack)
- [Codebase Structure](#-codebase-structure)
- [REST API Reference](#-rest-api-reference)
- [Getting Started (Local Development)](#-getting-started-local-development)
- [Environment Configuration](#-environment-configuration)
- [Verification & Automated Test Suite](#-verification--automated-test-suite)
- [Author & Links](#-author--links)

---

## 💡 Overview

During an active technical job search, candidates submit tens or hundreds of applications across diverse platforms (company career pages, ATS portals like Greenhouse, Lever, and Workday, and direct recruiter emails). Tracking application statuses manually across spreadsheets is tedious, error-prone, and quickly falls out of sync.

**HireLogix** automates your entire job-search tracking workflow by connecting directly to Gmail through OAuth 2.0. It continuously monitors incoming mail, isolates authentic recruiter correspondence, extracts standardized company and role entities, tracks lifecycle milestones (Applied → Assessment → Interview → Offer/Rejection), and renders real-time analytics—all with **zero manual effort** and **zero exposure of private personal or financial data**.

---

## ✨ Key Features

- **🛡️ Two-Tier Privacy Gatekeeper:** Purges 100% of banking, OTP, personal, and promotional digest emails *locally* before any AI call. Zero bytes of sensitive data ever leave your server.
- **🧠 Semantic AI Entity Extraction:** Powered by Google Gemini (`gemini-3.5-flash-lite` with dynamic failover to `gemini-3.6-flash`), enforcing structured Pydantic schemas to extract canonical companies, clean job titles, and interview links without email greeting corruption.
- **⚡ Resilient Gmail Delta Sync:** Uses Gmail History API (`users.history.list`) checkpoints (`historyId`) on every refresh. Only fetches newly inserted message IDs, slashing sync latency by 95% (<300ms) compared to full-mailbox scans.
- **🔄 Multi-Thread Deduplication & Lifecycle Ranking:** Merges fragmented email threads (confirmation, assessment, interview 1, interview 2, offer) into a single canonical company card using a monotonic status advancement state machine.
- **⏱️ Free-Tier Rate Pacing & Failover:** Thread-safe request pacer (1.5s interval) and automated model failover prevent HTTP 429 quota exhaustion on Google AI Studio.
- **📊 Real-Time Visual Dashboard:** Modern React 18 single-page application featuring an interactive Kanban board, filterable tables, chronological activity feeds, pipeline conversion funnels, and live background sync indicators.

---

## 🛡️ The Two-Tier Architecture (Zero-Leakage Privacy)

Sending an entire inbox to a cloud LLM creates massive privacy risks (exposing bank OTPs, account balances, and personal messages) while rapidly exhausting token limits. HireLogix solves this with a strict separation of concerns:

```
[ Gmail Inbox ]
      │
      │ 1. format="metadata" (Headers only: Sender, Subject, Snippet, Date)
      ▼
┌─────────────────────────────────────────────────────────────┐
│ TIER 1: Local Deterministic Gatekeeper (Django Server)      │
│  - Regex & Strict Pattern Blocklist                         │
│  - Blocks 100% of Bank OTPs (HDFC, ICICI, SBI), Statements  │
│  - Blocks Newsletters & Job Digests (Internshala, Naukri)   │
│  - Drops personal correspondence lacking ATS/HR signals     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ Passed (Sanitized Headers Only)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ TIER 2: Google Gemini AI Semantic Engine (Cloud)            │
│  - gemini-3.5-flash-lite (with gemini-3.6-flash failover)   │
│  - Strictly typed Pydantic JSON schema output               │
│  - Extracts Canonical Employer (e.g. 'Stripe', not ATS)     │
│  - Extracts Clean Role Title (e.g. 'Software Engineer')     │
│  - Extracts Interview URLs (Zoom, Google Meet, Teams)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
[ Multi-Thread Deduplication & Relational Database Persistence ]
```

### Data Boundary Matrix

| Data Category | Downloaded to Server? | Sent to Gemini AI? | Protection Mechanism |
| :--- | :---: | :---: | :--- |
| **Bank OTPs & Financial Alerts** | Filtered by Gmail query | **NO (0 Bytes)** | Tier 1 Blocklist: `otp`, `bank`, `hdfc`, `icici`, `sbi`, `transaction`. |
| **Monthly Statements & Balances** | Filtered by Gmail query | **NO (0 Bytes)** | Tier 1 Blocklist: `salary account`, `statement`, `credit card`, `loan`. |
| **Personal / Family Messages** | Filtered by Gmail query | **NO (0 Bytes)** | Tier 1 drops all senders lacking ATS platform domains or verified recruiter signals. |
| **Email Attachments (PDFs, Resumes)** | **NO (0 Bytes)** | **NO (0 Bytes)** | Gmail API queried with `format="metadata"`; payloads & attachments are never fetched. |
| **Full Email HTML Body** | **NO (0 Bytes)** | **NO (0 Bytes)** | Only Google's 150-character preview snippet is inspected. |
| **Job Confirmation Metadata** | **YES (Headers Only)** | **YES (Sanitized)** | Cleaned Sender, Subject line, 150-character Snippet, and Date timestamp. |

---

## 🏗️ System Architecture & Dataflow

```mermaid
flowchart TD
    subgraph Client ["Frontend (React 18 + Vite)"]
        UI["Dashboard / Kanban / Funnel"]
        HOOK["useDashboardData Hook\n(Parallel Load + Incremental Poll)"]
    end

    subgraph Django ["Backend (Django REST Framework)"]
        AUTH["user/ Views\n(Google Sign-In + JWT Issuance)"]
        GMAIL["gmail/ Sync Service\n(History API Delta Checkpoints)"]
        GATEKEEPER["Tier 1 Gatekeeper\n(is_verified_job_email)"]
        DEDUP["jobs/ Import Service\n(Fuzzy Normalization & STATUS_RANK)"]
    end

    subgraph Google ["Google Cloud Services"]
        G_AUTH["Google Identity (OAuth 2.0)"]
        G_API["Gmail REST API (format='metadata')"]
        GEMINI["Google Gemini API\n(3.5-flash-lite / 3.6-flash)"]
    end

    subgraph Database ["Persistence Layer"]
        DB[(PostgreSQL / SQLite)]
    end

    UI <--> HOOK
    HOOK <--> AUTH
    HOOK <--> GMAIL
    HOOK <--> DEDUP
    AUTH <--> G_AUTH
    GMAIL <--> G_API
    GMAIL --> GATEKEEPER
    GATEKEEPER --> GEMINI
    GEMINI --> DEDUP
    DEDUP --> DB
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18, Vite
- **Styling:** Tailwind CSS, Custom responsive glassmorphism
- **Routing & State:** React Router v6, HTML5 History API (`popstate` state machine)
- **HTTP Client:** Axios with automated JWT Bearer injection & refresh interceptors
- **Icons & Assets:** Lucide React

### Backend
- **Framework:** Python 3.10+, Django 5.0.6, Django REST Framework
- **Authentication:** SimpleJWT (Access: 15 min, Refresh: 7 days), Google OAuth2 ID Token Verification
- **AI Engine:** Google Gemini API (`google-genai` SDK, Pydantic Schema Validation)
- **Database:** PostgreSQL (Neon Serverless in Production) / SQLite (Local Dev)
- **APIs & Integrations:** Google Gmail REST API v1, Gmail History API

---

## 📁 Codebase Structure

```
hirelogix/
├── backend/
│   ├── core/                       # Project configuration & settings
│   │   ├── settings.py             # DB routing, SimpleJWT, Gemini config, CORS
│   │   ├── urls.py                 # Master URL routing table
│   │   └── wsgi.py                 # Production WSGI entrypoint
│   ├── user/                       # User management & Authentication
│   │   ├── models.py               # Custom email-based User model
│   │   ├── views.py                # GoogleAuthAPI (Token verification & JWT issuance)
│   │   └── urls.py                 # /auth/ routes
│   ├── gmail/                      # Gmail OAuth & Synchronization
│   │   ├── models.py               # GmailConnection, GmailJobEmail, GmailOAuthTransaction
│   │   ├── oauth_service.py        # OAuth 2.0 authorization code flow
│   │   ├── gmail_service.py        # Token refresh abstraction & client wrapper
│   │   ├── gmail_sync_service.py   # Historical & Incremental History API delta sync
│   │   ├── views.py                # /gmail/connect/, /gmail/status/, /gmail/sync/
│   │   └── urls.py                 # Gmail endpoints
│   └── jobs/                       # Job Applications & Semantic AI
│       ├── models.py               # JobApplication (Canonical entity & status choices)
│       ├── gemini_service.py       # GeminiJobAnalyzer (Pydantic schema, rate pacer, failover)
│       ├── gmail_import_service.py # Tier-1 Gatekeeper, Fuzzy Dedup & STATUS_RANK
│       ├── signals.py              # post_save trigger for raw email ingestion
│       ├── serializers.py          # JobApplicationSerializer, JobSummarySerializer
│       ├── views.py                # JobViewSet, JobSummaryAPI, JobTimelineAPI
│       └── urls.py                 # /jobs/ endpoints
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI components (Topbar, Drawer, Modal)
│   │   ├── hooks/                  # Custom hooks (useDashboardData for progressive sync)
│   │   ├── pages/                  # Landing, Permission, Dashboard master views
│   │   ├── views/                  # Overview, Applications (Kanban/Table), Timeline, Insights
│   │   ├── services/               # Axios API client modules
│   │   └── App.jsx                 # Route definitions & instant JWT resolver
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🔗 REST API Reference

### Authentication (`/auth/`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/auth/google/` | Verifies Google ID token, provisions user, issues JWTs | No |
| `POST` | `/auth/token/refresh/` | Refreshes expired JWT access token | No |
| `POST` | `/auth/logout/` | Invalidates refresh token and clears session | Yes |

### Gmail Integration (`/gmail/`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/gmail/connect/` | Generates Google OAuth consent URL with CSRF state | Yes |
| `GET` | `/gmail/callback/` | Exchanges auth code for access and refresh tokens | Yes |
| `GET` | `/gmail/status/` | Returns connection status, email address, sync status | Yes |
| `POST` | `/gmail/sync/historical/`| Triggers progressive historical sync batch (`max_pages=1`) | Yes |
| `POST` | `/gmail/sync/incremental/`| Triggers History API delta sync for newly arrived emails | Yes |
| `POST` | `/gmail/disconnect/` | Revokes stored tokens and disconnects mailbox | Yes |

### Applications & Intelligence (`/jobs/`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/jobs/` | Paginated list of applications (filter by status, search) | Yes |
| `POST` | `/jobs/` | Manually add a new job application | Yes |
| `GET` | `/jobs/{id}/` | Retrieve detailed job application with merged threads | Yes |
| `PATCH`| `/jobs/{id}/` | Update application status, company name, or interview link| Yes |
| `DELETE`| `/jobs/{id}/` | Delete an application | Yes |
| `GET` | `/jobs/summary/` | Dashboard metrics: total, applied, assessment, interview, offer, rejected | Yes |
| `GET` | `/jobs/timeline/` | Chronological activity feed of all application updates | Yes |

---

## 🧪 Verification & Automated Test Suite

HireLogix includes an end-to-end automated verification suite testing real-world corporate ATS emails, banking notifications, and multi-user database audits:

```bash
# Run automated verification suite
python scratch/test_e2e_suite.py
```

### Test Suite Results: **19/19 Passed (100.0%)**

| Test Category | Test Cases | Expected | Status |
| :--- | :--- | :---: | :---: |
| **Financial & OTP Privacy** | HDFC Salary Offers, ICICI Credit Card Blasts | BLOCKED | **PASS** |
| **Platform Spam & Digests** | Wellfound Alerts, Internshala Job Fairs, MonsterIndia Blasts, Reddit Notifications | BLOCKED | **PASS** |
| **Tutorial Blasts** | HackerRank Practice Challenges, Tutorials, Onboarding Blasts | BLOCKED | **PASS** |
| **ATS Entity Extraction** | Greenhouse (Stripe), Amazon Recruiter, Microsoft Careers, Accenture, Flipkart | ACCEPTED | **PASS** |
| **AI Structured Schema** | Live Google Gemini API with Pydantic JSON validation | VALID JSON | **PASS** |
| **User Database Audits** | Verified 25 authentic applications for primary user, 0 spurious apps for tutorial user | AUDIT PASS | **PASS** |

---

## ⚙️ Getting Started (Local Development)

### Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm
- Google Cloud Console Project (with Gmail API and Google Sign-In credentials enabled)
- Google AI Studio API Key ([Get API Key](https://aistudio.google.com/))

### 1. Clone the Repository
```bash
git clone https://github.com/Yaswanthpatnam/hirelogix.git
cd hirelogix
git checkout hirelogix-v2
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS / Linux:
# source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
The Django REST server runs at `http://127.0.0.1:8000/`.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
The React Vite development server runs at `http://localhost:5173/`.

---

## 🔐 Environment Configuration

Create a `.env` file in `backend/` with the following keys:

```ini
# Django Secret Key & Debug Mode
SECRET_KEY=your_django_secret_key_here
DEBUG=True

# Gemini AI Credentials
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL_NAME=gemini-3.5-flash-lite

# Google OAuth & Gmail API Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GMAIL_GOOGLE_REDIRECT_URI=http://localhost:5173/permission

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Database (Leave unset for local SQLite, or provide Neon/PostgreSQL URL)
# DATABASE_URL=postgresql://user:password@host/database
```

Create a `.env` file in `frontend/`:

```ini
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

> **Security Note:** Never commit actual `.env` files or API secrets to version control. Both `.env` and `db.sqlite3` are strictly included in `.gitignore`.

---

## 👤 Author & Links

- **Author / Lead Architect:** Yaswanth Patnam
- **GitHub Repository:** [Yaswanthpatnam/hirelogix (hirelogix-v2)](https://github.com/Yaswanthpatnam/hirelogix/tree/hirelogix-v2)
- **Live Application:** [hirelogix.vercel.app](https://hirelogix.vercel.app/)