using ETMS.DAL;
using ETMS.DTO;

namespace ETMS.BUS
{
    public class TeamBUS
    {
        private readonly TeamDAL _teamDal = new();
        private readonly TournamentDAL _tournDal = new();

        public List<TeamDTO> GetByTournament(int tournamentID) =>
            _teamDal.GetByTournament(tournamentID);

        /// <summary>Lấy toàn bộ đội không lọc tournament — dùng cho GET /api/teams không có params.</summary>
        public List<TeamDTO> GetAllTeams() => _teamDal.GetByTournament(0);

        public List<TeamDTO> GetApproved(int tournamentID) =>
            _teamDal.GetApprovedTeams(tournamentID);

        public List<PlayerDTO> GetPlayers(int teamID) =>
            _teamDal.GetPlayers(teamID);

        public TeamDTO? GetByID(int teamID) => _teamDal.GetByID(teamID);

        /// <summary>
        /// Captain tạo đội mới. Trả về (teamID, thông báo lỗi).
        /// </summary>
        public (int teamID, string error) CreateTeam(int tournamentID, string name,
            int captainID, string? logoURL = null)
        {
            if (string.IsNullOrWhiteSpace(name))
                return (0, "Tên đội không được để trống.");

            var tourn = _tournDal.GetByID(tournamentID);
            if (tourn == null)
                return (0, "Giải đấu không tồn tại.");

            // Captain: chỉ được đăng ký khi giải đang ở trạng thái Registration (SRS FR-2.1)
            // Admin: có thể tạo đội cho mọi trạng thái trừ Completed/Cancelled
            bool isAdmin = Session.CurrentUser?.Role == "Admin";
            if (!isAdmin && tourn.Status != "Registration")
                return (0, "Giải đấu không còn nhận đơn đăng ký.");
            if (tourn.Status is "Completed" or "Cancelled")
                return (0, "Không thể tạo đội cho giải đấu đã kết thúc hoặc bị hủy.");

            // Check: 1 Captain chỉ được 1 đội/giải đang hoạt động
            var existingTeams = _teamDal.GetByTournament(tournamentID);
            bool alreadyHasTeam = existingTeams.Any(t =>
                t.CaptainID == captainID &&
                t.Status != "Rejected" && t.Status != "Disqualified");
            if (alreadyHasTeam && !isAdmin)
                return (0, "Bạn đã đăng ký 1 đội trong giải đấu này rồi. Mỗi Captain chỉ được quản lý 1 đội/giải.");

            // Check: tên đội không được trùng với đội khác đang active trong cùng giải
            bool nameExists = existingTeams.Any(t =>
                t.Name.Equals(name.Trim(), StringComparison.OrdinalIgnoreCase) &&
                t.Status != "Rejected" && t.Status != "Disqualified");
            if (nameExists)
                return (0, $"Tên đội '{name.Trim()}' đã được sử dụng trong giải đấu này. Vui lòng chọn tên khác.");

            // Check: tên đội 2–50 ký tự
            if (name.Trim().Length < 2 || name.Trim().Length > 50)
                return (0, "Tên đội phải từ 2 đến 50 ký tự.");

            var dto = new TeamDTO
            {
                TournamentID = tournamentID,
                Name         = name.Trim(),
                CaptainID    = captainID,
                LogoURL      = logoURL
            };
            try
            {
                int id = _teamDal.InsertTeam(dto);
                return (id, "");
            }
            catch (Exception ex)
            {
                var msg = ex.Message + (ex.InnerException?.Message ?? "");
                if (msg.Contains("UQ_Captain_Per_Tournament") || msg.Contains("UNIQUE KEY"))
                    return (0, "Bạn đã có 1 đội trong giải đấu này rồi. Mỗi Captain chỉ được đăng ký 1 đội/giải.");
                throw;
            }
        }

        /// <summary>
        /// Thêm thành viên đội bằng InGameID tự do — không cần tài khoản hệ thống.
        /// NFR: 1 thành viên không được thuộc 2 đội cùng tournament.
        /// </summary>
        public (bool success, string error) AddPlayer(
            int teamID, int tournamentID, string fullName, string inGameID)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                return (false, "Tên thật không được để trống.");
            if (string.IsNullOrWhiteSpace(inGameID))
                return (false, "InGameID không được để trống.");

            // Validate InGameID format: 2–30 ký tự, không chứa ký tự đặc biệt nguy hiểm
            if (inGameID.Trim().Length < 2 || inGameID.Trim().Length > 30)
                return (false, "InGameID phải từ 2 đến 30 ký tự.");

            // Validate FullName length
            if (fullName.Trim().Length > 100)
                return (false, "Tên thật không được quá 100 ký tự.");

            // Check: InGameID không được trùng trong cùng đội
            var players = _teamDal.GetPlayers(teamID);
            if (players.Any(p => p.InGameID.Equals(inGameID.Trim(), StringComparison.OrdinalIgnoreCase)))
                return (false, $"InGameID '{inGameID.Trim()}' đã có trong đội này rồi.");

            // Validation: không thuộc 2 đội cùng giải theo InGameID
            if (_teamDal.IsPlayerInOtherTeam(inGameID, tournamentID, teamID))
                return (false, $"InGameID '{inGameID}' đã đăng ký trong đội khác của giải đấu này.");

            // Kiểm tra số thành viên tối đa (dùng lại biến players đã query ở trên)
            if (players.Count >= 10)
                return (false, "Đội đã đạt số lượng thành viên tối đa (10 người).");

            _teamDal.AddPlayer(new PlayerDTO
            {
                TeamID   = teamID,
                UserID   = null,          // Không yêu cầu tài khoản
                FullName = fullName.Trim(),
                InGameID = inGameID.Trim()
            });
            return (true, "");
        }

        public void RemovePlayer(int playerID) => _teamDal.RemovePlayer(playerID);

        /// <summary>Admin phê duyệt đội.</summary>
        public (bool ok, string error) ApproveTeam(int teamID, int tournamentID, int minPlayers)
        {
            var players = _teamDal.GetPlayers(teamID);
            if (players.Count < minPlayers)
                return (false, $"Đội cần ít nhất {minPlayers} thành viên (hiện có {players.Count}).");

            _teamDal.UpdateStatus(teamID, "Approved");
            return (true, "");
        }

        public void RejectTeam(int teamID, string reason) =>
            _teamDal.UpdateStatus(teamID, "Rejected", reason);

        /// <summary>Admin loại đội khỏi giải đấu (Disqualified — khác với Rejected).</summary>
        public (bool ok, string error) DisqualifyTeam(int teamID, string reason)
        {
            if (!Session.IsAdmin)
                return (false, "Chỉ Admin mới có quyền loại đội.");
            var team = _teamDal.GetByID(teamID);
            if (team == null) return (false, "Đội không tồn tại.");
            if (team.Status == "Rejected") return (false, "Đội đã bị từ chối, không thể loại.");
            _teamDal.UpdateStatus(teamID, "Disqualified", reason);
            return (true, $"Đã loại đội '{team.Name}' khỏi giải đấu.");
        }
    }
}
