/**
 * AppSimulator - 8 Pedagogical Phases Orchestrator & View Controller
 * Strictly tailored for the Algerian 1AS Secondary Computer Science Curriculum
 */

// Global render function hooked into StateEngine
window.renderPhaseScreen = function(phaseNum) {
  const container = document.getElementById('virtualScreenContent');
  if (!container) return;

  switch (phaseNum) {
    case 1:
      renderPhase1Workstation(container);
      break;
    case 2:
      renderPhase2Bios(container);
      break;
    case 3:
      renderPhase3Regional(container);
      break;
    case 4:
      renderPhase4License(container);
      break;
    case 5:
      renderPhase5Partitioning(container);
      break;
    case 6:
      renderPhase6Installation(container);
      break;
    case 7:
      renderPhase7OOBE(container);
      break;
    case 8:
      renderPhase8Desktop(container);
      break;
    default:
      renderPhase1Workstation(container);
  }
};

// ==========================================================================
// PHASE 1: Workstation Preparation & POST Screen
// ==========================================================================
function renderPhase1Workstation(container) {
  window.stateEngine.isPowerOn = false;
  // If not previously selected, start with detached state (null)
  let currentSelected = window.stateEngine.selectedMedia || null;

  function updateCompanionTowerAndShelf() {
    const portEl = document.getElementById('usb-port'); // id="usb-port" located on the left PC Tower
    const dvdBadge = document.getElementById('towerDvdDiscBadge');
    const dvdLed = document.getElementById('towerDvdLed');
    const lanVisual = document.getElementById('towerPluggedLan');
    const towerStatus = document.getElementById('towerLiveStatus');
    const shelfMsg = document.getElementById('shelfConnectionMsg');
    const usbStatus = document.getElementById('usbPlugStatus');
    const dvdStatus = document.getElementById('dvdPlugStatus');
    const pxeStatus = document.getElementById('pxePlugStatus');
    const usbShelfSlot = document.getElementById('usbShelfSlot');
    const powerBtn = document.getElementById('btnTactilePower');

    // Update active highlight on media shelf cards
    document.querySelectorAll('#rigMediaShelf .interactive-media-card').forEach(c => {
      c.classList.toggle('connected', c.getAttribute('data-media') === currentSelected);
    });

    if (currentSelected === 'usb') {
      if (portEl) {
        portEl.innerHTML = `
          <div id="usb-drive" class="inserted" title="مفتاح USB موصول فعلياً">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <rect class="usb-connector-tip" x="10" y="20" width="12" height="10" fill="#cbd5e1" stroke="#475569" stroke-width="1" rx="1"/>
              <rect x="12.5" y="23" width="2" height="3" fill="#0284c7"/>
              <rect x="17.5" y="23" width="2" height="3" fill="#0284c7"/>
              <rect class="usb-drive-body" x="6" y="2" width="20" height="20" fill="#dc2626" rx="3" stroke="#991b1b" stroke-width="1.5" />
              <line x1="9" y1="7" x2="23" y2="7" stroke="#fca5a5" stroke-width="1" />
              <line x1="9" y1="11" x2="23" y2="11" stroke="#fca5a5" stroke-width="1" />
              <circle cx="16" cy="16" r="1.5" fill="#38bdf8" />
            </svg>
          </div>
        `;
      }
      if (usbShelfSlot) {
        usbShelfSlot.innerHTML = `<span style="font-size: 11px; color: #38bdf8; font-weight: 700;">✔ بالمنفذ</span>`;
      }
      if (usbStatus) usbStatus.textContent = '● موصول بالمنفذ الأمامي';
      if (dvdStatus) dvdStatus.textContent = '○ انقر للإدخال';
      if (pxeStatus) pxeStatus.textContent = '○ انقر للتوصيل';
      if (dvdBadge) dvdBadge.classList.remove('visible');
      if (dvdLed) dvdLed.classList.remove('active');
      if (lanVisual) lanVisual.classList.remove('plugged');
      if (towerStatus) towerStatus.textContent = 'جاهز (USB 32GB)';
      if (shelfMsg) shelfMsg.textContent = '✔ تم توصيل مفتاح USB 3.0 في المنفذ الأمامي';
    } else if (currentSelected === 'dvd') {
      if (portEl) portEl.innerHTML = '';
      if (usbShelfSlot) {
        usbShelfSlot.innerHTML = `
          <div id="usb-drive" class="detached" title="مفتاح Kingston 32GB">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <rect class="usb-connector-tip" x="10" y="2" width="12" height="10" fill="#cbd5e1" stroke="#475569" stroke-width="1" rx="1"/>
              <rect x="12.5" y="4" width="2" height="3" fill="#0284c7"/>
              <rect x="17.5" y="4" width="2" height="3" fill="#0284c7"/>
              <rect class="usb-drive-body" x="6" y="10" width="20" height="20" fill="#dc2626" rx="3" stroke="#991b1b" stroke-width="1.5"/>
              <line x1="9" y1="15" x2="23" y2="15" stroke="#fca5a5" stroke-width="1" />
              <line x1="9" y1="19" x2="23" y2="19" stroke="#fca5a5" stroke-width="1" />
              <circle cx="16" cy="24" r="1.5" fill="#38bdf8"/>
            </svg>
          </div>
        `;
      }
      if (usbStatus) usbStatus.textContent = '○ انقر للتوصيل';
      if (dvdStatus) dvdStatus.textContent = '● مدخل في القارئ';
      if (pxeStatus) pxeStatus.textContent = '○ انقر للتوصيل';
      if (dvdBadge) dvdBadge.classList.add('visible');
      if (dvdLed) dvdLed.classList.add('active');
      if (lanVisual) lanVisual.classList.remove('plugged');
      if (towerStatus) towerStatus.textContent = 'جاهز (DVD Win11)';
      if (shelfMsg) shelfMsg.textContent = '✔ تم إدخال قرص DVD في قارئ الأقراص';
    } else if (currentSelected === 'pxe') {
      if (portEl) portEl.innerHTML = '';
      if (usbShelfSlot) {
        usbShelfSlot.innerHTML = `
          <div id="usb-drive" class="detached" title="مفتاح Kingston 32GB">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <rect class="usb-connector-tip" x="10" y="2" width="12" height="10" fill="#cbd5e1" stroke="#475569" stroke-width="1" rx="1"/>
              <rect x="12.5" y="4" width="2" height="3" fill="#0284c7"/>
              <rect x="17.5" y="4" width="2" height="3" fill="#0284c7"/>
              <rect class="usb-drive-body" x="6" y="10" width="20" height="20" fill="#dc2626" rx="3" stroke="#991b1b" stroke-width="1.5"/>
              <line x1="9" y1="15" x2="23" y2="15" stroke="#fca5a5" stroke-width="1" />
              <line x1="9" y1="19" x2="23" y2="19" stroke="#fca5a5" stroke-width="1" />
              <circle cx="16" cy="24" r="1.5" fill="#38bdf8"/>
            </svg>
          </div>
        `;
      }
      if (usbStatus) usbStatus.textContent = '○ انقر للتوصيل';
      if (dvdStatus) dvdStatus.textContent = '○ انقر للإدخال';
      if (pxeStatus) pxeStatus.textContent = '● موصول بمنفذ LAN';
      if (dvdBadge) dvdBadge.classList.remove('visible');
      if (dvdLed) dvdLed.classList.remove('active');
      if (lanVisual) lanVisual.classList.add('plugged');
      if (towerStatus) towerStatus.textContent = 'جاهز (PXE LAN)';
      if (shelfMsg) shelfMsg.textContent = '✔ تم توصيل كابل الشبكة RJ-45 بالخادم';
    } else {
      if (portEl) portEl.innerHTML = '';
      if (usbShelfSlot) {
        usbShelfSlot.innerHTML = `
          <div id="usb-drive" class="detached" title="مفتاح Kingston 32GB">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <rect class="usb-connector-tip" x="10" y="2" width="12" height="10" fill="#cbd5e1" stroke="#475569" stroke-width="1" rx="1"/>
              <rect x="12.5" y="4" width="2" height="3" fill="#0284c7"/>
              <rect x="17.5" y="4" width="2" height="3" fill="#0284c7"/>
              <rect class="usb-drive-body" x="6" y="10" width="20" height="20" fill="#dc2626" rx="3" stroke="#991b1b" stroke-width="1.5"/>
              <line x1="9" y1="15" x2="23" y2="15" stroke="#fca5a5" stroke-width="1" />
              <line x1="9" y1="19" x2="23" y2="19" stroke="#fca5a5" stroke-width="1" />
              <circle cx="16" cy="24" r="1.5" fill="#38bdf8"/>
            </svg>
          </div>
        `;
      }
      if (usbStatus) usbStatus.textContent = '○ انقر للتوصيل';
      if (dvdStatus) dvdStatus.textContent = '○ انقر للإدخال';
      if (pxeStatus) pxeStatus.textContent = '○ انقر للتوصيل';
      if (dvdBadge) dvdBadge.classList.remove('visible');
      if (dvdLed) dvdLed.classList.remove('active');
      if (lanVisual) lanVisual.classList.remove('plugged');
      if (towerStatus) towerStatus.textContent = 'متوقف (Standby)';
      if (shelfMsg) shelfMsg.textContent = '○ يرجى اختيار الوسيط أولاً';
    }

    if (powerBtn) {
      if (currentSelected) {
        powerBtn.classList.add('pulsing');
      } else {
        powerBtn.classList.remove('pulsing');
      }
    }
  }

  function redrawScreen() {
    container.innerHTML = `
      <div class="workstation-screen">
        <div class="workstation-header">
          <h2>المرحلة 1: تجهيز محطة العمل ووسيط التثبيت في مخبر الإعلام الآلي</h2>
          <p>اختر وسيط التثبيت المناسب من الرف الموجود على اليمين، ليتم توصيله بالوحدة المركزية على اليسار، ثم اضغط زر التشغيل (Power):</p>
        </div>

        <div class="standby-screen-center" id="standbyScreenCenter" title="شاشة العرض (في وضع الاستعداد)">
          <!-- Realistic Monitor On-Screen Display (OSD) Banner when PC has no video signal -->
          <div class="monitor-osd-panel">
            <div class="osd-header">
              <span class="osd-port-tag">DisplayPort 1.4</span>
              <span class="osd-resolution">2560 × 1440 @ 144Hz</span>
            </div>
            <div class="osd-body">
              <div class="osd-icon-warning">&#9888;</div>
              <div class="osd-text-block">
                <strong class="osd-signal-status">No Signal Detected</strong>
                <span class="osd-subtext">Check video cable or power on the PC</span>
              </div>
            </div>
            <div class="osd-footer-timer">
              <span>Auto Power Saving Standby</span>
              <span>[ ALGERIA-EDU IPS ]</span>
            </div>
          </div>

          <!-- Pedagogical Lab Guidance underneath Monitor OSD -->
          <div class="standby-lab-guide">
            <h3 class="standby-headline">محطة العمل في وضع الاستعداد (Workstation Standby)</h3>
            <div class="standby-status-pill" id="standbyMediaStatusPill">
              ${currentSelected === 'usb' ? '✔ تم توصيل مفتاح Kingston 32GB في المنفذ الأمامي' : 
                currentSelected === 'dvd' ? '✔ تم تحميل قرص Windows 11 DVD في القارئ' : 
                currentSelected === 'pxe' ? '✔ تم توصيل كابل الشبكة RJ-45 (PXE)' :
                '○ الخطوة 1: اختر وسيط التثبيت المناسب من الرف على اليمين'}
            </div>
            <div class="standby-instruction-hint" id="standbyInstructionHint">
              ${currentSelected ? 
                '<div class="guide-callout-power"><span class="guide-arrow-left">&#8592;</span> الخطوة 2: اضغط على <strong>زر الطاقة (Power) الحقيقي</strong> الموجود بالوحدة المركزية على اليسار لبدء الإقلاع الذاتي (POST).</div>' : 
                'انقر أولاً على وسيط التثبيت المناسب على اليمين ليتم توصيله بالوحدة المركزية.'}
            </div>
          </div>
        </div>
      </div>
    `;

    // Click on monitor glass gives educational guidance: power button is on the tower, not the screen!
    const standbyCenter = container.querySelector('.standby-screen-center');
    if (standbyCenter) {
      standbyCenter.onclick = () => {
        const pBtn = document.getElementById('btnTactilePower');
        if (pBtn) {
          pBtn.classList.remove('pulsing');
          void pBtn.offsetWidth;
          pBtn.classList.add('pulsing');
        }
        const hint = document.getElementById('standbyInstructionHint');
        if (hint && currentSelected) {
          hint.innerHTML = '<div class="guide-callout-power" style="border-color: #f59e0b; background: rgba(245, 158, 11, 0.15);"><span class="guide-arrow-left" style="color: #f59e0b;">&#8592;</span> <strong>تنبيه:</strong> هذه شاشة عرض وليست زراً للتشغيل! اضغط على <strong>زر الطاقة بالوحدة المركزية</strong> على اليسار.</div>';
        }
      };
    }

    updateCompanionTowerAndShelf();
  }

  redrawScreen();

  // Bind Shelf Card clicks
  document.querySelectorAll('#rigMediaShelf .interactive-media-card').forEach(card => {
    card.onclick = () => {
      const mediaType = card.getAttribute('data-media');

      if (mediaType === 'usb') {
        if (currentSelected === 'usb') return;

        const driveEl = document.getElementById('usb-drive');
        const portEl = document.getElementById('usb-port');

        if (driveEl && portEl) {
          const driveRect = driveEl.getBoundingClientRect();
          const portRect = portEl.getBoundingClientRect();
          const dx = portRect.left + (portRect.width - driveRect.width) / 2 - driveRect.left;
          const dy = portRect.top - driveRect.top - 18;

          driveEl.className = 'dragging';
          driveEl.style.left = `${driveRect.left}px`;
          driveEl.style.top = `${driveRect.top}px`;
          driveEl.style.transform = `translate(${dx}px, ${dy}px) rotate(180deg) scale(0.95)`;

          if (window.soundSynth) window.soundSynth.playClick();

          setTimeout(() => {
            currentSelected = 'usb';
            window.stateEngine.selectedMedia = 'usb';
            redrawScreen();
            if (window.soundSynth) window.soundSynth.playSuccess();
          }, 520);
          return;
        }
      }

      if (window.soundSynth) window.soundSynth.playClick();
      currentSelected = mediaType;
      window.stateEngine.selectedMedia = currentSelected;
      redrawScreen();
    };
  });

  // Bind Tactile Power Button click on the Tower (Left Column)
  const powerBtn = document.getElementById('btnTactilePower');
  if (powerBtn) {
    powerBtn.onclick = () => {
      if (window.soundSynth) window.soundSynth.playPower();

      const towerLed = document.getElementById('towerPowerLed');
      const hddLed = document.getElementById('towerHddLed');
      const monLed = document.getElementById('monitorPowerLed');
      const towerStatus = document.getElementById('towerLiveStatus');

      if (towerLed) towerLed.classList.add('active');
      if (hddLed) hddLed.classList.add('active');
      if (monLed) monLed.classList.add('active');
      if (window.syncMonitorPowerLed) window.syncMonitorPowerLed(true);
      if (towerStatus) towerStatus.textContent = '● قيد التشغيل (Running)';

      container.innerHTML = `
        <div class="virtual-black-screen flex-center" style="flex-direction: column;">
          <div class="spinner-win11"></div>
          <div style="color: #38bdf8; font-weight: 700; font-size: 18px; margin-top: 18px;">Power On Self-Test (POST)...</div>
        </div>
      `;

      setTimeout(() => {
        renderPhase1POST(container);
      }, 700);
    };
  }
}

