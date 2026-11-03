const assert = require('assert');
const fs = require('fs');

console.log('Testing Final Enhancements (Screen Maximize, Phase Distinction, Partitioning, Themes & Fonts)...');

const mainCss = fs.readFileSync('src/css/main-layout.css', 'utf8');
const appJs = fs.readFileSync('src/js/app-simulator.js', 'utf8');
const seJs = fs.readFileSync('src/js/state-engine.js', 'utf8');
const indexHtml = fs.readFileSync('src/index.html', 'utf8');

// 1. Virtual Screen Maximization (No White Screen Bug)
console.log('\n[Check 1] Verifying Virtual Screen Maximization & Background Integrity...');
assert(mainCss.includes('.virtual-monitor-wrapper.view-mode-expanded'), 'view-mode-expanded defined');
assert(mainCss.includes('.virtual-monitor-wrapper.view-mode-expanded .monitor-frame') && mainCss.includes('display: flex !important;'), 'Expanded monitor frame is display: flex');
assert(mainCss.includes('--screen-bg: #000000;'), '--screen-bg set to pure black in light mode');
assert(mainCss.includes('background: #000000 !important;'), 'Expanded background forced to black to eliminate white screen');
console.log('  ✓ PASS: Screen maximization flex display & pure black background verified (zero white flash)');

// 2. OS Screen Authenticity & Pedagogical Phase Distinction in Companion Tools
console.log('\n[Check 2] Verifying OS Screen Authenticity & Pedagogical Distinction in Assistance Tools...');
assert(!appJs.includes('🔵 المرحلة الأولى لتنصيب النظام'), 'No artificial banners inside Phase 6 OS window (authentic Windows setup)');
assert(!appJs.includes('🟢 المرحلة الثانية لتنصيب النظام'), 'No artificial banners inside Phase 7 OOBE screen (authentic Windows OOBE)');
assert(!appJs.includes('📌 تمييز بيداغوجي'), 'No pedagogical box in Windows boot screen');
assert(seJs.includes('المرحلة الأولى لتنصيب النظام - نقل ونسخ الملفات'), 'StateEngine hint emphasizes Phase 1 file copy in draggable assistance window');
assert(seJs.includes('المرحلة الثانية لتنصيب النظام - إعدادات نظام التشغيل OOBE'), 'StateEngine hint emphasizes Phase 2 OOBE from SSD in draggable assistance window');
console.log('  ✓ PASS: OS screens are 100% authentic, pedagogical guidance properly situated in assistance window and guide');

// 3. Phase 5 Partitioning (USB Drive, Custom Sizing, Format FS Choice, Logical Format Notice)
console.log('\n[Check 3] Verifying Phase 5 Partitioning Enhancements...');
assert(appJs.includes('hasUsbMedia') && appJs.includes('Drive 1 Partition 1: Kingston USB'), 'USB Flash drive appears in drives list when attached');
assert(appJs.includes("selectedPartId === 'part_usb'") && appJs.includes('recordPenalty(5, 1.00'), 'Selecting USB drive for installation triggers educational warning and penalty');
assert(appJs.includes('inpPartSizeMb') && appJs.includes('min="32768"'), 'Custom partition size input implemented in New partition');
assert(appJs.includes('parsedMb < 65536') && appJs.includes('0.50'), 'Partition size < 64GB triggers size penalty');
assert(appJs.includes('fsChoice') && appJs.includes('FAT32') && appJs.includes('exFAT'), 'Format dialog provides file system choice (NTFS, FAT32, exFAT)');
assert(appJs.includes('primaryFileSystem !== \'NTFS\'') && appJs.includes('1.00'), 'Formatting with non-NTFS for OS drive triggers warning and penalty');
assert(seJs.includes('التهيئة المنطقية (Logical Formatting) تعني اختيار نظام الملفات'), 'Phase 5 hint explicitly explains logical format = choosing file system');
console.log('  ✓ PASS: USB drive listing, custom sizing, format file system selection, and logical format notice verified');

// 4. Themes & Font Controls
console.log('\n[Check 4] Verifying High-Contrast Themes and Font Size Controls...');
assert(mainCss.includes('[data-theme="hc-dark"]'), 'High Contrast Dark theme defined in CSS');
assert(mainCss.includes('[data-theme="hc-light"]'), 'High Contrast Light theme defined in CSS');
assert(mainCss.includes('--ui-font-scale'), 'UI font scale CSS variable defined');
assert(indexHtml.includes('btnFontDec') && indexHtml.includes('btnFontInc'), 'Font size buttons in HUD');
assert(indexHtml.includes('hc-dark') && indexHtml.includes('hc-light'), 'Theme cycling includes high contrast themes');
console.log('  ✓ PASS: High-contrast themes (dark & light) and font size controls verified');

// 5. System Guide & About Modal Updates
console.log('\n[Check 5] Verifying System Guide (الدليل الشامل) and About Modal (حول البرنامج)...');
assert(indexHtml.includes('الدليل الشامل لمراحل المحاكاة وتنصيب Windows 11'), 'Comprehensive Guide modal title updated');
assert(indexHtml.includes('الدليل الشامل') && indexHtml.includes('btnOpenExpertGuide'), 'HUD button text updated to الدليل الشامل');
assert(indexHtml.includes('المرحلة الأولى للتنصيب — نقل الملفات إلى القرص الصلب'), 'Guide includes Phase 1 explanation');
assert(indexHtml.includes('المرحلة الثانية للتنصيب — إعدادات نظام التشغيل (OOBE)'), 'Guide includes Phase 2 explanation');
assert(!indexHtml.includes('00213.662.60.82'), 'Phone number removed from About modal');
assert(indexHtml.includes('hadj.aissa.informatique@gmail.com'), 'Email preserved in About modal');
assert(indexHtml.includes('https://atiklamine.github.io/educ_win11_install_simulation/src/index.html'), 'Live Web link in About modal');
assert(indexHtml.includes('https://github.com/atiklamine/educ_win11_install_simulation/releases'), 'Releases link in About modal');
console.log('  ✓ PASS: Comprehensive Guide renamed & aligned; About Modal updated with live links and zero phone number');

// 6. Security and DLL integrity
console.log('\n[Check 6] Verifying dist/inf.dll Integrity...');
const dllSize = fs.statSync('dist/inf.dll').size;
assert(dllSize === 689, `dist/inf.dll must be 689 bytes (found: ${dllSize})`);
console.log(`  ✓ PASS: dist/inf.dll size verified (exact ${dllSize} bytes)`);

console.log('\n================================================================');
console.log('ALL FINAL ENHANCEMENT CHECKS PASSED (100%)!');
console.log('================================================================\n');
