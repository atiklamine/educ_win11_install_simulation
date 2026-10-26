using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace Win11EduSimulatorLauncher
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                bool is64BitOS = Environment.Is64BitOperatingSystem;

                string exe64 = Path.Combine(baseDir, "Win11_Edu_Simulator_x64.exe");
                string exe32 = Path.Combine(baseDir, "Win11_Edu_Simulator_ia32.exe");
                string exeAuto = Path.Combine(baseDir, "Win11_Edu_Simulator_Universal_Auto.exe");

                string targetExe = null;

                if (is64BitOS)
                {
                    if (File.Exists(exe64)) targetExe = exe64;
                    else if (File.Exists(exeAuto)) targetExe = exeAuto;
                    else if (File.Exists(exe32)) targetExe = exe32;
                }
                else
                {
                    if (File.Exists(exe32)) targetExe = exe32;
                    else if (File.Exists(exeAuto)) targetExe = exeAuto;
                    else if (File.Exists(exe64)) targetExe = exe64;
                }

                if (targetExe != null && File.Exists(targetExe))
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = targetExe;
                    psi.Arguments = string.Join(" ", args);
                    psi.WorkingDirectory = baseDir;
                    psi.UseShellExecute = true;

                    Process.Start(psi);
                }
                else
                {
                    MessageBox.Show(
                        "تعذر العثور على ملفات المحاكي التنفيذية في نفس المجلد.\n\nيرجى التأكد من وجود أحد الملفات التالية:\n- Win11_Edu_Simulator_x64.exe\n- Win11_Edu_Simulator_ia32.exe\n- Win11_Edu_Simulator_Universal_Auto.exe",
                        "محاكي تنصيب ويندوز 11 التعليمي",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Warning,
                        MessageBoxDefaultButton.Button1,
                        MessageBoxOptions.RtlReading | MessageBoxOptions.RightAlign
                    );
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "حدث خطأ أثناء تشغيل المحاكي: " + ex.Message,
                    "خطأ",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error,
                    MessageBoxDefaultButton.Button1,
                    MessageBoxOptions.RtlReading | MessageBoxOptions.RightAlign
                );
            }
        }
    }
}
