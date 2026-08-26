import os
from app import create_app
import json

def test_full_pipeline():
    print("Initializing Flask test client...")
    app = create_app()
    client = app.test_client()
    
    query = "How many murders happened in January 2024?"
    print(f"\nSending query to /chat: '{query}'")
    
    payload = {"query": query}
    
    try:
        response = client.post('/chat', json=payload)
        print(f"\nStatus Code: {response.status_code}")
        
        # Pretty print the JSON response
        data = response.get_json()
        print("\nFull JSON Response:")
        print(json.dumps(data, indent=2))
        
        if response.status_code == 200 and data.get("success"):
            print("\n[PASSED] PIPELINE TEST PASSED! The API successfully processed the query.")
        else:
            print("\n[FAILED] PIPELINE TEST FAILED!")
            
    except Exception as e:
        print(f"\n[ERROR] ERROR during test: {e}")

if __name__ == "__main__":
    test_full_pipeline()
