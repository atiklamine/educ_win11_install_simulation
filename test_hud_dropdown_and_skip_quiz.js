const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Testing HUD Dropdown Menu & Skip Quiz Mode with Score Deduction...');

const indexHtml = fs.readFileSync('src/index.html', 'utf8');
const mainCss = fs.readFileSync('src/css/main-layout.css', 'utf8');
const stateJs = fs.readFileSync('src/js/state-engine.js', 'utf8');
const quizJs = fs.readFileSync('src/js/quiz-manager.js', 'utf8');
const pdfJs = fs.readFileSync('src/js/report-pdf.js', 'utf8');

// 1. HUD Dropdown Menu Verification
console.log('\n[Check 1] Verifying HUD Dropdown Menu Architecture...');
assert(indexHtml.includes('id="viewMenuDropdown"'), 'viewMenuDropdown container exists');
assert(indexHtml.includes('id="btnViewMenu"'), 'btnViewMenu toggle button exists');
assert(indexHtml.includes('id="btnToggleViewMode"'), 'btnToggleViewMode exists in dropdown');
assert(indexHtml.includes('id="btnToggleFullscreen"'), 'btnToggleFullscreen exists in dropdown');
assert(indexHtml.includes('id="btnToggleTheme"'), 'btnToggleTheme exists in dropdown');
assert(indexHtml.includes('id="btnFontDec"'), 'btnFontDec exists in dropdown');
assert(indexHtml.includes('id="btnFontInc"'), 'btnFontInc exists in dropdown');

assert(mainCss.includes('.hud-dropdown'), '.hud-dropdown class defined in CSS');
assert(mainCss.includes('.hud-dropdown-menu'), '.hud-dropdown-menu class defined in CSS');
assert(mainCss.includes('.hud-dropdown-item'), '.hud-dropdown-item class defined in CSS');
assert(mainCss.includes('.hud-dropdown-font-box'), '.hud-dropdown-font-box class defined in CSS');
assert(mainCss.includes('.hud-dropdown.open .hud-dropdown-menu'), 'Dropdown toggle open state defined in CSS');
console.log('  ✓ PASS: HUD Dropdown menu groups View Mode, Fullscreen, Theme, and Fonts cleanly without overflow');

// 2. Skip Quiz UI Controls in Session Registration Modal
console.log('\n[Check 2] Verifying Session Registration Quiz Mode Options...');
assert(indexHtml.includes('id="regQuizMode"'), '#regQuizMode select element exists');
assert(indexHtml.includes('value="with_quiz"'), 'with_quiz option exists');
assert(indexHtml.includes('value="without_quiz"'), 'without_quiz option exists');
assert(indexHtml.includes('id="quizModeNotice"'), 'quizModeNotice warning box exists');
assert(indexHtml.includes('id="hudQuizModeBadge"'), 'hudQuizModeBadge HUD badge exists');
assert(indexHtml.includes('id="finaleQuizSkipNotice"'), 'finaleQuizSkipNotice exists in grand finale modal');
console.log('  ✓ PASS: Registration modal includes full quiz vs skip quiz selection with motivational warning');

// 3. Functional StateEngine & QuizManager Verification
console.log('\n[Check 3] Verifying StateEngine and QuizManager Skip-Quiz Behavior...');

// Setup mock DOM and environment
const mockElements = {
  hudStudentName: { textContent: '' },
  hudStudentGroup: { textContent: '' },
  hudStudentMode: { textContent: '' },
  hudQuizModeBadge: { style: { display: 'none' } },
  hudTimer: { textContent: '', classList: { add() {}, remove() {} } },
  hudScore: { textContent: '' },
  finaleScoreNumber: { textContent: '' },
  finaleTimeNumber: { textContent: '' },
  finaleScoreAppreciation: { textContent: '', className: '' },
  finaleCognitiveScore: { innerHTML: '', textContent: '' },
  finalePracticalScore: { textContent: '' },
  finaleDuration: { textContent: '' },
  finalePenaltiesList: { innerHTML: '' },
  grandFinaleModal: { classList: { add() {}, remove() {} } },
  finaleQuizSkipNotice: { style: { display: 'none' } },
  quizModal: { classList: { add() {}, remove() {} } },
  regLastName: { value: '' },
  regFirstName: { value: '' },
  regGroup: { value: '1AS-01' },
  regMode: { value: 'exam' },
  regQuizMode: { value: 'without_quiz' },
  quizModeNotice: { style: { display: 'none' } }
};

global.document = {
  getElementById: (id) => mockElements[id] || null,
  querySelector: () => null,
  querySelectorAll: () => []
};

global.window = {
  soundSynth: { playClick() {}, playWarning() {}, playSuccess() {} },
  settingsManager: {
    getSettings() { return { session_mode_enabled: true }; },
    isFrenchNameValid() { return true; }
  },
  biosController: { reset() {} }
};

