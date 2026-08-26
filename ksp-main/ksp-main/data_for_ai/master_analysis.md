# KSP Sentinel — Master Analysis Document

> **[SCRIBE] Mode Active**
> Author: KSP Sentinel AI Advisor
> Last Updated: 2026-07-24
> Scope: Full project analysis — current state, platform capabilities, gap closure strategy

---

## Part 1 — Project Understanding

### What KSP Sentinel Is

KSP Sentinel is a conversational AI command platform built for the Karnataka State Police (SCRB).
It targets investigators and divisional officers who need to query crime data, review documents,
trace money mule networks, and monitor live intelligence — all through a single interface.

### Tech Stack (Current)

| Layer | Technology | Status |
|---|---|---|
| Frontend | Vite + React, Leaflet, jsPDF, Lucide | Running (dev only, port 5173) |
| Backend | Flask + SQLite, Blueprint routes | Running (port 5000) |
| LLM | Zoho Catalyst GLM-4.7-Flash | Connected via OAuth token |
| RAG | Custom TF-IDF (JSON store) | Functional but weak |
| Voice | Browser Web Speech API + Sarvam AI fallback | Partial (Sarvam key not set) |
| Auth | Client-side mock (Login.jsx) | No server enforcement |
| Deployment | Local only | Not production-ready |

### Supervisor Agent Architecture

The backend uses a keyword-scored routing system to classify each query into one of five agents:

```
Query Input
    |
    v
[Supervisor Router] -- keyword scoring
    |
    +---> Analytics Agent    (SQL queries on CrimeStatistics)
    +---> Document Agent     (TF-IDF RAG on uploaded PDFs)
    +---> Pattern Agent      (subcategory/year grouping)
    +---> Intelligence Agent (mule trail -- currently hardcoded demo)
    `---> General Agent      (fallback)
