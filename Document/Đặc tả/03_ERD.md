# ERD — ENTITY RELATIONSHIP DIAGRAM — ETMS

> Hệ thống Quản lý Giải đấu Esports | Phiên bản: 1.0

---

## 1. ERD TỔNG QUAN (Mermaid)

```mermaid
erDiagram
    tblUser {
        int UserID PK
        nvarchar50 Username UK
        varchar256 PasswordHash
        varchar20 Role
        bit IsLocked
        nvarchar100 FullName
        datetime CreatedAt
        int FailedLoginAttempts
    }

    tblTournament {
        int TournamentID PK
        nvarchar200 Name
        varchar30 GameType
        varchar30 Format
        varchar20 Status
        datetime StartDate
        datetime EndDate
        int MaxTeams
        int MinPlayersPerTeam
    }

    tblTeam {
        int TeamID PK
        int TournamentID FK
        nvarchar100 Name
        nvarchar500 Logo
        int CaptainID FK
        varchar20 Status
        nvarchar500 RejectionReason
    }

    tblPlayer {
        int PlayerID PK
        int TeamID FK
        int UserID FK
        nvarchar100 InGameID
        bit IsActive
    }

    tblMatch {
        int MatchID PK
        int TournamentID FK
        int Team1ID FK
        int Team2ID FK
        int WinnerID FK
        int LoserID FK
        varchar30 Status
        datetime ScheduledTime
        datetime ActualStartTime
        int NextMatchID FK
        int Round
        int MatchOrder
        bit IsBye
        bit CheckIn_Team1
        bit CheckIn_Team2
    }

    tblMatchResult {
        int ResultID PK
        int MatchID FK
        int Score1
        int Score2
        nvarchar500 EvidenceURL
        varchar30 Status
        int SubmittedBy FK
        int VerifiedBy FK
        datetime SubmittedAt
    }

    tblMapVeto {
        int VetoID PK
        int MatchID FK
        int TeamID FK
        nvarchar100 MapName
        varchar10 Action
        int VetoOrder
    }

    tblSideSelect {
        int SelectID PK
        int MatchID FK
        int TeamID FK
        varchar10 Side
    }

    tblBRRound {
        int RoundID PK
        int TournamentID FK
        int RoundNumber
        datetime PlayedAt
    }

    tblBRScore {
        int ScoreID PK
        int RoundID FK
        int TeamID FK
        int RankingPoints
        int KillPoints
        int TotalPoints
        int PlacementRank
    }

    tblDispute {
        int DisputeID PK
        int MatchID FK
        int FiledByTeamID FK
        nvarchar1000 Description
        nvarchar500 EvidenceURL
        varchar20 Status
        nvarchar1000 AdminNote
        datetime CreatedAt
    }

    tblAuditLog {
        int LogID PK
        int UserID FK
        varchar100 Action
        datetime Timestamp
        nvarchar2000 Detail
    }

    tblGameConfig {
        int ConfigID PK
        int TournamentID FK_UK
        int BestOf
        nvarcharMAX MapPool
        nvarcharMAX VetoSequence
        int KillPointPerKill
        nvarcharMAX RankingPointTable
    }

    tblNotification {
        int NotificationID PK
        int RecipientID FK
        nvarchar200 Title
        nvarchar1000 Message
        varchar30 Type
        bit IsRead
        varchar50 RelatedEntity
        int RelatedEntityID
        datetime CreatedAt
    }

    tblTournament ||--|| tblGameConfig : "has_config"
    tblUser ||--o{ tblNotification : "receives"

    tblUser ||--o{ tblTeam : "captain_of"
    tblUser ||--o{ tblPlayer : "plays_as"
    tblUser ||--o{ tblMatchResult : "submits"
    tblUser ||--o{ tblMatchResult : "verifies"
    tblUser ||--o{ tblAuditLog : "generates"

    tblTournament ||--o{ tblTeam : "registers_in"
    tblTournament ||--o{ tblMatch : "contains"
    tblTournament ||--o{ tblBRRound : "has_rounds"

    tblTeam ||--o{ tblPlayer : "has_members"
    tblTeam ||--o{ tblMatch : "plays_as_team1"
    tblTeam ||--o{ tblMatch : "plays_as_team2"
    tblTeam ||--o{ tblDispute : "files"
    tblTeam ||--o{ tblBRScore : "scored_in"
    tblTeam ||--o{ tblMapVeto : "performs"
    tblTeam ||--o{ tblSideSelect : "selects"

    tblMatch ||--o| tblMatch : "next_match (linked list)"
    tblMatch ||--o| tblMatchResult : "has_result"
    tblMatch ||--o{ tblMapVeto : "has_veto"
    tblMatch ||--o| tblSideSelect : "has_selection"
    tblMatch ||--o{ tblDispute : "disputed_in"

    tblBRRound ||--o{ tblBRScore : "scored_in"
```

