# Implementation Plan: Structured RAG Responses, Node Citations, & Police Domain Guardrails

## 1. Executive Summary & Problem Diagnosis

Based on your feedback, we are solving **three critical production requirements**:

1. **Elimination of Internal Reasoning Leakage:**
   - *Problem:* GLM outputted internal scratchpad text like *"Wait, looking at the database data {"1": 1}. This is extremely sparse. It might be a test to see if I hallucinate numbers..."*
   - *Solution:* Enhanced `_clean_glm_response()` with robust regex pattern matching to completely strip internal monologues, `<think>` tags, and draft notes before presenting to the officer.

2. **Zoho Console-Style Structured Response Format + `retrieved_nodes` Metadata:**
   - *Problem:* Responses were unstructured text walls without formal sections or structured source metadata.
   - *Solution:* Standardize answers into clean Zoho Console markdown sections (Executive Summary, Key Findings/Components, Operational Guidelines/Benefits) AND include a structured `retrieved_nodes` array in the JSON API payload containing `document_title`, `document_id`, and `content`.

3. **Strict Domain Guardrails Layer (Police & Law Enforcement Boundary):**
   - *Problem:* The system could theoretically respond to off-topic questions (e.g. `1+1`, `Who is Mark Zuckerberg?`, recipes, general pop culture).
   - *Solution:* Implement a **Domain Guardrail Filter** inside the `Supervisor Router`. Out-of-domain queries will be politely rejected with an official security notice:
     > `🛡️ KSP Sentinel AI Guardrail: This platform is restricted to Karnataka State Police operations, crime analytics, RAG knowledge store documents, and law enforcement procedures. Please ask a police-related or dataset query.`

---

## 2. Technical Implementation Architecture

```
                          ┌──────────────────────────┐
                          │    USER QUERY INGESTION  │
                          └────────────┬─────────────┘
                                       │
                         ┌─────────────▼─────────────┐
                         │   SUPERVISOR GUARDRAIL    │
                         │ (Domain Boundary Check)   │
                         └─────────────┬─────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            │                                                     │
[OFF-TOPIC / NON-POLICE QUERY]                       [POLICE / DATA DATASET QUERY]
(e.g., "1+1", "Mark Zuckerberg")                     (e.g., "Crime statistics 2024")
            │                                                     │
┌───────────▼───────────┐                             ┌───────────▼───────────┐
│  POLICE GUARDRAIL     │                             │ SPECIALIST AGENTS     │
│  REFUSAL RESPONSE     │                             │ (Analytics / RAG)     │
└───────────────────────┘                             └───────────┬───────────┘
                                                                  │
                                                      ┌───────────▼───────────┐
                                                      │  RESPONSE FORMATTER   │
                                                      │ (Zoho Structured Style│
                                                      │ + retrieved_nodes)    │
                                                      └───────────────────────┘
```

---

## 3. Detailed Solution Breakdown

### **Component A: Strict Police Domain Guardrail (`routes.py`)**

Update `supervisor_agent_router()` with a pre-classification Domain Filter.

If a query is detected as off-topic (math calculations like `1+1`, pop culture like `Mark Zuckerberg`, general web trivia, entertainment):
- Route directly to `guardrail_refusal`.
- Output:
  ```json
  {
    "success": true,
    "answer": "🛡️ **KSP Sentinel AI Guardrail Notice:**\nThis system is restricted exclusively to Karnataka State Police command operations, SCRB crime analytics, RAG knowledge store documents, and law enforcement procedures.\n\nPlease submit a query related to crime statistics, police SOPs, FIR records, or uploaded evidence datasets.",
    "agent_type": "general_agent",
    "agent_label": "🛡️ KSP Guardrail Policy",
    "routing_confidence": 1.0
  }
  ```

---

### **Component B: Clean Monologue Stripper (`llm.py`)**

Upgrade `_clean_glm_response()` in `llm.py`:
- Use multi-stage regex to catch markers like `Wait, looking at...`, `Revised Final Output:`, `Draft 1:`, `It might be a test to see if I...`, and `<think>`.
- Extract **only** the clean, polished output string.

---

### **Component C: Zoho Console-Style Structured Output + `retrieved_nodes`**

1. **Prompt Template Update (`prompts.py`):**
   Instruct the RAG response generator to structure answers with:
   - **1. Executive Summary:** Direct high-level answer.
   - **2. Key Findings & Statistics:** Bulleted breakdown.
   - **3. Operational Guidance & Takeaways:** Actionable insights.

2. **JSON API Response Payload (`routes.py`):**
   Include `retrieved_nodes` array in the JSON response matching the Zoho Console schema:
   ```json
   {
     "success": true,
     "answer": "...",
     "retrieved_nodes": [
       {
         "document_title": "Crime in Karnataka 2024 - PCW SCRB Report",
         "document_id": "3407000000004223",
         "content": "Excerpt snippet..."
       }
     ]
   }
   ```

---

## 4. Verification Plan

Once approved, we will test 3 distinct scenarios:

1. **Domain Guardrail Test:** Send `"What is 1+1?"` or `"Who is Mark Zuckerberg?"` → Verify it returns the official **Guardrail Refusal Notice**.
2. **Monologue Leak Test:** Send `"What are the crime statistics reported for Karnataka in 2024 according to the official documents?"` → Verify **NO `Wait, ...` scratchpad text** appears anywhere in the output.
3. **Zoho Structured Format & Nodes Test:** Verify the output contains clean markdown sections (Executive Summary, Key Findings) and the JSON response contains `retrieved_nodes`.

---

> [!IMPORTANT]
> **Please review the plan above. If you approve, reply with "Proceed" to implement the Domain Guardrails and Structured RAG Format!**
