# ACTIVITY DIAGRAMS — ETMS (Luồng nghiệp vụ chi tiết)

> Hệ thống Quản lý Giải đấu Esports | Phiên bản: 1.0

---

## AD-01: Luồng Đăng ký Đội & Xét duyệt

```mermaid
flowchart TD
    Start([🟢 Start]) --> Login[Captain đăng nhập]
    Login --> SelectTournament[Chọn Tournament\nđang mở đăng ký]
    SelectTournament --> CheckTStatus{Tournament\nStatus = 'Registration'?}
    CheckTStatus -- Không --> ShowError1[❌ Thông báo:\nGiải chưa mở đăng ký]
    ShowError1 --> End1([🔴 End])

    CheckTStatus -- Có --> FillTeamForm[Điền thông tin đội:\nTên, Logo, Game]
    FillTeamForm --> ValidateName{Tên đội\nđã tồn tại trong\nTournament?}
    ValidateName -- Có --> ShowError2[❌ Thông báo:\nTên đã tồn tại]
    ShowError2 --> FillTeamForm

    ValidateName -- Không --> AddPlayers[Thêm thành viên\nqua InGameID / MSSV]
    
    AddPlayers --> CheckPlayerLoop{Còn thành\nviên cần thêm?}
    CheckPlayerLoop -- Có --> FindPlayer[Tìm Player\ntrong hệ thống]
    FindPlayer --> PlayerExists{Player tồn tại?}
    PlayerExists -- Không --> ShowError3[❌ Không tìm thấy\ncủa người chơi]
    ShowError3 --> AddPlayers
    
    PlayerExists -- Có --> InOtherTeam{Player đã trong\nđội khác cùng\nTournament?}
    InOtherTeam -- Có --> ShowError4[❌ Thông báo:\nĐã thuộc đội khác]
    ShowError4 --> AddPlayers
    
    InOtherTeam -- Không --> AddToList[Thêm vào danh sách]
    AddToList --> CheckPlayerLoop
    
    CheckPlayerLoop -- Không --> CheckMinPlayers{Đủ số thành\nviên tối thiểu?}
    CheckMinPlayers -- Không --> ShowError5[❌ Cần tối thiểu\nX thành viên]
    ShowError5 --> AddPlayers
    
    CheckMinPlayers -- Có --> SubmitTeam[Nộp hồ sơ\nStatus = 'Pending']
    SubmitTeam --> NotifyAdmin[📢 Thông báo Admin\ncó hồ sơ mới]

    subgraph AdminReview [🔵 Admin xét duyệt]
        NotifyAdmin --> AdminLogin[Admin đăng nhập]
        AdminLogin --> ViewPending[Xem danh sách Pending]
        ViewPending --> ReviewProfile[Kiểm tra hồ sơ đội]
        ReviewProfile --> AdminDecision{Quyết định?}
        AdminDecision -- Approve --> ApproveTeam[✅ Status = 'Approved']
        AdminDecision -- Reject --> InputReason[Nhập lý do từ chối]
        InputReason --> RejectTeam[❌ Status = 'Rejected'\n+ Lý do]
    end

    ApproveTeam --> NotifyCaptainApprove[📢 Thông báo Captain:\nĐã được duyệt]
    RejectTeam --> NotifyCaptainReject[📢 Thông báo Captain:\nBị từ chối + lý do]
    
    NotifyCaptainApprove --> End2([🔴 End: Đội sẵn sàng\nvào Bracket])
    NotifyCaptainReject --> CanResubmit{Còn trong\nthời gian\nRegistration?}
    CanResubmit -- Có --> FillTeamForm
    CanResubmit -- Không --> End3([🔴 End: Hết hạn])
```

---

## AD-02: Luồng Tạo Bracket & Phân chia Nhánh đấu

