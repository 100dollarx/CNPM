using ETMS.BUS;
using ETMS.DAL;
using ETMS.DTO;

namespace ETMS.Api.Handlers;

public static class AuthHandler
{
    public static IResult Login(LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            return Results.BadRequest(new { error = "Username và Password không được để trống." });

        var bus = new AuthBUS();
        var (success, message) = bus.Login(req.Username, req.Password);

        if (!success)
            return Results.Json(new { error = message }, statusCode: 401);

        // Kiểm tra tài khoản đã kích hoạt chưa (email activation)
        var dal = new UserDAL();
        if (!dal.IsActivated(req.Username))
            return Results.Json(new
            {
                error = "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để nhấn link kích hoạt.",
                hint  = "Kiểm tra cả hộp thư Spam/Junk. Nếu hết hạn, liên hệ Admin."
            }, statusCode: 403);

        var user  = Session.CurrentUser!;
        var token = Session.BuildToken(user.UserID, user.Role);

        return Results.Ok(new
        {
            token,
            user = new { user.UserID, user.Username, user.FullName, user.Role }
        });
    }

    public static IResult Logout()
    {
        Session.Logout();
        return Results.Ok(new { message = "Đã đăng xuất." });
    }

    public static IResult ChangePassword(HttpContext ctx, ChangePasswordRequest req)
    {
        // Parse token để xác định userID của người đang gọi
        var authHeader = ctx.Request.Headers.Authorization.ToString();
        var parsed = Session.ParseToken(
            authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? authHeader[7..] : authHeader);

        if (parsed == null)
            return Results.Json(new { error = "Yêu cầu đăng nhập." }, statusCode: 401);

        if (string.IsNullOrWhiteSpace(req.OldPassword) || string.IsNullOrWhiteSpace(req.NewPassword))
            return Results.BadRequest(new { error = "Vui lòng nhập đầy đủ mật khẩu cũ và mới." });

        var (ok, error) = new AuthBUS().ChangePassword(parsed.Value.userID, req.OldPassword, req.NewPassword);
        return ok ? Results.Ok(new { message = error })
                  : Results.BadRequest(new { error });
    }
}

public record LoginRequest(string Username, string Password);
public record ChangePasswordRequest(string OldPassword, string NewPassword);
