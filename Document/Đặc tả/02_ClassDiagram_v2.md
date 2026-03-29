# CLASS DIAGRAM v2.0 — ETMS (Hoàn chỉnh)

> Bổ sung toàn bộ classes còn thiếu: MapVetoBUS, SideSelectBUS, GameConfigDAL, NotificationBUS/DAL, AuditLogBUS/DAL

---

## 1. KIẾN TRÚC TỔNG QUAN v2.0

```mermaid
graph TB
    subgraph GUI["🖥️ GUI (15 Forms)"]
        F1[frmLogin] --- F2[frmDashboard]
        F3[frmTournamentSetup] --- F4[frmTeamManagement]
        F5[frmBracketView] --- F6[frmMatchSchedule]
        F7[frmCheckIn] --- F8[frmMapVeto]
        F9[frmSideSelect] --- F10[frmResultSubmit]
        F11[frmLeaderboard] --- F12[frmDisputeManage]
        F13[frmNotification] --- F14[frmAuditLog]
        F15[frmUserManagement]
    end
    subgraph BUS["⚙️ BUS (14 Classes)"]
        B1[AuthBUS] --- B2[TournamentBUS]
        B3[TeamBUS] --- B4[BracketBUS]
        B5[MatchBUS] --- B6[CheckInBUS]
        B7[MapVetoBUS] --- B8[SideSelectBUS]
        B9[ResultBUS] --- B10[LeaderboardBUS]
        B11[DisputeBUS] --- B12[NotificationBUS]
        B13[AuditLogBUS] --- B14[SessionManager]
    end
    subgraph DAL["🗄️ DAL (15 Classes)"]
        D0[DBConnection] --- D1[UserDAL]
        D2[TournamentDAL] --- D3[GameConfigDAL]
        D4[TeamDAL] --- D5[BracketDAL]
        D6[MatchDAL] --- D7[CheckInDAL]
        D8[MapVetoDAL] --- D9[SideSelectDAL]
        D10[ResultDAL] --- D11[LeaderboardDAL]
        D12[DisputeDAL] --- D13[NotificationDAL]
        D14[AuditLogDAL]
    end
    GUI --> BUS --> DAL --> DB[(SQL Server\n14 Tables)]
```

---

## 2. DTO LAYER — Hoàn chỉnh

```mermaid
classDiagram
    class UserDTO {
        +int UserID
        +string Username
        +string PasswordHash
        +string Role
        +bool IsLocked
        +string FullName
        +string Email
        +DateTime CreatedAt
        +int FailedLoginAttempts
    }
    class TournamentDTO {
        +int TournamentID
        +string Name
        +string GameType
        +string Format
        +string Status
        +DateTime StartDate
        +DateTime? EndDate
        +DateTime? RegistrationDeadline
        +int MaxTeams
        +int MinPlayersPerTeam
        +bool BracketGenerated
    }
    class GameConfigDTO {
        +int ConfigID
        +int TournamentID
        +int BestOf
        +string MapPool
        +string VetoSequence
        +int KillPointPerKill
        +string RankingPointTable
        +int VetoTimeoutSeconds
    }
    class TeamDTO {
        +int TeamID
        +int TournamentID
        +string Name
        +string Logo
        +int CaptainID
        +string Status
        +string RejectionReason
        +DateTime? SubmittedAt
        +List~PlayerDTO~ Players
    }
    class PlayerDTO {
        +int PlayerID
        +int TeamID
        +int UserID
        +string InGameID
        +bool IsActive
        +DateTime JoinedAt
    }
    class MatchDTO {
        +int MatchID
        +int TournamentID
        +int? Team1ID
        +int? Team2ID
        +int? WinnerID
        +int? LoserID
        +string Status
        +DateTime? ScheduledTime
        +DateTime? NewScheduledTime
        +DateTime? ActualStartTime
        +int? NextMatchID
        +int Round
        +int MatchOrder
        +bool IsBye
        +bool CheckIn_Team1
        +bool CheckIn_Team2
    }
    class MatchResultDTO {
        +int ResultID
        +int MatchID
        +int Score1
        +int Score2
        +string EvidenceURL
        +string Status
        +int SubmittedBy
        +int? VerifiedBy
        +DateTime SubmittedAt
        +DateTime? VerifiedAt
    }
    class DisputeDTO {
        +int DisputeID
        +int MatchID
        +int FiledByTeamID
        +string DisputeType
        +string Description
        +string EvidenceURL
        +string Status
        +string AdminNote
        +DateTime CreatedAt
        +DateTime? DeadlineResolveAt
        +DateTime? ResolvedAt
        +int? ResolvedBy
    }
    class NotificationDTO {
        +int NotifID
        +int UserID
        +string Title
        +string Message
        +bool IsRead
        +DateTime CreatedAt
        +string RelatedEntityType
        +int? RelatedEntityID
    }
    class MapVetoDTO {
        +int VetoID
        +int MatchID
        +int TeamID
        +string MapName
        +string Action
        +int VetoOrder
    }
    class GameConfigDTO
    TournamentDTO "1" --> "1" GameConfigDTO : has config
    TeamDTO "1" o-- "many" PlayerDTO : has members
    MatchDTO --> MatchDTO : NextMatchID (linked list)
```

