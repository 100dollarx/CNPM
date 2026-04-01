# KẾ HOẠCH THỰC THI ĐỒ ÁN KỸ THUẬT PHẦN MỀM
## Hệ thống Quản lý Giải đấu Esports — NEXORA (ETMS)
**Phiên bản:** 5.0 | **Ngày cập nhật:** 2026-04-02
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
| **Auth** | SHA-256 hash + JWT Bearer |
| **Localization** | LangContext (VI/EN toggle, localStorage persisted) |
| **Theming** | ThemeContext (Dark/Light toggle, localStorage persisted) |

### 1.3 Cấu trúc project thực tế

```
Final/
├── ETMS.Core/             Class Library — BUS (10) / DAL (10) / DTO (9) ✅
│   ├── BUS/
│   ├── DAL/
│   └── DTO/
├── ETMS.Api/              ASP.NET Core Minimal API ✅
│   ├── Handlers/          Auth | Tournament | Team | Match | Result | Dispute | Notification | AuditLog | Overview
│   ├── Database/
│   │   └── ETMS_DB.sql    Script 17 bảng + indexes + stored procs + sample data
│   ├── Program.cs
│   └── appsettings.json
├── ETMS.Desktop/          Electron.NET + React/Vite frontend ✅
│   ├── src/
│   │   ├── App.tsx                  # 16 routes registered
│   │   ├── contexts/                # Auth, Theme, Lang
│   │   ├── layouts/MainLayout.tsx   # Sidebar + top-right control bar
│   │   └── pages/                   # 16 pages (xem mục 3)
│   ├── public/logo.png
│   └── package.json
└── Document/Đặc tả/       Tài liệu dự án ✅
```

---

## 2. DANH SÁCH TÀI LIỆU ĐẶC TẢ

> Thư mục: `Document/Đặc tả/`

| File | Nội dung | Trạng thái |
|---|---|---|
| `SRS_v2.md` | Đặc tả yêu cầu — 14 FR, 5 NFR, 38 API, DB 17 bảng | ✅ v4.0 |
| `09_ArchitectureDesign.md` | Kiến trúc 3-tier, diagram, security | ✅ v4.0 |
| `plan.md` | Kế hoạch thực thi | ✅ v5.0 |
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

## 3. DANH SÁCH 16 PAGES (React)

| # | File | Chức năng | Route | Actor |
|---|---|---|---|---|
| 1 | `LoginPage.tsx` | Đăng nhập | `/login` | Tất cả |
| 2 | `DashboardPage.tsx` | Tổng quan thống kê | `/dashboard` | Admin |
| 3 | `TournamentsPage.tsx` | Tạo/quản lý giải đấu | `/tournaments` | Admin |
| 4 | `TeamsPage.tsx` | Đội tham dự + xét duyệt | `/teams` | Captain, Admin |
| 5 | `MatchesPage.tsx` | Lịch thi đấu | `/matches` | Tất cả |
| 6 | `DisputesPage.tsx` | Khiếu nại + xử lý | `/disputes` | Captain, Admin |
| 7 | `NotificationsPage.tsx` | Thông báo in-app | `/notifications` | Auth users |
| 8 | `UsersPage.tsx` | Quản lý tài khoản | `/users` | Admin |
| 9 | `AuditLogPage.tsx` | Nhật ký kiểm toán | `/audit-log` | Admin |
| 10 | `BracketViewPage.tsx` | Sơ đồ thi đấu (bracket) | `/tournaments/:id/bracket` | Tất cả |
| 11 | `LeaderboardPage.tsx` | Bảng xếp hạng | `/tournaments/:id/leaderboard` | Tất cả |
| 12 | `CheckInPage.tsx` | Check-in trước trận | `/matches/:id/check-in` | Captain |
| 13 | `MapVetoPage.tsx` | Veto bản đồ (FPS) | `/matches/:id/map-veto` | Captain |
| 14 | `SideSelectPage.tsx` | Chọn phe Blue/Red (MOBA) | `/matches/:id/side-select` | Captain |
| 15 | `ResultSubmitPage.tsx` | Nộp kết quả thi đấu | `/matches/:id/result` | Captain, Admin |
| 16 | `PlaceholderPages.tsx` | Trang tạm thời (fallback) | — | — |

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
| ETMS.Core — 10 BUS + 10 DAL + 9 DTO | net8.0, Microsoft.Data.SqlClient | ✅ |
| ETMS.Api — Program.cs, CORS, Health | `/api/health` + CORS localhost:5173 | ✅ |
| AuthHandler | `POST /api/auth/login` / `logout`, SHA-256 | ✅ |
| OverviewHandler | stats, game-types | ✅ |
| TournamentHandler | CRUD + `PATCH advance` | ✅ |
| TeamHandler | CRUD + approve/reject | ✅ |
| MatchHandler | `GET /api/matches`, checkin, veto, side-select | ✅ |
| ResultHandler | submit, verify, reject | ✅ |
| DisputeHandler | CRUD + resolve/dismiss | ✅ |
| NotificationHandler | `GET /api/notifications` + mark-read — **NotificationDAL thật** | ✅ |
| UserHandler | CRUD + lock/unlock + reset-password | ✅ |
| AuditHandler | `GET /api/audit-log` + phân trang + filter — **AuditLogDAL thật** | ✅ |
| MapVeto DAL | `SaveMapVeto()` → INSERT tblMapVeto | ✅ |
| SideSelection DAL | `SaveSideSelection()` → UPSERT tblSideSelection | ✅ |

