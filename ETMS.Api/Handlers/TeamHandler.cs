using ETMS.BUS;
using ETMS.DTO;

namespace ETMS.Api.Handlers;

public static class TeamHandler
{
    public static IResult GetAll(int? tournamentId = null)
    {
        try
        {
            var bus  = new TeamBUS();
            var list = tournamentId.HasValue
                ? bus.GetByTournament(tournamentId.Value)
                : bus.GetByTournament(0);
            return Results.Ok(new { data = list, total = list.Count });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TeamHandler.GetAll] ERROR: {ex.Message}");
            return Results.Ok(new { data = Array.Empty<object>(), total = 0, warning = ex.Message });
        }
    }

    public static IResult GetByID(int id)
    {
        try
        {
            var bus = new TeamBUS();
            var dto = bus.GetByID(id);
            return dto == null ? Results.NotFound(new { error = "Đội không tồn tại." }) : Results.Ok(dto);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TeamHandler.GetByID] ERROR: {ex.Message}");
            return Results.Json(new { error = $"Lỗi server: {ex.Message}" }, statusCode: 500);
        }
    }

    public static IResult Create(CreateTeamRequest req)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { error = "Tên đội không được để trống." });

            var bus = new TeamBUS();
            var (teamID, error) = bus.CreateTeam(req.TournamentID, req.Name, req.CaptainID);
            return teamID > 0
                ? Results.Ok(new { teamID, message = "Đăng ký đội thành công. Chờ Admin xét duyệt." })
                : Results.BadRequest(new { error });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TeamHandler.Create] ERROR: {ex.Message}");
            return Results.Json(new { error = $"Lỗi server: {ex.Message}" }, statusCode: 500);
        }
    }

    public static IResult Approve(int id, ApproveTeamRequest req, HttpContext ctx)
    {
        try
        {
            AuthBUS.SetCurrentUserFromToken(ctx.Request.Headers.Authorization);
            var bus = new TeamBUS();
            var (ok, error) = bus.ApproveTeam(id, req.TournamentID, req.MinPlayers);
            return ok ? Results.Ok(new { teamId = id, status = "approved" })
                      : Results.BadRequest(new { error });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TeamHandler.Approve] ERROR: {ex.Message}");
            return Results.Json(new { error = $"Lỗi server: {ex.Message}" }, statusCode: 500);
        }
    }

    public static IResult Reject(int id, RejectTeamRequest req, HttpContext ctx)
    {
        try
        {
            AuthBUS.SetCurrentUserFromToken(ctx.Request.Headers.Authorization);
            var bus = new TeamBUS();
            bus.RejectTeam(id, req.Reason ?? "Không đáp ứng yêu cầu.");
            return Results.Ok(new { teamId = id, status = "rejected" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TeamHandler.Reject] ERROR: {ex.Message}");
            return Results.Json(new { error = $"Lỗi server: {ex.Message}" }, statusCode: 500);
        }
    }

    public static IResult Disqualify(int id, DisqualifyTeamRequest req, HttpContext ctx)
    {
        try
        {
            AuthBUS.SetCurrentUserFromToken(ctx.Request.Headers.Authorization);
            var bus = new TeamBUS();
            var (ok, error) = bus.DisqualifyTeam(id, req.Reason ?? "Vi phạm quy định.");
            return ok ? Results.Ok(new { teamId = id, status = "disqualified", reason = req.Reason })
                      : Results.BadRequest(new { error });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TeamHandler.Disqualify] ERROR: {ex.Message}");
            return Results.Json(new { error = $"Lỗi server: {ex.Message}" }, statusCode: 500);
        }
    }
}

public record CreateTeamRequest(int TournamentID, string Name, int CaptainID);
public record ApproveTeamRequest(int TournamentID, int MinPlayers);
public record RejectTeamRequest(string? Reason);
public record DisqualifyTeamRequest(string? Reason);
