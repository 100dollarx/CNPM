# BÁO CÁO PHÂN TÍCH BẢO MẬT — ETMS
## Security Threat Model (STRIDE Framework)
**Phiên bản:** 1.0 | **Ngày:** 2026-03-24 | **Tiêu chuẩn:** OWASP + STRIDE

---

## 1. TÀI SẢN CẦN BẢO VỆ (Assets)

| Tài sản | Độ nhạy cảm | Mô tả |
|---|---|---|
| Mật khẩu người dùng | 🔴 Critical | Hash bcrypt trong `tblUser.PasswordHash` |
| Kết quả thi đấu | 🔴 Critical | Dữ liệu thi đấu, WinnerID, bằng chứng |
| Thông tin đội tuyển | 🟡 High | Tên đội, roster, InGameID |
| Session người dùng | 🟡 High | `SessionManager.CurrentUser` trong RAM |
| File bằng chứng | 🟡 High | Ảnh kết quả upload lên server |
| Connection String | 🔴 Critical | Thông tin kết nối SQL Server |
| Audit Log | 🟡 High | Lịch sử hành động Admin |

---

## 2. PHÂN TÍCH STRIDE — TỪng Thành phần

### 2.1 Luồng Đăng nhập (`frmLogin → AuthBUS → UserDAL`)

| Mối đe dọa | STRIDE | Mức | Tấn công | Biện pháp |
|---|---|---|---|---|
| Brute-force mật khẩu | **T**ampering | 🔴 High | Thử nhiều mật khẩu liên tiếp | Khóa sau 5 lần; delay response 500ms mỗi lần sai |
| Credential stuffing | **S**poofing | 🔴 High | Dùng danh sách user/pass từ breach khác | bcrypt slow hash (~100ms/attempt) chống automated |
| Session hijacking | **S**poofing | 🟡 Medium | Chiếm phiên đăng nhập của user khác | Session timeout 30'; không serialize session ra disk |
| Enumeration username | **I**nformation Disclosure | 🟡 Medium | Phân biệt "sai user" vs "sai pass" từ thông báo | Trả về cùng 1 thông báo chung cho mọi trường hợp |
| SQL Injection login | **T**ampering | 🔴 Critical | `' OR '1'='1` trong Username | Parameterized Query bắt buộc; không dùng string concat |
| Plain-text password log | **I**nformation Disclosure | 🔴 High | Password bị log vào file/console | **KHÔNG** log password ở bất kỳ đâu, kể cả debug |

### 2.2 File Upload (`frmResultSubmit → ResultBUS`)

| Mối đe dọa | STRIDE | Mức | Tấn công | Biện pháp |
|---|---|---|---|---|
| Malicious file rename | **T**ampering | 🔴 Critical | Đổi `.exe` → `.jpg` để bypass extension check | Kiểm tra magic bytes (FF D8 FF / 89 50 4E 47) |
| Path traversal | **E**levation | 🔴 Critical | Upload filename `../../etc/passwd` | Sanitize filename: chỉ giữ alphanumeric + GUID rename |
| File size bypass | **D**enial of Service | 🟡 Medium | Upload file cực lớn | Check size TRƯỚC khi đọc toàn bộ file vào RAM |
| Double extension | **T**ampering | 🟡 Medium | Upload `proof.jpg.exe` | Chỉ lấy extension cuối cùng + magic bytes check |
| Stored XSS via filename | **T**ampering | 🟡 Medium | Filename chứa script (không áp dụng cho WinForms) | Không hiển thị filename trực tiếp từ DB lên HTML |

### 2.3 Database Access (`DAL → SQL Server`)

