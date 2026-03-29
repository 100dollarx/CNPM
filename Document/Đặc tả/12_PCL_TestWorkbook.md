# PCL TEST WORKBOOK — ETMS
## Kiểm thử theo chuẩn PCL (Pass / Conditional / Limitation)
**Phiên bản:** 1.0 | **Ngày:** 2026-03-24 | **Môn:** Kỹ thuật Phần mềm 502045

> **Hướng dẫn PCL:**
> - **P (Pass):** Test thành công hoàn toàn
> - **C (Conditional):** Pass với điều kiện / ghi chú
> - **L (Limitation):** Không pass — ghi hạn chế cần fix

---

## MODULE 1: Authentication & Account Management

| TC-ID | Loại | Precondition | Steps | Input | Expected | Actual | PCL |
|---|---|---|---|---|---|---|---|
| TC-AUTH-01 | Normal | App running | 1. Nhập đúng user/pass → Login | `admin`/`admin123` | Dashboard Admin mở | | |
| TC-AUTH-02 | Normal | App running | 1. Nhập user Captain → Login | `captain1`/`pass` | Dashboard Captain mở | | |
| TC-AUTH-03 | Abnormal | App running | 1. Nhập sai pass 1 lần | `admin`/`wrong` | Lỗi chung, attempts+1 | | |
| TC-AUTH-04 | Boundary | App running | 1. Sai pass 4 lần → Sai lần 5 | `admin`/`wrong` ×5 | Tài khoản khóa | | |
| TC-AUTH-05 | Abnormal | Tài khoản khóa | 1. Đăng nhập | `admin`/`admin123` | "Tài khoản bị khóa" | | |
| TC-AUTH-06 | Normal | Admin logged in | 1. Mở khóa tài khoản → Login lại | Unlock → Login | Login thành công | | |
| TC-AUTH-07 | Security | Any user | 1. Nhập SQL injection làm username | `' OR '1'='1` | Login fail, không crash | | |
| TC-AUTH-08 | Security | User logged in | 1. Idle 31 phút → Thao tác | Wait 31' | Auto-logout | | |
| TC-AUTH-09 | Normal | User logged in | 1. Đổi mật khẩu thành công | Old correct, new ≥8 ký tự | Mật khẩu cập nhật | | |
| TC-AUTH-10 | Abnormal | User logged in | 1. Đổi mật khẩu nhập sai mật khẩu cũ | Old wrong | Thông báo lỗi | | |

---

## MODULE 2: Team Registration & Approval

| TC-ID | Loại | Precondition | Steps | Input | Expected | Actual | PCL |
|---|---|---|---|---|---|---|---|
| TC-TEAM-01 | Normal | Captain logged in, Tournament = Registration | 1. Tạo đội với 5 thành viên hợp lệ | Team name unique, 5 players | Status = Pending | | |
| TC-TEAM-02 | Abnormal | | 1. Tạo đội với tên đã tồn tại trong tournament | Duplicate name | Lỗi "Tên đã tồn tại" | | |
| TC-TEAM-03 | Abnormal | | 1. Thêm player đã thuộc đội khác cùng tournament | PlayerID in use | Lỗi "Đã thuộc đội khác" | | |
| TC-TEAM-04 | Boundary | | 1. Nộp đội chỉ có 4 thành viên (min=5) | 4 players | Lỗi "Thiếu thành viên" | | |
| TC-TEAM-05 | Normal | Admin logged in, đội Pending | 1. Approve đội | Click Approve | Status = Approved, Notif Captain | | |
| TC-TEAM-06 | Normal | Admin logged in, đội Pending | 1. Reject đội có lý do | Nhập reason | Status = Rejected, Notif Captain | | |
| TC-TEAM-07 | Abnormal | | 1. Captain tạo đội thứ 2 cùng tournament | Register 2nd team | Lỗi "Đã có đội trong giải này" | | |
| TC-TEAM-08 | Abnormal | Tournament = Active | 1. Tạo đội khi giải đã bắt đầu | Register after Active | Lỗi "Giải đã bắt đầu" | | |
| TC-TEAM-09 | Normal | Admin logged in | 1. Disqualify đội đang thi đấu | Disqualify team | Các trận tương lai → Walkover | | |

---