```

### Database Schema (CrimeStatistics — SQLite)

| Column | Type | Notes |
|---|---|---|
| crime_month | TEXT | Month name |
| crime_year | INTEGER | Year (2022-2026) |
| crime_category | TEXT | e.g. Cyber Crimes, Theft |
| crime_subcategory | TEXT | Subcategory label |
| case_count | INTEGER | Aggregate count |

Total rows: ~1,387. No station-level, accused, victim, or demographic columns.
This is the single largest structural constraint on the platform.

---

## Part 2 — Problem Statement Evaluation [EVAL]

Source: `data_for_ai/problem_statement.txt`
Evaluation Date: 2026-07-24

### Intelligence Goals

| Goal | Verdict | Root Cause of Failure |
|---|---|---|
| Crime pattern discovery | PARTIAL | Only keyword + year grouping. No clustering algorithm. |
| Criminal network analysis | NOT MET | Mule trail is 3-node hardcoded mock data. No graph engine. |
| Socio-demographic insights | NOT MET | Dataset has no demographic columns. |
| Behavioral profiling | NOT MET | No accused records. No ML profiling model. |
| Proactive crime prevention intelligence | NOT MET | Zero predictive model code in backend. |

**Score: 0/5 fully met. 1/5 partial. 4/5 not met.**

### Key Features

| Feature | Verdict | Evidence |
|---|---|---|
| Natural language chatbot (English) | SATISFIED | /chat -> GLM intent extraction -> SQL -> answer works end-to-end |
| Natural language chatbot (Kannada) | PARTIAL | UI says Kannada; LLM pipeline is English-only; Sarvam key unset |
| Voice-enabled interaction | PARTIAL | Browser STT/TTS works; Sarvam ASR not integrated |
| Context-aware conversations | NOT MET | handleSend() posts only { query: text }. History never sent to backend. |
| PDF export of conversation history | SATISFIED | jsPDF integrated and functional in Chatbot.jsx |
| Criminal network visualization | PARTIAL | Graph UI renders; data is hardcoded (Rajesh -> Kavita -> Amit) |
| Crime trend and hotspot detection | PARTIAL | Real aggregated data returned; no spatial clustering algorithm |
| Predictive analytics and early warnings | NOT MET | No ML model, no forecasting, no alert system |
| Explainable AI with audit trails | PARTIAL | SQL + intent in JSON response; no formal audit log per user |
| Role-based secure access | PARTIAL | 30+ accounts in Login.jsx; zero backend auth enforcement |

**Score: 2/10 fully satisfied. 5/10 partial. 3/10 not met.**

**Overall Compliance: ~35-40% of stated requirements are verifiably functional.**

### Two Root Causes Behind Most Failures

**Root Cause 1 — Dataset Gap:**
The crime data is monthly aggregate-level. No individual case / accused / victim / station records exist.
This alone blocks: behavioral profiling, socio-demographics, real network analysis.

**Root Cause 2 — Architectural Gaps:**
Context management (stateless chat), auth enforcement (client-only), and predictive models were not implemented.
These require engineering work independent of the data gap.

---

## Part 3 — Zoho Catalyst Platform Capability Map

Source: `zoho_data/` directory (all 6 AKB documents)
Project: KSPCrimeIntell (Project ID: 54626000000013049, Org: 60077159195)

### Module A: QuickML (AI/ML Brain)

| Service | Capability | Current Usage |
|---|---|---|
| LLM Serving | GLM-4.7-Flash + Qwen 3.6-35B Vision active. Qwen 2.5 deprecated July 31 2026. | Connected — only /glm/chat used |
| RAG Pipeline | Upload docs -> Knowledge Base -> vector search -> grounded LLM answer | Crime PDFs already uploaded (crime 31-42). NEVER called from frontend. |
| Knowledge Base | Vectorized doc store with Doc IDs confirmed live | Populated but bypassed by custom TF-IDF |
| Core ML Pipeline | Datasets -> Pipelines -> Models -> REST Endpoints | Empty. No models trained. |
| Zia NLP | Text-to-Audio, Audio-to-Text, Text Translation (Indian languages) | TTS endpoint /api/tts exists; Sarvam used instead |

> **Key Finding:** Crime PDFs are already indexed in the Catalyst Knowledge Base.
> We are ignoring a production-grade vector RAG and running an inferior TF-IDF system instead. `[Certain]`

### Module B: Zia AI (Computer Vision + NLP)

| Service | Capability | KSP Use Case | Priority |
|---|---|---|---|
| Face Analytics | Age, gender, emotion, advanced facial detection | Suspect identification, crowd analytics | HIGH |
| OCR | Printed + handwritten text from images | FIR document digitization | HIGH |
| Identity Scanner (e-KYC) | Aadhaar, PAN, Passbook, Cheque parsing | Complainant ID verification | HIGH |
| Text Analytics | Sentiment + NER + Keyword Extraction | FIR text analysis, named suspect/location extraction | HIGH |
| Auto ML | Custom tabular ML model training | Crime prediction model | HIGH |
| Image Moderation | NSFW / violence / gore detection | Evidence image screening | MEDIUM |
| Object Recognition | Bounding box + multi-class object detection | Vehicle/weapon tagging | MEDIUM |
| Barcode Scanner | QR code and barcode parsing | Document/vehicle QR scanning | LOW |

**Current Usage: None. Zero Zia services called from backend or frontend.**

### Module C: Cloud Scale (Infrastructure)

| Service | Status in Project | Gap |
|---|---|---|
| Data Store (ZCQL) | CrimeStatistics table live, 1387 rows | No station/case/accused tables. |
| NoSQL | Available | Not used. |
| Cache (Segments) | Default segment exists | Not used. Every query hits DB cold. |
| API Gateway | Available | Not used. Flask directly exposed, no rate limiting. |
| Authentication | Hosted + Embedded login available | Not used. Fake client-side auth in Login.jsx. |
| Search | Full-text search on indexed columns | CREATORID indexed. Crime category search not enabled. |
| Cron | Scheduled job execution available | Not used. No automated reports or data refresh. |
| Connections | OAuth credential vault | Token hardcoded in .env. Not using Connections. |
| Mail / Push | Native notifications | Not used. No alerts system. |
| Stratus | S3-compatible object storage | Not used. No evidence file storage. |

### Module D: Serverless (Compute)

| Component | Purpose | Current Status |
|---|---|---|
| Functions (FaaS) | Python/Node/Java event-driven endpoints | Not used. Flask handles everything locally. |
| AppSail | Long-running managed backend hosting | Not used. Flask runs on dev machine only. |
| Security Rules | RBAC at platform level | Not used. Would replace fake client-side auth. |

### Module E: Additional Services

| Service | What It Is | Highest KSP Value |
|---|---|---|
| DevOps | Monitoring, CI/CD integration, testing console | Alert when GLM fails / latency spikes in production |
| SmartBrowz | Cloud headless browser (Chromium) | Scrape JS-rendered news portals; render dashboards to PDF |
| ConvoKraft | Native LLM-backed bot builder with session state | Replace stateless /chat — gets context-aware conversations |
| Signals | Serverless event bus (publish-subscribe) | Crime alert pipeline: threshold breach -> event -> Push notification |
| Slate | CDN hosting for React/SPA applications | Production deploy of frontend. Replaces npm run dev. |

---

## Part 4 — Gap Closure Strategy

### Priority 1 — Quick Wins (Low Effort, High Compliance Gain)

#### 1A. Switch RAG to Catalyst Knowledge Base
- **Current:** Custom TF-IDF (JSON store, keyword-only match)
- **Fix:** Replace rag_engine.py calls with Catalyst QuickML RAG API
- **Impact:** Document agent quality jumps from keyword-match to semantic vector search
- **Effort:** 1-2 days
- **Files:** rag_engine.py, llm.py (call_quickml_rag_answer already partially written)

#### 1B. Add Audit Log Table
- **Current:** No audit trail (grep audit -> 0 results in backend)
- **Fix:** Add audit_log table to crime.db. Log user_id, timestamp, query, sql_generated, agent_type.
- **Impact:** Closes Explainable AI / audit trail gap
- **Effort:** 0.5 days
- **Files:** routes.py, app.py

#### 1C. Pass Conversation History to Backend
- **Current:** handleSend() posts only { query: text } — stateless
- **Fix:** Pass last N messages as context array; update /chat to include history in LLM messages
- **Impact:** Closes context-aware conversations gap
- **Effort:** 0.5 days
- **Files:** Chatbot.jsx, routes.py

#### 1D. Deploy Frontend to Slate + Backend to AppSail
- **Current:** npm run dev localhost:5173, Flask localhost:5000
- **Fix:** npm run build -> Slate upload. Flask -> AppSail deploy.
- **Impact:** Production-ready deployment with HTTPS and CDN
- **Effort:** 1 day

### Priority 2 — Medium Effort, Critical Compliance Gaps

#### 2A. Kannada NL Pipeline via Zia Translation
- **Fix:** Add pre-processing in /chat: detect Kannada -> Zia Translation (kn->en) -> process -> translate response back (en->kn)
- **Impact:** Closes Kannada chatbot requirement
- **Effort:** 2-3 days
- **Files:** routes.py, new translation_service.py

#### 2B. Real Auth via Catalyst Authentication + Security Rules
- **Fix:** Integrate Catalyst Hosted Auth. JWT on login. Validate token on every Flask route. Role-based data access.
- **Impact:** Closes Role-based secure access gap
- **Effort:** 3-4 days

#### 2C. Signals-based Crime Alert Pipeline
- **Fix:** Emit Signals event when case_count threshold exceeded. Function sends Push + Mail to duty officer.
- **Impact:** Closes Proactive crime prevention intelligence gap
- **Effort:** 2-3 days

### Priority 3 — High Effort, Architectural Changes

#### 3A. QuickML Crime Prediction Model
- Upload CrimeStatistics CSV to QuickML Datasets
- Pipeline: Time-Series Forecasting (crime_month + crime_year -> case_count per category)
- Publish as REST endpoint -> /api/predict_crime in Flask
- **Impact:** Closes Predictive analytics and early warnings gap
- **Effort:** 3-5 days

#### 3B. Real Criminal Network Data
- Create Data Store tables: Suspects, Transactions, NetworkEdges
- Build graph from ZCQL queries, replace hardcoded mule trail
- **Impact:** Closes Criminal network analysis gap
- **Effort:** 5-7 days (data acquisition is the bottleneck)

#### 3C. Zia Text Analytics on FIR Processing
- FIR text submitted -> Zia NER -> extract suspect names, locations, dates -> auto-populate fields
- **Impact:** Partial closure of Behavioral profiling gap
- **Effort:** 2 days

---

## Part 5 — Full Catalyst-Native Architecture (Target State)

```
[ Karnataka Police Officer / Citizen ]
              |
              v
     [ Slate — React Frontend ]         <- replaces npm run dev
              |
    +---------+----------+
    v                    v
