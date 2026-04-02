using ETMS.DAL;

var builder = WebApplication.CreateBuilder(args);

// ── Connection string ──────────────────────────────────────────────────────────
var connStr = builder.Configuration.GetConnectionString("ETMSConnection")
    ?? throw new InvalidOperationException("Connection string 'ETMSConnection' not found.");
DBConnection.Configure(connStr);

// ── Services ───────────────────────────────────────────────────────────────────
builder.Services.AddCors(opt =>
    opt.AddDefaultPolicy(p =>
        p.WithOrigins("tauri://localhost", "http://localhost:5173", "http://localhost:4173")
         .AllowAnyHeader()
         .AllowAnyMethod()));

// ── JSON: giữ PascalCase để khớp với frontend React ────────────────────────────
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = null; // Không đổi sang camelCase
});

var app = builder.Build();

app.UseCors();

// ── Auto-Migration: thêm cột mới vào DB cũ nếu chưa tồn tại ──────────────────
try
{
    using var migConn = DBConnection.GetConnection();
    migConn.Open();
    // Chạy từng câu ALTER TABLE riêng biệt để tránh lỗi batch parsing
    var migrations = new[]
    {
        "IF COL_LENGTH('tblTournament','GameName')    IS NULL ALTER TABLE tblTournament ADD GameName    NVARCHAR(100) NULL",
        "IF COL_LENGTH('tblTournament','Description') IS NULL ALTER TABLE tblTournament ADD Description NVARCHAR(MAX) NULL",
        "IF COL_LENGTH('tblMatch','NextMatchSlot')    IS NULL ALTER TABLE tblMatch      ADD NextMatchSlot INT NULL",
    };
    foreach (var sql in migrations)
    {
        using var cmd = new Microsoft.Data.SqlClient.SqlCommand(sql, migConn);
        cmd.ExecuteNonQuery();
    }
    Console.WriteLine("[Migration] DB schema up-to-date.");
}
catch (Exception ex)
{
    Console.WriteLine($"[Migration] Warning: {ex.Message}");
}

// ── Health ────────────────────────────────────────────────────────────────────
app.MapGet("/api/health", () => new
{
    status = "ok",
    dbConnected = DBConnection.TestConnection(),
    timestamp = DateTimeOffset.UtcNow
});

// ── Auth ──────────────────────────────────────────────────────────────────────
app.MapPost("/api/auth/login",           ETMS.Api.Handlers.AuthHandler.Login);
app.MapPost("/api/auth/logout",          ETMS.Api.Handlers.AuthHandler.Logout);
app.MapPatch("/api/auth/change-password", ETMS.Api.Handlers.AuthHandler.ChangePassword);

// DEV ONLY: Generate BCrypt hash
app.MapGet("/api/auth/hash", (string pwd) =>
    Results.Ok(new { pwd, hash = ETMS.BUS.AuthBUS.HashPassword(pwd) }));

// DEV ONLY: Seed default users vào DB (gọi 1 lần sau khi tạo DB)
app.MapPost("/api/dev/seed-users", () =>
{
    try
    {
        using var conn = ETMS.DAL.DBConnection.GetConnection();
        conn.Open();
        var users = new[] {
            ("admin",     "admin",   "Quản Trị Viên",      "admin@etms.vn",   "Admin"),
            ("captain01", "admin",   "Nguyễn Văn Captain", "cap@etms.vn",     "Captain"),
            ("player01",  "admin",   "Trần Thị Player",    "player@etms.vn",  "Player"),
        };
        int count = 0;
        foreach (var (uname, pwd, name, email, role) in users)
        {
            var hash = ETMS.BUS.AuthBUS.HashPassword(pwd);
            const string sql = @"
                IF NOT EXISTS (SELECT 1 FROM tblUser WHERE Username=@u)
                    INSERT INTO tblUser(Username,PasswordHash,FullName,Email,Role,IsLocked,FailedLoginAttempts,CreatedAt)
                    VALUES(@u,@h,@n,@e,@r,0,0,GETDATE())
                ELSE
                    UPDATE tblUser SET PasswordHash=@h WHERE Username=@u";
            using var cmd = new Microsoft.Data.SqlClient.SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@u", uname);
            cmd.Parameters.AddWithValue("@h", hash);
            cmd.Parameters.AddWithValue("@n", name);
            cmd.Parameters.AddWithValue("@e", email);
            cmd.Parameters.AddWithValue("@r", role);
            cmd.ExecuteNonQuery();
            count++;
        }
        return Results.Ok(new { message = $"Seeded {count} users. Password: admin", users = new[]{"admin","captain01","player01"} });
    }
    catch (Exception ex) { return Results.Problem(ex.Message); }
});

