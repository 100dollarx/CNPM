namespace ETMS.DTO
{
    public class PlayerDTO
    {
        public int PlayerID { get; set; }
        public int TeamID { get; set; }
        public int? UserID { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string InGameID { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }
}
