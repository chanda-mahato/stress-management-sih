# Known Limitations & Design Constraints — SIH PS 26186

This document records the design constraints, ethical boundaries, and current engineering scope of the AI-Based Predictive Personnel Stress & Welfare Monitoring System (Team Mavericks).

## 1. Institutional-Only Feature Model
- **Current Architecture**: The deployed CatBoost production model (wsi_production_model.cbm) is trained strictly on **46 objective operational and administrative telemetry features** (duty hours, night duties, rest hours, leave backlog, family separation, posting frequency, fitness degradation, unit manning shortfall).
- **Self-Assessment Status**: The Soldier Portal includes a monthly self-check questionnaire (mood, sleep, fatigue sliders). In this current release, raw self-check responses are recorded safely in the soldier_self_checks table for Medical Officer reference, but **are intentionally NOT fed as raw features into the ML inference pipeline** (complying with Path 1 design).
- **Future Evolution**: The feature pipeline and database schema are structured so that a validated clinical self_report_score can be integrated into future model training iterations without requiring a schema migration or architectural rewrite.

## 2. Human-in-the-Loop Mandate
- The ML engine produces a welfare risk tier (Low, Medium, High), a 4-color triage chip (Green, Yellow, Orange, Red), a confidence score, and top-3 SHAP contributing factors.
- **Zero Automated Actions**: The model is structurally forbidden from triggering any automated administrative or disciplinary action, leave cancellations, or duty alterations.
- All state changes (Acknowledged -> In Progress -> Resolved) and intervention decisions require explicit human clicks and clinical notes by a licensed Medical Officer or authorized Unit Administrator.

## 3. OPSEC Isolation of Family Portal
- The Family Portal operates on a deliberately data-starved principle.
- Enforced at the FastAPI authorization middleware layer: family member JWT tokens are restricted via a whitelist and receive HTTP 403 Forbidden on any route returning unit names, precise geographic locations, rosters, or operational stress risk scores.

## 4. Communications Layer & P2P Security Directive (§6a)
- All soldier-family calls are strictly **1:1 peer-to-peer (P2P)**.
- Media streams flow directly device-to-device with mandatory DTLS-SRTP encryption.
- Zero server-side media proxying, zero third-party video SDKs, and zero public STUN/TURN servers are permitted.

## 5. Sovereign Hosting, Infrastructure & Cloud Deployment Scope
- **Defense & Sovereign Compliance**: In accordance with Ministry of Home Affairs (MHA) and CAPF data classification standards, production deployment of the Sentinel Welfare Platform mandates dedicated, **NIC-empanelled (or equivalent sovereign)** cloud infrastructure (MeitY-empanelled Cloud Service Provider, AWS GovCloud (India), or secure on-premise CAPF datacenters).
- **Inadequacy of Commercial PaaS (Render / Vercel / Railway Free Tiers)**:
  - **UDP Port Forwarding Deficit**: Commercial PaaS platforms do not support custom UDP port-range forwarding (`49152-49200/udp`) required for Coturn peer-to-peer WebRTC media relay traversal across symmetric NAT firewalls.
  - **Sovereignty & Security Boundary**: Public shared cloud runtimes cannot guarantee in-country data residency, isolated VPC boundaries, or strict segregation of CAPF personnel stress and deployment telemetry.
- **Recommended Production Topology**:
  - **Frontend Web Tier**: Sovereign cloud static storage (with TLS termination) or hardened Nginx container running in DMZ.
  - **Backend Application Tier**: FastAPI backend containerized on private sovereign VM or managed Kubernetes cluster within an isolated VPC.
  - **Coturn WebRTC Relay Tier**: Dedicated sovereign Linux VM with elastic public IP, bound strictly to port `3478` (TCP/UDP) and relay range `49152-49200` (UDP), completely isolated from internal database subnets.
  - **Persistence & Caching Tier**: Managed PostgreSQL with AES-256 encrypted-at-rest volumes and Redis within private database subnets with zero external port exposure.

