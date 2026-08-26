from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List
from database import db
from logging_system import logger
import datetime

router = APIRouter()

class DocumentOut(BaseModel):
    id: str
    title: str
    status: str
    upload_date: str

class RejectRequest(BaseModel):
    reason: str

_DOC_CACHE = {}
_DOC_CACHE_TTL = 45

def get_doc_cache(key: str):
    item = _DOC_CACHE.get(key)
    if item:
        val, expire_time = item
        if datetime.datetime.utcnow().timestamp() < expire_time:
            return val
    return None

def set_doc_cache(key: str, val, ttl: int = _DOC_CACHE_TTL):
    _DOC_CACHE[key] = (val, datetime.datetime.utcnow().timestamp() + ttl)

def invalidate_doc_cache():
    global _DOC_CACHE
    _DOC_CACHE = {}

@router.get("/documents/student/{student_id}")
def get_student_documents(student_id: str):
    cached = get_doc_cache(f"student_docs_{student_id}")
    if cached is not None:
        return cached
    try:
        docs_ref = db.collection("documents").stream()
        results = []
        for doc in docs_ref:
            d = doc.to_dict()
            if d.get("student_id") == student_id or d.get("admission_no") == student_id:
                results.append({
                    "id": doc.id,
                    "title": d.get("title", "Document"),
                    "status": d.get("status", "Pending"),
                    "file_path": d.get("file_path"),
                    "feedback": d.get("feedback") or d.get("rejection_reason"),
                    "rejection_reason": d.get("rejection_reason") or d.get("feedback"),
                    "rejected_at": d.get("rejected_at"),
                    "rejected_by": d.get("rejected_by"),
                    "date": d.get("upload_date", datetime.datetime.utcnow()).strftime("%Y-%m-%d") if isinstance(d.get("upload_date"), datetime.datetime) else "2026-01-22",
                    "student_id": d.get("student_id", student_id)
                })
        set_doc_cache(f"student_docs_{student_id}", results, ttl=15)
        return results
    except Exception as e:
        print(f"Error fetching student documents: {e}")
        return []

@router.get("/documents/admin/all")
def get_all_documents():
    cached = get_doc_cache("all_admin_docs")
    if cached is not None:
        return cached
    try:
        docs_ref = db.collection("documents").stream()
        results = []
        for doc in docs_ref:
            d = doc.to_dict()
            results.append({
                "id": doc.id,
                "title": d.get("title"),
                "status": d.get("status"),
                "file_path": d.get("file_path"),
                "feedback": d.get("feedback") or d.get("rejection_reason"),
                "rejection_reason": d.get("rejection_reason") or d.get("feedback"),
                "rejected_at": d.get("rejected_at"),
                "rejected_by": d.get("rejected_by"),
                "date": d.get("upload_date", datetime.datetime.utcnow()).strftime("%Y-%m-%d") if isinstance(d.get("upload_date"), datetime.datetime) else "2026-01-22",
                "student_id": d.get("student_id", "Unknown")
            })
        set_doc_cache("all_admin_docs", results, ttl=15)
        return results
    except Exception as e:
         print(f"Error fetching admin documents: {e}")
         return []

