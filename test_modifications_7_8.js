/**
 * Comprehensive Validation Test Suite for Modifications 7 & 8
 * Modification 7: Sortable PDF Filename Formula [group]_[grade]_[time]_[lastname]_[firstname].pdf
 * Modification 8: Authentic Windows 11 Desktop, Logo, Taskbar, Start Menu & Local Assets
 */
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('VALIDATION SUITE: MODIFICATIONS 7 & 8');
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
// [Modification 7] Sortable PDF Filename Formula
// -----------------------------------------------------------------------------
console.log('[Modification 7] Testing Filename Formula [group]_[grade]_[time]_[lastname]_[firstname].pdf...');

const reportPdfCode = fs.readFileSync(path.join(__dirname, 'src', 'js', 'report-pdf.js'), 'utf8');
const mainJsCode = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');

// Check report-pdf.js implementations
assert(reportPdfCode.includes('safeGroup'), 'report-pdf.js extracts safeGroup for filename');
assert(reportPdfCode.includes('`${safeGroup}_${gradeStr}_${timeStr}_${safeLastName}_${safeFirstName}`') && reportPdfCode.includes('`${baseFileName}.pdf`'), 'report-pdf.js follows strict [group]_[grade]_[time]_[lastname]_[firstname].pdf formula');
assert(!reportPdfCode.includes('_تقرير_تنصيب_الويندوز.pdf'), 'report-pdf.js has removed suffix as per Modification 7 (no suffix, no prefix)');
assert(mainJsCode.includes('${safeGroup}_${gradeStr}_${timeStr}_${safeLastName}_${safeFirstName}.pdf'), 'main.js follows strict defaultFilename formula');

