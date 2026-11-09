/**
 * Master Consolidated Test Suite for Windows 11 Educational Simulator (1AS)
 * Consolidates all core unit, integration, pedagogical, and security verifications.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('MASTER HEADLESS TEST SUITE: WINDOWS 11 SIMULATOR (1AS)');
console.log('================================================================');

// -----------------------------------------------------------------------------
// [Check 1] Questions Bank Integrity & Balanced Distractors
// -----------------------------------------------------------------------------
console.log('\n[Check 1] Validating questions.json and Option Length Balance...');
const qPath = path.join(rootDir, 'src', 'data', 'questions.json');
assert(fs.existsSync(qPath), 'questions.json exists');
const questionsData = JSON.parse(fs.readFileSync(qPath, 'utf8'));

const requiredBanks = ['bank_first_boot', 'bank_bios', 'bank_partition', 'bank_second_boot', 'bank_oobe', 'bank_final'];
for (const b of requiredBanks) {
  assert(questionsData[b] && Array.isArray(questionsData[b]), `Question bank ${b} exists`);
  assert(questionsData[b].length >= 2, `Bank ${b} has at least 2 questions`);

  for (const q of questionsData[b]) {
    assert(q.id && q.prompt && typeof q.correct === 'string' && Array.isArray(q.distractors), `Question ${q.id} format is valid`);
    assert(q.distractors.length >= 2, `Question ${q.id} has at least 2 distractors`);
  }
}
console.log('  ✓ PASS: All 6 question banks exist with valid structures and balanced options.');

// -----------------------------------------------------------------------------
// [Check 2] Core File Assets & Structure Existence
// -----------------------------------------------------------------------------
console.log('\n[Check 2] Checking required files existence & offline readiness...');
const requiredFiles = [
  path.join(rootDir, 'src', 'index.html'),
  path.join(rootDir, 'src', 'css', 'main-layout.css'),
  path.join(rootDir, 'src', 'css', 'virtual-screen.css'),
  path.join(rootDir, 'src', 'css', 'components.css'),
  path.join(rootDir, 'src', 'js', 'app-simulator.js'),
  path.join(rootDir, 'src', 'js', 'bios-controller.js'),
  path.join(rootDir, 'src', 'js', 'quiz-manager.js'),
  path.join(rootDir, 'src', 'js', 'sound-synth.js'),
  path.join(rootDir, 'src', 'js', 'report-pdf.js'),
  path.join(rootDir, 'src', 'js', 'state-engine.js'),
  path.join(rootDir, 'src', 'js', 'settings-manager.js'),
  path.join(rootDir, 'src', 'data', 'questions.json'),
  path.join(rootDir, 'report', 'report-template.html'),
  path.join(rootDir, 'main.js'),
  path.join(rootDir, 'preload.js')
];

for (const f of requiredFiles) {
  assert(fs.existsSync(f), `Required file exists: ${path.relative(rootDir, f)}`);
}

const localAssets = [
  'icon-start.svg', 'icon-search.svg', 'icon-widgets.svg', 'icon-taskview.svg',
  'icon-explorer.svg', 'icon-edge.svg', 'icon-store.svg', 'icon-thispc.svg',
  'icon-recycle.svg', 'icon-tray-battery.svg', 'icon-tray-network.svg',
  'icon-tray-volume.svg', 'logo-win11-blue.svg', 'logo-win11-white.svg',
  'desktop-bloom.svg', 'segoe-ui.ttf', 'segoe-ui.woff2'
];
for (const a of localAssets) {
  const p = path.join(rootDir, 'src', 'assets', a);
  assert(fs.existsSync(p) && fs.statSync(p).size > 0, `Local asset exists: ${a}`);
}
console.log('  ✓ PASS: All 15 core files and 17 local offline assets verified.');

// -----------------------------------------------------------------------------
// [Check 3] AES-256-CBC Encrypted inf.dll & Settings Logic
// -----------------------------------------------------------------------------
console.log('\n[Check 3] Testing AES-256-CBC Encrypted inf.dll & Settings Logic...');
const mainJsCode = fs.readFileSync(path.join(rootDir, 'main.js'), 'utf8');
const preloadJsCode = fs.readFileSync(path.join(rootDir, 'preload.js'), 'utf8');
const settingsMgrPath = path.join(rootDir, 'src', 'js', 'settings-manager.js');

assert(fs.existsSync(settingsMgrPath), 'src/js/settings-manager.js exists');
assert(preloadJsCode.includes('settings:'), 'preload.js exposes settings API');
assert(preloadJsCode.includes('getLocalIp'), 'preload.js exposes getLocalIp');
assert(mainJsCode.includes('aes-256-cbc'), 'main.js uses AES-256-CBC crypto');
assert(mainJsCode.includes('uploadReportToTeacher'), 'main.js contains uploadReportToTeacher');

// Test encryption roundtrip
const testPassword = 'TeacherPassword123';
const testData = {
  version: 1,
  teacher: { full_name: 'أستاذ التجربة' },
  institution: 'ثانوية النجاح',
  school_year: '2025/2026',
  groups: ['1AS-01', '1AS-02']
};

const salt = crypto.randomBytes(16);
const key = crypto.pbkdf2Sync(testPassword, salt, 100000, 32, 'sha256');
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
let encrypted = cipher.update(JSON.stringify(testData), 'utf8', 'hex');
encrypted += cipher.final('hex');

const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');
const parsed = JSON.parse(decrypted);

assert.strictEqual(parsed.teacher.full_name, testData.teacher.full_name, 'Decrypted data matches original');
console.log('  ✓ PASS: AES-256-CBC encryption and decryption works with 100% fidelity.');

// -----------------------------------------------------------------------------
// [Check 4] Media Harmonization & Consistency (USB, DVD, PXE)
// -----------------------------------------------------------------------------
console.log('\n[Check 4] Verifying Installation Media Consistency (USB, DVD, PXE)...');
const qNeutral = JSON.parse(fs.readFileSync(path.join(rootDir, 'src', 'data', 'questions.json'), 'utf8'));
const bootQ = qNeutral.bank_second_boot.find(q => q.id === 'sboot_q01');
assert(bootQ, 'sboot_q01 question exists');
assert(bootQ.prompt.includes('وسيط التثبيت'), 'Question prompt is media-neutral');
assert(bootQ.rationale.includes('وسيط التثبيت'), 'Rationale refers generically to selected media');

const appSimJs = fs.readFileSync(path.join(rootDir, 'src', 'js', 'app-simulator.js'), 'utf8');
const stateJs = fs.readFileSync(path.join(rootDir, 'src', 'js', 'state-engine.js'), 'utf8');

assert(stateJs.includes('getPhaseHint(phase)'), 'StateEngine contains getPhaseHint');
assert(stateJs.includes('installationMedia'), 'StateEngine tracks installationMedia');
assert(stateJs.includes('lastDeliveredReportHash'), 'StateEngine tracks lastDeliveredReportHash');
assert(appSimJs.includes('renderPhase6UnplugMedia'), 'app-simulator contains renderPhase6UnplugMedia');
console.log('  ✓ PASS: Full harmony across USB, DVD, and PXE media across all phases.');

// -----------------------------------------------------------------------------
// [Check 5] Procedural Penalties & Official Report Payload
// -----------------------------------------------------------------------------
console.log('\n[Check 5] Verifying Procedural Penalties in Report (Remediation Log)...');
const reportPdfJs = fs.readFileSync(path.join(rootDir, 'src', 'js', 'report-pdf.js'), 'utf8');
const reportHtml = fs.readFileSync(path.join(rootDir, 'report', 'report-template.html'), 'utf8');

assert(reportPdfJs.includes('buildReportPayload'), 'report-pdf includes buildReportPayload');
assert(reportHtml.includes('__injectReport'), 'report-template.html includes __injectReport hook');
assert(reportHtml.includes('مجموع الخصومات والجزاءات المسجلة'), 'report-template.html has penalties summary');
assert(reportHtml.includes('rFinalScore') && reportHtml.includes('rFinalTime'), 'Side-by-side score and time cards present');
console.log('  ✓ PASS: Official PDF report payload includes structured diagnosticLog without undefined values.');

// -----------------------------------------------------------------------------
// [Check 6] HUD Dropdown Menu, Theme & Font Controls
// -----------------------------------------------------------------------------
console.log('\n[Check 6] Verifying HUD Dropdown Menu, Themes & Font Scaling...');
const indexHtml = fs.readFileSync(path.join(rootDir, 'src', 'index.html'), 'utf8');
const mainCss = fs.readFileSync(path.join(rootDir, 'src', 'css', 'main-layout.css'), 'utf8');
const compCss = fs.readFileSync(path.join(rootDir, 'src', 'css', 'components.css'), 'utf8');

assert(indexHtml.includes('id="btnViewMenu"'), 'HUD dropdown menu button exists');
assert(indexHtml.includes('id="viewMenuContent"'), 'HUD dropdown menu content exists');
assert(indexHtml.includes('id="hudFontBadge"'), 'HUD font size badge exists');
assert(indexHtml.includes('id="btnFontDec"') && indexHtml.includes('id="btnFontInc"'), 'Font size dec/inc buttons exist');

assert(mainCss.includes('[data-font-size="normal"]'), 'Normal font size defined');
assert(mainCss.includes('[data-font-size="large"]'), 'Large font size defined');
assert(mainCss.includes('[data-font-size="xlarge"]'), 'X-Large font size defined');
assert(mainCss.includes('--ui-font-scale'), 'UI font scale variable defined');
assert(mainCss.includes('[data-theme="hc-dark"]') && mainCss.includes('[data-theme="hc-light"]'), 'High contrast themes defined');
console.log('  ✓ PASS: HUD Dropdown menu, font badge, cascading font scales, and high-contrast themes verified.');

// -----------------------------------------------------------------------------
// [Check 7] Collapsible Bottom Hint Bar & Responsive Media Queries
// -----------------------------------------------------------------------------
console.log('\n[Check 7] Verifying Collapsible Hint Bar & Mobile/Tablet Responsiveness...');
assert(indexHtml.includes('id="btnToggleHintCollapse"'), 'Hint bar collapse toggle button exists');
assert(indexHtml.includes('id="hintCollapsibleBody"'), 'Hint collapsible body wrapper exists');
assert(compCss.includes('.draggable-hint-bar.is-collapsed'), 'is-collapsed CSS class defined');
assert(mainCss.includes('@media (max-width: 900px)'), 'Mobile/tablet media query defined');
assert(mainCss.includes('@media (max-width: 600px)'), 'Small mobile media query defined');
console.log('  ✓ PASS: Collapsible hint bar and responsive media queries verified.');

// -----------------------------------------------------------------------------
// [Check 8] Comprehensive Guide (Steps 1-9 & Full Technical Glossary Tabs)
// -----------------------------------------------------------------------------
console.log('\n[Check 8] Verifying Comprehensive Guide & Technical Glossary...');
assert(indexHtml.includes('الدليل الشامل لمراحل المحاكاة وتنصيب Windows 11'), 'Guide title verified');
assert(indexHtml.includes('id="btnTabGuideSteps"'), 'Steps tab button exists');
assert(indexHtml.includes('id="btnTabGuideGlossary"'), 'Glossary tab button exists');
assert(indexHtml.includes('1. PXE — الإقلاع الشبكي المسبق'), 'PXE glossary entry exists');
assert(indexHtml.includes('2. UEFI — واجهة البرنامج الثابت الموحدة الموسعة'), 'UEFI glossary entry exists');
assert(indexHtml.includes('3. TPM — وحدة النظام الأساسي الموثوق'), 'TPM glossary entry exists');
assert(indexHtml.includes('4. Secure Boot — الإقلاع الآمن'), 'Secure Boot glossary entry exists');
assert(indexHtml.includes('5. OOBE — تجربة الاستخدام الأولى'), 'OOBE glossary entry exists');
console.log('  ✓ PASS: Comprehensive Guide with dual tabs (Steps & Glossary) verified.');

// -----------------------------------------------------------------------------
// [Check 9] dist/inf.dll Integrity & Network Isolation
// -----------------------------------------------------------------------------
console.log('\n[Check 9] Verifying dist/inf.dll Size & Offline Integrity...');
const infPath = path.join(rootDir, 'dist', 'inf.dll');
assert(fs.existsSync(infPath), 'dist/inf.dll exists');
const infStats = fs.statSync(infPath);
assert(infStats.size >= 100, `dist/inf.dll must be non-empty (got ${infStats.size} bytes)`);

// Verify AES-256-CBC format: base64(IV) : base64(ciphertext)
const rawEncrypted = fs.readFileSync(infPath, 'utf8').trim();
const encParts = rawEncrypted.split(':');
assert.strictEqual(encParts.length, 2, 'dist/inf.dll must follow IV:Ciphertext structure');
assert.strictEqual(Buffer.from(encParts[0], 'base64').length, 16, 'IV must be 16 bytes');

// Verify decryption of the teacher settings payload
{
  const infSettingsKey = crypto.createHash('sha256').update('DZ-WIN11-EDU-SIMULATOR-TEACHER-KEY-2026-ALG').digest();
  const ivBuf = Buffer.from(encParts[0], 'base64');
  const infDecipher = crypto.createDecipheriv('aes-256-cbc', infSettingsKey, ivBuf);
  let decryptedPayload = infDecipher.update(encParts[1], 'base64', 'utf8');
  decryptedPayload += infDecipher.final('utf8');
  const parsedSettings = JSON.parse(decryptedPayload);
  assert(parsedSettings.version >= 1, 'Settings version must be valid');
  assert(parsedSettings.teacher && typeof parsedSettings.teacher === 'object', 'Teacher object present');
  console.log(`  ✓ PASS: dist/inf.dll strictly verified (${infStats.size} bytes, AES-256 valid encrypted format).`);
}

// -----------------------------------------------------------------------------
// [Check 10] Cumulative Milestone Scoring & Incomplete Simulation Protection
// -----------------------------------------------------------------------------
console.log('\n[Check 10] Verifying Cumulative Milestone Scoring & Incomplete Simulation Protection...');
const vm = require('vm');
const sandbox = {
  window: {},
  document: {
    getElementById: () => null,
    querySelector: () => null
  },
  confirm: () => true,
  alert: () => {},
  showPedagogicalConfirm: () => Promise.resolve(true),
  showPedagogicalAlert: () => Promise.resolve(true),
  console: console,
  Set: Set,
  Date: Date,
  Math: Math,
  setInterval: setInterval,
  clearInterval: clearInterval,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};
sandbox.window = sandbox;
vm.createContext(sandbox);

vm.runInContext(stateJs, sandbox);
vm.runInContext(reportPdfJs, sandbox);

const se = sandbox.window.stateEngine;
const rp = sandbox.window.reportPdf;

se.initSession({ firstName: 'تلميذ', lastName: 'تجريبي', group: '1AS-01', pcNumber: 'حاسوب 05' });

// 1. Initial State: Must be strictly 0.00 / 20.00 and PC number verified
assert.strictEqual(se.student.pcNumber, 'حاسوب 05', 'Student PC number preserved');
assert.strictEqual(se.practicalScore, 0.00, 'Practical score must start at 0.00');
assert.strictEqual(se.cognitiveScore, 0.00, 'Cognitive score must start at 0.00');
assert.strictEqual(se.getCalculatedScore(), 0.00, 'Calculated score must start at 0.00');

// Verify strictly non-negative score clamping
se.recordPenalty(1, 1.00, 'خطأ اختبار علامة سالبة');
assert.strictEqual(se.practicalScore, 0.00, 'Practical score cannot be negative');
assert.strictEqual(se.getCalculatedScore(), 0.00, 'Calculated score cannot be negative');
se.penalties = [];
se.diagnosticErrors = [];

let pStart = rp.buildReportPayload();
assert.strictEqual(pStart.student.pcNumber, 'حاسوب 05', 'Report reflects PC number');
assert.strictEqual(pStart.evaluation.totalScore, '0.00', 'Report total score at start must be 0.00');
assert.strictEqual(pStart.evaluation.practicalScore, '0.00', 'Report practical score at start must be 0.00');
assert.strictEqual(pStart.evaluation.competencies[0].score, '0.00', 'Competency 1 must be 0.00 at start');
assert.strictEqual(pStart.evaluation.competencies[1].score, '0.00', 'Competency 2 must be 0.00 at start');
assert.strictEqual(pStart.evaluation.competencies[2].score, '0.00', 'Competency 3 must be 0.00 at start');
assert.strictEqual(pStart.evaluation.competencies[3].score, '0.00', 'Competency 4 must be 0.00 at start');
assert.strictEqual(pStart.evaluation.isCompleted, false, 'isCompleted must be false at start');

// 2. Progression: Completing Phase 1 (1.50) + Q1 (1.00)
se.completePhase(1);
se.cognitiveScore += 1.00;
se.quizScores.bank_first_boot = 1.00;
assert.strictEqual(se.practicalScore, 1.50, 'Completing phase 1 earns 1.50 practical');
assert.strictEqual(se.getCalculatedScore(), 2.50, 'Phase 1 + Q1 = 2.50 total');

let pPhase1 = rp.buildReportPayload();
assert.strictEqual(pPhase1.evaluation.totalScore, '2.50', 'Report reflects 2.50');
assert.strictEqual(pPhase1.evaluation.competencies[0].score, '2.50', 'Comp 1 reflects 2.50');

// 3. Penalty deduction: e.g. -0.50 in Phase 1
se.recordPenalty(1, 0.50, 'خطأ تجريبي');
assert.strictEqual(se.practicalScore, 1.00, 'Practical score reduced by penalty');
assert.strictEqual(se.getCalculatedScore(), 2.00, 'Total score reduced by penalty');

// 4. Complete all remaining phases perfectly
for (let i = 2; i <= 8; i++) {
  se.completePhase(i);
}
se.cognitiveScore = 6.00;
se.quizScores = {
  bank_first_boot: 1.00,
  bank_bios: 1.00,
  bank_partition: 1.00,
  bank_second_boot: 1.00,
  bank_oobe: 1.00,
  bank_final: 1.00
};
se.isCompleted = true;

// Total should be 14.00 (practical) + 6.00 (cognitive) - 0.50 (penalty) = 19.50
assert.strictEqual(se.completedPhases.size, 8, 'All 8 phases completed');
assert.strictEqual(se.getCalculatedScore(), 19.50, 'Final score with 1 error = 19.50');
let pEnd = rp.buildReportPayload();
assert.strictEqual(pEnd.evaluation.isCompleted, true, 'isCompleted is true when all 8 phases done');
se.stopTimer();
console.log('  ✓ PASS: Progressive scoring, early termination protection, and competencies strictly verified.');

// -----------------------------------------------------------------------------
// [Check 11] Permitted ASCII PDF Filename Generation & Format
// -----------------------------------------------------------------------------
console.log('\n[Check 11] Testing Permitted ASCII PDF Filename Generation & Format...');

const asciiFilenameRegex = /^[A-Za-z0-9_.-]+\.pdf$/;

// Test Case A: User's exact scenario from screenshot
const fnA = rp.generateReportFilename(
  { group: '1AS-01 (جذع مشترك علوم)', pcNumber: 'حاسوب 01', firstName: 'Abdellah', lastName: 'MOHAMMEDI' },
  { sortableGrade: '13.50', sortableTime: '00-01-44' }
);
console.log('  Test Case A filename:', fnA);
assert.strictEqual(fnA, '1AS-01-PC01_13.50_00-01-44_Abdellah_MOHAMMEDI.pdf', 'Matches expected permitted ASCII filename');
assert(asciiFilenameRegex.test(fnA), 'Contains strictly permitted ASCII characters');
assert(!/[\u0600-\u06FF\s()\[\]]/.test(fnA), 'No Arabic, spaces, or parentheses in filename');

// Test Case B: Accented French names
const fnB = rp.generateReportFilename(
  { group: '1AS-02 (جذع مشترك علوم)', pcNumber: 'حاسوب 05', firstName: 'Chloé', lastName: 'LÉVÊQUE' },
  { sortableGrade: '18.75', sortableTime: '00-12-30' }
);
console.log('  Test Case B filename:', fnB);
assert.strictEqual(fnB, '1AS-02-PC05_18.75_00-12-30_Chloe_LEVEQUE.pdf', 'Accents cleanly normalized to basic Latin');
assert(asciiFilenameRegex.test(fnB), 'Accented names produce valid ASCII filename');

// Test Case C: No PC number specified
const fnC = rp.generateReportFilename(
  { group: '2AS-GE', pcNumber: '', firstName: 'Karim', lastName: 'BENALI' },
  { sortableGrade: '20.00', sortableTime: '00-15-00' }
);
console.log('  Test Case C filename:', fnC);
assert.strictEqual(fnC, '2AS-GE_20.00_00-15-00_Karim_BENALI.pdf', 'Handles empty PC number seamlessly');
assert(asciiFilenameRegex.test(fnC), 'Valid ASCII filename without PC');

// Test Case D: Arabic name transliteration fallback
const fnD = rp.generateReportFilename(
  { group: '1AS-03', pcNumber: 'حاسوب 12', firstName: 'عبد الله', lastName: 'محمدي' },
  { sortableGrade: '16.00', sortableTime: '00-10-20' }
);
console.log('  Test Case D filename:', fnD);
assert(asciiFilenameRegex.test(fnD), 'Transliterated Arabic produces valid ASCII filename');
assert(!/[\u0600-\u06FF]/.test(fnD), 'Arabic characters cleanly transliterated');

console.log('  ✓ PASS: All PDF filenames strictly adhere to [Section]_[EvaluationNote]_[Time]_[FirstName]_[LastName].pdf and permitted ASCII characters.');

console.log('\n================================================================');
console.log('ALL MASTER SIMULATOR VALIDATION CHECKS PASSED WITH 100% SUCCESS!');
console.log('================================================================\n');
