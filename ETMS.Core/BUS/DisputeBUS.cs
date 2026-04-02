using ETMS.DAL;
using ETMS.DTO;

namespace ETMS.BUS
{
    /// <summary>
    /// DisputeBUS — FR-8: He thong Khieu nai.
    /// </summary>
    public class DisputeBUS
    {
        private readonly DisputeDAL _dal = new();

        /// <summary>Captain gui khieu nai.</summary>
        public (bool success, string message) FileDispute(int matchID, int teamID,
            string description, string? evidenceURL)
        {
            if (string.IsNullOrWhiteSpace(description))
                return (false, "Ly do khieu nai khong duoc de trong.");

            if (description.Length > 1000)
                return (false, "Noi dung khieu nai khong duoc qua 1000 ky tu.");

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
                ? (true, $"Tiep nhan thanh cong don khieu nai #{id}.")
                : (false, "Loi he thong khi luu khieu nai.");
        }

        /// <summary>Lay tat ca khieu nai theo giai dau.</summary>
        public List<DisputeDTO> GetByTournament(int tournamentID) =>
            _dal.GetByTournament(tournamentID);

        /// <summary>Lay tat ca khieu nai (khong filter).</summary>
        public List<DisputeDTO> GetAll() =>
            _dal.GetAll();

        /// <summary>Admin giai quyet khieu nai — chap nhan.</summary>
        public (bool ok, string message) ResolveDispute(int disputeID, string adminNote)
        {
            if (string.IsNullOrWhiteSpace(adminNote))
                return (false, "Vui long nhap ghi chu phan quyet.");

            _dal.Resolve(disputeID, adminNote.Trim());
            return (true, "Da giai quyet khieu nai thanh cong.");
        }

        /// <summary>Admin bac bo khieu nai.</summary>
        public (bool ok, string message) DismissDispute(int disputeID, string adminNote)
        {
            if (string.IsNullOrWhiteSpace(adminNote))
                return (false, "Vui long nhap ly do bac bo.");

            _dal.Dismiss(disputeID, adminNote.Trim());
            return (true, "Da bac bo khieu nai.");
        }
    }
}