```mermaid
flowchart TD
    Start([🟢 Start: Admin chọn Tournament]) --> CheckApproved{Có ≥ 2 đội\nApproved?}
    CheckApproved -- Không --> ShowError[❌ Cần ít nhất 2 đội\nApproved để tạo Bracket]
    ShowError --> End1([🔴 End])

    CheckApproved -- Có --> CheckExisting{Bracket\nđã tồn tại?}
    CheckExisting -- Có --> ConfirmRegen{Admin xác nhận\nTạo lại Bracket?\nSẽ xóa bracket cũ}
    ConfirmRegen -- Không --> End1
    ConfirmRegen -- Có --> DeleteOld[Xóa Bracket cũ\ntừ tblMatch]
    
    CheckExisting -- Không --> GetTeams[Lấy danh sách\nN đội Approved]
    DeleteOld --> GetTeams

    GetTeams --> Shuffle[Fisher-Yates Shuffle\nXáo trộn ngẫu nhiên]
    Shuffle --> CalcBye[Tính slots = nextPowerOf2 của N\nbyeCount = slots - N]
    
    CalcBye --> IsPowerOf2{N là lũy\nthừa của 2?}
    IsPowerOf2 -- Có --> NoByeNeeded[byeCount = 0\nKhông cần Bye]
    IsPowerOf2 -- Không --> CreateByes[Tạo byeCount Bye matches\nCác đội seed cao nhất\nauto-win vòng 1]
    
    NoByeNeeded --> CreateRealMatches
    CreateByes --> CreateRealMatches[Tạo các Real Matches\nvòng 1 từ cặp còn lại]
    
    CreateRealMatches --> BuildRounds[Xây dựng các vòng tiếp theo\nVòng 2, 3, ... Final]
    BuildRounds --> LinkList[Gán NextMatchID\nLinked List giữa các vòng]
    
    LinkList --> SaveTransaction{Lưu vào DB\nSQL Transaction}
    SaveTransaction -- Error --> RollbackAndShow[Rollback\nHiển thị lỗi kỹ thuật]
    RollbackAndShow --> End1
    
    SaveTransaction -- Success --> CommitDB[COMMIT tất cả tblMatch]
    CommitDB --> UpdateTournamentStatus[Update Tournament\nStatus = 'Active']
    UpdateTournamentStatus --> RenderBracket[🎨 Render cây\nnhánh đấu lên GUI]
    RenderBracket --> End2([🔴 End: Bracket sẵn sàng])
```

---

## AD-03: Luồng Check-in & Quản lý Trận đấu

```mermaid
flowchart TD
    Start([🟢 Start: Đến giờ ScheduledTime - 15'']) --> OpenCheckIn[System Timer\nMở cổng Check-in\nStatus = 'CheckInOpen']
    OpenCheckIn --> NotifyBoth[📢 Thông báo cả 2 Captain\nmở cổng Check-in]
    NotifyBoth --> WaitCheckIn{Waiting for\nCheck-in...}

    WaitCheckIn -->|Captain1 bấm| Cap1CheckIn[CheckIn_Team1 = 1\nSQL Transaction Serializable]
    WaitCheckIn -->|Captain2 bấm| Cap2CheckIn[CheckIn_Team2 = 1\nSQL Transaction Serializable]
    WaitCheckIn -->|Hết giờ| TimeoutCheck

    Cap1CheckIn --> BothChecked1{Cả 2 đội\nđã Check-in?}
    Cap2CheckIn --> BothChecked2{Cả 2 đội\nđã Check-in?}
    
    BothChecked1 -- Có --> StartMatch
    BothChecked1 -- Không --> WaitCheckIn
    BothChecked2 -- Có --> StartMatch
    BothChecked2 -- Không --> WaitCheckIn
    
    StartMatch[Status = 'Live'\nActualStartTime = NOW()] --> GamePlay[🎮 Trận đấu diễn ra\nMap Veto / Side Select\nnếu cần]

    TimeoutCheck{Ai Check-in?}
    TimeoutCheck -- Đội 1 đã CI\nĐội 2 chưa CI --> Walkover2[WinnerID = Team1\nStatus = 'Walkover']
    TimeoutCheck -- Đội 2 đã CI\nĐội 1 chưa CI --> Walkover1[WinnerID = Team2\nStatus = 'Walkover']
    TimeoutCheck -- Cả 2 chưa CI --> BothNoCI[⚠️ GAP-01:\nAdmin quyết định\nthủ công]

    Walkover1 --> AutoAdvance
    Walkover2 --> AutoAdvance
    BothNoCI --> AdminManual[Admin chọn Winner\nhoặc hủy trận]
    AdminManual --> AutoAdvance

    AutoAdvance[Tự động đẩy WinnerID\nvào NextMatchID\nSQL Transaction] --> End1([🔴 End: Walkover xử lý xong])
    GamePlay --> End2([🔴 End: Đang thi đấu])
```

---

## AD-04: Luồng Nộp & Xác thực Kết quả

