# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)
## Hệ thống Quản lý Giải đấu Esports — ETMS
**Software Requirements Specification (IEEE 830)**
**Phiên bản:** 4.0 | **Ngày:** 2026-03-31
**Trường:** Đại học Tôn Đức Thắng – Khoa CNTT | **Môn:** Kỹ thuật Phần mềm (502045)

---

## 1. GIỚI THIỆU

### 1.1 Mục đích
Tài liệu này đặc tả đầy đủ yêu cầu chức năng và phi chức năng của hệ thống ETMS — phục vụ nhóm phát triển, giảng viên hướng dẫn và các bên liên quan.

### 1.2 Phạm vi hệ thống
- **Tên hệ thống:** ETMS – Esports Tournament Management System
- **Loại:** Cross-Platform Desktop Application (Windows / macOS / Linux)
- **Kiến trúc:** 3-Tier — React UI ↔ ASP.NET Core API ↔ SQL Server
- **Desktop Shell:** Tauri v2 — đóng gói native WebView, không cần browser
- **Trong phạm vi:**
  - Quản lý vòng đời giải đấu: đăng ký → duyệt → bracket → thi đấu → kết quả → vinh danh
  - Hỗ trợ 2 format: Single Elimination và Battle Royale
  - Hỗ trợ 6 thể loại game: MOBA, FPS, BattleRoyale, Fighting, RTS, Sports
- **Ngoài phạm vi:** Livestream, thanh toán online, ứng dụng mobile riêng

### 1.3 Đối tượng sử dụng

| Vai trò | Mô tả | Quyền hạn chính |
|---|---|---|
| **Admin** | Ban tổ chức giải đấu | Toàn quyền hệ thống — quản lý user, giải đấu, xét duyệt, kết quả, khiếu nại, audit |
| **Captain** | Đội trưởng | Đăng ký đội, quản lý thành viên, check-in, nộp kết quả, khiếu nại (tối đa 2 lần/giải) |
| **Player** | Tuyển thủ | Xem lịch thi đấu, xem bracket, xem kết quả, xem thông báo |
| **Guest** | Khán giả/khách | Chỉ xem leaderboard và lịch sử giải công khai |

### 1.4 Thuật ngữ & Định nghĩa

| Thuật ngữ | Giải nghĩa |
|---|---|
| **Tauri v2** | Desktop framework dựa trên Rust, đóng gói React app thành native desktop app dùng OS WebView |
| **Sidecar** | Tiến trình con ETMS.Api (.NET) được Tauri khởi động và quản lý vòng đời |
| **JWT** | JSON Web Token — token xác thực stateless, expire sau 30 phút |
| **BCrypt** | Thuật toán hash mật khẩu có salt, cost factor = 12 |
| **Single Elimination** | Thể thức loại trực tiếp: thua 1 trận = bị loại |
| **Battle Royale** | Thể thức nhiều vòng tích lũy điểm: PlacementRank + KillPoints |
| **BYE** | Trận giả khi số đội không phải lũy thừa 2 — đội được đi thẳng vòng sau |
| **Walkover** | Trận thắng mặc định do đối thủ không check-in |
| **WalkoverPending** | Trạng thái khi cả 2 đội đều không check-in, chờ Admin xử lý |
| **Map Veto** | Quá trình Ban/Pick bản đồ theo lượt trước trận (FPS) |
| **Side Selection** | Chọn phe Blue/Red đầu trận (MOBA) |
| **Evidence URL** | Đường link ảnh chụp màn hình kết quả để xác minh |
| **SLA** | Service Level Agreement — thời hạn xử lý khiếu nại: 48 giờ |

---

## 2. YÊU CẦU CHỨC NĂNG

### FR-1: Quản lý Tài khoản & Xác thực

#### UC-1.1: Đăng nhập hệ thống
- **Actor:** Admin, Captain, Player, Guest
- **Precondition:** Ứng dụng đang chạy; tài khoản đã tồn tại trong hệ thống
- **Luồng chính:**
  1. Người dùng nhập Username và Password
  2. Hệ thống gọi `POST /api/auth/login`
  3. `AuthBUS.Login()` kiểm tra tài khoản trong DB
  4. Kiểm tra `IsLocked`: nếu bị khóa → trả 403, hiển thị thông báo
  5. Xác minh mật khẩu qua SHA-256 (hoặc BCrypt nếu nâng cấp)
  6. Nếu sai: tăng `FailedLoginAttempts`; nếu ≥ 5 lần → khóa tài khoản
  7. Nếu đúng: reset `FailedLoginAttempts`, tạo JWT token, trả `UserDTO + token`
  8. React lưu token vào `sessionStorage`, điều hướng sang Dashboard theo Role
