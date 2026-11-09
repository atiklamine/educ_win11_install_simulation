using System;
using System.Collections.Generic;
using System.IO;

namespace StudentAgent
{
    /// <summary>
    /// ماسح سطح المكتب الآمن
    /// يبحث فقط وحصرياً في سطح مكتب المستخدم عن تقارير التقييم بصيغة PDF المطابقة لمعايير المحاكي
    /// </summary>
    public static class DesktopScanner
    {
        public static List<string> FindAssessmentReports(string sectionFilter = null)
        {
            var results = new List<string>();
            var candidatePaths = new List<string>();

            // 1. سطح المكتب الخاص بالمستخدم الحالي
            try
            {
                string userDesktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                if (Directory.Exists(userDesktop))
                {
                    candidatePaths.Add(userDesktop);
                }
            }
            catch { }

            // 2. سطح المكتب العام المشترك (Public Desktop)
            try
            {
                string commonDesktop = Environment.GetFolderPath(Environment.SpecialFolder.CommonDesktopDirectory);
                if (Directory.Exists(commonDesktop) && !candidatePaths.Contains(commonDesktop))
                {
                    candidatePaths.Add(commonDesktop);
                }
            }
            catch { }

            foreach (var dir in candidatePaths)
            {
                try
                {
                    DirectoryInfo di = new DirectoryInfo(dir);
                    FileInfo[] pdfFiles = di.GetFiles("*.pdf", SearchOption.TopDirectoryOnly);

                    // فرز الملفات حسب تاريخ التعديل (الأحدث أولاً)
                    Array.Sort(pdfFiles, (a, b) => b.LastWriteTime.CompareTo(a.LastWriteTime));

                    foreach (var file in pdfFiles)
                    {
                        string name = file.Name;
                        if (IsMatchingReport(name, sectionFilter))
                        {
                            if (!results.Contains(name))
                            {
                                results.Add(name);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine("Desktop scan error in " + dir + ": " + ex.Message);
                }
            }

            return results;
        }

        /// <summary>
        /// التحقق من مطابقة اسم الملف لمعايير تقارير المحاكي
        /// </summary>
        public static bool IsMatchingReport(string fileName, string sectionFilter)
        {
            if (string.IsNullOrWhiteSpace(fileName)) return false;
            string fn = fileName.Trim();
            if (!fn.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase)) return false;

            // إذا كان الأستاذ قد حدد فوجاً معيناً، يُفضل الملفات التي تبدأ برمز الفوج
            if (!string.IsNullOrEmpty(sectionFilter))
            {
                string cleanFilter = sectionFilter.Split(' ')[0].Trim();
                if (fn.StartsWith(cleanFilter, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            // فحص نمط تقارير المحاكي العام المعتمد:
            // يبدأ بفوج (مثل 1AS-01 أو 1AS-02 أو 2AS) ويحتوي على درجات وتوقيت
            if (fn.StartsWith("1AS", StringComparison.OrdinalIgnoreCase) ||
                fn.StartsWith("2AS", StringComparison.OrdinalIgnoreCase) ||
                fn.StartsWith("3AS", StringComparison.OrdinalIgnoreCase) ||
                fn.StartsWith("TC", StringComparison.OrdinalIgnoreCase) ||
                fn.IndexOf("PC", StringComparison.OrdinalIgnoreCase) >= 0 ||
                fn.IndexOf("report", StringComparison.OrdinalIgnoreCase) >= 0 ||
                fn.IndexOf("تقرير", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return true;
            }

            return false;
        }

        /// <summary>
        /// الحصول على المسار المطلق للملف في سطح المكتب بأمان تام
        /// </summary>
        public static string ResolveDesktopFilePath(string fileName)
        {
            string safeName = Path.GetFileName(fileName);
            string userDesktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
            string userPath = Path.Combine(userDesktop, safeName);
            if (File.Exists(userPath)) return userPath;

            try
            {
                string commonDesktop = Environment.GetFolderPath(Environment.SpecialFolder.CommonDesktopDirectory);
                string commonPath = Path.Combine(commonDesktop, safeName);
                if (File.Exists(commonPath)) return commonPath;
            }
            catch { }

            return null;
        }
    }
}

