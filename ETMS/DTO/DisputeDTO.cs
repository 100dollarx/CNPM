namespace ETMS.DTO
{
    public class DisputeDTO
    {
        public int DisputeID { get; set; }
        public int MatchID { get; set; }
        public int FiledByTeamID { get; set; }
        public string FiledByTeamName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? EvidenceURL { get; set; }
        public string Status { get; set; } = "Open";  // Open|Resolved|Dismissed
        public string? AdminNote { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }
}
