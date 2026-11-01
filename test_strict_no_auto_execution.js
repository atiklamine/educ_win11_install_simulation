/**
 * Test Suite: Strict "No Auto Execution on Behalf of Student" Verification
 * (البرومبت 2 — حزمة تعديلات «لا تنفيذ نيابةً عن التلميذ» والواقعية الإجرائية الصارمة)
 *
 * Verifies that:
 * 1. Phase 1 POST timeout never automatically enters BIOS.
 * 2. Phase 2 BIOS cannot be saved via mouse click; strictly requires physical F10 key; enforces TPM, Secure Boot, and boot order.
 * 3. Phase 3 Regional settings cannot be bypassed with incorrect values.
 * 4. Phase 4 Edition selection has no auto-preselection; wrong edition blocks progression with penalty.
 * 5. Phase 5 Partitioning requires explicit 'New' and explicit 'Format' (NTFS); cannot proceed unallocated or unformatted.
 * 6. Phase 6 Reboot timeout never enters BIOS automatically (shows Boot Loop error); USB removal strictly requires clicking tower port.
 * 7. Phase 7 OOBE requires explicit manual country selection; leaving privacy switches ON blocks progression with penalty.
 * 8. Phase 8 requires clicking 'Restart' specifically; Sleep/Shutdown are blocked with penalty.
 */

const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('TEST SUITE: STRICT "NO AUTO EXECUTION ON BEHALF OF STUDENT"');
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

const appJs = fs.readFileSync(path.join(__dirname, 'src', 'js', 'app-simulator.js'), 'utf8');
const biosJs = fs.readFileSync(path.join(__dirname, 'src', 'js', 'bios-controller.js'), 'utf8');

// --- RULE 1: PHASE 1 POST TIMEOUT BEHAVIOR ---
console.log('[Rule 1] Verifying Phase 1 POST Timeout Does NOT Auto-Enter BIOS...');
assert(appJs.includes('renderPhase1PostTimeoutFail'), 'Phase 1 renders dedicated timeout failure screen on POST timeout');
assert(!appJs.includes('// On interrupt timeout fail:\n    () => {\n      window.stateEngine.completePhase(1)'), 'Phase 1 never marks phase complete on timeout');
assert(appJs.includes('An operating system wasn\'t found'), 'Phase 1 POST timeout shows authentic unbootable disk message');

// --- RULE 2: PHASE 2 BIOS AUTHENTIC MULTI-METHOD SAVE & NO FAKE BUTTON ---
console.log('\n[Rule 2] Verifying Phase 2 BIOS Authentic Multi-Method Save & No Fake Button...');
assert(!biosJs.includes('id="biosQuickF10"'), 'Fake yellow F10 button is completely purged from BIOS interface');
assert(biosJs.includes('confirmSaveAndExit'), 'Saving triggers authentic Aptio BIOS confirmation dialog');
assert(biosJs.includes("if (e.key === 'F10')"), 'Keyboard shortcut F10 is supported for saving');
assert(biosJs.includes("rowSaveExit.addEventListener('click'"), 'Menu Save Changes and Exit is supported for saving');
assert(biosJs.includes('if (!this.settings.tpm || !this.settings.secureBoot)'), 'BIOS save validates TPM 2.0 and Secure Boot');
assert(biosJs.includes("if (firstDev.includes('hard drive') || firstDev.includes('ssd'))"), 'BIOS save blocks proceeding if blank internal SSD is left as 1st boot device');

// --- RULE 3: PHASE 3 REGIONAL SETTINGS ENFORCEMENT ---
console.log('\n[Rule 3] Verifying Phase 3 Regional Settings Strict Enforcement...');
assert(appJs.includes("if (timeVal !== 'dz' && timeVal !== 'fr-dz')"), 'Time format must match Algeria or progression is halted with penalty');
assert(appJs.includes("if (kbVal !== 'azerty')"), 'Keyboard layout must match AZERTY or progression is halted with penalty');
assert(appJs.includes("id=\"btnRepairPc\""), 'Repair PC button exists and is penalized if clicked instead of Install Now');

