"""
Quick Test Script - Zoho Catalyst QuickML RAG Answer API
Spec (from Zoho Console):
  URL:     https://console.catalyst.zoho.in/quickml/v1/project/<PROJECT_ID>/rag/answer
  Method:  POST
  Headers: { "CATALYST-ORG": "<org>", "Authorization": "Zoho-oauthtoken <token>" }
  Body:    { "query": "<message>", "documents": [<array-of-document-ids>] }

Run from backend dir:
  python test_rag_api.py
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import json
import requests
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv(Path(__file__).parent / ".env", override=True)

CATALYST_PROJECT_ID   = os.getenv("CATALYST_PROJECT_ID", "54626000000013049")
CATALYST_ORG_ID       = os.getenv("CATALYST_ORG_ID", "60077159195")
CATALYST_ACCESS_TOKEN = os.getenv("CATALYST_ACCESS_TOKEN", "")

# Correct endpoint (console.catalyst.zoho.in — NOT api.catalyst.zoho.in)
RAG_ANSWER_URL = (
    f"https://console.catalyst.zoho.in/quickml/v1/project/{CATALYST_PROJECT_ID}/rag/answer"
)
RAG_DOCS_URL = (
    f"https://console.catalyst.zoho.in/quickml/v1/project/{CATALYST_PROJECT_ID}/rag/document"
)

HEADERS = {
    "Authorization": f"Zoho-oauthtoken {CATALYST_ACCESS_TOKEN}",
    "CATALYST-ORG": str(CATALYST_ORG_ID),
    "Content-Type": "application/json"
}

# ── Helpers ───────────────────────────────────────────────────────────────────
BLUE  = "\033[94m"
GREEN = "\033[92m"
RED   = "\033[91m"
CYAN  = "\033[96m"
BOLD  = "\033[1m"
RESET = "\033[0m"

def print_header(text):
    print(f"\n{BOLD}{BLUE}{'='*60}{RESET}")
    print(f"{BOLD}{BLUE}  {text}{RESET}")
    print(f"{BOLD}{BLUE}{'='*60}{RESET}")

def print_section(label, value):
    print(f"\n{CYAN}{BOLD}  >> {label}:{RESET}")
    print(f"    {value}")

# ── Step 1: Fetch Document IDs ────────────────────────────────────────────────
def fetch_document_ids() -> list:
    print(f"\n  {CYAN}Fetching document list from Catalyst RAG knowledge base...{RESET}")
    try:
        resp = requests.get(RAG_DOCS_URL, headers=HEADERS, timeout=20)
        print(f"  Status: {resp.status_code}")
        if resp.ok:
            data = resp.json()
            print(f"  Raw docs response: {json.dumps(data, indent=2)[:600]}")
            docs = data.get("data", data.get("documents", []))
            ids = [
                doc.get("id") or doc.get("document_id") or doc
                for doc in docs
            ]
            return ids
        else:
            print(f"  {RED}Failed to list docs: {resp.status_code} — {resp.text[:300]}{RESET}")
            return []
    except Exception as e:
        print(f"  {RED}Error: {e}{RESET}")
        return []

# ── Step 2: Query RAG Answer API ──────────────────────────────────────────────
def call_rag_answer(query: str, doc_ids: list) -> dict:
    payload = {
        "query": query,
        "documents": doc_ids
    }
    print_section("Request Payload", json.dumps(payload, indent=4)[:400])
    try:
        resp = requests.post(RAG_ANSWER_URL, headers=HEADERS, json=payload, timeout=30)
        return {
            "status_code": resp.status_code,
            "ok": resp.ok,
            "raw_text": resp.text,
            "json": resp.json() if resp.headers.get("Content-Type", "").startswith("application/json") else {}
        }
    except requests.exceptions.Timeout:
        return {"status_code": 0, "ok": False, "raw_text": "TIMEOUT > 30s", "json": {}}
    except Exception as e:
        return {"status_code": 0, "ok": False, "raw_text": str(e), "json": {}}

def extract_answer(res_json: dict) -> str:
    ans = (
        res_json.get("answer") or
        res_json.get("response") or
        res_json.get("result") or
        res_json.get("output") or
        (res_json.get("data") or {}).get("answer") or
        (res_json.get("data") or {}).get("response")
    )
    return str(ans).strip() if ans else "[No recognised answer field in response]"

# ── Main ──────────────────────────────────────────────────────────────────────
TEST_QUERIES = [
    "What is the Zero FIR procedure in Karnataka Police?",
    "What is the UPI fraud golden window procedure?",
    "How does the KSP Sentinel chatbot assist police officers?",
]

def main():
    print_header("KSP Sentinel — Catalyst QuickML RAG Answer API Test")
    print(f"\n  {BOLD}Endpoint:{RESET}  {RAG_ANSWER_URL}")
    print(f"  {BOLD}Project:{RESET}   {CATALYST_PROJECT_ID}")
    print(f"  {BOLD}Org ID:{RESET}    {CATALYST_ORG_ID}")
    print(f"  {BOLD}Token:{RESET}     {CATALYST_ACCESS_TOKEN[:30] if CATALYST_ACCESS_TOKEN else 'NOT SET'}...")

    # Step 1: Get document IDs
    print_header("STEP 1 — Listing Documents in RAG Knowledge Base")
    doc_ids = fetch_document_ids()
    if doc_ids:
        print(f"\n  {GREEN}{BOLD}Found {len(doc_ids)} document(s):{RESET}")
        for d in doc_ids:
            print(f"    - {d}")
    else:
        print(f"\n  {RED}No documents found. Using empty list for query test...{RESET}")

    # Step 2: Test queries
    print_header("STEP 2 — Testing RAG Answer Queries")
    for i, query in enumerate(TEST_QUERIES, 1):
        print(f"\n{BOLD}{'-'*60}{RESET}")
        print(f"{BOLD}  TEST {i}: {query}{RESET}")
        print(f"{'-'*60}")

        result = call_rag_answer(query, doc_ids)
        status_color = GREEN if result["ok"] else RED
        print_section("HTTP Status", f"{status_color}{BOLD}{result['status_code']}{RESET}")

        if result["ok"]:
            print_section("Raw JSON Response", json.dumps(result["json"], indent=4)[:1500])
            answer = extract_answer(result["json"])
            print(f"\n  {GREEN}{BOLD}[OK] EXTRACTED ANSWER:{RESET}")
            print(f"  {answer[:800]}")
        else:
            print(f"\n  {RED}{BOLD}[FAIL] ERROR:{RESET}")
            print(f"  {result['raw_text'][:500]}")
            if result["status_code"] == 401:
                print(f"\n  {RED}(!) Token EXPIRED. Re-generate from Zoho Catalyst and update .env{RESET}")
            elif result["status_code"] == 403:
                print(f"\n  {RED}(!) FORBIDDEN. Check CATALYST_ORG_ID or project permissions.{RESET}")

    print(f"\n\n{BOLD}{BLUE}{'='*60}{RESET}")
    print(f"{BOLD}{GREEN}  Test Run Complete.{RESET}")
    print(f"{BOLD}{BLUE}{'='*60}{RESET}\n")

if __name__ == "__main__":
    main()
