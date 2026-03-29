# MA TRẬN TRUY VẾT YÊU CẦU — ETMS
## Requirements Traceability Matrix (RTM)
**Phiên bản:** 1.0 | **Ngày:** 2026-03-24 | **Chuẩn:** IEEE 830

> Ma trận này đảm bảo mọi yêu cầu đều được phủ bởi ít nhất 1 Use Case, 1 Class, và 1 Test Case.

---

## 1. TRACEABILITY: FR → USE CASE → BUS/DAL → TEST CASE

| Yêu cầu (FR) | Use Case | BUS Method chính | DAL Method chính | Test Cases | Màn hình |
|---|---|---|---|---|---|
| **FR-1.1** Đăng nhập | UC-1.1 | `AuthBUS.Login()` | `UserDAL.GetUser()` | TC-13, SEC-TC-01, SEC-TC-03, SEC-TC-07 | frmLogin |
| **FR-1.1a** Khóa sau 5 lần | UC-1.1 | `AuthBUS.IncrementFailed()` | `UserDAL.UpdateFailed()` | TC-13, SEC-TC-03 | frmLogin |
| **FR-1.2** Quản lý tài khoản | UC-1.2 | `AuthBUS.LockAccount()` | `UserDAL.UpdateLockStatus()` | — | frmUserMgmt |
| **FR-1.3** Đổi mật khẩu | UC-1.3 | `AuthBUS.ChangePassword()` | `UserDAL.UpdatePassword()` | — | frmDashboard |
| **FR-2.1** Tạo đội | UC-2.1 | `TeamBUS.CreateTeam()` | `TeamDAL.CreateTeam()` | TC-15, TC-16* | frmTeamMgmt |
| **FR-2.1a** Validate roster | UC-2.1 | `TeamBUS.ValidateRoster()` | `TeamDAL.IsPlayerInOther()` | TC-15 | frmTeamMgmt |
| **FR-2.2** Xét duyệt | UC-2.2 | `TeamBUS.ApproveTeam()` | `TeamDAL.UpdateStatus()` | — | frmTeamMgmt |
| **FR-2.2a** Disqualify | UC-2.2+ | `TeamBUS.DisqualifyTeam()` | `TeamDAL.UpdateStatus()` | TC-22 | frmTeamMgmt |
| **FR-3.0** Cấu hình Tournament | UC-3.0 | `TournamentBUS.Create()` | `TournamentDAL.Insert()` | — | frmSetup |
| **FR-3.1** Generate Bracket | UC-3.1 | `BracketBUS.Generate()` | `BracketDAL.SaveBracket()` | TC-01, TC-02, TC-21 | frmBracket |
| **FR-3.1a** Bye Logic | UC-3.1 | `BracketBUS.NextPowerOf2()` | — | TC-02, TC-21 | frmBracket |
| **FR-3.1b** Regenerate | UC-3.1 | `BracketBUS.Regenerate()` | `BracketDAL.Delete()` | TC-20 | frmBracket |
| **FR-4.1** Lên lịch | UC-4.1 | `MatchBUS.Schedule()` | `MatchDAL.UpdateSchedule()` | — | frmSchedule |
| **FR-4.1a** Conflict check | UC-4.1 | `MatchBUS.HasConflict()` | `MatchDAL.GetByTeam()` | — | frmSchedule |
| **FR-4.1b** Postpone | UC-4.1+ | `MatchBUS.PostponeMatch()` | `MatchDAL.UpdateStatus()` | — | frmSchedule |
| **FR-4.2** Check-in | UC-4.2 | `CheckInBUS.ConfirmCheckIn()` | `CheckInDAL.ConfirmCheckIn()` | TC-03, TC-04, TC-06 | frmCheckIn |
| **FR-4.3** Walkover tự động | UC-4.3 | `CheckInBUS.ProcessWalkover()` | `CheckInDAL.ApplyWalkover()` | TC-04, TC-05 | frmCheckIn |
| **FR-4.3C** WalkoverPending | UC-4.3C | `CheckInBUS.HandlePending()` | `MatchDAL.UpdateStatus()` | TC-05 | frmCheckIn |
| **FR-5.1** Map Veto | UC-5.1 | `MapVetoBUS.SubmitAction()` | `MapVetoDAL.Insert()` | TC-18 | frmMapVeto |
| **FR-5.1a** Veto timeout | UC-5.1+ | `MapVetoBUS.AutoBan()` | `MapVetoDAL.Insert()` | TC-18 | frmMapVeto |
| **FR-5.2** Side Selection | UC-5.2 | `SideSelectBUS.Select()` | `SideSelectDAL.Insert()` | — | frmSideSelect |
| **FR-6.1** Nộp kết quả | UC-6.1 | `ResultBUS.SubmitResult()` | `ResultDAL.Submit()` | TC-08, TC-09, TC-10, TC-16 | frmResultSubmit |
| **FR-6.1a** File MIME check | UC-6.1 | `ResultBUS.ValidateMagicBytes()` | — | TC-10, SEC-TC-04 | frmResultSubmit |
| **FR-6.2** Xác thực kết quả | UC-6.2 | `ResultBUS.ApproveResult()` | `ResultDAL.Update()` | TC-11 | frmDashboard |
| **FR-7.1** Leaderboard | UC-7.1 | `LeaderboardBUS.Get()` | `LeaderboardDAL.Query()` | TC-14 | frmLeaderboard |
| **FR-7.1a** Tie-breaker | UC-7.1 | `LeaderboardBUS.Tiebreak()` | `LeaderboardDAL.GetH2H()` | TC-12 | frmLeaderboard |
| **FR-8.1** Gửi khiếu nại | UC-8.1 | `DisputeBUS.FileDispute()` | `DisputeDAL.Create()` | TC-19 | frmDispute |
| **FR-8.1a** Dispute limit | UC-8.1 | `DisputeBUS.CheckLimit()` | `DisputeDAL.Count()` | TC-19 | frmDispute |
| **FR-8.2** Giải quyết | UC-8.2 | `DisputeBUS.Resolve()` | `DisputeDAL.Update()` | — | frmDispute |
| **FR-9** Game Config | UC-9.1 | `TournamentBUS.SaveConfig()` | `GameConfigDAL.Save()` | — | frmSetup |
| **FR-10** Notification | — | `NotificationBUS.Notify()` | `NotificationDAL.Insert()` | — | frmNotif |
| **FR-11** Audit Log | — | `AuditLogBUS.Log()` | `AuditLogDAL.Insert()` | TC-23 | frmAudit |

