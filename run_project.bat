@echo off
cd /d "%~dp0"
echo Starting Campus Support System...

echo Starting Backend on 0.0.0.0:8000...
start "Campus Support Backend" cmd /k "cd backend && venv_gpu\Scripts\activate && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo Starting Student Dashboard on 0.0.0.0:3000...
start "Student Dashboard" cmd /k "cd student-dashboard && npm run dev -- -H 0.0.0.0 -p 3000"

echo Starting Admin Dashboard on 0.0.0.0:3001...
start "Admin Dashboard" cmd /k "cd admin-dashboard && npm run dev -- -H 0.0.0.0 -p 3001"

echo All services started and accessible across local network and mobile devices!
