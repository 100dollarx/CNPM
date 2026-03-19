using Microsoft.Data.SqlClient;
using ETMS.DTO;

namespace ETMS.DAL
{
    public class TournamentDAL
    {
        public List<TournamentDTO> GetAll()
        {
            var list = new List<TournamentDTO>();
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT TournamentID,Name,GameType,Format,Status,
                       MaxTeams,MinPlayersPerTeam,StartDate,EndDate,CreatedBy,CreatedAt
                FROM tblTournament ORDER BY CreatedAt DESC";
            using var cmd = new SqlCommand(sql, conn);
            using var dr = cmd.ExecuteReader();
            while (dr.Read()) list.Add(MapDTO(dr));
            return list;
        }

        public TournamentDTO? GetByID(int id)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT TournamentID,Name,GameType,Format,Status,
                       MaxTeams,MinPlayersPerTeam,StartDate,EndDate,CreatedBy,CreatedAt
                FROM tblTournament WHERE TournamentID=@id";
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
                    (Name,GameType,Format,Status,MaxTeams,MinPlayersPerTeam,StartDate,EndDate,CreatedBy)
                VALUES (@n,@gt,@fmt,@st,@mt,@mp,@sd,@ed,@cb);
                SELECT SCOPE_IDENTITY();";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@n",   dto.Name);
            cmd.Parameters.AddWithValue("@gt",  dto.GameType);
            cmd.Parameters.AddWithValue("@fmt", dto.Format);
            cmd.Parameters.AddWithValue("@st",  dto.Status);
            cmd.Parameters.AddWithValue("@mt",  dto.MaxTeams);
            cmd.Parameters.AddWithValue("@mp",  dto.MinPlayersPerTeam);
            cmd.Parameters.AddWithValue("@sd",  (object?)dto.StartDate ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ed",  (object?)dto.EndDate   ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@cb",  dto.CreatedBy);
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

        private static TournamentDTO MapDTO(SqlDataReader dr) => new TournamentDTO
        {
            TournamentID      = dr.GetInt32(0),
            Name              = dr.GetString(1),
            GameType          = dr.GetString(2),
            Format            = dr.GetString(3),
            Status            = dr.GetString(4),
            MaxTeams          = dr.GetInt32(5),
            MinPlayersPerTeam = dr.GetInt32(6),
            StartDate         = dr.IsDBNull(7) ? null : dr.GetDateTime(7),
            EndDate           = dr.IsDBNull(8) ? null : dr.GetDateTime(8),
            CreatedBy         = dr.GetInt32(9),
            CreatedAt         = dr.GetDateTime(10)
        };
    }
}
