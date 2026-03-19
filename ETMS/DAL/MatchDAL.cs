using Microsoft.Data.SqlClient;
using ETMS.DTO;

namespace ETMS.DAL
{
    public class MatchDAL
    {
        public MatchDTO? GetByID(int matchID)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT m.MatchID, m.TournamentID,
                       m.Team1ID, t1.Name,
                       m.Team2ID, t2.Name,
                       m.WinnerID, m.LoserID,
                       m.Status, m.ScheduledTime, m.ActualStartTime,
                       m.CheckIn1, m.CheckIn2,
                       m.NextMatchID, m.NextMatchSlot,
                       m.Round, m.MatchOrder, m.IsBye
                FROM tblMatch m
                LEFT JOIN tblTeam t1 ON t1.TeamID = m.Team1ID
                LEFT JOIN tblTeam t2 ON t2.TeamID = m.Team2ID
                WHERE m.MatchID = @id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", matchID);
            using var dr = cmd.ExecuteReader();
            return dr.Read() ? MapMatch(dr) : null;
        }

        public List<MatchDTO> GetByTournament(int tournamentID)
        {
            var list = new List<MatchDTO>();
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT m.MatchID, m.TournamentID,
                       m.Team1ID, t1.Name,
                       m.Team2ID, t2.Name,
                       m.WinnerID, m.LoserID,
                       m.Status, m.ScheduledTime, m.ActualStartTime,
                       m.CheckIn1, m.CheckIn2,
                       m.NextMatchID, m.NextMatchSlot,
                       m.Round, m.MatchOrder, m.IsBye
                FROM tblMatch m
                LEFT JOIN tblTeam t1 ON t1.TeamID = m.Team1ID
                LEFT JOIN tblTeam t2 ON t2.TeamID = m.Team2ID
                WHERE m.TournamentID = @tid
                ORDER BY m.Round, m.MatchOrder";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@tid", tournamentID);
            using var dr = cmd.ExecuteReader();
            while (dr.Read()) list.Add(MapMatch(dr));
            return list;
        }

        public List<MatchDTO> GetPendingCheckIn(int tournamentID)
        {
            var list = new List<MatchDTO>();
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT m.MatchID, m.TournamentID,
                       m.Team1ID, t1.Name,
                       m.Team2ID, t2.Name,
                       m.WinnerID, m.LoserID,
                       m.Status, m.ScheduledTime, m.ActualStartTime,
                       m.CheckIn1, m.CheckIn2,
                       m.NextMatchID, m.NextMatchSlot,
                       m.Round, m.MatchOrder, m.IsBye
                FROM tblMatch m
                LEFT JOIN tblTeam t1 ON t1.TeamID = m.Team1ID
                LEFT JOIN tblTeam t2 ON t2.TeamID = m.Team2ID
                WHERE m.TournamentID = @tid
                  AND m.Status IN ('Scheduled','CheckInOpen')
                  AND m.IsBye = 0
                ORDER BY m.ScheduledTime";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@tid", tournamentID);
            using var dr = cmd.ExecuteReader();
            while (dr.Read()) list.Add(MapMatch(dr));
            return list;
        }

        public void SetScheduledTime(int matchID, DateTime scheduledTime)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = "UPDATE tblMatch SET ScheduledTime=@t WHERE MatchID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@t",  scheduledTime);
            cmd.Parameters.AddWithValue("@id", matchID);
            cmd.ExecuteNonQuery();
        }

        public void OpenCheckIn(int tournamentID)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            // Mở check-in cho các trận scheduled trong 15 phút tới
            const string sql = @"
                UPDATE tblMatch
                SET Status = 'CheckInOpen'
                WHERE TournamentID = @tid
                  AND Status = 'Scheduled'
                  AND IsBye = 0
                  AND ScheduledTime IS NOT NULL
                  AND ScheduledTime <= DATEADD(MINUTE, 15, GETDATE())
                  AND ScheduledTime > GETDATE()";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@tid", tournamentID);
            cmd.ExecuteNonQuery();
        }

        /// <summary>
        /// Cập nhật WinnerID và LoserID, đồng thời đẩy đội thắng vào match kế tiếp.
        /// Dùng SQL Transaction để đảm bảo nguyên tử. ← NFR-2 Data Integrity
        /// </summary>
        public bool SetWinnerAndAdvance(int matchID, int winnerID, int loserID, string status = "Completed")
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            var trans = conn.BeginTransaction(System.Data.IsolationLevel.Serializable);
            try
            {
                // 1. Lấy thông tin trận hiện tại
                int? nextMatchID = null;
                int? nextSlot = null;
                using (var cmd = new SqlCommand(
                    "SELECT NextMatchID, NextMatchSlot FROM tblMatch WHERE MatchID=@id", conn, trans))
                {
                    cmd.Parameters.AddWithValue("@id", matchID);
                    using var dr = cmd.ExecuteReader();
                    if (dr.Read())
                    {
                        nextMatchID = dr.IsDBNull(0) ? null : dr.GetInt32(0);
                        nextSlot    = dr.IsDBNull(1) ? null : dr.GetInt32(1);
                    }
                }

                // 2. Cập nhật kết quả trận hiện tại
                using (var cmd = new SqlCommand(@"
                    UPDATE tblMatch
                    SET WinnerID=@win, LoserID=@lose, Status=@st, ActualStartTime=GETDATE()
                    WHERE MatchID=@id", conn, trans))
                {
                    cmd.Parameters.AddWithValue("@win",  winnerID);
                    cmd.Parameters.AddWithValue("@lose", loserID);
                    cmd.Parameters.AddWithValue("@st",   status);
                    cmd.Parameters.AddWithValue("@id",   matchID);
                    cmd.ExecuteNonQuery();
                }

                // 3. Đẩy đội thắng vào slot tương ứng ở trận kế tiếp (Linked List advance)
                if (nextMatchID.HasValue && nextSlot.HasValue)
                {
                    string col = nextSlot.Value == 1 ? "Team1ID" : "Team2ID";
                    using var cmd = new SqlCommand(
                        $"UPDATE tblMatch SET {col}=@win WHERE MatchID=@nxt", conn, trans);
                    cmd.Parameters.AddWithValue("@win", winnerID);
                    cmd.Parameters.AddWithValue("@nxt", nextMatchID.Value);
                    cmd.ExecuteNonQuery();
                }

                trans.Commit();
                return true;
            }
            catch { trans.Rollback(); return false; }
        }

        private static MatchDTO MapMatch(SqlDataReader dr) => new MatchDTO
        {
            MatchID         = dr.GetInt32(0),
            TournamentID    = dr.GetInt32(1),
            Team1ID         = dr.IsDBNull(2)  ? null : dr.GetInt32(2),
            Team1Name       = dr.IsDBNull(3)  ? "TBD" : dr.GetString(3),
            Team2ID         = dr.IsDBNull(4)  ? null : dr.GetInt32(4),
            Team2Name       = dr.IsDBNull(5)  ? "TBD" : dr.GetString(5),
            WinnerID        = dr.IsDBNull(6)  ? null : dr.GetInt32(6),
            LoserID         = dr.IsDBNull(7)  ? null : dr.GetInt32(7),
            Status          = dr.GetString(8),
            ScheduledTime   = dr.IsDBNull(9)  ? null : dr.GetDateTime(9),
            ActualStartTime = dr.IsDBNull(10) ? null : dr.GetDateTime(10),
            CheckIn1        = dr.GetBoolean(11),
            CheckIn2        = dr.GetBoolean(12),
            NextMatchID     = dr.IsDBNull(13) ? null : dr.GetInt32(13),
            NextMatchSlot   = dr.IsDBNull(14) ? null : dr.GetInt32(14),
            Round           = dr.GetInt32(15),
            MatchOrder      = dr.GetInt32(16),
            IsBye           = dr.GetBoolean(17)
        };
    }
}
