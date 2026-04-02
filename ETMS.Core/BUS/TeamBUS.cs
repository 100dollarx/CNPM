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
            if (tourn.Status != "Registration")
                return (0, "Giải đấu không còn nhận đơn đăng ký.");

            var dto = new TeamDTO
            {
                TournamentID = tournamentID,
                Name         = name.Trim(),
                CaptainID    = captainID,
                LogoURL      = logoURL
            };
            int id = _teamDal.InsertTeam(dto);
            return (id, "");
        }

        /// <summary>
        /// Thêm thành viên vào đội — kiểm tra ràng buộc SRS FR-1.
        /// NFR: 1 thành viên không được thuộc 2 đội cùng tournament.
        /// </summary>
        public (bool success, string error) AddPlayer(
            int teamID, int tournamentID, string fullName, string inGameID)
        {
            if (string.IsNullOrWhiteSpace(inGameID))
                return (false, "InGameID không được để trống.");

            // Validation: không thuộc 2 đội
            if (_teamDal.IsPlayerInOtherTeam(inGameID, tournamentID, teamID))
                return (false, $"InGameID '{inGameID}' đã đăng ký trong đội khác của giải đấu này.");

            // Kiểm tra số thành viên tối thiểu / tối đa
            var players = _teamDal.GetPlayers(teamID);
            if (players.Count >= 10)
                return (false, "Đội đã đạt số lượng thành viên tối đa (10 người).");

            _teamDal.AddPlayer(new PlayerDTO
            {
                TeamID   = teamID,
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
