# SEQUENCE DIAGRAMS — ETMS (5 Luồng cốt lõi)

> Hệ thống Quản lý Giải đấu Esports | Phiên bản: 1.0

---

## SD-01: Đăng nhập hệ thống (Login)

```mermaid
sequenceDiagram
    actor User
    participant frmLogin
    participant AuthBUS
    participant UserDAL
    participant DBConnection
    participant SessionManager

    User->>frmLogin: Nhập Username + Password → Click Đăng nhập
    frmLogin->>frmLogin: Validate input (không rỗng)
    
    alt Input hợp lệ
        frmLogin->>AuthBUS: Login(username, password)
        AuthBUS->>UserDAL: GetUser(username)
        UserDAL->>DBConnection: GetConnection()
        DBConnection-->>UserDAL: SqlConnection
        UserDAL->>DBConnection: SELECT UserID,PasswordHash,Role,IsLocked,FailedLoginAttempts WHERE Username=@u
        DBConnection-->>UserDAL: UserDTO (hoặc null)
        UserDAL-->>AuthBUS: UserDTO (hoặc null)
        
        alt User không tồn tại
            AuthBUS-->>frmLogin: LoginResult.NOT_FOUND
            frmLogin->>User: ❌ "Thông tin đăng nhập không chính xác"
        else User bị khóa
            AuthBUS-->>frmLogin: LoginResult.LOCKED
            frmLogin->>User: ❌ "Tài khoản bị khóa. Liên hệ Admin."
        else User tồn tại và chưa khóa
            AuthBUS->>AuthBUS: VerifyPassword(inputPwd, storedHash)
            
            alt Mật khẩu đúng
                AuthBUS->>UserDAL: ResetFailedAttempts(userId)
                UserDAL->>DBConnection: UPDATE tblUser SET FailedLoginAttempts=0
                AuthBUS->>SessionManager: SetUser(userDTO)
                AuthBUS-->>frmLogin: LoginResult.SUCCESS
                frmLogin->>frmLogin: NavigateTo(frmDashboard) theo Role
                frmLogin->>User: ✅ Chuyển đến Dashboard
            else Mật khẩu sai
                AuthBUS->>UserDAL: IncrementFailedAttempts(userId)
                UserDAL->>DBConnection: UPDATE tblUser SET FailedLoginAttempts += 1
                
                alt FailedAttempts >= 5
                    AuthBUS->>UserDAL: LockAccount(userId)
                    UserDAL->>DBConnection: UPDATE tblUser SET IsLocked=1
                    AuthBUS-->>frmLogin: LoginResult.LOCKED
                    frmLogin->>User: ❌ "Tài khoản bị khóa sau 5 lần sai"
                else FailedAttempts < 5
                    AuthBUS-->>frmLogin: LoginResult.WRONG_PASSWORD
                    frmLogin->>User: ❌ "Thông tin đăng nhập không chính xác"
                end
            end
        end
    else Input không hợp lệ (rỗng)
        frmLogin->>User: ❌ "Vui lòng điền đầy đủ thông tin"
    end
```

---

## SD-02: Tạo Bracket tự động (Generate Bracket)

