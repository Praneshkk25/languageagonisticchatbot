from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from logging_system import logger

app = FastAPI(title="Campus Support Backend")

# CORS Setup
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
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


# Include other routers
from routers_documents import router as doc_router
from routers_learning import router as learning_router

app.include_router(doc_router)
app.include_router(learning_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
