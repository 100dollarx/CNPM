# STATE DIAGRAMS — ETMS (Vòng đời các thực thể chính)

> Hệ thống Quản lý Giải đấu Esports | Phiên bản: 1.0

---

## 1. STATE DIAGRAM — Vòng đời TOURNAMENT

```mermaid
stateDiagram-v2
    [*] --> Draft : Admin tạo Tournament mới

    Draft --> Registration : Admin mở đăng ký\n(SetStatus = 'Registration')

    Registration --> Draft : Admin thu hồi\n(chưa có đội nào đăng ký)

    Registration --> Active : Admin Generate Bracket\n(≥ 2 đội Approved)

    Active --> Completed : Trận chung kết\nhoàn thành (WinnerID set)\n+ Admin đóng giải

    Active --> Registration : [ngoại lệ]\nAdmin hủy bracket\n(chưa có trận nào live)

    Completed --> [*]

    note right of Draft
        Trạng thái ban đầu.
        Admin có thể chỉnh sửa
        mọi thông tin.
    end note

    note right of Registration
        Các đội có thể đăng ký.
        Admin xét duyệt hồ sơ.
        MinTeams chưa đạt → không Generate.
    end note

    note right of Active
        Bracket đã được tạo.
        Các trận đang diễn ra.
        Không thể thêm đội mới.
    end note

    note right of Completed
        Giải đấu kết thúc.
        Dữ liệu vào Hall of Fame.
        Chỉ đọc (Read-only).
    end note
```

---

## 2. STATE DIAGRAM — Vòng đời TEAM (Đội tuyển)

```mermaid
stateDiagram-v2
    [*] --> Pending : Captain tạo hồ sơ\nvà nộp đăng ký

    Pending --> Approved : Admin phê duyệt\n(UC-2.2 Approve)

    Pending --> Rejected : Admin từ chối\n(kèm lý do)

    Rejected --> Pending : Captain chỉnh sửa\nvà nộp lại
    note right of Rejected
        Captain nhận thông báo.
        Có thể sửa và nộp lại
        (trong thời gian Registration).
    end note

    Approved --> [*] : Tournament kết thúc\n(Completed)

    Approved --> Disqualified : Admin loại đội\n(vi phạm luật)
    Disqualified --> [*]

    state Approved {
        [*] --> InBracket : Được add vào Bracket
        InBracket --> Playing : Trận sắp xảy ra
        Playing --> Eliminated : Thua→bị loại (SE)
        Playing --> StillIn : Thắng→vào vòng tiếp
        StillIn --> Playing : Trận tiếp theo
        StillIn --> Champion : Thắng chung kết 🥇
        Eliminated --> [*]
        Champion --> [*]
    }
```

---

## 3. STATE DIAGRAM — Vòng đời MATCH (Trận đấu)

```mermaid
stateDiagram-v2
    [*] --> Scheduled : BracketBUS INSERT\ntblMatch khi Generate Bracket

    Scheduled --> CheckInOpen : Timer kích hoạt\n(ScheduledTime - 15 phút)

    CheckInOpen --> Live : Cả 2 đội Check-in thành công\n(CheckIn_Team1 & Team2 = 1)

    CheckInOpen --> Walkover : Hết cửa sổ Check-in\n1 hoặc cả 2 đội không xác nhận

    Live --> PendingVerification : Captain nộp\nkết quả + bằng chứng

    PendingVerification --> Completed : Admin phê duyệt\n→ WinnerID set\n→ NextMatch cập nhật

    PendingVerification --> Disputed : Admin từ chối\n(nghi vấn gian lận)

    Disputed --> PendingVerification : Captain nộp lại\nbằng chứng mới

    Disputed --> Completed : Admin tự xác nhận\n(sau khi điều tra)

    Walkover --> Completed : Auto: WinnerID = đội Check-in\n→ NextMatch cập nhật

    Completed --> [*] : Trận kết thúc

    note right of Scheduled
        Cả 2 đội có thể là NULL
        (vòng sau, chờ winner vòng trước).
    end note

    note right of CheckInOpen
        Countdown 15 phút.
        Captain được thông báo.
        Timer chạy nền.
    end note

    note right of Live
        ActualStartTime được set.
        Map Veto / Side Select xảy ra ở đây.
    end note

    note right of Walkover
        ⚠️ GAP-01: Cả 2 không check-in
        → Admin cần quyết định thủ công.
    end note
```

---

## 4. STATE DIAGRAM — Vòng đời MATCH RESULT (Kết quả)