---

## 2. BẢNG MÔ TẢ CHI TIẾT CÁC THỰC THỂ

### 2.1 `tblUser` — Tài khoản người dùng

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `UserID` | INT | PK, IDENTITY(1,1) | Khóa chính tự tăng |
| `Username` | NVARCHAR(50) | NOT NULL, UNIQUE | Tên đăng nhập |
| `PasswordHash` | VARCHAR(256) | NOT NULL | Mật khẩu đã băm (SHA-256/bcrypt) |
| `Role` | VARCHAR(20) | NOT NULL, CHECK IN ('Admin','Captain','Player','Guest') | Vai trò |
| `IsLocked` | BIT | NOT NULL, DEFAULT 0 | Trạng thái khóa |
| `FullName` | NVARCHAR(100) | NOT NULL | Tên hiển thị |
| `CreatedAt` | DATETIME | NOT NULL, DEFAULT GETDATE() | Ngày tạo |
| `FailedLoginAttempts` | INT | NOT NULL, DEFAULT 0 | **[BỔ SUNG]** Số lần đăng nhập sai |

> **Bổ sung so với SRS gốc:** Cột `FailedLoginAttempts` cần thiết để implement khóa tài khoản sau 5 lần sai.

---

### 2.2 `tblTournament` — Giải đấu

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `TournamentID` | INT | PK, IDENTITY(1,1) | Khóa chính |
| `Name` | NVARCHAR(200) | NOT NULL | Tên giải đấu |
| `GameType` | VARCHAR(30) | NOT NULL, CHECK IN ('MOBA','FPS','BattleRoyale','Fighting') | Loại game |
| `Format` | VARCHAR(30) | NOT NULL, CHECK IN ('SingleElimination','BattleRoyale') | Thể thức |
| `Status` | VARCHAR(20) | NOT NULL | `Draft` → `Registration` → `Active` → `Completed` |
| `StartDate` | DATETIME | NOT NULL | Ngày bắt đầu |
| `EndDate` | DATETIME | NULL | Ngày kết thúc |
| `MaxTeams` | INT | NOT NULL | Số đội tối đa |
| `MinPlayersPerTeam` | INT | NOT NULL, DEFAULT 5 | Số thành viên tối thiểu |
| `BracketGenerated` | BIT | NOT NULL, DEFAULT 0 | **[BỔ SUNG]** Đã tạo bracket chưa |
| `CreatedBy` | INT | FK → tblUser | **[BỔ SUNG]** Admin tạo giải |

---

### 2.3 `tblTeam` — Đội tuyển

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `TeamID` | INT | PK, IDENTITY(1,1) | Khóa chính |
| `TournamentID` | INT | NOT NULL, FK → tblTournament | Giải đấu dự thi |
| `Name` | NVARCHAR(100) | NOT NULL | Tên đội (unique trong Tournament) |
| `Logo` | NVARCHAR(500) | NULL | URL logo |
| `CaptainID` | INT | NOT NULL, FK → tblUser | Đội trưởng |
| `Status` | VARCHAR(20) | NOT NULL, DEFAULT 'Pending' | `Pending` / `Approved` / `Rejected` |
| `RejectionReason` | NVARCHAR(500) | NULL | Lý do từ chối |
| `SubmittedAt` | DATETIME | NULL | **[BỔ SUNG]** Thời gian nộp hồ sơ |

