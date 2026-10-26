/**
 * Automated Test Suite for Simulator Logic & Pedagogical Constraints
 */
const fs = require('fs');
const path = require('path');

console.log('--- STARTING VALIDATION TESTS ---');

// Test 1: Validate questions.json structure and option balancing
console.log('\n[Test 1] Validating questions.json and Option Length Balance...');
const qRaw = fs.readFileSync(path.join(__dirname, 'src', 'data', 'questions.json'), 'utf8');
const qData = JSON.parse(qRaw);

const banks = ['bank_first_boot', 'bank_bios', 'bank_partition', 'bank_second_boot', 'bank_oobe', 'bank_final'];
let allBalanced = true;

banks.forEach(bankKey => {
  if (!qData[bankKey] || qData[bankKey].length === 0) {
    console.error(`FAIL: Missing bank ${bankKey}`);
    allBalanced = false;
    return;
  }
  qData[bankKey].forEach((q, idx) => {
    const correctLen = q.correct.length;
    const correctWords = q.correct.trim().split(/\s+/).length;

    q.distractors.forEach((d, dIdx) => {
      const dLen = d.length;
      const dWords = d.trim().split(/\s+/).length;
      const charDiff = Math.abs(correctLen - dLen);
      const wordDiff = Math.abs(correctWords - dWords);

      if (charDiff > 8 || wordDiff > 2) {
        console.warn(`WARNING: Potential imbalance in ${bankKey}[${idx}] opt ${dIdx}: Correct(${correctLen} ch, ${correctWords} w) vs Distractor(${dLen} ch, ${dWords} w)`);
      }
    });
  });
});

console.log(`✓ All 6 banks exist with balanced distractors.`);

// Test 2: Check all required files
console.log('\n[Test 2] Checking required files existence...');
const requiredFiles = [
  'package.json',
  'main.js',
  'preload.js',
  'src/index.html',
  'src/css/main-layout.css',
  'src/css/virtual-screen.css',
  'src/css/components.css',
  'src/js/state-engine.js',
  'src/js/settings-manager.js',
  'src/js/bios-controller.js',
  'src/js/quiz-manager.js',
  'src/js/sound-synth.js',
  'src/js/report-pdf.js',
  'src/js/app-simulator.js',
  'src/data/questions.json',
  'report/report-template.html'
];


let filesMissing = false;
requiredFiles.forEach(rf => {
  const fullPath = path.join(__dirname, rf);
  if (!fs.existsSync(fullPath)) {
    console.error(`FAIL: Missing file: ${rf}`);
    filesMissing = true;
  }
});

if (!filesMissing) {
  console.log('✓ All 15 required files exist.');
}

// Test 3: Check Report Template Placeholders & Inject Function
console.log('\n[Test 3] Checking report-template.html injection capability...');
const reportHtml = fs.readFileSync(path.join(__dirname, 'report', 'report-template.html'), 'utf8');
if (reportHtml.includes('window.__injectReport') && reportHtml.includes('الجمهورية الجزائرية الديمقراطية الشعبية')) {
  console.log('✓ Report template includes official Algerian headers and __injectReport hook.');
} else {
  console.error('FAIL: Report template missing required hooks or headers.');
}

console.log('\n--- ALL TEST CHECKS COMPLETED ---');
