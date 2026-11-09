using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;
using System.Threading;

namespace TeacherReceiver
{
    public class ReportReceivedEventArgs : EventArgs
    {
        public ReportModel Report { get; set; }
        public bool IsDuplicate { get; set; }
        public string SessionDirectory { get; set; }
    }

    public class HttpReceiverServer
    {
        private TcpListener _listener;
        private Thread _listenThread;
        private volatile bool _isRunning;
        private readonly int _port;
        private readonly string _baseStoragePath;
        private readonly LeaderboardManager _leaderboard;
        private readonly SettingsModel _settings;

        public event EventHandler<ReportReceivedEventArgs> ReportReceived;
        public event EventHandler<string> LogMessage;

        public bool IsRunning { get { return _isRunning; } }
        public int Port { get { return _port; } }

        public HttpReceiverServer(int port, string baseStoragePath, LeaderboardManager leaderboard, SettingsModel settings)
        {
            _port = port;
            _baseStoragePath = baseStoragePath;
            _leaderboard = leaderboard;
            _settings = settings;
        }

        public void Start()
        {
            if (_isRunning) return;
            _isRunning = true;
            _listener = new TcpListener(IPAddress.Any, _port);
            _listener.Start(100);

            _listenThread = new Thread(ListenLoop)
            {
                IsBackground = true,
                Name = "HttpReceiverListener"
            };
            _listenThread.Start();
            OnLog("بدأ الاستماع بنجاح على المنفذ " + _port + " على كافة واجهات الشبكة.");
        }

        public void Stop()
        {
            _isRunning = false;
            try
            {
                if (_listener != null)
                {
                    _listener.Stop();
                }
            }
            catch { }
            OnLog("تم إيقاف خادم الاستقبال.");
        }

        private void ListenLoop()
        {
            while (_isRunning)
            {
                try
                {
                    TcpClient client = _listener.AcceptTcpClient();
                    ThreadPool.QueueUserWorkItem(HandleClient, client);
                }
                catch (SocketException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    if (_isRunning) OnLog("خطأ في استقبال الاتصال: " + ex.Message);
                }
            }
        }

        private void HandleClient(object state)
        {
            TcpClient client = (TcpClient)state;
            try
            {
                client.ReceiveTimeout = 6000;
                client.SendTimeout = 6000;
                using (NetworkStream stream = client.GetStream())
                {
                    ProcessHttpRequest(stream);
                }
            }
            catch (Exception ex)
            {
                OnLog("خطأ أثناء معالجة الطلب: " + ex.Message);
            }
            finally
            {
                try { client.Close(); } catch { }
            }
        }

        private void ProcessHttpRequest(NetworkStream stream)
        {
            // Read headers byte-by-byte or buffer until \r\n\r\n
            List<byte> headerBytes = new List<byte>();
            int b;
            while ((b = stream.ReadByte()) != -1)
            {
                headerBytes.Add((byte)b);
                int count = headerBytes.Count;
                if (count >= 4 &&
                    headerBytes[count - 4] == '\r' && headerBytes[count - 3] == '\n' &&
                    headerBytes[count - 2] == '\r' && headerBytes[count - 1] == '\n')
                {
                    break;
                }
                if (count > 65536) // Header too large guard
                {
                    SendResponse(stream, 400, "Bad Request", "Header too large");
                    return;
                }
            }

            if (headerBytes.Count == 0) return;

            string headerText = Encoding.UTF8.GetString(headerBytes.ToArray());
            string[] headerLines = headerText.Split(new string[] { "\r\n" }, StringSplitOptions.None);
            if (headerLines.Length == 0) return;

            string requestLine = headerLines[0];
            string[] reqParts = requestLine.Split(' ');
            if (reqParts.Length < 2)
            {
                SendResponse(stream, 400, "Bad Request", "Invalid Request Line");
                return;
            }

            string method = reqParts[0].ToUpperInvariant();
            string path = reqParts[1];

            Dictionary<string, string> headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            for (int i = 1; i < headerLines.Length; i++)
            {
                string line = headerLines[i];
                int colonIdx = line.IndexOf(':');
                if (colonIdx > 0)
                {
                    string k = line.Substring(0, colonIdx).Trim();
                    string v = line.Substring(colonIdx + 1).Trim();
                    headers[k] = v;
                }
            }

            if (method == "GET" && (path == "/" || path == "/ping" || path == "/status"))
            {
                SendResponse(stream, 200, "OK", "{\"status\":\"active\",\"server\":\"ReportReceiver\",\"time\":\"" + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "\"}");
                return;
            }

            if (method != "POST" || !path.StartsWith("/upload", StringComparison.OrdinalIgnoreCase))
            {
                SendResponse(stream, 404, "Not Found", "Endpoint not found");
                return;
            }

            int contentLength = 0;
            if (headers.ContainsKey("Content-Length"))
            {
                int.TryParse(headers["Content-Length"], out contentLength);
            }

            if (contentLength <= 0 || contentLength > 50 * 1024 * 1024) // 50MB guard
            {
                SendResponse(stream, 411, "Length Required", "Invalid Content-Length");
                return;
            }

            byte[] body = new byte[contentLength];
            int totalRead = 0;
            while (totalRead < contentLength)
            {
                int read = stream.Read(body, totalRead, contentLength - totalRead);
                if (read <= 0) break;
                totalRead += read;
            }

            if (totalRead < contentLength)
            {
                SendResponse(stream, 400, "Bad Request", "Incomplete body transfer");
                return;
            }

            // Verify PDF Magic Bytes: %PDF-
            if (body.Length < 5 || body[0] != 0x25 || body[1] != 0x50 || body[2] != 0x44 || body[3] != 0x46 || body[4] != 0x2D)
            {
                SendResponse(stream, 400, "Bad Request", "Payload is not a valid PDF file");
                return;
            }

            // Compute SHA-256
            string computedHash;
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] hashBytes = sha256.ComputeHash(body);
                StringBuilder sbHash = new StringBuilder();
                foreach (byte hb in hashBytes) sbHash.Append(hb.ToString("x2"));
                computedHash = sbHash.ToString();
            }

