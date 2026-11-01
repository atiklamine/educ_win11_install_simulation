/**
 * BiosController - Classic Aptio Setup Utility & POST Interrupt Simulator
 * Features:
 * - 10-second POST countdown with F2/DEL interrupt rule (-1.0 pt penalty if missed)
 * - Classic blue Aptio BIOS (#0000aa) with tabs: Main, Advanced, Chipset, Boot, Security, Save & Exit
 * - Strict F10-ONLY verification
 * - Flexible .includes() matching for boot media
 * - Realistic "No bootable device found" error upon improper boot priority
 * - Phase 6 secondary boot loop breaker (restore SSD priority)
 */
class BiosController {
  constructor() {
    this.activeTab = 'Main';
    this.postTimer = null;
    this.postSecondsLeft = 10;
    this.postInterrupted = false;

    // BIOS State
    this.settings = {
      tpm: false,
      secureBoot: false,
      firstBootDevice: 'Hard Drive (SSD)',
      secondBootDevice: 'USB Flash Drive',
      selectedItemIndex: 0
    };

    this.tabs = ['Main', 'Advanced', 'Chipset', 'Boot', 'Security', 'Save & Exit'];
  }

  // Restore BIOS to initial factory defaults
  reset() {
    if (this.postTimer) {
      clearInterval(this.postTimer);
      this.postTimer = null;
    }
    if (this._currentPostKeyHandler) {
      window.removeEventListener('keydown', this._currentPostKeyHandler);
      this._currentPostKeyHandler = null;
    }
    this.activeTab = 'Main';
    this.postSecondsLeft = 10;
    this.postInterrupted = false;
    this.isSecondBoot = false;
    this.onSecondBootSuccess = null;

    this.settings = {
      tpm: false,
      secureBoot: false,
      firstBootDevice: 'Hard Drive (SSD)',
      secondBootDevice: 'USB Flash Drive',
      selectedItemIndex: 0
    };
  }

  // --- PHASE 1: POST SCREEN & 10s COUNTDOWN ---
  startPostCountdown(onSuccessInterrupt, onTimeoutFail) {
    this.postSecondsLeft = 10;
    this.postInterrupted = false;

    const timerSpan = document.getElementById('postCountdownSpan');
    if (timerSpan) timerSpan.textContent = this.postSecondsLeft;

    if (this.postTimer) clearInterval(this.postTimer);

    if (window.soundSynth) window.soundSynth.playPower();

    this.postTimer = setInterval(() => {
      this.postSecondsLeft--;
      if (timerSpan) timerSpan.textContent = this.postSecondsLeft;

      if (this.postSecondsLeft <= 0) {
        clearInterval(this.postTimer);
        this.postTimer = null;

        if (!this.postInterrupted) {
          // Student missed the 10-second interrupt window!
          window.stateEngine.recordPenalty(
            1,
            1.00,
            'فاتتك فرصة مقاطعة الإقلاع ودخول البيوس (انقضت 10 ثوانٍ دون الضغط على F2/Del)',
            'يجب مقاطعة الإقلاع بالضغط المتكرر على F2 أو Del فور ظهور شاشة POST لضبط ترتيب الإقلاع.'
          );
          if (typeof onTimeoutFail === 'function') onTimeoutFail();
        }
      }
    }, 1000);

    // Global Key Listener for F2, Delete, Suppr from real physical keyboard
    const handleKey = (e) => {
      const isF2 = e.key === 'F2' || e.code === 'F2' || e.keyCode === 113;
      const isDel = e.key === 'Delete' || e.key === 'Del' || e.key === 'Suppr' || e.key === 'Supp' || e.code === 'Delete' || e.keyCode === 46;
      if (isF2 || isDel) {
        e.preventDefault();
        window.removeEventListener('keydown', handleKey);
        this.interruptPost(onSuccessInterrupt);
      }
    };

    window.addEventListener('keydown', handleKey);
    this._currentPostKeyHandler = handleKey;
  }

  interruptPost(onSuccessInterrupt) {
    if (this.postInterrupted) return;
    this.postInterrupted = true;
    if (this.postTimer) {
      clearInterval(this.postTimer);
      this.postTimer = null;
    }
    if (this._currentPostKeyHandler) {
      window.removeEventListener('keydown', this._currentPostKeyHandler);
    }

    if (window.soundSynth) window.soundSynth.playBeep(880, 0.1);

    const postStatus = document.getElementById('postStatusMsg');
    if (postStatus) {
      postStatus.textContent = 'Entering Setup Utility... Please wait...';
      postStatus.style.color = '#38bdf8';
    }

    setTimeout(() => {
      if (typeof onSuccessInterrupt === 'function') onSuccessInterrupt();
    }, 600);
  }

