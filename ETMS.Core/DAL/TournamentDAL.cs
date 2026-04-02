using Microsoft.Data.SqlClient;
using ETMS.DTO;

namespace ETMS.DAL
{
    /// <summary>
    /// TournamentDAL — CRUD cho tblTournament.
    /// Lưu ý: Cột GameName và Description được đảm bảo tồn tại bởi auto-migration trong Program.cs.
    /// </summary>
    public class TournamentDAL
    {
        private const string SelectCols = @"
            TournamentID, Name, GameType, Format, Status,
            MaxTeams, MinPlayersPerTeam, StartDate, EndDate,
            CreatedBy, CreatedAt, GameName, Description";

        public List<TournamentDTO> GetAll()
        {
            var list = new List<TournamentDTO>();
            using var conn = DBConnection.GetConnection();
            conn.Open();
            string sql = $"SELECT {SelectCols} FROM tblTournament ORDER BY CreatedAt DESC";
            using var cmd = new SqlCommand(sql, conn);
            using var dr = cmd.ExecuteReader();
            while (dr.Read()) list.Add(MapDTO(dr));
            return list;
        }

        public TournamentDTO? GetByID(int id)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            string sql = $"SELECT {SelectCols} FROM tblTournament WHERE TournamentID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);
            using var dr = cmd.ExecuteReader();
            return dr.Read() ? MapDTO(dr) : null;
        }

        public int Insert(TournamentDTO dto)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                INSERT INTO tblTournament
                    (Name, GameType, GameName, Format, Status,
                     MaxTeams, MinPlayersPerTeam, StartDate, EndDate,
                     CreatedBy, Description)
                VALUES
                    (@n, @gt, @gn, @fmt, @st,
                     @mt, @mp, @sd, @ed,
                     @cb, @desc);
                SELECT SCOPE_IDENTITY();";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@n",    dto.Name);
            cmd.Parameters.AddWithValue("@gt",   dto.GameType);
            cmd.Parameters.AddWithValue("@gn",   (object?)dto.GameName    ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@fmt",  dto.Format);
            cmd.Parameters.AddWithValue("@st",   dto.Status);
            cmd.Parameters.AddWithValue("@mt",   dto.MaxTeams);
            cmd.Parameters.AddWithValue("@mp",   dto.MinPlayersPerTeam);
            cmd.Parameters.AddWithValue("@sd",   (object?)dto.StartDate   ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ed",   (object?)dto.EndDate     ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@cb",   dto.CreatedBy);
            cmd.Parameters.AddWithValue("@desc", (object?)dto.Description ?? DBNull.Value);
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public void UpdateStatus(int id, string status)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = "UPDATE tblTournament SET Status=@s WHERE TournamentID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@s",  status);
            cmd.Parameters.AddWithValue("@id", id);
            cmd.ExecuteNonQuery();
        }

        public void Update(TournamentDTO dto)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                UPDATE tblTournament
                SET Name=@n, GameType=@gt, GameName=@gn, Format=@fmt,
                    MaxTeams=@mt, MinPlayersPerTeam=@mp,
                    StartDate=@sd, EndDate=@ed,
                    Description=@desc
                WHERE TournamentID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@n",    dto.Name);
            cmd.Parameters.AddWithValue("@gt",   dto.GameType);
            cmd.Parameters.AddWithValue("@gn",   (object?)dto.GameName    ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@fmt",  dto.Format);
            cmd.Parameters.AddWithValue("@mt",   dto.MaxTeams);
            cmd.Parameters.AddWithValue("@mp",   dto.MinPlayersPerTeam);
            cmd.Parameters.AddWithValue("@sd",   (object?)dto.StartDate   ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ed",   (object?)dto.EndDate     ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@desc", (object?)dto.Description ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@id",   dto.TournamentID);
            cmd.ExecuteNonQuery();
        }

        public void Delete(int id)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = "DELETE FROM tblTournament WHERE TournamentID=@id AND Status='Draft'";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);
            cmd.ExecuteNonQuery();
        }

        private static TournamentDTO MapDTO(SqlDataReader dr) => new TournamentDTO
        {
            TournamentID      = dr.GetInt32(0),
            Name              = dr.GetString(1),
            GameType          = dr.GetString(2),
            Format            = dr.GetString(3),
            Status            = dr.GetString(4),
            MaxTeams          = dr.GetInt32(5),
            MinPlayersPerTeam = dr.GetInt32(6),
            StartDate         = dr.IsDBNull(7)  ? null : dr.GetDateTime(7),
            EndDate           = dr.IsDBNull(8)  ? null : dr.GetDateTime(8),
            CreatedBy         = dr.IsDBNull(9)  ? null : dr.GetInt32(9),
            CreatedAt         = dr.GetDateTime(10),
            GameName          = dr.IsDBNull(11) ? null : dr.GetString(11),
            Description       = dr.IsDBNull(12) ? null : dr.GetString(12),
        };
    }
}
