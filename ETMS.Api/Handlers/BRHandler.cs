using ETMS.DAL;
using Microsoft.Data.SqlClient;

namespace ETMS.Api.Handlers;

/// <summary>
/// BRHandler — SRS FR-14: Battle Royale Scoring.
/// Endpoints:
///   POST   /api/br/rounds                        — Admin tạo vòng mới
///   GET    /api/br/{tournamentId}/rounds          — Lấy danh sách vòng
///   POST   /api/br/scores                        — Admin nhập điểm
///   GET    /api/br/{tournamentId}/leaderboard     — Bảng tổng điểm
/// Sửa lỗi: tên cột thực tế trong DB dùng RoundID (không phải BRRoundID),
///           PlayedAt (không phải StartTime), KillPoints (không phải KillCount).
/// </summary>
public static class BRHandler
{
    // ── POST /api/br/rounds ────────────────────────────────────────────────────
    /// <summary>Admin tạo vòng BR mới cho giải đấu.</summary>
    public static IResult CreateRound(CreateBRRoundRequest req, HttpContext ctx)
    {
        ETMS.BUS.AuthBUS.SetCurrentUserFromToken(ctx.Request.Headers.Authorization);
        if (!ETMS.BUS.Session.IsAdmin)
            return Results.Json(new { error = "Chỉ Admin mới có thể tạo vòng BR." }, statusCode: 403);

        if (req.TournamentID <= 0)
            return Results.BadRequest(new { error = "TournamentID không hợp lệ." });
        if (req.RoundNumber <= 0)
            return Results.BadRequest(new { error = "RoundNumber phải >= 1." });

        using var conn = DBConnection.GetConnection();
        conn.Open();

        // ── Validate tournament tồn tại và là BattleRoyale ─────────────────────
        const string checkTournSql = @"
            SELECT GameType, Status FROM tblTournament WHERE TournamentID = @tid";
        using var checkTournCmd = new SqlCommand(checkTournSql, conn);
        checkTournCmd.Parameters.AddWithValue("@tid", req.TournamentID);
        using var dr = checkTournCmd.ExecuteReader();
        if (!dr.Read())
            return Results.NotFound(new { error = $"Giải đấu #{req.TournamentID} không tồn tại." });
        var gameType = dr.GetString(0);
        var status   = dr.GetString(1);
        dr.Close();

        if (gameType != "BattleRoyale")
            return Results.BadRequest(new { error = $"Giải đấu này là '{gameType}', không phải Battle Royale." });
        if (status == "Completed" || status == "Cancelled")
            return Results.BadRequest(new { error = $"Không thể tạo vòng cho giải đấu đã '{status}'." });

        // Kiểm tra vòng đã tồn tại chưa
        const string checkSql = "SELECT COUNT(1) FROM tblBRRound WHERE TournamentID=@tid AND RoundNumber=@rn";
        using var checkCmd = new SqlCommand(checkSql, conn);
        checkCmd.Parameters.AddWithValue("@tid", req.TournamentID);
        checkCmd.Parameters.AddWithValue("@rn",  req.RoundNumber);
        if ((int)checkCmd.ExecuteScalar() > 0)
            return Results.Conflict(new { error = $"Vòng {req.RoundNumber} đã tồn tại trong giải đấu này." });

        const string sql = @"
            INSERT INTO tblBRRound (TournamentID, RoundNumber, PlayedAt)
            OUTPUT INSERTED.RoundID
            VALUES (@tid, @rn, @pa)";
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@tid", req.TournamentID);
        cmd.Parameters.AddWithValue("@rn",  req.RoundNumber);
        cmd.Parameters.AddWithValue("@pa",  (object?)req.PlayedAt ?? DBNull.Value);
        int newId = Convert.ToInt32(cmd.ExecuteScalar());
        return Results.Created($"/api/br/rounds/{newId}",
            new { roundId = newId, roundNumber = req.RoundNumber, message = $"Đã tạo Vòng {req.RoundNumber}." });
    }

