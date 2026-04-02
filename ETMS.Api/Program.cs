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

var app = builder.Build();

app.UseCors();

// ── Health ────────────────────────────────────────────────────────────────────
app.MapGet("/api/health", () => new
{
    status = "ok",
    dbConnected = DBConnection.TestConnection(),
    timestamp = DateTimeOffset.UtcNow
});

// ── Auth ──────────────────────────────────────────────────────────────────────
app.MapPost("/api/auth/login",  ETMS.Api.Handlers.AuthHandler.Login);
app.MapPost("/api/auth/logout", ETMS.Api.Handlers.AuthHandler.Logout);
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
app.MapDelete("/api/tournaments/{id:int}",  ETMS.Api.Handlers.TournamentHandler.Delete);

// ── Teams ─────────────────────────────────────────────────────────────────────
app.MapGet("/api/teams",                        ETMS.Api.Handlers.TeamHandler.GetAll);
app.MapGet("/api/teams/{id:int}",               ETMS.Api.Handlers.TeamHandler.GetByID);
app.MapPost("/api/teams",                       ETMS.Api.Handlers.TeamHandler.Create);
app.MapPatch("/api/teams/{id:int}/approve",     ETMS.Api.Handlers.TeamHandler.Approve);
app.MapPatch("/api/teams/{id:int}/reject",      ETMS.Api.Handlers.TeamHandler.Reject);
app.MapPatch("/api/teams/{id:int}/disqualify",  ETMS.Api.Handlers.TeamHandler.Disqualify);

// ── Matches ───────────────────────────────────────────────────────────────────
app.MapGet("/api/matches",                                  ETMS.Api.Handlers.MatchHandler.GetAll);
app.MapGet("/api/matches/{id:int}",                         ETMS.Api.Handlers.MatchHandler.GetByID);
app.MapPost("/api/matches/{id:int}/checkin",                ETMS.Api.Handlers.MatchHandler.CheckIn);
app.MapPost("/api/matches/{id:int}/veto",                   ETMS.Api.Handlers.MatchHandler.SubmitVeto);
app.MapPost("/api/matches/{id:int}/side-select",            ETMS.Api.Handlers.MatchHandler.SelectSide);

// ── Results ───────────────────────────────────────────────────────────────────
app.MapPost("/api/matches/{id:int}/result",                 ETMS.Api.Handlers.ResultHandler.Submit);
app.MapPatch("/api/results/{id:int}/verify",                ETMS.Api.Handlers.ResultHandler.Verify);
app.MapPatch("/api/results/{id:int}/reject",                ETMS.Api.Handlers.ResultHandler.Reject);

// ── Disputes ──────────────────────────────────────────────────────────────────
app.MapGet("/api/disputes",                                 ETMS.Api.Handlers.DisputeHandler.GetAll);
app.MapPost("/api/disputes",                                ETMS.Api.Handlers.DisputeHandler.CreateDirect);
app.MapPost("/api/matches/{id:int}/dispute",                ETMS.Api.Handlers.DisputeHandler.Create);
app.MapPatch("/api/disputes/{id:int}/resolve",              ETMS.Api.Handlers.DisputeHandler.Resolve);
app.MapPatch("/api/disputes/{id:int}/dismiss",              ETMS.Api.Handlers.DisputeHandler.Dismiss);

// ── Notifications ─────────────────────────────────────────────────────────────
app.MapGet("/api/notifications",                            ETMS.Api.Handlers.NotificationHandler.GetAll);
app.MapPatch("/api/notifications/{id:int}/read",            ETMS.Api.Handlers.NotificationHandler.MarkRead);
app.MapPatch("/api/notifications/read-all",                 ETMS.Api.Handlers.NotificationHandler.MarkAllRead);

// ── Users (Admin) ─────────────────────────────────────────────────────────────
app.MapGet("/api/users",                                    ETMS.Api.Handlers.UserHandler.GetUsers);
app.MapPost("/api/users",                                   ETMS.Api.Handlers.UserHandler.CreateUser);
app.MapPatch("/api/users/{id:int}/lock",                    ETMS.Api.Handlers.UserHandler.ToggleLock);
app.MapPost("/api/users/{id:int}/reset-password",           ETMS.Api.Handlers.UserHandler.ResetPassword);

// ── Audit ─────────────────────────────────────────────────────────────────────
app.MapGet("/api/audit-log",                                ETMS.Api.Handlers.AuditHandler.GetLog);

app.Run();
