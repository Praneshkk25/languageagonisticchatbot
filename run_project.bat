@echo off
cd /d "%~dp0"
echo Starting Campus Support System...

echo Starting Backend...
start "Campus Support Backend" cmd /k "cd backend && venv\Scripts\activate &&  python -m uvicorn main:app --reload --port 8000"

echo Starting Student Dashboard...
start "Student Dashboard" cmd /k "cd student-dashboard && npm run dev -- -p 3000"

echo Starting Admin Dashboard...
start "Admin Dashboard" cmd /k "cd admin-dashboard && npm run dev -- -p 3001"

echo Starting General Chatbot...
start "General Chatbot" cmd /k "cd general-chatbot && npm run dev -- -p 3002"

echo All services started!