- **Luồng ngoại lệ:**
  - Tài khoản bị khóa → thông báo liên hệ Admin
  - Sai mật khẩu ≥ 5 lần → tài khoản tự động khóa, gửi thông báo cho Admin
  - Mạng/server lỗi → toast lỗi "Không thể kết nối server"
- **Postcondition:** Token hợp lệ 30 phút lưu trong session; người dùng ở đúng Dashboard
- **Ràng buộc:** Thông báo lỗi KHÔNG tiết lộ field nào sai
- **API:** `POST /api/auth/login` → `{ token, user: { userID, username, fullName, role } }`
- **Page:** `LoginPage.tsx`

#### UC-1.2: Đăng xuất
- **Actor:** Admin, Captain, Player
- **Luồng chính:** Bấm Đăng xuất → xóa token khỏi `sessionStorage` → về `LoginPage.tsx`
- **API:** `POST /api/auth/logout`

#### UC-1.3: Đổi mật khẩu cá nhân
- **Actor:** Admin, Captain, Player
- **Luồng chính:** Nhập mật khẩu cũ → nhập mật khẩu mới (≥ 8 ký tự, có chữ hoa và số) → xác nhận → hash và lưu
- **Ràng buộc:** Mật khẩu mới ≠ mật khẩu cũ
- **API:** `PATCH /api/auth/change-password`

#### UC-1.4: Admin quản lý tài khoản
- **Actor:** Admin
- **Chức năng:** Tạo/xóa tài khoản; Khóa/mở khóa; Reset mật khẩu; Phân vai (Admin/Captain/Player/Guest)
- **Ràng buộc:** Không thể xóa tài khoản Admin duy nhất của hệ thống
- **API:** `GET /api/users` | `POST /api/users` | `PATCH /api/users/{id}/lock` | `PATCH /api/users/{id}/reset-password`
- **Page:** `UserManagementPage.tsx`

---

### FR-2: Cấu hình & Tạo Giải đấu

#### UC-2.1: Admin tạo giải đấu
- **Actor:** Admin
- **Precondition:** Đã đăng nhập với Role = Admin
- **Thông tin tạo:**
  - Tên giải; Thể loại game (MOBA/FPS/BattleRoyale/Fighting/RTS/Sports)
  - Format (SingleElimination / BattleRoyale)
  - Ngày bắt đầu; Ngày hết hạn đăng ký; Số đội tối đa; Số thành viên tối thiểu/tối đa
  - Mô tả giải
- **GameConfig (tự động gợi ý theo GameType):**
  - `BestOf`: 1 / 3 / 5
  - `MapPool` (FPS/RTS): danh sách tên bản đồ JSON
  - `VetoSequence` (FPS): ["Ban","Ban","Pick","Pick","Ban","Ban","Pick"]
  - `KillPointPerKill` (BR): điểm cho mỗi kill
  - `RankingPointTable` (BR): bảng điểm theo vị trí {"1":25,"2":18,...}
- **Postcondition:** Tournament có Status = "Draft"
- **API:** `POST /api/tournaments`
- **Page:** `TournamentSetupPage.tsx` (UI thay đổi theo GameType được chọn)

#### UC-2.2: Admin chỉnh sửa giải đấu
- **Actor:** Admin
- **Ràng buộc:** Chỉ chỉnh sửa khi Status ∈ {Draft, Registration}
- **API:** `PATCH /api/tournaments/{id}`

#### UC-2.3: Admin chuyển trạng thái giải đấu
- **Trạng thái hợp lệ:** Draft → Registration → Active → Completed
- **Hủy bất cứ lúc nào:** → Cancelled
- **Ràng buộc:** Chỉ Admin mới thay đổi được trạng thái
- **API:** `PATCH /api/tournaments/{id}/status`

---

### FR-3: Đăng ký & Xét duyệt Đội tuyển

#### UC-3.1: Captain đăng ký đội
- **Actor:** Captain
- **Precondition:** Tournament đang ở Status = "Registration"; trong thời hạn đăng ký
- **Thông tin:** Tên đội (unique/giải); Logo URL; Danh sách thành viên (InGameID, FullName)
- **Ràng buộc:**
  - Số thành viên ≥ MinPlayersPerTeam (theo GameType)
  - Mỗi Captain chỉ đăng ký 1 đội/giải
  - 1 Player chỉ thuộc 1 đội/giải
