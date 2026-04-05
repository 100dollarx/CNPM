using ETMS.BUS;
using ETMS.DAL;

namespace ETMS.Api.Handlers;

public static class UserHandler
{
    public static IResult GetUsers(string? role, string? search)
    {
        var dal  = new UserDAL();
        var list = dal.GetAll(role, search);
        return Results.Ok(new { data = list, total = list.Count });
    }

    public static IResult CreateUser(CreateUserRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.FullName))
            return Results.BadRequest(new { error = "Username và FullName không được trống." });
        if (!new[] { "Admin", "Captain", "Player" }.Contains(req.Role))
            return Results.BadRequest(new { error = "Role không hợp lệ." });

        string hash = AuthBUS.HashPassword("admin");
        var dal     = new UserDAL();
        int userId  = dal.InsertUser(req.Username.Trim(), hash, req.FullName, req.Role, req.Email);
        return Results.Created($"/api/users/{userId}", new { userId, username = req.Username, role = req.Role, message = "Tài khoản đã tạo. Mật khẩu mặc định: admin" });
    }

    public static IResult ToggleLock(int id, LockRequest req)
    {
        var dal = new UserDAL();
        dal.SetLockStatus(id, req.IsLocked);
        return Results.Ok(new { userId = id, isLocked = req.IsLocked, message = req.IsLocked ? "Tài khoản đã bị khóa." : "Tài khoản đã được mở khóa." });
    }

    public static IResult ResetPassword(int id)
    {
        string newHash = AuthBUS.HashPassword("admin");
        var dal = new UserDAL();
        dal.UpdatePassword(id, newHash);
        return Results.Ok(new { userId = id, message = "Mật khẩu đã được reset về 'admin'." });
    }

    /// <summary>
    /// Gửi lại email kích hoạt cho user chưa activated.
    /// Admin only — tạo token mới, cập nhật DB, gửi email.
    /// </summary>
    public static async Task<IResult> ResendActivation(int id)
    {
        var dal  = new UserDAL();
        var list = dal.GetAll();
        var user = list.FirstOrDefault(u => u.UserID == id);

        if (user == null)
            return Results.NotFound(new { error = "Không tìm thấy người dùng." });

        if (user.IsActivated)
            return Results.BadRequest(new { error = $"Tài khoản '{user.Username}' đã được kích hoạt rồi." });

        if (string.IsNullOrWhiteSpace(user.Email))
            return Results.BadRequest(new { error = $"Tài khoản '{user.Username}' không có email để gửi." });

        // Tạo token mới
        var tokenBytes = System.Security.Cryptography.RandomNumberGenerator.GetBytes(32);
        var token      = Convert.ToHexString(tokenBytes).ToLower();
        var expires    = DateTime.Now.AddHours(ETMS.Services.EmailService.TokenHours);

        // Cập nhật token trong DB
        dal.SetActivationToken(user.UserID, token, expires);

        // Gửi email
        var sent = await ETMS.Services.EmailService.SendActivationAsync(
            toEmail:  user.Email,
            toName:   user.FullName,
            token:    token,
            baseUrl:  ETMS.Services.EmailService.BaseUrl
        );

        if (!sent)
            return Results.Json(new { error = "Không gửi được email. Kiểm tra cấu hình SMTP." }, statusCode: 500);

        return Results.Ok(new
        {
            message   = $"Đã gửi lại email kích hoạt đến {user.Email} cho tài khoản '{user.Username}'.",
            userId    = id,
            emailSent = true
        });
    }

    // ── Forgot Password — gửi email reset mật khẩu ───────────────────────
    public static async Task<IResult> ForgotPassword(ForgotPasswordRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email))
            return Results.BadRequest(new { error = "Email không được trống." });

        var dal  = new UserDAL();
        var list = dal.GetAll();
        var user = list.FirstOrDefault(u =>
            !string.IsNullOrEmpty(u.Email) &&
            u.Email.Equals(req.Email.Trim(), StringComparison.OrdinalIgnoreCase));

        // Luôn trả thành công để không leak thông tin email nào tồn tại
        if (user == null || !user.IsActivated)
            return Results.Ok(new { message = "Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hộp thư của bạn." });

        // Tạo reset token (1 giờ)
        var tokenBytes = System.Security.Cryptography.RandomNumberGenerator.GetBytes(32);
        var token      = Convert.ToHexString(tokenBytes).ToLower();
        var expires    = DateTime.Now.AddHours(1);

        dal.SetResetToken(user.UserID, token, expires);

        var sent = await ETMS.Services.EmailService.SendResetPasswordAsync(
            toEmail: user.Email!,
            toName:  user.FullName,
            token:   token,
            baseUrl: ETMS.Services.EmailService.BaseUrl
        );

        Console.WriteLine($"[ForgotPwd] Email={req.Email.Trim()}, UserID={user.UserID}, Sent={sent}");

        return Results.Ok(new { message = "Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hộp thư của bạn." });
    }

    // ── Reset Password by Token ────────────────────────────────────────────
    public static IResult ResetPasswordByToken(ResetPasswordByTokenRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Token) || string.IsNullOrWhiteSpace(req.NewPassword))
            return Results.BadRequest(new { error = "Token và mật khẩu mới không được trống." });

        if (req.NewPassword.Length < 6)
            return Results.BadRequest(new { error = "Mật khẩu phải có ít nhất 6 ký tự." });

        var dal = new UserDAL();
        var (user, expires, _) = dal.FindByToken(req.Token.Trim());

        if (user == null)
            return Results.BadRequest(new { error = "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." });

        if (expires.HasValue && expires.Value < DateTime.Now)
            return Results.BadRequest(new { error = $"Link đã hết hạn. (Hạn: {expires.Value:dd/MM/yyyy HH:mm})" });

        // Đổi mật khẩu + xóa reset token
        string newHash = AuthBUS.HashPassword(req.NewPassword);
        dal.UpdatePassword(user.UserID, newHash);
        dal.SetResetToken(user.UserID, "", DateTime.Now); // Xóa token bằng empty string

        Console.WriteLine($"[ResetPwd] UserID={user.UserID}, Username={user.Username} — MK đã đổi qua email.");

        return Results.Ok(new { message = $"Mật khẩu tài khoản '{user.Username}' đã được đặt lại thành công! Bạn có thể đăng nhập ngay." });
    }

    // ── Admin Delete User ──────────────────────────────────────────────────
    public static IResult DeleteUser(int id, HttpContext ctx)
    {
        if (!AuthBUS.SetCurrentUserFromToken(ctx.Request.Headers.Authorization))
            return Results.Unauthorized();
        if (ETMS.BUS.Session.CurrentUser?.Role != "Admin")
            return Results.Forbid();

        // Không cho admin xóa chính mình
        if (ETMS.BUS.Session.CurrentUser.UserID == id)
            return Results.BadRequest(new { error = "Không thể xóa tài khoản của chính bạn." });

        var dal = new UserDAL();
        var user = dal.GetByID(id);
        if (user == null)
            return Results.NotFound(new { error = "Không tìm thấy người dùng." });

        dal.DeleteUser(id);
        Console.WriteLine($"[DeleteUser] Admin {ETMS.BUS.Session.CurrentUser.Username} đã xóa UserID={id} ({user.Username}).");

        return Results.Ok(new { message = $"Đã xóa tài khoản '{user.Username}' khỏi hệ thống." });
    }

    // ── User Self-Delete ───────────────────────────────────────────────────
    public static IResult SelfDelete(SelfDeleteRequest req, HttpContext ctx)
    {
        if (!AuthBUS.SetCurrentUserFromToken(ctx.Request.Headers.Authorization))
            return Results.Unauthorized();

        var currentUser = ETMS.BUS.Session.CurrentUser!;
        var dal = new UserDAL();
        var (dbUser, passwordHash) = dal.GetByUsername(currentUser.Username);

        if (dbUser == null)
            return Results.NotFound(new { error = "Không tìm thấy tài khoản." });

        // Xác nhận mật khẩu
        if (!AuthBUS.VerifyPassword(req.Password, passwordHash))
            return Results.BadRequest(new { error = "Mật khẩu xác nhận không đúng." });

        dal.DeleteUser(dbUser.UserID);
        Console.WriteLine($"[SelfDelete] User {dbUser.Username} (ID={dbUser.UserID}) tự xóa tài khoản.");

        return Results.Ok(new { message = "Tài khoản của bạn đã được xóa vĩnh viễn." });
    }

    // ── Get Profile ────────────────────────────────────────────────────────
    public static IResult GetProfile(HttpContext ctx)
    {
        if (!AuthBUS.SetCurrentUserFromToken(ctx.Request.Headers.Authorization))
            return Results.Unauthorized();
        var user = ETMS.BUS.Session.CurrentUser!;
        return Results.Ok(new
        {
            user.UserID, user.Username, user.FullName, user.Email, user.Phone,
            user.Role, user.IsLocked, user.IsActivated
        });
    }

    // ── Update Profile ─────────────────────────────────────────────────────
    public static IResult UpdateProfile(UpdateProfileRequest req, HttpContext ctx)
    {
        if (!AuthBUS.SetCurrentUserFromToken(ctx.Request.Headers.Authorization))
            return Results.Unauthorized();

        var current = ETMS.BUS.Session.CurrentUser!;
        if (string.IsNullOrWhiteSpace(req.FullName))
            return Results.BadRequest(new { error = "Họ tên không được trống." });

        // Validate phone
        if (!string.IsNullOrEmpty(req.Phone) && !System.Text.RegularExpressions.Regex.IsMatch(req.Phone.Trim(), @"^[0-9+\-\s]{7,20}$"))
            return Results.BadRequest(new { error = "Số điện thoại không hợp lệ." });

        // Validate email format
        if (!string.IsNullOrEmpty(req.Email) && !req.Email.Contains('@'))
            return Results.BadRequest(new { error = "Email không hợp lệ." });

        var dal = new UserDAL();
        dal.UpdateProfile(current.UserID, req.FullName.Trim(), req.Email?.Trim(), req.Phone?.Trim());

        return Results.Ok(new { message = "Cập nhật thông tin thành công." });
    }
}

public static class AuditHandler
{
    public static IResult GetLog(int page = 1, int pageSize = 50, string? action = null, int? userId = null)
    {
        if (page < 1) page = 1;
        if (pageSize is < 1 or > 200) pageSize = 50;

        var dal = new ETMS.DAL.AuditLogDAL();
        var (records, total) = dal.GetLog(page, pageSize, action, userId);

        return Results.Ok(new
        {
            data     = records,
            total,
            page,
            pageSize,
            pages    = (int)Math.Ceiling((double)total / pageSize)
        });
    }
}

public record CreateUserRequest(string Username, string FullName, string Role, string? Email);
public record LockRequest(bool IsLocked);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordByTokenRequest(string Token, string NewPassword);
public record SelfDeleteRequest(string Password);
public record UpdateProfileRequest(string FullName, string? Email, string? Phone);
