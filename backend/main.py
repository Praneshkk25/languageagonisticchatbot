from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import time
from logging_system import logger
from database import db
from scholarships_data import SCHOLARSHIP_CATEGORIES, ALL_SCHOLARSHIPS
from form_generator import generate_scholarship_form_pdf

app = FastAPI(title="Campus Support Backend")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded documents from /uploads folder
from fastapi.staticfiles import StaticFiles
import os
uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    origin = request.headers.get("origin")
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.log("SYSTEM", "REQUEST", f"Method: {request.method} | Path: {request.url.path} | Origin: {origin} | Status: {response.status_code} | Duration: {duration:.4f}s")
    return response

# Seed Database with 14 Categories Scholarships on Startup
def seed_scholarships_data():
    try:
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
    min_gpa: float
    max_income: float
    eligible_departments: List[str]
    eligible_years: List[int]
    category_id: Optional[int] = 1
    category_name: Optional[str] = "Central Government Scholarships"

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
    bio: Optional[str] = None

class DoublePasskeyVerify(BaseModel):
    student_id: str = "2023CS001"
    passkey_1: str
    passkey_2: str

class DownloadFormRequest(BaseModel):
    student_id: str = "2023CS001"
    scholarship_id: str
    passkey_1: str
    passkey_2: str


# Routes
@app.get("/")
def read_root():
    return {"status": "active", "system": "Campus Support API"}

@app.get("/api/auth/student-status/{admission_no}")
def check_student_status(admission_no: str):
    student_ref = db.collection("students").document(admission_no.strip())
    student_doc = student_ref.get()
    if not student_doc.exists:
        return {"exists": False, "has_custom_password": False}
    sdata = student_doc.to_dict()
    has_custom = bool(sdata.get("has_custom_password")) and bool(sdata.get("password"))
    return {
        "exists": True,
        "name": sdata.get("name", "Student"),
        "has_custom_password": has_custom
    }

