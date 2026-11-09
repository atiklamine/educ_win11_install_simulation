@echo off
chcp 65001 >nul
echo ================================================================
echo بناء عميل تسليم تقارير التلميذ (StudentAgent.exe)
echo ================================================================

if not exist "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe" (
    echo [خطأ] مترجم ويندوز csc.exe غير موجود في المسار الافتراضي لـ .NET 4.0.
    pause
    exit /b 1
)

echo جاري الترجمة والبناء عبر مترجم ويندوز الأصيل...
C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe /nologo /target:winexe /platform:anycpu /optimize+ /utf8output /out:StudentAgent.exe src\DesktopScanner.cs src\UdpListener.cs src\StudentClient.cs src\AgentForm.cs src\Program.cs /r:System.dll /r:System.Core.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll

if %ERRORLEVEL% equ 0 (
    echo.
    echo [نجاح] تم بناء البرنامج المحمول للتلميذ بنجاح: StudentAgent.exe
    dir StudentAgent.exe | findstr "StudentAgent.exe"
) else (
    echo.
    echo [فشل] حدث خطأ أثناء الترجمة.
    pause
    exit /b %ERRORLEVEL%
)

