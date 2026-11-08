using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Media;
using System.Windows.Forms;

namespace StudentAgent
{
    public class AgentForm : Form
    {
        private UdpListener _udpListener;
        private StudentClient _client;
        private System.Windows.Forms.Timer _reconnectTimer;
        private NotifyIcon _trayIcon;

        private string _lastTeacherIp;
        private int _lastTeacherPort = 8888;
        private string _activeSection;
        private string _detectedReport;

        // UI Controls
        private Panel _headerPanel;
        private Label _lblHeaderTitle;
        private Label _lblStatus;
        private Label _lblTeacherInfo;
        private Label _lblDetectedFile;
        private Button _btnSendNow;
        private Button _btnManualConnect;
        private Button _btnMinimizeTray;

        public AgentForm()
        {
            InitializeComponent();
            StartAgentServices();
        }

        private void InitializeComponent()
        {
            this.Text = "عميل تسليم التقارير - حاسوب التلميذ";
            this.Size = new Size(460, 240);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;
            this.RightToLeft = RightToLeft.Yes;
            this.RightToLeftLayout = true;
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            this.BackColor = Color.FromArgb(248, 250, 252);
            this.Icon = SystemIcons.Information;

            // Header Panel
            _headerPanel = new Panel
            {
                Dock = DockStyle.Top,
                Height = 65,
                BackColor = Color.FromArgb(15, 23, 42), // Slate 900
                Padding = new Padding(12)
            };

            _lblHeaderTitle = new Label
            {
                Text = "📡 عميل تسليم تقارير التقييم إلى الأستاذ",
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 11.5f, FontStyle.Bold),
                AutoSize = true,
                Location = new Point(12, 10)
            };

            _lblStatus = new Label
            {
                Text = "🔍 جاري البحث التلقائي عن خادم الأستاذ في الشبكة...",
                ForeColor = Color.FromArgb(254, 240, 138), // Yellow 200
                Font = new Font("Segoe UI", 9.5f, FontStyle.Regular),
                AutoSize = true,
                Location = new Point(12, 36)
            };

            _headerPanel.Controls.Add(_lblHeaderTitle);
            _headerPanel.Controls.Add(_lblStatus);

            // Center Info
            _lblTeacherInfo = new Label
            {
                Text = "حاسوب الأستاذ: غير متصل ⚪",
                Location = new Point(15, 80),
                AutoSize = true,
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(71, 85, 105)
            };

            _lblDetectedFile = new Label
            {
                Text = "التقرير المكتشف على سطح المكتب: جاري الفحص...",
                Location = new Point(15, 110),
                AutoSize = true,
                Font = new Font("Segoe UI", 9f, FontStyle.Regular),
                ForeColor = Color.FromArgb(15, 23, 42)
            };

            // Buttons
            _btnSendNow = new Button
            {
                Text = "🚀 إرسال تقريري للأستاذ الآن",
                Location = new Point(15, 145),
                Width = 200,
                Height = 38,
                BackColor = Color.FromArgb(16, 185, 129), // Emerald 500
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand,
                Enabled = false
            };
            _btnSendNow.FlatAppearance.BorderSize = 0;
            _btnSendNow.Click += (s, e) => SendReportNow();

