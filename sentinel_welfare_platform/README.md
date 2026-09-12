# SENTINEL AI — Predictive Personnel Stress & Welfare Monitoring System
**Team Mavericks • Smart India Hackathon 2026 • Problem Statement 26186**

An AI-based welfare monitoring and operational stress early-warning system engineered for the Armed Forces & Central Armed Police Forces (CRPF, BSF, ITBP). Built with a strict **human-in-the-loop** mandate: the AI predicts risk tiers and surfaces explainable drivers, but **never** triggers an automated decision or disciplinary penalty.

> ⚠️ **MHA Reviewer Notice on Governance & Deployment Scope**:  
> See [GOVERNANCE_AND_DEPLOYMENT_SCOPE.md](GOVERNANCE_AND_DEPLOYMENT_SCOPE.md) for data sovereignty, misuse prevention, and pilot-deployment scope before considering this for any real personnel data.

---

## 🏛️ Platform Architecture (Monorepo)

```
sentinel_welfare_platform/
├── ml_service/                       # CatBoost Native CBM Model & 46-Feature Schema
│   ├── wsi_production_model.cbm      # Deployed production model (no .joblib dependency)
│   └── feature_schema.json           # Exact 46-feature ordering & schema definition
├── backend/                          # FastAPI Backend & WebSocket Signaling Server
│   ├── app/                          # Core application logic, database models, and routers
│   │   ├── auth.py                   # JWT + OTP + Strict OPSEC Scope Enforcement
│   │   ├── services/                 # ML Engine (SHAP), Ephemeral Chat, Roster Scheduler, Rate Limiter
│   │   └── routers/                  # ML, Personnel, Cases, Soldier, Family, Chat, Signaling
│   └── tests/                        # Automated Pytest Suite (12/12 Acceptance & Governance Tests Passing, Isolated DB)
├── frontend/                         # Next.js 14 PWA with 3 Portal Surfaces
│   └── src/app/
│       ├── page.tsx                  # Command Portal Switcher & System Gateway
│       ├── soldier/page.tsx          # Soldier Mobile PWA (Self-check, I'm Okay, Call slots)
│       ├── mo/page.tsx               # Medical Officer Desktop Dashboard (Live Queue, SHAP)
│       └── family/page.tsx           # Family Mobile PWA (OTP Login, Feed, Secure 1:1 Video Call)
├── coturn/                           # Self-hosted Coturn NAT Traversal (§6a Directive)
│   └── turnserver.conf               # Private TURN configuration (Zero public STUN)
├── nginx/                            # Hardened Reverse Proxy Configuration
│   └── nginx.conf                    # TLS/Security Headers & Proxy Routing
├── .env.example                      # Strict Environment Configuration Template
├── docker-compose.yml                # Local Developer Multi-Container Setup
├── docker-compose.prod.yml           # Production Hardened Multi-Container Setup
├── .github/workflows/test.yml        # Automated GitHub Actions CI Test Workflow
└── KNOWN_LIMITATIONS.md              # Explicit documentation of institutional model & sovereign hosting scope
```

---

## 🛡️ Non-Negotiable Core Principles

1. **Human-in-the-Loop Clinical Routing**: The machine learning model computes candidate risk assessments, but never alters rosters, cancels leave, or triggers disciplinary action. State transitions (`Acknowledged` -> `In Progress` -> `Resolved`) require explicit Medical Officer action.
2. **OPSEC-Isolated Family Portal**: The Family Portal is deliberately data-starved. Enforced via FastAPI authorization dependency `enforce_family_scope` which returns **HTTP 403 Forbidden** on any attempt to access rosters, unit names, locations, or stress scores.
3. **Ephemeral Chat Memory**: Chatbot message history exists only in in-process memory with a 5-minute TTL eviction. Zero message rows are ever saved to the database.
4. **Security Directive (§6a) Compliant Calling**:
   - 1:1 calls only (never group calls).
   - Direct device-to-device WebRTC P2P media flow (zero media bytes pass through the backend).
   - Mandatory DTLS-SRTP encryption.
   - Zero public STUN/TURN servers (self-hosted coturn credentials only).
