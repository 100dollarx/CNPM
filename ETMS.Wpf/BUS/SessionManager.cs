using ETMS.DTO;

namespace ETMS.BUS
{
    /// <summary>
    /// SessionManager — Singleton quản lý phiên đăng nhập và session timeout.
    /// NFR-1.6: Session timeout 30 phút idle.
    /// </summary>
    public sealed class SessionManager
    {
        private static SessionManager? _instance;
        private static readonly object _lock = new();

        public UserDTO? CurrentUser { get; private set; }
        public DateTime LastActivityTime { get; private set; }
        public int TimeoutMinutes { get; private set; } = 30;

        private SessionManager() { }

        public static SessionManager GetInstance()
        {
            if (_instance == null)
            {
                lock (_lock)
                {
                    _instance ??= new SessionManager();
                }
            }
            return _instance;
        }

        public void SetUser(UserDTO user)
        {
            CurrentUser = user;
            LastActivityTime = DateTime.Now;
        }

        public bool HasRole(string role)
        {
            return CurrentUser != null &&
                   string.Equals(CurrentUser.Role, role, StringComparison.OrdinalIgnoreCase);
        }

        public bool HasAnyRole(params string[] roles)
        {
            if (CurrentUser == null) return false;
            return roles.Any(r => string.Equals(CurrentUser.Role, r, StringComparison.OrdinalIgnoreCase));
        }

        public bool IsSessionValid()
        {
            if (CurrentUser == null) return false;
            return (DateTime.Now - LastActivityTime).TotalMinutes < TimeoutMinutes;
        }

        public void UpdateActivity()
        {
            LastActivityTime = DateTime.Now;
        }

        public void ClearSession()
        {
            CurrentUser = null;
        }
    }
}
