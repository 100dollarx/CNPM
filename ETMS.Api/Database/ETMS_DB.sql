-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  ETMS — Esports Tournament Management System                               ║
-- ║  Database Import Script — SQL Server 2019+                                 ║
-- ║  Phiên bản: 5.0 | Ngày: 2026-04-02                                         ║
-- ║  Chạy 1 lần trong SSMS hoặc sqlcmd để tạo toàn bộ database                ║
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
    PRINT N'Đã xóa database cũ ETMS_DB';
END
GO
CREATE DATABASE ETMS_DB COLLATE Vietnamese_CI_AS;
GO
USE ETMS_DB;
GO
PRINT N'✓ Tạo database ETMS_DB thành công';
GO

-- ═════════════════════════════════════════════════════════════════
-- BƯỚC 2: TẠO CÁC BẢNG
-- ═════════════════════════════════════════════════════════════════

-- ── 1. tblUser ────────────────────────────────────────────────
-- Tài khoản: Admin | Captain | Player | Guest
-- Mật khẩu BCrypt cost=12, khóa sau 5 lần sai
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
    [CreatedAt]           DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- ── 2. tblGameTypeConfig ──────────────────────────────────────
-- Reference table: cấu hình cơ chế theo thể loại game
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

-- ── 3. tblTournament ──────────────────────────────────────────
-- Giải đấu: Draft → Registration → Active → Completed | Cancelled
CREATE TABLE [tblTournament] (
    [TournamentID]        INT           IDENTITY(1,1) PRIMARY KEY,
    [Name]                NVARCHAR(200) NOT NULL,
    [GameType]            VARCHAR(30)   NOT NULL
        CHECK ([GameType] IN ('MOBA','FPS','BattleRoyale','Fighting','RTS','Sports'))
        REFERENCES [tblGameTypeConfig]([GameType]),
    [GameName]            NVARCHAR(100) NULL,        -- Tên game cụ thể (Valorant, LoL, PUBG...)
    [Format]              VARCHAR(30)   NOT NULL
        CHECK ([Format] IN ('SingleElimination','BattleRoyale','DoubleElimination','RoundRobin','Swiss')),
    [Status]              VARCHAR(20)   NOT NULL DEFAULT 'Draft'
        CHECK ([Status] IN ('Draft','Registration','Active','Completed','Cancelled')),
    [StartDate]           DATETIME      NOT NULL,
    [EndDate]             DATETIME      NULL,
    [MaxTeams]            INT           NOT NULL,
    [MinPlayersPerTeam]   INT           NOT NULL DEFAULT 5,
    [MaxPlayersPerTeam]   INT           NOT NULL DEFAULT 5,
    [RegistrationDeadline] DATETIME     NULL,
    [BracketGenerated]    BIT           NOT NULL DEFAULT 0,
    [Description]         NVARCHAR(MAX) NULL,
    [CreatedBy]           INT           NULL,
    [CreatedAt]           DATETIME      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Tournament_CreatedBy FOREIGN KEY ([CreatedBy])
        REFERENCES [tblUser]([UserID]) ON DELETE SET NULL
);
GO

-- ── 4. tblGameConfig ──────────────────────────────────────────
-- Cấu hình game cho từng giải (1:1 với tblTournament)
CREATE TABLE [tblGameConfig] (
    [ConfigID]             INT           IDENTITY(1,1) PRIMARY KEY,
    [TournamentID]         INT           NOT NULL UNIQUE,
    [BestOf]               INT           NOT NULL DEFAULT 1
        CHECK ([BestOf] IN (1,3,5)),
    [MapPool]              NVARCHAR(MAX) NULL,        -- JSON array ["Ascent","Bind",...]
    [VetoSequence]         NVARCHAR(MAX) NULL,        -- JSON array ["Ban","Ban","Pick",...]
    [KillPointPerKill]     INT           NOT NULL DEFAULT 1,
    [RankingPointTable]    NVARCHAR(MAX) NULL,        -- JSON {"1":25,"2":18,...}
    [MaxParticipants]      INT           NULL,
    [PlacementPoints]      NVARCHAR(MAX) NULL,
    [CheckInWindowMinutes] INT           NOT NULL DEFAULT 15,

    CONSTRAINT FK_GameConfig_Tournament FOREIGN KEY ([TournamentID])
        REFERENCES [tblTournament]([TournamentID]) ON DELETE CASCADE
);
GO

