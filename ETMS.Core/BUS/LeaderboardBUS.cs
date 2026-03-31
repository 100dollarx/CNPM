using System.Data;
using ETMS.DAL;

namespace ETMS.BUS
{
    public class LeaderboardBUS
    {
        private readonly LeaderboardDAL _leaderboardDAL = new();
        private readonly TournamentDAL _tournamentDAL = new();

        /// <summary>
        /// Tự động nội suy luật Ranking dựa trên Tournament Format.
        /// Chuyển tiếp DAL complex Ranking Query thành dạng Table cho Form hiển thị.
        /// </summary>
        public DataTable GetRanking(int tournamentID)
        {
            var tour = _tournamentDAL.GetByID(tournamentID);
            if (tour == null) return new DataTable(); // Trả về Table rỗng nếu Tournament không tồn tại

            // Đề tài 11 yêu cầu thuật toán phân hạng theo Format game
            if (tour.Format == "BattleRoyale")
            {
                // Gọi SQL Rank Tie-breaker (Tổng Điểm -> Đối Đầu -> Kill Points)
                return _leaderboardDAL.GetBattleRoyaleRanking(tournamentID);
            }
            else
            {
                // Mặc định cho SingleElimination và các loại đối kháng bình thường.
                // Ranking dựa trên Round bị loại cuối cùng.
                return _leaderboardDAL.GetSingleEliminationRanking(tournamentID);
            }
        }
    }
}
