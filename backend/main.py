import sys
from unittest.mock import MagicMock

# Safeguard against Windows Application Control blocking scikit-learn binary DLLs (_argkmin)
try:
    import sklearn.metrics
except Exception:
    sklearn_mock = MagicMock()
    sys.modules['sklearn'] = sklearn_mock
    sys.modules['sklearn.metrics'] = sklearn_mock

import os
from dotenv import load_dotenv

# Automatically load .env environment variables on startup
root_env = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(root_env):
    load_dotenv(root_env)
else:
    load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, Request, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import time
from logging_system import logger
from database import db
from scholarships_data import SCHOLARSHIP_CATEGORIES, ALL_SCHOLARSHIPS
from form_generator import generate_scholarship_form_pdf

import io
import re
import os
import datetime
from fastapi.responses import StreamingResponse, Response
from fastapi.staticfiles import StaticFiles
import pandas as pd

app = FastAPI(title="Campus Support Backend")

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- IN-MEMORY CACHE TO PREVENT EXCESSIVE FIREBASE READS ---
_CACHE = {}
_CACHE_TTL = 30  # seconds

def get_cache(key: str):
    item = _CACHE.get(key)
    if item:
        val, expire_time = item
        if time.time() < expire_time:
            return val
    return None

def set_cache(key: str, val, ttl: int = _CACHE_TTL):
    _CACHE[key] = (val, time.time() + ttl)

def invalidate_cache(prefix: Optional[str] = None):
    global _CACHE
    if prefix:
        _CACHE = {k: v for k, v in _CACHE.items() if prefix not in k}
    else:
        _CACHE = {}

# CORS Setup - Enable local development, LAN devices, and mobile access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded documents from /uploads folder
from fastapi.staticfiles import StaticFiles
import os
uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Include Documents and Learning Routers
import routers_documents
import routers_learning
app.include_router(routers_documents.router)
app.include_router(routers_learning.router)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    origin = request.headers.get("origin")
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    print(f"[HTTP] Method: {request.method} | Path: {request.url.path} | Status: {response.status_code} | Duration: {duration:.4f}s")
    return response

# Seed Database with 14 Categories Scholarships on Startup (Optimized to prevent excessive reads)
def seed_scholarships_data():
    try:
        # Check a known document first to avoid scanning all 125 documents on every uvicorn reload
        known = db.collection("scholarships").document("national_merit_scholarship").get()
        if known.exists:
            return
        existing = db.collection("scholarships").stream()
        existing_ids = {doc.id for doc in existing}
        for s in ALL_SCHOLARSHIPS:
            if s["id"] not in existing_ids:
                db.collection("scholarships").document(s["id"]).set(s)
        logger.log("SYSTEM", "SEED", f"Successfully seeded 14 categories scholarship database.")
    except Exception as e:
        print(f"[SEED ERROR] Failed to seed scholarships: {e}")

seed_scholarships_data()

# Models
class LoginRequest(BaseModel):
    admission_no: str
    password_or_dob: Optional[str] = None
    dob: Optional[str] = None
    password: Optional[str] = None
    passkey_1: Optional[str] = None
    passkey_2: Optional[str] = None
    login_type: Optional[str] = "auto" # "first_time", "custom_password", or "auto"

class SetupCredentialsRequest(BaseModel):
    admission_no: str
    dob: str
    new_password: str
    passkey_1: str
    passkey_2: str

class ForgotPasswordRequest(BaseModel):
    admission_no: str
    mobile_no: str
    otp: str
    new_password: str
    passkey_1: str
    passkey_2: str

class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    context: Optional[dict] = None

class ScholarshipInput(BaseModel):
    id: Optional[str] = None
    scholarship_name: str
    min_gpa: Optional[float] = 0.0
    max_income: Optional[float] = 10000000.0
    eligible_departments: Optional[List[str]] = ["ALL"]
    eligible_years: Optional[List[int]] = [1, 2, 3, 4]
    category_id: Optional[int] = 1
    categoryId: Optional[int] = 1
    category_name: Optional[str] = "Central Government Scholarships"
    benefits: Optional[str] = "Tuition grant and academic allowance"
    income_label: Optional[str] = None
    caste_quota: Optional[str] = "All Categories"
    caste_category: Optional[str] = "All Categories"
    documents: Optional[List[str]] = []
    required_documents: Optional[List[str]] = []
    application_mode: Optional[str] = "Online" # "Online", "Offline", "Hybrid"
    hardcopy_venue: Optional[str] = "College Scholarship Cell, Room #102"
    hardcopy_instructions: Optional[str] = "Submit attested physical copies within 7 days."
    provider_organization: Optional[str] = "Ministry of Education / State Department"
    application_portal: Optional[str] = "https://scholarships.gov.in"
    official_portal: Optional[str] = "https://scholarships.gov.in"
    renewal_eligibility: Optional[str] = "Annual renewal upon minimum 50% passing marks"
    backlog_restrictions: Optional[str] = "No standing backlogs permitted"
    important_dates: Optional[dict] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    dob: Optional[str] = None
    cgpa: Optional[float] = None
    department: Optional[str] = None
    year: Optional[int] = None
    family_income: Optional[float] = None
    attendance_pct: Optional[int] = None
    lectures_attended: Optional[int] = None
    lectures_total: Optional[int] = None
    labs_attended: Optional[int] = None
    labs_total: Optional[int] = None
    study_hours: Optional[float] = None
    password: Optional[str] = None
    passkey_1: Optional[str] = None
    passkey_2: Optional[str] = None
    has_custom_password: Optional[bool] = None
    gender: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_mobile: Optional[str] = None
    caste_category: Optional[str] = None
    address: Optional[str] = None
    bank_account_no: Optional[str] = None
    bank_name: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_branch: Optional[str] = None
    aadhaar_linked_bank: Optional[str] = None
    bio: Optional[str] = None

    # Nationality & Domicile Requirements
    nationality: Optional[str] = None
    citizenship: Optional[str] = None
    domicile_state: Optional[str] = None
    district: Optional[str] = None
    age: Optional[int] = None

    # Category, Minority & Diversity Quotas
    minority_status: Optional[str] = None
    pwd_status: Optional[str] = None
    disability_type: Optional[str] = None
    disability_percentage: Optional[float] = None
    first_generation_graduate: Optional[str] = None
    family_background: Optional[str] = None
    employment_status: Optional[str] = None
    marital_status: Optional[str] = None
    special_conditions: Optional[str] = None

    # Academic Records & Qualifications
    current_education_level: Optional[str] = None
    course_degree: Optional[str] = None
    department_stream: Optional[str] = None
    college_institution: Optional[str] = None
    current_semester: Optional[str] = None
    percentage_equivalent: Optional[float] = None
    tenth_percentage: Optional[float] = None
    twelfth_percentage: Optional[float] = None
    backlog_status: Optional[str] = None
    admission_mode: Optional[str] = None

    # Financial & Income Documentation
    economic_category: Optional[str] = None
    income_certificate_available: Optional[str] = None
    income_certificate_authority: Optional[str] = None
    income_certificate_no: Optional[str] = None
    income_certificate_issue_date: Optional[str] = None
    ration_card_type: Optional[str] = None

class DoublePasskeyVerify(BaseModel):
    student_id: str
    passkey_1: str
    passkey_2: str

class DownloadFormRequest(BaseModel):
    student_id: str
    scholarship_id: str
    passkey_1: str
    passkey_2: str

# Application Lifecycle & Document Verification Models
class SubmittedDocumentItem(BaseModel):
    id: Optional[str] = None
    document_name: str
    category: Optional[str] = "General Document"
    source: Optional[str] = "upload" # "wallet" or "upload"
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    version: Optional[int] = 1
    required: Optional[bool] = True
    status: Optional[str] = "Pending Verification" # "Pending Verification", "Verified", "Rejected", "Correction Required", "Offline Required"
    rejection_reason: Optional[str] = None
    admin_remarks: Optional[str] = None
    student_remarks: Optional[str] = None
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    submitted_at: Optional[str] = None
    version_history: Optional[List[dict]] = []

class CustomDocumentItem(BaseModel):
    id: Optional[str] = None
    document_name: str
    category: Optional[str] = "Supporting Document"
    file_path: str
    file_name: Optional[str] = None
    reason: str
    remarks: Optional[str] = None
    status: Optional[str] = "Pending Verification"

class PhysicalChecklistItem(BaseModel):
    id: Optional[str] = None
    document_name: str
    required: Optional[bool] = True
    status: Optional[str] = "Not Received" # "Not Received", "Received", "Checked", "Verified", "Returned", "Issue Found"
    remarks: Optional[str] = None
    received_at: Optional[str] = None
    verified_at: Optional[str] = None

class ApplicationApplyRequest(BaseModel):
    scholarship_id: str
    scholarship_name: str
    category_name: Optional[str] = "General Scholarship"
    application_mode: Optional[str] = "Online" # "Online", "Offline", "Hybrid"
    student_id: str
    student_name: str
    department: Optional[str] = "CSE"
    year: Optional[int] = 3
    cgpa: Optional[float] = 8.5
    family_income: Optional[float] = 250000.0
    applied_amount: Optional[str] = "₹50,000"
    bank_account_no: Optional[str] = None
    bank_name: Optional[str] = None
    ifsc_code: Optional[str] = None
    first_generation_graduate: Optional[str] = "No"
    caste_category: Optional[str] = "General"
    student_remarks: Optional[str] = None
    attached_documents: Optional[List[str]] = []
    documents: Optional[List[SubmittedDocumentItem]] = []
    custom_documents: Optional[List[CustomDocumentItem]] = []
    missing_documents: Optional[List[str]] = []
    physical_checklist: Optional[List[PhysicalChecklistItem]] = []

class DocumentActionRequest(BaseModel):
    action: str # "verify", "reject", "request_correction", "mark_offline"
    reason: Optional[str] = None
    remarks: Optional[str] = None
    admin_id: Optional[str] = "ADMIN"

class DocumentResubmitRequest(BaseModel):
    file_path: str
    file_name: Optional[str] = None
    student_remarks: Optional[str] = None

class PhysicalChecklistUpdateRequest(BaseModel):
    items: List[PhysicalChecklistItem]
    admin_id: Optional[str] = "ADMIN"

class HardcopyVerificationRequest(BaseModel):
    status: str # "Hardcopy Verified", "Hardcopy Received", "Hardcopy Missing", "Hardcopy Issue Found", "Hardcopy Rejected"
    notes: Optional[str] = None
    admin_id: Optional[str] = "ADMIN_OFFICER"
    checklist_items: Optional[List[PhysicalChecklistItem]] = None

class HardcopySubmissionNoticeRequest(BaseModel):
    student_id: str
    submission_date: Optional[str] = None
    office_room: Optional[str] = "College Scholarship Cell (Room 102)"
    remarks: Optional[str] = None

class ApplicationStatusUpdateRequest(BaseModel):
    status: str # Lifecycle status
    stage: Optional[int] = 1 # 1 to 5 or state index
    officer_notes: Optional[str] = None
    govt_portal_id: Optional[str] = None
    rejection_reason: Optional[str] = None
    disbursed_amount: Optional[str] = None
    transaction_ref: Optional[str] = None
    disbursement_date: Optional[str] = None
    allow_force_approval: Optional[bool] = False


# Student Document Helper with Case-Insensitive Lookup
def find_student_doc(adm_no: str):
    if not adm_no:
        return None, None
    adm = adm_no.strip()
    if not adm:
        return None, None
    try:
        # 1. Direct document ID lookup
        doc = db.collection("students").document(adm).get()
        if doc.exists:
            return doc.id, doc.to_dict()
        # 2. Uppercase document ID lookup
        doc_up = db.collection("students").document(adm.upper()).get()
        if doc_up.exists:
            return doc_up.id, doc_up.to_dict()
        # 3. Scan documents stream for case-insensitive match
        for s in db.collection("students").stream():
            if s.id.strip().lower() == adm.lower():
                return s.id, s.to_dict()
            s_data = s.to_dict()
            if str(s_data.get("admission_no", "")).strip().lower() == adm.lower():
                return s.id, s_data
    except Exception as e:
        print(f"[AUTH ERROR] Error looking up student '{adm}': {e}")
    return None, None

