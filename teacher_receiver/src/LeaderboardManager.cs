using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace TeacherReceiver
{
    public class LeaderboardManager
    {
        private readonly List<ReportModel> _reports = new List<ReportModel>();
        private readonly object _lock = new object();

        public List<ReportModel> GetAllReports()
        {
            lock (_lock)
            {
                return new List<ReportModel>(_reports);
            }
        }

        public bool IsDuplicateHash(string hash)
        {
            if (string.IsNullOrEmpty(hash)) return false;
            lock (_lock)
            {
                foreach (var r in _reports)
                {
                    if (string.Equals(r.FileHash, hash, StringComparison.OrdinalIgnoreCase))
                        return true;
                }
            }
            return false;
        }

        public int GetNextVersion(string group, string lastName, string firstName)
        {
            lock (_lock)
            {
                int count = 0;
                string gn = (group ?? "").Trim().ToLowerInvariant();
                string ln = (lastName ?? "").Trim().ToLowerInvariant();
                string fn = (firstName ?? "").Trim().ToLowerInvariant();

                foreach (var r in _reports)
                {
                    string rG = (r.Group ?? "").Trim().ToLowerInvariant();
                    string rL = (r.LastName ?? "").Trim().ToLowerInvariant();
                    string rF = (r.FirstName ?? "").Trim().ToLowerInvariant();
                    if (rG == gn && rL == ln && rF == fn)
                    {
                        count++;
                    }
                }
                return count + 1;
            }
        }

        public void AddReport(ReportModel report)
        {
            lock (_lock)
            {
                _reports.Add(report);
            }
        }

        /// <summary>
        /// Strictly orders submissions by pedagogical priority:
        /// 1. Section (Group)
        /// 2. Score Descending (Highest score first: 20.00 down to 00.00)
        /// 3. Elapsed Time Ascending (Fastest completion first when scores are tied)
        /// 4. Student Last Name & First Name (Alphabetical)
        /// </summary>
        public List<ReportModel> GetSortedLeaderboard(string filterGroup = null)
        {
            List<ReportModel> list;
            lock (_lock)
            {
                list = new List<ReportModel>(_reports);
            }

            if (!string.IsNullOrEmpty(filterGroup) && !filterGroup.Equals("الكل", StringComparison.OrdinalIgnoreCase))
            {
                list = list.FindAll(r => string.Equals(r.Group, filterGroup, StringComparison.OrdinalIgnoreCase));
            }

            list.Sort((a, b) =>
            {
                // 1. Group comparison
                int gComp = string.Compare(a.Group ?? "", b.Group ?? "", StringComparison.OrdinalIgnoreCase);
                if (gComp != 0) return gComp;

                // 2. Score comparison (Descending: higher score comes first)
                int sComp = b.Score.CompareTo(a.Score);
                if (sComp != 0) return sComp;

                // 3. Time comparison (Ascending: lower time comes first)
                int tComp = a.TimeSeconds.CompareTo(b.TimeSeconds);
                if (tComp != 0) return tComp;

                // 4. Last Name comparison
                int lComp = string.Compare(a.LastName ?? "", b.LastName ?? "", StringComparison.OrdinalIgnoreCase);
                if (lComp != 0) return lComp;

                // 5. First Name comparison
                return string.Compare(a.FirstName ?? "", b.FirstName ?? "", StringComparison.OrdinalIgnoreCase);
            });

            return list;
        }

        /// <summary>
        /// Generates or refreshes the HTML session summary leaderboard in the target directory
        /// </summary>
        public void UpdateHtmlLeaderboard(string sessionDirectory, string group, string timeSlot, string teacherName, string institution)
        {
            try
            {
                if (!Directory.Exists(sessionDirectory)) return;

                List<ReportModel> sorted = GetSortedLeaderboard(group);
                string htmlPath = Path.Combine(sessionDirectory, "00_ترتيب_نتائج_الحصة.html");

                double maxScore = 0;
                double minScore = 20;
                double totalScore = 0;
                int count = sorted.Count;

                foreach (var r in sorted)
                {
                    if (r.Score > maxScore) maxScore = r.Score;
                    if (r.Score < minScore) minScore = r.Score;
                    totalScore += r.Score;
                }
                if (count == 0) minScore = 0;
                double avgScore = count > 0 ? (totalScore / count) : 0;

                StringBuilder sb = new StringBuilder();
                sb.AppendLine("<!DOCTYPE html>");
                sb.AppendLine("<html lang=\"ar\" dir=\"rtl\">");
                sb.AppendLine("<head>");
                sb.AppendLine("  <meta charset=\"UTF-8\">");
                sb.AppendLine("  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
                sb.AppendLine("  <title>ترتيب نتائج الحصة - " + EscapeHtml(group) + " (" + EscapeHtml(timeSlot) + ")</title>");
                sb.AppendLine("  <style>");
                sb.AppendLine("    :root { --primary: #0078d4; --bg: #f8fafc; --text: #0f172a; --card: #ffffff; --border: #e2e8f0; }");
                sb.AppendLine("    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }");
                sb.AppendLine("    body { background: var(--bg); color: var(--text); padding: 24px; direction: rtl; text-align: right; }");
                sb.AppendLine("    .container { max-width: 1000px; margin: 0 auto; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 28px; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }");
                sb.AppendLine("    .header { text-align: center; border-bottom: 2px solid var(--border); padding-bottom: 18px; margin-bottom: 22px; }");
                sb.AppendLine("    .header h1 { font-size: 22px; color: var(--primary); margin-bottom: 6px; }");
                sb.AppendLine("    .header .meta { font-size: 13px; color: #64748b; line-height: 1.6; }");
                sb.AppendLine("    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }");
                sb.AppendLine("    .stat-card { background: #f1f5f9; padding: 14px; border-radius: 8px; text-align: center; border: 1px solid #cbd5e1; }");
                sb.AppendLine("    .stat-card .val { font-size: 22px; font-weight: bold; color: var(--primary); }");
                sb.AppendLine("    .stat-card .lbl { font-size: 12px; color: #475569; margin-top: 4px; }");
                sb.AppendLine("    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }");
                sb.AppendLine("    th { background: #0f172a; color: #ffffff; padding: 12px 10px; text-align: right; font-weight: 600; }");
                sb.AppendLine("    td { padding: 10px; border-bottom: 1px solid var(--border); }");
                sb.AppendLine("    tr:nth-child(even) { background: #f8fafc; }");
                sb.AppendLine("    tr:hover { background: #e0f2fe; }");
                sb.AppendLine("    .rank { font-weight: bold; font-size: 14px; text-align: center; width: 60px; }");
                sb.AppendLine("    .score-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-weight: bold; font-size: 13px; }");
                sb.AppendLine("    .score-high { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }");
                sb.AppendLine("    .score-med { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }");
                sb.AppendLine("    .score-low { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }");
                sb.AppendLine("    .ver-badge { font-size: 11px; background: #e2e8f0; color: #334155; padding: 2px 6px; border-radius: 4px; }");
                sb.AppendLine("    .file-link { color: var(--primary); text-decoration: none; font-weight: 500; }");
                sb.AppendLine("    .file-link:hover { text-decoration: underline; }");
                sb.AppendLine("    .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid var(--border); padding-top: 14px; }");
                sb.AppendLine("    @media print { body { background: #fff; padding: 0; } .container { border: none; box-shadow: none; width: 100%; max-width: 100%; } .file-link { color: #000; text-decoration: none; } }");
                sb.AppendLine("  </style>");
                sb.AppendLine("</head>");
                sb.AppendLine("<body>");
                sb.AppendLine("<div class=\"container\">");
                sb.AppendLine("  <div class=\"header\">");
                sb.AppendLine("    <div style=\"font-size: 12px; color: #64748b; margin-bottom: 4px;\">الجمهورية الجزائرية الديمقراطية الشعبية - وزارة التربية الوطنية</div>");
                sb.AppendLine("    <h1>ترتيب نتائج تقييم الكفاءة لمخبر الإعلام الآلي</h1>");
                sb.AppendLine("    <div class=\"meta\">");
                sb.AppendLine("      <strong>المؤسسة:</strong> " + EscapeHtml(institution) + " | <strong>الأستاذ:</strong> " + EscapeHtml(teacherName) + "<br>");
                sb.AppendLine("      <strong>الفوج:</strong> " + EscapeHtml(group) + " | <strong>الفترة:</strong> " + EscapeHtml(timeSlot) + " | <strong>تاريخ الحصة:</strong> " + DateTime.Now.ToString("yyyy/MM/dd") + "<br>");
                sb.AppendLine("      <em>معيار الترتيب: الفوج &larr; العلامة تنازلياً &larr; الوقت المستغرق تصاعدياً &larr; الاسم</em>");
                sb.AppendLine("    </div>");
                sb.AppendLine("  </div>");

                sb.AppendLine("  <div class=\"stats-grid\">");
                sb.AppendLine("    <div class=\"stat-card\"><div class=\"val\">" + count + "</div><div class=\"lbl\">إجمالي التلاميذ المقيمين</div></div>");
                sb.AppendLine("    <div class=\"stat-card\"><div class=\"val\">" + maxScore.ToString("00.00") + "</div><div class=\"lbl\">أعلى علامة مسجلة</div></div>");
                sb.AppendLine("    <div class=\"stat-card\"><div class=\"val\">" + avgScore.ToString("00.00") + "</div><div class=\"lbl\">معدل الفوج العام</div></div>");
                sb.AppendLine("    <div class=\"stat-card\"><div class=\"val\">" + minScore.ToString("00.00") + "</div><div class=\"lbl\">أدنى علامة مسجلة</div></div>");
                sb.AppendLine("  </div>");

                sb.AppendLine("  <table>");
                sb.AppendLine("    <thead>");
                sb.AppendLine("      <tr>");
                sb.AppendLine("        <th style=\"text-align:center;\">المرتبة</th>");
                sb.AppendLine("        <th>الجهاز</th>");
                sb.AppendLine("        <th>اللقب والاسم</th>");
                sb.AppendLine("        <th style=\"text-align:center;\">العلامة /20</th>");
                sb.AppendLine("        <th style=\"text-align:center;\">الوقت المستغرق</th>");
                sb.AppendLine("        <th style=\"text-align:center;\">المحاولة</th>");
                sb.AppendLine("        <th style=\"text-align:center;\">وقت التسليم</th>");
                sb.AppendLine("        <th>ملف التقرير</th>");
                sb.AppendLine("      </tr>");
                sb.AppendLine("    </thead>");
                sb.AppendLine("    <tbody>");

                int rank = 1;
                foreach (var r in sorted)
                {
                    string medal = rank.ToString();
                    if (rank == 1) medal = "🥇 1";
                    else if (rank == 2) medal = "🥈 2";
                    else if (rank == 3) medal = "🥉 3";

                    string scoreClass = "score-high";
                    if (r.Score < 10.0) scoreClass = "score-low";
                    else if (r.Score < 15.0) scoreClass = "score-med";

                    string relFile = Path.GetFileName(r.FilePath ?? r.FileName);

                    sb.AppendLine("      <tr>");
                    sb.AppendLine("        <td class=\"rank\">" + medal + "</td>");
                    sb.AppendLine("        <td><strong>" + EscapeHtml(r.PcNumber) + "</strong></td>");
                    sb.AppendLine("        <td><strong>" + EscapeHtml(r.FullName) + "</strong></td>");
                    sb.AppendLine("        <td style=\"text-align:center;\"><span class=\"score-badge " + scoreClass + "\">" + r.ScoreFormatted + "</span></td>");
                    sb.AppendLine("        <td style=\"text-align:center;\">" + EscapeHtml(r.ElapsedFormatted) + "</td>");
                    sb.AppendLine("        <td style=\"text-align:center;\"><span class=\"ver-badge\">v" + r.Version + "</span></td>");
                    sb.AppendLine("        <td style=\"text-align:center; font-size: 11px; color: #64748b;\">" + r.SubmissionTime.ToString("HH:mm:ss") + "</td>");
                    sb.AppendLine("        <td><a class=\"file-link\" href=\"" + EscapeHtml(relFile) + "\" target=\"_blank\">📄 استعراض PDF</a></td>");
                    sb.AppendLine("      </tr>");
                    rank++;
                }

                if (count == 0)
                {
                    sb.AppendLine("      <tr><td colspan=\"8\" style=\"text-align:center; padding: 24px; color: #94a3b8;\">لم يتم استلام أي تقارير لهذا الفوج بعد.</td></tr>");
                }

                sb.AppendLine("    </tbody>");
                sb.AppendLine("  </table>");

                sb.AppendLine("  <div class=\"footer\">");
                sb.AppendLine("    تم إنشاء هذا الجدول آلياً بواسطة مستقبل تقارير المحاكي التعليمي (ReportReceiver) &bull; " + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
                sb.AppendLine("  </div>");
                sb.AppendLine("</div>");
                sb.AppendLine("</body>");
                sb.AppendLine("</html>");

                File.WriteAllText(htmlPath, sb.ToString(), Encoding.UTF8);
            }
            catch { }
        }

        private static string EscapeHtml(string text)
        {
            if (string.IsNullOrEmpty(text)) return "";
            return text.Replace("&", "&amp;")
                       .Replace("<", "&lt;")
                       .Replace(">", "&gt;")
                       .Replace("\"", "&quot;");
        }
    }
}

