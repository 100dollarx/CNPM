# 📚 MASTER INDEX — ETMS v4.0
## Hệ thống Quản lý Giải đấu Esports — Bộ Tài liệu Hoàn chỉnh
**Phiên bản:** 4.0 (Tauri v2 + React + .NET API) | **Ngày:** 2026-03-31 | **Tổng file:** 14

> 🚀 **v4.0 — Cross-Platform Desktop:** React + Tauri v2 + ASP.NET Core 8 + SQL Server

---

## 🗂️ DANH SÁCH TÀI LIỆU

### Core Documents (Cập nhật v4.0 ✅)
| File | Mô tả | Phiên bản |
|---|---|---|
| **`plan.md`** | Kế hoạch tổng thể — Sprint 0–4, phân công, DoD | **v4.0** ✅ |
| **`SRS_v2.md`** | Đặc tả yêu cầu — 11 FR, 5 NFR, 35 API Endpoints, DB schema | **v4.0** ✅ |
| **`09_ArchitectureDesign.md`** | Kiến trúc 3-tier, Tauri sidecar, JWT, Security | **v4.0** ✅ |

### Database
| File | Mô tả |
|---|---|
| `ETMS.Api/Database/ETMS_DB.sql` | **Script SQL v4.0** — 16 bảng + 13 indexes + 2 SPs + sample data ✅ |

### UML Diagrams (v3.0 — logic không đổi)
| File | Mô tả |
|---|---|
| `01_UseCaseDiagram.md` | 25+ Use Cases chi tiết |
| `02_ClassDiagram_v2.md` | 14 BUS + 15 DAL + DTO/Enums |
| `03_ERD.md` | ERD + Data Dictionary (16 bảng) |
| `04_SequenceDiagrams.md` | 8 Sequence Diagrams |
| `05_StateDiagrams.md` | 6 State Diagrams |
| `06_ActivityDiagrams.md` | 7 Activity Diagrams |

### Enterprise Documents (v3.0 — vẫn áp dụng)
| File | Mô tả |
|---|---|
| `08_SecurityThreatModel.md` | STRIDE + OWASP Top 10 — 18 threats |
| `10_TraceabilityMatrix.md` | RTM — FR→UC→BUS/DAL→Test |
| `11_RiskRegister.md` | FMEA — 22 risks |
| `12_PCL_TestWorkbook.md` | 67 Test Cases |

---

## 📖 THỨ TỰ ĐỌC ĐỀ XUẤT

```
1. plan.md              → Hiểu lộ trình, sprint, phân công
2. SRS_v2.md            → FR, NFR, API endpoints đầy đủ
3. 09_Architecture...   → Kiến trúc 3-tier, Tauri, JWT
4. 02_ClassDiagram_v2   → BUS/DAL class design
5. 03_ERD.md            → DB schema chi tiết
6. ETMS_DB.sql          → Chạy để tạo database
```

---

## 📊 SỐ LIỆU TỔNG QUAN v4.0

| Thành phần | Số lượng |
|---|---|
| Functional Requirements (FR) | 11 nhóm, 25+ UC |
| Non-Functional Requirements (NFR) | 5 nhóm |
| API Endpoints | 35+ REST endpoints |
| Database Tables | **16 bảng**, 13 indexes, 2 SPs |
| BUS Classes | 14 |
| DAL Classes | 15 |
| React Pages | 15 |
| DTO + Enum | 12 DTOs + 10 Enums |
| Test Cases | 67 (PCL) + 12 (Security) |
| UML Diagrams | 35+ diagrams |

---

## 🏗️ STACK CÔNG NGHỆ v4.0

| Tầng | Công nghệ |
|---|---|
| **Desktop Shell** | Tauri v2 (~8MB, Win/Mac/Linux) |
| **Frontend** | React 18 + Vite + TypeScript + Tailwind + shadcn/ui |
| **Backend** | ASP.NET Core 8 Minimal API (sidecar) |
| **Logic** | C# BUS/DAL/DTO (.NET 8, BCrypt) |
| **Database** | SQL Server 2019+ (16 bảng) |

---

## ✅ CHECKLIST HOÀN THIỆN

| Hạng mục | Trạng thái |
|---|---|
| SRS v4.0 (Tauri + React + API) | ✅ |
| Architecture Design v4.0 | ✅ |
| Plan v4.0 (Sprint 0–4) | ✅ |
| Database SQL v4.0 (16 bảng + SPs) | ✅ |
| React UI Design (15 pages) | ✅ (DesignUI/ETMSUI) |
| ETMS.Core class library | ✅ (Build OK) |
| ETMS.Api project | ✅ (Partial — Auth, Overview) |
| ETMS.Desktop (Tauri shell) | ⏳ Sprint 2 |
| Use Case / Class / ERD Diagrams | ✅ |
| Sequence / State / Activity | ✅ |
| Security Threat Model | ✅ |
| Traceability Matrix | ✅ |
| Risk Register | ✅ |
| Test Workbook (67 TCs) | ✅ |

**🎯 Specification Phase: 100% | Implementation: ~25%**
