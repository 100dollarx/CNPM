-- ═══════════════════════════════════════════════════════════════════════════════
-- ETMS — Esports Tournament Management System
-- Database Script — SQL Server 2019+
-- Phiên bản: 3.0 (WPF/MVVM) | Ngày: 2026-03-29
-- Tổng: 16 bảng + 12 indexes + constraints + computed column + sample data
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───── KHỞI TẠO DATABASE ────────────────────────────────────────────────────
USE master;
GO
IF DB_ID('ETMS_DB') IS NOT NULL
    ALTER DATABASE ETMS_DB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
GO
IF DB_ID('ETMS_DB') IS NOT NULL
    DROP DATABASE ETMS_DB;
GO
CREATE DATABASE ETMS_DB COLLATE Vietnamese_CI_AS;
GO
USE ETMS_DB;
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. tblUser — Tài khoản người dùng
-- ═══════════════════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. tblTournament — Giải đấu
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE [tblTournament] (
    [TournamentID]        INT           IDENTITY(1,1) PRIMARY KEY,
    [Name]                NVARCHAR(200) NOT NULL,
    [GameType]            VARCHAR(30)   NOT NULL
        CHECK ([GameType] IN ('MOBA','FPS','BattleRoyale','Fighting')),
    [Format]              VARCHAR(30)   NOT NULL
        CHECK ([Format] IN ('SingleElimination','BattleRoyale')),
    [Status]              VARCHAR(20)   NOT NULL DEFAULT 'Draft'
        CHECK ([Status] IN ('Draft','Registration','Active','Completed','Cancelled')),
    [StartDate]           DATETIME      NOT NULL,
    [EndDate]             DATETIME      NULL,
    [MaxTeams]            INT           NOT NULL,
    [MinPlayersPerTeam]   INT           NOT NULL DEFAULT 5,
    [RegistrationDeadline] DATETIME     NULL,
    [BracketGenerated]    BIT           NOT NULL DEFAULT 0,
    [CreatedBy]           INT           NULL,
    [CreatedAt]           DATETIME      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Tournament_CreatedBy FOREIGN KEY ([CreatedBy])
        REFERENCES [tblUser]([UserID]) ON DELETE SET NULL
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. tblGameConfig — Cấu hình game cho Tournament (★ BỔ SUNG ERD-02)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE [tblGameConfig] (
    [ConfigID]            INT           IDENTITY(1,1) PRIMARY KEY,
    [TournamentID]        INT           NOT NULL UNIQUE,
    [BestOf]              INT           NOT NULL DEFAULT 1
        CHECK ([BestOf] IN (1,3,5)),
    [MapPool]             NVARCHAR(MAX) NULL,       -- JSON: ["Ascent","Bind","Haven",...]
    [VetoSequence]        NVARCHAR(MAX) NULL,       -- JSON: ["Ban","Ban","Pick","Pick","Ban","Ban","Pick"]
    [KillPointPerKill]    INT           NOT NULL DEFAULT 1,
    [RankingPointTable]   NVARCHAR(MAX) NULL,       -- JSON: {"1":25,"2":18,"3":15,...}

    CONSTRAINT FK_GameConfig_Tournament FOREIGN KEY ([TournamentID])
        REFERENCES [tblTournament]([TournamentID]) ON DELETE CASCADE
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. tblTeam — Đội tuyển
-- ═══════════════════════════════════════════════════════════════════════════════
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
        REFERENCES [tblTournament]([TournamentID]) ON DELETE RESTRICT,
    CONSTRAINT FK_Team_Captain FOREIGN KEY ([CaptainID])
        REFERENCES [tblUser]([UserID]) ON DELETE RESTRICT,
    CONSTRAINT UQ_Team_Name_Per_Tournament UNIQUE ([TournamentID], [Name]),
    CONSTRAINT UQ_Captain_Per_Tournament UNIQUE ([TournamentID], [CaptainID])
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. tblPlayer — Tuyển thủ
-- ═══════════════════════════════════════════════════════════════════════════════
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
        REFERENCES [tblUser]([UserID]) ON DELETE RESTRICT
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. tblMatch — Trận đấu (★ Linked List via NextMatchID)
-- ═══════════════════════════════════════════════════════════════════════════════
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
    [NextMatchID]         INT           NULL,      -- Self-referencing Linked List
    [Round]               INT           NOT NULL,
    [MatchOrder]          INT           NOT NULL,
    [IsBye]               BIT           NOT NULL DEFAULT 0,
    [CheckIn_Team1]       BIT           NOT NULL DEFAULT 0,
    [CheckIn_Team2]       BIT           NOT NULL DEFAULT 0,

    CONSTRAINT FK_Match_Tournament FOREIGN KEY ([TournamentID])
        REFERENCES [tblTournament]([TournamentID]) ON DELETE RESTRICT,
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. tblMatchResult — Kết quả trận đấu
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE [tblMatchResult] (
    [ResultID]            INT           IDENTITY(1,1) PRIMARY KEY,
    [MatchID]             INT           NOT NULL UNIQUE,    -- Mỗi trận chỉ có 1 result
    [Score1]              INT           NOT NULL,
    [Score2]              INT           NOT NULL,
    [EvidenceURL]         NVARCHAR(500) NOT NULL,
    [Status]              VARCHAR(30)   NOT NULL DEFAULT 'PendingVerification'
        CHECK ([Status] IN ('PendingVerification','Verified','Disputed','Rejected')),
    [SubmittedBy]         INT           NOT NULL,
    [VerifiedBy]          INT           NULL,
    [SubmittedAt]         DATETIME      NOT NULL DEFAULT GETDATE(),
    [VerifiedAt]          DATETIME      NULL,

    CONSTRAINT FK_Result_Match FOREIGN KEY ([MatchID])
        REFERENCES [tblMatch]([MatchID]) ON DELETE RESTRICT,
    CONSTRAINT FK_Result_SubmittedBy FOREIGN KEY ([SubmittedBy])
        REFERENCES [tblUser]([UserID]) ON DELETE RESTRICT,
    CONSTRAINT FK_Result_VerifiedBy FOREIGN KEY ([VerifiedBy])
        REFERENCES [tblUser]([UserID])
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. tblMapVeto — Cấm/chọn bản đồ (FPS)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE [tblMapVeto] (
    [VetoID]              INT           IDENTITY(1,1) PRIMARY KEY,
    [MatchID]             INT           NOT NULL,
    [TeamID]              INT           NOT NULL,
    [MapName]             NVARCHAR(100) NOT NULL,
    [Action]              VARCHAR(10)   NOT NULL
        CHECK ([Action] IN ('Ban','Pick')),
    [VetoOrder]           INT           NOT NULL,

    CONSTRAINT FK_Veto_Match FOREIGN KEY ([MatchID])
        REFERENCES [tblMatch]([MatchID]) ON DELETE CASCADE,
    CONSTRAINT FK_Veto_Team FOREIGN KEY ([TeamID])
        REFERENCES [tblTeam]([TeamID]) ON DELETE RESTRICT
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. tblSideSelect — Chọn phe (MOBA)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE [tblSideSelect] (
    [SelectID]            INT           IDENTITY(1,1) PRIMARY KEY,
    [MatchID]             INT           NOT NULL,
    [TeamID]              INT           NOT NULL,
    [Side]                VARCHAR(10)   NOT NULL
        CHECK ([Side] IN ('Blue','Red')),

    CONSTRAINT FK_Side_Match FOREIGN KEY ([MatchID])
        REFERENCES [tblMatch]([MatchID]) ON DELETE CASCADE,
    CONSTRAINT FK_Side_Team FOREIGN KEY ([TeamID])
        REFERENCES [tblTeam]([TeamID]) ON DELETE RESTRICT
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. tblBRRound — Vòng Battle Royale
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE [tblBRRound] (
    [RoundID]             INT           IDENTITY(1,1) PRIMARY KEY,
    [TournamentID]        INT           NOT NULL,
    [RoundNumber]         INT           NOT NULL,
    [PlayedAt]            DATETIME      NULL,

    CONSTRAINT FK_BRRound_Tournament FOREIGN KEY ([TournamentID])
        REFERENCES [tblTournament]([TournamentID]) ON DELETE RESTRICT,
    CONSTRAINT UQ_BRRound_Number UNIQUE ([TournamentID], [RoundNumber])
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. tblBRScore — Điểm Battle Royale (★ Computed Column)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE [tblBRScore] (
    [ScoreID]             INT           IDENTITY(1,1) PRIMARY KEY,
    [RoundID]             INT           NOT NULL,
    [TeamID]              INT           NOT NULL,
    [RankingPoints]       INT           NOT NULL DEFAULT 0,
    [KillPoints]          INT           NOT NULL DEFAULT 0,
    [TotalPoints]         AS ([RankingPoints] + [KillPoints]) PERSISTED,  -- NFR-2.7
    [PlacementRank]       INT           NULL,

    CONSTRAINT FK_BRScore_Round FOREIGN KEY ([RoundID])
        REFERENCES [tblBRRound]([RoundID]) ON DELETE RESTRICT,
    CONSTRAINT FK_BRScore_Team FOREIGN KEY ([TeamID])
        REFERENCES [tblTeam]([TeamID]) ON DELETE RESTRICT,
    CONSTRAINT UQ_BRScore_Per_Round UNIQUE ([RoundID], [TeamID])
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- 12. tblDispute — Khiếu nại
-- ═══════════════════════════════════════════════════════════════════════════════
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
        REFERENCES [tblMatch]([MatchID]) ON DELETE RESTRICT,
    CONSTRAINT FK_Dispute_Team FOREIGN KEY ([FiledByTeamID])
        REFERENCES [tblTeam]([TeamID]) ON DELETE RESTRICT,
    CONSTRAINT FK_Dispute_ResolvedBy FOREIGN KEY ([ResolvedBy])
        REFERENCES [tblUser]([UserID])
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- 13. tblNotification — Thông báo In-App (★ BỔ SUNG ERD-07)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE [tblNotification] (
    [NotificationID]      INT           IDENTITY(1,1) PRIMARY KEY,
    [RecipientID]         INT           NOT NULL,
    [Title]               NVARCHAR(200) NOT NULL,
    [Message]             NVARCHAR(1000) NOT NULL,
    [Type]                VARCHAR(30)   NOT NULL DEFAULT 'Info'
        CHECK ([Type] IN ('Info','Warning','Success','Error','Action')),
    [IsRead]              BIT           NOT NULL DEFAULT 0,
    [RelatedEntity]       VARCHAR(50)   NULL,       -- 'Match','Team','Tournament','Dispute'
    [RelatedEntityID]     INT           NULL,
    [CreatedAt]           DATETIME      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Notification_Recipient FOREIGN KEY ([RecipientID])
        REFERENCES [tblUser]([UserID]) ON DELETE CASCADE
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- 14. tblAuditLog — Nhật ký kiểm toán
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE [tblAuditLog] (
    [LogID]               INT           IDENTITY(1,1) PRIMARY KEY,
    [UserID]              INT           NULL,
    [Action]              VARCHAR(100)  NOT NULL,
    [Timestamp]           DATETIME      NOT NULL DEFAULT GETDATE(),
    [Detail]              NVARCHAR(2000) NULL,
    [IPAddress]           VARCHAR(45)   NULL,
    [AffectedEntity]      VARCHAR(50)   NULL,
    [AffectedEntityID]    INT           NULL,

    CONSTRAINT FK_AuditLog_User FOREIGN KEY ([UserID])
        REFERENCES [tblUser]([UserID]) ON DELETE SET NULL
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES — Performance Optimization (NFR-3.2)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Core lookup
CREATE INDEX IX_User_Username         ON [tblUser]([Username]);
CREATE INDEX IX_User_Role             ON [tblUser]([Role]);

-- Tournament
CREATE INDEX IX_Tournament_Status     ON [tblTournament]([Status]);
CREATE INDEX IX_Tournament_GameType   ON [tblTournament]([GameType]);

-- Team
CREATE INDEX IX_Team_TournamentID     ON [tblTeam]([TournamentID]);
CREATE INDEX IX_Team_Status           ON [tblTeam]([Status]);
CREATE INDEX IX_Team_CaptainID        ON [tblTeam]([CaptainID]);

-- Match
CREATE INDEX IX_Match_TournamentID    ON [tblMatch]([TournamentID]);
CREATE INDEX IX_Match_Status          ON [tblMatch]([Status]);
CREATE INDEX IX_Match_ScheduledTime   ON [tblMatch]([ScheduledTime]);

-- Notification
CREATE INDEX IX_Notification_Recipient ON [tblNotification]([RecipientID], [IsRead]);

-- AuditLog
CREATE INDEX IX_AuditLog_Timestamp    ON [tblAuditLog]([Timestamp] DESC);
CREATE INDEX IX_AuditLog_UserID       ON [tblAuditLog]([UserID]);

GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- DỮ LIỆU MẪU (Sample Data)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───── Users ────────────────────────────────────────────────────────────────
-- Mật khẩu mặc định: "admin" cho tất cả (BCrypt hash sẽ được seed bởi AdminPasswordSeeder)
-- Hash placeholder — app sẽ tự cập nhật hash đúng khi khởi động lần đầu
INSERT INTO [tblUser] ([Username], [PasswordHash], [Role], [IsLocked], [FullName], [Email], [FailedLoginAttempts])
VALUES
    ('admin',     '$2a$12$placeholder.hash.will.be.replaced.by.seeder',    'Admin',   0, N'Quản trị viên hệ thống',   'admin@etms.com',    0),
    ('captain1',  '$2a$12$placeholder.hash.will.be.replaced.by.seeder',    'Captain', 0, N'Lê Văn Minh (Đội trưởng)', 'captain1@etms.com', 0),
    ('captain2',  '$2a$12$placeholder.hash.will.be.replaced.by.seeder',    'Captain', 0, N'Trần Hoàng Anh (Đội trưởng)', 'captain2@etms.com', 0),
    ('player1',   '$2a$12$placeholder.hash.will.be.replaced.by.seeder',    'Player',  0, N'Nguyễn Văn Bình',           'player1@etms.com',  0),
    ('player2',   '$2a$12$placeholder.hash.will.be.replaced.by.seeder',    'Player',  0, N'Phạm Thị Cẩm',             'player2@etms.com',  0),
    ('player3',   '$2a$12$placeholder.hash.will.be.replaced.by.seeder',    'Player',  0, N'Hoàng Đức Duy',             'player3@etms.com',  0),
    ('player4',   '$2a$12$placeholder.hash.will.be.replaced.by.seeder',    'Player',  0, N'Võ Minh Hải',               'player4@etms.com',  0),
    ('player5',   '$2a$12$placeholder.hash.will.be.replaced.by.seeder',    'Player',  0, N'Đặng Thế Khánh',           'player5@etms.com',  0),
    ('player6',   '$2a$12$placeholder.hash.will.be.replaced.by.seeder',    'Player',  0, N'Bùi Quốc Lâm',             'player6@etms.com',  0),
    ('player7',   '$2a$12$placeholder.hash.will.be.replaced.by.seeder',    'Player',  0, N'Lý Thanh Mẫn',             'player7@etms.com',  0),
    ('player8',   '$2a$12$placeholder.hash.will.be.replaced.by.seeder',    'Player',  0, N'Ngô Huy Nam',               'player8@etms.com',  0),
    ('player9',   '$2a$12$placeholder.hash.will.be.replaced.by.seeder',    'Player',  0, N'Trương Minh Oanh',         'player9@etms.com',  0),
    ('player10',  '$2a$12$placeholder.hash.will.be.replaced.by.seeder',    'Player',  0, N'Đỗ Quang Phúc',            'player10@etms.com', 0),
    ('guest1',    '$2a$12$placeholder.hash.will.be.replaced.by.seeder',    'Guest',   0, N'Khách tham quan',           'guest1@etms.com',   0);
GO

-- ───── Tournaments ──────────────────────────────────────────────────────────
INSERT INTO [tblTournament] ([Name], [GameType], [Format], [Status], [StartDate], [EndDate], [MaxTeams], [MinPlayersPerTeam], [RegistrationDeadline], [CreatedBy])
VALUES
    (N'VCS Mùa Xuân 2026',       'MOBA',         'SingleElimination', 'Active',       '2026-04-01', '2026-06-30', 16, 5, '2026-03-28', 1),
    (N'VALORANT Champions VN',    'FPS',          'SingleElimination', 'Registration', '2026-05-01', '2026-07-31', 8,  5, '2026-04-25', 1),
    (N'PUBG Mobile Pro League',   'BattleRoyale', 'BattleRoyale',     'Draft',        '2026-06-01', '2026-08-31', 20, 4, '2026-05-25', 1);
GO

-- ───── GameConfig ───────────────────────────────────────────────────────────
INSERT INTO [tblGameConfig] ([TournamentID], [BestOf], [MapPool], [VetoSequence], [KillPointPerKill], [RankingPointTable])
VALUES
    (1, 3, NULL, NULL, 0,
     NULL),
    (2, 3,
     '["Ascent","Bind","Haven","Split","Icebox","Breeze","Fracture"]',
     '["Ban","Ban","Pick","Pick","Ban","Ban","Pick"]',
     0, NULL),
    (3, 1, NULL, NULL, 1,
     '{"1":25,"2":18,"3":15,"4":12,"5":10,"6":8,"7":6,"8":4,"9":2,"10":1}');
GO

-- ───── Teams ────────────────────────────────────────────────────────────────
INSERT INTO [tblTeam] ([TournamentID], [Name], [CaptainID], [Status])
VALUES
    (1, N'GAM Esports',     2, 'Approved'),
    (1, N'Team Whales',     3, 'Approved'),
    (2, N'Bleed Esports',   2, 'Pending'),
    (2, N'Team Flash VN',   3, 'Pending');
GO

-- ───── Players ──────────────────────────────────────────────────────────────
INSERT INTO [tblPlayer] ([TeamID], [UserID], [InGameID])
VALUES
    -- GAM Esports (Team 1)
    (1, 2,  N'MinhCapt_GAM'),
    (1, 4,  N'BinhMid_GAM'),
    (1, 5,  N'CamBot_GAM'),
    (1, 6,  N'DuyTop_GAM'),
    (1, 7,  N'HaiJg_GAM'),
    -- Team Whales (Team 2)
    (2, 3,  N'AnhCapt_WHL'),
    (2, 8,  N'KhanhADC_WHL'),
    (2, 9,  N'LamSup_WHL'),
    (2, 10, N'ManMid_WHL'),
    (2, 11, N'NamTop_WHL');
GO

-- ───── Notifications (mẫu) ──────────────────────────────────────────────────
INSERT INTO [tblNotification] ([RecipientID], [Title], [Message], [Type], [RelatedEntity], [RelatedEntityID])
VALUES
    (2, N'Đội được duyệt!',         N'Đội GAM Esports đã được duyệt tham gia VCS Mùa Xuân 2026.',  'Success', 'Team', 1),
    (3, N'Đội được duyệt!',         N'Đội Team Whales đã được duyệt tham gia VCS Mùa Xuân 2026.',   'Success', 'Team', 2),
    (1, N'Hồ sơ đội mới',           N'Đội Bleed Esports đăng ký VALORANT Champions VN.',             'Action',  'Team', 3),
    (1, N'Hồ sơ đội mới',           N'Đội Team Flash VN đăng ký VALORANT Champions VN.',             'Action',  'Team', 4);
GO

-- ───── AuditLog (mẫu) ───────────────────────────────────────────────────────
INSERT INTO [tblAuditLog] ([UserID], [Action], [Detail], [AffectedEntity], [AffectedEntityID])
VALUES
    (1, 'CREATE_TOURNAMENT',   N'Tạo giải VCS Mùa Xuân 2026',                    'Tournament', 1),
    (1, 'APPROVE_TEAM',        N'Duyệt đội GAM Esports cho VCS Mùa Xuân 2026',   'Team',       1),
    (1, 'APPROVE_TEAM',        N'Duyệt đội Team Whales cho VCS Mùa Xuân 2026',   'Team',       2);
GO

PRINT N'═══ ETMS Database v3.0 — Tạo thành công 16 bảng + indexes + dữ liệu mẫu ═══'
GO
