using Microsoft.Data.SqlClient;
using ETMS.DTO;

namespace ETMS.DAL
{
    public class TeamDAL
    {
        public List<TeamDTO> GetByTournament(int tournamentID)
        {
            var list = new List<TeamDTO>();
            using var conn = DBConnection.GetConnection();
            conn.Open();
            // Fix: tblTeam uses Logo (not LogoURL), SubmittedAt (not CreatedAt)
            string sql = tournamentID == 0
                ? @"SELECT t.TeamID, t.TournamentID, t.Name, t.Logo,
                           t.CaptainID, u.FullName AS CaptainName,
                           t.Status, t.RejectionReason, t.SubmittedAt,
                           COUNT(p.PlayerID) AS PlayerCount
                    FROM tblTeam t
                    LEFT JOIN tblUser u   ON u.UserID = t.CaptainID
                    LEFT JOIN tblPlayer p ON p.TeamID = t.TeamID AND p.IsActive = 1
                    GROUP BY t.TeamID, t.TournamentID, t.Name, t.Logo,
                             t.CaptainID, u.FullName, t.Status, t.RejectionReason, t.SubmittedAt
                    ORDER BY t.SubmittedAt DESC"
                : @"SELECT t.TeamID, t.TournamentID, t.Name, t.Logo,
                           t.CaptainID, u.FullName AS CaptainName,
                           t.Status, t.RejectionReason, t.SubmittedAt,
                           COUNT(p.PlayerID) AS PlayerCount
                    FROM tblTeam t
                    LEFT JOIN tblUser u   ON u.UserID = t.CaptainID
                    LEFT JOIN tblPlayer p ON p.TeamID = t.TeamID AND p.IsActive = 1
                    WHERE t.TournamentID = @tid
                    GROUP BY t.TeamID, t.TournamentID, t.Name, t.Logo,
                             t.CaptainID, u.FullName, t.Status, t.RejectionReason, t.SubmittedAt
                    ORDER BY t.SubmittedAt DESC";
            using var cmd = new SqlCommand(sql, conn);
            if (tournamentID != 0) cmd.Parameters.AddWithValue("@tid", tournamentID);
            using var dr = cmd.ExecuteReader();
            while (dr.Read())
                list.Add(MapTeam(dr));
            return list;
        }

        public List<TeamDTO> GetApprovedTeams(int tournamentID)
        {
            var list = new List<TeamDTO>();
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT t.TeamID, t.TournamentID, t.Name, t.Logo,
                       t.CaptainID, u.FullName AS CaptainName,
                       t.Status, t.RejectionReason, t.SubmittedAt,
                       COUNT(p.PlayerID) AS PlayerCount
                FROM tblTeam t
                LEFT JOIN tblUser u   ON u.UserID = t.CaptainID
                LEFT JOIN tblPlayer p ON p.TeamID = t.TeamID AND p.IsActive = 1
                WHERE t.TournamentID = @tid AND t.Status = 'Approved'
                GROUP BY t.TeamID, t.TournamentID, t.Name, t.Logo,
                         t.CaptainID, u.FullName, t.Status, t.RejectionReason, t.SubmittedAt
                ORDER BY t.TeamID";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@tid", tournamentID);
            using var dr = cmd.ExecuteReader();
            while (dr.Read())
                list.Add(MapTeam(dr));
            return list;
        }

