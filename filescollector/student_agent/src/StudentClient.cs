using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;
using System.Threading;

namespace StudentAgent
{
    public class StudentClient : IDisposable
    {
        private TcpClient _client;
        private NetworkStream _stream;
        private StreamReader _reader;
        private StreamWriter _writer;
        private Thread _receiveThread;
        private volatile bool _isConnected;
        private volatile bool _isDisposed;

        public event Action Connected;
        public event Action Disconnected;
        public event Action<string, bool, string> FileTransferResult;
        public event Action<string> StatusMessage;

        public bool IsConnected { get { return _isConnected; } }

        public void Connect(string host, int port, string activeSection = null)
        {
            if (_isConnected) return;

            try
            {
                _client = new TcpClient();
                _client.NoDelay = true;
                _client.Connect(host, port);

                _stream = _client.GetStream();
                _reader = new StreamReader(_stream, Encoding.UTF8);
                _writer = new StreamWriter(_stream, Encoding.UTF8) { AutoFlush = true };

                _isConnected = true;
                if (Connected != null) Connected();

                // Send registration packet
                Register(activeSection);

                _receiveThread = new Thread(ReceiveLoop)
                {
                    IsBackground = true,
                    Name = "StudentClientReceiveThread"
                };
                _receiveThread.Start();
            }
            catch (Exception ex)
            {
                _isConnected = false;
                if (StatusMessage != null) StatusMessage("فشل الاتصال بالأستاذ: " + ex.Message);
                throw;
            }
        }

        public void Disconnect()
        {
            _isConnected = false;
            try { if (_client != null) _client.Close(); } catch { }
            if (Disconnected != null) Disconnected();
        }

        private void Register(string activeSection)
        {
            try
            {
                string machineName = Environment.MachineName;
                string pcNum = DetectWorkstationNumber(machineName);
                List<string> files = DesktopScanner.FindAssessmentReports(activeSection);
                string filesJoined = string.Join(";", files.ToArray());

                // Protocol: REGISTER|MachineName|PcNumber|FileList
                string regPacket = string.Format("REGISTER|{0}|{1}|{2}", machineName, pcNum, filesJoined);
                _writer.WriteLine(regPacket);

                if (StatusMessage != null)
                {
                    StatusMessage(string.Format("تم التسجيل لدى الأستاذ ({0} تقرير مكتشف على سطح المكتب).", files.Count));
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Error during register: " + ex.Message);
            }
        }

        private void ReceiveLoop()
        {
            try
            {
                string line;
                while (_isConnected && (line = _reader.ReadLine()) != null)
                {
                    if (string.IsNullOrWhiteSpace(line)) continue;

                    string[] parts = line.Split('|');
                    string cmd = parts[0].ToUpperInvariant();

                    if (cmd == "PULL")
                    {
                        // PULL|FileName
                        if (parts.Length > 1)
                        {
                            string fileName = parts[1].Trim();
                            SendFilePayload(fileName);
                        }
                    }
                    else if (cmd == "ACK")
                    {
                        // ACK|SUCCESS/FAIL|FileName|Msg
                        if (parts.Length >= 4)
                        {
                            bool success = parts[1].Equals("SUCCESS", StringComparison.OrdinalIgnoreCase);
                            string fileName = parts[2].Trim();
                            string msg = parts[3].Trim();

                            if (FileTransferResult != null)
                            {
                                FileTransferResult(fileName, success, msg);
                            }
                        }
                    }
                    else if (cmd == "PING")
                    {
                        _writer.WriteLine("PONG");
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Receive loop disconnected: " + ex.Message);
            }
            finally
            {
                Disconnect();
            }
        }

        public bool SendFilePayload(string fileName)
        {
            try
            {
                string filePath = DesktopScanner.ResolveDesktopFilePath(fileName);
                if (filePath == null || !File.Exists(filePath))
                {
                    if (StatusMessage != null) StatusMessage("الملف غير موجود على سطح المكتب: " + fileName);
                    return false;
                }

                byte[] bytes = File.ReadAllBytes(filePath);

                // Compute SHA-256
                string sha256Hex = "";
                using (SHA256 sha = SHA256.Create())
                {
                    byte[] hash = sha.ComputeHash(bytes);
                    sha256Hex = BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
                }

                string base64 = Convert.ToBase64String(bytes);

                // Format: FILE_DATA|FileName|FileSize|Sha256|Base64Data
                string packet = string.Format("FILE_DATA|{0}|{1}|{2}|{3}", Path.GetFileName(filePath), bytes.Length, sha256Hex, base64);
                _writer.WriteLine(packet);

                if (StatusMessage != null)
                {
                    StatusMessage(string.Format("جاري تسليم التقرير للأستاذ ({0} بايت)...", bytes.Length));
                }
                return true;
            }
            catch (Exception ex)
            {
                if (StatusMessage != null) StatusMessage("خطأ أثناء قراءة أو إرسال الملف: " + ex.Message);
                return false;
            }
        }

        private string DetectWorkstationNumber(string machineName)
        {
            // محاولة استخراج رقم الحاسوب مثل "PC-05" أو "POSTE-01" أو "05"
            System.Text.RegularExpressions.Match match = System.Text.RegularExpressions.Regex.Match(machineName, @"\d+");
            if (match.Success)
            {
                int num;
                if (int.TryParse(match.Value, out num))
                {
                    return string.Format("حاسوب {0:D2}", num);
                }
            }
            return machineName;
        }

        public void Dispose()
        {
            if (_isDisposed) return;
            _isDisposed = true;
            Disconnect();
        }
    }
}

