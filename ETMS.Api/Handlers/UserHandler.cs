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