---

## 3. BUS LAYER — Đầy đủ với Classes Mới

```mermaid
classDiagram
    class MapVetoBUS {
        -GameConfigDAL configDAL
        -MapVetoDAL vetoDAL
        +void StartVeto(int matchId)
        +bool SubmitVetoAction(int matchId, int teamId, string mapName, string action)
        +List~string~ GetRemainingMaps(int matchId)
        +string DetermineFirstTeam(int matchId)
        +bool IsVetoComplete(int matchId)
        +void AutoBanOnTimeout(int matchId, int currentTeamId)
        -bool ValidateAction(string action, string vetoSequence, int vetoOrder)
    }

    class SideSelectBUS {
        -SideSelectDAL sideDAL
        +int DetermineFirstPick(int matchId)
        +bool SubmitSideSelection(int matchId, int teamId, string side)
        +void AutoSelectOnTimeout(int matchId, int eligibleTeamId)
        -int GenerateCoinToss(int matchId)
    }

    class NotificationBUS {
        -NotificationDAL notifDAL
        +void Notify(int userId, string title, string message, string entityType, int entityId)
        +void NotifyTeamApproved(int captainId, string teamName)
        +void NotifyTeamRejected(int captainId, string teamName, string reason)
        +void NotifyCheckInOpen(int team1CaptainId, int team2CaptainId, int matchId)
        +void NotifyWalkover(int captainId, string result)
        +void NotifyResultPending(int adminId, int matchId)
        +void NotifyResultRejected(int captainId, int matchId, string reason)
        +void NotifyDisputeFiled(int adminId, int disputeId)
        +void NotifyPasswordReset(int userId, string tempPassword)
        +List~NotificationDTO~ GetUnreadNotifications(int userId)
        +bool MarkAsRead(int notifId, int userId)
        +int GetUnreadCount(int userId)
    }

    class AuditLogBUS {
        -AuditLogDAL auditDAL
        +void Log(int userId, string action, string detail, string entity, int entityId)
        +void LogLogin(int userId)
        +void LogLogout(int userId)
        +void LogTeamApprove(int adminId, int teamId)
        +void LogTeamReject(int adminId, int teamId, string reason)
        +void LogGenerateBracket(int adminId, int tournamentId)
        +void LogResultApprove(int adminId, int matchId)
        +void LogLockAccount(int adminId, int targetUserId)
        +List~AuditLogDTO~ GetLogs(DateTime from, DateTime to, string action)
    }

    class SessionManager {
        <<Singleton>>
        -static SessionManager _instance
        +UserDTO CurrentUser
        +DateTime LastActivityTime
        -int TimeoutMinutes
        +static SessionManager GetInstance()
        +void SetUser(UserDTO user)
        +bool HasRole(string role)
        +bool IsSessionValid()
        +void UpdateActivity()
        +void ClearSession()
    }

    class AuthBUS {
        -UserDAL userDAL
        -NotificationBUS notifBUS
        -AuditLogBUS auditBUS
        -SessionManager session
        +LoginResult Login(string username, string password)
        +void Logout()
        +bool ChangePassword(int userId, string oldPwd, string newPwd)
        +bool ResetPassword(int userId)
        +bool LockAccount(int targetUserId, int adminId)
        +bool UnlockAccount(int targetUserId, int adminId)
        -string HashPassword(string plain)
        -bool VerifyPassword(string plain, string hash)
    }

    class ResultBUS {
        -ResultDAL resultDAL
        -MatchDAL matchDAL
        -BracketDAL bracketDAL
        -NotificationBUS notifBUS
        -AuditLogBUS auditBUS
        +SubmitResult_Result SubmitResult(int matchId, int score1, int score2, string filePath, int captainId)
        +bool ApproveResult(int matchId, int winnerId, int adminId)
        +bool RejectResult(int matchId, string reason, int adminId)
        +bool OverrideResult(int matchId, int newWinnerId, int adminId)
        -ValidationResult ValidateFile(string filePath)
        -bool ValidateExtension(string filePath)
        -bool ValidateMagicBytes(string filePath)
        -bool ValidateSize(string filePath)
        -void AdvanceWinner(int matchId, int winnerId)
    }

    class DisputeBUS {
        -DisputeDAL disputeDAL
        -NotificationBUS notifBUS
        -AuditLogBUS auditBUS
        +FileDisputeResult FileDispute(DisputeDTO dto, int captainId)
        +bool ResolveDispute(int disputeId, string note, int adminId, bool overrideResult, int? newWinnerId)
        +bool DismissDispute(int disputeId, string note, int adminId)
        +List~DisputeDTO~ GetOpenDisputes()
        +void CheckOverdueSLAAndNotify()
        -bool HasReachedDisputeLimit(int teamId, int tournamentId)
    }

    class CheckInBUS {
        -CheckInDAL checkInDAL
        -MatchDAL matchDAL
        -NotificationBUS notifBUS
        -BracketBUS bracketBUS
        +bool ConfirmCheckIn(int matchId, int teamId)
        +bool IsCheckInWindowOpen(int matchId)
        +WalkoverResult ProcessWalkoverOnTimeout(int matchId)
        +bool HandleWalkoverPendingDecision(int matchId, int? winnerId, int adminId)
    }

    class BracketBUS {
        -TeamDAL teamDAL
        -BracketDAL bracketDAL
        -NotificationBUS notifBUS
        -AuditLogBUS auditBUS
        -IBracketStrategy _strategy
        +BracketDTO GenerateBracket(int tournamentId)
        +bool RegenerateBracket(int tournamentId, int adminId)
        +BracketDTO GetBracket(int tournamentId)
        +bool ApplyWalkover(int matchId, int winnerId)
        +void SetStrategy(IBracketStrategy strategy)
        -List~TeamDTO~ ShuffleTeams(List~TeamDTO~ teams)
        -int NextPowerOf2(int n)
    }

    class IBracketStrategy {
        <<interface>>
        +BracketDTO Generate(List~TeamDTO~ teams, int tournamentId)
        +string GetFormatName()
    }
    class SingleEliminationStrategy {
        +BracketDTO Generate(List~TeamDTO~ teams, int tournamentId)
        +string GetFormatName()
    }
    class BattleRoyaleStrategy {
        +BracketDTO Generate(List~TeamDTO~ teams, int tournamentId)
        +string GetFormatName()
    }
    IBracketStrategy <|.. SingleEliminationStrategy
    IBracketStrategy <|.. BattleRoyaleStrategy
    BracketBUS --> IBracketStrategy
```

