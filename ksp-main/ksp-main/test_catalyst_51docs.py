import sys, io, json, requests, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / 'backend' / '.env', override=True)
TOKEN = os.getenv('CATALYST_ACCESS_TOKEN')
ORG   = os.getenv('CATALYST_ORG_ID')
PID   = os.getenv('CATALYST_PROJECT_ID')

HEADERS = {
    'Authorization': f'Zoho-oauthtoken {TOKEN}',
    'CATALYST-ORG': str(ORG),
    'Content-Type': 'application/json'
}

URL = f'https://console.catalyst.zoho.in/quickml/v1/project/{PID}/rag/answer'

ALL_DOCS = [
    "3407000000004223","3407000000003546","3407000000004461","3407000000004473",
    "3407000000004469","3407000000004465","3407000000003542","3407000000003527",
    "3407000000003502","3407000000004439","3407000000003512","3407000000003506",
    "3407000000003507","3407000000003520","3407000000003500","3407000000003486",
    "3407000000003483","3407000000003476","3407000000004391","3407000000003470",
    "3407000000003464","3407000000003462","3407000000003458","3407000000003444",
    "3407000000003451","3407000000003445","3407000000003446","3407000000004377",
    "3407000000003422","3407000000004365","3407000000003417","3407000000003414",
    "3407000000004361","3407000000003410","3407000000004369","3407000000003405",
    "3407000000003399","3407000000003397","3407000000004339","3407000000003382",
    "3407000000004335","3407000000003355","3407000000004320","3407000000004300",
    "3407000000003363","3407000000003346","3407000000004315","3407000000004308",
    "3407000000004304","3407000000003343","3407000000003351"
]

print(f"Total documents: {len(ALL_DOCS)}")
print(f"Token (first 20): {TOKEN[:20] if TOKEN else 'MISSING'}...")
print()

queries = [
    "What are the contents of the documents in the knowledge base?",
    "FIR procedure Karnataka police",
    "Crime statistics Karnataka 2024",
]

for q in queries:
    r = requests.post(URL, headers=HEADERS, json={'query': q, 'documents': ALL_DOCS}, timeout=30)
    try:
        data = r.json()
        nodes = len(data.get('retrieved_nodes', []))
        resp  = data.get('response', '')
    except Exception:
        nodes = 0
        resp  = r.text[:200]

    print(f"[{r.status_code}] nodes={nodes}")
    print(f"Query : {q[:60]}")
    print(f"Answer: {resp[:300]}")
    print()