```mermaid
stateDiagram-v2
    [*] --> PendingVerification : Captain nộp\nScore + EvidenceURL

    PendingVerification --> Verified : Admin phê duyệt\n(ApproveResult)

    PendingVerification --> Disputed : Admin từ chối\n(DisputeResult)

    Disputed --> PendingVerification : Captain nộp lại\n(resubmit evidence)

    Disputed --> Verified : Admin quyết định\n(sau điều tra)

    Verified --> [*] : Final - không thay đổi
```

---

## 5. STATE DIAGRAM — Vòng đời DISPUTE (Khiếu nại)

```mermaid
stateDiagram-v2
    [*] --> Open : Captain FileDispute\n(UC-8.1)

    Open --> Resolved : Admin giải quyết\n(crowneds winner, note ghi rõ)

    Open --> Dismissed : Admin bác bỏ\n(không đủ bằng chứng)

    Resolved --> [*]
    Dismissed --> [*]

    note right of Open
        Admin nhận thông báo.
        Thời hạn giải quyết chưa xác định.
        ⚠️ GAP: Cần SLA (Service Level Agreement)
        VD: giải quyết trong 24h.
    end note
```

---

## 6. STATE DIAGRAM — USER ACCOUNT (Tài khoản)

```mermaid
stateDiagram-v2
    [*] --> Active : Admin tạo tài khoản\n(UC-1.2)

    Active --> Active : Đăng nhập thành công\n(reset FailedAttempts = 0)

    Active --> FailedAttempt : Đăng nhập sai\n(FailedAttempts++)

    FailedAttempt --> Active : Đăng nhập đúng\n(reset về 0)

    FailedAttempt --> Locked : FailedAttempts >= 5\n(IsLocked = 1)

    Locked --> Active : Admin mở khóa\n(UC-1.2 Unlock)

    Active --> [*] : Admin xóa tài khoản\n(nếu có chức năng)
```

---

## 7. BẢNG TỔNG HỢP TRẠNG THÁI

### 7.1 Match Status

| Status | Ý nghĩa | Transition từ | Transition đến |
|---|---|---|---|
| `Scheduled` | Đã lên lịch, chờ giờ | BracketBUS Generate | `CheckInOpen` |
| `CheckInOpen` | Cổng Check-in mở | Time trigger | `Live` / `Walkover` |
| `Live` | Đang thi đấu | Cả 2 Check-in | `PendingVerification` |
| `Walkover` | Thắng do không Check-in | Timeout | `Completed` |
| `PendingVerification` | Chờ Admin xác nhận | Captain Submit | `Completed` / `Disputed` |
| `Disputed` | Đang tranh chấp | Admin Reject | `PendingVerification` / `Completed` |
| `Completed` | Hoàn thành | Admin Approve | — |

### 7.2 Team Status

| Status | Ý nghĩa |
|---|---|
| `Pending` | Đã nộp, chờ xét duyệt |
| `Approved` | Được chấp thuận, vào bracket |
| `Rejected` | Bị từ chối (có thể nộp lại) |
| `Disqualified` | Bị loại (vi phạm nghiêm trọng) |

### 7.3 Tournament Status

| Status | Ý nghĩa |
|---|---|
| `Draft` | Đang cấu hình |
| `Registration` | Đang nhận hồ sơ đội |
| `Active` | Giải đang diễn ra |
| `Completed` | Đã kết thúc |

---

## 8. LỖ HỔNG PHÁT HIỆN QUA STATE DIAGRAMS

| ID | Lỗ hổng | Mô tả | Khuyến nghị |
|---|---|---|---|
| **ST-01** | Match `Walkover` khi cả 2 không check-in | Không có xử lý tự động | Admin cần xử lý thủ công; thêm trạng thái `WalkoverPending` |
| **ST-02** | Không có Timeout cho `Disputed` | Dispute có thể tồn tại vô thời hạn | Thêm `DeadlineResolveAt = CreatedAt + 24h` |
| **ST-03** | Không có trạng thái `Cancelled` cho Tournament | Tournament `Active` có thể bị hủy bởi sự cố | Thêm trạng thái `Cancelled` với logic xử lý đội tham gia |
| **ST-04** | Không có trạng thái `Postponed` cho Match | Trận có thể bị hoãn | Thêm `Postponed` với `NewScheduledTime` |
| **ST-05** | Match `Disputed` → Captain "nộp lại" chưa rõ quy trình | Ai được nộp? Cả 2 hay chỉ đội bị tố? | Cần specify rõ trong SRS |