function renderPhase1POST(container) {
  window.stateEngine.isPowerOn = true;
  if (window.syncMonitorPowerLed) window.syncMonitorPowerLed(true);

  container.innerHTML = `
    <div class="virtual-black-screen">
      <div class="post-header-line">American Megatrends, Inc. (AMI) BIOS Core v2.22</div>
      <div class="post-header-line">Copyright (C) 2026 American Megatrends, Inc. All Rights Reserved.</div>
      <div style="height: 12px;"></div>

      <div class="post-body-text">
        CPU: Intel(R) Core(TM) i5-10400 CPU @ 2.90GHz (6 Cores, 12 Threads)<br>
        Speed: 2900 MHz &nbsp;&nbsp;&nbsp; L3 Cache: 12 MB<br>
        Memory Test: 8192 MB OK (DDR4-2666 Dual Channel)<br>
        SATA 0: CT500MX500SSD1 (500.1 GB Solid State Drive)<br>
        USB Port 1: Kingston DataTraveler 3.0 (32.0 GB Partition 1)<br>
        Keyboard ... Detected &nbsp;&nbsp;&nbsp; Mouse ... Detected
      </div>

      <div class="post-prompt-banner">
        <span>Press <strong>[F2]</strong> or <strong>[DEL]</strong> to Enter BIOS / UEFI Setup</span>
        <div class="post-countdown-badge">
          المهلة المتبقية: <span id="postCountdownSpan">10</span> ثوانٍ
        </div>
      </div>

      <div style="margin-top: 15px; color: #94a3b8; font-size: 13px;" id="postStatusMsg">
        Checking NVRAM ... OK <span class="blinking-cursor"></span>
      </div>

      <button class="post-interrupt-btn" id="btnClickF2Interrupt">
        الضغط على [F2 / Del] لمقاطعة الإقلاع والدخول للبيوس
      </button>
    </div>
  `;

  // Start 10-second countdown in BiosController
  window.biosController.startPostCountdown(
    // On interrupt success:
    () => {
      window.quizManager.showQuizForBank('bank_first_boot', () => {
        window.stateEngine.completePhase(1);
      });
    },
    // On interrupt timeout fail:
    () => {
      alert('تحذير أمني: لقد انقضت مهلة الـ 10 ثوانٍ دون مقاطعة الإقلاع. تم خصم نقطة وإيقاف تشغيل الحاسوب.');
      window.stateEngine.selectedMedia = null;
      renderPhase1Workstation(container);
    }

  );

  const interruptBtn = container.querySelector('#btnClickF2Interrupt');
  if (interruptBtn) {
    interruptBtn.addEventListener('click', () => {
      window.biosController.interruptPost(() => {
        window.quizManager.showQuizForBank('bank_first_boot', () => {
          window.stateEngine.completePhase(1);
        });
      });
    });
  }
}