-- ── 5. tblTeam ────────────────────────────────────────────────
-- Đội tuyển: Pending → Approved | Rejected | Disqualified
CREATE TABLE [tblTeam] (
    [TeamID]              INT           IDENTITY(1,1) PRIMARY KEY,
    [TournamentID]        INT           NOT NULL,
    [Name]                NVARCHAR(100) NOT NULL,
    [Logo]                NVARCHAR(500) NULL,
    [CaptainID]           INT           NOT NULL,
    [Status]              VARCHAR(20)   NOT NULL DEFAULT 'Pending'
        CHECK ([Status] IN ('Pending','Approved','Rejected','Disqualified')),
    [RejectionReason]     NVARCHAR(500) NULL,
    [SubmittedAt]         DATETIME      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Team_Tournament FOREIGN KEY ([TournamentID])
        REFERENCES [tblTournament]([TournamentID]),
    CONSTRAINT FK_Team_Captain FOREIGN KEY ([CaptainID])
        REFERENCES [tblUser]([UserID]),
    CONSTRAINT UQ_Team_Name_Per_Tournament UNIQUE ([TournamentID], [Name]),
    CONSTRAINT UQ_Captain_Per_Tournament   UNIQUE ([TournamentID], [CaptainID])
);
GO

-- ── 6. tblPlayer ──────────────────────────────────────────────
-- Tuyển thủ (thành viên đội)
CREATE TABLE [tblPlayer] (
    [PlayerID]            INT           IDENTITY(1,1) PRIMARY KEY,
    [TeamID]              INT           NOT NULL,
    [UserID]              INT           NOT NULL,
    [InGameID]            NVARCHAR(100) NOT NULL,
    [IsActive]            BIT           NOT NULL DEFAULT 1,
    [JoinedAt]            DATETIME      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Player_Team FOREIGN KEY ([TeamID])
        REFERENCES [tblTeam]([TeamID]) ON DELETE CASCADE,
    CONSTRAINT FK_Player_User FOREIGN KEY ([UserID])
        REFERENCES [tblUser]([UserID])
);
GO

-- ── 7. tblMatch ───────────────────────────────────────────────
-- Trận đấu, bracket linked list
-- Status: Scheduled → CheckInOpen → Live → Completed | Disputed | Walkover | Cancelled
CREATE TABLE [tblMatch] (
    [MatchID]             INT           IDENTITY(1,1) PRIMARY KEY,
    [TournamentID]        INT           NOT NULL,
    [Team1ID]             INT           NULL,
    [Team2ID]             INT           NULL,
    [WinnerID]            INT           NULL,
    [LoserID]             INT           NULL,
    [Status]              VARCHAR(30)   NOT NULL DEFAULT 'Scheduled'
        CHECK ([Status] IN ('Scheduled','CheckInOpen','Live','Completed','Walkover',
                            'WalkoverPending','Disputed','Postponed','Cancelled')),
    [ScheduledTime]       DATETIME      NULL,
    [ActualStartTime]     DATETIME      NULL,
    [NextMatchID]         INT           NULL,
    [NextMatchSlot]       INT           NULL,   -- 1 hoặc 2 (Team1ID/Team2ID của trận kế)
    [Round]               INT           NOT NULL,
    [MatchOrder]          INT           NOT NULL,
    [IsBye]               BIT           NOT NULL DEFAULT 0,
    [CheckIn_Team1]       BIT           NOT NULL DEFAULT 0,
    [CheckIn_Team2]       BIT           NOT NULL DEFAULT 0,

    CONSTRAINT FK_Match_Tournament FOREIGN KEY ([TournamentID])
        REFERENCES [tblTournament]([TournamentID]),
    CONSTRAINT FK_Match_Team1 FOREIGN KEY ([Team1ID])
        REFERENCES [tblTeam]([TeamID]),
    CONSTRAINT FK_Match_Team2 FOREIGN KEY ([Team2ID])
        REFERENCES [tblTeam]([TeamID]),
    CONSTRAINT FK_Match_Winner FOREIGN KEY ([WinnerID])
        REFERENCES [tblTeam]([TeamID]),
    CONSTRAINT FK_Match_Loser FOREIGN KEY ([LoserID])
        REFERENCES [tblTeam]([TeamID]),
    CONSTRAINT FK_Match_NextMatch FOREIGN KEY ([NextMatchID])
        REFERENCES [tblMatch]([MatchID])
);
GO

-- ── 8. tblMatchResult ─────────────────────────────────────────
-- Kết quả trận đấu (1 trận : 1 kết quả)
-- Status: PendingVerification → Verified | Disputed | Rejected
CREATE TABLE [tblMatchResult] (
    [ResultID]            INT           IDENTITY(1,1) PRIMARY KEY,
    [MatchID]             INT           NOT NULL UNIQUE,
    [Score1]              INT           NOT NULL,
    [Score2]              INT           NOT NULL,
    [EvidenceURL]         NVARCHAR(500) NOT NULL DEFAULT '',
    [Status]              VARCHAR(30)   NOT NULL DEFAULT 'PendingVerification'
        CHECK ([Status] IN ('PendingVerification','Verified','Disputed','Rejected')),
    [SubmittedBy]         INT           NOT NULL,
    [VerifiedBy]          INT           NULL,
    [SubmittedAt]         DATETIME      NOT NULL DEFAULT GETDATE(),
    [VerifiedAt]          DATETIME      NULL,
    [AdminNote]           NVARCHAR(500) NULL,

    CONSTRAINT FK_Result_Match FOREIGN KEY ([MatchID])
        REFERENCES [tblMatch]([MatchID]),
    CONSTRAINT FK_Result_SubmittedBy FOREIGN KEY ([SubmittedBy])
        REFERENCES [tblUser]([UserID]),
    CONSTRAINT FK_Result_VerifiedBy FOREIGN KEY ([VerifiedBy])
        REFERENCES [tblUser]([UserID])
);
GO

