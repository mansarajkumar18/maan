@echo off
set PATH=C:\Users\Admin\.node\node-v22.14.0-win-x64;%PATH%
echo Starting NOVA AI Platform (Backend Engine + Frontend Development Server)...
start "NOVA AI Backend Engine (Port 3001)" cmd /k "set PATH=C:\Users\Admin\.node\node-v22.14.0-win-x64;%PATH% && node server/index.js"
start "NOVA AI Frontend (Port 5173)" cmd /k "set PATH=C:\Users\Admin\.node\node-v22.14.0-win-x64;%PATH% && .\npx.cmd vite --host --port 5173"