## MODULE 3: Bracket Generation

| TC-ID | Loại | Precondition | Steps | Input | Expected | Actual | PCL |
|---|---|---|---|---|---|---|---|
| TC-BKT-01 | Normal | 8 đội Approved | Generate Bracket | tournamentId | 7 tran, 0 Bye, Linked List đúng | | |
| TC-BKT-02 | Boundary | 7 đội Approved | Generate Bracket | tournamentId | 8 slots, 1 Bye, 6 trận thực | | |
| TC-BKT-03 | Boundary | 5 đội Approved | Generate Bracket | tournamentId | 8 slots, 3 Bye, 4 trận vòng 1 | | |
| TC-BKT-04 | Boundary | 2 đội (min) | Generate Bracket | tournamentId | 2 teams, 1 trận Final | | |
| TC-BKT-05 | Boundary | 1 đội Approved | Generate Bracket | tournamentId | Lỗi "Cần ≥ 2 đội" | | |
| TC-BKT-06 | Normal | Bracket đã tồn tại | Admin regenerate | Confirm dialog → Yes | Xóa bracket cũ, tạo mới | | |
| TC-BKT-07 | Abnormal | Bracket đã tồn tại | Huỷ regenerate | Confirm dialog → No | Bracket cũ giữ nguyên | | |
| TC-BKT-08 | Boundary | 16 đội | Generate | 16 teams | 15 trận, 0 Bye | | |
| TC-BKT-09 | Boundary | 9 đội | Generate | 9 teams | 16 slots, 7 Bye | | |
| TC-BKT-10 | Security | Admin generate | DB fail giữa transaction | Simulate error | Rollback — không có match nửa vời | | |

---

## MODULE 4: Check-in & Walkover

| TC-ID | Loại | Precondition | Steps | Input | Expected | Actual | PCL |
|---|---|---|---|---|---|---|---|
| TC-CI-01 | Normal | Match Scheduled | Đến giờ CheckInOpenTime | Timer | Status = CheckInOpen, Notif cả 2 | | |
| TC-CI-02 | Normal | Match CheckInOpen | Cả 2 Captain check-in | 2 clicks | Status = Live | | |
| TC-CI-03 | Normal | CheckInOpen | Chỉ Team1 check-in → hết giờ | Timeout | Walkover: Team1 thắng | | |
| TC-CI-04 | Normal | CheckInOpen | Chỉ Team2 check-in → hết giờ | Timeout | Walkover: Team2 thắng | | |
| TC-CI-05 | Abnormal | CheckInOpen | Cả 2 không check-in → hết giờ | Timeout | Status = WalkoverPending, Notif Admin | | |
| TC-CI-06 | Concurrency | CheckInOpen | 10 request check-in cùng lúc | Concurrent | Serializable: chỉ 1 team_num update đúng | | |
| TC-CI-07 | Abnormal | Match Scheduled | Captain check-in trước giờ mở | Early click | Lỗi "Cổng check-in chưa mở" | | |
| TC-CI-08 | Normal | WalkoverPending | Admin quyết định winner | Admin select | WinnerID set, NextMatch advance | | |
| TC-CI-09 | Normal | WalkoverPending | Admin huỷ trận (cả 2 loại) | Disqualify both | Cả 2 Disqualified | | |
| TC-CI-10 | Normal | Walkover resolved | NextMatch | Auto | Team thắng xuất hiện trong NextMatch | | |

---

## MODULE 5: Result Submission & Verification

