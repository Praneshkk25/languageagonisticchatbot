import json
import urllib.request
import urllib.parse
import time

BASE_URL = "http://localhost:8000"

def run_test():
    print("=== STARTING FULL WORKFLOW TEST ===")
    
    # 1. Test Application Submission with Custom Documents
    apply_payload = {
        "scholarship_id": "national_merit_scholarship",
        "scholarship_name": "National Merit Scholarship for Higher Education",
        "category_name": "Merit & Academic Excellence",
        "application_mode": "Online",
        "student_id": "23CSEBE274",
        "student_name": "PRANESH K K",
        "department": "CSE",
        "year": 3,
        "cgpa": 8.8,
        "family_income": 200000.0,
        "applied_amount": "₹50,000",
        "bank_account_no": "987654321012",
        "bank_name": "State Bank of India",
        "ifsc_code": "SBIN0001234",
        "student_remarks": "Submitting complete academic transcripts and bonafide.",
        "documents": [
            {
                "document_name": "Aadhaar Card Copy",
                "category": "Identity Proof",
                "source": "wallet",
                "file_path": "/uploads/aadhaar_card.pdf",
                "file_name": "aadhaar_card.pdf",
                "required": True,
                "version": 1
            },
            {
                "document_name": "Annual Family Income Certificate",
                "category": "Income Proof",
                "source": "upload",
                "file_path": "/uploads/income_cert.pdf",
                "file_name": "income_cert.pdf",
                "required": True,
                "version": 1
            }
        ],
        "custom_documents": [
            {
                "document_name": "State Level Hackathon Winner Certificate",
                "category": "Special Distinction",
                "file_path": "/uploads/hackathon_win.pdf",
                "file_name": "hackathon_win.pdf",
                "reason": "Proof of technical excellence for merit consideration",
                "remarks": "Rank 1 in State Level AI Hackathon"
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
        print(f"[OK] Application Created: {app_id}")
        print(f"  Status: {app.get('status')}")
        print(f"  Documents Count: {len(app.get('documents', []))}")
        
        # Verify Core Rule: Uploaded != Verified
        for d in app.get("documents", []):
            print(f"  - Document '{d.get('document_name')}': Status = {d.get('status')} (Must be 'Pending Verification')")
            assert d.get("status") == "Pending Verification", f"Expected Pending Verification, got {d.get('status')}"

    # 2. Test Admin Action: Verify Aadhaar Card
    doc_0 = app.get("documents")[0]
    doc_0_id = doc_0.get("id")
    verify_req = urllib.request.Request(
        f"{BASE_URL}/api/applications/{app_id}/document/{doc_0_id}/action",
        data=json.dumps({
            "action": "verify",
            "remarks": "Aadhaar verified and matched with student profile.",
            "admin_id": "ADMIN_OFFICER"
        }).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(verify_req) as resp:
        v_res = json.loads(resp.read().decode('utf-8'))
        print(f"[OK] Verified Document: '{v_res.get('document', {}).get('document_name')}' -> Status: {v_res.get('document', {}).get('status')}")
        assert v_res.get("document", {}).get("status") == "Verified"

    # 3. Test Admin Action: Request Correction on Income Certificate
    doc_1 = app.get("documents")[1]
    doc_1_id = doc_1.get("id")
    corr_req = urllib.request.Request(
        f"{BASE_URL}/api/applications/{app_id}/document/{doc_1_id}/action",
        data=json.dumps({
            "action": "request_correction",
            "reason": "Document expired",
            "remarks": "Please upload current FY 2026-27 income certificate.",
            "admin_id": "ADMIN_OFFICER"
        }).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(corr_req) as resp:
        c_res = json.loads(resp.read().decode('utf-8'))
        print(f"[OK] Requested Correction: '{c_res.get('document', {}).get('document_name')}' -> Status: {c_res.get('document', {}).get('status')}")
        assert c_res.get("document", {}).get("status") == "Correction Required"

    # 4. Test Student Resubmission (Version 2)
    resub_req = urllib.request.Request(
        f"{BASE_URL}/api/applications/{app_id}/document/{doc_1_id}/resubmit",
        data=json.dumps({
            "file_path": "/uploads/income_cert_2026_updated.pdf",
            "file_name": "income_cert_2026_updated.pdf",
            "student_remarks": "Uploaded new valid FY 2026-27 certificate issued by Tehsildar."
        }).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(resub_req) as resp:
        r_res = json.loads(resp.read().decode('utf-8'))
        doc_v2 = r_res.get("document", {})
        print(f"[OK] Re-submitted Document: '{doc_v2.get('document_name')}' -> Version: {doc_v2.get('version')}, Status: {doc_v2.get('status')}")
        assert doc_v2.get("version") == 2
        assert doc_v2.get("status") == "Pending Verification"
        print(f"  Version History Entries: {len(doc_v2.get('version_history', []))}")

    # 5. Test Approval Gating (Attempt to Approve while Income Cert is unverified -> MUST FAIL)
    gate_failed = False
    try:
        apprv_req = urllib.request.Request(
            f"{BASE_URL}/api/applications/status/{app_id}",
            data=json.dumps({
                "status": "Approved",
                "stage": 4,
                "officer_notes": "Attempting approval without verification."
            }).encode('utf-8'),
            headers={"Content-Type": "application/json"},
            method="PUT"
        )
        with urllib.request.urlopen(apprv_req) as resp:
            pass
    except urllib.error.HTTPError as e:
        print(f"[OK] Gating Protected! Approval blocked as expected: HTTP {e.code} ({e.reason})")
        gate_failed = True

    assert gate_failed, "Gating check failed: Unverified application was approved!"

    # 6. Verify Income Certificate & then Approve
    urllib.request.urlopen(urllib.request.Request(
        f"{BASE_URL}/api/applications/{app_id}/document/{doc_1_id}/action",
        data=json.dumps({"action": "verify", "remarks": "New FY 2026 certificate verified."}).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    ))
    print("[OK] Income Certificate Verified by Admin.")

    # 7. Now Approve Application (Should Succeed)
    apprv_ok_req = urllib.request.Request(
        f"{BASE_URL}/api/applications/status/{app_id}",
        data=json.dumps({
            "status": "Approved",
            "stage": 4,
            "officer_notes": "All mandatory documents verified. Application approved for grant."
        }).encode('utf-8'),
        headers={"Content-Type": "application/json"},
        method="PUT"
    )
    with urllib.request.urlopen(apprv_ok_req) as resp:
        final_app = json.loads(resp.read().decode('utf-8'))
        print(f"[OK] Application Approved: {final_app.get('updated_status')}")

    # 8. Test Admin Stats Endpoint
    with urllib.request.urlopen(f"{BASE_URL}/api/applications/admin/stats") as resp:
        stats = json.loads(resp.read().decode('utf-8'))
        print("[OK] Admin Stats:", stats)

    print("=== ALL TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_test()
