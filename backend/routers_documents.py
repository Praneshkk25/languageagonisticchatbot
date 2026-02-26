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

@router.post("/documents/upload/{student_id}")
async def upload_document(student_id: str, file: UploadFile = File(...)):
    try:
        doc_data = {
            "student_id": student_id,  # Use actual student ID
            "title": file.filename,
            "file_path": f"/uploads/{file.filename}",
            "status": "Pending",
            "upload_date": datetime.datetime.utcnow()
        }
        update_time, doc_ref = db.collection("documents").add(doc_data)
        
        logger.log(student_id, "UPLOAD", f"Uploaded document: {file.filename}")
        return {"status": "success", "filename": file.filename, "id": doc_ref.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents/student/{student_id}")
def get_student_documents(student_id: str):
    try:
        # Query Firestore
        docs_ref = db.collection("documents").where("student_id", "==", student_id).stream()
        results = []
        for doc in docs_ref:
            d = doc.to_dict()
            results.append({
                "id": doc.id,
                "title": d.get("title"),
                "status": d.get("status"),
                "date": d.get("upload_date", datetime.datetime.utcnow()).strftime("%Y-%m-%d") if isinstance(d.get("upload_date"), datetime.datetime) else "2026-01-22"
            })
        return results
    except Exception as e:
        print(f"Error fetching documents: {e}")
        return []

@router.get("/documents/admin/all")
def get_all_documents():
    try:
        docs_ref = db.collection("documents").stream()
        results = []
        for doc in docs_ref:
            d = doc.to_dict()
            results.append({
                "id": doc.id,
                "title": d.get("title"),
                "status": d.get("status"),
                "date": d.get("upload_date", datetime.datetime.utcnow()).strftime("%Y-%m-%d") if isinstance(d.get("upload_date"), datetime.datetime) else "2026-01-22",
                "student_id": d.get("student_id", "Unknown")
            })
        return results
    except Exception as e:
         print(f"Error fetching admin documents: {e}")
         return []

@router.post("/documents/approve/{doc_id}")
def approve_document(doc_id: str):
    try:
        doc_ref = db.collection("documents").document(doc_id)
        doc = doc_ref.get()
        if doc.exists:
            doc_ref.update({"status": "Approved"})
            logger.log("ADMIN", "APPROVE", f"Approved document ID {doc_id}")
            return {"status": "approved", "doc_id": doc_id}
        raise HTTPException(status_code=404, detail="Document not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/documents/reject/{doc_id}")
def reject_document(doc_id: str):
    try:
        doc_ref = db.collection("documents").document(doc_id)
        doc = doc_ref.get()
        if doc.exists:
            doc_ref.update({"status": "Rejected"})
            logger.log("ADMIN", "REJECT", f"Rejected document ID {doc_id}")
            return {"status": "rejected", "doc_id": doc_id}
        raise HTTPException(status_code=404, detail="Document not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
