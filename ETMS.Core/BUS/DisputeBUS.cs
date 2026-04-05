using ETMS.DAL;
using ETMS.DTO;

namespace ETMS.BUS
{
    /// <summary>
    /// DisputeBUS — FR-9: Hệ thống Khiếu nại.
    /// </summary>
    public class DisputeBUS
    {
        private readonly DisputeDAL _dal = new();

        /// <summary>Captain gửi khiếu nại.</summary>
        public (bool success, string message) FileDispute(int matchID, int teamID,
            string description, string? evidenceURL)
        {
            if (string.IsNullOrWhiteSpace(description))
                return (false, "Lý do khiếu nại không được để trống.");

            if (description.Length > 1000)
                return (false, "Nội dung khiếu nại không được quá 1000 ký tự.");

            // Allow URLs (not just file extensions) for web-based evidence
            var dto = new DisputeDTO
            {
                MatchID       = matchID,
                FiledByTeamID = teamID,
                Description   = description.Trim(),
                EvidenceURL   = evidenceURL
            };

            int id = _dal.Insert(dto);
            return id > 0
                ? (true, $"Tiếp nhận thành công đơn khiếu nại #{id}.")
                : (false, "Lỗi hệ thống khi lưu khiếu nại.");
        }

        /// <summary>Lấy tất cả khiếu nại theo giải đấu.</summary>
        public List<DisputeDTO> GetByTournament(int tournamentID) =>
            _dal.GetByTournament(tournamentID);

        /// <summary>Lấy tất cả khiếu nại (không filter).</summary>
        public List<DisputeDTO> GetAll() =>
            _dal.GetAll();

        /// <summary>Admin giải quyết khiếu nại — chấp nhận.</summary>
        public (bool ok, string message) ResolveDispute(int disputeID, string adminNote)
        {
            if (string.IsNullOrWhiteSpace(adminNote))
                return (false, "Vui lòng nhập ghi chú phân quyết.");

            _dal.Resolve(disputeID, adminNote.Trim());
            return (true, "Đã giải quyết khiếu nại thành công.");
        }

        /// <summary>Admin bác bỏ khiếu nại.</summary>
        public (bool ok, string message) DismissDispute(int disputeID, string adminNote)
        {
            if (string.IsNullOrWhiteSpace(adminNote))
                return (false, "Vui lòng nhập lý do bác bỏ.");

            _dal.Dismiss(disputeID, adminNote.Trim());
            return (true, "Đã bác bỏ khiếu nại.");
        }
    }
}
