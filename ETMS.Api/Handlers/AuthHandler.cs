using ETMS.BUS;
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
        {
            // Tài khoản bị khóa hay sai mật khẩu đều trả 401 (không tiết lộ field nào sai - NFR-1)
            return Results.Json(new { error = message }, statusCode: 401);
        }

        var user = Session.CurrentUser!;
        // TODO: Thay bằng JWT thật khi tích hợp Microsoft.AspNetCore.Authentication.JwtBearer
        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());

        return Results.Ok(new
        {
            token,
            user = new
            {
                user.UserID,
                user.Username,
                user.FullName,
                user.Role
            }
        });
    }

    public static IResult Logout()
    {
        Session.Logout();
        return Results.Ok(new { message = "Đã đăng xuất." });
    }
}

public record LoginRequest(string Username, string Password);
