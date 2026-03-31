namespace ETMS.DTO
{
    public class MatchDTO
    {
        public int MatchID { get; set; }
        public int TournamentID { get; set; }

        // Team info
        public int? Team1ID { get; set; }
        public int? Team2ID { get; set; }
        public string Team1Name { get; set; } = "TBD";
        public string Team2Name { get; set; } = "TBD";

        // Result
        public int? WinnerID { get; set; }
        public int? LoserID { get; set; }

        // Status
        public string Status { get; set; } = "Scheduled";
        // Scheduled | CheckInOpen | Live | Completed | Walkover | Bye

        public DateTime? ScheduledTime { get; set; }
        public DateTime? ActualStartTime { get; set; }

        // Check-in
        public bool CheckIn1 { get; set; }
        public bool CheckIn2 { get; set; }

        // Bracket Linked List
        public int? NextMatchID { get; set; }
        public int? NextMatchSlot { get; set; }   // 1 or 2

        public int Round { get; set; }
        public int MatchOrder { get; set; }
        public bool IsBye { get; set; }

        // Internal bracket-building helpers (không map vào DB)
        // Dùng bởi BracketBUS để ghép NextMatchID sau khi INSERT
        internal int _nextRound { get; set; }
        internal int _nextMatchOrder { get; set; }
        internal int _parentRound { get; set; }
        internal int _parentMatchOrder { get; set; }
    }
}
