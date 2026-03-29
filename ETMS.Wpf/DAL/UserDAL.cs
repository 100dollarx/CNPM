using Microsoft.Data.SqlClient;
using ETMS.DTO;

namespace ETMS.DAL
{
    /// <summary>
    /// UserDAL — CRUD cho tblUser.
    /// NFR-1.2: Tất cả queries dùng SqlParameter (chống SQL Injection).
    /// </summary>
    public class UserDAL
    {
        private readonly DBConnection _db = DBConnection.GetInstance();

        /// <summary>Lấy thông tin user theo Username. Trả null nếu không tìm thấy.</summary>
        public UserDTO? GetUser(string username)
        {
            const string sql = @"
                SELECT UserID, Username, PasswordHash, Role, IsLocked,
                       FullName, Email, CreatedAt, FailedLoginAttempts
                FROM tblUser
                WHERE Username = @Username";

            using var conn = _db.GetConnection();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Username", username);
            conn.Open();

            using var reader = cmd.ExecuteReader();
            if (!reader.Read()) return null;

            return new UserDTO
            {
                UserID               = reader.GetInt32(0),
                Username             = reader.GetString(1),
                PasswordHash         = reader.GetString(2),
                Role                 = reader.GetString(3),
                IsLocked             = reader.GetBoolean(4),
                FullName             = reader.GetString(5),
                Email                = reader.IsDBNull(6) ? null : reader.GetString(6),
                CreatedAt            = reader.GetDateTime(7),
                FailedLoginAttempts  = reader.GetInt32(8)
            };
        }

        /// <summary>Tăng FailedLoginAttempts thêm 1.</summary>
        public void IncrementFailedAttempts(int userId)
        {
            const string sql = "UPDATE tblUser SET FailedLoginAttempts = FailedLoginAttempts + 1 WHERE UserID = @UserID";
            using var conn = _db.GetConnection();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@UserID", userId);
            conn.Open();
            cmd.ExecuteNonQuery();
        }

        /// <summary>Reset FailedLoginAttempts về 0 sau đăng nhập thành công.</summary>
        public void ResetFailedAttempts(int userId)
        {
            const string sql = "UPDATE tblUser SET FailedLoginAttempts = 0 WHERE UserID = @UserID";
            using var conn = _db.GetConnection();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@UserID", userId);
            conn.Open();
            cmd.ExecuteNonQuery();
        }

        /// <summary>Khóa tài khoản (IsLocked = 1).</summary>
        public void LockAccount(int userId)
        {
            const string sql = "UPDATE tblUser SET IsLocked = 1 WHERE UserID = @UserID";
            using var conn = _db.GetConnection();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@UserID", userId);
            conn.Open();
            cmd.ExecuteNonQuery();
        }

        /// <summary>Mở khóa tài khoản (IsLocked = 0, reset FailedLoginAttempts).</summary>
        public void UnlockAccount(int userId)
        {
            const string sql = "UPDATE tblUser SET IsLocked = 0, FailedLoginAttempts = 0 WHERE UserID = @UserID";
            using var conn = _db.GetConnection();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@UserID", userId);
            conn.Open();
            cmd.ExecuteNonQuery();
        }

        /// <summary>Cập nhật PasswordHash (dùng khi đổi mật khẩu).</summary>
        public void UpdatePassword(int userId, string newHash)
        {
            const string sql = "UPDATE tblUser SET PasswordHash = @Hash WHERE UserID = @UserID";
            using var conn = _db.GetConnection();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Hash", newHash);
            cmd.Parameters.AddWithValue("@UserID", userId);
            conn.Open();
            cmd.ExecuteNonQuery();
        }
    }
}
