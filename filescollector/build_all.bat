@echo off
setlocal
echo ================================================================
echo   FilesCollector - Build Suite for Teacher and Student
echo ================================================================
echo.

set "CSC=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"

if not exist "%CSC%" (
    echo [ERROR] C# compiler csc.exe was not found at:
    echo %CSC%
    pause
    exit /b 1
)

echo [1/2] Building TeacherCollector.exe ...
cd teacher_collector
"%CSC%" /nologo /target:winexe /platform:anycpu /optimize+ /utf8output /out:TeacherCollector.exe src\TimeSlotManager.cs src\SettingsManager.cs src\UdpBeacon.cs src\TeacherServer.cs src\MainForm.cs src\Program.cs /r:System.dll /r:System.Core.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to compile TeacherCollector.exe
    cd ..
    pause
    exit /b %ERRORLEVEL%
)
echo      [OK] TeacherCollector.exe built successfully.
cd ..

echo.
echo [2/2] Building StudentAgent.exe ...
cd student_agent
"%CSC%" /nologo /target:winexe /platform:anycpu /optimize+ /utf8output /out:StudentAgent.exe src\DesktopScanner.cs src\UdpListener.cs src\StudentClient.cs src\AgentForm.cs src\Program.cs /r:System.dll /r:System.Core.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to compile StudentAgent.exe
    cd ..
    pause
    exit /b %ERRORLEVEL%
)
echo      [OK] StudentAgent.exe built successfully.
cd ..

echo.
echo ================================================================
echo   [COMPLETED] Both portable binaries are ready:
echo ================================================================
dir teacher_collector\TeacherCollector.exe | findstr "TeacherCollector.exe"
dir student_agent\StudentAgent.exe | findstr "StudentAgent.exe"
echo.
endlocal
