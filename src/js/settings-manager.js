/**
 * SettingsManager - Centralized Encrypted Configuration Manager (inf.dll)
 * Handles teacher authentication, groups management, institution details, and session mode visibility.
 */
class SettingsManager {
  constructor() {
    this.settings = {
      version: 1,
      teacher: {
        full_name: 'أستاذ مادة المعلوماتية'
      },
      institution: 'ثانوية مخبر الإعلام الآلي',
      school_year: '2025/2026',
      groups: ['1AS-01 (جذع مشترك علوم)', '1AS-02 (جذع مشترك علوم)', '1AS-03 (جذع مشترك آداب)'],
      session_mode_enabled: true,
      force_french_names: true
    };

    this.tempGroups = [];
    this.initialGroups = ['1AS-01 (جذع مشترك علوم)', '1AS-02 (جذع مشترك علوم)', '1AS-03 (جذع مشترك آداب)'];
  }

  getApi() {
    if (window.api && window.api.settings) return window.api.settings;
    if (window.electronAPI && window.electronAPI.settings) return window.electronAPI.settings;
    return null;
  }

  async init() {
    const api = this.getApi();
    this.bindEvents();
    this.setupNameInputsValidation();

    if (!api) {
      console.warn('Electron settings API unavailable, using in-memory settings.');
      this.applySettingsToUI();
      return;
    }

    try {
      const exists = await api.exists();
      if (!exists) {
        // Show mandatory initial configuration screen
        this.showInitialSetupModal();
      } else {
        const res = await api.load();
        if (res && res.success && res.data) {
          this.settings = res.data;
          this.applySettingsToUI();
        }
      }
    } catch (err) {
      console.error('Failed to initialize settings:', err);
      this.applySettingsToUI();
    }
  }

  getSettings() {
    return this.settings;
  }

  applySettingsToUI() {
    // 1. Populate Groups in Student Registration (#regGroup)
    const groupSelect = document.getElementById('regGroup');
    const groupNotice = document.getElementById('regGroupNotice');
    if (groupSelect) {
      groupSelect.innerHTML = '';
      const groups = Array.isArray(this.settings.groups) ? this.settings.groups : [];

      if (groups.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'يرجى تهيئة الأفواج من الإعدادات';
        opt.disabled = true;
        opt.selected = true;
        groupSelect.appendChild(opt);

        if (groupNotice) {
          groupNotice.style.display = 'block';
          groupNotice.textContent = 'تنبيه: لم يتم تسجيل أي أفواج. اضغط Ctrl+Shift+S لضبط الأفواج من نافذة الإعدادات.';
        }
      } else {
        groups.forEach((g, idx) => {
          const opt = document.createElement('option');
          opt.value = g;
          opt.textContent = g;
          if (idx === 0) opt.selected = true;
          groupSelect.appendChild(opt);
        });

        if (groupNotice) {
          groupNotice.style.display = 'none';
        }
      }
    }

    // 2. Control Session Mode Visibility (#regModeContainer)
    const modeContainer = document.getElementById('regModeContainer');
    const regModeSelect = document.getElementById('regMode');
    if (modeContainer && regModeSelect) {
      if (this.settings.session_mode_enabled === false) {
        modeContainer.style.display = 'none';
        regModeSelect.value = 'practice';
      } else {
        modeContainer.style.display = 'block';
      }
    }

    // 3. Update Teacher & Institution in About Modal (#aboutModal)
    const aboutTeacherEl = document.getElementById('aboutTeacherName');
    const aboutInstEl = document.getElementById('aboutInstitution');
    const aboutYearEl = document.getElementById('aboutSchoolYear');

    if (aboutTeacherEl) {
      aboutTeacherEl.textContent = (this.settings.teacher && this.settings.teacher.full_name) || 'غير محدد';
    }
    if (aboutInstEl) {
      aboutInstEl.textContent = this.settings.institution || 'غير محدد';
    }
    if (aboutYearEl) {
      aboutYearEl.textContent = this.settings.school_year || 'غير محدد';
    }

    // 4. Update Name Language Badges in Student Registration
    const isForced = this.settings.force_french_names !== false;
    const badgeNom = document.getElementById('nameLangBadgeNom');
    const badgePrenom = document.getElementById('nameLangBadgePrenom');
    const lastNameInput = document.getElementById('regLastName');
    const firstNameInput = document.getElementById('regFirstName');

    if (badgeNom) {
      badgeNom.textContent = isForced ? 'حروف فرنسية فقط (FR)' : 'حروف عربية أو فرنسية';
      badgeNom.className = isForced ? 'name-lang-badge forced-french' : 'name-lang-badge';
    }
    if (badgePrenom) {
      badgePrenom.textContent = isForced ? 'حروف فرنسية فقط (FR)' : 'حروف عربية أو فرنسية';
      badgePrenom.className = isForced ? 'name-lang-badge forced-french' : 'name-lang-badge';
    }
    if (lastNameInput) {
      lastNameInput.placeholder = isForced ? 'Ex: MOHAMMEDI' : 'مثال: محمدي';
      if (isForced && !this.isFrenchNameValid(lastNameInput.value)) {
        lastNameInput.value = 'MOHAMMEDI';
      }
    }
    if (firstNameInput) {
      firstNameInput.placeholder = isForced ? 'Ex: Abdellah' : 'مثال: عبد الله';
      if (isForced && !this.isFrenchNameValid(firstNameInput.value)) {
        firstNameInput.value = 'Abdellah';
      }
    }
  }

