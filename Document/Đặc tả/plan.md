# KẾ HOẠCH THỰC THI ĐỒ ÁN KỸ THUẬT PHẦN MỀM — v3.0
## Đề tài 11: Hệ thống Quản lý Giải đấu Esports (ETMS)
**Phiên bản:** 3.0 (Nâng cấp WPF/MVVM)
**Mô hình Kiến trúc:** 3-Layer (View/ViewModel – BUS – DAL) + MVVM Pattern
**Trường:** Đại học Tôn Đức Thắng – Khoa CNTT | **Môn:** Kỹ thuật Phần mềm (502045) – HK 2/2025-2026

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Mô tả hệ thống
ETMS là nền tảng **WPF Desktop Application (C#)** quản lý toàn bộ vòng đời giải đấu Esports: đăng ký đội → tạo bracket tự động → check-in → ghi nhận kết quả → vinh danh. Tối ưu cho **Single Elimination** và hỗ trợ **Battle Royale**.

### 1.2 Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | C# (.NET 8+) |
| **Giao diện** | **WPF — XAML + MVVM Pattern** |
| **UI Library** | **MaterialDesignThemes + MahApps.Metro** |
| **Icon Pack** | **Material Design Icons (XAML vector)** |
| Cơ sở dữ liệu | SQL Server 2019+ (16 bảng) |
| Kiến trúc | 3-Layer: View/ViewModel / BUS / DAL |
| **UI Pattern** | **MVVM (INotifyPropertyChanged + ICommand)** |
| Password hashing | BCrypt.Net-Next (cost factor 12) |
| Version Control | GitHub (Gitflow) |
| Quản lý dự án | Trello / GitHub Projects |
| Tài liệu | 14 file Markdown |
| UML Tool | Mermaid.js trong Markdown |

### 1.3 So sánh WPF vs WinForms (Lý do chuyển đổi)

| Tiêu chí | WinForms (cũ) | WPF (mới) |
|---|---|---|
| Rendering | GDI+ pixel-based | DirectX vector-based |
| UI Design | Kéo thả giới hạn | XAML — dark theme, gradient, animation |
| Data Binding | Thủ công, code-behind | Two-way binding tự động |
| Architecture | Event-driven | **MVVM** — testable, tách biệt rõ |
| Custom Controls | GDI+ phức tạp | ControlTemplate/DataTemplate |
| Libraries | Ít, cũ | MaterialDesign, MahApps, LiveCharts |
| Unit Test UI | Rất khó | ViewModel testable dễ dàng |

---

## 2. TÀI LIỆU ĐẶC TẢ ĐÃ HOÀN THÀNH (Specification Phase ✅)

> **Tất cả nằm trong thư mục:** `Document/Đặc tả/`

| # | File | Nội dung | Vai trò |
|---|---|---|---|
| — | `00_MASTER_INDEX.md` | Master index + checklist | Đọc trước tiên |
| — | `SRS_v2.md` | **Đặc tả chính v3.0** — 11 FR, 19 NFR, 16 bảng SQL | **THAM CHIẾU CHÍNH** |
| 01 | `01_UseCaseDiagram.md` | 25+ Use Cases | Phân tích nghiệp vụ |
| 02 | `02_ClassDiagram_v2.md` | 14 BUS + 15 DAL + 15 Views + 15 ViewModels | Thiết kế class |
| 03 | `03_ERD.md` | ERD + Data Dictionary | Database design |
| 04 | `04_SequenceDiagrams.md` | 8 Sequence Diagrams | Hành vi hệ thống |
| 05 | `05_StateDiagrams.md` | 6 State Diagrams | Trạng thái thực thể |
| 06 | `06_ActivityDiagrams.md` | 7 Activity Diagrams | Luồng nghiệp vụ |
| 08 | `08_SecurityThreatModel.md` | STRIDE + OWASP | Phân tích bảo mật |
| 09 | `09_ArchitectureDesign.md` | Component/DFD/Deployment | Kiến trúc chi tiết |
| 10 | `10_TraceabilityMatrix.md` | RTM: FR→UC→BUS/DAL→TC | Truy vết yêu cầu |
| 11 | `11_RiskRegister.md` | FMEA — 22 rủi ro | Quản lý rủi ro |
| 12 | `12_PCL_TestWorkbook.md` | 67 Test Cases | Kế hoạch kiểm thử |

---

## 3. KIẾN TRÚC HỆ THỐNG

### 3.1 Sơ đồ 3 lớp + MVVM

```
┌─────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER — 15 WPF Views (XAML) + 15 ViewModels        │
│  LoginView | DashboardView | TournamentSetupView | TeamMgmtView  │
│  BracketView | MatchScheduleView | CheckInView | MapVetoView     │
│  SideSelectView | ResultSubmitView | LeaderboardView              │
│  DisputeManageView | NotificationView | AuditLogView | UserMgmt  │
│  ────────────────────────────────────────────────────────────     │
│  MVVM Infrastructure: ViewModelBase | RelayCommand |              │
│  NavigationService | DialogService | AppTheme                      │
└───────────────────────┬─────────────────────────────────────────┘
                        │ DTO objects (via ViewModel → BUS calls)
┌───────────────────────▼─────────────────────────────────────────┐
│  BUS Layer — 14 Classes (KHÔNG THAY ĐỔI)                         │
│  AuthBUS | TournamentBUS | TeamBUS | BracketBUS | MatchBUS        │
│  CheckInBUS | MapVetoBUS | SideSelectBUS | ResultBUS              │
│  LeaderboardBUS | DisputeBUS | NotificationBUS | AuditLogBUS      │
│  SessionManager (Singleton)                                      │
└───────────────────────┬─────────────────────────────────────────┘
                        │ SQL Parameterized Queries
┌───────────────────────▼─────────────────────────────────────────┐
│  DAL Layer — 15 Classes  (KHÔNG THAY ĐỔI)                        │
│  DBConnection (Singleton) | UserDAL | TournamentDAL | etc.        │
└───────────────────────┬─────────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│  SQL Server Database — 14 Tables (KHÔNG THAY ĐỔI)                │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Database — 16 Bảng (Schema trong `Database/ETMS_DB.sql`)

> **Cập nhật v3.0:** Bổ sung `tblNotification` (thông báo in-app) và `tblGameConfig` (cấu hình game).
> 16 bảng + 13 indexes + 1 computed column + 5 UNIQUE constraints.
> Connection string đọc từ `appsettings.json` bằng `IConfiguration` (không dùng ConfigurationManager).

---

## 4. CẤU TRÚC PROJECT C# — v3.0

```
ETMS.Wpf/                                  # WPF Application Project
├── App.xaml / App.xaml.cs                  # Entry point, Theme resources
├── appsettings.json                       # Connection string
│
├── Views/                                 # XAML UI
│   ├── LoginView.xaml                     # Đăng nhập
│   ├── DashboardView.xaml                 # Sidebar + Content host
│   ├── TournamentSetupView.xaml           # Tạo/sửa Tournament + GameConfig
│   ├── TeamManagementView.xaml            # Đăng ký, xét duyệt
│   ├── BracketView.xaml                   # Render cây nhánh đấu (Canvas)
│   ├── MatchScheduleView.xaml             # Lên lịch + conflict
│   ├── CheckInView.xaml                   # Countdown, walkover
│   ├── MapVetoView.xaml                   # Ban/pick + timer 60s
│   ├── SideSelectView.xaml                # Blue/Red side
│   ├── ResultSubmitView.xaml              # Upload + validate
│   ├── LeaderboardView.xaml               # Bảng xếp hạng
│   ├── DisputeManageView.xaml             # Khiếu nại
│   ├── NotificationView.xaml              # Thông báo
│   ├── AuditLogView.xaml                  # Lịch sử Admin
│   └── UserManagementView.xaml            # Quản lý tài khoản
│
├── ViewModels/                            # MVVM ViewModels
│   ├── ViewModelBase.cs                   # INotifyPropertyChanged
│   ├── RelayCommand.cs                    # ICommand implementation
│   ├── LoginViewModel.cs
│   ├── DashboardViewModel.cs              # Navigation, badge
│   ├── TournamentSetupViewModel.cs
│   ├── TeamManagementViewModel.cs
│   ├── BracketViewModel.cs
│   ├── MatchScheduleViewModel.cs
│   ├── CheckInViewModel.cs
│   ├── MapVetoViewModel.cs
│   ├── SideSelectViewModel.cs
│   ├── ResultSubmitViewModel.cs
│   ├── LeaderboardViewModel.cs
│   ├── DisputeManageViewModel.cs
│   ├── NotificationViewModel.cs
│   ├── AuditLogViewModel.cs
│   └── UserManagementViewModel.cs
│
├── Services/                              # MVVM Services
│   ├── NavigationService.cs               # Page navigation
│   ├── DialogService.cs                   # MessageBox wrapper
│   └── ThemeService.cs                    # Dark/Light toggle
│
├── Themes/                                # WPF Resources
│   ├── DarkTheme.xaml                     # Color palette, brushes
│   ├── ControlStyles.xaml                 # Button, TextBox, DataGrid styles
│   └── Fonts.xaml                         # Typography
│
├── Converters/                            # WPF Value Converters
│   ├── BoolToVisibilityConverter.cs
│   ├── StatusToColorConverter.cs
│   └── RoleToMenuConverter.cs
│
├── Controls/                              # Custom WPF Controls
│   ├── StatCard.xaml                      # Dashboard stat card
│   ├── BracketTreeControl.xaml            # Bracket tree renderer
│   └── CountdownTimer.xaml                # Check-in/Veto timer
│
├── BUS/                                   # (Giữ nguyên 14 class)
├── DAL/                                   # (Giữ nguyên 15 class)
├── DTO/                                   # (Giữ nguyên 12 class)
├── Enums/                                 # (Giữ nguyên 12 enum)
├── Helpers/                               # (Giữ nguyên)
│
├── Database/
│   ├── ETMS_DB.sql                        # 16 bảng
│   └── ETMS_InsertSample.sql              # Dữ liệu mẫu
│
└── ETMS.Wpf.csproj                        # .NET 8 WPF project
```

---

## 5. PHÂN CÔNG NHIỆM VỤ — v3.0

| Thành viên | Layer / Nhiệm vụ | Ưu tiên |
|---|---|---|
| **SV A** | **Views (XAML) + ViewModels** — 15 Views, MVVM infrastructure, Themes, Custom Controls, Navigation, Dark Theme | Sprint 2 |
| **SV B** | **BUS** — 14 classes; BracketBUS (thuật toán cốt lõi); BCrypt; MapVetoBUS/SideSelectBUS; NotificationBUS | Sprint 2 |
| **SV C** | **DAL** — 15 classes; SQL schema 16 bảng; Indexes; Serializable Transaction; GameConfigDAL | Sprint 2 |

> **Quy tắc:** View chỉ bind vào ViewModel (không gọi BUS trực tiếp); ViewModel gọi BUS; BUS gọi DAL.

---

## 6. LỘ TRÌNH THỰC THI — v3.0

### ✅ Sprint 0: Specification (ĐÃ HOÀN THÀNH — 2026-03-24)
*(12 deliverables — xem Mục 2)*

---

### 🔵 Sprint 1: Thiết kế chi tiết & Chuẩn bị (Tuần 1–4)

#### Tuần 1–2: Setup & Database
- [ ] **SV C:** Tạo GitHub repo, Gitflow branches
- [ ] **SV C:** Chạy `ETMS_DB.sql` → tạo 16 bảng + 8 indexes
- [ ] **SV C:** `ETMS_InsertSample.sql` → dữ liệu mẫu
- [ ] **SV A:** Tạo VS solution `ETMS.Wpf.sln` với cấu trúc WPF project
- [ ] **SV A:** Setup NuGet: `MaterialDesignThemes`, `MahApps.Metro`, `MaterialDesignColors`
- [ ] **SV B:** Setup NuGet: `BCrypt.Net-Next`

#### Tuần 3–4: MVVM Foundation & Figma→XAML
- [ ] **SV A:** `ViewModelBase.cs` — INotifyPropertyChanged + SetProperty
- [ ] **SV A:** `RelayCommand.cs` — ICommand thay event handlers
- [ ] **SV A:** `NavigationService.cs` — điều hướng Views
- [ ] **SV A:** `DarkTheme.xaml` — dark esports palette (#121212, #1E1E2E, accent #3B82F6)
- [ ] **SV A:** `ControlStyles.xaml` — custom styles cho Button, TextBox, DataGrid
- [ ] **SV A:** Thiết kế `LoginView.xaml` và `DashboardView.xaml` (sidebar + content)
- [ ] **All:** Review `08_SecurityThreatModel.md`

---

### 🟡 Sprint 2: Lập trình (Tuần 5–10)

#### Phase 2A: Core Infrastructure (Tuần 5–6)
- [ ] **SV C:** `DBConnection.cs` — Singleton + connection string từ appsettings.json
- [ ] **SV C:** `UserDAL.cs` — đầy đủ với FailedLoginAttempts
- [ ] **SV C:** `TournamentDAL.cs`, `GameConfigDAL.cs`
- [ ] **SV B:** `SessionManager.cs` — Singleton + 30' timeout
- [ ] **SV B:** `AuthBUS.cs` — bcrypt verify, Login(), lock logic
- [ ] **SV A:** `LoginView.xaml` + `LoginViewModel.cs` — bind AuthBUS
- [ ] **SV A:** `DashboardView.xaml` + `DashboardViewModel.cs` — sidebar, badge, RBAC menu

#### Phase 2B: Team & Enrollment (Tuần 6–7)
- [ ] **SV C:** `TeamDAL.cs`, `BracketDAL.cs` (SaveBracket Transaction)
- [ ] **SV B:** `TeamBUS.cs` — ValidateTeamName, Disqualify
- [ ] **SV B:** `TournamentBUS.cs` — Create, SaveConfig
- [ ] **SV A:** `TeamManagementView.xaml` — LiveSearch (ICollectionView) + Approve/Reject
- [ ] **SV A:** `TournamentSetupView.xaml` — với tab GameConfig

#### Phase 2C: ★ Bracket Engine (Tuần 7–8)
- [ ] **SV B:** `BracketBUS.cs` — FisherYatesShuffle, Bye Logic, Strategy Pattern
- [ ] **SV A:** `BracketView.xaml` — **Canvas + DrawingVisual** render cây bracket
  - Line/polyline connectors giữa match nodes
  - DataTemplate cho mỗi match card
  - Zoom/pan support

#### Phase 2D: Match & Check-in (Tuần 8–9)
- [ ] **SV C:** `MatchDAL.cs`, `CheckInDAL.cs` — Serializable Transaction
- [ ] **SV B:** `MatchBUS.cs`, `CheckInBUS.cs` — WalkoverPending cases
- [ ] **SV A:** `MatchScheduleView.xaml` — lên lịch + conflict warning
- [ ] **SV A:** `CheckInView.xaml` — **DispatcherTimer** countdown
- [ ] **SV A:** `MapVetoView.xaml` — ban/pick grid + circular countdown 60s
- [ ] **SV A:** `SideSelectView.xaml` — coin flip animation + side buttons

#### Phase 2E: Result & Post-Tournament (Tuần 9–10)
- [ ] **SV C:** `ResultDAL.cs`, `LeaderboardDAL.cs`, `DisputeDAL.cs`, `NotificationDAL.cs`, `AuditLogDAL.cs`
- [ ] **SV B:** `ResultBUS.cs` — magic bytes, approve, override
- [ ] **SV B:** `LeaderboardBUS.cs`, `DisputeBUS.cs`, `NotificationBUS.cs`, `AuditLogBUS.cs`
- [ ] **SV A:** Remaining Views: `ResultSubmitView`, `LeaderboardView`, `DisputeManageView`, `NotificationView`, `AuditLogView`, `UserManagementView`

#### Integration (Tuần 10)
- [ ] **All:** Tích hợp 3 layer, test end-to-end
- [ ] **All:** Code Review qua Pull Request

---

### 🔴 Sprint 3: Kiểm thử & Hoàn thiện (Tuần 11–14)

*(Giữ nguyên nội dung Sprint 3 từ v2.0 — 67 TCs, 7 modules, fix bugs, demo)*

#### Tuần 11–12: Structured Testing
- [ ] Module 1–7: 67 Test Cases theo `12_PCL_TestWorkbook.md`

#### Tuần 13: Fix bugs & Optimize
- [ ] Sửa TCs fail, performance check

#### Tuần 14: Documentation & Demo
- [ ] AI Audit Log, Video Demo, Slide thuyết trình, Merge `main`

---

## 7. NuGet PACKAGES — v3.0

| Package | Version | Mục đích |
|---|---|---|
| `MaterialDesignThemes` | latest | Dark theme, UI components (Button, Card, Dialog) |
| `MaterialDesignColors` | latest | Color palette |
| `MahApps.Metro` | latest | Modern window chrome, Flyouts, HamburgerMenu |
| `BCrypt.Net-Next` | 4.0.3 | Password hashing (cost=12) |
| `Microsoft.Data.SqlClient` | 6.0+ | SQL Server connection |
| `CommunityToolkit.Mvvm` | latest | ViewModelBase, RelayCommand, ObservableObject |
| `LiveChartsCore.SkiaSharpView.WPF` | latest | (Optional) Charts cho dashboard |

---

## 8. TIÊU CHÍ NGHIỆM THU

### ✅ Kỹ thuật bắt buộc
- [ ] 3-Layer + MVVM triệt để
- [ ] Parameterized Query 100%
- [ ] bcrypt cost ≥ 10
- [ ] SQL Transaction Serializable (check-in)
- [ ] Bye Logic + Fisher-Yates Shuffle

### ✅ Kỹ thuật nâng cao
- [ ] **Dark theme Esports** (MaterialDesign)
- [ ] **XAML animations** (page transitions, countdown)
- [ ] **Magic Bytes** file validation
- [ ] **Session Timeout** 30' idle
- [ ] **Strategy Pattern** (IBracketStrategy)
- [ ] **WalkoverPending** case C
- [ ] **Notification System** + **Audit Log**
- [ ] **Map Veto** + **Side Selection** với countdown

### ✅ Quy trình & Tài liệu
- [ ] Gitflow + Pull Request
- [ ] PCL Workbook 67 TCs
- [ ] Video Demo + Slide

---

## 9. QUY TRÌNH GITFLOW

```
main ──────────────────────────────────── (production)
  ↑
develop ────────────────────────────────── (tích hợp)
  ↑        ↑         ↑        ↑
feature/  feature/  feature/ feature/
auth-vm   bracket   checkin  result
(SV A+B)  (SV B)    (SV C)   (SV B/C)
```

---

**© 2026 – FIT TDTU | Môn Kỹ thuật Phần mềm (502045) | ETMS v3.0**
