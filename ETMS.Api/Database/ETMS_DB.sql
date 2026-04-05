-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  ETMS — Esports Tournament Management System                               ║
-- ║  Database Import Script — SQL Server 2019+                                 ║
-- ║  Phiên bản: 5.1 | Ngày: 2026-04-05                                         ║
-- ║  Chạy 1 lần duy nhất trong SSMS hoặc sqlcmd                               ║
-- ║  Mật khẩu mặc định: "admin" cho TẤT CẢ tài khoản                          ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ═════════════════════════════════════════════════════════════════
-- BƯỚC 1: TẠO DATABASE (xóa nếu đã tồn tại)
-- ═════════════════════════════════════════════════════════════════
USE master;
GO
IF DB_ID('ETMS_DB') IS NOT NULL
BEGIN
    ALTER DATABASE ETMS_DB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ETMS_DB;
    PRINT N'Đã xóa database cũ ETMS_DB.';
END
GO
CREATE DATABASE ETMS_DB COLLATE Vietnamese_CI_AS;
GO
USE ETMS_DB;
GO
PRINT N'✓ Tạo database ETMS_DB thành công.';
GO

-- ═════════════════════════════════════════════════════════════════
-- BƯỚC 2: TẠO CÁC BẢNG
-- Thứ tự: không FK trước → FK sau
-- ═════════════════════════════════════════════════════════════════

-- ── 1. tblUser ─────────────────────────────────────────────────
-- Tài khoản: Admin | Captain | Player | Guest
-- PasswordHash: BCrypt cost=12. Khóa tài khoản sau 5 lần sai.
CREATE TABLE [tblUser] (
    [UserID]              INT           IDENTITY(1,1) PRIMARY KEY,
    [Username]            NVARCHAR(50)  NOT NULL UNIQUE,
    [PasswordHash]        VARCHAR(256)  NOT NULL,
    [Role]                VARCHAR(20)   NOT NULL
        CHECK ([Role] IN ('Admin','Captain','Player','Guest')),
    [IsLocked]            BIT           NOT NULL DEFAULT 0,
    [FullName]            NVARCHAR(100) NOT NULL,
    [Email]               NVARCHAR(150) NULL,
    [FailedLoginAttempts] INT           NOT NULL DEFAULT 0,
    [CreatedAt]           DATETIME      NOT NULL DEFAULT GETDATE(),
    -- ── Email Activation (FR mới) ───────────────────────────────────
    [ActivationToken]     VARCHAR(128)  NULL,           -- Token 64-char hex
    [ActivationExpires]   DATETIME      NULL,           -- Thời điểm hết hạn token
    [IsActivated]         BIT           NOT NULL DEFAULT 0,   -- 0=chưa kích hoạt
    [MustChangePassword]  BIT           NOT NULL DEFAULT 0    -- 1=phải đổi pw lần đầu
);
GO

-- ── 2. tblGameTypeConfig ───────────────────────────────────────
-- Bảng tham chiếu: cơ chế mỗi thể loại game (6 loại)
CREATE TABLE [tblGameTypeConfig] (
    [GameType]               VARCHAR(30)   NOT NULL PRIMARY KEY,
    [DisplayName]            NVARCHAR(100) NOT NULL,
    [HasMapVeto]             BIT           NOT NULL DEFAULT 0,
    [HasSideSelection]       BIT           NOT NULL DEFAULT 0,
    [HasBRScoring]           BIT           NOT NULL DEFAULT 0,
    [HasMapPool]             BIT           NOT NULL DEFAULT 0,
    [DefaultMinPlayers]      INT           NOT NULL DEFAULT 5,
    [DefaultMaxPlayers]      INT           NOT NULL DEFAULT 5,
    [DefaultCheckInMinutes]  INT           NOT NULL DEFAULT 15,
    [SupportedFormats]       NVARCHAR(200) NOT NULL,
    [Examples]               NVARCHAR(500) NULL
);
GO

