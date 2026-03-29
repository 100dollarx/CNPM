# 📚 MASTER INDEX — ETMS Enterprise Specification
## Hệ thống Quản lý Giải đấu Esports — Bộ Tài liệu Hoàn chỉnh
**Phiên bản:** 2.0 Enterprise | **Ngày:** 2026-03-24 | **Tổng file:** 12

---

## 🗂️ DANH SÁCH TÀI LIỆU

### Core Documents
| File | Mô tả | Đọc khi nào |
|---|---|---|
| **`plan.md`** | **Kế hoạch tổng thể** — Lộ trình Sprint 0–3, phân công, Gitflow | Trước khi làm gì |
| **`SRS_v2.md`** | **Đặc tả yêu cầu** — 11 FR, 19 NFR, SQL schema 14 bảng, 23 TCs | Nền tảng mọi quyết định |

### UML Diagrams
| File | Mô tả |
|---|---|
| `01_UseCaseDiagram.md` | 25+ Use Cases chi tiết + 10 lỗ hổng phân tích |
| `02_ClassDiagram_v2.md` | **Class Diagram** — 14 BUS + 15 DAL + 15 GUI + 10 Enums |
| `03_ERD.md` | ERD đầy đủ + Data Dictionary (14 bảng) |
| `04_SequenceDiagrams.md` | 8 Sequence Diagrams: Login, Bracket, Check-in, Result, Map Veto, Notification... |
| `05_StateDiagrams.md` | 6 State Diagrams: Tournament, Team, Match, Result, Dispute, User |
| `06_ActivityDiagrams.md` | 7 Activity Diagrams: mọi luồng nghiệp vụ với decision points |

### Enterprise Documents
| File | Mô tả |
|---|---|
| `08_SecurityThreatModel.md` | **STRIDE + OWASP Top 10** — 18 threats + 12 security TCs |
| `09_ArchitectureDesign.md` | Component, DFD (Level 0/1), Deployment, Error Codes, Coding Standards |
| `10_TraceabilityMatrix.md` | **RTM** — FR→UC→BUS/DAL→Test + Change Impact Analysis |
| `11_RiskRegister.md` | **FMEA** — 22 risks, RPN scoring, Risk Response Plans |
| `12_PCL_TestWorkbook.md` | **67 Test Cases** — 7 modules (Normal/Boundary/Abnormal/Security) |

---

## 📖 THỨ TỰ ĐỌC ĐỀ XUẤT

```
1. plan.md              → Hiểu lộ trình, phân công, sprint
2. SRS_v2.md            → Hiểu yêu cầu đầy đủ + SQL schema
3. 09_Architecture...   → Hiểu kiến trúc, error codes, coding standards
4. 02_ClassDiagram_v2   → Thiết kế class trước khi code
5. 03_ERD.md            → Database cụ thể
6. 04/05/06_*.md        → Hiểu hành vi hệ thống
7. 08_Security...       → Đọc trước khi code Auth/File Upload
8. 10_Traceability...   → Biết TC nào test FR nào
9. 12_PCL_TestWorkbook  → Chạy test từng module
```

---

## 📊 SỐ LIỆU TỔNG QUAN

| Thành phần | Số lượng |
|---|---|
| Functional Requirements (FR) | 11 nhóm, 25+ UC |
| Non-Functional Requirements (NFR) | 5 nhóm, 19 items |
| Database Tables | 14 bảng, ~50 cột |
| BUS Classes | 14 |
| DAL Classes | 15 |
| GUI Forms | 15 |
| DTO + Enum | 12 DTOs + 10 Enums |
| Test Cases | 67 (PCL) + 12 (Security) |
| Security Threats | 18 phân tích (STRIDE) |
| Risks | 22 (FMEA scored) |
| UML Diagrams | 35+ diagrams |

---

## ✅ CHECKLIST HOÀN THIỆN

| Hạng mục | Đạt |
|---|---|
| Functional Requirements | ✅ 11 FR |
| Non-Functional Requirements | ✅ 19 NFR |
| Use Case Diagrams | ✅ |
| Class Diagram (3-Layer) | ✅ |
| ERD / Database Schema | ✅ 14 bảng |
| Sequence / State / Activity | ✅ |
| Security Threat Model | ✅ STRIDE + OWASP |
| Architecture Design | ✅ ADD |
| Traceability Matrix | ✅ RTM |
| Risk Register | ✅ FMEA |
| Test Cases (PCL) | ✅ 67 TCs |
| Error Handling | ✅ Error Codes |
| Coding Standards | ✅ |

**🎯 Specification Phase: 100% — Sẵn sàng bắt đầu Lập trình**