    // ── GET /api/br/{tournamentId}/rounds ──────────────────────────────────────
    public static IResult GetRounds(int tournamentId)
    {
        using var conn = DBConnection.GetConnection();
        conn.Open();
        const string sql = @"
            SELECT r.RoundID, r.TournamentID, r.RoundNumber, r.PlayedAt,
                   COUNT(s.ScoreID) AS TeamsScored
            FROM tblBRRound r
            LEFT JOIN tblBRScore s ON s.RoundID = r.RoundID
            WHERE r.TournamentID = @tid
            GROUP BY r.RoundID, r.TournamentID, r.RoundNumber, r.PlayedAt
            ORDER BY r.RoundNumber";
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@tid", tournamentId);
        using var reader = cmd.ExecuteReader();
        var list = new List<object>();
        while (reader.Read())
            list.Add(new {
                roundId      = reader.GetInt32(0),
                tournamentId = reader.GetInt32(1),
                roundNumber  = reader.GetInt32(2),
                playedAt     = reader.IsDBNull(3) ? (DateTime?)null : reader.GetDateTime(3),
                teamsScored  = reader.GetInt32(4),
            });
        return Results.Ok(new { data = list, total = list.Count });
    }

    // ── POST /api/br/scores ────────────────────────────────────────────────────
    public static IResult SubmitScore(SubmitBRScoreRequest req, HttpContext ctx)
    {
        ETMS.BUS.AuthBUS.SetCurrentUserFromToken(ctx.Request.Headers.Authorization);
        if (!ETMS.BUS.Session.IsAdmin)
            return Results.Json(new { error = "Chỉ Admin mới có thể nhập điểm BR." }, statusCode: 403);

        if (req.RoundID  <= 0) return Results.BadRequest(new { error = "RoundID không hợp lệ." });
        if (req.TeamID   <= 0) return Results.BadRequest(new { error = "TeamID không hợp lệ." });
        if (req.PlacementRank < 1) return Results.BadRequest(new { error = "PlacementRank phải >= 1." });
        if (req.KillPoints    < 0) return Results.BadRequest(new { error = "KillPoints không được âm." });
        if (req.RankingPoints < 0) return Results.BadRequest(new { error = "RankingPoints không được âm." });

        using var conn = DBConnection.GetConnection();
        conn.Open();

        // ── Validate: RoundID phải tồn tại và TeamID phải thuộc cùng tournament ──
        const string validateSql = @"
            SELECT r.TournamentID,
                   (SELECT COUNT(1) FROM tblTeam t
                    WHERE t.TeamID = @teamId AND t.TournamentID = r.TournamentID
                      AND t.Status NOT IN ('Rejected','Disqualified')) AS TeamValid
            FROM tblBRRound r WHERE r.RoundID = @roundId";
        using var valCmd = new SqlCommand(validateSql, conn);
        valCmd.Parameters.AddWithValue("@roundId", req.RoundID);
        valCmd.Parameters.AddWithValue("@teamId",  req.TeamID);
        using var valDr = valCmd.ExecuteReader();
        if (!valDr.Read())
            return Results.NotFound(new { error = $"Vòng #{req.RoundID} không tồn tại." });
        int teamValid = valDr.GetInt32(1);
        valDr.Close();
        if (teamValid == 0)
            return Results.BadRequest(new { error = $"Đội #{req.TeamID} không thuộc giải đấu của vòng này." });

        // Upsert: INSERT hoặc UPDATE nếu đã tồn tại
        const string sql = @"
            IF EXISTS (SELECT 1 FROM tblBRScore WHERE RoundID=@rid AND TeamID=@tid)
                UPDATE tblBRScore
                SET PlacementRank=@pr, RankingPoints=@rp, KillPoints=@kp
                WHERE RoundID=@rid AND TeamID=@tid
            ELSE
                INSERT INTO tblBRScore (RoundID, TeamID, PlacementRank, RankingPoints, KillPoints)
                VALUES (@rid, @tid, @pr, @rp, @kp)";
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@rid", req.RoundID);
        cmd.Parameters.AddWithValue("@tid", req.TeamID);
        cmd.Parameters.AddWithValue("@pr",  req.PlacementRank);
        cmd.Parameters.AddWithValue("@rp",  req.RankingPoints);
        cmd.Parameters.AddWithValue("@kp",  req.KillPoints);
        cmd.ExecuteNonQuery();
        return Results.Ok(new {
            roundId     = req.RoundID,
            teamId      = req.TeamID,
            totalPoints = req.RankingPoints + req.KillPoints,
            status      = "recorded"
        });
    }

