import os
from dotenv import load_dotenv
import requests
import json
import sys
from config import Config

def test_glm():
    load_dotenv()
    
    project_id = Config.CATALYST_PROJECT_ID
    org_id = Config.CATALYST_ORG_ID
    access_token = Config.CATALYST_ACCESS_TOKEN
    
    if not all([project_id, org_id, access_token]):
        print("Missing environment variables!")
        sys.exit(1)
        
    print(f"DEBUG: Loaded token starting with {access_token[:10]}...")
        
    url = f"https://api.catalyst.zoho.in/quickml/v1/project/{project_id}/glm/chat"
    headers = {
        "Authorization": f"Zoho-oauthtoken {access_token}",
        "CATALYST-ORG": str(org_id),
        "Content-Type": "application/json",
        "Environment": "Development"
    }
    
    messages = [
        {"role": "user", "content": "Reply with only the word SUCCESS."}
    ]
    
    payload = {
        "model": "crm-di-glm47b_30b_it",
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 10
    }
    
    print(f"URL: {url}")
    print(f"Headers: CATALYST-ORG={org_id}")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        print(f"HTTP Status Code: {response.status_code}")
        
        response.raise_for_status()
        print("Full JSON response:")
        print(json.dumps(response.json(), indent=2))
        
    except requests.exceptions.Timeout as e:
        print(f"Timeout Error: {e}")
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e}")
        if response.status_code in (401, 403):
            print("Authentication Error! Please check access token and org id.")
        print(response.text)
    except requests.exceptions.RequestException as e:
        print(f"Network Error: {e}")
    except json.JSONDecodeError as e:
        print(f"JSON Parse Error: {e}")
        print(f"Raw Response: {response.text}")

if __name__ == "__main__":
    test_glm()
