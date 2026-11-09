@echo off
setlocal
cd /d "%~dp0"

echo [1/2] Looking for C# .NET 4.0 Compiler...
set CSC=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe

if not exist "%CSC%" (
    echo [ERROR] csc.exe compiler not found at %CSC%
    exit /b 1
)

echo [2/2] Compiling ReportReceiver.exe...
"%CSC%" /target:winexe /optimize+ /platform:anycpu /out:ReportReceiver.exe /recurse:src\*.cs /reference:System.dll,System.Windows.Forms.dll,System.Drawing.dll,System.Data.dll,System.Xml.dll

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Compilation failed!
    exit /b %ERRORLEVEL%
)

echo [OK] Build completed successfully: ReportReceiver.exe
dir ReportReceiver.exe | findstr ReportReceiver.exe
endlocal

