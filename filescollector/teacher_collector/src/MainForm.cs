using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Media;
using System.Windows.Forms;

namespace TeacherCollector
{
    public class MainForm : Form
    {
        private CollectorSettings _settings;
        private TeacherServer _server;
        private UdpBeacon _beacon;
        private System.Windows.Forms.Timer _clockTimer;

        // UI Controls
        private Panel _topHeaderPanel;
        private Label _lblTitle;
        private Label _lblServerStatus;
        private Label _lblActiveSectionTitle;
        private ComboBox _cbSection;
        private Label _lblTimeSlot;
        private ListView _lvStudents;
        private Panel _bottomActionPanel;
        private Button _btnCollectAll;
        private Button _btnCollectSelected;
        private Button _btnOpenFolder;
        private Button _btnSettings;
        private StatusStrip _statusStrip;
        private ToolStripStatusLabel _statusLabel;
        private ToolStripStatusLabel _statsLabel;

        public MainForm()
        {
            _settings = SettingsManager.LoadSettings();
            InitializeComponent();
            StartServices();
        }

        private void InitializeComponent()
        {
            this.Text = "خادم جمع تقارير التقييم - حاسوب الأستاذ (الشبكة المحلية LAN)";
            this.Size = new Size(1000, 680);
            this.MinimumSize = new Size(880, 560);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.RightToLeft = RightToLeft.Yes;
            this.RightToLeftLayout = true;
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            this.BackColor = Color.FromArgb(248, 250, 252);
            this.Icon = SystemIcons.Application;

            // 1. Top Header Panel
            _topHeaderPanel = new Panel
            {
                Dock = DockStyle.Top,
                Height = 125,
                BackColor = Color.FromArgb(15, 23, 42), // Slate 900
                Padding = new Padding(15)
            };

            _lblTitle = new Label
            {
                Text = "⚡ خادم سحب وتجميع تقارير التلاميذ عبر الشبكة المحلية (LAN Collector)",
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 13f, FontStyle.Bold),
                AutoSize = true,
                Location = new Point(15, 12)
            };

            string localIp = UdpBeacon.GetBestLocalIPv4();
            _lblServerStatus = new Label
            {
                Text = string.Format("حالة الخادم: نشط وجاهز للإنصات 🟢 | عنوان الأستاذ: {0} | منفذ TCP: {1}", localIp, _settings.TcpPort),
                ForeColor = Color.FromArgb(148, 163, 184), // Slate 400
                Font = new Font("Segoe UI", 9.5f, FontStyle.Regular),
                AutoSize = true,
                Location = new Point(15, 45)
            };

            // Section selection
            _lblActiveSectionTitle = new Label
            {
                Text = "الفوج / القسم:",
                ForeColor = Color.FromArgb(226, 232, 240),
                Font = new Font("Segoe UI", 10f, FontStyle.Bold),
                AutoSize = true,
                Location = new Point(15, 80)
            };

            _cbSection = new ComboBox
            {
                Location = new Point(115, 76),
                Width = 140,
                DropDownStyle = ComboBoxStyle.DropDown,
                Font = new Font("Segoe UI", 10f, FontStyle.Bold)
            };
            _cbSection.Items.AddRange(new object[] { "1AS-01", "1AS-02", "1AS-03", "1AS-04", "1AS-05", "2AS-GE", "2AS-M", "3AS-M" });
            _cbSection.Text = _settings.ActiveSection;
            _cbSection.SelectedIndexChanged += (s, e) =>
            {
                _settings.ActiveSection = _cbSection.Text.Trim();
                SettingsManager.SaveSettings(_settings);
                if (_beacon != null) _beacon.UpdateSection(_settings.ActiveSection);
                UpdateTimeSlotLabel();
            };
            _cbSection.TextChanged += (s, e) =>
            {
                _settings.ActiveSection = _cbSection.Text.Trim();
                SettingsManager.SaveSettings(_settings);
                if (_beacon != null) _beacon.UpdateSection(_settings.ActiveSection);
                UpdateTimeSlotLabel();
            };