- **Postcondition:** Team có Status = "Pending"
- **API:** `POST /api/teams`; `POST /api/teams/{id}/players`
- **Page:** `TeamManagementPage.tsx`

#### UC-3.2: Admin xét duyệt đội
- **Actor:** Admin
- **Precondition:** Đội có Status = "Pending"
- **Luồng Approve:** Kiểm tra đủ thành viên → cập nhật Status = "Approved" → gửi Notification cho Captain
- **Luồng Reject:** Điền lý do → Status = "Rejected" → gửi Notification cho Captain
- **Postcondition:** Captain nhận thông báo kết quả
- **API:** `PATCH /api/teams/{id}/approve` | `PATCH /api/teams/{id}/reject`

#### UC-3.3: Admin loại đội (thi đấu)
- **Actor:** Admin (trong quá trình giải diễn ra)
- **Lý do:** Vi phạm quy tắc, sử dụng cheat
- **Postcondition:** Status = "Disqualified"; các trận tiếp theo → Walkover cho đội còn lại
- **API:** `PATCH /api/teams/{id}/disqualify`

---

### FR-4: Tạo Bracket Tự Động

#### UC-4.1: Admin tạo bracket (Single Elimination)
- **Actor:** Admin
- **Precondition:** Tournament Status = "Registration" đã đóng; ≥ 2 đội được duyệt
- **Luồng:**
  1. Admin bấm "Tạo Bracket"
  2. Hệ thống lấy danh sách đội Approved
  3. Xáo trộn ngẫu nhiên (hoặc theo seed thứ hạng)
  4. Nếu số đội không phải lũy thừa 2 → tạo BYE matches (đội đi thẳng)
  5. Tạo `tblMatch` đầy đủ (Round, MatchOrder, NextMatchID linked list)
  6. Status Tournament → "Active"
- **Postcondition:** Bracket hiển thị đầy đủ trên BracketViewPage
- **API:** `POST /api/tournaments/{id}/generate-bracket`
- **Page:** `BracketViewPage.tsx`

#### UC-4.2: Xem bracket
- **Actor:** Tất cả
- **Mô tả:** Hiển thị cây bracket dạng visual, cập nhật realtime sau mỗi kết quả
- **API:** `GET /api/tournaments/{id}/bracket`

---

### FR-5: Check-in Trận đấu

#### UC-5.1: System mở cửa sổ check-in
- **Trigger:** Trước giờ thi đấu `DefaultCheckInMinutes` phút (theo GameType)
  - MOBA/FPS/RTS/Sports: 15 phút | BR: 30 phút | Fighting: 10 phút
- **Hành động:** Status trận đổi thành "CheckInOpen"; gửi Notification cho 2 Captain

#### UC-5.2: Captain check-in
- **Actor:** Captain (của Team1 hoặc Team2)
- **Luồng:** Bấm Check-in → set `CheckIn_TeamX = 1` trong `tblMatch`
- **API:** `POST /api/matches/{id}/checkin`
- **Page:** `CheckInPage.tsx`

#### UC-5.3: Xử lý kết quả check-in
- **Cả 2 check-in:** Status → "Live"
- **Chỉ 1 check-in:** Khi hết giờ → Status → "Walkover" (đội check-in thắng)
- **0 check-in:** Status → "WalkoverPending" → Admin quyết định
- **Ràng buộc:** Không thể check-in sau khi hết cửa sổ

---

### FR-6: Map Veto (FPS)

#### UC-6.1: Tiến hành veto bản đồ
- **Actor:** Captain (của đội đang đến lượt)
- **Precondition:** Match Status = "Live"; GameType = FPS; đến lượt đội này
- **Luồng:**
  1. Hệ thống hiển thị MapPool theo VetoSequence
  2. Đến lượt: Captain chọn Ban hoặc Pick 1 map trong 60 giây
  3. Timeout → hệ thống tự động chọn ngẫu nhiên
  4. Lưu vào `tblMapVeto` (MatchID, TeamID, MapName, Action, VetoOrder)
  5. Khi hoàn thành — chuyển sang Side Selection (MOBA) hoặc bắt đầu trận
- **Postcondition:** Danh sách map đã chọn (Pick) xác định; các map bị loại (Ban) không dùng
- **API:** `POST /api/matches/{id}/veto`
- **Page:** `MapVetoPage.tsx`

---

### FR-7: Side Selection (MOBA)

#### UC-7.1: Chọn phe thi đấu
- **Actor:** Captain (đội thắng flip coin)
- **Precondition:** Match Status = "Live"; GameType = MOBA
- **Luồng:** Đội thắng coin toss chọn Blue hoặc Red → lưu vào `tblSideSelect`
- **API:** `POST /api/matches/{id}/side-select`
- **Page:** `SideSelectPage.tsx`

