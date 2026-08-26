import requests, json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

URL = 'http://127.0.0.1:5000/chat'

def test_query(title, q):
    print(f"=== TEST: {title} ===")
    r = requests.post(URL, json={'query': q}, timeout=60)
    data = r.json()
    print("Agent Type :", data.get("agent_type"))
    print("Agent Label:", data.get("agent_label"))
    print("Answer     :\n", data.get("answer", ""))
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    test_query(
        "GENERAL AGENT - FIR Definition",
        "What is FIR according to official police procedure and law?"
    )
    
    test_query(
        "PATTERN AGENT - Interrogation & Case Narrative Co-Pilot",
        "According to the complaint lodged by the victim 'B' at the police station, accused 'A' committed a physical assault behind the bus stand. The only witness present was 'C'. Accused 'A' fled. I am now heading to witness 'C's house for questioning. I have prepared 3 questions to ask 'C'. What should my interrogation strategy and next moves be?"
    )