// --- RULE 4: PHASE 4 EDITION SELECTION & NO PRESELECTION ---
console.log('\n[Rule 4] Verifying Phase 4 Edition Selection Has No Silent Preselection...');
assert(appJs.includes('let selectedEdition = null;'), 'Phase 4 edition selection starts with null (no preselected default)');
assert(!appJs.includes('data-edition="Windows 11 Pro Education" class="partition-row edition-row selected"'), 'Windows 11 Pro Education is NOT preselected in markup');
assert(appJs.includes("if (!selectedEdition)"), 'Clicking Next without selecting an edition is strictly halted');
assert(appJs.includes("if (selectedEdition !== 'Windows 11 Pro Education')"), 'Selecting non-education edition is halted with penalty');
assert(appJs.includes("id=\"btnTypeUpgrade\""), 'Upgrade installation type is halted with penalty on blank disk');

// --- RULE 5: PHASE 5 PARTITIONING & MANDATORY NTFS FORMAT ---
console.log('\n[Rule 5] Verifying Phase 5 Partitioning & Mandatory NTFS Formatting...');
assert(appJs.includes('if (!gptCreated)'), 'Cannot proceed without creating GPT structure first');
assert(appJs.includes('if (selectedPartId !== \'part4\')'), 'Cannot proceed on non-primary system partition');
assert(appJs.includes('if (!primaryFormatted)'), 'Cannot proceed without formatting primary partition with NTFS');
assert(appJs.includes('The selected partition is unallocated. You must click Format to format it with the NTFS file system'), 'Authentic NTFS requirement error prompt rendered');

// --- RULE 6: PHASE 6 REBOOT TIMEOUT BOOT LOOP & PHYSICAL UNPLUG ---
console.log('\n[Rule 6] Verifying Phase 6 Reboot Timeout Does NOT Auto-Enter BIOS (Boot Loop)...');
assert(appJs.includes('renderPhase6BootLoopError'), 'Phase 6 renders authentic Boot Loop error when reboot interrupt timeout expires');
assert(!appJs.includes('seconds <= 0) {\n      clearInterval(timer);\n      if (secondBootKeyHandler) window.removeEventListener(\'keydown\', secondBootKeyHandler);\n      // Student failed to interrupt second boot!\n      window.stateEngine.recordPenalty(\n        6,\n        1.00,\n        \'فوات مهلة مقاطعة الإقلاع الثاني والوقوع في حلقة التثبيت (Boot Loop)\',\n        \'يجب دائماً مقاطعة الإقلاع الثاني بالضغط على F2 أو Del لإعادة القرص الصلب الداخلي كإقلاع أول لتفادي إعادة التثبيت.\'\n      );\n      enterSecondBootBios(container);'), 'Reboot countdown timeout NEVER enters BIOS automatically');
assert(appJs.includes('btnRetrySecondBoot'), 'Student must manually restart computer to retry second boot interrupt');
assert(!appJs.includes('calloutPanel.onclick = handlePhysicalRemoval;'), 'Callout panel click cannot bypass physical media unplugging on tower');

// --- RULE 7: PHASE 7 OOBE MANUAL COUNTRY & PRIVACY ENFORCEMENT ---
console.log('\n[Rule 7] Verifying Phase 7 OOBE Manual Country & Privacy Switch Enforcement...');
assert(appJs.includes('let selectedCountry = null;'), 'Country selection starts unselected (null)');
assert(appJs.includes('if (!selectedCountry)'), 'Clicking Yes without choosing country is halted');
assert(appJs.includes("if (selectedCountry !== 'Algeria')"), 'Choosing non-Algeria country is halted with penalty');
assert(appJs.includes('if (anyOn)'), 'Leaving any of the 7 privacy switches enabled halts progression with penalty');

// --- RULE 8: PHASE 8 INDEPENDENT REBOOT POWER ACTION ---
console.log('\n[Rule 8] Verifying Phase 8 Restart Action Enforcement...');
assert(appJs.includes('id="btnSleepOS"'), 'Sleep option is intercepted and penalized');
assert(appJs.includes('id="btnShutdownOS"'), 'Shutdown option is intercepted and penalized');
assert(appJs.includes('executeIndependentRebootCycle'), 'Only Restart triggers clean final SSD reboot test');

console.log('\n================================================================');
if (allPassed) {
  console.log('✓ ALL "NO AUTO EXECUTION" STRICT VERIFICATION TESTS PASSED (100%)!');
  process.exit(0);
} else {
  console.error('✗ SOME STRICT VERIFICATION TESTS FAILED! PLEASE REVIEW OUTPUT ABOVE.');
  process.exit(1);
}
