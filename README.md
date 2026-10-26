# 🛡️ KSP Sentinel AI — Datathon Finals Build (Chatbot, Guardrails & Document RAG)

> **Finals submission for the Karnataka State Police (KSP) Datathon 2026.**
> A standalone React chatbot with a Node.js backend for crime-data questions, adding guardrails, conversation memory, a crime-pattern engine and a document RAG pipeline on top of the main [KSP Sentinel AI](https://github.com/Srinivasanrj/ksp-drishti) platform.

⚠️ *Hackathon prototype built on datathon-provided and synthetic data. It is not an official Karnataka State Police product.*

---

## 📸 Screenshots

<!-- Add the chatbot, the chart modal and one portal screen here. -->
_Coming soon._

---

## ✨ What's in this build

### 🤖 Chat backend (Node.js + Express)
| Service | What it does |
| :--- | :--- |
| `chatService.js` | Orchestrates each request: guardrails → context resolution → intent → data/pattern lookup → LLM answer → memory |
| `guardrailService.js` | Deterministic checks: input validation, out-of-scope detection, prompt-injection detection, evidence validation and output grounding |
| `memoryService.js` | Per-conversation memory so follow-up questions ("what about last year?") keep context |
| `crimePatternService.js` | Queries the crime-pattern engine over a 2,000-record crime dataset |
| `llmService.js` | Calls the Zoho Catalyst QuickML GLM model, with server-side OAuth token refresh |

### 📄 Document RAG pipeline (`ksp_document_rag_pipeline/`)
- Ingests PDF, TXT, CSV, JSON and images; images go through Zoho Catalyst Zia OCR
- Overlapping sliding-window chunking and term-based (BM25-style) passage ranking
- Query classifier that separates general crime questions from document-specific ones
- Extracts FIR fields (FIR number, accused, sections, location, dates) from the retrieved text
- Session-isolated indexes for multiple users
- Implemented in both **Python** and **Node.js**

### 🖥️ Frontend (React 19 + Vite)
- `Chatbot.jsx`: the main assistant UI with division context
- `ChartAnalysisModal.jsx`: bar, pie, doughnut and trend charts with PNG/PDF export
- Citizen e-complaint, police-initiated complaint and passport-verification portals
- Database connector and registered-cases views

### ✅ Scenario tests
Node scripts that check guardrails, context robustness, evidence grounding and follow-up handling:
`test_all_10_scenarios.js`, `test_guardrails.js`, `test_context_robustness.js`, `test_evidence_grounding.js`, `test_followup_scenarios.js`

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Chart.js, Leaflet, jsPDF, GSAP, Lucide |
| **Backend** | Node.js, Express 5 |
| **AI / LLM** | Zoho Catalyst QuickML (GLM), Zoho Catalyst Zia OCR |
| **RAG** | Custom chunker + term-based retriever (Python and Node.js) |

---

## 📁 Repository Structure

```
datathon/
├── chatbot-ui-standalone/chatbot-ui-standalone/   # Finals build (this README)
│   ├── src/                       # React app: components, crime-pattern engine, datasets
│   ├── server/                    # Express API
│   │   ├── index.js               # API entry point (port 5000)
│   │   ├── routes/chat.js
│   │   ├── services/              # chat, guardrail, memory, crimePattern, llm
│   │   └── test_*.js              # Scenario tests
│   ├── ksp_document_rag_pipeline/ # Document RAG pipeline (Python + Node.js)
│   ├── e-complaint/, POLICE-INITIATED COMPLAINT/, passport_verification/
│   ├── ipc_dataset/               # Karnataka IPC crimes 2025 (CSV)
│   └── package.json
└── ksp-main/                      # Snapshot of the main platform (see ksp-drishti)
```

---

## 🚀 Running Locally

**Prerequisites:** Node.js 18+, and Zoho Catalyst credentials for the LLM.

```bash
cd chatbot-ui-standalone/chatbot-ui-standalone
npm install
```

Create a `.env` file in that folder:

```
CATALYST_CLIENT_ID=your_client_id
CATALYST_CLIENT_SECRET=your_client_secret
CATALYST_REFRESH_TOKEN=your_refresh_token
CATALYST_PROJECT_ID=your_project_id
CATALYST_ORG_ID=your_org_id
```

Then, in two terminals:

```bash
npm run server     # API on http://localhost:5000  (health check: /api/health)
npm run dev        # UI on http://localhost:5173
```

Run a scenario test:

```bash
node server/test_guardrails.js
```

---

## 👥 Team & My Contribution

Built as a team for the **KSP Datathon 2026** finals.

**My contribution:** [Fill in what you personally built, e.g. "Built the guardrail service and scenario tests, and the document RAG pipeline."]

**Teammates:** [Name — role], [Name — role]

---

## 📄 License

Built for the KSP Datathon 2026 for educational and demonstration purposes. Datasets belong to their respective providers.
