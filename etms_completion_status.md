# ETMS — Báo Cáo Tiến Độ Hoàn Thiện Đồ Án
**Ngày phân tích:** 2026-04-05 · **Phiên bản SRS đối chiếu:** v4.0

---

## TỔNG QUAN

Đã duyệt toàn bộ **17 trang frontend**, **10 handler backend**, **8 BUS**, **12 DAL**, và **9 DTO** so sánh với **14 FR** và **5 NFR** trong SRS v4.0.

### Bảng Tiến Độ Nhanh

| Mức | Mô tả | Số lượng |
|-----|--------|----------|
| ✅ | Hoàn thiện / Hoạt động tốt | 8 module |
| ⚠️ | Có nhưng thiếu logic hoặc chưa tích hợp đầy đủ | 6 module |
| ❌ | Chưa triển khai | 4 tính năng |

---

## ✅ ĐÃ HOÀN THIỆN (8/18)

| # | Module (SRS) | Frontend | Backend | Ghi chú |
|---|---|---|---|---|
| 1 | **FR-1: Đăng nhập / Đăng xuất** (UC-1.1, 1.2) | `LoginPage.tsx` ✅ | `AuthHandler.cs` ✅ | JWT + BCrypt + Khóa sau 5 lần |
| 2 | **FR-1: Đổi mật khẩu** (UC-1.3) | Modal trong `MainLayout` ✅ | `AuthHandler.ChangePassword` ✅ | Validate ≥8 ký tự, chữ hoa, số |
| 3 | **FR-2: Tạo Giải Đấu** (UC-2.1) | `TournamentsPage.tsx` ✅ | `TournamentHandler.Create` ✅ | 6 GameType, game selection |
| 4 | **FR-2: Chỉnh sửa giải** (UC-2.2) | Modal Edit ✅ | `TournamentHandler.Update` ✅ | Mới sửa: cho phép đổi GameType |
| 5 | **FR-2: Chuyển trạng thái** (UC-2.3) | Nút Advance/Cancel ✅ | `TournamentHandler.AdvanceStatus` ✅ | Draft→Registration→Active→Completed |
| 6 | **FR-3: Đăng ký đội** (UC-3.1) | `TeamsPage.tsx` ✅ | `TeamHandler.Create` ✅ | Captain đăng ký + thêm thành viên |
| 7 | **FR-3: Xét duyệt đội** (UC-3.2, 3.3) | TeamsPage ✅ | `TeamHandler.Approve/Reject/Disqualify` ✅ | Admin duyệt, từ chối, loại |
| 8 | **FR-10: BR Scoring** (UC-10.2) | `BRScoringPage.tsx` ✅ | `BRHandler.cs` ✅ | Tạo vòng, nhập điểm, leaderboard |

---

## ⚠️ CÓ NHƯNG THIẾU LOGIC QUAN TRỌNG (6/18)

### 1. FR-4: Tạo Bracket — ⚠️ **Thiếu hiển thị trực quan**

| Thành phần | Trạng thái | Vấn đề |
|---|---|---|
| API `generate-bracket` | ✅ Hoạt động | `BracketBUS.cs` tạo đúng cây loại trực tiếp + BYE |
| `BracketViewPage.tsx` | ⚠️ Cơ bản | Chỉ hiển thị danh sách trận dạng bảng — **chưa vẽ cây bracket trực quan** dạng hình nhánh cây (tree) như SRS yêu cầu |

> [!IMPORTANT]
> **SRS UC-4.2:** "Hiển thị cây bracket dạng visual" — hiện tại chỉ là danh sách flat, cần nâng cấp thành interactive bracket tree.

---

### 2. FR-5: Check-in Trận đấu — ⚠️ **Thiếu cửa sổ thời gian**

| Thành phần | Trạng thái | Vấn đề |
|---|---|---|
| `CheckInPage.tsx` | ✅ UI đẹp | Captain bấm check-in 2 đội |
| `MatchBUS.ConfirmCheckIn` | ⚠️ Thiếu | **Không có logic mở/đóng check-in tự động** theo `DefaultCheckInMinutes` |
| Walkover xử lý | ❌ Thiếu | Không tự set Walkover khi chỉ 1 đội check-in, không có `WalkoverPending` |

> [!WARNING]
> **SRS UC-5.3:** Cần background job hoặc scheduled check để tự động chuyển Walkover khi hết thời gian check-in.

---

### 3. FR-8: Nộp & Xác nhận Kết quả — ⚠️ **Thiếu JWT auth ở handler**

