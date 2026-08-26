import os
import requests
import json
import sys

def get_token_and_test(client_id, client_secret, refresh_token=None, grant_token=None):
    # 1. Get OAuth Token
    token_url = "https://accounts.zoho.in/oauth/v2/token"
    
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
    }
    
    if refresh_token:
        data["refresh_token"] = refresh_token
        data["grant_type"] = "refresh_token"
    elif grant_token:
        data["code"] = grant_token
        data["grant_type"] = "authorization_code"
    else:
        print("Need either refresh_token or grant_token")
        return
        
    print("Fetching new access token from Zoho...")
    resp = requests.post(token_url, data=data)
    token_data = resp.json()
    
    if "access_token" not in token_data:
        print("Failed to get token:")
        print(json.dumps(token_data, indent=2))
        return
        
    access_token = token_data["access_token"]
    print(f"Successfully got access token: {access_token[:10]}...")
    
    # 2. Test GLM API
    project_id = "54626000000013049"
    org_id = "60077159195"
    
    url = f"https://api.catalyst.zoho.in/quickml/v1/project/{project_id}/glm/chat"
    headers = {
        "Authorization": f"Zoho-oauthtoken {access_token}",
        "CATALYST-ORG": org_id,
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "crm-di-glm47b_30b_it",
        "messages": [{"role": "user", "content": "Reply with only the word SUCCESS."}],
        "temperature": 0.2,
        "max_tokens": 10
    }
    
    print("\nTesting GLM endpoint...")
    api_resp = requests.post(url, headers=headers, json=payload)
    print(f"Status Code: {api_resp.status_code}")
    
    if api_resp.status_code == 200:
        print("SUCCESS! The API works.")
        print(json.dumps(api_resp.json(), indent=2))
        
        # Save to .env automatically
        env_path = os.path.join(os.path.dirname(__file__), ".env")
        with open(env_path, "r") as f:
            lines = f.readlines()
            
        with open(env_path, "w") as f:
            for line in lines:
                if line.startswith("CATALYST_ACCESS_TOKEN="):
                    f.write(f"CATALYST_ACCESS_TOKEN={access_token}\n")
                else:
                    f.write(line)
        print("\nUpdated .env with the working token!")
    else:
        print("FAILED to call GLM endpoint.")
        print(api_resp.text)

if __name__ == "__main__":
    print("=== Zoho Catalyst Token Generator & Tester ===")
    client_id = input("Enter Client ID: ").strip()
    client_secret = input("Enter Client Secret: ").strip()
    grant_token = input("Enter Grant Token (from API Console): ").strip()
    
    get_token_and_test(client_id, client_secret, grant_token=grant_token)
