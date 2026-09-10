# SENTINEL AI — Predictive Personnel Stress & Welfare Monitoring System
**Team Mavericks • Smart India Hackathon 2026 • Problem Statement 26186**

An AI-based welfare monitoring and operational stress early-warning system engineered for the Armed Forces & Central Armed Police Forces (CRPF, BSF, ITBP). Built with a strict **human-in-the-loop** mandate: the AI predicts risk tiers and surfaces explainable drivers, but **never** triggers an automated decision or disciplinary penalty.

---

## 🏛️ Platform Architecture (Monorepo)

\sentinel_welfare_platform/
├── ml_service/                       # CatBoost Native CBM Model & 46-Feature Schema
│   ├── wsi_production_model.cbm      # Deployed production model (no .joblib dependency)
│   └── feature_schema.json           # Exact 46-feature ordering & schema definition
├── backend/                          # FastAPI Backend & WebSocket Signaling Server
│   ├── app/                          # Core application logic, database models, and routers
│   │   ├── auth.py                   # JWT + OTP + Strict OPSEC Scope Enforcement
│   │   ├── services/                 # ML Engine (SHAP), Ephemeral Chat, Roster Scheduler
│   │   └── routers/                  # ML, Personnel, Cases, Soldier, Family, Chat, Signaling
│   └── tests/                        # Automated Pytest Suite (8/8 Acceptance Tests Passing)
├── frontend/                         # Next.js 14 PWA with 3 Portal Surfaces
│   └── src/app/
│       ├── page.tsx                  # Command Portal Switcher & System Gateway
│       ├── soldier/page.tsx          # Soldier Mobile PWA (Self-check, I\'m Okay, Call slots)
│       ├── mo/page.tsx               # Medical Officer Desktop Dashboard (Live Queue, SHAP)
│       └── family/page.tsx           # Family Mobile PWA (OTP Login, Feed, Secure 1:1 Video Call)
├── coturn/                           # Self-hosted Coturn NAT Traversal (§6a Directive)
│   └── turnserver.conf               # Private TURN configuration (Zero public STUN)
├── docker-compose.yml                # Production multi-container orchestration
└── KNOWN_LIMITATIONS.md              # Explicit documentation of institutional-only model
\
---

## 🛡️ Non-Negotiable Core Principles

1. **Human-in-the-Loop Clinical Routing**: The machine learning model computes candidate risk assessments, but never alters rosters, cancels leave, or triggers disciplinary action. State transitions (\Acknowledged\ -> \In Progress\ -> \Resolved\) require explicit Medical Officer action.
2. **OPSEC-Isolated Family Portal**: The Family Portal is deliberately data-starved. Enforced via FastAPI authorization dependency \enforce_family_scope\ which returns **HTTP 403 Forbidden** on any attempt to access rosters, unit names, locations, or stress scores.
3. **Ephemeral Chat Memory**: Chatbot message history exists only in in-process memory with a 5-minute TTL eviction. Zero message rows are ever saved to the database.
4. **Security Directive (§6a) Compliant Calling**:
   - 1:1 calls only (never group calls).
   - Direct device-to-device WebRTC P2P media flow (zero media bytes pass through the backend).
   - Mandatory DTLS-SRTP encryption.
   - Zero public STUN/TURN servers (self-hosted coturn credentials only).
5. **2G/3G Offline-First Queue**: Soldier and Family portals queue check-in actions in local storage when disconnected at remote posts and auto-sync when network connectivity returns.

---

## 🚦 4-Color Triage Chip System

| Color | Triage Tier | Condition | Clinical Interpretation |
| :---: | :---: | :---: | :--- |
| 🟢 **Green** | **Low Risk** | Argmax is \Low\ | Normal duty routine & standard rest cycles. |
| 🟡 **Yellow** | **Stable Medium** | Argmax is \Medium\ & (\\text{High}) < 0.30$ | Standard supervisory review. |
| 🟠 **Orange** | **Borderline High** | Argmax is \Medium\ & **(\\text{High}) \\ge 0.30$** | **Proactive Early Warning**: High proximity to crisis; warrants immediate leave prioritization. |
| 🔴 **Red** | **High Risk Alert** | Argmax is \High\ | Urgent clinical triage & decompression rest rotation. |

---

## 🚀 Quick Start Guide (Local Development)

### 1. Start the Backend API (FastAPI)
\\powershell
cd C:\\Users\\Rashm\\.gemini\\antigravity\\scratch\\sentinel_welfare_platform\\backend
py -3.13 -m uvicorn app.main:app --port 8000 --reload
\* Interactive API Documentation (Swagger UI): \http://127.0.0.1:8000/docs* Health Check: \http://127.0.0.1:8000/health
### 2. Seed Database with Realistic CAPF Telemetry
\\powershell
cd C:\\Users\\Rashm\\.gemini\\antigravity\\scratch\\sentinel_welfare_platform\\backend
py -3.13 seed_data.py
\
### 3. Run the Automated Test Suite (100% Passing)
\\powershell
cd C:\\Users\\Rashm\\.gemini\\antigravity\\scratch\\sentinel_welfare_platform\\backend
py -3.13 -m pytest tests/ -v
\
### 4. Start the Frontend (Next.js PWA)
\\powershell
cd C:\\Users\\Rashm\\.gemini\\antigravity\\scratch\\sentinel_welfare_platform\\frontend
npm run dev
\Open your browser at \http://localhost:3000\:
* \/\ — **Command Gateway / Portal Selector**
* \/soldier\ — **Soldier Mobile PWA**
* \/mo\ — **Medical Officer Command Dashboard**
* \/family\ — **OPSEC-Isolated Family Portal** *(Demo login phone: \9876543200\)*
