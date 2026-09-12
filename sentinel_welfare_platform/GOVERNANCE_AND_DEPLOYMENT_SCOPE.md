# Sentinel Welfare Platform — Governance and Deployment Scope

> **Notice for MHA and Technical Reviewers**:  
> This document sets out the operational, legal, and data governance boundaries of the Sentinel Welfare Platform prototype. It details data sovereignty status, misuse prevention safeguards, validation reality, and the phased pilot roadmap.  
> **"No real personnel data should be processed through any foreign-hosted component. The current deployment is a functional demonstration only, using placeholder infrastructure."**

---

## 1. Data Sovereignty Status

The prototype utilizes commercial software components to demonstrate functional architecture during hackathon evaluation. Before operational handling of sensitive defense or police force data, all foreign-dependent services must transition to Sovereign Government of India (GoI) infrastructure.

| Component | Current (Demo Prototype) | Production Requirement (GoI / MHA Standard) |
| :--- | :--- | :--- |
| **Chatbot LLM** | Hosted Cloud API / Rule-based Ephemeral Fallback | **Must be replaced with an India-hosted / on-prem model** (e.g. locally hosted open-weights model on Sovereign GPU enclave) before any real personnel data is processed. |
| **SMS OTP Delivery** | Fast2SMS / Twilio Commercial Carrier Gateways | **NIC SMS Gateway** (mandatory government channel; empanelment and DLT entity onboarding not available during hackathon phase). |
| **Hosting & Compute** | Local Workstation / Demo PaaS Containers (Docker) | **NIC / MeitY-empanelled Cloud** (e.g., MeghRaj Cloud) or on-premise CAPF data centers running sovereign hardened Linux nodes. |
| **WebRTC Video Relay** | Embedded Sovereign Coturn Instance (`turn.sentinel.internal`) | On-premise Coturn / STUN-TURN cluster deployed inside dedicated CAPF VPN/SWAN network. Zero reliance on public STUN/TURN relays. |
| **Database Storage** | Single-instance SQLite / PostgreSQL Docker container | On-premise air-gapped PostgreSQL cluster with transparent data encryption (TDE) at rest and role-based access control (RBAC). |

*Explicit Declaration*: No real personnel data should be processed through any foreign-hosted component. The current deployment is a functional demonstration only, using placeholder infrastructure.

---

## 2. Misuse Prevention Policy (The ACR / Promotion Firewall)

The Sentinel platform is engineered exclusively as a clinical welfare support system. It is **not** a surveillance or performance assessment mechanism.

> **Non-Negotiable Design Principle**:  
> **"Welfare risk classifications (Green/Yellow/Orange/Red) must never be used as an input to Annual Confidential Reports (ACR), promotion boards, posting decisions, or any career-affecting evaluation. Access to case data is restricted to designated Medical Officers / welfare staff only, and every access is logged (see CaseAccessLog)."**

### Concrete Enforcement Mechanism: `CaseAccessLog`
To guarantee accountability beyond policy assertions, every read, triage review, status transition, and clinical annotation triggers an immutable audit log entry in the `case_access_logs` table:
- **`accessed_by`**: Recorded identifier of the viewing or modifying officer (e.g. `MO-DR-SHARMA-409`).
- **`accessed_at`**: Tamper-resistant UTC timestamp.
- **`action`**: Categorized access event (`viewed`, `status_changed`, `notes_added`).
- **Auditing Endpoint**: Restricted administrative endpoint (`GET /api/cases/{case_id}/access-logs`) enables unit supervisory inspection of all case interactions.

---

## 3. Accountability and Liability Framing

The Sentinel platform serves as **decision-support only**, never as an automated clinical diagnosis or unilateral disciplinary trigger:
- **Human-in-the-Loop Mandate**: Every High-Risk (`RED` or `ORANGE`) flag requires manual clinical review and interview by a designated Medical Officer before any welfare intervention (such as duty rotation, decompression leave, or counseling) is authorized.
- **False Negative Handling**: If an individual in distress is not flagged by the predictive model (a false negative), this event triggers a multi-disciplinary case-review process to examine systemic indicators, unit workload factors, and feature omissions. It does **not** trigger automated liability attribution or punitive blame on unit officers or clinicians. Establishing formal legal liability thresholds remains an **open governance question requiring institutional MHA policy determination**, not a problem solved by software algorithms.

---

## 4. Validation Status

To maintain scientific integrity and prevent misleading representations:

