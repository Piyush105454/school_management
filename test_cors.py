import requests

url = "https://school-management-i29n.onrender.com/api/auth/token/"
headers = {
    "Origin": "https://school-management-orpin-theta.vercel.app",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type",
}

try:
    print(f"Testing OPTIONS request to {url}...")
    response = requests.options(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response Headers:")
    for key, value in response.headers.items():
        print(f"  {key}: {value}")
except Exception as e:
    print(f"Error: {e}")
