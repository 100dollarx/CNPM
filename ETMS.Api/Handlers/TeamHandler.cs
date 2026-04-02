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
            : bus.GetByTournament(0); // 0 = tat ca tournaments
        return Results.Ok(new { data = list, total = list.Count });
    }

    public static IResult GetByID(int id)
    {
        var bus = new TeamBUS();
        var dto = bus.GetByID(id);
        return dto == null ? Results.NotFound(new { error = "Doi khong ton tai." }) : Results.Ok(dto);
    }

    public static IResult Create(CreateTeamRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return Results.BadRequest(new { error = "Ten doi khong duoc de trong." });

        var bus = new TeamBUS();
        var (teamID, error) = bus.CreateTeam(req.TournamentID, req.Name, req.CaptainID);
        return teamID > 0
            ? Results.Created($"/api/teams/{teamID}", new { teamID, message = "Dang ky doi thanh cong. Cho Admin xet duyet." })
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
        bus.RejectTeam(id, req.Reason ?? "Khong dap ung yeu cau.");
        return Results.Ok(new { teamId = id, status = "rejected" });
    }

    public static IResult Disqualify(int id, DisqualifyTeamRequest req)
    {
        var bus = new TeamBUS();
        // Reuse RejectTeam with Disqualified reason prefix so status maps correctly
        bus.RejectTeam(id, $"[LOAI DOI] {req.Reason ?? "Vi pham quy dinh."}");
        return Results.Ok(new { teamId = id, status = "disqualified", reason = req.Reason });
    }
}

public record CreateTeamRequest(int TournamentID, string Name, int CaptainID);
public record ApproveTeamRequest(int TournamentID, int MinPlayers);
public record RejectTeamRequest(string? Reason);
public record DisqualifyTeamRequest(string? Reason);

