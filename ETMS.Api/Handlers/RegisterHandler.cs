using ETMS.BUS;
using ETMS.DAL;
using ETMS.Services;
using System.Security.Cryptography;

namespace ETMS.Api.Handlers
{
    /// <summary>
    /// RegisterHandler — xử lý đăng ký tài khoản mới và kích hoạt qua email.
    ///
    /// Logic đăng ký (POST /api/auth/register):
    ///   1. Validate input (username ≥3, password ≥6, email hợp lệ)
    ///   2. Kiểm tra username đã tồn tại và đã kích hoạt  → báo lỗi
    ///   3. Kiểm tra email đã tồn tại và đã kích hoạt     → báo lỗi
    ///   4. Nếu username/email tồn tại nhưng CHƯA kích hoạt → xóa record cũ, tạo lại mới
    ///   5. Tạo token, lưu DB, gửi email
    ///
    /// GET /api/auth/activate?token=xxx — kích hoạt tài khoản
    /// </summary>
    public static class RegisterHandler
    {
        // ── POST /api/auth/register ───────────────────────────────────────────────
        public static async Task<IResult> Register(RegisterRequest req)
        {
            // ── 1. Validate input ────────────────────────────────────────────────
            if (string.IsNullOrWhiteSpace(req.Username) || req.Username.Length < 3)
                return Results.BadRequest(new { error = "Tên đăng nhập phải có ít nhất 3 ký tự." });

            if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 6)
                return Results.BadRequest(new { error = "Mật khẩu phải có ít nhất 6 ký tự." });

            if (string.IsNullOrWhiteSpace(req.FullName))
                return Results.BadRequest(new { error = "Họ tên không được để trống." });

            if (string.IsNullOrWhiteSpace(req.Email) || !req.Email.Contains('@') || !req.Email.Contains('.'))
                return Results.BadRequest(new { error = "Địa chỉ email không hợp lệ." });

            var role     = req.Role?.Trim() is "Captain" or "Player" or "Guest" ? req.Role.Trim() : "Player";
            var usernameClean = req.Username.Trim();
            var emailClean    = req.Email.Trim().ToLower();

            var dal = new UserDAL();

            // ── 2. Kiểm tra username ─────────────────────────────────────────────
            var (existingByUsername, _) = dal.GetByUsername(usernameClean);
            if (existingByUsername != null)
            {
                if (existingByUsername.IsActivated)
                    // Đã kích hoạt → không cho dùng lại
                    return Results.Conflict(new { error = "Tên đăng nhập đã tồn tại." });
                else
                    // Chưa kích hoạt → xóa, cho phép đăng ký lại
                    dal.DeleteUnactivated(existingByUsername.UserID);
            }

            // ── 3. Kiểm tra email ────────────────────────────────────────────────
            var existingByEmail = dal.GetByEmail(emailClean);
            if (existingByEmail != null)
            {
                if (existingByEmail.IsActivated)
                    // Email đã được dùng bởi tài khoản đã kích hoạt → lỗi
                    return Results.Conflict(new
                    {
                        error = $"Email '{req.Email.Trim()}' đã được sử dụng bởi một tài khoản khác."
                    });
                else
                    // Email chưa kích hoạt → xóa record cũ, cho phép đăng ký lại
                    dal.DeleteUnactivated(existingByEmail.UserID);
            }

            // ── 4. Tạo activation token (64-char hex, CSPRNG) ────────────────────
            var tokenBytes = RandomNumberGenerator.GetBytes(32);
            var token      = Convert.ToHexString(tokenBytes).ToLower();
            // Dùng DateTime.Now (local time) để khớp với SQL Server GETDATE()
            var expires    = DateTime.Now.AddHours(EmailService.TokenHours);

            // ── 5. Hash password + lưu vào DB (IsActivated=0) ───────────────────
            var hash   = BCrypt.Net.BCrypt.HashPassword(req.Password.Trim(), 12);
            var userID = dal.InsertUser(
                username:          usernameClean,
                passwordHash:      hash,
                fullName:          req.FullName.Trim(),
                role:              role,
                email:             req.Email.Trim(),
                activationToken:   token,
                activationExpires: expires
            );

            if (userID <= 0)
                return Results.Json(new { error = "Lỗi hệ thống khi tạo tài khoản. Vui lòng thử lại." }, statusCode: 500);

            // ── 6. Gửi email kích hoạt ───────────────────────────────────────────
            var emailSent = await EmailService.SendActivationAsync(
                toEmail:  req.Email.Trim(),
                toName:   req.FullName.Trim(),
                token:    token,
                baseUrl:  EmailService.BaseUrl
            );

            if (!emailSent)
            {
                Console.Error.WriteLine($"[RegisterHandler] Gửi email thất bại cho {req.Email}");
                return Results.Ok(new
                {
                    message   = "Tài khoản đã được tạo nhưng không gửi được email kích hoạt. Liên hệ Admin.",
                    userId    = userID,
                    emailSent = false
                });
            }

            return Results.Created("/api/auth/register", new
            {
                message   = $"Đăng ký thành công! Email kích hoạt đã được gửi đến {req.Email.Trim()}. Kiểm tra hộp thư (kể cả Spam) và nhấn link kích hoạt trong {EmailService.TokenHours} giờ.",
                userId    = userID,
                emailSent = true
            });
        }

        // ── GET /api/auth/activate?token=xxx ─────────────────────────────────────
        public static IResult Activate(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return Results.BadRequest(new { error = "Token kích hoạt không hợp lệ." });

            var dal = new UserDAL();
            var (user, expires, isActivated) = dal.FindByToken(token.Trim());

            // Log chi tiết để debug
            Console.WriteLine($"[Activate] Token={token[..Math.Min(12, token.Length)]}... " +
                              $"Found={user != null}, Expires={expires:yyyy-MM-dd HH:mm:ss}, " +
                              $"IsActivated={isActivated}, Now={DateTime.Now:yyyy-MM-dd HH:mm:ss}");

            if (user == null)
                return Results.BadRequest(new
                {
                    error = "Link kích hoạt không hợp lệ. Token không tồn tại.",
                    hint  = "Có thể bạn đã đăng ký lại và token cũ đã bị thay thế."
                });

            if (isActivated)
                return Results.Ok(new
                {
                    message  = $"Tài khoản '{user.Username}' đã được kích hoạt trước đó! Bạn có thể đăng nhập ngay.",
                    username = user.Username,
                    fullName = user.FullName
                });

            if (expires.HasValue && expires.Value < DateTime.Now)
                return Results.BadRequest(new
                {
                    error = $"Link kích hoạt đã hết hạn. (Hạn: {expires.Value:dd/MM/yyyy HH:mm}, Hiện tại: {DateTime.Now:dd/MM/yyyy HH:mm})",
                    hint  = "Hãy đăng ký lại để nhận link kích hoạt mới."
                });

            // Kích hoạt thành công
            dal.ActivateUser(user.UserID);

            return Results.Ok(new
            {
                message  = $"Tài khoản '{user.Username}' đã được kích hoạt thành công! Bạn có thể đăng nhập ngay.",
                username = user.Username,
                fullName = user.FullName
            });
        }
    }

    // ── Request DTO ────────────────────────────────────────────────────────────────
    public record RegisterRequest(
        string  Username,
        string  Password,
        string  FullName,
        string  Email,
        string? Role   // Optional: Captain | Player | Guest (default: Player)
    );
}