---

### FR-8: Nộp & Xác nhận Kết quả

#### UC-8.1: Captain nộp kết quả
- **Actor:** Captain (của đội thắng — hoặc bất kỳ Captain nào trong trận)
- **Precondition:** Match Status = "Live" hoặc đang thi đấu
- **Thông tin nộp:**
  - Score1, Score2 (số game thắng trong BestOf)
  - Evidence URL (link screenshot bắt buộc)
- **Postcondition:** `tblMatchResult` với Status = "PendingVerification"
- **API:** `POST /api/matches/{id}/result`
- **Page:** `ResultSubmitPage.tsx`

#### UC-8.2: Admin xác nhận kết quả
- **Actor:** Admin
- **Luồng Verify:**
  1. Xem evidence URL, kiểm tra score
  2. Bấm "Xác nhận" → Status = "Verified"
  3. Cập nhật `tblMatch.WinnerID`, `LoserID`
  4. Đẩy Winner lên trận tiếp theo (NextMatchID) trong bracket
  5. Gửi Notification cho cả 2 Captain
- **Luồng Reject:** Admin từ chối → Status = "Rejected" → yêu cầu nộp lại
- **Ràng buộc:** Chỉ Admin mới xác nhận được
- **API:** `PATCH /api/results/{id}/verify` | `PATCH /api/results/{id}/reject`

---

### FR-9: Khiếu nại Kết quả

#### UC-9.1: Captain nộp khiếu nại
- **Actor:** Captain
- **Precondition:** Kết quả trận đã được xác nhận; trong vòng 24 giờ sau trận
- **Giới hạn:** Tối đa 2 khiếu nại/Captain/giải đấu
- **Thông tin:**
  - Danh mục: HackCheat | WrongScore | UnauthorizedPlayer | Other
  - Mô tả (bắt buộc, tối đa 1000 ký tự)
  - Evidence URL (khuyến nghị)
- **Postcondition:** `tblDispute` với Status = "Open"; Admin nhận Notification
- **API:** `POST /api/disputes`
- **Page:** `DisputeManagePage.tsx`

#### UC-9.2: Admin giải quyết khiếu nại
- **Actor:** Admin
- **SLA:** Xử lý trong vòng 48 giờ kể từ khi nhận
- **Luồng Upheld (chấp nhận):** Lật ngược kết quả trận → cập nhật bracket → thông báo
- **Luồng Dismissed (bác bỏ):** Ghi lý do → đóng khiếu nại → thông báo
- **API:** `PATCH /api/disputes/{id}/resolve`

---

### FR-10: Xếp hạng & Thống kê

#### UC-10.1: Bảng xếp hạng Single Elimination
- Hiển thị thứ tự các đội theo kết quả thi đấu (Vô địch → Á quân → ...)
- **API:** `GET /api/tournaments/{id}/leaderboard`
- **Page:** `LeaderboardPage.tsx`

#### UC-10.2: Battle Royale Scoring
- **Actor:** Admin
- **Precondition:** Tournament Format = BattleRoyale
- **Luồng mỗi vòng:**
  1. Admin nhập PlacementRank và KillPoints cho từng đội
  2. `TotalPoints = RankingPoints (lookup RankingPointTable) + KillPoints × KillPointPerKill` (Computed Column DB)
  3. Cộng dồn theo các vòng
- **Bảng tổng kết:** Xếp hạng theo TotalPoints tích lũy toàn giải
- **API:** `POST /api/br/scores` | `GET /api/br/{tournamentId}/leaderboard`

#### UC-10.3: Thống kê tổng quan (Dashboard)
- **Actor:** Admin
- **Hiển thị:** Số giải Active/Registration; đội chờ duyệt; trận hôm nay; khiếu nại mở
- **API:** `GET /api/overview/stats`
- **Page:** `DashboardPage.tsx`

---

### FR-11: Lịch thi đấu

#### UC-11.1: Xem lịch thi đấu
- **Actor:** Tất cả
- **Nội dung:** Trận, Đội, Giờ thi đấu, Trạng thái, Map (FPS), Vòng
- **Lọc:** Theo Tournament; Theo ngày; Theo trạng thái
- **API:** `GET /api/matches?tournamentId={id}`
- **Page:** `MatchSchedulePage.tsx`

---

### FR-12: Thông báo In-App

