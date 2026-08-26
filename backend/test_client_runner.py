import os
os.environ["ENABLE_MOCK_DB"] = "true"

import main
from fastapi.testclient import TestClient
import io
import pandas as pd

client = TestClient(main.app)

def test_all():
    print("\n--- 1. Download Template ---")
    r = client.get("/api/students/template")
    assert r.status_code == 200, f"Template failed: {r.status_code}"
    print(f"[PASS] Template returned: {len(r.content)} bytes")

    print("\n--- 2. Excel Import ---")
    df = pd.DataFrame([{
        "admission_no": "2024TEST001",
        "name": "Arjun Sundaram",
        "dob": "2002-11-20",
        "department": "CSE",
        "year": 3,
        "cgpa": 9.3,
        "family_income": 180000.0,
        "bank_account_no": "112233445566",
        "bank_name": "State Bank of India",
        "ifsc_code": "SBIN0001234"
    }])
    buf = io.BytesIO()
    df.to_excel(buf, index=False)
    buf.seek(0)
    r2 = client.post("/api/students/import-excel", files={
        "file": ("test.xlsx", buf.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    })
    assert r2.status_code == 200, f"Import failed: {r2.text}"
    print("[PASS] Import response: count =", r2.json().get("count"), "message =", r2.json().get("message"))

    print("\n--- 3. First Time Student Login ---")
    r3 = client.post("/api/auth/student", json={
        "admission_no": "2024TEST001",
        "dob": "2002-11-20",
        "login_type": "first_time"
    })
    assert r3.status_code == 200, f"Login failed: {r3.text}"
    print("[PASS] Login response:", r3.json())

    print("\n--- 4. Submit Scholarship Application (Stage 1) ---")
    r4 = client.post("/api/applications/apply", json={
        "scholarship_id": "sch_01",
        "scholarship_name": "Central Sector Scheme of Scholarships",
        "category_name": "Central Schemes",
        "student_id": "2024TEST001",
        "student_name": "Arjun Sundaram",
        "department": "CSE",
        "year": 3,
        "cgpa": 9.3,
        "family_income": 180000.0,
        "applied_amount": "50000",
        "bank_account_no": "112233445566",
        "bank_name": "State Bank of India",
        "ifsc_code": "SBIN0001234",
        "student_remarks": "Submitting merit scholarship application."
    })
    assert r4.status_code == 200, f"Apply failed: {r4.text}"
    app_data = r4.json()["application"]
    app_id = app_data["id"]
    print(f"[PASS] Application submitted: ID {app_id}, Status: {app_data['status']}, Stage: {app_data['stage']}")

    print("\n--- 5. Admin Transition: Stage 2 (Processed & Signed) ---")
    r5 = client.put(f"/api/applications/status/{app_id}", json={
        "status": "Processed & Signed",
        "stage": 2,
        "officer_notes": "Verified and signed by Principal."
    })
    assert r5.status_code == 200
    print("[PASS] Stage 2:", r5.json())

    print("\n--- 6. Admin Transition: Stage 3 (Submitted to Government) ---")
    r6 = client.put(f"/api/applications/status/{app_id}", json={
        "status": "Submitted to Government",
        "stage": 3,
        "govt_portal_id": "NSP-2026-TN-981249"
    })
    assert r6.status_code == 200
    print("[PASS] Stage 3:", r6.json())

    print("\n--- 7. Admin Transition: Stage 4 (Government Approved) ---")
    r7 = client.put(f"/api/applications/status/{app_id}", json={
        "status": "Government Approved",
        "stage": 4,
        "disbursed_amount": "50000"
    })
    assert r7.status_code == 200
    print("[PASS] Stage 4:", r7.json())

    print("\n--- 8. Admin Transition: Stage 5 (Amount Received) ---")
    r8 = client.put(f"/api/applications/status/{app_id}", json={
        "status": "Amount Received",
        "stage": 5,
        "disbursed_amount": "50000",
        "transaction_ref": "UTR987654321098",
        "disbursement_date": "2026-08-25"
    })
    assert r8.status_code == 200
    print("[PASS] Stage 5:", r8.json())

    print("\n--- 9. Verify Student Application Tracker Retrieval ---")
    r9 = client.get("/api/applications/student/2024TEST001")
    assert r9.status_code == 200
    apps = r9.json()
    assert len(apps) > 0
    print("[PASS] Retrieved student applications count:", len(apps))

    print("\n--- 10. Verify Real-Time Lifecycle Notifications ---")
    r10 = client.get("/api/notifications/student/2024TEST001")
    assert r10.status_code == 200
    notifs = r10.json()
    print(f"[PASS] Retrieved {len(notifs)} student notifications")

    print("\n========================================================")
    print("SUCCESS: ALL 10 TESTS PASSED WITH 100% SUCCESS RATE!")
    print("========================================================")

if __name__ == "__main__":
    test_all()
