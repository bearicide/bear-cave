@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title MATTBEAR Audio Bridge - Windows EXE Builder
echo.
echo ============================================================
echo   MATTBEAR AUDIO BRIDGE - BUILD WINDOWS EXE
echo ============================================================
echo.
echo No pip self-update is required or performed.
echo Checking Python...
where py >nul 2>&1
if errorlevel 1 (
  echo ERROR: Python launcher "py" not found. Install Python 3.11 from python.org.
  goto failed
)
py -3 -c "import sys; assert sys.version_info >= (3, 10)" >nul 2>&1
if errorlevel 1 (
  echo ERROR: Python 3.10 or newer is required.
  goto failed
)
echo Checking dependencies...
py -3 -c "import numpy, sounddevice, PyInstaller" >nul 2>&1
if not errorlevel 1 goto build
echo Installing missing build dependencies. Network timeout is 15 seconds.
py -3 -m pip --version >nul 2>&1
if errorlevel 1 (
  echo ERROR: pip is missing. Run: py -3 -m ensurepip --upgrade
  goto failed
)
py -3 -m pip install --disable-pip-version-check --no-input --timeout 15 --retries 1 -r requirements.txt
if errorlevel 1 (
  echo ERROR: Dependency installation failed. Check network, firewall, and Python version.
  echo Manual command: py -3 -m pip install --disable-pip-version-check -r requirements.txt
  goto failed
)
:build
echo.
echo Compiling application...
py -3 -m PyInstaller --clean --noconfirm --onefile --windowed --name MATTBEAR_Audio_Bridge audio_bridge.py
if errorlevel 1 (
  echo ERROR: Build failed. See output above and build\MATTBEAR_Audio_Bridge\warn-MATTBEAR_Audio_Bridge.txt
  goto failed
)
if not exist "dist\MATTBEAR_Audio_Bridge.exe" (
  echo ERROR: Build returned success but EXE is missing.
  goto failed
)
echo.
echo SUCCESS: %CD%\dist\MATTBEAR_Audio_Bridge.exe
echo This build still requires Audient and VB-CABLE drivers on the target computer.
pause
exit /b 0
:failed
echo.
echo BUILD NOT COMPLETED. No executable has been verified.
pause
exit /b 1
