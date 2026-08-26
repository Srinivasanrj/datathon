# 🧠 KSP Sentinel AI: Supervisor Agent Role & Multi-Intent Routing Architecture

> **Purpose:** Define the exact operational role of the **Supervisor Agent Orchestrator**, detailing how it handles explicit slash commands/buttons, multi-intent hybrid queries, execution sequencing, and response formatting.

---

## 🎯 Core Roles of the Supervisor Agent

The **Supervisor Agent** acts as the **Smart Traffic Controller, Execution Sequencer, and Response Format Designer** for the entire platform. It operates under 3 primary modes:

```
                              [User Prompt & Upload]
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
           [Explicit Slash Command / Button]   [Natural Language Prompt]
                         │                             │
                         ▼                             ▼
              [Direct Fast Dispatch]           [Smart Intent Detection]
                     (0ms)                             │
                                         ┌─────────────┴─────────────┐
                                         ▼                           ▼
                                  [Single Intent]             [Multi-Intent / Dual Agent]
                                  (Direct Agent)              (Sequential Pipeline & Format)
```

---

## 🛠️ Detailed Operational Modes

### Mode 1: Fast Direct Dispatch (Explicit Command / Button Trigger)
* **Trigger:** User clicks a UI Agent Button (e.g. `📊 Analytics Mode`, `🔍 Interrogation Mode`, `📄 Document Mode`) OR types a slash command (`\analytics`, `\pattern`, `\document`).
* **Supervisor Action:**
  - Bypasses LLM semantic classification completely (**0ms router latency**).
  - Routes 100% directly to the selected target agent.

---

### Mode 2: Multi-Intent Detection & Execution Sequencing (Dual-Agent Scenario)
* **Scenario:** An officer activates `\analytics` or clicks Analytics mode, BUT their prompt contains **two distinct requests**:
  - *Example Prompt:* `"Compare cyber crime cases in 2024 vs 2025 and also summarize the standard procedure for investigating cyber fraud from the SOP document."*
* **Supervisor Action:**
  1. **Intent Recognition:** Identifies that this prompt requires **BOTH** `analytics_agent` (for statistical numbers/charts) AND `document_agent` (for SOP executive report summary).
  2. **Execution Sequencing (Order Determination):**
     - **Step 1:** Run `analytics_agent` $\rightarrow$ Execute SQL & compute YoY trend + generate chart data.
     - **Step 2:** Run `document_agent` $\rightarrow$ Query Zoho Catalyst RAG Knowledge Base for SOP executive summary.
  3. **Response Layout & Format Design:** Orders the response into a clean, structured dual-section layout so the officer gets the exact answers in proper logical hierarchy:

```markdown
### 📊 Statistical Analysis & Chart Insights
* [YoY Cyber Crime Growth Table & Interactive Chart]

---

### 📄 SOP Document Summary & Executive Guidelines
* [Summary of 2-Hour Golden Window & Bank Account Freezing Procedure]
```

---

### Mode 3: Domain Guardrail Intercept (Security Policy Enforcement)
* **Scenario:** User asks a non-police or out-of-bounds question (e.g., *"1+1"*, *"Who is Mark Zuckerberg?"*).
* **Supervisor Action:**
  - Instantly blocks execution.
  - Returns `🛡️ KSP Sentinel AI Domain Guardrail Notice`.

---

## 📊 Summary of Supervisor Agent Responsibilities

| Query Type | Input Example | Supervisor Action | Execution Path | Response Latency |
| :--- | :--- | :--- | :--- | :--- |
| **Explicit Tag** | `\analytics` + question | Direct Fast Route | `analytics_agent` only | ~2–3s |
| **Single Intent** | *"What is Zero FIR procedure?"* | Keyword / Semantic Route | `general_agent` only | ~2–4s |
| **Multi-Intent** | *"Show cyber stats AND summarize SOP"* | Dual Orchestrator & Sequencer | `analytics_agent` $\rightarrow$ `document_agent` $\rightarrow$ Synthesizer | ~4–6s |
| **Case Narrative** | Crime story upload | Direct Interrogation Route | `pattern_agent` only | ~3–5s |
| **Off-Topic** | *"Bake a cake recipe"* | Guardrail Intercept | `guardrail_agent` (Refusal) | ~0.1s |

---

## ✋ User Review Required

Please review this specification of the **Supervisor Agent's role**. Once you approve, I can integrate this smart orchestrator logic into `backend/routes.py` and `backend/prompts.py`!
