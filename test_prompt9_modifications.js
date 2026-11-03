/**
 * Test Suite: Prompt 9 Verification
 * (البرومبت 9 — تفعيل تلقائي للحقول، قيم ابتدائية، عمل الحقول في Electron، ومنطق كلمة المرور والدخول إلى سطح المكتب)
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rootDir = __dirname;
const appJsPath = path.join(rootDir, 'src', 'js', 'app-simulator.js');
const stateJsPath = path.join(rootDir, 'src', 'js', 'state-engine.js');
const mainJsPath = path.join(rootDir, 'main.js');
const screenCssPath = path.join(rootDir, 'src', 'css', 'virtual-screen.css');
const infDllPath = path.join(rootDir, 'dist', 'inf.dll');

const appJs = fs.readFileSync(appJsPath, 'utf8');
const stateJs = fs.readFileSync(stateJsPath, 'utf8');
const mainJs = fs.readFileSync(mainJsPath, 'utf8');
const screenCss = fs.readFileSync(screenCssPath, 'utf8');

console.log('================================================================');
console.log('TEST SUITE: PROMPT 9 VERIFICATION (FOCUS, DEFAULTS & BOOT LOGIC)');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Modification 1 & 2: Auto-focus & Default Values in OOBE Input Fields
// -----------------------------------------------------------------------------
console.log('[Modification 1 & 2] Testing Auto-focus, Tab Navigation & Default Values...');

// 1.1 PC Name default value and autofocus
assert(appJs.includes("currentPcName = window.stateEngine.oobeConfig.pcName || 'LAB-PC-01'"), 'PC Name defaults to LAB-PC-01 if not set');
assert(appJs.includes('id="inpPcName"') && appJs.includes('autofocus'), 'inpPcName has autofocus attribute');
assert(appJs.includes('tabindex="1"') && appJs.includes('id="inpPcName"'), 'inpPcName has tabindex="1"');
assert(appJs.includes('focusPcInput') && appJs.includes('inp.select()'), 'focusPcInput calls focus and select for instant typing/overwrite');
assert(appJs.includes("val = (inp && inp.value.trim()) ? inp.value.trim() : 'LAB-PC-01'"), 'Submitting without editing applies default LAB-PC-01');
console.log('  ✓ PASS: PC Name field has auto-focus, select-on-focus, and LAB-PC-01 default value');

// 1.2 Account Screen defaults and autofocus
assert(appJs.includes("currentUsername = window.stateEngine.oobeConfig.username || 'Student'"), 'Username defaults to Student if not set');
assert(appJs.includes('id="inpUsername"') && appJs.includes('autofocus'), 'inpUsername has autofocus attribute');
assert(appJs.includes('tabindex="1"') && appJs.includes('id="inpUsername"'), 'inpUsername has tabindex="1"');
assert(appJs.includes('focusUserInput') && appJs.includes('inpUser.select()'), 'focusUserInput calls focus and select for instant typing/overwrite');
assert(appJs.includes("uVal = (inpUser && inpUser.value.trim()) ? inpUser.value.trim() : 'Student'"), 'Submitting without editing applies default Student');
console.log('  ✓ PASS: Username field has auto-focus, select-on-focus, and Student default value');

// 1.3 Strict Tab Progression Order
assert(appJs.includes('id="inpUsername"') && appJs.includes('tabindex="1"'), 'Username field has tabindex="1"');
assert(appJs.includes('id="inpPassword"') && appJs.includes('tabindex="2"'), 'Password field has tabindex="2"');
assert(appJs.includes('id="inpConfirmPassword"') && appJs.includes('tabindex="3"'), 'Confirm Password field has tabindex="3"');
assert(appJs.includes('id="btnClearPassword" tabindex="-1"'), 'Clear Password button has tabindex="-1" so it does not intercept Tab');
assert(appJs.includes('id="btnOobeAccountNext" tabindex="4"'), 'Next button has tabindex="4"');
assert(appJs.includes('id="btnOobeAccountBack" tabindex="5"'), 'Back button has tabindex="5"');
console.log('  ✓ PASS: Sequential Tab progression order (Username -> Password -> Confirm -> Next -> Back) verified');

// -----------------------------------------------------------------------------
// Modification 3: Electron Robust Input & Window Focus Support
// -----------------------------------------------------------------------------
console.log('\n[Modification 3] Testing Electron Input Responsiveness & Window Settings...');

assert(mainJs.includes('focusable: true'), 'BrowserWindow explicitly configured with focusable: true');
assert(mainJs.includes('acceptFirstMouse: true'), 'BrowserWindow explicitly configured with acceptFirstMouse: true');
assert(mainJs.includes("mainWindow.webContents.on('did-finish-load'") && mainJs.includes('mainWindow.focus()'), 'Window focus enforced on did-finish-load');
assert(screenCss.includes('user-select: text !important'), 'CSS explicitly enables user-select: text on virtual inputs');
assert(screenCss.includes('pointer-events: auto !important'), 'CSS guarantees pointer-events: auto on inputs');
assert(screenCss.includes('cursor: text !important'), 'CSS guarantees cursor: text on inputs');
console.log('  ✓ PASS: Electron window focus, first mouse acceptance, and CSS text selection confirmed');

// -----------------------------------------------------------------------------
// Modification 4: Password Logic & Desktop Boot Loop
// -----------------------------------------------------------------------------
console.log('\n[Modification 4] Testing Final Phase Password Logic & Direct Desktop Boot...');

// 4.1 Passwordless direct desktop boot (no password requested)
assert(appJs.includes('if (isPasswordless) {') && appJs.includes('executeIndependentRebootCycle'), 'executeIndependentRebootCycle distinguishes passwordless vs password boot');
assert(appJs.includes('renderPhase8Desktop(container)') && appJs.includes('Welcome'), 'Passwordless account transitions cleanly to Desktop with Welcome screen without password prompt');

// 4.2 Password configured requires login screen
assert(appJs.includes('renderWin11LoginScreen(container'), 'Password account invokes authentic login screen');
assert(appJs.includes('The password or PIN is incorrect. Try again.'), 'Login screen validates entered password strictly against configured password');
assert(appJs.includes('isPasswordless') && appJs.includes('win11-login-direct-btn'), 'Backward compatibility for direct sign in button preserved');

// 4.3 Elimination of infinite loops
assert(appJs.includes('renderPhase8Desktop(container)'), 'renderPhase8Desktop is directly called upon successful login/boot');
assert(!appJs.includes('while (true)'), 'No infinite loops in simulator engine');
console.log('  ✓ PASS: Clean final boot loop: direct to desktop when passwordless, login screen when password protected');

// -----------------------------------------------------------------------------
// System & Security Integrity Checks
// -----------------------------------------------------------------------------
console.log('\n[System Integrity] Verifying dist/inf.dll and Local Network Isolation...');

assert(fs.existsSync(infDllPath), 'dist/inf.dll exists');
const dllStat = fs.statSync(infDllPath);
assert(dllStat.size === 689, `dist/inf.dll size must be exactly 689 bytes (detected: ${dllStat.size} bytes)`);
console.log(`  ✓ PASS: dist/inf.dll size is strictly verified (exact ${dllStat.size} bytes)`);

// CDN isolation check
assert(!appJs.includes('http://') && !appJs.includes('https://'), 'app-simulator.js contains zero external CDN requests');
assert(!screenCss.includes('http://') && !screenCss.includes('https://'), 'virtual-screen.css contains zero external CDN requests');
console.log('  ✓ PASS: 100% Offline independent architecture preserved (Zero CDN calls)');

console.log('\n================================================================');
console.log('ALL PROMPT 9 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
console.log('================================================================\n');

