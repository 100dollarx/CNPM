using Microsoft.Data.SqlClient;

namespace ETMS.DAL
{
    public class AuditLogDAL
    {
        /// <summary>
        /// Lấy audit log với phân trang, lọc theo action hoặc userId.
        /// </summary>
        public (List<AuditLogRecord> records, int total) GetLog(
            int page = 1, int pageSize = 50,
            string? action = null, int? userId = null)
        {
            var list = new List<AuditLogRecord>();
            using var conn = DBConnection.GetConnection();
            conn.Open();

            string where = "WHERE 1=1";
            if (!string.IsNullOrWhiteSpace(action))
                where += " AND a.Action LIKE @action";
            if (userId.HasValue)
                where += " AND a.UserID = @uid";

            string countSql = $@"
                SELECT COUNT(*)
                FROM tblAuditLog a
                {where}";

            string dataSql = $@"
                SELECT a.LogID, a.UserID, u.Username, a.Action, a.Detail,
                       a.AffectedEntity, a.AffectedEntityID, a.IPAddress, a.Result, a.Timestamp
                FROM tblAuditLog a
                LEFT JOIN tblUser u ON u.UserID = a.UserID
                {where}
                ORDER BY a.Timestamp DESC
                OFFSET @skip ROWS FETCH NEXT @take ROWS ONLY";

            using (var cmd = new SqlCommand(countSql, conn))
            {
                if (!string.IsNullOrWhiteSpace(action))
                    cmd.Parameters.AddWithValue("@action", $"%{action}%");
                if (userId.HasValue)
                    cmd.Parameters.AddWithValue("@uid", userId.Value);
                var total = (int)cmd.ExecuteScalar()!;

                using var cmd2 = new SqlCommand(dataSql, conn);
                if (!string.IsNullOrWhiteSpace(action))
                    cmd2.Parameters.AddWithValue("@action", $"%{action}%");
                if (userId.HasValue)
                    cmd2.Parameters.AddWithValue("@uid", userId.Value);
                cmd2.Parameters.AddWithValue("@skip", (page - 1) * pageSize);
                cmd2.Parameters.AddWithValue("@take", pageSize);

                using var dr = cmd2.ExecuteReader();
                while (dr.Read())
                    list.Add(new AuditLogRecord
                    {
                        LogID            = dr.GetInt32(0),
                        UserID           = dr.IsDBNull(1) ? null : dr.GetInt32(1),
                        Username         = dr.IsDBNull(2) ? "system" : dr.GetString(2),
                        Action           = dr.GetString(3),
                        Detail           = dr.IsDBNull(4) ? null : dr.GetString(4),
                        AffectedEntity   = dr.IsDBNull(5) ? null : dr.GetString(5),
                        AffectedEntityID = dr.IsDBNull(6) ? null : dr.GetInt32(6),
                        IPAddress        = dr.IsDBNull(7) ? null : dr.GetString(7),
                        Result           = dr.IsDBNull(8) ? "Success" : dr.GetString(8),
                        Timestamp        = dr.GetDateTime(9),
                    });

                return (list, total);
            }
        }

        /// <summary>
        /// Ghi một bản ghi audit log mới.
        /// </summary>
        public void Write(int? userId, string action, string? detail = null,
                          string? affectedEntity = null, int? affectedEntityId = null,
                          string? ipAddress = null, string result = "Success")
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                INSERT INTO tblAuditLog (UserID, Action, Detail, AffectedEntity, AffectedEntityID, IPAddress, Result)
                VALUES (@uid, @action, @detail, @ae, @aeid, @ip, @result)";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@uid",    (object?)userId           ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@action", action);
            cmd.Parameters.AddWithValue("@detail", (object?)detail           ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ae",     (object?)affectedEntity   ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@aeid",   (object?)affectedEntityId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ip",     (object?)ipAddress        ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@result", result);
            cmd.ExecuteNonQuery();
        }
    }

    public class AuditLogRecord
    {
        public int      LogID            { get; set; }
        public int?     UserID           { get; set; }
        public string   Username         { get; set; } = "";
        public string   Action           { get; set; } = "";
        public string?  Detail           { get; set; }
        public string?  AffectedEntity   { get; set; }
        public int?     AffectedEntityID { get; set; }
        public string?  IPAddress        { get; set; }
        public string   Result           { get; set; } = "Success";
        public DateTime Timestamp        { get; set; }
    }
}
