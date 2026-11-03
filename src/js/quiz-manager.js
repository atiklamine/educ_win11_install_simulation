/**
 * QuizManager - Assessment Engine for Conceptual & Cognitive MCQs
 * Features:
 * - Fisher-Yates option shuffling
 * - Strictly balanced option lengths to prevent guessing
 * - Multi-attempt penalty grading (Impossible to get full point on retry)
 * - Detailed diagnostic misconception logging
 */
class QuizManager {
  constructor() {
    this.questionsData = null;
    this.currentQuestion = null;
    this.currentBankKey = null;
    this.onQuizCompleteCallback = null;
    this.attempts = 0;
    this.selectedOptionIndex = null;
    this.startTime = 0;

    // Embedded fallback questions ensuring 100% offline reliability without HTTP
    this.fallbackData = {
      bank_first_boot: [
        {
          id: 'boot_q01',
          prompt: 'ما هو الهدف الأساسي من اختبار التشغيل الذاتي الأولي (POST) عند تشغيل الحاسوب؟',
          correct: 'فحص سلامة المكونات المادية الأساسية والتأكد من جاهزيتها',
          distractors: [
            'تثبيت برامج التشغيل الضرورية للبطاقة الرسومية في الذاكرة',
            'تنسيق وتجهيز ملفات النظام لاستقبال برامج التطبيقات فورا',
            'تنظيف الذاكرة العشوائية من الشحنات الكهربائية الزائدة كليا'
          ],
          rationale: 'اختبار POST ينفذه الـ BIOS/UEFI فور التشغيل للتأكد من سلامة المعالج والذاكرة واللوحة الأم قبل محاولة الإقلاع.'
        }
      ],
      bank_bios: [
        {
          id: 'bios_q01',
          prompt: 'ما هي الوظيفة الأساسية لشريحة الأمان (TPM 2.0) المشروطة لتنصيب Windows 11؟',
          correct: 'تأمين مفاتيح التشفير وحماية سلامة إقلاع النظام من التلاعب',
          distractors: [
            'تسريع معالجة الرسوم وتحسين استجابة الألعاب الثلاثية الأبعاد',
            'ضغط وتخزين البيانات لتوفير المساحة المطلوبة للقرص التخزيني',
            'تحديث البرامج الثابتة تلقائياً عبر منافذ الشبكة المحلية فورا'
          ],
          rationale: 'شريحة TPM 2.0 مسؤولة عن التشفير المادي الموثوق مثل BitLocker وضمان عدم العبث بملفات الإقلاع الحساسة.'
        }
      ],
      bank_partition: [
        {
          id: 'part_q01',
          prompt: 'لماذا يُشترط تهيئة قسم النظام الأساسي بنظام الملفات NTFS عند تثبيت ويندوز؟',
          correct: 'لدعم الصلاحيات الأمنية والملفات الضخمة وموثوقية تخزين البيانات',
          distractors: [
            'لزيادة سرعة معالجة الفيديو وتقليص زمن الإقلاع الأولي للعتاد كليا',
            'لتوزيع مساحة التخزين بين المنافذ الطرفية ووحدات الذاكرة الرئيسية',
            'لتجنب استهلاك الطاقة الزائدة أثناء تشغيل البرمجيات المكتبية دوما'
          ],
          rationale: 'نظام NTFS ضروري لويندوز الحديث لتوفير حماية أمنية للملفات (ACLs)، دعم السجلات Journaling، والتعامل مع الملفات الكبيرة.'
        }
      ],
      bank_second_boot: [
        {
          id: 'sboot_q01',
          prompt: 'ما هو السبب الحتمي لإعادة ضبط إقلاع القرص الداخلي ونزع الفلاشة بعد نسخ الملفات؟',
          correct: 'لتفادي الوقوع في حلقة إعادة التثبيت والتأكد من مواصلة الإعداد',
          distractors: [
            'لحماية الذاكرة العشوائية من ارتفاع درجة الحرارة أثناء الإقلاع',
            'لمسح سجلات الأخطاء المؤقتة المتبقية على وسيط التخزين الخارجي',
            'لتفريغ الشحنات الكهربائية الساكنة العالقة بمنافذ التوصيل فورا'
          ],
          rationale: 'إذا تركت الفلاشة كإقلاع أول، سيعيد الحاسوب قراءة برنامج التثبيت من البداية ويدخل في حلقة تكرار لانهائية.'
        }
      ],
      bank_oobe: [
        {
          id: 'oobe_q01',
          prompt: 'لماذا يُوصى بتعطيل كافة خيارات التتبع والتشخيص الإعلانية أثناء مرحلة OOBE؟',
          correct: 'لحماية خصوصية بيانات التلميذ وتفادي استهلاك موارد الشبكة عبثاً',
          distractors: [
            'لتسريع معالجة العمليات الحسابية وتوفير مساحة الذاكرة المخبأة كليا',
            'لمنع تلف ملفات التسجيل ومنع تعارض برامج التشغيل أثناء العمل دوماً',
            'لضمان إيقاف تشغيل الشاشة تلقائياً بعد انقضاء زمن الحصة المدرسية'
          ],
          rationale: 'في بيئة المخابر المدرسية، يعد تعطيل التتبع ضرورة لحماية سرية بيانات المتعلمين وترشيد النطاق الترددي للشبكة.'
        }
      ],
      bank_final: [
        {
          id: 'final_q01',
          prompt: 'ما هو الدليل القاطع على نجاح تنصيب نظام التشغيل بصورة مكتملة ومستقلة؟',
          correct: 'إقلاع الحاسوب مباشرة من القرص الصلب الداخلي دون أي وسائط خارجية',
          distractors: [
            'ظهور شاشة الإعدادات الزرقاء دون المطالبة بإدخال مفتاح التنشيط أبدا',
            'تطابق لغة واجهة العرض مع التوقيت الإقليمي المختار أثناء مرحلة البدء',
            'تثبيت كافة البرمجيات التطبيقية تلقائياً دون الحاجة لاتصال بالإنترنت'
          ],
          rationale: 'الإقلاع الذاتي النظيف من القرص الصلب الداخلي يؤكد اكتمال تثبيت النواة ومحمل الإقلاع وسلامة التجزئة واستقلالية النظام.'
        }
      ]
    };
  }

