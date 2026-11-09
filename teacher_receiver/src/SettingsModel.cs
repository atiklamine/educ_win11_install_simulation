using System;
using System.IO;

namespace TeacherReceiver
{
    public class SettingsModel
    {
        public int Port { get; set; }
        public string StoragePath { get; set; }
        public bool PlaySound { get; set; }
        public bool AutoOpenSessionFolder { get; set; }
        public string TeacherName { get; set; }
        public string Institution { get; set; }

        public SettingsModel()
        {
            Port = 8888;
            string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
            StoragePath = Path.Combine(desktop, "تقارير_المحاكاة_المستلمة");
            PlaySound = true;
            AutoOpenSessionFolder = false;
            TeacherName = "أستاذ مادة المعلوماتية";
            Institution = "مخبر الإعلام الآلي";
        }

        private static string GetConfigFilePath()
        {
            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            return Path.Combine(appDir, "receiver_settings.ini");
        }

        public static SettingsModel Load()
        {
            SettingsModel settings = new SettingsModel();
            string path = GetConfigFilePath();
            if (!File.Exists(path)) return settings;

            try
            {
                string[] lines = File.ReadAllLines(path);
                foreach (string line in lines)
                {
                    string trimmed = line.Trim();
                    if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith("#") || trimmed.StartsWith(";"))
                        continue;
                    int idx = trimmed.IndexOf('=');
                    if (idx <= 0) continue;
                    string key = trimmed.Substring(0, idx).Trim();
                    string val = trimmed.Substring(idx + 1).Trim();

                    if (key.Equals("Port", StringComparison.OrdinalIgnoreCase))
                    {
                        int p;
                        if (int.TryParse(val, out p) && p > 1024 && p < 65535) settings.Port = p;
                    }
                    else if (key.Equals("StoragePath", StringComparison.OrdinalIgnoreCase))
                    {
                        if (!string.IsNullOrEmpty(val)) settings.StoragePath = val;
                    }
                    else if (key.Equals("PlaySound", StringComparison.OrdinalIgnoreCase))
                    {
                        bool b;
                        if (bool.TryParse(val, out b)) settings.PlaySound = b;
                    }
                    else if (key.Equals("AutoOpenSessionFolder", StringComparison.OrdinalIgnoreCase))
                    {
                        bool b;
                        if (bool.TryParse(val, out b)) settings.AutoOpenSessionFolder = b;
                    }
                    else if (key.Equals("TeacherName", StringComparison.OrdinalIgnoreCase))
                    {
                        if (!string.IsNullOrEmpty(val)) settings.TeacherName = val;
                    }
                    else if (key.Equals("Institution", StringComparison.OrdinalIgnoreCase))
                    {
                        if (!string.IsNullOrEmpty(val)) settings.Institution = val;
                    }
                }
            }
            catch { }
            return settings;
        }

        public void Save()
        {
            try
            {
                string path = GetConfigFilePath();
                using (StreamWriter sw = new StreamWriter(path, false, System.Text.Encoding.UTF8))
                {
                    sw.WriteLine("# إعدادات مستقبل تقارير المحاكي");
                    sw.WriteLine("Port=" + Port);
                    sw.WriteLine("StoragePath=" + StoragePath);
                    sw.WriteLine("PlaySound=" + PlaySound);
                    sw.WriteLine("AutoOpenSessionFolder=" + AutoOpenSessionFolder);
                    sw.WriteLine("TeacherName=" + TeacherName);
                    sw.WriteLine("Institution=" + Institution);
                }
            }
            catch { }
        }
    }
}

