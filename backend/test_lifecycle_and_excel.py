import sys
import os
import io
import pandas as pd
import requests
import time

BASE_URL = "http://localhost:8000"

def run_tests():
    print("==================================================")
    print("TESTING APPLICATION LIFECYCLE & EXCEL IMPORT APIS")
    print("==================================================")

    # 1. Download Template
    print("\n1. Testing GET /api/students/template...")
    r = requests.get(f"{BASE_URL}/api/students/template")
    assert r.status_code == 200, f"Template failed: {r.status_code}"
    print(f"✓ Downloaded template successfully ({len(r.content)} bytes)")

    # 2. Prepare Sample Excel and Import
    print("\n2. Testing POST /api/students/import-excel...")
    sample_df = pd.DataFrame([
        {
            "admission_no": "2024TEST001",
            "name": "Arjun Sundaram",
            "dob": "2002-11-20",
            "department": "CSE",
            "year": 3,
            "cgpa": 9.3,
            "family_income": 180000.0,
            "gender": "Male",
            "email": "arjun.s@college.edu",
            "phone": "+91 98765 00001",
            "guardian_name": "Sundaram K",
            "guardian_mobile": "+91 94432 00001",
            "caste_category": "BC",
            "address": "Salem, Tamil Nadu",
            "bank_account_no": "112233445566",
            "bank_name": "State Bank of India",
            "ifsc_code": "SBIN0001234",
            "attendance_pct": 92
        }
    ])
    excel_buf = io.BytesIO()
    sample_df.to_excel(excel_buf, index=False)
    excel_buf.seek(0)

    files = {
        "file": ("students_test.xlsx", excel_buf.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    }
    r = requests.post(f"{BASE_URL}/api/students/import-excel", files=files)
    assert r.status_code == 200, f"Import failed: {r.text}"
    import_res = r.json()
    print(f"✓ Imported {import_res.get('count')} student(s) into database: {import_res.get('message')}")

    # 3. Test Student Login
    print("\n3. Testing Student Login with Imported Credentials...")
    login_payload = {
        "admission_no": "2024TEST001",
        "dob": "2002-11-20",
        "login_type": "first_time"
    }
    r = requests.post(f"{BASE_URL}/api/auth/student", json=login_payload)
    assert r.status_code == 200, f"Login failed: {r.text}"
    login_res = r.json()
    print(f"✓ First-time login successful for: {login_res['user']['name']} (ID: {login_res['user']['id']})")

    # 4. Test Scholarship Application Submission (Stage 1)
    print("\n4. Testing POST /api/applications/apply (Stage 1: Application Submitted)...")
    app_payload = {
        "scholarship_id": "sch_cent_01",
        "scholarship_name": "Central Sector Scheme of Scholarships",
        "category_name": "Central Government Scholarships",
        "student_id": "2024TEST001",
        "student_name": "Arjun Sundaram",
        "department": "CSE",
        "year": 3,
        "cgpa": 9.3,
        "family_income": 180000.0,
        "applied_amount": "₹50,000",
        "bank_account_no": "112233445566",
        "bank_name": "State Bank of India",
        "ifsc_code": "SBIN0001234",
        "student_remarks": "Applied under Merit quota with CGPA 9.3."
    }
    r = requests.post(f"{BASE_URL}/api/applications/apply", json=app_payload)
    assert r.status_code == 200, f"Application submission failed: {r.text}"
    app_res = r.json()
    app_id = app_res["application"]["id"]
    print(f"✓ Application created with ID: {app_id} | Status: {app_res['application']['status']} (Stage {app_res['application']['stage']})")

    # 5. Test Admin Transition to Stage 2 (Processed & Signed)
    print("\n5. Testing Admin Transition to Stage 2: Processed & Signed...")
    r = requests.put(f"{BASE_URL}/api/applications/status/{app_id}", json={
        "status": "Processed & Signed",
        "stage": 2,
        "officer_notes": "All transcripts verified. Endorsed and signed by College Principal."
    })
    assert r.status_code == 200, f"Stage 2 failed: {r.text}"
    print(f"✓ Transitioned to Stage 2: {r.json().get('message')}")

    # 6. Test Admin Transition to Stage 3 (Submitted to Government)
    print("\n6. Testing Admin Transition to Stage 3: Submitted to Government...")
    r = requests.put(f"{BASE_URL}/api/applications/status/{app_id}", json={
        "status": "Submitted to Government",
        "stage": 3,
        "govt_portal_id": "NSP-2026-TN-981249"
    })
    assert r.status_code == 200, f"Stage 3 failed: {r.text}"
    print(f"✓ Transitioned to Stage 3: {r.json().get('message')}")

    # 7. Test Admin Transition to Stage 4 (Government Approved)
    print("\n7. Testing Admin Transition to Stage 4: Government Approved...")
    r = requests.put(f"{BASE_URL}/api/applications/status/{app_id}", json={
        "status": "Government Approved",
        "stage": 4,
        "disbursed_amount": "₹50,000"
    })
    assert r.status_code == 200, f"Stage 4 failed: {r.text}"
    print(f"✓ Transitioned to Stage 4: {r.json().get('message')}")

    # 8. Test Admin Transition to Stage 5 (Amount Received / Disbursed)
    print("\n8. Testing Admin Transition to Stage 5: Amount Received / Disbursed...")
    r = requests.put(f"{BASE_URL}/api/applications/status/{app_id}", json={
        "status": "Amount Received",
        "stage": 5,
        "disbursed_amount": "₹50,000",
        "transaction_ref": "SBIN982312049182",
        "disbursement_date": "2026-08-25"
    })
    assert r.status_code == 200, f"Stage 5 failed: {r.text}"
    print(f"✓ Transitioned to Stage 5: {r.json().get('message')}")

    # 9. Verify Student Application Tracker Retrieval
    print("\n9. Testing GET /api/applications/student/2024TEST001...")
    r = requests.get(f"{BASE_URL}/api/applications/student/2024TEST001")
    assert r.status_code == 200, f"Fetch failed: {r.text}"
    student_apps = r.json()
    assert len(student_apps) > 0, "No applications found for student!"
    curr_app = student_apps[0]
    print(f"✓ Retrieved student application: {curr_app['scholarship_name']} | Final Status: {curr_app['status']} (Stage {curr_app['stage']}) | Disbursed: {curr_app['disbursed_amount']} | UTR: {curr_app['transaction_ref']}")

    # 10. Verify Student Notifications
    print("\n10. Testing GET /api/notifications/student/2024TEST001...")
    r = requests.get(f"{BASE_URL}/api/notifications/student/2024TEST001")
    assert r.status_code == 200, f"Notifs failed: {r.text}"
    notifs = r.json()
    print(f"✓ Student received {len(notifs)} real-time lifecycle notifications:")
    for n in notifs[:5]:
        print(f"   [{n['icon']}] {n['title']} — {n['desc']}")

    print("\n==================================================")
    print("ALL APPLICATION LIFECYCLE & EXCEL IMPORT TESTS PASSED SUCCESSFULLY! ✓")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
