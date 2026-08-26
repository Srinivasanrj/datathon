# KSP Sentinel — Implementation Plan v1.0
> **Document Type:** `[SCRIBE]` — Architecture & Workflow Design
> **Prepared:** 2026-07-24
> **Directory:** `data_for_ai/implementation_01.md`
> **Walkthrough Outputs:** `walkthrough_ai/phase_X_walkthrough.md` (one per phase)

---

## Overview

This document maps 9 broken/partial features from the problem statement evaluation into **5 execution phases**, each treated as a self-contained module. Each phase has defined inputs, outputs, Catalyst services used, files touched, and a corresponding walkthrough document to be written in `walkthrough_ai/` after execution.

The guiding principle: **phases are ordered by dependency, not by priority.** Earlier phases fix the plumbing that later phases rely on.

---

## Current State Architecture (Baseline)

```
[ Police Officer ]
        |
        v
[ React Frontend - localhost:5173 ]
  |-- Login.jsx (fake client-side auth)
  |-- Chatbot.jsx (stateless, sends only { query: text })
  |-- BengaluruHeadDashboard / Mysore / Belagavi / Kalaburagi (hardcoded data)
  |-- ComplaintPortal.jsx (no identity verification)
        |
        v (proxy via vite.config.js)
[ Flask Backend - localhost:5000 ]
  |-- /chat --> Supervisor Router (keyword scoring)
  |       |--> Analytics Agent  --> SQLite ZCQL (works)
  |       |--> Document Agent   --> TF-IDF RAG (weak, bypasses Catalyst KB)
  |       |--> Pattern Agent    --> basic grouping (partial)
  |       |--> Intelligence Agent --> HARDCODED mock data
  |       |--> General Agent    --> fallback
  |-- /api/tts --> Sarvam AI (KEY NOT SET, falls back to browser)
  |-- /api/mule_trail --> 3-node hardcoded JSON
  |-- /api/analytics --> real SQLite query (works)
  |-- /api/news --> Google News RSS only
  |-- No audit log
  |-- No session/JWT validation
        |
        v
[ SQLite - crime.db ]
  |-- CrimeStatistics (1387 rows, aggregate monthly data only)
  |-- No audit_log table
  |-- No suspects/transactions/network tables
        |
        v
[ Zoho Catalyst - UNDERUTILIZED ]
  |-- GLM-4.7-Flash (connected but only /glm/chat used)
  |-- Knowledge Base (crime31-42 PDFs indexed, NEVER CALLED)
  |-- RAG Pipeline (configured, NEVER CALLED)
  |-- Zia NLP (available, NEVER CALLED)
  |-- ConvoKraft (available, NEVER USED)
  |-- Signals (available, NEVER USED)
  |-- Auth (available, NEVER USED)
```

**Gap Score: ~35-40% compliant with problem statement.**

---

## Target State Architecture (Post All Phases)

```
[ Police Officer / Citizen ]
        |
        v
[ Slate - React Frontend (CDN, HTTPS) ]
  |-- Catalyst Auth (real JWT login, role-aware routing)
  |-- ConvoKraft Bot (multi-turn Kannada + English)
  |-- Dashboards (live ZCQL data, no hardcoding)
  |-- ComplaintPortal (Zia Identity Scanner e-KYC)
        |
        v (Catalyst API Gateway - rate limited, JWT enforced)
[ AppSail - Flask Backend ]
  |-- /chat --> Supervisor Router
  |       |--> Analytics Agent  --> ZCQL Data Store (+ audit log)
  |       |--> Document Agent   --> Catalyst Knowledge Base RAG (vector)
  |       |--> Pattern Agent    --> QuickML hotspot model endpoint
  |       |--> Intelligence Agent --> ZCQL NetworkEdges table
  |-- /api/tts --> Zia Text-to-Audio Synthesis
  |-- /api/translate --> Zia Text Translation (kn<->en)
  |-- /api/predict --> QuickML Time-Series Endpoint
  |-- /api/mule_trail --> ZCQL Suspects + Transactions query
  |-- /api/news --> SmartBrowz (JS-rendered scraping)
  |-- Signals publisher (threshold breach events)
        |
        v
[ Catalyst Cloud Scale ]
  |-- Data Store: CrimeStatistics + audit_log + Suspects + Transactions + NetworkEdges
  |-- Cache: Frequent query results
  |-- Auth: JWT sessions, role mapping
  |-- Security Rules: RBAC enforcement
  |-- Signals: Event bus -> Push Notification -> officer alert
        |
        v
[ Catalyst QuickML ]
  |-- Knowledge Base: crime PDFs (crime31-42, already indexed)
  |-- RAG Pipeline: vector search -> GLM-4.7 grounded answers
  |-- ML Pipeline: CrimeStatistics -> Time-Series model -> prediction endpoint
  |-- Auto ML: district threat classifier -> hotspot scores
        |
        v
[ Catalyst Zia ]
  |-- Text Translation: Kannada <-> English
  |-- Audio-to-Text: Kannada ASR
  |-- Text-to-Audio: Kannada + English TTS
  |-- Text Analytics: NER on FIR text
  |-- Identity Scanner: Aadhaar/PAN e-KYC on complaints
```

