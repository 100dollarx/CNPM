using ETMS.DAL;

namespace ETMS.Api.Handlers;

public static class NotificationHandler
{
    public static IResult GetAll(int userId)
    {
        if (userId <= 0)
            return Results.BadRequest(new { error = "userId không hợp lệ." });

        var dal   = new NotificationDAL();
        var list  = dal.GetByUser(userId);
        var unread = dal.UnreadCount(userId);

        return Results.Ok(new
        {
            data         = list,
            total        = list.Count,
            unreadCount  = unread,
            userId
        });
    }

    public static IResult MarkRead(int id)
    {
        new NotificationDAL().MarkRead(id);
        return Results.Ok(new { notificationId = id, status = "read" });
    }

    public static IResult MarkAllRead(int userId)
    {
        if (userId <= 0)
            return Results.BadRequest(new { error = "userId không hợp lệ." });

        new NotificationDAL().MarkAllRead(userId);
        return Results.Ok(new { userId, message = "Tất cả thông báo đã được đánh dấu đọc." });
    }
}
