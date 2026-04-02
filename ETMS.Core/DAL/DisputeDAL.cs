using Microsoft.Data.SqlClient;
using ETMS.DTO;

namespace ETMS.DAL
{
    /// <summary>
    /// DisputeDAL — FR-8: Hệ thống Khiếu nại.
    /// CRUD operations cho tblDispute với Parameterized Queries (NFR-1).
    /// </summary>
    public class DisputeDAL
    {
        public int Insert(DisputeDTO dto)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                INSERT INTO tblDispute (MatchID,FiledByTeamID,Description,EvidenceURL)
                VALUES (@mid,@tid,@desc,@ev);
                SELECT SCOPE_IDENTITY();";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@mid",  dto.MatchID);
            cmd.Parameters.AddWithValue("@tid",  dto.FiledByTeamID);
            cmd.Parameters.AddWithValue("@desc", dto.Description);
            cmd.Parameters.AddWithValue("@ev",   (object?)dto.EvidenceURL ?? DBNull.Value);
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public List<DisputeDTO> GetByTournament(int tournamentID)
        {
            var list = new List<DisputeDTO>();
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT d.DisputeID, d.MatchID, d.FiledByTeamID, t.Name AS TeamName,
                       d.Description, d.EvidenceURL, d.Status, d.AdminNote,
                       d.CreatedAt, d.ResolvedAt
                FROM tblDispute d
                INNER JOIN tblMatch m  ON m.MatchID = d.MatchID
                INNER JOIN tblTeam t   ON t.TeamID  = d.FiledByTeamID
                WHERE m.TournamentID = @tid
                ORDER BY d.CreatedAt DESC";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@tid", tournamentID);
            using var dr = cmd.ExecuteReader();
            while (dr.Read())
                list.Add(MapDTO(dr));
            return list;
        }

        public List<DisputeDTO> GetAll()
        {
            var list = new List<DisputeDTO>();
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT d.DisputeID, d.MatchID, d.FiledByTeamID, t.Name AS TeamName,
                       d.Description, d.EvidenceURL, d.Status, d.AdminNote,
                       d.CreatedAt, d.ResolvedAt
                FROM tblDispute d
                INNER JOIN tblTeam t ON t.TeamID = d.FiledByTeamID
                ORDER BY d.CreatedAt DESC";
            using var cmd = new SqlCommand(sql, conn);
            using var dr = cmd.ExecuteReader();
            while (dr.Read()) list.Add(MapDTO(dr));
            return list;
        }

        public DisputeDTO? GetByID(int disputeID)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT d.DisputeID, d.MatchID, d.FiledByTeamID, t.Name AS TeamName,
                       d.Description, d.EvidenceURL, d.Status, d.AdminNote,
                       d.CreatedAt, d.ResolvedAt
                FROM tblDispute d
                INNER JOIN tblTeam t ON t.TeamID = d.FiledByTeamID
                WHERE d.DisputeID = @id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", disputeID);
            using var dr = cmd.ExecuteReader();
            return dr.Read() ? MapDTO(dr) : null;
        }

        public void Resolve(int disputeID, string adminNote)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                UPDATE tblDispute
                SET Status='Resolved', AdminNote=@note, ResolvedAt=GETDATE()
                WHERE DisputeID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@note", adminNote);
            cmd.Parameters.AddWithValue("@id",   disputeID);
            cmd.ExecuteNonQuery();
        }

        public void Dismiss(int disputeID, string adminNote)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                UPDATE tblDispute
                SET Status='Dismissed', AdminNote=@note, ResolvedAt=GETDATE()
                WHERE DisputeID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@note", adminNote);
            cmd.Parameters.AddWithValue("@id",   disputeID);
            cmd.ExecuteNonQuery();
        }

        private static DisputeDTO MapDTO(SqlDataReader dr) => new DisputeDTO
        {
            DisputeID       = dr.GetInt32(0),
            MatchID         = dr.GetInt32(1),
            FiledByTeamID   = dr.GetInt32(2),
            FiledByTeamName = dr.GetString(3),
            Description     = dr.GetString(4),
            EvidenceURL     = dr.IsDBNull(5) ? null : dr.GetString(5),
            Status          = dr.GetString(6),
            AdminNote       = dr.IsDBNull(7) ? null : dr.GetString(7),
            CreatedAt       = dr.GetDateTime(8),
            ResolvedAt      = dr.IsDBNull(9) ? null : dr.GetDateTime(9)
        };
    }
}
