using ETMS.DAL;

namespace ETMS.Api.Handlers;

public static class NotificationHandler
{
    public static IResult GetAll(int userId)
    {
        // Placeholder — NotificationDAL sẽ hoàn thiện ở Sprint 2
        return Results.Ok(new { data = Array.Empty<object>(), userId, total = 0 });
    }

    public static IResult MarkRead(int id)
        => Results.Ok(new { notificationId = id, status = "read" });

    public static IResult MarkAllRead(int userId)
        => Results.Ok(new { userId, message = "Tất cả thông báo đã được đánh dấu đọc." });
}
