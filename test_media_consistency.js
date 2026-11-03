const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('TEST SUITE: INSTALLATION MEDIA CONSISTENCY (USB, DVD, PXE)');
console.log('================================================================\n');

// 1. Check questions.json
console.log('[Check 1] Verifying quiz questions neutrality across media...');
const questionsJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'data', 'questions.json'), 'utf8'));
const q = questionsJson.bank_second_boot.find(item => item.id === 'sboot_q01');
assert(q, 'sboot_q01 must exist');
assert(q.prompt.includes('فصل وسيط التثبيت'), 'Prompt must use neutral "فصل وسيط التثبيت"');
assert(!q.prompt.includes('ونزع الفلاشة'), 'Prompt must NOT hardcode "ونزع الفلاشة"');
assert(q.rationale.includes('وسيط التثبيت'), 'Rationale must use neutral "وسيط التثبيت"');
console.log('  ✓ PASS: Question bank sboot_q01 is fully neutral across USB, DVD, and PXE');

// 2. Check quiz-manager.js bundled bank
console.log('[Check 2] Verifying quiz-manager.js bundled question bank...');
const quizManagerJs = fs.readFileSync(path.join(__dirname, 'src', 'js', 'quiz-manager.js'), 'utf8');
assert(quizManagerJs.includes('فصل وسيط التثبيت'), 'quiz-manager.js must use "فصل وسيط التثبيت"');
assert(!quizManagerJs.includes('ونزع الفلاشة بعد نسخ الملفات'), 'quiz-manager.js must NOT hardcode "ونزع الفلاشة بعد نسخ الملفات"');
console.log('  ✓ PASS: Bundled fallback quiz questions in quiz-manager.js are updated and neutral');

// 3. Check state-engine.js dynamic hints & media state
console.log('[Check 3] Verifying state-engine.js installationMedia and dynamic getPhaseHint()...');
const stateEngineJs = fs.readFileSync(path.join(__dirname, 'src', 'js', 'state-engine.js'), 'utf8');
assert(stateEngineJs.includes("this.installationMedia = 'usb'"), 'state-engine.js defines installationMedia');
assert(stateEngineJs.includes('mediaUnplugged: false'), 'state-engine.js defines mediaUnplugged in secondBootConfig');
assert(stateEngineJs.includes('getPhaseHint(phase)'), 'state-engine.js implements getPhaseHint(phase)');

global.window = {};
eval(stateEngineJs);
const engine = window.stateEngine;

// Test USB
engine.installationMedia = 'usb';
const usbHint1 = engine.getPhaseHint(1);
const usbHint5 = engine.getPhaseHint(5);
const usbHint6 = engine.getPhaseHint(6);
assert(usbHint1.includes('فلاش ديسك USB أو قرص DVD أو كابل PXE'), 'Phase 1 hint lists all available media');
assert(usbHint5.includes('الفلاش ديسك (Drive 1)'), 'USB Phase 5 hint must mention avoiding Drive 1 flash disk');
assert(usbHint6.includes('فلاش ديسك USB') && usbHint6.includes('نزع مفتاح USB من المنفذ الأمامي'), 'USB Phase 6 hint must mention USB removal');

// Test DVD
engine.installationMedia = 'dvd';
const dvdHint1 = engine.getPhaseHint(1);
const dvdHint5 = engine.getPhaseHint(5);
const dvdHint6 = engine.getPhaseHint(6);
assert(dvdHint5.includes('Drive 0') && !dvdHint5.includes('Drive 1'), 'DVD Phase 5 hint must focus on Drive 0 SSD and NOT mention Drive 1');
assert(dvdHint6.includes('قرص DVD') && dvdHint6.includes('إخراج قرص DVD من قارئ الأقراص'), 'DVD Phase 6 hint must mention DVD ejection');

// Test PXE
engine.installationMedia = 'pxe';
const pxeHint1 = engine.getPhaseHint(1);
const pxeHint5 = engine.getPhaseHint(5);
const pxeHint6 = engine.getPhaseHint(6);
assert(pxeHint5.includes('Drive 0') && !pxeHint5.includes('Drive 1'), 'PXE Phase 5 hint must focus on Drive 0 SSD and NOT mention Drive 1');
assert(pxeHint6.includes('كابل الشبكة PXE') && pxeHint6.includes('فصل كابل الشبكة من منفذ LAN'), 'PXE Phase 6 hint must mention disconnecting LAN cable');
console.log('  ✓ PASS: StateEngine getPhaseHint() dynamically adapts across USB, DVD, and PXE');

// 4. Check app-simulator.js implementations
console.log('[Check 4] Verifying app-simulator.js media handling and unplug UI...');
const appSimJs = fs.readFileSync(path.join(__dirname, 'src', 'js', 'app-simulator.js'), 'utf8');

// Phase 1 POST screen includes PXE and DVD
assert(appSimJs.includes("curMedia === 'pxe' ? 'LAN: Realtek PCIe GBE Family Controller (PXE Boot ROM v2.68)'"), 'app-simulator.js POST screen lists PXE ROM');
assert(appSimJs.includes("curMedia === 'dvd' ? 'SATA 1: ATAPI iHAS124 DVD-RW Drive (Win11 Setup ISO)'"), 'app-simulator.js POST screen lists DVD Drive');

// Phase 5 Drive 1 only when USB was actually chosen
assert(appSimJs.includes('const isUsbChosen = curInstallMedia === \'usb\''), 'Phase 5 checks if USB was the actual chosen installation media');
assert(appSimJs.includes('const hasUsbMedia = isUsbChosen && !window.stateEngine.secondBootConfig.usbUnplugged'), 'Drive 1 is only displayed when USB was chosen');

// Phase 6 renderPhase6UnplugMedia supports USB, DVD, PXE
assert(appSimJs.includes('function renderPhase6UnplugMedia(container)'), 'renderPhase6UnplugMedia is implemented');
assert(appSimJs.includes('function renderPhase6UnplugUsb(container)'), 'renderPhase6UnplugUsb exists as backward-compatible wrapper');
assert(appSimJs.includes('towerDvdDiscBadge'), 'renderPhase6UnplugMedia handles DVD drive badge');
assert(appSimJs.includes('dvd-eject-btn'), 'renderPhase6UnplugMedia handles DVD eject button');
assert(appSimJs.includes('towerPluggedLan'), 'renderPhase6UnplugMedia handles LAN cable disconnect');
console.log('  ✓ PASS: app-simulator.js Phase 1, Phase 5, and Phase 6 are 100% harmonious across media');

// 5. Check index.html stepper & guide card 6
console.log('[Check 5] Verifying index.html stepper and Comprehensive Guide texts...');
const indexHtml = fs.readFileSync(path.join(__dirname, 'src', 'index.html'), 'utf8');
assert(indexHtml.includes('التثبيت وفصل الوسيط'), 'Phase 6 stepper label uses neutral "التثبيت وفصل الوسيط"');
assert(indexHtml.includes('مفتاح USB أو قرص DVD أو كابل PXE'), 'Comprehensive Guide card 6 mentions all three media');
console.log('  ✓ PASS: index.html Stepper and Comprehensive Guide are fully aligned');

console.log('\n================================================================');
console.log('ALL MEDIA CONSISTENCY TESTS PASSED SUCCESSFULLY! (100%)');
console.log('================================================================\n');
process.exit(0);