-- ── 9. tblMapVeto ─────────────────────────────────────────────
-- Map veto sequence (FPS tournaments): Ban | Pick
CREATE TABLE [tblMapVeto] (
    [VetoID]              INT           IDENTITY(1,1) PRIMARY KEY,
    [MatchID]             INT           NOT NULL,
    [TeamID]              INT           NOT NULL,
    [MapName]             NVARCHAR(100) NOT NULL,
    [Action]              VARCHAR(10)   NOT NULL
        CHECK ([Action] IN ('Ban','Pick')),
    [VetoOrder]           INT           NOT NULL,
    [CreatedAt]           DATETIME      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Veto_Match FOREIGN KEY ([MatchID])
        REFERENCES [tblMatch]([MatchID]) ON DELETE CASCADE,
    CONSTRAINT FK_Veto_Team FOREIGN KEY ([TeamID])
        REFERENCES [tblTeam]([TeamID])
);
GO

-- ── 10. tblSideSelection ──────────────────────────────────────
-- Chọn phe Blue/Red (MOBA tournaments)
CREATE TABLE [tblSideSelection] (
    [SelectID]            INT           IDENTITY(1,1) PRIMARY KEY,
    [MatchID]             INT           NOT NULL,
    [TeamID]              INT           NOT NULL,
    [Side]                VARCHAR(10)   NOT NULL
        CHECK ([Side] IN ('Blue','Red')),
    [CreatedAt]           DATETIME      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Side_Match FOREIGN KEY ([MatchID])
        REFERENCES [tblMatch]([MatchID]) ON DELETE CASCADE,
    CONSTRAINT FK_Side_Team FOREIGN KEY ([TeamID])
        REFERENCES [tblTeam]([TeamID])
);
GO

-- ── 11. tblBRRound ────────────────────────────────────────────
-- Vòng đấu Battle Royale (mỗi vòng unique trong 1 giải)
CREATE TABLE [tblBRRound] (
    [RoundID]             INT           IDENTITY(1,1) PRIMARY KEY,
    [TournamentID]        INT           NOT NULL,
    [RoundNumber]         INT           NOT NULL,
    [PlayedAt]            DATETIME      NULL,

    CONSTRAINT FK_BRRound_Tournament FOREIGN KEY ([TournamentID])
        REFERENCES [tblTournament]([TournamentID]),
    CONSTRAINT UQ_BRRound_Number UNIQUE ([TournamentID], [RoundNumber])
);
GO

-- ── 12. tblBRScore ────────────────────────────────────────────
-- Điểm Battle Royale cho từng vòng
-- TotalPoints = RankingPoints + KillPoints (Computed Column)
CREATE TABLE [tblBRScore] (
    [ScoreID]             INT           IDENTITY(1,1) PRIMARY KEY,
    [RoundID]             INT           NOT NULL,
    [TeamID]              INT           NOT NULL,
    [RankingPoints]       INT           NOT NULL DEFAULT 0,
    [KillPoints]          INT           NOT NULL DEFAULT 0,
    [TotalPoints]         AS ([RankingPoints] + [KillPoints]) PERSISTED,
    [PlacementRank]       INT           NULL,

    CONSTRAINT FK_BRScore_Round FOREIGN KEY ([RoundID])
        REFERENCES [tblBRRound]([RoundID]),
    CONSTRAINT FK_BRScore_Team FOREIGN KEY ([TeamID])
        REFERENCES [tblTeam]([TeamID]),
    CONSTRAINT UQ_BRScore_Per_Round UNIQUE ([RoundID], [TeamID])
);
GO

