using System.Security.Cryptography;
using System.Text;
using ETMS.DAL;
using ETMS.DTO;

namespace ETMS.BUS
{
    /// <summary>
    /// Session toàn cục — lưu thông tin người dùng đã đăng nhập.
    /// </summary>
    public static class Session
    {
        public static UserDTO? CurrentUser { get; set; }
        public static bool IsLoggedIn => CurrentUser != null;
        public static bool IsAdmin    => CurrentUser?.Role == "Admin";
        public static bool IsCaptain  => CurrentUser?.Role == "Captain";

        public static void Logout() => CurrentUser = null;
    }

    /// <summary>
    /// AuthBUS — Xác thực đăng nhập với SHA-256.
    /// NFR-1: Không lưu mật khẩu plain text.
    /// </summary>
    public class AuthBUS
    {
        private readonly UserDAL _dal = new();

        /// <summary>Hash SHA-256 của chuỗi password.</summary>
        public static string HashPassword(string password)
        {
            byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
            return BitConverter.ToString(bytes).Replace("-", "").ToLower();
        }

        /// <summary>
        /// Đăng nhập: kiểm tra hash, RBAC, tài khoản bị khóa.
        /// Trả về (thành công, thông báo lỗi nếu có).
        /// </summary>
        public (bool success, string message) Login(string username, string password)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                return (false, "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");

            var (user, storedHash) = _dal.GetByUsername(username.Trim());

            if (user == null)
                return (false, "Tên đăng nhập không tồn tại.");

            if (user.IsLocked)
                return (false, "Tài khoản đã bị khóa. Liên hệ Admin để mở lại.");

            string inputHash = HashPassword(password);
            if (inputHash != storedHash)
            {
                _dal.IncrementFailCount(username);
                return (false, "Mật khẩu không đúng. Tài khoản sẽ bị khóa sau 5 lần thất bại liên tiếp.");
            }

            // Đăng nhập thành công
            _dal.ResetFailCount(username);
            Session.CurrentUser = user;
            return (true, "");
        }

        public void Logout() => Session.Logout();

        public int RegisterUser(string username, string password, string fullName, string role)
        {
            if (string.IsNullOrWhiteSpace(username))
                throw new ArgumentException("Tên đăng nhập không được trống.");
            if (password.Length < 6)
                throw new ArgumentException("Mật khẩu phải có ít nhất 6 ký tự.");

            return _dal.InsertUser(username.Trim(), HashPassword(password), fullName, role);
        }
    }
}