```mermaid
flowchart TD
    Start([🟢 Start: Trận đấu Status='Live']) --> GameOver[Trận kết thúc\ntrên thực tế]
    GameOver --> CaptainOpenForm[Captain mở Form\nNộp kết quả]
    
    CaptainOpenForm --> InputScore[Nhập Score1, Score2]
    InputScore --> UploadFile[Upload ảnh bằng chứng]
    
    UploadFile --> CheckExt{Extension\n.jpg hoặc .png?}
    CheckExt -- Không --> ShowExtError[❌ Chỉ chấp nhận .jpg, .png]
    ShowExtError --> UploadFile
    
    CheckExt -- Có --> CheckMIME{Kiểm tra\nMAGIC BYTES\n⚠️ GAP-09}
    CheckMIME -- Không khớp --> ShowMIMEError[❌ File giả mạo định dạng]
    ShowMIMEError --> UploadFile
    
    CheckMIME -- Khớp --> CheckSize{Kích thước\n< 5MB?}
    CheckSize -- Không --> ShowSizeError[❌ File vượt quá 5MB]
    ShowSizeError --> UploadFile
    
    CheckSize -- Có --> SubmitResult[INSERT tblMatchResult\nStatus = 'PendingVerification'\nSQL Transaction]
    
    SubmitResult --> NotifyAdmin[📢 Admin nhận thông báo]
    NotifyAdmin --> AdminReview[Admin xem\nảnh bằng chứng + điểm số]
    
    AdminReview --> AdminDecision{Admin quyết định?}
    
    AdminDecision -- Phê duyệt --> CheckScoreLogic{Điểm số\nhợp lý?}
    CheckScoreLogic -- Có --> ApproveResult
    CheckScoreLogic -- Không --> AdminCanFix[Admin sửa điểm\nhoặc ghi chú]
    AdminCanFix --> ApproveResult
    
    ApproveResult[✅ Status = 'Verified'\nWinnerID set\nSQL Transaction]
    ApproveResult --> AdvanceWinner[Đẩy WinnerID vào\ntblMatch - NextMatchID]
    AdvanceWinner --> UpdateNextMatch{NextMatchID\nkhác NULL?}
    UpdateNextMatch -- Có --> FillNextMatch[UPDATE tblMatch:\nTeam1ID hoặc Team2ID = Winner]
    UpdateNextMatch -- Không --> TournamentOver[🏆 Đây là Final!\nGiải đấu kết thúc\nTournament = Completed]
    
    FillNextMatch --> End1([🔴 End: Bracket tiếp tục])
    TournamentOver --> End2([🔴 End: Giải đấu hoàn thành])
    
    AdminDecision -- Từ chối --> DisputeResult[❌ Status = 'Disputed'\nThông báo Captain]
    DisputeResult --> CaptainReviewDispute{Captain\nphản hồi?}
    CaptainReviewDispute -- Nộp lại bằng chứng --> UploadFile
    CaptainReviewDispute -- Chấp nhận kết quả --> End3([🔴 End: Dispute closed])
```

---

## AD-05: Luồng Map Veto (FPS Games)

```mermaid
flowchart TD
    Start([🟢 Start: Trận FPS - Cả 2 đã Check-in]) --> LoadMapPool[Hiển thị Map Pool\ncủa game]
    LoadMapPool --> DetermineOrder[Xác định thứ tự veto\nĐội seed thấp hơn ban trước]
    
    DetermineOrder --> VetoLoop{Còn map\ncần veto?}
    
    VetoLoop -- Có --> CurrentTeamTurn[Đội lượt hiện tại\nchọn action]
    CurrentTeamTurn --> TeamAction{Ban hay Pick?}
    
    TeamAction -- Ban --> BanMap[Chọn map cần BAN\nLoại khỏi pool]
    BanMap --> RecordVeto[INSERT tblMapVeto:\nAction='Ban', VetoOrder++]
    RecordVeto --> SwapTurn[Chuyển lượt cho đội kia]
    SwapTurn --> VetoLoop
    
    TeamAction -- Pick --> PickMap[Chọn map cần PICK\nmap này sẽ chơi]
    PickMap --> RecordPick[INSERT tblMapVeto:\nAction='Pick', VetoOrder++]
    RecordPick --> SwapTurn
    
    VetoLoop -- Còn 1 map --> LastMap[Map cuối = Bản đồ thi đấu\nAuto Pick]
    LastMap --> RecordLastMap[INSERT tblMapVeto:\nAction='Pick', cuối cùng]
    RecordLastMap --> VetoComplete
    
    VetoLoop -- Đủ maps đã Pick --> VetoComplete[Hoàn thành Map Veto]
    VetoComplete --> ShowFinalMaps[Hiển thị danh sách\nbản đồ thi đấu chính thức]
    ShowFinalMaps --> End([🔴 End: Trận bắt đầu])
```

