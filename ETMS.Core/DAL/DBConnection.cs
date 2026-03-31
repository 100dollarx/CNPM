using Microsoft.Data.SqlClient;

namespace ETMS.DAL
{
    /// <summary>
    /// DBConnection — Static class quản lý connection string.
    /// Backward-compatible với tất cả DAL classes (gọi DBConnection.GetConnection()).
    /// Hỗ trợ Configure() injection từ ASP.NET Core startup.
    /// </summary>
    public static class DBConnection
    {
        // Connection string mặc định (dev) — override bằng Configure() hoặc ETMS_CONNECTION env
        private static string _connectionString =
            Environment.GetEnvironmentVariable("ETMS_CONNECTION")
            ?? @"Server=HItas\MSSQLSERVER01;Database=ETMS_DB;Integrated Security=True;TrustServerCertificate=True;";

        /// <summary>
        /// Gọi trong Program.cs của ETMS.Api để inject connection string từ appsettings.json.
        /// </summary>
        public static void Configure(string connectionString)
        {
            _connectionString = connectionString;
        }

        /// <summary>Tạo SqlConnection mới (chưa Open). Dùng trong tất cả DAL classes.</summary>
        public static SqlConnection GetConnection() => new SqlConnection(_connectionString);

        /// <summary>Kiểm tra kết nối (dùng khi startup).</summary>
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