  // --- PHASE 2: APTIO SETUP UTILITY ---
  initBiosScreen(containerId, isSecondBoot = false) {
    this.isSecondBoot = isSecondBoot;
    this.activeTab = isSecondBoot ? 'Boot' : 'Main';
    this.renderBiosUI(containerId);
    this.bindKeyboardNav();
  }

  renderBiosUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="aptio-bios-wrapper" id="aptioBiosWrapper">
        <div class="bios-header">
          <span class="bios-title">Aptio Setup Utility - Copyright (C) American Megatrends, Inc.</span>
        </div>

        <div class="bios-tabs-bar">
          ${this.tabs
            .map(
              t => `<button class="bios-tab-btn ${t === this.activeTab ? 'active' : ''}" data-tab="${t}">${t}</button>`
            )
            .join('')}
        </div>

        <div class="bios-body-layout">
          <div class="bios-main-pane" id="biosMainPane">
            ${this.renderTabContent(this.activeTab)}
          </div>
          <div class="bios-help-pane">
            <div class="help-box-title">Item Specific Help</div>
            <div class="help-box-text" id="biosHelpText">
              ${this.getHelpTextForTab(this.activeTab)}
            </div>
            <div class="bios-keys-guide">
              <p><span>&larr; &rarr;</span> Select Screen</p>
              <p><span>&uarr; &darr;</span> Select Item</p>
              <p><span>Enter</span> Select / Change</p>
              <p><span>F1</span> General Help</p>
              <p><span>F9</span> Optimized Defaults</p>
              <p class="highlight-key"><span>F10</span> Save and Exit</p>
              <p><span>ESC</span> Exit</p>
            </div>
          </div>
        </div>

