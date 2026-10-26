/**
 * StateEngine - Master Educational Assessment & Simulation State Machine
 * Strictly aligned with Algerian 1AS Computer Science Curriculum (Competency-Based Approach)
 */
class StateEngine {
  constructor() {
    this.student = {
      firstName: '',
      lastName: '',
      group: '1AS-01',
      mode: 'exam' // 'exam' (30:00 countdown) or 'practice' (elapsed)
    };

    this.currentPhase = 1;
    this.totalPhases = 8;
    this.completedPhases = new Set();

    // Scoring Breakdown (Total: 20.00)
    // Cognitive: 6.00 (6 checkpoints * 1.00)
    // Practical: 14.00
    this.cognitiveScore = 0;
    this.practicalScore = 14.00; // starts full, penalized on procedural errors
    this.penalties = [];
    this.diagnosticErrors = [];

    // Session Timers
    this.timerSeconds = 1800; // 30 mins in exam mode
    this.elapsedSeconds = 0;
    this.timerInterval = null;
    this.isSessionActive = false;
    this.isCompleted = false;

    // Simulation Flags
    this.selectedMedia = 'usb'; // 'usb' | 'dvd' | 'pxe'
    this.isPowerOn = false;
    this.biosConfig = {
      tpm: false,
      secureBoot: false,
      firstBootDevice: 'Hard Drive (SSD)',
      savedWithF10: false
    };
    this.secondBootConfig = {
      firstBootDevice: 'USB Flash Drive',
      usbUnplugged: false
    };
    this.partitionConfig = {
      gptCreated: false,
      selectedPartition: null,
      primaryFormattedNTFS: false
    };
    this.oobeConfig = {
      country: 'Algeria',
      pcName: 'LAB-PC-01',
      accountType: 'local',
      username: '',
      pin: '',
      privacySwitches: {
        location: true,
        findDevice: true,
        diagnostics: true,
        inking: true,
        tailored: true,
        advertisingId: true,
        presence: true
      }
    };

    // Phase hint definitions for Draggable Hint Bar
    this.phaseHints = {
      1: 'المرحلة 1: اختر وسيط التثبيت المناسب، اضغط زر تشغيل الحاسوب، ثم اضغط سريعاً على F2 أو Del لدخول البيوس قبل انقضاء 10 ثوانٍ.',
      2: 'المرحلة 2: في واجهة البيوس، فعّل TPM 2.0 و Secure Boot، واجعل وسيط التثبيت كجهاز إقلاع أول، ثم اضغط حصراً على F10 للحفظ.',
      3: 'المرحلة 3: اضبط الإعدادات الإقليمية للجزائر: لغة العرض، تنسيق الوقت (Algeria)، ولوحة المفاتيح (AZERTY)، ثم اضغط Install Now.',
      4: 'المرحلة 4: اختر تجاوز المفتاح (I do not have a product key)، وحدد النسخة التعليمية Windows 11 Pro Education، واختر التثبيت المخصص (Custom).',
      5: 'المرحلة 5: قسّم القرص الفارغ (New) لإنشاء جدول GPT، ثم حدد القسم الأساسي الرابع (Primary) واضغط Format لتهيئته بنظام NTFS.',
      6: 'المرحلة 6: بعد انتهاء نسخ الملفات، اضغط F2/Del لدخول البيوس وإعادة القرص الصلب كإقلاع أول، ثم انزع الفلاشة لمرة واحدة لتفادي حلقة إعادة التثبيت.',
      7: 'المرحلة 7: في شاشة OOBE، اختر الجزائر، سمّ الحاسوب، أنشئ حساباً محلياً، وقم بتعطيل كافة خيارات الخصوصية السبعة (OFF).',
      8: 'المرحلة 8: من سطح مكتب ويندوز 11، افتح قائمة ابدأ واضغط Restart لاختبار الإقلاع الذاتي النظيف والمستقل من القرص الصلب الداخلي دون أي وسائط خارجية.'
    };
  }

  hasActiveSession() {
    return this.isSessionActive && !this.isCompleted;
  }

