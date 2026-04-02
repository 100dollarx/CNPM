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

        /// <summary>
        /// Tạo token dạng Base64("userId|role|timestamp") để frontend lưu và gửi lại.
        /// đối với academic project, này đủ để identify user per-request.
        /// </summary>
        public static string BuildToken(int userID, string role)
        {
            var payload = $"{userID}|{role}|{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
            return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(payload));
        }

        /// <summary>Giải mã token và trả về (userID, role) hoặc null nếu không hợp lệ.</summary>
        public static (int userID, string role)? ParseToken(string? token)
        {
            if (string.IsNullOrWhiteSpace(token)) return null;
            try
            {
                var decoded = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(token));
                var parts   = decoded.Split('|');
                if (parts.Length < 2) return null;
                if (!int.TryParse(parts[0], out int uid)) return null;
                return (uid, parts[1]);
            }
            catch { return null; }
        }
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

        /// <summary>
        /// Cập nhật mật khẩu sau khi xác thực mật khẩu cũ. SRS FR-1.
        /// </summary>
        public (bool ok, string error) ChangePassword(int userID, string oldPassword, string newPassword)
        {
            if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 8)
                return (false, "Mật khẩu mới phải có ít nhất 8 ký tự.");
            if (oldPassword == newPassword)
                return (false, "Mật khẩu mới không được trùng với mật khẩu cũ.");

            var (user, storedHash) = _dal.GetByUserID(userID);
            if (user == null) return (false, "Không tìm thấy tài khoản.");
            if (!VerifyPassword(oldPassword, storedHash))
                return (false, "Mật khẩu cũ không chính xác.");

            string newHash = HashPassword(newPassword);
            _dal.UpdatePassword(userID, newHash);
            return (true, "Mật khẩu đã được cập nhật thành công.");
        }

        /// <summary>
        /// Parse Authorization token và set Session.CurrentUser per-request (stateless workaround).
        /// Gọi mỗi handler cần RBAC để identify user từ token.
        /// </summary>
        public static bool SetCurrentUserFromToken(string? authHeader, UserDAL? dal = null)
        {
            if (string.IsNullOrWhiteSpace(authHeader)) return false;
            var token = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? authHeader[7..] : authHeader;

            var parsed = Session.ParseToken(token);
            if (parsed == null) return false;

            var (userID, role) = parsed.Value;
            // Set a lightweight session object without DB hit (trust token for role)
            Session.CurrentUser = new UserDTO
            {
                UserID   = userID,
                Username = string.Empty,
                FullName = string.Empty,
                Role     = role
            };
            return true;
        }
    }
}
