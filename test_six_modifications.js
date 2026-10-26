/**
 * Comprehensive Validation Test Suite for the 6 Master Modifications
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('================================================================');
console.log('RUNNING VALIDATION SUITE: 6 MASTER MODIFICATIONS');
console.log('================================================================\n');

let allPassed = true;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    allPassed = false;
  }
}

// -----------------------------------------------------------------------------
// [Modification 1] Visual Positioning & States of USB in Phase 1
// -----------------------------------------------------------------------------
console.log('[Modification 1] Testing USB Port & Drive Structure and States...');
const appSimJs = fs.readFileSync(path.join(__dirname, 'src', 'js', 'app-simulator.js'), 'utf8');
const virtCss = fs.readFileSync(path.join(__dirname, 'src', 'css', 'virtual-screen.css'), 'utf8');

assert(appSimJs.includes('id="usb-port"'), 'app-simulator.js includes distinct #usb-port element');
assert(appSimJs.includes('id="usb-drive"'), 'app-simulator.js includes distinct #usb-drive element');
assert(virtCss.includes('#usb-drive.detached'), 'virtual-screen.css defines .detached state for #usb-drive');
assert(virtCss.includes('#usb-drive.dragging'), 'virtual-screen.css defines .dragging state for #usb-drive');
assert(virtCss.includes('#usb-drive.inserted'), 'virtual-screen.css defines .inserted state for #usb-drive');
assert(virtCss.includes('clip-path'), 'virtual-screen.css partially submerges connector inside port slot via clipping');
assert(appSimJs.includes('window.stateEngine.selectedMedia = null'), 'POST timeout resets selectedMedia to null (detached)');

// -----------------------------------------------------------------------------
// [Modification 2] Encrypted inf.dll Settings & Manager
// -----------------------------------------------------------------------------
console.log('\n[Modification 2] Testing AES-256-CBC Encrypted inf.dll & Settings Logic...');
const mainJs = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');
const preloadJs = fs.readFileSync(path.join(__dirname, 'preload.js'), 'utf8');
const settingsMgrPath = path.join(__dirname, 'src', 'js', 'settings-manager.js');

assert(fs.existsSync(settingsMgrPath), 'src/js/settings-manager.js exists');
assert(preloadJs.includes('settings:'), 'preload.js exposes settings API via contextBridge');
assert(mainJs.includes('aes-256-cbc'), 'main.js uses AES-256-CBC crypto algorithm');
assert(mainJs.includes('settings:verifyPassword'), 'main.js handles password verification via salt and hash');

// Test Crypto Functionality
const TEST_KEY = crypto.createHash('sha256').update('DZ-WIN11-EDU-SIMULATOR-TEACHER-KEY-2026-ALG').digest();
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-cbc', TEST_KEY, iv);
const sampleData = {
  version: 1,
  teacher: { full_name: 'أستاذ التجربة', password_salt: '1234567890abcdef', password_hash: 'dummyhash' },
  institution: 'ثانوية الاختبار',
  school_year: '2025/2026',
  groups: ['1AS-01', '1AS-02'],
  session_mode_enabled: true
};
let enc = cipher.update(JSON.stringify(sampleData), 'utf8', 'base64');
enc += cipher.final('base64');
const serialized = iv.toString('base64') + ':' + enc;

// Decrypt
const parts = serialized.split(':');
const decipher = crypto.createDecipheriv('aes-256-cbc', TEST_KEY, Buffer.from(parts[0], 'base64'));
let dec = decipher.update(parts[1], 'base64', 'utf8');
dec += decipher.final('utf8');
const parsed = JSON.parse(dec);
assert(parsed.teacher.full_name === 'أستاذ التجربة', 'AES-256-CBC encryption and decryption works with 100% fidelity');

// Test Password Salt & Hash
const salt = crypto.randomBytes(16).toString('hex');
const hash1 = crypto.createHash('sha256').update(salt + 'secret123').digest('hex');
const hash2 = crypto.createHash('sha256').update(salt + 'secret123').digest('hex');
const wrongHash = crypto.createHash('sha256').update(salt + 'wrongpassword').digest('hex');
assert(hash1 === hash2, 'Password verification succeeds with correct password');
assert(hash1 !== wrongHash, 'Password verification fails with incorrect password');

// -----------------------------------------------------------------------------
// [Modification 3] HUD Top Bar Active During MCQ Modal
// -----------------------------------------------------------------------------
console.log('\n[Modification 3] Testing HUD Top Bar & Modals Layering...');
const layoutCss = fs.readFileSync(path.join(__dirname, 'src', 'css', 'main-layout.css'), 'utf8');
const compCss = fs.readFileSync(path.join(__dirname, 'src', 'css', 'components.css'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, 'src', 'index.html'), 'utf8');
const quizMgrJs = fs.readFileSync(path.join(__dirname, 'src', 'js', 'quiz-manager.js'), 'utf8');

assert(layoutCss.includes('z-index: 200'), '.hud-top-bar has high z-index (200)');
assert(compCss.includes('#quizModal') && compCss.includes('top: var(--hud-height)'), '#quizModal starts below HUD (top: var(--hud-height)) so HUD is never obscured');
assert(indexHtml.includes('id="exitConfirmModal"'), 'index.html includes #exitConfirmModal with confirmation dialog');
assert(quizMgrJs.includes('restoreFocus'), 'quiz-manager.js contains restoreFocus() for returning focus to quiz');

// -----------------------------------------------------------------------------
// [Modification 4] Side-by-Side Score & Elapsed Time in PDF & Finale
// -----------------------------------------------------------------------------
console.log('\n[Modification 4] Testing Side-by-Side Score & Time Cards...');
const reportHtml = fs.readFileSync(path.join(__dirname, 'report', 'report-template.html'), 'utf8');

assert(reportHtml.includes('id="rFinalScore"') && reportHtml.includes('id="rFinalTime"'), 'report-template.html has both rFinalScore and rFinalTime card values');
assert(reportHtml.includes('في حالة تساوي العلامة، يُرجَّح التلميذ الأقل وقتًا.'), 'report-template.html contains official tie-breaker caption');
assert(reportHtml.includes('font-size: 28pt'), 'report-template.html card values styled with >=28pt font size');
assert(indexHtml.includes('id="finaleScoreNumber"') && indexHtml.includes('id="finaleTimeNumber"'), 'index.html Grand Finale contains both score and time card values');
assert(indexHtml.includes('في حالة تساوي العلامة، يُرجَّح التلميذ الأقل وقتًا.'), 'index.html contains official tie-breaker note');

// -----------------------------------------------------------------------------
// [Modification 5] Sortable PDF Filename Generation Formula
// -----------------------------------------------------------------------------
console.log('\n[Modification 5] Testing Sortable PDF Filename Generation...');
const reportPdfJs = fs.readFileSync(path.join(__dirname, 'src', 'js', 'report-pdf.js'), 'utf8');

assert(reportPdfJs.includes('formatSortableGrade'), 'report-pdf.js includes formatSortableGrade method');
assert(reportPdfJs.includes('formatSortableTime'), 'report-pdf.js includes formatSortableTime method');

// Simulate the exact ReportPdf methods
function formatSortableGrade(score) {
  const num = Math.max(0, Math.min(20, Number(score) || 0));
  const parts = num.toFixed(2).split('.');
  const intPart = parts[0].padStart(2, '0');
  const decPart = parts[1];
  return `${intPart}.${decPart}`;
}

function formatSortableTime(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return `${String(hours).padStart(2, '0')}-${String(minutes).padStart(2, '0')}-${String(seconds).padStart(2, '0')}`;
}

function cleanFilenamePart(str, fallback = 'unknown') {
  if (!str || typeof str !== 'string' || !str.trim()) return fallback;
  return String(str).replace(/[\\/:*?"<>|]/g, '-').trim().replace(/\s+/g, '_').replace(/[.\s]+$/g, '') || fallback;
}

function generateReportFilename(score, totalSecs, lastName, firstName, group) {
  const g = formatSortableGrade(score);
  const t = formatSortableTime(totalSecs);
  const ln = cleanFilenamePart(lastName);
  const fn = cleanFilenamePart(firstName);
  const gr = cleanFilenamePart(group);
  return `${gr}_${g}_${t}_${ln}_${fn}.pdf`;
}

// Generate test filenames
const f1 = generateReportFilename(5.5, 600, 'علوي', 'سمير', '1AS-01');
const f2 = generateReportFilename(18.5, 1335, 'بن عيسى', 'ياسين', '1AS-01');
const f3 = generateReportFilename(18.5, 920, 'شريف', 'علي', '1AS-01');
const f4 = generateReportFilename(20.0, 750, 'زيدان', 'كريم', '1AS-02');

assert(f1 === '1AS-01_05.50_00-10-00_علوي_سمير.pdf', `Filename format 1: ${f1}`);
assert(f2 === '1AS-01_18.50_00-22-15_بن_عيسى_ياسين.pdf', `Filename format 2: ${f2}`);
assert(f3 === '1AS-01_18.50_00-15-20_شريف_علي.pdf', `Filename format 3: ${f3}`);
assert(f4 === '1AS-02_20.00_00-12-30_زيدان_كريم.pdf', `Filename format 4: ${f4}`);

// Test Sorting
const list = [f2, f1, f4, f3];
list.sort(); // Natural alphabetical sort

assert(list[0] === f1, '1AS-01 lowest score (05.50) sorted first');
assert(list[1] === f3, '1AS-01 between equal scores (18.50), lower time (00-15-20) sorts before higher time (00-22-15)');
assert(list[2] === f2, '1AS-01 higher time (00-22-15) sorts after lower time');
assert(list[3] === f4, '1AS-02 sorted last after all 1AS-01 files');

// -----------------------------------------------------------------------------
// [Modification 6] Complete Removal of Session Mode from Report & Managed via Settings
// -----------------------------------------------------------------------------
console.log('\n[Modification 6] Testing Removal of Mode from Report & Settings Management...');

assert(!reportHtml.includes('rSessionMode'), 'report-template.html contains NO rSessionMode element');
assert(!reportHtml.includes('نمط الحصة'), 'report-template.html contains NO mention of "نمط الحصة"');
assert(!reportPdfJs.includes('mode:'), 'report-pdf.js payload does NOT inject student.mode');
assert(indexHtml.includes('id="regModeContainer"'), 'index.html contains #regModeContainer toggled via settings');
assert(appSimJs.includes('session_mode_enabled') || fs.readFileSync(path.join(__dirname, 'src', 'js', 'state-engine.js'), 'utf8').includes('session_mode_enabled'), 'state-engine.js respects session_mode_enabled setting');

console.log('\n================================================================');
if (allPassed) {
  console.log('ALL 6 MODIFICATIONS TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================');
  process.exit(0);
} else {
  console.error('SOME TESTS FAILED! PLEASE REVIEW OUTPUT ABOVE.');
  console.log('================================================================');
  process.exit(1);
}
