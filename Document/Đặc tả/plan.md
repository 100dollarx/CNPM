# KẾ HOẠCH THỰC THI ĐỒ ÁN KỸ THUẬT PHẦN MỀM
## Hệ thống Quản lý Giải đấu Esports — NEXORA (ETMS)
**Phiên bản:** 6.0 | **Ngày cập nhật:** 2026-04-05
**Trường:** Đại học Tôn Đức Thắng – Khoa CNTT
**Môn:** Kỹ thuật Phần mềm (502045) – HK 2 / 2025–2026

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Mô tả hệ thống
NEXORA (ETMS) là ứng dụng desktop để quản lý toàn bộ vòng đời giải đấu Esports: đăng ký đội → xét duyệt → tạo bracket → check-in → thi đấu → ghi nhận kết quả → vinh danh. Hỗ trợ 6 thể loại game (MOBA, FPS, BattleRoyale, Fighting, RTS, Sports) và 2 format thi đấu (Single Elimination, Battle Royale).

### 1.2 Stack Công nghệ thực tế

| Tầng | Công nghệ |
|---|---|
| **Desktop Shell** | Electron.NET (wrap ASP.NET Core + Chromium) |
| **Frontend** | React 18 + Vite + TypeScript (inline styles, Material Symbols) |
| **State** | React Context (AuthContext, ThemeContext, LangContext) |
| **HTTP** | Fetch API (proxy Vite `/api` → `localhost:5000`) |
| **Backend** | ASP.NET Core 8 Minimal API (BUS/DAL/DTO C#) |
| **Database** | SQL Server 2019+ — 17 bảng |
| **Auth** | BCrypt hash + JWT Bearer |
| **Email** | MailKit + MimeKit (SMTP Gmail) — activation, reset password |
| **Localization** | LangContext (VI/EN toggle, localStorage persisted) |
| **Theming** | ThemeContext (Dark/Light toggle, localStorage persisted) |

### 1.3 Cấu trúc project thực tế

```
Final/
├── ETMS.Core/             Class Library — BUS (8) / DAL (12) / DTO (9) / Services (1) ✅
│   ├── BUS/
│   ├── DAL/
│   ├── DTO/
│   └── Services/          EmailService (MailKit)
├── ETMS.Api/              ASP.NET Core Minimal API ✅
│   ├── Handlers/          Auth | Register | Tournament | Team | Match | Result | Dispute | Notification | AuditLog | Overview | User | BR
│   ├── Database/
│   │   └── ETMS_DB.sql    Script 17 bảng + indexes + stored procs
│   ├── Program.cs
│   └── appsettings.json
├── ETMS.Desktop/          React/Vite frontend (Tauri shell) ✅
│   ├── src/
│   │   ├── App.tsx                  # 20+ routes registered
│   │   ├── contexts/                # Auth, Theme, Lang, Toast
│   │   ├── layouts/MainLayout.tsx   # Sidebar + top-right control bar
│   │   └── pages/                   # 20 pages (xem mục 3)
│   ├── public/logo.png
│   └── package.json
└── Document/Đặc tả/       Tài liệu dự án ✅
```

---

## 2. DANH SÁCH TÀI LIỆU ĐẶC TẢ

> Thư mục: `Document/Đặc tả/`

| File | Nội dung | Trạng thái |
|---|---|---|
| `SRS_v2.md` | Đặc tả yêu cầu — 14 FR + 5 UC mới (auth), 5 NFR, 45+ API | ✅ v5.0 |
| `09_ArchitectureDesign.md` | Kiến trúc 3-tier, diagram, security | ✅ v4.0 |
| `plan.md` | Kế hoạch thực thi | ✅ v6.0 |
| `00_MASTER_INDEX.md` | Mục lục toàn bộ tài liệu | ✅ v4.0 |
| `01_UseCaseDiagram.md` | 25+ Use Cases | ✅ v3.0 |
| `02_ClassDiagram_v2.md` | BUS / DAL class diagram | ✅ v3.0 |
| `03_ERD.md` | ERD + Data Dictionary (17 bảng) | ✅ v3.0 |
| `04_SequenceDiagrams.md` | 8 Sequence Diagrams | ✅ v3.0 |
| `05_StateDiagrams.md` | 6 State Diagrams | ✅ v3.0 |
| `06_ActivityDiagrams.md` | 7 Activity Diagrams | ✅ v3.0 |
| `08_SecurityThreatModel.md` | STRIDE + OWASP — 18 threats | ✅ v3.0 |
| `10_TraceabilityMatrix.md` | RTM: FR → UC → BUS/DAL → Test | ✅ v3.0 |
| `11_RiskRegister.md` | FMEA — 22 rủi ro | ✅ v3.0 |
| `12_PCL_TestWorkbook.md` | 87 Test Cases | ✅ v3.0 |
| `ETMS.Api/Database/ETMS_DB.sql` | Script SQL v4.0 đầy đủ | ✅ v4.0 |
| `README.md` | Hướng dẫn cài đặt và chạy project | ✅ |

---

## 3. DANH SÁCH 20 PAGES (React)

| # | File | Chức năng | Route | Actor |
|---|---|---|---|---|
| 1 | `LoginPage.tsx` | Đăng nhập + Đăng ký + Quên MK | `/login` | Tất cả |
| 2 | `RegisterPage.tsx` | Trang đăng ký (redirect) | `/register` | Guest |
| 3 | `ActivatePage.tsx` | Kích hoạt tài khoản qua email | `/activate` | Guest |
| 4 | `ResetPasswordPage.tsx` | Đặt lại mật khẩu qua token | `/reset-password` | Tất cả |
| 5 | `DashboardPage.tsx` | Tổng quan thống kê | `/dashboard` | Admin |
| 6 | `TournamentsPage.tsx` | Tạo/quản lý giải đấu | `/tournaments` | Admin |
| 7 | `TeamsPage.tsx` | Đội tham dự + xét duyệt | `/teams` | Captain, Admin |
| 8 | `MatchesPage.tsx` | Lịch thi đấu | `/matches` | Tất cả |
| 9 | `DisputesPage.tsx` | Khiếu nại + xử lý | `/disputes` | Captain, Admin |
| 10 | `ProfilePage.tsx` | Thông tin cá nhân + chỉnh sửa | `/profile` | Auth users |
| 11 | `NotificationsPage.tsx` | Thông báo in-app | `/notifications` | Auth users |
| 12 | `UsersPage.tsx` | Quản lý tài khoản + xóa user | `/users` | Admin |
| 13 | `AuditLogPage.tsx` | Nhật ký kiểm toán | `/audit-log` | Admin |
| 14 | `BRScoringPage.tsx` | Nhập điểm Battle Royale | `/br-scoring` | Admin |
| 15 | `BracketViewPage.tsx` | Sơ đồ thi đấu (bracket) | `/tournaments/:id/bracket` | Tất cả |
| 16 | `LeaderboardPage.tsx` | Bảng xếp hạng | `/tournaments/:id/leaderboard` | Tất cả |
| 17 | `CheckInPage.tsx` | Check-in trước trận | `/matches/:id/check-in` | Captain |
| 18 | `MapVetoPage.tsx` | Veto bản đồ (FPS) | `/matches/:id/map-veto` | Captain |
| 19 | `SideSelectPage.tsx` | Chọn phe Blue/Red (MOBA) | `/matches/:id/side-select` | Captain |
| 20 | `ResultSubmitPage.tsx` | Nộp kết quả thi đấu | `/matches/:id/result` | Captain, Admin |

---

## 4. KẾ HOẠCH SPRINT

### Sprint 0 — Đặc tả & Thiết kế ✅ HOÀN THÀNH
**Kết quả:** Toàn bộ tài liệu đặc tả hoàn chỉnh

| Hạng mục | Trạng thái |
|---|---|
| SRS v4.0 (14 FR, 5 NFR, 38 APIs) | ✅ |
| Architecture Design v4.0 | ✅ |
| ERD — 17 bảng + ETMS_DB.sql | ✅ |
| Use Case / Class / Sequence / State / Activity Diagrams | ✅ |
| Security Threat Model, Risk Register, Test Workbook | ✅ |

---

### Sprint 1 — Backend API ✅ HOÀN THÀNH
**Kết quả:** ETMS.Core + ETMS.Api build sạch — **0 Warning, 0 Error**

| Hạng mục | Chi tiết | Trạng thái |
|---|---|---|
| ETMS.Core — 8 BUS + 12 DAL + 9 DTO | net8.0, Microsoft.Data.SqlClient | ✅ |
| ETMS.Api — Program.cs, CORS, Health | `/api/health` + CORS localhost:5173 | ✅ |
| AuthHandler | `POST /api/auth/login` / `logout`, BCrypt | ✅ |
| OverviewHandler | stats, game-types | ✅ |
| TournamentHandler | CRUD + `PATCH advance` | ✅ |
| TeamHandler | CRUD + approve/reject | ✅ |
| MatchHandler | `GET /api/matches`, checkin, veto, side-select | ✅ |
| ResultHandler | submit, verify, reject | ✅ |
| DisputeHandler | CRUD + resolve/dismiss | ✅ |
| NotificationHandler | `GET /api/notifications` + mark-read | ✅ |
| UserHandler | CRUD + lock/unlock + reset-password + delete + profile | ✅ |
| AuditHandler | `GET /api/audit-log` + phân trang + filter | ✅ |
| MapVeto DAL | `SaveMapVeto()` → INSERT tblMapVeto | ✅ |
| SideSelection DAL | `SaveSideSelection()` → UPSERT tblSideSelection | ✅ |

---

### Sprint 2 — Frontend React ✅ HOÀN THÀNH
**Kết quả:** 20 pages, 60+ modules build, 0 lỗi TypeScript

| Hạng mục | Trạng thái |
|---|---|
| Cấu trúc project Vite + React + TypeScript | ✅ |
| ThemeContext (Dark/Light, localStorage) | ✅ |
| LangContext (VI/EN toggle, localStorage) | ✅ |
| AuthContext (JWT, isAdmin) + ToastContext | ✅ |
| MainLayout — Sidebar + top-right header bar | ✅ |
| LoginPage — floating theme/lang toggles + đăng ký + quên MK | ✅ |
| 11 pages core (Dashboard → AuditLog + Profile + BRScoring) | ✅ |
| 6 pages sub (Bracket, Leaderboard, CheckIn, MapVeto, Result, SideSelect) | ✅ |
| 3 pages auth (Register, Activate, ResetPassword) | ✅ |
| Light mode — tất cả tokens + contrast tối ưu | ✅ |
| Branding NEXORA — logo, màu đỏ chủ đạo | ✅ |

---

### Sprint 2.5 — Auth Enhancement ✅ HOÀN THÀNH
**Mục tiêu:** Hoàn thiện hệ thống xác thực và quản lý tài khoản

| Hạng mục | Chi tiết | Trạng thái |
|---|---|---|
| Đăng ký qua Email | RegisterHandler + EmailService + ActivatePage | ✅ |
| Email Activation | SMTP Gmail + HTML template + idempotent activation | ✅ |
| Quên mật khẩu | ForgotPassword + ResetPasswordByToken + ResetPasswordPage | ✅ |
| Trang thông tin cá nhân | ProfilePage + GET/PATCH /api/auth/profile + Phone field | ✅ |
| Xóa tài khoản (Admin) | DELETE /api/users/{id} + transactional FK cleanup | ✅ |
| Xóa tài khoản (Self) | POST /api/auth/delete-account + password verification | ✅ |
| Gửi lại link kích hoạt | POST /api/users/{id}/resend-activation | ✅ |
| Ràng buộc đăng ký đội | Tên đội unique/giải, InGameID unique/đội+giải, length validation | ✅ |
| Race condition fix | AbortController + idempotent token handling (React 18 Strict Mode) | ✅ |
| Type mismatch fix | SqlDbType.VarChar explicit cho token params (Vietnamese_CI_AS collation) | ✅ |

---

### Sprint 3 — Integration Test & Polish ⏳ CẦN LÀM
**Mục tiêu:** End-to-end test các luồng nghiệp vụ chính

- [ ] Test luồng Single Elimination:
  - Tạo giải → Đăng ký đội → Duyệt đội → Check-in → Ghi kết quả → Leaderboard
- [ ] Test Battle Royale (nhập điểm từng vòng)
- [ ] Test Map Veto (FPS) và Side Selection (MOBA)
- [ ] Test Disputes + Notifications
- [ ] Notification polling mỗi 30 giây (bell icon)
- [ ] Responsive test: 1280×800 và 1920×1080
- [ ] Error handling: loading states, toast, retry
- [ ] Test luồng auth mới: Đăng ký → Email → Kích hoạt → Đăng nhập → Profile → Đổi MK
- [ ] Test quên MK: Quên → Email → Link → Đặt lại → Đăng nhập
- [ ] Test xóa tài khoản (Admin + Self)

**Deliverable:** App ổn định, không còn lỗi nghiêm trọng

---

### Sprint 4 — Build & Tài liệu cuối ⏳ CẦN LÀM
**Mục tiêu:** Hoàn thiện build và báo cáo

- [ ] Build production Electron (`npm run build`)
- [ ] Unit test BUS layer (xUnit) — ≥ 60% coverage
- [ ] Kiểm tra lại 87 Test Cases trong TestWorkbook
- [ ] Hoàn thiện báo cáo đồ án
- [ ] **Bảo mật:** Đổi `ETMS_JWT_Secret_Key` trong `appsettings.json` trước khi nộp

**Deliverable:** File build + báo cáo hoàn chỉnh

---

## 5. PHÂN CÔNG CÔNG VIỆC

| Module | Backend (C#) | Frontend (React) | Trạng thái |
|---|---|---|---|
| Auth & User | AuthBUS, UserDAL, AuthHandler, UserHandler, RegisterHandler | LoginPage, RegisterPage, UsersPage, ProfilePage | ✅ |
| Email & Activation | EmailService (MailKit), RegisterHandler | ActivatePage, ResetPasswordPage | ✅ |
| Tournament | TournamentBUS, TournamentDAL, TournamentHandler | TournamentsPage, BracketViewPage, LeaderboardPage | ✅ |
| Team | TeamBUS, TeamDAL, TeamHandler | TeamsPage | ✅ |
| Match | MatchBUS, MatchDAL, MatchHandler | MatchesPage, CheckInPage | ✅ |
| Veto & Side | MatchHandler sub-routes | MapVetoPage, SideSelectPage | ✅ |
| Result | ResultBUS, ResultDAL, ResultHandler | ResultSubmitPage | ✅ |
| Dispute | DisputeBUS, DisputeDAL, DisputeHandler | DisputesPage | ✅ |
| System | NotificationDAL, AuditLogDAL | NotificationsPage, AuditLogPage, DashboardPage | ✅ |
| BR Scoring | BRHandler | BRScoringPage | ✅ |

---

## 6. TIÊU CHÍ HOÀN THÀNH (Definition of Done)

| Tiêu chí | Mô tả | Trạng thái |
|---|---|---|
| ✅ Functional | 14 FR + 5 UC auth mới hoạt động đúng SRS | ✅ |
| ✅ API | 45+ endpoints (tất cả thật, không mock) | ✅ |
| ✅ Desktop | Build và chạy trên Windows 10+ | ✅ |
| ✅ Database | 17 bảng, constraints, indexes, sample data | ✅ |
| ✅ Security | JWT auth, SHA-256, parameterized query | ✅ |
| ✅ UI/UX | Dark/Light mode, VI/EN, responsive ≥ 1280px | ✅ |
| ✅ Documentation | SRS, Architecture, ERD, Diagrams | ✅ |
| ✅ Test | ≥ 60% BUS coverage; pass 80%+ test cases | ⏳ |

---

## 7. RỦI RO & PHÒNG NGỪA

| Rủi ro | Xác suất | Tác động | Phòng ngừa |
|---|---|---|---|
| SQL Server không kết nối | Trung | Cao | `DBConnection.TestConnection()` khi startup |
| JWT token hết hạn | Thấp | Cao | Redirect về /login khi 401 |
| AuditLog mock chưa có backend thật | Cao | Thấp | Đánh dấu rõ trong UI; ưu tiên Sprint 4 |
| JWT secret bị lộ | Thấp | Rất cao | Đổi trước khi nộp báo cáo |
| Admin thao tác nhầm | Thấp | Trung | Confirmation dialog trước mọi thao tác irreversible |