  formatDisplayTime(totalSeconds) {
    const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  initSession(studentData) {
    const settings = (window.settingsManager && window.settingsManager.getSettings()) || {};

    if (studentData) {
      this.student.firstName = (studentData.firstName || '').trim();
      this.student.lastName = (studentData.lastName || '').trim();
      this.student.group = (studentData.group || '1AS-01').trim();
      
      // Modification 6: If session_mode_enabled is false, always practice mode
      if (settings.session_mode_enabled === false) {
        this.student.mode = 'practice';
      } else {
        this.student.mode = studentData.mode || 'exam';
      }
    } else {
      this.student.mode = settings.session_mode_enabled === false ? 'practice' : 'exam';
    }

    this.currentPhase = 1;
    this.completedPhases.clear();
    this.cognitiveScore = 0;
    this.practicalScore = 14.00;
    this.penalties = [];
    this.diagnosticErrors = [];
    this.isCompleted = false;
    this.isSessionActive = true;

    // Modification 1: reset USB media to detached on new session
    this.selectedMedia = null;

    if (this.student.mode === 'exam') {
      this.timerSeconds = 1800; // 30:00 countdown
      this.elapsedSeconds = 0;
    } else {
      this.elapsedSeconds = 0;
      this.timerSeconds = 0;
    }

    // Hide reopen finale button on new session
    const btnOpenFinale = document.getElementById('btnOpenFinaleResults');
    if (btnOpenFinale) {
      btnOpenFinale.classList.add('hidden');
    }

    this.startTimer();
    this.updateHUD();
    this.updateStepper();
    this.updateHintBar();
  }


  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.isSessionActive || this.isCompleted) return;

      if (this.student.mode === 'exam') {
        this.timerSeconds--;
        this.elapsedSeconds++;
        if (this.timerSeconds <= 0) {
          this.timerSeconds = 0;
          this.handleTimeExpired();
        }
      } else {
        this.elapsedSeconds++;
      }

      this.updateHUDTimer();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  handleTimeExpired() {
    this.stopTimer();
    this.isCompleted = true;
    if (window.soundSynth) window.soundSynth.playWarning();
    alert('انتهى الوقت المخصص للحصة التطبيقية (30:00 دقيقة). سيتم قفل الجلسة واستخراج تقرير التقييم.');
    this.showGrandFinaleModal(true);
  }

  recordPenalty(phaseNum, deduction, reason, pedagogicalRemediation = '') {
    this.practicalScore = Math.max(0, this.practicalScore - deduction);
    this.penalties.push({
      phase: phaseNum,
      deduction: deduction,
      reason: reason,
      timestamp: new Date().toLocaleTimeString()
    });

    if (pedagogicalRemediation) {
      this.diagnosticErrors.push({
        phase: phaseNum,
        title: `خطأ إجرائي في المرحلة ${phaseNum}`,
        errorChoice: reason,
        expectedChoice: 'الإجراء البيداغوجي الصحيح وفق المعايير',
        rationale: pedagogicalRemediation,
        timestamp: new Date().toLocaleTimeString()
      });
    }

    if (window.soundSynth) window.soundSynth.playWarning();
    this.updateHUD();
  }

  recordDiagnosticError(entry) {
    this.diagnosticErrors.push({
      phase: entry.phase || this.currentPhase,
      title: entry.title || `سؤال تقويمي في المرحلة ${this.currentPhase}`,
      errorChoice: entry.errorChoice || 'إجابة غير صحيحة',
      expectedChoice: entry.expectedChoice || 'الإجابة المعتمدة في المنهاج',
      rationale: entry.rationale || 'مفهوم يحتاج لمعالجة بيداغوجية',
      timestamp: new Date().toLocaleTimeString()
    });
  }

  getCalculatedScore() {
    let raw = this.cognitiveScore + this.practicalScore;
    // Strict Penalty Rule: "استحالة نيل 20/20 عند ارتكاب أي خطأ"
    if (this.penalties.length > 0 && raw >= 19.75) {
      raw = 19.50;
    }
    return Math.min(20, Math.max(0, parseFloat(raw.toFixed(2))));
  }

  getAppreciation(score) {
    if (score >= 18.0) return { text: 'متحكم جداً (ممتاز)', class: 'grade-excellent' };
    if (score >= 14.0) return { text: 'متحكم (جيد)', class: 'grade-good' };
    if (score >= 10.0) return { text: 'في طريق التحكم (متوسط)', class: 'grade-average' };
    return { text: 'غير متحكم (يحتاج معالجة)', class: 'grade-remedial' };
  }

  completePhase(phaseNum) {
    this.completedPhases.add(phaseNum);
    if (window.soundSynth) window.soundSynth.playSuccess();
    this.updateStepper();

    if (phaseNum < this.totalPhases) {
      this.goToPhase(phaseNum + 1);
    } else {
      this.completeSimulation();
    }
  }

  goToPhase(phaseNum) {
    this.currentPhase = phaseNum;
    this.updateStepper();
    this.updateHintBar();

    // Notify UI to render active phase screen
    if (typeof window.renderPhaseScreen === 'function') {
      window.renderPhaseScreen(phaseNum);
    }
  }

  completeSimulation() {
    this.isCompleted = true;
    this.stopTimer();
    this.showGrandFinaleModal(false);
  }