-- ── 3. tblTournament ───────────────────────────────────────────
-- Giải đấu: vòng đời Draft → Registration → Active → Completed | Cancelled
CREATE TABLE [tblTournament] (
    [TournamentID]          INT           IDENTITY(1,1) PRIMARY KEY,
    [Name]                  NVARCHAR(200) NOT NULL,
    [GameType]              VARCHAR(30)   NOT NULL
        CHECK ([GameType] IN ('MOBA','FPS','BattleRoyale','Fighting','RTS','Sports'))
        REFERENCES [tblGameTypeConfig]([GameType]),
    [GameName]              NVARCHAR(100) NULL,         -- Tên game cụ thể: Valorant, LoL…
    [Format]                VARCHAR(30)   NOT NULL DEFAULT 'SingleElimination'
        CHECK ([Format] IN ('SingleElimination','BattleRoyale',
                            'DoubleElimination','RoundRobin','Swiss')),
    [Status]                VARCHAR(20)   NOT NULL DEFAULT 'Draft'
        CHECK ([Status] IN ('Draft','Registration','Active','Completed','Cancelled')),
    [StartDate]             DATETIME      NULL,
    [EndDate]               DATETIME      NULL,
    [MaxTeams]              INT           NOT NULL DEFAULT 16,
    [MinPlayersPerTeam]     INT           NOT NULL DEFAULT 5,
    [MaxPlayersPerTeam]     INT           NOT NULL DEFAULT 5,
    [RegistrationDeadline]  DATETIME      NULL,
    [BracketGenerated]      BIT           NOT NULL DEFAULT 0,
    [Description]           NVARCHAR(MAX) NULL,
    [CreatedBy]             INT           NULL,
    [CreatedAt]             DATETIME      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Tournament_CreatedBy FOREIGN KEY ([CreatedBy])
        REFERENCES [tblUser]([UserID]) ON DELETE SET NULL
);
GO

-- ── 4. tblGameConfig ───────────────────────────────────────────
-- Cấu hình game cho từng giải (quan hệ 1:1 với tblTournament)
CREATE TABLE [tblGameConfig] (
    [ConfigID]              INT           IDENTITY(1,1) PRIMARY KEY,
    [TournamentID]          INT           NOT NULL UNIQUE,
    [BestOf]                INT           NOT NULL DEFAULT 1
        CHECK ([BestOf] IN (1,3,5)),
    [MapPool]               NVARCHAR(MAX) NULL,   -- JSON: ["Ascent","Bind",...]
    [VetoSequence]          NVARCHAR(MAX) NULL,   -- JSON: ["Ban","Ban","Pick",...]
    [KillPointPerKill]      INT           NOT NULL DEFAULT 1,
    [RankingPointTable]     NVARCHAR(MAX) NULL,   -- JSON: {"1":25,"2":18,...}
    [MaxParticipants]       INT           NULL,
    [CheckInWindowMinutes]  INT           NOT NULL DEFAULT 15,

    CONSTRAINT FK_GameConfig_Tournament FOREIGN KEY ([TournamentID])
        REFERENCES [tblTournament]([TournamentID]) ON DELETE CASCADE
);
GO

-- ── 5. tblTeam ─────────────────────────────────────────────────
-- Đội tuyển: vòng đời Pending → Approved | Rejected | Disqualified
-- Ràng buộc nghiệp vụ: 1 Captain chỉ được đăng ký 1 đội/giải
CREATE TABLE [tblTeam] (
    [TeamID]            INT           IDENTITY(1,1) PRIMARY KEY,
    [TournamentID]      INT           NOT NULL,
    [Name]              NVARCHAR(100) NOT NULL,
    [Logo]              NVARCHAR(500) NULL,
    [CaptainID]         INT           NOT NULL,
    [Status]            VARCHAR(20)   NOT NULL DEFAULT 'Pending'
        CHECK ([Status] IN ('Pending','Approved','Rejected','Disqualified')),
    [RejectionReason]   NVARCHAR(500) NULL,
    [SubmittedAt]       DATETIME      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Team_Tournament FOREIGN KEY ([TournamentID])
        REFERENCES [tblTournament]([TournamentID]),
    CONSTRAINT FK_Team_Captain FOREIGN KEY ([CaptainID])
        REFERENCES [tblUser]([UserID]),
    CONSTRAINT UQ_Team_Name_Per_Tournament   UNIQUE ([TournamentID],[Name]),
    CONSTRAINT UQ_Captain_Per_Tournament     UNIQUE ([TournamentID],[CaptainID])
);
GO

