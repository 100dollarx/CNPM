using ETMS.BUS;
using ETMS.DTO;

namespace ETMS.Api.Handlers;

public static class TournamentHandler
{
    public static IResult GetAll()
    {
        var bus  = new TournamentBUS();
        var list = bus.GetAll();
        return Results.Ok(new { data = list, total = list.Count });
    }

    public static IResult GetByID(int id)
    {
        var dto = new TournamentBUS().GetByID(id);
        return dto == null ? Results.NotFound(new { error = "Giải đấu không tồn tại." }) : Results.Ok(dto);
    }

    public static IResult Create(CreateTournamentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return Results.BadRequest(new { error = "Tên giải đấu không được để trống." });

        var dto = new TournamentDTO
        {
            Name              = req.Name,
            GameType          = req.GameType,
            Format            = req.Format,
            StartDate         = req.StartDate,
            MaxTeams          = req.MaxTeams,
            MinPlayersPerTeam = req.MinPlayersPerTeam
        };

        var (tournamentId, error) = new TournamentBUS().CreateTournament(dto);
        return tournamentId > 0
            ? Results.Created($"/api/tournaments/{tournamentId}", new { id = tournamentId, message = "Tạo giải đấu thành công." })
            : Results.BadRequest(new { error });
    }

    public static IResult Update(int id, UpdateTournamentRequest req)
    {
        var existing = new TournamentBUS().GetByID(id);
        if (existing == null) return Results.NotFound(new { error = "Giải đấu không tồn tại." });
        if (!string.IsNullOrWhiteSpace(req.Name)) existing.Name = req.Name;
        if (req.StartDate.HasValue)                existing.StartDate = req.StartDate.Value;

        var (ok, error) = new TournamentBUS().UpdateTournament(existing);
        return ok ? Results.Ok(new { id, message = "Cập nhật thành công." })
                  : Results.BadRequest(new { error });
    }

    public static IResult AdvanceStatus(int id)
    {
        var (ok, error) = new TournamentBUS().AdvanceStatus(id);
        return ok ? Results.Ok(new { id, message = error })   // message chứa "Đã chuyển..."
                  : Results.BadRequest(new { error });
    }

    public static IResult Delete(int id)
    {
        var (ok, error) = new TournamentBUS().DeleteTournament(id);
        return ok ? Results.Ok(new { id, message = "Đã xoá giải đấu." })
                  : Results.BadRequest(new { error });
    }
}

public record CreateTournamentRequest(
    string Name, string GameType, string Format,
    DateTime StartDate, int MaxTeams,
    int MinPlayersPerTeam = 5, string? Description = null);

public record UpdateTournamentRequest(string? Name, DateTime? StartDate, string? Description);
