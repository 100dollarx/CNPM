using ETMS.BUS;

namespace ETMS.Api.Handlers;

public static class ResultHandler
{
    public static IResult Submit(int id, SubmitResultRequest req)
    {
        if (req.WinnerTeamID <= 0)
            return Results.BadRequest(new { error = "WinnerTeamID không hợp lệ." });

        var (ok, err) = new ResultBUS().SubmitResult(id, req.ScoreA, req.ScoreB, req.Evidence ?? "");
        return ok ? Results.Created($"/api/results/match-{id}", new { matchId = id, status = "pending" })
                  : Results.BadRequest(new { error = err });
    }

    public static IResult Verify(int id)
    {
        var (ok, err) = new ResultBUS().ApproveResult(id, id);
        return ok ? Results.Ok(new { resultId = id, status = "verified" })
                  : Results.BadRequest(new { error = err });
    }

    public static IResult Reject(int id, RejectRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Reason))
            return Results.BadRequest(new { error = "Lý do từ chối không được trống." });

        var (ok, err) = new ResultBUS().RejectResult(id, req.Reason);
        return ok ? Results.Ok(new { resultId = id, status = "rejected" })
                  : Results.BadRequest(new { error = err });
    }
}

public record SubmitResultRequest(int WinnerTeamID, int ScoreA, int ScoreB, string? Evidence);
public record RejectRequest(string Reason);
