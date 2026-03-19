# KẾ HOẠCH THỰC THI ĐỒ ÁN KỸ THUẬT PHẦN MỀM
## Đề tài 11: Hệ thống Quản lý Giải đấu Esports (ETMS)
**Mô hình Kiến trúc:** 3-Layer Architecture (GUI – BUS – DAL)  
**Trường:** Đại học Tôn Đức Thắng – Khoa CNTT  
**Môn học:** Kỹ thuật Phần mềm (502045) – HK 2/2025-2026

---

## 1. TỔNG QUAN DỰ ÁN

### Mô tả hệ thống
Hệ thống Quản lý Giải đấu Esports (ETMS) là nền tảng **Windows Forms Application (C#)** cho phép Ban tổ chức (BTC) khởi tạo, vận hành và giám sát các giải đấu thể thao điện tử (LMHT, Valorant, CS:GO...). Hệ thống tối ưu cho thể thức **Single Elimination (Loại trực tiếp)** và tự động hóa toàn bộ chu trình từ đăng ký đội → chia nhánh đấu → ghi nhận kết quả → vinh danh.

### Công nghệ sử dụng
| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | C# (.NET 6+) |
| Giao diện | Windows Forms |
| Cơ sở dữ liệu | SQL Server (SSMS) |
| Kiến trúc | 3-Layer (GUI / BUS / DAL) |
| Version Control | GitHub (Gitflow) |
| Quản lý dự án | Trello / GitHub Projects |
| Tài liệu | Google Docs (SRS/SDDD), Google Sheets (PCL/Q&A) |
| Thiết kế UI | Figma |
| UML | Mermaid.js / Lucidchart |
| AI Audit | ChatGPT (Virtual Tech Lead) |

---

## 2. PHÂN TÍCH NGHIỆP VỤ & ĐIỂM CẢI THIỆN ĐẶC TẢ

### 2.1 Các cải tiến chất lượng kỹ thuật (so với đặc tả gốc)

#### 🔧 Cải tiến 1: Toán học Nhánh đấu (Bracket Math & Bye Logic)
- **Vấn đề:** Đặc tả yêu cầu tạo sơ đồ thi đấu tự động nhưng không xử lý trường hợp số đội lẻ.
- **Cải tiến:** Lớp BUS phải xử lý vòng sơ loại **(Bye Logic)** nếu tổng số đội Approved **không phải là lũy thừa của 2** (8, 16, 32...).
  - Công thức: `bye_count = next_power_of_2(N) - N`
  - Các đội được Bye tự động thắng vòng đầu mà không cần thi đấu.

#### 🔧 Cải tiến 2: Xung đột đồng thời trong Check-in (Race Condition)
- **Vấn đề:** Nhiều đội cùng xác nhận Check-in → nguy cơ cập nhật trạng thái sai lệch.
- **Cải tiến:** Áp dụng **SQL Transaction** với `IsolationLevel.Serializable` tại lớp DAL để đảm bảo tính nguyên tử khi hàng chục đội cập nhật cùng lúc.

#### 🔧 Cải tiến 3: Thuật toán Phân hạng & Tie-breaker
- **Vấn đề:** Hệ thống Battle Royale và vòng bảng cần cơ chế phân hạng khi đồng điểm.
- **Cải tiến:** Logic phân hạng nghiêm ngặt theo Đề tài 11:
  1. So điểm tổng → 2. Xét kết quả đối đầu trực tiếp → 3. Xét tổng số hạ gục (Kill Points).
  - Thực hiện bằng SQL `ORDER BY` đa cột.

#### 🔧 Cải tiến 4: Quản lý File Upload an toàn
- **Vấn đề:** Upload ảnh bằng chứng chưa có ràng buộc.
- **Cải tiến:**
  - Kiểm tra định dạng: chỉ chấp nhận `.jpg`, `.png` tại tầng BUS.
  - Giới hạn dung lượng: `< 5MB`.
  - Khuyến nghị: Tích hợp **Cloud Storage API** thay vì lưu BLOB vào Database.

---

## 3. ÁNH XẠ YÊU CẦU PHI CHỨC NĂNG (NFR) VÀO KIẾN TRÚC 3 LỚP

| NFR | Tầng thực thi | Giải pháp cụ thể |
|---|---|---|
| NFR-1: Security | BUS | Băm mật khẩu bằng `bcrypt` / SHA-256 |
| NFR-1: SQL Injection | DAL | Sử dụng `Parameterized Query` cho mọi câu lệnh |
| NFR-1: RBAC | GUI + BUS | Kiểm tra quyền trước khi render màn hình Admin |
| NFR-2: Data Integrity | DAL | `SQL Transaction` (Serializable) cho `UPDATE` kết quả |
| NFR-2: File Validation | BUS | Kiểm tra extension & size trước khi lưu |
| NFR-3: Performance | GUI | `DataView` filter on RAM (Live Search) |
| NFR-4: Scalability | BUS | Thuật toán đệ quy / DFS cho xáo trộn nhánh đấu |

---

## 4. THIẾT KẾ HỆ THỐNG

### 4.1 Kiến trúc 3 Lớp

```
┌─────────────────────────────────────────────────────┐
│                  GUI Layer (Presentation)            │
│  frmLogin | frmDashboard | frmBracket | frmMatch... │
└─────────────────┬───────────────────────────────────┘
                  │  Gọi qua DTO objects
┌─────────────────▼───────────────────────────────────┐
│              BUS Layer (Business Logic)              │
│  AuthBUS | TeamBUS | BracketBUS | MatchBUS...       │
└─────────────────┬───────────────────────────────────┘
                  │  SQL Parameterized Queries
┌─────────────────▼───────────────────────────────────┐
│              DAL Layer (Data Access)                 │
│  TeamDAL | MatchDAL | BracketDAL | UserDAL...       │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│           SQL Server Database (ETMS_DB)              │
│  tblTeam | tblMatch | tblPlayer | tblTournament... │
└─────────────────────────────────────────────────────┘
```

### 4.2 Cấu trúc Database (Schema với Linked List cho Bracket)

```sql
-- Core Entities
tblTournament  (TournamentID PK, Name, GameType, Status, StartDate, EndDate)
tblTeam        (TeamID PK, TournamentID FK, Name, Logo, Status[Pending/Approved/Rejected], CaptainID FK)
tblPlayer      (PlayerID PK, TeamID FK, FullName, InGameID, IsActive)
tblUser        (UserID PK, Username, PasswordHash, Role[Admin/Captain/Guest])

-- Bracket (Linked List Structure)
tblMatch       (MatchID PK, TournamentID FK, 
                Team1ID FK, Team2ID FK,          -- NULL nếu đội còn đang ở vòng trước
                WinnerID FK, LoserID FK,
                Status[Scheduled/CheckIn/Live/Completed/Walkover],
                ScheduledTime, ActualStartTime,
                NextMatchID FK,                   -- ← LINKED LIST: kết nối vòng tiếp theo
                Round INT, MatchOrder INT)

-- Results & Evidence
tblMatchResult (ResultID PK, MatchID FK, Score1, Score2, EvidenceURL, 
                Status[PendingVerification/Verified/Disputed], SubmittedBy FK, VerifiedBy FK)

-- Game-specific
tblMapVeto     (VetoID PK, MatchID FK, TeamID FK, MapName, Action[Ban/Pick], VetoOrder INT)
tblSideSelect  (SelectID PK, MatchID FK, TeamID FK, Side[Blue/Red])

-- Battle Royale (thể loại đặc biệt)
tblBRRound     (RoundID PK, TournamentID FK, RoundNumber INT)
tblBRScore     (ScoreID PK, RoundID FK, TeamID FK, RankingPoints INT, KillPoints INT, TotalPoints INT)

-- Dispute System
tblDispute     (DisputeID PK, MatchID FK, FiledByTeamID FK, EvidenceURL, Status, AdminNote, CreatedAt)

-- Audit
tblAuditLog    (LogID PK, UserID FK, Action, Timestamp, Detail)
```

### 4.3 Sequence Diagram: Luồng Tạo Nhánh đấu

```
Admin          BracketUI          BracketBUS              BracketDAL
  |                |                   |                       |
  |--[Chọn TournID]→|                   |                       |
  |                |---GetApprovedTeams()→|                    |
  |                |                   |---SELECT * FROM tblTeam→|
  |                |                   |←---List<TeamDTO>--------|
  |                |                   |                       |
  |                |                   |--[Shuffle + Bye Logic] |
  |                |                   |--GenerateBracket()     |
  |                |                   |---INSERT tblMatch (Linked List)→|
  |                |                   |←---SUCCESS------------|
  |                |←--BracketDTO------|                       |
  |←--[Render Bracket Tree]--|          |                       |
```

---

## 5. CẤU TRÚC PROJECT & PHÂN CÔNG

### 5.1 Cấu trúc thư mục Project C#

```
ETMS/
├── GUI/                          # Tầng Giao diện (SV A)
│   ├── frmLogin.cs
│   ├── frmDashboard.cs           # Admin Dashboard
│   ├── frmTournamentSetup.cs
│   ├── frmTeamManagement.cs      # Xét duyệt đội
│   ├── frmBracketView.cs         # Hiển thị nhánh đấu (cây nhị phân)
│   ├── frmMatchSchedule.cs       # Lịch thi đấu
│   ├── frmCheckIn.cs             # Cổng xác nhận
│   ├── frmMapVeto.cs             # Giao diện Map Veto (FPS)
│   ├── frmResultSubmit.cs        # Nộp kết quả + upload ảnh
│   ├── frmLeaderboard.cs         # Bảng xếp hạng
│   └── frmDisputeManage.cs       # Quản lý khiếu nại
│
├── BUS/                          # Tầng Nghiệp vụ (SV B)
│   ├── AuthBUS.cs               # Xác thực + bcrypt
│   ├── TeamBUS.cs               # Quản lý đội (Validation)
│   ├── BracketBUS.cs            # ★ Thuật toán tạo nhánh đấu + Bye Logic
│   ├── MatchBUS.cs              # Lên lịch + Check-in logic
│   ├── ResultBUS.cs             # Xác thực kết quả + file upload
│   ├── LeaderboardBUS.cs        # Phân hạng + Tie-breaker
│   └── DisputeBUS.cs            # Xử lý khiếu nại
│
├── DAL/                          # Tầng Dữ liệu (SV C)
│   ├── DBConnection.cs          # Singleton connection
│   ├── UserDAL.cs
│   ├── TeamDAL.cs
│   ├── BracketDAL.cs            # ★ INSERT Linked List (SQL Transaction)
│   ├── MatchDAL.cs              # UPDATE kết quả (SQL Transaction)
│   ├── CheckInDAL.cs            # ★ Serializable Transaction
│   ├── ResultDAL.cs
│   └── LeaderboardDAL.cs        # ORDER BY đa cột
│
├── DTO/                          # Data Transfer Objects
│   ├── TournamentDTO.cs
│   ├── TeamDTO.cs
│   ├── PlayerDTO.cs
│   ├── MatchDTO.cs
│   └── BracketNodeDTO.cs
│
├── Database/
│   ├── ETMS_CreateDB.sql         # Script tạo database
│   ├── ETMS_InsertSample.sql     # Dữ liệu mẫu
│   └── ETMS_Procedures.sql       # Stored procedures (nếu có)
│
└── ETMS.sln
```

### 5.2 Phân công nhiệm vụ

| Thành viên | Layer | Phụ trách chính |
|---|---|---|
| **SV A** | GUI | Toàn bộ màn hình WinForms, Figma mockup, Bracket rendering |
| **SV B** | BUS | Tất cả logic nghiệp vụ, thuật toán Bracket, Tie-breaker, File validation |
| **SV C** | DAL | SQL queries, Transactions, DB Schema, Stored Procedures |

> **Quy tắc:** Mỗi SV chỉ sở hữu layer của mình. Giao tiếp giữa layer qua DTO objects.

---

## 6. LỘ TRÌNH THỰC THI (3 SPRINT)

### Sprint 1: Phân tích & Thiết kế (Tuần 1–4)
- [ ] Đọc và nắm toàn bộ đặc tả ETMS
- [ ] Hoàn thiện tài liệu SRS (Software Requirements Specification)
- [ ] Lập Q&A Log trên Google Sheets để làm rõ các Use Case đặc thù
- [ ] Thiết kế ERD và Database Schema đầy đủ
- [ ] Vẽ Sequence Diagram cho 5 Use Case cốt lõi (Mermaid.js)
- [ ] Thiết kế Mockup UI trên Figma cho tất cả màn hình
- [ ] Chốt phân công nhiệm vụ chi tiết
- [ ] Tạo GitHub Repository, khởi tạo nhánh `main`, `develop`
- [ ] Tạo Trello board với toàn bộ User Stories

### Sprint 2: Lập trình (Tuần 5–10)
- [ ] SV C: Tạo Database SQL Server, chạy script ETMS_CreateDB.sql
- [ ] SV C: Implement toàn bộ DAL với Parameterized Queries
- [ ] SV B: Implement AuthBUS (bcrypt), TeamBUS (validation)
- [ ] SV B: **Implement BracketBUS** (Shuffle + Bye Logic algorithm) ← Trọng tâm
- [ ] SV B: Implement MatchBUS (Check-in Timer + Walkover logic)
- [ ] SV B: Implement LeaderboardBUS (Tie-breaker)
- [ ] SV A: Implement toàn bộ GUI Forms
- [ ] SV A: Implement Bracket rendering (vẽ cây nhánh đấu)
- [ ] SV A: Live Search với DataView (NFR Performance)
- [ ] Code Review qua Pull Request trước mỗi merge vào `develop`
- [ ] Tích hợp 3 layer, kiểm tra luồng end-to-end

### Sprint 3: Kiểm thử & Hoàn thiện (Tuần 11–14)
- [ ] Viết bảng PCL Workbook (Normal/Boundary/Abnormal) trên Google Sheets
- [ ] Test case ưu tiên:
  - TC-01: Tạo nhánh đấu với 7 đội (kiểm tra Bye Logic)
  - TC-02: Check-in đồng thời 10 đội (kiểm tra Race Condition)
  - TC-03: Upload file > 5MB (kiểm tra validation)
  - TC-04: SQL Injection vào trường tên đội
  - TC-05: Phân hạng khi 2 đội đồng điểm (Tie-breaker)
- [ ] AI Audit: Dùng ChatGPT đóng vai "Virtual Tech Lead" sinh test case
- [ ] Ghi nhật ký AI Audit Log (Markdown)
- [ ] Viết Báo cáo Bảo vệ Kỹ thuật cá nhân (1-2 trang/người)
- [ ] Merge code lên nhánh `main`
- [ ] Quay video Demo bằng Loom/OBS

---

## 7. CÁC USE CASE CỐT LÕI

### UC-01: Đăng ký & Xét duyệt Đội (FR-1)
| Trường | Giá trị |
|---|---|
| **Actor** | Đội trưởng (Captain), Admin |
| **Precondition** | Captain đã đăng nhập hệ thống |
| **Main Flow** | Captain tạo hồ sơ đội → Thêm thành viên → Nộp hồ sơ → Admin kiểm tra → Approved/Rejected |
| **Alternate Flow** | Thành viên đã thuộc đội khác → Hệ thống từ chối và hiển thị lỗi |
| **Postcondition** | Đội có trạng thái `Approved` hoặc `Rejected` (kèm lý do) |

### UC-02: Tạo Nhánh đấu Tự động (FR-2) ← USE CASE TRỌNG TÂM
| Trường | Giá trị |
|---|---|
| **Actor** | Admin |
| **Precondition** | ≥ 2 đội có trạng thái `Approved` |
| **Main Flow** | Admin chọn Tournament → Click "Generate Bracket" → BUS lấy danh sách đội → Shuffle + Bye Logic → DAL INSERT Linked List → GUI render cây nhị phân |
| **Critical Logic** | `bye_count = next_power_of_2(N) - N` |
| **Postcondition** | Bảng `tblMatch` có đầy đủ bản ghi với `NextMatchID` đã liên kết |

### UC-03: Check-in & Kỷ luật tự động (FR-3)
| Trường | Giá trị |
|---|---|
| **Actor** | Đội trưởng, Hệ thống (Timer) |
| **Trigger** | 15 phút trước giờ thi đấu |
| **Main Flow** | Timer kích hoạt → Cổng Check-in mở → Captain xác nhận → Cập nhật `CheckInStatus = True` |
| **Auto Discipline** | Nếu hết giờ mà không Check-in → `Status = 'Walkover'`, đối thủ thắng tự động |
| **Concurrency** | SQL Transaction (Serializable) tại DAL |

### UC-04: Báo cáo & Xác thực Kết quả (FR-4)
| Trường | Giá trị |
|---|---|
| **Actor** | Đội trưởng, Admin |
| **Main Flow** | Captain upload ảnh (.jpg/.png, <5MB) → BUS validate → DAL lưu → Status = `PendingVerification` → Admin phê duyệt → BUS cập nhật WinnerID → DAL UPDATE `tblMatch.WinnerID`, tự động update trận tiếp theo qua `NextMatchID` |

### UC-05: Xem Leaderboard & Vinh danh (FR-5)
| Trường | Giá trị |
|---|---|
| **Actor** | Guest, User |
| **Main Flow** | Query kết quả → LeaderboardBUS tính điểm → Tie-breaker nếu cần → Hiển thị Top 3 (Vô địch/Á quân/Hạng 3) |

---

## 8. TIÊU CHÍ NGHIỆM THU (ĐIỂM XUẤT SẮC)

Để đạt điểm xuất sắc theo yêu cầu của môn học:

### ✅ Kỹ thuật bắt buộc
- [x] **3-Layer Architecture** triệt để: Không có SQL string trong GUI, không có UI code trong DAL
- [x] **SQL Transaction** (Serializable) cho tất cả thao tác cập nhật quan trọng
- [x] **Parameterized Query** tất cả câu lệnh SQL → chống SQL Injection toàn diện
- [x] **bcrypt/SHA-256** cho mật khẩu
- [x] **Bye Logic** trong thuật toán tạo bracket
- [x] **Tie-breaker** đúng theo đặc tả: Điểm → Đối đầu → Kill Points

### ✅ Kỹ thuật nâng cao (để nổi bật)
- [ ] Live Search (DataView filter on RAM) → NFR Performance
- [ ] Map Veto UI cho FPS games
- [ ] Side Selection UI cho MOBA games
- [ ] Battle Royale point accumulation
- [ ] Dispute/Ticket System (FR-6)
- [ ] Game Metadata Management (FR-7)

### ✅ Quy trình & Tài liệu
- [ ] Gitflow (main/develop/feature branches) với Pull Request
- [ ] PCL Workbook đầy đủ (Normal/Boundary/Abnormal)
- [ ] AI Audit Log (ChatGPT Shared Links)
- [ ] Video Demo (Loom/OBS)
- [ ] SRS Document hoàn chỉnh
- [ ] Báo cáo Bảo vệ Kỹ thuật cá nhân (1-2 trang/người)

---

## 9. RỦI RO & ĐỐI PHÉP

| Rủi ro | Xác suất | Tác động | Đối phép |
|---|---|---|---|
| Race Condition trong Check-in | Cao | Cao | SQL Transaction Serializable |
| Bracket Math sai khi số đội lẻ | Trung bình | Cao | Unit test Bye Logic |
| Upload file lớn làm chậm hệ thống | Thấp | Trung bình | Giới hạn <5MB + Cloud Storage |
| Conflict khi merge code | Cao | Trung bình | Gitflow + Code Review nghiêm ngặt |
| Tie-breaker tính sai | Thấp | Cao | Test case với data đồng điểm |

---

## 10. TÀI LIỆU THAM KHẢO

- Đặc tả đề tài ETMS (Đề tài 11) – Tài liệu môn học SE 502045
- Artifact mẫu: Hệ thống Quản lý Bãi xe iParking – FIT TDTU 2026
- Teamwork Guide Vietnamese – FIT TDTU 2026
- Đặc tả Chi tiết Đồ án (Đề tài 1-25) – FIT TDTU 2026
