const assert = require('assert');
const fs = require('fs');

console.log('================================================================');
console.log('TEST SUITE: FONT SCALE CONTROLS & MOBILE/TABLET RESPONSIVENESS');
console.log('================================================================');

const indexHtml = fs.readFileSync('src/index.html', 'utf8');
const mainCss = fs.readFileSync('src/css/main-layout.css', 'utf8');
const compCss = fs.readFileSync('src/css/components.css', 'utf8');
const stateEngineJs = fs.readFileSync('src/js/state-engine.js', 'utf8');

// [Test 1] Font Size Controls & Visual Feedback Badge
console.log('\n[Check 1] Verifying Font Size Controls & Visual Feedback Badge...');
assert(indexHtml.includes('id="hudFontBadge"'), 'HUD Font Badge exists in index.html');
assert(indexHtml.includes('id="btnFontDec"'), 'btnFontDec exists in index.html');
assert(indexHtml.includes('id="btnFontInc"'), 'btnFontInc exists in index.html');
assert(mainCss.includes('.hud-font-badge'), '.hud-font-badge CSS style defined');
assert(indexHtml.includes("fontSizeLabels = {"), 'Font size labels defined in script');
assert(indexHtml.includes("badge.textContent = fontSizeLabels[size]"), 'Badge text updated on font change');
assert(indexHtml.includes("btnDec.disabled = (idx === 0)"), 'btnDec disabled when at normal');
assert(indexHtml.includes("btnInc.disabled = (idx === fontSizes.length - 1)"), 'btnInc disabled when at xlarge');
assert(indexHtml.includes("e.stopPropagation()"), 'Event propagation stopped to keep dropdown open during font adjustments');
console.log('  ✓ PASS: Font size controls, visual badge, limit clamping, and stopPropagation verified.');

// [Test 2] Font Scale Cascading in CSS
console.log('\n[Check 2] Verifying Cascading Font Scale across UI elements...');
assert(mainCss.includes('[data-font-size="normal"]'), 'data-font-size normal defined');
assert(mainCss.includes('[data-font-size="large"]'), 'data-font-size large defined');
assert(mainCss.includes('[data-font-size="xlarge"]'), 'data-font-size xlarge defined');
assert(mainCss.includes('--ui-font-scale: 1.15'), 'Large scale is 1.15');
assert(mainCss.includes('--ui-font-scale: 1.30'), 'XLarge scale is 1.30');
assert(mainCss.includes('body {\n  font-size: calc(13px * var(--ui-font-scale, 1));') || mainCss.includes('body {\r\n  font-size: calc(13px * var(--ui-font-scale, 1));'), 'Body font scales');
assert(mainCss.includes('.hud-btn {\n  font-size: calc(12px * var(--ui-font-scale, 1));') || mainCss.includes('.hud-btn {\r\n  font-size: calc(12px * var(--ui-font-scale, 1));'), 'HUD buttons font scales');
assert(mainCss.includes('.stepper-item {\n  font-size: calc(12px * var(--ui-font-scale, 1));') || mainCss.includes('.stepper-item {\r\n  font-size: calc(12px * var(--ui-font-scale, 1));'), 'Stepper items font scales');
assert(compCss.includes('.hint-handle {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  color: var(--hint-handle);\n  font-weight: 700;\n  font-size: calc(13px * var(--ui-font-scale, 1));') || compCss.includes('.hint-handle {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 6px;\r\n  color: var(--hint-handle);\r\n  font-weight: 700;\r\n  font-size: calc(13px * var(--ui-font-scale, 1));'), 'Hint handle font scales');
assert(compCss.includes('.hint-text {\n  flex: 1;\n  font-size: calc(12.5px * var(--ui-font-scale, 1));') || compCss.includes('.hint-text {\r\n  flex: 1;\r\n  font-size: calc(12.5px * var(--ui-font-scale, 1));'), 'Hint text font scales');
console.log('  ✓ PASS: Cascading font scale variables verified across core UI components.');

