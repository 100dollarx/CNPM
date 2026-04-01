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
        => Results.Ok(new { matchId = id, note = "Veto sẽ hoàn thiện Sprint 2." });

    public static IResult SelectSide(int id, SideRequest req)
        => Results.Ok(new { matchId = id, note = "Side select sẽ hoàn thiện Sprint 2." });
}

public record CheckInRequest(int TeamSlot);
public record VetoRequest(int TeamID, string Map, string Action);
public record SideRequest(int TeamID, string Side);
