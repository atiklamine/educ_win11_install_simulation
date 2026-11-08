using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;
using System.Threading;

namespace TeacherCollector
{
    public class StudentInfo
    {
        public string MachineName { get; set; }
        public string PcNumber { get; set; }
        public string IpAddress { get; set; }
        public List<string> DetectedFiles { get; set; }
        public string LastStatus { get; set; }
        public DateTime ConnectedAt { get; set; }
        public DateTime LastSeen { get; set; }
        public bool IsCollected { get; set; }

        internal TcpClient Client { get; set; }
        internal NetworkStream Stream { get; set; }
        internal StreamWriter Writer { get; set; }
        internal StreamReader Reader { get; set; }

        public StudentInfo()
        {
            DetectedFiles = new List<string>();
            LastStatus = "متصل - في الانتظار";
            ConnectedAt = DateTime.Now;
            LastSeen = DateTime.Now;
            IsCollected = false;
        }

        public string DisplayName
        {
            get
            {
                if (!string.IsNullOrEmpty(PcNumber))
                    return PcNumber;
                return MachineName;
            }
        }
    }

    public class TeacherServer : IDisposable
    {
        private TcpListener _listener;
        private Thread _listenerThread;
        private volatile bool _isRunning;
        private readonly int _port;
        private readonly CollectorSettings _settings;
        private readonly Dictionary<string, StudentInfo> _students = new Dictionary<string, StudentInfo>();
        private readonly object _lock = new object();

        // Events for UI updates
        public event Action<StudentInfo> StudentConnected;
        public event Action<StudentInfo> StudentDisconnected;
        public event Action<StudentInfo> StudentUpdated;
        public event Action<string, string, string, bool, string> FileTransferResult;
        public event Action<string> ServerLog;

        public TeacherServer(CollectorSettings settings)
        {
            _settings = settings;
            _port = settings.TcpPort;
        }

        public void Start()
        {
            if (_isRunning) return;
            _isRunning = true;
            _listener = new TcpListener(IPAddress.Any, _port);
            _listener.Start();

            _listenerThread = new Thread(ListenLoop)
            {
                IsBackground = true,
                Name = "TeacherTcpListenerThread"
            };
            _listenerThread.Start();
            Log(string.Format("تم تشغيل خادم الاستماع على المنفذ TCP {0} بنجاح.", _port));
        }

        public void Stop()
        {
            _isRunning = false;
            try
            {
                if (_listener != null) _listener.Stop();
            }
            catch { }

            lock (_lock)
            {
                foreach (var s in _students.Values)
                {
                    try { if (s.Client != null) s.Client.Close(); } catch { }
                }
                _students.Clear();
            }
        }

        private void ListenLoop()
        {
            while (_isRunning)
            {
                try
                {
                    TcpClient client = _listener.AcceptTcpClient();
                    Thread clientThread = new Thread(HandleClient)
                    {
                        IsBackground = true
                    };
                    clientThread.Start(client);
                }
                catch (Exception ex)
                {
                    if (!_isRunning) break;
                    Log("خطأ أثناء قبول اتصال جديد: " + ex.Message);
                }
            }
        }