-- ── 13. tblDispute ────────────────────────────────────────────
-- Khiếu nại: HackCheat | WrongScore | UnauthorizedPlayer | Other
-- SLA: 48 giờ xử lý
CREATE TABLE [tblDispute] (
    [DisputeID]           INT           IDENTITY(1,1) PRIMARY KEY,
    [MatchID]             INT           NOT NULL,
    [FiledByTeamID]       INT           NOT NULL,
    [Category]            VARCHAR(30)   NOT NULL DEFAULT 'Other'
        CHECK ([Category] IN ('HackCheat','WrongScore','UnauthorizedPlayer','Other')),
    [Description]         NVARCHAR(1000) NOT NULL,
    [EvidenceURL]         NVARCHAR(500) NULL,
    [Status]              VARCHAR(20)   NOT NULL DEFAULT 'Open'
        CHECK ([Status] IN ('Open','Resolved','Dismissed')),
    [AdminNote]           NVARCHAR(1000) NULL,
    [CreatedAt]           DATETIME      NOT NULL DEFAULT GETDATE(),
    [ResolvedAt]          DATETIME      NULL,
    [ResolvedBy]          INT           NULL,

    CONSTRAINT FK_Dispute_Match FOREIGN KEY ([MatchID])
        REFERENCES [tblMatch]([MatchID]),
    CONSTRAINT FK_Dispute_Team FOREIGN KEY ([FiledByTeamID])
        REFERENCES [tblTeam]([TeamID]),
    CONSTRAINT FK_Dispute_ResolvedBy FOREIGN KEY ([ResolvedBy])
        REFERENCES [tblUser]([UserID])
);
GO

-- ── 14. tblNotification ───────────────────────────────────────
-- Thông báo in-app: Info | Warning | Success | Error | Action
CREATE TABLE [tblNotification] (
    [NotificationID]      INT           IDENTITY(1,1) PRIMARY KEY,
    [RecipientID]         INT           NOT NULL,
    [Title]               NVARCHAR(200) NOT NULL,
    [Message]             NVARCHAR(1000) NOT NULL,
    [Type]                VARCHAR(30)   NOT NULL DEFAULT 'Info'
        CHECK ([Type] IN ('Info','Warning','Success','Error','Action')),
    [IsRead]              BIT           NOT NULL DEFAULT 0,
    [RelatedEntity]       VARCHAR(50)   NULL,
    [RelatedEntityID]     INT           NULL,
    [CreatedAt]           DATETIME      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Notification_Recipient FOREIGN KEY ([RecipientID])
        REFERENCES [tblUser]([UserID]) ON DELETE CASCADE
);
GO

-- ── 15. tblAuditLog ───────────────────────────────────────────
-- Nhật ký Admin actions (CREATE/UPDATE/DELETE/APPROVE/REJECT/...)
CREATE TABLE [tblAuditLog] (
    [LogID]               INT           IDENTITY(1,1) PRIMARY KEY,
    [UserID]              INT           NULL,
    [Action]              VARCHAR(100)  NOT NULL,
    [Timestamp]           DATETIME      NOT NULL DEFAULT GETDATE(),
    [Detail]              NVARCHAR(2000) NULL,
    [IPAddress]           VARCHAR(45)   NULL,
    [AffectedEntity]      VARCHAR(50)   NULL,
    [AffectedEntityID]    INT           NULL,
    [Result]              VARCHAR(20)   NULL DEFAULT 'Success'
        CHECK ([Result] IN ('Success','Failed','Warning')),

    CONSTRAINT FK_AuditLog_User FOREIGN KEY ([UserID])
        REFERENCES [tblUser]([UserID]) ON DELETE SET NULL
);
GO

PRINT N'✓ Tạo 15 bảng thành công';
GO

-- ═════════════════════════════════════════════════════════════════
-- BƯỚC 3: INDEXES (tối ưu performance)
-- ═════════════════════════════════════════════════════════════════

CREATE INDEX IX_User_Username           ON [tblUser]([Username]);
CREATE INDEX IX_User_Role               ON [tblUser]([Role]);

CREATE INDEX IX_Tournament_Status       ON [tblTournament]([Status]);
CREATE INDEX IX_Tournament_GameType     ON [tblTournament]([GameType]);
CREATE INDEX IX_Tournament_StartDate    ON [tblTournament]([StartDate] DESC);
CREATE INDEX IX_Tournament_GameName     ON [tblTournament]([GameName]);

CREATE INDEX IX_Team_TournamentID       ON [tblTeam]([TournamentID]);
CREATE INDEX IX_Team_Status             ON [tblTeam]([Status]);
CREATE INDEX IX_Team_CaptainID          ON [tblTeam]([CaptainID]);

CREATE INDEX IX_Match_TournamentID      ON [tblMatch]([TournamentID]);
CREATE INDEX IX_Match_Status            ON [tblMatch]([Status]);
CREATE INDEX IX_Match_ScheduledTime     ON [tblMatch]([ScheduledTime]);

CREATE INDEX IX_Notification_Recipient  ON [tblNotification]([RecipientID], [IsRead]);

CREATE INDEX IX_AuditLog_Timestamp      ON [tblAuditLog]([Timestamp] DESC);
CREATE INDEX IX_AuditLog_UserID         ON [tblAuditLog]([UserID]);
CREATE INDEX IX_AuditLog_Action         ON [tblAuditLog]([Action]);

