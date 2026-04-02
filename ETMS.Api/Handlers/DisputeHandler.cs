using ETMS.BUS;

namespace ETMS.Api.Handlers;

public static class DisputeHandler
{
    public static IResult GetAll(int? tournamentId, string? status)
    {
        var bus = new DisputeBUS();
        var list = tournamentId.HasValue
            ? bus.GetByTournament(tournamentId.Value)
            : bus.GetAll();                          // no filter → all disputes
        return Results.Ok(new { data = list, total = list.Count });
    }

    // POST /api/matches/{id}/dispute  (legacy — match-scoped)
    public static IResult Create(int id, CreateDisputeRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Description) || req.Description.Length < 20)
            return Results.BadRequest(new { error = "Mo ta phai co it nhat 20 ky tu." });

        var (ok, err) = new DisputeBUS().FileDispute(id, req.TeamID, req.Description, req.EvidenceURL);
        return ok ? Results.Created($"/api/disputes/match-{id}", new { matchId = id, status = "open" })
                  : Results.BadRequest(new { error = err });
    }

    // POST /api/disputes  (direct — frontend form)
    public static IResult CreateDirect(CreateDisputeDirectRequest req)
    {
        if (req.MatchID <= 0)
            return Results.BadRequest(new { error = "MatchID khong hop le." });
        if (string.IsNullOrWhiteSpace(req.Description) || req.Description.Length < 10)
            return Results.BadRequest(new { error = "Mo ta phai co it nhat 10 ky tu." });

        var (ok, err) = new DisputeBUS().FileDispute(req.MatchID, 0, req.Description, req.EvidenceURL);
        return ok ? Results.Created("/api/disputes", new { matchId = req.MatchID, status = "open" })
                  : Results.BadRequest(new { error = err });
    }

    public static IResult Resolve(int id, ResolveDisputeRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Resolution))
            return Results.BadRequest(new { error = "Noi dung giai quyet khong duoc trong." });

        var (ok, err) = new DisputeBUS().ResolveDispute(id, req.Resolution);
        return ok ? Results.Ok(new { disputeId = id, status = "resolved" })
                  : Results.BadRequest(new { error = err });
    }

    public static IResult Dismiss(int id, DismissRequest req)
    {
        var (ok, err) = new DisputeBUS().DismissDispute(id, req.Reason ?? "Khong du can cu.");
        return ok ? Results.Ok(new { disputeId = id, status = "dismissed" })
                  : Results.BadRequest(new { error = err });
    }
}

public record CreateDisputeRequest(int TeamID, string Description, string? EvidenceURL);
public record CreateDisputeDirectRequest(int MatchID, string Category, string Description, string? EvidenceURL);
public record ResolveDisputeRequest(string Resolution);
public record DismissRequest(string? Reason);