#### UC-12.1: Gửi thông báo tự động
- **Trigger và nội dung:**
  | Sự kiện | Người nhận | Loại |
  |---|---|---|
  | Team được duyệt | Captain | Success |
  | Team bị từ chối | Captain | Warning |
  | Nhắc check-in (T-15min) | Captain | Action |
  | Walkover xảy ra | Captain bị thua | Warning |
  | Kết quả được xác nhận | Cả 2 Captain | Info |
  | Khiếu nại mới | Admin | Action |
  | Khiếu nại được giải quyết | Captain nộp | Info |
  | Hồ sơ đội mới chờ duyệt | Admin | Action |

#### UC-12.2: Quản lý thông báo
- **Actor:** Tất cả
- Bell icon hiển thị số thông báo chưa đọc
- Bấm → đánh dấu đã đọc
- **API:** `GET /api/notifications` | `PATCH /api/notifications/{id}/read` | `PATCH /api/notifications/read-all`
- **Page:** `NotificationsPage.tsx`

---

### FR-13: Audit Log

#### UC-13.1: Ghi nhật ký tự động
- **Trigger:** Mọi hành động Admin (CREATE, UPDATE, DELETE, APPROVE, REJECT, VERIFY, RESOLVE, LOCK...)
- **Thông tin ghi:** UserID, Action, Detail, Timestamp, AffectedEntity, AffectedEntityID, Result
- Không thể chỉnh sửa hoặc xóa AuditLog

#### UC-13.2: Admin xem nhật ký
- **Lọc:** Theo user; theo action; theo ngày; theo kết quả (Success/Failed)
- **API:** `GET /api/audit-log?userId=&action=&from=&to=`
- **Page:** `AuditLogPage.tsx`

---

### FR-14: Hỗ Trợ Đa Thể Loại Game

#### UC-14.1: Danh mục GameType & cơ chế

| GameType | Ví dụ | Format | Map Veto | Side Select | BR Scoring | MinPlayers | CheckIn |
|---|---|---|---|---|---|---|---|
| **MOBA** | LoL, DOTA 2, Liên Quân | SingleElimination | ❌ | ✅ | ❌ | 5 | 15 phút |
| **FPS** | VALORANT, CS2 | SingleElimination | ✅ | ❌ | ❌ | 5 | 15 phút |
| **BattleRoyale** | PUBG Mobile, Apex | BattleRoyale | ❌ | ❌ | ✅ | 4 | 30 phút |
| **Fighting** | Tekken 8, SF6 | SingleElimination | ❌ | ❌ | ❌ | 1 | 10 phút |
| **RTS** | StarCraft II, AoE IV | SingleElimination | ❌ (Map Pool) | ❌ | ❌ | 1 | 15 phút |
| **Sports** | EA FC 25, NBA 2K | SingleElimination | ❌ | ❌ | ❌ | 1 | 15 phút |

#### UC-14.2: Logic tự động theo GameType
```
Khi Admin chọn GameType → UI và API tự động điều chỉnh:
  MOBA         → hiện Side Selection UI; ẩn MapVeto; ẩn BR Scoring
  FPS          → hiện MapVeto UI; ẩn SideSelection; ẩn BR Scoring
  BattleRoyale → hiện BR Scoring UI; ẩn MapVeto; ẩn SideSelection
  Fighting     → ẩn tất cả UI đặc biệt; Best-of đơn giản
  RTS          → hiện MapPool (chọn map, không veto); ẩn các phần khác
  Sports       → ẩn tất cả; chỉ nhập Score
```

#### UC-14.3: Format thi đấu

| Format | Mô tả | Dùng cho |
|---|---|---|
| **SingleElimination** | Thua 1 = bị loại; bracket cây; BYE nếu số đội lẻ | MOBA, FPS, Fighting, RTS, Sports |
| **BattleRoyale** | Nhiều round; tích lũy điểm; Top N thắng | PUBG, Apex, BR games |

---

## 3. YÊU CẦU PHI CHỨC NĂNG (NFR)

### NFR-1: Bảo mật
| ID | Yêu cầu |
|---|---|
| NFR-1.1 | Mọi API endpoint (trừ `/api/auth/login`, `/api/health`, `/api/game-types`) phải có JWT Bearer token hợp lệ |
| NFR-1.2 | Mật khẩu hash bằng SHA-256 (hiện tại) hoặc BCrypt cost=12 (nâng cấp) — KHÔNG lưu plain text |
| NFR-1.3 | Mọi câu SQL dùng Parameterized Query — KHÔNG dùng string concatenation |
| NFR-1.4 | Validation input tại cả client (Zod schema) và server |
| NFR-1.5 | Evidence chỉ nhận URL — KHÔNG upload file lên server |
| NFR-1.6 | API chạy trên `localhost:5000` — không expose ra internet |
| NFR-1.7 | CORS chỉ cho phép origin từ Tauri WebView và localhost dev |
| NFR-1.8 | Khóa tài khoản sau 5 lần đăng nhập sai liên tiếp |
| NFR-1.9 | Session/JWT expire sau 30 phút không hoạt động |
| NFR-1.10 | Mọi Admin action được ghi vào `tblAuditLog` với Result = Success/Failed |