**Target Gap Score: ~85-90% compliant.**

---

## Phase Map

```
PHASE 1: Foundation Layer
  Module 1A — Audit Log         [routes.py + ZCQL]
  Module 1B — RAG Switch        [rag_engine.py + llm.py]
  Module 1C — Zia TTS           [routes.py /api/tts]
  Walkthrough -> walkthrough_ai/phase_1_walkthrough.md

        |
        v (depends on Phase 1 auth foundation)

PHASE 2: Identity & Context Layer
  Module 2A — Conversation History  [Chatbot.jsx + routes.py]
  Module 2B — Catalyst Auth + JWT   [Login.jsx + Flask middleware]
  Module 2C — API Gateway + RBAC    [Catalyst Security Rules]
  Walkthrough -> walkthrough_ai/phase_2_walkthrough.md

        |
        v (depends on Phase 2 session identity)

PHASE 3: Language & Voice Layer
  Module 3A — Kannada Translation Pipeline  [routes.py + translation_service.py]
  Module 3B — Kannada ASR Integration       [Chatbot.jsx + /api/asr]
  Walkthrough -> walkthrough_ai/phase_3_walkthrough.md

        |
        v (depends on Phase 1 data foundation)

PHASE 4: Intelligence & Prediction Layer
  Module 4A — QuickML Crime Prediction     [QuickML Pipeline + /api/predict]
  Module 4B — Hotspot Detection Model      [QuickML Auto ML + map integration]
  Module 4C — Signals Alert Pipeline       [Signals + Push Notifications]
  Walkthrough -> walkthrough_ai/phase_4_walkthrough.md

        |
        v (depends on Phase 2 identity for data access)

PHASE 5: Network Intelligence Layer
  Module 5A — ZCQL Network Tables          [Data Store schema]
  Module 5B — Real Mule Trail Queries      [routes.py /api/mule_trail]
  Module 5C — Zia NER on FIR Text         [ComplaintPortal.jsx + /api/ner]
  Walkthrough -> walkthrough_ai/phase_5_walkthrough.md
```

---

## Phase 1 — Foundation Layer

**Goal:** Fix the three lowest-risk, highest-return items without touching any architectural boundary.
**Dependency:** None. Can start immediately.
**Risk:** Very Low — all changes are additive.

### Module 1A — Audit Log Table

| Item | Detail |
|---|---|
| **Problem** | No record of who queried what. `grep audit` → 0 results. Explainable AI gap. |
| **Catalyst Service** | Cloud Scale Data Store (ZCQL) |
| **Fix** | Create `audit_log` table in crime.db. Add one INSERT after every `/chat` response. |
| **Fields** | `log_id`, `timestamp`, `user_id`, `query_text`, `agent_type`, `sql_generated`, `response_ms` |
| **Files** | `backend/routes.py` (INSERT call), `backend/app.py` (table creation) |
| **Closes** | Explainable AI + audit trails ⚠️ → ✅ |

### Module 1B — Switch RAG to Catalyst Knowledge Base

