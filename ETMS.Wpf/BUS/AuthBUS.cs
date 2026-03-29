using ETMS.DAL;
using ETMS.DTO;
using ETMS.Enums;

namespace ETMS.BUS
{
    /// <summary>
    /// AuthBUS — Xử lý đăng nhập, đổi mật khẩu, khóa/mở tài khoản.
    /// UC-1.1: Đăng nhập với bcrypt verify + failed attempts + session.
    /// </summary>
    public class AuthBUS
    {
        private readonly UserDAL _userDAL = new();
        private readonly SessionManager _session = SessionManager.GetInstance();

        // NFR-1.2: Không hardcode credentials — mọi query đều qua DAL với parameterized query
        private const int MAX_FAILED_ATTEMPTS = 5;

        /// <summary>
        /// Đăng nhập hệ thống.
        /// UC-1.1 — Luồng chính: lấy user → kiểm tra lock → verify bcrypt → session.
        /// </summary>
        public LoginResult Login(string username, string password, out UserDTO? user)
        {
            user = null;
            try
            {
                var dto = _userDAL.GetUser(username);

                // UC-1.1 Alt A: User không tồn tại — trả thông báo chung (không tiết lộ field sai)
                if (dto == null)
                    return LoginResult.NotFound;

                // UC-1.1 Alt C: Tài khoản bị khóa
                if (dto.IsLocked)
                    return LoginResult.AccountLocked;

                // UC-1.1: Verify bcrypt
                bool passwordCorrect = BCrypt.Net.BCrypt.Verify(password, dto.PasswordHash);

                if (!passwordCorrect)
                {
                    // Tăng failed attempts
                    _userDAL.IncrementFailedAttempts(dto.UserID);

                    // Nếu đạt giới hạn → khóa tài khoản
                    if (dto.FailedLoginAttempts + 1 >= MAX_FAILED_ATTEMPTS)
                    {
                        _userDAL.LockAccount(dto.UserID);
                        return LoginResult.AccountLocked;
                    }

                    return LoginResult.WrongPassword;
                }

                // Đăng nhập thành công → reset failed attempts + tạo session
                _userDAL.ResetFailedAttempts(dto.UserID);
                _session.SetUser(dto);
                user = dto;
                return LoginResult.Success;
            }
            catch (Exception ex)
            {
                // Giữ lại ex.Message vào đâu đó để UI biết
                throw new Exception("Lỗi Database: " + ex.Message, ex);
            }
        }

        /// <summary>Đăng xuất — xóa session hiện tại.</summary>
        public void Logout()
        {
            _session.ClearSession();
        }

        /// <summary>
        /// Đổi mật khẩu cá nhân. UC-1.3.
        /// Yêu cầu: mật khẩu mới ≥ 8 ký tự, có chữ hoa + số.
        /// </summary>
        public bool ChangePassword(int userId, string oldPassword, string newPassword, out string errorMsg)
        {
            errorMsg = string.Empty;

            // Validate mật khẩu mới
            if (newPassword.Length < 8)
            {
                errorMsg = "Mật khẩu mới phải có ít nhất 8 ký tự.";
                return false;
            }
            if (!newPassword.Any(char.IsUpper))
            {
                errorMsg = "Mật khẩu mới phải chứa ít nhất 1 chữ hoa.";
                return false;
            }
            if (!newPassword.Any(char.IsDigit))
            {
                errorMsg = "Mật khẩu mới phải chứa ít nhất 1 chữ số.";
                return false;
            }

            // Verify mật khẩu cũ
            var user = _session.CurrentUser;
            if (user == null || !BCrypt.Net.BCrypt.Verify(oldPassword, user.PasswordHash))
            {
                errorMsg = "Mật khẩu cũ không đúng.";
                return false;
            }

            // Hash và lưu mật khẩu mới
            string newHash = BCrypt.Net.BCrypt.HashPassword(newPassword, 12);
            _userDAL.UpdatePassword(userId, newHash);
            return true;
        }
    }
}
