using Microsoft.Data.SqlClient;

namespace ETMS.DAL
{
    /// <summary>
    /// Singleton quản lý connection string.
    /// Đổi chuỗi ConnStr để phù hợp môi trường của bạn.
    /// </summary>
    public static class DBConnection
    {
        // Thay Server=localhost bằng tên SQL Server instance của bạn (VD: .\SQLEXPRESS)
        private const string ConnStr =
            "Server=localhost;Database=ETMS_DB;Integrated Security=True;TrustServerCertificate=True;";

        /// <summary>Trả về SqlConnection mới (chưa Open).</summary>
        public static SqlConnection GetConnection() => new SqlConnection(ConnStr);

        /// <summary>Kiểm tra kết nối DB (dùng khi startup).</summary>
        public static bool TestConnection()
        {
            try
            {
                using var conn = GetConnection();
                conn.Open();
                return true;
            }
            catch { return false; }
        }
    }
}