  updateHUD() {
    const studentNameEl = document.getElementById('hudStudentName');
    const studentGroupEl = document.getElementById('hudStudentGroup');
    const studentModeEl = document.getElementById('hudStudentMode');

    if (studentNameEl) {
      studentNameEl.textContent = `${this.student.lastName} ${this.student.firstName}`.trim() || 'تلميذ (غير مسجل)';
    }
    if (studentGroupEl) {
      studentGroupEl.textContent = this.student.group || '1AS-01';
    }
    if (studentModeEl) {
      studentModeEl.textContent = this.student.mode === 'exam' ? 'امتحان (صارم)' : 'تدريب (حر)';
    }

    this.updateHUDTimer();
    this.updateHUDScore();
  }

  updateHUDTimer() {
    const timerEl = document.getElementById('hudTimer');
    if (!timerEl) return;

    if (this.student.mode === 'exam') {
      const mins = Math.floor(this.timerSeconds / 60);
      const secs = this.timerSeconds % 60;
      timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      if (this.timerSeconds < 300) {
        timerEl.classList.add('timer-warning');
      } else {
        timerEl.classList.remove('timer-warning');
      }
    } else {
      const mins = Math.floor(this.elapsedSeconds / 60);
      const secs = this.elapsedSeconds % 60;
      timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }

  updateHUDScore() {
    const scoreValEl = document.getElementById('stepperScoreValue');
    const penaltiesValEl = document.getElementById('stepperPenaltiesValue');

    if (scoreValEl) {
      scoreValEl.textContent = `${this.getCalculatedScore().toFixed(2)} / 20.00`;
    }
    if (penaltiesValEl) {
      const totalDed = this.penalties.reduce((sum, p) => sum + p.deduction, 0);
      penaltiesValEl.textContent = `-${totalDed.toFixed(2)}`;
    }
  }

  updateStepper() {
    for (let i = 1; i <= this.totalPhases; i++) {
      const stepItem = document.getElementById(`stepperPhase${i}`);
      if (!stepItem) continue;

      stepItem.classList.remove('active', 'completed');
      if (this.completedPhases.has(i)) {
        stepItem.classList.add('completed');
      } else if (i === this.currentPhase) {
        stepItem.classList.add('active');
      }
    }
    this.updateHUDScore();
  }

  updateHintBar() {
    const hintTextEl = document.getElementById('hintBarText');
    if (hintTextEl) {
      hintTextEl.textContent = this.phaseHints[this.currentPhase] || 'تابع تنفيذ الخطوة الحالية بدقة.';
    }
  }

  showGrandFinaleModal(isTimeout = false) {
    const modal = document.getElementById('grandFinaleModal');
    if (!modal) return;

    const score = this.getCalculatedScore();
    const apprec = this.getAppreciation(score);

    const scoreNumber = document.getElementById('finaleScoreNumber');
    const timeNumber = document.getElementById('finaleTimeNumber');
    const scoreApprec = document.getElementById('finaleScoreAppreciation');
    const cogScore = document.getElementById('finaleCognitiveScore');
    const pracScore = document.getElementById('finalePracticalScore');
    const durSpan = document.getElementById('finaleDuration');
    const penaltiesList = document.getElementById('finalePenaltiesList');

    if (scoreNumber) scoreNumber.textContent = `${score.toFixed(2)} / 20.00`;
    if (timeNumber) timeNumber.textContent = this.formatDisplayTime(this.elapsedSeconds);
    if (scoreApprec) {
      scoreApprec.textContent = apprec.text;
      scoreApprec.className = `badge-appreciation ${apprec.class}`;
    }
    if (cogScore) cogScore.textContent = `${this.cognitiveScore.toFixed(2)} / 6.00`;
    if (pracScore) pracScore.textContent = `${this.practicalScore.toFixed(2)} / 14.00`;

    if (durSpan) {
      const m = Math.floor(this.elapsedSeconds / 60);
      const s = this.elapsedSeconds % 60;
      durSpan.textContent = `${m} دقيقة و ${s} ثانية`;
    }


    if (penaltiesList) {
      if (this.penalties.length === 0) {
        penaltiesList.innerHTML = '<li class="penalty-none">أداء مهاري مثالي - لا توجد أي خصومات مسجلة ✔</li>';
      } else {
        penaltiesList.innerHTML = this.penalties
          .map(p => `<li><span class="penalty-tag">-${p.deduction.toFixed(2)}</span> ${p.reason} (مرحلة ${p.phase})</li>`)
          .join('');
      }
    }

    modal.classList.add('modal-visible');
    const btnOpenFinale = document.getElementById('btnOpenFinaleResults');
    if (btnOpenFinale) {
      btnOpenFinale.classList.remove('hidden');
    }
    if (window.soundSynth) window.soundSynth.playSuccess();
  }
}

// Global instance
window.stateEngine = new StateEngine();
