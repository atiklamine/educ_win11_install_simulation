/**
 * ReportPdf - Competency Assessment PDF Report Builder & IPC Handler
 * Exports official evaluation report formatted according to the Algerian Ministry of National Education
 */
class ReportPdf {
  // Helper: Format grade to fixed 2 digits before dot and 2 after dot (e.g. "05.50", "18.75", "20.00")
  formatSortableGrade(score) {
    const num = Math.max(0, Math.min(20, Number(score) || 0));
    const parts = num.toFixed(2).split('.');
    const intPart = parts[0].padStart(2, '0');
    const decPart = parts[1];
    return `${intPart}.${decPart}`;
  }

  // Helper: Format elapsed seconds to HH-MM-SS with leading zeros
  formatSortableTime(totalSeconds) {
    const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    return `${String(hours).padStart(2, '0')}-${String(minutes).padStart(2, '0')}-${String(seconds).padStart(2, '0')}`;
  }

  // Helper: Format elapsed seconds to standard display HH:MM:SS
  formatDisplayTime(totalSeconds) {
    const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  // Arabic transliteration map for generating portable, permitted ASCII filenames
  transliterateArabic(str) {
    if (!str || typeof str !== 'string') return '';
    const map = {
      'أ': 'A', 'إ': 'I', 'آ': 'A', 'ا': 'A', 'ب': 'B', 'ت': 'T', 'ث': 'Th',
      'ج': 'J', 'ح': 'H', 'خ': 'Kh', 'د': 'D', 'ذ': 'Dh', 'ر': 'R', 'ز': 'Z',
      'س': 'S', 'ش': 'Ch', 'ص': 'S', 'ض': 'D', 'ط': 'T', 'ظ': 'Dh', 'ع': 'A',
      'غ': 'Gh', 'ف': 'F', 'ق': 'Q', 'ك': 'K', 'ل': 'L', 'م': 'M', 'ن': 'N',
      'ه': 'H', 'و': 'Ou', 'ي': 'Y', 'ى': 'A', 'ة': 'a', 'ء': '', 'ئ': 'y', 'ؤ': 'ou',
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    return str.split('').map(ch => map[ch] !== undefined ? map[ch] : ch).join('');
  }

  // Remove diacritical marks (accents) for clean French/Latin ASCII portability
  removeDiacritics(str) {
    if (!str || typeof str !== 'string') return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Convert name (first or last) to strictly permitted ASCII characters [A-Za-z0-9]
  toPermittedAsciiName(str, fallback = 'Eleve') {
    if (!str || typeof str !== 'string' || !str.trim()) return fallback;
    let s = str.trim();
    s = this.removeDiacritics(s);
    s = this.transliterateArabic(s);
    s = s.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return s || fallback;
  }

  // Convert section / class group and optional PC workstation to strictly permitted ASCII
  toPermittedAsciiSection(groupStr, pcStr) {
    let g = (groupStr || '').trim();
    // 1. Strip parenthesized Arabic / description (e.g. "(جذع مشترك علوم)")
    g = g.replace(/\(.*?\)/g, '').trim();

    // 2. Extract leading alphanumeric/code pattern like "1AS-01", "2AS-GE", "TC-1"
    let sectionCode = '';
    const codeMatch = g.match(/^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*/);
    if (codeMatch) {
      sectionCode = codeMatch[0];
    } else {
      g = this.removeDiacritics(g);
      g = this.transliterateArabic(g);
      sectionCode = g.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    if (!sectionCode) sectionCode = '1AS';

    // 3. Workstation / PC number handling (e.g. "حاسوب 05", "PC05", "05")
    let pcSuffix = '';
    if (pcStr && typeof pcStr === 'string' && pcStr.trim()) {
      const numMatch = pcStr.match(/\d+/);
      if (numMatch) {
        const pcNum = numMatch[0].padStart(2, '0');
        if (!new RegExp(`PC0*${parseInt(pcNum, 10)}\\b`, 'i').test(sectionCode)) {
          pcSuffix = `-PC${pcNum}`;
        }
      }
    }

    return `${sectionCode}${pcSuffix}`;
  }

  // Build standard casual filename: [Section]_[EvaluationNote]_[Time]_[FirstName]_[LastName].pdf
  generateReportFilename(student, evaluation) {
    student = student || {};
    evaluation = evaluation || {};
    const cleanSection = this.toPermittedAsciiSection(student.group, student.pcNumber);
    const gradeStr = evaluation.sortableGrade || '00.00';
    const timeStr = evaluation.sortableTime || '00-00-00';
    const cleanFirstName = this.toPermittedAsciiName(student.firstName, 'Eleve');
    const cleanLastName = this.toPermittedAsciiName(student.lastName, 'Nom');

    let baseFileName = `${cleanSection}_${gradeStr}_${timeStr}_${cleanFirstName}_${cleanLastName}`;
    // Strictly enforce permitted characters [A-Za-z0-9_.-]
    baseFileName = baseFileName.replace(/[^A-Za-z0-9_.-]/g, '_').replace(/_+/g, '_');
    if (baseFileName.length > 195) {
      baseFileName = baseFileName.substring(0, 195).replace(/[.\s_]+$/g, '');
    }
    return `${baseFileName}.pdf`;
  }

  // Legacy helper: Clean filename string
  cleanFilenamePart(str, fallback = 'unknown') {
    return this.toPermittedAsciiName(str, fallback);
  }

  buildReportPayload() {
    const se = window.stateEngine;
    const score = se.getCalculatedScore();
    const apprec = se.getAppreciation(score);
    const settings = (window.settingsManager && window.settingsManager.getSettings()) || {};

    // Calculate progressive competency scores (out of 5.00 each)
    const cp = se.completedPhases || new Set();
    const weights = se.phaseWeights || { 1: 1.50, 2: 1.50, 3: 1.00, 4: 1.00, 5: 2.00, 6: 1.50, 7: 4.00, 8: 1.50 };
    const qs = se.quizScores || {};

    const getPhaseDeductions = (phases) => {
      return se.penalties
        .filter(p => phases.includes(p.phase))
        .reduce((sum, p) => sum + (Number(p.deduction) || 0), 0);
    };

    // Competency 1: BIOS/UEFI Configuration (Max: 5.00)
    // Practical: Phase 1 (1.50) + Phase 2 (1.50) = 3.00 max
    // Cognitive: bank_first_boot (1.00) + bank_bios (1.00) = 2.00 max
    const compBiosPrac = (cp.has(1) ? weights[1] : 0) + (cp.has(2) ? weights[2] : 0);
    const compBiosCog = (qs.bank_first_boot || 0) + (qs.bank_bios || 0);
    const compBios = Math.max(0, Math.min(5.00, parseFloat((compBiosPrac + compBiosCog - getPhaseDeductions([1, 2])).toFixed(2))));

    // Competency 2: Partitioning & Filesystem (Max: 5.00)
    // Practical: Phase 3 (1.00) + Phase 4 (1.00) + Phase 5 (2.00) = 4.00 max
    // Cognitive: bank_partition (1.00) = 1.00 max
    const compPartPrac = (cp.has(3) ? weights[3] : 0) + (cp.has(4) ? weights[4] : 0) + (cp.has(5) ? weights[5] : 0);
    const compPartCog = (qs.bank_partition || 0);
    const compPart = Math.max(0, Math.min(5.00, parseFloat((compPartPrac + compPartCog - getPhaseDeductions([3, 4, 5])).toFixed(2))));

    // Competency 3: Privacy & User Setup (Max: 5.00)
    // Practical: Phase 7 (4.00) = 4.00 max
    // Cognitive: bank_oobe (1.00) = 1.00 max
    const compPrivPrac = (cp.has(7) ? weights[7] : 0);
    const compPrivCog = (qs.bank_oobe || 0);
    const compPriv = Math.max(0, Math.min(5.00, parseFloat((compPrivPrac + compPrivCog - getPhaseDeductions([7])).toFixed(2))));

    // Competency 4: Clean Independent SSD Boot (Max: 5.00)
    // Practical: Phase 6 (1.50) + Phase 8 (1.50) = 3.00 max
    // Cognitive: bank_second_boot (1.00) + bank_final (1.00) = 2.00 max
    const compBootPrac = (cp.has(6) ? weights[6] : 0) + (cp.has(8) ? weights[8] : 0);
    const compBootCog = (qs.bank_second_boot || 0) + (qs.bank_final || 0);
    const compBoot = Math.max(0, Math.min(5.00, parseFloat((compBootPrac + compBootCog - getPhaseDeductions([6, 8])).toFixed(2))));

    const now = new Date();
    const mins = Math.floor(se.elapsedSeconds / 60);
    const secs = se.elapsedSeconds % 60;
    const displayTime = this.formatDisplayTime(se.elapsedSeconds);

    // Ensure all penalties and deductions are represented in diagnosticLog with full pedagogical details
    const fullDiagnosticLog = [...se.diagnosticErrors];
    if (cp.size < se.totalPhases) {
      const missingPhases = [];
      for (let i = 1; i <= se.totalPhases; i++) {
        if (!cp.has(i)) missingPhases.push(`م ${i}`);
      }
      fullDiagnosticLog.push({
        phase: 'عام',
        title: 'إنهاء مبكر / مهام ومراحل غير منجزة',
        errorChoice: `توقف عند المرحلة ${se.currentPhase} (المراحل غير المنجزة: ${missingPhases.join('، ')})`,
        expectedChoice: 'إنجاز كافة المراحل الثمانية للتثبيت النظيف حتى سطح المكتب',
        rationale: 'مُنحت علامة (0.00) لكافة المراحل والأسئلة غير المنجزة؛ يُشترط إتمام جميع الإجراءات العملية ونيل أسئلتها التقييمية لاكتساب الكفاءات.',
        deduction: 0,
        timestamp: new Date().toLocaleTimeString()
      });
    }
    if (Array.isArray(se.penalties)) {
      se.penalties.forEach(p => {
        if (!p || p.phase === 'عام' || p.phase === 'شامل' || String(p.reason).includes('تخطي الأسئلة')) return;
        const exists = fullDiagnosticLog.some(d => 
          d.phase === p.phase && (
            (d.errorChoice && d.errorChoice.includes(p.reason)) ||
            (d.title && d.title.includes(p.reason))
          )
        );
        if (!exists) {
          const deductionText = p.deduction ? ` (-${Number(p.deduction).toFixed(2)} ن)` : '';
          fullDiagnosticLog.push({
            phase: p.phase,
            title: `خطأ إجرائي في المرحلة ${p.phase}${deductionText}`,
            errorChoice: `${p.reason}${deductionText}`,
            expectedChoice: 'الإجراء التقني السليم وفق المعايير',
            rationale: 'مخالفة للإجراء العملي المعتمد في هذه المرحلة تستوجب مراجعة التوجيهات البيداغوجية للأستاذ.',
            deduction: p.deduction,
            timestamp: p.timestamp || new Date().toLocaleTimeString()
          });
        }
      });
    }

    return {
      student: {
        firstName: se.student.firstName || 'مترشح',
        lastName: se.student.lastName || 'تلميذ',
        group: se.student.group || '1AS-01',
        pcNumber: se.student.pcNumber || 'حاسوب 01'
      },
      skipQuiz: !!se.skipQuiz,
      institution: {
        ministry: 'الجمهورية الجزائرية الديمقراطية الشعبية',
        department: 'وزارة التربية الوطنية',
        name: settings.institution || 'ثانوية مخبر الإعلام الآلي',
        schoolYear: settings.school_year || '2025/2026',
        teacherName: (settings.teacher && settings.teacher.full_name) || 'أستاذ مادة المعلوماتية',
        level: 'السنة الأولى ثانوي (1AS) - جذع مشترك علوم وتكنولوجيا / آداب',
        unit: 'الوحدة التعليمية: نظام التشغيل (المقاربة بالكفاءات)'
      },
      evaluation: {
        totalScore: score.toFixed(2),
        sortableGrade: this.formatSortableGrade(score),
        maxScore: '20.00',
        displayTime: displayTime,
        sortableTime: this.formatSortableTime(se.elapsedSeconds),
        skipQuiz: !!se.skipQuiz,
        isCompleted: se.isCompleted && cp.size === se.totalPhases,
        completedCount: cp.size,
        totalPhases: se.totalPhases,
        cognitiveScore: se.cognitiveScore.toFixed(2),
        practicalScore: se.practicalScore.toFixed(2),
        appreciation: apprec.text,
        appreciationClass: apprec.class,
        competencies: [
          {
            name: 'كفاءة إعداد العتاد وضبط البيوس (BIOS/UEFI Configuration)',
            score: compBios.toFixed(2),
            max: '5.00',
            description: 'سلامة ربط الوسائط، مقاطعة الإقلاع الأولي، وتفعيل TPM 2.0 و Secure Boot وترتيب الإقلاع.'
          },
          {
            name: 'كفاءة التجزئة المنطقية ونظم الملفات (Partitioning & Filesystem)',
            score: compPart.toFixed(2),
            max: '5.00',
            description: 'إنشاء جدول أقسام GPT، التهيئة الإلزامية بـ NTFS للقسم الأساسي، واختيار النسخة المناسبة.'
          },
          {
            name: 'كفاءة الإعداد وتأمين الخصوصية الرقمية (Privacy & User Setup)',
            score: compPriv.toFixed(2),
            max: '5.00',
            description: 'إنشاء حساب محلي مستقل للمخبر، وحماية بيانات المتعلم بتعطيل كافة خيارات التتبع السبعة.'
          },
          {
            name: 'كفاءة الإقلاع الذاتي المستقل (Clean Independent SSD Boot)',
            score: compBoot.toFixed(2),
            max: '5.00',
            description: 'التحقق من إقلاع نظام التشغيل ذاتياً وبصورة نظيفة ومستقلة مباشرة من القرص الصلب الداخلي (SSD).'
          }
        ]
      },
      diagnosticLog: fullDiagnosticLog,
      penalties: [
        ...(se.skipQuiz ? [{ phase: 'عام', reason: 'تخطي الأسئلة التقويمية بطلب من التلميذ (خصم كامل الجانب المعرفي)', deduction: 6.00 }] : []),
        ...se.penalties
      ],
      sessionMeta: {
        date: now.toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' }),
        time: now.toLocaleTimeString('ar-DZ'),
        duration: `${mins} دقيقة و ${secs} ثانية`,
        displayTime: displayTime,
        elapsedSeconds: se.elapsedSeconds
      },
      developer: {
        title: 'أستاذ مادة المعلوماتية - الأغواط',
        email: 'hadj.aissa.informatique@gmail.com'
      }
    };
  }

  async exportPdf() {
    const se = window.stateEngine;
    if (se && !se.isCompleted && se.completedPhases.size < se.totalPhases) {
      const confirmExport = (typeof window.showPedagogicalConfirm === 'function')
        ? await window.showPedagogicalConfirm({
            title: 'تنبيه بيداغوجي: استخراج مبكر للتقرير',
            icon: '⚠️',
            message: `أنت حالياً في المرحلة (${se.currentPhase}) ولم تكتمل بعد كافة مراحل تنصيب النظام (المراحل المنجزة: ${se.completedPhases.size} من أصل ${se.totalPhases}).`,
            details: 'استخراج التقرير الآن سيُعتبر إنهاءً مبكراً للمحاكاة، ولن تتحصل على علامة المراحل والأسئلة المتبقية غير المنجزة (0.00).\n\nهل أنت متأكد من رغبتك في إنهاء المحاكاة الآن واستخراج التقرير غير المكتمل؟',
            confirmText: 'نعم، استخراج التقرير غير المكتمل ⚠️',
            cancelText: 'إلغاء ومواصلة المحاكاة ✔',
            isDanger: true
          })
        : confirm(`تنبيه بيداغوجي هام:\n\nأنت حالياً في المرحلة (${se.currentPhase}) ولم تكتمل بعد كافة مراحل تنصيب النظام.\nهل ترغب في إنهاء المحاكاة الآن واستخراج التقرير؟`);
      if (!confirmExport) {
        return;
      }
      se.isCompleted = true;
      se.stopTimer();
      se.updateHUD();
    }

    const payload = this.buildReportPayload();
    // Standard casual permitted ASCII filename: [Section]_[EvaluationNote]_[Time]_[FirstName]_[LastName].pdf
    const suggestedFileName = this.generateReportFilename(payload.student, payload.evaluation);

    if (window.electronAPI && typeof window.electronAPI.savePdfReport === 'function') {
      try {
        const btn = document.getElementById('btnExportPdf');
        const originalText = btn ? btn.textContent : '';
        if (btn) {
          btn.textContent = 'جاري استخراج وثيقة PDF...';
        }

        const res = await window.electronAPI.savePdfReport({
          payload: payload,
          fileName: suggestedFileName
        });

        if (btn) {
          btn.textContent = originalText || 'تصدير PDF';
        }

        if (res && res.success) {
          if (window.soundSynth) window.soundSynth.playSuccess();
          const openNow = (typeof window.showPedagogicalConfirm === 'function')
            ? await window.showPedagogicalConfirm({
                title: 'تم استخراج وثيقة التقييم بنجاح',
                icon: '📄',
                message: 'تم استخراج تقرير تقييم الكفاءة الرسمي وحفظه مباشرة على سطح المكتب بنجاح!',
                details: `اسم الملف: ${res.fileName}\nالمسار: ${res.filePath}\n\nهل ترغب في فتح مكان الملف الآن؟`,
                confirmText: 'فتح مكان الملف (المجلد) 📁',
                cancelText: 'إغلاق ومتابعة ✔',
                isDanger: false
              })
            : confirm(`تم استخراج تقرير تقييم الكفاءة الرسمي بنجاح!\n\nاسم الملف: ${res.fileName}\nالمسار: ${res.filePath}\n\nهل ترغب في فتح مكان الملف الآن؟`);
          if (openNow && window.electronAPI.showInFolder) {
            window.electronAPI.showInFolder(res.filePath);
          }
        } else {
          if (typeof window.showPedagogicalAlert === 'function') {
            await window.showPedagogicalAlert({
              title: 'تعذر استخراج ملف PDF',
              icon: '❌',
              message: res.error || 'خطأ غير معروف أثناء استخراج التقرير.',
              okText: 'حسناً'
            });
          } else {
            alert('تعذر استخراج ملف PDF: ' + (res.error || 'خطأ غير معروف'));
          }
        }
      } catch (err) {
        if (typeof window.showPedagogicalAlert === 'function') {
          await window.showPedagogicalAlert({
            title: 'خطأ أثناء استخراج التقرير',
            icon: '⚠️',
            message: err.message,
            okText: 'حسناً'
          });
        } else {
          alert('حدث خطأ أثناء استخراج التقرير: ' + err.message);
        }
      }
    } else {
      // Browser fallback (e.g. GitHub Pages / Web Browser)
      try {
        const resp = await fetch('../report/report-template.html');
        if (resp.ok) {
          const htmlText = await resp.text();
          const printWin = window.open('', '_blank');
          if (printWin) {
            printWin.document.open();
            printWin.document.write(htmlText);
            printWin.document.close();
            try {
              printWin.document.title = suggestedFileName.replace(/\.pdf$/i, '');
            } catch (e) {}
            printWin.onload = () => {
              try {
                if (typeof printWin.__injectReport === 'function') {
                  printWin.__injectReport(payload);
                }
              } catch (e) {
                console.error('Error injecting report into print window:', e);
              }
              setTimeout(() => {
                printWin.focus();
                printWin.print();
              }, 400);
            };
            return;
          }
        }
      } catch (err) {
        console.warn('Could not load separate report template, falling back to window.print():', err);
      }
      window.print();
    }
  }
}

// Global instance
window.reportPdf = new ReportPdf();

