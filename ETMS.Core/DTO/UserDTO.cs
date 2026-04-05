namespace ETMS.DTO
{
    public class UserDTO
    {
        public int    UserID   { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role     { get; set; } = string.Empty;   // Admin | Captain | Player | Guest
        public bool   IsLocked { get; set; }
        public string? Email   { get; set; }
        public string? Phone   { get; set; }
        public bool   IsActivated { get; set; } = true;        // Mặc định true cho user cũ
    }
}
