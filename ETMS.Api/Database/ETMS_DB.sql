-- ═══════════════════════════════════════════════════════════════════════════════
-- ETMS — Esports Tournament Management System
-- Database Script — SQL Server 2019+
-- Phiên bản: 4.0 (Tauri v2 + React + .NET API) | Ngày: 2026-03-31
-- Tổng: 17 bảng + 14 indexes + 1 computed column + 2 SPs + constraints + sample data
-- Mật khẩu mặc định: "admin" cho tất cả tài khoản
-- (AdminPasswordSeeder tự động cập nhật BCrypt hash khi khởi động lần đầu)
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
--    Vai trò: Admin | Captain | Player | Guest
--    Bảo mật: BCrypt hash (cost=12), khóa sau 5 lần sai, session 30 phút
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
-- 2. tblGameTypeConfig — Bảng tham chiếu cấu hình cơ chế theo GameType (★ BỔ SUNG FR-12)
--    Reference table: lưu metadata về cơ chế của từng loại game
--    HasMapVeto: FPS có veto, MOBA/Fighting/Sports/RTS không có
--    HasSideSelection: MOBA có Blue/Red, các loại khác không có
--    HasBRScoring: Chỉ BattleRoyale mới dùng bảng điểm tích lũy
--    HasMapPool: FPS và RTS có pool bản đồ
--    MinPlayers: Số tuyển thủ tối thiểu theo game genre
--    DefaultCheckInMinutes: Thời gian check-in trước trận
-- ═══════════════════════════════════════════════════════════════════════════════
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
    [SupportedFormats]       NVARCHAR(200) NOT NULL,  -- CSV: 'SingleElimination,BattleRoyale'
    [Examples]               NVARCHAR(500) NULL
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. tblTournament — Giải đấu
--    Status flow: Draft → Registration → Active → Completed | Cancelled
--    GameType: MOBA | FPS | BattleRoyale | Fighting | RTS | Sports
--    Format: SingleElimination | BattleRoyale | DoubleElimination | RoundRobin
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE [tblTournament] (
    [TournamentID]        INT           IDENTITY(1,1) PRIMARY KEY,
    [Name]                NVARCHAR(200) NOT NULL,
    [GameType]            VARCHAR(30)   NOT NULL
        CHECK ([GameType] IN ('MOBA','FPS','BattleRoyale','Fighting','RTS','Sports'))
        REFERENCES [tblGameTypeConfig]([GameType]),
    [Format]              VARCHAR(30)   NOT NULL
        CHECK ([Format] IN ('SingleElimination','BattleRoyale','DoubleElimination','RoundRobin')),
    [Status]              VARCHAR(20)   NOT NULL DEFAULT 'Draft'
        CHECK ([Status] IN ('Draft','Registration','Active','Completed','Cancelled')),
    [StartDate]           DATETIME      NOT NULL,
    [EndDate]             DATETIME      NULL,
    [MaxTeams]            INT           NOT NULL,
    [MinPlayersPerTeam]   INT           NOT NULL DEFAULT 5,
    [MaxPlayersPerTeam]   INT           NOT NULL DEFAULT 5,     -- ★ BỔ SUNG FR-12
    [RegistrationDeadline] DATETIME     NULL,
    [BracketGenerated]    BIT           NOT NULL DEFAULT 0,
    [Description]         NVARCHAR(MAX) NULL,
    [CreatedBy]           INT           NULL,
    [CreatedAt]           DATETIME      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Tournament_CreatedBy FOREIGN KEY ([CreatedBy])
        REFERENCES [tblUser]([UserID]) ON DELETE SET NULL
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. tblGameConfig — Cấu hình game cho Tournament (1:1 với tblTournament)
--    BestOf: 1 | 3 | 5
--    MapPool: JSON array ["Ascent","Bind","Haven",...]
--    VetoSequence: JSON array ["Ban","Ban","Pick","Pick","Ban","Ban","Pick"]
--    RankingPointTable: JSON object {"1":25,"2":18,"3":15,...}
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE [tblGameConfig] (
    [ConfigID]            INT           IDENTITY(1,1) PRIMARY KEY,
    [TournamentID]        INT           NOT NULL UNIQUE,
    [BestOf]              INT           NOT NULL DEFAULT 1
        CHECK ([BestOf] IN (1,3,5)),
    [MapPool]             NVARCHAR(MAX) NULL,
    [VetoSequence]        NVARCHAR(MAX) NULL,
    [KillPointPerKill]    INT           NOT NULL DEFAULT 1,
    [RankingPointTable]   NVARCHAR(MAX) NULL,

    CONSTRAINT FK_GameConfig_Tournament FOREIGN KEY ([TournamentID])
        REFERENCES [tblTournament]([TournamentID]) ON DELETE CASCADE
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. tblTeam — Đội tuyển
--    Status: Pending → Approved | Rejected | Disqualified
--    Ràng buộc: Tên đội unique/giải, Captain chỉ có 1 đội/giải
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
        REFERENCES [tblTournament]([TournamentID]),
    CONSTRAINT FK_Team_Captain FOREIGN KEY ([CaptainID])
        REFERENCES [tblUser]([UserID]),
    CONSTRAINT UQ_Team_Name_Per_Tournament UNIQUE ([TournamentID], [Name]),
    CONSTRAINT UQ_Captain_Per_Tournament UNIQUE ([TournamentID], [CaptainID])
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. tblPlayer — Tuyển thủ (thành viên đội)
--    Mỗi User chỉ thuộc 1 đội trong 1 giải (enforce qua Business Layer)
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
        REFERENCES [tblUser]([UserID])
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. tblMatch — Trận đấu
--    NextMatchID: Linked List cho bracket progression (NULL = chung kết)
--    IsBye: Đội đi thẳng (không cần thi đấu)
--    CheckIn_Team1/2: Trạng thái check-in của từng đội
--    Status flow: Scheduled → CheckInOpen → (Walkover|WalkoverPending|Live)
--               → Completed | Disputed | Postponed | Cancelled
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
    [NextMatchID]         INT           NULL,
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. tblMatchResult — Kết quả trận đấu
--    Mỗi trận chỉ có 1 kết quả (UNIQUE MatchID)
--    EvidenceURL: Link screenshot xác nhận kết quả
--    Status: PendingVerification → Verified | Disputed | Rejected
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE [tblMatchResult] (
    [ResultID]            INT           IDENTITY(1,1) PRIMARY KEY,
    [MatchID]             INT           NOT NULL UNIQUE,
    [Score1]              INT           NOT NULL,
    [Score2]              INT           NOT NULL,
    [EvidenceURL]         NVARCHAR(500) NOT NULL,
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. tblMapVeto — Cấm/chọn bản đồ (FPS tournaments)
--    Action: Ban | Pick
--    VetoOrder: Thứ tự lần lượt (1,2,3...)
-- ═══════════════════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. tblSideSelect — Chọn phe (MOBA tournaments)
--    Side: Blue | Red
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE [tblSideSelect] (
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. tblBRRound — Vòng Battle Royale
--     Mỗi vòng unique trong 1 giải (UQ_BRRound_Number)
-- ═══════════════════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. tblBRScore — Điểm Battle Royale
--     TotalPoints = RankingPoints + KillPoints (PERSISTED Computed Column)
--     KillPointPerKill từ tblGameConfig áp dụng tại Business Layer
-- ═══════════════════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- 12. tblDispute — Khiếu nại
--     Max 2 khiếu nại/Captain/giải (enforce tại BUS)
--     SLA: 48 giờ xử lý
--     Category: HackCheat | WrongScore | UnauthorizedPlayer | Other
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
        REFERENCES [tblMatch]([MatchID]),
    CONSTRAINT FK_Dispute_Team FOREIGN KEY ([FiledByTeamID])
        REFERENCES [tblTeam]([TeamID]),
    CONSTRAINT FK_Dispute_ResolvedBy FOREIGN KEY ([ResolvedBy])
        REFERENCES [tblUser]([UserID])
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- 13. tblNotification — Thông báo in-app
--     RelatedEntity + RelatedEntityID: Trỏ tới Match/Team/Tournament/Dispute
--     IsRead: Đánh dấu đã đọc
-- ═══════════════════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- 14. tblAuditLog — Nhật ký kiểm toán
--     Ghi tất cả Admin actions (CREATE/UPDATE/DELETE/APPROVE/REJECT/...)
--     IPAddress: Không áp dụng trong desktop, dùng "localhost" placeholder
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
    [Result]              VARCHAR(20)   NULL DEFAULT 'Success'
        CHECK ([Result] IN ('Success','Failed','Warning')),

    CONSTRAINT FK_AuditLog_User FOREIGN KEY ([UserID])
        REFERENCES [tblUser]([UserID]) ON DELETE SET NULL
);
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES — Tối ưu performance (NFR-2.x)
-- ═══════════════════════════════════════════════════════════════════════════════

-- tblUser: login lookup, role filter
CREATE INDEX IX_User_Username         ON [tblUser]([Username]);
CREATE INDEX IX_User_Role             ON [tblUser]([Role]);

-- tblTournament: dashboard filter
CREATE INDEX IX_Tournament_Status     ON [tblTournament]([Status]);
CREATE INDEX IX_Tournament_GameType   ON [tblTournament]([GameType]);
CREATE INDEX IX_Tournament_StartDate  ON [tblTournament]([StartDate] DESC);

-- tblTeam: tournament lookup, approval queue
CREATE INDEX IX_Team_TournamentID     ON [tblTeam]([TournamentID]);
CREATE INDEX IX_Team_Status           ON [tblTeam]([Status]);
CREATE INDEX IX_Team_CaptainID        ON [tblTeam]([CaptainID]);

-- tblMatch: bracket & schedule lookup
CREATE INDEX IX_Match_TournamentID    ON [tblMatch]([TournamentID]);
CREATE INDEX IX_Match_Status          ON [tblMatch]([Status]);
CREATE INDEX IX_Match_ScheduledTime   ON [tblMatch]([ScheduledTime]);

-- tblNotification: bell icon unread count
CREATE INDEX IX_Notification_Recipient ON [tblNotification]([RecipientID], [IsRead]);

-- tblAuditLog: admin audit view, user history
CREATE INDEX IX_AuditLog_Timestamp    ON [tblAuditLog]([Timestamp] DESC);
CREATE INDEX IX_AuditLog_UserID       ON [tblAuditLog]([UserID]);
CREATE INDEX IX_AuditLog_Action       ON [tblAuditLog]([Action]);

GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- DỮ LIỆU MẪU (Sample Data)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───── Users ─────────────────────────────────────────────────────────────────
-- Mật khẩu mặc định: "admin" cho tất cả tài khoản
-- AdminPasswordSeeder sẽ tự động cập nhật BCrypt hash đúng khi khởi động
-- Placeholder hash dưới đây SẼ KHÔNG được dùng để login thật
INSERT INTO [tblUser] ([Username], [PasswordHash], [Role], [IsLocked], [FullName], [Email], [FailedLoginAttempts])
VALUES
    ('admin',    '$2a$12$PLACEHOLDER_SEEDED_BY_STARTUP',  'Admin',   0, N'Quản trị viên hệ thống',     'admin@etms.com',    0),
    ('captain1', '$2a$12$PLACEHOLDER_SEEDED_BY_STARTUP',  'Captain', 0, N'Lê Văn Minh (Đội trưởng)',  'captain1@etms.com', 0),
    ('captain2', '$2a$12$PLACEHOLDER_SEEDED_BY_STARTUP',  'Captain', 0, N'Trần Hoàng Anh (Đội trưởng)','captain2@etms.com', 0),
    ('player1',  '$2a$12$PLACEHOLDER_SEEDED_BY_STARTUP',  'Player',  0, N'Nguyễn Văn Bình',            'player1@etms.com',  0),
    ('player2',  '$2a$12$PLACEHOLDER_SEEDED_BY_STARTUP',  'Player',  0, N'Phạm Thị Cẩm',              'player2@etms.com',  0),
    ('player3',  '$2a$12$PLACEHOLDER_SEEDED_BY_STARTUP',  'Player',  0, N'Hoàng Đức Duy',              'player3@etms.com',  0),
    ('player4',  '$2a$12$PLACEHOLDER_SEEDED_BY_STARTUP',  'Player',  0, N'Võ Minh Hải',                'player4@etms.com',  0),
    ('player5',  '$2a$12$PLACEHOLDER_SEEDED_BY_STARTUP',  'Player',  0, N'Đặng Thế Khánh',            'player5@etms.com',  0),
    ('player6',  '$2a$12$PLACEHOLDER_SEEDED_BY_STARTUP',  'Player',  0, N'Bùi Quốc Lâm',              'player6@etms.com',  0),
    ('player7',  '$2a$12$PLACEHOLDER_SEEDED_BY_STARTUP',  'Player',  0, N'Lý Thanh Mẫn',              'player7@etms.com',  0),
    ('player8',  '$2a$12$PLACEHOLDER_SEEDED_BY_STARTUP',  'Player',  0, N'Ngô Huy Nam',                'player8@etms.com',  0),
    ('player9',  '$2a$12$PLACEHOLDER_SEEDED_BY_STARTUP',  'Player',  0, N'Trương Minh Oanh',           'player9@etms.com',  0),
    ('player10', '$2a$12$PLACEHOLDER_SEEDED_BY_STARTUP',  'Player',  0, N'Đỗ Quang Phúc',             'player10@etms.com', 0),
    ('guest1',   '$2a$12$PLACEHOLDER_SEEDED_BY_STARTUP',  'Guest',   0, N'Khách tham quan',            'guest1@etms.com',   0);
GO

-- ───── GameTypeConfig (Reference Data) ──────────────────────────────────────
-- Bắt buộc INSERT trước Tournaments vì tblTournament.GameType FK đến bảng này
INSERT INTO [tblGameTypeConfig]
    ([GameType], [DisplayName], [HasMapVeto], [HasSideSelection], [HasBRScoring], [HasMapPool],
     [DefaultMinPlayers], [DefaultMaxPlayers], [DefaultCheckInMinutes], [SupportedFormats], [Examples])
VALUES
    ('MOBA',         N'MOBA (5v5)',          0, 1, 0, 0,  5,  6, 15,
     'SingleElimination',
     N'League of Legends, DOTA 2, Liên Quân Mobile, Wild Rift'),

    ('FPS',          N'FPS (5v5)',           1, 0, 0, 1,  5,  6, 15,
     'SingleElimination',
     N'VALORANT, CS2, Overwatch 2, Rainbow Six Siege'),

    ('BattleRoyale', N'Battle Royale',       0, 0, 1, 0,  4,  8, 30,
     'BattleRoyale',
     N'PUBG, PUBG Mobile, Apex Legends, Free Fire'),

    ('Fighting',     N'Fighting Game (1v1)', 0, 0, 0, 0,  1,  1, 10,
     'SingleElimination',
     N'Tekken 8, Street Fighter 6, Mortal Kombat 1, KoF XV'),

    ('RTS',          N'RTS (Real-Time Strategy)', 0, 0, 0, 1, 1, 2, 15,
     'SingleElimination',
     N'StarCraft II, Age of Empires IV, Warcraft III Reforged'),

    ('Sports',       N'Sports Gaming',       0, 0, 0, 0,  1, 11, 15,
     'SingleElimination',
     N'EA FC 25, NBA 2K25, eFootball, Rocket League');
GO

-- ───── Tournaments ────────────────────────────────────────────────────────────
INSERT INTO [tblTournament] ([Name], [GameType], [Format], [Status], [StartDate], [EndDate],
    [MaxTeams], [MinPlayersPerTeam], [MaxPlayersPerTeam], [RegistrationDeadline], [CreatedBy], [Description])
VALUES
    (N'VCS Mùa Xuân 2026',
     'MOBA', 'SingleElimination', 'Active',
     '2026-04-01', '2026-06-30', 16, 5, 6, '2026-03-28', 1,
     N'Giải vô địch Liên Minh Huyền Thoại Việt Nam Mùa Xuân 2026'),

    (N'VALORANT Champions VN 2026',
     'FPS', 'SingleElimination', 'Registration',
     '2026-05-01', '2026-07-31', 8, 5, 6, '2026-04-25', 1,
     N'Giải đấu VALORANT hàng đầu Việt Nam, xác định đại diện dự VCT'),

    (N'PUBG Mobile Pro League Season 5',
     'BattleRoyale', 'BattleRoyale', 'Draft',
     '2026-06-01', '2026-08-31', 20, 4, 8, '2026-05-25', 1,
     N'Giải PUBG Mobile chuyên nghiệp, hệ thống điểm tích lũy'),

    (N'Tekken 8 National Open 2026',
     'Fighting', 'SingleElimination', 'Draft',
     '2026-07-01', '2026-07-15', 32, 1, 1, '2026-06-25', 1,
     N'Giải đấu Tekken 8 toàn quốc, 1v1 Solo, Single Elimination'),

    (N'StarCraft II Vietnam Championship',
     'RTS', 'SingleElimination', 'Draft',
     '2026-08-01', '2026-08-20', 16, 1, 1, '2026-07-25', 1,
     N'Giải vô địch StarCraft II Việt Nam, bản đồ theo map pool chuẩn');
GO

-- ───── GameConfig ──────────────────────────────────────────────────────────────
INSERT INTO [tblGameConfig] ([TournamentID], [BestOf], [MapPool], [VetoSequence],
    [KillPointPerKill], [RankingPointTable])
VALUES
    -- VCS: MOBA, Best of 3, không cần Map Veto hay BR scoring
    (1, 3, NULL, NULL, 0, NULL),

    -- VALORANT: FPS, Best of 3, Map Pool + Veto
    (2, 3,
     '["Ascent","Bind","Haven","Split","Icebox","Breeze","Fracture","Lotus","Pearl"]',
     '["Ban","Ban","Pick","Pick","Ban","Ban","Pick"]',
     0, NULL),

    -- PUBG Mobile: Battle Royale, Best of 1, Kill Points + Ranking Table
    (3, 1, NULL, NULL, 1,
     '{"1":25,"2":18,"3":15,"4":12,"5":10,"6":8,"7":6,"8":4,"9":2,"10":1,"11+":0}');
GO

-- ───── Teams ────────────────────────────────────────────────────────────────────
INSERT INTO [tblTeam] ([TournamentID], [Name], [CaptainID], [Status])
VALUES
    (1, N'GAM Esports',          2, 'Approved'),
    (1, N'Team Whales',          3, 'Approved'),
    (1, N'Saigon Buffalo',       2, 'Approved'),
    (1, N'SBTC Esports',         3, 'Approved'),
    (2, N'Bleed Esports VN',     2, 'Pending'),
    (2, N'Team Flash Vietnam',   3, 'Pending');
GO

-- ───── Players ──────────────────────────────────────────────────────────────────
INSERT INTO [tblPlayer] ([TeamID], [UserID], [InGameID])
VALUES
    -- GAM Esports (Team 1) — VCS
    (1, 2,  N'MinhCapt_GAM'), (1, 4,  N'BinhMid_GAM'),
    (1, 5,  N'CamBot_GAM'),   (1, 6,  N'DuyTop_GAM'),   (1, 7,  N'HaiJg_GAM'),
    -- Team Whales (Team 2) — VCS
    (2, 3,  N'AnhCapt_WHL'),  (2, 8,  N'KhanhADC_WHL'),
    (2, 9,  N'LamSup_WHL'),   (2, 10, N'ManMid_WHL'),   (2, 11, N'NamTop_WHL');
GO

-- ───── Notifications (mẫu) ─────────────────────────────────────────────────────
INSERT INTO [tblNotification] ([RecipientID], [Title], [Message], [Type], [RelatedEntity], [RelatedEntityID])
VALUES
    (2, N'🎉 Đội được duyệt!',
     N'Đội GAM Esports đã được Admin duyệt tham gia VCS Mùa Xuân 2026. Chúc bạn thi đấu tốt!',
     'Success', 'Team', 1),
    (3, N'🎉 Đội được duyệt!',
     N'Đội Team Whales đã được Admin duyệt tham gia VCS Mùa Xuân 2026.',
     'Success', 'Team', 2),
    (1, N'📋 Hồ sơ đội mới chờ duyệt',
     N'Đội Bleed Esports VN đã đăng ký tham gia VALORANT Champions VN 2026. Cần xét duyệt.',
     'Action', 'Team', 5),
    (1, N'📋 Hồ sơ đội mới chờ duyệt',
     N'Đội Team Flash Vietnam đã đăng ký tham gia VALORANT Champions VN 2026. Cần xét duyệt.',
     'Action', 'Team', 6);
GO

-- ───── AuditLog (mẫu) ─────────────────────────────────────────────────────────
INSERT INTO [tblAuditLog] ([UserID], [Action], [Detail], [AffectedEntity], [AffectedEntityID], [IPAddress], [Result])
VALUES
    (1, 'CREATE_TOURNAMENT',  N'Tạo giải VCS Mùa Xuân 2026',                             'Tournament', 1, 'localhost', 'Success'),
    (1, 'CREATE_TOURNAMENT',  N'Tạo giải VALORANT Champions VN 2026',                    'Tournament', 2, 'localhost', 'Success'),
    (1, 'CREATE_TOURNAMENT',  N'Tạo giải PUBG Mobile Pro League Season 5',               'Tournament', 3, 'localhost', 'Success'),
    (1, 'APPROVE_TEAM',       N'Duyệt đội GAM Esports tham gia VCS Mùa Xuân 2026',      'Team',       1, 'localhost', 'Success'),
    (1, 'APPROVE_TEAM',       N'Duyệt đội Team Whales tham gia VCS Mùa Xuân 2026',      'Team',       2, 'localhost', 'Success'),
    (1, 'APPROVE_TEAM',       N'Duyệt đội Saigon Buffalo tham gia VCS Mùa Xuân 2026',   'Team',       3, 'localhost', 'Success'),
    (1, 'APPROVE_TEAM',       N'Duyệt đội SBTC Esports tham gia VCS Mùa Xuân 2026',     'Team',       4, 'localhost', 'Success');
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- STORED PROCEDURES (Utilities)
-- ═══════════════════════════════════════════════════════════════════════════════

-- SP: Reset tất cả password hash (dùng khi test)
CREATE OR ALTER PROCEDURE sp_ResetAllPasswords
    @NewHashPlaceholder VARCHAR(256) = '$2a$12$PLACEHOLDER_SEEDED_BY_STARTUP'
AS
BEGIN
    UPDATE [tblUser] SET [PasswordHash] = @NewHashPlaceholder;
    PRINT N'Đã reset hash — AdminPasswordSeeder sẽ cập nhật BCrypt hash đúng khi khởi động.';
END
GO

-- SP: Lấy thống kê overview cho Dashboard
CREATE OR ALTER PROCEDURE sp_GetDashboardStats
AS
BEGIN
    SELECT
        (SELECT COUNT(*) FROM tblTournament WHERE Status = 'Active')       AS ActiveTournaments,
        (SELECT COUNT(*) FROM tblTournament WHERE Status = 'Registration')  AS RegistrationTournaments,
        (SELECT COUNT(*) FROM tblTeam      WHERE Status = 'Pending')        AS PendingTeams,
        (SELECT COUNT(*) FROM tblTeam      WHERE Status = 'Approved')       AS ApprovedTeams,
        (SELECT COUNT(*) FROM tblMatch     WHERE CAST(ScheduledTime AS DATE) = CAST(GETDATE() AS DATE)
                                            AND Status NOT IN ('Completed','Cancelled')) AS TodayMatches,
        (SELECT COUNT(*) FROM tblDispute   WHERE Status = 'Open')           AS OpenDisputes,
        (SELECT COUNT(*) FROM tblUser      WHERE Role != 'Guest')           AS ActiveUsers;
END
GO

PRINT N'═══ ETMS Database v4.0 — Tạo thành công 16 bảng + 13 indexes + 2 SPs + dữ liệu mẫu ═══'
GO
