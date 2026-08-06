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
                "file_path": d.get("file_path"),
                "feedback": d.get("feedback"),
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
                "file_path": d.get("file_path"),
                "feedback": d.get("feedback"),
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
def reject_document(doc_id: str, req: RejectRequest):
    try:
        doc_ref = db.collection("documents").document(doc_id)
        doc = doc_ref.get()
        if doc.exists:
            doc_ref.update({
                "status": "Rejected",
                "feedback": req.reason
            })
            logger.log("ADMIN", "REJECT", f"Rejected document ID {doc_id} | Reason: {req.reason}")
            return {"status": "rejected", "doc_id": doc_id, "feedback": req.reason}
        raise HTTPException(status_code=404, detail="Document not found")
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