@router.post("/documents/upload/{student_id}")
async def upload_document(student_id: str, file: UploadFile = File(...)):
    try:
        import os
        uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        file_path_on_disk = os.path.join(uploads_dir, file.filename)
        
        contents = await file.read()
        with open(file_path_on_disk, "wb") as f:
            f.write(contents)

        doc_data = {
            "student_id": student_id,
            "title": file.filename,
            "file_path": f"/uploads/{file.filename}",
            "status": "Pending",
            "upload_date": datetime.datetime.utcnow()
        }
        update_time, doc_ref = db.collection("documents").add(doc_data)
        invalidate_doc_cache()
        
        logger.log(student_id, "UPLOAD", f"Uploaded document: {file.filename}")
        return {"status": "success", "filename": file.filename, "id": doc_ref.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _get_student_info(student_id: str):
    try:
        sdoc = db.collection("students").document(student_id).get()
        if sdoc.exists:
            d = sdoc.to_dict()
            if "admission_no" not in d:
                d["admission_no"] = student_id
            return d
    except Exception as e:
        print(f"Error fetching student for email: {e}")
    return {"admission_no": student_id, "name": "Student", "email": ""}

@router.post("/documents/approve/{doc_id}")
def approve_document(doc_id: str):
    try:
        doc_ref = db.collection("documents").document(doc_id)
        doc = doc_ref.get()
        if doc.exists:
            d = doc.to_dict()
            student_id = d.get("student_id", "")
            doc_title = d.get("title", "Document")
            
            doc_ref.update({
                "status": "Approved",
                "verified_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
                "verified_by": "ADMIN_OFFICER"
            })
            invalidate_doc_cache()
            
            # Create student-scoped approval notification
            notif_data = {
                "student_id": student_id,
                "title": f"Document Approved: {doc_title}",
                "desc": f"Your document '{doc_title}' has been verified and approved by the Admin.",
                "category": "documents",
                "unread": True,
                "icon": "✓",
                "created_at": datetime.datetime.utcnow()
            }
            try:
                db.collection("notifications").add(notif_data)
            except Exception as ne:
                print(f"Error creating notification: {ne}")
                
            # Send SMTP email to the student
            try:
                from email_service import notify_document_approved
                student_info = _get_student_info(student_id)
                notify_document_approved(student_info, doc_title, doc_id)
            except Exception as ee:
                print(f"Error sending approval email: {ee}")

            logger.log("ADMIN", "APPROVE", f"Approved document ID {doc_id} for student {student_id}")
            return {"status": "approved", "doc_id": doc_id}
        raise HTTPException(status_code=404, detail="Document not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/documents/reject/{doc_id}")
def reject_document(doc_id: str, req: RejectRequest):
    if not req.reason or not req.reason.strip():
        raise HTTPException(status_code=400, detail="Rejection explanation / reason is required.")

    clean_reason = req.reason.strip()
    try:
        doc_ref = db.collection("documents").document(doc_id)
        doc = doc_ref.get()
        if doc.exists:
            d = doc.to_dict()
            student_id = d.get("student_id", "")
            doc_title = d.get("title", "Document")
            now_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M")
            
            doc_ref.update({
                "status": "Rejected",
                "feedback": clean_reason,
                "rejection_reason": clean_reason,
                "rejected_at": now_str,
                "rejected_by": "ADMIN_OFFICER"
            })
            invalidate_doc_cache()
            
            # Create student-scoped rejection notification with clear reason
            notif_data = {
                "student_id": student_id,
                "title": f"Document Rejected: {doc_title}",
                "desc": f"Your document '{doc_title}' was rejected by admin. Explanation: {clean_reason}",
                "category": "documents",
                "unread": True,
                "icon": "✕",
                "created_at": datetime.datetime.utcnow()
            }
            try:
                db.collection("notifications").add(notif_data)
            except Exception as ne:
                print(f"Error creating notification: {ne}")

            # Send SMTP email with rejection explanation to the student
            try:
                from email_service import notify_document_rejected
                student_info = _get_student_info(student_id)
                notify_document_rejected(student_info, doc_title, clean_reason, doc_id)
            except Exception as ee:
                print(f"Error sending rejection email: {ee}")

            logger.log("ADMIN", "REJECT", f"Rejected document ID {doc_id} for student {student_id} | Reason: {clean_reason}")
            return {"status": "rejected", "doc_id": doc_id, "feedback": clean_reason, "rejection_reason": clean_reason}
        raise HTTPException(status_code=404, detail="Document not found")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    try:
        doc_ref = db.collection("documents").document(doc_id)
        doc = doc_ref.get()
        if doc.exists:
            d = doc.to_dict()
            file_path = d.get("file_path")
            student_id = d.get("student_id", "SYSTEM")
            
            # Delete from DB
            doc_ref.delete()
            invalidate_doc_cache()
            
            # Delete from disk
            if file_path:
                import os
                uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
                filename = os.path.basename(file_path)
                file_path_on_disk = os.path.join(uploads_dir, filename)
                if os.path.exists(file_path_on_disk):
                    try:
                        os.remove(file_path_on_disk)
                    except Exception as fe:
                        print(f"Error removing file from disk: {fe}")
            
            logger.log(student_id, "DELETE_DOC", f"Deleted document ID {doc_id} ({d.get('title')})")
            return {"status": "success", "message": f"Document with ID '{doc_id}' deleted."}
        raise HTTPException(status_code=404, detail="Document not found")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
