using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Media;
using System.Net;
using System.Net.Sockets;
using System.Windows.Forms;

namespace TeacherReceiver
{
    public class MainForm : Form
    {
        private SettingsModel _settings;
        private LeaderboardManager _leaderboard;
        private HttpReceiverServer _server;

        private Label _lblStatus;
        private Label _lblIpInfo;
        private Button _btnToggleServer;
        private Button _btnCopyIp;

        private TextBox _txtStoragePath;
        private Button _btnBrowseStorage;
        private Button _btnOpenCurrentFolder;
        private Button _btnOpenLeaderboardHtml;

        private ComboBox _cmbGroupFilter;
        private TextBox _txtSearchFilter;
        private Label _lblStats;

        private DataGridView _grid;
        private ListBox _lstLog;

        private string _lastActiveSessionDir;
        private string _lastActiveGroup = "1AS-01";

        public MainForm()
        {
            _settings = SettingsModel.Load();
            _leaderboard = new LeaderboardManager();

            InitializeComponent();
            ApplyStyling();
            StartServer();
        }

        private void InitializeComponent()
        {
            this.Text = "مستقبل تقارير المحاكي التعليمي - حاسوب الأستاذ (ReportReceiver v1.0)";
            this.Size = new Size(1060, 680);
            this.MinimumSize = new Size(900, 550);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.RightToLeft = RightToLeft.Yes;
            this.RightToLeftLayout = true;
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            this.Icon = SystemIcons.Application;

            // Main Layout Container
            Panel topPanel = new Panel { Dock = DockStyle.Top, Height = 135, BackColor = Color.FromArgb(243, 244, 246) };
            Panel bottomPanel = new Panel { Dock = DockStyle.Bottom, Height = 100, BackColor = Color.FromArgb(248, 249, 250) };
            Panel centerPanel = new Panel { Dock = DockStyle.Fill, Padding = new Padding(10) };

            // 1. Top Section: IP Banner & Status
            Panel bannerPanel = new Panel { Dock = DockStyle.Top, Height = 55, BackColor = Color.FromArgb(15, 23, 42), Padding = new Padding(12, 8, 12, 8) };
            
            _lblStatus = new Label
            {
                Text = "🟢 الخادم نشط ويستمع",
                ForeColor = Color.FromArgb(34, 197, 94),
                Font = new Font("Segoe UI", 11f, FontStyle.Bold),
                AutoSize = true,
                Location = new Point(14, 14)
            };

            _lblIpInfo = new Label
            {
                Text = "عنوان IP للأستاذ: " + GetLocalIpAddress() + "  |  المنفذ: " + _settings.Port,
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 10.5f, FontStyle.Regular),
                AutoSize = true,
                Location = new Point(230, 16)
            };

            _btnCopyIp = new Button
            {
                Text = "نسخ IP 📋",
                Size = new Size(80, 28),
                Location = new Point(590, 12),
                BackColor = Color.FromArgb(30, 41, 59),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            _btnCopyIp.FlatAppearance.BorderColor = Color.FromArgb(71, 85, 105);
            _btnCopyIp.Click += (s, e) =>
            {
                try
                {
                    Clipboard.SetText(GetLocalIpAddress());
                    MessageBox.Show("تم نسخ عنوان IP إلى الحافظة: " + GetLocalIpAddress(), "تم النسخ", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                catch { }
            };

            _btnToggleServer = new Button
            {
                Text = "إيقاف الخادم ⏸",
                Size = new Size(110, 30),
                Location = new Point(685, 12),
                BackColor = Color.FromArgb(220, 38, 38),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold)
            };
            _btnToggleServer.Click += (s, e) => ToggleServer();

            bannerPanel.Controls.Add(_lblStatus);
            bannerPanel.Controls.Add(_lblIpInfo);
            bannerPanel.Controls.Add(_btnCopyIp);
            bannerPanel.Controls.Add(_btnToggleServer);

            // Storage & Action Bar
            Panel storagePanel = new Panel { Dock = DockStyle.Fill, Padding = new Padding(12, 8, 12, 8) };

            Label lblPath = new Label { Text = "مسار الحفظ الأساسي:", AutoSize = true, Location = new Point(14, 12), Font = new Font("Segoe UI", 9.5f, FontStyle.Bold) };
            _txtStoragePath = new TextBox { Text = _settings.StoragePath, Location = new Point(150, 10), Width = 380, ReadOnly = true, BackColor = Color.White };
            _btnBrowseStorage = new Button { Text = "تغيير المسار 📁", Location = new Point(540, 8), Size = new Size(100, 28) };
            _btnBrowseStorage.Click += (s, e) => BrowseStoragePath();

            _btnOpenCurrentFolder = new Button
            {
                Text = "فتح مجلد الحصة الحالية 📂",
                Location = new Point(650, 8),
                Size = new Size(170, 28),
                BackColor = Color.FromArgb(0, 120, 212),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold)
            };
            _btnOpenCurrentFolder.Click += (s, e) => OpenCurrentSessionFolder();

            _btnOpenLeaderboardHtml = new Button
            {
                Text = "عرض الترتيب في المتصفح 🌐",
                Location = new Point(830, 8),
                Size = new Size(180, 28),
                BackColor = Color.FromArgb(16, 149, 193),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold)
            };
            _btnOpenLeaderboardHtml.Click += (s, e) => OpenLeaderboardHtml();

