-- ============================================================
-- ETMS_CreateDB.sql
-- Hệ thống Quản lý Giải đấu Esports (ETMS)
-- Đề tài 11 – Kỹ thuật Phần mềm 502045 – FIT TDTU 2026
-- ============================================================

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'ETMS_DB')
    DROP DATABASE ETMS_DB;
GO

CREATE DATABASE ETMS_DB
    COLLATE Vietnamese_CI_AS;
GO

USE ETMS_DB;
GO

-- ============================================================
-- 1. tblUser
-- ============================================================
CREATE TABLE tblUser (
    UserID       INT IDENTITY(1,1) PRIMARY KEY,
    Username     NVARCHAR(50)  NOT NULL UNIQUE,
    PasswordHash VARCHAR(256)  NOT NULL,        -- SHA-256 hex
    FullName     NVARCHAR(100) NOT NULL,
    Role         VARCHAR(20)   NOT NULL         -- 'Admin','Captain','Player','Guest'
                 CHECK (Role IN ('Admin','Captain','Player','Guest')),
    IsLocked     BIT           NOT NULL DEFAULT 0,
    LoginFailCount INT         NOT NULL DEFAULT 0,
    CreatedAt    DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- 2. tblTournament
-- ============================================================
CREATE TABLE tblTournament (
    TournamentID       INT IDENTITY(1,1) PRIMARY KEY,
    Name               NVARCHAR(200) NOT NULL,
    GameType           VARCHAR(30)   NOT NULL
                       CHECK (GameType IN ('MOBA','FPS','BattleRoyale','Fighting')),
    Format             VARCHAR(30)   NOT NULL DEFAULT 'SingleElimination'
                       CHECK (Format IN ('SingleElimination','BattleRoyale')),
    Status             VARCHAR(20)   NOT NULL DEFAULT 'Draft'
                       CHECK (Status IN ('Draft','Registration','Active','Completed')),
    MaxTeams           INT           NOT NULL DEFAULT 16,
    MinPlayersPerTeam  INT           NOT NULL DEFAULT 5,
    StartDate          DATETIME      NULL,
    EndDate            DATETIME      NULL,
    CreatedBy          INT           NOT NULL,    -- FK tblUser (Admin)
    CreatedAt          DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Tournament_User FOREIGN KEY (CreatedBy) REFERENCES tblUser(UserID)
);
GO

-- ============================================================
-- 3. tblTeam
-- ============================================================
CREATE TABLE tblTeam (
    TeamID            INT IDENTITY(1,1) PRIMARY KEY,
    TournamentID      INT            NOT NULL,
    Name              NVARCHAR(100)  NOT NULL,
    LogoURL           NVARCHAR(500)  NULL,
    CaptainID         INT            NOT NULL,   -- FK tblUser
    Status            VARCHAR(20)    NOT NULL DEFAULT 'Pending'
                      CHECK (Status IN ('Pending','Approved','Rejected')),
    RejectionReason   NVARCHAR(500)  NULL,
    CreatedAt         DATETIME       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Team_Tournament FOREIGN KEY (TournamentID) REFERENCES tblTournament(TournamentID),
    CONSTRAINT FK_Team_Captain    FOREIGN KEY (CaptainID)    REFERENCES tblUser(UserID),
    CONSTRAINT UQ_Team_Name       UNIQUE (TournamentID, Name)   -- Tên đội unique trong giải
);
GO

-- ============================================================
-- 4. tblPlayer
-- ============================================================
CREATE TABLE tblPlayer (
    PlayerID   INT IDENTITY(1,1) PRIMARY KEY,
    TeamID     INT            NOT NULL,
    UserID     INT            NULL,              -- FK tblUser (NULL nếu chưa có tài khoản)
    FullName   NVARCHAR(100)  NOT NULL,
    InGameID   NVARCHAR(100)  NOT NULL,
    IsActive   BIT            NOT NULL DEFAULT 1,
    CONSTRAINT FK_Player_Team FOREIGN KEY (TeamID) REFERENCES tblTeam(TeamID),
    CONSTRAINT FK_Player_User FOREIGN KEY (UserID) REFERENCES tblUser(UserID)
);
GO

-- ============================================================
-- 5. tblMatch  ← LINKED LIST STRUCTURE
-- ============================================================
CREATE TABLE tblMatch (
    MatchID          INT IDENTITY(1,1) PRIMARY KEY,
    TournamentID     INT          NOT NULL,
    Team1ID          INT          NULL,          -- NULL = đang chờ đội từ vòng trước
    Team2ID          INT          NULL,
    WinnerID         INT          NULL,
    LoserID          INT          NULL,
    Status           VARCHAR(30)  NOT NULL DEFAULT 'Scheduled'
                     CHECK (Status IN ('Scheduled','CheckInOpen','Live','Completed','Walkover','Bye')),
    ScheduledTime    DATETIME     NULL,
    ActualStartTime  DATETIME     NULL,
    CheckIn1         BIT          NOT NULL DEFAULT 0,  -- Team1 đã check-in
    CheckIn2         BIT          NOT NULL DEFAULT 0,  -- Team2 đã check-in
    NextMatchID      INT          NULL,          -- LINKED LIST: trận kế tiếp
    NextMatchSlot    INT          NULL CHECK (NextMatchSlot IN (1,2)), -- Team1 or Team2 slot
    Round            INT          NOT NULL DEFAULT 1,
    MatchOrder       INT          NOT NULL DEFAULT 1,
    IsBye            BIT          NOT NULL DEFAULT 0,
    CONSTRAINT FK_Match_Tournament FOREIGN KEY (TournamentID) REFERENCES tblTournament(TournamentID),
    CONSTRAINT FK_Match_Team1      FOREIGN KEY (Team1ID)      REFERENCES tblTeam(TeamID),
    CONSTRAINT FK_Match_Team2      FOREIGN KEY (Team2ID)      REFERENCES tblTeam(TeamID),
    CONSTRAINT FK_Match_Winner     FOREIGN KEY (WinnerID)     REFERENCES tblTeam(TeamID),
    CONSTRAINT FK_Match_Loser      FOREIGN KEY (LoserID)      REFERENCES tblTeam(TeamID),
    CONSTRAINT FK_Match_Next       FOREIGN KEY (NextMatchID)  REFERENCES tblMatch(MatchID)
);
GO

CREATE INDEX IX_Match_Tournament ON tblMatch(TournamentID, Round);
CREATE INDEX IX_Match_Teams      ON tblMatch(Team1ID, Team2ID);
GO

-- ============================================================
-- 6. tblMatchResult
-- ============================================================
CREATE TABLE tblMatchResult (
    ResultID     INT IDENTITY(1,1) PRIMARY KEY,
    MatchID      INT           NOT NULL UNIQUE,  -- 1 trận chỉ có 1 bản ghi kết quả
    Score1       INT           NOT NULL DEFAULT 0,
    Score2       INT           NOT NULL DEFAULT 0,
    EvidenceURL  NVARCHAR(500) NULL,
    Status       VARCHAR(30)   NOT NULL DEFAULT 'PendingVerification'
                 CHECK (Status IN ('PendingVerification','Verified','Disputed')),
    SubmittedBy  INT           NULL,    -- FK tblUser (Captain)
    VerifiedBy   INT           NULL,    -- FK tblUser (Admin)
    SubmittedAt  DATETIME      NOT NULL DEFAULT GETDATE(),
    VerifiedAt   DATETIME      NULL,
    CONSTRAINT FK_Result_Match       FOREIGN KEY (MatchID)     REFERENCES tblMatch(MatchID),
    CONSTRAINT FK_Result_SubmittedBy FOREIGN KEY (SubmittedBy) REFERENCES tblUser(UserID),
    CONSTRAINT FK_Result_VerifiedBy  FOREIGN KEY (VerifiedBy)  REFERENCES tblUser(UserID)
);
GO

-- ============================================================
-- 7. tblMapVeto (FPS game-specific)
-- ============================================================
CREATE TABLE tblMapVeto (
    VetoID     INT IDENTITY(1,1) PRIMARY KEY,
    MatchID    INT           NOT NULL,
    TeamID     INT           NOT NULL,
    MapName    NVARCHAR(100) NOT NULL,
    Action     VARCHAR(10)   NOT NULL CHECK (Action IN ('Ban','Pick')),
    VetoOrder  INT           NOT NULL,
    CreatedAt  DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Veto_Match FOREIGN KEY (MatchID) REFERENCES tblMatch(MatchID),
    CONSTRAINT FK_Veto_Team  FOREIGN KEY (TeamID)  REFERENCES tblTeam(TeamID)
);
GO

-- ============================================================
-- 8. tblDispute
-- ============================================================
CREATE TABLE tblDispute (
    DisputeID      INT IDENTITY(1,1) PRIMARY KEY,
    MatchID        INT            NOT NULL,
    FiledByTeamID  INT            NOT NULL,
    Description    NVARCHAR(1000) NOT NULL,
    EvidenceURL    NVARCHAR(500)  NULL,
    Status         VARCHAR(20)    NOT NULL DEFAULT 'Open'
                   CHECK (Status IN ('Open','Resolved','Dismissed')),
    AdminNote      NVARCHAR(1000) NULL,
    CreatedAt      DATETIME       NOT NULL DEFAULT GETDATE(),
    ResolvedAt     DATETIME       NULL,
    CONSTRAINT FK_Dispute_Match FOREIGN KEY (MatchID)       REFERENCES tblMatch(MatchID),
    CONSTRAINT FK_Dispute_Team  FOREIGN KEY (FiledByTeamID) REFERENCES tblTeam(TeamID)
);
GO

PRINT 'ETMS_DB created successfully!';
GO