### NFR-2: Hiệu năng
| ID | Yêu cầu |
|---|---|
| NFR-2.1 | Dashboard load < 2 giây trên máy phần cứng từ 2015 trở lên |
| NFR-2.2 | Danh sách ≤ 200 hàng: API response < 500ms |
| NFR-2.3 | App khởi động (Tauri + .NET API warm-up) < 5 giây |
| NFR-2.4 | React bundle build < 500KB gzipped |
| NFR-2.5 | API không blocking — xử lý bất đồng bộ nơi cần thiết |

### NFR-3: Khả năng sử dụng
| ID | Yêu cầu |
|---|---|
| NFR-3.1 | Toàn bộ giao diện bằng tiếng Việt |
| NFR-3.2 | Dark theme mặc định theo thiết kế Figma |
| NFR-3.3 | Responsive cho màn hình tối thiểu 1280×800 |
| NFR-3.4 | Mỗi hành động quan trọng có confirmation dialog |
| NFR-3.5 | Loading spinner hiển thị khi API đang xử lý |
| NFR-3.6 | Toast notification cho mọi kết quả thao tác (Success/Error) |

### NFR-4: Tính tương thích & Khả năng mở rộng
| ID | Yêu cầu |
|---|---|
| NFR-4.1 | Chạy trên Windows 10+, macOS 12+, Ubuntu 22.04+ |
| NFR-4.2 | Đóng gói: `.msi` (Win) / `.dmg` (Mac) / `.deb`, `.AppImage` (Linux) |
| NFR-4.3 | Không yêu cầu cài .NET Runtime trên máy người dùng (self-contained) |
| NFR-4.4 | Dễ thêm GameType mới qua `tblGameTypeConfig` mà không cần sửa core |

### NFR-5: Độ tin cậy
| ID | Yêu cầu |
|---|---|
| NFR-5.1 | Mọi DB transaction có rollback khi lỗi |
| NFR-5.2 | API tự động retry 3 lần (delay 500ms) khi connection timeout |
| NFR-5.3 | AuditLog không được phép xóa hoặc sửa |
| NFR-5.4 | App hiển thị thông báo lỗi thân thiện; không lộ stack trace ra UI |

---

## 4. STACK CÔNG NGHỆ

| Thành phần | Công nghệ | Phiên bản |
|---|---|---|
| **Desktop Shell** | Tauri v2 | 2.x |
| **Frontend** | React + Vite + TypeScript | React 18, Vite 5, TS 5 |
| **UI** | shadcn/ui + Tailwind CSS | Tailwind 3.4 |
| **State** | Zustand | 4.x |
| **Form & Validate** | React Hook Form + Zod | — |
| **HTTP Client** | Axios | 1.x |
| **Router** | React Router | v7 |
| **Backend** | ASP.NET Core Minimal API | .NET 8 |
| **Data Access** | ADO.NET (SqlClient, raw SQL) | — |
| **Auth** | JWT Bearer | — |
| **Password** | SHA-256 / BCrypt.Net-Next | — |
| **Database** | SQL Server 2019+ | — |
| **Ngôn ngữ FE** | TypeScript | 5.x |
| **Ngôn ngữ BE** | C# | 12 |

---

## 5. KIẾN TRÚC HỆ THỐNG

