using System;
using System.Collections.Generic;
using System.Linq;
using ETMS.DAL;
using ETMS.DTO;

namespace ETMS.BUS
{
    public class MatchBUS
    {
        private readonly MatchDAL _matchDAL = new();
        private readonly CheckInDAL _checkInDAL = new();
        private readonly ResultDAL _resultDAL = new();

        public MatchDTO? GetByID(int matchID) => _matchDAL.GetByID(matchID);

        public List<MatchDTO> GetMatchesByTournament(int tournamentID) => _matchDAL.GetByTournament(tournamentID);

        public List<MatchDTO> GetPendingCheckInMatches(int tournamentID) => _matchDAL.GetPendingCheckIn(tournamentID);

        public MatchResultDTO? GetResultByMatch(int matchID) => _resultDAL.GetByMatch(matchID);

        public (bool success, string message) SetScheduledTime(int matchID, DateTime scheduledTime)
        {
            if (scheduledTime < DateTime.Now)
                return (false, "Thời gian dự kiến thi đấu không được nằm trong quá khứ.");
                
            _matchDAL.SetScheduledTime(matchID, scheduledTime);
            return (true, "Lên lịch thành công.");
        }

        public void OpenCheckInForUpcomingMatches(int tournamentID)
        {
            _matchDAL.OpenCheckIn(tournamentID);
        }

        public (bool success, string message) ConfirmCheckIn(int matchID, int teamSlot)
        {
            if (teamSlot != 1 && teamSlot != 2)
                return (false, "Team slot không hợp lệ (chỉ chấp nhận 1 hoặc 2).");

            var result = _checkInDAL.ConfirmCheckIn(matchID, teamSlot);
            return (result.Success, result.Message);
        }

        public (bool success, string message, int affectedCount) ProcessWalkovers(int tournamentID)
        {
            var affectedMatches = _checkInDAL.ApplyWalkoverForOverdue(tournamentID);
            if (affectedMatches.Any())
                return (true, $"Đã xử lý Walkover tự động cho {affectedMatches.Count} trận đấu.", affectedMatches.Count);
                
            return (true, "Không có trận đấu nào quá hạn Check-in.", 0);
        }
    }
}
