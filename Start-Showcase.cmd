@echo off
cd /d "%~dp0"
if not exist node_modules\vite\bin\vite.js (
  echo Installing showcase dependencies...
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo.
echo LecViz showcase: http://127.0.0.1:5173
echo Keep this window open during your presentation. Press Ctrl+C to stop.
echo.
call npm run dev -- --open
pause