```
┌──────────────────────────────────────────────────────────────┐
│  PRESENTATION TIER — React 18 (TypeScript) trong Tauri Shell │
│  15 Pages: Login | Dashboard | TournamentSetup | Team        │
│            BracketView | MatchSchedule | CheckIn | MapVeto   │
│            SideSelect | ResultSubmit | Leaderboard | Dispute  │
│            Notifications | AuditLog | UserManagement         │
│  Stack: shadcn/ui · Tailwind · Zustand · React Router 7       │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP REST (Axios, JWT Bearer, JSON)
┌────────────────────────▼─────────────────────────────────────┐
│  BUSINESS TIER — ASP.NET Core 8 Minimal API (localhost:5000) │
│  Handlers: Auth | Tournament | Team | Match | Result         │
│            Dispute | Notification | AuditLog | Overview      │
│  BUS: AuthBUS | TournamentBUS | TeamBUS | BracketBUS         │
│       MatchBUS | ResultBUS | DisputeBUS | NotificationBUS     │
│       LeaderboardBUS | AuditLogBUS                           │
│  Middleware: JWT · CORS · Error Handling                      │
└────────────────────────┬─────────────────────────────────────┘
                         │ ADO.NET SqlClient (Parameterized)
┌────────────────────────▼─────────────────────────────────────┐
│  DATA TIER — SQL Server 2019+  (ETMS_DB)                     │
│  17 Bảng | 14 Indexes | 1 Computed Column | 2 Stored Procs   │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. API ENDPOINTS ĐẦY ĐỦ

### Auth & Users
| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| POST | `/api/auth/login` | Tất cả | Đăng nhập, trả JWT |
| POST | `/api/auth/logout` | Auth | Đăng xuất |
| PATCH | `/api/auth/change-password` | Auth | Đổi mật khẩu |
| GET | `/api/health` | Public | Kiểm tra server |
| GET | `/api/users` | Admin | Danh sách user |
| POST | `/api/users` | Admin | Tạo user mới |
| PATCH | `/api/users/{id}/lock` | Admin | Khóa/mở tài khoản |
| PATCH | `/api/users/{id}/reset-password` | Admin | Reset mật khẩu |

### Tournaments
| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| GET | `/api/tournaments` | Auth | Danh sách giải đấu |
| POST | `/api/tournaments` | Admin | Tạo giải đấu |
| GET | `/api/tournaments/{id}` | Auth | Chi tiết giải |
| PATCH | `/api/tournaments/{id}` | Admin | Cập nhật thông tin |
| PATCH | `/api/tournaments/{id}/status` | Admin | Chuyển trạng thái |
| POST | `/api/tournaments/{id}/generate-bracket` | Admin | Tạo bracket |
| GET | `/api/tournaments/{id}/bracket` | Auth | Lấy bracket |
| GET | `/api/tournaments/{id}/leaderboard` | Auth | Bảng xếp hạng |
| GET | `/api/tournaments/{id}/game-config` | Auth | Lấy GameConfig |
| GET | `/api/game-types` | Public | Danh sách GameType |

### Teams & Players
| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| GET | `/api/teams?tournamentId=` | Auth | Danh sách đội |
| POST | `/api/teams` | Captain | Đăng ký đội |
| GET | `/api/teams/{id}` | Auth | Chi tiết đội |
| POST | `/api/teams/{id}/players` | Captain | Thêm thành viên |
| DELETE | `/api/teams/{id}/players/{playerId}` | Captain | Xóa thành viên |
| PATCH | `/api/teams/{id}/approve` | Admin | Duyệt đội |
| PATCH | `/api/teams/{id}/reject` | Admin | Từ chối đội |
| PATCH | `/api/teams/{id}/disqualify` | Admin | Loại đội |

### Matches
| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| GET | `/api/matches?tournamentId=` | Auth | Lịch thi đấu |
| GET | `/api/matches/{id}` | Auth | Chi tiết trận |
| POST | `/api/matches/{id}/checkin` | Captain | Check-in |
| POST | `/api/matches/{id}/veto` | Captain | Map veto (FPS) |
| POST | `/api/matches/{id}/side-select` | Captain | Chọn phe (MOBA) |
| POST | `/api/matches/{id}/result` | Captain | Nộp kết quả |
| PATCH | `/api/results/{id}/verify` | Admin | Xác nhận kết quả |
| PATCH | `/api/results/{id}/reject` | Admin | Từ chối kết quả |

### Battle Royale
| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| POST | `/api/br/rounds` | Admin | Tạo vòng BR |
| POST | `/api/br/scores` | Admin | Nhập điểm vòng BR |
| GET | `/api/br/{tournamentId}/leaderboard` | Auth | Bảng tổng điểm BR |

### Disputes, Notifications, Audit
| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| GET | `/api/disputes?tournamentId=` | Auth | Danh sách khiếu nại |
| POST | `/api/disputes` | Captain | Nộp khiếu nại |
| PATCH | `/api/disputes/{id}/resolve` | Admin | Giải quyết |
| GET | `/api/notifications` | Auth | Thông báo cá nhân |
| PATCH | `/api/notifications/{id}/read` | Auth | Đánh dấu đọc |
| PATCH | `/api/notifications/read-all` | Auth | Đọc tất cả |
| GET | `/api/audit-log` | Admin | Nhật ký kiểm toán |
| GET | `/api/overview/stats` | Admin | Thống kê Dashboard |

---

## 7. DATABASE — 17 BẢNG

> Script SQL đầy đủ: `ETMS.Api/Database/ETMS_DB.sql`

| # | Bảng | Mô tả | Quan hệ chính |
|---|---|---|---|
| 1 | `tblUser` | Tài khoản hệ thống | — |
| 2 | `tblGameTypeConfig` | Cấu hình cơ chế theo GameType (ref) | — |
| 3 | `tblTournament` | Giải đấu | FK: tblUser (CreatedBy), tblGameTypeConfig |
| 4 | `tblGameConfig` | Config game 1:1 với Tournament | FK: tblTournament |
| 5 | `tblTeam` | Đội tuyển | FK: tblTournament, tblUser (Captain) |
| 6 | `tblPlayer` | Thành viên đội | FK: tblTeam, tblUser |
| 7 | `tblMatch` | Trận đấu | FK: tblTournament, tblTeam (×4), tblMatch (NextMatchID) |
| 8 | `tblMatchResult` | Kết quả trận | FK: tblMatch, tblUser (Submitted/Verified) |
| 9 | `tblMapVeto` | Veto bản đồ (FPS) | FK: tblMatch, tblTeam |
| 10 | `tblSideSelect` | Chọn phe (MOBA) | FK: tblMatch, tblTeam |
| 11 | `tblBRRound` | Vòng Battle Royale | FK: tblTournament |
| 12 | `tblBRScore` | Điểm BR mỗi vòng | FK: tblBRRound, tblTeam; TotalPoints COMPUTED |
| 13 | `tblDispute` | Khiếu nại | FK: tblMatch, tblTeam, tblUser |
| 14 | `tblNotification` | Thông báo in-app | FK: tblUser |
| 15 | `tblAuditLog` | Nhật ký Admin | FK: tblUser |

**Trạng thái hợp lệ:**
- `tblTournament.Status`: Draft → Registration → Active → Completed | Cancelled
- `tblTeam.Status`: Pending → Approved | Rejected | Disqualified
- `tblMatch.Status`: Scheduled → CheckInOpen → Live → Completed | Walkover | WalkoverPending | Disputed | Postponed | Cancelled
- `tblMatchResult.Status`: PendingVerification → Verified | Disputed | Rejected
- `tblDispute.Status`: Open → Resolved | Dismissed

**Kết nối DB:**
```
appsettings.json (ConnectionStrings.ETMSConnection)
  → DBConnection.Configure(connStr) tại Program.cs startup
    → DBConnection.GetConnection() trong mỗi DAL method
      → using SqlConnection { ... } với Parameterized Query