> **UNIQUE CONSTRAINT:** `UNIQUE(TournamentID, Name)` — Tên đội unique trong Tournament

---

### 2.4 `tblPlayer` — Tuyển thủ

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `PlayerID` | INT | PK, IDENTITY(1,1) | Khóa chính |
| `TeamID` | INT | NOT NULL, FK → tblTeam | Đội tham gia |
| `UserID` | INT | NOT NULL, FK → tblUser | Tài khoản hệ thống |
| `InGameID` | NVARCHAR(100) | NOT NULL | Tên in-game |
| `IsActive` | BIT | NOT NULL, DEFAULT 1 | Còn trong đội |
| `JoinedAt` | DATETIME | NOT NULL, DEFAULT GETDATE() | **[BỔ SUNG]** Ngày vào đội |

> **UNIQUE CONSTRAINT:** `UNIQUE(UserID, TournamentID vì qua TeamID)` — kiểm tra qua BUS: `IsPlayerInAnotherTeam`

---

### 2.5 `tblMatch` — Trận đấu (★ Linked List)

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `MatchID` | INT | PK, IDENTITY(1,1) | Khóa chính |
| `TournamentID` | INT | NOT NULL, FK → tblTournament | Giải đấu |
| `Team1ID` | INT | NULL, FK → tblTeam | Đội 1 (NULL khi chờ vòng trước) |
| `Team2ID` | INT | NULL, FK → tblTeam | Đội 2 (NULL khi chờ vòng trước) |
| `WinnerID` | INT | NULL, FK → tblTeam | Đội thắng |
| `LoserID` | INT | NULL, FK → tblTeam | Đội thua |
| `Status` | VARCHAR(30) | NOT NULL | `Scheduled`/`CheckInOpen`/`Live`/`Completed`/`Walkover`/`Disputed` |
| `ScheduledTime` | DATETIME | NULL | Thời gian dự kiến |
| `ActualStartTime` | DATETIME | NULL | Thời gian thực tế bắt đầu |
| `NextMatchID` | INT | NULL, FK → tblMatch (SELF) | **LINKED LIST** trỏ đến trận tiếp theo |
| `Round` | INT | NOT NULL | Số vòng (1 = vòng đầu) |
| `MatchOrder` | INT | NOT NULL | Thứ tự trong vòng |
| `IsBye` | BIT | NOT NULL, DEFAULT 0 | 1 = Bye |
| `CheckIn_Team1` | BIT | NOT NULL, DEFAULT 0 | Trạng thái check-in đội 1 |
| `CheckIn_Team2` | BIT | NOT NULL, DEFAULT 0 | Trạng thái check-in đội 2 |

---

### 2.6 `tblMatchResult` — Kết quả trận đấu

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `ResultID` | INT | PK, IDENTITY(1,1) | Khóa chính |
| `MatchID` | INT | NOT NULL, FK → tblMatch, UNIQUE | Mỗi trận chỉ có 1 result chính |
| `Score1` | INT | NOT NULL | Điểm đội 1 |
| `Score2` | INT | NOT NULL | Điểm đội 2 |
| `EvidenceURL` | NVARCHAR(500) | NOT NULL | URL ảnh bằng chứng |
| `Status` | VARCHAR(30) | NOT NULL | `PendingVerification`/`Verified`/`Disputed` |
| `SubmittedBy` | INT | NOT NULL, FK → tblUser | Captain nộp |
| `VerifiedBy` | INT | NULL, FK → tblUser | Admin xác nhận |
| `SubmittedAt` | DATETIME | NOT NULL, DEFAULT GETDATE() | Thời gian nộp |
| `VerifiedAt` | DATETIME | NULL | **[BỔ SUNG]** Thời gian xác nhận |

---