            // Filters & stats row
            Label lblGroup = new Label { Text = "تصفية بالفوج:", AutoSize = true, Location = new Point(14, 46) };
            _cmbGroupFilter = new ComboBox { Location = new Point(100, 44), Width = 140, DropDownStyle = ComboBoxStyle.DropDownList };
            _cmbGroupFilter.Items.Add("الكل");
            _cmbGroupFilter.SelectedIndex = 0;
            _cmbGroupFilter.SelectedIndexChanged += (s, e) => RefreshGrid();

            Label lblSearch = new Label { Text = "بحث بالاسم أو الجهاز:", AutoSize = true, Location = new Point(255, 46) };
            _txtSearchFilter = new TextBox { Location = new Point(390, 44), Width = 180 };
            _txtSearchFilter.TextChanged += (s, e) => RefreshGrid();

            _lblStats = new Label
            {
                Text = "إجمالي التقارير المستلمة: 0  |  أعلى علامة: 00.00  |  معدل القسم: 00.00",
                AutoSize = true,
                Location = new Point(590, 46),
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(30, 58, 138)
            };

            storagePanel.Controls.Add(lblPath);
            storagePanel.Controls.Add(_txtStoragePath);
            storagePanel.Controls.Add(_btnBrowseStorage);
            storagePanel.Controls.Add(_btnOpenCurrentFolder);
            storagePanel.Controls.Add(_btnOpenLeaderboardHtml);

            storagePanel.Controls.Add(lblGroup);
            storagePanel.Controls.Add(_cmbGroupFilter);
            storagePanel.Controls.Add(lblSearch);
            storagePanel.Controls.Add(_txtSearchFilter);
            storagePanel.Controls.Add(_lblStats);

            topPanel.Controls.Add(storagePanel);
            topPanel.Controls.Add(bannerPanel);

            // 2. Center: Leaderboard DataGridView
            _grid = new DataGridView
            {
                Dock = DockStyle.Fill,
                BackgroundColor = Color.White,
                BorderStyle = BorderStyle.Fixed3D,
                AllowUserToAddRows = false,
                AllowUserToDeleteRows = false,
                ReadOnly = true,
                SelectionMode = DataGridViewSelectionMode.FullRowSelect,
                MultiSelect = false,
                RowHeadersVisible = false,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
                EnableHeadersVisualStyles = false,
                Font = new Font("Segoe UI", 10f, FontStyle.Regular),
                RowTemplate = { Height = 34 }
            };

            _grid.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(15, 23, 42);
            _grid.ColumnHeadersDefaultCellStyle.ForeColor = Color.White;
            _grid.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
            _grid.ColumnHeadersHeight = 36;

