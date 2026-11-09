using System;
using System.Net;
using System.Net.Sockets;
using System.Net.NetworkInformation;
using System.Text;
using System.Threading;

namespace TeacherCollector
{
    /// <summary>
    /// مرسل بث النداء الدوري (UDP Beacon)
    /// يقوم ببث نداء خفيف جداً على الشبكة المحلية لاكتشاف خادم الأستاذ تلقائياً من طرف أجهزة التلاميذ
    /// </summary>
    public class UdpBeacon : IDisposable
    {
        private Thread _beaconThread;
        private volatile bool _isRunning;
        private readonly int _udpPort;
        private readonly int _tcpPort;
        private string _activeSection;

        public UdpBeacon(int udpPort, int tcpPort, string activeSection)
        {
            _udpPort = udpPort;
            _tcpPort = tcpPort;
            _activeSection = activeSection;
        }

        public void UpdateSection(string section)
        {
            _activeSection = section;
        }

        public void Start()
        {
            if (_isRunning) return;
            _isRunning = true;
            _beaconThread = new Thread(BeaconLoop)
            {
                IsBackground = true,
                Name = "TeacherUdpBeaconThread"
            };
            _beaconThread.Start();
        }

        public void Stop()
        {
            _isRunning = false;
        }

        private void BeaconLoop()
        {
            UdpClient client = null;
            try
            {
                client = new UdpClient();
                client.EnableBroadcast = true;
                IPEndPoint target = new IPEndPoint(IPAddress.Broadcast, _udpPort);

                while (_isRunning)
                {
                    try
                    {
                        string localIp = GetBestLocalIPv4();
                        // Format: DZ_TEACHER_HUB|TEACHER_IP|TCP_PORT|ACTIVE_SECTION
                        string beaconMessage = string.Format("DZ_TEACHER_HUB|{0}|{1}|{2}", localIp, _tcpPort, _activeSection);
                        byte[] bytes = Encoding.UTF8.GetBytes(beaconMessage);

                        client.Send(bytes, bytes.Length, target);
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine("UDP Beacon broadcast minor warning: " + ex.Message);
                    }

                    // بث كل ثانيتين (خفيف جداً ولا يستهلك أي قدر يُذكر من الباندويث)
                    Thread.Sleep(2000);
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("UDP Beacon error: " + ex.Message);
            }
            finally
            {
                if (client != null)
                {
                    try { client.Close(); } catch { }
                }
            }
        }

        /// <summary>
        /// الحصول على أفضل عنوان IPv4 محلي لحاسوب الأستاذ
        /// </summary>
        public static string GetBestLocalIPv4()
        {
            try
            {
                // محاولة فحص بطاقات الشبكة المتصلة والنشطة
                foreach (NetworkInterface ni in NetworkInterface.GetAllNetworkInterfaces())
                {
                    if (ni.OperationalStatus != OperationalStatus.Up ||
                        ni.NetworkInterfaceType == NetworkInterfaceType.Loopback)
                        continue;

                    IPInterfaceProperties props = ni.GetIPProperties();
                    foreach (UnicastIPAddressInformation addr in props.UnicastAddresses)
                    {
                        if (addr.Address.AddressFamily == AddressFamily.InterNetwork &&
                            !IPAddress.IsLoopback(addr.Address))
                        {
                            string ipStr = addr.Address.ToString();
                            if (!ipStr.StartsWith("169.254.")) // تجاهل العناوين التلقائية غير الصالحة APIPA
                            {
                                return ipStr;
                            }
                        }
                    }
                }
            }
            catch { }

            // بديل احتياطي عبر فحص اسم الجهاز
            try
            {
                string hostName = Dns.GetHostName();
                IPHostEntry hostEntry = Dns.GetHostEntry(hostName);
                foreach (IPAddress ip in hostEntry.AddressList)
                {
                    if (ip.AddressFamily == AddressFamily.InterNetwork && !IPAddress.IsLoopback(ip))
                    {
                        return ip.ToString();
                    }
                }
            }
            catch { }

            return "127.0.0.1";
        }

        public void Dispose()
        {
            Stop();
        }
    }
}