### 2.7 `tblMapVeto` — Cấm bản đồ (FPS)

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `VetoID` | INT | PK, IDENTITY(1,1) | Khóa chính |
| `MatchID` | INT | NOT NULL, FK → tblMatch | Trận đấu |
| `TeamID` | INT | NOT NULL, FK → tblTeam | Đội thực hiện |
| `MapName` | NVARCHAR(100) | NOT NULL | Tên bản đồ |
| `Action` | VARCHAR(10) | NOT NULL, CHECK IN ('Ban','Pick') | Cấm hoặc chọn |
| `VetoOrder` | INT | NOT NULL | Thứ tự thực hiện |

---

### 2.8 `tblSideSelect` — Chọn phe (MOBA)

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `SelectID` | INT | PK, IDENTITY(1,1) | Khóa chính |
| `MatchID` | INT | NOT NULL, FK → tblMatch | Trận đấu |
| `TeamID` | INT | NOT NULL, FK → tblTeam | Đội được chọn phe |
| `Side` | VARCHAR(10) | NOT NULL, CHECK IN ('Blue','Red') | Phe |

---

### 2.9 `tblBRRound` — Vòng Battle Royale

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `RoundID` | INT | PK, IDENTITY(1,1) | Khóa chính |
| `TournamentID` | INT | NOT NULL, FK → tblTournament | Giải đấu |
| `RoundNumber` | INT | NOT NULL | Số vòng |
| `PlayedAt` | DATETIME | NULL | Thời gian thi đấu |

---

### 2.10 `tblBRScore` — Điểm Battle Royale

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `ScoreID` | INT | PK, IDENTITY(1,1) | Khóa chính |
| `RoundID` | INT | NOT NULL, FK → tblBRRound | Vòng đấu |
| `TeamID` | INT | NOT NULL, FK → tblTeam | Đội |
| `RankingPoints` | INT | NOT NULL, DEFAULT 0 | Điểm thứ hạng |
| `KillPoints` | INT | NOT NULL, DEFAULT 0 | Điểm hạ gục |
| `TotalPoints` | INT | NOT NULL | `RankingPoints + KillPoints` (computed) |
| `PlacementRank` | INT | NULL | **[BỔ SUNG]** Thứ hạng trong vòng này |

---

### 2.11 `tblDispute` — Khiếu nại

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `DisputeID` | INT | PK, IDENTITY(1,1) | Khóa chính |
| `MatchID` | INT | NOT NULL, FK → tblMatch | Trận bị khiếu nại |
| `FiledByTeamID` | INT | NOT NULL, FK → tblTeam | Đội gửi |
| `Description` | NVARCHAR(1000) | NOT NULL | Nội dung |
| `EvidenceURL` | NVARCHAR(500) | NULL | Bằng chứng |
| `Status` | VARCHAR(20) | NOT NULL, DEFAULT 'Open' | `Open`/`Resolved`/`Dismissed` |
| `AdminNote` | NVARCHAR(1000) | NULL | Phán quyết |
| `CreatedAt` | DATETIME | NOT NULL, DEFAULT GETDATE() | Ngày tạo |
| `ResolvedAt` | DATETIME | NULL | **[BỔ SUNG]** Ngày giải quyết |
| `ResolvedBy` | INT | NULL, FK → tblUser | **[BỔ SUNG]** Admin giải quyết |

---

### 2.12 `tblAuditLog` — Nhật ký kiểm toán **[BỔ SUNG hoàn chỉnh]**

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `LogID` | INT | PK, IDENTITY(1,1) | Khóa chính |
| `UserID` | INT | NULL, FK → tblUser | Người thực hiện (NULL = System) |
| `Action` | VARCHAR(100) | NOT NULL | Hành động (`LOGIN`, `APPROVE_TEAM`, `GENERATE_BRACKET`...) |
| `Timestamp` | DATETIME | NOT NULL, DEFAULT GETDATE() | Thời điểm |
| `Detail` | NVARCHAR(2000) | NULL | Chi tiết bổ sung (JSON/text) |
| `IPAddress` | VARCHAR(45) | NULL | Địa chỉ IP |
| `AffectedEntity` | VARCHAR(50) | NULL | **[BỔ SUNG]** Bảng bị ảnh hưởng |
| `AffectedID` | INT | NULL | **[BỔ SUNG]** ID bản ghi bị ảnh hưởng |

---