GO
PRINT N'✓ Tạo 15 indexes thành công';
GO

-- ═════════════════════════════════════════════════════════════════
-- BƯỚC 4: DỮ LIỆU THAM CHIẾU — tblGameTypeConfig
-- ═════════════════════════════════════════════════════════════════

INSERT INTO [tblGameTypeConfig]
    ([GameType], [DisplayName], [HasMapVeto], [HasSideSelection], [HasBRScoring],
     [HasMapPool], [DefaultMinPlayers], [DefaultMaxPlayers], [DefaultCheckInMinutes],
     [SupportedFormats], [Examples])
VALUES
    ('MOBA','MOBA (5v5)',0,1,0,0,5,6,15,
     'SingleElimination',
     N'League of Legends, Dota 2, Liên Quân Mobile, Honor of Kings'),

    ('FPS','FPS (5v5)',1,0,0,1,5,6,15,
     'SingleElimination',
     N'Valorant, CS2, Apex Legends, Overwatch 2'),

    ('BattleRoyale','Battle Royale',0,0,1,0,4,8,30,
     'BattleRoyale',
     N'PUBG, Free Fire, Fortnite, Apex Legends'),

    ('Fighting','Fighting Game (1v1)',0,0,0,0,1,1,10,
     'SingleElimination',
     N'Tekken 8, Street Fighter 6, Mortal Kombat 1, Guilty Gear Strive'),

    ('RTS','Real-Time Strategy',0,0,0,1,1,2,15,
     'SingleElimination',
     N'StarCraft II, Age of Empires IV, Warcraft III, Total War'),

    ('Sports','Sports Gaming',0,0,0,0,1,11,15,
     'SingleElimination',
     N'EA Sports FC 25, Rocket League, NBA 2K25, eFootball 2025');
GO

PRINT N'✓ Seed tblGameTypeConfig (6 loại) thành công';
GO

-- ═════════════════════════════════════════════════════════════════
-- BƯỚC 5: TÀI KHOẢN NGƯỜI DÙNG (BCrypt hash thật của "admin")
-- Hash được tạo bằng BCrypt.Net.BCrypt.HashPassword("admin", 12)
-- Mật khẩu: admin (dùng để đăng nhập ngay)
-- ═════════════════════════════════════════════════════════════════

INSERT INTO [tblUser] ([Username],[PasswordHash],[Role],[IsLocked],[FullName],[Email],[FailedLoginAttempts])
VALUES
    -- ── Tài khoản Admin ──────────────────────────────────────────────
    ('admin',
     '$2a$12$.fi.19yr0t0QUGpiGX9/suq9f99MyDWjacxrhYvb/E6Im1nhxcvKO',
     'Admin', 0, N'Quản Trị Viên Hệ Thống', 'admin@etms.vn', 0),

    -- ── Đội trưởng ───────────────────────────────────────────────────
    ('captain01',
     '$2a$12$.fi.19yr0t0QUGpiGX9/suq9f99MyDWjacxrhYvb/E6Im1nhxcvKO',
     'Captain', 0, N'Lê Văn Minh (GAM)', 'captain01@etms.vn', 0),

    ('captain02',
     '$2a$12$.fi.19yr0t0QUGpiGX9/suq9f99MyDWjacxrhYvb/E6Im1nhxcvKO',
     'Captain', 0, N'Trần Hoàng Anh (Whales)', 'captain02@etms.vn', 0),

    ('captain03',
     '$2a$12$.fi.19yr0t0QUGpiGX9/suq9f99MyDWjacxrhYvb/E6Im1nhxcvKO',
     'Captain', 0, N'Nguyễn Quốc Bảo (Flash)', 'captain03@etms.vn', 0),

    -- ── Tuyển thủ ────────────────────────────────────────────────────
    ('player01',
     '$2a$12$.fi.19yr0t0QUGpiGX9/suq9f99MyDWjacxrhYvb/E6Im1nhxcvKO',
     'Player', 0, N'Phạm Văn Bình (Mid)', 'player01@etms.vn', 0),

    ('player02',
     '$2a$12$.fi.19yr0t0QUGpiGX9/suq9f99MyDWjacxrhYvb/E6Im1nhxcvKO',
     'Player', 0, N'Võ Thị Cẩm (Bot)', 'player02@etms.vn', 0),

    ('player03',
     '$2a$12$.fi.19yr0t0QUGpiGX9/suq9f99MyDWjacxrhYvb/E6Im1nhxcvKO',
     'Player', 0, N'Hoàng Đức Duy (Top)', 'player03@etms.vn', 0),

    ('player04',
     '$2a$12$.fi.19yr0t0QUGpiGX9/suq9f99MyDWjacxrhYvb/E6Im1nhxcvKO',
     'Player', 0, N'Đặng Minh Hải (JG)', 'player04@etms.vn', 0),

    ('player05',
     '$2a$12$.fi.19yr0t0QUGpiGX9/suq9f99MyDWjacxrhYvb/E6Im1nhxcvKO',
     'Player', 0, N'Bùi Quốc Khang (Sup)', 'player05@etms.vn', 0),

    ('player06',
     '$2a$12$.fi.19yr0t0QUGpiGX9/suq9f99MyDWjacxrhYvb/E6Im1nhxcvKO',
     'Player', 0, N'Lý Thanh Lâm (ADC)', 'player06@etms.vn', 0),

    ('player07',
     '$2a$12$.fi.19yr0t0QUGpiGX9/suq9f99MyDWjacxrhYvb/E6Im1nhxcvKO',
     'Player', 0, N'Ngô Huy Mẫn (Flex)', 'player07@etms.vn', 0),

    ('player08',
     '$2a$12$.fi.19yr0t0QUGpiGX9/suq9f99MyDWjacxrhYvb/E6Im1nhxcvKO',
     'Player', 0, N'Trương Văn Nam (Entry)', 'player08@etms.vn', 0),

    ('player09',
     '$2a$12$.fi.19yr0t0QUGpiGX9/suq9f99MyDWjacxrhYvb/E6Im1nhxcvKO',
     'Player', 0, N'Đỗ Quang Oanh (IGL)', 'player09@etms.vn', 0),

    ('player10',
     '$2a$12$.fi.19yr0t0QUGpiGX9/suq9f99MyDWjacxrhYvb/E6Im1nhxcvKO',
     'Player', 0, N'Phan Minh Phúc (Sniper)', 'player10@etms.vn', 0),

    -- ── Khách ────────────────────────────────────────────────────────
    ('guest01',
     '$2a$12$.fi.19yr0t0QUGpiGX9/suq9f99MyDWjacxrhYvb/E6Im1nhxcvKO',
     'Guest', 0, N'Khán giả Tham quan', 'guest01@etms.vn', 0);
