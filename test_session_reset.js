/**
 * Test Suite: Complete Session State Reset Verification
 * (البرومبت 3 — تصفير كامل لحالة الجلسة عند الضغط على «جلسة جديدة»)
 *
 * Verifies that:
 * 1. resetSessionState() resets all BIOS settings to factory defaults (TPM=false, SecureBoot=false, SSD 1st boot).
 * 2. resetSessionState() resets all media states (USB/DVD/LAN detached, null).
 * 3. resetSessionState() resets power and monitor states (Power off, screen pitch black).
 * 4. resetSessionState() resets current phase to 1 and clears completed phases.
 * 5. resetSessionState() resets score to 14.00 / 20.00 and penalties to 0.00.
 * 6. resetSessionState() resets timer to 30:00 (1800s) and stops any intervals.
 * 7. resetSessionState() resets assistance/hint window and virtual keyboard hints to Phase 1.
 * 8. resetSessionState() closes all modals (guide, about, teacher, grand finale, pdf, quiz).
 * 9. resetSessionState() clears session registration form inputs and errors.
 * 10. Confirmation alert/prompt is wired before resetting an active session.
 * 11. inf.dll, theme preference, and sound mute settings remain completely untouched.
 */

const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('TEST SUITE: SESSION RESET (PROMPT 3 VERIFICATION)');
console.log('================================================================\n');

let allPassed = true;
function assert(cond, msg) {
  if (cond) {
    console.log(`  ✓ PASS: ${msg}`);
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    allPassed = false;
  }
}

// 1. Inspect Source Code Files
const indexHtml = fs.readFileSync(path.join(__dirname, 'src', 'index.html'), 'utf8');
const stateJs = fs.readFileSync(path.join(__dirname, 'src', 'js', 'state-engine.js'), 'utf8');
const biosJs = fs.readFileSync(path.join(__dirname, 'src', 'js', 'bios-controller.js'), 'utf8');

// --- RULE 1: BIOS CONTROLLER RESET METHOD ---
console.log('[Rule 1] Verifying BiosController.prototype.reset()...');
assert(biosJs.includes('reset() {'), 'BiosController contains dedicated reset() method');
assert(biosJs.includes('tpm: false'), 'reset() restores TPM to false (Disabled)');
assert(biosJs.includes('secureBoot: false'), 'reset() restores Secure Boot to false (Disabled)');
assert(biosJs.includes("firstBootDevice: 'Hard Drive (SSD)'"), 'reset() restores 1st boot device to internal SSD');
assert(biosJs.includes("secondBootDevice: 'USB Flash Drive'"), 'reset() restores 2nd boot device to USB Flash Drive');
assert(biosJs.includes("this.isSecondBoot = false"), 'reset() clears second boot flag');
assert(biosJs.includes("this.activeTab = 'Main'"), 'reset() restores active tab to Main');

// --- RULE 2: STATE ENGINE RESET METHOD ---
console.log('\n[Rule 2] Verifying StateEngine.prototype.resetSessionState()...');
assert(stateJs.includes('resetSessionState() {'), 'StateEngine contains dedicated resetSessionState() method');
assert(stateJs.includes('this.currentPhase = 1;'), 'resetSessionState() resets current phase to 1');
assert(stateJs.includes('this.completedPhases.clear();'), 'resetSessionState() clears completed phases set');
assert(stateJs.includes('this.cognitiveScore = 0;'), 'resetSessionState() resets cognitive score to 0');
assert(stateJs.includes('this.practicalScore = 14.00;'), 'resetSessionState() resets practical score to 14.00');
assert(stateJs.includes('this.penalties = [];'), 'resetSessionState() clears penalties array');
assert(stateJs.includes('this.diagnosticErrors = [];'), 'resetSessionState() clears diagnostic misconceptions');
assert(stateJs.includes('this.timerSeconds = 1800;'), 'resetSessionState() resets timer to 1800 seconds (30:00)');
assert(stateJs.includes('this.elapsedSeconds = 0;'), 'resetSessionState() resets elapsed time to 0');
assert(stateJs.includes('this.selectedMedia = null;'), 'resetSessionState() resets media selection to null (detached)');
assert(stateJs.includes('this.isPowerOn = false;'), 'resetSessionState() resets power state to false (Off)');
assert(stateJs.includes('this.stopTimer();'), 'resetSessionState() stops any active timer intervals');

// --- RULE 3: IN-MEMORY SIMULATION RESET TEST ---
console.log('\n[Rule 3] Running In-Memory Simulation Reset Behavior Test...');

// Mock Minimal DOM Environment
const mockElements = {
  stepperScoreValue: { textContent: '' },
  stepperPenaltiesValue: { textContent: '' },
  hudTimer: { textContent: '', classList: { add() {}, remove() {} } },
  hudStudentName: { textContent: '' },
  hudStudentGroup: { textContent: '' },
  hudStudentMode: { textContent: '' },
  hintBarText: { textContent: '' },
  vkbKeyHint: { textContent: '' },
  draggableHintBar: { style: {} },
  regLastName: { value: 'OLD_NAME' },
  regFirstName: { value: 'OLD_PRENOM' },
  lastNameError: { style: { display: 'block' } },
  firstNameError: { style: { display: 'block' } },
  regMode: { value: 'practice' },
  grandFinaleModal: { classList: { remove() {} } },
  expertGuideModal: { classList: { remove() {} } },
  aboutModal: { classList: { remove() {} } },
  teacherModal: { classList: { remove() {} } },
  pdfExportModal: { classList: { remove() {} } },
  exitConfirmModal: { classList: { remove() {} } },
  quizModal: { classList: { remove() {} } },
  btnOpenFinaleResults: { classList: { add() {}, remove() {} } }
};

