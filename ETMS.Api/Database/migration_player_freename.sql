-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION: Cho phép thêm thành viên tự do (không cần account)
-- Chạy trong SSMS kết nối ETMS_DB
-- ═══════════════════════════════════════════════════════════════════

-- 1. Bỏ FK ràng buộc NOT NULL trên UserID
ALTER TABLE tblPlayer DROP CONSTRAINT FK_Player_User;
GO

-- 2. Cho phép UserID = NULL (player không cần có account)
ALTER TABLE tblPlayer ALTER COLUMN UserID INT NULL;
GO

-- 3. Thêm cột FullName để lưu tên tự nhập (khi không có account)
ALTER TABLE tblPlayer ADD FullName NVARCHAR(100) NULL;
GO

-- 4. Khôi phục FK (nullable FK hoàn toàn hợp lệ trong SQL Server)
ALTER TABLE tblPlayer ADD CONSTRAINT FK_Player_User
    FOREIGN KEY (UserID) REFERENCES tblUser(UserID);
GO

-- 5. Backfill FullName từ tblUser cho các player đã có UserID
UPDATE p
SET p.FullName = u.FullName
FROM tblPlayer p
INNER JOIN tblUser u ON u.UserID = p.UserID
WHERE p.FullName IS NULL;
GO

SELECT 'Migration complete. tblPlayer now supports free-form FullName.' AS Status;