// ==========================================================================
// PHASE 2: Aptio Setup Utility (BIOS / UEFI)
// ==========================================================================
function renderPhase2Bios(container) {
  window.biosController.initBiosScreen('virtualScreenContent', false);
}

// ==========================================================================
// PHASE 3: Windows 11 Language & Regional Settings
// ==========================================================================
function renderPhase3Regional(container) {
  container.innerHTML = `
    <div class="win11-setup-backdrop">
      <div class="win11-window">
        <div class="win11-titlebar">
          <span>Windows 11 Setup</span>
          <span style="color: #888;">&times;</span>
        </div>

        <div class="win11-body">
          <div>
            <h2 class="win11-step-heading">المعايير الإقليمية وإعدادات اللغة</h2>
            <p class="win11-step-desc">حدد اللغة وتنسيقات الوقت والعملة ولوحة المفاتيح وفق المعايير المعتمدة في المخابر المدرسية الجزائرية:</p>

            <div class="win11-form-group">
              <label class="win11-label">Language to install (لغة التثبيت):</label>
              <select class="win11-select" id="p3Lang">
                <option value="fr">Français (France)</option>
                <option value="en" selected>English (United States)</option>
                <option value="ar">العربية (الجزائر)</option>
              </select>
            </div>

            <div class="win11-form-group">
              <label class="win11-label">Time and currency format (تنسيق الوقت والعملة):</label>
              <select class="win11-select" id="p3Time">
                <option value="dz" selected>Arabic (Algeria) - الجزائر</option>
                <option value="fr-dz">Français (Algérie)</option>
                <option value="us">English (United States)</option>
              </select>
            </div>

            <div class="win11-form-group">
              <label class="win11-label">Keyboard or input method (لوحة المفاتيح):</label>
              <select class="win11-select" id="p3Keyboard">
                <option value="azerty" selected>French (AZERTY)</option>
                <option value="ar101">Arabic (101)</option>
                <option value="qwerty">US (QWERTY)</option>
              </select>
            </div>
          </div>

          <div class="win11-actions-bar">
            <button class="fluent-btn fluent-btn-accent" id="btnP3Next">Next &gt;</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const nextBtn = container.querySelector('#btnP3Next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const timeVal = container.querySelector('#p3Time') ? container.querySelector('#p3Time').value : 'dz';
      const kbVal = container.querySelector('#p3Keyboard') ? container.querySelector('#p3Keyboard').value : 'azerty';
      if (timeVal !== 'dz' && timeVal !== 'fr-dz') {
        window.soundSynth.playErrorBeep();
        window.stateEngine.recordPenalty(3, 0.50, 'عدم ضبط تنسيق الوقت والعملة على الجزائر (Algeria)', 'المعيار الجزائري المعتمد يقتضي ضبط تنسيق الوقت والعملة بما يوافق الجزائر.');
        alert('تنبيه: يجب اختيار تنسيق الوقت والعملة الخاص بالجزائر: Arabic (Algeria) أو Français (Algérie).');
        return;
      }
      if (kbVal !== 'azerty') {
        window.soundSynth.playErrorBeep();
        window.stateEngine.recordPenalty(3, 0.50, 'عدم اختيار تخطيط لوحة المفاتيح المعتمد في المخابر (French AZERTY)', 'لوحات المفاتيح بالمخابر الجزائرية تعتمد التخطيط الفرنسي AZERTY.');
        alert('تنبيه: يجب اختيار لوحة المفاتيح French (AZERTY) المعتمدة في المخابر التعليمية الجزائرية.');
        return;
      }
      if (window.soundSynth) window.soundSynth.playClick();
      renderPhase3InstallNow(container);
    });
  }
}

function renderPhase3InstallNow(container) {
  container.innerHTML = `
    <div class="win11-setup-backdrop">
      <div class="win11-window">
        <div class="win11-titlebar">
          <span>Windows 11 Setup</span>
          <span style="color: #888;">&times;</span>
        </div>

        <div class="win11-body" style="align-items: center; justify-content: center; text-align: center;">
          <div style="margin-bottom: 30px;">
            <div style="font-size: 48px; color: #0078d4; margin-bottom: 15px;">&#10070;</div>
            <h2 class="win11-step-heading" style="font-size: 22px;">Windows 11</h2>
            <p class="win11-step-desc">جاهز لبدء تثبيت نظام التشغيل على محطة العمل</p>
          </div>

          <button class="fluent-btn fluent-btn-accent" id="btnInstallNow" style="padding: 0 32px; height: 42px; font-size: 15px;">
            Install Now (التثبيت الآن)
          </button>

          <div style="margin-top: 30px; font-size: 11.5px; color: #888888;">
            <a href="#" style="color: #38bdf8; text-decoration: none;" id="btnRepairPc">Repair your computer (إصلاح جهاز الكمبيوتر)</a>
          </div>
        </div>
      </div>
    </div>
  `;

  const repairBtn = container.querySelector('#btnRepairPc');
  if (repairBtn) {
    repairBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.soundSynth.playErrorBeep();
      window.stateEngine.recordPenalty(3, 0.50, 'محاولة فتح إصلاح الحاسوب بدلاً من التثبيت النظيف (Install Now)');
      alert('تنبيه: محطة العمل جديدة ولا يوجد نظام سابق لإصلاحه. اضغط على Install Now لتنصيب النظام.');
    });
  }

  const installBtn = container.querySelector('#btnInstallNow');
  if (installBtn) {
    installBtn.addEventListener('click', () => {
      if (window.soundSynth) window.soundSynth.playClick();
      window.stateEngine.completePhase(3);
    });
  }
}

// ==========================================================================
// PHASE 4: Edition & Licensing (Windows 11 Pro Education & Clean Install)
// ==========================================================================
function renderPhase4License(container) {
  container.innerHTML = `
    <div class="win11-setup-backdrop">
      <div class="win11-window">
        <div class="win11-titlebar">
          <span>Windows Setup</span>
          <span style="color: #888;">&times;</span>
        </div>

        <div class="win11-body">
          <div>
            <h2 class="win11-step-heading">Activate Windows</h2>
            <p class="win11-step-desc">If this is the first time you're installing Windows on this PC, you need to enter a valid Windows product key. The product key should be in the confirmation email you received or on a card in the box Windows came in.</p>

            <div class="win11-form-group" style="max-width: 440px;">
              <label class="win11-label">Product key</label>
              <input type="text" class="win11-input" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" disabled style="opacity: 0.7; letter-spacing: 2px;">
            </div>

            <div style="margin-top: 18px; margin-bottom: 12px;">
              <a href="javascript:void(0)" id="btnSkipKey" class="win11-setup-link">
                <span style="font-size: 15px;">&#128273;</span>
                <span style="text-decoration: underline;">I don't have a product key (ليس لدي مفتاح منتج)</span>
              </a>
            </div>

            <p style="font-size: 11.5px; color: #888888; margin-top: 12px;">
              إذا كنت تعيد تثبيت Windows على جهاز المخبـر، اختر خيار التجاوز لتنشيط النسخة لاحقاً عبر ترخيص المؤسسة.
            </p>
          </div>

          <div class="win11-actions-bar">
            <button class="fluent-btn fluent-btn-accent" disabled id="btnKeyNext">Next &gt;</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const skipBtn = container.querySelector('#btnSkipKey');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (window.soundSynth) window.soundSynth.playClick();
      renderPhase4SelectEdition(container);
    });
  }
}