-- ── 6. tblPlayer ───────────────────────────────────────────────
-- Tuyển thủ trong đội. UserID nullable: Captain có thể thêm thành viên
-- bằng InGameID tự do mà không cần tài khoản hệ thống (SRS UC-3.1)
CREATE TABLE [tblPlayer] (
    [PlayerID]      INT           IDENTITY(1,1) PRIMARY KEY,
    [TeamID]        INT           NOT NULL,
    [UserID]        INT           NULL,            -- nullable
    [FullName]      NVARCHAR(100) NULL,            -- tên tự nhập (không cần account)
    [InGameID]      NVARCHAR(100) NOT NULL,
    [IsActive]      BIT           NOT NULL DEFAULT 1,
    [JoinedAt]      DATETIME      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Player_Team FOREIGN KEY ([TeamID])
        REFERENCES [tblTeam]([TeamID]) ON DELETE CASCADE,
    CONSTRAINT FK_Player_User FOREIGN KEY ([UserID])
        REFERENCES [tblUser]([UserID])
);
GO

-- ── 7. tblMatch ────────────────────────────────────────────────
-- Trận đấu + Bracket Linked List (NextMatchID / NextMatchSlot)
-- Status: Scheduled → CheckInOpen → Live → Completed | Walkover |
--         WalkoverPending | Disputed | Postponed | Cancelled
CREATE TABLE [tblMatch] (
    [MatchID]           INT         IDENTITY(1,1) PRIMARY KEY,
    [TournamentID]      INT         NOT NULL,
    [Team1ID]           INT         NULL,
    [Team2ID]           INT         NULL,
    [WinnerID]          INT         NULL,
    [LoserID]           INT         NULL,
    [Status]            VARCHAR(30) NOT NULL DEFAULT 'Scheduled'
        CHECK ([Status] IN ('Scheduled','CheckInOpen','Live','Completed',
                            'Walkover','WalkoverPending','Disputed',
                            'Postponed','Cancelled')),
    [ScheduledTime]     DATETIME    NULL,
    [ActualStartTime]   DATETIME    NULL,
    [NextMatchID]       INT         NULL,          -- FK self-ref (bracket linked list)
    [NextMatchSlot]     INT         NULL,          -- 1 = Team1ID, 2 = Team2ID của trận kế
    [Round]             INT         NOT NULL,
    [MatchOrder]        INT         NOT NULL,
    [IsBye]             BIT         NOT NULL DEFAULT 0,
    [CheckIn_Team1]     BIT         NOT NULL DEFAULT 0,
    [CheckIn_Team2]     BIT         NOT NULL DEFAULT 0,

    CONSTRAINT FK_Match_Tournament  FOREIGN KEY ([TournamentID]) REFERENCES [tblTournament]([TournamentID]),
    CONSTRAINT FK_Match_Team1       FOREIGN KEY ([Team1ID])      REFERENCES [tblTeam]([TeamID]),
    CONSTRAINT FK_Match_Team2       FOREIGN KEY ([Team2ID])      REFERENCES [tblTeam]([TeamID]),
    CONSTRAINT FK_Match_Winner      FOREIGN KEY ([WinnerID])      REFERENCES [tblTeam]([TeamID]),
    CONSTRAINT FK_Match_Loser       FOREIGN KEY ([LoserID])       REFERENCES [tblTeam]([TeamID]),
    CONSTRAINT FK_Match_NextMatch   FOREIGN KEY ([NextMatchID])   REFERENCES [tblMatch]([MatchID])
);
GO

