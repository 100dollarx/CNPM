using ETMS.BUS;

namespace ETMS.Api.Handlers;

public static class DisputeHandler
{
    public static IResult GetAll(int? tournamentId, string? status)
    {
        if (!tournamentId.HasValue)
            return Results.BadRequest(new { error = "Cần truyền tournamentId." });

        var list = new DisputeBUS().GetByTournament(tournamentId.Value);
        return Results.Ok(new { data = list, total = list.Count });
    }

    public static IResult Create(int id, CreateDisputeRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Description) || req.Description.Length < 20)
            return Results.BadRequest(new { error = "Mô tả phải có ít nhất 20 ký tự." });

        var (ok, err) = new DisputeBUS().FileDispute(id, req.TeamID, req.Description, req.EvidenceURL);
        return ok ? Results.Created($"/api/disputes/match-{id}", new { matchId = id, status = "open" })
                  : Results.BadRequest(new { error = err });
    }

    public static IResult Resolve(int id, ResolveDisputeRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Resolution))
            return Results.BadRequest(new { error = "Nội dung giải quyết không được trống." });

        var (ok, err) = new DisputeBUS().ResolveDispute(id, req.Resolution);
        return ok ? Results.Ok(new { disputeId = id, status = "resolved" })
                  : Results.BadRequest(new { error = err });
    }

    public static IResult Dismiss(int id, DismissRequest req)
    {
        var (ok, err) = new DisputeBUS().DismissDispute(id, req.Reason ?? "Không đủ căn cứ.");
        return ok ? Results.Ok(new { disputeId = id, status = "dismissed" })
                  : Results.BadRequest(new { error = err });
    }
}

public record CreateDisputeRequest(int TeamID, string Description, string? EvidenceURL);
public record ResolveDisputeRequest(string Resolution);
public record DismissRequest(string? Reason);
