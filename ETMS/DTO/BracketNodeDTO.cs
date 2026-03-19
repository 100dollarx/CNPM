namespace ETMS.DTO
{
    /// <summary>
    /// Dùng để render cây nhánh đấu (bracket tree) trên GUI.
    /// Mỗi node đại diện cho 1 ô trong cây nhị phân.
    /// </summary>
    public class BracketNodeDTO
    {
        public int MatchID { get; set; }
        public int Round { get; set; }
        public int MatchOrder { get; set; }

        public string Team1Name { get; set; } = "TBD";
        public string Team2Name { get; set; } = "TBD";
        public string Status { get; set; } = "Scheduled";
        public string WinnerName { get; set; } = "";
        public bool IsBye { get; set; }

        // Display position (set bởi bracket renderer)
        public int X { get; set; }
        public int Y { get; set; }
        public int Width { get; set; } = 160;
        public int Height { get; set; } = 50;
    }
}