---

## 4. DAL LAYER — Classes Mới

```mermaid
classDiagram
    class GameConfigDAL {
        -DBConnection db
        +bool SaveConfig(GameConfigDTO config)
        +bool UpdateConfig(GameConfigDTO config)
        +GameConfigDTO GetConfig(int tournamentId)
    }

    class MapVetoDAL {
        -DBConnection db
        +bool InsertVetoAction(MapVetoDTO dto)
        +List~MapVetoDTO~ GetVetoHistory(int matchId)
        +int GetVetoCount(int matchId)
    }

    class SideSelectDAL {
        -DBConnection db
        +bool InsertSideSelection(int matchId, int teamId, string side)
        +SideSelectDTO GetSelection(int matchId)
    }

    class NotificationDAL {
        -DBConnection db
        +int InsertNotification(NotificationDTO dto)
        +List~NotificationDTO~ GetByUser(int userId, bool unreadOnly)
        +bool MarkAsRead(int notifId)
        +int GetUnreadCount(int userId)
    }

    class AuditLogDAL {
        -DBConnection db
        +bool InsertLog(int userId, string action, string detail, string entity, int entityId)
        +List~AuditLogDTO~ QueryLogs(DateTime from, DateTime to, string action)
    }
```

---

## 5. GUI — BaseForm với RBAC Hoàn chỉnh