---

### Sprint 2 — Frontend React ✅ HOÀN THÀNH
**Kết quả:** 16 pages, 57 modules build, 0 lỗi TypeScript

| Hạng mục | Trạng thái |
|---|---|
| Cấu trúc project Vite + React + TypeScript | ✅ |
| ThemeContext (Dark/Light, localStorage) | ✅ |
| LangContext (VI/EN toggle, localStorage) | ✅ |
| AuthContext (JWT, isAdmin) | ✅ |
| MainLayout — Sidebar + top-right header bar | ✅ |
| LoginPage — floating theme/lang toggles | ✅ |
| 9 pages core (Dashboard → AuditLog) | ✅ |
| 6 pages sub (Bracket, Leaderboard, CheckIn, MapVeto, Result, SideSelect) | ✅ |
| Light mode — tất cả tokens c.onSurface/c.onSurfaceVar/c.panelBorder | ✅ |
| Branding NEXORA — logo, màu đỏ chủ đạo | ✅ |
| Electron.NET shell | ✅ |

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
| Auth & User | AuthBUS, UserDAL, AuthHandler, UserHandler | LoginPage, UsersPage | ✅ |
| Tournament | TournamentBUS, TournamentDAL, TournamentHandler | TournamentsPage, BracketViewPage, LeaderboardPage | ✅ |
| Team | TeamBUS, TeamDAL, TeamHandler | TeamsPage | ✅ |
| Match | MatchBUS, MatchDAL, MatchHandler | MatchesPage, CheckInPage | ✅ |
| Veto & Side | MatchHandler sub-routes | MapVetoPage, SideSelectPage | ✅ |
| Result | ResultBUS, ResultDAL, ResultHandler | ResultSubmitPage | ✅ |
| Dispute | DisputeBUS, DisputeDAL, DisputeHandler | DisputesPage | ✅ |
| System | NotificationDAL, AuditLogDAL | NotificationsPage, AuditLogPage, DashboardPage | ✅ |

---

## 6. TIÊU CHÍ HOÀN THÀNH (Definition of Done)

| Tiêu chí | Mô tả | Trạng thái |
|---|---|---|
| ✅ Functional | 14 FR hoạt động đúng SRS | ✅ |
| ✅ API | 38 endpoints (37 thật + 1 mock AuditLog) | ⚠️ |
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