    // ── GET /api/br/{tournamentId}/leaderboard ─────────────────────────────────
    /// <summary>Bảng tổng điểm BR cộng dồn tất cả vòng của giải đấu.</summary>
    public static IResult GetLeaderboard(int tournamentId)
    {
        using var conn = DBConnection.GetConnection();
        conn.Open();
        // Dùng đúng tên cột: RoundID, KillPoints, TotalPoints
        const string sql = @"
            SELECT t.TeamID, t.Name AS TeamName,
                   COUNT(DISTINCT bs.RoundID)   AS RoundsPlayed,
                   SUM(bs.KillPoints)           AS TotalKills,
                   SUM(bs.TotalPoints)          AS TotalPoints,
                   MIN(bs.PlacementRank)        AS BestPlacement
            FROM tblBRScore bs
            INNER JOIN tblBRRound br ON br.RoundID  = bs.RoundID
            INNER JOIN tblTeam    t  ON t.TeamID     = bs.TeamID
            WHERE br.TournamentID = @tid
            GROUP BY t.TeamID, t.Name
            ORDER BY TotalPoints DESC, TotalKills DESC";
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@tid", tournamentId);
        using var dr = cmd.ExecuteReader();
        var rows = new List<object>();
        int rank = 1;
        while (dr.Read())
            rows.Add(new {
                rank          = rank++,
                teamId        = dr.GetInt32(0),
                teamName      = dr.GetString(1),
                roundsPlayed  = dr.GetInt32(2),
                totalKills    = dr.IsDBNull(3) ? 0 : dr.GetInt32(3),
                totalPoints   = dr.IsDBNull(4) ? 0 : dr.GetInt32(4),
                bestPlacement = dr.IsDBNull(5) ? 0 : dr.GetInt32(5),
            });
        return Results.Ok(new { data = rows, total = rows.Count, tournamentId });
    }

    // ── GET /api/br/{tournamentId}/rounds/{roundId}/scores ─────────────────────
    /// <summary>Trả về điểm đã nhập của từng đội trong một vòng cụ thể.</summary>
    public static IResult GetRoundScores(int tournamentId, int roundId)
    {
        using var conn = DBConnection.GetConnection();
        conn.Open();
        const string sql = @"
            SELECT bs.ScoreID, bs.TeamID, t.Name AS TeamName,
                   bs.PlacementRank, bs.RankingPoints, bs.KillPoints, bs.TotalPoints
            FROM tblBRScore bs
            INNER JOIN tblBRRound br ON br.RoundID = bs.RoundID
            INNER JOIN tblTeam    t  ON t.TeamID   = bs.TeamID
            WHERE bs.RoundID = @roundId AND br.TournamentID = @tid
            ORDER BY bs.PlacementRank ASC";
        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@roundId", roundId);
        cmd.Parameters.AddWithValue("@tid",     tournamentId);
        using var dr = cmd.ExecuteReader();
        var list = new List<object>();
        while (dr.Read())
            list.Add(new {
                scoreId       = dr.GetInt32(0),
                teamId        = dr.GetInt32(1),
                teamName      = dr.GetString(2),
                placementRank = dr.IsDBNull(3) ? 0 : dr.GetInt32(3),
                rankingPoints = dr.GetInt32(4),
                killPoints    = dr.GetInt32(5),
                totalPoints   = dr.IsDBNull(6) ? 0 : dr.GetInt32(6),
            });
        return Results.Ok(new { data = list, total = list.Count, roundId, tournamentId });
    }
}

// ── Request DTOs ─────────────────────────────────────────────────────────────
// PlayedAt thay cho StartTime (đúng tên cột DB)
public record CreateBRRoundRequest(int TournamentID, int RoundNumber, DateTime? PlayedAt);
// RoundID thay cho BRRoundID; RankingPoints + KillPoints thay cho KillCount
public record SubmitBRScoreRequest(int RoundID, int TeamID, int PlacementRank, int RankingPoints, int KillPoints);
