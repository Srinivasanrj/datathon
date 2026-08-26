import requests, json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

URL = 'http://127.0.0.1:5000/chat'

def test_backslash_trigger():
    q = r"\document a breiof summary regarding crime in bengaluru urban divison on 2024"
    print(f"=== TESTING USER QUERY: '{q}' ===")
    r = requests.post(URL, json={'query': q}, timeout=60)
    data = r.json()
    print("Agent Type :", data.get("agent_type"))
    print("Agent Label:", data.get("agent_label"))
    print("Nodes Count:", len(data.get("retrieved_nodes", [])))
    print("Answer     :\n", data.get("answer", "")[:400])

if __name__ == "__main__":
    test_backslash_trigger()
