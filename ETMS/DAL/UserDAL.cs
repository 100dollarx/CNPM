using Microsoft.Data.SqlClient;
using ETMS.DTO;

namespace ETMS.DAL
{
    public class UserDAL
    {
        // NFR-1: Lấy user kèm hash để BUS tự verify — không trả password raw
        public (UserDTO? user, string passwordHash) GetByUsername(string username)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT UserID, Username, PasswordHash, FullName, Role, IsLocked, LoginFailCount
                FROM tblUser
                WHERE Username = @uname";
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
            const string sql = "SELECT UserID,Username,FullName,Role,IsLocked FROM tblUser WHERE UserID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", userID);
            using var dr = cmd.ExecuteReader();
            if (!dr.Read()) return null;
            return new UserDTO
            {
                UserID   = dr.GetInt32(0),
                Username = dr.GetString(1),
                FullName = dr.GetString(2),
                Role     = dr.GetString(3),
                IsLocked = dr.GetBoolean(4)
            };
        }

        /// <summary>Tăng số lần đăng nhập sai. Nếu >= 5 thì khóa tài khoản.</summary>
        public void IncrementFailCount(string username)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                UPDATE tblUser
                SET LoginFailCount = LoginFailCount + 1,
                    IsLocked = CASE WHEN LoginFailCount + 1 >= 5 THEN 1 ELSE IsLocked END
                WHERE Username = @uname";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@uname", username);
            cmd.ExecuteNonQuery();
        }

        /// <summary>Reset fail count sau khi đăng nhập thành công.</summary>
        public void ResetFailCount(string username)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = "UPDATE tblUser SET LoginFailCount=0 WHERE Username=@uname";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@uname", username);
            cmd.ExecuteNonQuery();
        }

        public List<UserDTO> GetAll()
        {
            var list = new List<UserDTO>();
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = "SELECT UserID,Username,FullName,Role,IsLocked FROM tblUser ORDER BY UserID";
            using var cmd = new SqlCommand(sql, conn);
            using var dr = cmd.ExecuteReader();
            while (dr.Read())
                list.Add(new UserDTO
                {
                    UserID   = dr.GetInt32(0),
                    Username = dr.GetString(1),
                    FullName = dr.GetString(2),
                    Role     = dr.GetString(3),
                    IsLocked = dr.GetBoolean(4)
                });
            return list;
        }

        /// <param name="role">Admin | Captain | Player</param>
        public int InsertUser(string username, string passwordHash, string fullName, string role)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                INSERT INTO tblUser (Username,PasswordHash,FullName,Role)
                VALUES (@u,@h,@f,@r);
                SELECT SCOPE_IDENTITY();";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@u", username);
            cmd.Parameters.AddWithValue("@h", passwordHash);
            cmd.Parameters.AddWithValue("@f", fullName);
            cmd.Parameters.AddWithValue("@r", role);
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public void SetLockStatus(int userID, bool locked)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = "UPDATE tblUser SET IsLocked=@v, LoginFailCount=0 WHERE UserID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@v", locked ? 1 : 0);
            cmd.Parameters.AddWithValue("@id", userID);
            cmd.ExecuteNonQuery();
        }
    }
}