            // Time Slot Badge
            _lblTimeSlot = new Label
            {
                Text = "🕒 فترة الحصة: جاري الحساب...",
                ForeColor = Color.FromArgb(254, 240, 138), // Yellow 200
                BackColor = Color.FromArgb(30, 41, 59), // Slate 800
                Font = new Font("Segoe UI", 10f, FontStyle.Bold),
                AutoSize = true,
                Padding = new Padding(8, 4, 8, 4),
                Location = new Point(275, 75),
                Cursor = Cursors.Hand
            };
            _lblTimeSlot.Click += (s, e) => OpenSessionFolder();

            _topHeaderPanel.Controls.Add(_lblTitle);
            _topHeaderPanel.Controls.Add(_lblServerStatus);
            _topHeaderPanel.Controls.Add(_lblActiveSectionTitle);
            _topHeaderPanel.Controls.Add(_cbSection);
            _topHeaderPanel.Controls.Add(_lblTimeSlot);

            // 2. Center ListView
            _lvStudents = new ListView
            {
                Dock = DockStyle.Fill,
                View = View.Details,
                FullRowSelect = true,
                GridLines = true,
                Font = new Font("Segoe UI", 10f, FontStyle.Regular),
                BackColor = Color.White
            };

            _lvStudents.Columns.Add("رقم / اسم الحاسوب (PC)", 180, HorizontalAlignment.Right);
            _lvStudents.Columns.Add("عنوان IP للتلميذ", 140, HorizontalAlignment.Right);
            _lvStudents.Columns.Add("التقرير المكتشف على سطح المكتب", 380, HorizontalAlignment.Right);
            _lvStudents.Columns.Add("حالة السحب والاستلام", 180, HorizontalAlignment.Right);

            // 3. Bottom Action Panel
            _bottomActionPanel = new Panel
            {
                Dock = DockStyle.Bottom,
                Height = 65,
                BackColor = Color.FromArgb(241, 245, 249),
                Padding = new Padding(10)
            };