        private void HandleClient(object obj)
        {
            TcpClient client = (TcpClient)obj;
            client.NoDelay = true;
            StudentInfo student = null;
            string clientKey = null;

            try
            {
                NetworkStream stream = client.GetStream();
                StreamReader reader = new StreamReader(stream, Encoding.UTF8);
                StreamWriter writer = new StreamWriter(stream, Encoding.UTF8) { AutoFlush = true };

                string line;
                while (_isRunning && (line = reader.ReadLine()) != null)
                {
                    if (string.IsNullOrWhiteSpace(line)) continue;

                    string[] parts = line.Split('|');
                    string cmd = parts[0].ToUpperInvariant();

                    if (cmd == "REGISTER")
                    {
                        // REGISTER|MachineName|PcNumber|DetectedFilesSeparatedBySemicolon
                        string machineName = parts.Length > 1 ? parts[1].Trim() : "PC-UNKNOWN";
                        string pcNum = parts.Length > 2 ? parts[2].Trim() : "";
                        string filesRaw = parts.Length > 3 ? parts[3].Trim() : "";

                        IPEndPoint remoteIp = (IPEndPoint)client.Client.RemoteEndPoint;
                        string ipStr = remoteIp != null ? remoteIp.Address.ToString() : "0.0.0.0";
                        clientKey = ipStr + "_" + machineName;

                        lock (_lock)
                        {
                            if (_students.ContainsKey(clientKey))
                            {
                                try { _students[clientKey].Client.Close(); } catch { }
                                _students.Remove(clientKey);
                            }

                            student = new StudentInfo
                            {
                                MachineName = machineName,
                                PcNumber = pcNum,
                                IpAddress = ipStr,
                                Client = client,
                                Stream = stream,
                                Reader = reader,
                                Writer = writer,
                                LastSeen = DateTime.Now
                            };

                            if (!string.IsNullOrEmpty(filesRaw))
                            {
                                string[] fList = filesRaw.Split(new char[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
                                foreach (var f in fList)
                                {
                                    student.DetectedFiles.Add(f.Trim());
                                }
                            }

                            _students[clientKey] = student;
                        }

                        Log(string.Format("اتصال مسجل جديد: {0} ({1}) - عثر على {2} تقرير.", student.DisplayName, ipStr, student.DetectedFiles.Count));
                        if (StudentConnected != null) StudentConnected(student);

                        // Auto collect if enabled
                        if (_settings.AutoCollectOnConnect && student.DetectedFiles.Count > 0 && !student.IsCollected)
                        {
                            PullFileFromStudent(student, student.DetectedFiles[0]);
                        }
                    }
                    else if (cmd == "HEARTBEAT")
                    {
                        if (student != null)
                        {
                            student.LastSeen = DateTime.Now;
                            writer.WriteLine("PONG");
                        }
                    }
                    else if (cmd == "FILE_DATA")
                    {
                        // FILE_DATA|FileName|FileSize|Sha256|Base64Chunk (or single block)
                        // If sent as single block payload
                        if (parts.Length >= 5 && student != null)
                        {
                            string fileName = parts[1];
                            long expectedSize = 0;
                            long.TryParse(parts[2], out expectedSize);
                            string expectedSha = parts[3];
                            string base64 = parts[4];

                            SaveIncomingFile(student, fileName, expectedSize, expectedSha, base64);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Client connection loop ended: " + ex.Message);
            }
            finally
            {
                if (clientKey != null)
                {
                    lock (_lock)
                    {
                        if (_students.ContainsKey(clientKey))
                        {
                            StudentInfo dis = _students[clientKey];
                            _students.Remove(clientKey);
                            Log(string.Format("انقطع اتصال الحاسوب: {0} ({1})", dis.DisplayName, dis.IpAddress));
                            if (StudentDisconnected != null) StudentDisconnected(dis);
                        }
                    }
                }

                try { client.Close(); } catch { }
            }
        }

        private void SaveIncomingFile(StudentInfo student, string fileName, long expectedSize, string expectedSha, string base64)
        {
            try
            {
                byte[] fileBytes = Convert.FromBase64String(base64);

                // Verify size
                if (expectedSize > 0 && fileBytes.Length != expectedSize)
                {
                    string err = string.Format("تطابق الحجم غير سليم (المتوقع: {0}، المستلم: {1})", expectedSize, fileBytes.Length);
                    student.LastStatus = "خطأ في النقل";
                    if (StudentUpdated != null) StudentUpdated(student);
                    if (FileTransferResult != null) FileTransferResult(student.DisplayName, fileName, "", false, err);
                    student.Writer.WriteLine("ACK|FAIL|" + fileName + "|" + err);
                    return;
                }

                // Verify SHA256 checksum
                if (!string.IsNullOrEmpty(expectedSha))
                {
                    using (SHA256 sha = SHA256.Create())
                    {
                        byte[] hash = sha.ComputeHash(fileBytes);
                        string computedSha = BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
                        if (!computedSha.Equals(expectedSha.ToLowerInvariant()))
                        {
                            string err = "فشل فحص التجزؤ والنزاهة (SHA-256 Corrupted)";
                            student.LastStatus = "خطأ في النقل";
                            if (StudentUpdated != null) StudentUpdated(student);
                            if (FileTransferResult != null) FileTransferResult(student.DisplayName, fileName, "", false, err);
                            student.Writer.WriteLine("ACK|FAIL|" + fileName + "|" + err);
                            return;
                        }
                    }
                }

                // Save to session folder hierarchy
                string targetDir = TimeSlotManager.GetSessionFolderPath(
                    _settings.BaseStoragePath,
                    _settings.ActiveSection,
                    DateTime.Now,
                    _settings.SlotDurationHours
                );

                string safeFileName = Path.GetFileName(fileName);
                string destinationPath = Path.Combine(targetDir, safeFileName);

                File.WriteAllBytes(destinationPath, fileBytes);

                student.IsCollected = true;
                student.LastStatus = "تم الاستلام بنجاح ✔";
                if (StudentUpdated != null) StudentUpdated(student);

                Log(string.Format("✓ تم استلام وحفظ تقرير {0} في مجلد الحصة بنجاح ({1} بايت).", student.DisplayName, fileBytes.Length));
                if (FileTransferResult != null) FileTransferResult(student.DisplayName, safeFileName, destinationPath, true, null);

                // Notify student of success
                student.Writer.WriteLine("ACK|SUCCESS|" + safeFileName + "|OK");
            }
            catch (Exception ex)
            {
                student.LastStatus = "خطأ في الحفظ: " + ex.Message;
                if (StudentUpdated != null) StudentUpdated(student);
                if (FileTransferResult != null) FileTransferResult(student.DisplayName, fileName, "", false, ex.Message);
                try { student.Writer.WriteLine("ACK|FAIL|" + fileName + "|" + ex.Message); } catch { }
            }
        }

        public bool PullFileFromStudent(StudentInfo student, string fileName)
        {
            if (student == null || student.Writer == null) return false;
            try
            {
                student.LastStatus = "جاري سحب التقرير...";
                if (StudentUpdated != null) StudentUpdated(student);
                student.Writer.WriteLine("PULL|" + fileName);
                return true;
            }
            catch (Exception ex)
            {
                student.LastStatus = "فشل إرسال أمر السحب: " + ex.Message;
                if (StudentUpdated != null) StudentUpdated(student);
                return false;
            }
        }

        public int CollectAllReports()
        {
            int count = 0;
            List<StudentInfo> list;
            lock (_lock)
            {
                list = new List<StudentInfo>(_students.Values);
            }

            foreach (var s in list)
            {
                if (s.DetectedFiles.Count > 0 && !s.IsCollected)
                {
                    string targetFile = s.DetectedFiles[0];
                    if (PullFileFromStudent(s, targetFile))
                    {
                        count++;
                    }
                }
            }

            return count;
        }

        public List<StudentInfo> GetConnectedStudents()
        {
            lock (_lock)
            {
                return new List<StudentInfo>(_students.Values);
            }
        }

        private void Log(string msg)
        {
            if (ServerLog != null) ServerLog(msg);
        }

        public void Dispose()
        {
            Stop();
        }
    }
}
