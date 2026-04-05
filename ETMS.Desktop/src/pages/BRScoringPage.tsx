import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens, statusColor } from '../theme'

const MS = ({ icon, size = 20 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)

interface Tournament { TournamentID: number; Name: string; GameType: string; Status: string; GameName?: string }
interface BRRound   { roundId: number; roundNumber: number; playedAt: string | null; teamsScored: number }
interface Team      { TeamID: number; Name: string; Status: string }
interface LeaderRow { rank: number; teamId: number; teamName: string; roundsPlayed: number; totalKills: number; totalPoints: number; bestPlacement: number }
interface ScoreEntry { teamId: number; teamName: string; teamStatus: string; placementRank: number; rankingPoints: number; killPoints: number }

export default function BRScoringPage() {
  const { token, isAdmin } = useAuth()
  const { dark } = useTheme()
  const c = getTokens(dark)

  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selTid, setSelTid]           = useState<number>(0)
  const [selTournament, setSelTournament] = useState<Tournament | null>(null)
  const [rounds, setRounds]           = useState<BRRound[]>([])
  const [selRound, setSelRound]       = useState<BRRound | null>(null)
  const [teams, setTeams]             = useState<Team[]>([])
  const [scores, setScores]           = useState<ScoreEntry[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [msg, setMsg]                 = useState<{ text: string; ok: boolean } | null>(null)

  // New round form
  const [newRoundNum, setNewRoundNum]   = useState('')
  const [newPlayedAt, setNewPlayedAt]   = useState('')
  const [showNewRound, setShowNewRound] = useState(false)
  const [creatingRound, setCreatingRound] = useState(false)

  const authOpts = useCallback((opts: RequestInit = {}): RequestInit => ({
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.headers ?? {}),
    },
  }), [token])

  // ── Load danh sách giải BattleRoyale ───────────────────────────────────────
  useEffect(() => {
    fetch('/api/tournaments', authOpts())
      .then(r => r.json())
      .then(d => {
        // Chỉ lấy giải BattleRoyale (không phân biệt Status để xem lịch sử)
        const br: Tournament[] = (d.data ?? []).filter((t: Tournament) => t.GameType === 'BattleRoyale')
        setTournaments(br)
        if (br.length > 0) {
          // Ưu tiên chọn giải Active, nếu không thì chọn cái đầu tiên
          const active = br.find(t => t.Status === 'Active') ?? br[0]
          setSelTid(active.TournamentID)
          setSelTournament(active)
        }
      }).catch(() => {})
  }, [authOpts])

  // ── Load rounds + teams khi đổi giải ─────────────────────────────────────
  useEffect(() => {
    if (!selTid) return
    setSelRound(null)
    setScores([])
    setMsg(null)
    setLoadingData(true)

    Promise.all([
      fetch(`/api/br/${selTid}/rounds`, authOpts()).then(r => r.json()),
      fetch(`/api/teams?tournamentId=${selTid}`, authOpts()).then(r => r.json()),
      fetch(`/api/br/${selTid}/leaderboard`, authOpts()).then(r => r.json()),
    ]).then(([rndData, teamData, lbData]) => {
      setRounds(rndData.data ?? [])
      // Lấy tất cả đội trừ Rejected/Disqualified
      const eligible = (teamData.data ?? []).filter(
        (t: Team) => !['Rejected', 'Disqualified'].includes(t.Status)
      )
      setTeams(eligible)
      setLeaderboard(lbData.data ?? [])
    }).catch(() => {
      setMsg({ text: 'Không thể tải dữ liệu. Kiểm tra kết nối API.', ok: false })
    }).finally(() => setLoadingData(false))
  }, [selTid, authOpts])

  // ── Chọn vòng: load điểm đã nhập (nếu có) ────────────────────────────────
  const selectRound = async (r: BRRound) => {
    setSelRound(r)
    setMsg(null)

    // Khởi tạo scores từ danh sách teams
    const baseScores: ScoreEntry[] = teams.map((t, i) => ({
      teamId: t.TeamID, teamName: t.Name, teamStatus: t.Status,
      placementRank: i + 1,
      rankingPoints: 0,
      killPoints: 0,
    }))

    // Nếu vòng đã có điểm thì load về và merge
    if (r.teamsScored > 0) {
      try {
        const res = await fetch(`/api/br/${selTid}/rounds/${r.roundId}/scores`, authOpts())
        if (res.ok) {
          const data = await res.json()
          const existing: any[] = data.data ?? []
          const merged = baseScores.map(s => {
            const found = existing.find(e => e.teamId === s.teamId)
            return found ? {
              ...s,
              placementRank: found.placementRank ?? s.placementRank,
              rankingPoints: found.rankingPoints ?? 0,
              killPoints:    found.killPoints    ?? 0,
            } : s
          })
          setScores(merged)
          return
        }
      } catch {}
    }
    setScores(baseScores)
  }

  // ── Tạo vòng mới ─────────────────────────────────────────────────────────
  const createRound = async () => {
    const rn = parseInt(newRoundNum)
    if (isNaN(rn) || rn < 1) return setMsg({ text: 'Số vòng phải >= 1.', ok: false })
    setCreatingRound(true)
    setMsg(null)
    try {
      const res = await fetch('/api/br/rounds', authOpts({
        method: 'POST',
        body: JSON.stringify({ TournamentID: selTid, RoundNumber: rn, PlayedAt: newPlayedAt || null }),
      }))
      const data = await res.json()
      if (!res.ok) return setMsg({ text: data.error ?? 'Tạo vòng thất bại.', ok: false })
      setMsg({ text: `✅ Đã tạo Vòng ${rn}.`, ok: true })
      setShowNewRound(false)
      setNewRoundNum('')
      setNewPlayedAt('')
      // Refresh rounds và auto-select vòng mới
      const rndData = await fetch(`/api/br/${selTid}/rounds`, authOpts()).then(r => r.json())
      const newRounds: BRRound[] = rndData.data ?? []
      setRounds(newRounds)
      const newR = newRounds.find(x => x.roundId === data.roundId)
      if (newR) await selectRound(newR)
    } finally { setCreatingRound(false) }
  }

  // ── Lưu điểm ─────────────────────────────────────────────────────────────
  const submitScores = async () => {
    if (!selRound || scores.length === 0) return
    setSubmitting(true)
    setMsg(null)

    // Validate placementRank không trùng nhau
    const ranks = scores.map(s => s.placementRank)
    const hasDupRank = ranks.length !== new Set(ranks).size
    if (hasDupRank) {
      setSubmitting(false)
      return setMsg({ text: '⚠ Hạng của các đội không được trùng nhau!', ok: false })
    }

    let failCount = 0
    for (const s of scores) {
      try {
        const res = await fetch('/api/br/scores', authOpts({
          method: 'POST',
          body: JSON.stringify({
            RoundID: selRound.roundId, TeamID: s.teamId,
            PlacementRank: s.placementRank,
            RankingPoints: s.rankingPoints,
            KillPoints:    s.killPoints,
          }),
        }))
        if (!res.ok) failCount++
      } catch { failCount++ }
    }

    if (failCount === 0) {
      setMsg({ text: `✅ Đã lưu điểm cho ${scores.length} đội — Vòng ${selRound.roundNumber}.`, ok: true })
    } else {
      setMsg({ text: `⚠ ${failCount}/${scores.length} đội không lưu được. Kiểm tra lại.`, ok: false })
    }

    // Refresh leaderboard + rounds
    const [lbData, rndData] = await Promise.all([
      fetch(`/api/br/${selTid}/leaderboard`, authOpts()).then(r => r.json()),
      fetch(`/api/br/${selTid}/rounds`, authOpts()).then(r => r.json()),
    ])
    setLeaderboard(lbData.data ?? [])
    setRounds(rndData.data ?? [])
    setSubmitting(false)
  }

  const updateScore = (idx: number, field: keyof ScoreEntry, val: number) =>
    setScores(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))

  const selectTournament = (t: Tournament) => {
    setSelTid(t.TournamentID)
    setSelTournament(t)
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const panel: React.CSSProperties = {
    background: dark ? 'rgba(22,27,34,0.9)' : '#fff',
    border: `1px solid ${c.panelBorder}`,
    borderRadius: 14, padding: '1.25rem',
    boxShadow: dark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
  }
  const inputStyle: React.CSSProperties = {
    padding: '0.45rem 0.7rem',
    background: dark ? 'rgba(255,255,255,0.05)' : '#f8f9fa',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : '#dee2e6'}`,
    borderRadius: 8, color: c.onSurface, fontSize: '0.88rem',
    outline: 'none', width: '100%', boxSizing: 'border-box',
  }
  const btnPrimary: React.CSSProperties = {
    padding: '0.5rem 1.2rem', borderRadius: 8, border: 'none',
    background: 'linear-gradient(135deg,#E94560,#7C3AED)',
    color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
    boxShadow: '0 0 10px rgba(233,69,96,0.35)',
    display: 'flex', alignItems: 'center', gap: 6,
    opacity: submitting ? 0.6 : 1,
    transition: 'all 0.15s',
  }

  const isActive = selTournament?.Status === 'Active'
  const isRegistration = selTournament?.Status === 'Registration'
  const canScore = isAdmin && (isActive || isRegistration)

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '1.5rem', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif", color: c.onSurface }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.5rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#F59E0B,#EF4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MS icon="military_tech" size={24} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: c.onSurface, fontFamily: "'Exo 2',sans-serif" }}>
            Battle Royale Scoring
          </h1>
          <p style={{ margin: 0, fontSize: '0.75rem', color: c.outline }}>Nhập điểm vòng đấu BR — SRS FR-14</p>
        </div>
        {!isAdmin && (
          <span style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 8, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#FBBF24', fontSize: '0.75rem', fontWeight: 700 }}>
            Chỉ xem • Chỉ Admin mới nhập điểm được
          </span>
        )}
      </div>

      {/* ── Tournament Selector ── */}
      <div style={{ ...panel, marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: c.outline, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>
          Chọn Giải Đấu Battle Royale
        </label>
        {tournaments.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: c.outline, fontSize: '0.85rem' }}>
            <MS icon="info" size={18} />
            Chưa có giải BR nào. Admin cần tạo giải đấu với GameType = BattleRoyale.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tournaments.map(t => {
              const sc = statusColor(t.Status, dark)
              const isSelected = selTid === t.TournamentID
              return (
                <button key={t.TournamentID} onClick={() => selectTournament(t)} style={{
                  padding: '0.5rem 1rem', borderRadius: 9, cursor: 'pointer', transition: 'all 0.15s',
                  background: isSelected ? 'linear-gradient(135deg,#F59E0B,#EF4444)' : (dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'),
                  color: isSelected ? '#fff' : c.onSurface,
                  border: isSelected ? 'none' : `1px solid ${c.panelBorder}`,
                  fontWeight: isSelected ? 700 : 500, fontSize: '0.85rem',
                  boxShadow: isSelected ? '0 0 12px rgba(245,158,11,0.4)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  {t.Name}
                  <span style={{
                    padding: '1px 7px', borderRadius: 999, fontSize: '0.62rem', fontWeight: 700,
                    background: isSelected ? 'rgba(255,255,255,0.2)' : sc.bg,
                    color: isSelected ? '#fff' : sc.text,
                    border: isSelected ? '1px solid rgba(255,255,255,0.3)' : `1px solid ${sc.border}`,
                  }}>
                    {t.Status}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Status warning nếu giải không active ── */}
      {selTournament && !isActive && !isRegistration && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: '#FBBF24', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <MS icon="warning" size={18} />
          Giải đấu đang ở trạng thái <strong>{selTournament.Status}</strong>.
          {selTournament.Status === 'Draft' && ' Admin cần chuyển sang Registration hoặc Active để bắt đầu scoring.'}
          {selTournament.Status === 'Completed' && ' Giải đã kết thúc — chỉ xem lịch sử điểm.'}
          {selTournament.Status === 'Cancelled' && ' Giải đã bị hủy.'}
        </div>
      )}

      {selTid > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1rem', alignItems: 'start' }}>

          {/* ── LEFT: Danh sách vòng ── */}
          <div style={panel}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: c.onSurface }}>Danh Sách Vòng</span>
              {canScore && (
                <button onClick={() => setShowNewRound(p => !p)} style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', color: '#E94560',
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 600,
                }}>
                  <MS icon={showNewRound ? 'expand_less' : 'add'} size={16} /> Tạo mới
                </button>
              )}
            </div>

            {/* Form tạo vòng mới */}
            {canScore && showNewRound && (
              <div style={{ background: dark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '0.8rem', marginBottom: '0.75rem' }}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: '0.72rem', color: c.outline, display: 'block', marginBottom: 4 }}>Số vòng *</label>
                  <input type="number" min={1} value={newRoundNum}
                    onChange={e => setNewRoundNum(e.target.value)}
                    style={inputStyle} placeholder="VD: 1" />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: '0.72rem', color: c.outline, display: 'block', marginBottom: 4 }}>Ngày diễn ra</label>
                  <input type="datetime-local" value={newPlayedAt}
                    onChange={e => setNewPlayedAt(e.target.value)}
                    style={inputStyle} />
                </div>
                <button onClick={createRound} disabled={creatingRound}
                  style={{ ...btnPrimary, width: '100%', justifyContent: 'center', opacity: creatingRound ? 0.6 : 1 }}>
                  <MS icon="add_circle" size={16} />
                  {creatingRound ? 'Đang tạo...' : 'Tạo Vòng'}
                </button>
              </div>
            )}

            {/* Loading state */}
            {loadingData && (
              <div style={{ textAlign: 'center', padding: '1rem', color: c.outline, fontSize: '0.8rem' }}>
                <MS icon="sync" size={18} /> Đang tải...
              </div>
            )}

            {/* Round list */}
            {!loadingData && rounds.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: c.outline }}>
                <MS icon="sports_esports" size={32} />
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem' }}>Chưa có vòng nào</p>
                {canScore && <p style={{ margin: '4px 0 0', fontSize: '0.72rem' }}>Bấm "+ Tạo mới" để thêm</p>}
              </div>
            ) : (
              rounds.map(r => (
                <div key={r.roundId} onClick={() => selectRound(r)} style={{
                  padding: '0.65rem 0.9rem', borderRadius: 9, marginBottom: 6, cursor: 'pointer',
                  background: selRound?.roundId === r.roundId
                    ? 'linear-gradient(135deg,rgba(245,158,11,0.18),rgba(239,68,68,0.12))'
                    : (dark ? 'rgba(255,255,255,0.04)' : '#f8f9fa'),
                  border: `1px solid ${selRound?.roundId === r.roundId ? 'rgba(245,158,11,0.55)' : c.panelBorder}`,
                  transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: c.onSurface }}>Vòng {r.roundNumber}</span>
                    <span style={{
                      fontSize: '0.7rem', padding: '2px 7px', borderRadius: 5,
                      background: r.teamsScored > 0 ? 'rgba(52,211,153,0.15)' : 'rgba(107,114,128,0.15)',
                      color: r.teamsScored > 0 ? '#34D399' : '#9CA3AF',
                    }}>
                      {r.teamsScored > 0 ? `${r.teamsScored} đội ✓` : 'Chưa nhập'}
                    </span>
                  </div>
                  {r.playedAt && (
                    <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: c.outline }}>
                      {new Date(r.playedAt).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* ── RIGHT: Score entry + Leaderboard ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Placeholder khi chưa chọn vòng */}
            {!selRound && (
              <div style={{ ...panel, textAlign: 'center', padding: '2.5rem', color: c.outline }}>
                <MS icon="sports_esports" size={48} />
                <p style={{ marginTop: 12, fontSize: '0.88rem' }}>
                  {rounds.length === 0
                    ? 'Tạo vòng đấu bên trái để bắt đầu'
                    : 'Chọn một vòng đấu bên trái để nhập điểm'}
                </p>
              </div>
            )}

            {/* Score entry table */}
            {selRound && (
              <div style={panel}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: c.onSurface, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MS icon="edit_note" size={20} />
                      Nhập Điểm — Vòng {selRound.roundNumber}
                      {selRound.teamsScored > 0 && (
                        <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 999, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', color: '#34D399', fontWeight: 700 }}>
                          Đã có điểm
                        </span>
                      )}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.73rem', color: c.outline }}>
                      Tổng = Điểm hạng + Điểm kill · {scores.length} đội
                    </p>
                  </div>
                  {canScore && (
                    <button onClick={submitScores}
                      disabled={submitting || scores.length === 0}
                      style={{ ...btnPrimary, opacity: (submitting || scores.length === 0) ? 0.5 : 1, cursor: (submitting || scores.length === 0) ? 'not-allowed' : 'pointer' }}>
                      {submitting
                        ? <><MS icon="sync" size={16} /> Đang lưu...</>
                        : <><MS icon="save" size={16} /> Lưu Điểm</>}
                    </button>
                  )}
                </div>

                {/* Message banner */}
                {msg && (
                  <div style={{
                    padding: '0.55rem 0.9rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.82rem',
                    background: msg.ok ? 'rgba(52,211,153,0.1)' : 'rgba(233,69,96,0.1)',
                    border: `1px solid ${msg.ok ? 'rgba(52,211,153,0.3)' : 'rgba(233,69,96,0.3)'}`,
                    color: msg.ok ? '#34D399' : '#E94560',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <MS icon={msg.ok ? 'check_circle' : 'error'} size={16} />
                    {msg.text}
                  </div>
                )}

                {/* Không có đội */}
                {teams.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: c.outline }}>
                    <MS icon="group_off" size={36} />
                    <p style={{ marginTop: 8, fontSize: '0.85rem', fontWeight: 600 }}>Chưa có đội nào trong giải đấu này</p>
                    <p style={{ fontSize: '0.75rem', color: c.outline, marginTop: 4 }}>
                      Captain cần đăng ký đội ở trang <strong>Đội Tuyển</strong>.
                      Admin cần duyệt đội (Approved/Pending) trước khi nhập điểm.
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', tableLayout: 'fixed' }}>
                      <colgroup>
                        <col />{/* Đội */}
                        <col style={{ width: 80 }} />{/* Hạng */}
                        <col style={{ width: 100 }} />{/* Điểm hạng */}
                        <col style={{ width: 90 }} />{/* Kill */}
                        <col style={{ width: 70 }} />{/* Tổng */}
                      </colgroup>
                      <thead>
                        <tr style={{ background: dark ? 'rgba(255,255,255,0.04)' : '#f8f9fa' }}>
                          {['Đội', 'Hạng (#)', 'Điểm Hạng', 'Kill Pts', 'Tổng'].map(h => (
                            <th key={h} style={{
                              padding: '0.55rem 0.75rem', textAlign: h === 'Đội' ? 'left' : 'center',
                              color: c.outline, fontWeight: 700, fontSize: '0.72rem',
                              textTransform: 'uppercase', letterSpacing: '0.07em',
                              borderBottom: `1px solid ${c.panelBorder}`,
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {scores.map((s, i) => (
                          <tr key={s.teamId} style={{ borderBottom: `1px solid ${c.panelBorder}` }}>
                            {/* Team name + status */}
                            <td style={{ padding: '0.55rem 0.75rem', fontWeight: 600, color: c.onSurface, overflow: 'hidden' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                                  background: `hsl(${(s.teamId * 53) % 360},55%,${dark ? 32 : 52}%)`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.72rem', fontWeight: 800, color: '#fff',
                                }}>
                                  {s.teamName.charAt(0)}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                    {s.teamName}
                                  </span>
                                  {s.teamStatus !== 'Approved' && (
                                    <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: 4, background: 'rgba(251,191,36,0.15)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.3)' }}>
                                      {s.teamStatus}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            {/* Placement Rank */}
                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                              <input type="number" min={1} max={scores.length + 10}
                                value={s.placementRank}
                                onChange={e => updateScore(i, 'placementRank', Math.max(1, parseInt(e.target.value) || 1))}
                                disabled={!canScore}
                                style={{ ...inputStyle, width: 64, textAlign: 'center' }} />
                            </td>
                            {/* Ranking Points */}
                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                              <input type="number" min={0}
                                value={s.rankingPoints}
                                onChange={e => updateScore(i, 'rankingPoints', Math.max(0, parseInt(e.target.value) || 0))}
                                disabled={!canScore}
                                style={{ ...inputStyle, width: 80, textAlign: 'center' }} />
                            </td>
                            {/* Kill Points */}
                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                              <input type="number" min={0}
                                value={s.killPoints}
                                onChange={e => updateScore(i, 'killPoints', Math.max(0, parseInt(e.target.value) || 0))}
                                disabled={!canScore}
                                style={{ ...inputStyle, width: 80, textAlign: 'center' }} />
                            </td>
                            {/* Total */}
                            <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#F59E0B' }}>
                                {s.rankingPoints + s.killPoints}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── Leaderboard ── */}
            <div style={panel}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                <MS icon="leaderboard" size={20} />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: c.onSurface }}>Bảng Tổng Điểm</h3>
                <span style={{ fontSize: '0.72rem', color: c.outline }}>cộng dồn tất cả vòng</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B', fontWeight: 700 }}>
                  {leaderboard.length} đội
                </span>
              </div>
              {leaderboard.length === 0 ? (
                <p style={{ color: c.outline, fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                  Chưa có dữ liệu điểm. Nhập điểm cho các vòng để xem bảng xếp hạng.
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: 48 }} />
                    <col />{/* Đội */}
                    <col style={{ width: 55 }} />
                    <col style={{ width: 55 }} />
                    <col style={{ width: 70 }} />
                    <col style={{ width: 80 }} />
                  </colgroup>
                  <thead>
                    <tr style={{ background: dark ? 'rgba(255,255,255,0.04)' : '#f8f9fa' }}>
                      {['#', 'Đội', 'Vòng', 'Kill', 'Best Rank', 'Tổng Điểm'].map(h => (
                        <th key={h} style={{
                          padding: '0.5rem 0.7rem', textAlign: h === 'Đội' ? 'left' : 'center',
                          color: c.outline, fontWeight: 700, fontSize: '0.72rem',
                          textTransform: 'uppercase', letterSpacing: '0.07em',
                          borderBottom: `1px solid ${c.panelBorder}`,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map(row => (
                      <tr key={row.teamId} style={{ borderBottom: `1px solid ${c.panelBorder}` }}>
                        <td style={{ padding: '0.55rem 0.7rem', textAlign: 'center', fontWeight: 800, fontSize: '1rem', color: row.rank <= 3 ? '#F59E0B' : c.onSurface }}>
                          {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `#${row.rank}`}
                        </td>
                        <td style={{ padding: '0.55rem 0.7rem', fontWeight: 600, color: c.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.teamName}
                        </td>
                        <td style={{ padding: '0.55rem 0.7rem', textAlign: 'center', color: c.onSurfaceVar }}>{row.roundsPlayed}</td>
                        <td style={{ padding: '0.55rem 0.7rem', textAlign: 'center', color: c.onSurfaceVar }}>{row.totalKills}</td>
                        <td style={{ padding: '0.55rem 0.7rem', textAlign: 'center', color: c.onSurfaceVar }}>#{row.bestPlacement}</td>
                        <td style={{ padding: '0.55rem 0.7rem', textAlign: 'center', fontWeight: 800, fontSize: '1rem', color: '#F59E0B' }}>
                          {row.totalPoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