| Mối đe dọa | STRIDE | Mức | Tấn công | Biện pháp |
|---|---|---|---|---|
| SQL Injection | **T**ampering | 🔴 Critical | Inject SQL vào mọi input field | `SqlParameter` toàn bộ DAL — KHÔNG exception nào |
| Privilege escalation DB | **E**levation | 🟡 Medium | App dùng SA account → full DB control | Tạo DB user riêng với quyền tối thiểu: SELECT/INSERT/UPDATE |
| Connection string exposure | **I**nformation Disclosure | 🔴 Critical | Đọc connection string từ binary/config | Encrypt `<connectionStrings>` trong app.config bằng DPAPI |
| Excessive data return | **I**nformation Disclosure | 🟡 Medium | Trả về toàn bộ bảng khi chỉ cần 1 cột | SELECT chỉ các cột cần thiết; không `SELECT *` trong DAL |

### 2.4 Session Management (`SessionManager`)

| Mối đe dọa | STRIDE | Mức | Tấn công | Biện pháp |
|---|---|---|---|---|
| Infinite session | **E**levation | 🔴 High | Tài khoản đăng nhập mãi, không logout | Timeout 30' idle; timer kiểm tra mỗi 1 phút |
| Role escalation | **E**levation | 🔴 Critical | GUI hiển thị button Admin cho Captain | `BaseForm.EnforceRBAC()` gọi trong OnLoad — không thể bỏ qua |
| Concurrent session | **S**poofing | 🟡 Medium | Cùng 1 account đăng nhập 2 máy | WinForms single-instance: chấp nhận; ghi AuditLog để phát hiện |

### 2.5 Business Logic (BUS Layer)

| Mối đe dọa | STRIDE | Mức | Tấn công | Biện pháp |
|---|---|---|---|---|
| Race condition check-in | **T**ampering | 🔴 High | 2 request check-in cùng lúc | IsolationLevel.Serializable trong CheckInDAL |
| Duplicate result submission | **T**ampering | 🟡 Medium | Submit kết quả 2 lần cho 1 trận | UNIQUE(MatchID) trong tblMatchResult |
| Forged team roster | **S**poofing | 🟡 Medium | Thêm PlayerID của người khác vào đội | `ValidatePlayerNotInOtherTeam()` trong BUS trước khi INSERT |
| Bracket manipulation | **T**ampering | 🟡 Medium | Admin tạo bracket có lợi cho 1 đội | Fisher-Yates shuffle ngẫu nhiên + AuditLog ghi lại |
| Dispute spam | **D**enial of Service | 🟢 Low | Captain spam khiếu nại làm Admin quá tải | Giới hạn 2 khiếu nại/đội/tournament |

---

## 3. PHÂN TÍCH OWASP TOP 10 (áp dụng cho WinForms/DB)

| OWASP | Loại | Áp dụng trong ETMS | Biện pháp |
|---|---|---|---|
| A01: Broken Access Control | RBAC | Captain truy cập form Admin | `BaseForm.EnforceRBAC()` + `SessionManager.HasRole()` |
| A02: Cryptographic Failures | Hashing | Lưu plain text password | bcrypt với cost factor ≥ 10 |
| A03: Injection | SQL | Mọi input từ người dùng | Parameterized Query toàn DAL |
| A04: Insecure Design | Logic | Cả 2 Captain nộp kết quả khác nhau | UNIQUE constraint + conflict logic |
| A05: Security Misconfiguration | Config | Connection string plain text | DPAPI encrypt trong app.config |
| A06: Vulnerable Components | Libs | Dùng thư viện outdated | Chỉ dùng BCrypt.Net-Next từ NuGet mới nhất |
| A07: Auth Failures | Session | Session không timeout | 30' idle auto-logout |
| A08: Data Integrity | Upload | File upload bypass validate | Magic bytes + extension + size |
| A09: Security Logging | Audit | Không log action Admin | `tblAuditLog` ghi toàn bộ |
| A10: SSRF | N/A | WinForms không có web context | Không áp dụng |

---

## 4. SECURITY CONTROLS CHECKLIST

### 4.1 Authentication & Authorization
- [ ] bcrypt hash với cost factor = 12 (cân bằng security/performance)
- [ ] Khóa tài khoản sau 5 lần đăng nhập sai
- [ ] Session timeout 30 phút idle
- [ ] Thông báo lỗi đăng nhập chung (không tiết lộ field sai)
- [ ] RBAC: kiểm tra quyền tại BUS layer (không chỉ GUI)
- [ ] Mọi Admin action được ghi AuditLog

