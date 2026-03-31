namespace ETMS.DTO
{
    /// <summary>
    /// DTO cho quy trình Map Veto (FR-5 — FPS Games).
    /// Mỗi record là 1 lượt Ban/Pick trong quá trình veto.
    /// </summary>
    public class MapVetoDTO
    {
        public int VetoID { get; set; }
        public int MatchID { get; set; }
        public int TeamID { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public string MapName { get; set; } = string.Empty;
        public string Action { get; set; } = "Ban";  // Ban | Pick
        public int VetoOrder { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
