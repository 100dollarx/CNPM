# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) — PHIÊN BẢN 3.0
## Hệ thống Quản lý Giải đấu Esports — ETMS v3.0
**Software Requirements Specification (IEEE 830)**
**Phiên bản:** 3.0 | **Ngày:** 2026-03-29 | **Trường:** FIT TDTU | **Môn:** SE 502045

> ⚠️ **Phiên bản 3.0: Nâng cấp công nghệ giao diện từ Windows Forms sang WPF (MVVM).**
> Toàn bộ business logic (BUS/DAL) giữ nguyên — chỉ thay đổi tầng Presentation.

---

## 1. GIỚI THIỆU

### 1.1 Phạm vi hệ thống
- **Tên:** ETMS – Esports Tournament Management System
- **Loại:** Windows Desktop Application (C# .NET / **WPF — MVVM Pattern**)
- **Kiến trúc:** 3-Layer (View/ViewModel – BUS – DAL) kết hợp MVVM
- **Trong phạm vi:** Quản lý toàn bộ vòng đời giải đấu: Pre → In → Post Tournament
- **Ngoài phạm vi:** Streaming, thanh toán trực tuyến, ứng dụng mobile

### 1.2 Lý do chuyển sang WPF

| Tiêu chí | Windows Forms | **WPF (Đề xuất)** |
|---|---|---|
| Công nghệ giao diện | GDI+, pixel-based | Vector-based (XAML), resolution-independent |
| Thiết kế UI | Kéo thả đơn giản, giới hạn | XAML — dark theme, gradient, animation, custom controls |
| Data Binding | Thủ công, code-behind | Two-way binding tự động (INotifyPropertyChanged) |
| Kiến trúc UI | Event-driven (code-behind) | **MVVM** — tách biệt View / ViewModel / Model |
| Thư viện UI | Ít, cũ | MaterialDesignThemes, MahApps.Metro, LiveCharts |
| Unit Test UI | Rất khó | Dễ — ViewModel test được mà không cần UI |
| Responsive | Không | Yes — Grid, StackPanel, adaptive layout |
| Custom Control | GDI+ phức tạp | UserControl/ControlTemplate dễ tùy chỉnh |

### 1.3 Đối tượng sử dụng

| Vai trò | Mô tả | Quyền hạn |
|---|---|---|
| **Admin** | Ban tổ chức | Toàn quyền hệ thống |
| **Captain** | Đội trưởng | Quản lý đội, check-in, nộp kết quả, khiếu nại |
| **Player** | Tuyển thủ | Xem lịch, xem bracket |
| **Guest** | Khách | Chỉ xem leaderboard và lịch sử |

### 1.4 Thuật ngữ bổ sung v3.0

| Thuật ngữ | Giải nghĩa |
|---|---|
| **MVVM** | Model-View-ViewModel — pattern tách biệt UI logic ra khỏi View |
| **XAML** | Extensible Application Markup Language — ngôn ngữ khai báo giao diện WPF |
| **ViewModel** | Lớp trung gian giữa View (XAML) và BUS — chứa Commands, Properties |
| **ICommand** | Interface chuẩn WPF — thay thế event Button_Click |
| **DataTemplate** | Template hiển thị dữ liệu trong WPF (thay cho DataGridView) |
| **Magic Bytes** | Bytes đầu tiên của file xác định loại thực sự |
| **Session Timeout** | Phiên tự động hết hạn sau thời gian không hoạt động |
| **WalkoverPending** | Trạng thái mới: Cả 2 đội không check-in, chờ Admin quyết định |
| **Disqualified** | Đội bị loại do vi phạm nghiêm trọng |

---

## 2. YÊU CẦU CHỨC NĂNG (Functional Requirements) — v3.0

> **Lưu ý:** Toàn bộ logic nghiệp vụ (BUS/DAL) **KHÔNG THAY ĐỔI** so với v2.0.
> Chỉ thay đổi cách hiển thị: `frmXxx.cs` → `XxxView.xaml` + `XxxViewModel.cs`.

### FR-1: Quản lý Tài khoản & Đăng nhập

#### UC-1.1: Đăng nhập hệ thống
- **Actor:** Admin, Captain, Player, Guest
- **Precondition:** Ứng dụng đang chạy, tài khoản tồn tại và chưa khóa
- **Luồng chính:**
  1. Nhập Username + Password → Click Đăng nhập
  2. `AuthBUS.Login(username, password)`
  3. DAL lấy `PasswordHash`, `IsLocked`, `FailedLoginAttempts` bằng Parameterized Query
  4. Nếu `IsLocked = 1` → thông báo "Tài khoản bị khóa, liên hệ Admin", dừng
  5. So sánh hash: không khớp → tăng `FailedLoginAttempts += 1`
  6. Nếu `FailedLoginAttempts >= 5` → set `IsLocked = 1`, kết thúc
  7. Khớp → reset `FailedLoginAttempts = 0`, tạo Session, chuyển Dashboard theo Role
- **Ràng buộc:**
  - Thông báo lỗi KHÔNG tiết lộ field nào sai: "Thông tin đăng nhập không chính xác"
  - Mật khẩu hash bằng **bcrypt** (salt tự động) — KHÔNG dùng SHA-256 thuần
  - Session có **LastActivityTime**; auto-expire sau **30 phút** không thao tác
- **Giao diện:** `LoginView.xaml` + `LoginViewModel.cs`

#### UC-1.2: Quản lý tài khoản (Admin)
- **Actor:** Admin
- **Chức năng:**
  - Tạo tài khoản: Username unique, mật khẩu tạm thời bcrypt hash ngay
  - Reset mật khẩu: tạo mật khẩu tạm thời → ghi vào `tblNotification`
  - Khóa/Mở khóa: set `IsLocked`, reset `FailedLoginAttempts = 0` khi mở
  - Xem danh sách tất cả tài khoản, lọc theo Role
- **Giao diện:** `UserManagementView.xaml` + `UserManagementViewModel.cs`

#### UC-1.3: Đổi mật khẩu cá nhân
- **Actor:** Captain, Player
- **Luồng:** Nhập mật khẩu cũ → xác minh → nhập mật khẩu mới (≥ 8 ký tự, có chữ hoa + số) → bcrypt hash → UPDATE

---

### FR-2: Đăng ký & Xét duyệt Đội tuyển

#### UC-2.1: Captain tạo hồ sơ đội
- **Actor:** Captain
- **Precondition:** Captain đăng nhập. Tournament Status = `Registration`.
- **Ràng buộc BUS:**
  1. `TeamBUS.ValidateTeamName(name, tournamentId)` — tên đội UNIQUE trong Tournament
  2. `TeamBUS.ValidatePlayerNotInOtherTeam(userId, tournamentId)` — kiểm tra từng thành viên
  3. Số thành viên **≥ MinPlayersPerTeam** (lấy từ `tblTournament`)
  4. Captain chỉ được tạo **1 đội** trong cùng Tournament
  5. Deadline đăng ký: Tournament.RegistrationDeadline — sau deadline không được nộp

#### UC-2.2: Admin xét duyệt hồ sơ
- Approve → `Status = 'Approved'` → `NotificationBUS.Notify(captainId, "Đội đã được duyệt")`
- Reject → nhập lý do → `Status = 'Rejected'` → `NotificationBUS.Notify(captainId, reason)`
- Admin có thể **Disqualify** đội đang thi đấu (vi phạm nghiêm trọng):
  - Team `Status = 'Disqualified'`
  - Các trận hiện tại/tương lai → đối thủ thắng Walkover
  - Ghi vào `tblAuditLog`

---

### FR-3: Quản lý Tournament

#### UC-3.0: Admin tạo & cấu hình Tournament
- **Thông tin cơ bản:** Name, GameType, Format, StartDate, EndDate, MaxTeams, MinPlayersPerTeam
- `RegistrationDeadline`: hạn chót đăng ký đội
- Sau khi tạo Tournament, Admin cấu hình `tblGameConfig`:
  - `BestOf`: 1 / 3 / 5
  - `MapPool`: JSON — cho FPS
  - `VetoSequence`: JSON — thứ tự ban/pick
  - `KillPointPerKill`: điểm mỗi kill — cho Battle Royale
  - `RankingPointTable`: JSON điểm theo thứ hạng
- **Status transitions:** `Draft → Registration → Active → Completed / Cancelled`

#### UC-3.1: Tạo Bracket tự động ★ TRỌNG TÂM
- **Precondition:** ≥ 2 đội Approved, Tournament Status = `Registration`
- Nếu `BracketGenerated = 1` → dialog xác nhận "Tạo lại sẽ xóa bracket cũ"
- **Nếu xác nhận tạo lại:** `BracketDAL.DeleteBracket(tournamentId)` trong SQL Transaction
- **Thuật toán:**
  ```
  1. GetApprovedTeams(tournamentId) → N đội
  2. FisherYatesShuffle(teams)
  3. slots = NextPowerOf2(N); byeCount = slots - N
  4. Đội seed 1..byeCount → Bye (auto-win, IsBye=1, Status='Completed')
  5. Đội còn lại → cặp đấu vòng 1
  6. Xây vòng 2,3...Final với NextMatchID Linked List
  7. SaveBracket() trong 1 SQL Transaction
  8. UPDATE tblTournament SET Status='Active', BracketGenerated=1
  ```

---

### FR-4: Lên lịch & Check-in

#### UC-4.1: Admin lên lịch thi đấu
- Đặt `ScheduledTime` cho mỗi trận
- `CheckInOpenTime = ScheduledTime - 15 phút`
- Scheduling Conflict Check: `MatchBUS.HasSchedulingConflict(teamId, scheduledTime)` — warn Admin
- Admin có thể **hoãn trận** (`Status = 'Postponed'`)

#### UC-4.2: Captain Check-in
- Timer kích hoạt mở cổng lúc `CheckInOpenTime`
- Captain bấm "Xác nhận tham dự" trong 15 phút
- DAL: `IsolationLevel.Serializable` để tránh race condition
- Cả 2 đội check-in → `Status = 'Live'`, `ActualStartTime = NOW()`

#### UC-4.3: Xử lý Walkover
- **Case A:** Chỉ đội 1 check-in → Đội 1 thắng Walkover
- **Case B:** Chỉ đội 2 check-in → Đội 2 thắng Walkover
- **Case C:** Cả 2 không check-in → `Status = 'WalkoverPending'`
  - Admin quyết định: chọn winner thủ công HOẶC hủy trận
  - `NotificationBUS.Notify()` cho cả 2 Captain

---

### FR-5: Game-Specific Workflow

#### UC-5.1: Map Veto (FPS — Valorant, CS:GO)
- **Precondition:** GameType = `FPS`, cả 2 đã check-in
- **Thứ tự veto** lấy từ `tblGameConfig.VetoSequence`
- **Ai ban trước:** Đội có `MatchOrder` nhỏ hơn (Team1)
- **Timeout mỗi lượt:** 60 giây → hệ thống tự random ban 1 map
- Lưu vào `tblMapVeto`; sau khi hoàn thành → Match Status = `Live`

#### UC-5.2: Side Selection (MOBA — LoL, Dota 2)
- **Precondition:** GameType = `MOBA`, cả 2 đã check-in
- Random → Captain được chọn chọn Blue Side hoặc Red Side trong 60 giây
- Quá giờ → hệ thống tự random gán
- Lưu vào `tblSideSelect`

---

### FR-6: Báo cáo & Xác thực Kết quả

#### UC-6.1: Captain nộp kết quả
- **Conflict Resolution Rules:**
  - Mỗi trận chỉ có **1 bản ghi** `tblMatchResult` (UNIQUE constraint)
  - Nếu đã có submission → Captain đội kia có thể **phản đối** (trigger Dispute)
- **Validation BUS:**
  1. `ValidateFileExtension()`: chỉ `.jpg`, `.png`
  2. `ValidateFileMagicBytes()`: đọc 4 bytes đầu (JPG: `FF D8 FF`, PNG: `89 50 4E 47`)
  3. `ValidateFileSize()`: < 5MB
- Nếu trận Status = `Disputed` hơn 24h → Auto-notify Admin

#### UC-6.2: Admin xác thực kết quả
- Phê duyệt → UPDATE match + advance bracket, INSERT AuditLog (trong SQL Transaction)
- Từ chối → `Status = 'Disputed'` + Notify Captain
- Admin có thể **nhập kết quả trực tiếp** (bypass)

---

### FR-7: Thống kê & Hall of Fame

#### UC-7.1: Leaderboard
- **Single Elimination:** Bracket tree + Top 3
- **Battle Royale — Tie-breaker:** `ORDER BY TotalPoints DESC, DirectH2H DESC, TotalKillPoints DESC`
- Lọc theo Tournament, xem lịch sử
- Guest xem không cần đăng nhập

#### UC-7.2: Hall of Fame
- Lưu trữ: TournamentName, Champion, Runner-up, Third Place
- Xuất dữ liệu ra file `.csv`

---

### FR-8: Hệ thống Khiếu nại

#### UC-8.1: Gửi khiếu nại
- Mỗi đội tối đa **2 khiếu nại** mỗi Tournament
- Nội dung: loại vi phạm + mô tả + bằng chứng (≤ 10MB, .jpg/.png/.mp4)
- Phân loại: `Hack/Cheat`, `Sai điểm số`, `Người ngoài danh sách`, `Khác`

#### UC-8.2: Giải quyết khiếu nại
- **SLA: 48 giờ** từ khi tạo
- Quá SLA → auto-notify Admin lần 2
- Resolve → `AdminNote`, `ResolvedAt`, `ResolvedBy`

---

### FR-9: Cấu hình Game Metadata
- Admin cấu hình `tblGameConfig` cho mỗi Tournament
- Không thể sửa sau Tournament Status = `Active`

---

### FR-10: Hệ thống Thông báo In-App
- Các sự kiện kích hoạt thông báo:

| Sự kiện | Người nhận | Nội dung |
|---|---|---|
| Đội được Approve | Captain | "Đội [tên] đã được duyệt!" |
| Đội bị Reject | Captain | "Đội [tên] bị từ chối: [lý do]" |
| Check-in mở | Cả 2 Captain | "Check-in mở cho trận [X]" |
| Walkover | Cả 2 Captain | "Trận [X]: [đội] thắng Walkover" |
| Kết quả chờ xác nhận | Admin | "Có kết quả mới chờ xác nhận" |
| Khiếu nại mới | Admin | "Khiếu nại mới từ đội [X]" |
| Reset mật khẩu | User | "Mật khẩu tạm thời mới: [pwd]" |

- Badge số trên Dashboard, mark as read khi click

---

### FR-11: Audit Log
- Mọi action quan trọng của Admin ghi vào `tblAuditLog`
- Cấu trúc: `UserID, Action, Timestamp, Detail, AffectedEntity, AffectedEntityID`

---

## 3. YÊU CẦU PHI CHỨC NĂNG (NFR) — v3.0

### NFR-1: Bảo mật

| ID | Yêu cầu | Giải pháp |
|---|---|---|
| NFR-1.1 | Mật khẩu hash bcrypt | BCrypt.Net-Next (cost factor ≥ 10) |
| NFR-1.2 | Chống SQL Injection | `SqlCommand` với `Parameters` bắt buộc toàn DAL |
| NFR-1.3 | RBAC | `SessionManager.HasRole()` kiểm tra trước mỗi action |
| NFR-1.4 | Chặn truy cập trái phép | **ViewModel** kiểm tra quyền; Navigation Service chặn route |
| NFR-1.5 | File upload MIME check | Magic bytes: JPG=`FFD8FF`, PNG=`89504E47` |
| NFR-1.6 | Session timeout | `LastActivityTime` + DispatcherTimer 1 phút; logout sau 30' idle |
| NFR-1.7 | Connection string bảo mật | `appsettings.json` (DPAPI encrypt hoặc User Secrets) |

### NFR-2: Toàn vẹn Dữ liệu

| ID | Yêu cầu | Giải pháp |
|---|---|---|
| NFR-2.1 | Race condition check-in | `IsolationLevel.Serializable` |
| NFR-2.2 | Bracket atomic | INSERT bracket trong 1 Transaction |
| NFR-2.3 | File upload validation | Extension + Magic Bytes + Size |
| NFR-2.4 | Referential Integrity | FK constraints trong SQL Server |
| NFR-2.5 | Scheduling conflict | `MatchBUS.HasSchedulingConflict()` warn Admin |
| NFR-2.6 | Result uniqueness | `UNIQUE(MatchID)` trên `tblMatchResult` |
| NFR-2.7 | Computed TotalPoints | `TotalPoints AS (RankingPoints + KillPoints) PERSISTED` |

### NFR-3: Hiệu năng

| ID | Yêu cầu | Giải pháp |
|---|---|---|
| NFR-3.1 | Live search không lag | **WPF CollectionViewSource** + ICollectionView filter |
| NFR-3.2 | Index DB | Index trên `TournamentID`, `TeamID`, `MatchID`, `Status` |
| NFR-3.3 | Connection pooling | `Max Pool Size=100; Min Pool Size=5` |

### NFR-4: Khả năng mở rộng

| ID | Yêu cầu | Giải pháp |
|---|---|---|
| NFR-4.1 | Nhiều loại game | `GameType` + `tblGameConfig` |
| NFR-4.2 | Strategy Pattern | `IBracketStrategy` interface |

### NFR-5: Độ tin cậy

| ID | Yêu cầu | Giải pháp |
|---|---|---|
| NFR-5.1 | Đồng thời nhiều Check-in | Serializable Transaction + connection pool |
| NFR-5.2 | DB error không crash app | Try-catch toàn DAL, thông báo lỗi thân thiện |
| NFR-5.3 | Dispute SLA | Cảnh báo tự động sau 48h chưa resolve |

### NFR-6: Giao diện người dùng (MỚI v3.0)

| ID | Yêu cầu | Giải pháp |
|---|---|---|
| **NFR-6.1** | Dark theme Esports | MaterialDesignThemes — dark palette tùy chỉnh |
| **NFR-6.2** | Responsive layout | WPF Grid/DockPanel — adaptive khi resize |
| **NFR-6.3** | Smooth transitions | WPF Storyboard animations — page transition |
| **NFR-6.4** | Icon system | Material Design Icons (XAML vector icons) |

---

## 4. ĐẶC TẢ DỮ LIỆU — v3.0 (Database Schema — 16 bảng)

> Schema database **đã cập nhật v3.0** — bổ sung `tblNotification` (ERD-07) và `tblGameConfig` (ERD-02).
> Tổng: **16 bảng, 13 indexes, 1 computed column, 5 UNIQUE constraints**.
> Script đầy đủ: `Database/ETMS_DB.sql`

### 4.1 Danh sách 16 bảng

| # | Bảng | Mô tả | Ghi chú |
|---|---|---|---|
| 1 | `tblUser` | Tài khoản người dùng | `FailedLoginAttempts`, `Email` |
| 2 | `tblTournament` | Giải đấu | `RegistrationDeadline`, `BracketGenerated` |
| 3 | `tblGameConfig` | Cấu hình game/tournament | **BỔ SUNG v3.0** — MapPool, BestOf, VetoSequence |
| 4 | `tblTeam` | Đội tuyển | `UQ(TournamentID, Name)`, `UQ(TournamentID, CaptainID)` |
| 5 | `tblPlayer` | Tuyển thủ | FK cascade từ Team |
| 6 | `tblMatch` | Trận đấu (★ Linked List) | Self-FK `NextMatchID`, 9 trạng thái |
| 7 | `tblMatchResult` | Kết quả trận đấu | `UNIQUE(MatchID)` — mỗi trận 1 result |
| 8 | `tblMapVeto` | Cấm/chọn bản đồ (FPS) | Cascade từ Match |
| 9 | `tblSideSelect` | Chọn phe (MOBA) | Cascade từ Match |
| 10 | `tblBRRound` | Vòng Battle Royale | `UQ(TournamentID, RoundNumber)` |
| 11 | `tblBRScore` | Điểm BR | `TotalPoints` computed column PERSISTED |
| 12 | `tblDispute` | Khiếu nại | Category: HackCheat/WrongScore/Other |
| 13 | `tblNotification` | Thông báo In-App | **BỔ SUNG v3.0** — Type, IsRead, RelatedEntity |
| 14 | `tblAuditLog` | Nhật ký kiểm toán | AffectedEntity + AffectedEntityID |

### 4.2 Indexes (Performance NFR-3.2)

| Index | Bảng | Cột | Mục đích |
|---|---|---|---|
| IX_User_Username | tblUser | Username | Login lookup |
| IX_User_Role | tblUser | Role | Filter by role |
| IX_Tournament_Status | tblTournament | Status | Dashboard filter |
| IX_Team_TournamentID | tblTeam | TournamentID | Team listing |
| IX_Team_Status | tblTeam | Status | Pending approval |
| IX_Match_TournamentID | tblMatch | TournamentID | Match listing |
| IX_Match_Status | tblMatch | Status | Live matches |
| IX_Match_ScheduledTime | tblMatch | ScheduledTime | Schedule view |
| IX_Notification_Recipient | tblNotification | RecipientID, IsRead | Badge count |
| IX_AuditLog_Timestamp | tblAuditLog | Timestamp DESC | Recent actions |

### 4.3 Connection String

```json
{
  "ConnectionStrings": {
    "ETMSConnection": "Server=<hostname>\\<instance>;Database=ETMS_DB;Trusted_Connection=True;TrustServerCertificate=True;Max Pool Size=100;Min Pool Size=5;"
  }
}
```

Đọc bằng `IConfiguration` (WPF) từ `appsettings.json` — **KHÔNG dùng `ConfigurationManager`**.



## 5. DANH SÁCH MÀN HÌNH & CLASS — v3.0

### 5.1 Views (WPF XAML) — thay thế Windows Forms

| View | File XAML | File ViewModel | Chức năng |
|---|---|---|---|
| Đăng nhập | `LoginView.xaml` | `LoginViewModel.cs` | Đăng nhập, session |
| Dashboard | `DashboardView.xaml` | `DashboardViewModel.cs` | Navigation, badge thông báo, RBAC |
| Cấu hình giải đấu | `TournamentSetupView.xaml` | `TournamentSetupViewModel.cs` | Tạo/sửa Tournament + GameConfig |
| Quản lý đội | `TeamManagementView.xaml` | `TeamManagementViewModel.cs` | Đăng ký, xét duyệt, disqualify |
| Xem Bracket | `BracketView.xaml` | `BracketViewModel.cs` | Render cây nhánh đấu (Canvas/DrawingVisual) |
| Lịch thi đấu | `MatchScheduleView.xaml` | `MatchScheduleViewModel.cs` | Lên lịch, hoãn, conflict warning |
| Check-in | `CheckInView.xaml` | `CheckInViewModel.cs` | Countdown, xác nhận, walkover |
| Map Veto | `MapVetoView.xaml` | `MapVetoViewModel.cs` | Ban/pick UI + countdown 60s |
| Side Selection | `SideSelectView.xaml` | `SideSelectViewModel.cs` | Blue/Red side |
| Nộp kết quả | `ResultSubmitView.xaml` | `ResultSubmitViewModel.cs` | Upload, validate, submit |
| Leaderboard | `LeaderboardView.xaml` | `LeaderboardViewModel.cs` | Bảng xếp hạng, Hall of Fame, export |
| Khiếu nại | `DisputeManageView.xaml` | `DisputeManageViewModel.cs` | Gửi & giải quyết tranh chấp |
| Thông báo | `NotificationView.xaml` | `NotificationViewModel.cs` | Danh sách thông báo |
| Audit Log | `AuditLogView.xaml` | `AuditLogViewModel.cs` | Xem lịch sử Admin |
| Quản lý user | `UserManagementView.xaml` | `UserManagementViewModel.cs` | Tạo/khóa/reset tài khoản |

### 5.2 MVVM Infrastructure (MỚI v3.0)

| Class | Trách nhiệm |
|---|---|
| `ViewModelBase` | Abstract — INotifyPropertyChanged, SetProperty helper |
| `RelayCommand` | ICommand implementation — thay thế event handlers |
| `NavigationService` | Điều hướng giữa các View — thay thế `this.Hide(); form.Show()` |
| `DialogService` | MessageBox/Confirm dialog wrapper — dễ unit test |
| `AppTheme` | Dark theme resources, color palette, font settings |

### 5.3 BUS Classes (KHÔNG THAY ĐỔI — 14 class)

| Class | Trách nhiệm |
|---|---|
| `AuthBUS` | Login, logout, hash password, session, timeout |
| `TournamentBUS` | Tạo/cập nhật tournament, GameConfig |
| `TeamBUS` | Validation, CRUD team, approve/reject/disqualify |
| `BracketBUS` | Generate bracket, bye logic, walkover, Strategy Pattern |
| `MatchBUS` | Schedule, conflict check, postpone |
| `CheckInBUS` | Check-in timer, walkover cases A/B/C |
| `MapVetoBUS` | Điều phối veto sequence, timeout |
| `SideSelectBUS` | Random coin toss, lưu kết quả |
| `ResultBUS` | Submit, validate magic bytes, approve, override |
| `LeaderboardBUS` | Standings, tie-breaker, export CSV |
| `DisputeBUS` | File dispute, limit check, SLA, resolve |
| `NotificationBUS` | Gửi/lấy thông báo in-app |
| `AuditLogBUS` | Ghi audit log tất cả actions |
| `SessionManager` | **Singleton** — quản lý session + timeout |

### 5.4 DAL Classes (KHÔNG THAY ĐỔI — 15 class)

| Class | Trách nhiệm |
|---|---|
| `DBConnection` | **Singleton** — connection pooling |
| `UserDAL` | CRUD user, lock, failed attempts |
| `TournamentDAL` | CRUD tournament, status |
| `GameConfigDAL` | CRUD game config |
| `TeamDAL` | CRUD team, player, status |
| `BracketDAL` | Save/delete bracket (Transaction) |
| `MatchDAL` | Schedule, status, winner, postpone |
| `CheckInDAL` | Check-in (Serializable), walkover |
| `MapVetoDAL` | CRUD map veto records |
| `SideSelectDAL` | CRUD side selection |
| `ResultDAL` | Submit result, update status |
| `LeaderboardDAL` | Standings query, BR scores |
| `DisputeDAL` | CRUD dispute, count per team |
| `NotificationDAL` | Insert/get/mark-read |
| `AuditLogDAL` | Insert audit records |

---

## 6. TEST CASES — v3.0

> Test cases **giữ nguyên logic** so với v2.0.
> Thay đổi duy nhất: GUI tests thực hiện trên WPF Views thay vì WinForms.

| ID | Loại | Input | Kết quả kỳ vọng |
|---|---|---|---|
| TC-01 | Normal | 8 đội → Generate Bracket | 7 trận, 0 Bye, Linked List đúng |
| TC-02 | Boundary | 7 đội → Generate Bracket | 1 Bye, 6 trận thực |
| TC-03 | Normal | Check-in đúng hạn cả 2 | Status = Live |
| TC-04 | Abnormal | 1 đội không check-in | Walkover |
| TC-05 | Abnormal | Cả 2 không check-in | WalkoverPending |
| TC-06 | Concurrency | 2 request check-in cùng lúc | Serializable, chỉ 1 thành công |
| TC-07 | Security | SQL Injection vào tên đội | Xử lý như text thường |
| TC-08 | Boundary | Upload PNG 4.9MB | Chấp nhận |
| TC-09 | Boundary | Upload PNG 5.1MB | Từ chối |
| TC-10 | Security | Upload .exe đổi tên .jpg | Từ chối — magic bytes sai |
| TC-11 | Normal | Admin approve kết quả | WinnerID set, NextMatch điền đội |
| TC-12 | Boundary | 2 đội đồng điểm BR | Tie-breaker |
| TC-13 | Security | Đăng nhập sai 5 lần | Tài khoản khóa |
| TC-14 | Normal | Guest xem Leaderboard | Hiển thị không cần login |
| TC-15 | Abnormal | Thêm player đã trong đội khác | BUS từ chối |
| TC-16 | Normal | Captain nộp kết quả lần 2 | Từ chối — đã có submission |
| TC-17 | Security | Session idle 31 phút | Auto logout |
| TC-18 | Normal | MapVeto timeout 60s | Auto-ban random |
| TC-19 | Normal | Captain gửi khiếu nại lần 3 | Từ chối — đạt giới hạn |
| TC-20 | Normal | Admin Generate lại Bracket | Confirm, xóa cũ, tạo mới |
| TC-21 | Normal | Generate Bracket 5 đội | 3 bye, 5 đội sắp xếp đúng |
| TC-22 | Normal | Admin Disqualify đội | Đối thủ thắng Walkover |
| TC-23 | Normal | Audit Log ghi action | Bản ghi tblAuditLog đúng |

---

## 7. PHÂN TÍCH RỦI RO — v3.0

| Rủi ro | Xác suất | Tác động | Giải pháp |
|---|---|---|---|
| Race Condition Check-in | Cao | Cao | Serializable Transaction |
| Bypass file validation | Thấp | Cao | Magic bytes check |
| Session không timeout | Thấp | Cao | 30' idle auto-logout |
| Bracket Math sai | Trung bình | Cao | Unit test Bye Logic |
| Dispute spam | Thấp | Thấp | Giới hạn 2 lần/tournament |
| Scheduling conflict | Trung bình | Trung bình | Conflict check + warning |
| Cả 2 không check-in | Thấp | Cao | WalkoverPending + Admin notify |
| 2 Captain nộp kết quả khác nhau | Trung bình | Cao | UNIQUE constraint + conflict logic |
| DB connection fail | Thấp | Cao | Try-catch + thông báo thân thiện |
| Connection pool cạn | Thấp | Cao | Max Pool Size cấu hình |

---

*Phiên bản 3.0 — Nâng cấp công nghệ giao diện WPF/MVVM. Logic nghiệp vụ giữ nguyên 100%.
Tổng cộng: 14 bảng DB, 14 BUS classes, 15 DAL classes, 15 WPF Views + 15 ViewModels, 23 test cases.*

**© 2026 – FIT TDTU | Môn Kỹ thuật Phần mềm (502045)**