            _btnCollectAll = new Button
            {
                Text = "⚡ جمع كافة التقارير (Collect All)",
                Width = 260,
                Height = 44,
                Location = new Point(15, 10),
                BackColor = Color.FromArgb(16, 185, 129), // Emerald 500
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 10.5f, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            _btnCollectAll.FlatAppearance.BorderSize = 0;
            _btnCollectAll.Click += (s, e) => CollectAll();

            _btnCollectSelected = new Button
            {
                Text = "📥 سحب من الجهاز المحدد",
                Width = 190,
                Height = 44,
                Location = new Point(285, 10),
                BackColor = Color.FromArgb(37, 99, 235), // Blue 600
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            _btnCollectSelected.FlatAppearance.BorderSize = 0;
            _btnCollectSelected.Click += (s, e) => CollectSelected();

            _btnOpenFolder = new Button
            {
                Text = "📁 فتح مجلد الحصة الحالي",
                Width = 180,
                Height = 44,
                Location = new Point(485, 10),
                BackColor = Color.FromArgb(71, 85, 105), // Slate 600
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            _btnOpenFolder.FlatAppearance.BorderSize = 0;
            _btnOpenFolder.Click += (s, e) => OpenSessionFolder();

            _btnSettings = new Button
            {
                Text = "⚙️ الإعدادات",
                Width = 120,
                Height = 44,
                Location = new Point(675, 10),
                BackColor = Color.FromArgb(203, 213, 225),
                ForeColor = Color.FromArgb(15, 23, 42),
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            _btnSettings.FlatAppearance.BorderSize = 0;
            _btnSettings.Click += (s, e) => ShowSettingsDialog();

            _bottomActionPanel.Controls.Add(_btnCollectAll);
            _bottomActionPanel.Controls.Add(_btnCollectSelected);
            _bottomActionPanel.Controls.Add(_btnOpenFolder);
            _bottomActionPanel.Controls.Add(_btnSettings);

            // 4. Status Strip
            _statusStrip = new StatusStrip
            {
                RightToLeft = RightToLeft.Yes,
                Font = new Font("Segoe UI", 9f)
            };
            _statusLabel = new ToolStripStatusLabel
            {
                Text = "جاهز وبانتظار اتصال حواسيب التلاميذ في المخبر...",
                Spring = true,
                TextAlign = ContentAlignment.MiddleRight
            };
            _statsLabel = new ToolStripStatusLabel
            {
                Text = "الأجهزة المتصلة: 0 | المستلمة: 0",
                Font = new Font("Segoe UI", 9f, FontStyle.Bold)
            };
            _statusStrip.Items.Add(_statusLabel);
            _statusStrip.Items.Add(_statsLabel);

            // Add all controls
            this.Controls.Add(_lvStudents);
            this.Controls.Add(_bottomActionPanel);
            this.Controls.Add(_statusStrip);
            this.Controls.Add(_topHeaderPanel);

            // Clock timer to keep time slot updated in real time
            _clockTimer = new System.Windows.Forms.Timer { Interval = 10000 };
            _clockTimer.Tick += (s, e) => UpdateTimeSlotLabel();
            _clockTimer.Start();
            UpdateTimeSlotLabel();
        }

        private void StartServices()
        {
            try
            {
                _server = new TeacherServer(_settings);
                _server.StudentConnected += OnStudentConnected;
                _server.StudentDisconnected += OnStudentDisconnected;
                _server.StudentUpdated += OnStudentUpdated;
                _server.FileTransferResult += OnFileTransferResult;
                _server.ServerLog += OnServerLog;
                _server.Start();

                _beacon = new UdpBeacon(_settings.UdpPort, _settings.TcpPort, _settings.ActiveSection);
                _beacon.Start();
            }
            catch (Exception ex)
            {
                MessageBox.Show("تعذر تشغيل الخادم على المنفذ المحدد:\n" + ex.Message, "خطأ في الشبكة", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void UpdateTimeSlotLabel()
        {
            DateTime now = DateTime.Now;
            string slot = TimeSlotManager.CalculateTimeSlot(now, _settings.SlotDurationHours);
            string dateStr = now.ToString("yyyy-MM-dd");
            _lblTimeSlot.Text = string.Format("🕒 فترة الحصة: {0} ({1})", slot, dateStr);
        }

        private void OnStudentConnected(StudentInfo s)
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action<StudentInfo>(OnStudentConnected), s);
                return;
            }

            ListViewItem item = FindItemByStudent(s);
            if (item == null)
            {
                item = new ListViewItem(s.DisplayName);
                item.SubItems.Add(s.IpAddress);
                item.SubItems.Add(s.DetectedFiles.Count > 0 ? s.DetectedFiles[0] : "لم يُعثر على تقرير بعد");
                item.SubItems.Add(s.LastStatus);
                item.Tag = s;
                _lvStudents.Items.Add(item);
            }
            else
            {
                UpdateItemDisplay(item, s);
            }

            UpdateStatsDisplay();
            _statusLabel.Text = string.Format("اتصل الجهاز: {0} ({1})", s.DisplayName, s.IpAddress);
        }

        private void OnStudentDisconnected(StudentInfo s)
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action<StudentInfo>(OnStudentDisconnected), s);
                return;
            }

            ListViewItem item = FindItemByStudent(s);
            if (item != null)
            {
                item.SubItems[3].Text = "انقطع الاتصال ⚪";
                item.ForeColor = Color.Gray;
            }
            UpdateStatsDisplay();
        }

