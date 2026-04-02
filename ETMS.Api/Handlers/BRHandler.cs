using ETMS.DAL;
using Microsoft.Data.SqlClient;

namespace ETMS.Api.Handlers;

/// <summary>
/// BRHandler — FR-14: Battle Royale scoring endpoints.
/// POST /api/br/rounds, POST /api/br/scores, GET /api/br/{tournamentId}/leaderboard
/// </summary>
public static class BRHandler
{
    /// <summary>Tạo một vòng Battle Royale mới cho giải đấu.</summary>
    public static IResult CreateRound(CreateBRRoundRequest req, HttpContext ctx)
    {
        ETMS.BUS.AuthBUS.SetCurrentUserFromToken(ctx.Request.Headers.Authorization);
        if (!ETMS.BUS.Session.IsAdmin)
            return Results.Json(new { error = "Chỉ Admin mới có thể tạo vòng BR." }, statusCode: 403);

        if (req.TournamentID <= 0 || req.RoundNumber <= 0)
            return Results.BadRequest(new { error = "TournamentID và RoundNumber phải lớn hơn 0." });

        using var conn = DBConnection.GetConnection();
        conn.Open();
        const string sql = @"
            INSERT INTO tblBRRound (TournamentID, RoundNumber, MapName, StartTime)
            OUTPUT INSERTED.BRRoundID
            VALUES (@tid, @rn, @map, @st)";
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@tid", req.TournamentID);
        cmd.Parameters.AddWithValue("@rn",  req.RoundNumber);
        cmd.Parameters.AddWithValue("@map", (object?)req.MapName ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@st",  (object?)req.StartTime ?? DBNull.Value);
        int newId = Convert.ToInt32(cmd.ExecuteScalar());
        return Results.Created($"/api/br/rounds/{newId}", new { brRoundId = newId, message = "Vòng BR đã được tạo." });
    }

    /// <summary>Nhập điểm cho một đội trong một vòng BR.</summary>
    public static IResult SubmitScore(SubmitBRScoreRequest req, HttpContext ctx)
    {
        ETMS.BUS.AuthBUS.SetCurrentUserFromToken(ctx.Request.Headers.Authorization);
        if (!ETMS.BUS.Session.IsAdmin)
            return Results.Json(new { error = "Chỉ Admin mới có thể nhập điểm BR." }, statusCode: 403);

        if (req.BRRoundID <= 0 || req.TeamID <= 0)
            return Results.BadRequest(new { error = "BRRoundID và TeamID không hợp lệ." });
        if (req.PlacementRank < 1)
            return Results.BadRequest(new { error = "PlacementRank phải >= 1." });
        if (req.KillCount < 0)
            return Results.BadRequest(new { error = "KillCount không được âm." });

        using var conn = DBConnection.GetConnection();
        conn.Open();
        // Upsert: nếu đã có score cho round+team thì update
        const string sql = @"
            IF EXISTS (SELECT 1 FROM tblBRScore WHERE BRRoundID=@rid AND TeamID=@tid)
                UPDATE tblBRScore SET PlacementRank=@pr, KillCount=@kc WHERE BRRoundID=@rid AND TeamID=@tid
            ELSE
                INSERT INTO tblBRScore (BRRoundID, TeamID, PlacementRank, KillCount)
                VALUES (@rid, @tid, @pr, @kc)";
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@rid", req.BRRoundID);
        cmd.Parameters.AddWithValue("@tid", req.TeamID);
        cmd.Parameters.AddWithValue("@pr",  req.PlacementRank);
        cmd.Parameters.AddWithValue("@kc",  req.KillCount);
        cmd.ExecuteNonQuery();
        return Results.Ok(new { brRoundId = req.BRRoundID, teamId = req.TeamID, status = "recorded" });
    }

    /// <summary>Lấy bảng tổng điểm BR của một giải đấu.</summary>
    public static IResult GetLeaderboard(int tournamentId)
    {
        using var conn = DBConnection.GetConnection();
        conn.Open();
        const string sql = @"
            SELECT t.TeamID, t.Name AS TeamName,
                   COUNT(DISTINCT bs.BRRoundID)  AS RoundsPlayed,
                   SUM(bs.KillCount)              AS TotalKills,
                   SUM(bs.TotalPoints)            AS TotalPoints,
                   MIN(bs.PlacementRank)          AS BestPlacement
            FROM tblBRScore bs
            INNER JOIN tblBRRound br ON br.BRRoundID = bs.BRRoundID
            INNER JOIN tblTeam    t  ON t.TeamID      = bs.TeamID
            WHERE br.TournamentID = @tid
            GROUP BY t.TeamID, t.Name
            ORDER BY TotalPoints DESC, TotalKills DESC";
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@tid", tournamentId);
        using var dr = cmd.ExecuteReader();
        var rows = new List<object>();
        int rank = 1;
        while (dr.Read())
        {
            rows.Add(new
            {
                rank         = rank++,
                teamId       = dr.GetInt32(0),
                teamName     = dr.GetString(1),
                roundsPlayed = dr.GetInt32(2),
                totalKills   = dr.IsDBNull(3) ? 0 : dr.GetInt32(3),
                totalPoints  = dr.IsDBNull(4) ? 0 : dr.GetInt32(4),
                bestPlacement= dr.IsDBNull(5) ? 0 : dr.GetInt32(5)
            });
        }
        return Results.Ok(new { data = rows, total = rows.Count, tournamentId });
    }
}

public record CreateBRRoundRequest(int TournamentID, int RoundNumber, string? MapName, DateTime? StartTime);
public record SubmitBRScoreRequest(int BRRoundID, int TeamID, int PlacementRank, int KillCount);