function renderPhase4SelectEdition(container) {
  let selectedEdition = 'Windows 11 Pro Education';

  container.innerHTML = `
    <div class="win11-setup-backdrop">
      <div class="win11-window">
        <div class="win11-titlebar">
          <span>Select Operating System</span>
          <span style="color: #888;">&times;</span>
        </div>

        <div class="win11-body">
          <div>
            <h2 class="win11-step-heading">اختر النسخة المخصصة لقطاع التعليم</h2>
            <p class="win11-step-desc">حدد النسخة التي تتضمن السياسات البيداغوجية وحماية بيئة التعلم:</p>

            <div class="partition-table-container" style="height: 150px;">
              <div class="partition-row edition-row" data-edition="Windows 11 Home">
                <span>Windows 11 Home</span>
                <span>x64</span>
                <span>Home</span>
                <span>2026-10-01</span>
              </div>
              <div class="partition-row edition-row" data-edition="Windows 11 Pro">
                <span>Windows 11 Pro</span>
                <span>x64</span>
                <span>Professional</span>
                <span>2026-10-01</span>
              </div>
              <div class="partition-row edition-row selected" data-edition="Windows 11 Pro Education">
                <span><strong>Windows 11 Pro Education</strong></span>
                <span>x64</span>
                <span>Education</span>
                <span>2026-10-01</span>
              </div>
              <div class="partition-row edition-row" data-edition="Windows 11 Enterprise">
                <span>Windows 11 Enterprise</span>
                <span>x64</span>
                <span>Enterprise</span>
                <span>2026-10-01</span>
              </div>
            </div>
          </div>

          <div class="win11-actions-bar">
            <button class="fluent-btn fluent-btn-accent" id="btnEditionNext">Next &gt;</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Edition selection
  container.querySelectorAll('.edition-row').forEach(row => {
    row.addEventListener('click', () => {
      if (window.soundSynth) window.soundSynth.playClick();
      container.querySelectorAll('.edition-row').forEach(r => r.classList.remove('selected'));
      row.classList.add('selected');
      selectedEdition = row.getAttribute('data-edition');
    });
  });

  const nextBtn = container.querySelector('#btnEditionNext');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (window.soundSynth) window.soundSynth.playClick();
      if (selectedEdition !== 'Windows 11 Pro Education') {
        window.stateEngine.recordPenalty(4, 0.50, `اختيار نسخة غير مخصصة للتعليم (${selectedEdition})`);
      }
      renderPhase4Eula(container);
    });
  }
}

function renderPhase4Eula(container) {
  container.innerHTML = `
    <div class="win11-setup-backdrop">
      <div class="win11-window">
        <div class="win11-titlebar">
          <span>Applicable notices and license terms</span>
          <span style="color: #888;">&times;</span>
        </div>

        <div class="win11-body">
          <div>
            <h2 class="win11-step-heading">اتفاقية ترخيص المستخدم النهائي (EULA)</h2>
            <div style="background: #181818; border: 1px solid #444; border-radius: 4px; padding: 10px; height: 160px; overflow-y: auto; font-size: 11.5px; color: #a0a0a0; line-height: 1.5; margin-bottom: 14px;">
              MICROSOFT SOFTWARE LICENSE TERMS - WINDOWS OPERATING SYSTEM<br><br>
              By accepting this agreement or using the software, you agree to all of these terms.
              Educational Institution Deployment: Licensed for academic computer lab usage in accordance with the Ministry of National Education guidelines.
            </div>

            <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; cursor: pointer;">
              <input type="checkbox" id="chkEula" style="width: 16px; height: 16px;">
              <span>I accept the Microsoft Software License Terms (أوافق على شروط الترخيص)</span>
            </label>
          </div>

          <div class="win11-actions-bar">
            <button class="fluent-btn fluent-btn-accent" id="btnEulaNext" disabled>Next &gt;</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const chk = container.querySelector('#chkEula');
  const nextBtn = container.querySelector('#btnEulaNext');

  chk.addEventListener('change', () => {
    nextBtn.disabled = !chk.checked;
  });

  nextBtn.addEventListener('click', () => {
    if (window.soundSynth) window.soundSynth.playClick();
    renderPhase4InstallType(container);
  });
}

function renderPhase4InstallType(container) {
  container.innerHTML = `
    <div class="win11-setup-backdrop">
      <div class="win11-window">
        <div class="win11-titlebar">
          <span>Which type of installation do you want?</span>
          <span style="color: #888;">&times;</span>
        </div>

        <div class="win11-body">
          <div>
            <h2 class="win11-step-heading">تحديد نمط التثبيت</h2>
            <p class="win11-step-desc">اختر النمط المناسب لتهيئة قرص جديد وخالٍ من أي نظام سابق:</p>

            <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 15px;">
              <div class="install-type-card" id="btnTypeUpgrade" style="background: #252525; border: 1px solid #444; padding: 14px; border-radius: 6px; cursor: pointer;">
                <strong style="color: #ffffff; font-size: 13.5px; display: block; margin-bottom: 4px;">
                  Upgrade: Install Windows and keep files, settings, and applications
                </strong>
                <span style="font-size: 11.5px; color: #888;">ترقية نظام سابق مع الاحتفاظ بالملفات (غير ممكن على قرص فارغ).</span>
              </div>

              <div class="install-type-card" id="btnTypeCustom" style="background: #252525; border: 1.5px solid #0078d4; padding: 14px; border-radius: 6px; cursor: pointer;">
                <strong style="color: #38bdf8; font-size: 13.5px; display: block; margin-bottom: 4px;">
                  Custom: Install Windows only (advanced) [تثبيت نظيف ومتقدم]
                </strong>
                <span style="font-size: 11.5px; color: #cbd5e1;">تثبيت نظيف ومستقل من الصفر مع إدارة وتجزئة الأقراص الصلبة.</span>
              </div>
            </div>
          </div>

          <div class="win11-actions-bar">
            <span style="font-size: 11.5px; color: #888;">انقر على الخيار المناسب للمتابعة</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Upgrade clicked on blank disk -> Penalty
  const btnUpgrade = container.querySelector('#btnTypeUpgrade');
  btnUpgrade.addEventListener('click', () => {
    window.soundSynth.playErrorBeep();
    window.stateEngine.recordPenalty(
      4,
      1.00,
      'محاولة غير صحيحة لاختيار نمط الترقية (Upgrade) على قرص فارغ',
      'نمط الترقية يتطلب وجود نظام تشغيل سابق قيد التشغيل، بينما يتطلب القرص الخام اختيار نمط التثبيت النظيف (Custom).'
    );
    alert('خطأ: لا يمكن إجراء ترقية (Upgrade) لأن القرص الصلب فارغ تماماً! يجب اختيار Custom: Install Windows only (advanced).');
  });

  // Custom clicked -> Success
  const btnCustom = container.querySelector('#btnTypeCustom');
  btnCustom.addEventListener('click', () => {
    if (window.soundSynth) window.soundSynth.playSuccess();
    window.stateEngine.completePhase(4);
  });
}

// ==========================================================================
// ==========================================================================
// PHASE 5: Advanced Partitioning & Mandatory NTFS Formatting
// ==========================================================================
function renderPhase5Partitioning(container) {
  let gptCreated = window.stateEngine.partitionConfig.gptCreated;
  let selectedPartId = gptCreated ? 'part4' : 'part0';
  let primaryFormatted = window.stateEngine.partitionConfig.primaryFormattedNTFS;

  function redraw() {
    container.innerHTML = `
      <div class="win11-setup-backdrop">
        <div class="win11-window" style="width: 740px;">
          <div class="win11-titlebar">
            <span>Windows Setup</span>
            <span style="color: #888;">&times;</span>
          </div>

          <div class="win11-body">
            <div>
              <h2 class="win11-step-heading">Where do you want to install Windows?</h2>
              <p class="win11-step-desc" style="margin-bottom: 12px; font-size: 11.5px; color: #a0a0a0;">
                Select the unallocated drive or partition where you want to install Windows.
              </p>

              <div class="partition-table-container">
                <div class="partition-table-header">
                  <span>Name</span>
                  <span>Total size</span>
                  <span>Free space</span>
                  <span>Type</span>
                </div>
                ${!gptCreated ? `
                  <div class="partition-row ${selectedPartId === 'part0' ? 'selected' : ''}" data-id="part0">
                    <span>Drive 0 Unallocated Space</span>
                    <span>512.0 GB</span>
                    <span>512.0 GB</span>
                    <span></span>
                  </div>
                ` : `
                  <div class="partition-row ${selectedPartId === 'part1' ? 'selected' : ''}" data-id="part1">
                    <span>Drive 0 Partition 1: System</span>
                    <span>100.0 MB</span>
                    <span>100.0 MB</span>
                    <span>System</span>
                  </div>
                  <div class="partition-row ${selectedPartId === 'part2' ? 'selected' : ''}" data-id="part2">
                    <span>Drive 0 Partition 2: MSR (Reserved)</span>
                    <span>16.0 MB</span>
                    <span>16.0 MB</span>
                    <span>MSR (Reserved)</span>
                  </div>
                  <div class="partition-row ${selectedPartId === 'part3' ? 'selected' : ''}" data-id="part3">
                    <span>Drive 0 Partition 3: Recovery</span>
                    <span>650.0 MB</span>
                    <span>650.0 MB</span>
                    <span>Recovery</span>
                  </div>
                  <div class="partition-row ${selectedPartId === 'part4' ? 'selected' : ''}" data-id="part4">
                    <span><strong>Drive 0 Partition 4</strong></span>
                    <span>511.2 GB</span>
                    <span>511.2 GB</span>
                    <span><strong>${primaryFormatted ? 'Primary (NTFS)' : 'Unallocated'}</strong></span>
                  </div>
                `}
              </div>

              <div class="partition-toolbar">
                <button class="part-tool-btn" id="btnPartRefresh" title="Refresh">
                  <span style="font-size: 13px;">&#8635;</span> Refresh
                </button>
                <button class="part-tool-btn" id="btnPartDelete" ${!gptCreated ? 'disabled' : ''} title="Delete">
                  <span style="font-size: 13px;">&#10006;</span> Delete
                </button>
                <button class="part-tool-btn" id="btnPartFormat" ${!gptCreated ? 'disabled' : ''} title="Format">
                  <span style="font-size: 13px;">&#128472;</span> Format
                </button>
                <button class="part-tool-btn" id="btnPartLoadDriver" title="Load driver">
                  <span style="font-size: 13px;">&#128194;</span> Load driver
                </button>
                <button class="part-tool-btn" id="btnPartNew" ${gptCreated ? 'disabled' : ''} title="New">
                  <span style="font-size: 13px;">&#10010;</span> New
                </button>
                <button class="part-tool-btn" id="btnPartExtend" disabled title="Extend">
                  <span style="font-size: 13px;">&#8596;</span> Extend
                </button>
              </div>
            </div>

            <div class="win11-actions-bar">
              <button class="fluent-btn fluent-btn-accent" id="btnPartNext">Next &gt;</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Row selection
    container.querySelectorAll('.partition-row').forEach(row => {
      row.addEventListener('click', () => {
        if (window.soundSynth) window.soundSynth.playClick();
        selectedPartId = row.getAttribute('data-id');
        redraw();
      });
    });

    // Refresh Button
    const btnRefresh = container.querySelector('#btnPartRefresh');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        if (window.soundSynth) window.soundSynth.playClick();
        redraw();
      });
    }

    // Load Driver Button
    const btnLoadDriver = container.querySelector('#btnPartLoadDriver');
    if (btnLoadDriver) {
      btnLoadDriver.addEventListener('click', () => {
        if (window.soundSynth) window.soundSynth.playClick();
        alert('No signed device drivers were found. Make sure that the installation media contains the correct drivers.');
      });
    }

    // New Partition Button (Creates GPT Structure with authentic Windows prompt)
    const btnNew = container.querySelector('#btnPartNew');
    if (btnNew) {
      btnNew.addEventListener('click', () => {
        const confirmNew = confirm('To ensure that all Windows features work correctly, Windows might create additional partitions for system files.\n\nClick OK to proceed with creating partitions.');
        if (confirmNew) {
          if (window.soundSynth) window.soundSynth.playSuccess();
          gptCreated = true;
          window.stateEngine.partitionConfig.gptCreated = true;
          selectedPartId = 'part4'; // auto select Primary partition 4
          redraw();
        }
      });
    }

    // Format Button (Mandatory NTFS with authentic Windows confirmation)
    const btnFormat = container.querySelector('#btnPartFormat');
    if (btnFormat) {
      btnFormat.addEventListener('click', () => {
        if (selectedPartId === 'part4') {
          const confirmFormat = confirm('The partition might contain recovery files, system files, or important software from your computer manufacturer. If you format this partition, any data stored on it will be lost.\n\nClick OK to format.');
          if (confirmFormat) {
            if (window.soundSynth) window.soundSynth.playSuccess();
            primaryFormatted = true;
            window.stateEngine.partitionConfig.primaryFormattedNTFS = true;
            redraw();
          }
        } else {
          window.soundSynth.playErrorBeep();
          window.stateEngine.recordPenalty(5, 0.50, 'محاولة تهيئة قسم نظام محجوز بدلاً من القسم الأساسي');
          alert('Windows cannot format a system partition. Please select Drive 0 Partition 4 to format with NTFS.');
        }
      });
    }

    // Delete Button
    const btnDelete = container.querySelector('#btnPartDelete');
    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        gptCreated = false;
        primaryFormatted = false;
        window.stateEngine.partitionConfig.gptCreated = false;
        window.stateEngine.partitionConfig.primaryFormattedNTFS = false;
        selectedPartId = 'part0';
        redraw();
      });
    }

    // Next Button (Strict verification: GPT & NTFS format required)
    const btnNext = container.querySelector('#btnPartNext');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (!gptCreated) {
          window.soundSynth.playErrorBeep();
          window.stateEngine.recordPenalty(5, 1.00, 'محاولة المتابعة على مساحة غير مخصصة دون إنشاء الأقسام', 'يجب إنشاء جدول الأقسام أولاً بالضغط على New.');
          alert('Windows cannot be installed to this disk. The drive is unallocated space. Please click New to create partitions.');
          return;
        }

        if (selectedPartId !== 'part4') {
          window.soundSynth.playErrorBeep();
          window.stateEngine.recordPenalty(5, 0.50, 'محاولة تثبيت النظام على قسم نظام محجوز بدلاً من القسم الأساسي');
          alert('Windows cannot be installed to this partition. Windows must be installed on the primary partition (Drive 0 Partition 4).');
          return;
        }

        if (!primaryFormatted) {
          window.soundSynth.playErrorBeep();
          window.stateEngine.recordPenalty(
            5,
            1.00,
            'محاولة المتابعة على قسم غير مهيأ دون تهيئته بنظام NTFS',
            'يشترط Windows 11 تهيئة القسم الأساسي بنظام NTFS لضمان الأمان والصلاحيات وموثوقية التخزين.'
          );
          alert('The selected partition is unallocated. You must click Format to format it with the NTFS file system before Windows can be installed.');
          return;
        }

        // Passed checkpoint! Trigger Quiz Checkpoint 3
        window.quizManager.showQuizForBank('bank_partition', () => {
          window.stateEngine.completePhase(5);
        });
      });
    }
  }

  redraw();
}

