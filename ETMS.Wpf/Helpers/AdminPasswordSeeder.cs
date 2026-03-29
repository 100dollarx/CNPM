using ETMS.DAL;

namespace ETMS.Helpers
{
    /// <summary>
    /// AdminPasswordSeeder — Đảm bảo password mặc định "admin" được hash đúng BCrypt.
    /// Gọi khi startup nếu hash trong DB cần reset (dùng cho dev/demo mode).
    /// UC: Khi chạy lần đầu hoặc hash không verify được → tự động cập nhật.
    /// </summary>
    public static class AdminPasswordSeeder
    {
        /// <summary>
        /// Kiểm tra và seed password "admin" cho tài khoản admin nếu cần.
        /// Chỉ gọi trong Development mode.
        /// </summary>
        public static void SeedDefaultPasswordIfNeeded()
        {
            try
            {
                var userDAL  = new UserDAL();
                var adminDto = userDAL.GetUser("admin");
                if (adminDto == null) return;

                // Verify xem hash hiện tại có đúng cho "admin" không
                bool valid = BCrypt.Net.BCrypt.Verify("admin", adminDto.PasswordHash);
                if (!valid)
                {
                    // Hash không đúng → tạo lại và update
                    string newHash = BCrypt.Net.BCrypt.HashPassword("admin", workFactor: 12);
                    userDAL.UpdatePassword(adminDto.UserID, newHash);

                    // Cũng update captain1 và player1
                    var cap = userDAL.GetUser("captain1");
                    if (cap != null && !BCrypt.Net.BCrypt.Verify("admin", cap.PasswordHash))
                        userDAL.UpdatePassword(cap.UserID, BCrypt.Net.BCrypt.HashPassword("admin", 12));

                    var pl = userDAL.GetUser("player1");
                    if (pl != null && !BCrypt.Net.BCrypt.Verify("admin", pl.PasswordHash))
                        userDAL.UpdatePassword(pl.UserID, BCrypt.Net.BCrypt.HashPassword("admin", 12));
                }
            }
            catch
            {
                // Bỏ qua lỗi kết nối — seeder không được crash ứng dụng
            }
        }
    }
}
