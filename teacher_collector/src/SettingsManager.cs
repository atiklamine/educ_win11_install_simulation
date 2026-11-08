using System;
using System.IO;

namespace TeacherCollector
{
    public class CollectorSettings
    {
        public string BaseStoragePath { get; set; }
        public string ActiveSection { get; set; }
        public int TcpPort { get; set; }
        public int UdpPort { get; set; }
        public int SlotDurationHours { get; set; }
        public bool AutoCollectOnConnect { get; set; }
        public bool PlaySoundOnReceive { get; set; }

        public CollectorSettings()
        {
            // Default configuration optimized for Algerian school lab environments
            BaseStoragePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "تقارير_التقييم_المجمعة");
            ActiveSection = "1AS-01";
            TcpPort = 8888;
            UdpPort = 8889;
            SlotDurationHours = 1;
            AutoCollectOnConnect = false;
            PlaySoundOnReceive = true;
        }
    }

    public static class SettingsManager
    {
        private static readonly string SettingsFile = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "collector_settings.ini");

        public static CollectorSettings LoadSettings()
        {
            var settings = new CollectorSettings();
            if (!File.Exists(SettingsFile))
            {
                SaveSettings(settings);
                return settings;
            }

            try
            {
                var lines = File.ReadAllLines(SettingsFile);
                foreach (var line in lines)
                {
                    if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#") || line.StartsWith(";"))
                        continue;

                    int idx = line.IndexOf('=');
                    if (idx <= 0) continue;

                    string key = line.Substring(0, idx).Trim();
                    string val = line.Substring(idx + 1).Trim();

                    switch (key.ToLowerInvariant())
                    {
                        case "basestoragepath":
                            if (!string.IsNullOrEmpty(val)) settings.BaseStoragePath = val;
                            break;
                        case "activesection":
                            if (!string.IsNullOrEmpty(val)) settings.ActiveSection = val;
                            break;
                        case "tcpport":
                            int p;
                            if (int.TryParse(val, out p) && p > 1024 && p < 65535) settings.TcpPort = p;
                            break;
                        case "udpport":
                            int u;
                            if (int.TryParse(val, out u) && u > 1024 && u < 65535) settings.UdpPort = u;
                            break;
                        case "slotdurationhours":
                            int d;
                            if (int.TryParse(val, out d) && (d == 1 || d == 2)) settings.SlotDurationHours = d;
                            break;
                        case "autocollectonconnect":
                            bool ac;
                            if (bool.TryParse(val, out ac)) settings.AutoCollectOnConnect = ac;
                            break;
                        case "playsoundonreceive":
                            bool ps;
                            if (bool.TryParse(val, out ps)) settings.PlaySoundOnReceive = ps;
                            break;
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Error loading settings: " + ex.Message);
            }

            return settings;
        }

        public static void SaveSettings(CollectorSettings s)
        {
            try
            {
                using (var sw = new StreamWriter(SettingsFile, false, System.Text.Encoding.UTF8))
                {
                    sw.WriteLine("# إعدادات خادم جمع التقارير للأستاذ - مخبر المعلوماتية");
                    sw.WriteLine("# DZ High School IT Lab Assessment Collector Settings");
                    sw.WriteLine("BaseStoragePath=" + s.BaseStoragePath);
                    sw.WriteLine("ActiveSection=" + s.ActiveSection);
                    sw.WriteLine("TcpPort=" + s.TcpPort);
                    sw.WriteLine("UdpPort=" + s.UdpPort);
                    sw.WriteLine("SlotDurationHours=" + s.SlotDurationHours);
                    sw.WriteLine("AutoCollectOnConnect=" + s.AutoCollectOnConnect);
                    sw.WriteLine("PlaySoundOnReceive=" + s.PlaySoundOnReceive);
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Error saving settings: " + ex.Message);
            }
        }
    }
}
