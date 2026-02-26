from fastapi import APIRouter, File, UploadFile, HTTPException
from utils_learning import learning_system
import shutil
import os

router = APIRouter()

UPLOAD_DIR = "uploaded_knowledge"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/admin/learn/upload")
async def upload_learning_file(file: UploadFile = File(...)):
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Trigger Learning
        success, message = learning_system.learn_document(file_path, file.filename, file.content_type or "")
        
        if success:
            return {"status": "success", "message": message, "filename": file.filename}
        else:
            raise HTTPException(status_code=400, detail=message)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/learn/status")
def get_learning_status():
    count = len(learning_system.knowledge_base)
    # Get unique files
    files = list(set([x['source'] for x in learning_system.knowledge_base]))
    return {"total_chunks": count, "files": files}
