MATTBEAR Audio Bridge v0.2 PUBLIC PRE-RELEASE

Install Audient Windows driver and VB-CABLE. Restart.
Install Python 3 on the BUILD computer.
Run INSTALL_AND_RUN.bat to test, or BUILD_EXE.bat to compile an EXE in dist/.
Select Audient recording input, CABLE Input as broadcast output and Audient headphones as monitor.
Select CABLE Output as BIGO microphone.

WARNING: not validated on Windows/Audient hardware. Cubase ASIO requires loopback. Never connect an amplified speaker output to an interface line input.

Known issues: mono only; fixed 48kHz; separate stream clocks can drift; monitoring can lag; no hotplug recovery. Please test before streaming.
