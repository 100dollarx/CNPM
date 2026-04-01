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
                SELECT UserID, Username, PasswordHash, FullName, Role, IsLocked, FailedLoginAttempts
                FROM tblUser WHERE Username = @uname";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@uname", username);
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

        public UserDTO? GetByID(int userID)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = "SELECT UserID, Username, FullName, Role, IsLocked FROM tblUser WHERE UserID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", userID);
            using var dr = cmd.ExecuteReader();
            if (!dr.Read()) return null;
            return new UserDTO { UserID = dr.GetInt32(0), Username = dr.GetString(1), FullName = dr.GetString(2), Role = dr.GetString(3), IsLocked = dr.GetBoolean(4) };
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
            var sql = "SELECT UserID, Username, FullName, Role, IsLocked FROM tblUser WHERE 1=1";
            if (!string.IsNullOrEmpty(role))   sql += " AND Role = @role";
            if (!string.IsNullOrEmpty(search)) sql += " AND (Username LIKE @s OR FullName LIKE @s)";
            sql += " ORDER BY UserID";
            using var cmd = new SqlCommand(sql, conn);
            if (!string.IsNullOrEmpty(role))   cmd.Parameters.AddWithValue("@role", role);
            if (!string.IsNullOrEmpty(search)) cmd.Parameters.AddWithValue("@s", $"%{search}%");
            using var dr = cmd.ExecuteReader();
            while (dr.Read())
                list.Add(new UserDTO { UserID = dr.GetInt32(0), Username = dr.GetString(1), FullName = dr.GetString(2), Role = dr.GetString(3), IsLocked = dr.GetBoolean(4) });
            return list;
        }

        public int InsertUser(string username, string passwordHash, string fullName, string role, string? email = null)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                INSERT INTO tblUser (Username, PasswordHash, FullName, Role, Email)
                OUTPUT INSERTED.UserID
                VALUES (@u, @h, @f, @r, @e)";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@u", username);
            cmd.Parameters.AddWithValue("@h", passwordHash);
            cmd.Parameters.AddWithValue("@f", fullName);
            cmd.Parameters.AddWithValue("@r", role);
            cmd.Parameters.AddWithValue("@e", (object?)email ?? DBNull.Value);
            return Convert.ToInt32(cmd.ExecuteScalar());
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
    }
}
