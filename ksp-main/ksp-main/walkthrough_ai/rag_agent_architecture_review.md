# Architecture Review: KSP Sentinel AI Systems

You are assuming multi-agent swarms and advanced RAG are isolated features, but applying strict hierarchical Row-Level Security (RLS) to unstructured vector databases is notoriously difficult and will leak sensitive data if not architected correctly. If Division A cannot see Division B's data, simple semantic search will bypass application logic unless metadata pre-filtering is strictly enforced at the vector store level before the LLM ever touches the context.

## 1. Multi-Agent Orchestration
A flat multi-agent swarm will fail here due to latency and token limits. You need a **Hierarchical Supervisor Architecture** (Agentic Router). 
*   **Supervisor Agent**: Receives the query, extracts intent, and routes it.
*   **Investigator Agent (SQL)**: Translates natural language to SQL for relational data (e.g., crime counts, hotspot coordinates).
*   **Analyst Agent (RAG)**: Queries vector stores for unstructured text (SOPs, Modus Operandi).
*   **Synthesis Agent**: Merges the SQL output and Vector output into a final cohesive response.

## 2. Hierarchical Access Control (Guardrails)
I understand your RBAC requirement perfectly. You are describing **Multi-Tenant Row-Level Security (RLS)**.
`[Certain]` You cannot enforce access control by simply telling the LLM "do not show Division B data." The LLM is easily jailbroken. 
*   **Implementation**: The access control must happen at the database query level. Every API call the user makes must carry their `Division_ID` in a JWT token. 
*   **SQL Guardrail**: `WHERE Police_Station IN (SELECT Station FROM Hierarchy WHERE Division = JWT.Division)`.
*   **Vector Guardrail**: You must use a Vector Database that supports metadata filtering (like Milvus or Qdrant). The RAG query must explicitly pass `filter={"division": JWT.Division}`. If the vector store lacks metadata filtering, you cannot securely deploy this chatbot.

## 3. RAG Architecture Market Analysis
Here are the primary RAG paradigms available, ordered by complexity:

1. **Naive RAG (Vector-Only)**
   *   *Mechanism*: Chunks text -> Embeds -> Cosine similarity search -> LLM generation.
   *   *Flaw*: Cannot answer "Count the number of cases" or "What is the trend?".
2. **Hybrid Search RAG**
   *   *Mechanism*: Combines dense vector search (semantic) with sparse keyword search (BM25/Elasticsearch).
   *   *Flaw*: Still struggles heavily with purely relational math and joins.
3. **Graph RAG**
   *   *Mechanism*: Converts text into a Knowledge Graph (Entities and Relationships) before searching.
   *   *Flaw*: Massive overhead to build the graph. Overkill for simple crime count tracking.
4. **Self-Reflective RAG (CRAG/Self-RAG)**
   *   *Mechanism*: The LLM scores the retrieved documents. If they are irrelevant, it rewrites the query and searches the web or DB again before answering.
   *   *Flaw*: High latency.
5. **Agentic RAG (Tool-Augmented Retrieval)**
   *   *Mechanism*: The LLM is given tools (SQL Database, Vector Database, REST APIs). It writes a plan, decides which database to query based on the prompt, executes the code, and synthesizes the result.

## 4. Best Fit for KSP Sentinel
`[Likely]` The only viable architecture for this problem statement is **Agentic RAG**. 

**Why:** Police queries are split 50/50 between structured math ("How many murders in Bengaluru last year?") and unstructured semantic analysis ("Find cases where the suspect used a specific poison"). 
*   If you use Naive RAG, the math queries fail.
*   If you use Text-to-SQL, the semantic queries fail.
*   **Agentic RAG** intercepts the query, looks at the user's JWT token for the `Division_ID` guardrail, routes math queries to the Relational DB using ZCQL/SQL, routes semantic queries to the Vector DB with metadata filters, and returns a unified, securely scoped answer.