        private void OnStudentUpdated(StudentInfo s)
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action<StudentInfo>(OnStudentUpdated), s);
                return;
            }

            ListViewItem item = FindItemByStudent(s);
            if (item != null)
            {
                UpdateItemDisplay(item, s);
            }
            UpdateStatsDisplay();
        }

        private void UpdateItemDisplay(ListViewItem item, StudentInfo s)
        {
            item.Text = s.DisplayName;
            item.SubItems[1].Text = s.IpAddress;
            item.SubItems[2].Text = s.DetectedFiles.Count > 0 ? s.DetectedFiles[0] : "لم يُعثر على تقرير بعد";
            item.SubItems[3].Text = s.LastStatus;

            if (s.IsCollected)
            {
                item.BackColor = Color.FromArgb(236, 253, 245); // Emerald 50
                item.ForeColor = Color.FromArgb(4, 120, 87);     // Emerald 700
            }
            else if (s.DetectedFiles.Count > 0)
            {
                item.BackColor = Color.FromArgb(254, 252, 232); // Amber 50
                item.ForeColor = Color.FromArgb(180, 83, 9);     // Amber 700
            }
            else
            {
                item.BackColor = Color.White;
                item.ForeColor = Color.Black;
            }
        }

        private ListViewItem FindItemByStudent(StudentInfo s)
        {
            foreach (ListViewItem item in _lvStudents.Items)
            {
                StudentInfo tag = item.Tag as StudentInfo;
                if (tag != null && tag.IpAddress == s.IpAddress && tag.MachineName == s.MachineName)
                {
                    return item;
                }
            }
            return null;
        }

        private void OnFileTransferResult(string pcName, string fileName, string path, bool success, string err)
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action<string, string, string, bool, string>(OnFileTransferResult), pcName, fileName, path, success, err);
                return;
            }

            if (success)
            {
                if (_settings.PlaySoundOnReceive)
                {
                    try { SystemSounds.Asterisk.Play(); } catch { }
                }
                _statusLabel.Text = string.Format("✓ تم بنجاح استلام تقرير {0}: {1}", pcName, fileName);
            }
            else
            {
                _statusLabel.Text = string.Format("❌ فشل سحب تقرير {0}: {1}", pcName, err);
            }
            UpdateStatsDisplay();
        }

        private void OnServerLog(string msg)
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action<string>(OnServerLog), msg);
                return;
            }
            _statusLabel.Text = msg;
        }

        private void UpdateStatsDisplay()
        {
            var students = _server.GetConnectedStudents();
            int total = students.Count;
            int collected = 0;
            foreach (var s in students)
            {
                if (s.IsCollected) collected++;
            }
            _statsLabel.Text = string.Format("الأجهزة المتصلة: {0} | المستلمة: {1} من {0}", total, collected);
        }

        private void CollectAll()
        {
            int triggered = _server.CollectAllReports();
            if (triggered == 0)
            {
                MessageBox.Show("لا توجد أجهزة متصلة لديها تقارير جديدة بانتظار السحب حالياً.", "معلومات", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            else
            {
                _statusLabel.Text = string.Format("تم إرسال أوامر السحب إلى {0} حاسوب متصل بنجاح.", triggered);
            }
        }

        private void CollectSelected()
        {
            if (_lvStudents.SelectedItems.Count == 0)
            {
                MessageBox.Show("يرجى تحديد جهاز حاسوب من القائمة أولاً.", "تنبيه", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            ListViewItem item = _lvStudents.SelectedItems[0];
            StudentInfo s = item.Tag as StudentInfo;
            if (s != null)
            {
                if (s.DetectedFiles.Count == 0)
                {
                    MessageBox.Show("هذا الجهاز لم يتم العثور على أي ملف تقرير PDF على سطح مكتبه بعد.", "تنبيه", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return;
                }
                string file = s.DetectedFiles[0];
                _server.PullFileFromStudent(s, file);
            }
        }

        private void OpenSessionFolder()
        {
            try
            {
                string targetDir = TimeSlotManager.GetSessionFolderPath(
                    _settings.BaseStoragePath,
                    _settings.ActiveSection,
                    DateTime.Now,
                    _settings.SlotDurationHours
                );

                if (!Directory.Exists(targetDir))
                {
                    Directory.CreateDirectory(targetDir);
                }
                Process.Start("explorer.exe", targetDir);
            }
            catch (Exception ex)
            {
                MessageBox.Show("تعذر فتح المجلد:\n" + ex.Message, "خطأ", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void ShowSettingsDialog()
        {
            using (Form f = new Form())
            {
                f.Text = "إعدادات خادم جمع التقارير";
                f.Size = new Size(540, 360);
                f.StartPosition = FormStartPosition.CenterParent;
                f.FormBorderStyle = FormBorderStyle.FixedDialog;
                f.MaximizeBox = false;
                f.MinimizeBox = false;
                f.RightToLeft = RightToLeft.Yes;
                f.RightToLeftLayout = true;
                f.Font = new Font("Segoe UI", 9.5f);

                Label lblPath = new Label { Text = "المسار الأساسي لحفظ التقارير:", Location = new Point(20, 20), AutoSize = true };
                TextBox txtPath = new TextBox { Text = _settings.BaseStoragePath, Location = new Point(20, 45), Width = 380 };
                Button btnBrowse = new Button { Text = "استعراض...", Location = new Point(410, 44), Width = 90, Height = 26 };
                btnBrowse.Click += (s, e) =>
                {
                    using (FolderBrowserDialog fbd = new FolderBrowserDialog())
                    {
                        fbd.SelectedPath = txtPath.Text;
                        if (fbd.ShowDialog() == DialogResult.OK)
                        {
                            txtPath.Text = fbd.SelectedPath;
                        }
                    }
                };

                Label lblDuration = new Label { Text = "مدة الحصة الدراسية الافتراضية:", Location = new Point(20, 85), AutoSize = true };
                ComboBox cbDuration = new ComboBox { Location = new Point(20, 110), Width = 200, DropDownStyle = ComboBoxStyle.DropDownList };
                cbDuration.Items.Add("ساعة واحدة (1h) - الحصص النظرية والتطبيقية");
                cbDuration.Items.Add("ساعتان (2h) - الأعمال التطبيقية المكثفة");
                cbDuration.SelectedIndex = _settings.SlotDurationHours == 2 ? 1 : 0;

                Label lblPort = new Label { Text = "منفذ الاتصال الشبكي (TCP Port):", Location = new Point(20, 150), AutoSize = true };
                NumericUpDown numPort = new NumericUpDown { Location = new Point(20, 175), Width = 120, Minimum = 1025, Maximum = 65534, Value = _settings.TcpPort };

                CheckBox chkAuto = new CheckBox
                {
                    Text = "سحب التقرير آلياً وفورياً بمجرد اتصال حاسوب التلميذ بالخادم",
                    Location = new Point(20, 215),
                    AutoSize = true,
                    Checked = _settings.AutoCollectOnConnect
                };

                CheckBox chkSound = new CheckBox
                {
                    Text = "تشغيل نغمة تنبيه صوتية عند استلام كل تقرير بنجاح",
                    Location = new Point(20, 245),
                    AutoSize = true,
                    Checked = _settings.PlaySoundOnReceive
                };

                Button btnOk = new Button { Text = "حفظ وتطبيق ✔", DialogResult = DialogResult.OK, Location = new Point(290, 280), Width = 120, Height = 34, BackColor = Color.FromArgb(16, 185, 129), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
                Button btnCancel = new Button { Text = "إلغاء", DialogResult = DialogResult.Cancel, Location = new Point(420, 280), Width = 80, Height = 34 };

                f.Controls.AddRange(new Control[] { lblPath, txtPath, btnBrowse, lblDuration, cbDuration, lblPort, numPort, chkAuto, chkSound, btnOk, btnCancel });
                f.AcceptButton = btnOk;
                f.CancelButton = btnCancel;

                if (f.ShowDialog(this) == DialogResult.OK)
                {
                    _settings.BaseStoragePath = txtPath.Text.Trim();
                    _settings.SlotDurationHours = cbDuration.SelectedIndex == 1 ? 2 : 1;
                    _settings.TcpPort = (int)numPort.Value;
                    _settings.AutoCollectOnConnect = chkAuto.Checked;
                    _settings.PlaySoundOnReceive = chkSound.Checked;
                    SettingsManager.SaveSettings(_settings);

                    UpdateTimeSlotLabel();
                    MessageBox.Show("تم حفظ وتحديث الإعدادات بنجاح.", "تم الحفظ", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (_clockTimer != null) _clockTimer.Stop();
            if (_beacon != null) _beacon.Stop();
            if (_server != null) _server.Stop();
            base.OnFormClosing(e);
        }
    }
}

