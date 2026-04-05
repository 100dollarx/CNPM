using ETMS.BUS;
using ETMS.DTO;

namespace ETMS.Api.Handlers;

public static class TournamentHandler
{
    public static IResult GetAll()
    {
        try
        {
            var bus  = new TournamentBUS();
            var list = bus.GetAll();
            return Results.Ok(new { data = list, total = list.Count });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TournamentHandler.GetAll] ERROR: {ex.Message}");
            return Results.Ok(new { data = Array.Empty<object>(), total = 0, warning = ex.Message });
        }
    }

    public static IResult GetByID(int id)
    {
        try
        {
            var dto = new TournamentBUS().GetByID(id);
            return dto == null
                ? Results.NotFound(new { error = "Giải đấu không tồn tại." })
                : Results.Ok(dto);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TournamentHandler.GetByID] ERROR: {ex.Message}");
            return Results.Json(new { error = $"Lỗi server: {ex.Message}" }, statusCode: 500);
        }
    }

    public static IResult Create(CreateTournamentRequest req, HttpContext ctx)
    {
        try
        {
            AuthBUS.SetCurrentUserFromToken(ctx.Request.Headers.Authorization);

            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { error = "Tên giải đấu không được để trống." });

            var dto = new TournamentDTO
            {
                Name              = req.Name,
                GameType          = req.GameType ?? "FPS",
                GameName          = req.GameName,
                Format            = req.Format ?? "SingleElimination",
                StartDate         = req.StartDate,
                MaxTeams          = req.MaxTeams > 0 ? req.MaxTeams : 16,
                MinPlayersPerTeam = req.MinPlayersPerTeam > 0 ? req.MinPlayersPerTeam : 5,
                Description       = req.Description
            };

            var (tournamentId, error) = new TournamentBUS().CreateTournament(dto);
            return tournamentId > 0
                ? Results.Ok(new { id = tournamentId, message = "Tạo giải đấu thành công." })
                : Results.BadRequest(new { error });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TournamentHandler.Create] ERROR: {ex.Message}");
            return Results.Json(new { error = $"Lỗi server: {ex.Message}" }, statusCode: 500);
        }
    }

    public static IResult Update(int id, UpdateTournamentRequest req, HttpContext ctx)
    {
        try
        {
            AuthBUS.SetCurrentUserFromToken(ctx.Request.Headers.Authorization);

            var existing = new TournamentBUS().GetByID(id);
            if (existing == null) return Results.NotFound(new { error = "Giải đấu không tồn tại." });
            if (!string.IsNullOrWhiteSpace(req.Name))        existing.Name        = req.Name;
            if (req.StartDate.HasValue)                      existing.StartDate   = req.StartDate.Value;
            if (!string.IsNullOrWhiteSpace(req.Description)) existing.Description = req.Description;
            if (req.MaxTeams.HasValue)                       existing.MaxTeams    = req.MaxTeams.Value;
            if (!string.IsNullOrWhiteSpace(req.GameType))    existing.GameType    = req.GameType;
            if (!string.IsNullOrWhiteSpace(req.Format))      existing.Format      = req.Format;
            if (!string.IsNullOrWhiteSpace(req.GameName))    existing.GameName    = req.GameName;

            var (ok, error) = new TournamentBUS().UpdateTournament(existing);
            return ok ? Results.Ok(new { id, message = "Cập nhật thành công." })
                      : Results.BadRequest(new { error });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TournamentHandler.Update] ERROR: {ex.Message}");
            return Results.Json(new { error = $"Lỗi server: {ex.Message}" }, statusCode: 500);
        }
    }

    public static IResult AdvanceStatus(int id, HttpContext ctx)
    {
        try
        {
            AuthBUS.SetCurrentUserFromToken(ctx.Request.Headers.Authorization);
            var (ok, error) = new TournamentBUS().AdvanceStatus(id);
            return ok ? Results.Ok(new { id, message = error })
                      : Results.BadRequest(new { error });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TournamentHandler.AdvanceStatus] ERROR: {ex.Message}");
            return Results.Json(new { error = $"Lỗi server: {ex.Message}" }, statusCode: 500);
        }
    }

    public static IResult Cancel(int id, HttpContext ctx)
    {
        try
        {
            AuthBUS.SetCurrentUserFromToken(ctx.Request.Headers.Authorization);
            if (!Session.IsAdmin)
                return Results.Json(new { error = "Chỉ Admin mới có thể hủy giải đấu." }, statusCode: 403);

            var bus = new TournamentBUS();
            var tour = bus.GetByID(id);
            if (tour == null) return Results.NotFound(new { error = "Giải đấu không tồn tại." });
            if (tour.Status == "Completed")
                return Results.BadRequest(new { error = "Không thể hủy giải đấu đã hoàn thành." });
            if (tour.Status == "Cancelled")
                return Results.BadRequest(new { error = "Giải đấu đã bị hủy trước đó." });

            new ETMS.DAL.TournamentDAL().UpdateStatus(id, "Cancelled");
            return Results.Ok(new { id, message = "Đã hủy giải đấu." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TournamentHandler.Cancel] ERROR: {ex.Message}");
            return Results.Json(new { error = $"Lỗi server: {ex.Message}" }, statusCode: 500);
        }
    }

    public static IResult Delete(int id, HttpContext ctx)
    {
        try
        {
            AuthBUS.SetCurrentUserFromToken(ctx.Request.Headers.Authorization);
            var (ok, error) = new TournamentBUS().DeleteTournament(id);
            return ok ? Results.Ok(new { id, message = "Đã xoá giải đấu." })
                      : Results.BadRequest(new { error });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TournamentHandler.Delete] ERROR: {ex.Message}");
            return Results.Json(new { error = $"Lỗi server: {ex.Message}" }, statusCode: 500);
        }
    }

    public static IResult GenerateBracket(int id, HttpContext ctx)
    {
        try
        {
            AuthBUS.SetCurrentUserFromToken(ctx.Request.Headers.Authorization);
            var bracketBUS = new BracketBUS();
            var (ok, message) = bracketBUS.GenerateBracket(id);
            return ok
                ? Results.Ok(new { tournamentId = id, message })
                : Results.BadRequest(new { error = message });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TournamentHandler.GenerateBracket] ERROR: {ex.Message}");
            return Results.Json(new { error = $"Lỗi server: {ex.Message}" }, statusCode: 500);
        }
    }
}

public record CreateTournamentRequest(
    string Name, string? GameType, string? Format,
    DateTime StartDate, int MaxTeams,
    int MinPlayersPerTeam = 5, string? Description = null, string? GameName = null);

public record UpdateTournamentRequest(string? Name, DateTime? StartDate, string? Description, int? MaxTeams, string? GameName, string? GameType, string? Format);
