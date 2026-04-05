using Microsoft.Data.SqlClient;
using ETMS.DTO;

namespace ETMS.DAL
{
    public class UserDAL
    {
        public (UserDTO? user, string passwordHash) GetByUsername(string username)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT UserID, Username, PasswordHash, FullName, Role, IsLocked, FailedLoginAttempts, IsActivated, Email, Phone
                FROM tblUser WHERE Username = @uname";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@uname", username);
            using var dr = cmd.ExecuteReader();
            if (!dr.Read()) return (null, "");
            var dto = new UserDTO
            {
                UserID      = dr.GetInt32(0),
                Username    = dr.GetString(1),
                FullName    = dr.GetString(3),
                Role        = dr.GetString(4),
                IsLocked    = dr.GetBoolean(5),
                IsActivated = !dr.IsDBNull(7) && dr.GetBoolean(7),
                Email       = dr.IsDBNull(8) ? null : dr.GetString(8),
                Phone       = dr.IsDBNull(9) ? null : dr.GetString(9)
            };
            return (dto, dr.GetString(2));
        }

        public UserDTO? GetByID(int userID)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = "SELECT UserID, Username, FullName, Role, IsLocked, Email, IsActivated, Phone FROM tblUser WHERE UserID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", userID);
            using var dr = cmd.ExecuteReader();
            if (!dr.Read()) return null;
            return new UserDTO
            {
                UserID      = dr.GetInt32(0),
                Username    = dr.GetString(1),
                FullName    = dr.GetString(2),
                Role        = dr.GetString(3),
                IsLocked    = dr.GetBoolean(4),
                Email       = dr.IsDBNull(5) ? null : dr.GetString(5),
                IsActivated = !dr.IsDBNull(6) && dr.GetBoolean(6),
                Phone       = dr.IsDBNull(7) ? null : dr.GetString(7)
            };
        }

        /// <summary>Lấy user + PasswordHash theo UserID — dùng cho ChangePassword.</summary>
        public (UserDTO? user, string passwordHash) GetByUserID(int userID)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT UserID, Username, PasswordHash, FullName, Role, IsLocked
                FROM tblUser WHERE UserID = @id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", userID);
            using var dr = cmd.ExecuteReader();
            if (!dr.Read()) return (null, "");
            var dto = new UserDTO
            {
                UserID   = dr.GetInt32(0),
                Username = dr.GetString(1),
                FullName = dr.GetString(3),
                Role     = dr.GetString(4),
                IsLocked = dr.GetBoolean(5)
            };
            return (dto, dr.GetString(2));
        }

        public void IncrementFailedAttempts(string username)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                UPDATE tblUser
                SET FailedLoginAttempts = FailedLoginAttempts + 1,
                    IsLocked = CASE WHEN FailedLoginAttempts + 1 >= 5 THEN 1 ELSE IsLocked END
                WHERE Username = @uname";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@uname", username);
            cmd.ExecuteNonQuery();
        }

        public void ResetFailedAttempts(string username)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = "UPDATE tblUser SET FailedLoginAttempts=0 WHERE Username=@uname";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@uname", username);
            cmd.ExecuteNonQuery();
        }

        public List<UserDTO> GetAll(string? role = null, string? search = null)
        {
            var list = new List<UserDTO>();
            using var conn = DBConnection.GetConnection();
            conn.Open();
            var sql = "SELECT UserID, Username, FullName, Role, IsLocked, Email, IsActivated, Phone FROM tblUser WHERE 1=1";
            if (!string.IsNullOrEmpty(role))   sql += " AND Role = @role";
            if (!string.IsNullOrEmpty(search)) sql += " AND (Username LIKE @s OR FullName LIKE @s)";
            sql += " ORDER BY UserID";
            using var cmd = new SqlCommand(sql, conn);
            if (!string.IsNullOrEmpty(role))   cmd.Parameters.AddWithValue("@role", role);
            if (!string.IsNullOrEmpty(search)) cmd.Parameters.AddWithValue("@s", $"%{search}%");
            using var dr = cmd.ExecuteReader();
            while (dr.Read())
                list.Add(new UserDTO
                {
                    UserID      = dr.GetInt32(0),
                    Username    = dr.GetString(1),
                    FullName    = dr.GetString(2),
                    Role        = dr.GetString(3),
                    IsLocked    = dr.GetBoolean(4),
                    Email       = dr.IsDBNull(5) ? null : dr.GetString(5),
                    IsActivated = !dr.IsDBNull(6) && dr.GetBoolean(6),
                    Phone       = dr.IsDBNull(7) ? null : dr.GetString(7)
                });
            return list;
        }

        /// <summary>Tạo user mới kèm activation token — chất lượng bảo mật: RandomNumberGenerator.</summary>
        public int InsertUser(string username, string passwordHash, string fullName,
                              string role, string? email = null,
                              string? activationToken = null, DateTime? activationExpires = null)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                INSERT INTO tblUser
                    (Username, PasswordHash, FullName, Role, Email,
                     ActivationToken, ActivationExpires, IsActivated, MustChangePassword)
                OUTPUT INSERTED.UserID
                VALUES (@u, @h, @f, @r, @e, @tok, @exp, @act, @mcp)";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@u",   username);
            cmd.Parameters.AddWithValue("@h",   passwordHash);
            cmd.Parameters.AddWithValue("@f",   fullName);
            cmd.Parameters.AddWithValue("@r",   role);
            cmd.Parameters.AddWithValue("@e",   (object?)email            ?? DBNull.Value);
            // Token là VARCHAR(128) trong DB — dùng explicit type tránh nvarchar conversion
            if (activationToken != null)
                cmd.Parameters.Add("@tok", System.Data.SqlDbType.VarChar, 128).Value = activationToken;
            else
                cmd.Parameters.Add("@tok", System.Data.SqlDbType.VarChar, 128).Value = DBNull.Value;
            cmd.Parameters.AddWithValue("@exp", (object?)activationExpires ?? DBNull.Value);
            // Nếu KHÔNG có token → user được admin tạo → đã kích hoạt sẵn, không cần đổi MK
            // Nếu CÓ token  → user tự đăng ký → chưa kích hoạt, không cần đổi MK (MK họ tự chọn)
            cmd.Parameters.AddWithValue("@act", activationToken == null ? 1 : 0);
            cmd.Parameters.AddWithValue("@mcp", 0);  // Không bắt buộc đổi mật khẩu
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        // ── Activation methods ─────────────────────────────────────────────

        /// <summary>Tìm user có token (bất kể hạn/trạng thái) — trả null nếu token không tồn tại.</summary>
        public (UserDTO? user, DateTime? expires, bool isActivated) FindByToken(string token)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT UserID, Username, FullName, Role, IsLocked, Email,
                       ActivationExpires, IsActivated
                FROM tblUser
                WHERE ActivationToken = @tok";
            using var cmd = new SqlCommand(sql, conn);
            // Dùng SqlDbType.VarChar explicit — cột DB là VARCHAR(128),
            // AddWithValue sẽ infer NVarChar gây implicit conversion → có thể không match
            cmd.Parameters.Add("@tok", System.Data.SqlDbType.VarChar, 128).Value = token;
            using var dr = cmd.ExecuteReader();
            if (!dr.Read())
            {
                // Debug: log tất cả tokens hiện có để so sánh
                dr.Close();
                using var debugCmd = new SqlCommand(
                    "SELECT UserID, Username, LEFT(ActivationToken, 12) AS TokenPrefix, LEN(ActivationToken) AS TokenLen FROM tblUser WHERE ActivationToken IS NOT NULL", conn);
                using var debugDr = debugCmd.ExecuteReader();
                Console.WriteLine($"[FindByToken] Token '{token[..Math.Min(12, token.Length)]}...' (len={token.Length}) NOT FOUND. Existing tokens:");
                while (debugDr.Read())
                    Console.WriteLine($"  UserID={debugDr.GetInt32(0)}, Username={debugDr.GetString(1)}, TokenPrefix={debugDr.GetString(2)}..., TokenLen={debugDr.GetInt32(3)}");
                if (!debugDr.HasRows)
                    Console.WriteLine("  (No tokens in DB — all users are activated or have NULL tokens)");
                return (null, null, false);
            }
            var user = new UserDTO
            {
                UserID      = dr.GetInt32(0),
                Username    = dr.GetString(1),
                FullName    = dr.GetString(2),
                Role        = dr.GetString(3),
                IsLocked    = dr.GetBoolean(4),
                Email       = dr.IsDBNull(5) ? null : dr.GetString(5),
                IsActivated = !dr.IsDBNull(7) && dr.GetBoolean(7)
            };
            var expires     = dr.IsDBNull(6) ? (DateTime?)null : dr.GetDateTime(6);
            var isActivated = !dr.IsDBNull(7) && dr.GetBoolean(7);
            return (user, expires, isActivated);
        }

        /// <summary>Kích hoạt tài khoản: set IsActivated=1. GIỮ token để idempotent (React Strict Mode gọi 2 lần).</summary>
        public void ActivateUser(int userID)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                UPDATE tblUser
                SET IsActivated = 1
                WHERE UserID = @id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", userID);
            cmd.ExecuteNonQuery();
        }

        /// <summary>Cấp lại token kích hoạt mới (khi token cũ hết hạn).</summary>
        public void SetActivationToken(int userID, string token, DateTime expires)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                UPDATE tblUser
                SET ActivationToken = @tok, ActivationExpires = @exp
                WHERE UserID = @id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.Add("@tok", System.Data.SqlDbType.VarChar, 128).Value = token;
            cmd.Parameters.AddWithValue("@exp", expires);
            cmd.Parameters.AddWithValue("@id",  userID);
            cmd.ExecuteNonQuery();
        }

        /// <summary>Check tài khoản đã được kích hoạt chưa (dùng khi login).</summary>
        public bool IsActivated(string username)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = "SELECT IsActivated FROM tblUser WHERE Username=@u";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@u", username);
            var result = cmd.ExecuteScalar();
            return result != null && Convert.ToInt32(result) == 1;
        }

        public void SetLockStatus(int userID, bool locked)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = "UPDATE tblUser SET IsLocked=@v, FailedLoginAttempts=0 WHERE UserID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@v", locked ? 1 : 0);
            cmd.Parameters.AddWithValue("@id", userID);
            cmd.ExecuteNonQuery();
        }

        public void UpdatePassword(int userID, string newHash)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = "UPDATE tblUser SET PasswordHash=@h, FailedLoginAttempts=0 WHERE UserID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@h", newHash);
            cmd.Parameters.AddWithValue("@id", userID);
            cmd.ExecuteNonQuery();
        }

        /// <summary>Tìm user theo email (case-insensitive). Trả null nếu không tồn tại.</summary>
        public UserDTO? GetByEmail(string email)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT UserID, Username, FullName, Role, IsLocked, Email, IsActivated
                FROM tblUser
                WHERE LOWER(Email) = LOWER(@e)";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@e", email.Trim());
            using var dr = cmd.ExecuteReader();
            if (!dr.Read()) return null;
            return new UserDTO
            {
                UserID      = dr.GetInt32(0),
                Username    = dr.GetString(1),
                FullName    = dr.GetString(2),
                Role        = dr.GetString(3),
                IsLocked    = dr.GetBoolean(4),
                Email       = dr.IsDBNull(5) ? null : dr.GetString(5),
                IsActivated = !dr.IsDBNull(6) && dr.GetBoolean(6)
            };
        }

        /// <summary>Xóa tài khoản chưa kích hoạt (IsActivated=0) theo UserID.</summary>
        public void DeleteUnactivated(int userID)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = "DELETE FROM tblUser WHERE UserID=@id AND IsActivated=0";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", userID);
            cmd.ExecuteNonQuery();
        }

        /// <summary>Cập nhật thông tin cá nhân (FullName, Email, Phone).</summary>
        public void UpdateProfile(int userID, string fullName, string? email, string? phone)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                UPDATE tblUser
                SET FullName=@fn, Email=@e, Phone=@p
                WHERE UserID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@fn", fullName);
            cmd.Parameters.AddWithValue("@e",  (object?)email ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@p",  (object?)phone ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@id", userID);
            cmd.ExecuteNonQuery();
        }

        /// <summary>Xóa tài khoản vĩnh viễn — SET NULL các FK trước khi DELETE.</summary>
        public bool DeleteUser(int userID)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();
            try
            {
                var cleanups = new[]
                {
                    "DELETE FROM tblNotification WHERE RecipientID=@id",
                    "UPDATE tblAuditLog SET UserID=NULL WHERE UserID=@id",
                    "UPDATE tblTournament SET CreatedBy=NULL WHERE CreatedBy=@id",
                    "DELETE FROM tblPlayer WHERE UserID=@id",
                    "UPDATE tblMatchResult SET SubmittedBy=NULL WHERE SubmittedBy=@id",
                    "UPDATE tblMatchResult SET VerifiedBy=NULL WHERE VerifiedBy=@id",
                    "UPDATE tblDispute SET ResolvedBy=NULL WHERE ResolvedBy=@id",
                };
                foreach (var sql in cleanups)
                {
                    using var cmd = new SqlCommand(sql, conn, tx);
                    cmd.Parameters.AddWithValue("@id", userID);
                    cmd.ExecuteNonQuery();
                }
                // Xóa teams do user làm captain (ON DELETE NO ACTION → phải xóa thủ công)
                using var delTeamPlayers = new SqlCommand(
                    "DELETE p FROM tblPlayer p INNER JOIN tblTeam t ON p.TeamID=t.TeamID WHERE t.CaptainID=@id", conn, tx);
                delTeamPlayers.Parameters.AddWithValue("@id", userID);
                delTeamPlayers.ExecuteNonQuery();

                using var delTeams = new SqlCommand("DELETE FROM tblTeam WHERE CaptainID=@id", conn, tx);
                delTeams.Parameters.AddWithValue("@id", userID);
                delTeams.ExecuteNonQuery();

                // Xóa user
                using var delUser = new SqlCommand("DELETE FROM tblUser WHERE UserID=@id", conn, tx);
                delUser.Parameters.AddWithValue("@id", userID);
                var rows = delUser.ExecuteNonQuery();

                tx.Commit();
                return rows > 0;
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        /// <summary>Lưu reset-password token (dùng lại cột ActivationToken).</summary>
        public void SetResetToken(int userID, string token, DateTime expires)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                UPDATE tblUser
                SET ActivationToken = @tok, ActivationExpires = @exp
                WHERE UserID = @id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.Add("@tok", System.Data.SqlDbType.VarChar, 128).Value = token;
            cmd.Parameters.AddWithValue("@exp", expires);
            cmd.Parameters.AddWithValue("@id",  userID);
            cmd.ExecuteNonQuery();
        }
    }
}