| Item | Detail |
|---|---|
| **Problem** | TF-IDF RAG is keyword-only. Crime PDFs already indexed in Catalyst KB (crime31-42). We are ignoring production vector search. |
| **Catalyst Service** | QuickML Knowledge Base + RAG Pipeline |
| **Fix** | In `rag_engine.py`, route Document Agent queries to `call_quickml_rag_answer()` in `llm.py` (already partially written). Disable TF-IDF path for document queries. |
| **Files** | `backend/rag_engine.py`, `backend/llm.py`, `backend/routes.py` |
| **Closes** | Document Agent quality: keyword → semantic vector |

### Module 1C — Zia TTS (Replace Sarvam)

| Item | Detail |
|---|---|
| **Problem** | `SARVAM_API_KEY = NOT SET`. `/api/tts` endpoint exists but always falls back to browser synthesis. |
| **Catalyst Service** | Zia Text-to-Audio Synthesis (QuickML Zia NLP) |
| **Fix** | Replace Sarvam API call in `/api/tts` route with Zia TTS endpoint. Same OAuth token. Same response format (base64 audio). |
| **Files** | `backend/routes.py` (/api/tts handler) |
| **Closes** | Voice-enabled interaction ⚠️ → ✅ (TTS side) |

**Phase 1 Walkthrough Output:** `walkthrough_ai/phase_1_walkthrough.md`
Documents: what changed, test results for each module, before/after response quality comparison.

---

## Phase 2 — Identity & Context Layer

**Goal:** Give the platform memory (conversation context) and real identity (JWT auth).
**Dependency:** Phase 1 complete (audit log must exist before auth logging).
**Risk:** Medium — touches auth flow and chat pipeline.

### Module 2A — Conversation History in Chat

| Item | Detail |
|---|---|
| **Problem** | `handleSend()` posts `{ query: text }` only. Each call is stateless. LLM has no memory of prior turns. |
| **Fix** | Pass `messages[]` array (last 6 turns) in POST body. Update `/chat` route to prepend history to GLM messages array. |
| **Files** | `frontend/src/components/Chatbot.jsx`, `backend/routes.py` |
| **Closes** | Context-aware conversations ❌ → ✅ |

### Module 2B — Catalyst Auth + JWT

| Item | Detail |
|---|---|
| **Problem** | Login.jsx has 30+ hardcoded accounts. Zero backend enforcement. URL navigation bypasses auth entirely. |
| **Catalyst Service** | Cloud Scale Authentication (Hosted/Embedded Login) |
| **Fix** | Replace Login.jsx fake auth with Catalyst Embedded Login SDK. Flask middleware validates JWT on every protected route. Role extracted from token claims. |
| **Files** | `frontend/src/components/Login.jsx`, `backend/app.py` (JWT middleware), `backend/routes.py` (role checks) |
| **Closes** | Role-based secure access ⚠️ → ✅ |

### Module 2C — API Gateway + Security Rules

| Item | Detail |
|---|---|
| **Problem** | Flask is directly exposed. No rate limiting. No platform-level enforcement. |
| **Catalyst Service** | API Gateway + Security Rules |
| **Fix** | Route all client requests through Catalyst API Gateway. Apply Security Rules for role-based data access. Rate limit `/chat` to prevent abuse. |
| **Files** | Catalyst console configuration + `frontend/src/vite.config.js` (proxy update) |
| **Closes** | Role-based secure access (platform enforcement layer) |

**Phase 2 Walkthrough Output:** `walkthrough_ai/phase_2_walkthrough.md`

---

## Phase 3 — Language & Voice Layer

**Goal:** Make Kannada work end-to-end — not just in UI labels but in the actual NL→SQL pipeline.
**Dependency:** Phase 1 (Zia TTS done), Phase 2 (session identity for language preference persistence).
**Risk:** Medium — adds a new processing step in the critical chat path.

### Module 3A — Kannada Translation Pipeline

| Item | Detail |
|---|---|
| **Problem** | LLM (GLM-4.7) and SQLite queries are English-only. Kannada input produces garbage output. |
| **Catalyst Service** | Zia Text Translation (kn→en pre-process, en→kn post-process) |
| **Fix** | Add `translation_service.py`. Detect query language. If Kannada: translate to English → run existing pipeline → translate response back to Kannada. Transparent to the rest of the system. |
| **Files** | `backend/translation_service.py` (new), `backend/routes.py` (/chat pre/post hooks) |
| **Closes** | Natural language chatbot (Kannada) ⚠️ → ✅ |

