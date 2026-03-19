namespace ETMS.DTO
{
    public class TeamDTO
    {
        public int TeamID { get; set; }
        public int TournamentID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? LogoURL { get; set; }
        public int CaptainID { get; set; }
        public string CaptainName { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";  // Pending|Approved|Rejected
        public string? RejectionReason { get; set; }
        public DateTime CreatedAt { get; set; }
        public int PlayerCount { get; set; }
    }
}