```mermaid
classDiagram
    class BaseForm {
        <<abstract>>
        #SessionManager session
        #NotificationBUS notifBUS
        #abstract string[] RequiredRoles
        #override void OnLoad()
        #void EnforceRBAC()
        #void ShowError(string message)
        #void ShowSuccess(string message)
        +void OnUserActivity()
    }
    note for BaseForm "EnforceRBAC() được gọi trong OnLoad()\nNếu Role không hợp lệ → Close() ngay\nOnUserActivity() cập nhật LastActivityTime"

    class frmDashboard {
        -NotificationBUS notifBUS
        -Timer timerSessionCheck
        -Timer timerNotifRefresh
        -Label lblNotifBadge
        +void LoadMenuByRole()
        +void UpdateNotifBadge()
        -void timerSession_Tick()
    }

    class frmMapVeto {
        -MapVetoBUS mapVetoBUS
        -Timer timerVeto
        -ProgressBar pbCountdown
        -ListBox lstMapPool
        -ListBox lstBanned
        -Button btnBanPick
        +void LoadMapPool(int matchId)
        +void btnBanPick_Click()
        -void timerVeto_Tick()
        -void OnTimeout()
    }

    class frmSideSelect {
        -SideSelectBUS sideSelectBUS
        -Timer timerSelect
        -Button btnBlue
        -Button btnRed
        -Label lblEligibleTeam
        +void LoadSideSelect(int matchId)
        +void btnBlue_Click()
        +void btnRed_Click()
        -void timerSelect_Tick()
    }

    BaseForm <|-- frmDashboard
    BaseForm <|-- frmMapVeto
    BaseForm <|-- frmSideSelect
```

---

## 6. ENUM TYPES

```csharp
// Thay thế các magic strings / int tham số
public enum UserRole { Admin, Captain, Player, Guest }
public enum TournamentStatus { Draft, Registration, Active, Completed, Cancelled }
public enum TeamStatus { Pending, Approved, Rejected, Disqualified }
public enum MatchStatus {
    Scheduled, Postponed, CheckInOpen, Live,
    PendingVerification, Completed, Walkover, WalkoverPending, Disputed, Cancelled
}
public enum ResultStatus { PendingVerification, Verified, Disputed }
public enum DisputeStatus { Open, Resolved, Dismissed }
public enum DisputeType { HackCheat, WrongScore, InvalidPlayer, Other }
public enum VetoAction { Ban, Pick }
public enum Side { Blue, Red }
public enum CheckInTarget { Team1, Team2 }   // Thay thế teamNum: int

// LoginResult enum thay thế bool return
public enum LoginResult { Success, WrongPassword, AccountLocked, NotFound, DBError }

// File validation result
public enum FileValidationResult { Valid, InvalidExtension, InvalidMagicBytes, FileTooLarge }
```

---

## 7. TỔNG HỢP THAY ĐỔI SO VỚI v1.0

| Thành phần | v1.0 | v2.0 | Lý do |
|---|---|---|---|
| BUS Classes | 8 | 14 | Thêm MapVetoBUS, SideSelectBUS, NotificationBUS, AuditLogBUS, TournamentBUS, SessionManager |
| DAL Classes | 9 | 15 | Thêm GameConfigDAL, MapVetoDAL, SideSelectDAL, NotificationDAL, AuditLogDAL, TournamentDAL |
| GUI Forms | 11 | 15 | Thêm frmSideSelect, frmNotification, frmAuditLog, frmUserManagement |
| DB Tables | 12 | 14 | Thêm tblGameConfig, tblNotification |
| Enums | 0 | 10 | Tránh magic strings, tăng type safety |
| DTO Classes | 9 | 12 | Thêm GameConfigDTO, NotificationDTO, MapVetoDTO |
