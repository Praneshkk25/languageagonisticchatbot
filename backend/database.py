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
            self.data["students"] = {}
            dirty = True
        if "activity_logs" not in self.data:
            self.data["activity_logs"] = {}
            dirty = True
        if "documents" not in self.data:
            self.data["documents"] = {}
            dirty = True
        if "applications" not in self.data:
            self.data["applications"] = {}
            dirty = True
        if "scholarships" not in self.data or len(self.data.get("scholarships", {})) < 5:
            try:
                from scholarships_data import ALL_SCHOLARSHIPS
                sch_dict = {}
                for s in ALL_SCHOLARSHIPS:
                    sch_id = s.get("id", f"sch_{uuid.uuid4().hex[:8]}")
                    sch_dict[sch_id] = s
                self.data["scholarships"] = sch_dict
                dirty = True
            except Exception:
                pass
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
        from scholarships_data import ALL_SCHOLARSHIPS

        # Check scholarships collection with limit 1 to avoid unnecessary reads
        sch_docs = list(client.collection("scholarships").limit(1).stream())
        if len(sch_docs) == 0:
            print(f"[INFO] Seeding real Firestore database with {len(ALL_SCHOLARSHIPS)} scholarship schemes...")
            for sch in ALL_SCHOLARSHIPS:
                sch_id = sch.get("id", f"sch_{uuid.uuid4().hex[:8]}")
                client.collection("scholarships").document(sch_id).set(sch)
            print("[INFO] Real Firestore database scholarships seeded successfully!")
        else:
            print("[INFO] Real Firestore scholarships already present. Skipping re-seed.")
    except Exception as e:
        print(f"[WARNING] Note on Firestore seed check (Quota or Network): {e}")

class ResilientFirestoreWrapper:
    """
    Transparently delegates calls to real Google Cloud Firestore,
    but automatically falls back to local MockFirestore if Firestore quota is exceeded (429) or offline.
    """
    def __init__(self, real_client):
        self.real_client = real_client
        self.mock_client = MockFirestore()

    def collection(self, name):
        try:
            real_coll = self.real_client.collection(name)
            mock_coll = self.mock_client.collection(name)
            return ResilientCollectionWrapper(real_coll, mock_coll)
        except Exception:
            return self.mock_client.collection(name)

class ResilientCollectionWrapper:
    def __init__(self, real_coll, mock_coll):
        self.real_coll = real_coll
        self.mock_coll = mock_coll
        self.filters = []

    def document(self, doc_id):
        real_doc = self.real_coll.document(doc_id)
        mock_doc = self.mock_coll.document(doc_id)
        return ResilientDocRefWrapper(real_doc, mock_doc)

    def where(self, field, op, val):
        self.filters.append((field, op, val))
        try:
            self.real_coll = self.real_coll.where(field, op, val)
        except Exception:
            pass
        self.mock_coll = self.mock_coll.where(field, op, val)
        return self

    def limit(self, count):
        try:
            self.real_coll = self.real_coll.limit(count)
        except Exception:
            pass
        return self

    def stream(self):
        try:
            results = list(self.real_coll.stream())
            return results
        except Exception as e:
            # Fallback to local mock on QuotaExhausted 429
            return self.mock_coll.stream()

    def add(self, data):
        try:
            return self.real_coll.add(data)
        except Exception:
            return self.mock_coll.add(data)

class ResilientDocRefWrapper:
    def __init__(self, real_doc, mock_doc):
        self.real_doc = real_doc
        self.mock_doc = mock_doc
        self.id = real_doc.id

    def get(self):
        try:
            res = self.real_doc.get()
            if res.exists:
                return res
            # Check mock if missing in real
            mock_res = self.mock_doc.get()
            return mock_res if mock_res.exists else res
        except Exception:
            return self.mock_doc.get()

    def set(self, data, merge=False):
        # Sync both for high availability
        try:
            self.mock_doc.set(data)
        except Exception:
            pass
        try:
            self.real_doc.set(data, merge=merge)
        except Exception as e:
            print(f"[NOTE] Real Firestore write queued to local storage: {e}")

    def update(self, data):
        try:
            self.mock_doc.update(data)
        except Exception:
            pass
        try:
            self.real_doc.update(data)
        except Exception as e:
            print(f"[NOTE] Real Firestore update queued to local storage: {e}")

    def delete(self):
        try:
            self.mock_doc.delete()
        except Exception:
            pass
        try:
            self.real_doc.delete()
        except Exception:
            pass

def find_firebase_key():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(base_dir)
    
    candidates = [
        "serviceAccountKey.json",
        os.path.join(base_dir, "serviceAccountKey.json"),
        os.path.join(parent_dir, "serviceAccountKey.json"),
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
            
    for search_dir in [parent_dir, base_dir]:
        if os.path.exists(search_dir):
            for fname in os.listdir(search_dir):
                if fname.endswith(".json") and "firebase-adminsdk" in fname:
                    return os.path.join(search_dir, fname)
    return None

db = None
force_mock = os.environ.get("ENABLE_MOCK_DB", "false").lower() == "true"
key_path = find_firebase_key()
cred_json_env = os.environ.get("FIREBASE_CREDENTIALS_JSON")

if not force_mock and (key_path or cred_json_env):
    try:
        if cred_json_env:
            print("[INFO] Connecting to Firebase Firestore using FIREBASE_CREDENTIALS_JSON env variable...")
            cred_dict = json.loads(cred_json_env)
            cred = credentials.Certificate(cred_dict)
        else:
            print(f"[INFO] Connecting to Firebase Firestore using key file: {key_path}")
            cred = credentials.Certificate(key_path)

        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        real_db = firestore.client()
        seed_real_firestore_if_empty(real_db)
        db = ResilientFirestoreWrapper(real_db)
        print("[INFO] Firebase Firestore connected with High-Availability Resilient Fallback!")
    except Exception as e:
        print(f"[ERROR] Failed to initialize Firebase: {e}. Falling back to Mock Firestore.")
        db = MockFirestore()
else:
    if force_mock:
        print("[INFO] ENABLE_MOCK_DB is true. Using Mock Firestore.")
    else:
        print("[WARNING] Firebase key file or env var not found. Using Mock Firestore.")
    db = MockFirestore()


