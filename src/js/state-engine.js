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
    this.skipQuiz = false;

    // Session Timers
    this.timerSeconds = 1800; // 30 mins in exam mode
    this.elapsedSeconds = 0;
    this.timerInterval = null;
    this.isSessionActive = false;
    this.isCompleted = false;

    // Simulation Flags
    this.selectedMedia = null; // 'usb' | 'dvd' | 'pxe'
    this.installationMedia = 'usb'; // remembers chosen media even after unplug
    this.isPowerOn = false;
    this.biosConfig = {
      tpm: false,
      secureBoot: false,
      firstBootDevice: 'Hard Drive (SSD)',
      savedWithF10: false
    };
    this.secondBootConfig = {
      firstBootDevice: 'USB Flash Drive',
      usbUnplugged: false,
      mediaUnplugged: false
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
      username: 'Student',
      password: '',
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

    // Phase hint definitions for Draggable Phase-based Assistance Window
    this.phaseHints = {
      1: 'المرحلة 1: شاشة العرض سوداء. اختر وسيط التثبيت من الرف على اليسار (فلاش ديسك أو قرص DVD)، واضغط زر التشغيل بالوحدة المركزية على اليمين، ثم اضغط سريعاً على [F2 أو Del] في لوحة المفاتيح الحقيقية لدخول البيوس قبل انقضاء المهلة (10 ثوانٍ).',
      2: 'المرحلة 2: في واجهة البيوس، فعّل متطلبات ويندوز 11 (TPM 2.0 و Secure Boot) من تبويب Security، واجعل وسيط التثبيت كجهاز إقلاع أول في تبويب Boot، ثم اضغط حصراً على [F10] في لوحة المفاتيح الحقيقية للحفظ والخروج.',
      3: 'المرحلة 3: اضبط الإعدادات الإقليمية للجزائر: لغة العرض، تنسيق الوقت (Algeria)، ولوحة المفاتيح (AZERTY)، ثم اضغط Install Now.',
      4: 'المرحلة 4: اختر تجاوز المفتاح (I do not have a product key)، وحدد النسخة المخصصة للتعليم Windows 11 Pro Education، واختر التثبيت المخصص: Custom: Install Windows only (advanced).',
      5: 'المرحلة 5: قسّم القرص (New) لإنشاء جدول GPT وأقسامه مع إمكانية تحديد الحجم المطلوب (أكبر من 64 GB). ⚠️ تنبيه بيداغوجي: التهيئة المنطقية (Logical Formatting) تعني اختيار نظام الملفات (File System) المناسب؛ ولتثبيت Windows 11 يجب اختيار القسم الأساسي الداخلي (Drive 0) وتنسيقه بنظام NTFS حصراً عبر زر Format قبل المتابعة. احذر اختيار الفلاش ديسك (Drive 1) كوسيط تثبيت لتفادي خصم النقاط.',
      6: 'المرحلة 6 (المرحلة الأولى لتنصيب النظام - نقل ونسخ الملفات): يقوم برنامج الإعداد بنسخ وتثبيت ملفات الويندوز من وسيط التثبيت (الفلاش ديسك) إلى القرص الصلب الداخلي SSD. بعد اكتمال النسخ وبدء إعادة التشغيل، ادخل البيوس بـ [F2/Del] وأعد SSD كإقلاع أول واحفظ بـ [F10]، ثم انقر على وسيط التثبيت في الوحدة المركزية لنزعه فيزيائياً لكسر حلقة الإقلاع التكرارية.',
      7: 'المرحلة 7 (المرحلة الثانية لتنصيب النظام - إعدادات نظام التشغيل OOBE): يعمل النظام الآن ذاتياً من ملفات الويندوز المنقولة إلى القرص الصلب الداخلي SSD. اختر الجزائر، سمّ الحاسوب، أنشئ حساباً محلياً، وعطّل كافة خيارات الخصوصية والتتبع الإعلاني السبعة (Turn All OFF) لحماية البيانات.',
      8: 'المرحلة 8: من سطح مكتب ويندوز 11، افتح قائمة ابدأ واضغط Restart لاختبار الإقلاع الذاتي النظيف والمستقل من القرص الصلب الداخلي دون أي وسائط خارجية، والإجابة عن السؤال النهائي لختام التقييم.'
    };

    this.phaseVkbHints = {
      1: 'F2 / Del',
      2: 'F10',
      3: 'Enter',
      4: 'Tab / Enter',
      5: 'Enter',
      6: 'F2 / Del ➔ F10',
      7: 'Tab / Space',
      8: 'Restart'
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

  // Comprehensive Session State Resetting (Prompt 3 - Zero leftover session traces)
  resetSessionState() {
    // 1. Stop active timers and reset counters
    this.stopTimer();
    this.timerSeconds = 1800; // 30:00 initial
    this.elapsedSeconds = 0;
    this.isSessionActive = false;
    this.isCompleted = false;

    // 2. Clear simulation phases & scores to exact initial values
    this.currentPhase = 1;
    this.completedPhases.clear();
    this.cognitiveScore = 0;
    this.practicalScore = 14.00;
    this.penalties = [];
    this.diagnosticErrors = [];
    this.skipQuiz = false;

    // 3. Clear student data
    this.student = {
      firstName: '',
      lastName: '',
      group: '1AS-01',
      mode: 'exam'
    };

    // 4. Reset media & simulation hardware states
    this.selectedMedia = null;
    this.installationMedia = 'usb';
    this.isPowerOn = false;
    this.biosConfig = {
      tpm: false,
      secureBoot: false,
      firstBootDevice: 'Hard Drive (SSD)',
      savedWithF10: false
    };
    this.secondBootConfig = {
      firstBootDevice: 'USB Flash Drive',
      usbUnplugged: false,
      mediaUnplugged: false
    };
    this.partitionConfig = {
      gptCreated: false,
      selectedPartition: null,
      primaryFormattedNTFS: false
    };
    this.oobeConfig = {
      country: '',
      pcName: '',
      accountType: 'local',
      username: '',
      password: '',
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

    // 5. Reset BIOS Controller to factory defaults
    if (window.biosController && typeof window.biosController.reset === 'function') {
      window.biosController.reset();
    }

    // 6. Reset Quiz Manager state
    if (window.quizManager) {
      window.quizManager.currentQuestion = null;
      window.quizManager.attempts = 0;
      window.quizManager.selectedOptionIndex = null;
      if (typeof window.quizManager.closeQuizModal === 'function') {
        window.quizManager.closeQuizModal();
      }
    }

    // 7. Clear any pending Phase 6 intervals/handlers
    if (window._phase6InstallInterval) {
      clearInterval(window._phase6InstallInterval);
      window._phase6InstallInterval = null;
    }
    if (window._phase6RebootTimer) {
      clearInterval(window._phase6RebootTimer);
      window._phase6RebootTimer = null;
    }
    if (window._phase6KeyHandler) {
      window.removeEventListener('keydown', window._phase6KeyHandler);
      window._phase6KeyHandler = null;
    }

    // 8. Close all session/dialog modals except the main container
    const modalIds = [
      'grandFinaleModal',
      'expertGuideModal',
      'aboutModal',
      'teacherModal',
      'pdfExportModal',
      'exitConfirmModal',
      'quizModal'
    ];
    modalIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('modal-visible');
    });

    const btnOpenFinale = document.getElementById('btnOpenFinaleResults');
    if (btnOpenFinale) {
      btnOpenFinale.classList.add('hidden');
    }

    // 9. Reset Power LEDs & Virtual Monitor
    if (window.syncMonitorPowerLed) {
      window.syncMonitorPowerLed(false);
    }
    const towerPowerLed = document.getElementById('towerPowerLed');
    if (towerPowerLed) towerPowerLed.classList.remove('active');
    const towerHddLed = document.getElementById('towerHddLed');
    if (towerHddLed) towerHddLed.classList.remove('active');
    const tactilePowerBtn = document.getElementById('btnTactilePower');
    if (tactilePowerBtn) tactilePowerBtn.classList.remove('pulsing');

    // 10. Update HUD, Stepper, and Hint Bar
    this.updateHUD();
    this.updateStepper();
    this.updateHintBar();

    // Reset draggable hint bar position to initial center bottom
    const hintBar = document.getElementById('draggableHintBar');
    if (hintBar) {
      hintBar.style.top = 'auto';
      hintBar.style.bottom = '12px';
      hintBar.style.left = '50%';
      hintBar.style.transform = 'translateX(-50%)';
    }

    // 11. Clear registration form inputs & error messages
    const lastNameInput = document.getElementById('regLastName');
    if (lastNameInput) lastNameInput.value = '';
    const firstNameInput = document.getElementById('regFirstName');
    if (firstNameInput) firstNameInput.value = '';
    const lastNameError = document.getElementById('lastNameError');
    if (lastNameError) lastNameError.style.display = 'none';
    const firstNameError = document.getElementById('firstNameError');
    if (firstNameError) firstNameError.style.display = 'none';
    const regModeSelect = document.getElementById('regMode');
    if (regModeSelect) regModeSelect.value = 'exam';
    const regQuizSelect = document.getElementById('regQuizMode');
    if (regQuizSelect) regQuizSelect.value = 'with_quiz';
    const quizNotice = document.getElementById('quizModeNotice');
    if (quizNotice) quizNotice.style.display = 'none';

    // 12. Render initial pitch-black Phase 1 Workstation standby screen
    if (typeof window.renderPhaseScreen === 'function') {
      window.renderPhaseScreen(1);
    }
  }

  initSession(studentData) {
    // Reset BIOS & hardware state before starting new session
    if (window.biosController && typeof window.biosController.reset === 'function') {
      window.biosController.reset();
    }

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
    this.skipQuiz = !!(studentData && (studentData.skipQuiz === true || studentData.quizMode === 'without_quiz'));
    if (this.skipQuiz) {
      this.cognitiveScore = 0;
      this.recordDiagnosticError({
        phase: 'عام',
        title: 'التقويم المعرفي المفاهيمي (الأسئلة النظرية MCQs)',
        errorChoice: 'تخطي الأسئلة التقويمية بطلب من التلميذ (-6.00 نقاط)',
        expectedChoice: 'خوض غمار الأسئلة التقويمية لاكتساب واختبار المفاهيم المجردة',
        rationale: 'تم تخطي الأسئلة بطلب من التلميذ فاعتُبرت إجاباتها ملغاة (0.00 / 6.00) والحد الأقصى للعلامة 14/20. يُوجَّه التلميذ لاختيار النمط الشامل لنيل العلامة الكاملة 20/20.'
      });
    }
    this.isCompleted = false;
    this.isSessionActive = true;

    // reset USB media to detached on new session
    this.selectedMedia = null;
    this.installationMedia = 'usb';
    this.isPowerOn = false;

    this.biosConfig = {
      tpm: false,
      secureBoot: false,
      firstBootDevice: 'Hard Drive (SSD)',
      savedWithF10: false
    };
    this.secondBootConfig = {
      firstBootDevice: 'USB Flash Drive',
      usbUnplugged: false,
      mediaUnplugged: false
    };
    this.partitionConfig = {
      gptCreated: false,
      selectedPartition: null,
      primaryFormattedNTFS: false
    };
    this.oobeConfig = {
      country: '',
      pcName: '',
      accountType: 'local',
      username: '',
      password: '',
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

    if (window.syncMonitorPowerLed) {
      window.syncMonitorPowerLed(false);
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
        expectedChoice: 'الإجراء الصحيح وفق المعايير التقنية',
        rationale: pedagogicalRemediation,
        timestamp: new Date().toLocaleTimeString()
      });
    }

    if (window.soundSynth) window.soundSynth.playWarning();
    this.updateHUD();
  }

  recordDiagnosticError(entry) {
    this.diagnosticErrors.push({
      phase: entry.phase !== undefined ? entry.phase : this.currentPhase,
      title: entry.title || `سؤال تقويمي في المرحلة ${this.currentPhase}`,
      errorChoice: entry.errorChoice || 'إجابة غير صحيحة',
      expectedChoice: entry.expectedChoice || 'الإجابة المعتمدة في المنهاج',
      rationale: entry.rationale || 'مفهوم تقني يحتاج لمراجعة وتوضيح',
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

    const quizBadge = document.getElementById('hudQuizModeBadge');
    if (quizBadge) {
      quizBadge.style.display = this.skipQuiz ? 'inline-flex' : 'none';
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
      penaltiesValEl.textContent = totalDed > 0 ? `-${totalDed.toFixed(2)}` : '0.00';
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

  getPhaseHint(phase) {
    const media = this.selectedMedia || this.installationMedia || 'usb';
    let mediaName = 'فلاش ديسك USB';
    let mediaRemovalAction = 'نزع مفتاح USB من المنفذ الأمامي';
    if (media === 'dvd') {
      mediaName = 'قرص DVD';
      mediaRemovalAction = 'إخراج قرص DVD من قارئ الأقراص';
    } else if (media === 'pxe') {
      mediaName = 'كابل الشبكة PXE';
      mediaRemovalAction = 'فصل كابل الشبكة من منفذ LAN';
    }

    if (phase === 1) {
      return 'المرحلة 1: شاشة العرض سوداء. اختر وسيط التثبيت من الرف على اليسار (فلاش ديسك USB أو قرص DVD أو كابل PXE)، واضغط زر التشغيل بالوحدة المركزية على اليمين، ثم اضغط سريعاً على [F2 أو Del] في لوحة المفاتيح الحقيقية لدخول البيوس قبل انقضاء المهلة (10 ثوانٍ).';
    }

    if (phase === 5) {
      if (media === 'usb') {
        return 'المرحلة 5: قسّم القرص (New) لإنشاء جدول GPT وأقسامه مع إمكانية تحديد الحجم المطلوب (أكبر من 64 GB). ⚠️ تنبيه بيداغوجي: التهيئة المنطقية (Logical Formatting) تعني اختيار نظام الملفات (File System) المناسب؛ ولتثبيت Windows 11 يجب اختيار القسم الأساسي الداخلي (Drive 0) وتنسيقه بنظام NTFS حصراً عبر زر Format قبل المتابعة. احذر اختيار الفلاش ديسك (Drive 1) كوسيط تثبيت لتفادي خصم النقاط.';
      } else {
        return 'المرحلة 5: قسّم القرص (New) لإنشاء جدول GPT وأقسامه مع إمكانية تحديد الحجم المطلوب (أكبر من 64 GB). ⚠️ تنبيه بيداغوجي: التهيئة المنطقية (Logical Formatting) تعني اختيار نظام الملفات (File System) المناسب؛ ولتثبيت Windows 11 يجب اختيار القسم الأساسي الداخلي (Drive 0) وتنسيقه بنظام NTFS حصراً عبر زر Format قبل المتابعة.';
      }
    }

    if (phase === 6) {
      return `المرحلة 6 (المرحلة الأولى لتنصيب النظام - نقل ونسخ الملفات): يقوم برنامج الإعداد بنسخ وتثبيت ملفات الويندوز من وسيط التثبيت (${mediaName}) إلى القرص الصلب الداخلي SSD. بعد اكتمال النسخ وبدء إعادة التشغيل، ادخل البيوس بـ [F2/Del] وأعد SSD كإقلاع أول واحفظ بـ [F10]، ثم انقر على وسيط التثبيت في الوحدة المركزية (${mediaRemovalAction}) فيزيائياً لكسر حلقة الإقلاع التكرارية.`;
    }

    return this.phaseHints[phase] || 'تابع تنفيذ الخطوة الحالية بدقة.';
  }

  updateHintBar() {
    const hintTextEl = document.getElementById('hintBarText');
    if (hintTextEl) {
      hintTextEl.textContent = this.getPhaseHint(this.currentPhase);
    }
    const vkbKeyEl = document.getElementById('vkbKeyHint');
    if (vkbKeyEl && this.phaseVkbHints) {
      vkbKeyEl.textContent = this.phaseVkbHints[this.currentPhase] || 'لوحة المفاتيح';
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
    if (cogScore) {
      cogScore.innerHTML = this.skipQuiz
        ? `${this.cognitiveScore.toFixed(2)} / 6.00 <span style="font-size: 11px; color: #ef4444; font-weight: normal;">(تم تخطي الأسئلة: -6.00)</span>`
        : `${this.cognitiveScore.toFixed(2)} / 6.00`;
    }
    if (pracScore) pracScore.textContent = `${this.practicalScore.toFixed(2)} / 14.00`;

    const skipNotice = document.getElementById('finaleQuizSkipNotice');
    if (skipNotice) {
      skipNotice.style.display = this.skipQuiz ? 'block' : 'none';
    }

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
window.resetSessionState = function() {
  if (window.stateEngine) {
    window.stateEngine.resetSessionState();
  }
};