        <div class="bios-footer">
          <span>Version 2.22.1284. Copyright (C) 2026 American Megatrends, Inc.</span>
        </div>
      </div>
    `;

    // Bind tab clicks
    container.querySelectorAll('.bios-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.soundSynth) window.soundSynth.playClick();
        this.activeTab = btn.getAttribute('data-tab');
        this.renderBiosUI(containerId);
      });
    });

    // Interactive item click/toggles
    this.bindInteractiveItems(container);
  }

  renderTabContent(tab) {
    if (tab === 'Main') {
      return `
        <div class="bios-group-title">System Information</div>
        <div class="bios-row"><span class="lbl">BIOS Version:</span><span class="val">ALGERIA-EDU v2.40</span></div>
        <div class="bios-row"><span class="lbl">Processor Type:</span><span class="val">Intel(R) Core(TM) i5-10400 CPU @ 2.90GHz</span></div>
        <div class="bios-row"><span class="lbl">Total Memory:</span><span class="val">8192 MB (DDR4)</span></div>
        <div class="bios-row"><span class="lbl">System Date:</span><span class="val">${new Date().toLocaleDateString('en-US')}</span></div>
        <div class="bios-row"><span class="lbl">System Time:</span><span class="val">${new Date().toLocaleTimeString()}</span></div>
        <div class="bios-row"><span class="lbl">Access Level:</span><span class="val">Administrator</span></div>
      `;
    }

    if (tab === 'Security') {
      return `
        <div class="bios-group-title">Security & Cryptographic Settings</div>
        <div class="bios-row interactive" id="rowTpm" data-action="toggle-tpm">
          <span class="lbl">TPM 2.0 Security Device</span>
          <span class="val clickable-toggle ${this.settings.tpm ? 'enabled' : 'disabled'}">[ ${this.settings.tpm ? 'Enabled' : 'Disabled'} ]</span>
        </div>
        <div class="bios-row interactive" id="rowSecureBoot" data-action="toggle-sb">
          <span class="lbl">Secure Boot State</span>
          <span class="val clickable-toggle ${this.settings.secureBoot ? 'enabled' : 'disabled'}">[ ${this.settings.secureBoot ? 'Enabled' : 'Disabled'} ]</span>
        </div>
        <div class="bios-row"><span class="lbl">Secure Boot Mode:</span><span class="val">Standard</span></div>
        <div class="bios-row"><span class="lbl">Platform Key (PK):</span><span class="val">Loaded</span></div>
      `;
    }

    if (tab === 'Boot') {
      return `
        <div class="bios-group-title">Boot Configuration & Device Priorities</div>
        <div class="bios-row"><span class="lbl">Boot Mode Select:</span><span class="val">[ UEFI ]</span></div>
        <div class="bios-row interactive" id="rowBoot1" data-action="change-boot1">
          <span class="lbl">1st Boot Device</span>
          <span class="val clickable-selector">[ ${this.settings.firstBootDevice} ]</span>
        </div>
        <div class="bios-row interactive" id="rowBoot2" data-action="change-boot2">
          <span class="lbl">2nd Boot Device</span>
          <span class="val clickable-selector">[ ${this.settings.secondBootDevice} ]</span>
        </div>
        <div class="bios-row"><span class="lbl">Fast Boot:</span><span class="val">[ Disabled ]</span></div>
        <div class="bios-row"><span class="lbl">USB Boot Support:</span><span class="val">[ Enabled ]</span></div>
      `;
    }

    if (tab === 'Advanced') {
      return `
        <div class="bios-group-title">Advanced CPU & Chipset Configurations</div>
        <div class="bios-row"><span class="lbl">Intel Virtualization Technology:</span><span class="val">[ Enabled ]</span></div>
        <div class="bios-row"><span class="lbl">SATA Mode Selection:</span><span class="val">[ AHCI ]</span></div>
        <div class="bios-row"><span class="lbl">ACPI Sleep State:</span><span class="val">[ S3 (Suspend to RAM) ]</span></div>
      `;
    }

    if (tab === 'Chipset') {
      return `
        <div class="bios-group-title">Chipset Host Bridge Parameters</div>
        <div class="bios-row"><span class="lbl">Primary Display:</span><span class="val">[ Auto ]</span></div>
        <div class="bios-row"><span class="lbl">Internal Graphics Memory:</span><span class="val">[ 64MB ]</span></div>
        <div class="bios-row"><span class="lbl">Audio Controller:</span><span class="val">[ Enabled ]</span></div>
      `;
    }

    if (tab === 'Save & Exit') {
      return `
        <div class="bios-group-title">Save & Exit Setup Options</div>
        <div class="bios-row interactive" id="rowSaveExit" data-action="save-exit">
          <span class="lbl highlight-opt">Save Changes and Exit</span>
          <span class="val">&gt;&gt;&gt;</span>
        </div>
        <div class="bios-row interactive" id="rowSaveReset" data-action="save-reset">
          <span class="lbl highlight-opt">Save Changes and Reset</span>
          <span class="val">&gt;&gt;&gt;</span>
        </div>
        <div class="bios-row interactive" id="rowDiscardExit" data-action="discard-exit">
          <span class="lbl">Discard Changes and Exit</span>
          <span class="val">&gt;&gt;&gt;</span>
        </div>
        <div class="bios-row interactive" id="rowDiscardChanges" data-action="discard-only">
          <span class="lbl">Discard Changes</span>
          <span class="val">&gt;&gt;&gt;</span>
        </div>
        <div class="bios-row"><span class="lbl">Restore Optimized Defaults (F9)</span><span class="val">&gt;&gt;&gt;</span></div>
      `;
    }

    return '';
  }

  getHelpTextForTab(tab) {
    if (tab === 'Security') {
      return 'Windows 11 requires both TPM 2.0 and Secure Boot to be strictly Enabled. Click on the item or press Enter to toggle.';
    }
    if (tab === 'Boot') {
      return 'Sets the system boot order. Use Enter to cycle through available devices: Hard Drive, USB Flash Drive, CD/DVD, PXE.';
    }
    if (tab === 'Save & Exit') {
      return 'Press F10 or select Save Changes and Exit to apply changes and reset system. Use Discard Changes to exit without saving.';
    }
    return 'Use &uarr; &darr; to navigate items, Enter to select, and F10 to save and exit.';
  }

  bindInteractiveItems(container) {
    // TPM Toggle
    const rowTpm = container.querySelector('#rowTpm');
    if (rowTpm) {
      rowTpm.addEventListener('click', () => {
        if (window.soundSynth) window.soundSynth.playClick();
        this.settings.tpm = !this.settings.tpm;
        this.renderBiosUI('virtualScreenContent');
      });
    }

    // Secure Boot Toggle
    const rowSb = container.querySelector('#rowSecureBoot');
    if (rowSb) {
      rowSb.addEventListener('click', () => {
        if (window.soundSynth) window.soundSynth.playClick();
        this.settings.secureBoot = !this.settings.secureBoot;
        this.renderBiosUI('virtualScreenContent');
      });
    }

    // Boot Order 1 Toggle
    const rowBoot1 = container.querySelector('#rowBoot1');
    if (rowBoot1) {
      const devices = [
        'Hard Drive (SSD)',
        'USB Flash Drive (Kingston 32GB)',
        'CD/DVD-ROM Drive (Setup Disc)',
        'Network PXE Boot'
      ];
      rowBoot1.addEventListener('click', () => {
        if (window.soundSynth) window.soundSynth.playClick();
        let idx = devices.indexOf(this.settings.firstBootDevice);
        idx = (idx + 1) % devices.length;
        this.settings.firstBootDevice = devices[idx];
        this.renderBiosUI('virtualScreenContent');
      });
    }

    // Prompt 4 Modification 7: Multi-method authentic BIOS save & exit
    const rowSaveExit = container.querySelector('#rowSaveExit');
    if (rowSaveExit) {
      rowSaveExit.addEventListener('click', () => {
        this.confirmSaveAndExit();
      });
    }

    const rowSaveReset = container.querySelector('#rowSaveReset');
    if (rowSaveReset) {
      rowSaveReset.addEventListener('click', () => {
        this.confirmSaveAndExit();
      });
    }

    const rowDiscardExit = container.querySelector('#rowDiscardExit');
    if (rowDiscardExit) {
      rowDiscardExit.addEventListener('click', () => {
        this.confirmDiscardAndExit();
      });
    }

    const rowDiscardChanges = container.querySelector('#rowDiscardChanges');
    if (rowDiscardChanges) {
      rowDiscardChanges.addEventListener('click', () => {
        this.showBiosDialog(
          'Discard Changes',
          'Discard all unsaved configuration changes?',
          () => {
            this.reset();
            this.renderBiosUI('virtualScreenContent');
          },
          null
        );
      });
    }
  }

  showBiosDialog(title, prompt, onYes, onNo) {
    const existing = document.getElementById('aptioBiosDialog');
    if (existing) existing.remove();

    const wrapper = document.getElementById('aptioBiosWrapper');
    if (!wrapper) return;

    const overlay = document.createElement('div');
    overlay.className = 'aptio-dialog-overlay';
    overlay.id = 'aptioBiosDialog';
    overlay.innerHTML = `
      <div class="aptio-dialog-box" role="dialog" aria-modal="true">
        <div class="aptio-dialog-title">${title}</div>
        <div style="font-size: 14px; margin: 12px 0 18px 0; line-height: 1.5; color: #ffffff;">${prompt}</div>
        <div class="aptio-dialog-btns">
          <button class="aptio-dialog-btn selected" id="btnAptioYes">[ Yes ]</button>
          <button class="aptio-dialog-btn" id="btnAptioNo">[ No ]</button>
        </div>
      </div>
    `;
    wrapper.appendChild(overlay);

    const btnYes = overlay.querySelector('#btnAptioYes');
    const btnNo = overlay.querySelector('#btnAptioNo');

    btnYes.focus();

    btnYes.addEventListener('click', () => {
      if (window.soundSynth) window.soundSynth.playClick();
      overlay.remove();
      if (typeof onYes === 'function') onYes();
    });

    btnNo.addEventListener('click', () => {
      if (window.soundSynth) window.soundSynth.playClick();
      overlay.remove();
      if (typeof onNo === 'function') onNo();
    });

    const dialogKeyHandler = (e) => {
      if (!document.getElementById('aptioBiosDialog')) {
        window.removeEventListener('keydown', dialogKeyHandler);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (document.activeElement === btnNo) {
          btnNo.click();
        } else {
          btnYes.click();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        btnNo.click();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        btnYes.focus();
        btnYes.classList.add('selected');
        btnNo.classList.remove('selected');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        btnNo.focus();
        btnNo.classList.add('selected');
        btnYes.classList.remove('selected');
      }
    };
    window.addEventListener('keydown', dialogKeyHandler);
  }

  confirmSaveAndExit() {
    this.showBiosDialog(
      'Save & Reset Confirmation',
      'Save configuration changes and exit setup?',
      () => {
        this.executeBiosSave();
      },
      () => {
        // user clicked No: remain in BIOS
      }
    );
  }

  confirmDiscardAndExit() {
    this.showBiosDialog(
      'Discard Changes and Exit',
      'Discard configuration changes and exit setup?',
      () => {
        this.executeBiosDiscard();
      },
      () => {
        // user clicked No: remain in BIOS
      }
    );
  }

  executeBiosDiscard() {
    if (window.soundSynth) window.soundSynth.playWarning();
    this.showRebootBanner('Discarding changes and resetting system...', () => {
      if (this.isSecondBoot) {
        window.stateEngine.recordPenalty(
          6,
          1.00,
          'تم الخروج من البيوس دون حفظ تغيير جهاز الإقلاع الأول إلى SSD',
          'يجب حفظ التغييرات لاختيار القرص الداخلي SSD كجهاز إقلاع أول.'
        );
        alert('تنبيه: لقد خرجت دون حفظ! لا يزال وسيط التثبيت هو الإقلاع الأول.');
        this.initBiosScreen('virtualScreenContent', true);
      } else {
        window.soundSynth.playErrorBeep();
        window.stateEngine.recordPenalty(
          2,
          1.00,
          'الخروج من البيوس دون حفظ الإعدادات المطلوبة (Discard Changes and Exit)',
          'لم يتم حفظ إعدادات TPM و Secure Boot وترتيب الإقلاع، مما يمنع إقلاع مثبت الويندوز.'
        );
        this.showNoBootableDeviceError();
      }
    });
  }

  executeBiosSave() {
    this.handleF10Save();
  }

  bindKeyboardNav() {
    const handleBiosKeys = (e) => {
      // Check if BIOS is still rendered
      if (!document.getElementById('aptioBiosWrapper')) {
        window.removeEventListener('keydown', handleBiosKeys);
        return;
      }

      // If a dialog is open, let dialogKeyHandler handle keys
      if (document.getElementById('aptioBiosDialog')) {
        return;
      }

      if (e.key === 'F10') {
        e.preventDefault();
        this.confirmSaveAndExit();
      } else if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        this.confirmDiscardAndExit();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const curIdx = this.tabs.indexOf(this.activeTab);
        this.activeTab = this.tabs[(curIdx + 1) % this.tabs.length];
        this.renderBiosUI('virtualScreenContent');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const curIdx = this.tabs.indexOf(this.activeTab);
        this.activeTab = this.tabs[(curIdx - 1 + this.tabs.length) % this.tabs.length];
        this.renderBiosUI('virtualScreenContent');
      }
    };

    window.addEventListener('keydown', handleBiosKeys);
  }

  handleF10Save() {
    if (window.soundSynth) window.soundSynth.playClick();

    if (this.isSecondBoot) {
      // --- PHASE 6 LOGIC: Breaking the boot loop by selecting internal Hard Drive ---
      const dev = (this.settings.firstBootDevice || '').toLowerCase();
      if (dev.includes('hard drive') || dev.includes('ssd')) {
        // Correct! Switched back to SSD
        this.showRebootBanner('Saving configuration and resetting...', () => {
          if (typeof this.onSecondBootSuccess === 'function') {
            this.onSecondBootSuccess();
          }
        });
      } else {
        // Wrong! Still pointing to USB or external media
        window.stateEngine.recordPenalty(
          6,
          1.00,
          'لم يتم تغيير جهاز الإقلاع الأول إلى القرص الداخلي SSD (خطر الوقوع في حلقة التثبيت)',
          'يجب إعادة ضبط 1st Boot Device ليكون القرص الداخلي SSD بعد انتهاء مرحلة نسخ الملفات.'
        );
        alert('تنبيه: لقد تركت وسيط التثبيت الخارجي كإقلاع أول! هذا سيعيد تثبيت الويندوز من الصفر. يجب اختيار Hard Drive (SSD).');
      }
      return;
    }

    // --- PHASE 2 LOGIC: Strict F10 verification ---
    // Rule 1: TPM 2.0 must be Enabled
    // Rule 2: Secure Boot must be Enabled
    // Rule 3: 1st Boot Device must match chosen media via .includes()
    const chosenMedia = window.stateEngine.selectedMedia || 'usb';
    const firstDev = (this.settings.firstBootDevice || '').toLowerCase();

    // Check if Hard Drive left as 1st boot device
    if (firstDev.includes('hard drive') || firstDev.includes('ssd')) {
      window.soundSynth.playErrorBeep();
      window.stateEngine.recordPenalty(
        2,
        1.00,
        'محاولة إقلاع خاطئة: تم ترك القرص الصلب الفارغ كإقلاع أول دون تثبيت الويندوز بعد',
        'القرص الصلب فارغ حالياً، لذلك يجب اختيار وسيط التثبيت (USB أو DVD أو PXE) كجهاز إقلاع أول.'
      );
      this.showNoBootableDeviceError();
      return;
    }

    // Check flexible matching .includes()
    let mediaMatched = false;
    if (chosenMedia === 'usb' && (firstDev.includes('usb') || firstDev.includes('kingston'))) {
      mediaMatched = true;
    } else if (chosenMedia === 'dvd' && (firstDev.includes('cd') || firstDev.includes('dvd'))) {
      mediaMatched = true;
    } else if (chosenMedia === 'pxe' && firstDev.includes('pxe')) {
      mediaMatched = true;
    }

    if (!mediaMatched) {
      window.soundSynth.playErrorBeep();
      window.stateEngine.recordPenalty(
        2,
        0.50,
        `جهاز الإقلاع الأول المختار لا يتطابق مع الوسيط المتصل (${chosenMedia.toUpperCase()})`
      );
      alert(`تنبيه: لقد قمت بتوصيل وسيط (${chosenMedia.toUpperCase()})، لكنك اخترت جهاز إقلاع مختلف في البيوس!`);
      return;
    }

    // Check Security requirements (TPM 2.0 & Secure Boot)
    if (!this.settings.tpm || !this.settings.secureBoot) {
      window.soundSynth.playErrorBeep();
      window.stateEngine.recordPenalty(
        2,
        0.50,
        'عدم تفعيل متطلبات Windows 11 الإلزامية (TPM 2.0 أو Secure Boot)',
        'يتطلب ويندوز 11 تفعيل TPM 2.0 و Secure Boot في تبويب Security لتأمين مفاتيح التشفير.'
      );
      alert('خطأ في إعدادات الأمان: يتطلب Windows 11 تفعيل TPM 2.0 و Secure Boot في البيوس!');
      return;
    }

    // All correct! Save and transition
    window.stateEngine.biosConfig.tpm = true;
    window.stateEngine.biosConfig.secureBoot = true;
    window.stateEngine.biosConfig.firstBootDevice = this.settings.firstBootDevice;
    window.stateEngine.biosConfig.savedWithF10 = true;

    this.showRebootBanner('Saving configuration and resetting...', () => {
      // Trigger checkpoint 2 Quiz
      window.quizManager.showQuizForBank('bank_bios', () => {
        window.stateEngine.completePhase(2);
      });
    });
  }

  showNoBootableDeviceError() {
    const pane = document.getElementById('biosMainPane');
    if (!pane) return;

    pane.innerHTML = `
      <div class="bios-fatal-error">
        <h2 style="color: #ef4444; margin-bottom: 15px;">*** BOOT FAILURE ***</h2>
        <p style="font-size: 16px; color: #ffffff; margin-bottom: 20px;">
          (No bootable device found. Press any key to enter BIOS and configure boot order.)
        </p>
        <button class="fluent-btn fluent-btn-accent" id="btnRetryBios">العودة للبيوس وضبط وسيط التثبيت</button>
      </div>
    `;

    const btn = pane.querySelector('#btnRetryBios');
    if (btn) {
      btn.addEventListener('click', () => {
        this.renderBiosUI('virtualScreenContent');
      });
    }
  }

  showRebootBanner(msg, callback) {
    const container = document.getElementById('virtualScreenContent');
    if (!container) return;

    container.innerHTML = `
      <div class="virtual-black-screen flex-center">
        <div class="reboot-banner-box">
          <div class="spinner-win11"></div>
          <p style="color: #ffffff; font-size: 18px; margin-top: 20px;">${msg}</p>
        </div>
      </div>
    `;

    if (window.soundSynth) window.soundSynth.playBeep(440, 0.05);

    setTimeout(() => {
      if (typeof callback === 'function') callback();
    }, 1500);
  }
}

// Global instance
window.biosController = new BiosController();