  async loadQuestions() {
    try {
      const resp = await fetch('data/questions.json');
      if (resp.ok) {
        this.questionsData = await resp.json();
      } else {
        this.questionsData = this.fallbackData;
      }
    } catch {
      this.questionsData = this.fallbackData;
    }
  }

  // Fisher-Yates shuffle algorithm
  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  showQuizForBank(bankKey, onComplete) {
    if (window.stateEngine && window.stateEngine.skipQuiz) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    this.currentBankKey = bankKey;
    this.onQuizCompleteCallback = onComplete;
    this.attempts = 0;
    this.selectedOptionIndex = null;
    this.startTime = Date.now();

    const bank = (this.questionsData && this.questionsData[bankKey]) || this.fallbackData[bankKey];
    if (!bank || bank.length === 0) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    // Pick random question from bank
    const qIndex = Math.floor(Math.random() * bank.length);
    const rawQuestion = bank[qIndex];

    // Build balanced options array
    const options = [
      { text: rawQuestion.correct, isCorrect: true },
      ...rawQuestion.distractors.map(d => ({ text: d, isCorrect: false }))
    ];

    // Shuffle options so correct is random
    const shuffled = this.shuffleArray(options);

    this.currentQuestion = {
      ...rawQuestion,
      options: shuffled
    };

    this.renderQuizModal();
  }

  renderQuizModal() {
    const modal = document.getElementById('quizModal');
    if (!modal) return;

    const promptEl = document.getElementById('quizPromptText');
    const optionsContainer = document.getElementById('quizOptionsContainer');
    const feedbackBox = document.getElementById('quizFeedbackBox');
    const submitBtn = document.getElementById('quizSubmitBtn');
    const attemptBadge = document.getElementById('quizAttemptBadge');

    if (promptEl) promptEl.textContent = this.currentQuestion.prompt;
    if (feedbackBox) {
      feedbackBox.className = 'quiz-feedback hidden';
      feedbackBox.textContent = '';
    }
    if (attemptBadge) {
      attemptBadge.textContent = `المحاولة رقم: ${this.attempts + 1}`;
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'تأكيد الإجابة';
      submitBtn.onclick = () => this.handleSubmit();
    }

    if (optionsContainer) {
      optionsContainer.innerHTML = '';
      this.currentQuestion.options.forEach((opt, idx) => {
        const optBtn = document.createElement('button');
        optBtn.className = 'quiz-option-btn';
        optBtn.setAttribute('data-index', idx);
        optBtn.innerHTML = `
          <span class="quiz-option-letter">${['أ', 'ب', 'ج', 'د'][idx]}</span>
          <span class="quiz-option-text">${opt.text}</span>
        `;

        optBtn.addEventListener('click', () => {
          if (window.soundSynth) window.soundSynth.playClick();
          optionsContainer.querySelectorAll('.quiz-option-btn').forEach(b => b.classList.remove('selected'));
          optBtn.classList.add('selected');
          this.selectedOptionIndex = idx;
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.onclick = () => this.handleSubmit();
          }
        });

        optionsContainer.appendChild(optBtn);
      });
    }

