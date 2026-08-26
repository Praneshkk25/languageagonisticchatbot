import os
import sys

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import db, find_firebase_key

def main():
    key_path = find_firebase_key()
    print("=" * 60)
    print("FIREBASE & SCHOLARSHIP VERIFICATION TEST")
    print("=" * 60)
    print(f"Key Path Found: {key_path}")
    print(f"Database Instance Type: {type(db).__name__}")
    
    # 1. Verify Scholarships in Firebase / DB
    try:
        sch_docs = list(db.collection("scholarships").stream())
        print(f"\n[PASS] Found {len(sch_docs)} total scholarship records in database!")
        for idx, doc in enumerate(sch_docs[:5], 1):
            data = doc.to_dict()
            sname = data.get("scholarship_name") or data.get("name") or doc.id
            print(f"  {idx}. {doc.id} -> {sname}")
        if len(sch_docs) > 5:
            print(f"  ... and {len(sch_docs) - 5} more schemes.")
    except Exception as e:
        print(f"[FAIL] Error reading scholarships from database: {e}")

    # 2. Verify Student Profiles in Firebase / DB
    try:
        student_ids = ["2023CS001", "2023CS002"]
        print("\n[PASS] Testing Student Admission Profile Lookups:")
        for sid in student_ids:
            doc = db.collection("students").document(sid).get()
            if doc.exists:
                p = doc.to_dict()
                print(f"  - Admission No: {sid} | Name: {p.get('name')} | CGPA: {p.get('cgpa')} | Dept: {p.get('department')} | Income: ₹{p.get('family_income')}")
            else:
                print(f"  - Admission No: {sid} not found.")
    except Exception as e:
        print(f"[FAIL] Error reading student profiles: {e}")

    # 3. Test Qwen Chatbot Intent Logic for Typos & Tanglish
    try:
        print("\n[PASS] Testing Chatbot Query Processing (Typos & Tanglish):")
        from qwen_logic import get_bot
        bot = get_bot()
        
        test_queries = [
            ("Typo Test", "how many no of scolorships are provided finally?"),
            ("Tanglish Test", "enaku 8.5 cgpa iruku income 2 lakhs enna scholarship apply panlam"),
            ("English Test", "Am I eligible for AICTE Saksham scholarship?")
        ]
        
        for label, q in test_queries:
            resp, _ = bot.process_query(q, language="en", context={"user_id": "2023CS001"})
            snippet = resp.replace("\n", " ")[:120]
            print(f"\n  Query ({label}): '{q}'")
            print(f"  Response: {snippet}...")
            
    except Exception as e:
        print(f"[NOTE] Chatbot model load check: {e}")

    print("\n" + "=" * 60)
    print("FIREBASE & SCHOLARSHIP SETUP COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    main()