5. **Rate-Limited & Hashed OTP Authentication**: Max 5 OTP requests per phone per hour (sliding-window rate limiter returning HTTP 429), SHA-256 hashed OTPs at rest, and 5-minute server-side TTL.
6. **2G/3G Offline-First Queue**: Soldier and Family portals queue check-in actions in local storage when disconnected at remote posts and auto-sync when network connectivity returns.

---

## 🚦 4-Color Triage Chip System

| Color | Triage Tier | Condition | Clinical Interpretation |
| :---: | :---: | :---: | :--- |
| 🟢 **Green** | **Low Risk** | Argmax is `Low` | Normal duty routine & standard rest cycles. |
| 🟡 **Yellow** | **Stable Medium** | Argmax is `Medium` & $P(\text{High}) < 0.30$ | Standard supervisory review. |
| 🟠 **Orange** | **Borderline High** | Argmax is `Medium` & **$P(\text{High}) \ge 0.30$** | **Proactive Early Warning**: High proximity to crisis; warrants immediate leave prioritization. |
| 🔴 **Red** | **High Risk Alert** | Argmax is `High` | Urgent clinical triage & decompression rest rotation. |

---

## 🚀 Quick Start Guide (Local Development)

### 1. Environment Secrets Setup
Copy `.env.example` to `.env` and generate cryptographically secure tokens:
```bash
cp .env.example .env
# Generate 32-byte hex secrets:
python -c "import secrets; print('JWT_SECRET=' + secrets.token_hex(32)); print('TURN_SECRET=' + secrets.token_hex(32))"
```

### 2. Start the Backend API (FastAPI)
```powershell
cd backend
py -3.13 -m uvicorn app.main:app --port 8000 --reload
```
* Interactive API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`
* Deep Health Check (DB + ML status): `http://127.0.0.1:8000/health`

### 3. Run the Automated Test Suite (12/12 Acceptance & Governance Tests Passing)
Tests execute against an isolated test SQLite database without touching development databases:
```powershell
cd backend
py -3.13 -m pytest tests/ -v
```

### 4. Start the Frontend (Next.js PWA)
```powershell
cd frontend
npm run dev
```
Open your browser at `http://localhost:3000`:
* `/` — **Command Gateway / Portal Selector**
* `/soldier` — **Soldier Mobile PWA**
* `/mo` — **Medical Officer Command Dashboard**
* `/family` — **OPSEC-Isolated Family Portal** *(Demo login phone: `9876543200`)*

---

## 🚢 Production Deployment & Sovereign Infrastructure

### Production Container Orchestration (`docker-compose.prod.yml`)
For production environments, launch the hardened multi-container stack:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
* **Nginx Reverse Proxy**: Exposes ports `80` / `443` with strict security headers (`HSTS`, `CSP`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`), proxying `/api` to FastAPI and routing WebSocket signaling.
* **Network Isolation**: PostgreSQL (`5432`) and Redis (`6379`) are strictly bound to an internal Docker bridge network (`sentinel_net`) with zero host exposure.
* **Healthchecks & Resource Limits**: Automatic container health monitoring (`/health`, `pg_isready`, `redis-cli ping`) with CPU and memory quotas.

### Sovereign Cloud & Hosting Requirements
Per Ministry of Home Affairs (MHA) defense standards:
* **NIC-Empanelled Cloud Required**: Production deployments must run on MeitY-empanelled sovereign cloud (or AWS GovCloud / on-premise CAPF datacenter).
* **Commercial PaaS Deficit**: Standard consumer PaaS (Vercel, Render, Railway free tiers) cannot host the Coturn TURN server due to the lack of custom UDP port range forwarding (`49152-49200/udp`) required for WebRTC NAT traversal, and cannot satisfy defense data sovereignty standards.
* For full architectural details, consult [KNOWN_LIMITATIONS.md](file:///C:/Users/Rashm/.gemini/antigravity/scratch/sentinel_welfare_platform/KNOWN_LIMITATIONS.md#L24-L36).

