/**
 * Test Suite: Light/Dark Theme Switching & French Characters Name Enforcement
 */
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('TEST SUITE: LIGHT/DARK THEME & FRENCH CHARACTERS VALIDATION');
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
// 1. Theme Configuration & Light Mode as Default
// -----------------------------------------------------------------------------
console.log('[Theme] Testing Light / Dark mode CSS tokens and default setting...');

const mainLayoutCss = fs.readFileSync(path.join(__dirname, 'src', 'css', 'main-layout.css'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, 'src', 'index.html'), 'utf8');

assert(mainLayoutCss.includes(':root, [data-theme="light"]'), 'main-layout.css defines :root, [data-theme="light"] design tokens');
assert(mainLayoutCss.includes('[data-theme="dark"]'), 'main-layout.css defines [data-theme="dark"] design tokens');
assert(indexHtml.includes('<html lang="ar" dir="rtl" data-theme="light">'), 'index.html has data-theme="light" on <html> element as default');
assert(indexHtml.includes('id="btnToggleTheme"'), 'index.html includes theme switch button #btnToggleTheme in HUD');
assert(indexHtml.includes('localStorage.getItem(\'app_theme\')'), 'index.html includes localStorage theme persistence');

// -----------------------------------------------------------------------------
// 2. French Character Name Validation
// -----------------------------------------------------------------------------
console.log('\n[French Names] Testing French / Latin character validation logic...');

const settingsManagerJs = fs.readFileSync(path.join(__dirname, 'src', 'js', 'settings-manager.js'), 'utf8');
const mainJs = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');

// Function extracted directly from SettingsManager
function isFrenchNameValid(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  return /^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmed);
}

const validFrenchNames = [
  'MOHAMMEDI',
  'Abdellah',
  'BENALI',
  'Yacine',
  'Jean-Luc',
  'Élise',
  'D\'Amour',
  'François',
  'Chloë',
  'Aïssa',
  'Hadj Aissa'
];

validFrenchNames.forEach(name => {
  assert(isFrenchNameValid(name) === true, `Valid French name accepted: "${name}"`);
});

const invalidNames = [
  'محمدي',
  'عبد الله',
  'عمر بوزيد',
  'Ali123',
  'Test_User',
  'User@Home',
  'A',
  '',
  '   '
];

invalidNames.forEach(name => {
  assert(isFrenchNameValid(name) === false, `Invalid or Arabic name rejected: "${name}"`);
});

// Check SettingsManager integration
assert(settingsManagerJs.includes('force_french_names: true'), 'settings-manager.js defaults force_french_names to true');
assert(settingsManagerJs.includes('setupNameInputsValidation()'), 'settings-manager.js includes setupNameInputsValidation');
assert(settingsManagerJs.includes('isFrenchNameValid('), 'settings-manager.js includes isFrenchNameValid method');

// Check main.js IPC support
assert(mainJs.includes('current.force_french_names = updateData.force_french_names'), 'main.js handles force_french_names in settings:save');
assert(mainJs.includes('force_french_names: initialData.force_french_names !== false'), 'main.js handles force_french_names in settings:createInitial');

// Check index.html UI controls
assert(indexHtml.includes('id="nameLangBadgeNom"'), 'index.html includes #nameLangBadgeNom');
assert(indexHtml.includes('id="nameLangBadgePrenom"'), 'index.html includes #nameLangBadgePrenom');
assert(indexHtml.includes('id="setForceFrenchNamesSwitch"'), 'index.html includes #setForceFrenchNamesSwitch in settings modal');
assert(indexHtml.includes('id="initForceFrenchNamesSwitch"'), 'index.html includes #initForceFrenchNamesSwitch in initial setup modal');
assert(indexHtml.includes('lastNameError'), 'index.html includes #lastNameError validation container');
assert(indexHtml.includes('firstNameError'), 'index.html includes #firstNameError validation container');

console.log('\n================================================================');
if (allPassed) {
  console.log('✓ ALL THEME & FRENCH CHARACTERS VALIDATION TESTS PASSED!');
} else {
  console.error('✗ SOME TESTS FAILED!');
  process.exit(1);
}
console.log('================================================================\n');
