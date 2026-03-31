using ETMS.BUS;

namespace ETMS.Api.Handlers;

public static class OverviewHandler
{
    public static IResult GetStats()
    {
        var tourBus  = new TournamentBUS();
        var teamBus  = new TeamBUS();
        var allTours = tourBus.GetAll();

        return Results.Ok(new
        {
            activeTournaments      = allTours.Count(t => t.Status == "Active"),
            registrationTournaments= allTours.Count(t => t.Status == "Registration"),
            totalTournaments       = allTours.Count,
            timestamp              = DateTimeOffset.UtcNow
        });
    }

    public static IResult GetGameTypes() => Results.Ok(new[]
    {
        new { gameType = "MOBA",         displayName = "MOBA (5v5)",          hasMapVeto = false, hasSideSelection = true,  hasBRScoring = false, defaultMinPlayers = 5,  examples = "LoL, DOTA 2, Liên Quân" },
        new { gameType = "FPS",          displayName = "FPS (5v5)",           hasMapVeto = true,  hasSideSelection = false, hasBRScoring = false, defaultMinPlayers = 5,  examples = "VALORANT, CS2, Overwatch 2" },
        new { gameType = "BattleRoyale", displayName = "Battle Royale",       hasMapVeto = false, hasSideSelection = false, hasBRScoring = true,  defaultMinPlayers = 4,  examples = "PUBG, PUBG Mobile, Apex" },
        new { gameType = "Fighting",     displayName = "Fighting Game (1v1)", hasMapVeto = false, hasSideSelection = false, hasBRScoring = false, defaultMinPlayers = 1,  examples = "Tekken 8, SF6, MK1" },
        new { gameType = "RTS",          displayName = "RTS",                 hasMapVeto = false, hasSideSelection = false, hasBRScoring = false, defaultMinPlayers = 1,  examples = "StarCraft II, AoE IV" },
        new { gameType = "Sports",       displayName = "Sports Gaming",       hasMapVeto = false, hasSideSelection = false, hasBRScoring = false, defaultMinPlayers = 1,  examples = "EA FC 25, NBA 2K25" }
    });
}