| Thành phần | Trạng thái | Vấn đề |
|---|---|---|
| `ResultSubmitPage.tsx` | ✅ | Nhập score + upload evidence + verify/reject |
| `ResultHandler.Submit` | ⚠️ | **Không gọi `SetCurrentUserFromToken`** → `Session.CurrentUser = null` → `SubmittedBy = 0` |
| `ResultHandler.Verify/Reject` | ⚠️ | **Không gọi `SetCurrentUserFromToken`** → `Session.IsAdmin = false` → luôn trả 403 |
| Bracket auto-advance | ✅ | `SetWinnerAndAdvance` đã đẩy winner lên `NextMatchID` |

> [!CAUTION]
> **Bug nghiêm trọng:** `ResultHandler.cs` không truyền JWT context → Admin không thể verify kết quả qua API.

---

### 4. FR-9: Khiếu nại — ⚠️ **Thiếu giới hạn 2 lần/Captain/giải**

| Thành phần | Trạng thái | Vấn đề |
|---|---|---|
| `DisputesPage.tsx` | ✅ | UI đầy đủ: tạo, xem, resolve, dismiss |
| `DisputeHandler.cs` | ⚠️ | **Không kiểm tra** giới hạn 2 khiếu nại/Captain/giải đấu (SRS UC-9.1) |
| SLA 48h | ❌ | Không có thông báo cảnh báo khi sắp hết SLA |

---

### 5. FR-10: Dashboard — ⚠️ **Thiếu số liệu trận hôm nay**

| Thành phần | Trạng thái | Vấn đề |
|---|---|---|
| `DashboardPage.tsx` | ✅ | 4 card thống kê + chart |
| `OverviewHandler.GetStats` | ⚠️ | Cần kiểm tra có trả đúng: giải Active, đội chờ duyệt, **trận hôm nay** (SRS UC-10.3) |

---

### 6. FR-1: Admin quản lý tài khoản — ⚠️ **Thiếu phân vai (Role)**

| Thành phần | Trạng thái | Vấn đề |
|---|---|---|
| `UsersPage.tsx` | ✅ | Tạo user, khóa/mở, reset password |
| `UserHandler.CreateUser` | ⚠️ | **Không truyền Role** khi tạo user — mặc định là gì? |
| Delete user | ❌ | **SRS yêu cầu** xóa tài khoản + ràng buộc không xóa Admin duy nhất |

---

## ❌ CHƯA TRIỂN KHAI (4 tính năng quan trọng)

### 1. FR-12: Thông báo tự động — ❌ **Chưa tích hợp**

> [!CAUTION]
> **Đây là thiếu sót lớn nhất.** `NotificationDAL.Insert()` **không được gọi ở bất kỳ đâu** trong business logic.

**SRS yêu cầu 8 trigger tự động:**

| Sự kiện | Người nhận | Trạng thái |
|---|---|---|
| Team được duyệt | Captain | ❌ `TeamHandler.Approve` không gửi |
| Team bị từ chối | Captain | ❌ `TeamHandler.Reject` không gửi |
| Nhắc check-in (T-15min) | Captain | ❌ Không có scheduled job |
| Walkover xảy ra | Captain | ❌ Không có logic walkover |
| Kết quả được xác nhận | 2 Captain | ❌ `ResultHandler.Verify` không gửi |
| Khiếu nại mới | Admin | ❌ `DisputeHandler.Create` không gửi |
| Khiếu nại giải quyết | Captain | ❌ `DisputeHandler.Resolve` không gửi |
| Đội mới chờ duyệt | Admin | ❌ `TeamHandler.Create` không gửi |

**Cần làm:** Thêm `new NotificationDAL().Insert(...)` vào mỗi handler/BUS liên quan.

---

### 2. FR-13: Audit Log — ❌ **Chỉ ghi ở UserHandler**

`AuditLogDAL.Write()` chỉ được gọi **1 lần duy nhất** trong `UserHandler.cs`. SRS yêu cầu ghi cho **mọi hành động Admin**:

| Hành động | Cần ghi Audit | Hiện tại |
|---|---|---|
| Tạo/sửa giải đấu | ✅ | ❌ Chưa |
| Chuyển trạng thái giải | ✅ | ❌ Chưa |
| Duyệt/từ chối đội | ✅ | ❌ Chưa |
| Xác nhận/từ chối kết quả | ✅ | ❌ Chưa |
| Giải quyết khiếu nại | ✅ | ❌ Chưa |
| Tạo vòng BR / Nhập điểm | ✅ | ❌ Chưa |
| Khóa/mở/reset user | ✅ | ✅ Có |