// ── Overview ──────────────────────────────────────────────────────────────────
app.MapGet("/api/overview/stats",    ETMS.Api.Handlers.OverviewHandler.GetStats);
app.MapGet("/api/game-types",        ETMS.Api.Handlers.OverviewHandler.GetGameTypes);

// ── Tournaments ───────────────────────────────────────────────────────────────
app.MapGet("/api/tournaments",              ETMS.Api.Handlers.TournamentHandler.GetAll);
app.MapGet("/api/tournaments/{id:int}",     ETMS.Api.Handlers.TournamentHandler.GetByID);
app.MapPost("/api/tournaments",             ETMS.Api.Handlers.TournamentHandler.Create);
app.MapPatch("/api/tournaments/{id:int}",     ETMS.Api.Handlers.TournamentHandler.Update);
app.MapPut("/api/tournaments/{id:int}",       ETMS.Api.Handlers.TournamentHandler.Update);
app.MapPatch("/api/tournaments/{id:int}/advance", ETMS.Api.Handlers.TournamentHandler.AdvanceStatus);
app.MapPatch("/api/tournaments/{id:int}/cancel",  ETMS.Api.Handlers.TournamentHandler.Cancel);
app.MapPost("/api/tournaments/{id:int}/generate-bracket", ETMS.Api.Handlers.TournamentHandler.GenerateBracket);

app.MapGet("/api/tournaments/{id:int}/bracket", (int id) => {
    var list = new ETMS.BUS.BracketBUS().GetBracket(id);
    return Results.Ok(new { data = list, total = list.Count });
});
app.MapGet("/api/tournaments/{id:int}/leaderboard", (int id) => {
    var dt = new ETMS.BUS.LeaderboardBUS().GetRanking(id);
    var list = new List<object>();
    foreach (System.Data.DataRow row in dt.Rows)
    {
        var obj = new Dictionary<string, object?>();
        foreach (System.Data.DataColumn col in dt.Columns)
            obj[col.ColumnName] = row[col] == DBNull.Value ? null : row[col];
        list.Add(obj);
    }
    return Results.Ok(new { data = list, total = list.Count });
});
app.MapGet("/api/tournaments/{id:int}/game-config", (int id) => {
    using var conn = DBConnection.GetConnection();
    conn.Open();
    const string sql = @"
        SELECT gc.ConfigID, gc.TournamentID, gc.BestOf, gc.MapPool,
               gc.VetoSequence, gc.KillPointPerKill, gc.PlacementPoints,
               gc.MaxParticipants, gc.CheckInWindowMinutes
        FROM tblGameConfig gc WHERE gc.TournamentID = @tid";
    using var cmd = new Microsoft.Data.SqlClient.SqlCommand(sql, conn);
    cmd.Parameters.AddWithValue("@tid", id);
    using var dr = cmd.ExecuteReader();
    if (!dr.Read()) return Results.NotFound(new { error = "Chưa có cấu hình game." });
    return Results.Ok(new {
        configId      = dr.IsDBNull(0) ? 0     : dr.GetInt32(0),
        tournamentId  = dr.GetInt32(1),
        bestOf        = dr.IsDBNull(2) ? 1     : dr.GetInt32(2),
        mapPool       = dr.IsDBNull(3) ? null  : dr.GetString(3),
        vetoSequence  = dr.IsDBNull(4) ? null  : dr.GetString(4),
        killPointPerKill = dr.IsDBNull(5) ? 1  : dr.GetInt32(5),
        checkInWindowMinutes = dr.IsDBNull(8) ? 15 : dr.GetInt32(8)
    });
});
app.MapDelete("/api/tournaments/{id:int}",  ETMS.Api.Handlers.TournamentHandler.Delete);

// ── Teams ─────────────────────────────────────────────────────────────────────
app.MapGet("/api/teams",                        ETMS.Api.Handlers.TeamHandler.GetAll);
app.MapGet("/api/teams/{id:int}",               ETMS.Api.Handlers.TeamHandler.GetByID);
app.MapPost("/api/teams",                       ETMS.Api.Handlers.TeamHandler.Create);
app.MapPatch("/api/teams/{id:int}/approve",     ETMS.Api.Handlers.TeamHandler.Approve);
app.MapPatch("/api/teams/{id:int}/reject",      ETMS.Api.Handlers.TeamHandler.Reject);
app.MapPatch("/api/teams/{id:int}/disqualify",  ETMS.Api.Handlers.TeamHandler.Disqualify);

