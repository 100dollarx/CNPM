-- ============================================================
-- ETMS_InsertSample.sql
-- Dữ liệu mẫu để kiểm thử
-- Mật khẩu mặc định: "admin123" → SHA-256
-- ============================================================

USE ETMS_DB;
GO

-- SHA-256 của "admin123":
-- 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a

-- SHA-256 của "captain1":
-- b14361404c078ffd549c03db443c3fede2f3e534d73f78f77301ed97d4a436a9

-- SHA-256 của "captain2":
-- 4e7afebcfbae000b22c7c85e5560f89a2a0280b4a9fd830f93a7dfca3e3d738c

-- ============================================================
-- Users
-- ============================================================
INSERT INTO tblUser (Username, PasswordHash, FullName, Role) VALUES
('admin',    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a', N'Admin Hệ thống',    'Admin'),
('captain1', 'b14361404c078ffd549c03db443c3fede2f3e534d73f78f77301ed97d4a436a9', N'Nguyễn Văn A',      'Captain'),
('captain2', '4e7afebcfbae000b22c7c85e5560f89a2a0280b4a9fd830f93a7dfca3e3d738c', N'Trần Thị B',        'Captain'),
('captain3', '4e7afebcfbae000b22c7c85e5560f89a2a0280b4a9fd830f93a7dfca3e3d738c', N'Lê Văn C',          'Captain'),
('captain4', '4e7afebcfbae000b22c7c85e5560f89a2a0280b4a9fd830f93a7dfca3e3d738c', N'Phạm Thị D',        'Captain'),
('captain5', '4e7afebcfbae000b22c7c85e5560f89a2a0280b4a9fd830f93a7dfca3e3d738c', N'Hoàng Văn E',       'Captain'),
('captain6', '4e7afebcfbae000b22c7c85e5560f89a2a0280b4a9fd830f93a7dfca3e3d738c', N'Nguyễn Thị F',     'Captain'),
('captain7', '4e7afebcfbae000b22c7c85e5560f89a2a0280b4a9fd830f93a7dfca3e3d738c', N'Bùi Văn G',         'Captain'),
('captain8', '4e7afebcfbae000b22c7c85e5560f89a2a0280b4a9fd830f93a7dfca3e3d738c', N'Đinh Thị H',        'Captain');
GO

-- ============================================================
-- Tournament (1 giải Valorant để test)
-- ============================================================
INSERT INTO tblTournament (Name, GameType, Format, Status, MaxTeams, MinPlayersPerTeam, StartDate, CreatedBy)
VALUES (N'TDTU Valorant Championship 2026', 'FPS', 'SingleElimination', 'Registration', 16, 5, '2026-04-01', 1);
GO

-- TournamentID = 1

-- ============================================================
-- Teams (8 teams, tất cả Approved để test bracket generation)
-- ============================================================
INSERT INTO tblTeam (TournamentID, Name, CaptainID, Status) VALUES
(1, N'Team Alpha',   2, 'Approved'),
(1, N'Team Bravo',   3, 'Approved'),
(1, N'Team Charlie', 4, 'Approved'),
(1, N'Team Delta',   5, 'Approved'),
(1, N'Team Echo',    6, 'Approved'),
(1, N'Team Foxtrot', 7, 'Approved'),
(1, N'Team Golf',    8, 'Approved'),
(1, N'Team Hotel',   9, 'Approved');
GO

-- ============================================================
-- Players (5 người mỗi đội - đơn giản hoá)
-- ============================================================
DECLARE @i INT = 1;
DECLARE @teamID INT;

WHILE @i <= 8
BEGIN
    SET @teamID = @i;
    INSERT INTO tblPlayer (TeamID, FullName, InGameID) VALUES
    (@teamID, N'Player1_T' + CAST(@i AS NVARCHAR), N'ign1_t' + CAST(@i AS NVARCHAR)),
    (@teamID, N'Player2_T' + CAST(@i AS NVARCHAR), N'ign2_t' + CAST(@i AS NVARCHAR)),
    (@teamID, N'Player3_T' + CAST(@i AS NVARCHAR), N'ign3_t' + CAST(@i AS NVARCHAR)),
    (@teamID, N'Player4_T' + CAST(@i AS NVARCHAR), N'ign4_t' + CAST(@i AS NVARCHAR)),
    (@teamID, N'Player5_T' + CAST(@i AS NVARCHAR), N'ign5_t' + CAST(@i AS NVARCHAR));
    SET @i = @i + 1;
END;
GO

PRINT 'Sample data inserted successfully!';
GO