GO

PRINT N'✓ Seed 15 tài khoản (mật khẩu: admin)';
GO

-- ═════════════════════════════════════════════════════════════════
-- BƯỚC 6: GIẢI ĐẤU MẪU
-- ═════════════════════════════════════════════════════════════════

INSERT INTO [tblTournament]
    ([Name],[GameType],[GameName],[Format],[Status],
     [StartDate],[EndDate],[MaxTeams],[MinPlayersPerTeam],[MaxPlayersPerTeam],
     [RegistrationDeadline],[CreatedBy],[Description])
VALUES
    -- Giải 1: MOBA đang diễn ra (Active, có bracket)
    (N'VCS Mùa Xuân 2026',
     'MOBA','League of Legends','SingleElimination','Active',
     '2026-04-01','2026-06-30', 16,5,6, '2026-03-28', 1,
     N'Giải vô địch Liên Minh Huyền Thoại Việt Nam Mùa Xuân 2026. 16 đội tranh tài.'),

    -- Giải 2: FPS đang mở đăng ký (Registration)
    (N'VALORANT Vietnam Open 2026',
     'FPS','Valorant','SingleElimination','Registration',
     '2026-05-10','2026-07-20', 8,5,6, '2026-05-01', 1,
     N'Giải đấu Valorant hàng đầu Việt Nam. Vé dự VCT Pacific sẽ trao cho nhà vô địch.'),

    -- Giải 3: Battle Royale ở trạng thái Draft
    (N'PUBG Mobile Pro League S5',
     'BattleRoyale','PUBG','BattleRoyale','Draft',
     '2026-06-01','2026-08-31', 20,4,8, '2026-05-25', 1,
     N'Hệ thống điểm tích lũy theo vòng. Top 3 đội nhận vé dự PMCO.'),

    -- Giải 4: Fighting, Draft
    (N'Tekken 8 Vietnam Championship 2026',
     'Fighting','Tekken 8','SingleElimination','Draft',
     '2026-07-01','2026-07-15', 32,1,1, '2026-06-25', 1,
     N'Giải đấu Tekken 8 toàn quốc. 1v1 Solo, 32 người tham dự.'),

    -- Giải 5: CS2 Draft
    (N'CS2 Vietnam Masters 2026',
     'FPS','CS2','SingleElimination','Draft',
     '2026-08-15','2026-09-01', 16,5,6, '2026-08-10', 1,
     N'Giải đấu CS2 chuyên nghiệp, map pool chuẩn IEM. Best of 3.');
GO

PRINT N'✓ Seed 5 giải đấu mẫu';
GO

-- ═════════════════════════════════════════════════════════════════
-- BƯỚC 7: CẤU HÌNH GAME
-- ═════════════════════════════════════════════════════════════════

INSERT INTO [tblGameConfig]
    ([TournamentID],[BestOf],[MapPool],[VetoSequence],[KillPointPerKill],[RankingPointTable],[CheckInWindowMinutes])
