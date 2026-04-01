using Microsoft.Data.SqlClient;
using ETMS.DTO;

namespace ETMS.DAL
{
    public class ResultDAL
    {
        public int SaveResult(MatchResultDTO dto)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            // Nếu đã có result cho match này thì UPDATE, ngược lại INSERT (UPSERT)
            const string sql = @"
                IF EXISTS (SELECT 1 FROM tblMatchResult WHERE MatchID=@mid)
                    UPDATE tblMatchResult
                    SET Score1=@s1,Score2=@s2,EvidenceURL=@ev,
                        Status='PendingVerification',SubmittedBy=@sub,SubmittedAt=GETDATE()
                    WHERE MatchID=@mid
                ELSE
                    INSERT INTO tblMatchResult (MatchID,Score1,Score2,EvidenceURL,Status,SubmittedBy)
                    VALUES (@mid,@s1,@s2,@ev,'PendingVerification',@sub);
                SELECT ISNULL((SELECT ResultID FROM tblMatchResult WHERE MatchID=@mid),0);";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@mid", dto.MatchID);
            cmd.Parameters.AddWithValue("@s1",  dto.Score1);
            cmd.Parameters.AddWithValue("@s2",  dto.Score2);
            cmd.Parameters.AddWithValue("@ev",  (object?)dto.EvidenceURL ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@sub", (object?)dto.SubmittedBy ?? DBNull.Value);
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public MatchResultDTO? GetByResultID(int resultID)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT ResultID,MatchID,Score1,Score2,EvidenceURL,Status,
                       SubmittedBy,VerifiedBy,SubmittedAt,VerifiedAt
                FROM tblMatchResult WHERE ResultID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", resultID);
            using var dr = cmd.ExecuteReader();
            if (!dr.Read()) return null;
            return new MatchResultDTO
            {
                ResultID    = dr.GetInt32(0),
                MatchID     = dr.GetInt32(1),
                Score1      = dr.GetInt32(2),
                Score2      = dr.GetInt32(3),
                EvidenceURL = dr.IsDBNull(4) ? null : dr.GetString(4),
                Status      = dr.GetString(5),
                SubmittedBy = dr.IsDBNull(6) ? null : dr.GetInt32(6),
                VerifiedBy  = dr.IsDBNull(7) ? null : dr.GetInt32(7),
                SubmittedAt = dr.GetDateTime(8),
                VerifiedAt  = dr.IsDBNull(9) ? null : dr.GetDateTime(9)
            };
        }

        public MatchResultDTO? GetByMatch(int matchID)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT ResultID,MatchID,Score1,Score2,EvidenceURL,Status,
                       SubmittedBy,VerifiedBy,SubmittedAt,VerifiedAt
                FROM tblMatchResult WHERE MatchID=@mid";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@mid", matchID);
            using var dr = cmd.ExecuteReader();
            if (!dr.Read()) return null;
            return new MatchResultDTO
            {
                ResultID    = dr.GetInt32(0),
                MatchID     = dr.GetInt32(1),
                Score1      = dr.GetInt32(2),
                Score2      = dr.GetInt32(3),
                EvidenceURL = dr.IsDBNull(4) ? null : dr.GetString(4),
                Status      = dr.GetString(5),
                SubmittedBy = dr.IsDBNull(6) ? null : dr.GetInt32(6),
                VerifiedBy  = dr.IsDBNull(7) ? null : dr.GetInt32(7),
                SubmittedAt = dr.GetDateTime(8),
                VerifiedAt  = dr.IsDBNull(9) ? null : dr.GetDateTime(9)
            };
        }

        public List<MatchResultDTO> GetPendingVerification(int tournamentID)
        {
            var list = new List<MatchResultDTO>();
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT r.ResultID,r.MatchID,r.Score1,r.Score2,r.EvidenceURL,r.Status,
                       r.SubmittedBy,r.VerifiedBy,r.SubmittedAt,r.VerifiedAt
                FROM tblMatchResult r
                INNER JOIN tblMatch m ON m.MatchID = r.MatchID
                WHERE m.TournamentID = @tid AND r.Status = 'PendingVerification'
                ORDER BY r.SubmittedAt";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@tid", tournamentID);
            using var dr = cmd.ExecuteReader();
            while (dr.Read())
                list.Add(new MatchResultDTO
                {
                    ResultID    = dr.GetInt32(0),
                    MatchID     = dr.GetInt32(1),
                    Score1      = dr.GetInt32(2),
                    Score2      = dr.GetInt32(3),
                    EvidenceURL = dr.IsDBNull(4) ? null : dr.GetString(4),
                    Status      = dr.GetString(5),
                    SubmittedBy = dr.IsDBNull(6) ? null : dr.GetInt32(6),
                    VerifiedBy  = dr.IsDBNull(7) ? null : dr.GetInt32(7),
                    SubmittedAt = dr.GetDateTime(8),
                    VerifiedAt  = dr.IsDBNull(9) ? null : dr.GetDateTime(9)
                });
            return list;
        }

        public void UpdateStatus(int resultID, string status, int verifiedBy)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            const string sql = @"
                UPDATE tblMatchResult
                SET Status=@s, VerifiedBy=@vb, VerifiedAt=GETDATE()
                WHERE ResultID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@s",  status);
            cmd.Parameters.AddWithValue("@vb", verifiedBy);
            cmd.Parameters.AddWithValue("@id", resultID);
            cmd.ExecuteNonQuery();
        }
    }
}
