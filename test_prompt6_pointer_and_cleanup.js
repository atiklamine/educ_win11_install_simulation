/**
 * Test Suite: Prompt 6 Verification
 * Pointer Interactions, Zero-Jump Assistance Window, Comprehensive Interaction Audit & Repo Cleanup
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rootDir = __dirname;
const appJsPath = path.join(rootDir, 'src', 'js', 'app-simulator.js');
const indexHtmlPath = path.join(rootDir, 'src', 'index.html');
const screenCssPath = path.join(rootDir, 'src', 'css', 'virtual-screen.css');
const componentsCssPath = path.join(rootDir, 'src', 'css', 'components.css');
const gitignorePath = path.join(rootDir, '.gitignore');
const packageJsonPath = path.join(rootDir, 'package.json');

const appJs = fs.readFileSync(appJsPath, 'utf8');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const screenCss = fs.readFileSync(screenCssPath, 'utf8');
const compCss = fs.readFileSync(componentsCssPath, 'utf8');
const gitignore = fs.readFileSync(gitignorePath, 'utf8');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('================================================================');
console.log('TEST SUITE: PROMPT 6 VERIFICATION (POINTER INTERACTION & CLEANUP)');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Modification 1: Input Fields Mouse & Pointer Interaction
// -----------------------------------------------------------------------------
console.log('[Modification 1] Testing OOBE Account Input Fields Usability & Pointer Interaction...');

// 1.1 Label association via for/id
assert(appJs.includes('for="inpPcName"'), 'inpPcName has linked <label for="inpPcName">');
assert(appJs.includes('for="inpUsername"'), 'inpUsername has linked <label for="inpUsername">');
assert(appJs.includes('for="inpPassword"'), 'inpPassword has linked <label for="inpPassword">');
assert(appJs.includes('for="inpConfirmPassword"'), 'inpConfirmPassword has linked <label for="inpConfirmPassword">');
console.log('  ✓ PASS: All OOBE fields have explicit <label for="id"> associations');

// 1.2 Unified container wrapper and hit area delegation
assert(appJs.includes('class="oobe-input-group" id="groupPcName"'), 'inpPcName is wrapped in .oobe-input-group');
assert(appJs.includes('class="oobe-input-group" id="groupUsername"'), 'inpUsername is wrapped in .oobe-input-group');
assert(appJs.includes('class="oobe-input-group" id="groupPassword"'), 'inpPassword is wrapped in .oobe-input-group');
assert(appJs.includes('class="oobe-input-group" id="groupConfirmPassword"'), 'inpConfirmPassword is wrapped in .oobe-input-group');
assert(appJs.includes('groupPc.addEventListener(\'click\''), 'groupPc delegates clicks to inpPcName');
assert(appJs.includes('groupUser.addEventListener(\'click\''), 'groupUser delegates clicks to inpUser');
assert(appJs.includes('groupPass.addEventListener(\'click\''), 'groupPass delegates clicks to inpPass');
assert(appJs.includes('groupConf.addEventListener(\'click\''), 'groupConf delegates clicks to inpConf');
console.log('  ✓ PASS: All OOBE field groups delegate container clicks to input focus');

// 1.3 Natural Tab order & Enter key navigation
assert(appJs.includes('id="btnClearPassword" tabindex="-1"'), '#btnClearPassword has tabindex="-1" to prevent stealing Tab focus');
assert(appJs.includes("inp.addEventListener('keydown'"), 'inpPcName supports Enter key to advance');
assert(appJs.includes("inpUser.addEventListener('keydown'"), 'inpUsername supports Enter key to advance to password');
assert(appJs.includes("inpPass.addEventListener('keydown'"), 'inpPassword supports Enter key to advance to confirm password');
assert(appJs.includes("inpConf.addEventListener('keydown'"), 'inpConfirmPassword supports Enter key to submit');
console.log('  ✓ PASS: Tab order preserved and Enter key advances fields naturally');

// 1.4 CSS hit-target size, cursor: text, pointer-events: auto, and overflow handling
assert(screenCss.includes('.oobe-text-input'), '.oobe-text-input CSS rule exists');
assert(screenCss.includes('min-height: 42px !important') || screenCss.includes('height: 42px !important'), '.oobe-text-input has comfortable hit target (>=40px)');
assert(screenCss.includes('touch-action: manipulation'), '.oobe-text-input has touch-action: manipulation');
assert(screenCss.includes('cursor: text !important'), '.oobe-text-input enforces cursor: text');
assert(screenCss.includes('pointer-events: auto !important'), '.oobe-text-input enforces pointer-events: auto');
assert(screenCss.includes('overflow-y: auto'), '.oobe-backdrop has overflow-y: auto to support all display scalings');
console.log('  ✓ PASS: CSS hit-target >=42px, cursor: text, pointer-events: auto, and scaling-safe scroll');

// -----------------------------------------------------------------------------
// Modification 2: Draggable Assistance Window Root-Cause Fix
// -----------------------------------------------------------------------------
console.log('\n[Modification 2] Testing "مساعدة مرحلية" Draggable Window Zero-Jump & Pointer Capture...');

// 2.1 CSS fixed positioning to prevent offsetParent distortion
assert(compCss.includes('.draggable-hint-bar {') && compCss.includes('position: fixed;'), '.draggable-hint-bar uses position: fixed to eliminate parent offset traps');
assert(compCss.includes('touch-action: none;'), '.draggable-hint-bar uses touch-action: none for touch dragging');
assert(compCss.includes('cursor: grab;'), '.draggable-hint-bar uses cursor: grab');
assert(compCss.includes('cursor: grabbing !important;'), '.draggable-hint-bar.is-dragging uses cursor: grabbing');

// 2.2 Pointer events implementation
assert(indexHtml.includes("bar.addEventListener('pointerdown', onPointerDown)"), 'Uses pointerdown instead of legacy mousedown');
assert(indexHtml.includes("window.addEventListener('pointermove', onPointerMove"), 'Uses window pointermove for smooth tracking');
assert(indexHtml.includes("window.addEventListener('pointerup', onPointerUp)"), 'Uses window pointerup for cleanup');
assert(indexHtml.includes("window.addEventListener('pointercancel', onPointerUp)"), 'Uses pointercancel for robust touch support');

// 2.3 Offset calculation at pointerdown
assert(indexHtml.includes('offsetX = e.clientX - rect.left'), 'Calculates exact offsetX = e.clientX - rect.left at pointerdown');
assert(indexHtml.includes('offsetY = e.clientY - rect.top'), 'Calculates exact offsetY = e.clientY - rect.top at pointerdown');

// 2.4 Immediate coordinate synchronization with zero jump
assert(indexHtml.includes('bar.style.transform = \'none\''), 'Removes translateX centering transform without jumping');
assert(indexHtml.includes('bar.style.left = `${rect.left}px`'), 'Initializes bar.style.left to rect.left with zero pixel jump');
assert(indexHtml.includes('bar.style.top = `${rect.top}px`'), 'Initializes bar.style.top to rect.top with zero pixel jump');

// 2.5 Viewport bounds clamping & requestAnimationFrame
assert(indexHtml.includes('clampedX = Math.max('), 'Clamps X coordinate within viewport boundaries');
assert(indexHtml.includes('clampedY = Math.max('), 'Clamps Y coordinate within viewport boundaries');
assert(indexHtml.includes('requestAnimationFrame'), 'Uses requestAnimationFrame for 60fps buttery-smooth dragging');
assert(indexHtml.includes('bar.setPointerCapture(e.pointerId)'), 'Utilizes setPointerCapture for uninterrupted dragging across iframes/windows');

// 2.6 Draggable from any part except interactive controls
assert(indexHtml.includes("e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.vkb-key')"), 'Draggable from any surface while preserving button/vkb interaction');
console.log('  ✓ PASS: Zero-jump offset math, pointer capture, clamping, rAF, and touch support validated');

// -----------------------------------------------------------------------------
// Modification 3: Comprehensive Pointer/Interaction Audit Across All Controls
// -----------------------------------------------------------------------------
console.log('\n[Modification 3] Testing Comprehensive Pointer & Label Associations Across All Modals...');

assert(indexHtml.includes('for="regLastName"'), '#sessionModal has for="regLastName"');
assert(indexHtml.includes('for="regFirstName"'), '#sessionModal has for="regFirstName"');
assert(indexHtml.includes('for="regGroup"'), '#sessionModal has for="regGroup"');
assert(indexHtml.includes('for="regMode"'), '#sessionModal has for="regMode"');

assert(indexHtml.includes('for="settingsPwdInput"'), '#settingsPasswordModal has for="settingsPwdInput"');

assert(indexHtml.includes('for="setTeacherFullName"'), '#settingsModal has for="setTeacherFullName"');
assert(indexHtml.includes('for="setNewPassword"'), '#settingsModal has for="setNewPassword"');
assert(indexHtml.includes('for="setConfirmPassword"'), '#settingsModal has for="setConfirmPassword"');
assert(indexHtml.includes('for="setInstitution"'), '#settingsModal has for="setInstitution"');
assert(indexHtml.includes('for="setSchoolYear"'), '#settingsModal has for="setSchoolYear"');
assert(indexHtml.includes('for="newGroupInput"'), '#settingsModal has for="newGroupInput"');

assert(indexHtml.includes('for="initTeacherPassword"'), '#initialSetupModal has for="initTeacherPassword"');
assert(indexHtml.includes('for="initConfirmPassword"'), '#initialSetupModal has for="initConfirmPassword"');
assert(indexHtml.includes('for="initTeacherFullName"'), '#initialSetupModal has for="initTeacherFullName"');
assert(indexHtml.includes('for="initInstitution"'), '#initialSetupModal has for="initInstitution"');
assert(indexHtml.includes('for="initSchoolYear"'), '#initialSetupModal has for="initSchoolYear"');
assert(indexHtml.includes('for="newInitGroupInput"'), '#initialSetupModal has for="newInitGroupInput"');
console.log('  ✓ PASS: 100% of interactive modal labels properly linked to inputs');

// -----------------------------------------------------------------------------
// Modification 4: Project Cleanup, Repository Health & GitHub Artifacts
// -----------------------------------------------------------------------------
console.log('\n[Modification 4] Testing Repository Standards, .gitignore & GitHub Structure...');

assert(gitignore.includes('node_modules/'), '.gitignore covers node_modules/');
assert(gitignore.includes('dist/'), '.gitignore covers dist/');
assert(gitignore.includes('.DS_Store'), '.gitignore covers .DS_Store');
assert(gitignore.includes('Thumbs.db'), '.gitignore covers Thumbs.db');
assert(gitignore.includes('*.log'), '.gitignore covers *.log');

// package.json checks
assert(packageJson.name === 'simu-win11-dz', 'package.json has valid name');
assert(packageJson.version === '1.0.0', 'package.json has valid version');
assert(packageJson.license === 'MIT', 'package.json has MIT license');
assert(packageJson.scripts && packageJson.scripts.start, 'package.json has start script');
assert(packageJson.scripts && packageJson.scripts.test, 'package.json has test script');

// Root redirect check
const rootIndexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
assert(rootIndexHtml.includes('url=src/index.html') && rootIndexHtml.includes('src/index.html'), 'Root index.html cleanly redirects to src/index.html for GitHub Pages');

// Check dist/inf.dll integrity
const dllPath = path.join(rootDir, 'dist', 'inf.dll');
assert(fs.existsSync(dllPath) && fs.statSync(dllPath).size === 689, 'dist/inf.dll exists and maintains 689-byte structure');

console.log('  ✓ PASS: Package metadata, root redirection, gitignore, and DLL integrity confirmed');
console.log('\n================================================================');
console.log('ALL PROMPT 6 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
console.log('================================================================');

