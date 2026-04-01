using ETMS.DAL;
using ETMS.DTO;

namespace ETMS.BUS
{
    public static class Session
    {
        public static UserDTO? CurrentUser { get; set; }
        public static bool IsLoggedIn => CurrentUser != null;
        public static bool IsAdmin    => CurrentUser?.Role == "Admin";
        public static bool IsCaptain  => CurrentUser?.Role == "Captain";
        public static void Logout() => CurrentUser = null;
    }

    /// <summary>
    /// AuthBUS — BCrypt.Verify (cost=12). SRS NFR-1.
    /// </summary>
    public class AuthBUS
    {
        private readonly UserDAL _dal = new();

        public static string HashPassword(string password)
            => BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);

        public static bool VerifyPassword(string password, string hash)
            => BCrypt.Net.BCrypt.Verify(password, hash);

        public (bool success, string message) Login(string username, string password)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                return (false, "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");

            var (user, storedHash) = _dal.GetByUsername(username.Trim());
            if (user == null) return (false, "Thông tin đăng nhập không chính xác.");
            if (user.IsLocked) return (false, "Tài khoản đã bị khóa. Liên hệ Admin để mở lại.");

            if (!VerifyPassword(password, storedHash))
            {
                _dal.IncrementFailedAttempts(username);
                return (false, "Thông tin đăng nhập không chính xác.");
            }

            _dal.ResetFailedAttempts(username);
            Session.CurrentUser = user;
            return (true, "");
        }

        public void Logout() => Session.Logout();

        public int RegisterUser(string username, string password, string fullName, string role)
        {
            if (string.IsNullOrWhiteSpace(username)) throw new ArgumentException("Tên đăng nhập không được trống.");
            if (password.Length < 8) throw new ArgumentException("Mật khẩu phải có ít nhất 8 ký tự.");
            return _dal.InsertUser(username.Trim(), HashPassword(password), fullName, role);
        }
    }
}
