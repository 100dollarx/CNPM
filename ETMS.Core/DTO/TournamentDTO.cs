namespace ETMS.DTO
{
    public class TournamentDTO
    {
        public int TournamentID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string GameType { get; set; } = string.Empty;   // MOBA | FPS | BattleRoyale | Fighting
        public string Format { get; set; } = "SingleElimination";
        public string Status { get; set; } = "Draft";           // Draft|Registration|Active|Completed
        public int MaxTeams { get; set; } = 16;
        public int MinPlayersPerTeam { get; set; } = 5;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
