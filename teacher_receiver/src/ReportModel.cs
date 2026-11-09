using System;

namespace TeacherReceiver
{
    public class ReportModel
    {
        public string Id { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public string FileHash { get; set; }
        public string Group { get; set; }
        public string PcNumber { get; set; }
        public string LastName { get; set; }
        public string FirstName { get; set; }
        public double Score { get; set; }
        public string TimeString { get; set; }
        public int TimeSeconds { get; set; }
        public int Version { get; set; }
        public DateTime SubmissionTime { get; set; }

        public string FullName
        {
            get
            {
                string ln = LastName ?? "";
                string fn = FirstName ?? "";
                return (ln + " " + fn).Trim();
            }
        }

        public string ScoreFormatted
        {
            get { return Score.ToString("00.00") + " / 20"; }
        }

        public string ElapsedFormatted
        {
            get
            {
                int m = TimeSeconds / 60;
                int s = TimeSeconds % 60;
                return string.Format("{0:D2}:{1:D2}", m, s);
            }
        }

        public ReportModel()
        {
            Id = Guid.NewGuid().ToString("N");
            Group = "1AS-01";
            PcNumber = "حاسوب 01";
            LastName = "";
            FirstName = "";
            Score = 0.0;
            TimeString = "00:00";
            TimeSeconds = 0;
            Version = 1;
            SubmissionTime = DateTime.Now;
        }

        public static int ParseTimeToSeconds(string timeStr)
        {
            if (string.IsNullOrEmpty(timeStr)) return 0;
            timeStr = timeStr.Trim().Replace('-', ':');
            string[] parts = timeStr.Split(':');
            try
            {
                if (parts.Length == 3)
                {
                    int h = int.Parse(parts[0]);
                    int m = int.Parse(parts[1]);
                    int s = int.Parse(parts[2]);
                    return h * 3600 + m * 60 + s;
                }
                if (parts.Length == 2)
                {
                    int m = int.Parse(parts[0]);
                    int s = int.Parse(parts[1]);
                    return m * 60 + s;
                }
                if (parts.Length == 1)
                {
                    return int.Parse(parts[0]);
                }
            }
            catch { }
            return 0;
        }

        public static double ParseScore(string scoreStr)
        {
            if (string.IsNullOrEmpty(scoreStr)) return 0.0;
            scoreStr = scoreStr.Trim().Replace(',', '.');
            double d;
            if (double.TryParse(scoreStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out d))
            {
                return Math.Max(0.0, Math.Min(20.0, d));
            }
            return 0.0;
        }
    }
}

