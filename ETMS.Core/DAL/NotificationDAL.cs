using Microsoft.Data.SqlClient;

namespace ETMS.DAL
{
    public class NotificationDAL
    {
        public List<NotificationRecord> GetByUser(int userId)
        {
            var list = new List<NotificationRecord>();
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT NotificationID, RecipientID, Title, Message, Type,
                       RelatedEntity, RelatedEntityID, IsRead, CreatedAt
                FROM tblNotification
                WHERE RecipientID = @uid
                ORDER BY CreatedAt DESC";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@uid", userId);
            using var dr = cmd.ExecuteReader();
            while (dr.Read())
                list.Add(new NotificationRecord
                {
                    NotificationID   = dr.GetInt32(0),
                    RecipientID      = dr.GetInt32(1),
                    Title            = dr.IsDBNull(2)  ? null : dr.GetString(2),
                    Message          = dr.GetString(3),
                    Type             = dr.IsDBNull(4)  ? "system" : dr.GetString(4),
                    RelatedEntity    = dr.IsDBNull(5)  ? null : dr.GetString(5),
                    RelatedEntityID  = dr.IsDBNull(6)  ? null : dr.GetInt32(6),
                    IsRead           = dr.GetBoolean(7),
                    CreatedAt        = dr.GetDateTime(8),
                });
            return list;
        }

        public int UnreadCount(int userId)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = "SELECT COUNT(*) FROM tblNotification WHERE RecipientID=@uid AND IsRead=0";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@uid", userId);
            return (int)cmd.ExecuteScalar()!;
        }

        public void MarkRead(int notificationId)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = "UPDATE tblNotification SET IsRead=1 WHERE NotificationID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", notificationId);
            cmd.ExecuteNonQuery();
        }

        public void MarkAllRead(int userId)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = "UPDATE tblNotification SET IsRead=1 WHERE RecipientID=@uid AND IsRead=0";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@uid", userId);
            cmd.ExecuteNonQuery();
        }

        public void Insert(int recipientId, string title, string message, string type = "system",
                           string? relatedEntity = null, int? relatedEntityId = null)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                INSERT INTO tblNotification (RecipientID, Title, Message, Type, RelatedEntity, RelatedEntityID)
                VALUES (@rid, @t, @m, @type, @re, @reid)";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@rid",  recipientId);
            cmd.Parameters.AddWithValue("@t",    title);
            cmd.Parameters.AddWithValue("@m",    message);
            cmd.Parameters.AddWithValue("@type", type);
            cmd.Parameters.AddWithValue("@re",   (object?)relatedEntity   ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@reid", (object?)relatedEntityId ?? DBNull.Value);
            cmd.ExecuteNonQuery();
        }
    }

    public class NotificationRecord
    {
        public int      NotificationID  { get; set; }
        public int      RecipientID     { get; set; }
        public string?  Title           { get; set; }
        public string   Message         { get; set; } = "";
        public string   Type            { get; set; } = "system";
        public string?  RelatedEntity   { get; set; }
        public int?     RelatedEntityID { get; set; }
        public bool     IsRead          { get; set; }
        public DateTime CreatedAt       { get; set; }
    }
}
