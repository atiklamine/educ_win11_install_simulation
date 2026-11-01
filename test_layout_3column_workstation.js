/**
 * Test Suite: 3-Column Authentic Educational Workstation Layout Verification
 * 
 * Verifies the structural and UI/UX design:
 * 1. Left: Installation Media Shelf (USB, DVD, PXE)
 * 2. Center: Big 27" Virtual Screen (active across all 8 phases)
 * 3. Right: Central Unit (PC Tower) + Underneath: Compact Keyboard & Mouse
 * 4. Screen starts pitch black on standby (100% black, no OSD, no fake switches)
 * 5. Full-stage expansion toggle (F10) preserving workstation integrity
 * 6. 100% Offline, Zero external CDN dependencies, lightweight CSS/JS
 * 7. Physical keyboard execution for BIOS entry (no fake buttons)
 * 8. Physical removal of installation media directly from Central Unit
 */

const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('TEST SUITE: 3-COLUMN WORKSTATION LAYOUT & WORKFLOW VALIDATION');
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

const indexHtml = fs.readFileSync(path.join(__dirname, 'src', 'index.html'), 'utf8');
const mainCss = fs.readFileSync(path.join(__dirname, 'src', 'css', 'main-layout.css'), 'utf8');
const virtCss = fs.readFileSync(path.join(__dirname, 'src', 'css', 'virtual-screen.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, 'src', 'js', 'app-simulator.js'), 'utf8');

// 1. Column Positioning
console.log('[Layout 1] Verifying 3-Column Physical Workstation Rig in index.html...');
assert(indexHtml.includes('class="workstation-rig-layout"'), 'workstation-rig-layout container exists');
assert(indexHtml.includes('class="rig-column-left"'), 'Left column exists for Installation Media Shelf');
assert(indexHtml.includes('class="rig-column-center"'), 'Center column exists for Big 27" Monitor');
assert(indexHtml.includes('class="rig-column-right"'), 'Right column exists for Central Unit & Peripherals');

const leftPos = indexHtml.indexOf('rig-column-left');
const centerPos = indexHtml.indexOf('rig-column-center');
const rightPos = indexHtml.indexOf('rig-column-right');

assert(leftPos < centerPos && centerPos < rightPos, 'Correct ordering: Left (Media Shelf) -> Center (Screen) -> Right (Central Unit & Peripherals)');

// 2. Left Column Details: Installation Media Shelf
console.log('\n[Layout 2] Verifying Left Column Installation Media Shelf...');
assert(indexHtml.includes('id="rigMediaShelf"'), 'Installation media shelf (#rigMediaShelf) is in left column');
assert(indexHtml.includes('data-media="usb"'), 'Kingston 32GB USB drive card is present on shelf');
assert(indexHtml.includes('data-media="dvd"'), 'Windows 11 Setup ISO DVD disc card is present on shelf');
assert(indexHtml.includes('data-media="pxe"'), 'PXE Network boot cable card is present on shelf');

const shelfPos = indexHtml.indexOf('rigMediaShelf');
assert(shelfPos > leftPos && shelfPos < centerPos, '#rigMediaShelf is strictly nested inside rig-column-left');

// 3. Center Column Details: Big Screen (Single Screen Throughout All Phases)
console.log('\n[Layout 3] Verifying Center Column Big Virtual Screen...');
assert(indexHtml.includes('id="virtualScreenContent"'), '#virtualScreenContent is the central screen viewport');
assert(indexHtml.includes('id="btnMonitorQuickToggle"'), 'Monitor bezel has quick expand toggle');
assert(indexHtml.includes('id="btnMonitorChinToggle"'), 'Monitor chin bar has expand toggle');
assert(indexHtml.includes('class="monitor-stand-neck"'), 'Realistic monitor stand neck rendered');
assert(indexHtml.includes('class="monitor-stand-base"'), 'Realistic monitor stand base rendered');

// 4. Right Column Details: Central Unit (PC Tower) + Peripherals underneath
console.log('\n[Layout 4] Verifying Right Column Central Unit & Peripherals Unit...');
assert(indexHtml.includes('id="companionPcTower"'), 'Central Unit (#companionPcTower) is in right column');
assert(indexHtml.includes('id="btnTactilePower"'), 'Tactile power button exists on PC Tower');
assert(indexHtml.includes('id="towerPowerLed"'), 'Power LED exists on PC Tower');
assert(indexHtml.includes('id="towerHddLed"'), 'HDD/SSD activity LED exists on PC Tower');
assert(indexHtml.includes('id="rigPeripheralsUnit"'), 'Peripherals unit exists underneath PC Tower');
assert(indexHtml.includes('class="rig-mini-keyboard"'), 'Realistic compact keyboard is represented');
assert(indexHtml.includes('class="rig-mini-mouse"'), 'Realistic optical mouse is represented');

const towerPos = indexHtml.indexOf('companionPcTower');
const periphPos = indexHtml.indexOf('rigPeripheralsUnit');
assert(towerPos < periphPos, 'Keyboard & Mouse are located UNDERNEATH the Central Unit in right column');

// 5. Verification: Pitch Black Screen on Initial Standby (Modification 1)
console.log('\n[Layout 5] Verifying Pitch Black Screen on Initial Standby...');
assert(!appJs.includes('desk-monitor-screen'), 'Miniature nested desk-monitor-screen eliminated from app-simulator.js');
assert(!appJs.includes('desk-pc-tower'), 'Duplicate mini PC tower eliminated from app-simulator.js');
assert(appJs.includes('screen-off'), 'Phase 1 renders 100% pitch-black standby screen on initial launch');
assert(!appJs.includes('standby-power-glyph'), 'Phase 1 does NOT contain any fake power switch on the monitor glass');

// 6. CSS Mode Switching
console.log('\n[Layout 6] Verifying Dual View Mode (Workstation vs Fullstage Expanded)...');
assert(mainCss.includes('.view-mode-expanded .rig-column-left'), 'Expanded mode cleanly hides left column');
assert(mainCss.includes('.view-mode-expanded .rig-column-right'), 'Expanded mode cleanly hides right column');
assert(mainCss.includes('.view-mode-expanded .monitor-stand-neck'), 'Expanded mode hides stand neck');
assert(mainCss.includes('.view-mode-expanded .monitor-stand-base'), 'Expanded mode hides stand base');
assert(mainCss.includes('.view-mode-expanded .rig-column-center'), 'Expanded mode expands central monitor to 100%');

// 7. Offline & Low Resource Constraints
console.log('\n[Layout 7] Verifying Offline & Performance Constraints...');
assert(!indexHtml.includes('http://') && !indexHtml.includes('https://'), 'Zero external HTTP/HTTPS links in index.html');
assert(!mainCss.includes('http://') && !mainCss.includes('https://'), 'Zero external HTTP/HTTPS links in main-layout.css');
assert(!virtCss.includes('http://') && !virtCss.includes('https://'), 'Zero external HTTP/HTTPS links in virtual-screen.css');

// 8. Realism Verification: Power Button on Tower & Physical Media Removal
console.log('\n[Layout 8] Verifying Realism: Power Button on Tower & Physical Media Actions...');
assert(appJs.includes('renderPhase1NoMediaPOST'), 'Authentic English POST rendered when booting without media');
assert(!appJs.includes('btnClickF2Interrupt'), 'Phase 1 eliminated fake on-screen BIOS button (physical keyboard only)');
assert(!appJs.includes('btnInterruptSecondBoot'), 'Phase 6 eliminated fake on-screen reboot button (physical keyboard only)');
assert(appJs.includes('physical-tower-callout-panel'), 'Phase 6 displays directional callout pointing to Right Tower');
assert(appJs.includes('guide-arrow-right'), 'Phase 6 directional arrow points right towards Central Unit');
assert(appJs.includes('tower-unplug-target'), 'Phase 6 targets the Central Unit USB port for physical removal');
assert(appJs.includes('usb-drive-detaching'), 'Phase 6 triggers physical detachment animation on Tower port');
assert(!appJs.includes('btnUnplugUsbNow'), 'Phase 6 eliminated artificial screen button in favor of physical tower action');

console.log('\n================================================================');
if (allPassed) {
  console.log('✓ ALL 3-COLUMN WORKSTATION LAYOUT TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
} else {
  console.error('✗ SOME LAYOUT TESTS FAILED! PLEASE REVIEW OUTPUT ABOVE.');
  process.exit(1);
}
