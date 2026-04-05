using ETMS.DAL;
using ETMS.DTO;

namespace ETMS.BUS
{
    public static class Session
    {
    [ThreadStatic] private static UserDTO? _currentUser;
    public static UserDTO? CurrentUser
    {
        get => _currentUser;
        set => _currentUser = value;
    }
    public static bool IsLoggedIn => CurrentUser != null;
    public static bool IsAdmin    => CurrentUser?.Role == "Admin";
    public static bool IsCaptain  => CurrentUser?.Role == "Captain";
    public static void Logout() => CurrentUser = null;

        // ── JWT Configuration ─────────────────────────────────────────────────────
        /// <summary>
        /// Secret key dùng để ký JWT — được set từ Program.cs (đọc từ appsettings.json).
        /// Phải >= 32 ký tự để đảm bảo độ an toàn HMAC-SHA256.
        /// </summary>
        public static string JwtSecret { get; set; } =
            "ETMS_JWT_Secret_Key_256bit_minimum_32chars_here!!";

        public static int    JwtExpireMinutes { get; set; } = 480;  // 8 giờ — đủ dùng 1 buổi làm việc
        public static string JwtIssuer        { get; set; } = "ETMS.Api";
        public static string JwtAudience      { get; set; } = "ETMS.Desktop";

        // ── JWT Builder (HMAC-SHA256) ─────────────────────────────────────────────
        /// <summary>
        /// Tạo JWT chuẩn RFC 7519 với chữ ký HMAC-SHA256.
        /// Format: Base64Url(Header).Base64Url(Payload).Base64Url(HMAC-SHA256 Signature)
        /// Token này có thể verify trên https://jwt.io — không thể giả mạo nếu không có secret.
        /// </summary>
        public static string BuildToken(int userID, string role)
        {
            // Header
            var header = Base64UrlEncode("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");

            // Payload
            long now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            long exp = now + (JwtExpireMinutes * 60L);
            var payloadJson =
                $"{{\"uid\":{userID}," +
                $"\"role\":\"{EscapeJson(role)}\"," +
                $"\"iat\":{now}," +
                $"\"exp\":{exp}," +
                $"\"iss\":\"{EscapeJson(JwtIssuer)}\"," +
                $"\"aud\":\"{EscapeJson(JwtAudience)}\"}}";
            var payload = Base64UrlEncode(payloadJson);

            // Signature = HMAC-SHA256(header + "." + payload, secret)
            var signingInput = $"{header}.{payload}";
            var signature    = ComputeHmacSha256(signingInput, JwtSecret);

            return $"{signingInput}.{signature}";
        }

        // ── JWT Validator ─────────────────────────────────────────────────────────
        /// <summary>
        /// Xác minh chữ ký JWT và trả về (userID, role) nếu hợp lệ.
        /// Trả về null nếu: chữ ký sai (token giả mạo), hết hạn, hoặc sai format.
        /// </summary>
        public static (int userID, string role)? ParseToken(string? token)
        {
            if (string.IsNullOrWhiteSpace(token)) return null;
            try
            {
                var parts = token.Split('.');
                if (parts.Length != 3) return null;

                // Bước 1: Xác minh chữ ký — quan trọng nhất!
                var signingInput = $"{parts[0]}.{parts[1]}";
                var expectedSig  = ComputeHmacSha256(signingInput, JwtSecret);
                if (expectedSig != parts[2])
                    return null; // Chữ ký không khớp => token bị giả mạo hoặc sai secret

                // Bước 2: Decode payload
                var payloadJson = System.Text.Encoding.UTF8.GetString(Base64UrlDecode(parts[1]));
                using var doc   = System.Text.Json.JsonDocument.Parse(payloadJson);
                var root        = doc.RootElement;

                // Bước 3: Kiểm tra thời hạn (exp)
                if (root.TryGetProperty("exp", out var expProp))
                {
                    long expTime = expProp.GetInt64();
                    if (DateTimeOffset.UtcNow.ToUnixTimeSeconds() > expTime)
                        return null; // Token đã hết hạn
                }

                // Bước 4: Đọc claims
                if (!root.TryGetProperty("uid",  out var uidProp))  return null;
                if (!root.TryGetProperty("role", out var roleProp)) return null;

                return (uidProp.GetInt32(), roleProp.GetString()!);
            }
            catch { return null; }
        }

        // ── Crypto & Encoding Helpers ─────────────────────────────────────────────

        private static string ComputeHmacSha256(string data, string key)
        {
            var keyBytes  = System.Text.Encoding.UTF8.GetBytes(key);
            var dataBytes = System.Text.Encoding.UTF8.GetBytes(data);
            using var hmac = new System.Security.Cryptography.HMACSHA256(keyBytes);
            var hash = hmac.ComputeHash(dataBytes);
            return Convert.ToBase64String(hash)
                          .TrimEnd('=')
                          .Replace('+', '-')
                          .Replace('/', '_');
        }

        private static string Base64UrlEncode(string input)
        {
            var bytes = System.Text.Encoding.UTF8.GetBytes(input);
            return Convert.ToBase64String(bytes)
                          .TrimEnd('=')
                          .Replace('+', '-')
                          .Replace('/', '_');
        }

        private static byte[] Base64UrlDecode(string input)
        {
            var padded = input.Replace('-', '+').Replace('_', '/');
            switch (padded.Length % 4)
            {
                case 2: padded += "=="; break;
                case 3: padded += "=";  break;
            }
            return Convert.FromBase64String(padded);
        }

        private static string EscapeJson(string s)
            => s.Replace("\\", "\\\\").Replace("\"", "\\\"");
    }

    /// <summary>
    /// AuthBUS — BCrypt hash/verify (cost=12) + ChangePassword. SRS NFR-1.
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
        /// UC-1.3: Đổi mật khẩu — xác minh mật khẩu cũ, validate, hash BCrypt, lưu DB.
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

            _dal.UpdatePassword(userID, HashPassword(newPassword));
            return (true, "Mật khẩu đã được cập nhật thành công.");
        }

        /// <summary>
        /// Parse Authorization header, xác minh chữ ký JWT HMAC-SHA256, set Session.CurrentUser.
        /// Gọi ở đầu mỗi handler cần RBAC.
        /// </summary>
        public static bool SetCurrentUserFromToken(string? authHeader, UserDAL? dal = null)
        {
            if (string.IsNullOrWhiteSpace(authHeader)) return false;
            var token = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? authHeader[7..] : authHeader;

            var parsed = Session.ParseToken(token);
            if (parsed == null) return false;

            var (userID, role) = parsed.Value;
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
