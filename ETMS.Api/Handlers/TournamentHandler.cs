using ETMS.BUS;
using ETMS.DTO;

namespace ETMS.Api.Handlers;

public static class TournamentHandler
{
    public static IResult GetAll()
    {
        var bus  = new TournamentBUS();
        var list = bus.GetAll();
        return Results.Ok(list);
    }

    public static IResult Create(CreateTournamentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return Results.BadRequest(new { error = "Tên giải đấu không được để trống." });

        var bus = new TournamentBUS();
        var dto = new TournamentDTO
        {
            Name               = req.Name,
            GameType           = req.GameType,
            Format             = req.Format,
            StartDate          = req.StartDate,
            MaxTeams           = req.MaxTeams,
            MinPlayersPerTeam  = req.MinPlayersPerTeam
        };

        var (id, error) = bus.CreateTournament(dto);
        return id > 0
            ? Results.Ok(new { id, message = "Tạo giải đấu thành công." })
            : Results.BadRequest(new { error });
    }
}

public record CreateTournamentRequest(
    string Name, string GameType, string Format,
    DateTime StartDate, int MaxTeams,
    int MinPlayersPerTeam = 5, string? Description = null);
