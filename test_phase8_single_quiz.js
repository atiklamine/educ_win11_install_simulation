const assert = require('assert');
const fs = require('fs');

console.log('Testing Phase 8 single quiz execution logic...');

// Mock Minimal DOM
let JSDOM;
try {
  JSDOM = require('jsdom').JSDOM;
} catch (e) {
  // Not installed, mock manually
}

// If JSDOM is not installed, test via direct mock environment
class MockElement {
  constructor(tag = 'div') {
    this.tag = tag;
    this.children = [];
    this.innerHTML = '';
    this.classList = {
      _classes: new Set(),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      contains: (c) => this.classList._classes.has(c),
      toggle: (c, val) => {
        if (val !== undefined) {
          if (val) this.classList._classes.add(c);
          else this.classList._classes.delete(c);
        } else {
          if (this.classList._classes.has(c)) this.classList._classes.delete(c);
          else this.classList._classes.add(c);
        }
      }
    };
    this.style = {};
    this.listeners = {};
  }
  addEventListener(ev, fn) {
    if (!this.listeners[ev]) this.listeners[ev] = [];
    this.listeners[ev].push(fn);
  }
  querySelector(sel) {
    return new MockElement('mock');
  }
  querySelectorAll(sel) {
    return [new MockElement('mock')];
  }
}

// Verify app-simulator.js code structure
const appJs = fs.readFileSync('src/js/app-simulator.js', 'utf8');

// 1. Verify that executeIndependentRebootCycle checks completedPhases
assert(appJs.includes('const isPhase8AlreadyCompleted = window.stateEngine && window.stateEngine.completedPhases && window.stateEngine.completedPhases.has(8);'), 'isPhase8AlreadyCompleted check is defined');

// 2. Verify that showQuizForBank is guarded by !isPhase8AlreadyCompleted in passwordless branch
const pwdlessIdx = appJs.indexOf('if (isPasswordless) {');
const pwdBranch = appJs.slice(pwdlessIdx, pwdlessIdx + 1200);
assert(pwdBranch.includes('!isPhase8AlreadyCompleted && window.quizManager'), 'Passwordless branch guards showQuizForBank');

// 3. Verify that showQuizForBank is guarded by !isPhase8AlreadyCompleted in password branch
const pwdElseIdx = appJs.indexOf('} else {', pwdlessIdx);
const elseBranch = appJs.slice(pwdElseIdx, pwdElseIdx + 1200);
assert(elseBranch.includes('!isPhase8AlreadyCompleted && window.quizManager'), 'Password branch guards showQuizForBank');

// 4. Verify shutdown button behavior after completion
const shutdownIdx = appJs.indexOf('if (shutdownBtn) {');
const shutdownBlock = appJs.slice(shutdownIdx, shutdownIdx + 800);
assert(shutdownBlock.includes('isPhase8AlreadyCompleted'), 'shutdownBtn checks isPhase8AlreadyCompleted');
assert(shutdownBlock.includes('handleHardwarePowerToggle(false)'), 'shutdownBtn powers down cleanly after completion');

// 5. Functional state-engine verification
global.window = global;
global.document = { getElementById: () => null };
const seJs = fs.readFileSync('src/js/state-engine.js', 'utf8');
const StateEngine = eval('(function() {\n' + seJs + '\nreturn StateEngine;\n})()');
const engine = new StateEngine();

assert(!engine.completedPhases.has(8), 'Phase 8 is initially not completed');
engine.completePhase(8);
assert(engine.completedPhases.has(8), 'Phase 8 is recorded as completed in completedPhases');
assert(engine.isCompleted === true, 'Simulation is marked completed');

engine.resetSessionState();
assert(!engine.completedPhases.has(8), 'resetSessionState clears completedPhases');
assert(engine.isCompleted === false, 'resetSessionState resets isCompleted');

console.log('✓ All Phase 8 single quiz and reboot tests PASSED (100%)!');
