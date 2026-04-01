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
app.UseStaticFiles();

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

// ── Overview ──────────────────────────────────────────────────────────────────
app.MapGet("/api/overview/stats",    ETMS.Api.Handlers.OverviewHandler.GetStats);
app.MapGet("/api/game-types",        ETMS.Api.Handlers.OverviewHandler.GetGameTypes);

// ── Tournaments ───────────────────────────────────────────────────────────────
app.MapGet("/api/tournaments",              ETMS.Api.Handlers.TournamentHandler.GetAll);
app.MapGet("/api/tournaments/{id:int}",     ETMS.Api.Handlers.TournamentHandler.GetByID);
app.MapPost("/api/tournaments",             ETMS.Api.Handlers.TournamentHandler.Create);
app.MapPut("/api/tournaments/{id:int}",     ETMS.Api.Handlers.TournamentHandler.Update);
app.MapPatch("/api/tournaments/{id:int}/advance", ETMS.Api.Handlers.TournamentHandler.AdvanceStatus);
app.MapDelete("/api/tournaments/{id:int}",  ETMS.Api.Handlers.TournamentHandler.Delete);

// ── Teams ─────────────────────────────────────────────────────────────────────
app.MapGet("/api/teams",                        ETMS.Api.Handlers.TeamHandler.GetAll);
app.MapGet("/api/teams/{id:int}",               ETMS.Api.Handlers.TeamHandler.GetByID);
app.MapPost("/api/teams",                       ETMS.Api.Handlers.TeamHandler.Create);
app.MapPatch("/api/teams/{id:int}/approve",     ETMS.Api.Handlers.TeamHandler.Approve);
app.MapPatch("/api/teams/{id:int}/reject",      ETMS.Api.Handlers.TeamHandler.Reject);

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
