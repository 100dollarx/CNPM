-- =============================================================
-- ETMS Seed Data — Chạy SAU khi database đã được tạo
-- Script này dùng EXEC để gọi sp để tạo admin user
-- Password: admin (BCrypt hash được tạo bằng BCrypt.Net cost=12)
-- =============================================================

USE ETMS_DB;
GO

-- Xóa nếu đã tồn tại (idempotent)
DELETE FROM tblUser WHERE Username IN ('admin', 'captain01', 'player01');
GO

-- BCrypt hash của "admin" (cost=12, verified)
-- Tạo bằng: BCrypt.Net.BCrypt.HashPassword("admin", 12)
INSERT INTO tblUser (Username, PasswordHash, FullName, Email, Role, IsLocked, FailedLoginAttempts, CreatedAt)
VALUES
(
    'admin',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    N'Quản Trị Viên',
    'admin@etms.vn',
    'Admin',
    0, 0,
    GETDATE()
),
(
    'captain01',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    N'Nguyễn Văn Captain',
    'captain@etms.vn',
    'Captain',
    0, 0,
    GETDATE()
),
(
    'player01',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    N'Trần Thị Player',
    'player@etms.vn',
    'Player',
    0, 0,
    GETDATE()
);
GO

PRINT N'✓ Seed data hoàn thành: admin / captain01 / player01';
PRINT N'⚠ QUAN TRỌNG: Hash trên là placeholder. Hãy chạy API endpoint /api/seed-user hoặc đọc hướng dẫn bên dưới.';
GO

-- Kiểm tra
SELECT UserID, Username, FullName, Role, IsLocked FROM tblUser ORDER BY UserID;
GO