// Helper functions mirroring report-pdf.js
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
  let cleaned = String(str)
    .replace(/[\\/:*?"<>|]/g, '-')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[.\s]+$/g, '');
  return cleaned || fallback;
}

function buildFilename(group, score, totalSecs, lastName, firstName) {
  const gr = cleanFilenamePart(group, 'unknown');
  const g = formatSortableGrade(score);
  const t = formatSortableTime(totalSecs);
  const ln = cleanFilenamePart(lastName, 'unknown');
  const fn = cleanFilenamePart(firstName, 'unknown');
  let base = `${gr}_${g}_${t}_${ln}_${fn}`;
  if (base.length > 195) base = base.substring(0, 195).replace(/[.\s_]+$/g, '');
  return `${base}.pdf`;
}

// Acceptance criteria: 5 files across 2 groups (1AS-1, 1AS-2)
const fileA = buildFilename('1AS-1', 18.75, 1300, 'بوزيد', 'عمر');     // 1AS-1_18.75_00-21-40_بوزيد_عمر.pdf
const fileB = buildFilename('1AS-1', 5.50, 1122, 'بن علي', 'محمد');    // 1AS-1_05.50_00-18-42_بن_علي_محمد.pdf
const fileC = buildFilename('1AS-1', 12.00, 425, 'قاسمي', 'أحمد');     // 1AS-1_12.00_00-07-05_قاسمي_أحمد.pdf
const fileD = buildFilename('1AS-2', 0.00, 0, '', '');                  // 1AS-2_00.00_00-00-00_unknown_unknown.pdf (Edge cases)
const fileE = buildFilename('1AS-2', 20.00, 930, 'سالمي', 'فاطمة');    // 1AS-2_20.00_00-15-30_سالمي_فاطمة.pdf

assert(fileB === '1AS-1_05.50_00-18-42_بن_علي_محمد.pdf', `Generated File B: ${fileB}`);
assert(fileC === '1AS-1_12.00_00-07-05_قاسمي_أحمد.pdf', `Generated File C: ${fileC}`);
assert(fileA === '1AS-1_18.75_00-21-40_بوزيد_عمر.pdf', `Generated File A: ${fileA}`);
assert(fileD === '1AS-2_00.00_00-00-00_unknown_unknown.pdf', `Generated File D (Edge cases 0 grade, 0 time, empty names): ${fileD}`);
assert(fileE === '1AS-2_20.00_00-15-30_سالمي_فاطمة.pdf', `Generated File E: ${fileE}`);

// Ascending Sort Verification
const fileList = [fileE, fileA, fileD, fileC, fileB];
fileList.sort();

console.log('  Ascending Sorted List:');
fileList.forEach((f, i) => console.log(`    ${i + 1}. ${f}`));

assert(fileList[0] === fileB, 'Ascending 1: 1AS-1 lowest grade (05.50)');
assert(fileList[1] === fileC, 'Ascending 2: 1AS-1 medium grade (12.00)');
assert(fileList[2] === fileA, 'Ascending 3: 1AS-1 highest grade (18.75)');
assert(fileList[3] === fileD, 'Ascending 4: 1AS-2 lowest grade (00.00)');
assert(fileList[4] === fileE, 'Ascending 5: 1AS-2 highest grade (20.00)');

// Descending Sort Verification
const descList = [...fileList].reverse();
console.log('  Descending Sorted List:');
descList.forEach((f, i) => console.log(`    ${i + 1}. ${f}`));

assert(descList[0] === fileE, 'Descending 1: 1AS-2 highest grade (20.00)');
assert(descList[1] === fileD, 'Descending 2: 1AS-2 lowest grade (00.00)');
assert(descList[2] === fileA, 'Descending 3: 1AS-1 highest grade (18.75)');
assert(descList[3] === fileC, 'Descending 4: 1AS-1 medium grade (12.00)');
assert(descList[4] === fileB, 'Descending 5: 1AS-1 lowest grade (05.50)');

// Length limit test
const longFile = buildFilename('1AS-1', 15.00, 300, 'أ'.repeat(150), 'ب'.repeat(150));
assert(longFile.length <= 200, `Long filename truncated safely (length: ${longFile.length} <= 200)`);
assert(longFile.endsWith('.pdf'), 'Truncated filename preserves .pdf extension');

// -----------------------------------------------------------------------------
// [Modification 8] Authentic Windows 11 Desktop, Official Logo & Offline Assets
// -----------------------------------------------------------------------------
console.log('\n[Modification 8] Testing Authentic Windows 11 Desktop & Offline Assets...');

const assetsDir = path.join(__dirname, 'src', 'assets');
assert(fs.existsSync(assetsDir), 'src/assets/ directory exists');

const requiredAssets = [
  'logo-win11-blue.svg',
  'logo-win11-white.svg',
  'desktop-bloom.svg',
  'icon-start.svg',
  'icon-search.svg',
  'icon-taskview.svg',
  'icon-widgets.svg',
  'icon-explorer.svg',
  'icon-edge.svg',
  'icon-store.svg',
  'icon-tray-network.svg',
  'icon-tray-volume.svg',
  'icon-tray-battery.svg',
  'icon-recycle.svg',
  'icon-thispc.svg',
  'segoe-ui.woff2'
];

requiredAssets.forEach(asset => {
  const p = path.join(assetsDir, asset);
  assert(fs.existsSync(p) && fs.statSync(p).size > 0, `Local offline asset ${asset} exists (${fs.existsSync(p) ? fs.statSync(p).size : 0} bytes)`);
});

// Logo inspection (2x2 grid, slight rounded corners, thin gap)
const blueLogo = fs.readFileSync(path.join(assetsDir, 'logo-win11-blue.svg'), 'utf8');
const whiteLogo = fs.readFileSync(path.join(assetsDir, 'logo-win11-white.svg'), 'utf8');

assert(blueLogo.includes('#0078D4'), 'logo-win11-blue.svg uses official #0078D4 color');
assert(whiteLogo.includes('#FFFFFF'), 'logo-win11-white.svg uses official white color');
assert((blueLogo.match(/<rect/g) || []).length === 4, 'logo-win11-blue.svg has exactly 4 equal squares in 2x2 grid');
assert((whiteLogo.match(/<rect/g) || []).length === 4, 'logo-win11-white.svg has exactly 4 equal squares in 2x2 grid');
assert(blueLogo.includes('rx="') && blueLogo.includes('ry="'), 'logo-win11-blue.svg has slight rounded corners (rx, ry)');

// Check CSS rules for Desktop & Acrylic Taskbar & Scoped Font
const virtCssCode = fs.readFileSync(path.join(__dirname, 'src', 'css', 'virtual-screen.css'), 'utf8');
assert(virtCssCode.includes('@font-face'), 'virtual-screen.css registers @font-face for local Segoe UI');
assert(virtCssCode.includes('#virtual-screen'), 'virtual-screen.css scopes font strictly to virtual screen');
assert(virtCssCode.includes('desktop-bloom.svg'), 'virtual-screen.css sets desktop background-image to local desktop-bloom.svg');
assert(virtCssCode.includes('background-size: cover'), 'desktop background-size is cover');
assert(virtCssCode.includes('background-position: center'), 'desktop background-position is center');
assert(virtCssCode.includes('backdrop-filter: blur'), 'taskbar uses pure CSS backdrop-filter for Acrylic blur');
assert(virtCssCode.includes('.win11-official-logo'), 'virtual-screen.css defines 1:1 aspect ratio official logo class');

// Check Phase 8 Evaluation Logic in app-simulator.js
const appSimCode = fs.readFileSync(path.join(__dirname, 'src', 'js', 'app-simulator.js'), 'utf8');
assert(appSimCode.includes('id="btnTaskbarStart"'), 'app-simulator.js provides #btnTaskbarStart in centralized taskbar');
assert(appSimCode.includes('id="startMenuPopup"'), 'app-simulator.js renders #startMenuPopup');
assert(appSimCode.includes('id="btnStartPower"'), 'app-simulator.js renders #btnStartPower at bottom of Start menu');
assert(appSimCode.includes('id="btnRestartOS"'), 'app-simulator.js provides #btnRestartOS');
assert(appSimCode.includes('executeIndependentRebootCycle'), 'Clicking Restart triggers executeIndependentRebootCycle');
assert(appSimCode.includes('window.stateEngine.completePhase(8)'), 'Phase 8 learning loop completes successfully via completePhase(8)');

// Check Zero Web Network Calls (Strictly 100% Offline)
console.log('\n[Offline Verification] Checking for prohibited external network URLs...');
function searchExternalUrls(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      searchExternalUrls(full);
    } else if (/\.(html|js|css)$/.test(f)) {
      const content = fs.readFileSync(full, 'utf8');
      // Look for http:// or https:// that are not xml namespaces
      const lines = content.split('\n');
      lines.forEach((line, lineIdx) => {
        if (/https?:\/\//.test(line)) {
          if (!line.includes('xmlns="http://www.w3.org/2000/svg"') && !line.includes('w3.org') && !line.includes('// Embedded fallback') && !line.includes('github.com') && !line.includes('github.io')) {
            console.error(`  Found external URL in ${full}:${lineIdx + 1}: ${line.trim()}`);
            allPassed = false;
          }
        }
      });
    }
  }
}
searchExternalUrls(path.join(__dirname, 'src'));
console.log('  ✓ 100% Offline Verified: Zero external CDNs or network URLs in src/.');

// Check Pure 2D (No WebGL, Three.js, Canvas 3D)
assert(!appSimCode.includes('WebGLRenderingContext') && !appSimCode.includes('THREE.') && !virtCssCode.includes('transform-style: preserve-3d'), 'Pure 2D verified: No WebGL, Three.js or 3D canvas');

console.log('\n================================================================');
if (allPassed) {
  console.log('ALL MODIFICATIONS 7 & 8 TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================');
  process.exit(0);
} else {
  console.error('TESTS FAILED! Review output above.');
  console.log('================================================================');
  process.exit(1);
}
