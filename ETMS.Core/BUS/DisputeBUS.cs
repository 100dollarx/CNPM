using ETMS.DAL;
using ETMS.DTO;

namespace ETMS.BUS
{
    /// <summary>
    /// DisputeBUS — FR-8: Hệ thống Khiếu nại.
    /// Xử lý logic nghiệp vụ: validation, quyền hạn, gọi DisputeDAL.
    /// </summary>
    public class DisputeBUS
    {
        private readonly DisputeDAL _dal = new();

        /// <summary>Captain gửi khiếu nại cho một trận đấu.</summary>
        public (bool success, string message) FileDispute(int matchID, int teamID,
            string description, string? evidenceURL)
        {
            if (string.IsNullOrWhiteSpace(description))
                return (false, "Lý do khiếu nại không được để trống.");

            if (description.Length > 1000)
                return (false, "Nội dung khiếu nại không được quá 1000 ký tự.");

            // Validate evidence file nếu có
            if (!string.IsNullOrEmpty(evidenceURL))
            {
                var ext = System.IO.Path.GetExtension(evidenceURL).ToLower();
                if (ext != ".jpg" && ext != ".png" && ext != ".mp4")
                    return (false, "Bằng chứng chỉ chấp nhận định dạng .jpg, .png hoặc .mp4.");
            }

            var dto = new DisputeDTO
            {
                MatchID       = matchID,
                FiledByTeamID = teamID,
                Description   = description.Trim(),
                EvidenceURL   = evidenceURL
            };

            int id = _dal.Insert(dto);
            return id > 0
                ? (true, $"Tiếp nhận thành công đơn khiếu nại #{id}. Admin sẽ xem xét và phản hồi.")
                : (false, "Lỗi hệ thống khi lưu khiếu nại.");
        }

        /// <summary>Lấy tất cả khiếu nại theo giải đấu.</summary>
        public List<DisputeDTO> GetByTournament(int tournamentID) =>
            _dal.GetByTournament(tournamentID);

        /// <summary>Admin giải quyết khiếu nại — chấp nhận.</summary>
        public (bool ok, string message) ResolveDispute(int disputeID, string adminNote)
        {
            if (!Session.IsAdmin)
                return (false, "Chỉ Admin mới có quyền giải quyết khiếu nại.");
            if (string.IsNullOrWhiteSpace(adminNote))
                return (false, "Vui lòng nhập ghi chú phán quyết.");

            _dal.Resolve(disputeID, adminNote.Trim());
            return (true, "Đã giải quyết khiếu nại thành công.");
        }

        /// <summary>Admin bác bỏ khiếu nại.</summary>
        public (bool ok, string message) DismissDispute(int disputeID, string adminNote)
        {
            if (!Session.IsAdmin)
                return (false, "Chỉ Admin mới có quyền bác bỏ khiếu nại.");
            if (string.IsNullOrWhiteSpace(adminNote))
                return (false, "Vui lòng nhập lý do bác bỏ.");

            _dal.Dismiss(disputeID, adminNote.Trim());
            return (true, "Đã bác bỏ khiếu nại.");
        }
    }
}
