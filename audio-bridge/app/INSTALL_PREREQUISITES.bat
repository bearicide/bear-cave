@echo off
setlocal
title MATTBEAR Audio Bridge - Prerequisites
echo ===================================================
echo   MATTBEAR AUDIO BRIDGE - DRIVER SETUP
echo ===================================================
echo.
echo This installer opens OFFICIAL vendor pages only.
echo No third-party drivers are silently installed.
echo.
echo 1. Audient iD4 Windows driver:
echo    https://audient.com/products/audio-interfaces/id4/downloads/
echo 2. VB-CABLE Windows virtual audio driver:
echo    https://vb-audio.com/Cable/
echo.
choice /C YN /M "Open both official download pages"
if errorlevel 2 goto end
start "" "https://audient.com/products/audio-interfaces/id4/downloads/"
start "" "https://vb-audio.com/Cable/"
echo.
echo Download and install both drivers, then RESTART Windows.
echo After restart, launch MATTBEAR Audio Bridge.
echo In the app choose Audient input and CABLE Input output.
echo In BIGO select CABLE Output as microphone.
:end
pause
endlocal
