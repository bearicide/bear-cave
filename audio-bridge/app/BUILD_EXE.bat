@echo off
cd /d "%~dp0"
py -3 -m pip install -r requirements.txt
py -3 -m PyInstaller --noconfirm --onefile --windowed --name MATTBEAR_Audio_Bridge audio_bridge.py
pause