---

## AD-06: Luồng Xem Leaderboard (Battle Royale Tie-breaker)

```mermaid
flowchart TD
    Start([🟢 Start: User chọn Tournament]) --> GetFormat[Lấy Format\ncủa Tournament]
    GetFormat --> FormatCheck{Format?}

    FormatCheck -- SingleElimination --> GetBracket[Lấy Bracket\nhoàn chỉnh từ DB]
    GetBracket --> RenderBracketTree[Render cây nhánh đấu\ncác trận Completed]
    RenderBracketTree --> ShowTop3SE[Hiển thị Top 3:\nFinal Winner = 🥇\nFinal Loser = 🥈\nSemifinal Losers = 🥉]
    ShowTop3SE --> End([🔴 End])

    FormatCheck -- BattleRoyale --> GetAllScores[Lấy tất cả tblBRScore\ncủa Tournament]
    GetAllScores --> GroupByTeam[GROUP BY TeamID\nSUM TotalPoints, KillPoints]
    GroupByTeam --> SortByPoints[Sắp xếp theo\nTotalPoints DESC]
    SortByPoints --> CheckTie{Có đội\nđồng điểm?}
    
    CheckTie -- Không --> DisplayRanking[Hiển thị bảng xếp hạng]
    
    CheckTie -- Có --> GetH2H[Lấy kết quả H2H\n tblMatch giữa các đội đồng điểm]
    GetH2H --> SortByH2H[Tie-breaker 2:\nXét Direct Head-To-Head DESC]
    SortByH2H --> StillTie{Vẫn còn\nđồng điểm?}
    
    StillTie -- Không --> DisplayRanking
    
    StillTie -- Có --> GetKillPoints[Lấy TotalKillPoints\ncủa các đội còn tie]
    GetKillPoints --> SortByKills[Tie-breaker 3:\nXét TotalKillPoints DESC]
    SortByKills --> FinalRanking[Xác định thứ hạng\ncuối cùng]
    FinalRanking --> DisplayRanking
    
    DisplayRanking --> ShowTop3BR[Hiển thị Top 3:\n🥇 🥈 🥉\n+ Bảng xếp hạng đầy đủ]
    ShowTop3BR --> End
```

---

## AD-07: Luồng Gửi & Giải quyết Khiếu nại

```mermaid
flowchart TD
    Start([🟢 Start: Captain phát hiện vi phạm]) --> CheckMatchStatus{Trận ở\ntrạng thái phù hợp?}
    CheckMatchStatus -- Không --> ShowError[❌ Không thể\nkhiếu nại trận này]
    ShowError --> End1([🔴 End])

    CheckMatchStatus -- Có --> CheckDisputeLimit{⚠️ GAP-06:\nĐội đã gửi\nquá nhiều khiếu nại?}
    CheckDisputeLimit -- Đã đạt giới hạn --> ShowLimit[❌ Đã đạt giới hạn\nkhiếu nại]
    ShowLimit --> End1

    CheckDisputeLimit -- Chưa --> OpenDisputeForm[Mở form Khiếu nại]
    OpenDisputeForm --> InputDescription[Nhập mô tả chi tiết:\nHack / Cheat / Người ngoài]
    InputDescription --> UploadEvidence{Upload\nbằng chứng?}
    
    UploadEvidence -- Có --> ValidateEvidence[Validate file\nvideo / screenshot]
    ValidateEvidence --> SubmitDispute
    UploadEvidence -- Không --> SubmitDispute
    
    SubmitDispute[INSERT tblDispute\nStatus = 'Open'\ntạo bản ghi] --> NotifyAdmin[📢 Admin nhận thông báo\nkhiếu nại mới]

    NotifyAdmin --> AdminInvestigate[Admin xem xét\nBằng chứng + Lịch sử]
    AdminInvestigate --> AdminDecision{Phán quyết?}

    AdminDecision -- Resolve --> WriteAdminNote[Ghi Admin Note\ngiải thích quyết định]
    WriteAdminNote --> ResolveDispute[Status = 'Resolved'\nCó thể sửa kết quả trận]
    ResolveDispute --> NotifyCaptains[📢 Thông báo cả 2 Captain]
    NotifyCaptains --> End2([🔴 End: Dispute Resolved])

    AdminDecision -- Dismiss --> WriteNote[Ghi lý do bác bỏ]
    WriteNote --> DismissDispute[Status = 'Dismissed']
    DismissDispute --> NotifyCaptains
```