            // Extract metadata headers
            string rawFileName = GetHeader(headers, "X-File-Name");
            string fileName = !string.IsNullOrEmpty(rawFileName) ? Uri.UnescapeDataString(rawFileName) : "report.pdf";
            string group = Uri.UnescapeDataString(GetHeader(headers, "X-Student-Group", "1AS-01"));
            string pcNumber = Uri.UnescapeDataString(GetHeader(headers, "X-Student-PC", "حاسوب 01"));
            string lastName = Uri.UnescapeDataString(GetHeader(headers, "X-Student-LastName", "Nom"));
            string firstName = Uri.UnescapeDataString(GetHeader(headers, "X-Student-FirstName", "Prenom"));
            string scoreStr = GetHeader(headers, "X-Student-Score", "00.00");
            string timeStr = GetHeader(headers, "X-Student-Time", "00-00-00");

            double score = ReportModel.ParseScore(scoreStr);
            int timeSec = ReportModel.ParseTimeToSeconds(timeStr);

            // Duplicate Detection
            if (_leaderboard.IsDuplicateHash(computedHash))
            {
                OnLog("رفض تقرير مكرر متطابق من " + group + " - " + lastName + " " + firstName + " (" + pcNumber + ")");
                string dupJson = "{\"success\":false,\"duplicate\":true,\"message\":\"Duplicate submission: exact report already received.\"}";
                SendResponse(stream, 409, "Conflict", dupJson, "application/json; charset=utf-8");
                return;
            }

            DateTime now = DateTime.Now;
            string sessionDir = TimeSlotManager.GetSessionDirectory(_baseStoragePath, group, now);
            string timeSlot = TimeSlotManager.GetCurrentTimeSlot(now);

            int version = _leaderboard.GetNextVersion(group, lastName, firstName);

            // Determine unique target file path
            string targetFileName = fileName;
            string ext = Path.GetExtension(fileName);
            if (string.IsNullOrEmpty(ext)) ext = ".pdf";
            string baseName = Path.GetFileNameWithoutExtension(fileName);

            if (version > 1)
            {
                targetFileName = baseName + "_v" + version + ext;
            }

            string targetPath = Path.Combine(sessionDir, targetFileName);
            int fileCollisionCounter = 1;
            while (File.Exists(targetPath))
            {
                fileCollisionCounter++;
                targetFileName = baseName + "_v" + version + "_" + fileCollisionCounter + ext;
                targetPath = Path.Combine(sessionDir, targetFileName);
            }

            // Save PDF to session folder
            File.WriteAllBytes(targetPath, body);

            // Register in Leaderboard
            ReportModel report = new ReportModel
            {
                FileName = targetFileName,
                FilePath = targetPath,
                FileHash = computedHash,
                Group = group,
                PcNumber = pcNumber,
                LastName = lastName,
                FirstName = firstName,
                Score = score,
                TimeString = timeStr,
                TimeSeconds = timeSec,
                Version = version,
                SubmissionTime = now
            };

            _leaderboard.AddReport(report);

            // Automatically generate/refresh HTML Leaderboard in session folder
            _leaderboard.UpdateHtmlLeaderboard(sessionDir, group, timeSlot, _settings.TeacherName, _settings.Institution);

            OnLog("استلام ناجح: " + lastName + " " + firstName + " (" + pcNumber + ") - العلامة: " + score.ToString("00.00") + " [إصدار v" + version + "]");

            if (ReportReceived != null)
            {
                ReportReceived(this, new ReportReceivedEventArgs
                {
                    Report = report,
                    IsDuplicate = false,
                    SessionDirectory = sessionDir
                });
            }

            string successJson = "{\"success\":true,\"duplicate\":false,\"savedAs\":\"" + targetFileName + "\",\"version\":" + version + "}";
            SendResponse(stream, 200, "OK", successJson, "application/json; charset=utf-8");
        }

        private static string GetHeader(Dictionary<string, string> dict, string key, string fallback = "")
        {
            string val;
            if (dict.TryGetValue(key, out val))
            {
                return val;
            }
            return fallback;
        }

        private static void SendResponse(NetworkStream stream, int statusCode, string statusReason, string bodyText, string contentType = "text/plain; charset=utf-8")
        {
            try
            {
                byte[] bodyBytes = Encoding.UTF8.GetBytes(bodyText);
                string responseHeader = "HTTP/1.1 " + statusCode + " " + statusReason + "\r\n" +
                                        "Server: ReportReceiver/1.0\r\n" +
                                        "Access-Control-Allow-Origin: *\r\n" +
                                        "Content-Type: " + contentType + "\r\n" +
                                        "Content-Length: " + bodyBytes.Length + "\r\n" +
                                        "Connection: close\r\n\r\n";
                byte[] headerBytes = Encoding.ASCII.GetBytes(responseHeader);
                stream.Write(headerBytes, 0, headerBytes.Length);
                stream.Write(bodyBytes, 0, bodyBytes.Length);
                stream.Flush();
            }
            catch { }
        }

        private void OnLog(string message)
        {
            if (LogMessage != null)
            {
                LogMessage(this, "[" + DateTime.Now.ToString("HH:mm:ss") + "] " + message);
            }
        }
    }
}

