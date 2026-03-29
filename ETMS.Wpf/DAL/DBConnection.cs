using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace ETMS.DAL
{
    /// <summary>
    /// DBConnection — Singleton quản lý connection pooling.
    /// NFR-3.3: Max Pool Size=100; Min Pool Size=5
    /// Đọc connection string từ appsettings.json (WPF chuẩn, không dùng ConfigurationManager).
    /// </summary>
    public sealed class DBConnection
    {
        private static DBConnection? _instance;
        private static readonly object _lock = new();
        private readonly string _connectionString;

        private DBConnection()
        {
            // Đọc connection string từ appsettings.json
            var config = new ConfigurationBuilder()
                .SetBasePath(AppDomain.CurrentDomain.BaseDirectory)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .Build();

            _connectionString = config.GetConnectionString("ETMSConnection")
                ?? throw new InvalidOperationException(
                    "Connection string 'ETMSConnection' không tìm thấy trong appsettings.json.");
        }

        public static DBConnection GetInstance()
        {
            if (_instance == null)
            {
                lock (_lock)
                {
                    _instance ??= new DBConnection();
                }
            }
            return _instance;
        }

        /// <summary>Tạo SqlConnection mới từ connection pool.</summary>
        public SqlConnection GetConnection()
        {
            return new SqlConnection(_connectionString);
        }
    }
}