| TC-ID | Loại | Precondition | Steps | Input | Expected | Actual | PCL |
|---|---|---|---|---|---|---|---|
| TC-RES-01 | Normal | Match Live | Upload .jpg 2MB + điểm hợp lệ | Valid file | Status = PendingVerification | | |
| TC-RES-02 | Boundary | Match Live | Upload .png 4.99MB | 4.99MB PNG | Chấp nhận | | |
| TC-RES-03 | Boundary | Match Live | Upload .png 5.01MB | 5.01MB PNG | Từ chối: "Vượt 5MB" | | |
| TC-RES-04 | Security | Match Live | Upload .exe đổi tên .jpg | Fake JPG | Từ chối: "Định dạng không hợp lệ" | | |
| TC-RES-05 | Abnormal | Match Live | Upload file .pdf | .pdf | Từ chối: "Chỉ chấp nhận .jpg, .png" | | |
| TC-RES-06 | Abnormal | Match Live | Captain nộp lần 2 | 2nd submit | Từ chối: "Đã có kết quả chờ xác nhận" | | |
| TC-RES-07 | Normal | PendingVerification | Admin phê duyệt | Approve | WinnerID set, NextMatch điền, Status=Completed | | |
| TC-RES-08 | Normal | PendingVerification | Admin từ chối | Reject | Status = Disputed, Notif Captain | | |
| TC-RES-09 | Normal | Disputed | Admin Override Result | Direct input | WinnerID override, AuditLog ghi | | |
| TC-RES-10 | Normal | Final match complete | Phê duyệt Final | Approve | Tournament Status = Completed | | |

---

## MODULE 6: Leaderboard & Dispute

| TC-ID | Loại | Precondition | Steps | Input | Expected | Actual | PCL |
|---|---|---|---|---|---|---|---|
| TC-LB-01 | Normal | Guest | Xem Leaderboard SE tournament | — | Bracket tree hiển thị, Top 3 | | |
| TC-LB-02 | Normal | Guest | Xem Leaderboard BR tournament | — | Sorted đúng theo Tie-breaker | | |
| TC-LB-03 | Boundary | 2 đội đồng điểm BR | Tie-breaker level 1 | Same TotalPoints | So H2H | | |
| TC-LB-04 | Boundary | 2 đội đồng H2H | Tie-breaker level 2 | Same H2H | So TotalKillPoints | | |
| TC-DSP-01 | Normal | Captain | Gửi khiếu nại với bằng chứng | Valid input | Status = Open, Notif Admin | | |
| TC-DSP-02 | Abnormal | Captain đã gửi 2 lần | Gửi khiếu nại lần 3 | 3rd dispute | Từ chối: "Đã đạt giới hạn 2 khiếu nại" | | |
| TC-DSP-03 | Normal | Admin | Giải quyết khiếu nại | Resolve | Status = Resolved, AuditLog ghi | | |
| TC-DSP-04 | Boundary | Dispute > 48h | Kiểm tra SLA | Auto | Notification cảnh báo gửi Admin | | |

---

## MODULE 7: Security Testing

| TC-ID | Loại | Input | Expected | Actual | PCL |
|---|---|---|---|---|---|
| TC-SEC-01 | SQL Inject | `' OR '1'='1` trong Username | Không login được | | |
| TC-SEC-02 | SQL Inject | `'; DROP TABLE tblTeam; --` trong tên đội | Lưu như text bình thường | | |
| TC-SEC-03 | Brute Force | Sai pass 5 lần | IsLocked = 1 | | |
| TC-SEC-04 | File bypass | .exe đổi tên .jpg | Từ chối, magic bytes fail | | |
| TC-SEC-05 | RBAC | Captain vào trang Admin | Form close ngay | | |
| TC-SEC-06 | Session | Idle 31' → Thao tác | Auto logout | | |
| TC-SEC-07 | Duplicate | Submit result 2 lần | Lần 2 từ chối | | |
| TC-SEC-08 | Concurrent | 2 thread check-in cùng lúc | Chỉ 1 thành công | | |
| TC-SEC-09 | Config | Đọc app.config | Encrypted string | | |
| TC-SEC-10 | Password | Xem tblUser | Chỉ thấy bcrypt hash | | |

---

## TỔNG HỢP TEST COVERAGE

| Module | Total TCs | Normal | Boundary | Abnormal | Security | Concurrency |
|---|---|---|---|---|---|---|
| Authentication | 10 | 4 | 1 | 3 | 2 | 0 |
| Team | 9 | 4 | 1 | 4 | 0 | 0 |
| Bracket | 10 | 5 | 4 | 1 | 0 | 0 |
| Check-in | 10 | 6 | 0 | 2 | 0 | 1 |
| Result | 10 | 4 | 2 | 2 | 1 | 0 |
| Leaderboard/Dispute | 8 | 4 | 3 | 1 | 0 | 0 |
| Security | 10 | 0 | 0 | 0 | 10 | 0 |
| **TOTAL** | **67** | **27** | **11** | **13** | **13** | **1+** |