-- ── 8. tblMatchResult ─────────────────────────────────────────
-- Kết quả trận (1 trận : 1 kết quả, UNIQUE MatchID)
-- EvidenceURL: URL ảnh/clip minh chứng (KHÔNG upload file lên server — SRS NFR)
-- Status: PendingVerification → Verified | Disputed | Rejected
CREATE TABLE [tblMatchResult] (
    [ResultID]      INT           IDENTITY(1,1) PRIMARY KEY,
    [MatchID]       INT           NOT NULL UNIQUE,
    [Score1]        INT           NOT NULL DEFAULT 0,
    [Score2]        INT           NOT NULL DEFAULT 0,
    [EvidenceURL]   NVARCHAR(500) NULL,            -- URL (nullable, C# truyền null)
    [Status]        VARCHAR(30)   NOT NULL DEFAULT 'PendingVerification'
        CHECK ([Status] IN ('PendingVerification','Verified','Disputed','Rejected')),
    [SubmittedBy]   INT           NULL,            -- nullable để tránh FK fail
    [VerifiedBy]    INT           NULL,
    [SubmittedAt]   DATETIME      NOT NULL DEFAULT GETDATE(),
    [VerifiedAt]    DATETIME      NULL,
    [AdminNote]     NVARCHAR(500) NULL,

    CONSTRAINT FK_Result_Match        FOREIGN KEY ([MatchID])      REFERENCES [tblMatch]([MatchID]),
    CONSTRAINT FK_Result_SubmittedBy  FOREIGN KEY ([SubmittedBy])  REFERENCES [tblUser]([UserID]),
    CONSTRAINT FK_Result_VerifiedBy   FOREIGN KEY ([VerifiedBy])   REFERENCES [tblUser]([UserID])
);
GO

-- ── 9. tblMapVeto ─────────────────────────────────────────────
-- Veto bản đồ (FPS): Action phải là 'Ban' hoặc 'Pick' (PascalCase)
CREATE TABLE [tblMapVeto] (
    [VetoID]    INT           IDENTITY(1,1) PRIMARY KEY,
    [MatchID]   INT           NOT NULL,
    [TeamID]    INT           NOT NULL,
    [MapName]   NVARCHAR(100) NOT NULL,
    [Action]    VARCHAR(10)   NOT NULL
        CHECK ([Action] IN ('Ban','Pick')),
    [VetoOrder] INT           NOT NULL,
    [CreatedAt] DATETIME      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Veto_Match FOREIGN KEY ([MatchID]) REFERENCES [tblMatch]([MatchID]) ON DELETE CASCADE,
    CONSTRAINT FK_Veto_Team  FOREIGN KEY ([TeamID])  REFERENCES [tblTeam]([TeamID])
);
GO

-- ── 10. tblSideSelection ──────────────────────────────────────
-- Chọn phe Blue/Red (MOBA): Side phải là 'Blue' hoặc 'Red' (PascalCase)
CREATE TABLE [tblSideSelection] (
    [SelectID]  INT          IDENTITY(1,1) PRIMARY KEY,
    [MatchID]   INT          NOT NULL,
    [TeamID]    INT          NOT NULL,
    [Side]      VARCHAR(10)  NOT NULL
        CHECK ([Side] IN ('Blue','Red')),
    [CreatedAt] DATETIME     NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Side_Match FOREIGN KEY ([MatchID]) REFERENCES [tblMatch]([MatchID]) ON DELETE CASCADE,
    CONSTRAINT FK_Side_Team  FOREIGN KEY ([TeamID])  REFERENCES [tblTeam]([TeamID])
);
GO

-- ── 11. tblBRRound ────────────────────────────────────────────
-- Vòng Battle Royale (mỗi RoundNumber unique trong 1 giải)
CREATE TABLE [tblBRRound] (
    [RoundID]       INT      IDENTITY(1,1) PRIMARY KEY,
    [TournamentID]  INT      NOT NULL,
    [RoundNumber]   INT      NOT NULL,
    [PlayedAt]      DATETIME NULL,

    CONSTRAINT FK_BRRound_Tournament FOREIGN KEY ([TournamentID])
        REFERENCES [tblTournament]([TournamentID]),
    CONSTRAINT UQ_BRRound_Number UNIQUE ([TournamentID],[RoundNumber])
);
GO

-- ── 12. tblBRScore ────────────────────────────────────────────
-- Điểm BR mỗi vòng của từng đội
-- TotalPoints = RankingPoints + KillPoints (PERSISTED Computed Column)
CREATE TABLE [tblBRScore] (
    [ScoreID]        INT  IDENTITY(1,1) PRIMARY KEY,
    [RoundID]        INT  NOT NULL,
    [TeamID]         INT  NOT NULL,
    [PlacementRank]  INT  NULL,
    [RankingPoints]  INT  NOT NULL DEFAULT 0,
    [KillPoints]     INT  NOT NULL DEFAULT 0,
    [TotalPoints]    AS ([RankingPoints] + [KillPoints]) PERSISTED,

    CONSTRAINT FK_BRScore_Round FOREIGN KEY ([RoundID]) REFERENCES [tblBRRound]([RoundID]),
    CONSTRAINT FK_BRScore_Team  FOREIGN KEY ([TeamID])  REFERENCES [tblTeam]([TeamID]),
    CONSTRAINT UQ_BRScore_Per_Round UNIQUE ([RoundID],[TeamID])
);
GO

-- ── 13. tblDispute ────────────────────────────────────────────
-- Khiếu nại: Open → Resolved | Dismissed. SLA 48 giờ.
-- FiledByTeamID=0 cho phép nộp không gắn đội cụ thể (frontend direct submit)
CREATE TABLE [tblDispute] (
    [DisputeID]     INT            IDENTITY(1,1) PRIMARY KEY,
    [MatchID]       INT            NOT NULL,
    [FiledByTeamID] INT            NOT NULL DEFAULT 0,  -- 0 = không gắn đội cụ thể
    [Category]      VARCHAR(30)    NOT NULL DEFAULT 'Other'
        CHECK ([Category] IN ('HackCheat','WrongScore','UnauthorizedPlayer','Other')),
    [Description]   NVARCHAR(1000) NOT NULL,
    [EvidenceURL]   NVARCHAR(500)  NULL,
    [Status]        VARCHAR(20)    NOT NULL DEFAULT 'Open'
        CHECK ([Status] IN ('Open','Resolved','Dismissed')),
    [AdminNote]     NVARCHAR(1000) NULL,
    [CreatedAt]     DATETIME       NOT NULL DEFAULT GETDATE(),
    [ResolvedAt]    DATETIME       NULL,
    [ResolvedBy]    INT            NULL,

    CONSTRAINT FK_Dispute_Match      FOREIGN KEY ([MatchID])     REFERENCES [tblMatch]([MatchID]),
    CONSTRAINT FK_Dispute_ResolvedBy FOREIGN KEY ([ResolvedBy])  REFERENCES [tblUser]([UserID])
    -- FiledByTeamID không có FK để cho phép giá trị 0 (không gắn đội)
);
GO

-- ── 14. tblNotification ───────────────────────────────────────
-- Thông báo in-app: Info | Warning | Success | Error | Action
CREATE TABLE [tblNotification] (
    [NotificationID]  INT            IDENTITY(1,1) PRIMARY KEY,
    [RecipientID]     INT            NOT NULL,
    [Title]           NVARCHAR(200)  NOT NULL,
    [Message]         NVARCHAR(1000) NOT NULL,
    [Type]            VARCHAR(30)    NOT NULL DEFAULT 'Info'
        CHECK ([Type] IN ('Info','Warning','Success','Error','Action')),
    [IsRead]          BIT            NOT NULL DEFAULT 0,
    [RelatedEntity]   VARCHAR(50)    NULL,
    [RelatedEntityID] INT            NULL,
    [CreatedAt]       DATETIME       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Notification_Recipient FOREIGN KEY ([RecipientID])
        REFERENCES [tblUser]([UserID]) ON DELETE CASCADE
);
GO

-- ── 15. tblAuditLog ───────────────────────────────────────────
-- Nhật ký Admin (immutable: không UPDATE/DELETE sau khi ghi)
CREATE TABLE [tblAuditLog] (
    [LogID]           INT            IDENTITY(1,1) PRIMARY KEY,
    [UserID]          INT            NULL,
    [Action]          VARCHAR(100)   NOT NULL,
    [Timestamp]       DATETIME       NOT NULL DEFAULT GETDATE(),
    [Detail]          NVARCHAR(2000) NULL,
    [IPAddress]       VARCHAR(45)    NULL,
    [AffectedEntity]  VARCHAR(50)    NULL,
    [AffectedEntityID] INT           NULL,
    [Result]          VARCHAR(20)    NULL DEFAULT 'Success'
        CHECK ([Result] IN ('Success','Failed','Warning')),

    CONSTRAINT FK_AuditLog_User FOREIGN KEY ([UserID])
        REFERENCES [tblUser]([UserID]) ON DELETE SET NULL
);
GO

PRINT N'✓ Tạo 15 bảng thành công.';
GO

-- ═════════════════════════════════════════════════════════════════
-- BƯỚC 3: INDEXES (tối ưu truy vấn thường gặp)
-- ═════════════════════════════════════════════════════════════════

-- tblUser
CREATE INDEX IX_User_Username        ON [tblUser]([Username]);
CREATE INDEX IX_User_Role            ON [tblUser]([Role]);

-- tblTournament
CREATE INDEX IX_Tournament_Status    ON [tblTournament]([Status]);
CREATE INDEX IX_Tournament_GameType  ON [tblTournament]([GameType]);
CREATE INDEX IX_Tournament_StartDate ON [tblTournament]([StartDate] DESC);
CREATE INDEX IX_Tournament_GameName  ON [tblTournament]([GameName]);

-- tblTeam
CREATE INDEX IX_Team_TournamentID    ON [tblTeam]([TournamentID]);
CREATE INDEX IX_Team_Status          ON [tblTeam]([Status]);
CREATE INDEX IX_Team_CaptainID       ON [tblTeam]([CaptainID]);

-- tblMatch
CREATE INDEX IX_Match_TournamentID   ON [tblMatch]([TournamentID]);
CREATE INDEX IX_Match_Status         ON [tblMatch]([Status]);
CREATE INDEX IX_Match_ScheduledTime  ON [tblMatch]([ScheduledTime]);

-- tblNotification
CREATE INDEX IX_Notification_Recipient ON [tblNotification]([RecipientID],[IsRead]);

-- tblAuditLog
CREATE INDEX IX_AuditLog_Timestamp   ON [tblAuditLog]([Timestamp] DESC);
CREATE INDEX IX_AuditLog_UserID      ON [tblAuditLog]([UserID]);
CREATE INDEX IX_AuditLog_Action      ON [tblAuditLog]([Action]);

GO
PRINT N'✓ Tạo 15 indexes thành công.';
GO

-- ═════════════════════════════════════════════════════════════════
-- BƯỚC 4: DỮ LIỆU THAM CHIẾU — tblGameTypeConfig (6 loại game)
-- ═════════════════════════════════════════════════════════════════

INSERT INTO [tblGameTypeConfig]
    ([GameType],[DisplayName],[HasMapVeto],[HasSideSelection],[HasBRScoring],
     [HasMapPool],[DefaultMinPlayers],[DefaultMaxPlayers],[DefaultCheckInMinutes],
     [SupportedFormats],[Examples])
VALUES
    ('MOBA',        N'MOBA (5v5)',            0,1,0,0, 5, 6,15,
     'SingleElimination',
     N'League of Legends, Dota 2, Liên Quân Mobile, Honor of Kings'),

    ('FPS',         N'FPS (5v5)',             1,0,0,1, 5, 6,15,
     'SingleElimination',
     N'Valorant, CS2, Apex Legends, Overwatch 2'),

    ('BattleRoyale',N'Battle Royale',          0,0,1,0, 4, 8,30,
     'BattleRoyale',
     N'PUBG, Free Fire, Fortnite, Apex Legends'),

    ('Fighting',    N'Fighting Game (1v1)',    0,0,0,0, 1, 1,10,
     'SingleElimination',
     N'Tekken 8, Street Fighter 6, Mortal Kombat 1, Guilty Gear Strive'),

    ('RTS',         N'Real-Time Strategy',    0,0,0,1, 1, 2,15,
     'SingleElimination',
     N'StarCraft II, Age of Empires IV, Warcraft III, Total War'),

    ('Sports',      N'Sports Gaming',         0,0,0,0, 1,11,15,
     'SingleElimination',
     N'EA Sports FC 25, Rocket League, NBA 2K25, eFootball 2025');
GO
PRINT N'✓ Seed tblGameTypeConfig (6 loại).';
GO

-- ═════════════════════════════════════════════════════════════════
-- BƯỚC 5: TÀI KHOẢN ADMIN MẶC ĐỊNH
-- BCrypt hash thật của chuỗi "admin", cost=12
-- Tạo bằng: BCrypt.Net.BCrypt.HashPassword("admin", 12)
-- ═════════════════════════════════════════════════════════════════

INSERT INTO [tblUser]
    ([Username],[PasswordHash],[Role],[IsLocked],[FullName],[Email],
     [FailedLoginAttempts],[IsActivated],[MustChangePassword])
VALUES
    ('admin',
     '$2a$12$.fi.19yr0t0QUGpiGX9/suq9f99MyDWjacxrhYvb/E6Im1nhxcvKO',
     'Admin', 0, N'Quản Trị Viên Hệ Thống', 'admin@etms.vn', 0, 1, 0);
GO
PRINT N'✓ Tạo tài khoản Admin mặc định (mật khẩu: admin).';
GO

-- ═════════════════════════════════════════════════════════════════
-- BƯỚC 6: STORED PROCEDURES
-- ═════════════════════════════════════════════════════════════════

-- sp_GetDashboardStats: thống kê tổng quan cho Dashboard
CREATE OR ALTER PROCEDURE sp_GetDashboardStats
AS
BEGIN
    SELECT
        (SELECT COUNT(*) FROM tblTournament WHERE Status='Active')       AS ActiveTournaments,
        (SELECT COUNT(*) FROM tblTournament WHERE Status='Registration') AS RegistrationTournaments,
        (SELECT COUNT(*) FROM tblTournament)                             AS TotalTournaments,
        (SELECT COUNT(*) FROM tblTeam    WHERE Status='Pending')         AS PendingTeams,
        (SELECT COUNT(*) FROM tblTeam    WHERE Status='Approved')        AS ApprovedTeams,
        (SELECT COUNT(*) FROM tblDispute WHERE Status='Open')            AS OpenDisputes,
        (SELECT COUNT(*) FROM tblUser    WHERE Role != 'Guest')          AS ActiveUsers,
        (SELECT COUNT(*) FROM tblMatch
         WHERE CAST(ScheduledTime AS DATE) = CAST(GETDATE() AS DATE)
           AND Status NOT IN ('Completed','Cancelled'))                   AS TodayMatches;
END
GO

-- sp_ResetPassword: reset mật khẩu về "admin" (chỉ dùng khi dev/test)
CREATE OR ALTER PROCEDURE sp_ResetPassword @Username NVARCHAR(50)
AS
BEGIN
    UPDATE [tblUser]
    SET [PasswordHash]        = '$2a$12$.fi.19yr0t0QUGpiGX9/suq9f99MyDWjacxrhYvb/E6Im1nhxcvKO',
        [FailedLoginAttempts] = 0,
        [IsLocked]            = 0
    WHERE [Username] = @Username;
    PRINT N'Đã reset mật khẩu về "admin" cho user: ' + @Username;
END
GO

PRINT N'✓ Tạo 2 Stored Procedures.';
GO

-- ═════════════════════════════════════════════════════════════════
-- KIỂM TRA KẾT QUẢ
-- ═════════════════════════════════════════════════════════════════

SELECT
    (SELECT COUNT(*) FROM tblUser)             AS [Users],
    (SELECT COUNT(*) FROM tblGameTypeConfig)   AS [GameTypes],
    (SELECT COUNT(*) FROM tblTournament)       AS [Tournaments],
    (SELECT COUNT(*) FROM tblTeam)             AS [Teams];
GO

SELECT UserID, Username, Role, FullName, Email, IsActivated FROM tblUser ORDER BY UserID;
GO

-- ═════════════════════════════════════════════════════════════════
PRINT N'';
PRINT N'╔══════════════════════════════════════════════════════════╗';
PRINT N'║  ETMS Database v5.2 — Import thành công!                ║';
PRINT N'║  15 bảng | 15 indexes | 2 SPs | Dữ liệu sạch           ║';
PRINT N'║  ─────────────────────────────────────────────────────  ║';
PRINT N'║  Tài khoản admin: admin / admin                         ║';
PRINT N'║  Các tài khoản khác: đăng ký qua app + email kích hoạt  ║';
PRINT N'╚══════════════════════════════════════════════════════════╝';
GO
