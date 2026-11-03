const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Low-end legacy hardware optimization flags (Intel Celeron, Pentium, Core 2 Duo, 2GB RAM, Win7/8/10/11)
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');

let mainWindow = null;

// ==========================================================================
// Encrypted Settings System (inf.dll) via Node.js crypto (AES-256-CBC)
// ==========================================================================
// Fixed 32-byte key derived from a dedicated hash
const SETTINGS_KEY = crypto.createHash('sha256').update('DZ-WIN11-EDU-SIMULATOR-TEACHER-KEY-2026-ALG').digest();

function getSettingsFilePath() {
  const baseDir = process.env.PORTABLE_EXECUTABLE_DIR || (app.isPackaged ? path.dirname(process.execPath) : __dirname);
  return path.join(baseDir, 'inf.dll');
}

function encryptPayload(plainText) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', SETTINGS_KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  // Store as text file: base64(iv) + ":" + base64(ciphertext)
  return iv.toString('base64') + ':' + encrypted;
}

function decryptPayload(cipherText) {
  const parts = cipherText.trim().split(':');
  if (parts.length !== 2) throw new Error('Invalid encrypted settings format in inf.dll');
  const iv = Buffer.from(parts[0], 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', SETTINGS_KEY, iv);
  let decrypted = decipher.update(parts[1], 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(salt + password).digest('hex');
}

function readSettingsFile() {
  const filePath = getSettingsFilePath();
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const encryptedText = fs.readFileSync(filePath, 'utf8');
  const jsonText = decryptPayload(encryptedText);
  return JSON.parse(jsonText);
}

function writeSettingsFile(settingsObj) {
  const filePath = getSettingsFilePath();
  const jsonText = JSON.stringify(settingsObj, null, 2);
  const encryptedText = encryptPayload(jsonText);
  fs.writeFileSync(filePath, encryptedText, 'utf8');
  return true;
}

// IPC: Settings Management
ipcMain.handle('settings:exists', async () => {
  const filePath = getSettingsFilePath();
  return fs.existsSync(filePath);
});

ipcMain.handle('settings:load', async () => {
  try {
    const data = readSettingsFile();
    if (!data) {
      return { success: false, exists: false };
    }
    // Return sanitized data (without exposing password hash to renderer)
    return {
      success: true,
      exists: true,
      data: {
        version: data.version || 1,
        teacher: {
          full_name: (data.teacher && data.teacher.full_name) || ''
        },
        institution: data.institution || '',
        school_year: data.school_year || '',
        groups: Array.isArray(data.groups) ? data.groups : [],
        session_mode_enabled: data.session_mode_enabled !== false
      }
    };
  } catch (err) {
    console.error('Error loading settings from inf.dll:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('settings:verifyPassword', async (_event, password) => {
  try {
    const data = readSettingsFile();
    if (!data || !data.teacher || !data.teacher.password_hash || !data.teacher.password_salt) {
      return { success: false, error: 'Settings file not found or corrupted' };
    }
    const computedHash = hashPassword(password, data.teacher.password_salt);
    const isValid = computedHash === data.teacher.password_hash;
    return { success: isValid };
  } catch (err) {
    console.error('Error verifying password:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('settings:save', async (_event, updateData) => {
  try {
    let current = readSettingsFile();
    if (!current) {
      current = {
        version: 1,
        teacher: { full_name: '', password_salt: '', password_hash: '' },
        institution: '',
        school_year: '',
        groups: [],
        session_mode_enabled: true
      };
    }

    if (updateData.teacher) {
      if (typeof updateData.teacher.full_name === 'string') {
        current.teacher.full_name = updateData.teacher.full_name.trim();
      }
      if (updateData.teacher.new_password) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = hashPassword(updateData.teacher.new_password, salt);
        current.teacher.password_salt = salt;
        current.teacher.password_hash = hash;
      }
    }

    if (typeof updateData.institution === 'string') {
      current.institution = updateData.institution.trim();
    }
    if (typeof updateData.school_year === 'string') {
      current.school_year = updateData.school_year.trim();
    }
    if (Array.isArray(updateData.groups)) {
      current.groups = updateData.groups.map(g => String(g).trim()).filter(Boolean);
    }
    if (typeof updateData.session_mode_enabled === 'boolean') {
      current.session_mode_enabled = updateData.session_mode_enabled;
    }
    if (typeof updateData.force_french_names === 'boolean') {
      current.force_french_names = updateData.force_french_names;
    }

    writeSettingsFile(current);
    return { success: true };
  } catch (err) {
    console.error('Error saving settings to inf.dll:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('settings:createInitial', async (_event, initialData) => {
  try {
    const password = initialData.password || '';
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);

    const initialSettings = {
      version: 1,
      teacher: {
        full_name: (initialData.full_name || '').trim(),
        password_salt: salt,
        password_hash: hash
      },
      institution: (initialData.institution || '').trim(),
      school_year: (initialData.school_year || '').trim(),
      groups: Array.isArray(initialData.groups) && initialData.groups.length > 0 
        ? initialData.groups.map(g => String(g).trim()).filter(Boolean)
        : ['1AS-01 (جذع مشترك علوم)', '1AS-02 (جذع مشترك علوم)', '1AS-03 (جذع مشترك آداب)'],
      session_mode_enabled: initialData.session_mode_enabled !== false,
      force_french_names: initialData.force_french_names !== false
    };

    writeSettingsFile(initialSettings);
    return { success: true };
  } catch (err) {
    console.error('Error creating initial settings in inf.dll:', err);
    return { success: false, error: err.message };
  }
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    center: true,
    focusable: true,
    acceptFirstMouse: true,
    autoHideMenuBar: true,
    title: 'محاكي تنصيب ويندوز 11 التعليمي - المنهاج الجزائري',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false
    }
  });

  mainWindow.maximize();
  mainWindow.setFullScreen(true);

  mainWindow.webContents.on('did-finish-load', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.focus();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // F11 fullscreen shortcut
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      const isFull = mainWindow.isFullScreen();
      mainWindow.setFullScreen(!isFull);
      mainWindow.webContents.send('window-fullscreen-changed', !isFull);
      event.preventDefault();
    }
  });

  mainWindow.on('enter-full-screen', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-fullscreen-changed', true);
    }
  });

  mainWindow.on('leave-full-screen', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-fullscreen-changed', false);
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Helper: Sanitize filename for Windows (preserves UTF-8 Arabic)
function sanitizeFilename(name, fallback = 'unknown') {
  if (!name || typeof name !== 'string' || !name.trim()) return fallback;
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[.\s]+$/g, '') || fallback;
}

// IPC: PDF Generation & Direct Save to Desktop
ipcMain.handle('save-pdf-report', async (_event, data) => {
  try {
    const payload = data.payload || data;
    const student = payload.student || {};
    const evalData = payload.evaluation || {};
    const safeGroup = sanitizeFilename(student.group, 'unknown');
    const gradeStr = evalData.sortableGrade || '00.00';
    const timeStr = evalData.sortableTime || '00-00-00';
    const safeLastName = sanitizeFilename(student.lastName, 'unknown');
    const safeFirstName = sanitizeFilename(student.firstName, 'unknown');

    const defaultFilename = `${safeGroup}_${gradeStr}_${timeStr}_${safeLastName}_${safeFirstName}.pdf`;
    let targetFilename = (data && data.fileName && typeof data.fileName === 'string' && data.fileName.trim())
      ? data.fileName.trim()
      : defaultFilename;

    if (!targetFilename.toLowerCase().endsWith('.pdf')) {
      targetFilename += '.pdf';
    }
    const cleanBase = sanitizeFilename(targetFilename.slice(0, -4), 'report');
    targetFilename = `${cleanBase.slice(0, 195)}.pdf`;

    let desktopDir;
    try {
      desktopDir = app.getPath('desktop');
    } catch {
      desktopDir = path.join(process.env.USERPROFILE || 'C:\\Users\\Public', 'Desktop');
    }

    if (!fs.existsSync(desktopDir)) {
      try {
        desktopDir = app.getPath('documents');
      } catch {
        desktopDir = app.getPath('userData');
      }
    }

    const targetFilePath = path.join(desktopDir, targetFilename);

    // Create a hidden window to render the official report template
    const printWindow = new BrowserWindow({
      show: false,
      width: 1024,
      height: 1400,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false
      }
    });

    let reportTemplatePath = path.join(__dirname, 'report', 'report-template.html');
    if (!fs.existsSync(reportTemplatePath)) {
      const fallbackPath = path.join(__dirname, 'src', 'report', 'report-template.html');
      if (fs.existsSync(fallbackPath)) {
        reportTemplatePath = fallbackPath;
      }
    }
    await printWindow.loadFile(reportTemplatePath);

    // Inject data into the template
    await printWindow.webContents.executeJavaScript(`
      if (typeof window.__injectReport === 'function') {
        window.__injectReport(${JSON.stringify(payload)});
      }
    `);

    // Allow CSS/layout to stabilize
    await new Promise(resolve => setTimeout(resolve, 350));

    // Generate PDF buffer
    const pdfBuffer = await printWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: {
        marginType: 'custom',
        top: 0.35,
        bottom: 0.35,
        left: 0.35,
        right: 0.35
      }
    });

    // Write file directly to Desktop
    fs.writeFileSync(targetFilePath, pdfBuffer);

    printWindow.destroy();

    return {
      success: true,
      filePath: targetFilePath,
      fileName: targetFilename
    };
  } catch (err) {
    console.error('Error generating PDF report:', err);
    return {
      success: false,
      error: err.message
    };
  }
});

// IPC: Show generated file in Explorer
ipcMain.handle('show-in-folder', async (_event, filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
      return { success: true };
    }
    return { success: false, error: 'File does not exist' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: Toggle Fullscreen
ipcMain.handle('toggle-fullscreen', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const isFull = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFull);
    mainWindow.webContents.send('window-fullscreen-changed', !isFull);
    return !isFull;
  }
  return false;
});

// IPC: Get Fullscreen State
ipcMain.handle('is-fullscreen', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow.isFullScreen();
  }
  return false;
});

// IPC: Quit App
ipcMain.handle('quit-app', () => {
  app.quit();
});

// IPC: Get Desktop Path
ipcMain.handle('get-desktop-path', () => {
  try {
    return app.getPath('desktop');
  } catch {
    return path.join(process.env.USERPROFILE || 'C:\\', 'Desktop');
  }
});

// IPC: Open External URL safely
ipcMain.handle('app:openExternal', async (_event, url) => {
  try {
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:'))) {
      await shell.openExternal(url);
      return { success: true };
    }
    return { success: false, error: 'Invalid URL scheme' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