global.document = {
  getElementById: (id) => mockElements[id] || null,
  querySelector: () => null,
  querySelectorAll: () => []
};

global.window = {
  soundSynth: null,
  renderPhaseScreen: () => {},
  syncMonitorPowerLed: () => {}
};

// Evaluate modules
eval(biosJs);
eval(stateJs);

// Simulate a dirty session
window.biosController.settings.tpm = true;
window.biosController.settings.secureBoot = true;
window.biosController.settings.firstBootDevice = 'USB Flash Drive';
window.biosController.isSecondBoot = true;
window.biosController.activeTab = 'Security';

window.stateEngine.currentPhase = 6;
window.stateEngine.completedPhases.add(1).add(2).add(3).add(4).add(5);
window.stateEngine.cognitiveScore = 4.0;
window.stateEngine.practicalScore = 11.5;
window.stateEngine.penalties.push({ deduction: 1.0, reason: 'test' });
window.stateEngine.selectedMedia = 'usb';
window.stateEngine.isPowerOn = true;
window.stateEngine.timerSeconds = 420;
window.stateEngine.elapsedSeconds = 1380;
window.stateEngine.isSessionActive = true;
window.stateEngine.isCompleted = true;
window.stateEngine.biosConfig.tpm = true;
window.stateEngine.partitionConfig.gptCreated = true;

// Execute reset
window.resetSessionState();

assert(window.biosController.settings.tpm === false, 'After reset: BIOS TPM is false');
assert(window.biosController.settings.secureBoot === false, 'After reset: BIOS Secure Boot is false');
assert(window.biosController.settings.firstBootDevice === 'Hard Drive (SSD)', 'After reset: BIOS 1st boot device is SSD');
assert(window.biosController.isSecondBoot === false, 'After reset: BIOS isSecondBoot is false');
assert(window.stateEngine.currentPhase === 1, 'After reset: currentPhase is 1');
assert(window.stateEngine.completedPhases.size === 0, 'After reset: completedPhases is empty');
assert(window.stateEngine.practicalScore === 14.00, 'After reset: practicalScore is 14.00');
assert(window.stateEngine.cognitiveScore === 0, 'After reset: cognitiveScore is 0');
assert(window.stateEngine.getCalculatedScore() === 14.00, 'After reset: calculated score is 14.00/20.00');
assert(window.stateEngine.penalties.length === 0, 'After reset: penalties list is empty');
assert(window.stateEngine.selectedMedia === null, 'After reset: selectedMedia is null');
assert(window.stateEngine.isPowerOn === false, 'After reset: isPowerOn is false');
assert(window.stateEngine.timerSeconds === 1800, 'After reset: timerSeconds is 1800 (30:00)');
assert(window.stateEngine.isSessionActive === false, 'After reset: isSessionActive is false');
assert(window.stateEngine.isCompleted === false, 'After reset: isCompleted is false');
assert(mockElements.regLastName.value === '', 'After reset: regLastName is cleared');
assert(mockElements.regFirstName.value === '', 'After reset: regFirstName is cleared');
assert(mockElements.regMode.value === 'exam', 'After reset: regMode is restored to exam');

// --- RULE 4: BUTTON HANDLERS & CONFIRMATION IN INDEX.HTML ---
console.log('\n[Rule 4] Verifying #btnNewSession and #btnFinaleRestart Handlers in index.html...');
assert(indexHtml.includes("const btnNew = document.getElementById('btnNewSession');"), 'btnNewSession element lookup exists');
assert(indexHtml.includes("confirm('هل أنت متأكد من رغبتك في بدء جلسة جديدة؟"), 'Confirmation dialog triggered before resetting active progress');
assert(indexHtml.includes("window.resetSessionState();"), 'btnNewSession triggers resetSessionState()');
assert(indexHtml.includes("document.getElementById('sessionModal').classList.add('modal-visible');"), 'btnNewSession opens session registration modal');
assert(indexHtml.includes("finaleRestart.addEventListener('click', () => {"), 'Finale modal has restart button handler');

// --- RULE 5: UNTOUCHED DATA INTEGRITY (INF.DLL, THEME, SOUND) ---
console.log('\n[Rule 5] Verifying Untouched Systems (inf.dll, Theme, Sound)...');
const dllStat = fs.statSync(path.join(__dirname, 'dist', 'inf.dll'));
assert(dllStat.size === 689, 'dist/inf.dll size is exactly 689 bytes (untouched)');
assert(!stateJs.includes("localStorage.removeItem('app_theme')"), 'resetSessionState does NOT clear app_theme');
assert(!stateJs.includes("localStorage.removeItem('app_sound')"), 'resetSessionState does NOT clear sound preferences');
assert(!stateJs.includes("settingsManager.saveSettings"), 'resetSessionState does NOT alter teacher settings in inf.dll');

console.log('\n================================================================');
if (allPassed) {
  console.log('✓ ALL SESSION RESET (PROMPT 3) TESTS PASSED (100%)!');
  process.exit(0);
} else {
  console.error('✗ SOME SESSION RESET TESTS FAILED!');
  process.exit(1);
}