**Cần làm:** Thêm `new AuditLogDAL().Write(...)` vào tất cả handler có quyền Admin.

---

### 3. FR-11: Lịch thi đấu — ❌ **Thiếu Admin lên lịch**

| Thành phần | Trạng thái | Vấn đề |
|---|---|---|
| `MatchesPage.tsx` | ✅ | Hiển thị danh sách trận + filter theo giải |
| Admin schedule | ⚠️ | Có route `PATCH /api/matches/{id}/schedule` nhưng **frontend chưa có UI** để lên lịch |
| Lọc theo ngày | ❌ | Frontend chưa có date filter |

---

### 4. NFR-1.1: JWT Middleware toàn cục — ❌ **Không bảo vệ GET endpoints**

> [!WARNING]
> **Các endpoint GET** (tournaments, teams, matches, notifications) **không yêu cầu JWT** — bất kỳ ai cũng truy cập được. SRS NFR-1.1 yêu cầu JWT cho **mọi endpoint** trừ `/api/auth/login`, `/api/health`, `/api/game-types`.

**Hiện tại chỉ có POST/PATCH gọi `SetCurrentUserFromToken`**, GET thì bypass hoàn toàn.

---

## 📋 DANH SÁCH CÔNG VIỆC THEO ĐỘ ƯU TIÊN

### 🔴 Ưu tiên Cao (Ảnh hưởng demo / chấm điểm)

| # | Việc cần làm | File cần sửa | Ước lượng |
|---|---|---|---|
| 1 | **Fix `ResultHandler` thiếu JWT auth** | `ResultHandler.cs` | 10 phút |
| 2 | **Tích hợp Notification tự động** (8 trigger) | Tất cả Handler + BUS | 45 phút |
| 3 | **Tích hợp Audit Log** cho mọi Admin action | Tất cả Handler | 30 phút |
| 4 | **Bracket View trực quan** (dạng cây nhánh) | `BracketViewPage.tsx` | 2-3 giờ |

### 🟡 Ưu tiên Trung (SRS compliance)

| # | Việc cần làm | File cần sửa | Ước lượng |
|---|---|---|---|
| 5 | Thêm check-in window auto (thời gian mở/đóng) | `MatchBUS.cs`, `CheckInDAL.cs` | 1 giờ |
| 6 | Xử lý Walkover tự động | `MatchBUS.cs` | 1 giờ |
| 7 | Giới hạn 2 khiếu nại/Captain/giải | `DisputeHandler.cs` | 15 phút |
| 8 | JWT middleware toàn cục cho GET endpoints | `Program.cs` – middleware | 30 phút |
| 9 | Admin UI lên lịch trận từ MatchesPage | `MatchesPage.tsx` | 30 phút |
| 10 | Xóa user + ràng buộc xóa Admin cuối | `UserHandler.cs`, `UserDAL.cs` | 20 phút |

### 🟢 Ưu tiên Thấp (Polish / NFR)

| # | Việc cần làm | File cần sửa | Ước lượng |
|---|---|---|---|
| 11 | MapVeto load MapPool từ GameConfig thay vì hardcode | `MapVetoPage.tsx` | 20 phút |
| 12 | SideSelect xác định đội nào chọn (coin toss) | `SideSelectPage.tsx` | 15 phút |
| 13 | Dashboard hiện trận hôm nay | `OverviewHandler.cs` | 15 phút |
| 14 | Responsive cho 1280×800 | CSS toàn bộ | 1 giờ |
| 15 | Confirmation dialog cho hành động quan trọng | Nhiều trang | 30 phút |
| 16 | 401 auto-redirect về Login | `AuthContext.tsx` / Axios interceptor | 20 phút |
| 17 | SLA 48h warning cho Disputes | `DisputesPage.tsx` | 15 phút |

---

## TÓM TẮT

```
Tổng FR trong SRS:          14 chức năng chính
Hoàn thiện đầy đủ:           8 (57%)
Có nhưng thiếu logic:        6 (43%) — cần bổ sung
Chưa triển khai:              4 tính năng quan trọng

Thời gian ước lượng hoàn thiện tất cả: ~10-12 giờ
Thời gian hoàn thiện ưu tiên Cao:      ~4-5 giờ
```

> [!TIP]
> **Gợi ý:** Nếu thời gian có hạn, hãy tập trung vào **4 việc ưu tiên Cao** (#1-#4). Đây là những việc giám khảo / giảng viên sẽ kiểm tra đầu tiên khi demo.