```

---

## 8. XỬ LÝ LỖI

| Tầng | Lỗi | Xử lý |
|---|---|---|
| React (Client) | Network error | Toast "Không thể kết nối server" + nút Thử lại |
| React (Client) | 401 Unauthorized | Xóa token → redirect LoginPage |
| React (Client) | 403 Forbidden | Toast "Bạn không có quyền thực hiện" |
| React (Client) | Validation (Zod) | Hiển thị lỗi inline dưới field |
| API (Handler) | Business logic fail | HTTP 400 + `{ error: "message tiếng Việt" }` |
| API (Handler) | 500 Internal | Log lỗi + HTTP 500 + `{ error: "Lỗi hệ thống" }` (không lộ stack trace) |
| BUS | Vi phạm nghiệp vụ | Throw với message rõ ràng → Handler bắt → trả 400 |
| DAL | SqlException | Retry 3 lần → nếu vẫn fail → throw → Handler trả 500 |
| DAL | Connection fail | Log + trả 503 kèm message "DB không khả dụng" |

---

## 9. TIÊU CHÍ KIỂM THỬ

| Module | Loại test | Số lượng TC |
|---|---|---|
| Auth & User | Unit, Integration | 12 |
| Tournament | Unit, Integration | 10 |
| Team | Unit, Integration | 12 |
| Match + CheckIn | Unit, Integration | 8 |
| MapVeto + SideSelect | Unit | 6 |
| Result + Verify | Unit, Integration | 8 |
| Dispute | Unit, Integration | 6 |
| BR Scoring | Unit | 5 |
| Notification | Integration | 4 |
| AuditLog | Integration | 4 |
| Security | Penetration | 12 |
| **Tổng** | | **87 TCs** |

> Chi tiết trong `Document/Đặc tả/12_PCL_TestWorkbook.md`
