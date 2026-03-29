# SỔ ĐĂNG KÝ RỦI RO — ETMS
## Risk Register (FMEA — Failure Mode & Effect Analysis)
**Phiên bản:** 1.0 | **Ngày:** 2026-03-24

> **RPN = Severity × Occurrence × Detectability** (thang 1–10)
> - Severity: Mức độ ảnh hưởng khi xảy ra
> - Occurrence: Tần suất xuất hiện
> - Detectability: Khả năng phát hiện (10 = rất khó phát hiện)
> - **RPN ≥ 100: Cần hành động khẩn cấp | 50–99: Cần giám sát | < 50: Chấp nhận được**

---

## 1. RỦI RO KỸ THUẬT

| ID | Rủi ro | Failure Mode | Tác động | S | O | D | RPN | Mức | Biện pháp | Trách nhiệm |
|---|---|---|---|---|---|---|---|---|---|---|
| R-T01 | SQL Injection | Kẻ xấu inject SQL qua input field | Lộ/xóa dữ liệu toàn DB | 9 | 3 | 2 | **54** | 🟡 | Parameterized Query 100% + Input sanitize | DAL Dev |
| R-T02 | Race Condition Check-in | 2 request cập nhật cùng lúc | Kết quả check-in sai, match corrupt | 8 | 5 | 4 | **160** | 🔴 | IsolationLevel.Serializable | DAL Dev |
| R-T03 | Bracket Math sai (Bye Logic) | N không phải lũy thừa 2 → tạo bracket sai | Nhánh đấu corrupt, không chơi được | 9 | 3 | 3 | **81** | 🟡 | Unit Test NextPowerOf2() + toàn bộ Bye cases | BUS Dev |
| R-T04 | File upload malicious | .exe đổi tên .jpg qua extension check | Mã độc trên server | 10 | 2 | 3 | **60** | 🟡 | Magic bytes validation | BUS Dev |
| R-T05 | Session không timeout | Phiên làm việc mãi mãi | Người khác chiếm tài khoản | 7 | 6 | 5 | **210** | 🔴 | Timer 1' check + 30' idle logout | BUS Dev |
| R-T06 | Kết quả trận bị corrupt | 2 Captain nộp điểm khác nhau | Bracket tiến sai đội | 9 | 4 | 3 | **108** | 🔴 | UNIQUE(MatchID) + conflict logic | DAL Dev |
| R-T07 | Connection string lộ | Config file không mã hóa | Toàn DB bị truy cập | 10 | 2 | 2 | **40** | 🟢 | DPAPI encrypt app.config | SysAdmin |
| R-T08 | Bracket Linked List bị đứt | NextMatchID NULL sai | Winner không advance lên vòng sau | 9 | 2 | 3 | **54** | 🟡 | Transaction INSERT + Test TC-01,02 | DAL Dev |
| R-T09 | RBAC bypass qua GUI | Captain mở form Admin trực tiếp | Unauthorized access | 8 | 2 | 3 | **48** | 🟢 | Abstract EnforceRBAC() trong BaseForm | GUI Dev |
| R-T10 | DB connection fail | SQL Server offline | App crash hoặc hang | 7 | 3 | 2 | **42** | 🟢 | Retry 3 lần + thông báo lỗi thân thiện | DAL Dev |

---

## 2. RỦI RO NGHIỆP VỤ

| ID | Rủi ro | Failure Mode | Tác động | S | O | D | RPN | Mức | Biện pháp |
|---|---|---|---|---|---|---|---|---|---|
| R-B01 | WalkoverPending không resolve | Cả 2 không check-in, Admin quên xử lý | Bracket bị treo vô thời hạn | 8 | 3 | 5 | **120** | 🔴 | NotificationBUS + deadline 24h cảnh báo |
| R-B02 | Scheduling conflict | 1 đội có 2 trận cùng giờ | Đội không thể play cả 2 | 7 | 4 | 4 | **112** | 🔴 | hasConflict() check + Admin warning |
| R-B03 | Dispute spam | Captain gửi nhiều khiếu nại vô lý | Admin bị quá tải | 5 | 4 | 2 | **40** | 🟢 | Giới hạn 2 khiếu nại/đội/tournament |
| R-B04 | Đội bị Disqualified giữa chừng | Admin disqualify đội đang có trận live | Bracket corrupt nếu xử lý sai | 8 | 1 | 3 | **24** | 🟢 | Walkover tự động cho trận hiện tại/tương lai |
| R-B05 | Dispute SLA quá hạn | Admin không giải quyết trong 48h | Ảnh hưởng uy tín BTC, đội bị treo | 6 | 3 | 4 | **72** | 🟡 | Auto-notify Admin + ghi WARNING vào AuditLog |
| R-B06 | Captain nộp sai bằng chứng | Ảnh không phải kết quả thực | Admin xác nhận sai | 7 | 3 | 6 | **126** | 🔴 | Admin có thể Override Result + Dispute system |
| R-B07 | Registration deadline | Đội đăng ký sau deadline | Gian lận timeline | 6 | 2 | 2 | **24** | 🟢 | Validate RegistrationDeadline trong BUS |

---

## 3. RỦI RO DỰ ÁN

| ID | Rủi ro | Tác động | Xác suất | Mức | Biện pháp |
|---|---|---|---|---|---|
| R-P01 | Merge conflict code | Delay, bug mới | High | 🔴 | Gitflow + Code Review PR bắt buộc |
| R-P02 | Bracket algorithm sai | Core feature không hoạt động | Medium | 🟡 | Unit test đầy đủ trước khi merge |
| R-P03 | Thiếu kinh nghiệm SQL Transaction | Data integrity bị vỡ | Medium | 🟡 | Peer review DAL code; test concurrency |
| R-P04 | Scope creep | Không hoàn thành đúng hạn | High | 🔴 | Freeze scope sau Sprint 1; change request process |
| R-P05 | Thiếu tài liệu | Khó bàn giao, khó debug | Medium | 🟡 | Đã có bộ tài liệu đặc tả này |

---

## 4. RISK RESPONSE PLAN (TOP 5 RỦI RO CAO NHẤT)

### R-T05: Session Timeout (RPN=210)
- **Kế hoạch:** Implement `System.Windows.Forms.Timer` trong `frmDashboard`
- **Trigger:** Tick mỗi 60 giây, check `SessionManager.IsSessionValid()`
- **Action:** Nếu idle > 30 phút → Show warning → 60 giây → Auto-logout
- **Test:** SEC-TC-07

### R-T02: Race Condition (RPN=160)
- **Kế hoạch:** `IsolationLevel.Serializable` trong `CheckInDAL.ConfirmCheckIn()`
- **Test:** TC-06 — concurrent 10 threads check-in cùng lúc

### R-B06: Sai bằng chứng (RPN=126)
- **Kế hoạch:** Admin có quyền `Override Result` + Captain có thể Dispute
- **Test:** Manual test với admin workflow

### R-B01: WalkoverPending (RPN=120)
- **Kế hoạch:** Status mới + Notification tự động cho Admin + Deadline 24h
- **Action khi trễ:** AuditLog WARNING + Notification lần 2

### R-T06: Duplicate Result (RPN=108)
- **Kế hoạch:** `UNIQUE(MatchID)` trong `tblMatchResult` + BUS check trước khi INSERT
- **Test:** TC-16, SEC-TC-09