```mermaid
sequenceDiagram
    actor Admin
    participant frmBracketView
    participant BracketBUS
    participant TeamDAL
    participant BracketDAL
    participant DBConnection

    Admin->>frmBracketView: Chọn Tournament → Click "Generate Bracket"
    frmBracketView->>BracketBUS: GenerateBracket(tournamentId)
    
    BracketBUS->>TeamDAL: GetApprovedTeams(tournamentId)
    TeamDAL->>DBConnection: SELECT * FROM tblTeam WHERE TournamentID=@id AND Status='Approved'
    DBConnection-->>TeamDAL: List<TeamDTO>
    TeamDAL-->>BracketBUS: teams (N đội)
    
    alt N < 2 đội Approved
        BracketBUS-->>frmBracketView: Error: "Cần ít nhất 2 đội để tạo bracket"
        frmBracketView->>Admin: ❌ Thông báo lỗi
    else N >= 2 đội Approved
        BracketBUS->>BracketBUS: FisherYatesShuffle(teams)
        Note over BracketBUS: Xáo trộn ngẫu nhiên
        
        BracketBUS->>BracketBUS: slots = NextPowerOf2(N)
        BracketBUS->>BracketBUS: byeCount = slots - N
        Note over BracketBUS: VD: N=5 → slots=8, byeCount=3
        
        BracketBUS->>BracketBUS: BuildRound1(teams, byeCount)
        Note over BracketBUS: Tạo Bye matches + Real matches
        
        BracketBUS->>BracketBUS: BuildSubsequentRounds(round1, slots)
        Note over BracketBUS: Vòng 2, 3...Final
        
        BracketBUS->>BracketBUS: LinkNextMatchID(allMatches)
        Note over BracketBUS: Gán NextMatchID (Linked List)
        
        BracketBUS->>BracketDAL: SaveBracket(matches, tournamentId)
        
        BracketDAL->>DBConnection: BEGIN TRANSACTION
        loop Mỗi Match trong Linked List
            BracketDAL->>DBConnection: INSERT INTO tblMatch (...) VALUES (...)
        end
        BracketDAL->>DBConnection: COMMIT TRANSACTION
        DBConnection-->>BracketDAL: SUCCESS
        BracketDAL-->>BracketBUS: BracketDTO
        
        BracketBUS-->>frmBracketView: BracketDTO (cấu trúc cây)
        frmBracketView->>frmBracketView: RenderBracket(bracketDTO)
        frmBracketView->>Admin: ✅ Hiển thị cây nhánh đấu
    end
```

---

## SD-03: Check-in & Auto Walkover

```mermaid
sequenceDiagram
    actor Captain1
    actor Captain2
    participant System_Timer as System (Timer)
    participant frmCheckIn
    participant CheckInBUS
    participant CheckInDAL
    participant MatchDAL
    participant DBConnection

    System_Timer->>System_Timer: Kiểm tra ScheduledTime - 15 phút
    System_Timer->>MatchDAL: OpenCheckIn(matchId)
    MatchDAL->>DBConnection: UPDATE tblMatch SET Status='CheckInOpen' WHERE MatchID=@id
    System_Timer->>frmCheckIn: Mở giao diện Check-in (broadcast)

    par Captain1 Check-in
        Captain1->>frmCheckIn: Click "Xác nhận tham dự"
        frmCheckIn->>CheckInBUS: ConfirmCheckIn(matchId, team1Id)
        CheckInBUS->>CheckInBUS: IsCheckInWindowOpen(matchId)
        CheckInBUS->>CheckInDAL: ConfirmCheckIn(matchId, teamNum=1)
        CheckInDAL->>DBConnection: BEGIN TRANSACTION (IsolationLevel.Serializable)
        CheckInDAL->>DBConnection: UPDATE tblMatch SET CheckIn_Team1=1 WHERE MatchID=@id
        CheckInDAL->>DBConnection: COMMIT
        DBConnection-->>CheckInDAL: SUCCESS
        CheckInDAL-->>CheckInBUS: true
        CheckInBUS-->>frmCheckIn: CheckIn OK
        frmCheckIn->>Captain1: ✅ "Đội 1 đã xác nhận"
    and Captain2 Check-in
        Captain2->>frmCheckIn: Click "Xác nhận tham dự"
        frmCheckIn->>CheckInBUS: ConfirmCheckIn(matchId, team2Id)
        CheckInBUS->>CheckInDAL: ConfirmCheckIn(matchId, teamNum=2)
        CheckInDAL->>DBConnection: BEGIN TRANSACTION (IsolationLevel.Serializable)
        CheckInDAL->>DBConnection: UPDATE tblMatch SET CheckIn_Team2=1 WHERE MatchID=@id
        CheckInDAL->>DBConnection: COMMIT
        CheckInDAL-->>CheckInBUS: true
        CheckInBUS-->>frmCheckIn: CheckIn OK
        frmCheckIn->>Captain2: ✅ "Đội 2 đã xác nhận"
    end

    CheckInBUS->>CheckInBUS: Cả 2 CheckIn = True?
    
    alt Cả 2 đội Check-in thành công
        CheckInBUS->>MatchDAL: UpdateStatus(matchId, 'Live')
        MatchDAL->>DBConnection: UPDATE tblMatch SET Status='Live', ActualStartTime=GETDATE()
        frmCheckIn->>Captain1: ✅ "Trận đấu bắt đầu!"
        frmCheckIn->>Captain2: ✅ "Trận đấu bắt đầu!"
    end

    Note over System_Timer: Khi hết cửa sổ Check-in (ScheduledTime qua)
    
    System_Timer->>CheckInBUS: ProcessWalkover(matchId)
    CheckInBUS->>MatchDAL: GetMatch(matchId)
    MatchDAL-->>CheckInBUS: MatchDTO (với CheckIn_Team1, CheckIn_Team2)
    
    alt Chỉ 1 đội chưa Check-in
        CheckInBUS->>CheckInDAL: ApplyWalkover(matchId, winnerTeamId)
        CheckInDAL->>DBConnection: UPDATE tblMatch SET Status='Walkover', WinnerID=@winnerId
        CheckInBUS->>MatchDAL: AdvanceToNextRound(matchId, winnerId)
        MatchDAL->>DBConnection: UPDATE nextMatch SET Team_X = @winnerId WHERE MatchID = nextMatchID
        frmCheckIn->>Captain1: ⚠️ Thông báo kết quả Walkover
        frmCheckIn->>Captain2: ⚠️ Thông báo kết quả Walkover
    else Cả 2 đội không Check-in
        CheckInBUS->>MatchDAL: UpdateStatus(matchId, 'Walkover')
        Note over CheckInBUS: GAP-01: Trường hợp này chưa rõ,\ncần Admin quyết định
    end
```