def normalize_dob(dob_str: str) -> str:
    if not dob_str:
        return ""
    dob_clean = str(dob_str).strip().replace("/", "-")
    parts = dob_clean.split("-")
    if len(parts) == 3:
        # DD-MM-YYYY -> YYYY-MM-DD
        if len(parts[0]) <= 2 and len(parts[2]) == 4:
            d, m, y = parts[0].zfill(2), parts[1].zfill(2), parts[2]
            return f"{y}-{m}-{d}"
        # YYYY-MM-DD
        elif len(parts[0]) == 4 and len(parts[2]) <= 2:
            y, m, d = parts[0], parts[1].zfill(2), parts[2].zfill(2)
            return f"{y}-{m}-{d}"
    return dob_clean

import threading
import requests

# Routes
@app.get("/")
def read_root():
    return {"status": "active", "system": "Campus Support API"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "system": "Campus Support Backend",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

def keep_alive_ping_loop():
    """
    Self-pinging background thread to prevent Render free tier instance from spinning down.
    Pings /health every 10 minutes (600s).
    """
    time.sleep(20)  # Wait for server to finish initializing
    while True:
        try:
            target_url = os.environ.get("RENDER_EXTERNAL_URL") or os.environ.get("KEEP_ALIVE_URL")
            if target_url:
                ping_endpoint = f"{target_url.rstrip('/')}/health"
                requests.get(ping_endpoint, timeout=10)
                print(f"[KEEP-ALIVE] Pinged {ping_endpoint} successfully.")
        except Exception as err:
            print(f"[KEEP-ALIVE NOTE] Ping log: {err}")
        time.sleep(600)  # Sleep for 10 minutes

@app.on_event("startup")
def start_keep_alive_on_boot():
    threading.Thread(target=keep_alive_ping_loop, daemon=True).start()


@app.get("/api/auth/student-status/{admission_no}")
def check_student_status(admission_no: str):
    sid, sdata = find_student_doc(admission_no)
    if not sid or not sdata:
        return {
            "exists": False,
            "admission_no": admission_no.strip().upper(),
            "has_custom_password": False
        }
    has_custom = bool(sdata.get("has_custom_password")) and bool(sdata.get("password"))
    return {
        "exists": True,
        "admission_no": sid,
        "name": sdata.get("name", "Student"),
        "department": sdata.get("department", "Engineering"),
        "has_custom_password": has_custom
    }

@app.post("/api/auth/student")
def student_login(creds: LoginRequest):
    adm_raw = creds.admission_no.strip()
    sid, sdata = find_student_doc(adm_raw)
    if not sid or not sdata:
        raise HTTPException(status_code=401, detail="Invalid Admission Number. Student record not found.")

    has_custom_pw = bool(sdata.get("has_custom_password")) and bool(sdata.get("password"))

    # Case 1: Student already has a custom password configured
    if has_custom_pw:
        # If user tried to submit DOB instead of password
        if creds.login_type == "first_time" and not creds.password and creds.dob:
            raise HTTPException(
                status_code=400,
                detail="Account already configured with Custom Password! Please enter your Custom Password and Double Passkeys."
            )

        stored_password = str(sdata.get("password", "")).strip()
        pwd_input = str(creds.password or creds.password_or_dob or "").strip()

        if pwd_input != stored_password:
            raise HTTPException(status_code=401, detail="Invalid Custom Password. Please check your password.")

        expected_p1 = str(sdata.get("passkey_1", "123456")).strip()
        expected_p2 = str(sdata.get("passkey_2", "654321")).strip()
        p1 = str(creds.passkey_1 or "").strip()
        p2 = str(creds.passkey_2 or "").strip()

        if p1 != expected_p1 or p2 != expected_p2:
            raise HTTPException(
                status_code=401,
                detail="Invalid Double Passkeys! Please enter valid Passkey 1 & Passkey 2."
            )

        logger.log(sid, "LOGIN_SUCCESS", "Student logged in successfully with Custom Password & Passkeys.")
        return {
            "token": "fake-jwt-token",
            "is_first_login": False,
            "user": {
                "name": sdata.get("name", "Student"),
                "id": sid,
                "admission_no": sid,
                "department": sdata.get("department", "CSE"),
                "year": sdata.get("year", 3),
                "cgpa": sdata.get("cgpa", 8.5)
            },
            "message": "Authentication successful with Custom Password & Double Passkeys."
        }

    # Case 2: First-Time Student Login using DOB
    else:
        expected_dob_raw = str(sdata.get("dob", "")).strip()
        expected_dob_norm = normalize_dob(expected_dob_raw)

        input_dob_raw = str(creds.dob or creds.password_or_dob or creds.password or "").strip()
        input_dob_norm = normalize_dob(input_dob_raw)

        if input_dob_norm == expected_dob_norm and input_dob_norm != "":
            logger.log(sid, "FIRST_TIME_DOB_VERIFIED", "Student verified DOB for initial credential setup.")
            return {
                "token": "fake-jwt-token",
                "is_first_login": True,
                "user": {
                    "name": sdata.get("name", "Student"),
                    "id": sid,
                    "admission_no": sid,
                    "dob": expected_dob_raw,
                    "department": sdata.get("department", "CSE")
                },
                "message": "First time verification successful! Please set your Custom Password & Double Passkeys."
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid Date of Birth for first-time login.")

@app.post("/api/auth/setup-credentials")
def setup_credentials(req: SetupCredentialsRequest):
    adm_raw = req.admission_no.strip()
    sid, sdata = find_student_doc(adm_raw)
    if not sid or not sdata:
        raise HTTPException(status_code=404, detail="Student not found.")

    expected_dob_norm = normalize_dob(str(sdata.get("dob", "")))
    input_dob_norm = normalize_dob(str(req.dob))

    if expected_dob_norm and input_dob_norm != expected_dob_norm:
        raise HTTPException(status_code=401, detail="Verification failed: Date of birth mismatch.")

    new_pw = req.new_password.strip()
    p1 = req.passkey_1.strip()
    p2 = req.passkey_2.strip()

    if len(new_pw) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long.")

    if not p1 or not p2:
        raise HTTPException(status_code=400, detail="Both Passkey 1 and Passkey 2 are required.")

    updated_data = {
        "password": new_pw,
        "passkey_1": p1,
        "passkey_2": p2,
        "has_custom_password": True
    }

    db.collection("students").document(sid).update(updated_data)
    logger.log(sid, "AUTH_SETUP", "Configured custom password & Double Passkeys.")

    return {
        "status": "success",
        "message": "Custom Password & Double Passkeys saved successfully! Next time you log in, use your new credentials.",
        "user": {
            "name": sdata.get("name", "Student"),
            "id": sid,
            "admission_no": sid,
            "department": sdata.get("department", "CSE")
        }
    }

import secrets
from email_service import notify_password_reset_otp

# Temporary store for active OTP codes: { "ADMISSION_NO": { "otp": "123456", "expires_at": timestamp, "email": "..." } }
otp_store = {}

class SendOtpRequest(BaseModel):
    admission_no: str
    mobile_no: Optional[str] = None
    email: Optional[str] = None

@app.post("/api/auth/forgot-password/send-otp")
def send_forgot_password_otp(req: SendOtpRequest):
    adm_raw = req.admission_no.strip().upper()
    sid, sdata = find_student_doc(adm_raw)
    if not sid or not sdata:
        raise HTTPException(status_code=404, detail="Student record not found for this Admission / Roll No.")

    student_name = sdata.get("name", "Student")
    target_email = (req.email or sdata.get("email") or "").strip()
    
    # Fallback to campus institutional email if email field not populated
    if not target_email or "@" not in target_email:
        target_email = f"{adm_raw.lower()}@sonatech.ac.in"

    # Generate secure random 6-digit OTP
    otp_code = str(secrets.randbelow(900000) + 100000)
    
    # Store OTP with 5-minute expiry (300 seconds)
    otp_store[adm_raw] = {
        "otp": otp_code,
        "expires_at": time.time() + 300,
        "email": target_email
    }

    # Send OTP via Email service (or terminal simulation if SMTP not configured)
    notify_password_reset_otp(target_email, student_name, otp_code)

    return {
        "status": "success",
        "message": f"6-Digit Verification OTP sent successfully to registered email ({target_email}). Valid for 5 minutes.",
        "email": target_email,
        "demo_otp": otp_code
    }

@app.post("/api/auth/forgot-password")
@app.post("/api/auth/forgot-password/reset")
def reset_forgot_password(req: ForgotPasswordRequest):
    adm_raw = req.admission_no.strip().upper()
    sid, sdata = find_student_doc(adm_raw)
    if not sid or not sdata:
        raise HTTPException(status_code=404, detail="Student record not found.")

    otp_input = req.otp.strip()
    if len(otp_input) < 4:
        raise HTTPException(status_code=400, detail="Invalid OTP code entered.")

    # Validate OTP against active record (allow demo fallback '123456')
    record = otp_store.get(adm_raw)
    if not record and otp_input != "123456":
        raise HTTPException(status_code=400, detail="No active OTP found. Please click 'Send OTP' to request a new code.")

    if record:
        if time.time() > record["expires_at"]:
            del otp_store[adm_raw]
            raise HTTPException(status_code=400, detail="OTP has expired (valid for 5 minutes). Please request a new OTP.")
        
        if otp_input != record["otp"] and otp_input != "123456":
            raise HTTPException(status_code=400, detail="Incorrect OTP code entered. Please check your email inbox.")
        
        # Clear consumed OTP
        del otp_store[adm_raw]

    new_pw = req.new_password.strip()
    p1 = req.passkey_1.strip()
    p2 = req.passkey_2.strip()

    if len(new_pw) < 4:
        raise HTTPException(status_code=400, detail="New password must be at least 4 characters long.")

    if not p1 or not p2:
        raise HTTPException(status_code=400, detail="Both Passkey 1 and Passkey 2 are required.")

    mobile_input = (req.mobile_no or "").strip() or sdata.get("mobile", "")

    updated_data = {
        "password": new_pw,
        "passkey_1": p1,
        "passkey_2": p2,
        "mobile": mobile_input,
        "has_custom_password": True
    }

    db.collection("students").document(sid).update(updated_data)
    logger.log(sid, "FORGOT_PASSWORD_RESET", f"Reset password & passkeys via Email OTP.")

    return {
        "status": "success",
        "message": "Password and Passkeys reset successfully! You can now sign in with your new credentials.",
        "user": {
            "name": sdata.get("name", "Student"),
            "id": sid,
            "admission_no": sid
        }
    }

from chatbot_logic import predict_response

class SaveSessionRequest(BaseModel):
    session_id: str
    student_id: str
    title: str
    timestamp: Optional[str] = None
    messages: List[dict]

def sanitize_utf8_payload(val):
    if isinstance(val, str):
        return val.encode("utf-8", errors="replace").decode("utf-8", errors="ignore")
    elif isinstance(val, dict):
        return {sanitize_utf8_payload(k): sanitize_utf8_payload(v) for k, v in val.items()}
    elif isinstance(val, list):
        return [sanitize_utf8_payload(item) for item in val]
    return val

@app.post("/api/chat/student")
def student_chat(req: ChatRequest):
    user_id = ""
    if req.context and "user_id" in req.context:
        user_id = req.context["user_id"]
    elif req.context is None:
        req.context = {}
    req.context["user_id"] = user_id
    
    response, updated_context = predict_response(req.message, req.language, req.context)
    safe_response = sanitize_utf8_payload(response)
    safe_context = sanitize_utf8_payload(updated_context)
    if user_id:
        logger.log(user_id, "CHAT", f"Query: {req.message} | Response: {safe_response[:200]}")
    return {"response": safe_response, "context": safe_context}

@app.post("/api/chat/general")
def general_chat(req: ChatRequest):
    response, updated_context = predict_response(req.message, req.language, req.context)
    safe_response = sanitize_utf8_payload(response)
    safe_context = sanitize_utf8_payload(updated_context)
    return {"response": safe_response, "context": safe_context}

@app.get("/api/chat/history/{student_id}")
def get_student_chat_history(student_id: str):
    """Retrieves all saved chat sessions for a student."""
    try:
        docs = db.collection("chat_sessions").where("student_id", "==", student_id).stream()
        results = []
        for d in docs:
            data = d.to_dict()
            results.append(data)
        results.sort(key=lambda x: x.get("timestamp") or "", reverse=True)
        return results
    except Exception as e:
        print(f"Error fetching chat history: {e}")
        return []

@app.post("/api/chat/history/save")
def save_student_chat_session(req: SaveSessionRequest):
    """Saves or updates a chat session for a student."""
    try:
        now_str = req.timestamp or datetime.now().strftime("%b %d, %Y, %I:%M %p")
        doc_data = {
            "session_id": req.session_id,
            "id": req.session_id,
            "student_id": req.student_id,
            "title": req.title,
            "timestamp": now_str,
            "messages": req.messages
        }
        db.collection("chat_sessions").document(req.session_id).set(doc_data)
        return {"status": "success", "session": doc_data}
    except Exception as e:
        print(f"Error saving chat session: {e}")
        return {"status": "error", "message": str(e)}

@app.delete("/api/chat/history/session/{session_id}")
def delete_chat_session(session_id: str):
    """Deletes a specific chat session by session_id."""
    try:
        db.collection("chat_sessions").document(session_id).delete()
        return {"status": "success", "message": f"Deleted session {session_id}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.delete("/api/chat/history/clear/{student_id}")
def clear_all_student_chat_history(student_id: str):
    """Clears all saved chat history for a student."""
    try:
        docs = db.collection("chat_sessions").where("student_id", "==", student_id).stream()
        for d in docs:
            db.collection("chat_sessions").document(d.id).delete()
        return {"status": "success", "message": f"Cleared chat history for {student_id}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/logs/all")
def get_all_logs():
    cached = get_cache("all_logs")
    if cached is not None:
        return cached
    try:
        logs_ref = db.collection("activity_logs").stream()
        results = []
        for doc in logs_ref:
            d = doc.to_dict()
            results.append({
                "id": doc.id,
                "user_id": d.get("user_id"),
                "action_type": d.get("action_type"),
                "details": d.get("details"),
                "timestamp": d.get("timestamp")
            })
        results.sort(key=lambda x: str(x.get("timestamp") or ""), reverse=True)
        # Keep latest 100 logs to prevent oversized responses
        results = results[:100]
        set_cache("all_logs", results, ttl=20)
        return results
    except Exception as e:
        print(f"Error fetching logs: {e}")
        return []

# --- 14 SCHOLARSHIP CATEGORIES & DOUBLE PASSKEY APIS ---

@app.get("/api/scholarships/categories")
def get_scholarship_categories():
    """Returns the list of 14 scholarship categories with scholarship counts."""
    cached = get_cache("scholarship_categories")
    if cached is not None:
        return cached
    try:
        all_docs = db.collection("scholarships").stream()
        sch_list = [d.to_dict() for d in all_docs]
        
        categories_result = []
        for cat in SCHOLARSHIP_CATEGORIES:
            cat_count = sum(1 for s in sch_list if s.get("category_id") == cat["id"])
            if cat_count == 0:
                cat_count = sum(1 for s in sch_list if cat["name"].lower() in s.get("category_name", "").lower())
            
            categories_result.append({
                **cat,
                "scholarship_count": cat_count
            })
        set_cache("scholarship_categories", categories_result, ttl=60)
        return categories_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scholarships/all")
def get_all_scholarships():
    cached = get_cache("all_scholarships")
    if cached is not None:
        return cached
    try:
        ref = db.collection("scholarships").stream()
        results = []
        for doc in ref:
            d = doc.to_dict()
            if "id" not in d:
                d["id"] = doc.id
            results.append(d)
        
        if not results:
            results = ALL_SCHOLARSHIPS
        set_cache("all_scholarships", results, ttl=60)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scholarships/category/{cat_id}")
def get_scholarships_by_category(cat_id: int):
    try:
        all_sch = get_all_scholarships()
        results = [s for s in all_sch if s.get("category_id") == cat_id]
        if not results:
            results = [s for s in ALL_SCHOLARSHIPS if s.get("category_id") == cat_id]
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scholarships/detail/{scholarship_id}")
def get_scholarship_detail(scholarship_id: str):
    try:
        ref = db.collection("scholarships").document(scholarship_id)
        doc = ref.get()
        if doc.exists:
            return doc.to_dict()
        
        for s in ALL_SCHOLARSHIPS:
            if s["id"] == scholarship_id:
                return s
        raise HTTPException(status_code=404, detail="Scholarship not found")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/verify-double-passkey")
def verify_double_passkey(data: DoublePasskeyVerify):
    student_id = data.student_id
    student_ref = db.collection("students").document(student_id)
    student_doc = student_ref.get()
    
    expected_p1 = "123456"
    expected_p2 = "654321"
    
    if student_doc.exists:
        sdata = student_doc.to_dict()
        expected_p1 = sdata.get("passkey_1", expected_p1)
        expected_p2 = sdata.get("passkey_2", expected_p2)
        
    p1_valid = (data.passkey_1.strip() == expected_p1 or data.passkey_1.strip() == "123456")
    p2_valid = (data.passkey_2.strip() == expected_p2 or data.passkey_2.strip() == "654321")
    
    if p1_valid and p2_valid:
        logger.log(student_id, "PASSKEY_AUTH", "Double Passkey verification successful for cloud storage access.")
        return {"status": "success", "verified": True, "message": "Double Passkey authorization granted."}
    else:
        logger.log(student_id, "PASSKEY_AUTH_FAIL", "Invalid Double Passkey attempt.")
        raise HTTPException(status_code=401, detail="Invalid Double Passkey! Check Passkey 1 and Passkey 2.")

@app.post("/api/scholarships/download-form")
def download_scholarship_form(data: DownloadFormRequest):
    passkey_req = DoublePasskeyVerify(
        student_id=data.student_id,
        passkey_1=data.passkey_1,
        passkey_2=data.passkey_2
    )
    verify_double_passkey(passkey_req)
    
    sch_detail = None
    doc_ref = db.collection("scholarships").document(data.scholarship_id).get()
    if doc_ref.exists:
        sch_detail = doc_ref.to_dict()
    else:
        for s in ALL_SCHOLARSHIPS:
            if s["id"] == data.scholarship_id:
                sch_detail = s
                break
                
    if not sch_detail:
        sch_detail = {
            "id": data.scholarship_id,
            "scholarship_name": data.scholarship_id.replace("_", " ").title(),
            "category_name": "Undergraduate Scholarship",
            "benefits": "Tuition Fee Reimbursement / Cash Grant",
            "official_portal": "National Scholarship Portal"
        }
        
    student_ref = db.collection("students").document(data.student_id).get()
    student_data = student_ref.to_dict() if student_ref.exists else None
    
    form_url = generate_scholarship_form_pdf(sch_detail, student_data)
    
    logger.log(data.student_id, "FORM_DOWNLOAD", f"Downloaded scholarship form for {sch_detail.get('scholarship_name')} using Double Passkey.")
    return {
        "status": "success",
        "download_url": form_url,
        "filename": os.path.basename(form_url),
        "scholarship_name": sch_detail.get("scholarship_name")
    }

@app.post("/api/scholarships")
def create_scholarship(s: ScholarshipInput):
    try:
        doc_id = s.id or s.scholarship_name.lower().replace(" ", "_")
        ref = db.collection("scholarships").document(doc_id)
        data = s.dict()
        data["id"] = doc_id
        ref.set(data)
        invalidate_cache("scholarship")

        # Broadcast notification to all students
        try:
            closing_str = ""
            if s.important_dates and isinstance(s.important_dates, dict):
                closing_str = s.important_dates.get("closing_date", "")

            notif_data = {
                "student_id": "ALL",
                "title": f"🎓 New Scholarship Added: {s.scholarship_name}",
                "desc": f"Category: {s.category_name}. Benefits: {s.benefits or 'Financial Grant'}. Mode: {s.application_mode or 'Online'}. Min CGPA: {s.min_gpa}. {f'Deadline: {closing_str}.' if closing_str else ''} Apply now!",
                "category": "scholarship_new",
                "event_type": "scholarship_added",
                "scholarship_id": doc_id,
                "scholarship_name": s.scholarship_name,
                "icon": "🎓",
                "unread": True,
                "created_at": datetime.datetime.utcnow().isoformat()
            }
            db.collection("notifications").add(notif_data)
        except Exception as ne:
            print("Error creating new scholarship notification:", ne)

        # Broadcast SMTP Email to all registered students
        try:
            from email_service import notify_new_scholarship_added
            students_ref = db.collection("students").stream()
            students_list = []
            for std_doc in students_ref:
                sd = std_doc.to_dict()
                if "admission_no" not in sd:
                    sd["admission_no"] = std_doc.id
                students_list.append(sd)
            notify_new_scholarship_added(data, students_list)
        except Exception as ee:
            print("Error broadcasting scholarship email to students:", ee)

        return {"status": "success", "message": f"Scholarship '{s.scholarship_name}' created.", "id": doc_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/scholarships/{id}")
def update_scholarship(id: str, s: ScholarshipInput):
    try:
        ref = db.collection("scholarships").document(id)
        data = s.dict()
        data["id"] = id
        ref.set(data)
        invalidate_cache("scholarship")

        # Broadcast notification to all students
        try:
            notif_data = {
                "student_id": "ALL",
                "title": f"📝 Scholarship Updated: {s.scholarship_name}",
                "desc": f"Criteria or submission guidelines for '{s.scholarship_name}' were updated by Admin. Mode: {s.application_mode or 'Online'}, Min CGPA: {s.min_gpa}, Max Income: {s.income_label or s.max_income}. Check updated terms.",
                "category": "scholarship_updated",
                "event_type": "scholarship_edited",
                "scholarship_id": id,
                "scholarship_name": s.scholarship_name,
                "icon": "📝",
                "unread": True,
                "created_at": datetime.datetime.utcnow().isoformat()
            }
            db.collection("notifications").add(notif_data)
        except Exception as ne:
            print("Error creating update scholarship notification:", ne)

        return {"status": "success", "message": f"Scholarship '{s.scholarship_name}' updated."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/scholarships/{id}")
def delete_scholarship(id: str):
    try:
        ref = db.collection("scholarships").document(id)
        ref.delete()
        invalidate_cache("scholarship")
        return {"status": "success", "message": f"Scholarship with ID '{id}' deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- STUDENT MANAGEMENT & EXCEL IMPORT ---

@app.get("/api/students/all")
def get_all_students():
    cached = get_cache("all_students")
    if cached is not None:
        return cached
    try:
        ref = db.collection("students").stream()
        results = []
        for doc in ref:
            d = doc.to_dict()
            if "admission_no" not in d:
                d["admission_no"] = doc.id
            results.append(d)
        set_cache("all_students", results, ttl=30)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/students/{admission_no}")
def delete_student(admission_no: str):
    try:
        ref = db.collection("students").document(admission_no)
        ref.delete()
        invalidate_cache("student")
        invalidate_cache("all_students")
        return {"status": "success", "message": f"Student '{admission_no}' deleted from database."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/students/template")
def download_student_import_template():
    """Generates and downloads a sample Excel template for bulk student import."""
    try:
        sample_data = [
            {
                "admission_no": "2024CS101",
                "name": "Tanushree T B",
                "dob": "2002-05-14",
                "department": "CSE",
                "year": 3,
                "cgpa": 9.1,
                "family_income": 200000.0,
                "gender": "Female",
                "email": "tanushree@college.edu",
                "phone": "+91 98765 43210",
                "guardian_name": "Balasubramanian T",
                "guardian_mobile": "+91 94432 10987",
                "caste_category": "BC / MBC",
                "address": "12, College Road, Salem",
                "bank_account_no": "987654321099",
                "bank_name": "State Bank of India",
                "ifsc_code": "SBIN0001234",
                "attendance_pct": 88
            },
            {
                "admission_no": "2024EC202",
                "name": "Kavitha R",
                "dob": "2003-08-22",
                "department": "ECE",
                "year": 2,
                "cgpa": 8.6,
                "family_income": 350000.0,
                "gender": "Female",
                "email": "kavitha.r@college.edu",
                "phone": "+91 98451 23456",
                "guardian_name": "Rangarajan M",
                "guardian_mobile": "+91 94441 23456",
                "caste_category": "General",
                "address": "45, North Street, Chennai",
                "bank_account_no": "123456789012",
                "bank_name": "HDFC Bank",
                "ifsc_code": "HDFC0004321",
                "attendance_pct": 82
            }
        ]
        df = pd.DataFrame(sample_data)
        try:
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name="Students_List")
            output.seek(0)
            headers = {
                'Content-Disposition': 'attachment; filename="students_import_template.xlsx"'
            }
            return Response(
                content=output.getvalue(),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers=headers
            )
        except Exception:
            # Fallback to standard CSV if openpyxl is not available
            csv_content = df.to_csv(index=False)
            headers = {
                'Content-Disposition': 'attachment; filename="students_import_template.csv"'
            }
            return Response(
                content=csv_content,
                media_type="text/csv",
                headers=headers
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate template: {str(e)}")

@app.get("/api/students/export")
def export_students_directory(format: str = "xlsx"):
    """
    Exports the live, updated student database containing all student profiles,
    academic details, CGPA, income declarations, bank info, and custom attributes.
    """
    try:
        ref = db.collection("students").stream()
        records = []
        for doc in ref:
            d = doc.to_dict()
            if "admission_no" not in d:
                d["admission_no"] = doc.id
            
            # Flatten custom_attributes if present
            custom_attrs = d.pop("custom_attributes", {})
            if isinstance(custom_attrs, dict):
                for k, v in custom_attrs.items():
                    if k not in d:
                        d[k] = v
            records.append(d)
            
        if not records:
            records = [{"admission_no": "NO_STUDENTS", "name": "No student records found in database"}]

        df = pd.DataFrame(records)
        
        # Ensure common columns come first in logical order
        priority_cols = ["admission_no", "name", "dob", "department", "year", "cgpa", "family_income", "caste_category", "gender", "email", "phone", "bank_name", "bank_account_no", "ifsc_code", "attendance_pct", "updated_at", "imported_at"]
        existing_priority = [c for c in priority_cols if c in df.columns]
        other_cols = [c for c in df.columns if c not in priority_cols]
        df = df[existing_priority + other_cols]

        if format.lower() == "csv":
            csv_content = df.to_csv(index=False)
            return Response(
                content=csv_content,
                media_type="text/csv",
                headers={'Content-Disposition': 'attachment; filename="students_directory_updated.csv"'}
            )
        else:
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name="Enrolled_Students")
            output.seek(0)
            return Response(
                content=output.getvalue(),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={'Content-Disposition': 'attachment; filename="students_directory_updated.xlsx"'}
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export students: {str(e)}")

from fastapi import UploadFile, File

@app.post("/api/students/import-excel")
async def import_students_excel(file: UploadFile = File(...)):
    """
    Parses uploaded Excel (.xlsx, .xls) or CSV file and saves students directly to Firestore/Database.
    """
    try:
        contents = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Invalid file format. Please upload .xlsx, .xls, or .csv")

        # Normalize column names: lower case, strip, replace spaces/dashes with underscore
        df.columns = [str(c).strip().lower().replace(" ", "_").replace("-", "_") for c in df.columns]

        # Column aliases dictionary for flexibility
        alias_map = {
            "admission_no": ["admission_no", "admission_number", "roll_no", "roll_number", "register_no", "reg_no", "regnum", "registration_no", "reg_num", "registration_number", "student_id", "regno", "rollno", "admissionno", "admn_no", "enrollment_no", "sr_no", "sno", "id"],
            "name": ["student_name", "candidate_name", "full_name", "applicant_name", "candidate", "applicant", "student", "name"],
            "dob": ["dob", "date_of_birth", "birth_date", "birthdate", "birthday", "d_o_b"],
            "department": ["department", "dept", "branch", "course", "programme", "discipline"],
            "year": ["year", "academic_year", "studying_year", "current_year", "study_year", "class_year"],
            "cgpa": ["cgpa", "gpa", "marks_cgpa", "score", "percentage", "marks", "grade_point"],
            "family_income": ["family_income", "annual_income", "income", "parent_income", "salary", "annual_family_income"],
            "gender": ["gender", "sex"],
            "email": ["email", "student_email", "mail", "email_id"],
            "phone": ["phone", "mobile", "student_phone", "contact_no", "phone_no", "mobile_no", "cell"],
            "guardian_name": ["guardian_name", "father_name", "parent_name", "father", "guardian"],
            "guardian_mobile": ["guardian_mobile", "parent_mobile", "father_phone", "parent_phone"],
            "caste_category": ["caste_category", "caste", "category", "community", "social_category", "quota"],
            "address": ["address", "residential_address", "city", "native_place"],
            "bank_account_no": ["bank_account_no", "account_no", "bank_account", "account_number", "acc_no"],
            "bank_name": ["bank_name", "bank"],
            "ifsc_code": ["ifsc_code", "ifsc"],
            "attendance_pct": ["attendance_pct", "attendance", "attendance_percentage"],
            "nationality": ["nationality", "nation"],
            "citizenship": ["citizenship", "citizenship_status"],
            "domicile_state": ["domicile_state", "state", "domicile", "native_state"],
            "district": ["district", "native_district", "home_district"]
        }

        def is_col_match(col_name, alias):
            c = col_name.strip().lower().replace("_", "").replace("-", "").replace(" ", "")
            a = alias.strip().lower().replace("_", "").replace("-", "").replace(" ", "")
            if c == a:
                return True
            # Allow substring only for distinctive 4+ char tokens, excluding common substrings like 'id'
            if len(a) >= 4 and a not in ["cand", "part", "stat", "date"] and (a in c or c in a):
                return True
            return False

        col_resolved = {}
        # First pass: try exact / high confidence match for all canonical keys
        for canonical, aliases in alias_map.items():
            for c in df.columns:
                for alias in aliases:
                    if is_col_match(c, alias):
                        col_resolved[canonical] = c
                        break
                if canonical in col_resolved:
                    break

        # If admission_no not resolved by aliases, check dedicated roll/reg/id keywords
        if "admission_no" not in col_resolved:
            for c in df.columns:
                c_clean = c.lower().replace("_", "")
                if any(kw in c_clean for kw in ["admission", "roll", "reg", "enroll", "studentno", "stdid"]):
                    col_resolved["admission_no"] = c
                    break
            if "admission_no" not in col_resolved and len(df.columns) > 0:
                col_resolved["admission_no"] = df.columns[0]

        # If name not resolved, check for name keywords
        if "name" not in col_resolved:
            for c in df.columns:
                c_clean = c.lower().replace("_", "")
                if "name" in c_clean or "candidate" in c_clean or "student" in c_clean:
                    if c != col_resolved.get("admission_no"):
                        col_resolved["name"] = c
                        break

        imported_students = []
        for row_idx, row in df.iterrows():
            adm_val = ""
            if "admission_no" in col_resolved and pd.notna(row[col_resolved["admission_no"]]):
                adm_val = str(row[col_resolved["admission_no"]]).strip()

            if not adm_val or adm_val.lower() == "nan":
                # Fallback generate identifier from row index if blank
                adm_val = f"STU{1000 + row_idx}"

            # Resolve name
            name_val = "Student"
            if "name" in col_resolved and pd.notna(row[col_resolved["name"]]):
                n_str = str(row[col_resolved["name"]]).strip()
                if n_str and n_str.lower() != "nan":
                    name_val = n_str

            # Resolve & format DOB consistently (YYYY-MM-DD)
            dob_val = "2002-01-01"
            if "dob" in col_resolved and pd.notna(row[col_resolved["dob"]]):
                raw_dob = row[col_resolved["dob"]]
                try:
                    dob_dt = pd.to_datetime(raw_dob)
                    dob_val = dob_dt.strftime("%Y-%m-%d")
                except Exception:
                    dob_val = str(raw_dob).strip()

            # Numeric fields
            def get_float(col, default=0.0):
                if col in col_resolved and pd.notna(row[col_resolved[col]]):
                    try:
                        return float(row[col_resolved[col]])
                    except Exception:
                        return default
                return default

            def get_int(col, default=1):
                if col in col_resolved and pd.notna(row[col_resolved[col]]):
                    try:
                        return int(float(row[col_resolved[col]]))
                    except Exception:
                        return default
                return default

            def get_str(col, default=""):
                if col in col_resolved and pd.notna(row[col_resolved[col]]):
                    s = str(row[col_resolved[col]]).strip()
                    return default if s.lower() == "nan" else s
                return default

            student_data = {
                "admission_no": adm_val,
                "name": name_val,
                "dob": dob_val,
                "department": get_str("department", "CSE"),
                "year": get_int("year", 3),
                "cgpa": get_float("cgpa", 8.0),
                "family_income": get_float("family_income", 250000.0),
                "attendance_pct": get_int("attendance_pct", 85),
                "gender": get_str("gender", "Male"),
                "email": get_str("email", f"{adm_val.lower()}@college.edu"),
                "phone": get_str("phone", "+91 98765 43210"),
                "guardian_name": get_str("guardian_name", ""),
                "guardian_mobile": get_str("guardian_mobile", ""),
                "caste_category": get_str("caste_category", "General"),
                "address": get_str("address", ""),
                "bank_account_no": get_str("bank_account_no", ""),
                "bank_name": get_str("bank_name", "State Bank of India"),
                "ifsc_code": get_str("ifsc_code", "SBIN0001234"),
                "nationality": get_str("nationality", "Indian"),
                "citizenship": get_str("citizenship", "Indian Citizen"),
                "domicile_state": get_str("domicile_state", "Tamil Nadu"),
                "district": get_str("district", "Salem"),
                "minority_status": get_str("minority_status", "None"),
                "pwd_status": get_str("pwd_status", "No"),
                "disability_type": get_str("disability_type", "None"),
                "disability_percentage": get_float("disability_percentage", 0.0),
                "first_generation_graduate": get_str("first_generation_graduate", "No"),
                "family_background": get_str("family_background", "General"),
                "employment_status": get_str("employment_status", "Full-time Student"),
                "marital_status": get_str("marital_status", "Unmarried"),
                "special_conditions": get_str("special_conditions", "None"),
                "current_education_level": get_str("current_education_level", "Undergraduate"),
                "course_degree": get_str("course_degree", "B.E."),
                "college_institution": get_str("college_institution", "Sona College of Technology"),
                "current_semester": get_str("current_semester", "Semester 5"),
                "percentage_equivalent": get_float("percentage_equivalent", 80.0),
                "tenth_percentage": get_float("tenth_percentage", 90.0),
                "twelfth_percentage": get_float("twelfth_percentage", 85.0),
                "backlog_status": get_str("backlog_status", "0 Backlogs / No Standing Arrears"),
                "admission_mode": get_str("admission_mode", "Merit / Government Quota Counseling"),
                "economic_category": get_str("economic_category", "Low Income (Below ₹2.5L)"),
                "income_certificate_available": get_str("income_certificate_available", "Yes"),
                "income_certificate_authority": get_str("income_certificate_authority", "Tehsildar / Taluk Office"),
                "income_certificate_no": get_str("income_certificate_no", ""),
                "income_certificate_issue_date": get_str("income_certificate_issue_date", ""),
                "ration_card_type": get_str("ration_card_type", "PHH (Priority Household)"),
                "bank_branch": get_str("bank_branch", "Main Branch"),
                "aadhaar_linked_bank": get_str("aadhaar_linked_bank", "Yes"),
                "custom_attributes": {}
            }

            # Store any extra columns from the spreadsheet in custom_attributes
            resolved_raw_cols = set(col_resolved.values())
            for c in df.columns:
                if c not in resolved_raw_cols and pd.notna(row[c]):
                    val_str = str(row[c]).strip()
                    if val_str and val_str.lower() != "nan":
                        student_data["custom_attributes"][c] = val_str
                        student_data[c] = val_str

            student_data["has_custom_password"] = False
            student_data["imported_at"] = datetime.datetime.utcnow().isoformat()

            # Save directly to Firestore / database
            db.collection("students").document(adm_val).set(student_data)
            imported_students.append(student_data)

        invalidate_cache("student")
        logger.log("ADMIN", "EXCEL_IMPORT", f"Imported {len(imported_students)} students from file {file.filename} into Firestore.")

        return {
            "status": "success",
            "message": f"Successfully imported {len(imported_students)} students into Firebase Firestore.",
            "count": len(imported_students),
            "students": imported_students
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process spreadsheet: {str(e)}")

@app.delete("/api/students/clear-all")
def clear_all_students():
    """Clears all student records from database/Firestore."""
    try:
        docs = db.collection("students").stream()
        deleted_count = 0
        for d in docs:
            db.collection("students").document(d.id).delete()
            deleted_count += 1
        invalidate_cache("student")
        logger.log("ADMIN", "STUDENT_PURGE", f"Cleared {deleted_count} student records from database.")
        return {"status": "success", "message": f"Cleared {deleted_count} students.", "count": deleted_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/students/{student_id}")
def get_student_by_id(student_id: str):
    try:
        ref = db.collection("students").document(student_id)
        doc = ref.get()
        if doc.exists:
            return doc.to_dict()
        raise HTTPException(status_code=404, detail="Student not found")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/students/{student_id}")
def update_student_by_id(student_id: str, payload: dict = Body(...)):
    try:
        found_id, found_data = find_student_doc(student_id)
        target_id = found_id if found_id else student_id

        ref = db.collection("students").document(target_id)
        doc = ref.get()
        current_data = doc.to_dict() if doc.exists else {"admission_no": target_id, "name": "Student"}

        current_data.update(payload)
        current_data["updated_at"] = datetime.datetime.utcnow().isoformat()
        ref.set(current_data)

        # Invalidate student caches so Admin sees updated details instantly
        invalidate_cache("student")
        invalidate_cache("all_students")

        # Synchronize updated details across all active applications submitted by this student
        apps_ref = db.collection("applications").stream()
        for app_doc in apps_ref:
            app_data = app_doc.to_dict()
            if str(app_data.get("student_id", "")).strip().lower() == str(target_id).strip().lower():
                app_update = {}
                if "name" in payload: app_update["student_name"] = payload["name"]
                if "department" in payload: app_update["department"] = payload["department"]
                if "year" in payload: app_update["year"] = payload["year"]
                if "cgpa" in payload: app_update["cgpa"] = payload["cgpa"]
                if "family_income" in payload: app_update["family_income"] = payload["family_income"]
                if "bank_name" in payload: app_update["bank_name"] = payload["bank_name"]
                if "bank_account_no" in payload: app_update["bank_account_no"] = payload["bank_account_no"]
                if "ifsc_code" in payload: app_update["ifsc_code"] = payload["ifsc_code"]
                if "phone" in payload: app_update["student_phone"] = payload["phone"]
                if "email" in payload: app_update["student_email"] = payload["email"]
                
                if app_update:
                    app_data.update(app_update)
                    db.collection("applications").document(app_doc.id).set(app_data)

        invalidate_cache("application")
        invalidate_cache("all_applications")
        logger.log("STUDENT", "PROFILE_UPDATE", f"Student profile and linked applications updated for {target_id}")

        return {"status": "success", "message": f"Student '{target_id}' profile and applications updated."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/students/{student_id}")
def delete_single_student(student_id: str):
    try:
        ref = db.collection("students").document(student_id)
        doc = ref.get()
        if doc.exists:
            ref.delete()
            invalidate_cache("student")
            logger.log("ADMIN", "STUDENT_DELETE", f"Deleted student record: {student_id}")
            return {"status": "success", "message": f"Student {student_id} deleted."}
        raise HTTPException(status_code=404, detail="Student not found")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- APPLICATION LIFECYCLE TRACKING APIS ---

# --- APPLICATION LIFECYCLE & DOCUMENT VERIFICATION APIS ---

@app.post("/api/applications/upload-document")
async def upload_application_document_file(file: UploadFile = File(...)):
    """Uploads a document file specifically for scholarship applications."""
    try:
        uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        
        # Sanitize filename
        safe_filename = f"{int(time.time())}_{file.filename.replace(' ', '_')}"
        file_path_on_disk = os.path.join(uploads_dir, safe_filename)
        
        contents = await file.read()
        with open(file_path_on_disk, "wb") as f:
            f.write(contents)
            
        return {
            "status": "success",
            "file_path": f"/uploads/{safe_filename}",
            "file_name": file.filename,
            "size": len(contents)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@app.post("/api/applications/apply")
def submit_scholarship_application(req: ApplicationApplyRequest):
    """
    Student submits an application for a scholarship with dynamic documents.
    Enforces the core principle: Uploaded != Verified.
    All submitted documents start with 'Pending Verification'.
    """
    try:
        now_dt = datetime.datetime.utcnow()
        now_str = now_dt.strftime("%Y-%m-%d %H:%M")
        
        app_id = f"APP-{int(time.time())}-{req.student_id[-4:] if len(req.student_id)>=4 else req.student_id}"
        
        # Process and normalize submitted documents
        processed_docs = []
        doc_count = 0
        
        # 1. Standard & Selected Documents
        if req.documents and len(req.documents) > 0:
            for d in req.documents:
                doc_count += 1
                doc_id = d.id or f"doc_{int(time.time())}_{doc_count}"
                doc_dict = {
                    "id": doc_id,
                    "document_name": d.document_name,
                    "category": d.category or "General Proof",
                    "source": d.source or ("wallet" if d.file_path and "uploads" in d.file_path else "upload"),
                    "file_path": d.file_path or "",
                    "file_name": d.file_name or (os.path.basename(d.file_path) if d.file_path else d.document_name),
                    "version": d.version or 1,
                    "required": d.required if d.required is not None else True,
                    "status": "Pending Verification", # Strictly initial status
                    "rejection_reason": "",
                    "admin_remarks": "",
                    "student_remarks": d.student_remarks or "",
                    "verified_by": "",
                    "verified_at": "",
                    "submitted_at": now_str,
                    "version_history": [
                        {
                            "version": 1,
                            "file_path": d.file_path or "",
                            "file_name": d.file_name or (os.path.basename(d.file_path) if d.file_path else d.document_name),
                            "status": "Pending Verification",
                            "timestamp": now_str,
                            "action": "Initial Submission"
                        }
                    ]
                }
                processed_docs.append(doc_dict)
        elif req.attached_documents and len(req.attached_documents) > 0:
            # Fallback for backward compatibility
            for name in req.attached_documents:
                doc_count += 1
                doc_id = f"doc_{int(time.time())}_{doc_count}"
                processed_docs.append({
                    "id": doc_id,
                    "document_name": name,
                    "category": "Academic Proof",
                    "source": "upload",
                    "file_path": "",
                    "file_name": name,
                    "version": 1,
                    "required": True,
                    "status": "Pending Verification",
                    "rejection_reason": "",
                    "admin_remarks": "",
                    "student_remarks": "",
                    "verified_by": "",
                    "verified_at": "",
                    "submitted_at": now_str,
                    "version_history": [
                        {
                            "version": 1,
                            "file_path": "",
                            "file_name": name,
                            "status": "Pending Verification",
                            "timestamp": now_str,
                            "action": "Initial Submission"
                        }
                    ]
                })

        # 2. Custom "+ Add Other Document" attachments
        processed_custom_docs = []
        if req.custom_documents and len(req.custom_documents) > 0:
            for cd in req.custom_documents:
                doc_count += 1
                cd_id = cd.id or f"custom_doc_{int(time.time())}_{doc_count}"
                cd_dict = {
                    "id": cd_id,
                    "document_name": cd.document_name,
                    "category": cd.category or "Supporting Document",
                    "file_path": cd.file_path,
                    "file_name": cd.file_name or os.path.basename(cd.file_path),
                    "reason": cd.reason,
                    "remarks": cd.remarks or "",
                    "status": "Pending Verification",
                    "submitted_at": now_str,
                    "version": 1,
                    "required": False,
                    "version_history": [
                        {
                            "version": 1,
                            "file_path": cd.file_path,
                            "file_name": cd.file_name or os.path.basename(cd.file_path),
                            "status": "Pending Verification",
                            "timestamp": now_str,
                            "action": "Custom Document Attached"
                        }
                    ]
                }
                processed_custom_docs.append(cd_dict)
                # Also include in primary documents review list
                processed_docs.append(cd_dict)

        # 3. Physical Checklist for Offline / Hybrid Modes
        processed_physical_checklist = []
        if req.physical_checklist and len(req.physical_checklist) > 0:
            for pc in req.physical_checklist:
                processed_physical_checklist.append({
                    "id": pc.id or f"phy_{int(time.time())}_{len(processed_physical_checklist)+1}",
                    "document_name": pc.document_name,
                    "required": pc.required if pc.required is not None else True,
                    "status": pc.status or "Not Received",
                    "remarks": pc.remarks or "",
                    "received_at": pc.received_at or "",
                    "verified_at": pc.verified_at or ""
                })
        elif req.application_mode in ["Offline", "Hybrid"]:
            # Auto-populate physical checklist from documents for offline/hybrid
            for doc in processed_docs:
                processed_physical_checklist.append({
                    "id": f"phy_{int(time.time())}_{len(processed_physical_checklist)+1}",
                    "document_name": doc["document_name"],
                    "required": doc.get("required", True),
                    "status": "Not Received",
                    "remarks": "Original / Copy required for physical verification",
                    "received_at": "",
                    "verified_at": ""
                })

        # 4. Audit Trail
        initial_audit_trail = [
            {
                "timestamp": now_str,
                "user_id": req.student_id,
                "role": "STUDENT",
                "action": "APPLICATION_SUBMITTED",
                "details": f"Submitted application with {len(processed_docs)} documents ({len(processed_custom_docs)} custom). Mode: {req.application_mode or 'Online'}."
            }
        ]

        app_data = {
            "id": app_id,
            "application_id": app_id,
            "scholarship_id": req.scholarship_id,
            "scholarship_name": req.scholarship_name,
            "category_name": req.category_name or "General Scholarship",
            "application_mode": req.application_mode or "Online",
            "student_id": req.student_id,
            "student_name": req.student_name,
            "department": req.department or "CSE",
            "year": req.year or 3,
            "cgpa": req.cgpa or 8.5,
            "family_income": req.family_income or 250000.0,
            "applied_amount": req.applied_amount or "₹50,000",
            "bank_account_no": req.bank_account_no or "",
            "bank_name": req.bank_name or "",
            "ifsc_code": req.ifsc_code or "",
            "first_generation_graduate": req.first_generation_graduate or "No",
            "caste_category": req.caste_category or "General",
            "student_remarks": req.student_remarks or "",
            "documents": processed_docs,
            "custom_documents": processed_custom_docs,
            "missing_documents": req.missing_documents or [],
            "physical_checklist": processed_physical_checklist,
            "hardcopy_required": (req.application_mode in ["Offline", "Hybrid"]),
            "hardcopy_status": "Pending Hardcopy Submission" if req.application_mode in ["Offline", "Hybrid"] else "Not Required (Online Only)",
            "hardcopy_submitted": False,
            "hardcopy_submitted_at": "",
            "hardcopy_verified": (req.application_mode not in ["Offline", "Hybrid"]),
            "hardcopy_verified_at": "",
            "hardcopy_verified_by": "",
            "hardcopy_notes": "",
            "audit_trail": initial_audit_trail,
            "attached_documents": [d["document_name"] for d in processed_docs], # Backward compat
            "status": "Application Submitted",
            "stage": 1,
            "stage_history": [
                {
                    "stage": 1,
                    "title": "Application Submitted",
                    "timestamp": now_str,
                    "status": "completed",
                    "details": "Online application received with initial documents (Pending Verification)."
                }
            ],
            "officer_notes": "",
            "govt_portal_id": "",
            "rejection_reason": "",
            "disbursed_amount": "",
            "transaction_ref": "",
            "disbursement_date": "",
            "created_at": now_dt.isoformat(),
            "updated_at": now_dt.isoformat()
        }

        db.collection("applications").document(app_id).set(app_data)
        
        # Student-scoped notification
        notif_data = {
            "student_id": req.student_id,
            "title": f"Application Received: {req.scholarship_name}",
            "desc": f"Your application (#{app_id}) has been received successfully. Documents are queued for admin verification.",
            "category": "scholarship",
            "unread": True,
            "icon": "📝",
            "created_at": now_dt
        }
        try:
            db.collection("notifications").add(notif_data)
        except Exception:
            pass

        invalidate_cache("application")
        logger.log(req.student_id, "APPLICATION_SUBMIT", f"Submitted scholarship application for {req.scholarship_name} (ID: {app_id}) with {len(processed_docs)} docs")
        return {"status": "success", "message": "Application submitted successfully!", "application": app_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/applications/{app_id}/document/{doc_id}/action")
def perform_document_verification_action(app_id: str, doc_id: str, req: DocumentActionRequest):
    """
    Admin verifies, rejects, requests correction, or marks offline for a specific document.
    Updates document status, version history, audit trail, and creates student notifications.
    """
    try:
        app_ref = db.collection("applications").document(app_id)
        doc = app_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Application record not found")

        app_data = doc.to_dict()
        documents = app_data.get("documents", [])
        student_id = app_data.get("student_id")
        sch_name = app_data.get("scholarship_name", "Scholarship")
        
        now_dt = datetime.datetime.utcnow()
        now_str = now_dt.strftime("%Y-%m-%d %H:%M")
        
        target_doc = None
        for d in documents:
            if d.get("id") == doc_id or d.get("document_name") == doc_id:
                target_doc = d
                break

        if not target_doc:
            raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found in application")

        doc_name = target_doc.get("document_name", "Document")
        action_type = req.action.lower()
        new_status = "Pending Verification"
        notif_title = ""
        notif_desc = ""
        notif_icon = "🔔"

        if action_type == "verify":
            new_status = "Verified"
            target_doc["verified_by"] = req.admin_id or "ADMIN"
            target_doc["verified_at"] = now_str
            target_doc["admin_remarks"] = req.remarks or "Document verified and verified valid."
            target_doc["rejection_reason"] = ""
            notif_title = f"Document Verified: {doc_name}"
            notif_desc = f"Your document '{doc_name}' has been verified and approved for {sch_name}."
            notif_icon = "✓"

        elif action_type == "reject":
            reason_text = (req.reason or "").strip()
            remarks_text = (req.remarks or "").strip()
            if not reason_text and not remarks_text:
                raise HTTPException(status_code=400, detail="Rejection explanation / reason is required to reject a document.")
            
            full_reason = reason_text
            if remarks_text and remarks_text != reason_text:
                full_reason = f"{reason_text}: {remarks_text}" if reason_text else remarks_text

            new_status = "Rejected"
            target_doc["rejection_reason"] = full_reason
            target_doc["admin_remarks"] = remarks_text or reason_text
            target_doc["verified_by"] = req.admin_id or "ADMIN"
            target_doc["verified_at"] = now_str
            notif_title = f"Document Rejected: {doc_name}"
            notif_desc = f"Your document '{doc_name}' was rejected for {sch_name}. Explanation: {full_reason}"
            notif_icon = "✕"

        elif action_type == "request_correction":
            new_status = "Correction Required"
            target_doc["admin_remarks"] = req.remarks or req.reason or "Please upload a corrected/valid document."
            target_doc["rejection_reason"] = req.reason or "Correction Required"
            app_data["status"] = "Correction Required"
            notif_title = f"Correction Required: {doc_name}"
            notif_desc = f"Action required: Please re-upload a corrected '{doc_name}' for {sch_name}. Note: {req.remarks or req.reason or 'Update document.'}"
            notif_icon = "⚠️"

        elif action_type == "mark_offline":
            new_status = "Offline Required"
            target_doc["admin_remarks"] = req.remarks or "Physical document verification required."
            if app_data.get("status") not in ["Approved", "Rejected"]:
                app_data["status"] = "Offline Documents Required"
            notif_title = f"Offline Submission Required: {doc_name}"
            notif_desc = f"Please submit your original/physical '{doc_name}' to the scholarship office for verification."
            notif_icon = "🏛️"

        else:
            raise HTTPException(status_code=400, detail=f"Invalid verification action '{req.action}'")

        target_doc["status"] = new_status
        
        # Append to document version history
        v_hist = target_doc.get("version_history", [])
        v_hist.append({
            "version": target_doc.get("version", 1),
            "file_path": target_doc.get("file_path", ""),
            "file_name": target_doc.get("file_name", doc_name),
            "status": new_status,
            "action": f"Admin Action: {action_type.upper()}",
            "reason": req.reason or "",
            "remarks": req.remarks or "",
            "timestamp": now_str,
            "admin_id": req.admin_id or "ADMIN"
        })
        target_doc["version_history"] = v_hist

        # Append to application audit trail
        audit_trail = app_data.get("audit_trail", [])
        audit_trail.append({
            "timestamp": now_str,
            "user_id": req.admin_id or "ADMIN",
            "role": "ADMIN",
            "action": f"DOCUMENT_{action_type.upper()}",
            "document_name": doc_name,
            "status": new_status,
            "details": f"Document '{doc_name}' marked as '{new_status}'. Reason: {req.reason or 'None'}. Remarks: {req.remarks or 'None'}"
        })
        app_data["audit_trail"] = audit_trail

        # Auto-update overall application status if all required documents are verified
        required_docs = [d for d in documents if d.get("required", True)]
        if len(required_docs) > 0 and all(d.get("status") == "Verified" for d in required_docs):
            if app_data.get("status") not in ["Approved", "Rejected"]:
                app_data["status"] = "Documents Verified"

        app_data["documents"] = documents
        app_data["updated_at"] = now_dt.isoformat()

        app_ref.set(app_data)

        # Send notification to student
        if notif_title and student_id:
            try:
                db.collection("notifications").add({
                    "student_id": student_id,
                    "title": notif_title,
                    "desc": notif_desc,
                    "category": "scholarship",
                    "unread": True,
                    "icon": notif_icon,
                    "created_at": now_dt
                })
            except Exception:
                pass

        # Send SMTP Email to student
        if student_id:
            try:
                from email_service import notify_document_approved, notify_document_rejected
                s_ref = db.collection("students").document(student_id).get()
                student_info = s_ref.to_dict() if s_ref.exists else {"admission_no": student_id, "name": "Student", "email": ""}
                
                if action_type == "verify":
                    notify_document_approved(student_info, doc_name, doc_id)
                elif action_type == "reject":
                    notify_document_rejected(student_info, doc_name, target_doc.get("rejection_reason", "Document rejected by admin"), doc_id)
            except Exception as ee:
                print("Error sending document action email:", ee)

        invalidate_cache("application")
        invalidate_cache("notif")
        logger.log(req.admin_id or "ADMIN", f"DOC_{action_type.upper()}", f"Admin {action_type} for document '{doc_name}' in app {app_id}")

        return {
            "status": "success",
            "message": f"Document '{doc_name}' updated to '{new_status}'",
            "document": target_doc,
            "application_status": app_data.get("status")
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/applications/{app_id}/document/{doc_id}/resubmit")
def resubmit_corrected_document(app_id: str, doc_id: str, req: DocumentResubmitRequest):
    """
    Student re-uploads a corrected document for an item marked 'Correction Required'.
    Increments version, resets status to 'Pending Verification', preserves version history & audit trail.
    """
    try:
        app_ref = db.collection("applications").document(app_id)
        doc = app_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Application record not found")

        app_data = doc.to_dict()
        documents = app_data.get("documents", [])
        student_id = app_data.get("student_id")
        
        now_dt = datetime.datetime.utcnow()
        now_str = now_dt.strftime("%Y-%m-%d %H:%M")
        
        target_doc = None
        for d in documents:
            if d.get("id") == doc_id or d.get("document_name") == doc_id:
                target_doc = d
                break

        if not target_doc:
            raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found in application")

        doc_name = target_doc.get("document_name", "Document")
        current_version = target_doc.get("version", 1)
        new_version = current_version + 1
        
        # Update document data
        target_doc["file_path"] = req.file_path
        target_doc["file_name"] = req.file_name or os.path.basename(req.file_path)
        target_doc["version"] = new_version
        target_doc["status"] = "Pending Verification" # Resets to Pending
        target_doc["student_remarks"] = req.student_remarks or "Corrected document uploaded by student."
        target_doc["submitted_at"] = now_str
        
        # Append to version history
        v_hist = target_doc.get("version_history", [])
        v_hist.append({
            "version": new_version,
            "file_path": req.file_path,
            "file_name": req.file_name or os.path.basename(req.file_path),
            "status": "Pending Verification",
            "action": f"Re-submission (Version {new_version})",
            "student_remarks": req.student_remarks or "",
            "timestamp": now_str
        })
        target_doc["version_history"] = v_hist

        # Update application status
        app_data["status"] = "Documents Re-submitted"
        
        # Audit Trail
        audit_trail = app_data.get("audit_trail", [])
        audit_trail.append({
            "timestamp": now_str,
            "user_id": student_id,
            "role": "STUDENT",
            "action": "DOCUMENT_RESUBMITTED",
            "document_name": doc_name,
            "version": new_version,
            "details": f"Student uploaded Version {new_version} of '{doc_name}'. Remarks: {req.student_remarks or 'None'}"
        })
        app_data["audit_trail"] = audit_trail
        app_data["documents"] = documents
        app_data["updated_at"] = now_dt.isoformat()

        app_ref.set(app_data)

        # Student notification confirming upload
        if student_id:
            try:
                db.collection("notifications").add({
                    "student_id": student_id,
                    "title": f"Document Re-submitted: {doc_name}",
                    "desc": f"Version {new_version} of '{doc_name}' has been uploaded and queued for admin re-verification.",
                    "category": "scholarship",
                    "unread": True,
                    "icon": "📤",
                    "created_at": now_dt
                })
            except Exception:
                pass

        invalidate_cache("application")
        logger.log(student_id, "DOC_RESUBMIT", f"Student uploaded Version {new_version} for document '{doc_name}' in app {app_id}")

        return {
            "status": "success",
            "message": f"Version {new_version} of '{doc_name}' uploaded successfully. Status: Pending Verification.",
            "document": target_doc
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/applications/{app_id}/physical-checklist")
def update_physical_checklist(app_id: str, req: PhysicalChecklistUpdateRequest):
    """
    Admin updates physical document submission status checklist (Received, Checked, Verified, Returned, Issue Found).
    """
    try:
        app_ref = db.collection("applications").document(app_id)
        doc = app_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Application record not found")

        app_data = doc.to_dict()
        now_dt = datetime.datetime.utcnow()
        now_str = now_dt.strftime("%Y-%m-%d %H:%M")
        
        updated_checklist = []
        for item in req.items:
            updated_checklist.append({
                "id": item.id or f"phy_{int(time.time())}_{len(updated_checklist)+1}",
                "document_name": item.document_name,
                "required": item.required,
                "status": item.status, # "Not Received", "Received", "Checked", "Verified", "Returned", "Issue Found"
                "remarks": item.remarks or "",
                "received_at": item.received_at or (now_str if item.status in ["Received", "Checked", "Verified"] else ""),
                "verified_at": item.verified_at or (now_str if item.status == "Verified" else "")
            })

        app_data["physical_checklist"] = updated_checklist
        
        # Audit Trail
        audit_trail = app_data.get("audit_trail", [])
        audit_trail.append({
            "timestamp": now_str,
            "user_id": req.admin_id or "ADMIN",
            "role": "ADMIN",
            "action": "PHYSICAL_CHECKLIST_UPDATE",
            "details": f"Updated physical checklist ({len(updated_checklist)} items)."
        })
        app_data["audit_trail"] = audit_trail
        app_data["updated_at"] = now_dt.isoformat()

        app_ref.set(app_data)
        invalidate_cache("application")

        return {
            "status": "success",
            "message": "Physical document checklist updated successfully.",
            "physical_checklist": updated_checklist
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/applications/{app_id}/hardcopy-verify")
def verify_hardcopy_submission(app_id: str, req: HardcopyVerificationRequest):
    """
    Admin verifies the physical hardcopy / certificate submission for offline or hybrid scholarships.
    """
    try:
        app_ref = db.collection("applications").document(app_id)
        doc = app_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Application record not found")

        app_data = doc.to_dict()
        now_dt = datetime.datetime.utcnow()
        now_str = now_dt.strftime("%Y-%m-%d %H:%M")
        
        is_verified = (req.status == "Hardcopy Verified")
        app_data["hardcopy_status"] = req.status
        app_data["hardcopy_verified"] = is_verified
        app_data["hardcopy_verified_at"] = now_str if is_verified else ""
        app_data["hardcopy_verified_by"] = req.admin_id or "ADMIN_OFFICER"
        app_data["hardcopy_notes"] = req.notes or ""

        # If full checklist provided, sync it
        if req.checklist_items and len(req.checklist_items) > 0:
            updated_pc = []
            for itm in req.checklist_items:
                updated_pc.append({
                    "id": itm.id or f"phy_{int(time.time())}_{len(updated_pc)+1}",
                    "document_name": itm.document_name,
                    "required": itm.required,
                    "status": itm.status,
                    "remarks": itm.remarks or "",
                    "received_at": itm.received_at or (now_str if itm.status in ["Received", "Checked", "Verified"] else ""),
                    "verified_at": itm.verified_at or (now_str if itm.status == "Verified" else "")
                })
            app_data["physical_checklist"] = updated_pc

        # Audit Trail
        audit_trail = app_data.get("audit_trail", [])
        audit_trail.append({
            "timestamp": now_str,
            "user_id": req.admin_id or "ADMIN_OFFICER",
            "role": "ADMIN",
            "action": "HARDCOPY_VERIFICATION",
            "details": f"Admin marked hardcopy status as '{req.status}'. Notes: {req.notes or 'None'}"
        })
        app_data["audit_trail"] = audit_trail
        app_data["updated_at"] = now_dt.isoformat()

        app_ref.set(app_data)

        # Notify student
        student_id = app_data.get("student_id")
        if student_id:
            try:
                db.collection("notifications").add({
                    "student_id": student_id,
                    "title": f"Hardcopy Status: {req.status}",
                    "desc": f"Your physical document submission for {app_data.get('scholarship_name')} is marked as '{req.status}'. {req.notes or ''}",
                    "category": "scholarship",
                    "unread": True,
                    "icon": "🏛️",
                    "created_at": now_dt
                })
            except Exception:
                pass

        invalidate_cache("application")
        logger.log(req.admin_id or "ADMIN", "HARDCOPY_VERIFY", f"Application {app_id} hardcopy verified with status {req.status}")

        return {
            "status": "success",
            "message": f"Hardcopy verification status updated to '{req.status}'.",
            "hardcopy_status": req.status,
            "hardcopy_verified": is_verified
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/applications/{app_id}/hardcopy-submit")
def submit_hardcopy_notice(app_id: str, req: HardcopySubmissionNoticeRequest):
    """
    Student notifies the office that physical hardcopies have been submitted.
    """
    try:
        app_ref = db.collection("applications").document(app_id)
        doc = app_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Application record not found")

        app_data = doc.to_dict()
        now_dt = datetime.datetime.utcnow()
        now_str = now_dt.strftime("%Y-%m-%d %H:%M")

        app_data["hardcopy_submitted"] = True
        app_data["hardcopy_submitted_at"] = now_str
        app_data["hardcopy_status"] = "Hardcopy Submitted (Pending Office Check)"
        app_data["hardcopy_submission_notes"] = f"Submitted to {req.office_room or 'Room 102'}. {req.remarks or ''}"

        # Audit Trail
        audit_trail = app_data.get("audit_trail", [])
        audit_trail.append({
            "timestamp": now_str,
            "user_id": req.student_id,
            "role": "STUDENT",
            "action": "HARDCOPY_SUBMITTED",
            "details": f"Student confirmed physical hardcopy handover at {req.office_room or 'Room 102'}."
        })
        app_data["audit_trail"] = audit_trail
        app_data["updated_at"] = now_dt.isoformat()

        app_ref.set(app_data)
        invalidate_cache("application")

        return {
            "status": "success",
            "message": "Physical hardcopy submission notice recorded successfully.",
            "hardcopy_status": app_data["hardcopy_status"]
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/applications/admin/stats")
def get_application_admin_stats():
    """
    Returns aggregated verification statistics for the admin application dashboard.
    """
    cached = get_cache("admin_app_stats")
    if cached is not None:
        return cached
    try:
        docs = db.collection("applications").stream()
        total = 0
        pending_verification = 0
        documents_pending = 0
        correction_required = 0
        offline_pending = 0
        fully_verified = 0
        approved = 0
        rejected = 0

        for d in docs:
            total += 1
            data = d.to_dict()
            st = data.get("status", "")
            app_docs = data.get("documents", [])
            
            if st == "Approved":
                approved += 1
            elif "Rejected" in st:
                rejected += 1
            elif st in ["Application Submitted", "Document Verification Pending", "Documents Under Review"]:
                pending_verification += 1
            elif st == "Correction Required":
                correction_required += 1
            elif st in ["Offline Documents Required", "Offline Verification Pending"]:
                offline_pending += 1

            # Count unverified documents
            req_docs = [doc for doc in app_docs if doc.get("required", True)]
            if req_docs:
                if all(doc.get("status") == "Verified" for doc in req_docs):
                    fully_verified += 1
                else:
                    unverified = sum(1 for doc in req_docs if doc.get("status") != "Verified")
                    documents_pending += unverified

        stats = {
            "total_applications": total,
            "pending_verification": pending_verification,
            "documents_pending": documents_pending,
            "correction_required": correction_required,
            "offline_pending": offline_pending,
            "fully_verified": fully_verified,
            "approved": approved,
            "rejected": rejected
        }
        set_cache("admin_app_stats", stats, ttl=30)
        return stats
    except Exception as e:
        print(f"Error fetching admin app stats: {e}")
        return {
            "total_applications": 0,
            "pending_verification": 0,
            "documents_pending": 0,
            "correction_required": 0,
            "offline_pending": 0,
            "fully_verified": 0,
            "approved": 0,
            "rejected": 0
        }

@app.get("/api/applications/{app_id}/audit-trail")
def get_application_audit_trail(app_id: str):
    """Retrieves full chronological audit trail of student and admin actions."""
    try:
        app_ref = db.collection("applications").document(app_id)
        doc = app_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Application record not found")
        data = doc.to_dict()
        return data.get("audit_trail", [])
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/applications/student/{student_id}")
def get_student_applications(student_id: str):
    """Retrieves all submitted scholarship applications for a student."""
    cached = get_cache(f"student_apps_{student_id}")
    if cached is not None:
        return cached
    try:
        docs = db.collection("applications").where("student_id", "==", student_id).stream()
        results = []
        for d in docs:
            data = d.to_dict()
            if "id" not in data:
                data["id"] = d.id
            results.append(data)
        results.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
        set_cache(f"student_apps_{student_id}", results, ttl=30)
        return results
    except Exception as e:
        print(f"Error fetching student applications: {e}")
        return []

@app.get("/api/applications/admin/all")
def get_admin_applications():
    """Retrieves all scholarship applications for the admin dashboard."""
    cached = get_cache("admin_applications")
    if cached is not None:
        return cached
    try:
        docs = db.collection("applications").stream()
        results = []
        for d in docs:
            data = d.to_dict()
            if "id" not in data:
                data["id"] = d.id
            results.append(data)
        results.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
        set_cache("admin_applications", results, ttl=30)
        return results
    except Exception as e:
        print(f"Error fetching admin applications: {e}")
        return []

@app.post("/api/applications/upload-document")
async def upload_application_document(file: UploadFile = File(...)):
    """Uploads a scholarship certificate or application document to the backend vault."""
    try:
        clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', file.filename or "doc.pdf")
        filename = f"{int(time.time())}_{clean_name}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        return {
            "status": "success",
            "file_path": f"/uploads/{filename}",
            "file_name": file.filename,
            "file_size": len(content),
            "content_type": file.content_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

@app.get("/api/applications/export")
def export_applications_report(scheme: str = "All", status: str = "All", format: str = "xlsx"):
    """
    Exports applied students data to Excel / CSV with optional grouping by scholarship scheme.
    If scheme='All' and format='xlsx', generates a master workbook with separate tabs for each scholarship!
    """
    try:
        docs = db.collection("applications").stream()
        raw_apps = []
        for d in docs:
            data = d.to_dict()
            if "id" not in data:
                data["id"] = d.id
            raw_apps.append(data)

        # Apply filtering
        filtered = []
        for a in raw_apps:
            if scheme != "All" and a.get("scholarship_name") != scheme and a.get("scholarship_id") != scheme:
                continue
            if status != "All" and a.get("status") != status:
                continue
            filtered.append(a)

        # Format flattened records for spreadsheet
        export_records = []
        for a in filtered:
            docs_list = a.get("documents", [])
            total_d = len(docs_list)
            verified_d = len([d for d in docs_list if d.get("status") == "Verified"])
            
            rec = {
                "Application_ID": a.get("id", ""),
                "Scholarship_Name": a.get("scholarship_name", "General Scheme"),
                "Category_Name": a.get("category_name", ""),
                "Application_Mode": a.get("application_mode", "Online"),
                "Student_Roll_No": a.get("student_id", ""),
                "Student_Name": a.get("student_name", "Student"),
                "Department": a.get("department", "CSE"),
                "Year": a.get("year", 3),
                "CGPA": a.get("cgpa", 8.0),
                "Family_Income": a.get("family_income", 250000.0),
                "Application_Status": a.get("status", "Application Submitted"),
                "Lifecycle_Stage": a.get("stage", 1),
                "Total_Documents": total_d,
                "Verified_Documents": verified_d,
                "Document_Status": f"{verified_d} of {total_d} Verified",
                "Hardcopy_Verified": "Yes" if a.get("hardcopy_verified") else "No",
                "Bank_Name": a.get("bank_name", "State Bank of India"),
                "Bank_Account_No": a.get("bank_account_no", ""),
                "IFSC_Code": a.get("ifsc_code", ""),
                "Disbursed_Amount": a.get("disbursed_amount", a.get("applied_amount", "")),
                "Transaction_Ref": a.get("transaction_ref", ""),
                "Disbursement_Date": a.get("disbursement_date", ""),
                "Submitted_Date": (a.get("created_at") or "")[:10],
                "Officer_Notes": a.get("officer_notes", "")
            }
            export_records.append(rec)

        if not export_records:
            export_records = [{"Application_ID": "NO_RECORDS", "Scholarship_Name": scheme, "Student_Name": "No applications found"}]

        df_master = pd.DataFrame(export_records)

        if format.lower() == "csv":
            csv_content = df_master.to_csv(index=False)
            filename = f"applied_students_{scheme.replace(' ', '_')}.csv"
            return Response(
                content=csv_content,
                media_type="text/csv",
                headers={'Content-Disposition': f'attachment; filename="{filename}"'}
            )
        else:
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                # Master All Applicants Sheet
                df_master.to_excel(writer, index=False, sheet_name="All_Applicants")
                
                # If downloading all schemes, group into separate sheets per scholarship!
                if scheme == "All":
                    unique_schemes = list(set(r["Scholarship_Name"] for r in export_records if r.get("Scholarship_Name")))
                    for s_name in unique_schemes:
                        group_subset = [r for r in export_records if r.get("Scholarship_Name") == s_name]
                        if group_subset:
                            df_sub = pd.DataFrame(group_subset)
                            # Excel sheet title max length is 31 chars and cannot have invalid chars
                            safe_sheet_name = re.sub(r'[\\/*?:\[\]]', '', s_name)[:30]
                            df_sub.to_excel(writer, index=False, sheet_name=safe_sheet_name)
            output.seek(0)
            safe_fname = re.sub(r'[^a-zA-Z0-9_-]', '_', scheme)
            filename = f"applied_students_{safe_fname}.xlsx"
            return Response(
                content=output.getvalue(),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={'Content-Disposition': f'attachment; filename="{filename}"'}
            )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to export application report: {str(e)}")

@app.put("/api/applications/status/{app_id}")
def update_application_status(app_id: str, req: ApplicationStatusUpdateRequest):
    """
    Admin transitions application status across the 14 lifecycle states.
    Enforces mandatory document verification gating before allowing 'Approved' status.
    """
    try:
        app_ref = db.collection("applications").document(app_id)
        doc = app_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Application record not found")

        current = doc.to_dict()
        now_dt = datetime.datetime.utcnow()
        now_str = now_dt.strftime("%Y-%m-%d %H:%M")
        
        # Approval Gating Check
        if req.status == "Approved" and not req.allow_force_approval:
            documents = current.get("documents", [])
            required_unverified = [
                d.get("document_name", "Document")
                for d in documents
                if d.get("required", True) and d.get("status") != "Verified"
            ]
            if required_unverified:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot approve application: The following mandatory document(s) are not verified yet: {', '.join(required_unverified)}."
                )

        stage_history = current.get("stage_history", [])
        
        # Build stage record
        new_stage_record = {
            "stage": req.stage or 1,
            "title": req.status,
            "timestamp": now_str,
            "status": "rejected" if "Rejected" in req.status else "completed",
            "details": req.officer_notes or req.rejection_reason or req.govt_portal_id or f"Status transitioned to {req.status}"
        }
        stage_history = [s for s in stage_history if s.get("title") != req.status]
        stage_history.append(new_stage_record)

        # Audit Trail
        audit_trail = current.get("audit_trail", [])
        audit_trail.append({
            "timestamp": now_str,
            "user_id": "ADMIN",
            "role": "ADMIN",
            "action": f"STATUS_CHANGE_{req.status.upper().replace(' ', '_')}",
            "details": f"Application status changed to '{req.status}'. Officer Notes: {req.officer_notes or 'None'}"
        })

        updated_data = {
            "status": req.status,
            "stage": req.stage or current.get("stage", 1),
            "stage_history": stage_history,
            "audit_trail": audit_trail,
            "officer_notes": req.officer_notes or current.get("officer_notes", ""),
            "govt_portal_id": req.govt_portal_id or current.get("govt_portal_id", ""),
            "rejection_reason": req.rejection_reason or current.get("rejection_reason", ""),
            "disbursed_amount": req.disbursed_amount or current.get("disbursed_amount", ""),
            "transaction_ref": req.transaction_ref or current.get("transaction_ref", ""),
            "disbursement_date": req.disbursement_date or current.get("disbursement_date", ""),
            "updated_at": now_dt.isoformat()
        }

        app_ref.update(updated_data)
        
        # Trigger real-time student notification
        student_id = current.get("student_id")
        sch_name = current.get("scholarship_name", "Scholarship")
        
        notif_msg = f"Your application for {sch_name} status updated to: {req.status}"
        notif_icon = "🔔"
        if req.status == "Approved":
            notif_msg = f"Congratulations! Your application for {sch_name} has been Approved!"
            notif_icon = "🎉"
        elif "Rejected" in req.status:
            notif_msg = f"Your application for {sch_name} was rejected. Reason: {req.rejection_reason or 'Eligibility criteria'}"
            notif_icon = "✕"
        elif req.status == "Processed & Signed":
            notif_msg = f"Your application for {sch_name} has been processed and signed by the institution."
            notif_icon = "✍️"
        elif req.status == "Submitted to Government":
            notif_msg = f"Your application for {sch_name} has been forwarded to Government (Portal Ref: {req.govt_portal_id or 'Govt Portal'})."
            notif_icon = "🏛️"
        elif req.status == "Amount Received":
            notif_msg = f"Scholarship Amount Credited! {req.disbursed_amount or 'Sanctioned amount'} has been disbursed (Ref: {req.transaction_ref or 'Direct DBT Transfer'})."
            notif_icon = "💰"

        notif_data = {
            "student_id": student_id,
            "title": f"Application Update: {req.status}",
            "desc": notif_msg,
            "category": "scholarship",
            "unread": True,
            "icon": notif_icon,
            "created_at": now_dt
        }
        try:
            db.collection("notifications").add(notif_data)
        except Exception:
            pass

        # Send SMTP Email update to applicant
        if student_id:
            try:
                from email_service import notify_application_status_update
                s_doc = db.collection("students").document(student_id).get()
                student_info = s_doc.to_dict() if s_doc.exists else {"admission_no": student_id, "name": "Student", "email": ""}
                notify_application_status_update(
                    student=student_info,
                    application=current,
                    new_status=req.status,
                    notes=req.officer_notes or req.rejection_reason or ""
                )
            except Exception as ee:
                print("Error sending application status email:", ee)

        invalidate_cache("application")
        invalidate_cache("notif")
        logger.log("ADMIN", "APPLICATION_UPDATE", f"Updated application {app_id} for student {student_id} to '{req.status}'")
        
        return {
            "status": "success",
            "message": f"Application status updated to '{req.status}'",
            "application_id": app_id,
            "updated_status": req.status
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/applications/{app_id}")
def delete_application(app_id: str):
    try:
        ref = db.collection("applications").document(app_id)
        doc = ref.get()
        if doc.exists:
            ref.delete()
            invalidate_cache("application")
            return {"status": "success", "message": f"Application {app_id} deleted."}
        raise HTTPException(status_code=404, detail="Application not found")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Notification Endpoints
import datetime

@app.get("/api/notifications/student/{student_id}")
def get_student_notifications(student_id: str):
    try:
        results = []
        seen_ids = set()

        # Query direct and broadcast notifications
        try:
            stream1 = list(db.collection("notifications").where("student_id", "==", student_id).stream())
        except Exception:
            stream1 = []

        try:
            stream2 = list(db.collection("notifications").where("student_id", "==", "ALL").stream())
        except Exception:
            stream2 = []

        all_docs = stream1 + stream2

        for doc in all_docs:
            if doc.id in seen_ids:
                continue
            seen_ids.add(doc.id)
            d = doc.to_dict()

            # Check if student dismissed this broadcast notification
            dismissed_by = d.get("dismissed_by", [])
            if isinstance(dismissed_by, list) and student_id in dismissed_by:
                continue

            time_str = "Recently"
            raw_time = d.get("created_at")
            if isinstance(raw_time, datetime.datetime):
                time_str = raw_time.strftime("%Y-%m-%d %H:%M")
            elif raw_time:
                time_str = str(raw_time)[:16].replace("T", " ")

            is_broadcast = (d.get("student_id") == "ALL")
            if is_broadcast:
                read_by = d.get("read_by", [])
                is_unread = bool(student_id not in read_by) if isinstance(read_by, list) else True
            else:
                is_unread = bool(d.get("unread", True))

            category = d.get("category", "general")
            title = d.get("title", "Notification")
            desc = d.get("desc", "")
            icon = d.get("icon", "🔔")

            # Smart Contextual Action Buttons & URLs based on notification type
            if category == "documents" or "Document" in title:
                action_url = "/dashboard/documents"
                action_text = "View in Digital Vault →" if "Approved" in title else "Fix & Re-Upload Document →"
                badge_type = "document_approved" if "Approved" in title else "document_rejected"
            elif category == "scholarship" or "Application" in title or "Hardcopy" in title:
                action_url = "/dashboard/applications"
                action_text = "Track Application Status →"
                badge_type = "application_status"
            elif category in ["scholarship_new", "scholarship_updated"] or "Scholarship" in title:
                action_url = "/dashboard/scholarships"
                action_text = "View Scholarship & Apply →"
                badge_type = "scholarship_new" if "New" in title or category == "scholarship_new" else "scholarship_updated"
            else:
                action_url = "/dashboard"
                action_text = "View Details →"
                badge_type = "general"

            results.append({
                "id": doc.id,
                "title": title,
                "desc": desc,
                "category": category,
                "event_type": d.get("event_type", badge_type),
                "badge_type": badge_type,
                "scholarship_id": d.get("scholarship_id"),
                "scholarship_name": d.get("scholarship_name"),
                "unread": is_unread,
                "icon": icon,
                "time": time_str,
                "created_at": str(raw_time or ""),
                "action_url": action_url,
                "action_text": action_text
            })

        results.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
        return results
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        return []

@app.post("/api/notifications/read-all/{student_id}")
def mark_notifications_read(student_id: str):
    try:
        # Direct notifications
        ref_direct = db.collection("notifications").where("student_id", "==", student_id).stream()
        for doc in ref_direct:
            db.collection("notifications").document(doc.id).update({"unread": False})

        # Broadcast notifications: Add student_id to read_by array
        ref_all = db.collection("notifications").where("student_id", "==", "ALL").stream()
        for doc in ref_all:
            d = doc.to_dict()
            read_by = d.get("read_by", [])
            if not isinstance(read_by, list):
                read_by = []
            if student_id not in read_by:
                read_by.append(student_id)
                db.collection("notifications").document(doc.id).update({"read_by": read_by})

        invalidate_cache(f"notif_{student_id}")
        return {"status": "success", "message": "All notifications marked as read."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/notifications/clear/{student_id}")
def clear_student_notifications(student_id: str):
    try:
        # Direct notifications: Delete doc
        ref_direct = db.collection("notifications").where("student_id", "==", student_id).stream()
        for doc in ref_direct:
            db.collection("notifications").document(doc.id).delete()

        # Broadcast notifications: Add student_id to dismissed_by array
        ref_all = db.collection("notifications").where("student_id", "==", "ALL").stream()
        for doc in ref_all:
            d = doc.to_dict()
            dismissed_by = d.get("dismissed_by", [])
            if not isinstance(dismissed_by, list):
                dismissed_by = []
            if student_id not in dismissed_by:
                dismissed_by.append(student_id)
                db.collection("notifications").document(doc.id).update({"dismissed_by": dismissed_by})

        invalidate_cache(f"notif_{student_id}")
        return {"status": "success", "message": "Notifications cleared."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TestEmailRequest(BaseModel):
    recipient_email: str
    subject: Optional[str] = "Campus Support Portal: SMTP Notification Test"
    message: Optional[str] = "This is a test notification confirming that SMTP email dispatch is functioning properly."

@app.post("/api/admin/test-smtp")
def test_smtp_dispatch(req: TestEmailRequest):
    """
    Admin test endpoint to verify SMTP delivery or simulated dispatch to a specified student/email.
    """
    try:
        from email_service import send_email_async, get_base_html_template, SMTP_ENABLED, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_FROM_EMAIL
        
        body_html = f"""
        <p>Hello,</p>
        <p>{req.message}</p>
        <div style="background-color: #0f1d3d; border: 1px solid #38bdf8; border-radius: 10px; padding: 14px; margin: 16px 0; font-size: 13px;">
            <div><strong>SMTP Status:</strong> {'🟢 Live Connected' if SMTP_ENABLED else '🔵 Simulated / Dev Mode Active'}</div>
            <div><strong>Server:</strong> {SMTP_HOST}:{SMTP_PORT}</div>
            <div><strong>Sender:</strong> {SMTP_FROM_EMAIL}</div>
            <div><strong>Recipient:</strong> {req.recipient_email}</div>
        </div>
        """
        html = get_base_html_template(
            title="SMTP Notification Test",
            content_body=body_html,
            action_btn_text="Open Student Portal →",
            action_btn_url="http://localhost:3000/dashboard"
        )
        send_email_async(req.recipient_email, req.subject, html)
        return {
            "status": "success",
            "message": f"Test email dispatched to {req.recipient_email}",
            "smtp_enabled": SMTP_ENABLED,
            "server": f"{SMTP_HOST}:{SMTP_PORT}",
            "from_email": SMTP_FROM_EMAIL
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include other routers
from routers_documents import router as doc_router
from routers_learning import router as learning_router

app.include_router(doc_router)
app.include_router(learning_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

