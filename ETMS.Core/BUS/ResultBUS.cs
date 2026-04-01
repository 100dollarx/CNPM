using System;
using System.Collections.Generic;
using System.IO;
using ETMS.DAL;
using ETMS.DTO;

namespace ETMS.BUS
{
    public class ResultBUS
    {
        private readonly ResultDAL _resultDAL = new();
        private readonly MatchDAL _matchDAL = new();

        /// <summary>
        /// NFR-2: File Validation (.jpg/.png, < 5MB).
        /// Fix B-10: Validate score (không âm, không bằng nhau trong Single Elimination).
        /// </summary>
        public (bool success, string message) SubmitResult(int matchID, int score1, int score2, string filePath)
        {
            if (score1 < 0 || score2 < 0)
                return (false, "Điểm số không được âm.");

            if (score1 == score2)
                return (false, "Điểm số không được bằng nhau — cần có đội thắng rõ ràng (Single Elimination).");

            if (!string.IsNullOrEmpty(filePath))
            {
                var ext = Path.GetExtension(filePath).ToLower();
                if (ext != ".jpg" && ext != ".png")
                    return (false, "Chỉ chấp nhận upload file ảnh định dạng .jpg hoặc .png.");

                var fileInfo = new FileInfo(filePath);
                if (fileInfo.Exists && fileInfo.Length > 5 * 1024 * 1024)
                    return (false, "Kích thước file ảnh không được vượt quá 5MB.");
            }

            var dto = new MatchResultDTO
            {
                MatchID = matchID,
                Score1 = score1,
                Score2 = score2,
                EvidenceURL = filePath,
                SubmittedBy = Session.CurrentUser?.UserID ?? 0
            };

            int id = _resultDAL.SaveResult(dto);
            return (id > 0, id > 0 ? "Nộp kết quả thành công. Đang chờ Admin xác thực." : "Lỗi hệ thống khi lưu kết quả.");
        }

        public List<MatchResultDTO> GetPendingResults(int tournamentID) => _resultDAL.GetPendingVerification(tournamentID);

        public MatchResultDTO? GetByResultID(int resultID) => _resultDAL.GetByResultID(resultID);

        public MatchResultDTO? GetByMatch(int matchID) => _resultDAL.GetByMatch(matchID);

        /// <summary>
        /// Admin phê duyệt kết quả. Tự động xác định Winner/Loser từ Score.
        /// </summary>
        public (bool success, string message) ApproveResult(int resultID, int matchID)
        {
            if (!Session.IsAdmin) return (false, "Chỉ Admin mới có quyền duyệt kết quả thi đấu.");

            var result = _resultDAL.GetByMatch(matchID);
            if (result == null) return (false, "Không tìm thấy kết quả cho trận đấu này.");

            var match = _matchDAL.GetByID(matchID);
            if (match == null) return (false, "Không tìm thấy trận đấu.");
            if (!match.Team1ID.HasValue || !match.Team2ID.HasValue)
                return (false, "Trận đấu chưa đủ 2 đội.");

            int winnerID, loserID;
            if (result.Score1 > result.Score2)
            { winnerID = match.Team1ID.Value; loserID = match.Team2ID.Value; }
            else if (result.Score2 > result.Score1)
            { winnerID = match.Team2ID.Value; loserID = match.Team1ID.Value; }
            else
                return (false, "Điểm bằng nhau — không thể xác định đội thắng.");

            _resultDAL.UpdateStatus(resultID, "Verified", Session.CurrentUser!.UserID);
            bool ok = _matchDAL.SetWinnerAndAdvance(matchID, winnerID, loserID, "Completed");
            return (ok, ok ? "Duyệt kết quả thành công. Nhánh đấu đã tự động cập nhật." : "Lỗi DAL khi cập nhật.");
        }

        /// <summary>Overload cho backward compatibility (GUI truyền WinnerID/LoserID).</summary>
        public (bool success, string message) ApproveResult(int resultID, int matchID, int winnerID, int loserID)
        {
            if (!Session.IsAdmin) return (false, "Chỉ Admin mới có quyền duyệt kết quả thi đấu.");
            _resultDAL.UpdateStatus(resultID, "Verified", Session.CurrentUser!.UserID);
            bool ok = _matchDAL.SetWinnerAndAdvance(matchID, winnerID, loserID, "Completed");
            return (ok, ok ? "Duyệt kết quả thành công." : "Lỗi DAL khi cập nhật.");
        }
        
        public (bool success, string message) RejectResult(int resultID, string reason)
        {
            if (!Session.IsAdmin) return (false, "Chỉ Admin mới có quyền từ chối kết quả.");
            if (string.IsNullOrWhiteSpace(reason))
                return (false, "Vui lòng nhập lý do từ chối.");
            _resultDAL.UpdateStatus(resultID, "Rejected", Session.CurrentUser!.UserID);
            return (true, $"Đã từ chối kết quả với lý do: {reason}");
        }
    }
}