---

## SD-04: Nộp & Xác thực Kết quả

```mermaid
sequenceDiagram
    actor Captain
    actor Admin
    participant frmResultSubmit
    participant frmDashboard as frmAdminDashboard
    participant ResultBUS
    participant ResultDAL
    participant MatchDAL
    participant BracketDAL
    participant DBConnection

    Captain->>frmResultSubmit: Nhập điểm + Upload ảnh bằng chứng
    frmResultSubmit->>ResultBUS: SubmitResult(matchId, score1, score2, filePath)
    
    ResultBUS->>ResultBUS: ValidateFileExtension(filePath)
    Note over ResultBUS: Chỉ chấp nhận .jpg, .png
    
    alt Extension không hợp lệ
        ResultBUS-->>frmResultSubmit: Error: "Chỉ chấp nhận .jpg, .png"
        frmResultSubmit->>Captain: ❌ Thông báo lỗi định dạng
    else Extension hợp lệ
        ResultBUS->>ResultBUS: ValidateFileSize(filePath, 5MB)
        
        alt File > 5MB
            ResultBUS-->>frmResultSubmit: Error: "File vượt quá 5MB"
            frmResultSubmit->>Captain: ❌ Thông báo lỗi kích thước
        else File hợp lệ
            ResultBUS->>ResultDAL: SubmitResult(matchResultDTO)
            ResultDAL->>DBConnection: INSERT INTO tblMatchResult (..., Status='PendingVerification')
            DBConnection-->>ResultDAL: ResultID
            ResultDAL-->>ResultBUS: SUCCESS
            ResultBUS->>MatchDAL: UpdateStatus(matchId, 'PendingVerification')
            MatchDAL->>DBConnection: UPDATE tblMatch SET Status='PendingVerification'
            ResultBUS-->>frmResultSubmit: SUCCESS
            frmResultSubmit->>Captain: ✅ "Kết quả đã được nộp. Chờ Admin xác nhận."
        end
    end

    Note over Admin: Admin nhận thông báo / Kiểm tra danh sách
    Admin->>frmDashboard: Xem danh sách PendingVerification
    Admin->>frmDashboard: Xem ảnh bằng chứng của trận

    alt Admin Phê duyệt
        Admin->>ResultBUS: ApproveResult(matchId, winnerId)
        ResultBUS->>ResultDAL: UpdateResultStatus(resultId, 'Verified', adminId)
        ResultDAL->>DBConnection: BEGIN TRANSACTION
        ResultDAL->>DBConnection: UPDATE tblMatchResult SET Status='Verified', VerifiedBy=@admin
        ResultDAL->>DBConnection: UPDATE tblMatch SET WinnerID=@winner, LoserID=@loser, Status='Completed'
        
        ResultBUS->>BracketDAL: GetMatch(currentMatch.NextMatchID)
        BracketDAL->>DBConnection: SELECT * FROM tblMatch WHERE MatchID = @nextMatchID
        BracketDAL-->>ResultBUS: nextMatchDTO
        ResultBUS->>BracketDAL: UpdateNextMatch(nextMatchId, winnerId)
        BracketDAL->>DBConnection: UPDATE tblMatch SET Team1ID OR Team2ID = @winnerId WHERE MatchID = @nextMatchID
        DBConnection-->>BracketDAL: SUCCESS
        BracketDAL->>DBConnection: COMMIT TRANSACTION
        
        ResultBUS-->>frmDashboard: SUCCESS
        frmDashboard->>Admin: ✅ "Kết quả đã xác nhận. Nhánh đấu cập nhật."
        Note over frmDashboard: frmBracketView tự refresh
    else Admin Từ chối
        Admin->>ResultBUS: DisputeResult(matchId, reason)
        ResultBUS->>ResultDAL: UpdateResultStatus(resultId, 'Disputed', adminId)
        ResultDAL->>DBConnection: UPDATE tblMatchResult SET Status='Disputed'
        ResultDAL->>DBConnection: UPDATE tblMatch SET Status='Disputed'
        ResultBUS-->>frmDashboard: SUCCESS
        frmDashboard->>Admin: ✅ "Đã từ chối. Captain được thông báo."
        frmResultSubmit->>Captain: ⚠️ "Kết quả bị từ chối. Vui lòng nộp lại."
    end
```

