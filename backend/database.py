import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
import datetime
import uuid

# Persistent Mock Database for testing
class MockDoc:
    def __init__(self, doc_id, data):
        self.id = doc_id
        self.exists = True
        self._data = data
    def to_dict(self):
        return self._data

class MockDocRef:
    def __init__(self, collection_name, doc_id, db_instance):
        self.collection_name = collection_name
        self.id = doc_id
        self.db = db_instance
    def get(self):
        data = self.db._get_doc(self.collection_name, self.id)
        if data is None:
            class NonExistentDoc:
                exists = False
                id = self.id
                def to_dict(self): return {}
            return NonExistentDoc()
        return MockDoc(self.id, data)
    def update(self, data):
        self.db._update_doc(self.collection_name, self.id, data)
    def set(self, data):
        self.db._set_doc(self.collection_name, self.id, data)

class MockCollection:
    def __init__(self, name, db_instance):
        self.name = name
        self.db = db_instance
        self.filters = []
    def add(self, data):
        doc_id = self.db._add_doc(self.name, data)
        class MockRef:
            id = doc_id
        return None, MockRef()
    def document(self, doc_id):
        return MockDocRef(self.name, doc_id, self.db)
    def where(self, field, op, val):
        self.filters.append((field, op, val))
        return self
    def stream(self):
        docs = self.db._get_collection(self.name)
        results = []
        for doc_id, data in docs.items():
            match = True
            for field, op, val in self.filters:
                doc_val = data.get(field)
                if op == "==":
                    if doc_val != val:
                        match = False
                        break
                elif op == "in":
                    if doc_val not in val:
                        match = False
                        break
            if match:
                results.append(MockDoc(doc_id, data))
        self.filters = []  # Reset filters after stream
        return results

class MockFirestore:
    def __init__(self):
        self.filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mock_db.json")
        self.data = {}
        self.load()
        self.seed_if_empty()
    def load(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
            except Exception as e:
                print(f"[MOCK DB ERROR] Failed to load mock_db.json: {e}")
                self.data = {}
        else:
            self.data = {}
    def save(self):
        try:
            def serialize_datetime(obj):
                if isinstance(obj, dict):
                    return {k: serialize_datetime(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [serialize_datetime(v) for v in obj]
                elif isinstance(obj, datetime.datetime):
                    return obj.isoformat()
                return obj
            serialized = serialize_datetime(self.data)
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(serialized, f, indent=4)
        except Exception as e:
            print(f"[MOCK DB ERROR] Failed to save mock_db.json: {e}")
    def seed_if_empty(self):
        dirty = False
        if "students" not in self.data:
            self.data["students"] = {
                "2023CS001": {
                    "name": "Student Demo",
                    "admission_no": "2023CS001",
                    "dob": "2000-01-01",
                    "cgpa": 9.2,
                    "department": "CSE",
                    "year": 3,
                    "family_income": 250000.0,
                    "attendance_pct": 85,
                    "lectures_attended": 34,
                    "lectures_total": 40,
                    "labs_attended": 10,
                    "labs_total": 15,
                    "study_hours": 12.5
                },
                "2023CS002": {
                    "name": "Alex Smith",
                    "admission_no": "2023CS002",
                    "dob": "2001-02-15",
                    "cgpa": 7.8,
                    "department": "ECE",
                    "year": 2,
                    "family_income": 400000.0,
                    "attendance_pct": 72,
                    "lectures_attended": 28,
                    "lectures_total": 40,
                    "labs_attended": 11,
                    "labs_total": 15,
                    "study_hours": 9.5
                }
            }
            dirty = True
        if "activity_logs" not in self.data:
            self.data["activity_logs"] = {}
            dirty = True
        if "documents" not in self.data:
            self.data["documents"] = {}
            dirty = True
        if "scholarships" not in self.data:
            self.data["scholarships"] = {
                "sona_merit": {
                    "id": "sona_merit",
                    "scholarship_name": "Sona Merit Scholarship",
                    "min_gpa": 8.5,
                    "max_income": 300000.0,
                    "eligible_departments": ["CSE", "ECE", "IT"],
                    "eligible_years": [2, 3, 4]
                }
            }
            dirty = True
        if dirty:
            self.save()
            
    def collection(self, name):
        return MockCollection(name, self)
        
    def _get_collection(self, coll_name):
        return self.data.get(coll_name, {})
        
    def _get_doc(self, coll_name, doc_id):
        coll = self._get_collection(coll_name)
        return coll.get(doc_id)
        
    def _set_doc(self, coll_name, doc_id, doc_data):
        if coll_name not in self.data:
            self.data[coll_name] = {}
        self.data[coll_name][doc_id] = doc_data
        self.save()
        
    def _update_doc(self, coll_name, doc_id, doc_data):
        doc = self._get_doc(coll_name, doc_id)
        if doc is not None:
            doc.update(doc_data)
            self.save()
            
    def _add_doc(self, coll_name, doc_data):
        if coll_name not in self.data:
            self.data[coll_name] = {}
        doc_id = str(uuid.uuid4())
        self.data[coll_name][doc_id] = doc_data
        self.save()
        return doc_id

def seed_real_firestore_if_empty(client):
    try:
        docs = list(client.collection("students").limit(1).stream())
        if not docs:
            print("[INFO] Seeding real Firestore database with default records...")
            client.collection("students").document("2023CS001").set({
                "name": "Student Demo",
                "admission_no": "2023CS001",
                "dob": "2000-01-01",
                "cgpa": 9.2,
                "department": "CSE",
                "year": 3,
                "family_income": 250000.0,
                "attendance_pct": 85,
                "lectures_attended": 34,
                "lectures_total": 40,
                "labs_attended": 10,
                "labs_total": 15,
                "study_hours": 12.5
            })
            client.collection("students").document("2023CS002").set({
                "name": "Alex Smith",
                "admission_no": "2023CS002",
                "dob": "2001-02-15",
                "cgpa": 7.8,
                "department": "ECE",
                "year": 2,
                "family_income": 400000.0,
                "attendance_pct": 72,
                "lectures_attended": 28,
                "lectures_total": 40,
                "labs_attended": 8,
                "labs_total": 15,
                "study_hours": 9.5
            })
            client.collection("scholarships").document("default_scholarship").set({
                "scholarship_name": "Sona Merit Scholarship",
                "min_gpa": 8.0,
                "max_income": 300000.0,
                "eligible_departments": ["CSE", "ECE", "IT"],
                "eligible_years": [2, 3, 4]
            })
            print("[INFO] Real Firestore database seeded successfully!")
    except Exception as e:
        print(f"[WARNING] Failed to check/seed real Firestore: {e}")

db = None
force_mock = os.environ.get("ENABLE_MOCK_DB", "false").lower() == "true"

if not force_mock and os.path.exists("serviceAccountKey.json"):
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
        db = firestore.client()
        seed_real_firestore_if_empty(db)
    except Exception as e:
        print(f"[ERROR] Failed to initialize Firebase: {e}")
        db = MockFirestore()
else:
    if force_mock:
        print("[INFO] ENABLE_MOCK_DB is true. Using Mock Firestore.")
    else:
        print("[WARNING] serviceAccountKey.json not found. Using Mock Firestore.")
    db = MockFirestore()