// ── Matches ───────────────────────────────────────────────────────────────────
app.MapGet("/api/matches",              ETMS.Api.Handlers.MatchHandler.GetAll);
app.MapGet("/api/matches/{id:int}",     ETMS.Api.Handlers.MatchHandler.GetByID);
app.MapPost("/api/matches/{id:int}/checkin",     ETMS.Api.Handlers.MatchHandler.CheckIn);
app.MapPost("/api/matches/{id:int}/veto",        ETMS.Api.Handlers.MatchHandler.SubmitVeto);
app.MapPost("/api/matches/{id:int}/side-select", ETMS.Api.Handlers.MatchHandler.SelectSide);
// GET veto history cho một trận
app.MapGet("/api/matches/{id:int}/veto", (int id) => {
    using var conn = DBConnection.GetConnection();
    conn.Open();
    const string sql = @"
        SELECT mv.VetoID, mv.MatchID, mv.TeamID, t.Name AS TeamName,
               mv.MapName, mv.Action, mv.VetoOrder
        FROM tblMapVeto mv
        LEFT JOIN tblTeam t ON t.TeamID = mv.TeamID
        WHERE mv.MatchID = @mid
        ORDER BY mv.VetoOrder";
    using var cmd = new Microsoft.Data.SqlClient.SqlCommand(sql, conn);
    cmd.Parameters.AddWithValue("@mid", id);
    using var dr = cmd.ExecuteReader();
    var list = new List<object>();
    while (dr.Read())
        list.Add(new {
            vetoId   = dr.GetInt32(0),
            matchId  = dr.GetInt32(1),
            teamId   = dr.GetInt32(2),
            teamName = dr.IsDBNull(3) ? "" : dr.GetString(3),
            mapName  = dr.GetString(4),
            action   = dr.GetString(5),
            vetoOrder= dr.GetInt32(6)
        });
    return Results.Ok(new { data = list, total = list.Count });
});
// Lên lịch cho một trận (Admin)
app.MapPatch("/api/matches/{id:int}/schedule", (int id, ScheduleRequest req, HttpContext ctx) => {
    ETMS.BUS.AuthBUS.SetCurrentUserFromToken(ctx.Request.Headers.Authorization);
    if (!ETMS.BUS.Session.IsAdmin)
        return Results.Json(new { error = "Chỉ Admin mới có thể lên lịch trận đấu." }, statusCode: 403);
    new ETMS.DAL.MatchDAL().SetScheduledTime(id, req.ScheduledTime);
    return Results.Ok(new { matchId = id, scheduledTime = req.ScheduledTime });
});

// ── Results ───────────────────────────────────────────────────────────────────
app.MapPost("/api/matches/{id:int}/result", ETMS.Api.Handlers.ResultHandler.Submit);
app.MapPatch("/api/results/{id:int}/verify", ETMS.Api.Handlers.ResultHandler.Verify);
app.MapPatch("/api/results/{id:int}/reject", ETMS.Api.Handlers.ResultHandler.Reject);

// ── Disputes ──────────────────────────────────────────────────────────────────
app.MapGet("/api/disputes",                      ETMS.Api.Handlers.DisputeHandler.GetAll);
app.MapPost("/api/disputes",                     ETMS.Api.Handlers.DisputeHandler.CreateDirect);
app.MapPost("/api/matches/{id:int}/dispute",     ETMS.Api.Handlers.DisputeHandler.Create);
app.MapPatch("/api/disputes/{id:int}/resolve",   ETMS.Api.Handlers.DisputeHandler.Resolve);
app.MapPatch("/api/disputes/{id:int}/dismiss",   ETMS.Api.Handlers.DisputeHandler.Dismiss);

// ── Notifications ─────────────────────────────────────────────────────────────
app.MapGet("/api/notifications",                 ETMS.Api.Handlers.NotificationHandler.GetAll);
app.MapPatch("/api/notifications/{id:int}/read", ETMS.Api.Handlers.NotificationHandler.MarkRead);
app.MapPatch("/api/notifications/read-all",      ETMS.Api.Handlers.NotificationHandler.MarkAllRead);

// ── Users (Admin) ─────────────────────────────────────────────────────────────
app.MapGet("/api/users",                         ETMS.Api.Handlers.UserHandler.GetUsers);
app.MapPost("/api/users",                        ETMS.Api.Handlers.UserHandler.CreateUser);
app.MapPatch("/api/users/{id:int}/lock",         ETMS.Api.Handlers.UserHandler.ToggleLock);
app.MapPost("/api/users/{id:int}/reset-password",ETMS.Api.Handlers.UserHandler.ResetPassword);

// ── Audit ─────────────────────────────────────────────────────────────────────
app.MapGet("/api/audit-log",                     ETMS.Api.Handlers.AuditHandler.GetLog);

// ── Battle Royale ─────────────────────────────────────────────────────────────
app.MapPost("/api/br/rounds",                    ETMS.Api.Handlers.BRHandler.CreateRound);
app.MapPost("/api/br/scores",                    ETMS.Api.Handlers.BRHandler.SubmitScore);
app.MapGet("/api/br/{tournamentId:int}/leaderboard", ETMS.Api.Handlers.BRHandler.GetLeaderboard);

app.Run();

public record ScheduleRequest(DateTime ScheduledTime);
