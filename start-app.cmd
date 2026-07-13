@echo off
setlocal
cd /d "%~dp0"
start "한장 카드뉴스 서버" /min node serve.mjs
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:4173
endlocal