    modal.classList.add('modal-visible');
    this.restoreFocus();
  }

  restoreFocus() {
    const modal = document.getElementById('quizModal');
    if (!modal || !modal.classList.contains('modal-visible')) return;

    const submitBtn = document.getElementById('quizSubmitBtn');
    if (submitBtn && !submitBtn.disabled) {
      submitBtn.focus();
      return;
    }

    const selectedOpt = modal.querySelector('.quiz-option-btn.selected');
    if (selectedOpt) {
      selectedOpt.focus();
      return;
    }

    const firstOpt = modal.querySelector('.quiz-option-btn');
    if (firstOpt) {
      firstOpt.focus();
    }
  }


  handleSubmit() {
    if (this.selectedOptionIndex === null) return;

    this.attempts++;
    const chosen = this.currentQuestion.options[this.selectedOptionIndex];
    const feedbackBox = document.getElementById('quizFeedbackBox');
    const submitBtn = document.getElementById('quizSubmitBtn');
    const attemptBadge = document.getElementById('quizAttemptBadge');

    if (attemptBadge) {
      attemptBadge.textContent = `المحاولة رقم: ${this.attempts}`;
    }

    if (chosen.isCorrect) {
      // Correct!
      let pointsAwarded = 0;
      if (this.attempts === 1) {
        pointsAwarded = 1.00; // full point
      } else if (this.attempts === 2) {
        pointsAwarded = 0.50; // partial
      } else {
        pointsAwarded = 0.25; // minimal
      }

      window.stateEngine.cognitiveScore += pointsAwarded;
      window.stateEngine.updateHUD();

      if (window.soundSynth) window.soundSynth.playSuccess();

      if (feedbackBox) {
        feedbackBox.className = 'quiz-feedback success';
        feedbackBox.innerHTML = `
          <strong>إجابة صحيحة! (+${pointsAwarded.toFixed(2)} نقطة)</strong>
          <p>${this.currentQuestion.rationale}</p>
        `;
      }

      if (submitBtn) {
        submitBtn.textContent = 'مواصلة المحاكاة ✔';
        submitBtn.onclick = () => {
          this.closeQuizModal();
          if (typeof this.onQuizCompleteCallback === 'function') {
            this.onQuizCompleteCallback();
          }
        };
      }
    } else {
      // Incorrect! Apply strict penalty and misconception recording
      const penalty = 0.50;
      window.stateEngine.recordPenalty(
        window.stateEngine.currentPhase,
        penalty,
        `إجابة خاطئة في السؤال التقويمي: "${chosen.text.slice(0, 35)}..."`,
        `الإجابة الصحيحة هي: "${this.currentQuestion.correct}". التعليل: ${this.currentQuestion.rationale}`
      );

      window.stateEngine.recordDiagnosticError({
        phase: window.stateEngine.currentPhase,
        title: this.currentQuestion.prompt,
        errorChoice: chosen.text,
        expectedChoice: this.currentQuestion.correct,
        rationale: this.currentQuestion.rationale
      });

      if (window.soundSynth) window.soundSynth.playWarning();

      if (feedbackBox) {
        feedbackBox.className = 'quiz-feedback warning';
        if (this.attempts >= 3) {
          feedbackBox.innerHTML = `
            <strong>إجابة خاطئة (استنفدت كافة المحاولات - تم خصم -${penalty.toFixed(2)} نقطة ونلت 0.00 في هذا السؤال).</strong>
            <p><strong>الإجابة الصحيحة:</strong> ${this.currentQuestion.correct}</p>
            <p>${this.currentQuestion.rationale}</p>
          `;
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'مواصلة المحاكاة';
            submitBtn.onclick = () => {
              this.closeQuizModal();
              if (typeof this.onQuizCompleteCallback === 'function') {
                this.onQuizCompleteCallback();
              }
            };
          }
        } else {
          feedbackBox.innerHTML = `
            <strong>إجابة خاطئة (تم خصم -${penalty.toFixed(2)} نقطة من العلامة النهائية).</strong>
            <p>حاول مجدداً للتعرف على المفهوم الدقيق، مع العلم أن أقصى علامة ممكنة في هذا السؤال الآن هي ${this.attempts === 1 ? '0.50' : '0.25'} نقطة.</p>
          `;
          this.selectedOptionIndex = null;
          if (submitBtn) submitBtn.disabled = true;
          const opts = document.querySelectorAll('.quiz-option-btn');
          opts.forEach(b => b.classList.remove('selected'));
        }
      }
    }
  }

  closeQuizModal() {
    const modal = document.getElementById('quizModal');
    if (modal) modal.classList.remove('modal-visible');
    const submitBtn = document.getElementById('quizSubmitBtn');
    if (submitBtn) {
      submitBtn.onclick = () => this.handleSubmit();
    }
  }
}

// Global instance
window.quizManager = new QuizManager();
