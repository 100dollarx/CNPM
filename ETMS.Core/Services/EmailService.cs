using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace ETMS.Services
{
    /// <summary>
    /// Gửi email tự động qua Gmail SMTP (MailKit 4.x).
    /// Cấu hình được inject từ appsettings.json → EmailSettings.
    /// </summary>
    public class EmailService
    {
        // ── Cấu hình SMTP — set từ Program.cs ─────────────────────────────
        public static string SmtpHost     { get; set; } = "smtp.gmail.com";
        public static int    SmtpPort     { get; set; } = 587;
        public static string Username     { get; set; } = "";
        public static string Password     { get; set; } = "";     // Gmail App Password
        public static string FromEmail    { get; set; } = "";
        public static string FromName     { get; set; } = "Nexora";
        public static int    TokenHours   { get; set; } = 24;     // Thời hạn token kích hoạt
        public static string BaseUrl      { get; set; } = "http://localhost:5173"; // Frontend URL

        // ── Gửi email kích hoạt tài khoản ─────────────────────────────────
        /// <summary>
        /// Gửi email HTML chứa link kích hoạt tài khoản.
        /// Thực hiện bất đồng bộ (async) để không chặn luồng API.
        /// </summary>
        public static async Task<bool> SendActivationAsync(
            string toEmail, string toName, string token, string baseUrl)
        {
            var activationUrl = $"{baseUrl.TrimEnd('/')}/activate?token={Uri.EscapeDataString(token)}";
            var subject       = "[Nexora ETMS] Kích hoạt tài khoản của bạn";
            var body          = BuildActivationHtml(toName, activationUrl);
            return await SendAsync(toEmail, toName, subject, body);
        }

        /// <summary>Gửi email reset mật khẩu — chứa link đặt lại mật khẩu mới.</summary>
        public static async Task<bool> SendResetPasswordAsync(
            string toEmail, string toName, string token, string baseUrl)
        {
            var resetUrl = $"{baseUrl.TrimEnd('/')}/reset-password?token={Uri.EscapeDataString(token)}";
            var subject  = "[Nexora ETMS] Đặt lại mật khẩu của bạn";
            var body     = BuildResetPasswordHtml(toName, resetUrl);
            return await SendAsync(toEmail, toName, subject, body);
        }

        // ── Core sender ────────────────────────────────────────────────────
        private static async Task<bool> SendAsync(
            string toEmail, string toName, string subject, string htmlBody)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(FromName, FromEmail));
                message.To.Add(new MailboxAddress(toName, toEmail));
                message.Subject = subject;

                var builder = new BodyBuilder
                {
                    HtmlBody  = htmlBody,
                    TextBody  = StripHtml(htmlBody)   // Fallback plain-text
                };
                message.Body = builder.ToMessageBody();

                using var smtp = new SmtpClient();
                // TLS STARTTLS trên port 587 — chuẩn Gmail
                await smtp.ConnectAsync(SmtpHost, SmtpPort, SecureSocketOptions.StartTls);
                await smtp.AuthenticateAsync(Username, Password);
                await smtp.SendAsync(message);
                await smtp.DisconnectAsync(true);
                return true;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[EmailService] Lỗi gửi email tới {toEmail}: {ex.Message}");
                return false;
            }
        }

        // ── HTML Template — email kích hoạt ───────────────────────────────
        private static string BuildActivationHtml(string name, string url)
        {
            string safeName = System.Web.HttpUtility.HtmlEncode(name);
            return $@"<!DOCTYPE html>
<html lang=""vi"">
<head><meta charset=""UTF-8""><title>Kích hoạt tài khoản Nexora ETMS</title></head>
<body style=""margin:0;padding:0;background:#0d1117;font-family:'Segoe UI',Arial,sans-serif;"">
  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background:#0d1117;padding:40px 0;"">
    <tr><td align=""center"">
      <table width=""580"" cellpadding=""0"" cellspacing=""0""
             style=""background:#161b22;border-radius:16px;overflow:hidden;
                    border:1px solid #30363d;box-shadow:0 8px 32px rgba(0,0,0,0.4);"">

        <!-- Header -->
        <tr>
          <td style=""background:linear-gradient(135deg,#FF5C78 0%,#E94560 50%,#7C3AED 100%);
                      padding:36px 40px;text-align:center;"">
            <h1 style=""color:#fff;margin:0;font-size:26px;font-weight:800;
                        letter-spacing:2px;font-family:'Rajdhani',sans-serif;"">
              ⚡ NEXORA ETMS
            </h1>
            <p style=""color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:13px;"">
              Esports Tournament Management System
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style=""padding:40px;"">
            <h2 style=""color:#e2e8f0;margin:0 0 16px;font-size:20px;"">
              Xin chào, <strong style=""color:#FF7F96;"">{safeName}</strong>!
            </h2>
            <p style=""color:#8b949e;line-height:1.7;margin:0 0 24px;font-size:14px;"">
              Tài khoản <strong style=""color:#e2e8f0;"">Nexora ETMS</strong> của bạn đã được tạo.<br>
              Nhấn nút bên dưới để kích hoạt tài khoản và bắt đầu sử dụng hệ thống:
            </p>

            <!-- CTA Button -->
            <div style=""text-align:center;margin:32px 0;"">
              <a href=""{url}""
                 style=""display:inline-block;
                        background:linear-gradient(135deg,#E94560,#7C3AED);
                        color:#fff;text-decoration:none;
                        padding:16px 44px;border-radius:10px;
                        font-size:15px;font-weight:700;letter-spacing:0.5px;"">
                ✅ Kích Hoạt Tài Khoản
              </a>
            </div>

            <!-- Warning box -->
            <div style=""background:#1c2128;border-left:4px solid #f59e0b;
                         border-radius:8px;padding:14px 18px;margin:20px 0;"">
              <p style=""margin:0;color:#d97706;font-size:13px;"">
                ⚠️ <strong>Lưu ý:</strong> Link kích hoạt chỉ có hiệu lực trong
                <strong>{TokenHours} giờ</strong>.
                Sau khi hết hạn, vui lòng liên hệ Admin để được cấp lại.
              </p>
            </div>

            <!-- Link backup -->
            <p style=""color:#484f58;font-size:12px;margin-top:24px;word-break:break-all;"">
              Nếu nút không hoạt động, copy link sau vào trình duyệt:<br>
              <span style=""color:#58a6ff;"">{url}</span>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style=""background:#0d1117;padding:20px 40px;
                      border-top:1px solid #30363d;text-align:center;"">
            <p style=""margin:0;color:#484f58;font-size:11px;"">
              Email tự động từ Nexora ETMS. Vui lòng không trả lời email này.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>";
        }

        private static string BuildResetPasswordHtml(string name, string url)
        {
            string safeName = System.Web.HttpUtility.HtmlEncode(name);
            return $@"<!DOCTYPE html>
<html lang=""vi"">
<head><meta charset=""UTF-8""><title>Đặt lại mật khẩu Nexora ETMS</title></head>
<body style=""margin:0;padding:0;background:#0d1117;font-family:'Segoe UI',Arial,sans-serif;"">
  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background:#0d1117;padding:40px 0;"">
    <tr><td align=""center"">
      <table width=""580"" cellpadding=""0"" cellspacing=""0""
             style=""background:#161b22;border-radius:16px;overflow:hidden;
                    border:1px solid #30363d;box-shadow:0 8px 32px rgba(0,0,0,0.4);"">
        <tr>
          <td style=""background:linear-gradient(135deg,#F59E0B 0%,#EF4444 50%,#7C3AED 100%);
                      padding:36px 40px;text-align:center;"">
            <h1 style=""color:#fff;margin:0;font-size:26px;font-weight:800;
                        letter-spacing:2px;font-family:'Rajdhani',sans-serif;"">
              🔑 NEXORA ETMS
            </h1>
            <p style=""color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:13px;"">
              Đặt Lại Mật Khẩu
            </p>
          </td>
        </tr>
        <tr>
          <td style=""padding:40px;"">
            <h2 style=""color:#e2e8f0;margin:0 0 16px;font-size:20px;"">
              Xin chào, <strong style=""color:#F59E0B;"">{safeName}</strong>!
            </h2>
            <p style=""color:#8b949e;line-height:1.7;margin:0 0 24px;font-size:14px;"">
              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.<br>
              Nhấn nút bên dưới để tạo mật khẩu mới:
            </p>
            <div style=""text-align:center;margin:32px 0;"">
              <a href=""{url}""
                 style=""display:inline-block;
                        background:linear-gradient(135deg,#F59E0B,#EF4444);
                        color:#fff;text-decoration:none;
                        padding:16px 44px;border-radius:10px;
                        font-size:15px;font-weight:700;letter-spacing:0.5px;"">
                🔑 Đặt Lại Mật Khẩu
              </a>
            </div>
            <div style=""background:#1c2128;border-left:4px solid #EF4444;
                         border-radius:8px;padding:14px 18px;margin:20px 0;"">
              <p style=""margin:0;color:#EF4444;font-size:13px;"">
                ⚠️ <strong>Lưu ý:</strong> Link chỉ có hiệu lực trong
                <strong>1 giờ</strong>.
                Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
              </p>
            </div>
            <p style=""color:#484f58;font-size:12px;margin-top:24px;word-break:break-all;"">
              Nếu nút không hoạt động, copy link sau vào trình duyệt:<br>
              <span style=""color:#58a6ff;"">{url}</span>
            </p>
          </td>
        </tr>
        <tr>
          <td style=""background:#0d1117;padding:20px 40px;
                      border-top:1px solid #30363d;text-align:center;"">
            <p style=""margin:0;color:#484f58;font-size:11px;"">
              Email tự động từ Nexora ETMS. Vui lòng không trả lời email này.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";
        }

        private static string StripHtml(string html) =>
            System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", " ").Trim();
    }
}