### 4.2 Data Protection
- [ ] Parameterized Query 100% tại DAL
- [ ] Connection string được DPAPI encrypt
- [ ] DB user có quyền tối thiểu (không dùng SA)
- [ ] Không log sensitive data (password, token)

### 4.3 File Upload
- [ ] Kiểm tra extension: chỉ .jpg, .png
- [ ] Kiểm tra magic bytes (4 bytes đầu)
- [ ] Giới hạn kích thước: < 5MB
- [ ] Rename file về GUID khi lưu (chống path traversal)
- [ ] Không lưu file vào thư mục web-accessible

### 4.4 Concurrency
- [ ] IsolationLevel.Serializable cho check-in
- [ ] SQL Transaction cho bracket generation
- [ ] SQL Transaction cho approve result + advance bracket

---

## 5. THREAT MATRIX — MỨC ĐỘ ƯU TIÊN XỬ LÝ

```
                    IMPACT
                 Low | Med | High | Crit
         -----+-----+-----+------+------
       Low   |  1   |  2  |  3   |  4
PROB   Med   |  2   |  4  |  6   |  8
       High  |  3   |  6  |  9   | 12
       Crit  |  4   |  8  | 12   | 16
```

| Mối đe dọa | Prob | Impact | Score | Ưu tiên |
|---|---|---|---|---|
| SQL Injection | Med | Crit | 8 | 🔴 P1 — Fix ngay |
| Brute Force Login | High | High | 9 | 🔴 P1 — Fix ngay |
| File malicious upload | Low | Crit | 4 | 🔴 P1 — Fix ngay |
| Connection string exposure | Low | Crit | 4 | 🔴 P1 — Fix ngay |
| Session không timeout | Med | High | 6 | 🟡 P2 — Sprint 1 |
| RBAC bypass | Low | Crit | 4 | 🟡 P2 — Sprint 1 |
| Race condition check-in | Med | High | 6 | 🟡 P2 — Sprint 1 |
| Duplicate result | Med | Med | 4 | 🟡 P2 — Sprint 2 |
| Dispute spam | Low | Low | 1 | 🟢 P3 — Backlog |

---

## 6. SECURITY TEST CASES (Bổ sung vào PCL)

| TC | Loại | Input | Expected |
|---|---|---|---|
| SEC-TC-01 | SQL Injection | Username: `' OR '1'='1`; Pass: anything | Login thất bại, không trích xuất data |
| SEC-TC-02 | SQL Injection | Team name: `'; DROP TABLE tblTeam; --` | Lưu như text bình thường |
| SEC-TC-03 | Brute Force | Login sai 5 lần liên tiếp | Tài khoản bị khóa IsLocked=1 |
| SEC-TC-04 | File Magic Bytes | .exe đổi tên thành .jpg | Từ chối — magic bytes không khớp |
| SEC-TC-05 | File Size | File 5.1MB | Từ chối — vượt giới hạn |
| SEC-TC-06 | Path Traversal | Filename: `../../config.exe` | Rename thành GUID, không trace path |
| SEC-TC-07 | Session Timeout | Idle 31 phút rồi thao tác | Auto-logout, redirect login |
| SEC-TC-08 | RBAC | Captain truy cập frmAuditLog URL | Form đóng ngay — không đủ quyền |
| SEC-TC-09 | Duplicate Submit | Captain submit kết quả 2 lần | Lần 2 từ chối — UNIQUE constraint |
| SEC-TC-10 | Concurrent Check-in | 2 thread kiểm tra cùng lúc | Serializable lock — 1 thành công |
| SEC-TC-11 | Password Plain Text | Kiểm tra tblUser trong DB | Chỉ thấy bcrypt hash, không plain text |
| SEC-TC-12 | Connection String | Đọc file app.config | Thấy encrypted string, không plain text |