  showInitialSetupModal() {
    const modal = document.getElementById('initialSetupModal');
    if (!modal) return;

    this.renderInitialGroupsChips();
    modal.classList.add('modal-visible');

    setTimeout(() => {
      const pwdInput = document.getElementById('initTeacherPassword');
      if (pwdInput) pwdInput.focus();
    }, 100);
  }

  renderInitialGroupsChips() {
    const container = document.getElementById('initGroupsChipsContainer');
    if (!container) return;
    container.innerHTML = '';

    this.initialGroups.forEach((g, idx) => {
      const chip = document.createElement('span');
      chip.className = 'group-chip';
      chip.innerHTML = `${g} <button type="button" class="chip-delete-btn" data-idx="${idx}">&times;</button>`;
      container.appendChild(chip);
    });

    container.querySelectorAll('.chip-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'), 10);
        this.initialGroups.splice(idx, 1);
        this.renderInitialGroupsChips();
      });
    });
  }

  showSettingsPasswordModal() {
    const modal = document.getElementById('settingsPasswordModal');
    if (!modal) return;

    const pwdInput = document.getElementById('settingsPwdInput');
    const errorEl = document.getElementById('settingsPwdError');

    if (pwdInput) pwdInput.value = '';
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }

    modal.classList.add('modal-visible');
    setTimeout(() => {
      if (pwdInput) pwdInput.focus();
    }, 100);
  }

  async verifyAndOpenSettings() {
    const pwdInput = document.getElementById('settingsPwdInput');
    const errorEl = document.getElementById('settingsPwdError');
    const pwd = pwdInput ? pwdInput.value : '';

    if (!pwd) {
      if (errorEl) {
        errorEl.textContent = 'يرجى إدخال كلمة المرور';
        errorEl.style.display = 'block';
      }
      return;
    }

    const api = this.getApi();
    if (!api) {
      this.openSettingsModal();
      return;
    }

    try {
      const res = await api.verifyPassword(pwd);
      if (res && res.success) {
        const pwdModal = document.getElementById('settingsPasswordModal');
        if (pwdModal) pwdModal.classList.remove('modal-visible');
        this.openSettingsModal();
      } else {
        if (errorEl) {
          errorEl.textContent = 'كلمة المرور غير صحيحة';
          errorEl.style.display = 'block';
        }
        if (window.soundSynth) window.soundSynth.playWarning();
        if (pwdInput) pwdInput.select();
      }
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = 'خطأ أثناء التحقق: ' + err.message;
        errorEl.style.display = 'block';
      }
    }
  }

  openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;

    // Prepopulate inputs
    const nameInput = document.getElementById('setTeacherFullName');
    const newPwdInput = document.getElementById('setNewPassword');
    const confirmPwdInput = document.getElementById('setConfirmPassword');
    const instInput = document.getElementById('setInstitution');
    const yearInput = document.getElementById('setSchoolYear');
    const modeSwitch = document.getElementById('setSessionModeSwitch');
    const forceFrenchSwitch = document.getElementById('setForceFrenchNamesSwitch');
    const statusMsg = document.getElementById('settingsStatusMsg');

    if (nameInput) nameInput.value = (this.settings.teacher && this.settings.teacher.full_name) || '';
    if (newPwdInput) newPwdInput.value = '';
    if (confirmPwdInput) confirmPwdInput.value = '';
    if (instInput) instInput.value = this.settings.institution || '';
    if (yearInput) yearInput.value = this.settings.school_year || '';
    if (modeSwitch) modeSwitch.checked = this.settings.session_mode_enabled !== false;
    if (forceFrenchSwitch) forceFrenchSwitch.checked = this.settings.force_french_names !== false;
    if (statusMsg) {
      statusMsg.style.display = 'none';
      statusMsg.textContent = '';
      statusMsg.className = 'settings-status-msg';
    }

    this.tempGroups = Array.isArray(this.settings.groups) ? [...this.settings.groups] : [];
    this.renderSettingsGroupsChips();

    modal.classList.add('modal-visible');
    setTimeout(() => {
      if (nameInput) nameInput.focus();
    }, 100);
  }

  renderSettingsGroupsChips() {
    const container = document.getElementById('setGroupsChipsContainer');
    if (!container) return;
    container.innerHTML = '';

    this.tempGroups.forEach((g, idx) => {
      const chip = document.createElement('span');
      chip.className = 'group-chip';
      chip.innerHTML = `${g} <button type="button" class="chip-delete-btn" data-idx="${idx}">&times;</button>`;
      container.appendChild(chip);
    });

    container.querySelectorAll('.chip-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'), 10);
        this.tempGroups.splice(idx, 1);
        this.renderSettingsGroupsChips();
      });
    });
  }

  async saveSettings() {
    const nameInput = document.getElementById('setTeacherFullName');
    const newPwdInput = document.getElementById('setNewPassword');
    const confirmPwdInput = document.getElementById('setConfirmPassword');
    const instInput = document.getElementById('setInstitution');
    const yearInput = document.getElementById('setSchoolYear');
    const modeSwitch = document.getElementById('setSessionModeSwitch');
    const forceFrenchSwitch = document.getElementById('setForceFrenchNamesSwitch');
    const statusMsg = document.getElementById('settingsStatusMsg');

    const newPwd = newPwdInput ? newPwdInput.value : '';
    const confirmPwd = confirmPwdInput ? confirmPwdInput.value : '';

    if (newPwd) {
      if (newPwd.length < 6) {
        if (statusMsg) {
          statusMsg.textContent = 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.';
          statusMsg.className = 'settings-status-msg error';
          statusMsg.style.display = 'block';
        }
        return;
      }
      if (newPwd !== confirmPwd) {
        if (statusMsg) {
          statusMsg.textContent = 'كلمة المرور الجديدة وتأكيدها غير متطابقين.';
          statusMsg.className = 'settings-status-msg error';
          statusMsg.style.display = 'block';
        }
        return;
      }
    }

    const payload = {
      teacher: {
        full_name: (nameInput ? nameInput.value : '').trim(),
        new_password: newPwd || undefined
      },
      institution: (instInput ? instInput.value : '').trim(),
      school_year: (yearInput ? yearInput.value : '').trim(),
      groups: this.tempGroups,
      session_mode_enabled: modeSwitch ? modeSwitch.checked : true,
      force_french_names: forceFrenchSwitch ? forceFrenchSwitch.checked : true
    };

    const api = this.getApi();
    if (api) {
      try {
        const res = await api.save(payload);
        if (res && res.success) {
          this.settings.teacher.full_name = payload.teacher.full_name;
          this.settings.institution = payload.institution;
          this.settings.school_year = payload.school_year;
          this.settings.groups = [...this.tempGroups];
          this.settings.session_mode_enabled = payload.session_mode_enabled;
          this.settings.force_french_names = payload.force_french_names;

          if (statusMsg) {
            statusMsg.textContent = 'تم الحفظ بنجاح';
            statusMsg.className = 'settings-status-msg success';
            statusMsg.style.display = 'block';
          }
          if (window.soundSynth) window.soundSynth.playSuccess();

          this.applySettingsToUI();

          setTimeout(() => {
            const modal = document.getElementById('settingsModal');
            if (modal) modal.classList.remove('modal-visible');
          }, 1000);
        } else {
          throw new Error((res && res.error) || 'خطأ غير معروف');
        }
      } catch (err) {
        if (statusMsg) {
          statusMsg.textContent = 'فشل الحفظ: ' + err.message;
          statusMsg.className = 'settings-status-msg error';
          statusMsg.style.display = 'block';
        }
      }
    } else {
      // In-memory update
      this.settings.teacher.full_name = payload.teacher.full_name;
      this.settings.institution = payload.institution;
      this.settings.school_year = payload.school_year;
      this.settings.groups = [...this.tempGroups];
      this.settings.session_mode_enabled = payload.session_mode_enabled;
      this.settings.force_french_names = payload.force_french_names;

      if (statusMsg) {
        statusMsg.textContent = 'تم الحفظ بنجاح';
        statusMsg.className = 'settings-status-msg success';
        statusMsg.style.display = 'block';
      }
      this.applySettingsToUI();
      setTimeout(() => {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.classList.remove('modal-visible');
      }, 1000);
    }
  }

  async saveInitialSetup() {
    const pwdInput = document.getElementById('initTeacherPassword');
    const confirmInput = document.getElementById('initConfirmPassword');
    const nameInput = document.getElementById('initTeacherFullName');
    const instInput = document.getElementById('initInstitution');
    const yearInput = document.getElementById('initSchoolYear');
    const initForceFrenchSwitch = document.getElementById('initForceFrenchNamesSwitch');
    const statusMsg = document.getElementById('initStatusMsg');

    const pwd = pwdInput ? pwdInput.value : '';
    const confirm = confirmInput ? confirmInput.value : '';

    if (pwd.length < 6) {
      if (statusMsg) {
        statusMsg.textContent = 'كلمة المرور يجب أن لا تقل عن 6 أحرف.';
        statusMsg.className = 'settings-status-msg error';
        statusMsg.style.display = 'block';
      }
      return;
    }
    if (pwd !== confirm) {
      if (statusMsg) {
        statusMsg.textContent = 'كلمة المرور وتأكيدها غير متطابقين.';
        statusMsg.className = 'settings-status-msg error';
        statusMsg.style.display = 'block';
      }
      return;
    }

    const payload = {
      password: pwd,
      full_name: (nameInput ? nameInput.value : '').trim() || 'أستاذ مادة المعلوماتية',
      institution: (instInput ? instInput.value : '').trim() || 'ثانوية مخبر الإعلام الآلي',
      school_year: (yearInput ? yearInput.value : '').trim() || '2025/2026',
      groups: this.initialGroups,
      session_mode_enabled: true,
      force_french_names: initForceFrenchSwitch ? initForceFrenchSwitch.checked : true
    };

    const api = this.getApi();
    if (api) {
      try {
        const res = await api.createInitial(payload);
        if (res && res.success) {
          this.settings.teacher.full_name = payload.full_name;
          this.settings.institution = payload.institution;
          this.settings.school_year = payload.school_year;
          this.settings.groups = [...this.initialGroups];
          this.settings.session_mode_enabled = true;
          this.settings.force_french_names = payload.force_french_names;

          if (statusMsg) {
            statusMsg.textContent = 'تم تهيئة الإعدادات بنجاح!';
            statusMsg.className = 'settings-status-msg success';
            statusMsg.style.display = 'block';
          }
          if (window.soundSynth) window.soundSynth.playSuccess();

          this.applySettingsToUI();

          setTimeout(() => {
            const modal = document.getElementById('initialSetupModal');
            if (modal) modal.classList.remove('modal-visible');

            // Open Student registration modal
            const sessionModal = document.getElementById('sessionModal');
            if (sessionModal) sessionModal.classList.add('modal-visible');
          }, 1000);
        } else {
          throw new Error((res && res.error) || 'تعذر إنشاء ملف الإعدادات');
        }
      } catch (err) {
        if (statusMsg) {
          statusMsg.textContent = 'حدث خطأ: ' + err.message;
          statusMsg.className = 'settings-status-msg error';
          statusMsg.style.display = 'block';
        }
      }
    }
  }

  bindEvents() {
    // 1. Global shortcut: Ctrl+Shift+S (or Cmd+Shift+S on Mac)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        this.showSettingsPasswordModal();
      }

      // ESC key to close settings modals
      if (e.key === 'Escape') {
        const pwdModal = document.getElementById('settingsPasswordModal');
        const setModal = document.getElementById('settingsModal');
        const exitModal = document.getElementById('exitConfirmModal');

        if (pwdModal && pwdModal.classList.contains('modal-visible')) {
          pwdModal.classList.remove('modal-visible');
        } else if (setModal && setModal.classList.contains('modal-visible')) {
          setModal.classList.remove('modal-visible');
        } else if (exitModal && exitModal.classList.contains('modal-visible')) {
          exitModal.classList.remove('modal-visible');
        }
      }
    });

    // 2. Settings Password Modal bindings
    const btnConfirmPwd = document.getElementById('btnConfirmSettingsPassword');
    const btnCancelPwd = document.getElementById('btnCancelSettingsPassword');
    const pwdInput = document.getElementById('settingsPwdInput');

    if (btnConfirmPwd) {
      btnConfirmPwd.addEventListener('click', () => this.verifyAndOpenSettings());
    }
    if (btnCancelPwd) {
      btnCancelPwd.addEventListener('click', () => {
        const modal = document.getElementById('settingsPasswordModal');
        if (modal) modal.classList.remove('modal-visible');
      });
    }
    if (pwdInput) {
      pwdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.verifyAndOpenSettings();
        }
      });
    }

    // 3. Settings Modal bindings
    const btnSaveSet = document.getElementById('btnSaveSettings');
    const btnCancelSet = document.getElementById('btnCancelSettings');
    const btnCloseSet = document.getElementById('btnCloseSettingsModal');
    const btnAddGroup = document.getElementById('btnAddGroup');
    const newGroupInput = document.getElementById('newGroupInput');

    if (btnSaveSet) {
      btnSaveSet.addEventListener('click', () => this.saveSettings());
    }
    const closeSetModal = () => {
      const modal = document.getElementById('settingsModal');
      if (modal) modal.classList.remove('modal-visible');
    };
    if (btnCancelSet) btnCancelSet.addEventListener('click', closeSetModal);
    if (btnCloseSet) btnCloseSet.addEventListener('click', closeSetModal);

    const handleAddGroup = () => {
      if (!newGroupInput) return;
      const val = newGroupInput.value.trim();
      if (val && !this.tempGroups.includes(val)) {
        this.tempGroups.push(val);
        this.renderSettingsGroupsChips();
        newGroupInput.value = '';
        newGroupInput.focus();
      }
    };

    if (btnAddGroup) btnAddGroup.addEventListener('click', handleAddGroup);
    if (newGroupInput) {
      newGroupInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddGroup();
        }
      });
    }

    // 4. Initial Setup Modal bindings
    const btnSaveInit = document.getElementById('btnSaveInitialSetup');
    const btnAddInitGroup = document.getElementById('btnAddInitGroup');
    const newInitGroupInput = document.getElementById('newInitGroupInput');

    if (btnSaveInit) {
      btnSaveInit.addEventListener('click', () => this.saveInitialSetup());
    }

    const handleAddInitGroup = () => {
      if (!newInitGroupInput) return;
      const val = newInitGroupInput.value.trim();
      if (val && !this.initialGroups.includes(val)) {
        this.initialGroups.push(val);
        this.renderInitialGroupsChips();
        newInitGroupInput.value = '';
        newInitGroupInput.focus();
      }
    };

    if (btnAddInitGroup) btnAddInitGroup.addEventListener('click', handleAddInitGroup);
    if (newInitGroupInput) {
      newInitGroupInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddInitGroup();
        }
      });
    }
  }

  setupNameInputsValidation() {
    const lastNameInput = document.getElementById('regLastName');
    const firstNameInput = document.getElementById('regFirstName');
    const lastNameError = document.getElementById('lastNameError');
    const firstNameError = document.getElementById('firstNameError');

    const validateField = (input, errorEl, fieldTitle) => {
      if (!input) return true;
      const isForced = this.settings.force_french_names !== false;
      if (!isForced) {
        if (errorEl) errorEl.style.display = 'none';
        input.classList.remove('input-invalid');
        return true;
      }

      const val = input.value.trim();
      if (!val) {
        if (errorEl) errorEl.style.display = 'none';
        input.classList.remove('input-invalid');
        return false;
      }

      // Check if value contains any forbidden characters (Arabic, numbers, special symbols)
      // Allowed: Latin alphabet (including French accents: é, è, ê, à, â, ç, ï, etc.), spaces, hyphens, apostrophes
      const hasInvalidChars = /[^a-zA-ZÀ-ÿ\s'-]/g.test(val);
      if (hasInvalidChars) {
        if (errorEl) {
          errorEl.textContent = `ممنوع إدخال حروف عربية أو أرقام في ${fieldTitle}! يرجى الكتابة بالحروف الفرنسية فقط (A-Z).`;
          errorEl.style.display = 'block';
        }
        input.classList.add('input-invalid');
        return false;
      } else {
        if (errorEl) errorEl.style.display = 'none';
        input.classList.remove('input-invalid');
        return true;
      }
    };

    if (lastNameInput) {
      lastNameInput.addEventListener('input', () => validateField(lastNameInput, lastNameError, 'اللقب'));
      lastNameInput.addEventListener('blur', () => validateField(lastNameInput, lastNameError, 'اللقب'));
    }
    if (firstNameInput) {
      firstNameInput.addEventListener('input', () => validateField(firstNameInput, firstNameError, 'الاسم'));
      firstNameInput.addEventListener('blur', () => validateField(firstNameInput, firstNameError, 'الاسم'));
    }
  }

  isFrenchNameValid(name) {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    if (trimmed.length < 2) return false;
    // Latin letters, French accents, hyphens, spaces, apostrophes only
    return /^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmed);
  }
}

// Global instance
window.settingsManager = new SettingsManager();
