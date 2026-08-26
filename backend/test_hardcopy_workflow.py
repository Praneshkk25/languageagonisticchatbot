import json
import urllib.request
import urllib.parse
import time

BASE_URL = "http://localhost:8000"

def run_test():
    print("=== STARTING FULL HARDCOPY & VERIFICATION TEST ===")
    
    # 1. Test Application Submission in Hybrid Mode
    apply_payload = {
        "scholarship_id": "state_sports_merit_scholarship",
        "scholarship_name": "State & National Sports Champion Fee Waiver",
        "category_name": "Sports Scholarships",
        "application_mode": "Hybrid", # Online upload + Physical hardcopy
        "student_id": "23CSEBE274",
        "student_name": "PRANESH K K",
        "department": "CSE",
        "year": 3,
        "cgpa": 8.8,
        "family_income": 200000.0,
        "applied_amount": "₹60,000",
        "bank_account_no": "987654321012",
        "bank_name": "State Bank of India",
        "ifsc_code": "SBIN0001234",
        "student_remarks": "Submitting physical certificates at room 102.",
        "documents": [
            {
                "document_name": "Sports Achievement Form 1/2/3",
                "category": "Sports Certificate",
                "source": "upload",
                "file_path": "/uploads/sports_cert.pdf",
                "file_name": "sports_cert.pdf",
                "required": True,
                "version": 1
            }
        ],
        "missing_documents": []
    }

    req = urllib.request.Request(
        f"{BASE_URL}/api/applications/apply",
        data=json.dumps(apply_payload).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        app = res_data.get("application")
        app_id = app.get("id")
        print(f"[OK] Hybrid Application Created: {app_id}")
        print(f"  Mode: {app.get('application_mode')}")
        print(f"  Hardcopy Required: {app.get('hardcopy_required')}")
        print(f"  Hardcopy Status: {app.get('hardcopy_status')}")
        assert app.get("hardcopy_required") is True
        assert app.get("hardcopy_verified") is False

    # 2. Test Student Submits Hardcopy Notice
    sub_notice_req = urllib.request.Request(
        f"{BASE_URL}/api/applications/{app_id}/hardcopy-submit",
        data=json.dumps({
            "student_id": "23CSEBE274",
            "office_room": "College Scholarship Cell, Room #102",
            "remarks": "Handed over original sports certificates and photocopies."
        }).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(sub_notice_req) as resp:
        sn_res = json.loads(resp.read().decode('utf-8'))
        print(f"[OK] Student Hardcopy Notice Recorded: {sn_res.get('hardcopy_status')}")

    # 3. Test Admin Hardcopy Verification
    admin_hc_req = urllib.request.Request(
        f"{BASE_URL}/api/applications/{app_id}/hardcopy-verify",
        data=json.dumps({
            "status": "Hardcopy Verified",
            "notes": "Verified physical Form 1/2/3 certificate against state sports board records.",
            "admin_id": "ADMIN_OFFICER"
        }).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(admin_hc_req) as resp:
        ah_res = json.loads(resp.read().decode('utf-8'))
        print(f"[OK] Admin Hardcopy Verified: {ah_res.get('hardcopy_status')} (Verified={ah_res.get('hardcopy_verified')})")
        assert ah_res.get("hardcopy_verified") is True

    print("=== ALL HARDCOPY TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_test()
