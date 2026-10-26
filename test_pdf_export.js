/**
 * Test PDF Export via Electron printToPDF
 */
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Require main.js functions or simulate save-pdf-report
app.whenReady().then(async () => {
  const printWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 1400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  const reportTemplatePath = path.join(__dirname, 'report', 'report-template.html');
  await printWindow.loadFile(reportTemplatePath);

  const samplePayload = {
    student: {
      firstName: 'محمد',
      lastName: 'بن عيسى',
      group: '1AS-01 (علوم وتكنولوجيا)',
      mode: 'امتحان تطبيقي رسمي'
    },
    institution: {
      ministry: 'الجمهورية الجزائرية الديمقراطية الشعبية',
      department: 'وزارة التربية الوطنية',
      level: 'السنة الأولى ثانوي (1AS)',
      unit: 'الوحدة التعليمية: نظام التشغيل'
    },
    evaluation: {
      totalScore: '18.75',
      maxScore: '20.00',
      cognitiveScore: '5.50',
      practicalScore: '13.25',
      appreciation: 'متحكم جداً (ممتاز)',
      appreciationClass: 'grade-excellent',
      competencies: [
        {
          name: 'كفاءة إعداد العتاد وضبط البيوس (BIOS/UEFI Configuration)',
          score: '4.75',
          max: '5.00',
          description: 'سلامة ربط الوسائط، مقاطعة الإقلاع، وتفعيل TPM 2.0 و Secure Boot.'
        },
        {
          name: 'كفاءة التجزئة المنطقية ونظم الملفات (Partitioning & Filesystem)',
          score: '5.00',
          max: '5.00',
          description: 'إنشاء جدول GPT، التهيئة بـ NTFS، واختيار Pro Education.'
        },
        {
          name: 'كفاءة الإعداد وتأمين الخصوصية الرقمية (Privacy & User Setup)',
          score: '4.50',
          max: '5.00',
          description: 'حساب محلي مستقل وتعطيل كافة خدمات التتبع السبعة.'
        },
        {
          name: 'كفاءة الإقلاع المستقل واستكشاف الأخطاء (Independent Boot Loop)',
          score: '4.50',
          max: '5.00',
          description: 'كسر حلقة التثبيت وإعادة ضبط SSD كإقلاع أول.'
        }
      ]
    },
    diagnosticLog: [
      {
        phase: 1,
        title: 'مقاطعة الإقلاع الأولي',
        errorChoice: 'التأخر في الضغط على مفتاح F2',
        expectedChoice: 'الضغط السريع على F2/Del خلال 10 ثوانٍ',
        rationale: 'اختبار POST يتطلب مقاطعة فورية قبل محاولة الإقلاع.'
      }
    ],
    penalties: [
      { phase: 1, deduction: 1.0, reason: 'تأخر مقاطعة الإقلاع في POST' }
    ],
    sessionMeta: {
      date: '24 أكتوبر 2026',
      time: '20:45',
      duration: '22 دقيقة و 30 ثانية'
    }
  };

  await printWindow.webContents.executeJavaScript(`
    window.__injectReport(${JSON.stringify(samplePayload)});
  `);

  await new Promise(r => setTimeout(r, 400));

  const pdfBuffer = await printWindow.webContents.printToPDF({
    printBackground: true,
    pageSize: 'A4',
    margins: {
      marginType: 'custom',
      top: 0.35,
      bottom: 0.35,
      left: 0.35,
      right: 0.35
    }
  });

  const testPdfPath = path.join(__dirname, 'test_output_report.pdf');
  fs.writeFileSync(testPdfPath, pdfBuffer);

  const stats = fs.statSync(testPdfPath);
  console.log(`✓ PDF successfully generated and saved: ${testPdfPath} (Size: ${stats.size} bytes)`);

  printWindow.destroy();
  app.quit();

  if (stats.size > 5000) {
    console.log('✓ PDF size and integrity validated.');
    process.exit(0);
  } else {
    console.error('FAIL: PDF buffer too small.');
    process.exit(1);
  }
});
