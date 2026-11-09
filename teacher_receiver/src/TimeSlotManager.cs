using System;
using System.IO;

namespace TeacherReceiver
{
    public static class TimeSlotManager
    {
        /// <summary>
        /// Computes the educational session time slot name based on Algerian secondary school schedule:
        /// Morning: Hourly from whole hours (08:00-09:00, 09:00-10:00, 10:00-11:00, 11:00-12:00)
        /// Afternoon: Hourly from half hours (13:30-14:30, 14:30-15:30, 15:30-16:30, 16:30-17:30)
        /// </summary>
        public static string GetCurrentTimeSlot(DateTime now)
        {
            TimeSpan time = now.TimeOfDay;

            // Morning range (07:00 to 12:30)
            if (time < new TimeSpan(12, 30, 0))
            {
                if (time < new TimeSpan(9, 15, 0))
                    return "08h00-09h00";
                if (time < new TimeSpan(10, 15, 0))
                    return "09h00-10h00";
                if (time < new TimeSpan(11, 15, 0))
                    return "10h00-11h00";
                return "11h00-12h00";
            }
            // Afternoon range (12:30 to 18:30)
            else
            {
                if (time < new TimeSpan(14, 45, 0))
                    return "13h30-14h30";
                if (time < new TimeSpan(15, 45, 0))
                    return "14h30-15h30";
                if (time < new TimeSpan(16, 45, 0))
                    return "15h30-16h30";
                return "16h30-17h30";
            }
        }

        public static string SanitizeFolderName(string name, string fallback)
        {
            if (string.IsNullOrEmpty(name)) return fallback;
            char[] invalidChars = Path.GetInvalidFileNameChars();
            foreach (char c in invalidChars)
            {
                name = name.Replace(c, '_');
            }
            name = name.Replace('/', '-').Replace('\\', '-').Trim();
            return string.IsNullOrEmpty(name) ? fallback : name;
        }

        public static string GetSessionDirectory(string basePath, string group, DateTime now)
        {
            string cleanGroup = SanitizeFolderName(group, "الفوج_الافتراضي");
            string dateStr = now.ToString("yyyy-MM-dd");
            string slotStr = GetCurrentTimeSlot(now);

            string path = Path.Combine(basePath, cleanGroup);
            path = Path.Combine(path, dateStr);
            path = Path.Combine(path, slotStr);

            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }
            return path;
        }
    }
}

