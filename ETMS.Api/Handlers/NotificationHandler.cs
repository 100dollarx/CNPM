using ETMS.DAL;

namespace ETMS.Api.Handlers;

public static class NotificationHandler
{
    // Dùng string? để tránh crash khi frontend gửi userId=undefined (chuỗi, không parse được thành int)
    public static IResult GetAll(string? rawUserId = null)
    {
        if (!int.TryParse(rawUserId, out int userId) || userId <= 0)
            return Results.Ok(new { data = Array.Empty<object>(), total = 0, unreadCount = 0 });

        var dal   = new NotificationDAL();
        var list  = dal.GetByUser(userId);
        var unread = dal.UnreadCount(userId);

        return Results.Ok(new
        {
            data        = list,
            total       = list.Count,
            unreadCount = unread,
            userId
        });
    }

    public static IResult MarkRead(int id)
    {
        new NotificationDAL().MarkRead(id);
        return Results.Ok(new { notificationId = id, status = "read" });
    }

    public static IResult MarkAllRead(string? rawUserId = null)
    {
        if (!int.TryParse(rawUserId, out int userId) || userId <= 0)
            return Results.BadRequest(new { error = "userId không hợp lệ." });

        new NotificationDAL().MarkAllRead(userId);
        return Results.Ok(new { userId, message = "Tất cả thông báo đã được đánh dấu đọc." });
    }
}
