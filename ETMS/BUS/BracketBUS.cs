using ETMS.DAL;
using ETMS.DTO;

namespace ETMS.BUS
{
    /// <summary>
    /// BracketBUS — ★ TRỌNG TÂM ĐỒ ÁN
    /// GenerateBracket: Fisher-Yates Shuffle + Bye Logic + Linked List build.
    /// </summary>
    public class BracketBUS
    {
        private readonly BracketDAL _dal  = new();
        private readonly TeamDAL    _team = new();

        /// <summary>
        /// Tạo toàn bộ nhánh đấu Single Elimination cho một tournament.
        /// Thuật toán:
        ///   1. Lấy danh sách N đội Approved
        ///   2. Fisher-Yates Shuffle ngẫu nhiên
        ///   3. Tính slots = nextPowerOf2(N), byeCount = slots - N
        ///   4. Xây dựng vòng 1 (real + bye matches)
        ///   5. Xây dựng các vòng tiếp theo (empty matches, chờ winner điền vào)
        ///   6. Kết nối NextMatchID (Linked List structure)
        ///   7. Gọi DAL.SaveBracket() trong 1 Transaction
        /// </summary>
        public (bool success, string message) GenerateBracket(int tournamentID)
        {
            // Kiểm tra bracket đã tồn tại chưa
            if (_dal.HasBracket(tournamentID))
                return (false, "Nhánh đấu đã được tạo. Xóa bracket cũ trước khi tạo lại.");

            var teams = _team.GetApprovedTeams(tournamentID);
            int N = teams.Count;
            if (N < 2)
                return (false, "Cần ít nhất 2 đội Approved để tạo nhánh đấu.");

            // Bước 1: Shuffle
            Shuffle(teams);

            // Bước 2: Tính Bye
            int slots    = NextPowerOf2(N);
            int byeCount = slots - N;
            int rounds   = (int)Math.Log2(slots);

            // Bước 3: Tạo danh sách MatchDTO cho từng vòng
            // Dùng List<List<MatchDTO>> để track theo vòng
            var allMatches = new List<MatchDTO>();
            var roundMatches = new List<List<MatchDTO>>();

            // ----- Vòng 1 (Round 1) -----
            var round1 = new List<MatchDTO>();
            int teamIndex = 0;

            // Bye matches: đội seed cao nhất được Bye
            for (int i = 0; i < byeCount; i++)
            {
                var bye = new MatchDTO
                {
                    TournamentID = tournamentID,
                    Team1ID      = teams[teamIndex].TeamID,
                    Team1Name    = teams[teamIndex].Name,
                    Team2ID      = null,
                    WinnerID     = teams[teamIndex].TeamID, // auto win
                    Status       = "Bye",
                    IsBye        = true,
                    Round        = 1,
                    MatchOrder   = i + 1
                };
                round1.Add(bye);
                teamIndex++;
            }

            // Real matches trong vòng 1
            int realMatchCount = (slots - byeCount) / 2;
            for (int i = 0; i < realMatchCount; i++)
            {
                var m = new MatchDTO
                {
                    TournamentID = tournamentID,
                    Team1ID      = teams[teamIndex].TeamID,
                    Team1Name    = teams[teamIndex].Name,
                    Team2ID      = teams[teamIndex + 1].TeamID,
                    Team2Name    = teams[teamIndex + 1].Name,
                    Status       = "Scheduled",
                    IsBye        = false,
                    Round        = 1,
                    MatchOrder   = byeCount + i + 1
                };
                round1.Add(m);
                teamIndex += 2;
            }

            roundMatches.Add(round1);

            // ----- Vòng 2 trở đi -----
            for (int r = 2; r <= rounds; r++)
            {
                var prevRound = roundMatches[r - 2];
                var currentRound = new List<MatchDTO>();
                int matchesThisRound = prevRound.Count / 2;

                for (int i = 0; i < matchesThisRound; i++)
                {
                    var m = new MatchDTO
                    {
                        TournamentID = tournamentID,
                        Team1ID      = null,  // chờ winner từ vòng trước
                        Team2ID      = null,
                        Status       = "Scheduled",
                        IsBye        = false,
                        Round        = r,
                        MatchOrder   = i + 1
                    };
                    currentRound.Add(m);
                }
                roundMatches.Add(currentRound);
            }

            // Gộp tất cả thành 1 list theo thứ tự Round → MatchOrder
            foreach (var rnd in roundMatches)
                allMatches.AddRange(rnd);

            // Bước 4: Thiết lập NextMatchID và NextMatchSlot
            // Logic: mỗi 2 trận liên tiếp trong vòng R → winner vào cùng 1 trận vòng R+1
            for (int r = 0; r < roundMatches.Count - 1; r++)
            {
                var current = roundMatches[r];
                var next    = roundMatches[r + 1];

                for (int i = 0; i < current.Count; i++)
                {
                    int nextMatchIdx  = i / 2;           // 2 trận feed vào 1 trận kế
                    int slot          = (i % 2 == 0) ? 1 : 2;  // slot 1 hoặc 2

                    current[i].NextMatchID   = -1;        // placeholder — sẽ được BracketDAL điền MatchID thực
                    current[i].NextMatchSlot = slot;

                    // Dùng MatchOrder của next match làm key mapping
                    current[i].NextMatchID = -(nextMatchIdx + 1); // âm để BracketDAL nhận dạng là index
                }
            }

            // Mapping: thực sự điền NextMatchID dựa trên index trong roundMatches + 1
            // (BracketDAL sẽ nhận các MatchDTO và tự điền sau khi INSERT xong)
            // Reset về null, dùng helper property để track
            foreach (var m in allMatches) m.NextMatchID = null;

            // Associate next match references using in-memory indices trước khi save
            for (int r = 0; r < roundMatches.Count - 1; r++)
            {
                var current = roundMatches[r];
                var next    = roundMatches[r + 1];
                for (int i = 0; i < current.Count; i++)
                {
                    int ni   = i / 2;
                    int slot = (i % 2 == 0) ? 1 : 2;

                    // Đặt NextMatchReference bằng cách map vào đối tượng (chưa có MatchID)
                    // BracketDAL sẽ xử lý sau INSERT (2-phase save)
                    current[i].NextMatchSlot = slot;

                    // Store cross-reference bằng MatchOrder và Round
                    if (ni < next.Count)
                    {
                        // Tag reference: Round + MatchOrder của next match
                        next[ni]._parentRound     = r + 2;
                        next[ni]._parentMatchOrder = ni + 1;
                        current[i]._nextRound      = r + 2;
                        current[i]._nextMatchOrder  = ni + 1;
                    }
                }
            }

            // Bước 5: Gọi DAL lưu — DAL tự ghép NextMatchID sau INSERT
            bool ok = _dal.SaveBracketWithRefs(allMatches);
            return ok
                ? (true, $"Đã tạo bracket thành công! {allMatches.Count} trận, {rounds} vòng, {byeCount} Bye.")
                : (false, "Lỗi khi lưu bracket vào Database. Vui lòng thử lại.");
        }

        public List<MatchDTO> GetBracket(int tournamentID) => _dal.GetBracket(tournamentID);

        public (bool ok, string msg) ResetBracket(int tournamentID)
        {
            try { _dal.DeleteBracket(tournamentID); return (true, ""); }
            catch (Exception ex) { return (false, ex.Message); }
        }

        // ── Helpers ──────────────────────────────────────────────────────────────

        /// <summary>Fisher-Yates shuffle (in-place).</summary>
        private static void Shuffle(List<TeamDTO> list)
        {
            var rng = new Random();
            for (int i = list.Count - 1; i > 0; i--)
            {
                int j = rng.Next(i + 1);
                (list[i], list[j]) = (list[j], list[i]);
            }
        }

        /// <summary>Lũy thừa 2 nhỏ nhất ≥ n.</summary>
        public static int NextPowerOf2(int n)
        {
            if (n <= 0) return 1;
            int p = 1;
            while (p < n) p <<= 1;
            return p;
        }

        /// <summary>Số vòng = log2(slots).</summary>
        public static int TotalRounds(int teamCount) =>
            (int)Math.Log2(NextPowerOf2(teamCount));
    }
}
