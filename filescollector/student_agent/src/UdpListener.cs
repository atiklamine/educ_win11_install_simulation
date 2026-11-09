using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

namespace StudentAgent
{
    /// <summary>
    /// مستمع نداء الأستاذ الدوري (UDP Beacon Listener)
    /// يكتشف تلقائياً خادم الأستاذ على الشبكة المحلية دون الحاجة لأي إعداد يدوي
    /// </summary>
    public class UdpListener : IDisposable
    {
        private Thread _listenThread;
        private volatile bool _isRunning;
        private readonly int _udpPort;

        public event Action<string, int, string> TeacherDiscovered;

        public UdpListener(int udpPort = 8889)
        {
            _udpPort = udpPort;
        }

        public void Start()
        {
            if (_isRunning) return;
            _isRunning = true;
            _listenThread = new Thread(ListenLoop)
            {
                IsBackground = true,
                Name = "StudentUdpListenerThread"
            };
            _listenThread.Start();
        }

        public void Stop()
        {
            _isRunning = false;
        }

        private void ListenLoop()
        {
            UdpClient client = null;
            try
            {
                client = new UdpClient();
                client.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
                client.ExclusiveAddressUse = false;
                client.Client.Bind(new IPEndPoint(IPAddress.Any, _udpPort));

                IPEndPoint senderEp = new IPEndPoint(IPAddress.Any, 0);

                while (_isRunning)
                {
                    try
                    {
                        byte[] data = client.Receive(ref senderEp);
                        if (data != null && data.Length > 0)
                        {
                            string msg = Encoding.UTF8.GetString(data);
                            // Format: DZ_TEACHER_HUB|TEACHER_IP|TCP_PORT|ACTIVE_SECTION
                            if (msg.StartsWith("DZ_TEACHER_HUB|"))
                            {
                                string[] parts = msg.Split('|');
                                if (parts.Length >= 4)
                                {
                                    string teacherIp = parts[1].Trim();
                                    int tcpPort = 8888;
                                    int.TryParse(parts[2].Trim(), out tcpPort);
                                    string section = parts[3].Trim();

                                    // إذا كان عنوان IP المرسل 127.0.0.1 وكان من جهاز آخر نأخذ عنوان المرسل الفعلي
                                    if (teacherIp == "127.0.0.1" && !IPAddress.IsLoopback(senderEp.Address))
                                    {
                                        teacherIp = senderEp.Address.ToString();
                                    }

                                    if (TeacherDiscovered != null)
                                    {
                                        TeacherDiscovered(teacherIp, tcpPort, section);
                                    }
                                }
                            }
                        }
                    }
                    catch (SocketException)
                    {
                        if (!_isRunning) break;
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine("UDP Listener minor warning: " + ex.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("UDP Listener loop error: " + ex.Message);
            }
            finally
            {
                if (client != null)
                {
                    try { client.Close(); } catch { }
                }
            }
        }

        public void Dispose()
        {
            Stop();
        }
    }
}

