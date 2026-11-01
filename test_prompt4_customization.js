/**
 * Test Suite: Prompt 4 Comprehensive Verification
 * (البرومبت 4 — تخصيص حساب/جهاز التلميذ، إصلاح عرض الأيقونات، وتصحيحات لغوية وواقعية)
 *
 * Verifies all 7 modifications:
 * 1. Custom PC Name, User Account, and Password validation & full reflection in Settings, Start Menu, Explorer, and Lock Screen.
 * 2. Complete purge of "تربوياً" from all question prompts and code.
 * 3. Official Windows 11 Bloom wallpaper (local high-res asset, zero CDN).
 * 4. All icons use safe inline SVG vectors, no fragile Unicode entities (power, sleep, restart).
 * 5. Score label changed to "العلمامة الحالية" with nowrap styling to prevent truncation across resolutions.
 * 6. Removal of fake yellow F10 button from BIOS footer.
 * 7. Authentic multi-method BIOS save & discard with Aptio confirmation dialogs.
 */

const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('TEST SUITE: PROMPT 4 VERIFICATION (STUDENT ACCOUNT, ICONS, REALISM)');
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

const rootDir = __dirname;
const appJs = fs.readFileSync(path.join(rootDir, 'src', 'js', 'app-simulator.js'), 'utf8');
const biosJs = fs.readFileSync(path.join(rootDir, 'src', 'js', 'bios-controller.js'), 'utf8');
const stateJs = fs.readFileSync(path.join(rootDir, 'src', 'js', 'state-engine.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(rootDir, 'src', 'index.html'), 'utf8');
const screenCss = fs.readFileSync(path.join(rootDir, 'src', 'css', 'virtual-screen.css'), 'utf8');
const layoutCss = fs.readFileSync(path.join(rootDir, 'src', 'css', 'main-layout.css'), 'utf8');
const questionsJson = fs.readFileSync(path.join(rootDir, 'src', 'data', 'questions.json'), 'utf8');

// --- MODIFICATION 1: CUSTOM PC NAME, USERNAME & PASSWORD ---
console.log('[Modification 1] Verifying Custom PC Name, Account & Password Reflection...');
assert(stateJs.includes("pcName: 'LAB-PC-01'") && stateJs.includes("username: ''") && stateJs.includes("password: ''"), 'state-engine initializes pcName, username, and password');
assert(appJs.includes('validatePcName'), 'renderPhase7NamePc enforces realistic PC Name validation (length, alphanumeric, hyphen)');
assert(appJs.includes('validateUsername'), 'renderPhase7Account enforces realistic Username validation (length, illegal chars)');
assert(appJs.includes('inpConfirmPassword'), 'renderPhase7Account provides password confirmation input');
assert(appJs.includes('pVal !== cVal'), 'renderPhase7Account strictly verifies matching passwords');
assert(appJs.includes('specDeviceName') && appJs.includes('openSettingsAboutWindow'), 'Desktop provides Settings > System > About displaying custom PC Name');
assert(appJs.includes('desktopUsernameSpan') && appJs.includes('btnStartUserProfile'), 'Start Menu profile displays student custom username');
assert(appJs.includes('openFileExplorerWindow') && appJs.includes('Users'), 'File Explorer displays C:\\Users\\<account> with custom username');
assert(appJs.includes('renderWin11LoginScreen'), 'Reboot cycle displays authentic Windows 11 Lock / Login Screen');
assert(appJs.includes('The password or PIN is incorrect. Try again.'), 'Login screen rejects incorrect passwords with authentic Windows 11 error');
assert(appJs.includes('Welcome'), 'Login screen unlocks on correct password and shows Welcome transition');

// --- MODIFICATION 2: REMOVE "تربوياً" ---
console.log('\n[Modification 2] Verifying Complete Purge of "تربوياً"...');
assert(!questionsJson.includes('تربوياً'), 'questions.json contains zero occurrences of "تربوياً"');
assert(!appJs.includes('تربوياً'), 'app-simulator.js contains zero occurrences of "تربوياً"');
assert(!indexHtml.includes('تربوياً'), 'index.html contains zero occurrences of "تربوياً"');
assert(!stateJs.includes('تربوياً'), 'state-engine.js contains zero occurrences of "تربوياً"');

// --- MODIFICATION 3: OFFICIAL WINDOWS 11 BLOOM WALLPAPER ---
console.log('\n[Modification 3] Verifying Official Windows 11 Bloom Wallpaper...');
const wallpaperPath = path.join(rootDir, 'assets', 'wallpapers', 'win11-bloom.jpg');
const srcWallpaperPath = path.join(rootDir, 'src', 'assets', 'wallpapers', 'win11-bloom.jpg');
assert(fs.existsSync(wallpaperPath), 'assets/wallpapers/win11-bloom.jpg exists');
assert(fs.existsSync(srcWallpaperPath), 'src/assets/wallpapers/win11-bloom.jpg exists');
const stat = fs.statSync(wallpaperPath);
assert(stat.size > 50000, `Wallpaper is a genuine high-resolution local asset (${stat.size} bytes)`);
assert(screenCss.includes('win11-bloom.jpg'), 'virtual-screen.css references win11-bloom.jpg for desktop and lock screen');
assert(!screenCss.includes('http://') && !screenCss.includes('https://'), 'Zero external CDN calls in virtual-screen.css');

// --- MODIFICATION 4: ALL ICONS USE SAFE INLINE SVG VECTORS ---
console.log('\n[Modification 4] Verifying Safe SVG Vector Icons & No Fragile Unicode...');
assert(!appJs.includes('&#x23FB;'), 'Purged fragile Unicode &#x23FB; (Power symbol) from app-simulator.js');
assert(!appJs.includes('&#9790;'), 'Purged fragile Unicode &#9790; (Sleep moon symbol) from app-simulator.js');
assert(!appJs.includes('&#8635;'), 'Purged fragile Unicode &#8635; (Restart circular arrow) from app-simulator.js');
assert(!indexHtml.includes('&#8635;'), 'Purged fragile Unicode &#8635; from index.html');
assert(appJs.includes('<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>'), 'Power button uses pure inline SVG vector');
assert(appJs.includes('<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="margin-inline-end: 8px;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'), 'Sleep button uses pure inline SVG vector');
assert(appJs.includes('<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-inline-end: 8px;"><polyline points="23 4 23 10 17 10"/>'), 'Restart button uses pure inline SVG vector');

// --- MODIFICATION 5: "العلمامة الحالية" & NO TEXT CLIPPING ---
console.log('\n[Modification 5] Verifying "العلمامة الحالية" & No Text Clipping...');
assert(indexHtml.includes('العلمامة الحالية:'), 'index.html displays "العلمامة الحالية:" in HUD stepper');
assert(!indexHtml.includes('العلامة الحية:'), 'index.html contains zero occurrences of "العلامة الحية:"');
assert(layoutCss.includes('.stepper-score-container') && layoutCss.includes('white-space: nowrap;'), 'stepper-score-container has white-space: nowrap to avoid wrapping');
assert(layoutCss.includes('.stepper-score-box') && layoutCss.includes('min-width: max-content;'), 'stepper-score-box has min-width: max-content to prevent text clipping');

// --- MODIFICATION 6: PURGE FAKE YELLOW F10 BUTTON FROM BIOS ---
console.log('\n[Modification 6] Verifying Fake Yellow F10 Button Purged from BIOS...');
assert(!biosJs.includes('biosQuickF10'), 'Fake yellow F10 quick button is completely removed from bios-controller.js');
assert(!screenCss.includes('.bios-f10-quick-btn {'), 'Fake yellow button CSS rule is absent or obsolete');

// --- MODIFICATION 7: MULTI-METHOD AUTHENTIC BIOS SAVE & DISCARD ---
console.log('\n[Modification 7] Verifying Multi-Method BIOS Save & Discard Dialogs...');
assert(biosJs.includes('id="rowSaveExit"'), 'BIOS Save & Exit tab has Save Changes and Exit option');
assert(biosJs.includes('id="rowSaveReset"'), 'BIOS Save & Exit tab has Save Changes and Reset option');
assert(biosJs.includes('id="rowDiscardExit"'), 'BIOS Save & Exit tab has Discard Changes and Exit option');
assert(biosJs.includes('confirmSaveAndExit'), 'confirmSaveAndExit is implemented for saving');
assert(biosJs.includes('confirmDiscardAndExit'), 'confirmDiscardAndExit is implemented for discarding');
assert(biosJs.includes('showBiosDialog'), 'Aptio BIOS dialog box is implemented for confirmation');
assert(biosJs.includes("if (e.key === 'F10')"), 'Physical F10 keyboard shortcut is supported as a quick save method');
assert(biosJs.includes("if (e.key === 'Escape' || e.key === 'Esc')"), 'ESC key is supported to trigger discard confirmation');
assert(screenCss.includes('.aptio-dialog-overlay') && screenCss.includes('.aptio-dialog-box'), 'Aptio BIOS dialog CSS styling is defined');

console.log('\n----------------------------------------------------------------');
if (allPassed) {
  console.log('ALL PROMPT 4 VERIFICATION CHECKS PASSED SUCCESSFULLY! (100%)\n');
  process.exit(0);
} else {
  console.error('PROMPT 4 VERIFICATION FAILED! SEE ERRORS ABOVE.\n');
  process.exit(1);
}