### Module 3B — Kannada ASR Integration

| Item | Detail |
|---|---|
| **Problem** | Browser Web Speech API (`kn-IN`) fails for Kannada. No server-side ASR. |
| **Catalyst Service** | Zia Audio-to-Text Transcription |
| **Fix** | Add `/api/asr` endpoint in Flask. Frontend sends audio blob → Zia ASR returns Kannada text → feeds into translation pipeline from 3A. |
| **Files** | `backend/routes.py` (/api/asr), `frontend/src/components/Chatbot.jsx` (mic recording) |
| **Closes** | Voice-enabled interaction ⚠️ → ✅ (ASR + TTS both covered) |

**Phase 3 Walkthrough Output:** `walkthrough_ai/phase_3_walkthrough.md`

---

## Phase 4 — Intelligence & Prediction Layer

**Goal:** Build the ML backbone — forecasting, hotspot scoring, and real-time alerts.
**Dependency:** Phase 1 (data foundation), Phase 2 (auth for secure model access).
**Risk:** Medium — requires QuickML pipeline training (platform-side, not code-side risk).

### Module 4A — QuickML Crime Prediction Model

| Item | Detail |
|---|---|
| **Problem** | Zero predictive code. `grep predict` → no results in backend. |
| **Catalyst Service** | QuickML Core ML Pipeline (Datasets → Pipelines → Models → Endpoints) |
| **Steps** | 1. Export `CrimeStatistics` as CSV. 2. Upload to QuickML Datasets. 3. Configure Time-Series Forecasting pipeline (crime_month + crime_year + crime_category → case_count). 4. Train + publish endpoint. 5. Add `/api/predict_crime` in Flask calling endpoint. |
| **Files** | `backend/routes.py` (/api/predict_crime), `frontend/src/` (Predictive Analytics panel) |
| **Closes** | Predictive analytics & early warnings ❌ → ✅ |

### Module 4B — Hotspot Detection Model

| Item | Detail |
|---|---|
| **Problem** | Map shows hardcoded district markers. No threat score per district. |
| **Catalyst Service** | QuickML Auto ML (classification: low/medium/high threat per district) |
| **Steps** | Train classifier on (district, category, year, case_count) → threat_level. Publish endpoint. Replace hardcoded map marker colors with model output. |
| **Files** | `backend/routes.py` (/api/hotspots), Dashboard JSX files (marker color logic) |
| **Closes** | Crime trend & hotspot detection ⚠️ → ✅ |

### Module 4C — Signals Alert Pipeline

| Item | Detail |
|---|---|
| **Problem** | No proactive alert system. Officers discover crime spikes manually. |
| **Catalyst Service** | Signals (event bus) + Push Notifications + Mail |
| **Fix** | When prediction endpoint returns case_count > threshold: publish Signals event → Catalyst Function picks up → sends Push Notification + Mail to duty officer for that district. |
| **Files** | New `backend/alert_service.py`, Catalyst Functions console |
| **Closes** | Proactive crime prevention intelligence ❌ → ✅ |

**Phase 4 Walkthrough Output:** `walkthrough_ai/phase_4_walkthrough.md`

---

## Phase 5 — Network Intelligence Layer

**Goal:** Replace all hardcoded mock data with real queryable ZCQL tables.
**Dependency:** Phase 2 (auth for sensitive data access), Phase 1 (audit logging for forensic queries).
**Risk:** Medium-High — requires data acquisition for meaningful network graphs.

### Module 5A — ZCQL Network Tables

| Item | Detail |
|---|---|
| **Problem** | No `Suspects`, `Transactions`, or `NetworkEdges` tables exist. All intelligence data is hardcoded. |
| **Catalyst Service** | Cloud Scale Data Store (ZCQL) |
| **Tables to Create** | `Suspects (id, name, phone, bank_account, upi_id, district)`, `Transactions (id, from_id, to_id, amount, date, method)`, `NetworkEdges (from_suspect_id, to_suspect_id, weight, edge_type)` |
| **Files** | `backend/app.py` (schema creation) |

