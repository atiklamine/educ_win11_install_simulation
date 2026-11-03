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

  // Helper: Clean filename string (replace illegal chars with '-', multiple spaces with '_')
  cleanFilenamePart(str, fallback = 'unknown') {
    if (!str || typeof str !== 'string' || !str.trim()) return fallback;
    let cleaned = String(str)
      .replace(/[\\/:*?"<>|]/g, '-')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[.\s]+$/g, '');
    return cleaned || fallback;
  }

  buildReportPayload() {
    const se = window.stateEngine;
    const score = se.getCalculatedScore();
    const apprec = se.getAppreciation(score);
    const settings = (window.settingsManager && window.settingsManager.getSettings()) || {};

    // Calculate competency scores (out of 5.00 each)
    let compBios = 5.00;
    let compPart = 5.00;
    let compPriv = 5.00;
    let compBoot = 5.00;

    se.penalties.forEach(p => {
      if (p.phase === 1 || p.phase === 2) compBios = Math.max(0, compBios - p.deduction);
      if (p.phase === 3 || p.phase === 4 || p.phase === 5) compPart = Math.max(0, compPart - p.deduction);
      if (p.phase === 7) compPriv = Math.max(0, compPriv - p.deduction);
      if (p.phase === 6 || p.phase === 8) compBoot = Math.max(0, compBoot - p.deduction);
    });

    const now = new Date();
    const mins = Math.floor(se.elapsedSeconds / 60);
    const secs = se.elapsedSeconds % 60;
    const displayTime = this.formatDisplayTime(se.elapsedSeconds);

    return {
      student: {
        firstName: se.student.firstName || 'مترشح',
        lastName: se.student.lastName || 'تلميذ',
        group: se.student.group || '1AS-01'
        // Session mode completely omitted as per Modification 6
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
      diagnosticLog: se.diagnosticErrors,
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
    const payload = this.buildReportPayload();
    const student = payload.student;
    const gradeStr = payload.evaluation.sortableGrade || '00.00';
    const timeStr = payload.evaluation.sortableTime || '00-00-00';
    const safeGroup = this.cleanFilenamePart(student.group, 'unknown');
    const safeLastName = this.cleanFilenamePart(student.lastName, 'unknown');
    const safeFirstName = this.cleanFilenamePart(student.firstName, 'unknown');

    // Strict formula: [group]_[grade]_[time]_[lastname]_[firstname].pdf (Max length <= 200)
    let baseFileName = `${safeGroup}_${gradeStr}_${timeStr}_${safeLastName}_${safeFirstName}`;
    if (baseFileName.length > 195) {
      baseFileName = baseFileName.substring(0, 195).replace(/[.\s_]+$/g, '');
    }
    const suggestedFileName = `${baseFileName}.pdf`;

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
          const openNow = confirm(
            `تم استخراج تقرير تقييم الكفاءة الرسمي بنجاح!\n\nاسم الملف: ${res.fileName}\nالمسار: ${res.filePath}\n\nهل ترغب في فتح مكان الملف الآن؟`
          );
          if (openNow && window.electronAPI.showInFolder) {
            window.electronAPI.showInFolder(res.filePath);
          }
        } else {
          alert('تعذر استخراج ملف PDF: ' + (res.error || 'خطأ غير معروف'));
        }
      } catch (err) {
        alert('حدث خطأ أثناء استخراج التقرير: ' + err.message);
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

