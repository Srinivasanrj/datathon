# Chatbot Refactoring Implementation Plan

This plan addresses the memory failure modes. Per your requirement, we will execute this plan sequentially, starting with Phase 1.

## User Review Required
> [!IMPORTANT]
> Please review the specific code modifications outlined for Phase 1. If you approve, I will begin modifying `Chatbot.jsx` and `routes.py`.

## Proposed Changes

### Phase 1: Context Memory (Session State Extraction)

Currently, the Chatbot sends a single scalar string `{"query": "hi"}`. We will update the frontend to pass the conversation history, and update the backend to extract a continuous "Session State" from that history.

#### [MODIFY] [Chatbot.jsx](file:///D:/DATATHON/DATATHON/frontend/src/components/Chatbot.jsx)
- **Change:** Update the `fetch('/chat')` payload around line 222.
- **Detail:** Extract the last 5 turns from the React `messages` state. Map them into an array `[{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]` and include it in the POST body alongside the `query`.

#### [MODIFY] [routes.py](file:///D:/DATATHON/DATATHON/backend/routes.py)
- **Change:** Update `chat()` endpoint to accept the `history` array.
- **Detail:** Extract the `history` array from the JSON payload. Pass this array into `supervisor_agent_router()` and subsequently to the intent extraction logic.

#### [MODIFY] [prompts.py](file:///D:/DATATHON/DATATHON/backend/prompts.py)
- **Change:** Update `INTENT_EXTRACTION_PROMPT`.
- **Detail:** Inject the `history` array into the prompt context. Instruct the LLM to output a unified JSON state object (e.g., `{"active_district": "Bengaluru", "active_timeframe": "2025"}`) by cross-referencing the user's latest query with their historical context.

---

### Phase 2: Temporal Query Engine (SQL Generation)
*(To be executed only after Phase 1 is verified)*

#### [MODIFY] [query_engine.py](file:///D:/DATATHON/DATATHON/backend/query_engine.py)
- **Change:** Rewrite Text-to-SQL builder functions (`get_crime_count`, `compare_years`).
- **Detail:** If the LLM's extracted state contains `group_by: "month"`, dynamically append `GROUP BY Month` to the SQL query to generate time-series arrays for comparisons, instead of collapsing them into single scalar totals.

---

## Verification Plan
1. **Automated Testing:** Run `python -c "import requests... POST /chat"` with a conversation history payload testing multi-turn inheritance.
2. **Manual Verification:** Open the Vite frontend and perform a multi-turn conversation (Turn 1: "Filter by Bengaluru", Turn 2: "What about robberies?"). Verify the bot retains the Bengaluru context without explicitly repeating it.
