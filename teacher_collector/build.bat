@echo off
chcp 65001 >nul
echo ================================================================
echo بناء خادم جمع تقارير التلاميذ للأستاذ (TeacherCollector.exe)
echo ================================================================

if not exist "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe" (
    echo [خطأ] مترجم ويندوز csc.exe غير موجود في المسار الافتراضي لـ .NET 4.0.
    pause
    exit /b 1
)

echo جاري الترجمة والبناء عبر مترجم ويندوز الأصيل...
C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe /nologo /target:winexe /platform:anycpu /optimize+ /utf8output /out:TeacherCollector.exe src\TimeSlotManager.cs src\SettingsManager.cs src\UdpBeacon.cs src\TeacherServer.cs src\MainForm.cs src\Program.cs /r:System.dll /r:System.Core.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll

if %ERRORLEVEL% equ 0 (
    echo.
    echo [نجاح] تم بناء البرنامج المحمول للأستاذ بنجاح: TeacherCollector.exe
    dir TeacherCollector.exe | findstr "TeacherCollector.exe"
) else (
    echo.
    echo [فشل] حدث خطأ أثناء الترجمة.
    pause
    exit /b %ERRORLEVEL%
)
