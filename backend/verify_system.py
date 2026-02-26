import requests
import json

BASE_URL = "http://localhost:8000"

def test_chat():
    print("Testing Chatbot...")
    url = f"{BASE_URL}/api/chat/student"
    payload = {"message": "Tell me about Sona College", "language": "en"}
    try:
        r = requests.post(url, json=payload)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
    except Exception as e:
        print(f"Failed: {e}")

def test_upload():
    print("\nTesting Upload...")
    # Create dummy pdf
    with open("test_doc.pdf", "wb") as f:
        f.write(b"%PDF-1.4 mock content")
    
    url = f"{BASE_URL}/api/documents/upload/2023CS001"
    files = {"file": ("test_doc.pdf", open("test_doc.pdf", "rb"), "application/pdf")}
    try:
        r = requests.post(url, files=files)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    test_chat()
    test_upload()
