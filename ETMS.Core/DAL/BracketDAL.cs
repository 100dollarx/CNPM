using Microsoft.Data.SqlClient;
using ETMS.DTO;

namespace ETMS.DAL
{
    public class BracketDAL
    {
        /// <summary>
        /// Lưu bracket với 2-phase approach:
        /// Phase 1: INSERT tất cả matches → nhận MatchID thực.
        /// Phase 2: Ghép NextMatchID dựa trên _nextRound/_nextMatchOrder.
        /// Toàn bộ trong 1 TRANSACTION ← NFR-2.
        /// </summary>
        public bool SaveBracketWithRefs(List<MatchDTO> matches)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            var trans = conn.BeginTransaction(System.Data.IsolationLevel.Serializable);
            try
            {
                // Phase 1: INSERT tất cả matches
                const string insertSql = @"
                    INSERT INTO tblMatch
                        (TournamentID,Team1ID,Team2ID,WinnerID,Status,
                         ScheduledTime,Round,MatchOrder,IsBye,NextMatchID,NextMatchSlot)
                    VALUES (@tid,@t1,@t2,@win,@st,@sch,@rnd,@ord,@bye,NULL,NULL);
                    SELECT SCOPE_IDENTITY();";

                foreach (var m in matches)
                {
                    using var cmd = new SqlCommand(insertSql, conn, trans);
                    cmd.Parameters.AddWithValue("@tid", m.TournamentID);
                    cmd.Parameters.AddWithValue("@t1",  (object?)m.Team1ID  ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@t2",  (object?)m.Team2ID  ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@win", (object?)m.WinnerID ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@st",  m.Status);
                    cmd.Parameters.AddWithValue("@sch", (object?)m.ScheduledTime ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@rnd", m.Round);
                    cmd.Parameters.AddWithValue("@ord", m.MatchOrder);
                    cmd.Parameters.AddWithValue("@bye", m.IsBye ? 1 : 0);
                    m.MatchID = Convert.ToInt32(cmd.ExecuteScalar());
                }

                // Phase 2: Build lookup Round+Order → MatchID
                var lookup = matches.ToDictionary(m => (m.Round, m.MatchOrder), m => m.MatchID);

                // Phase 3: UPDATE NextMatchID
                const string updateSql = @"
                    UPDATE tblMatch SET NextMatchID=@nxt, NextMatchSlot=@slot WHERE MatchID=@id";

                foreach (var m in matches)
                {
                    if (m._nextRound > 0 && m._nextMatchOrder > 0)
                    {
                        var key = (m._nextRound, m._nextMatchOrder);
                        if (lookup.TryGetValue(key, out int nextID))
                        {
                            using var cmd = new SqlCommand(updateSql, conn, trans);
                            cmd.Parameters.AddWithValue("@nxt",  nextID);
                            cmd.Parameters.AddWithValue("@slot", m.NextMatchSlot ?? 1);
                            cmd.Parameters.AddWithValue("@id",   m.MatchID);
                            cmd.ExecuteNonQuery();
                        }
                    }
                }

                trans.Commit();
                return true;
            }
            catch { trans.Rollback(); return false; }
        }

        public List<MatchDTO> GetBracket(int tournamentID)
        {
            var list = new List<MatchDTO>();
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT m.MatchID, m.TournamentID,
                       m.Team1ID, t1.Name AS Team1Name,
                       m.Team2ID, t2.Name AS Team2Name,
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
            while (dr.Read())
                list.Add(MapMatch(dr));
            return list;
        }

        public bool HasBracket(int tournamentID)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = "SELECT COUNT(1) FROM tblMatch WHERE TournamentID=@tid";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@tid", tournamentID);
            return (int)cmd.ExecuteScalar() > 0;
        }

        public void DeleteBracket(int tournamentID)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            var trans = conn.BeginTransaction();
            try
            {
                // Xóa dependent tables trước
                new SqlCommand("DELETE FROM tblMatchResult WHERE MatchID IN (SELECT MatchID FROM tblMatch WHERE TournamentID=@tid)", conn, trans)
                    { Parameters = { new("@tid", tournamentID) } }.ExecuteNonQuery();
                new SqlCommand("DELETE FROM tblMapVeto WHERE MatchID IN (SELECT MatchID FROM tblMatch WHERE TournamentID=@tid)", conn, trans)
                    { Parameters = { new("@tid", tournamentID) } }.ExecuteNonQuery();
                // Clear self-referencing FK trước
                new SqlCommand("UPDATE tblMatch SET NextMatchID=NULL WHERE TournamentID=@tid", conn, trans)
                    { Parameters = { new("@tid", tournamentID) } }.ExecuteNonQuery();
                new SqlCommand("DELETE FROM tblMatch WHERE TournamentID=@tid", conn, trans)
                    { Parameters = { new("@tid", tournamentID) } }.ExecuteNonQuery();
                trans.Commit();
            }
            catch { trans.Rollback(); throw; }
        }

        private static MatchDTO MapMatch(SqlDataReader dr) => new MatchDTO
        {
            MatchID          = dr.GetInt32(0),
            TournamentID     = dr.GetInt32(1),
            Team1ID          = dr.IsDBNull(2)  ? null : dr.GetInt32(2),
            Team1Name        = dr.IsDBNull(3)  ? "TBD" : dr.GetString(3),
            Team2ID          = dr.IsDBNull(4)  ? null : dr.GetInt32(4),
            Team2Name        = dr.IsDBNull(5)  ? "TBD" : dr.GetString(5),
            WinnerID         = dr.IsDBNull(6)  ? null : dr.GetInt32(6),
            LoserID          = dr.IsDBNull(7)  ? null : dr.GetInt32(7),
            Status           = dr.GetString(8),
            ScheduledTime    = dr.IsDBNull(9)  ? null : dr.GetDateTime(9),
            ActualStartTime  = dr.IsDBNull(10) ? null : dr.GetDateTime(10),
            CheckIn1         = dr.GetBoolean(11),
            CheckIn2         = dr.GetBoolean(12),
            NextMatchID      = dr.IsDBNull(13) ? null : dr.GetInt32(13),
            NextMatchSlot    = dr.IsDBNull(14) ? null : dr.GetInt32(14),
            Round            = dr.GetInt32(15),
            MatchOrder       = dr.GetInt32(16),
            IsBye            = dr.GetBoolean(17)
        };
    }
}
