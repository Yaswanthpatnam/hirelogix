# HireLogix.ai 🚀

> **Autonomous Career Intelligence Platform:** Hybrid LPU/Local AI Semantic Engine, Deterministic Privacy Gatekeeper, and Resilient Gmail Delta Synchronization.

[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![Django Version](https://img.shields.io/badge/django-5.0.6-green.svg)](https://www.djangoproject.com/)
[![React Version](https://img.shields.io/badge/react-19.x-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/vite-7.x-646CFF.svg)](https://vitejs.dev/)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Groq%20LPU%20%2B%20Ollama%20Local-orange.svg)](https://groq.com/)
[![Database](https://img.shields.io/badge/database-PostgreSQL%20%2F%20Neon-336791.svg)](https://neon.tech/)

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architectural Innovations](#-architectural-innovations)
  - [1. Two-Tier Privacy Gatekeeper](#1-two-tier-privacy-gatekeeper)
  - [2. Hybrid Semantic AI Pipeline (Groq + Ollama + Regex)](#2-hybrid-semantic-ai-pipeline-groq--ollama--regex)
  - [3. Dense Pipe DSL Batching](#3-dense-pipe-dsl-batching)
  - [4. Distributed Mutex Concurrency Lock](#4-distributed-mutex-concurrency-lock)
- [System Architecture & Dataflow](#-system-architecture--dataflow)
- [Frontend Experience & Visualizations](#-frontend-experience--visualizations)
- [Tech Stack](#-tech-stack)
- [Codebase Structure](#-codebase-structure)
- [REST API Reference](#-rest-api-reference)
- [Environment Configuration & Security](#-environment-configuration--security)
- [Deployment Guide (Vercel + Render)](#-deployment-guide-vercel--render)
- [Local Development Setup](#-local-development-setup)
- [Author & Links](#-author--links)

---

## 💡 Overview

During an active technical job search, candidates submit tens or hundreds of applications across company portals, ATS platforms (Greenhouse, Lever, Workday, Ashby), and direct recruiter emails. Tracking application milestones manually across spreadsheets is tedious, error-prone, and quickly falls out of sync.

**HireLogix** automates your entire job-search tracking workflow by connecting directly to Gmail through Google OAuth 2.0. It continuously monitors incoming mail, isolates authentic recruiter correspondence, extracts standardized company and role entities, tracks lifecycle milestones (`applied` → `under_review` → `assessment` → `interview` → `offer` / `rejected`), and renders real-time analytics—all with **zero manual effort**, **sub-second latency**, and **zero exposure of private personal or financial data**.

---

## ✨ Key Features

- **🛡️ Deterministic Privacy Gatekeeper:** Purges 100% of banking alerts, OTPs, password resets, personal messages, and promotional job blasts locally in `<0.05ms` before any AI engine is called. Zero bytes of sensitive data leave your server.
- **⚡ Hybrid Semantic AI Engine:** Primary high-speed cloud inference powered by **Groq LPU** (`qwen/qwen3.8-27b`), secondary offline inference via **Local Ollama** (`qwen2.5:1.5b`), and tertiary deterministic regex safety nets.
- **📄 Dense Pipe DSL Batching:** Eliminates JSON schema overhead by encoding candidate emails in compact pipe-delimited format (`ID|Sender|Subject|Snippet`), slashing token consumption by **96.8%** (~45 tokens/email) and evaluating 25 emails in a single ~450ms pass.
- **🔒 Distributed Mutex Concurrency Lock:** Thread-safe distributed cache locks prevent simultaneous historical and incremental sync collisions, eliminating race conditions.
- **🧹 Canonical Deduplication & Zero Ghost Cards:** Automatically merges multi-thread email updates (application confirmation, assessment, interview, rejection) under one canonical company card with live database verification.
- **📈 60-Day Interactive Timeline:** Smooth horizontal swipeable and draggable activity timeline with instant day/week jump controls.
- **🍩 Interactive SVG Donut Chart:** Fluid SVG visualization with hover slice scaling, live percentage tooltips, and center-hole active metrics.
- **🎯 Persistent Sorting & Filtering:** Lifecycle-protected sorting state (`hasPrimedRef`) prevents background polling loops from clobbering user-selected filters.
- **🔄 Live Processing Indicator:** Topbar AI indicator pill visually communicates background mailbox analysis and synchronization in real time.

---

## 🧠 Architectural Innovations

### 1. Two-Tier Privacy Gatekeeper

Sending an entire mailbox to a cloud LLM creates massive privacy risks (exposing bank OTPs, account balances, and personal messages) while rapidly exhausting token quotas. HireLogix solves this with strict local filtering:

```
[ Gmail Inbox ]
      │
      │ 1. format="metadata" (Headers only: Sender, Subject, Snippet, Date)
      ▼
┌─────────────────────────────────────────────────────────────┐
│ TIER 1: Local Deterministic Gatekeeper (Django Server)      │
│  - Regex & Strict Pattern Blocklist (<0.05ms)               │
│  - Blocks 100% of Bank OTPs (HDFC, ICICI, SBI, Chase, etc.) │
│  - Blocks Promotional Digests (Internshala, Naukri, LinkedIn)│
│  - Drops personal correspondence lacking ATS/HR signals     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ Passed (Sanitized Headers Only)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ TIER 2: Hybrid Semantic AI Engine                           │
│  - Primary: Groq LPU API (qwen/qwen3.8-27b in ~450ms)        │
│  - Secondary: Ollama Local (qwen2.5:1.5b offline fallback)  │
│  - Tertiary: Deterministic Regex Safety Net (<0.02ms)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
[ Mutex Cache Lock & Canonical Database Deduplication ]
```

### 2. Hybrid Semantic AI Pipeline (Groq + Ollama + Regex)

HireLogix implements an automated 3-tier cascade in `jobs/ai_service.py`:
1. **Primary (Groq LPU)**: Connects to Groq cloud LPU via `GROQ_API_KEY`. Delivers ultra-low latency inference (~450ms per batch of 25 candidates).
2. **Secondary (Local Ollama)**: If running locally without a Groq key or when offline, checks `http://localhost:11434` with a non-blocking 300ms health check (`OllamaJobAnalyzer.is_available()`). On cloud deployments (like Render) where Ollama is absent, it cleanly skips without throwing errors.
3. **Tertiary (Deterministic Regex Safety Net)**: If both AI services are unavailable, instant structural regex extraction guarantees zero server stalls or unhandled exceptions.

### 3. Dense Pipe DSL Batching

Traditional LLM JSON serialization wastes up to 80% of tokens on syntax braces and keys. HireLogix uses a compact pipe-delimited DSL:

**Prompt Input:**
```text
Classify job emails. Output EXACTLY 1 line per ID in this format:
ID|IS_JOB(Y/N)|COMPANY|ROLE|STATUS(applied/under_review/assessment/interview/offer/rejected)

Emails:
101|jobs@stripe.com|Application Received - Software Engineer|Thank you for applying to Stripe...
102|newsletter@dailytech.com|Top Tech News Today|Here are today's top engineering articles...
```

**Model Output:**
```text
101|Y|Stripe|Software Engineer|applied
102|N|||
```

* **Token Consumption:** Reduced from ~1,500 tokens/email to **~45 tokens/email**.
* **Processing Speed:** Evaluates 25 candidate emails in **~450ms**.

### 4. Distributed Mutex Concurrency Lock

To prevent race conditions when historical sync and incremental sync trigger simultaneously on user login, a distributed cache mutex lock is enforced:

```python
lock_key = f"gmail_sync_lock_{connection.id}"
if not cache.add(lock_key, "locked", timeout=180):
    return {"status": "in_progress", "synced_count": 0}

try:
    # Atomic mailbox processing...
finally:
    cache.delete(lock_key)
```

Combined with an atomic pre-commit query check (`JobApplication.objects.filter(...)`), duplicate cards and ghost records are eliminated.

---

## 🏗️ System Architecture & Dataflow

```mermaid
flowchart TD
    subgraph Client ["Frontend (React 19 + Vite)"]
        UI["Dashboard / Kanban / Applications View"]
        HOOK["useDashboardData Hook\n(Focus / Polling Sync Trigger)"]
        CHART["60-Day Activity Chart & SVG Donut"]
    end

    subgraph Backend ["Backend (Django REST Framework)"]
        AUTH["user/ Views\n(Google Sign-In + SimpleJWT)"]
        SYNC["gmail/ Sync Service\n(History API Delta + Cache Mutex)"]
        GATEKEEPER["Tier-1 Gatekeeper\n(Regex Blocklists & ATS Validation)"]
        AI["jobs/ AI Service\n(Groq LPU -> Ollama -> Regex Fallback)"]
        DEDUP["jobs/ Import Service\n(Atomic Merge & Status Advancement)"]
    end

    subgraph External ["External Services"]
        G_AUTH["Google Identity (OAuth 2.0)"]
        G_API["Gmail REST API v1 (metadata-only)"]
        GROQ["Groq LPU Cloud (qwen/qwen3.8-27b)"]
        OLLAMA["Local Ollama (qwen2.5:1.5b)"]
    end

    subgraph Database ["Persistence Layer"]
        DB[(PostgreSQL / Neon Database)]
    end

    UI <--> HOOK
    HOOK <--> SYNC
    HOOK <--> DEDUP
    AUTH <--> G_AUTH
    SYNC <--> G_API
    SYNC --> GATEKEEPER
    GATEKEEPER --> AI
    AI --> GROQ
    AI -. fallback .-> OLLAMA
    AI --> DEDUP
    DEDUP --> DB
```

---

## 📊 Frontend Experience & Visualizations

- **Dynamic Greeting:** Time-accurate greeting reflecting the user's local timezone (Morning: 5am–12pm, Afternoon: 12pm–5pm, Evening: 5pm–5am).
- **Interactive SVG Donut Chart:** Smooth animated hover scaling on segments, dynamic floating tooltip displaying application count and percentage, and center-hole active metrics.
- **60-Day Swipeable Activity Timeline:** Draggable, touch-friendly horizontal timeline with week-based navigation buttons, date range indicators, and activity dots.
- **Protected Sort State (`hasPrimedRef`):** Ensures selected sorting orders (`Newest First`, `Oldest First`, `Company A-Z`, `Status`) persist smoothly without being overwritten by background polling cycles.
- **Clutter-Free Interface:** Removed manual refresh buttons, unneeded bell icons, and redundant helper banners in favor of a sleek topbar AI processing indicator.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19, Vite 7
- **Styling:** Tailwind CSS, Custom responsive dashboard glassmorphism
- **Routing & State:** React Router v7, Custom React Hooks (`useDashboardData`)
- **HTTP Client:** Axios with automated JWT Bearer injection & refresh interceptors
- **Icons & Animation:** Lucide React, Framer Motion

### Backend
- **Framework:** Python 3.10+, Django 5.0.6, Django REST Framework
- **Authentication:** SimpleJWT (Access: 30 min, Refresh: 7 days), Google OAuth 2.0 ID Token Verification
- **AI Engine:** Groq LPU SDK (`groq`), Requests (Local Ollama integration)
- **Database:** PostgreSQL (Neon Serverless in Production) / SQLite (Local Dev)
- **APIs & Integrations:** Google Gmail REST API v1, Gmail History API

---

## 📁 Codebase Structure

```
hirelogix/
├── backend/
│   ├── core/                       # Master settings, CORS, URLs, WSGI
│   │   ├── settings.py             # Configured for PostgreSQL, SimpleJWT, Groq, Ollama
│   │   ├── urls.py                 # Master API router
│   │   └── wsgi.py                 # Production WSGI entrypoint
│   ├── user/                       # User management & Authentication
│   │   ├── models.py               # Custom email-based User model
│   │   ├── views.py                # Google auth, JWT issuance, profile endpoints
│   │   └── urls.py                 # /user/ routes
│   ├── gmail/                      # Gmail OAuth & Synchronization
│   │   ├── models.py               # GmailConnection, GmailJobEmail, GmailOAuthTransaction
│   │   ├── oauth_service.py        # Google OAuth authorization code exchange
│   │   ├── gmail_service.py        # Token refresh abstraction & client wrapper
│   │   ├── gmail_sync_service.py   # Historical & Incremental sync with Mutex lock
│   │   ├── views.py                # OAuth start, callback, status, sync endpoints
│   │   └── urls.py                 # /gmail/ endpoints
│   ├── jobs/                       # Job Applications & Semantic AI Pipeline
│   │   ├── models.py               # JobApplication & status choices
│   │   ├── ai_service.py           # Master Hybrid AI Analyzer (Groq -> Ollama -> Regex)
│   │   ├── groq_service.py         # Groq LPU Pipe DSL Batch Analyzer
│   │   ├── ollama_service.py       # Ollama Local Pipe DSL Batch Analyzer
│   │   ├── gmail_import_service.py # Tier-1 Gatekeeper, Fuzzy Deduplication, Atomic DB writes
│   │   ├── signals.py              # post_save trigger for raw email ingestion
│   │   ├── serializers.py          # JobApplicationSerializer, JobSummarySerializer
│   │   ├── views.py                # Applications CRUD, Dashboard, Timeline, Metrics
│   │   └── urls.py                 # /jobs/ endpoints
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Backend environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── charts/             # ActivityChart.jsx (60-day swipeable), DonutChart.jsx (SVG)
│   │   │   ├── dashboard/          # Topbar.jsx (with AI pill), Sidebar.jsx, DetailPanel.jsx
│   │   │   └── views/              # Overview.jsx, ApplicationsView.jsx, InsightsView.jsx
│   │   ├── hooks/                  # useDashboardData.jsx (sync & polling controller)
│   │   ├── pages/                  # Landing.jsx, Permission.jsx, Dashboard.jsx
│   │   ├── services/               # Axios API wrappers (gmail.js, jobs.js, user.js)
│   │   ├── styles/                 # dashboard.css, index.css
│   │   └── utils/                  # api.js, dashboardHelpers.js, jobHelpers.js
│   ├── package.json
│   ├── vite.config.js              # Strict-port configuration for OAuth stability
│   └── .env.example                # Frontend environment variables template
├── .gitignore                      # Comprehensive root gitignore
└── README.md
```

---

## 🔗 REST API Reference

### Authentication (`/user/`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/user/auth/google/` | Verifies Google ID token, provisions user, issues JWTs | No |
| `POST` | `/user/token/refresh/` | Refreshes expired JWT access token | No |
| `POST` | `/user/auth/logout/` | Blacklists refresh token and invalidates session | Yes |

### Gmail Integration (`/gmail/`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/gmail/auth/start/` | Generates Google OAuth consent URL with CSRF state | Yes |
| `GET` | `/gmail/oauth/callback/` | Handles Google callback, saves credentials, redirects to frontend | No |
| `GET` | `/gmail/connection/status/` | Returns connection status, email address, sync status | Yes |
| `POST` | `/gmail/sync/historical/` | Triggers progressive historical sync batch with mutex lock | Yes |
| `POST` | `/gmail/sync/incremental/` | Triggers History API delta sync for newly arrived emails | Yes |
| `POST` | `/gmail/connection/disconnect/` | Revokes stored tokens and disconnects mailbox | Yes |

### Job Intelligence (`/jobs/`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/jobs/applications/` | Paginated list of applications (supports sorting, filters, search) | Yes |
| `POST` | `/jobs/applications/` | Manually record a job application | Yes |
| `GET` | `/jobs/applications/{id}/` | Retrieve single application details with linked email history | Yes |
| `PATCH` | `/jobs/applications/{id}/` | Update status, company name, notes, or interview link | Yes |
| `DELETE` | `/jobs/applications/{id}/` | Delete an application card | Yes |
| `GET` | `/jobs/dashboard/` | High-level metrics: total, applied, assessment, interview, offer, rejected | Yes |
| `GET` | `/jobs/timeline/` | Chronological activity feed for the 60-day activity chart | Yes |

---

## 🔐 Environment Configuration & Security

> **Security Mandate:** Never commit actual `.env` files or API secrets to version control. The repository includes strict `.gitignore` rules preventing `.env`, `db.sqlite3`, and virtual environments from being tracked.

### Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```ini
# Django Core Settings
DJANGO_SECRET_KEY=your_django_secret_key_here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost,your-backend.onrender.com

# Database (PostgreSQL / Neon Serverless)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Google OAuth 2.0 & Gmail Integration
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/user/auth/google/callback/
GMAIL_GOOGLE_REDIRECT_URI=http://localhost:8000/gmail/oauth/callback/

# Frontend Application URL (for CORS and OAuth redirect)
FRONTEND_URL=http://localhost:5173

# AI Engine: Groq LPU (High-Speed Cloud Inference)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL_NAME=qwen/qwen3.8-27b

# AI Engine: Ollama (Optional Local Offline Inference)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5:1.5b
```

### Frontend Configuration (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```ini
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

---

## 🚀 Deployment Guide (Vercel + Render)

### 1. Backend on Render (Web Service)
1. Create a new **Web Service** on Render connected to your repository.
2. Configure settings:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt && python manage.py migrate`
   - **Start Command:** `gunicorn core.wsgi:application`
3. Add Environment Variables in the Render dashboard:
   - `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, `DJANGO_ALLOWED_HOSTS`
   - `DATABASE_URL` (Neon PostgreSQL)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI=https://<your-backend>.onrender.com/user/auth/google/callback/`
   - `GMAIL_GOOGLE_REDIRECT_URI=https://<your-backend>.onrender.com/gmail/oauth/callback/`
   - `FRONTEND_URL=https://<your-frontend>.vercel.app`
   - `GROQ_API_KEY` *(Ollama is automatically and gracefully bypassed on Render)*

### 2. Frontend on Vercel
1. Import the repository into Vercel.
2. Configure settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add Environment Variables in the Vercel dashboard:
   - `VITE_API_BASE_URL=https://<your-backend>.onrender.com`
   - `VITE_GOOGLE_CLIENT_ID=<your-google-client-id>`

### 3. Google Cloud Console Credentials
Add the production domains to your OAuth 2.0 Web Client in Google Cloud Console:
- **Authorized JavaScript Origins:**
  - `http://localhost:5173`
  - `http://localhost:4173`
  - `https://<your-frontend>.vercel.app`
- **Authorized Redirect URIs:**
  - `http://localhost:8000/gmail/oauth/callback/`
  - `https://<your-backend>.onrender.com/gmail/oauth/callback/`
  - `https://<your-backend>.onrender.com/user/auth/google/callback/`

---

## ⚙️ Local Development Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Activate Virtual Environment:
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
# source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
Backend runs at `http://localhost:8000/`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173/`.

---

## 👤 Author & Links

- **Author / Lead Architect:** Yaswanth Patnam
- **GitHub Repository:** [Yaswanthpatnam/hirelogix](https://github.com/Yaswanthpatnam/hirelogix)
- **Branch:** `hirelogix-v2`
- **Live Frontend:** [hirelogix.vercel.app](https://hirelogix.vercel.app/)