## 3. QUAN HỆ VÀ FOREIGN KEYS CHI TIẾT

```
tblTeam.TournamentID    → tblTournament.TournamentID  (ON DELETE RESTRICT)
tblTeam.CaptainID       → tblUser.UserID               (ON DELETE RESTRICT)

tblPlayer.TeamID        → tblTeam.TeamID               (ON DELETE CASCADE)
tblPlayer.UserID        → tblUser.UserID               (ON DELETE RESTRICT)

tblMatch.TournamentID   → tblTournament.TournamentID  (ON DELETE RESTRICT)
tblMatch.Team1ID        → tblTeam.TeamID               (ON DELETE SET NULL)
tblMatch.Team2ID        → tblTeam.TeamID               (ON DELETE SET NULL)
tblMatch.WinnerID       → tblTeam.TeamID               (ON DELETE SET NULL)
tblMatch.LoserID        → tblTeam.TeamID               (ON DELETE SET NULL)
tblMatch.NextMatchID    → tblMatch.MatchID             (ON DELETE SET NULL) [SELF-REF]

tblMatchResult.MatchID      → tblMatch.MatchID         (ON DELETE RESTRICT)
tblMatchResult.SubmittedBy  → tblUser.UserID           (ON DELETE RESTRICT)
tblMatchResult.VerifiedBy   → tblUser.UserID           (ON DELETE RESTRICT)

tblMapVeto.MatchID      → tblMatch.MatchID             (ON DELETE CASCADE)
tblMapVeto.TeamID       → tblTeam.TeamID               (ON DELETE RESTRICT)

tblSideSelect.MatchID   → tblMatch.MatchID             (ON DELETE CASCADE)
tblSideSelect.TeamID    → tblTeam.TeamID               (ON DELETE RESTRICT)

tblDispute.MatchID          → tblMatch.MatchID         (ON DELETE RESTRICT)
tblDispute.FiledByTeamID    → tblTeam.TeamID           (ON DELETE RESTRICT)
tblDispute.ResolvedBy       → tblUser.UserID           (ON DELETE RESTRICT)

tblBRRound.TournamentID → tblTournament.TournamentID  (ON DELETE RESTRICT)
tblBRScore.RoundID      → tblBRRound.RoundID           (ON DELETE RESTRICT)
tblBRScore.TeamID       → tblTeam.TeamID               (ON DELETE RESTRICT)

tblAuditLog.UserID      → tblUser.UserID              (ON DELETE SET NULL)
```

---

## 4. LỖ HỔNG ERD PHÁT HIỆN

| ID | Lỗ hổng | Khuyến nghị |
|---|---|---|
| **ERD-01** | `tblUser` thiếu cột `FailedLoginAttempts` → không thể implement khóa sau 5 lần sai | Thêm cột `FailedLoginAttempts INT NOT NULL DEFAULT 0` |
| **ERD-02** | Không có bảng `tblGameConfig` — cấu hình Map Pool, Bo1/Bo3/Bo5 bị nhúng vào `tblTournament` nhưng không có cột riêng | Tạo bảng `tblGameConfig(ConfigID, TournamentID, MapPool NVARCHAR, BestOf INT, KillPointPerKill INT)` |
| **ERD-03** | `tblTeam` thiếu `SubmittedAt` → không thể theo dõi lịch sử nộp hồ sơ | Thêm cột `SubmittedAt DATETIME NULL` |
| **ERD-04** | `tblMatchResult.MatchID` cần UNIQUE constraint — mỗi trận chỉ có 1 kết quả chính | Thêm `UNIQUE(MatchID)` |
| **ERD-05** | `tblDispute` thiếu `ResolvedAt` và `ResolvedBy` | Đã bổ sung trong phiên bản này |
| **ERD-06** | `tblBRScore.TotalPoints` nên là computed column để tránh data inconsistency | `TotalPoints AS (RankingPoints + KillPoints) PERSISTED` |
| **ERD-07** | Không có bảng tracking notification (thông báo cho Captain khi bị Rejected, Walkover, v.v.) | Xem xét thêm bảng `tblNotification` hoặc dùng in-app log |
