import requests

urls = [
    "https://school-management-w3yt.onrender.com/",
    "https://school-management-w3yt.onrender.com/admin/",
    "https://school-management-w3yt.onrender.com/api/auth/token/",
]

for url in urls:
    try:
        print(f"Checking {url}...")
        response = requests.get(url, timeout=10)
        print(f"  Status: {response.status_code}")
        # print(f"  Content: {response.text[:200]}...") # Keep it short
    except Exception as e:
        print(f"  Error checking {url}: {e}")

# Special check for POST on token
try:
    url = "https://school-management-w3yt.onrender.com/api/auth/token/"
    print(f"Checking POST to {url}...")
    response = requests.post(url, json={}, timeout=10)
    print(f"  Status: {response.status_code}")
    print(f"  Content: {response.text[:200]}...")
except Exception as e:
    print(f"  Error checking POST {url}: {e}")