VALUES
    -- VCS: MOBA Best of 3, không map veto
    (1, 3, NULL, NULL, 0, NULL, 15),

    -- VALORANT: FPS Best of 3, map pool + veto (Ban,Ban,Pick,Pick,Ban,Ban,Pick)
    (2, 3,
     '["Ascent","Bind","Haven","Split","Icebox","Breeze","Fracture","Lotus","Pearl"]',
     '["Ban","Ban","Pick","Pick","Ban","Ban","Pick"]',
     0, NULL, 15),

    -- PUBG Mobile: BR, Kill 1pt, ranking table
    (3, 1, NULL, NULL, 1,
     '{"1":25,"2":18,"3":15,"4":12,"5":10,"6":8,"7":6,"8":4,"9":2,"10":1}', 30);
GO

PRINT N'✓ Seed 3 cấu hình game';
GO

-- ═════════════════════════════════════════════════════════════════
-- BƯỚC 8: ĐỘI TUYỂN MẪU
-- ═════════════════════════════════════════════════════════════════

-- Giải VCS (TournamentID=1): 8 đội (chỉ 1 unique captain per tournament nên dùng khác nhau)
INSERT INTO [tblTeam] ([TournamentID],[Name],[CaptainID],[Status])
VALUES
    (1, N'GAM Esports',        2, 'Approved'),
    (1, N'Team Whales',        3, 'Approved'),
    (1, N'Saigon Buffalo',     4, 'Approved'),   -- dùng player01 làm captain tạm (demo)
    (1, N'SBTC Esports',       5, 'Approved'),

    -- Giải VALORANT (TournamentID=2): 3 đội đang chờ duyệt
    (2, N'Bleed Esports VN',   2, 'Pending'),
    (2, N'Team Flash Vietnam', 3, 'Pending'),

    -- Giải PUBG (TournamentID=3): 2 đội
    (3, N'LifeStealer Squad',  2, 'Pending'),
    (3, N'SkyBolt Gaming',     3, 'Pending');
GO

PRINT N'✓ Seed 8 đội tuyển mẫu';
GO

-- ═════════════════════════════════════════════════════════════════
-- BƯỚC 9: TUYỂN THỦ MẪU
-- ═════════════════════════════════════════════════════════════════

INSERT INTO [tblPlayer] ([TeamID],[UserID],[InGameID])
VALUES
    -- GAM Esports (TeamID=1): VCS
    (1, 2,  N'MinhCapt_GAM'),
    (1, 6,  N'Lam_GAM'),
    (1, 7,  N'Man_GAM'),
    (1, 8,  N'Nam_GAM'),
    (1, 9,  N'Oanh_GAM'),

    -- Team Whales (TeamID=2): VCS
    (2, 3,  N'AnhCapt_WHL'),
    (2, 10, N'Phuc_WHL'),
    (2, 11, N'Guest01_WHL'),
    (2, 12, N'P01_WHL'),
    (2, 13, N'P02_WHL');
GO

PRINT N'✓ Seed 10 tuyển thủ mẫu';
GO

-- ═════════════════════════════════════════════════════════════════
-- BƯỚC 10: THÔNG BÁO MẪU
-- ═════════════════════════════════════════════════════════════════

INSERT INTO [tblNotification] ([RecipientID],[Title],[Message],[Type],[RelatedEntity],[RelatedEntityID])
VALUES
    (2, N'🎉 Đội được duyệt!',
     N'Đội GAM Esports đã được Admin duyệt tham gia VCS Mùa Xuân 2026. Chúc thi đấu tốt!',
     'Success', 'Team', 1),

    (3, N'🎉 Đội được duyệt!',
     N'Đội Team Whales đã được Admin duyệt tham gia VCS Mùa Xuân 2026.',
     'Success', 'Team', 2),

    (1, N'📋 Hồ sơ đội mới — VALORANT',
     N'Đội Bleed Esports VN đã đăng ký VALORANT Vietnam Open 2026. Cần xét duyệt.',
     'Action', 'Team', 5),

    (1, N'📋 Hồ sơ đội mới — VALORANT',
     N'Đội Team Flash Vietnam đã đăng ký VALORANT Vietnam Open 2026. Cần xét duyệt.',
     'Action', 'Team', 6),

    (1, N'ℹ️ Hệ thống sẵn sàng',
     N'NEXORA Platform v5.0 đã khởi động. Chào mừng Admin!',
     'Info', NULL, NULL);
GO

PRINT N'✓ Seed 5 thông báo mẫu';
GO

-- ═════════════════════════════════════════════════════════════════
-- BƯỚC 11: AUDIT LOG MẪU
-- ═════════════════════════════════════════════════════════════════