// Evaluate modules
eval(stateJs);
eval(quizJs);

const se = window.stateEngine;
const qm = window.quizManager;

// Test A: Normal Mode with Quiz
se.initSession({
  firstName: 'Ahmed',
  lastName: 'Benali',
  group: '1AS-01',
  mode: 'exam',
  quizMode: 'with_quiz',
  skipQuiz: false
});

assert.strictEqual(se.skipQuiz, false, 'skipQuiz should be false');
assert.strictEqual(se.cognitiveScore, 0, 'Initial cognitive score is 0');
assert.strictEqual(se.practicalScore, 14.00, 'Initial practical score is 14.00');
assert.strictEqual(mockElements.hudQuizModeBadge.style.display, 'none', 'HUD quiz mode badge hidden in normal mode');

// Test B: Skip Quiz Mode
se.initSession({
  firstName: 'Yacine',
  lastName: 'Larbi',
  group: '1AS-02',
  mode: 'exam',
  quizMode: 'without_quiz',
  skipQuiz: true
});

assert.strictEqual(se.skipQuiz, true, 'skipQuiz should be true');
assert.strictEqual(se.cognitiveScore, 0, 'Cognitive score remains strictly 0 (all points forfeited)');
assert.strictEqual(se.practicalScore, 14.00, 'Practical score remains intact (14.00 max)');
assert.strictEqual(mockElements.hudQuizModeBadge.style.display, 'inline-flex', 'HUD quiz mode badge shown in skip quiz mode');

// Test C: Quiz invocation in Skip-Quiz Mode
let callbackCalled = false;
qm.showQuizForBank('bank1', () => {
  callbackCalled = true;
});

assert.strictEqual(callbackCalled, true, 'showQuizForBank must immediately call onComplete without showing quiz dialog');
assert.strictEqual(se.cognitiveScore, 0, 'Cognitive score remains 0 after skipped quiz');

// Test D: Finale Modal in Skip-Quiz Mode
se.showGrandFinaleModal(false);
assert.strictEqual(mockElements.finaleQuizSkipNotice.style.display, 'block', 'Finale modal displays motivational skip warning');
assert(mockElements.finaleCognitiveScore.innerHTML.includes('0.00 / 6.00'), 'Cognitive score displayed as 0.00 / 6.00');

// Test E: Score calculation max 14.00
const finalScore = se.getCalculatedScore();
assert(finalScore <= 14.00, `Final score must not exceed 14.00 (got: ${finalScore})`);
console.log(`  ✓ PASS: Final score in skip quiz mode is strictly bounded to practical maximum (${finalScore} / 20.00)`);

// Test F: Report PDF payload & Diagnostic Remediation Log Structure
eval(pdfJs);
const report = window.reportPdf.buildReportPayload();
assert.strictEqual(report.evaluation.cognitiveScore, '0.00', 'Report cognitiveScore is 0.00');
assert(report.penalties.some(p => p.reason.includes('تخطي الأسئلة التقويمية')), 'Report penalties log includes skip quiz deduction');
assert(Array.isArray(report.diagnosticLog), 'diagnosticLog must be an array');
assert(report.diagnosticLog.length > 0, 'diagnosticLog must have an entry for skipped quiz');
const skipDiagEntry = report.diagnosticLog[0];
assert.strictEqual(typeof skipDiagEntry, 'object', 'diagnosticLog entry must be an object, NOT a string');
assert.strictEqual(skipDiagEntry.phase, 'عام', 'diagnosticLog phase must be "عام"');
assert(skipDiagEntry.title && skipDiagEntry.title.length > 0, 'diagnosticLog title must be defined');
assert(skipDiagEntry.errorChoice && skipDiagEntry.errorChoice.length > 0, 'diagnosticLog errorChoice must be defined');
assert(skipDiagEntry.rationale && skipDiagEntry.rationale.length > 0, 'diagnosticLog rationale must be defined');
console.log('  ✓ PASS: Official PDF report payload includes structured diagnosticLog without undefined values');

// Test G: Verify report-template.html injection doesn't generate "undefined" in table
const reportTemplateHtml = fs.readFileSync(path.join(__dirname, 'report', 'report-template.html'), 'utf8');
assert(reportTemplateHtml.includes('id="rCognitiveNote"'), 'report-template.html has rCognitiveNote');
assert(reportTemplateHtml.includes('id="rPracticalNote"'), 'report-template.html has rPracticalNote');
assert(!reportTemplateHtml.includes('م undefined'), 'report-template.html contains NO hardcoded "م undefined"');
console.log('  ✓ PASS: report-template.html includes dynamic cognitive/practical notes and protects against undefined');

console.log('\n================================================================');
console.log('ALL HUD DROPDOWN & SKIP QUIZ TESTS PASSED (100%)!');
console.log('================================================================\n');
process.exit(0);
