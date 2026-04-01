# ETMS — Esports Tournament Management System

<div align="center">

**Hệ thống Quản lý Giải đấu Esports**  
Ứng dụng desktop đa nền tảng dành cho tổ chức và vận hành các giải đấu thể thao điện tử chuyên nghiệp.

[![.NET 8](https://img.shields.io/badge/.NET-8.0-purple?logo=dotnet)](https://dotnet.microsoft.com/)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri)](https://tauri.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![SQL Server](https://img.shields.io/badge/SQL_Server-2019+-CC2927?logo=microsoftsqlserver)](https://www.microsoft.com/sql-server)

</div>

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Tính năng chức năng](#-tính-năng-chức-năng)
- [Cơ sở dữ liệu](#-cơ-sở-dữ-liệu)
- [API Endpoints](#-api-endpoints)
- [Vai trò người dùng](#-vai-trò-người-dùng)
- [Yêu cầu cài đặt](#-yêu-cầu-cài-đặt)
- [Hướng dẫn cài đặt & chạy](#-hướng-dẫn-cài-đặt--chạy)
- [Tài khoản mặc định](#-tài-khoản-mặc-định)
- [Tài liệu dự án](#-tài-liệu-dự-án)

---

## 🎮 Giới thiệu

ETMS (Esports Tournament Management System) là ứng dụng desktop được xây dựng theo kiến trúc **3 tầng (3-Layer Architecture)**, hỗ trợ tổ chức và vận hành giải đấu thể thao điện tử cho nhiều thể loại game:

| Thể loại | Ví dụ | Cơ chế đặc biệt |
|----------|-------|-----------------|
| **MOBA** (5v5) | League of Legends, DOTA 2, Liên Quân Mobile | Chọn phe Blue/Red |
| **FPS** (5v5) | VALORANT, CS2, Rainbow Six Siege | Map Veto & Map Pool |
| **Battle Royale** | PUBG, Apex Legends, Free Fire | Hệ thống điểm tích lũy |
| **Fighting** (1v1) | Tekken 8, Street Fighter 6 | Single Elimination |
| **RTS** | StarCraft II, Age of Empires IV | Map Pool |
| **Sports** | EA FC 25, Rocket League | Single Elimination |

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                    ETMS.Desktop (Frontend)                      │
│          Tauri v2 + React 18 + TypeScript + Vite                │
│  Login │ Dashboard │ Tournaments │ Teams │ Matches │ Disputes   │
│                   Users │ Notifications │ Audit Log             │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP REST (port 5126)
                           │ CORS: tauri://localhost, localhost:5173
┌──────────────────────────▼──────────────────────────────────────┐
│                    ETMS.Api (Backend)                           │
│              ASP.NET Core 8 — Minimal API                       │
│   Auth │ Overview │ Tournaments │ Teams │ Matches │ Results     │
│             Disputes │ Notifications │ Users │ Audit            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ (Project Reference)
┌──────────────────────────▼──────────────────────────────────────┐
│                   ETMS.Core (Business Logic)                    │
│              .NET 8 Class Library                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  BUS Layer  │  │  DAL Layer  │  │       DTO Layer         │  │
│  │ (Biz Logic) │  │(Data Access)│  │ (Data Transfer Objects) │  │
│  └─────────────┘  └──────┬──────┘  └─────────────────────────┘  │
└─────────────────────────-│──────────────────────────────────────┘
                           │ ADO.NET (Microsoft.Data.SqlClient)
┌──────────────────────────▼──────────────────────────────────────┐
│              SQL Server 2019+ — Database ETMS_DB                │
│   17 bảng + 14 indexes + 2 Stored Procedures                   │
│   Collation: Vietnamese_CI_AS                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Cấu trúc thư mục

```
Final/
├── README.md
├── logo.png                        # Logo ứng dụng
├── add-exclusion.ps1               # Script thêm exclusion Windows Defender
├── copy-logo.ps1                   # Script copy logo vào src-tauri
│
├── ETMS.Core/                      # Thư viện nghiệp vụ (.NET 8 Class Library)
│   ├── BUS/                        # Business Logic Layer
│   │   ├── AuthBUS.cs              #   Xác thực & Session management
│   │   ├── BracketBUS.cs           #   Tạo bracket, lên lịch trận đấu
│   │   ├── DisputeBUS.cs           #   Quản lý khiếu nại
│   │   ├── LeaderboardBUS.cs       #   Bảng xếp hạng Battle Royale
│   │   ├── MatchBUS.cs             #   Check-in, Map Veto, Side Selection
│   │   ├── ResultBUS.cs            #   Nộp & xác nhận kết quả trận
│   │   ├── TeamBUS.cs              #   Đăng ký & quản lý đội tuyển
│   │   └── TournamentBUS.cs        #   Vòng đời giải đấu (Draft→Completed)
│   ├── DAL/                        # Data Access Layer
│   │   ├── DBConnection.cs         #   Singleton kết nối SQL Server
│   │   ├── BracketDAL.cs           #   CRUD bracket & trận đấu
│   │   ├── CheckInDAL.cs           #   Check-in tuyển thủ trước trận
│   │   ├── DisputeDAL.cs           #   Lưu/lấy khiếu nại
│   │   ├── LeaderboardDAL.cs       #   Xếp hạng BR theo điểm tích lũy
│   │   ├── MatchDAL.cs             #   CRUD trận đấu, map veto, side select
│   │   ├── ResultDAL.cs            #   Kết quả trận & xác minh
│   │   ├── TeamDAL.cs              #   CRUD đội & tuyển thủ
│   │   ├── TournamentDAL.cs        #   CRUD giải đấu
│   │   └── UserDAL.cs              #   CRUD người dùng & đăng nhập
│   └── DTO/                        # Data Transfer Objects
│       ├── BracketNodeDTO.cs
│       ├── DisputeDTO.cs
│       ├── MapVetoDTO.cs
│       ├── MatchDTO.cs
│       ├── MatchResultDTO.cs
│       ├── PlayerDTO.cs
│       ├── TeamDTO.cs
│       ├── TournamentDTO.cs
│       └── UserDTO.cs
│
├── ETMS.Api/                       # ASP.NET Core 8 Minimal API
│   ├── Program.cs                  # Tất cả route registrations (30+ endpoints)
│   ├── appsettings.json            # Connection string & JWT settings
│   ├── ETMS.Api.csproj
│   ├── Handlers/                   # Request Handlers (thin controllers)
│   │   ├── AuthHandler.cs          #   POST /api/auth/login|logout
│   │   ├── AuditHandler.cs         #   GET /api/audit-log
│   │   ├── DisputeHandler.cs       #   GET/POST/PATCH disputes
│   │   ├── MatchHandler.cs         #   GET matches, check-in, veto, side
│   │   ├── NotificationHandler.cs  #   GET/PATCH notifications
│   │   ├── OverviewHandler.cs      #   GET stats & game types
│   │   ├── ResultHandler.cs        #   POST/PATCH match results
│   │   ├── TeamHandler.cs          #   GET/POST/PATCH teams
│   │   ├── TournamentHandler.cs    #   CRUD + advance status
│   │   └── UserHandler.cs          #   GET/POST/PATCH users (Admin)
│   └── Database/
│       ├── ETMS_DB.sql             # Script tạo toàn bộ DB + dữ liệu mẫu
│       └── seed_users.sql          # Script seed BCrypt password đúng
│
├── ETMS.Desktop/                   # Ứng dụng desktop (Tauri v2 + React)
│   ├── index.html
│   ├── package.json                # etms-desktop v1.0.0
│   ├── vite.config.ts              # Proxy /api → http://localhost:5126
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.tsx                # React entry point
│   │   ├── App.tsx                 # Router setup (8 protected routes)
│   │   ├── theme.ts                # Design tokens (màu, font, shadow)
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx     #   JWT session (sessionStorage)
│   │   │   └── ThemeContext.tsx    #   Theme provider
│   │   ├── components/
│   │   │   └── ProtectedRoute.tsx  #   Route guard cho authenticated users
│   │   ├── layouts/
│   │   │   └── MainLayout.tsx      #   Sidebar + Header navigation
│   │   └── pages/
│   │       ├── LoginPage.tsx       #   Màn hình đăng nhập (UI đầy đủ)
│   │       ├── DashboardPage.tsx   #   Overview stats & quick actions
│   │       ├── TournamentsPage.tsx #   CRUD giải đấu, advance status
│   │       ├── TeamsPage.tsx       #   Duyệt/từ chối đội tuyển
│   │       ├── MatchesPage.tsx     #   Lịch thi đấu & check-in
│   │       ├── DisputesPage.tsx    #   Xử lý khiếu nại
│   │       ├── NotificationsPage.tsx # Thông báo in-app
│   │       ├── UsersPage.tsx       #   Quản lý tài khoản (Admin)
│   │       ├── AuditLogPage.tsx    #   Nhật ký kiểm toán (Admin)
│   │       └── PlaceholderPages.tsx # Trang chờ (leaderboard, settings)
│   └── src-tauri/                  # Tauri native shell (Rust)
│
└── Document/                       # Tài liệu học thuật
    ├── Sơ đồ/                      # UML diagrams, ERD, Architecture
    └── Đặc tả/                     # SRS, Use Case specifications
```

---

## ✨ Tính năng chức năng

### 🔐 Xác thực & Bảo mật
- Đăng nhập với BCrypt hash (cost factor = 12) — `SRS NFR-1`
- Khóa tài khoản sau 5 lần nhập sai mật khẩu
- Session JWT lưu trong `sessionStorage` với timeout 8 giây
- RBAC (Role-Based Access Control): Admin / Captain / Player / Guest
- Audit log ghi lại toàn bộ thao tác Admin

### 🏆 Quản lý Giải đấu
- **Vòng đời giải đấu:** `Draft → Registration → Active → Completed`
- Hỗ trợ 4 thể thức thi đấu: SingleElimination, DoubleElimination, RoundRobin, BattleRoyale
- Cấu hình linh hoạt: Best of 1/3/5, số đội, số tuyển thủ/đội, thời hạn đăng ký
- Tạo bracket tự động theo loại giải

### 👥 Quản lý Đội & Tuyển thủ
- Đội trưởng (Captain) đăng ký đội thi đấu
- Admin duyệt/từ chối hồ sơ đội với lý do từ chối
- Quản lý danh sách tuyển thủ với InGameID
- Ràng buộc: 1 Captain chỉ được làm đội trưởng 1 đội/giải, tên đội unique/giải

### ⚔️ Quản lý Trận đấu
- **Luồng trạng thái:** `Scheduled → CheckInOpen → Live → Completed`
- Check-in 2 đội trước trận (thời gian cấu hình theo GameType)
- **Map Veto** cho FPS: Ban/Pick theo chuỗi tùy chỉnh
- **Side Selection** cho MOBA: Chọn phe Blue/Red
- Hỗ trợ Bye (đội đi thẳng không thi đấu) và Walkover

### 📊 Kết quả & Leaderboard
- Nộp kết quả kèm bằng chứng (EvidenceURL)
- Admin xác nhận (Verify) hoặc từ chối (Reject) kết quả
- Leaderboard Battle Royale: điểm xếp hạng + điểm kill (computed column)

### 📣 Khiếu nại (Disputes)
- Captain nộp khiếu nại theo 4 loại: HackCheat, WrongScore, UnauthorizedPlayer, Other
- Giới hạn 2 khiếu nại/Captain/giải — SLA 48 giờ xử lý
- Admin xử lý: Resolved / Dismissed với ghi chú

### 🔔 Thông báo In-app
- 5 loại thông báo: Info, Warning, Success, Error, Action
- Đánh dấu đã đọc từng thông báo hoặc tất cả
- Liên kết với thực thể liên quan (Match/Team/Tournament/Dispute)

### 👤 Quản lý Người dùng (Admin)
- Xem danh sách tất cả tài khoản
- Tạo tài khoản mới, khóa/mở khóa tài khoản
- Reset mật khẩu

---

## 🗄️ Cơ sở dữ liệu

**Database:** `ETMS_DB` | **Collation:** `Vietnamese_CI_AS` | **SQL Server 2019+**

### Sơ đồ bảng (17 bảng)

| # | Bảng | Mô tả |
|---|------|-------|
| 1 | `tblUser` | Tài khoản người dùng (Admin/Captain/Player/Guest) |
| 2 | `tblGameTypeConfig` | Cấu hình cơ chế theo loại game (reference table) |
| 3 | `tblTournament` | Giải đấu (vòng đời Draft→Completed) |
| 4 | `tblGameConfig` | Cấu hình game của từng giải (BestOf, MapPool, VetoSequence) |
| 5 | `tblTeam` | Đội tuyển (Pending→Approved/Rejected) |
| 6 | `tblPlayer` | Tuyển thủ (thành viên đội) |
| 7 | `tblMatch` | Trận đấu (có NextMatchID để liên kết bracket) |
| 8 | `tblMatchResult` | Kết quả trận (PendingVerification→Verified) |
| 9 | `tblMapVeto` | Lịch sử Ban/Pick bản đồ (FPS) |
| 10 | `tblSideSelect` | Chọn phe Blue/Red (MOBA) |
| 11 | `tblBRRound` | Vòng Battle Royale |
| 12 | `tblBRScore` | Điểm BR (TotalPoints = RankingPoints + KillPoints — Computed Column) |
| 13 | `tblDispute` | Khiếu nại (Open→Resolved/Dismissed) |
| 14 | `tblNotification` | Thông báo in-app |
| 15 | `tblAuditLog` | Nhật ký kiểm toán Admin |

> Ngoài ra còn có các bảng phụ trợ cho check-in và bracket.

### Stored Procedures
- `sp_GetDashboardStats` — Thống kê tổng quan cho Dashboard
- `sp_ResetAllPasswords` — Reset password hash (dùng khi test)

---

## 🔌 API Endpoints

Backend chạy mặc định tại `http://localhost:5126`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/health` | Health check + DB connection status |
| `POST` | `/api/auth/login` | Đăng nhập |
| `POST` | `/api/auth/logout` | Đăng xuất |
| `GET` | `/api/overview/stats` | Thống kê Dashboard |
| `GET` | `/api/game-types` | Danh sách loại game |
| `GET/POST` | `/api/tournaments` | Danh sách / Tạo giải đấu |
| `GET/PUT/DELETE` | `/api/tournaments/{id}` | Chi tiết / Cập nhật / Xóa giải |
| `PATCH` | `/api/tournaments/{id}/advance` | Chuyển trạng thái giải |
| `GET/POST` | `/api/teams` | Danh sách / Tạo đội |
| `PATCH` | `/api/teams/{id}/approve` | Duyệt đội |
| `PATCH` | `/api/teams/{id}/reject` | Từ chối đội |
| `GET` | `/api/matches` | Danh sách trận đấu |
| `POST` | `/api/matches/{id}/checkin` | Check-in đội |
| `POST` | `/api/matches/{id}/veto` | Nộp Map Veto |
| `POST` | `/api/matches/{id}/side-select` | Chọn phe |
| `POST` | `/api/matches/{id}/result` | Nộp kết quả |
| `PATCH` | `/api/results/{id}/verify` | Xác nhận kết quả |
| `PATCH` | `/api/results/{id}/reject` | Từ chối kết quả |
| `GET/POST` | `/api/disputes` | Khiếu nại |
| `PATCH` | `/api/disputes/{id}/resolve` | Xử lý khiếu nại |
| `GET` | `/api/notifications` | Lấy thông báo |
| `PATCH` | `/api/notifications/{id}/read` | Đánh dấu đã đọc |
| `PATCH` | `/api/notifications/read-all` | Đánh dấu tất cả đã đọc |
| `GET/POST` | `/api/users` | Quản lý người dùng (Admin) |
| `PATCH` | `/api/users/{id}/lock` | Khóa/mở khóa tài khoản |
| `POST` | `/api/users/{id}/reset-password` | Reset mật khẩu |
| `GET` | `/api/audit-log` | Xem nhật ký kiểm toán |

---

## 👤 Vai trò người dùng

| Vai trò | Quyền hạn |
|---------|-----------|
| **Admin** | Toàn quyền: quản lý giải đấu, duyệt đội, xác nhận kết quả, xử lý khiếu nại, quản lý tài khoản, xem audit log |
| **Captain** | Đăng ký đội thi đấu, quản lý tuyển thủ, nộp Map Veto, chọn phe, nộp kết quả, nộp khiếu nại |
| **Player** | Xem lịch thi đấu, kết quả, thông báo |
| **Guest** | Chỉ xem (read-only) |

---

## 📦 Yêu cầu cài đặt

### Backend & Core
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8) hoặc mới hơn
- [SQL Server 2019+](https://www.microsoft.com/sql-server) (Express miễn phí)
- SQL Server Management Studio (SSMS) để chạy script DB

### Frontend Desktop
- [Node.js](https://nodejs.org/) 18+ và npm
- [Rust](https://www.rust-lang.org/tools/install) (cho Tauri)
- [Tauri Prerequisites](https://tauri.app/start/prerequisites/) (Windows: Microsoft C++ Build Tools)

---

## 🚀 Hướng dẫn cài đặt & chạy

### Bước 1: Tạo Database

Mở SSMS, kết nối đến SQL Server instance của bạn, sau đó chạy:

```sql
-- Chạy toàn bộ script để tạo DB + dữ liệu mẫu
-- File: ETMS.Api/Database/ETMS_DB.sql
```

### Bước 2: Cấu hình Connection String

Chỉnh sửa `ETMS.Api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "ETMSConnection": "Server=<TÊN_SERVER>\\<TÊN_INSTANCE>;Database=ETMS_DB;Integrated Security=True;TrustServerCertificate=True;"
  }
}
```

> **Ví dụ:** `Server=DESKTOP-ABC\\MSSQLSERVER01;...`

**Hoặc** dùng biến môi trường:
```powershell
$env:ETMS_CONNECTION = "Server=...;Database=ETMS_DB;..."
```

### Bước 3: Chạy Backend API

```powershell
cd "E:\Công nghệ phần mềm\Final\ETMS.Api"
dotnet run
```

API sẽ khởi động tại `http://localhost:5126`.  
Kiểm tra: mở trình duyệt vào `http://localhost:5126/api/health`

### Bước 4: Seed Password BCrypt (lần đầu tiên)

Sau khi API đã chạy, gọi endpoint để seed đúng BCrypt hash:

```powershell
Invoke-RestMethod -Uri "http://localhost:5126/api/dev/seed-users" -Method POST
```

Hoặc mở trình duyệt/Postman gửi `POST http://localhost:5126/api/dev/seed-users`

### Bước 5: Chạy Frontend Desktop

```powershell
cd "E:\Công nghệ phần mềm\Final\ETMS.Desktop"
npm install
npm run dev        # Chạy trên trình duyệt (localhost:5173)
# Hoặc:
npm run tauri:dev  # Chạy ứng dụng Tauri native
```

---

## 🔑 Tài khoản mặc định

Sau khi chạy seed, các tài khoản mặc định:

| Tài khoản | Mật khẩu | Vai trò | Tên hiển thị |
|-----------|----------|---------|--------------|
| `admin` | `admin` | Admin | Quản trị viên hệ thống |
| `captain01` | `admin` | Captain | Nguyễn Văn Captain |
| `player01` | `admin` | Player | Trần Thị Player |

> ⚠️ **Lưu ý bảo mật:** Đổi mật khẩu ngay sau khi triển khai production.

---

## 📚 Tài liệu dự án

Tài liệu học thuật nằm trong thư mục `Document/`:

- **`Document/Sơ đồ/`** — UML Class Diagram, Sequence Diagram, ERD, Architecture Diagram
- **`Document/Đặc tả/`** — SRS (Software Requirements Specification), Use Case Specification

---

## 🛠️ Công nghệ sử dụng

### Backend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|---------|
| .NET | 8.0 | Runtime & SDK |
| ASP.NET Core | 8.0 | Web API framework (Minimal API) |
| Microsoft.Data.SqlClient | 6.0.1 | Kết nối SQL Server (ADO.NET) |
| BCrypt.Net-Next | 4.0.3 | Hash & verify mật khẩu |

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|---------|
| Tauri | 2.x | Desktop shell (Rust-based) |
| React | 18.3 | UI framework |
| TypeScript | 5.6 | Ngôn ngữ lập trình |
| Vite | 6.0 | Build tool & dev server |
| React Router | 7.1 | Client-side routing |

---

## 📝 Ghi chú phát triển

- **Kiến trúc 3 tầng** được tuân thủ nghiêm ngặt: GUI → BUS → DAL, không bỏ qua tầng
- **CORS** được cấu hình cho: `tauri://localhost`, `http://localhost:5173`, `http://localhost:4173`
- **BCrypt work factor = 12** theo chuẩn bảo mật SRS NFR-1
- **Audit Log** ghi tất cả Admin actions với timestamp, IP (dùng "localhost" cho ứng dụng desktop)
- **Computed Column** `TotalPoints = RankingPoints + KillPoints` trong `tblBRScore` được PERSISTED để tối ưu query
- **Linked List** pattern dùng `NextMatchID` trong `tblMatch` để quản lý bracket progression

---

<div align="center">

**Phát triển bởi nhóm sinh viên | Môn Công nghệ Phần mềm**

</div>
