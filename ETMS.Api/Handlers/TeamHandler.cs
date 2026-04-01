using ETMS.BUS;
using ETMS.DTO;

namespace ETMS.Api.Handlers;

public static class TeamHandler
{
    public static IResult GetAll(int? tournamentId = null)
    {
        var bus  = new TeamBUS();
        var list = tournamentId.HasValue
            ? bus.GetByTournament(tournamentId.Value)
            : bus.GetByTournament(0); // 0 = tất cả tournaments, fallback
        return Results.Ok(new { data = list, total = list.Count });
    }

    public static IResult GetByID(int id)
    {
        var bus = new TeamBUS();
        var dto = bus.GetByID(id);
        return dto == null ? Results.NotFound(new { error = "Đội không tồn tại." }) : Results.Ok(dto);
    }

    public static IResult Create(CreateTeamRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return Results.BadRequest(new { error = "Tên đội không được để trống." });

        var bus = new TeamBUS();
        var (teamID, error) = bus.CreateTeam(req.TournamentID, req.Name, req.CaptainID);
        return teamID > 0
            ? Results.Created($"/api/teams/{teamID}", new { teamID, message = "Đăng ký đội thành công. Chờ Admin xét duyệt." })
            : Results.BadRequest(new { error });
    }

    public static IResult Approve(int id, ApproveTeamRequest req)
    {
        var bus = new TeamBUS();
        var (ok, error) = bus.ApproveTeam(id, req.TournamentID, req.MinPlayers);
        return ok ? Results.Ok(new { teamId = id, status = "approved" })
                  : Results.BadRequest(new { error });
    }

    public static IResult Reject(int id, RejectTeamRequest req)
    {
        var bus = new TeamBUS();
        bus.RejectTeam(id, req.Reason ?? "Không đáp ứng yêu cầu.");
        return Results.Ok(new { teamId = id, status = "rejected" });
    }
}

public record CreateTeamRequest(int TournamentID, string Name, int CaptainID);
public record ApproveTeamRequest(int TournamentID, int MinPlayers);
public record RejectTeamRequest(string? Reason);
