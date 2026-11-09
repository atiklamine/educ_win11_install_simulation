using System;
using System.IO;
using System.Text.RegularExpressions;

namespace TeacherCollector
{
    /// <summary>
    /// خوارزمية ذكية لحساب فترات الحصص المدرسية وتنظيم شجرة المجلدات آلياً
    /// متوافقة تماماً مع نظام التوقيت في الثانويات الجزائرية (صباحي ساعي كامل، مسائي بنظام النصف ساعة)
    /// </summary>
    public static class TimeSlotManager
    {
        /// <summary>
        /// حساب اسم فترة الحصة تلقائياً استناداً إلى وقت الجمع الحالي
        /// </summary>
        /// <param name="time">وقت جمع الملفات</param>
        /// <param name="durationHours">مدة الحصة بالساعات (افتراضياً 1 ساعة، أو ساعتان للأعمال التطبيقية TP)</param>
        /// <returns>سلسلة نصية لفترة الحصة مثل "08h00-09h00" أو "13h30-14h30"</returns>
        public static string CalculateTimeSlot(DateTime time, int durationHours = 1)
        {
            if (durationHours < 1) durationHours = 1;
            int hour = time.Hour;
            int minute = time.Minute;
            double timeDecimal = hour + (minute / 60.0);

            // 1. الفترة الصباحية: من 07:30 صباحاً إلى 12:30 زوالاً
            // التوقيت ساعي يبدأ من رأس الساعة (مثلاً: 08:22 -> تقع في حصة 08:00 إلى 09:00)
            if (timeDecimal >= 7.5 && timeDecimal < 12.5)
            {
                int startHour = hour;
                int endHour = startHour + durationHours;
                return string.Format("{0:D2}h00-{1:D2}h00", startHour, endHour);
            }

            // 2. الفترة المسائية: من 12:30 زوالاً إلى 18:30 مساءً
            // التوقيت في الثانويات الجزائرية يبدأ من 13:30 بنظام النصف ساعة
            // مثال أ: الجمع في 14:22 -> محصور بين 13:30 و 14:30 -> "13h30-14h30"
            // مثال ب: الجمع في 14:35 -> محصور بين 14:30 و 15:30 -> "14h30-15h30"
            if (timeDecimal >= 12.5 && timeDecimal < 18.5)
            {
                int startHour;
                if (minute < 30)
                {
                    startHour = hour - 1;
                }
                else
                {
                    startHour = hour;
                }

                if (startHour < 12) startHour = 13;
                int endHour = startHour + durationHours;
                return string.Format("{0:D2}h30-{1:D2}h30", startHour, endHour);
            }

            // 3. أي وقت آخر (استدراك، مسائي، أو تجارب ليلية): حساب ساعي قياسي
            int defaultStart = hour;
            int defaultEnd = (hour + durationHours) % 24;
            return string.Format("{0:D2}h00-{1:D2}h00", defaultStart, defaultEnd);
        }

        /// <summary>
        /// تنظيف اسم المجلد من أي رموز غير مسموحة في نظام ويندوز
        /// </summary>
        public static string SanitizeFolderName(string name, string fallback = "فوج_عام")
        {
            if (string.IsNullOrWhiteSpace(name)) return fallback;
            string clean = Regex.Replace(name.Trim(), @"[\\/:*?""<>|]", "-");
            clean = Regex.Replace(clean, @"\s+", "_").Trim('.', '-', '_');
            return string.IsNullOrEmpty(clean) ? fallback : clean;
        }

        /// <summary>
        /// توليد المسار الكامل للمجلد المستهدف لحفظ التقارير مع إنشائه إذا لم يكن موجوداً
        /// الهيكلية: [المسار الأساسي] \ [اسم الفوج] \ [تاريخ الحصة yyyy-MM-dd] \ [فترة الحصة]
        /// </summary>
        public static string GetSessionFolderPath(string baseDirectory, string sectionName, DateTime sessionTime, int durationHours = 1)
        {
            if (string.IsNullOrWhiteSpace(baseDirectory))
            {
                baseDirectory = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "تقارير_التقييم_المجمعة");
            }

            string safeSection = SanitizeFolderName(sectionName, "1AS-01");
            string datePart = sessionTime.ToString("yyyy-MM-dd");
            string slotPart = CalculateTimeSlot(sessionTime, durationHours);

            string fullPath = Path.Combine(baseDirectory, safeSection, datePart, slotPart);

            try
            {
                if (!Directory.Exists(fullPath))
                {
                    Directory.CreateDirectory(fullPath);
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Error creating session directory: " + ex.Message);
            }

            return fullPath;
        }
    }
}

