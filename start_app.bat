@echo off
echo Starting Frontend (Vite) and Backend (FastAPI)...
start "Lost and Found Backend" cmd /k "cd backend && .\venv\Scripts\activate && python main.py"
start "Lost and Found Frontend" cmd /k "cd frontend && npm run dev"

echo Both servers are starting up in separate windows.
echo You can close this main window.
timeout /t 5 >nul
exit