            _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "المرتبة", DataPropertyName = "Rank", FillWeight = 38 });
            _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "الفوج", DataPropertyName = "Group", FillWeight = 48 });
            _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "الجهاز", DataPropertyName = "PcNumber", FillWeight = 48 });
            _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "اللقب والاسم", DataPropertyName = "FullName", FillWeight = 95 });
            _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "العلامة /20", DataPropertyName = "ScoreFormatted", FillWeight = 50 });
            _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "الوقت المستغرق", DataPropertyName = "ElapsedFormatted", FillWeight = 55 });
            _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "المحاولة", DataPropertyName = "VersionStr", FillWeight = 38 });
            _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "وقت التسليم", DataPropertyName = "TimeString", FillWeight = 52 });

            DataGridViewButtonColumn btnCol = new DataGridViewButtonColumn
            {
                HeaderText = "عرض التقرير",
                Text = "📄 فتح PDF",
                UseColumnTextForButtonValue = true,
                FillWeight = 45
            };
            _grid.Columns.Add(btnCol);

            _grid.CellContentClick += (s, e) =>
            {
                if (e.RowIndex >= 0 && e.ColumnIndex == _grid.Columns.Count - 1)
                {
                    OpenSelectedReportPdf(e.RowIndex);
                }
            };

            _grid.CellDoubleClick += (s, e) =>
            {
                if (e.RowIndex >= 0)
                {
                    OpenSelectedReportPdf(e.RowIndex);
                }
            };

            centerPanel.Controls.Add(_grid);

            // 3. Bottom: Event log
            Label lblLogTitle = new Label { Text = "سجل العمليات والاتصالات الواردة:", Dock = DockStyle.Top, Height = 20, Font = new Font("Segoe UI", 8.5f, FontStyle.Bold) };
            _lstLog = new ListBox
            {
                Dock = DockStyle.Fill,
                BackColor = Color.FromArgb(248, 250, 252),
                Font = new Font("Consolas", 9f, FontStyle.Regular),
                BorderStyle = BorderStyle.None
            };
            bottomPanel.Controls.Add(_lstLog);
            bottomPanel.Controls.Add(lblLogTitle);

            // Add all to Form
            this.Controls.Add(centerPanel);
            this.Controls.Add(topPanel);
            this.Controls.Add(bottomPanel);
        }

        private void ApplyStyling()
        {
            this.BackColor = Color.White;
        }

        private void StartServer()
        {
            try
            {
                if (!Directory.Exists(_settings.StoragePath))
                {
                    Directory.CreateDirectory(_settings.StoragePath);
                }

                _server = new HttpReceiverServer(_settings.Port, _settings.StoragePath, _leaderboard, _settings);
                _server.ReportReceived += Server_ReportReceived;
                _server.LogMessage += Server_LogMessage;
                _server.Start();

                _lblStatus.Text = "🟢 الخادم نشط ويستمع";
                _lblStatus.ForeColor = Color.FromArgb(34, 197, 94);
                _btnToggleServer.Text = "إيقاف الخادم ⏸";
                _btnToggleServer.BackColor = Color.FromArgb(220, 38, 38);
            }
            catch (Exception ex)
            {
                MessageBox.Show("فشل تشغيل الخادم على المنفذ " + _settings.Port + ":\n" + ex.Message, "خطأ في الشبكة", MessageBoxButtons.OK, MessageBoxIcon.Error);
                _lblStatus.Text = "🔴 الخادم متوقف";
                _lblStatus.ForeColor = Color.FromArgb(239, 68, 68);
                _btnToggleServer.Text = "تشغيل الخادم ▶";
                _btnToggleServer.BackColor = Color.FromArgb(34, 197, 94);
            }
        }

        private void StopServer()
        {
            if (_server != null)
            {
                _server.Stop();
                _server = null;
            }
            _lblStatus.Text = "🔴 الخادم متوقف";
            _lblStatus.ForeColor = Color.FromArgb(239, 68, 68);
            _btnToggleServer.Text = "تشغيل الخادم ▶";
            _btnToggleServer.BackColor = Color.FromArgb(34, 197, 94);
        }

        private void ToggleServer()
        {
            if (_server != null && _server.IsRunning)
            {
                StopServer();
            }
            else
            {
                StartServer();
            }
        }

        private void Server_ReportReceived(object sender, ReportReceivedEventArgs e)
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action(() => Server_ReportReceived(sender, e)));
                return;
            }

            _lastActiveSessionDir = e.SessionDirectory;
            _lastActiveGroup = e.Report.Group;

            // Update ComboBox if group is new
            if (!_cmbGroupFilter.Items.Contains(e.Report.Group))
            {
                _cmbGroupFilter.Items.Add(e.Report.Group);
            }

            RefreshGrid();

            if (_settings.PlaySound)
            {
                try { SystemSounds.Asterisk.Play(); } catch { }
            }
        }

        private void Server_LogMessage(object sender, string message)
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action(() => Server_LogMessage(sender, message)));
                return;
            }

            _lstLog.Items.Insert(0, message);
            if (_lstLog.Items.Count > 100)
            {
                _lstLog.Items.RemoveAt(_lstLog.Items.Count - 1);
            }
        }

        private void RefreshGrid()
        {
            string selectedGroup = _cmbGroupFilter.SelectedItem != null ? _cmbGroupFilter.SelectedItem.ToString() : "الكل";
            string search = (_txtSearchFilter.Text ?? "").Trim().ToLowerInvariant();

            List<ReportModel> list = _leaderboard.GetSortedLeaderboard(selectedGroup);

            if (!string.IsNullOrEmpty(search))
            {
                list = list.FindAll(r => (r.FullName ?? "").ToLowerInvariant().Contains(search) ||
                                         (r.PcNumber ?? "").ToLowerInvariant().Contains(search) ||
                                         (r.Group ?? "").ToLowerInvariant().Contains(search));
            }

            _grid.Rows.Clear();

            double maxScore = 0;
            double totalScore = 0;
            int count = list.Count;

            int rank = 1;
            foreach (var r in list)
            {
                string rankDisplay = rank.ToString();
                if (rank == 1) rankDisplay = "🥇 1";
                else if (rank == 2) rankDisplay = "🥈 2";
                else if (rank == 3) rankDisplay = "🥉 3";

                int rowIdx = _grid.Rows.Add(
                    rankDisplay,
                    r.Group,
                    r.PcNumber,
                    r.FullName,
                    r.ScoreFormatted,
                    r.ElapsedFormatted,
                    "v" + r.Version,
                    r.SubmissionTime.ToString("HH:mm:ss")
                );

                _grid.Rows[rowIdx].Tag = r;

                // Color coding for score
                if (r.Score >= 16.0)
                {
                    _grid.Rows[rowIdx].Cells[4].Style.ForeColor = Color.FromArgb(21, 128, 61);
                    _grid.Rows[rowIdx].Cells[4].Style.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
                }
                else if (r.Score < 10.0)
                {
                    _grid.Rows[rowIdx].Cells[4].Style.ForeColor = Color.FromArgb(185, 28, 28);
                }

                if (r.Score > maxScore) maxScore = r.Score;
                totalScore += r.Score;
                rank++;
            }

            double avgScore = count > 0 ? (totalScore / count) : 0;
            _lblStats.Text = string.Format("إجمالي التقارير: {0}  |  أعلى علامة: {1:00.00}  |  معدل القسم: {2:00.00}", count, maxScore, avgScore);
        }

        private void OpenSelectedReportPdf(int rowIndex)
        {
            if (rowIndex < 0 || rowIndex >= _grid.Rows.Count) return;
            ReportModel r = _grid.Rows[rowIndex].Tag as ReportModel;
            if (r != null && File.Exists(r.FilePath))
            {
                try
                {
                    Process.Start(r.FilePath);
                }
                catch (Exception ex)
                {
                    MessageBox.Show("تعذر فتح ملف التقرير:\n" + ex.Message, "تنبيه", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
            }
        }

        private void OpenCurrentSessionFolder()
        {
            string dirToOpen = _lastActiveSessionDir;
            if (string.IsNullOrEmpty(dirToOpen) || !Directory.Exists(dirToOpen))
            {
                dirToOpen = TimeSlotManager.GetSessionDirectory(_settings.StoragePath, _lastActiveGroup, DateTime.Now);
            }

            if (Directory.Exists(dirToOpen))
            {
                try { Process.Start("explorer.exe", dirToOpen); } catch { }
            }
            else
            {
                MessageBox.Show("مجلد الحصة لم يُنشأ بعد.", "تنبيه", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
        }

        private void OpenLeaderboardHtml()
        {
            string dirToOpen = _lastActiveSessionDir;
            if (string.IsNullOrEmpty(dirToOpen) || !Directory.Exists(dirToOpen))
            {
                dirToOpen = TimeSlotManager.GetSessionDirectory(_settings.StoragePath, _lastActiveGroup, DateTime.Now);
            }

            string htmlPath = Path.Combine(dirToOpen, "00_ترتيب_نتائج_الحصة.html");
            if (File.Exists(htmlPath))
            {
                try { Process.Start(htmlPath); } catch { }
            }
            else
            {
                // Force generation even if empty
                _leaderboard.UpdateHtmlLeaderboard(dirToOpen, _lastActiveGroup, TimeSlotManager.GetCurrentTimeSlot(DateTime.Now), _settings.TeacherName, _settings.Institution);
                if (File.Exists(htmlPath))
                {
                    try { Process.Start(htmlPath); } catch { }
                }
                else
                {
                    MessageBox.Show("لم يتم استلام تقارير لتوليد ملف الترتيب بعد.", "تنبيه", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
        }

        private void BrowseStoragePath()
        {
            using (FolderBrowserDialog fbd = new FolderBrowserDialog())
            {
                fbd.Description = "اختر المجلد الرئيسي لحفظ تقارير التلاميذ المستلمة:";
                fbd.SelectedPath = _settings.StoragePath;
                if (fbd.ShowDialog() == DialogResult.OK)
                {
                    _settings.StoragePath = fbd.SelectedPath;
                    _txtStoragePath.Text = fbd.SelectedPath;
                    _settings.Save();

                    // Restart server with new path
                    StopServer();
                    StartServer();
                }
            }
        }

        public static string GetLocalIpAddress()
        {
            try
            {
                var host = Dns.GetHostEntry(Dns.GetHostName());
                foreach (var ip in host.AddressList)
                {
                    if (ip.AddressFamily == AddressFamily.InterNetwork && !ip.ToString().StartsWith("169.254.") && !IPAddress.IsLoopback(ip))
                    {
                        return ip.ToString();
                    }
                }
            }
            catch { }
            return "127.0.0.1";
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            StopServer();
            _settings.Save();
            base.OnFormClosing(e);
        }
    }
}

