namespace ETMS.DTO
{
    public class MatchResultDTO
    {
        public int ResultID { get; set; }
        public int MatchID { get; set; }
        public int Score1 { get; set; }
        public int Score2 { get; set; }
        public string? EvidenceURL { get; set; }
        public string Status { get; set; } = "PendingVerification";
        public int? SubmittedBy { get; set; }
        public int? VerifiedBy { get; set; }
        public DateTime SubmittedAt { get; set; }
        public DateTime? VerifiedAt { get; set; }
    }
}
