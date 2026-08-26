# [EVAL] Problem Statement vs. Project Reality

> **Mode:** Evaluation · **Source:** `problem_statement.txt` vs. live codebase
> **Verdict key:** ✅ SATISFIED · ⚠️ PARTIAL · ❌ NOT MET

---

## The Missed Premise (Read First)

The problem statement says "1100+ police stations." The current SQLite database has **1,387 rows** of aggregated monthly crime-category totals — **no police station column, no individual case records, no accused/victim records.** The core data model does not reflect the problem scope. Everything downstream is limited by this gap. `[Certain]`

---

## Intelligence Goals (5 Required)

| # | Goal | Verdict | Evidence |
|---|------|---------|----------|
| 1 | Crime pattern discovery | ⚠️ PARTIAL | `/api/pattern_match` does subcategory + year grouping from SQLite. No clustering, no frequency analysis algorithm. `[Certain]` |
| 2 | Criminal network analysis | ❌ NOT MET | `/api/mule_trail` returns **hardcoded 3-node mock data** (Rajesh → Kavita → Amit). No real transaction graph, no graph DB, no centrality/community detection. `[Certain]` |
| 3 | Socio-demographic insights | ❌ NOT MET | CrimeStatistics table has columns: Month, Year, Crime_Category, Subcategory, Cases. **No demographics** (age, gender, caste, income). Queries for demographics return nothing. `[Certain]` |
| 4 | Behavioral profiling | ❌ NOT MET | No accused/perpetrator records in dataset. No behavioral model. No repeat-offender tracking. `[Certain]` |
| 5 | Proactive crime prevention intelligence | ❌ NOT MET | Zero predictive model code found in backend (`grep predict` → no results). Historical trend queries exist but forward forecasting does not. `[Certain]` |

**Intelligence Goals Score: 1/5 fully met, 1/5 partial, 3/5 not met.**

---

## Key Features (9 Required)

| # | Feature | Verdict | Evidence |
|---|---------|---------|----------|
| 1 | Natural language chatbot (English) | ✅ SATISFIED | `/chat` accepts NL queries, extracts intent via GLM-4.7B, runs dynamic SQL, returns answers. English works end-to-end. `[Certain]` |
| 2 | Natural language chatbot (Kannada) | ⚠️ PARTIAL | STT locale set to `kn-IN` via Web Speech API. Welcome message has Kannada text. **But** the LLM (GLM-4.7B) is not Kannada-native, the SQLite queries are English-only, and Sarvam AI key is not configured. Kannada NL → SQL pipeline does **not** function end-to-end. `[Certain]` |
| 3 | Voice-enabled interaction | ⚠️ PARTIAL | Browser Web Speech API (STT + TTS) works in Chrome/Edge. Sarvam TTS endpoint called at `/api/tts` with fallback to browser synthesis. Sarvam STT is not integrated — only browser recognition used. No offline voice. `[Likely]` |
| 4 | Context-aware conversations | ❌ NOT MET | `handleSend()` posts `{ query: text }` — **only the current message is sent to the backend.** No conversation history in the payload. Each query is stateless. The chat history stored in `localStorage` is never forwarded to the LLM. `[Certain]` |
| 5 | PDF export of conversation history | ✅ SATISFIED | `jsPDF` integrated in `Chatbot.jsx`. Export button generates a structured PDF of the chat transcript. `[Certain]` |
| 6 | Criminal network visualization | ⚠️ PARTIAL | Frontend renders the mule trail as a graph. Data is mock-hardcoded in `routes.py`. Visualization layer works; intelligence layer does not. `[Certain]` |
| 7 | Crime trend & hotspot detection | ⚠️ PARTIAL | `/api/analytics` returns real aggregated data from SQLite. Map shows Karnataka markers with hardcoded district coordinates. **No spatial clustering algorithm** (DBSCAN, kernel density), no dynamic hotspot computation. `[Certain]` |
| 8 | Predictive analytics & early warnings | ❌ NOT MET | No ML model, no time-series forecasting, no anomaly detection, no alerting threshold. Zero prediction code found in backend. `[Certain]` |
| 9 | Explainable AI with audit trails | ⚠️ PARTIAL | Chat response JSON includes `sql`, `intent`, `routing_confidence` fields — that's query-level explainability. **No formal audit log** (who queried what, when, from which role). `grep audit` → no results. `[Certain]` |
| 10 | Role-based secure access | ⚠️ PARTIAL | Login.jsx has username/password + role mapping for 30+ stations. Dashboard routing works by division. **All auth is client-side** — no JWT, no server session, no backend validation. Anyone can bypass the login by navigating directly to routes. `[Certain]` |

**Key Features Score: 2/9 fully satisfied, 5/9 partial, 2/9 not met.**

---

## Root Cause Summary

All six "NOT MET" items share two root causes:

1. **Dataset gap**: The crime data is monthly aggregate-level. Individual case/accused/victim records are absent. This alone blocks behavioral profiling, socio-demographics, and real network analysis.

2. **Architectural gaps**: Context management (stateless chat), auth enforcement (client-only), and predictive models were not implemented — these require separate engineering work, not data.

---

## Prioritized Fix List

| Priority | Item | Effort |
|----------|------|--------|
| 🔴 Critical | Pass conversation history in `/chat` payload (context-awareness) | Low — 2-line frontend change + backend session store |
| 🔴 Critical | Server-side session/JWT auth (RBAC enforcement) | Medium |
| 🟡 High | Audit log per query (user ID, timestamp, query, SQL generated) | Low — add SQLite `audit_log` table in routes.py |
| 🟡 High | Kannada NL processing (translate → English → SQL → translate back) | Medium — add `IndicTrans2` or Sarvam translate API call |
| 🟠 Medium | Real mule trail data ingestion pipeline | High — requires transaction data |
| 🟠 Medium | Hotspot detection (DBSCAN or kernel density on lat/lon data) | Medium — needs geocoded case data |
| ⚪ Low | Predictive model (ARIMA/Prophet on monthly crime series) | Medium — data exists for time-series, just not used |

---

> **Overall Project Compliance: ~35–40% of stated requirements are verifiably functional.**
> The platform has a strong UI shell and a working NL→SQL pipeline for English queries.
> The gap between stated and actual capability is large and concentrated in the data layer, not the UI layer.