### Module 5B — Real Mule Trail Queries

| Item | Detail |
|---|---|
| **Problem** | `/api/mule_trail` returns 3-node hardcoded JSON (Rajesh→Kavita→Amit). |
| **Fix** | Replace with ZCQL query on `NetworkEdges JOIN Suspects`. Frontend graph renders the same way — no frontend change needed. |
| **Files** | `backend/routes.py` (/api/mule_trail) |
| **Closes** | Criminal network visualization ⚠️ → ✅ (when data populated) |

### Module 5C — Zia NER on FIR Text

| Item | Detail |
|---|---|
| **Problem** | `ComplaintPortal.jsx` is a static form. Suspect names/locations typed manually. |
| **Catalyst Service** | Zia Text Analytics (Named Entity Recognition) |
| **Fix** | When officer types incident description, call `/api/ner` → Zia NER → extract names, locations, dates → auto-populate suspect and location fields. |
| **Files** | `backend/routes.py` (/api/ner), `frontend/src/components/ComplaintPortal.jsx` |
| **Closes** | Behavioral profiling (partial — pattern extraction from FIR text) |

**Phase 5 Walkthrough Output:** `walkthrough_ai/phase_5_walkthrough.md`

---

## Walkthrough Documentation Protocol

After completing each phase, create the corresponding walkthrough file in `walkthrough_ai/`:

```
walkthrough_ai/
|-- problem_statement_eval_01.md   (existing — baseline eval)
|-- walkthrough.md                 (existing — initial setup)
|-- phase_1_walkthrough.md         (Phase 1 findings)
|-- phase_2_walkthrough.md         (Phase 2 findings)
|-- phase_3_walkthrough.md         (Phase 3 findings)
|-- phase_4_walkthrough.md         (Phase 4 findings)
|-- phase_5_walkthrough.md         (Phase 5 findings)
```

Each walkthrough must contain:
1. **Modules completed** — checklist
2. **Test evidence** — API responses, screenshots, before/after comparison
3. **Compliance delta** — which problem statement items moved from PARTIAL/NOT MET to SATISFIED
4. **Issues found** — anything that broke or required deviation from this plan
5. **Next phase dependencies** — what must be true before starting the next phase

---

## Compliance Projection

| Phase | Features Fixed | Projected Compliance Score |
|---|---|---|
| Baseline | — | ~35-40% |
| After Phase 1 | RAG quality + TTS + Audit log | ~50% |
| After Phase 2 | Context-aware chat + Real Auth | ~65% |
| After Phase 3 | Kannada end-to-end | ~75% |
| After Phase 4 | Prediction + Hotspots + Alerts | ~85% |
| After Phase 5 | Network Intelligence + NER | ~90%+ |

---

## Module Dependency Graph

```
Phase 1 (Foundation)
    |
    +---> Phase 2 (Identity & Context)
    |           |
    |           +---> Phase 3 (Language & Voice)
    |           |
    |           +---> Phase 5 (Network Intelligence)
    |
    +---> Phase 4 (Prediction & Alerts)
              (parallel to Phase 3, depends on Phase 1 data only)
```

Phases 3 and 4 can run in parallel after Phases 1 and 2 are complete.
Phase 5 requires Phase 2 (auth) to protect sensitive network data.

---

## Reference Files

| File | Location | Purpose |
|---|---|---|
| `problem_statement.txt` | `data_for_ai/` | Original requirements |
| `problem_statement_eval_01.md` | `walkthrough_ai/` | Baseline gap analysis |
| `master_analysis.md` | `data_for_ai/` | Full platform + project analysis |
| `additional_services.md` | `zoho_data/` | DevOps, SmartBrowz, ConvoKraft, Signals, Slate |
| `Quick_ml.md` | `zoho_data/` | QuickML RAG + Pipeline + Zia NLP |
| `cloud_scale.md` | `zoho_data/` | Data Store, Auth, Cache, Signals |
| `Zai.md` | `zoho_data/` | Zia AI services (Face, OCR, NER, Identity) |
| `serverless_module.md` | `zoho_data/` | Functions, AppSail, Security Rules |
