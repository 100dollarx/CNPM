# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)
## Hệ thống Quản lý Giải đấu Esports — ETMS
**Software Requirements Specification (IEEE 830)**  
**Phiên bản:** 1.0 | **Ngày:** 2026-03-19  
**Trường:** Đại học Tôn Đức Thắng – Khoa CNTT  
**Môn học:** Kỹ thuật Phần mềm (502045)

---

## 1. GIỚI THIỆU (Introduction)

### 1.1 Mục đích tài liệu
Tài liệu này đặc tả đầy đủ các yêu cầu chức năng (Functional Requirements) và phi chức năng (Non-Functional Requirements) của Hệ thống Quản lý Giải đấu Esports (ETMS). Tài liệu phục vụ làm căn cứ cho việc thiết kế, lập trình, kiểm thử và bàn giao sản phẩm.

### 1.2 Phạm vi hệ thống
**Tên hệ thống:** ETMS – Esports Tournament Management System  
**Loại ứng dụng:** Windows Desktop Application (C# .NET / Windows Forms)  
**Phạm vi:**  Hệ thống quản lý toàn bộ vòng đời một giải đấu thể thao điện tử, từ giai đoạn chuẩn bị (Pre-Tournament), vận hành (In-Tournament), đến kết thúc (Post-Tournament).  
**Ngoài phạm vi:**  Phát sóng trực tiếp (Streaming), tích hợp thanh toán trực tuyến, ứng dụng di động.

### 1.3 Đối tượng sử dụng
| Vai trò | Mô tả |
|---|---|
| **Admin (Ban tổ chức)** | Quản lý toàn bộ hệ thống, xét duyệt đội, xác nhận kết quả |
| **Đội trưởng (Captain)** | Đăng ký đội, thêm thành viên, nộp kết quả |
| **Thành viên (Player)** | Xem lịch thi đấu, xem nhánh đấu |
| **Khách (Guest)** | Xem leaderboard, xem lịch sử giải đấu |

### 1.4 Định nghĩa & Thuật ngữ
| Thuật ngữ | Giải nghĩa |
|---|---|
| **Single Elimination** | Thể thức loại trực tiếp: thua 1 trận là bị loại |
| **Bracket** | Sơ đồ nhánh đấu (tournament bracket) |
| **Bye** | Đội được vào thẳng vòng sau khi số đội không phải lũy thừa 2 |
| **Check-in** | Xác nhận tham dự trước giờ thi đấu |
| **Walkover** | Thắng do đối thủ không xuất hiện / không Check-in |
| **Map Veto** | Quy trình cấm/chọn bản đồ (dành cho FPS game) |
| **Side Selection** | Chọn phe (Xanh/Đỏ) trước trận (dành cho MOBA game) |
| **Tie-breaker** | Tiêu chí phân hạng khi đồng điểm |
| **PCL** | Pass/Conditional/Limitation – Khung kiểm thử |
| **DAL** | Data Access Layer – Tầng truy xuất dữ liệu |
| **BUS** | Business Logic Layer – Tầng nghiệp vụ |
| **GUI** | Graphical User Interface – Tầng giao diện |

---

## 2. MÔ TẢ TỔNG QUAN (Overall Description)

### 2.1 Bối cảnh hệ thống
ETMS được thiết kế để thay thế quy trình tổ chức giải đấu thủ công (dùng Excel, Google Sheets). Hệ thống tự động hóa: tạo nhánh đấu, điểm danh, xác thực kết quả, và cập nhật bảng xếp hạng — giảm thời gian vận hành và loại bỏ lỗi con người.

### 2.2 Các thể thức thi đấu được hỗ trợ
| Thể thức | Mô tả | Đặc thù xử lý |
|---|---|---|
| **Single Elimination (Ưu tiên)** | Loại trực tiếp, thua là bị loại | Bracket + Bye Logic |
| **Battle Royale** | Nhiều đội thi đấu trong 1 ván | Point System + BXH |
| **MOBA** | Trận 1v1 team trên 1 bản đồ | Side Selection |
| **FPS** | Best-of-N trên nhiều bản đồ | Map Veto |
| **Fighting Games** | Trận đấu nhanh, liên tục | Station Management |

---

## 3. YÊU CẦU CHỨC NĂNG (Functional Requirements)

### NHÓM 1: QUẢN LÝ TRƯỚC GIẢI ĐẤU (PRE-TOURNAMENT)

---

#### FR-1: Quản lý Tài khoản & Đăng nhập

**UC-1.1: Đăng nhập hệ thống**
- **Actor:** Admin, Captain, Player, Guest
- **Mô tả:** Người dùng nhập Username + Password để truy cập hệ thống.
- **Luồng chính:**
  1. Người dùng nhập `Username`, `Password`.
  2. BUS gọi `AuthBUS.Login(username, password)`.
  3. `AuthBUS` lấy `PasswordHash` từ DAL, so sánh với hash mật khẩu nhập vào.
  4. Nếu khớp → tạo Session, chuyển đến Dashboard theo Role.
  5. Nếu sai → hiển thị thông báo lỗi, không tiết lộ field nào sai.
- **Ràng buộc:**
  - Mật khẩu được hash bằng SHA-256 / bcrypt — KHÔNG lưu plain text.
  - Khóa tài khoản sau 5 lần đăng nhập sai liên tiếp.
- **Màn hình:** `frmLogin.cs`

**UC-1.2: Quản lý tài khoản (Admin)**
- Admin có thể: Tạo tài khoản mới, Reset mật khẩu, Khóa/Mở tài khoản.

---

#### FR-2: Đăng ký & Xét duyệt Đội tuyển (Team Registration & Approval)

**UC-2.1: Captain tạo hồ sơ đội**
- **Actor:** Đội trưởng (Captain)
- **Precondition:** Captain đã đăng nhập.
- **Luồng chính:**
  1. Captain truy cập "Quản lý Đội" → "Đăng ký Đội mới".
  2. Nhập: Tên đội, Logo (URL/File), Game tham gia.
  3. Thêm thành viên qua `InGameID` hoặc `MSSV`.
  4. Nộp hồ sơ → trạng thái chuyển sang `Pending`.
- **Ràng buộc (Validation tại BUS):**
  - Một `PlayerID` không được xuất hiện trong 2 đội cùng Tournament.
  - Số thành viên tối thiểu: 5 người (cấu hình theo game).
  - Tên đội không trùng trong cùng Tournament.
- **Luồng thay thế:**
  - Nếu thành viên đã thuộc đội khác → BUS trả về lỗi rõ ràng, không thêm vào danh sách.
- **Màn hình:** `frmTeamManagement.cs`

**UC-2.2: Admin xét duyệt hồ sơ**
- **Actor:** Admin
- **Luồng chính:**
  1. Admin xem danh sách đội `Pending`.
  2. Kiểm tra hồ sơ từng đội.
  3. Chọn "Approved" → `Status = 'Approved'`.
  4. Hoặc chọn "Rejected" → nhập lý do → `Status = 'Rejected'`, hệ thống thông báo cho Captain.

---

#### FR-3: Tạo Nhánh đấu Tự động (Automated Bracket Generation) ★ TRỌNG TÂM

**UC-3.1: Tạo nhánh đấu**
- **Actor:** Admin
- **Precondition:** Có ít nhất 2 đội `Approved`.
- **Luồng chính:**
  1. Admin chọn Tournament → "Generate Bracket".
  2. `BracketBUS.GenerateBracket(tournamentId)`:
     - Lấy danh sách `N` đội đã `Approved`.
     - Xáo trộn ngẫu nhiên (Fisher-Yates Shuffle).
     - **Bye Logic:** `bye_count = nextPowerOf2(N) - N` — các đội hạt giống (seed cao nhất) được Bye.
     - Tạo cấu trúc cây nhị phân dưới dạng **Linked List** (`MatchID → NextMatchID`).
  3. `BracketDAL.SaveBracket()` INSERT toàn bộ bản ghi `tblMatch` trong **1 SQL Transaction**.
  4. GUI render sơ đồ cây nhánh đấu trực quan.
- **Thuật toán Bye Logic:**
  ```
  Nếu N = 5:
    nextPowerOf2(5) = 8 → bye_count = 3
    3 đội hạt giống cao nhất được Bye vòng 1
    Vòng 1: 2 trận (4 đội đấu nhau) + 3 đội bye
    Vòng 2: 4 đội (2 thắng vòng 1 + 3 đội bye)
  ```
- **Postcondition:** `tblMatch` được điền đầy đủ với `NextMatchID` liên kết đúng.
- **Màn hình:** `frmBracketView.cs`

---

### NHÓM 2: VẬN HÀNH GIẢI ĐẤU (IN-TOURNAMENT)

---

#### FR-4: Lên lịch & Logic Điểm danh (Check-in)

**UC-4.1: Admin lên lịch thi đấu**
- Admin thiết lập `ScheduledTime` cho từng cặp đấu.
- Hệ thống tự động tính `CheckInOpenTime = ScheduledTime - 15 phút`.

**UC-4.2: Captain Check-in**
- **Actor:** Captain, Hệ thống (Timer)
- **Trigger:** `CheckInOpenTime` — hệ thống mở cổng Check-in.
- **Luồng chính:**
  1. Khi đến giờ, cổng Check-in tự động mở (15 phút trước trận).
  2. Captain của mỗi đội bấm nút "Xác nhận tham dự".
  3. `CheckInBUS.ConfirmCheckIn(matchId, teamId)`:
     - Kiểm tra thời gian còn trong cửa sổ Check-in.
     - DAL cập nhật `CheckInStatus = True` bằng **SQL Transaction Serializable**.
  4. Nếu **cả 2 đội** Check-in → Match chuyển `Status = 'Live'`.
- **Kỷ luật tự động (Auto Discipline):**
  - Nếu hết cửa sổ Check-in mà 1 đội chưa xác nhận:
    - `BracketBUS.ApplyWalkover(matchId)` → đội đã Check-in thắng.
    - `tblMatch.Status = 'Walkover'`, `tblMatch.WinnerID` = đội Check-in.
    - Hệ thống tự động cập nhật `tblMatch` vòng tiếp theo qua `NextMatchID`.
- **Race Condition Prevention:**
  - DAL sử dụng `IsolationLevel.Serializable` khi UPDATE `CheckInStatus`.

---

#### FR-5: Quy trình đặc thù theo Thể loại Game (Game-Specific Workflow)

**UC-5.1: Map Veto (FPS Games — Valorant, CS:GO)**
- **Precondition:** Trận đấu là thể loại FPS, 2 đội đã Check-in.
- **Luồng chính:**
  1. Hệ thống hiển thị danh sách bản đồ (Map Pool) của game.
  2. Hai đội thực hiện lần lượt cấm bản đồ (Ban) theo thứ tự xác định.
  3. Bản đồ cuối cùng còn lại là bản đồ thi đấu chính thức.
  4. Lưu vào `tblMapVeto` (MatchID, TeamID, MapName, Action[Ban/Pick], VetoOrder).
- **Màn hình:** `frmMapVeto.cs`

**UC-5.2: Side Selection (MOBA Games — LOL, Dota 2)**
- **Precondition:** Trận đấu là thể loại MOBA, 2 đội đã Check-in.
- **Luồng chính:**
  1. Đội thắng kết quả Random hoặc đội hạt giống cao hơn được chọn bên.
  2. Đội chọn: Blue Side (Xanh) hoặc Red Side (Đỏ).
  3. Lưu vào `tblSideSelect` (MatchID, TeamID, Side).

---

#### FR-6: Báo cáo & Xác thực Kết quả (Result Submission & Verification)

**UC-6.1: Captain nộp kết quả**
- **Actor:** Đội trưởng (Captain — đội thắng)
- **Luồng chính:**
  1. Captain truy cập trận đấu của mình → "Nộp kết quả".
  2. Nhập điểm số (Score1, Score2).
  3. Upload ảnh bằng chứng (Screenshot kết quả).
  4. `ResultBUS.SubmitResult(matchId, score1, score2, file)`:
     - Validate file: extension phải là `.jpg` hoặc `.png`.
     - Validate kích thước: `< 5MB`.
     - Lưu `EvidenceURL` vào `tblMatchResult`.
     - Cập nhật `Status = 'PendingVerification'`.
- **Màn hình:** `frmResultSubmit.cs`

**UC-6.2: Admin xác thực kết quả**
- **Actor:** Admin
- **Luồng chính:**
  1. Admin thấy trận `PendingVerification` → kiểm tra ảnh bằng chứng.
  2. Phê duyệt → `ResultBUS.ApproveResult(matchId, winnerId)`:
     - `tblMatch.WinnerID = winnerId`, `Status = 'Completed'`.
     - **Tự động đẩy đội thắng lên vòng tiếp theo** qua `NextMatchID`:
       ```
       nextMatch = DAL.GetMatch(currentMatch.NextMatchID)
       nextMatch.Team1ID hoặc Team2ID = winnerId
       DAL.UpdateMatch(nextMatch)  // trong SQL Transaction
       ```
  3. Từ chối → `Status = 'Disputed'`, thông báo cho Captain.

---

### NHÓM 3: SAU GIẢI ĐẤU (POST-TOURNAMENT)

---

#### FR-7: Thống kê & Vinh danh (Leaderboard & Hall of Fame)

**UC-7.1: Hiển thị Leaderboard**
- **Actor:** Guest, User, Admin
- **Luồng chính:**
  1. Hệ thống query `LeaderboardBUS.GetLeaderboard(tournamentId)`.
  2. Với Single Elimination: hiển thị cây nhánh đấu đã hoàn thành.
  3. Với Battle Royale: **Tie-breaker Algorithm:**
     ```
     ORDER BY:
       1. TotalPoints DESC        -- Điểm tổng
       2. DirectHeadToHead DESC   -- Kết quả đối đầu trực tiếp
       3. TotalKillPoints DESC    -- Tổng số hạ gục
     ```
  4. Hiển thị Top 3: 🥇 Vô địch | 🥈 Á quân | 🥉 Hạng 3
- **Màn hình:** `frmLeaderboard.cs`

**UC-7.2: Hall of Fame & Lịch sử**
- Lưu trữ toàn bộ kết quả giải đấu sau khi kết thúc.
- Cho phép xem lại nhánh đấu của các giải đã qua.

---

#### FR-8: Hệ thống Khiếu nại (Dispute/Ticket System)

**UC-8.1: Gửi khiếu nại**
- **Actor:** Đội trưởng (Captain)
- **Luồng chính:**
  1. Captain chọn trận đấu → "Khiếu nại kết quả".
  2. Nhập mô tả nội dung tố cáo (Hack/Cheat/Người ngoài danh sách).
  3. Upload bằng chứng (video/screenshot).
  4. `DisputeBUS.FileDispute()` → lưu vào `tblDispute`.
  5. Admin nhận thông báo, xem xét và phán quyết.

---

#### FR-9: Quản lý Game Metadata & Rules

**UC-9.1: Admin cấu hình luật chơi**
- Thiết lập cho từng game: Số bản đồ thi đấu (Bo1/Bo3/Bo5), Map Pool, Số người/đội, Điểm Ranking, Điểm Kill (Battle Royale).

---

## 4. YÊU CẦU PHI CHỨC NĂNG (Non-Functional Requirements)

### NFR-1: Bảo mật (Security)

| ID | Yêu cầu | Lớp thực thi | Giải pháp |
|---|---|---|---|
| NFR-1.1 | Mật khẩu phải được hash | BUS | SHA-256 hoặc bcrypt |
| NFR-1.2 | Chống SQL Injection | DAL | `SqlCommand` với `Parameters` — không dùng string concatenation |
| NFR-1.3 | RBAC (Role-Based Access Control) | GUI + BUS | Kiểm tra Role trước khi render màn hình Admin |
| NFR-1.4 | Chặn truy cập trái phép | BUS | Mọi BUS method kiểm tra quyền hiện tại của Session |

### NFR-2: Tính toàn vẹn Dữ liệu (Data Integrity)

| ID | Yêu cầu | Lớp thực thi | Giải pháp |
|---|---|---|---|
| NFR-2.1 | Kết quả không sai lệch khi cập nhật đồng thời | DAL | `SQL Transaction` với `IsolationLevel.Serializable` |
| NFR-2.2 | Nhánh đấu không bị broken | DAL | INSERT Bracket trong 1 Transaction hoàn chỉnh |
| NFR-2.3 | Kiểm soát file upload | BUS | Extension phải là `.jpg`, `.png` + kích thước `< 5MB` |
| NFR-2.4 | Referential Integrity | DB | Foreign Key constraints trong SQL Server |

### NFR-3: Hiệu năng (Performance)

| ID | Yêu cầu | Lớp thực thi | Giải pháp |
|---|---|---|---|
| NFR-3.1 | Tìm kiếm nhanh không gọi DB | GUI | `DataView.RowFilter` (Live Search trên RAM) |
| NFR-3.2 | Thời gian phản hồi | BUS/DAL | Index trên `TournamentID`, `TeamID`, `MatchID` |

### NFR-4: Khả năng Mở rộng (Scalability)

| ID | Yêu cầu | Giải pháp |
|---|---|---|
| NFR-4.1 | Hỗ trợ nhiều loại game | Cấu hình `GameType` trong `tblTournament` |
| NFR-4.2 | Dễ thêm thể thức mới | Pattern Strategy trong BUS (BracketStrategy interface) |

---

## 5. ĐẶC TẢ DỮ LIỆU CHI TIẾT

### 5.1 Data Dictionary — Bảng chính

#### `tblUser`
| Cột | Kiểu | Nullable | Mô tả |
|---|---|---|---|
| `UserID` | INT | PK | ID người dùng |
| `Username` | NVARCHAR(50) | NOT NULL | Tên đăng nhập (unique) |
| `PasswordHash` | VARCHAR(256) | NOT NULL | Hash SHA-256/bcrypt |
| `Role` | VARCHAR(20) | NOT NULL | `Admin` / `Captain` / `Player` / `Guest` |
| `IsLocked` | BIT | NOT NULL | 1 = đã khóa |
| `FullName` | NVARCHAR(100) | NOT NULL | Tên hiển thị |
| `CreatedAt` | DATETIME | NOT NULL | Ngày tạo |

#### `tblTournament`
| Cột | Kiểu | Nullable | Mô tả |
|---|---|---|---|
| `TournamentID` | INT | PK | ID giải đấu |
| `Name` | NVARCHAR(200) | NOT NULL | Tên giải đấu |
| `GameType` | VARCHAR(30) | NOT NULL | `MOBA`, `FPS`, `BattleRoyale`, `Fighting` |
| `Format` | VARCHAR(30) | NOT NULL | `SingleElimination`, `BattleRoyale` |
| `Status` | VARCHAR(20) | NOT NULL | `Draft`, `Registration`, `Active`, `Completed` |
| `StartDate` | DATETIME | NOT NULL | Ngày bắt đầu |
| `EndDate` | DATETIME | NULL | Ngày kết thúc |
| `MaxTeams` | INT | NOT NULL | Số đội tối đa |
| `MinPlayersPerTeam` | INT | NOT NULL | Số thành viên tối thiểu/đội |

#### `tblTeam`
| Cột | Kiểu | Nullable | Mô tả |
|---|---|---|---|
| `TeamID` | INT | PK | ID đội |
| `TournamentID` | INT | FK | Giải đấu dự thi |
| `Name` | NVARCHAR(100) | NOT NULL | Tên đội (unique trong Tournament) |
| `Logo` | NVARCHAR(500) | NULL | URL logo |
| `CaptainID` | INT | FK → tblUser | ID Đội trưởng |
| `Status` | VARCHAR(20) | NOT NULL | `Pending`, `Approved`, `Rejected` |
| `RejectionReason` | NVARCHAR(500) | NULL | Lý do từ chối |

#### `tblPlayer`
| Cột | Kiểu | Nullable | Mô tả |
|---|---|---|---|
| `PlayerID` | INT | PK | ID tuyển thủ |
| `TeamID` | INT | FK | Đội tham gia |
| `UserID` | INT | FK → tblUser | Tài khoản hệ thống |
| `InGameID` | NVARCHAR(100) | NOT NULL | Tên in-game |
| `IsActive` | BIT | NOT NULL | Còn trong đội hay không |

#### `tblMatch` — ★ Linked List Structure
| Cột | Kiểu | Nullable | Mô tả |
|---|---|---|---|
| `MatchID` | INT | PK | ID trận đấu |
| `TournamentID` | INT | FK | Giải đấu |
| `Team1ID` | INT | FK → tblTeam | Đội 1 (NULL nếu chờ đội từ vòng trước) |
| `Team2ID` | INT | FK → tblTeam | Đội 2 (NULL nếu chờ đội từ vòng trước) |
| `WinnerID` | INT | FK → tblTeam | Đội thắng (NULL khi chưa có kết quả) |
| `LoserID` | INT | FK → tblTeam | Đội thua |
| `Status` | VARCHAR(30) | NOT NULL | `Scheduled`, `CheckInOpen`, `Live`, `Completed`, `Walkover` |
| `ScheduledTime` | DATETIME | NULL | Thời gian dự kiến |
| `ActualStartTime` | DATETIME | NULL | Thời gian thực tế bắt đầu |
| `NextMatchID` | INT | FK → tblMatch | **LINKED LIST: trận tiếp theo** |
| `Round` | INT | NOT NULL | Số vòng (1 = vòng đầu) |
| `MatchOrder` | INT | NOT NULL | Thứ tự trong vòng |
| `IsBye` | BIT | NOT NULL | 1 = Bye (vượt vòng) |

#### `tblMatchResult`
| Cột | Kiểu | Nullable | Mô tả |
|---|---|---|---|
| `ResultID` | INT | PK | ID kết quả |
| `MatchID` | INT | FK | Trận đấu |
| `Score1` | INT | NOT NULL | Điểm đội 1 |
| `Score2` | INT | NOT NULL | Điểm đội 2 |
| `EvidenceURL` | NVARCHAR(500) | NOT NULL | URL ảnh bằng chứng |
| `Status` | VARCHAR(30) | NOT NULL | `PendingVerification`, `Verified`, `Disputed` |
| `SubmittedBy` | INT | FK → tblUser | Người nộp |
| `VerifiedBy` | INT | FK → tblUser | Admin xác nhận |
| `SubmittedAt` | DATETIME | NOT NULL | Thời gian nộp |

#### `tblMapVeto`
| Cột | Kiểu | Nullable | Mô tả |
|---|---|---|---|
| `VetoID` | INT | PK | ID lượt veto |
| `MatchID` | INT | FK | Trận đấu |
| `TeamID` | INT | FK | Đội thực hiện |
| `MapName` | NVARCHAR(100) | NOT NULL | Tên bản đồ |
| `Action` | VARCHAR(10) | NOT NULL | `Ban` hoặc `Pick` |
| `VetoOrder` | INT | NOT NULL | Thứ tự thực hiện |

#### `tblDispute`
| Cột | Kiểu | Nullable | Mô tả |
|---|---|---|---|
| `DisputeID` | INT | PK | ID khiếu nại |
| `MatchID` | INT | FK | Trận bị khiếu nại |
| `FiledByTeamID` | INT | FK | Đội gửi khiếu nại |
| `Description` | NVARCHAR(1000) | NOT NULL | Nội dung |
| `EvidenceURL` | NVARCHAR(500) | NULL | URL bằng chứng |
| `Status` | VARCHAR(20) | NOT NULL | `Open`, `Resolved`, `Dismissed` |
| `AdminNote` | NVARCHAR(1000) | NULL | Phán quyết của Admin |
| `CreatedAt` | DATETIME | NOT NULL | Ngày tạo |

---

## 6. GIAO DIỆN HỆ THỐNG (UI Requirements)

### 6.1 Danh sách màn hình

| Màn hình | File | Mô tả |
|---|---|---|
| Đăng nhập | `frmLogin.cs` | Đăng nhập hệ thống |
| Dashboard Admin | `frmDashboard.cs` | Tổng quan, menu điều hướng |
| Quản lý Giải đấu | `frmTournamentSetup.cs` | Tạo/Sửa Tournament |
| Quản lý Đội | `frmTeamManagement.cs` | Đăng ký đội, xét duyệt |
| Xem Nhánh đấu | `frmBracketView.cs` | Render cây nhánh đấu |
| Lịch thi đấu | `frmMatchSchedule.cs` | Lên lịch, xem lịch |
| Check-in | `frmCheckIn.cs` | Xác nhận điểm danh |
| Map Veto | `frmMapVeto.cs` | Giao diện cấm/chọn bản đồ |
| Nộp kết quả | `frmResultSubmit.cs` | Upload ảnh, nhập điểm |
| Leaderboard | `frmLeaderboard.cs` | Bảng xếp hạng, Hall of Fame |
| Khiếu nại | `frmDisputeManage.cs` | Gửi và quản lý khiếu nại |

### 6.2 Yêu cầu UI/UX
- Live Search: Tìm kiếm tên đội/tuyển thủ sử dụng `DataView.RowFilter` (không gọi DB).
- Bracket rendering: Hiển thị dạng cây nhị phân rõ ràng trên `Panel` hoặc `PictureBox`.
- Thông báo lỗi: Rõ ràng, không kỹ thuật, hướng dẫn người dùng cách sửa.
- RBAC UI: Menu/button ẩn đi với người dùng không đủ quyền.

---

## 7. KỊCH BẢN KIỂM THỬ (Test Cases — PCL Framework)

| ID | Loại | Input | Kết quả kỳ vọng |
|---|---|---|---|
| TC-01 | Normal | 8 đội Approved → Generate Bracket | 8 đội, 7 trận, 0 Bye, Linked List đúng |
| TC-02 | Boundary | 7 đội Approved → Generate Bracket | 8 slots → 1 Bye, 6 trận thực |
| TC-03 | Normal | Captain Check-in đúng hạn | `CheckInStatus = True`, không lỗi |
| TC-04 | Boundary | Cả 2 đội Check-in đúng giờ cuối | Cả 2 được xác nhận, `Status = Live` |
| TC-05 | Abnormal | 1 đội không Check-in hết giờ | `Status = Walkover`, đối thủ thắng tự động |
| TC-06 | Concurrency | 2 request Check-in cùng lúc 1 trận | Transaction chặn, chỉ 1 thành công |
| TC-07 | Security | SQL Injection vào field tên đội | Xử lý như văn bản bình thường |
| TC-08 | Boundary | Upload file PNG 4.9MB | Chấp nhận, lưu thành công |
| TC-09 | Boundary | Upload file PNG 5.1MB | Từ chối, hiển thị lỗi kích thước |
| TC-10 | Abnormal | Upload file `.exe` | Từ chối, hiển thị lỗi định dạng |
| TC-11 | Normal | Admin phê duyệt kết quả | WinnerID cập nhật, NextMatchID tự điền đội |
| TC-12 | Boundary | 2 đội đồng điểm trong Battle Royale | Tie-breaker đúng thứ tự: Điểm → Đối đầu → Kill |
| TC-13 | Security | Đăng nhập sai 5 lần | Tài khoản bị khóa |
| TC-14 | Normal | Guest xem Leaderboard giải đã kết thúc | Hiển thị đầy đủ, không cần đăng nhập |
| TC-15 | Abnormal | Thêm thành viên đã thuộc đội khác | BUS trả về lỗi, không thêm |

---

## 8. PHỤ LỤC

### 8.1 Logic thuật toán — Bracket Generation (BracketBUS.cs)

```csharp
// Pseudocode BracketBUS.GenerateBracket()
public BracketDTO GenerateBracket(int tournamentId) {
    // 1. Lấy danh sách đội Approved
    List<TeamDTO> teams = teamDAL.GetApprovedTeams(tournamentId);
    int N = teams.Count;
    
    // 2. Xáo trộn ngẫu nhiên (Fisher-Yates Shuffle)
    Shuffle(teams);
    
    // 3. Tính Bye count
    int slots = NextPowerOf2(N);       // VD: N=5 → slots=8
    int byeCount = slots - N;           // byeCount = 3
    
    // 4. Tạo vòng 1 matches (Linked List)
    List<MatchDTO> round1 = new List<MatchDTO>();
    
    // 4a. Tạo Bye matches trước (đội seed cao được Bye)
    for (int i = 0; i < byeCount; i++) {
        var byeMatch = new MatchDTO {
            Team1ID = teams[i].TeamID,
            Team2ID = null,   // Bye
            WinnerID = teams[i].TeamID,  // Auto win
            IsBye = true,
            Status = "Completed"
        };
        round1.Add(byeMatch);
    }
    
    // 4b. Tạo real matches sau
    for (int i = byeCount; i < slots - 1; i += 2) {
        var match = new MatchDTO {
            Team1ID = teams[i].TeamID,
            Team2ID = teams[i+1].TeamID,
            IsBye = false,
            Status = "Scheduled"
        };
        round1.Add(match);
    }
    
    // 5. Tạo các vòng tiếp theo và set NextMatchID (Linked List)
    return bracketDAL.SaveBracket(round1, tournamentId);  // 1 Transaction
}

private int NextPowerOf2(int n) {
    int p = 1;
    while (p < n) p <<= 1;
    return p;
}
```

### 8.2 Logic thuật toán — Check-in Race Condition (CheckInDAL.cs)

```csharp
// Pseudocode CheckInDAL.ConfirmCheckIn() — SQL Transaction
public bool ConfirmCheckIn(int matchId, int teamId) {
    using (SqlConnection conn = new SqlConnection(connStr)) {
        conn.Open();
        SqlTransaction trans = conn.BeginTransaction(IsolationLevel.Serializable);
        try {
            // Kiểm tra trạng thái hiện tại
            string checkSql = @"SELECT CheckInStatus 
                                 FROM tblMatch 
                                 WHERE MatchID = @matchId";
            // (thực hiện query với transaction)
            
            // Cập nhật Check-in
            string updateSql = @"UPDATE tblMatch 
                                  SET CheckIn_Team{teamNum} = 1
                                  WHERE MatchID = @matchId";
            // (thực hiện update với transaction)
            
            trans.Commit();
            return true;
        } catch {
            trans.Rollback();
            return false;
        }
    }
}
```

### 8.3 Cấu trúc Linked List trong tblMatch

```
Ví dụ Bracket 4 đội (2 vòng):

Vòng 1:                     Vòng 2 (Final):
MatchID=1 (Team A vs B)  →  MatchID=3 (Winner1 vs Winner2)  →  NULL (kết thúc)
    NextMatchID = 3              NextMatchID = NULL
MatchID=2 (Team C vs D)  →  MatchID=3
    NextMatchID = 3
```

---

*Tài liệu này là nền tảng thiết kế và kiểm thử. Mọi thay đổi yêu cầu cần được phản ánh lại vào SRS và Q&A Log.*

**© 2026 – FIT TDTU | Môn học Kỹ thuật Phần mềm (502045)**