[ConvoKraft Bot]    [AppSail — Flask]    <- replaces local Flask
(Kannada + English)       |
    |             +-------+------+------------------+
    |             v      v                          v
    |    [QuickML RAG] [Data Store]   [QuickML Endpoint]
    |    (Crime PDFs)  (ZCQL Queries) (Crime Prediction)
    |            |      |
    |            +------+----> [Signals Event Bus]
    |                               |
    |                    +----------+----------+
    |                    v                     v
    |         [Functions: Zia NLP]   [Mail / Push Alert]
    |         (NER, Translation)     (Early Warning)
    |
    +--> [SmartBrowz] (JS-rendered news scraping)
    +--> [Zia Identity Scanner] (e-Complaint KYC verification)
    +--> [DevOps] (Monitoring + Alerts + CI/CD)
```

---

## Part 6 — Decision Log

| Decision | Chosen Approach | Rejected Alternative | Reason |
|---|---|---|---|
| RAG Engine | Catalyst Knowledge Base (vector) | Custom TF-IDF | Crime PDFs already indexed; vector search is semantically superior |
| Voice / TTS | Zia NLP (via QuickML) | Sarvam AI | Sarvam key unset; Zia is in-platform with Indian language support |
| Auth | Catalyst Hosted Auth + JWT | Client-side mock | Security requirement; client-side auth has zero enforcement |
| Chat Context | Conversation history in POST body | localStorage only | Backend must see history for LLM to maintain context |
| Bot Platform | ConvoKraft | Custom stateless endpoint | Native session management; no custom session store code needed |
| Prediction | QuickML Time-Series Pipeline | ARIMA in Python | Managed platform; no ML dependency install; REST endpoint output |
| Hosting | Slate + AppSail | Local dev server | Production requirement; HTTPS, CDN, uptime monitoring included |
| Alert System | Signals + Push Notifications | Polling / cron | Event-driven correct model; polling creates unnecessary DB load |

---

## Part 7 — Files Reference Map

### Backend (`D:\DATATHON\DATATHON\backend\`)

| File | Purpose | Key Issue |
|---|---|---|
| routes.py | All API endpoints + Supervisor Agent router | Stateless chat, no audit log, no auth enforcement |
| llm.py | GLM-4.7 + RAG API calls | call_quickml_rag_answer partially built but not used by RAG engine |
| rag_engine.py | Custom TF-IDF vector store | Should be replaced by Catalyst Knowledge Base calls |
| config.py | OAuth token + project config | Token in .env, no Connections vault usage |
| query_engine.py | SQL generation from parsed intent | Works correctly for English queries |
| prompts.py | System prompts for GLM | Intent extraction + answer formatting prompts |
| mcp_social_server.py | RSS news feed aggregator | Google News RSS only — misses JS-rendered pages |

### Frontend (`D:\DATATHON\DATATHON\frontend\src\`)

| File | Purpose | Key Issue |
|---|---|---|
| components/Chatbot.jsx | Main chat interface | Sends only { query: text } — history never forwarded to backend |
| components/Login.jsx | Auth with 30+ accounts | Zero server-side enforcement |
| components/BengaluruHeadDashboard.jsx | Division dashboard | Hardcoded static data, not live ZCQL |
| components/ComplaintPortal.jsx | e-Complaint FIR intake | No Zia Identity Scanner integration |

---

## Appendix — Confidence Tags

All assessments in this document carry confidence ratings per advisor protocol:

- `[Certain]` — Verified from code or UI screenshots directly
- `[Likely]` — Inferred from strong indirect evidence  
- `[Possible]` — Reasonable hypothesis, not yet verified
- `[Speculative]` — Requires external knowledge or access to confirm
