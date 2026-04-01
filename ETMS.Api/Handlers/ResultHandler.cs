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
        // id là resultID. ApproveResult cần matchID → lấy từ ResultBUS.GetByResultID
        var bus    = new ResultBUS();
        var result = bus.GetByResultID(id);
        if (result == null)
            return Results.NotFound(new { error = "Không tìm thấy kết quả với ID này." });

        var (ok, err) = bus.ApproveResult(id, result.MatchID);
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
