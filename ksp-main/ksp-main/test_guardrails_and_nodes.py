import requests, json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

URL = 'http://127.0.0.1:5000/chat'

def test_query(q):
    print(f"=== TEST QUERY: '{q}' ===")
    r = requests.post(URL, json={'query': q}, timeout=60)
    data = r.json()
    print("Agent Type :", data.get("agent_type"))
    print("Agent Label:", data.get("agent_label"))
    print("Answer     :\n", data.get("answer", "")[:400])
    print("Nodes Count:", len(data.get("retrieved_nodes", [])))
    if data.get("retrieved_nodes"):
        print("First Node :", data.get("retrieved_nodes")[0])
    print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    test_query("1+1")
    test_query("Who is Mark Zuckerberg?")
    test_query("What are the crime statistics reported for Karnataka in 2024 according to the official documents?")
