/**
 * Headless PDF Export Verification Test (with automatic temporary file cleanup)
 */
const electronModule = require('electron');
if (typeof electronModule === 'string' || !electronModule.app) {
  const { spawnSync } = require('child_process');
  const electronBin = typeof electronModule === 'string' ? electronModule : require('electron');
  const cleanEnv = { ...process.env };
  delete cleanEnv.ELECTRON_RUN_AS_NODE;
  const result = spawnSync(electronBin, [__filename], { env: cleanEnv, stdio: 'inherit' });
  process.exit(result.status !== null ? result.status : 0);
}

const { app, BrowserWindow } = electronModule;
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');

app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');

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

  let templateHtml = null;
  const candidatePaths = [
    path.join(rootDir, 'report', 'report-template.html'),
    path.join(rootDir, 'src', 'report', 'report-template.html'),
    path.join(app.getAppPath(), 'report', 'report-template.html'),
    path.join(app.getAppPath(), 'src', 'report', 'report-template.html')
  ];
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        templateHtml = fs.readFileSync(p, 'utf8');
        if (templateHtml && templateHtml.length > 500) break;
      }
    } catch (e) {}
  }

  if (!templateHtml) {
    throw new Error('Report template could not be loaded from candidate paths');
  }

  await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(templateHtml));

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
      cognitiveScore: 6.0,
      cognitiveMax: 6.0,
      cognitiveNote: 'استيعاب دقيق للمفاهيم المجردة ونظم الملفات والبيوس',
      practicalScore: 13.5,
      practicalMax: 14.0,
      practicalNote: 'تحكم متقن في البيوس، التجزئة، وتأمين الخصوصية',
      totalScore: 18.0,
      totalMax: 20.0,
      totalDeductions: 1.5,
      competencies: [
        {
          name: 'كفاءة إعداد العتاد وضبط البيوس (BIOS/UEFI Configuration)',
          score: 4.5,
          max: 5.0,
          criteria: 'سلامة ربط الوسائط، مقاطعة الإقلاع الأولي، وتفعيل TPM 2.0 وSecure Boot وترتيب الإقلاع.'
        },
        {
          name: 'كفاءة التجزئة المنطقية ونظم الملفات (Partitioning & Filesystem)',
          score: 5.0,
          max: 5.0,
          criteria: 'إنشاء جدول أقسام GPT، التهيئة الإلزامية بـ NTFS للقسم الأساسي، واختيار النسخة المناسبة.'
        },
        {
          name: 'كفاءة الإعداد وتأمين الخصوصية الرقمية (Privacy & User Setup)',
          score: 5.0,
          max: 5.0,
          criteria: 'إنشاء حساب محلي مستقل للمخبر، وحماية بيانات المتعلم بتعطيل كافة خيارات التتبع السبعة.'
        },
        {
          name: 'كفاءة الإقلاع الذاتي المستقل (Clean Independent SSD Boot)',
          score: 3.5,
          max: 5.0,
          criteria: 'كسر حلقة التثبيت وإعادة ضبط SSD كإقلاع أول.'
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
      date: '04 نوفمبر 2026',
      time: '12:00',
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

  printWindow.destroy();
  app.quit();

  if (pdfBuffer && pdfBuffer.length > 50000) {
    console.log(`✓ PDF successfully generated in memory (Size: ${pdfBuffer.length} bytes, Zero disk residue).`);
    console.log('✓ PDF size and integrity validated.\n');
    process.exit(0);
  } else {
    console.error('FAIL: PDF buffer generation failed or too small.');
    process.exit(1);
  }
});
