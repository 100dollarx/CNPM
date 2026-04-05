using ETMS.BUS;

namespace ETMS.Api.Handlers;

public static class MatchHandler
{
    public static IResult GetAll(int? tournamentId)
    {
        var bus = new MatchBUS();
        var list = tournamentId.HasValue
            ? bus.GetMatchesByTournament(tournamentId.Value)
            : new List<ETMS.DTO.MatchDTO>();
        return Results.Ok(new { data = list, total = list.Count });
    }

    public static IResult GetByID(int id)
    {
        var match = new MatchBUS().GetByID(id);
        return match == null ? Results.NotFound(new { error = "Trận không tồn tại." }) : Results.Ok(match);
    }

    public static IResult CheckIn(int id, CheckInRequest req)
    {
        // teamSlot: 1 = Team1, 2 = Team2
        int slot = req.TeamSlot is 1 or 2 ? req.TeamSlot : 0;
        if (slot == 0)
            return Results.BadRequest(new { error = "TeamSlot phải là 1 hoặc 2." });

        var (ok, err) = new MatchBUS().ConfirmCheckIn(id, slot);
        return ok ? Results.Ok(new { matchId = id, teamSlot = slot, status = "checked-in" })
                  : Results.BadRequest(new { error = err });
    }

    public static IResult SubmitVeto(int id, VetoRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Map) || string.IsNullOrWhiteSpace(req.Action))
            return Results.BadRequest(new { error = "Map và Action không được trống." });
        if (!new[] { "ban", "pick" }.Contains(req.Action.ToLower()))
            return Results.BadRequest(new { error = "Action phải là 'ban' hoặc 'pick'." });

        var dal = new ETMS.DAL.MatchDAL();
        string action = char.ToUpper(req.Action[0]) + req.Action[1..].ToLower(); // "ban"→"Ban", "pick"→"Pick"
        dal.SaveMapVeto(id, req.TeamID, req.Map, action);
        return Results.Ok(new { matchId = id, teamId = req.TeamID, map = req.Map, action, status = "recorded" });
    }

    public static IResult SelectSide(int id, SideRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Side))
            return Results.BadRequest(new { error = "Side không được trống." });
        if (!new[] { "blue", "red" }.Contains(req.Side.ToLower()))
            return Results.BadRequest(new { error = "Side phải là 'blue' hoặc 'red'." });

        var dal = new ETMS.DAL.MatchDAL();
        string side = char.ToUpper(req.Side[0]) + req.Side[1..].ToLower(); // "blue"→"Blue", "red"→"Red"
        dal.SaveSideSelection(id, req.TeamID, side);
        return Results.Ok(new { matchId = id, teamId = req.TeamID, side, status = "recorded" });
    }
}

public record CheckInRequest(int TeamSlot);
public record VetoRequest(int TeamID, string Map, string Action);
public record SideRequest(int TeamID, string Side);