// [Test 3] Layout Protection Against Distortion & Overflow
console.log('\n[Check 3] Verifying Layout Protection against Distortion & Overflow...');
assert(mainCss.includes('min-height: var(--hud-height);'), 'HUD Top Bar uses min-height for safe vertical scaling');
assert(mainCss.includes('flex-wrap: wrap;'), 'HUD Actions container supports flex-wrap to prevent clipping');
assert(mainCss.includes('min-height: var(--stepper-height);'), 'Stepper bar uses min-height');
assert(mainCss.includes('overflow-x: auto;'), 'Stepper phases container allows horizontal touch scroll');
assert(compCss.includes('word-break: break-word;'), 'Hint text uses word-break: break-word');
assert(compCss.includes('max-height: calc(88vh - 120px);'), 'Modal body limits max-height with scroll for large text');
console.log('  ✓ PASS: Layout containers safely protected against font scaling overflow and clipping.');

// [Test 4] Collapsible Bottom Hint Bar on Mobile & Desktop
console.log('\n[Check 4] Verifying Collapsible Bottom Hint Bar Architecture...');
assert(indexHtml.includes('id="btnToggleHintCollapse"'), 'btnToggleHintCollapse button exists');
assert(indexHtml.includes('id="hintCollapsibleBody"'), 'hintCollapsibleBody wrapper exists');
assert(indexHtml.includes('id="hintBarHeader"'), 'hintBarHeader exists for quick collapse toggle');
assert(compCss.includes('.draggable-hint-bar.is-collapsed'), '.is-collapsed CSS rule exists');
assert(compCss.includes('.draggable-hint-bar.is-collapsed .hint-collapsible-body {\n  display: none !important;\n}') || compCss.includes('.draggable-hint-bar.is-collapsed .hint-collapsible-body {\r\n  display: none !important;\r\n}'), 'Collapsible body hidden when collapsed');
assert(indexHtml.includes('if (window.innerWidth <= 768) {\n        toggleHintCollapse(true);\n      }') || indexHtml.includes('if (window.innerWidth <= 768) {\r\n        toggleHintCollapse(true);\r\n      }'), 'Mobile auto-collapse (< 768px) implemented on startup');
assert(stateEngineJs.includes("hintTitleEl.textContent = `مساعدة مرحلية (مـ ${this.currentPhase}):`;"), 'StateEngine updates hint title with active phase for collapsed pill view');
console.log('  ✓ PASS: Collapsible hint bar architecture and mobile default minimization verified.');

// [Test 5] Tablet & Mobile Responsiveness Rules
console.log('\n[Check 5] Verifying Tablet & Mobile Responsiveness Rules...');
assert(mainCss.includes('@media (max-width: 900px)'), '@media (max-width: 900px) defined');
assert(mainCss.includes('@media (max-width: 600px)'), '@media (max-width: 600px) defined');
assert(mainCss.includes('.workstation-rig-stage {\n    overflow-x: auto;') || mainCss.includes('.workstation-rig-stage {\r\n    overflow-x: auto;'), 'Workstation rig stage allows smooth horizontal scrolling on mobile/tablet');
assert(mainCss.includes('.workstation-rig-layout {\n    min-width: 720px;') || mainCss.includes('.workstation-rig-layout {\r\n    min-width: 720px;'), 'Workstation maintains min-width for authentic rig layout on mobile/tablet');
console.log('  ✓ PASS: Responsive media queries verified for smartphones and tablets.');

// [Test 6] dist/inf.dll Integrity
console.log('\n[Check 6] Verifying dist/inf.dll Size & Integrity...');
const infStats = fs.statSync('dist/inf.dll');
assert.strictEqual(infStats.size, 689, `dist/inf.dll must be exactly 689 bytes, got ${infStats.size}`);
console.log(`  ✓ PASS: dist/inf.dll strictly verified (${infStats.size} bytes).`);

console.log('\n================================================================');
console.log('ALL FONT SCALE & MOBILE RESPONSIVENESS TESTS PASSED! (100%)');
console.log('================================================================\n');