---

## SD-05: Xem Leaderboard & Tie-breaker (Battle Royale)

```mermaid
sequenceDiagram
    actor User
    participant frmLeaderboard
    participant LeaderboardBUS
    participant LeaderboardDAL
    participant DBConnection

    User->>frmLeaderboard: Chọn Tournament → Xem Leaderboard
    frmLeaderboard->>LeaderboardBUS: GetLeaderboard(tournamentId)
    LeaderboardBUS->>LeaderboardDAL: GetTournamentFormat(tournamentId)
    LeaderboardDAL->>DBConnection: SELECT Format FROM tblTournament WHERE ID=@id
    DBConnection-->>LeaderboardDAL: Format
    LeaderboardDAL-->>LeaderboardBUS: format

    alt Format = 'SingleElimination'
        LeaderboardBUS->>LeaderboardDAL: GetCompletedBracket(tournamentId)
        LeaderboardDAL->>DBConnection: SELECT tblMatch WHERE TournamentID=@id AND Status='Completed' ORDER BY Round
        DBConnection-->>LeaderboardDAL: List<MatchDTO>
        LeaderboardDAL-->>LeaderboardBUS: bracketData
        LeaderboardBUS-->>frmLeaderboard: BracketDTO
        frmLeaderboard->>frmLeaderboard: RenderCompletedBracket()
        frmLeaderboard->>User: ✅ Hiển thị cây bracket đã hoàn thành + Top 3
        
    else Format = 'BattleRoyale'
        LeaderboardBUS->>LeaderboardDAL: GetBattleRoyaleScores(tournamentId)
        LeaderboardDAL->>DBConnection: SELECT TeamID, SUM(TotalPoints) AS TotalScore,\n SUM(KillPoints) AS TotalKills FROM tblBRScore\n GROUP BY TeamID ORDER BY TournamentID=@id
        DBConnection-->>LeaderboardDAL: List<BRScoreDTO>
        LeaderboardDAL-->>LeaderboardBUS: rawScores
        
        LeaderboardBUS->>LeaderboardBUS: ApplyTiebreaker(rawScores)
        Note over LeaderboardBUS: ORDER BY:<br/>1. TotalPoints DESC<br/>2. DirectHeadToHead DESC<br/>3. TotalKillPoints DESC
        
        LeaderboardBUS->>LeaderboardDAL: GetHeadToHeadResults(tournamentId)
        LeaderboardDAL->>DBConnection: SELECT đối đầu trực tiếp từ tblMatch
        DBConnection-->>LeaderboardDAL: H2H data
        LeaderboardDAL-->>LeaderboardBUS: headToHead
        
        LeaderboardBUS->>LeaderboardBUS: FinalSort(scores + h2h)
        LeaderboardBUS-->>frmLeaderboard: List<TeamDTO> (sorted)
        frmLeaderboard->>frmLeaderboard: DisplayTop3() [🥇🥈🥉]
        frmLeaderboard->>User: ✅ Hiển thị bảng xếp hạng
    end
```

