@echo off
echo ========================================================
echo Starting GreenProof FastAPI Backend Server (Port 8000)...
echo ========================================================
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