        public TeamDTO? GetByID(int teamID)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT t.TeamID, t.TournamentID, t.Name, t.Logo,
                       t.CaptainID, u.FullName AS CaptainName,
                       t.Status, t.RejectionReason, t.SubmittedAt,
                       COUNT(p.PlayerID) AS PlayerCount
                FROM tblTeam t
                LEFT JOIN tblUser u   ON u.UserID = t.CaptainID
                LEFT JOIN tblPlayer p ON p.TeamID = t.TeamID AND p.IsActive = 1
                WHERE t.TeamID = @id
                GROUP BY t.TeamID, t.TournamentID, t.Name, t.Logo,
                         t.CaptainID, u.FullName, t.Status, t.RejectionReason, t.SubmittedAt";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", teamID);
            using var dr = cmd.ExecuteReader();
            return dr.Read() ? MapTeam(dr) : null;
        }

        public int InsertTeam(TeamDTO dto)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            // Fix: tblTeam uses Logo (not LogoURL), no CreatedAt (auto GETDATE)
            const string sql = @"
                INSERT INTO tblTeam (TournamentID, Name, Logo, CaptainID, Status)
                VALUES (@tid, @name, @logo, @cap, 'Pending');
                SELECT SCOPE_IDENTITY();";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@tid",  dto.TournamentID);
            cmd.Parameters.AddWithValue("@name", dto.Name);
            cmd.Parameters.AddWithValue("@logo", (object?)dto.LogoURL ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@cap",  dto.CaptainID);
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public void UpdateStatus(int teamID, string status, string? rejectionReason = null)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                UPDATE tblTeam
                SET Status = @s, RejectionReason = @r
                WHERE TeamID = @id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@s",  status);
            cmd.Parameters.AddWithValue("@r",  (object?)rejectionReason ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@id", teamID);
            cmd.ExecuteNonQuery();
        }

        // ---------- Players ----------

        public List<PlayerDTO> GetPlayers(int teamID)
        {
            var list = new List<PlayerDTO>();
            using var conn = DBConnection.GetConnection();
            conn.Open();
            // Fix: tblPlayer does NOT have FullName column (only UserID, InGameID, IsActive)
            const string sql = @"
                SELECT p.PlayerID, p.TeamID, p.UserID, u.FullName, p.InGameID, p.IsActive
                FROM tblPlayer p
                LEFT JOIN tblUser u ON u.UserID = p.UserID
                WHERE p.TeamID = @tid AND p.IsActive = 1";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@tid", teamID);
            using var dr = cmd.ExecuteReader();
            while (dr.Read())
                list.Add(new PlayerDTO
                {
                    PlayerID = dr.GetInt32(0),
                    TeamID   = dr.GetInt32(1),
                    UserID   = dr.IsDBNull(2) ? null : dr.GetInt32(2),
                    FullName = dr.IsDBNull(3) ? "" : dr.GetString(3),
                    InGameID = dr.GetString(4),
                    IsActive = dr.GetBoolean(5)
                });
            return list;
        }

        /// <summary>
        /// Kiểm tra xem InGameID đã tồn tại trong đội khác của cùng Tournament chưa.
        /// NFR-SRS: Một thành viên không thuộc 2 đội cùng giải.
        /// </summary>
        public bool IsPlayerInOtherTeam(string inGameID, int tournamentID, int excludeTeamID = 0)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT COUNT(1)
                FROM tblPlayer p
                INNER JOIN tblTeam t ON t.TeamID = p.TeamID
                WHERE p.InGameID = @ign
                  AND t.TournamentID = @tid
                  AND p.IsActive = 1
                  AND t.Status != 'Rejected'
                  AND t.TeamID != @excl";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@ign",  inGameID);
            cmd.Parameters.AddWithValue("@tid",  tournamentID);
            cmd.Parameters.AddWithValue("@excl", excludeTeamID);
            return (int)cmd.ExecuteScalar() > 0;
        }

        public int AddPlayer(PlayerDTO dto)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                INSERT INTO tblPlayer (TeamID,UserID,FullName,InGameID)
                VALUES (@tid,@uid,@fn,@ign);
                SELECT SCOPE_IDENTITY();";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@tid", dto.TeamID);
            cmd.Parameters.AddWithValue("@uid", (object?)dto.UserID ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@fn",  dto.FullName);
            cmd.Parameters.AddWithValue("@ign", dto.InGameID);
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public void RemovePlayer(int playerID)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = "UPDATE tblPlayer SET IsActive=0 WHERE PlayerID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", playerID);
            cmd.ExecuteNonQuery();
        }

        // ---------- Mapping Helper ----------
        private static TeamDTO MapTeam(SqlDataReader dr) => new TeamDTO
        {
            TeamID          = dr.GetInt32(0),
            TournamentID    = dr.GetInt32(1),
            Name            = dr.GetString(2),
            LogoURL         = dr.IsDBNull(3) ? null : dr.GetString(3),
            CaptainID       = dr.GetInt32(4),
            CaptainName     = dr.IsDBNull(5) ? "" : dr.GetString(5),
            Status          = dr.GetString(6),
            RejectionReason = dr.IsDBNull(7) ? null : dr.GetString(7),
            CreatedAt       = dr.GetDateTime(8),
            PlayerCount     = dr.GetInt32(9)
        };
    }
}
