-- =============================================================
-- ETMS Seed Data — Chạy script này SAU KHI tạo database xong
-- BCrypt hash của "admin" (cost=12) được generate sẵn
-- =============================================================

USE ETMS_DB;
GO

-- Tắt constraint tạm để insert
SET IDENTITY_INSERT tblUser OFF;
GO

-- Xóa user cũ nếu tồn tại (để chạy lại an toàn)
DELETE FROM tblUser WHERE Username IN ('admin', 'captain01', 'player01');
GO

-- Password 'admin' hashed với BCrypt cost=12
-- Hash: $2a$12$6UVkHxCPRJiN9n3P2mFwZuFpgBxpDgvKZzYb0sW7Rn3iKR0NXHPTG
DECLARE @AdminHash NVARCHAR(256) = '$2a$12$6UVkHxCPRJiN9n3P2mFwZuFpgBxpDgvKZzYb0sW7Rn3iKR0NXHPTG';

INSERT INTO tblUser (Username, PasswordHash, FullName, Email, Role, IsLocked, FailedLoginAttempts, CreatedAt)
VALUES
    ('admin',     @AdminHash, N'Quản Trị Viên', 'admin@etms.vn',    'Admin',   0, 0, GETDATE()),
    ('captain01', @AdminHash, N'Captain One',   'cap@etms.vn',      'Captain', 0, 0, GETDATE()),
    ('player01',  @AdminHash, N'Player One',    'player@etms.vn',   'Player',  0, 0, GETDATE());
GO

PRINT N'✓ Seed data: 3 users (admin/captain01/player01) — password: admin';
GO

-- Kiểm tra kết quả
SELECT UserID, Username, FullName, Role, IsLocked, CreatedAt
FROM tblUser
ORDER BY UserID;
GO
