from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from logging_system import logger

app = FastAPI(title="Campus Support Backend")

# CORS Setup
origins = [
    "http://localhost:3000",  # Student Dashboard
    "http://localhost:3001",  # Admin Dashboard
    "http://localhost:3002",  # General Chatbot
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class LoginRequest(BaseModel):
    admission_no: str
    dob: str

class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    context: Optional[dict] = None

# Routes
@app.get("/")
def read_root():
    return {"status": "active", "system": "Campus Support API"}

@app.post("/api/auth/student")
def student_login(creds: LoginRequest):
    # TODO: Validate against DB
    if creds.admission_no == "2023CS001" and creds.dob == "2000-01-01":
        return {"token": "fake-jwt-token", "user": {"name": "Student Demo", "id": "2023CS001"}}
    raise HTTPException(status_code=401, detail="Invalid credentials")

from chatbot_logic import predict_response

@app.post("/api/chat/student")
def student_chat(req: ChatRequest):
    # Logic for student chatbot (full access)
    response = predict_response(req.message, req.language)
    logger.log("2023CS001", "CHAT", f"Query: {req.message} | Response: {response}")
    return {"response": response, "context": {}}

@app.post("/api/chat/general")
def general_chat(req: ChatRequest):
    # Logic for general chatbot
    response = predict_response(req.message, req.language)
    return {"response": response, "context": {}}


# Include other routers (Mock integration for single-file simplicity)
from routers_documents import router as doc_router
from routers_learning import router as learning_router
app.include_router(doc_router) # Removing prefix to match layout of doc_router if it handles its own, wait doc_router had /documents/.. 
# actually doc_router in file had @router.post("/documents/upload..."). 
# In main.py it was app.include_router(doc_router, prefix="/api") which makes it /api/documents/upload...
# My student dashboard code used http://localhost:8000/documents/student/1... WITHOUT /api.
# Wait, I should check my Student Dashboard code again.
# "http://localhost:8000/documents/student/1"
# In main.py: app.include_router(doc_router, prefix="/api") -> /api/documents/student/1
# So my frontend code might be WRONG if I follow main.py.
# BUT current main.py says: app.include_router(doc_router, prefix="/api")
# So correct URL is /api/documents...
# User prompt implies "buttons not working". Maybe that was why?
# But I wrote NEW code for `documents/page.js` using `http://localhost:8000/documents/...`.
# I should fix my router inclusion here to NOT use prefix if I want to match my frontend, OR fix my frontend.
# Easiest is to remove prefix for document router or chang frontend.
# I will check `routers_documents.py` to see if it has prefix. It does NOT.
# So `app.include_router(doc_router, prefix="/api")` makes it `/api/documents/...`.
# My new frontend code used `http://localhost:8000/documents/upload/1`. This is likely BROKEN if main.py stays as is.
# I will fix main.py to NOT have prefix for doc_router, OR change prefix to empty string, to match my new frontend code.
# AND I will include learning_router.

app.include_router(doc_router) 
app.include_router(learning_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
