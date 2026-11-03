const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('TEST SUITE: PROCEDURAL PENALTIES IN REPORT (REMEDIATION LOG)');
console.log('================================================================\n');

// 1. Setup mock environment
global.window = {};
global.document = {
  getElementById: () => ({ textContent: '', innerHTML: '', style: {}, classList: { add: () => {}, remove: () => {} } })
};

// Load StateEngine
const stateEngineJs = fs.readFileSync(path.join(__dirname, 'src', 'js', 'state-engine.js'), 'utf8');
eval(stateEngineJs);
const se = window.stateEngine;

// Load ReportPdf
const reportPdfJs = fs.readFileSync(path.join(__dirname, 'src', 'js', 'report-pdf.js'), 'utf8');
eval(reportPdfJs);
const reportPdf = window.reportPdf;

console.log('[Check 1] Simulating user scenario: DVD media + wrong BIOS boot selection (-0.50)...');

se.resetSessionState();
se.student = {
  fullName: 'محمد عبد الله',
  group: '1AS-01',
  studentId: 'ST-001',
  mode: 'exam'
};
se.selectedMedia = 'dvd';
se.installationMedia = 'dvd';
se.skipQuiz = true; // Scenario in user image: skip quiz mode was active

// Record the skip quiz entry into diagnosticErrors as done in registration
se.diagnosticErrors.push({
  phase: 'عام',
  title: 'التقويم المعرفي المفاهيمي (الأسئلة النظرية MCQs)',
  errorChoice: 'تخطي الأسئلة التقويمية بطلب من التلميذ (-6.00 نقاط)',
  expectedChoice: 'خوض غمار الإجابة على كافة الأسئلة لنيل العلامة الكاملة',
  rationale: 'تم تخطي الأسئلة بطلب من التلميذ فاعتُبرت إجاباتها ملغاة (0.00 / 6.00) والحد الأقصى للعلامة 14/20. يُوجّه التلميذ لاختيار النمط الشامل لنيل العلامة الكاملة 20/20.'
});

// Now record the BIOS boot mismatch penalty (-0.50)
se.recordPenalty(
  2,
  0.50,
  'جهاز الإقلاع الأول المختار لا يتطابق مع الوسيط المتصل (DVD)',
  'تم توصيل وسيط التثبيت (DVD) بالوحدة المركزية؛ يجب اختيار نفس هذا الوسيط كجهاز إقلاع أول (1st Boot Device) في البيوس لبدء التثبيت.'
);

assert.strictEqual(se.penalties.length, 1, 'se.penalties must have 1 procedural penalty');
assert.strictEqual(se.diagnosticErrors.length, 2, 'se.diagnosticErrors must have 2 entries (skip quiz + procedural penalty)');

const procError = se.diagnosticErrors[1];
assert.strictEqual(procError.phase, 2, 'Procedural error must have phase 2');
assert(procError.title.includes('خطأ إجرائي في المرحلة 2'), 'Title must describe procedural error in phase 2');
assert(procError.errorChoice.includes('جهاز الإقلاع الأول المختار لا يتطابق مع الوسيط المتصل (DVD)'), 'errorChoice must have exact reason');
assert(procError.errorChoice.includes('-0.50 ن'), 'errorChoice must reflect deduction amount');
assert(procError.rationale.includes('1st Boot Device'), 'rationale must provide pedagogical guidance');
console.log('  ✓ PASS: StateEngine recorded the procedural error in both penalties and diagnosticErrors');

console.log('[Check 2] Testing buildReportPayload() synchronization...');
const payload = reportPdf.buildReportPayload();
assert(Array.isArray(payload.diagnosticLog), 'diagnosticLog must be an array');
assert.strictEqual(payload.diagnosticLog.length, 2, 'diagnosticLog must contain both entries');

const logEntry2 = payload.diagnosticLog.find(d => d.phase === 2);
assert(logEntry2, 'diagnosticLog must have phase 2 entry');
assert(logEntry2.title.includes('خطأ إجرائي في المرحلة 2'), 'diagnosticLog title must match');
assert(logEntry2.errorChoice.includes('DVD'), 'diagnosticLog errorChoice must include media');
console.log('  ✓ PASS: buildReportPayload() generated complete diagnosticLog with all procedural penalties');

console.log('[Check 3] Testing report-template.html rendering with both errors...');
const reportTemplateHtml = fs.readFileSync(path.join(__dirname, 'report', 'report-template.html'), 'utf8');

// Mock DOM elements to test __injectReport
const domElements = {
  rCandidateName: { textContent: '' },
  rCandidateGroup: { textContent: '' },
  rSessionDate: { textContent: '' },
  rSessionTime: { textContent: '' },
  rSessionDuration: { textContent: '' },
  rFinalScore: { textContent: '' },
  rFinalTime: { textContent: '' },
  rCognitiveScore: { textContent: '' },
  rPracticalScore: { textContent: '' },
  rTotalPenalties: { textContent: '' },
  rPenaltiesSummary: { textContent: '' },
  rCognitiveNote: { textContent: '', style: {} },
  rPracticalNote: { textContent: '', style: {} },
  rCompetenciesBody: { innerHTML: '' },
  rDiagnosticBody: { innerHTML: '' },
  rTeacherCustomNote: { textContent: '' }
};

global.document = {
  getElementById: (id) => domElements[id] || { textContent: '', innerHTML: '', style: {} }
};

// Extract script block from report-template.html
const scriptContent = reportTemplateHtml.split('<script>')[1].split('</script>')[0];
eval(scriptContent);
assert(typeof window.__injectReport === 'function', 'window.__injectReport must be a function');

window.__injectReport(payload);

const renderedTableHtml = domElements.rDiagnosticBody.innerHTML;
assert(!renderedTableHtml.includes('undefined'), 'Rendered table must contain ZERO "undefined"');
assert(renderedTableHtml.includes('م 2'), 'Rendered table must include phase badge "م 2"');
assert(renderedTableHtml.includes('خطأ إجرائي في المرحلة 2'), 'Rendered table must include procedural error title');
assert(renderedTableHtml.includes('جهاز الإقلاع الأول المختار لا يتطابق مع الوسيط المتصل (DVD)'), 'Rendered table must include exact error reason');
assert(renderedTableHtml.includes('-0.50 ن'), 'Rendered table must include deduction value');
assert(renderedTableHtml.includes('1st Boot Device'), 'Rendered table must include teacher pedagogical rationale');
assert(renderedTableHtml.includes('تخطي الأسئلة التقويمية'), 'Rendered table must also include skip quiz row');

console.log('  ✓ PASS: report-template.html rendered both rows with 100% clarity, zero undefined values');

console.log('\n================================================================');
console.log('ALL PROCEDURAL PENALTIES REPORT TESTS PASSED (100%)!');
console.log('================================================================\n');
process.exit(0);