            _btnManualConnect = new Button
            {
                Text = "⚙️ تحديد IP الأستاذ يدوياً",
                Location = new Point(225, 145),
                Width = 145,
                Height = 38,
                BackColor = Color.FromArgb(226, 232, 240),
                ForeColor = Color.FromArgb(30, 41, 59),
                Font = new Font("Segoe UI", 9f, FontStyle.Regular),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            _btnManualConnect.FlatAppearance.BorderSize = 0;
            _btnManualConnect.Click += (s, e) => PromptManualIp();

            _btnMinimizeTray = new Button
            {
                Text = "إخفاء 🔽",
                Location = new Point(380, 145),
                Width = 55,
                Height = 38,
                BackColor = Color.FromArgb(203, 213, 225),
                ForeColor = Color.FromArgb(30, 41, 59),
                Font = new Font("Segoe UI", 9f, FontStyle.Regular),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            _btnMinimizeTray.FlatAppearance.BorderSize = 0;
            _btnMinimizeTray.Click += (s, e) => HideToTray();

            this.Controls.Add(_headerPanel);
            this.Controls.Add(_lblTeacherInfo);
            this.Controls.Add(_lblDetectedFile);
            this.Controls.Add(_btnSendNow);
            this.Controls.Add(_btnManualConnect);
            this.Controls.Add(_btnMinimizeTray);

            // System Tray
            _trayIcon = new NotifyIcon
            {
                Text = "عميل تسليم التقارير - مخبر المعلوماتية",
                Icon = SystemIcons.Information,
                Visible = true
            };
            _trayIcon.DoubleClick += (s, e) => ShowFromTray();

            ContextMenu trayMenu = new ContextMenu();
            trayMenu.MenuItems.Add("إظهار الواجهة", (s, e) => ShowFromTray());
            trayMenu.MenuItems.Add("إرسال التقرير الآن", (s, e) => SendReportNow());
            trayMenu.MenuItems.Add("-");
            trayMenu.MenuItems.Add("إغلاق البرنامج", (s, e) => Application.Exit());
            _trayIcon.ContextMenu = trayMenu;

            // Scan files initially
            ScanDesktopReports();

            // Reconnect / desktop monitor timer
            _reconnectTimer = new System.Windows.Forms.Timer { Interval = 4000 };
            _reconnectTimer.Tick += (s, e) =>
            {
                ScanDesktopReports();
                if (!_client.IsConnected && !string.IsNullOrEmpty(_lastTeacherIp))
                {
                    TryConnect(_lastTeacherIp, _lastTeacherPort);
                }
            };
            _reconnectTimer.Start();
        }

        private void StartAgentServices()
        {
            _client = new StudentClient();
            _client.Connected += OnConnected;
            _client.Disconnected += OnDisconnected;
            _client.FileTransferResult += OnFileTransferResult;
            _client.StatusMessage += OnStatusMessage;

            _udpListener = new UdpListener(8889);
            _udpListener.TeacherDiscovered += OnTeacherDiscovered;
            _udpListener.Start();
        }

        private void OnTeacherDiscovered(string ip, int port, string section)
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action<string, int, string>(OnTeacherDiscovered), ip, port, section);
                return;
            }

            _lastTeacherIp = ip;
            _lastTeacherPort = port;
            _activeSection = section;