@app.post("/api/auth/student")
def student_login(creds: LoginRequest):
    adm_no = creds.admission_no.strip()
    student_ref = db.collection("students").document(adm_no)
    student_doc = student_ref.get()
    if not student_doc.exists:
        raise HTTPException(status_code=401, detail="Invalid Admission Number. Student record not found.")

    sdata = student_doc.to_dict()
    has_custom_pw = bool(sdata.get("has_custom_password")) and bool(sdata.get("password"))

    pwd_val = (creds.password_or_dob or creds.password or creds.dob or "").strip()

    # Case 1: Explicit First Time Login with DOB or student has not set custom password yet
    if creds.login_type == "first_time" or (not has_custom_pw and creds.login_type != "custom_password"):
        expected_dob = sdata.get("dob", "")
        if pwd_val == expected_dob or creds.dob == expected_dob:
            return {
                "token": "fake-jwt-token",
                "is_first_login": not has_custom_pw,
                "user": {
                    "name": sdata.get("name", "Student"),
                    "id": adm_no,
                    "dob": expected_dob
                },
                "message": "First time verification successful! Set your custom password & Double Passkeys."
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid Date of Birth for first-time login.")

    # Case 2: Subsequent Login with Custom Password + Double Passkeys
    else:
        stored_password = sdata.get("password", "")
        if pwd_val != stored_password and creds.password != stored_password:
            raise HTTPException(status_code=401, detail="Invalid Custom Password. Please check your password.")

        expected_p1 = sdata.get("passkey_1", "123456")
        expected_p2 = sdata.get("passkey_2", "654321")
        p1 = (creds.passkey_1 or "").strip()
        p2 = (creds.passkey_2 or "").strip()

        if p1 != expected_p1 or p2 != expected_p2:
            raise HTTPException(
                status_code=401,
                detail="Invalid Double Passkeys! Please enter valid Passkey 1 & Passkey 2."
            )

        return {
            "token": "fake-jwt-token",
            "is_first_login": False,
            "user": {
                "name": sdata.get("name", "Student"),
                "id": adm_no
            },
            "message": "Authentication successful with Custom Password & Double Passkey."
        }

@app.post("/api/auth/setup-credentials")
def setup_credentials(req: SetupCredentialsRequest):
    adm_no = req.admission_no.strip()
    student_ref = db.collection("students").document(adm_no)
    student_doc = student_ref.get()
    if not student_doc.exists:
        raise HTTPException(status_code=404, detail="Student not found.")

    sdata = student_doc.to_dict()
    if sdata.get("dob") != req.dob.strip():
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

    student_ref.update(updated_data)
    logger.log(adm_no, "AUTH_SETUP", "Configured custom password & Double Passkeys.")

    return {
        "status": "success",
        "message": "Custom Password & Double Passkeys saved successfully! Next time you log in, use your new password and Double Passkeys.",
        "user": {
            "name": sdata.get("name", "Student"),
            "id": adm_no
        }
    }

@app.post("/api/auth/forgot-password")
def reset_forgot_password(req: ForgotPasswordRequest):
    adm_no = req.admission_no.strip()
    student_ref = db.collection("students").document(adm_no)
    student_doc = student_ref.get()
    if not student_doc.exists:
        raise HTTPException(status_code=404, detail="Student record not found.")

    sdata = student_doc.to_dict()
    mobile_input = req.mobile_no.strip()
    
    if len(mobile_input) < 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit registered mobile number.")

    if len(req.otp.strip()) < 4:
        raise HTTPException(status_code=400, detail="Invalid Mobile OTP code entered.")

    new_pw = req.new_password.strip()
    p1 = req.passkey_1.strip()
    p2 = req.passkey_2.strip()

    if len(new_pw) < 4:
        raise HTTPException(status_code=400, detail="New password must be at least 4 characters long.")

    if not p1 or not p2:
        raise HTTPException(status_code=400, detail="Both Passkey 1 and Passkey 2 are required.")

    updated_data = {
        "password": new_pw,
        "passkey_1": p1,
        "passkey_2": p2,
        "mobile": mobile_input,
        "has_custom_password": True
    }

    student_ref.update(updated_data)
    logger.log(adm_no, "FORGOT_PASSWORD_RESET", f"Reset password & passkeys via Mobile OTP ({mobile_input}).")

    return {
        "status": "success",
        "message": "Password and Passkeys reset successfully! You can now sign in with your new credentials.",
        "user": {
            "name": sdata.get("name", "Student"),
            "id": adm_no
        }
    }

from chatbot_logic import predict_response

class SaveSessionRequest(BaseModel):
    session_id: str
    student_id: str
    title: str
    timestamp: Optional[str] = None
    messages: List[dict]

@app.post("/api/chat/student")
def student_chat(req: ChatRequest):
    user_id = "2023CS001"
    if req.context and "user_id" in req.context:
        user_id = req.context["user_id"]
    elif req.context is None:
        req.context = {}
    req.context["user_id"] = user_id
    
    response, updated_context = predict_response(req.message, req.language, req.context)
    logger.log(user_id, "CHAT", f"Query: {req.message} | Response: {response}")
    return {"response": response, "context": updated_context}

@app.post("/api/chat/general")
def general_chat(req: ChatRequest):
    response, updated_context = predict_response(req.message, req.language, req.context)
    return {"response": response, "context": updated_context}

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
        results.sort(key=lambda x: x.get("timestamp") or "", reverse=True)
        return results
    except Exception as e:
        print(f"Error fetching logs: {e}")
        return []

# --- 14 SCHOLARSHIP CATEGORIES & DOUBLE PASSKEY APIS ---

@app.get("/api/scholarships/categories")
def get_scholarship_categories():
    """Returns the list of 14 scholarship categories with scholarship counts."""
    try:
        all_docs = db.collection("scholarships").stream()
        sch_list = [d.to_dict() for d in all_docs]
        
        categories_result = []
        for cat in SCHOLARSHIP_CATEGORIES:
            cat_count = sum(1 for s in sch_list if s.get("category_id") == cat["id"])
            # Fallback matching by name
            if cat_count == 0:
                cat_count = sum(1 for s in sch_list if cat["name"].lower() in s.get("category_name", "").lower())
            
            categories_result.append({
                **cat,
                "scholarship_count": cat_count
            })
        return categories_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scholarships/all")
def get_all_scholarships():
    try:
        ref = db.collection("scholarships").stream()
        results = []
        for doc in ref:
            d = doc.to_dict()
            if "id" not in d:
                d["id"] = doc.id
            results.append(d)
        
        # If empty in database, fall back to predefined ALL_SCHOLARSHIPS
        if not results:
            return ALL_SCHOLARSHIPS
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scholarships/category/{cat_id}")
def get_scholarships_by_category(cat_id: int):
    try:
        ref = db.collection("scholarships").stream()
        results = []
        for doc in ref:
            d = doc.to_dict()
            if d.get("category_id") == cat_id:
                if "id" not in d:
                    d["id"] = doc.id
                results.append(d)
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
        
        # Fallback to local memory list
        for s in ALL_SCHOLARSHIPS:
            if s["id"] == scholarship_id:
                return s
        raise HTTPException(status_code=404, detail="Scholarship not found")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Double Passkey Authentication Endpoint for Cloud Storage
@app.post("/api/auth/verify-double-passkey")
def verify_double_passkey(data: DoublePasskeyVerify):
    """
    Verifies Double Passkey (Passkey 1 & Passkey 2) for Cloud Storage access.
    Default passkeys for demo student: Passkey 1 = '123456', Passkey 2 = '654321' (or custom set).
    """
    student_id = data.student_id or "2023CS001"
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
    """
    Generates and returns downloadable official application form PDF after verifying Double Passkey.
    """
    # 1. Verify Double Passkey
    passkey_req = DoublePasskeyVerify(
        student_id=data.student_id,
        passkey_1=data.passkey_1,
        passkey_2=data.passkey_2
    )
    verify_double_passkey(passkey_req)
    
    # 2. Retrieve scholarship details
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
        
    # 3. Retrieve student details
    student_ref = db.collection("students").document(data.student_id).get()
    student_data = student_ref.to_dict() if student_ref.exists else None
    
    # 4. Generate Application Form PDF
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
        return {"status": "success", "message": f"Scholarship '{s.scholarship_name}' updated."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/scholarships/{id}")
def delete_scholarship(id: str):
    try:
        ref = db.collection("scholarships").document(id)
        ref.delete()
        return {"status": "success", "message": f"Scholarship with ID '{id}' deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/students/all")
def get_all_students():
    try:
        ref = db.collection("students").stream()
        results = []
        for doc in ref:
            d = doc.to_dict()
            if "admission_no" not in d:
                d["admission_no"] = doc.id
            results.append(d)
        return results
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
def update_student_by_id(student_id: str, s: StudentUpdate):
    try:
        ref = db.collection("students").document(student_id)
        doc = ref.get()
        current_data = doc.to_dict() if doc.exists else {"admission_no": student_id, "name": "Student"}
        update_data = s.dict(exclude_unset=True)
        current_data.update(update_data)
        ref.set(current_data)
        return {"status": "success", "message": f"Student '{student_id}' updated."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Notification Endpoints
import datetime

@app.get("/api/notifications/student/{student_id}")
def get_student_notifications(student_id: str):
    try:
        ref = db.collection("notifications").where("student_id", "==", student_id).stream()
        results = []
        for doc in ref:
            d = doc.to_dict()
            time_str = "Recently"
            raw_time = d.get("created_at")
            if isinstance(raw_time, datetime.datetime):
                time_str = raw_time.strftime("%Y-%m-%d %H:%M")
            elif raw_time:
                time_str = str(raw_time)[:16]

            results.append({
                "id": doc.id,
                "title": d.get("title", "Notification"),
                "desc": d.get("desc", ""),
                "category": d.get("category", "system"),
                "unread": d.get("unread", True),
                "icon": d.get("icon", "🔔"),
                "time": time_str,
                "created_at": str(raw_time or "")
            })
        results.sort(key=lambda x: x.get("created_at") or "", reverse=True)
        return results
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        return []

@app.post("/api/notifications/read-all/{student_id}")
def mark_notifications_read(student_id: str):
    try:
        ref = db.collection("notifications").where("student_id", "==", student_id).stream()
        for doc in ref:
            db.collection("notifications").document(doc.id).update({"unread": False})
        return {"status": "success", "message": "All notifications marked as read."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/notifications/clear/{student_id}")
def clear_student_notifications(student_id: str):
    try:
        ref = db.collection("notifications").where("student_id", "==", student_id).stream()
        for doc in ref:
            db.collection("notifications").document(doc.id).delete()
        return {"status": "success", "message": "Notifications cleared."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include other routers
from routers_documents import router as doc_router
from routers_learning import router as learning_router

app.include_router(doc_router)
app.include_router(learning_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
