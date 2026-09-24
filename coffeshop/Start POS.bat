@echo off
title Candiz POS
cd /d "%~dp0"

echo.
echo   Starting Candiz POS...
echo.

rem Find a working Python (the launcher, then python.exe).
set "PY="
where py >nul 2>&1 && set "PY=py"
if not defined PY (where python >nul 2>&1 && set "PY=python")

if not defined PY goto NOPYTHON

rem Serve the folder so the browser treats it as a normal website.
start "" http://localhost:8777/index.html
echo   The POS is opening in your browser at:
echo.
echo       http://localhost:8777
echo.
echo   KEEP THIS BLACK WINDOW OPEN while you use the POS.
echo   Close it when you are finished.
echo.
%PY% -m http.server 8777 --bind 127.0.0.1
goto END

:NOPYTHON
echo   Python was not found, so opening the file directly instead.
echo   This still works - you can close this window.
echo.
start "" "index.html"
timeout /t 4 >nul

:END