INSERT INTO [tblAuditLog] ([UserID],[Action],[Detail],[AffectedEntity],[AffectedEntityID],[IPAddress],[Result])
VALUES
    (1,'CREATE_TOURNAMENT', N'Tạo giải VCS Mùa Xuân 2026',                   'Tournament',1,'localhost','Success'),
    (1,'CREATE_TOURNAMENT', N'Tạo giải VALORANT Vietnam Open 2026',           'Tournament',2,'localhost','Success'),
    (1,'CREATE_TOURNAMENT', N'Tạo giải PUBG Mobile Pro League S5',            'Tournament',3,'localhost','Success'),
    (1,'APPROVE_TEAM',      N'Duyệt GAM Esports — VCS Mùa Xuân 2026',        'Team',1,'localhost','Success'),
    (1,'APPROVE_TEAM',      N'Duyệt Team Whales — VCS Mùa Xuân 2026',        'Team',2,'localhost','Success'),
    (1,'APPROVE_TEAM',      N'Duyệt Saigon Buffalo — VCS Mùa Xuân 2026',     'Team',3,'localhost','Success'),
    (1,'APPROVE_TEAM',      N'Duyệt SBTC Esports — VCS Mùa Xuân 2026',       'Team',4,'localhost','Success');
GO

PRINT N'✓ Seed 7 audit log mẫu';
GO

-- ═════════════════════════════════════════════════════════════════
-- BƯỚC 12: STORED PROCEDURES
-- ═════════════════════════════════════════════════════════════════

-- Lấy thống kê overview cho Dashboard
CREATE OR ALTER PROCEDURE sp_GetDashboardStats
AS
BEGIN
    SELECT
        (SELECT COUNT(*) FROM tblTournament WHERE Status='Active')       AS ActiveTournaments,
        (SELECT COUNT(*) FROM tblTournament WHERE Status='Registration')  AS RegistrationTournaments,
        (SELECT COUNT(*) FROM tblTournament)                              AS TotalTournaments,
        (SELECT COUNT(*) FROM tblTeam WHERE Status='Pending')            AS PendingTeams,
        (SELECT COUNT(*) FROM tblTeam WHERE Status='Approved')           AS ApprovedTeams,
        (SELECT COUNT(*) FROM tblDispute WHERE Status='Open')            AS OpenDisputes,
        (SELECT COUNT(*) FROM tblUser WHERE Role != 'Guest')             AS ActiveUsers,
        (SELECT COUNT(*) FROM tblMatch
            WHERE CAST(ScheduledTime AS DATE)=CAST(GETDATE() AS DATE)
              AND Status NOT IN ('Completed','Cancelled'))                AS TodayMatches;
END
GO

-- Reset password về "admin" cho bất kỳ user nào (dùng khi test/dev)
CREATE OR ALTER PROCEDURE sp_ResetPassword @Username NVARCHAR(50)
AS
BEGIN
    -- BCrypt hash của "admin" (cost=12) — verified bằng BCrypt.Net-Next 4.0.3
    UPDATE [tblUser]
    SET [PasswordHash] = '$2a$12$.fi.19yr0t0QUGpiGX9/suq9f99MyDWjacxrhYvb/E6Im1nhxcvKO',
        [FailedLoginAttempts] = 0,
        [IsLocked] = 0
    WHERE [Username] = @Username;
    PRINT N'Đã reset mật khẩu về "admin" cho user: ' + @Username;
END
GO

PRINT N'✓ Tạo 2 Stored Procedures';
GO

-- ═════════════════════════════════════════════════════════════════
-- KIỂM TRA KẾT QUẢ
-- ═════════════════════════════════════════════════════════════════

SELECT
    (SELECT COUNT(*) FROM tblUser)         AS [Tổng Users],
    (SELECT COUNT(*) FROM tblTournament)   AS [Tổng Tournaments],
    (SELECT COUNT(*) FROM tblTeam)         AS [Tổng Teams],
    (SELECT COUNT(*) FROM tblPlayer)       AS [Tổng Players],
    (SELECT COUNT(*) FROM tblNotification) AS [Tổng Notifications],
    (SELECT COUNT(*) FROM tblAuditLog)     AS [Tổng AuditLogs];
GO

SELECT UserID, Username, Role, FullName FROM tblUser ORDER BY UserID;
GO

-- ═════════════════════════════════════════════════════════════════
PRINT N'';
PRINT N'╔══════════════════════════════════════════════════════════╗';
PRINT N'║  ETMS Database v5.0 — Import thành công!                ║';
PRINT N'║  15 bảng + 15 indexes + 2 SPs + dữ liệu mẫu            ║';
PRINT N'║  Mật khẩu tất cả tài khoản: admin                       ║';
PRINT N'║  Tài khoản: admin / captain01 / captain02 / player01... ║';
PRINT N'╚══════════════════════════════════════════════════════════╝';
GO