> **"This model has been trained and validated on a combination of licensed public HR benchmark datasets and procedurally generated CAPF-representative synthetic data. It has NOT been trained or validated on any real CAPF/CRPF/BSF personnel data, as such data is classified. A production rollout requires a formal pilot validation phase against real (anonymized/aggregate, per applicable data-sharing agreements) data from at least one training establishment or unit, before wider deployment is considered."**

Model metrics reported in technical demonstrations (ROC-AUC ~0.94, 46 operational features, SHAP attributions) demonstrate algorithmic feasibility on mathematically rigorous synthetic distributions; they must not be conflated with field-proven empirical accuracy on real troops.

---

## 5. Existing System Integration

The present prototype operates on independently entered operational telemetry. 

> **Current Status**:  
> **"This prototype operates on independently entered data. Production deployment should integrate with existing HRMS/leave-management systems via API rather than requiring parallel manual data entry."**

Fielding this software without direct integration into the central CAPF Personnel Management System (PIMS/HRMS) would introduce operational friction through duplicate data logging. Direct API adapters for secure leave synchronisation, posting history, and duty shift registries represent a **mandatory subsequent phase**.

---

## 6. Scale Statement

> **"Current architecture (SQLite/single-instance Postgres, single backend container) is validated for pilot scale (single unit/battalion). Production rollout across multiple CAPFs would require managed database clustering, horizontal backend scaling, and load-tested infrastructure - not implemented in this prototype."**

For battalion-level triage (~1,000 active personnel), the current lightweight FastAPI + PostgreSQL footprint provides sub-10ms inference latencies. Enterprise rollout across 10+ lakh personnel requires horizontal API container orchestration (Kubernetes), read-replica database pools, and Redis cluster caching.

---

## 7. Pilot Pathway (Credible Path to Operational Deployment)

A realistic transition from technology demonstration to CAPF operational deployment requires a structured four-stage pathway:

1. **Phase 1 — Single-Unit Pilot (Current State)**:
   - Standalone deployment at a single test installation using synthetic/demo operational parameters.
   - Validation of UI ergonomics, WebRTC peer-to-peer latency, and clinical workflow acceptability with participating unit medical officers.
2. **Phase 2 — Formal Unit MoU & Real-Data Validation**:
   - Execution of an institutional Memorandum of Understanding (MoU) with one central training institute or static battalion (e.g. CRPF Academy Kadarpur or BSF STS).
   - Validation of model feature weights against real, anonymized, and aggregated historical rest-cycle and sick-report data under institutional ethical review.
3. **Phase 3 — Institutional Consultation & Change-Management**:
   - Comprehensive review by Defence Institute of Psychological Research (DIPR) and the Directorate General Medical branch of the respective Central Armed Police Forces.
   - Formulation of non-punitive operational guidelines and standard operating procedures (SOPs).
4. **Phase 4 — Sovereign Migration & Integration**:
   - Migration of compute workloads to NIC/MeitY-empanelled cloud or internal paramilitary Intranet.
   - Integration with the national NIC SMS Gateway and centralized CAPF HRMS databases.

---

## 8. Adoption and Change-Management Note

Technical platforms in military and paramilitary formations encounter well-documented institutional friction if perceived as punitive or intrusive:

> **"Uniformed hierarchical organizations have documented cultural resistance to tools perceived as monitoring from above. Any real rollout requires buy-in from unit medical officers and welfare cells, ideally introduced as a tool that supports existing initiatives (CRPF buddy system, CISF's Project Mann, as a precedent for department-level mental health buy-in, BSF-AIIMS tele-counselling) rather than replacing or auditing them."**

The platform is designed to be positioned as a supportive tool for Company Commanders and Medical Officers to advocate for adequate rest cycles and leave sanctions for their troops, rather than an external supervisory audit.

---

## 9. Grievance and Representation Mechanism

To ensure natural justice and prevent personnel from feeling disenfranchised by automated statistical scoring:

> **"Personnel who disagree with a risk classification may file an objection, recorded against their case and visible to reviewing MOs (see `flagged_personnel_objection` field)."**

### Technical Guarantee
- **Server-Side Validation**: Through `POST /api/soldier/cases/{case_id}/objection`, personnel can register written objections directly from their portal. The backend validates case ownership server-side, preventing unauthorized tampering.
- **Permanent Attachment**: Objections are attached to the permanent case record with UTC timestamp (`objection_filed_at`) and displayed prominently on the Medical Officer clinical triage dashboard alongside the SHAP feature breakdown.
- **Audit Logging**: Objection filing automatically appends an audit record to `CaseAccessLog`, creating a permanent administrative paper trail that unit command cannot suppress.