// ==========================================================================
// PHASE 6: Copying Files, Second Boot Loop & Mandatory USB Removal
// ==========================================================================
function renderPhase6Installation(container) {
  let progressPct = 0;
  let activeStep = 1;

  container.innerHTML = `
    <div class="win11-setup-backdrop">
      <div class="win11-window">
        <div class="win11-titlebar">
          <span>Installing Windows 11</span>
          <span style="color: #888;">&times;</span>
        </div>

        <div class="win11-body">
          <div>
            <h2 class="win11-step-heading">نسخ ملفات النظام وتجهيز التثبيت</h2>
            <p class="win11-step-desc">يرجى الانتظار ريثما يقوم معالج التثبيت بنسخ وفك حزم نظام التشغيل:</p>

            <ul class="progress-list" id="installProgressList">
              <li class="done" id="step1">&#10004; Copying Windows files</li>
              <li class="active" id="step2">&#9679; Getting files ready for installation (<span id="pctSpan">0%</span>)</li>
              <li id="step3">&#9679; Installing features</li>
              <li id="step4">&#9679; Installing updates</li>
              <li id="step5">&#9679; Finishing up</li>
            </ul>
          </div>

          <div style="margin-top: 20px;">
            <div style="height: 6px; background: #333333; border-radius: 3px; overflow: hidden;">
              <div id="installProgressBar" style="width: 0%; height: 100%; background: #0078d4; transition: width 0.3s ease;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const pctSpan = container.querySelector('#pctSpan');
  const bar = container.querySelector('#installProgressBar');
  const step2 = container.querySelector('#step2');
  const step3 = container.querySelector('#step3');
  const step4 = container.querySelector('#step4');
  const step5 = container.querySelector('#step5');

  // Fast simulated progress to meet 30-min lab context
  const interval = setInterval(() => {
    progressPct += 10;
    if (bar) bar.style.width = `${progressPct}%`;
    if (pctSpan) pctSpan.textContent = `${progressPct}%`;

    if (progressPct === 40 && step3) {
      step2.className = 'done';
      step2.innerHTML = '&#10004; Getting files ready for installation (100%)';
      step3.className = 'active';
    } else if (progressPct === 70 && step4) {
      step3.className = 'done';
      step3.innerHTML = '&#10004; Installing features';
      step4.className = 'active';
    } else if (progressPct === 90 && step5) {
      step4.className = 'done';
      step4.innerHTML = '&#10004; Installing updates';
      step5.className = 'active';
    } else if (progressPct >= 100) {
      clearInterval(interval);
      step5.className = 'done';
      step5.innerHTML = '&#10004; Finishing up';

      // Automatic restart: fade to black and 10s countdown
      setTimeout(() => {
        renderPhase6RebootCountdown(container);
      }, 800);
    }
  }, 400);
}

function renderPhase6RebootCountdown(container) {
  let seconds = 10;

  container.innerHTML = `
    <div class="virtual-black-screen flex-center" style="flex-direction: column;">
      <h2 style="color: #38bdf8; margin-bottom: 12px; font-size: 22px;">Windows needs to restart to continue</h2>
      <p style="color: #94a3b8; font-size: 14px; margin-bottom: 24px;">
        Restarting in <span id="rebootCountdownSpan" style="color: #ef4444; font-weight: bold; font-size: 20px;">10</span> seconds...
      </p>

      <div style="background: rgba(255, 255, 255, 0.08); border-left: 4px solid #f59e0b; padding: 14px 20px; border-radius: 4px; max-width: 580px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.6;">
        <strong style="color: #f59e0b;">تنبيه بيداغوجي حاسم:</strong><br>
        أثناء عملية إعادة التشغيل الحالية، يجب عليك مقاطعة الإقلاع بالضغط على <strong>[F2 أو Delete]</strong> لدخول البيوس وإعادة القرص الداخلي <strong>SSD</strong> كجهاز إقلاع أول، يعقبه نزع مفتاح USB لمرة واحدة لمنع الوقوع في حلقة التثبيت اللانهائية!
      </div>

      <button class="fluent-btn fluent-btn-accent" id="btnInterruptSecondBoot">
        الضغط على [F2 / Del] لمقاطعة الإقلاع الثاني ودخول البيوس
      </button>
    </div>
  `;

  const span = container.querySelector('#rebootCountdownSpan');
  const timer = setInterval(() => {
    seconds--;
    if (span) span.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(timer);
      // Student failed to interrupt second boot!
      window.stateEngine.recordPenalty(
        6,
        1.00,
        'فاتتك فرصة مقاطعة الإقلاع الثاني (انقضت المهلة وعاد الجهاز للإقلاع من الفلاشة)',
        'يجب دائماً مقاطعة الإقلاع الثاني لإعادة القرص الصلب الداخلي كإقلاع أول لتفادي إعادة التثبيت.'
      );
      alert('تحذير: لم تقم بمقاطعة الإقلاع الثاني! تم خصم نقطة واحدة. انقر لدخول البيوس الآن.');
      enterSecondBootBios(container);
    }
  }, 1000);

  const interruptBtn = container.querySelector('#btnInterruptSecondBoot');
  if (interruptBtn) {
    interruptBtn.addEventListener('click', () => {
      clearInterval(timer);
      if (window.soundSynth) window.soundSynth.playBeep(880, 0.1);
      enterSecondBootBios(container);
    });
  }
}

function enterSecondBootBios(container) {
  // Launch BIOS in second boot mode
  window.biosController.initBiosScreen('virtualScreenContent', true);
  window.biosController.onSecondBootSuccess = () => {
    // Proceed to mandatory USB unplug screen
    renderPhase6UnplugUsb(container);
  };
}

function renderPhase6UnplugUsb(container) {
  let isUnplugged = false;
  const portEl = document.getElementById('usb-port');
  const towerStatus = document.getElementById('towerLiveStatus');
  const shelfMsg = document.getElementById('shelfConnectionMsg');

  // Ensure the USB drive is visibly inserted in the Left Tower's USB port with target pulse animation
  if (portEl) {
    if (!portEl.querySelector('#usb-drive')) {
      portEl.innerHTML = `
        <div id="usb-drive" class="inserted tower-unplug-target" title="انقر هنا لنزع مفتاح USB فيزيائياً من المنفذ">
          <svg viewBox="0 0 32 32" width="28" height="28">
            <rect class="usb-connector-tip" x="10" y="20" width="12" height="10" fill="#cbd5e1" stroke="#475569" stroke-width="1" rx="1"/>
            <rect x="12.5" y="23" width="2" height="3" fill="#0284c7"/>
            <rect x="17.5" y="23" width="2" height="3" fill="#0284c7"/>
            <rect class="usb-drive-body" x="6" y="2" width="20" height="20" fill="#dc2626" rx="3" stroke="#991b1b" stroke-width="1.5" />
            <line x1="9" y1="7" x2="23" y2="7" stroke="#fca5a5" stroke-width="1" />
            <line x1="9" y1="11" x2="23" y2="11" stroke="#fca5a5" stroke-width="1" />
            <circle cx="16" cy="16" r="1.5" fill="#38bdf8" />
          </svg>
        </div>
      `;
    } else {
      const existingDrive = portEl.querySelector('#usb-drive');
      if (existingDrive) {
        existingDrive.className = 'inserted tower-unplug-target';
        existingDrive.setAttribute('title', 'انقر هنا لنزع مفتاح USB فيزيائياً من المنفذ');
      }
    }
  }

  if (towerStatus) {
    towerStatus.innerHTML = '<span style="color: #f59e0b; font-weight: bold; animation: blinkAmber 1s infinite;">⚠ انقر لنزع الفلاشة</span>';
  }
  if (shelfMsg) {
    shelfMsg.innerHTML = '<span style="color: #f59e0b;">⚠ يجب نزع الفلاشة من الوحدة المركزية</span>';
  }

  function redraw() {
    container.innerHTML = `
      <div class="virtual-black-screen flex-center" style="flex-direction: column; padding: 28px; text-align: center;">
        <div style="font-size: 46px; color: #f59e0b; margin-bottom: 12px; animation: blinkWarn 1.6s infinite ease-in-out;">&#9888;</div>
        <h2 style="color: #ffffff; font-size: 22px; margin-bottom: 8px;">إعادة التشغيل: نزع وسيط التثبيت الخارجي (Physical USB Removal)</h2>
        <p style="color: #94a3b8; font-size: 14px; max-width: 640px; margin-bottom: 24px; line-height: 1.6;">
          تم نسخ ملفات الإقلاع بالكامل داخل قسم EFI بالقرص الصلب الداخلي (SSD).<br>
          <strong style="color: #f8fafc;">لتفادي الوقوع في حلقة الإقلاع وإعادة تشغيل برنامج التثبيت مجدداً (Boot Loop)، يجب الآن نزع مفتاح USB مباشرة من منفذ الوحدة المركزية.</strong>
        </p>

        <!-- Directional Physical Callout to Left Tower -->
        <div class="physical-tower-callout-panel" id="physicalTowerCallout" title="انقر لنزع الفلاشة من الوحدة المركزية">
          <div class="callout-arrow-pointer">&#8592;</div>
          <div class="callout-text-content">
            <strong style="color: #38bdf8; font-size: 15px;">الإجراء المادي المطلوب:</strong>
            <p style="margin: 4px 0 0 0; color: #e2e8f0; font-size: 13.5px; line-height: 1.6;">
              توجه بمؤشر الفأرة إلى <strong>الوحدة المركزية (على يسار الشاشة)</strong>، وانقر مباشرة على <strong>مفتاح USB الأحمر</strong> الموجود بالمنفذ الأمامي لنزعه فيزيائياً من مكانه.
            </p>
          </div>
        </div>

        <div class="unplug-live-status-card" id="unplugLiveStatusCard" style="margin-top: 14px;">
          <span class="status-indicator-dot amber-blink" id="unplugStatusDot"></span>
          <span id="unplugStatusMsg">في انتظار قيامك بنزع مفتاح USB من منفذ الوحدة المركزية على اليسار...</span>
        </div>
      </div>
    `;

    function handlePhysicalRemoval() {
      if (isUnplugged) return;
      isUnplugged = true;

      if (window.soundSynth) window.soundSynth.playSuccess();

      // Physical unplug animation on the Left Tower's USB port
      const currentPort = document.getElementById('usb-port');
      const currentDrive = currentPort ? currentPort.querySelector('#usb-drive') : null;

      if (currentDrive) {
        currentDrive.classList.remove('tower-unplug-target');
        currentDrive.classList.add('usb-drive-detaching');
      }

      setTimeout(() => {
        if (currentPort) currentPort.innerHTML = ''; // Physically empty port on the Central Unit!

        const tStatus = document.getElementById('towerLiveStatus');
        const sMsg = document.getElementById('shelfConnectionMsg');
        const uStatus = document.getElementById('usbPlugStatus');
        const sUsbSlot = document.getElementById('usbShelfSlot');

        if (tStatus) tStatus.textContent = '✔ تم فصل الفلاشة بنجاح';
        if (sMsg) sMsg.textContent = '✔ تم فصل مفتاح USB بنجاح لمنع حلقة الإقلاع';
        if (uStatus) uStatus.textContent = '○ غير موصول (Detached)';
        if (sUsbSlot) {
          sUsbSlot.innerHTML = `
            <div id="usb-drive" class="detached" title="مفتاح Kingston 32GB">
              <svg viewBox="0 0 32 32" width="28" height="28">
                <rect class="usb-connector-tip" x="10" y="2" width="12" height="10" fill="#cbd5e1" stroke="#475569" stroke-width="1" rx="1"/>
                <rect x="12.5" y="4" width="2" height="3" fill="#0284c7"/>
                <rect x="17.5" y="4" width="2" height="3" fill="#0284c7"/>
                <rect class="usb-drive-body" x="6" y="10" width="20" height="20" fill="#dc2626" rx="3" stroke="#991b1b" stroke-width="1.5"/>
                <line x1="9" y1="15" x2="23" y2="15" stroke="#fca5a5" stroke-width="1" />
                <line x1="9" y1="19" x2="23" y2="19" stroke="#fca5a5" stroke-width="1" />
                <circle cx="16" cy="24" r="1.5" fill="#38bdf8"/>
              </svg>
            </div>
          `;
        }

        // Update state engine
        window.stateEngine.secondBootConfig.usbUnplugged = true;
        window.stateEngine.selectedMedia = null;

        // Visual screen confirmation
        const statusMsg = document.getElementById('unplugStatusMsg');
        const statusDot = document.getElementById('unplugStatusDot');
        const callout = document.getElementById('physicalTowerCallout');

        if (statusDot) statusDot.className = 'status-indicator-dot green-active';
        if (statusMsg) {
          statusMsg.innerHTML = '<strong style="color: #34d399;">✔ رائع! تم نزع مفتاح USB فيزيائياً من الوحدة المركزية بنجاح.</strong>';
        }
        if (callout) {
          callout.style.borderColor = '#10b981';
          callout.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.4)';
          callout.innerHTML = `
            <div style="font-size: 32px; color: #10b981; flex-shrink: 0;">✔</div>
            <div class="callout-text-content">
              <strong style="color: #34d399; font-size: 15px;">تم النزع بنجاح من الوحدة المركزية!</strong>
              <p style="margin: 4px 0 0 0; color: #cbd5e1; font-size: 13.5px;">
                المنفذ أصبح فارغاً تماماً. جاري متابعة الإقلاع الذاتي لنظام Windows 11 من القرص الداخلي SSD...
              </p>
            </div>
          `;
        }

        // Proceed to Windows 11 spinning logo and checkpoint quiz
        setTimeout(() => {
          renderPhase6Win11BootLogo(container, () => {
            window.quizManager.showQuizForBank('bank_second_boot', () => {
              window.stateEngine.completePhase(6);
            });
          });
        }, 1300);
      }, 450);
    }

    // Attach click events to the real physical elements on the Left Tower
    const pEl = document.getElementById('usb-port');
    if (pEl) pEl.onclick = handlePhysicalRemoval;

    const tDrive = document.getElementById('usb-drive');
    if (tDrive) tDrive.onclick = handlePhysicalRemoval;

    // Accessibility / touchscreen fallback: clicking the callout panel also triggers the physical removal
    const calloutPanel = container.querySelector('#physicalTowerCallout');
    if (calloutPanel) calloutPanel.onclick = handlePhysicalRemoval;
  }

  redraw();
}

function renderPhase6Win11BootLogo(container, onComplete) {
  container.innerHTML = `
    <div class="virtual-black-screen flex-center" style="flex-direction: column;">
      <div style="width: 64px; height: 64px; margin-bottom: 28px;">
        <img src="assets/logo-win11-white.svg" class="win11-official-logo" style="width: 100%; height: 100%;" alt="Windows 11">
      </div>
      <div class="spinner-win11"></div>
      <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">Getting ready...</p>
    </div>
  `;

  setTimeout(() => {
    if (typeof onComplete === 'function') onComplete();
  }, 3000);
}

// ==========================================================================
// PHASE 7: OOBE & Local Privacy Setup (Turn ALL 7 switches OFF)
// ==========================================================================
function renderPhase7OOBE(container) {
  renderPhase7Country(container);
}

function renderPhase7Country(container) {
  container.innerHTML = `
    <div class="oobe-backdrop">
      <div class="oobe-card">
        <h2 class="oobe-title">Is this the right country or region?</h2>
        <p class="oobe-desc">اختر الدولة المناسبة لإعداد بيئة العمل المدرسية:</p>

        <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 10px; max-height: 180px; overflow-y: auto; margin-bottom: 20px;">
          <div class="partition-row selected" style="padding: 10px;">
            <span><strong>Algeria (الجزائر)</strong></span>
          </div>
          <div class="partition-row" style="padding: 10px;">
            <span>France</span>
          </div>
          <div class="partition-row" style="padding: 10px;">
            <span>United States</span>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <button class="fluent-btn fluent-btn-accent" id="btnOobeCountryNext">Yes &gt;</button>
        </div>
      </div>
    </div>
  `;

  const nextBtn = container.querySelector('#btnOobeCountryNext');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (window.soundSynth) window.soundSynth.playClick();
      renderPhase7NamePc(container);
    });
  }
}

function renderPhase7NamePc(container) {
  container.innerHTML = `
    <div class="oobe-backdrop">
      <div class="oobe-card">
        <h2 class="oobe-title">Let's name your PC</h2>
        <p class="oobe-desc">عيّن اسماً مميزاً لمحطة العمل داخل شبكة مخبر الإعلام الآلي (مثال: LAB-PC-01):</p>

        <div style="margin-bottom: 24px;">
          <input type="text" class="win11-input" id="inpPcName" value="LAB-PC-01" style="height: 38px; font-size: 14px;">
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <button class="fluent-btn fluent-btn-accent" id="btnOobeNameNext">Next &gt;</button>
        </div>
      </div>
    </div>
  `;

  const nextBtn = container.querySelector('#btnOobeNameNext');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (window.soundSynth) window.soundSynth.playClick();
      renderPhase7Account(container);
    });
  }
}

function renderPhase7Account(container) {
  container.innerHTML = `
    <div class="oobe-backdrop">
      <div class="oobe-card">
        <h2 class="oobe-title">Who's going to use this device?</h2>
        <p class="oobe-desc">إنشاء حساب محلي مستقل ومحمي برمز PIN (Offline Local Account):</p>

        <div style="margin-bottom: 14px;">
          <label class="win11-label">اسم المستخدم (User name):</label>
          <input type="text" class="win11-input" id="inpUsername" value="Eleve_1AS" style="height: 36px;">
        </div>

        <div style="margin-bottom: 20px;">
          <label class="win11-label">رمز PIN للحساب:</label>
          <input type="password" class="win11-input" id="inpPin" value="1234" style="height: 36px;">
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <button class="fluent-btn fluent-btn-accent" id="btnOobeAccountNext">Next &gt;</button>
        </div>
      </div>
    </div>
  `;

  const nextBtn = container.querySelector('#btnOobeAccountNext');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (window.soundSynth) window.soundSynth.playClick();
      renderPhase7PrivacySwitches(container);
    });
  }
}

function renderPhase7PrivacySwitches(container) {
  // 7 Mandatory Privacy Switches (All must be turned OFF)
  const switches = [
    { id: 'swLocation', name: 'Location (الموقع الجغرافي)', desc: 'السماح للخدمات بالوصول لموقع محطة العمل الجغرافي.' },
    { id: 'swFind', name: 'Find my device (العثور على جهازي)', desc: 'تتبع مكان الجهاز عبر خدمات السحابة الخارجية.' },
    { id: 'swDiagnostics', name: 'Diagnostic data (بيانات التشخيص الكاملة)', desc: 'إرسال بيانات الاستخدام وسجلات النظام لشركة مايكروسوفت.' },
    { id: 'swInking', name: 'Inking & typing (التعرف على الكتابة والطباعة)', desc: 'إرسال مدخلات لوحة المفاتيح والتدقيق اللغوي للخوادم.' },
    { id: 'swTailored', name: 'Tailored experiences (التجارب المخصصة)', desc: 'السماح بتوجيه نصائح وإعلانات بناءً على سلوك التلميذ.' },
    { id: 'swAdId', name: 'Advertising ID (المعرّف الإعلاني الرقمي)', desc: 'تتبع النشاط لعرض إعلانات موجهة تجارياً للمستخدم.' },
    { id: 'swPresence', name: 'Presence sensing (استشعار الحضور)', desc: 'استخدام أجهزة الاستشعار لرصد وجود التلميذ أمام الشاشة.' }
  ];

  container.innerHTML = `
    <div class="oobe-backdrop">
      <div class="oobe-card" style="max-width: 700px;">
        <h2 class="oobe-title">Choose privacy settings for your device</h2>
        <p class="oobe-desc" style="color: #fca5a5;">
          <strong>معيار الخصوصية التربوية:</strong> يجب تعطيل كافة خيارات التتبع والتشخيص السبعة (Turn All 7 OFF) لحماية خصوصية التلاميذ وترشيد استهلاك الشبكة المدرسية:
        </p>

        <div class="privacy-switches-list">
          ${switches.map(s => `
            <div class="privacy-switch-item">
              <div class="privacy-switch-text">
                <strong>${s.name}</strong>
                <span>${s.desc}</span>
              </div>
              <label class="fluent-switch">
                <input type="checkbox" id="${s.id}" checked>
                <span class="fluent-slider"></span>
              </label>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <button class="fluent-btn fluent-btn-standard" id="btnTurnAllOff" style="color: #38bdf8;">
            تعطيل الكل دفعة واحدة (Turn All OFF)
          </button>
          <button class="fluent-btn fluent-btn-accent" id="btnPrivacyAccept">Accept (تأكيد الإعدادات)</button>
        </div>
      </div>
    </div>
  `;

  // Quick Turn All OFF button
  const btnAllOff = container.querySelector('#btnTurnAllOff');
  if (btnAllOff) {
    btnAllOff.addEventListener('click', () => {
      if (window.soundSynth) window.soundSynth.playClick();
      switches.forEach(s => {
        const inp = container.querySelector(`#${s.id}`);
        if (inp) inp.checked = false;
      });
    });
  }

  // Accept button with strict checking
  const btnAccept = container.querySelector('#btnPrivacyAccept');
  if (btnAccept) {
    btnAccept.addEventListener('click', () => {
      let anyOn = false;
      switches.forEach(s => {
        const inp = container.querySelector(`#${s.id}`);
        if (inp && inp.checked) anyOn = true;
      });

      if (anyOn) {
        window.soundSynth.playErrorBeep();
        window.stateEngine.recordPenalty(
          7,
          1.00,
          'ترك خيارات التتبع والتشخيص مفعلة في شاشة الخصوصية OOBE',
          'يجب تعطيل خيارات التتبع والتشخيص لحماية سرية بيانات المتعلمين في البيئة التربوية.'
        );
        alert('تنبيه بيداغوجي: لقد تركت بعض خيارات التتبع مفعلة! تم خصم نقطة واحدة. يرجى تعطيل كافة المفاتيح السبعة.');
        return;
      }

      // Success! Trigger Quiz Checkpoint 5
      window.quizManager.showQuizForBank('bank_oobe', () => {
        window.stateEngine.completePhase(7);
      });
    });
  }
}

// ==========================================================================
// PHASE 8: Final OS Loop & Independent Boot Loop
// ==========================================================================
function renderPhase8Desktop(container) {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });

  container.innerHTML = `
    <div class="desktop-screen" id="win11DesktopContainer">
      <!-- Desktop Icons Area -->
      <div class="desktop-icons-area">
        <div class="desktop-icon-item" title="This PC" tabindex="0">
          <img src="assets/icon-thispc.svg" alt="This PC">
          <span>This PC</span>
        </div>
        <div class="desktop-icon-item" title="Recycle Bin" tabindex="0">
          <img src="assets/icon-recycle.svg" alt="Recycle Bin">
          <span>Recycle Bin</span>
        </div>
      </div>

      <!-- Start Menu Popup -->
      <div class="start-menu-popup" id="startMenuPopup">
        <!-- Search Box -->
        <div class="start-search-box">
          <img src="assets/icon-search.svg" alt="Search">
          <input type="text" class="start-search-input" placeholder="Type here to search..." readonly>
        </div>

        <!-- Pinned Section -->
        <div class="start-section-header">
          <span>Pinned</span>
          <span style="font-size: 11px; color: #38bdf8; cursor: pointer;">All apps &gt;</span>
        </div>
        <div class="start-pinned-grid">
          <div class="start-app-item" title="Microsoft Edge">
            <img src="assets/icon-edge.svg" alt="Edge">
            <span>Edge</span>
          </div>
          <div class="start-app-item" title="File Explorer">
            <img src="assets/icon-explorer.svg" alt="Explorer">
            <span>Explorer</span>
          </div>
          <div class="start-app-item" title="Microsoft Store">
            <img src="assets/icon-store.svg" alt="Store">
            <span>Store</span>
          </div>
          <div class="start-app-item" title="Settings">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span>Settings</span>
          </div>
          <div class="start-app-item" title="Notepad">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#93c5fd" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <line x1="10" y1="9" x2="8" y2="9"/>
            </svg>
            <span>Notepad</span>
          </div>
          <div class="start-app-item" title="Calculator">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#c084fc" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2"/>
              <line x1="8" y1="6" x2="16" y2="6"/>
              <line x1="16" y1="14" x2="16" y2="18"/>
              <circle cx="8" cy="10" r="1" fill="#c084fc"/>
              <circle cx="12" cy="10" r="1" fill="#c084fc"/>
              <circle cx="16" cy="10" r="1" fill="#c084fc"/>
              <circle cx="8" cy="14" r="1" fill="#c084fc"/>
              <circle cx="12" cy="14" r="1" fill="#c084fc"/>
              <circle cx="8" cy="18" r="1" fill="#c084fc"/>
              <circle cx="12" cy="18" r="1" fill="#c084fc"/>
            </svg>
            <span>Calculator</span>
          </div>
        </div>

        <!-- Recommended Section -->
        <div class="start-recommended-section">
          <div class="start-section-header">
            <span>Recommended</span>
            <span style="font-size: 11px; color: #38bdf8; cursor: pointer;">More &gt;</span>
          </div>
          <div class="start-recommended-item">
            <img src="assets/icon-explorer.svg" alt="Document">
            <div>
              <div class="title">منهاج_الإعلام_الآلي_1AS.pdf</div>
              <div class="sub">تم الفتح مؤخراً • مخبر الإعلام الآلي</div>
            </div>
          </div>
          <div class="start-recommended-item">
            <img src="assets/icon-explorer.svg" alt="Document">
            <div>
              <div class="title">دليل_تنصيب_الويندوز_الجزائر.docx</div>
              <div class="sub">منذ ساعتين • السنة الأولى ثانوي</div>
            </div>
          </div>
        </div>

        <!-- Start Menu Footer -->
        <div class="start-menu-footer">
          <div class="start-user-profile" title="Current Student Account">
            <div class="start-user-avatar">1AS</div>
            <span style="font-size: 12.5px; font-weight: 600; color: #fff;">Eleve_1AS</span>
          </div>

          <div style="position: relative;">
            <button class="power-btn-trigger" id="btnStartPower" title="Power" aria-label="Power Options">
              &#x23FB;
            </button>
            <div class="power-menu-dropdown" id="powerMenuDropdown">
              <button class="power-menu-item" id="btnSleepOS" type="button">
                <span style="font-size: 14px;">&#9790;</span> Sleep (سكون)
              </button>
              <button class="power-menu-item" id="btnShutdownOS" type="button">
                <span style="font-size: 14px;">&#x23FB;</span> Shut down (إيقاف التشغيل)
              </button>
              <button class="power-menu-item" id="btnRestartOS" type="button">
                <span style="font-size: 14px;">&#8635;</span> Restart (إعادة التشغيل)
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Windows 11 Centered Acrylic Taskbar -->
      <div class="taskbar">
        <div style="width: 140px; display: flex; align-items: center;"></div>

        <div class="taskbar-center">
          <button class="taskbar-icon-btn" id="btnTaskbarStart" title="Start" aria-label="Start Menu">
            <img src="assets/icon-start.svg" class="win11-official-logo" alt="Start">
          </button>
          <button class="taskbar-icon-btn" title="Search" aria-label="Search">
            <img src="assets/icon-search.svg" alt="Search">
          </button>
          <button class="taskbar-icon-btn" title="Task View" aria-label="Task View">
            <img src="assets/icon-taskview.svg" alt="Task View">
          </button>
          <button class="taskbar-icon-btn" title="Widgets" aria-label="Widgets">
            <img src="assets/icon-widgets.svg" alt="Widgets">
          </button>
          <button class="taskbar-icon-btn" title="File Explorer" aria-label="File Explorer">
            <img src="assets/icon-explorer.svg" alt="File Explorer">
          </button>
          <button class="taskbar-icon-btn" title="Microsoft Edge" aria-label="Microsoft Edge">
            <img src="assets/icon-edge.svg" alt="Microsoft Edge">
          </button>
          <button class="taskbar-icon-btn" title="Microsoft Store" aria-label="Microsoft Store">
            <img src="assets/icon-store.svg" alt="Microsoft Store">
          </button>
        </div>

        <div class="taskbar-tray">
          <div class="tray-quick-icons" title="Quick Settings (Network, Volume, Battery)">
            <img src="assets/icon-tray-network.svg" alt="Network">
            <img src="assets/icon-tray-volume.svg" alt="Volume">
            <img src="assets/icon-tray-battery.svg" alt="Battery">
          </div>
          <div class="tray-clock" title="${currentDate}">
            <div class="time">${currentTime}</div>
            <div class="date">${currentDate}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Start button toggle
  const startBtn = container.querySelector('#btnTaskbarStart');
  const startMenu = container.querySelector('#startMenuPopup');
  const powerBtn = container.querySelector('#btnStartPower');
  const powerMenu = container.querySelector('#powerMenuDropdown');
  const restartBtn = container.querySelector('#btnRestartOS');
  const shutdownBtn = container.querySelector('#btnShutdownOS');

  startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.soundSynth) window.soundSynth.playClick();
    startMenu.classList.toggle('visible');
    startBtn.classList.toggle('active', startMenu.classList.contains('visible'));
    powerMenu.classList.remove('visible');
  });

  powerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.soundSynth) window.soundSynth.playClick();
    powerMenu.classList.toggle('visible');
  });

  const sleepBtn = container.querySelector('#btnSleepOS');
  if (sleepBtn) {
    sleepBtn.addEventListener('click', () => {
      window.soundSynth.playErrorBeep();
      window.stateEngine.recordPenalty(8, 0.50, 'اختيار السكون (Sleep) بدلاً من إعادة التشغيل (Restart) لاختبار الإقلاع الذاتي', 'الهدف البيداغوجي هو الضغط على Restart للتحقق الفوري من إقلاع النظام ذاتياً من القرص الداخلي.');
      alert('تنبيه: لاختبار الإقلاع الذاتي والمستقل من القرص الصلب الداخلي، يجب الضغط على Restart (إعادة التشغيل).');
    });
  }

  if (shutdownBtn) {
    shutdownBtn.addEventListener('click', () => {
      window.soundSynth.playErrorBeep();
      window.stateEngine.recordPenalty(8, 0.50, 'اختيار إيقاف التشغيل بدلاً من إعادة التشغيل (Restart) لاختبار الإقلاع الذاتي', 'الهدف البيداغوجي هو الضغط على Restart للتحقق الفوري من إقلاع النظام ذاتياً من القرص الداخلي.');
      alert('تم النقر على إيقاف التشغيل (Shut down). لمتابعة التحقق البيداغوجي النهائي من إقلاع الويندوز المستقل، اختر: Restart (إعادة التشغيل).');
    });
  }

  document.addEventListener('click', () => {
    if (startMenu) {
      startMenu.classList.remove('visible');
      if (startBtn) startBtn.classList.remove('active');
    }
    if (powerMenu) powerMenu.classList.remove('visible');
  });

  // Final Independent Reboot Loop Test (Start -> Power -> Restart)
  restartBtn.addEventListener('click', () => {
    if (window.soundSynth) window.soundSynth.playClick();
    executeIndependentRebootCycle(container);
  });
}

function executeIndependentRebootCycle(container) {
  // 1. Quick Shutdown screen with official white logo
  container.innerHTML = `
    <div class="virtual-black-screen flex-center" style="flex-direction: column;">
      <div style="width: 56px; height: 56px; margin-bottom: 24px;">
        <img src="assets/logo-win11-white.svg" class="win11-official-logo" style="width: 100%; height: 100%;" alt="Windows 11">
      </div>
      <div class="spinner-win11"></div>
      <p style="color: #ffffff; font-size: 15px; margin-top: 18px;">Restarting...</p>
    </div>
  `;

  setTimeout(() => {
    // 2. Clean Self-POST from SSD
    if (window.soundSynth) window.soundSynth.playBeep(880, 0.08);

    container.innerHTML = `
      <div class="virtual-black-screen">
        <div class="post-header-line">American Megatrends BIOS v2.22 - Fast Boot Verification</div>
        <div class="post-body-text" style="color: #34d399;">
          Testing Storage Controller ... NVMe / SATA OK<br>
          Booting from Primary Drive: CT500MX500SSD1 (GPT Partition 4: Windows Boot Manager)<br>
          No external media attached. Clean independent OS boot verified ✔
        </div>
        <div style="margin-top: 25px;">
          <div class="spinner-win11"></div>
        </div>
      </div>
    `;

    setTimeout(() => {
      // 3. Final Quiz Checkpoint 6
      window.quizManager.showQuizForBank('bank_final', () => {
        // Grand Finale!
        window.stateEngine.completePhase(8);
      });
    }, 2200);
  }, 1200);
}
