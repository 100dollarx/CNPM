using ETMS.DAL;

var builder = WebApplication.CreateBuilder(args);

// ── Inject connection string từ appsettings.json vào DBConnection ─────────
var connStr = builder.Configuration.GetConnectionString("ETMSConnection")
    ?? throw new InvalidOperationException("Connection string 'ETMSConnection' not found.");
DBConnection.Configure(connStr);

// ── Services ─────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(opt =>
    opt.AddDefaultPolicy(p =>
        p.WithOrigins("tauri://localhost", "http://localhost:5173", "http://localhost:4173")
         .AllowAnyHeader()
         .AllowAnyMethod()));

var app = builder.Build();

// ── Middleware ────────────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors();

// ── Health check ─────────────────────────────────────────────────────────────
app.MapGet("/api/health", () => new
{
    status = "ok",
    dbConnected = DBConnection.TestConnection(),
    timestamp = DateTimeOffset.UtcNow
}).AllowAnonymous();

// ── Auth endpoints ────────────────────────────────────────────────────────────
app.MapPost("/api/auth/login", ETMS.Api.Handlers.AuthHandler.Login);

// ── Tournament endpoints ──────────────────────────────────────────────────────
app.MapGet("/api/tournaments",       ETMS.Api.Handlers.TournamentHandler.GetAll).RequireAuthorization();
app.MapPost("/api/tournaments",      ETMS.Api.Handlers.TournamentHandler.Create).RequireAuthorization();

// ── Team endpoints ────────────────────────────────────────────────────────────
app.MapGet("/api/teams",                            ETMS.Api.Handlers.TeamHandler.GetAll).RequireAuthorization();
app.MapPost("/api/teams",                           ETMS.Api.Handlers.TeamHandler.Create).RequireAuthorization();
app.MapPatch("/api/teams/{id}/approve",             ETMS.Api.Handlers.TeamHandler.Approve).RequireAuthorization();

// ── Overview ──────────────────────────────────────────────────────────────────
app.MapGet("/api/overview/stats",   ETMS.Api.Handlers.OverviewHandler.GetStats).RequireAuthorization();

// ── Game Types reference data ─────────────────────────────────────────────────
app.MapGet("/api/game-types",       ETMS.Api.Handlers.OverviewHandler.GetGameTypes).AllowAnonymous();

app.Run();