            if (!_client.IsConnected)
            {
                TryConnect(ip, port);
            }
        }

        private void TryConnect(string ip, int port)
        {
            try
            {
                _lblStatus.Text = string.Format("جاري الاتصال بخادم الأستاذ ({0}:{1})...", ip, port);
                _lblStatus.ForeColor = Color.FromArgb(254, 240, 138);
                _client.Connect(ip, port, _activeSection);
            }
            catch (Exception ex)
            {
                _lblStatus.Text = "بانتظار استجابة الأستاذ على " + ip;
                _lblStatus.ForeColor = Color.FromArgb(248, 113, 113);
                System.Diagnostics.Debug.WriteLine("Connection attempt failed: " + ex.Message);
            }
        }

        private void OnConnected()
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action(OnConnected));
                return;
            }

            _lblStatus.Text = "متصل بخادم الأستاذ بنجاح 🟢 (جاهز لتسليم التقرير)";
            _lblStatus.ForeColor = Color.FromArgb(167, 243, 208); // Emerald 200
            _lblTeacherInfo.Text = string.Format("حاسوب الأستاذ: {0}:{1} 🟢", _lastTeacherIp, _lastTeacherPort);
            _lblTeacherInfo.ForeColor = Color.FromArgb(16, 185, 129);
            _btnSendNow.Enabled = !string.IsNullOrEmpty(_detectedReport);
        }

        private void OnDisconnected()
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action(OnDisconnected));
                return;
            }

            _lblStatus.Text = "انقطع الاتصال بخادم الأستاذ ⚪ (جاري إعادة المحاولة...)";
            _lblStatus.ForeColor = Color.FromArgb(248, 113, 113);
            _lblTeacherInfo.Text = "حاسوب الأستاذ: غير متصل ⚪";
            _lblTeacherInfo.ForeColor = Color.FromArgb(71, 85, 105);
            _btnSendNow.Enabled = false;
        }

        private void OnFileTransferResult(string fileName, bool success, string msg)
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action<string, bool, string>(OnFileTransferResult), fileName, success, msg);
                return;
            }

            if (success)
            {
                try { SystemSounds.Asterisk.Play(); } catch { }
                _lblStatus.Text = "✅ تم استلام تقريرك وحفظه بنجاح لدى الأستاذ!";
                _lblStatus.ForeColor = Color.FromArgb(167, 243, 208);
                _trayIcon.ShowBalloonTip(3000, "تسليم التقرير", "تم استلام تقريرك بنجاح من طرف الأستاذ! ✔", ToolTipIcon.Info);
            }
            else
            {
                _lblStatus.Text = "❌ فشل تسليم التقرير: " + msg;
                _lblStatus.ForeColor = Color.FromArgb(248, 113, 113);
            }
        }

        private void OnStatusMessage(string msg)
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action<string>(OnStatusMessage), msg);
                return;
            }
            _lblStatus.Text = msg;
        }

        private void ScanDesktopReports()
        {
            List<string> list = DesktopScanner.FindAssessmentReports(_activeSection);
            if (list.Count > 0)
            {
                _detectedReport = list[0];
                _lblDetectedFile.Text = "التقرير المكتشف على سطح المكتب: " + _detectedReport;
                _lblDetectedFile.ForeColor = Color.FromArgb(4, 120, 87);
                if (_client != null && _client.IsConnected)
                {
                    _btnSendNow.Enabled = true;
                }
            }
            else
            {
                _detectedReport = null;
                _lblDetectedFile.Text = "التقرير المكتشف: لم يُعثر على تقرير PDF على سطح المكتب بعد.";
                _lblDetectedFile.ForeColor = Color.FromArgb(100, 116, 139);
                _btnSendNow.Enabled = false;
            }
        }

        private void SendReportNow()
        {
            if (string.IsNullOrEmpty(_detectedReport))
            {
                MessageBox.Show("لم يتم العثور على أي ملف تقرير تقييم على سطح المكتب حتى الآن.\nيرجى تصدير التقرير من المحاكي أولاً.", "تنبيه", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            if (!_client.IsConnected)
            {
                MessageBox.Show("الجهاز غير متصل بخادم الأستاذ حالياً.\nيرجى التأكد من تشغيل برنامج الأستاذ والاتصال بالشبكة المحلية.", "خطأ في الاتصال", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            _client.SendFilePayload(_detectedReport);
        }

        private void PromptManualIp()
        {
            using (Form f = new Form())
            {
                f.Text = "تحديد عنوان حاسوب الأستاذ";
                f.Size = new Size(380, 180);
                f.StartPosition = FormStartPosition.CenterParent;
                f.FormBorderStyle = FormBorderStyle.FixedDialog;
                f.MaximizeBox = false;
                f.MinimizeBox = false;
                f.RightToLeft = RightToLeft.Yes;
                f.RightToLeftLayout = true;
                f.Font = new Font("Segoe UI", 9.5f);

                Label lbl = new Label { Text = "أدخل عنوان IP لحاسوب الأستاذ:", Location = new Point(20, 20), AutoSize = true };
                TextBox txtIp = new TextBox { Text = string.IsNullOrEmpty(_lastTeacherIp) ? "192.168.1." : _lastTeacherIp, Location = new Point(20, 48), Width = 220 };
                Button btnOk = new Button { Text = "اتصال 🔗", DialogResult = DialogResult.OK, Location = new Point(20, 85), Width = 110, Height = 32, BackColor = Color.FromArgb(37, 99, 235), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
                Button btnCancel = new Button { Text = "إلغاء", DialogResult = DialogResult.Cancel, Location = new Point(140, 85), Width = 80, Height = 32 };

                f.Controls.AddRange(new Control[] { lbl, txtIp, btnOk, btnCancel });
                f.AcceptButton = btnOk;
                f.CancelButton = btnCancel;

                if (f.ShowDialog(this) == DialogResult.OK)
                {
                    string ip = txtIp.Text.Trim();
                    if (!string.IsNullOrEmpty(ip))
                    {
                        _lastTeacherIp = ip;
                        TryConnect(ip, _lastTeacherPort);
                    }
                }
            }
        }

        private void HideToTray()
        {
            this.Hide();
            _trayIcon.ShowBalloonTip(2000, "عميل تسليم التقارير", "البرنامج يعمل في الخلفية وجاهز لتسليم تقريرك تلقائياً للأستاذ.", ToolTipIcon.Info);
        }

        private void ShowFromTray()
        {
            this.Show();
            this.WindowState = FormWindowState.Normal;
            this.BringToFront();
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (e.CloseReason == CloseReason.UserClosing)
            {
                // إذا نقر التلميذ على زر X يتم تصغيره لشريط المهام بدلاً من الإغلاق لضمان عدم توقف التسليم
                e.Cancel = true;
                HideToTray();
                return;
            }

            if (_reconnectTimer != null) _reconnectTimer.Stop();
            if (_udpListener != null) _udpListener.Stop();
            if (_client != null) _client.Disconnect();
            if (_trayIcon != null) _trayIcon.Dispose();
            base.OnFormClosing(e);
        }
    }
}
