import requests
import time
import sys

BASE_URL = "http://117.252.16.130:8001"

def test_root():
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"GET /: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"GET / failed: {e}")

def test_sync_schemes():
    try:
        response = requests.post(f"{BASE_URL}/admin/sync-gov-schemes")
        print(f"POST /admin/sync-gov-schemes: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"POST /admin/sync-gov-schemes failed: {e}")

def test_get_schemes():
    try:
        response = requests.get(f"{BASE_URL}/schemes")
        print(f"GET /schemes: {response.status_code} - {response.json()}")
        return response.json().get("items", [])
    except Exception as e:
        print(f"GET /schemes failed: {e}")
        return []

def test_get_scheme_detail(scheme_id):
    try:
        response = requests.get(f"{BASE_URL}/schemes/{scheme_id}")
        print(f"GET /schemes/{scheme_id}: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"GET /schemes/{scheme_id} failed: {e}")

if __name__ == "__main__":
    print("Waiting for server to start...")
    time.sleep(5) # Give the server some time to start up
    
    print("Running Tests...")
    test_root()
    test_sync_schemes()
    # Wait a bit for the sync to complete (it's synchronous in our implementation but good practice)
    time.sleep(1) 
    items = test_get_schemes()
    if items:
        first_id = items[0]['id']
        test_get_scheme_detail(first_id)
    else:
        print("No items found to test detail view.")
