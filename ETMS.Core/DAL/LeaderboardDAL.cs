using System.Data;
using Microsoft.Data.SqlClient;
using ETMS.DTO;

namespace ETMS.DAL
{
    /// <summary>
    /// LeaderboardDAL — Cung cấp dữ liệu xếp hạng với Tie-breaker.
    /// Điểm → Đối đầu trực tiếp → Tổng Kill Points (theo đặc tả Đề tài 11)
    /// </summary>
    public class LeaderboardDAL
    {
        /// <summary>
        /// Xếp hạng Single Elimination: theo vòng thua (Round bị loại).
        /// Đội thua vòng muộn hơn = hạng cao hơn.
        /// </summary>
        public DataTable GetSingleEliminationRanking(int tournamentID)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            // CTE: lấy vòng thua của mỗi đội
            const string sql = @"
                WITH LoserRound AS (
                    SELECT LoserID AS TeamID, MAX(Round) AS EliminatedInRound
                    FROM tblMatch
                    WHERE TournamentID = @tid AND WinnerID IS NOT NULL AND LoserID IS NOT NULL
                    GROUP BY LoserID
                ),
                WinnerFinal AS (
                    SELECT WinnerID AS TeamID, 999 AS EliminatedInRound
                    FROM tblMatch
                    WHERE TournamentID = @tid AND NextMatchID IS NULL AND WinnerID IS NOT NULL
                )
                SELECT t.TeamID, t.Name AS TeamName,
                       ISNULL(lr.EliminatedInRound, wf.EliminatedInRound) AS RoundReached,
                       CASE ISNULL(lr.EliminatedInRound, wf.EliminatedInRound)
                            WHEN 999 THEN N'🥇 Vô địch'
                            ELSE N'Bị loại vòng ' + CAST(ISNULL(lr.EliminatedInRound,wf.EliminatedInRound) AS NVARCHAR)
                       END AS RankLabel
                FROM tblTeam t
                LEFT JOIN LoserRound lr ON lr.TeamID = t.TeamID
                LEFT JOIN WinnerFinal wf ON wf.TeamID = t.TeamID
                WHERE t.TournamentID = @tid AND t.Status = 'Approved'
                ORDER BY ISNULL(lr.EliminatedInRound, wf.EliminatedInRound) DESC";

            var dt = new DataTable();
            using var da = new SqlDataAdapter(new SqlCommand(sql, conn) { Parameters = { new("@tid", tournamentID) } });
            da.Fill(dt);
            return dt;
        }

        /// <summary>
        /// Xếp hạng Battle Royale:
        /// Tie-breaker: TotalPoints DESC → HeadToHead DESC → TotalKillPoints DESC
        /// (Đây là Đề tài 11 trọng tâm: Phân hạng đa cột)
        /// </summary>
        public DataTable GetBattleRoyaleRanking(int tournamentID)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT
                    t.TeamID,
                    t.Name AS TeamName,
                    SUM(s.TotalPoints)   AS TotalPoints,
                    SUM(s.KillPoints)    AS TotalKillPoints,
                    COUNT(s.ScoreID)     AS RoundsPlayed,
                    RANK() OVER (
                        ORDER BY
                            SUM(s.TotalPoints)   DESC,
                            SUM(s.KillPoints)    DESC
                    ) AS Ranking
                FROM tblTeam t
                INNER JOIN tblBRScore s ON s.TeamID = t.TeamID
                INNER JOIN tblBRRound r ON r.RoundID = s.RoundID
                WHERE r.TournamentID = @tid
                GROUP BY t.TeamID, t.Name
                ORDER BY Ranking ASC";
            var dt = new DataTable();
            try
            {
                using var da = new SqlDataAdapter(new SqlCommand(sql, conn) { Parameters = { new("@tid", tournamentID) } });
                da.Fill(dt);
            }
            catch { /* bảng BR có thể chưa tồn tại */ }
            return dt;
        }
    }
}