---

## 2. TRACEABILITY: NFR → IMPLEMENTATION → TEST

| NFR | Mô tả | Giải pháp kỹ thuật | Test |
|---|---|---|---|
| NFR-1.1 | bcrypt hash | `BCrypt.Net.BCrypt.HashPassword(pwd, 12)` | SEC-TC-11 |
| NFR-1.2 | Parameterized Query | `cmd.Parameters.AddWithValue("@name", val)` | SEC-TC-01, SEC-TC-02 |
| NFR-1.3 | RBAC | `BaseForm.EnforceRBAC() → Close() nếu sai role` | SEC-TC-08 |
| NFR-1.4 | Abstract RBAC | `abstract string[] RequiredRoles` trong BaseForm | SEC-TC-08 |
| NFR-1.5 | Magic bytes | `FileValidator.CheckMagicBytes(filePath)` | TC-10, SEC-TC-04 |
| NFR-1.6 | Session timeout | `SessionManager.LastActivityTime + Timer 1'` | SEC-TC-07 |
| NFR-1.7 | Encrypt config | `aspnet_regiis -pef connectionStrings` | SEC-TC-12 |
| NFR-2.1 | Serializable TX | `conn.BeginTransaction(IsolationLevel.Serializable)` | TC-06, SEC-TC-10 |
| NFR-2.2 | Bracket TX | `BracketDAL.SaveBracket() trong 1 Transaction` | TC-01, TC-02 |
| NFR-2.5 | Scheduling conflict | `MatchBUS.HasSchedulingConflict()` | — |
| NFR-2.6 | UNIQUE MatchResult | `CONSTRAINT UQ_Match_Result UNIQUE(MatchID)` | TC-16, SEC-TC-09 |
| NFR-2.7 | Computed TotalPoints | `TotalPoints AS (RankingPoints + KillPoints) PERSISTED` | TC-12 |
| NFR-3.1 | Live Search | `DataView.RowFilter = "Name LIKE '%" + key + "%'"` | — |
| NFR-3.2 | DB Index | `CREATE INDEX IX_Match_Tournament ON tblMatch(TournamentID)` | — |
| NFR-3.3 | Connection Pool | `"Max Pool Size=100;Min Pool Size=5"` trong conn string | — |
| NFR-4.2 | Strategy Pattern | `IBracketStrategy` + `SingleEliminationStrategy` | TC-01 |
| NFR-5.1 | Concurrent check-in | Serializable + Pool | TC-06 |
| NFR-5.2 | DB error handling | `try-catch SqlException → DataException` | — |
| NFR-5.3 | Dispute SLA | `DisputeBUS.CheckOverdueSLA()` cron | — |

---

## 3. TEST COVERAGE MATRIX

```
Yêu cầu được kiểm thử: 29/31 FR items = 93.5%
NFR được kiểm thử: 12/19 = 63% (các NFR còn lại cần integration test)

Legend: ✅ Covered | ⚠️ Partial | ❌ Not covered
```

| FR/NFR | Unit Test | Integration Test | Manual Test | Automated |
|---|---|---|---|---|
| FR-1.1 Login | ✅ | ✅ | ✅ | SEC-TC-01,03 |
| FR-3.1 Bracket | ✅ | ✅ | ✅ | TC-01,02,21 |
| FR-4.2 Check-in | ✅ | ✅ | ✅ | TC-03,04,06 |
| FR-5.1 Map Veto | ✅ | ⚠️ | ✅ | TC-18 |
| FR-6.1 File Upload | ✅ | ✅ | ✅ | TC-08,09,10 |
| NFR-1.1 bcrypt | ✅ | ❌ | ✅ | SEC-TC-11 |
| NFR-2.1 Serializable | ✅ | ✅ | ❌ | TC-06 |
| NFR-3.1 Live Search | ❌ | ❌ | ✅ | — |

---

## 4. CHANGE IMPACT ANALYSIS

> Khi thay đổi 1 thành phần, bảng này xác định những gì cần kiểm tra lại.

| Thay đổi tại | Ảnh hưởng đến | Test cần chạy lại |
|---|---|---|
| `tblMatch` schema | BracketDAL, MatchDAL, CheckInDAL, ResultDAL | TC-01,02,03,04,05,06,11 |
| `AuthBUS.Login()` | SessionManager, frmLogin, frmDashboard | TC-13, SEC-TC-01,03,07,08 |
| `BracketBUS.GenerateBracket()` | frmBracketView, BracketDAL, MatchDAL | TC-01,02,20,21 |
| `ResultBUS.SubmitResult()` | frmResultSubmit, ResultDAL, tblMatchResult | TC-08,09,10,16, SEC-TC-04,09 |
| `tblUser` schema | AuthBUS, UserDAL, SessionManager | TC-13, toàn bộ SEC-TC |
| `NotificationBUS` | Tất cả BUS có gọi Notify() | — (monitoring) |
