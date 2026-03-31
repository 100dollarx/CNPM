# KẾ HOẠCH THỰC THI ĐỒ ÁN KỸ THUẬT PHẦN MỀM
## Hệ thống Quản lý Giải đấu Esports — ETMS
**Phiên bản:** 4.0 | **Ngày:** 2026-03-31
**Trường:** Đại học Tôn Đức Thắng – Khoa CNTT
**Môn:** Kỹ thuật Phần mềm (502045) – HK 2 / 2025–2026

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Mô tả hệ thống
ETMS là ứng dụng desktop đa nền tảng (Windows / macOS / Linux) để quản lý toàn bộ vòng đời giải đấu Esports: đăng ký đội → xét duyệt → tạo bracket → check-in → thi đấu → ghi nhận kết quả → vinh danh. Hỗ trợ 6 thể loại game (MOBA, FPS, BattleRoyale, Fighting, RTS, Sports) và 2 format thi đấu (Single Elimination, Battle Royale).

### 1.2 Stack Công nghệ

| Tầng | Công nghệ |
|---|---|
| **Desktop Shell** | Tauri v2 (native WebView, ~8MB) |
| **Frontend** | React 18 + Vite + TypeScript + Tailwind + shadcn/ui |
| **State / Form** | Zustand + React Hook Form + Zod |
| **HTTP** | Axios (JWT interceptor) |
| **Backend** | ASP.NET Core 8 Minimal API (BUS/DAL/DTO C#) |
| **Database** | SQL Server 2019+ — 17 bảng |
| **Auth** | SHA-256 hash + JWT Bearer |

### 1.3 Cấu trúc project

```
Final/
├── ETMS.Core/             Class Library — BUS (10) / DAL (10) / DTO (9)
│   ├── BUS/               Nghiệp vụ
│   ├── DAL/               Truy cập DB
│   └── DTO/               Data Transfer Objects
├── ETMS.Api/              ASP.NET Core Minimal API
│   ├── Handlers/          Auth | Tournament | Team | Match | Result | Dispute | Notification | AuditLog | Overview
│   ├── Database/
│   │   └── ETMS_DB.sql    Script 17 bảng + indexes + stored procs + sample data
│   ├── Program.cs
│   └── appsettings.json
├── ETMS.Desktop/          Tauri v2 Shell (cần tạo)
│   ├── src-tauri/         Rust entry + sidecar config
│   └── src/               React app (copy từ DesignUI/ETMSUI)
├── DesignUI/ETMSUI/       Figma reference — 15 React pages (shadcn/ui + Tailwind)
└── Document/Đặc tả/       Tài liệu dự án
```

---

## 2. DANH SÁCH TÀI LIỆU ĐẶC TẢ

> Thư mục: `Document/Đặc tả/`

| File | Nội dung | Trạng thái |
|---|---|---|
| `SRS_v2.md` | Đặc tả yêu cầu — 14 FR, 5 NFR, 38 API, DB 17 bảng | ✅ v4.0 |
| `09_ArchitectureDesign.md` | Kiến trúc 3-tier, diagram, security, sidecar | ✅ v4.0 |
| `plan.md` | Kế hoạch thực thi — sprint, phân công, DoD | ✅ v4.0 |
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
| `12_PCL_TestWorkbook.md` | 87 Test Cases (87 = Normal + Boundary + Security) | ✅ v3.0 |
| `ETMS.Api/Database/ETMS_DB.sql` | Script SQL v4.0 đầy đủ | ✅ v4.0 |

---

## 3. DANH SÁCH 15 PAGES (React)

| # | Page | Chức năng | Actor |
|---|---|---|---|
| 1 | `LoginPage.tsx` | Đăng nhập | Tất cả |
| 2 | `DashboardPage.tsx` | Tổng quan thống kê | Admin |
| 3 | `TournamentSetupPage.tsx` | Tạo/sửa giải đấu + GameConfig | Admin |
| 4 | `TeamManagementPage.tsx` | Đăng ký đội + quản lý thành viên + xét duyệt | Captain, Admin |
| 5 | `BracketViewPage.tsx` | Hiển thị bracket cây | Tất cả |
| 6 | `MatchSchedulePage.tsx` | Lịch thi đấu | Tất cả |
| 7 | `CheckInPage.tsx` | Check-in trước trận | Captain |
| 8 | `MapVetoPage.tsx` | Veto bản đồ (FPS) | Captain |
| 9 | `SideSelectPage.tsx` | Chọn phe Blue/Red (MOBA) | Captain |
| 10 | `ResultSubmitPage.tsx` | Nộp + xác nhận kết quả | Captain, Admin |
| 11 | `LeaderboardPage.tsx` | Bảng xếp hạng | Tất cả |
| 12 | `DisputeManagePage.tsx` | Khiếu nại + giải quyết | Captain, Admin |
| 13 | `NotificationsPage.tsx` | Thông báo in-app | Auth users |
| 14 | `AuditLogPage.tsx` | Nhật ký kiểm toán | Admin |
| 15 | `UserManagementPage.tsx` | Quản lý tài khoản | Admin |

---

## 4. KẾ HOẠCH SPRINT

### Sprint 0 — Đặc tả & Thiết kế ✅ DONE
**Thời gian:** Tuần 1–2 | **Kết quả:** Toàn bộ tài liệu đặc tả hoàn chỉnh

| Hạng mục | Trạng thái |
|---|---|
| SRS v4.0 (14 FR, 5 NFR, 38 APIs) | ✅ |
| Architecture Design v4.0 | ✅ |
| ERD — 17 bảng | ✅ |
| ETMS_DB.sql v4.0 (17 bảng + indexes + SPs + data) | ✅ |
| Use Case / Class / Sequence / State / Activity Diagrams | ✅ |
| Security Threat Model, Risk Register, Test Workbook | ✅ |
| React UI Design (15 pages, DesignUI/ETMSUI) | ✅ |

---

### Sprint 1 — Backend API Core
**Thời gian:** Tuần 3–4

#### Việc đã làm ✅
- [x] ETMS.Core (net8.0) — 8 BUS + 10 DAL + 9 DTO (Build OK)
- [x] ETMS.Api project — Swagger, CORS, Program.cs
- [x] DBConnection.Configure() từ appsettings.json
- [x] AuthHandler — `POST /api/auth/login`, `POST /api/auth/logout`
- [x] OverviewHandler — `GET /api/overview/stats`, `GET /api/game-types`
- [x] TournamentHandler — `GET/POST /api/tournaments`
- [x] TeamHandler — `GET/POST /api/teams`, `PATCH approve/reject`

#### Còn lại ⏳
- [ ] JWT Middleware thật (hiện dùng placeholder token)
- [ ] MatchHandler — `GET /api/matches`, `POST checkin/veto/side-select/result`
- [ ] ResultHandler — `PATCH verify/reject`
- [ ] DisputeHandler — `GET/POST /api/disputes`, `PATCH resolve`
- [ ] BRHandler — `POST /api/br/rounds`, `POST /api/br/scores`, `GET leaderboard`
- [ ] NotificationHandler — `GET`, `PATCH read/read-all`
- [ ] AuditLogHandler — `GET /api/audit-log`
- [ ] UserHandler — `GET/POST/PATCH /api/users`
- [ ] Error handling middleware (ErrorHandlingMiddleware.cs)

**Deliverable:** API đầy đủ 38 endpoints, test qua Swagger tại `http://localhost:5000/swagger`

---

### Sprint 2 — Frontend React + Tauri Integration
**Thời gian:** Tuần 5–6

- [ ] Copy `DesignUI/ETMSUI` → `ETMS.Desktop/src`
- [ ] Cài đặt dependencies: `npm install`
- [ ] Viết `lib/api.ts` — Axios wrapper với JWT interceptor tự động
- [ ] Cập nhật `AuthContext.tsx` → gọi `POST /api/auth/login` thật
- [ ] Kết nối từng Page với API tương ứng:
  - DashboardPage → `/api/overview/stats`
  - TournamentSetupPage → `/api/tournaments` + `/api/game-types`
  - TeamManagementPage → `/api/teams`
  - BracketViewPage → `/api/tournaments/{id}/bracket`
  - MatchSchedulePage → `/api/matches?tournamentId=`
  - CheckInPage → `/api/matches/{id}/checkin`
  - MapVetoPage → `/api/matches/{id}/veto`
  - SideSelectPage → `/api/matches/{id}/side-select`
  - ResultSubmitPage → `/api/matches/{id}/result`
  - LeaderboardPage → `/api/tournaments/{id}/leaderboard` + `/api/br/{id}/leaderboard`
  - DisputeManagePage → `/api/disputes`
  - NotificationsPage → `/api/notifications`
  - AuditLogPage → `/api/audit-log`
  - UserManagementPage → `/api/users`
- [ ] Setup Tauri v2 — `npx create-tauri-app` trong `ETMS.Desktop/`
- [ ] Cấu hình `tauri.conf.json`:
  - Window: title, size (1280×800), icon
  - Sidecar: `ETMS.Api.exe` khởi động cùng app
  - CSP: chỉ cho phép `http://localhost:5000`
- [ ] Cấu hình `vite.config.ts` — proxy `/api` → `http://localhost:5000`

**Deliverable:** App mở trong Tauri shell; luồng login → dashboard hoạt động end-to-end

---

### Sprint 3 — Integration, Test & Polish
**Thời gian:** Tuần 7

- [ ] End-to-end test luồng Single Elimination:
  - Tạo giải → Đăng ký đội → Duyệt đội → Tạo bracket → Check-in → Thi đấu → Kết quả → Leaderboard
- [ ] End-to-end test Battle Royale:
  - Tạo giải BR → Đăng ký → Nhập điểm mỗi vòng → Tổng kết
- [ ] Test Map Veto (FPS) và Side Selection (MOBA)
- [ ] Test Disputes + Notifications
- [ ] Error handling: loading states, toast, retry
- [ ] Notification polling (mỗi 30 giây tự động refresh bell icon)
- [ ] Responsive test trên 1280×800 và 1920×1080

**Deliverable:** App ổn định, không còn lỗi nghiêm trọng

---

### Sprint 4 — Build & Tài liệu cuối
**Thời gian:** Tuần 8

- [ ] Build production: `npm run tauri build`
- [ ] Tạo file cài đặt: `ETMS_Setup.msi` (Windows)
- [ ] Unit test BUS layer (xUnit) — tối thiểu 60% coverage
- [ ] Cập nhật README.md — hướng dẫn cài đặt, cấu hình DB
- [ ] Kiểm tra lại toàn bộ 87 Test Cases trong TestWorkbook
- [ ] Hoàn thiện báo cáo đồ án

**Deliverable:** File build hoạt động trên máy tính khác; báo cáo hoàn chỉnh

---

## 5. PHÂN CÔNG CÔNG VIỆC

| Module | Backend (C#) | Frontend (React) |
|---|---|---|
| Auth & User | AuthBUS, UserDAL, AuthHandler, UserHandler | LoginPage, UserManagementPage |
| Tournament | TournamentBUS, TournamentDAL, TournamentHandler | TournamentSetupPage, BracketViewPage |
| Team | TeamBUS, TeamDAL, TeamHandler | TeamManagementPage |
| Match | MatchBUS, MatchDAL, MatchHandler | MatchSchedulePage, CheckInPage |
| Veto & Side | Map/SideDAL, MatchHandler routes | MapVetoPage, SideSelectPage |
| Result | ResultBUS, ResultDAL, ResultHandler | ResultSubmitPage |
| Leaderboard | LeaderboardBUS, BRHandler | LeaderboardPage |
| Dispute | DisputeBUS, DisputeDAL, DisputeHandler | DisputeManagePage |
| System | NotificationBUS, AuditLogBUS, các handler | NotificationsPage, AuditLogPage, DashboardPage |

---

## 6. TIÊU CHÍ HOÀN THÀNH (Definition of Done)

| Tiêu chí | Mô tả |
|---|---|
| ✅ Functional | Tất cả 14 FR hoạt động đúng yêu cầu trong SRS |
| ✅ API | Tất cả 38 endpoints trả response đúng cấu trúc |
| ✅ Cross-Platform | Build và chạy được trên Windows 10+ |
| ✅ Database | 17 bảng, đúng constraints, indexes, dữ liệu mẫu |
| ✅ Security | JWT auth, SHA-256 hash, parameterized query |
| ✅ Performance | Dashboard load < 2s; API < 500ms |
| ✅ UI/UX | Dark theme, responsive 1280×800+, tiếng Việt |
| ✅ Documentation | SRS, Architecture, ERD, Diagrams hoàn chỉnh |
| ✅ Test | ≥ 60% coverage BUS layer; pass 80%+ test cases |

---

## 7. RỦI RO & PHÒNG NGỪA

| Rủi ro | Xác suất | Tác động | Phòng ngừa |
|---|---|---|---|
| SQL Server không kết nối | Trung | Cao | `DBConnection.TestConnection()` khi startup; thông báo rõ ràng |
| JWT token sai/hết hạn | Thấp | Cao | Axios interceptor tự redirect Login khi 401 |
| Tauri sidecar không khởi động | Thấp | Rất cao | Log khởi động; hiển thị dialog lỗi cụ thể |
| Số đội đăng ký < 2 khi tạo bracket | Thấp | Trung | BUS kiểm tra; UI disable nút nếu < 2 đội |
| Build Tauri thất bại trên OS khác | Trung | Trung | Test trên cả Windows; dùng GitHub Actions CI nếu có |
| Admin bấm nhầm duyệt/từ chối | Thấp | Trung | Confirmation dialog bắt buộc trước mọi thao tác irreversible |
