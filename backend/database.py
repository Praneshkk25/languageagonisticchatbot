import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize Firebase Admin SDK
class MockCollection:
    def __init__(self, name):
        self.name = name
    def add(self, data):
        print(f"[MOCK DB] Added to {self.name}: {data}")
        class MockRef:
            id = "mock-id-123"
        return None, MockRef()
    def where(self, field, op, val):
        return self
    def stream(self):
        return []
    def document(self, doc_id):
        class MockDocRef:
            def get(self):
                class MockDoc:
                    exists = False
                    def to_dict(self): return {}
                return MockDoc()
            def update(self, data):
                print(f"[MOCK DB] Updated {doc_id} with {data}")
        return MockDocRef()

class MockFirestore:
    def collection(self, name):
        return MockCollection(name)

db = None
if os.path.exists("serviceAccountKey.json"):
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
        db = firestore.client()
    except Exception as e:
        print(f"[ERROR] Failed to initialize Firebase: {e}")
        db = MockFirestore()
else:
    print("[WARNING] serviceAccountKey.json not found. Using Mock Firestore.")
    db = MockFirestore()
