using ETMS.DAL;
using ETMS.DTO;

namespace ETMS.BUS
{
    /// <summary>
    /// TournamentBUS — Quản lý vòng đời giải đấu.
    /// GUI gọi BUS, BUS gọi DAL — đảm bảo kiến trúc 3 Layer.
    /// </summary>
    public class TournamentBUS
    {
        private readonly TournamentDAL _dal = new();

        public List<TournamentDTO> GetAll() => _dal.GetAll();

        public TournamentDTO? GetByID(int id) => _dal.GetByID(id);

        /// <summary>
        /// Tạo giải đấu mới. Chỉ Admin mới được phép (RBAC — NFR-1.3).
        /// </summary>
        public (int id, string error) CreateTournament(TournamentDTO dto)
        {
            if (!Session.IsAdmin)
                return (0, "Chỉ Admin mới có quyền tạo giải đấu.");

            if (string.IsNullOrWhiteSpace(dto.Name))
                return (0, "Tên giải đấu không được để trống.");

            if (dto.MaxTeams < 2)
                return (0, "Số đội tối đa phải >= 2.");

            if (dto.MinPlayersPerTeam < 1)
                return (0, "Số thành viên tối thiểu phải >= 1.");

            dto.CreatedBy = Session.CurrentUser!.UserID;
            dto.Status = "Draft";

            int id = _dal.Insert(dto);
            return (id, "");
        }

        /// <summary>Cập nhật thông tin giải đấu (chỉ khi Status = Draft hoặc Registration).</summary>
        public (bool ok, string error) UpdateTournament(TournamentDTO dto)
        {
            if (!Session.IsAdmin)
                return (false, "Chỉ Admin mới có quyền chỉnh sửa giải đấu.");

            var existing = _dal.GetByID(dto.TournamentID);
            if (existing == null)
                return (false, "Giải đấu không tồn tại.");

            // Chỉ khóa khi Completed/Cancelled — cho phép sửa GameType/Format kể cả Active
            if (existing.Status == "Completed" || existing.Status == "Cancelled")
                return (false, "Không thể chỉnh sửa giải đấu đã hoàn thành hoặc bị hủy.");

            _dal.Update(dto);
            return (true, "");
        }

        /// <summary>
        /// Chuyển trạng thái giải đấu theo vòng đời:
        /// Draft → Registration → Active → Completed
        /// </summary>
        public (bool ok, string error) AdvanceStatus(int tournamentID)
        {
            if (!Session.IsAdmin)
                return (false, "Chỉ Admin mới có quyền thay đổi trạng thái giải đấu.");

            var tour = _dal.GetByID(tournamentID);
            if (tour == null)
                return (false, "Giải đấu không tồn tại.");

            string nextStatus = tour.Status switch
            {
                "Draft"        => "Registration",
                "Registration" => "Active",
                "Active"       => "Completed",
                _              => ""
            };

            if (string.IsNullOrEmpty(nextStatus))
                return (false, $"Không thể chuyển trạng thái từ '{tour.Status}'.");

            _dal.UpdateStatus(tournamentID, nextStatus);
            return (true, $"Đã chuyển trạng thái sang '{nextStatus}'.");
        }

        /// <summary>Xóa giải đấu (chỉ khi Draft).</summary>
        public (bool ok, string error) DeleteTournament(int tournamentID)
        {
            if (!Session.IsAdmin)
                return (false, "Chỉ Admin mới có quyền xóa giải đấu.");

            var tour = _dal.GetByID(tournamentID);
            if (tour == null) return (false, "Giải đấu không tồn tại.");
            if (tour.Status != "Draft")
                return (false, "Chỉ có thể xóa giải đấu ở trạng thái Bản nháp (Draft).");

            _dal.Delete(tournamentID);
            return (true, "");
        }
    }
}
