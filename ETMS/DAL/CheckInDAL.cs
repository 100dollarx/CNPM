using Microsoft.Data.SqlClient;
using ETMS.DTO;

namespace ETMS.DAL
{
    /// <summary>
    /// CheckInDAL — Serializable Transaction để ngăn Race Condition.
    /// NFR-2: Khi nhiều đội cùng check-in, chỉ 1 transaction được thực thi tại một thời điểm.
    /// </summary>
    public class CheckInDAL
    {
        /// <summary>
        /// Xác nhận check-in cho 1 đội trong 1 trận.
        /// teamSlot: 1 = Team1, 2 = Team2
        /// </summary>
        public CheckInResult ConfirmCheckIn(int matchID, int teamSlot)
        {
            using var conn = DBConnection.GetConnection();
            conn.Open();
            // IsolationLevel.Serializable: Ngăn chặn đọc "phantom" rows
            var trans = conn.BeginTransaction(System.Data.IsolationLevel.Serializable);
            try
            {
                // Đọc trạng thái hiện tại của trận (WITH UPDLOCK, SERIALIZABLE)
                string readSql = @"
                    SELECT Status, CheckIn1, CheckIn2, ScheduledTime
                    FROM tblMatch WITH (UPDLOCK, ROWLOCK)
                    WHERE MatchID = @id";
                string status = "";
                bool ci1 = false, ci2 = false;
                DateTime? scheduled = null;

                using (var cmd = new SqlCommand(readSql, conn, trans))
                {
                    cmd.Parameters.AddWithValue("@id", matchID);
                    using var dr = cmd.ExecuteReader();
                    if (!dr.Read())
                    {
                        trans.Rollback();
                        return new CheckInResult { Success = false, Message = "Trận đấu không tồn tại." };
                    }
                    status    = dr.GetString(0);
                    ci1       = dr.GetBoolean(1);
                    ci2       = dr.GetBoolean(2);
                    scheduled = dr.IsDBNull(3) ? null : dr.GetDateTime(3);
                }

                // Kiểm tra: cổng check-in có mở không
                if (status != "CheckInOpen" && status != "Scheduled")
                {
                    trans.Rollback();
                    return new CheckInResult { Success = false, Message = $"Cổng check-in chưa mở (Status: {status})." };
                }

                // Kiểm tra: đã check-in rồi chưa
                if (teamSlot == 1 && ci1) { trans.Rollback(); return new CheckInResult { Success = false, Message = "Đội đã check-in rồi." }; }
                if (teamSlot == 2 && ci2) { trans.Rollback(); return new CheckInResult { Success = false, Message = "Đội đã check-in rồi." }; }

                // Cập nhật check-in
                string col = teamSlot == 1 ? "CheckIn1" : "CheckIn2";
                bool bothCheckedIn = teamSlot == 1 ? (true && ci2) : (ci1 && true);
                string newStatus = bothCheckedIn ? "Live" : "CheckInOpen";

                using (var cmd = new SqlCommand($@"
                    UPDATE tblMatch
                    SET {col} = 1, Status = @newStatus
                    WHERE MatchID = @id", conn, trans))
                {
                    cmd.Parameters.AddWithValue("@newStatus", newStatus);
                    cmd.Parameters.AddWithValue("@id",        matchID);
                    cmd.ExecuteNonQuery();
                }

                trans.Commit();
                return new CheckInResult
                {
                    Success        = true,
                    Message        = bothCheckedIn ? "Cả 2 đội đã check-in. Trận bắt đầu!" : "Check-in thành công. Đang chờ đối thủ...",
                    BothCheckedIn  = bothCheckedIn
                };
            }
            catch (Exception ex)
            {
                trans.Rollback();
                return new CheckInResult { Success = false, Message = $"Lỗi hệ thống: {ex.Message}" };
            }
        }

        /// <summary>
        /// Áp dụng Walkover cho đội không check-in kịp giờ.
        /// Gọi bởi timer trong MatchBUS.
        /// </summary>
        public List<int> ApplyWalkoverForOverdue(int tournamentID)
        {
            var affected = new List<int>();
            using var conn = DBConnection.GetConnection();
            conn.Open();
            // Tìm các trận check-in đã hết hạn
            const string findSql = @"
                SELECT MatchID, CheckIn1, CheckIn2, Team1ID, Team2ID
                FROM tblMatch
                WHERE TournamentID = @tid
                  AND Status IN ('CheckInOpen','Scheduled')
                  AND IsBye = 0
                  AND ScheduledTime IS NOT NULL
                  AND ScheduledTime < GETDATE()";

            var overdue = new List<(int matchID, bool ci1, bool ci2, int? t1, int? t2)>();
            using (var cmd = new SqlCommand(findSql, conn))
            {
                cmd.Parameters.AddWithValue("@tid", tournamentID);
                using var dr = cmd.ExecuteReader();
                while (dr.Read())
                    overdue.Add((dr.GetInt32(0), dr.GetBoolean(1), dr.GetBoolean(2),
                                 dr.IsDBNull(3) ? null : dr.GetInt32(3),
                                 dr.IsDBNull(4) ? null : dr.GetInt32(4)));
            }

            foreach (var (matchID, ci1, ci2, t1, t2) in overdue)
            {
                // Xác định đội thắng: đội nào đã check-in thì thắng
                int? winnerID = null;
                int? loserID  = null;
                if (ci1 && !ci2) { winnerID = t1; loserID = t2; }
                else if (!ci1 && ci2) { winnerID = t2; loserID = t1; }
                else { winnerID = t1; loserID = t2; } // cả 2 đều không check-in → Team1 mặc định

                if (winnerID.HasValue)
                {
                    var matchDal = new MatchDAL();
                    matchDal.SetWinnerAndAdvance(matchID, winnerID.Value, loserID ?? 0, "Walkover");
                    affected.Add(matchID);
                }
            }
            return affected;
        }
    }

    public class CheckInResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = "";
        public bool BothCheckedIn { get; set; }
    }
}