---

## SD-06: Đăng ký & Xét duyệt Đội (Team Registration)

```mermaid
sequenceDiagram
    actor Captain
    actor Admin
    participant frmTeamManagement
    participant TeamBUS
    participant TeamDAL
    participant DBConnection

    Captain->>frmTeamManagement: Điền tên đội, logo, thêm thành viên
    frmTeamManagement->>TeamBUS: CreateTeam(teamDTO)
    
    TeamBUS->>TeamBUS: ValidateTeamName(name, tournamentId)
    TeamBUS->>TeamDAL: CheckTeamNameExists(name, tournamentId)
    TeamDAL->>DBConnection: SELECT COUNT(*) FROM tblTeam WHERE Name=@name AND TournamentID=@tid
    DBConnection-->>TeamDAL: count
    TeamDAL-->>TeamBUS: exists (bool)
    
    alt Tên đội đã tồn tại
        TeamBUS-->>frmTeamManagement: Error: "Tên đội đã tồn tại trong giải đấu"
        frmTeamManagement->>Captain: ❌ Thông báo lỗi
    else Tên hợp lệ
        loop Với mỗi thành viên được thêm
            TeamBUS->>TeamBUS: ValidatePlayerNotInOtherTeam(userId, tournamentId)
            TeamBUS->>TeamDAL: IsPlayerInAnotherTeam(userId, tournamentId)
            TeamDAL->>DBConnection: SELECT tblPlayer JOIN tblTeam ON TeamID WHERE UserID=@uid AND TournamentID=@tid AND IsActive=1
            DBConnection-->>TeamDAL: result
            TeamDAL-->>TeamBUS: alreadyInTeam (bool)
            
            alt Thành viên đã trong đội khác
                TeamBUS-->>frmTeamManagement: Error: "Người chơi @name đã thuộc đội khác"
                frmTeamManagement->>Captain: ❌ Thông báo lỗi (không thêm người này)
            else Hợp lệ
                Note over TeamBUS: Thêm vào danh sách
            end
        end
        
        TeamBUS->>TeamBUS: ValidateMinPlayers(playerCount, minRequired)
        
        alt Chưa đủ số thành viên
            TeamBUS-->>frmTeamManagement: Error: "Cần tối thiểu X thành viên"
            frmTeamManagement->>Captain: ❌ Thông báo
        else Đủ thành viên
            TeamBUS->>TeamDAL: CreateTeam(teamDTO)
            TeamDAL->>DBConnection: INSERT INTO tblTeam (..., Status='Pending')
            loop Mỗi Player
                TeamDAL->>DBConnection: INSERT INTO tblPlayer (...)
            end
            DBConnection-->>TeamDAL: TeamID mới
            TeamDAL-->>TeamBUS: SUCCESS
            TeamBUS-->>frmTeamManagement: SUCCESS
            frmTeamManagement->>Captain: ✅ "Hồ sơ đã nộp. Chờ Admin xét duyệt."
        end
    end

    Note over Admin: Admin xem danh sách Pending
    Admin->>frmTeamManagement: Chọn đội → Xét duyệt
    
    alt Admin Approve
        Admin->>TeamBUS: ApproveTeam(teamId)
        TeamBUS->>TeamDAL: UpdateTeamStatus(teamId, 'Approved', null)
        TeamDAL->>DBConnection: UPDATE tblTeam SET Status='Approved' WHERE TeamID=@id
        frmTeamManagement->>Admin: ✅ "Đội đã được duyệt"
    else Admin Reject
        Admin->>TeamBUS: RejectTeam(teamId, reason)
        TeamBUS->>TeamDAL: UpdateTeamStatus(teamId, 'Rejected', reason)
        TeamDAL->>DBConnection: UPDATE tblTeam SET Status='Rejected', RejectionReason=@reason
        frmTeamManagement->>Admin: ✅ "Đội đã bị từ chối"
        frmTeamManagement->>Captain: ⚠️ "Hồ sơ bị từ chối: [reason]"
    end
```
