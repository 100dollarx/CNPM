import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { getTokens, statusColor } from '../theme'

interface Team { TeamID: number; Name: string; TournamentID: number; TournamentName?: string; Status: string; PlayerCount?: number; CaptainName?: string }
interface Tournament { TournamentID: number; Name: string; Status: string; MaxTeams: number; GameType: string; MinPlayersPerTeam: number }
interface PlayerRow { fullName: string; inGameName: string }

const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)

const statusLabels: Record<string, string> = { pending: 'CHỜ DUYỆT', approved: 'ĐÃ DUYỆT', rejected: 'TỪ CHỐI', disqualified: 'BỊ LOẠI' }

export default function TeamsPage() {
  const { token, user, isAdmin, isCaptain } = useAuth()
  const { dark } = useTheme()
  const toast = useToast()
  const c = getTokens(dark)
  const [list, setList] = useState<Team[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  // Register form state
  const [showRegister, setShowRegister] = useState(false)
  const [form, setForm] = useState({ TournamentID: '', Name: '', LogoURL: '' })
  const [players, setPlayers] = useState<PlayerRow[]>([{ fullName: '', inGameName: '' }])
  const [submitting, setSubmitting] = useState(false)

  // Team expand / player view
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null)
  const [teamPlayers, setTeamPlayers] = useState<Record<number, any[]>>({})

  const selectedTourn = tournaments.find(t => String(t.TournamentID) === form.TournamentID)
  const minPlayers = selectedTourn?.MinPlayersPerTeam ?? 1
  const validPlayers = players.filter(p => p.fullName.trim() && p.inGameName.trim())

  const load = () => {
    setLoading(true)
    fetch('/api/teams', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(d => setList(d.data ?? []))
      .catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [token])

  useEffect(() => {
    fetch('/api/tournaments', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(d => {
        const EXCLUDED = ['completed', 'cancelled']
        const all: Tournament[] = d.data ?? []
        const eligible = isAdmin
          ? all.filter(t => !EXCLUDED.includes(t.Status?.toLowerCase()))
          : all.filter(t => t.Status?.toLowerCase() === 'registration')
        setTournaments(eligible)
        if (eligible.length > 0)
          setForm(f => ({ ...f, TournamentID: String(eligible[0].TournamentID) }))
      }).catch(() => {})
  }, [token, isAdmin])

  const filtered = list.filter(t => {
    const ms = filter === 'all' || t.Status?.toLowerCase() === filter
    const ss = !search || t.Name.toLowerCase().includes(search.toLowerCase())
    return ms && ss
  })

  const openRegister = () => {
    setForm({ TournamentID: tournaments.length > 0 ? String(tournaments[0].TournamentID) : '', Name: '', LogoURL: '' })
    setPlayers([{ fullName: '', inGameName: '' }])
    setShowRegister(true)
  }

  const action = async (team: Team, act: 'approve' | 'reject') => {
    const body = act === 'approve'
      ? { TournamentID: team.TournamentID, MinPlayers: 1 }
      : { Reason: 'Admin từ chối.' }
    const r = await fetch(`/api/teams/${team.TeamID}/${act}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body)
    })
    if (r.ok) {
      toast.success(act === 'approve' ? `Đã duyệt đội "${team.Name}".` : `Đã từ chối đội "${team.Name}".`)
      load()
    } else {
      const d = await r.json()
      toast.error(d.error ?? 'Thao tác thất bại.')
    }
  }

  const disqualify = async (team: Team) => {
    if (!window.confirm(`Xác nhận loại đội "${team.Name}" khỏi giải đấu?`)) return
    const r = await fetch(`/api/teams/${team.TeamID}/disqualify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ Reason: 'Vi phạm quy định.' })
    })
    if (r.ok) {
      toast.success(`Đã loại đội "${team.Name}" khỏi giải.`)
      load()
    } else {
      const d = await r.json()
      toast.error(d.error ?? 'Không thể loại đội.')
    }
  }

  const handleRegister = async () => {
    if (!form.Name.trim()) { toast.error('Vui lòng nhập tên đội.'); return }
    if (!form.TournamentID) { toast.error('Vui lòng chọn giải đấu.'); return }
    if (validPlayers.length < minPlayers) {
      toast.error(`Cần ít nhất ${minPlayers} thành viên hợp lệ (có tên + InGameID).`); return
    }
    setSubmitting(true)
    try {
      // Bước 1: Tạo đội
      const r = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          TournamentID: parseInt(form.TournamentID),
          Name: form.Name.trim(),
          LogoURL: form.LogoURL.trim() || null,
          CaptainID: user?.UserID ?? 0
        })
      })
      const d = await r.json()
      if (!r.ok && r.status !== 201) { toast.error(d.error ?? 'Đăng ký thất bại.'); return }

      const teamID = d.teamID ?? d.teamId ?? d.id

      // Bước 2: Thêm từng thành viên
      let addedCount = 0
      const errors: string[] = []
      for (const p of validPlayers) {
        const pr = await fetch(`/api/teams/${teamID}/players`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ FullName: p.fullName.trim(), InGameID: p.inGameName.trim() })
        })
        if (pr.ok) addedCount++
        else { const e = await pr.json(); errors.push(e.error ?? p.inGameName) }
      }

      if (errors.length > 0) {
        toast.error(`Đội đã tạo nhưng ${errors.length} thành viên lỗi: ${errors.join('; ')}`)
      } else {
        toast.success(`Đăng ký thành công! ${addedCount} thành viên. Chờ Admin xét duyệt.`)
      }
      setShowRegister(false)
      load()
    } catch {
      toast.error('Không thể kết nối máy chủ.')
    } finally {
      setSubmitting(false)
    }
  }

  const loadTeamPlayers = async (teamID: number) => {
    if (teamPlayers[teamID] !== undefined) {
      setExpandedTeam(expandedTeam === teamID ? null : teamID); return
    }
    try {
      const r = await fetch(`/api/teams/${teamID}/players`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      const d = await r.json()
      setTeamPlayers(prev => ({ ...prev, [teamID]: d.data ?? [] }))
      setExpandedTeam(teamID)
    } catch {}
  }

  const statuses = [['all', 'TẤT CẢ'], ['pending', 'CHỜ DUYỆT'], ['approved', 'ĐÃ DUYỆT'], ['rejected', 'TỪ CHỐI']]
  const inputStyle: React.CSSProperties = {
    width: '100%', background: c.inputBg, border: `1px solid ${c.panelBorder}`,
    borderRadius: 9, padding: '10px 13px', color: c.onSurface,
    fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '0.7rem', fontWeight: 700, color: c.onSurfaceVar,
    textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6,
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>

      {/* Header */}
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 24, borderRadius: 2, background: 'linear-gradient(180deg,#06B6D4,#7C3AED)' }} />
          <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.4rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>ĐỘI TUYỂN</h1>
          <span style={{ padding: '2px 10px', borderRadius: 999, background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: '#06B6D4', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{filtered.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.onSurfaceVar, pointerEvents: 'none' }}><MS icon="search" /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm đội tuyển..."
              className="nexora-input" style={{ ...inputStyle, width: 220, paddingLeft: 36 }} />
          </div>
          {(isCaptain || isAdmin) && (
            <button onClick={openRegister} className="nexora-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, fontSize: '0.875rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
              <MS icon="group_add" size={18} />
              <span>ĐĂNG KÝ ĐỘI</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ padding: '0.75rem 2rem', display: 'flex', gap: 6, borderBottom: `1px solid ${c.panelBorder}` }}>
        {statuses.map(([v, l]) => {
          const sc = v !== 'all' ? statusColor(v, dark) : null
          return (
            <button key={v} onClick={() => setFilter(v)} style={{ padding: '5px 16px', borderRadius: 999, border: filter === v ? `1px solid ${sc?.border ?? 'rgba(6,182,212,0.5)'}` : `1px solid ${c.panelBorder}`, background: filter === v ? (sc?.bg ?? 'rgba(6,182,212,0.12)') : 'transparent', color: filter === v ? (sc?.text ?? '#06B6D4') : c.onSurfaceVar, cursor: 'pointer', fontSize: '0.75rem', fontWeight: filter === v ? 700 : 400, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.08em', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>{l}</button>
          )
        })}
      </div>

      {/* Team List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[1,2,3,4,5].map(i => <div key={i} style={{ height: 60, background: dark ? 'rgba(22,27,34,0.9)' : '#F0F0F5', borderRadius: 10, animation: 'neon-pulse 2s ease-in-out infinite' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: c.onSurfaceVar }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MS icon="groups" size={36} />
            </div>
            <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1rem', letterSpacing: '0.05em' }}>Không có đội tuyển nào.</p>
            {(isCaptain || isAdmin) && (
              <button onClick={openRegister} style={{ marginTop: 12, padding: '9px 20px', borderRadius: 10, border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.08)', color: '#06B6D4', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em' }}>
                + Đăng ký đội ngay
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {filtered.map(t => {
              const sc = statusColor(t.Status, dark)
              const statusKey = t.Status?.toLowerCase()
              const isPending = statusKey === 'pending'
              const isRejected = statusKey === 'rejected' || statusKey === 'disqualified'
              const isExpanded = expandedTeam === t.TeamID

              return (
                <div key={t.TeamID} style={{
                  background: dark ? 'rgba(22,27,34,0.85)' : '#fff',
                  border: `1px solid ${isRejected ? (dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)') : (dark ? 'rgba(45,55,72,0.6)' : c.panelBorder)}`,
                  borderRadius: 11, overflow: 'hidden',
                  opacity: isRejected ? 0.42 : 1,
                  filter: isRejected ? 'grayscale(0.45)' : 'none',
                  transition: 'opacity 0.2s, filter 0.2s',
                }}>
                  {/* Status accent line */}
                  <div style={{ height: 2, background: isRejected ? 'transparent' : `linear-gradient(90deg,${sc.text},transparent)` }} />

                  {/* Main row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.9rem' }}>

                    {/* Avatar initial */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: isRejected ? (dark ? 'rgba(255,255,255,0.05)' : '#f3f4f6') : 'linear-gradient(135deg,rgba(6,182,212,0.18),rgba(124,58,237,0.18))',
                      border: `1px solid ${isRejected ? 'transparent' : 'rgba(6,182,212,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Rajdhani',sans-serif", fontWeight: 800, fontSize: '1rem',
                      color: isRejected ? c.outline : '#06B6D4',
                    }}>
                      {t.Name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: 700, fontSize: '0.9rem', margin: 0, letterSpacing: '0.03em',
                        fontFamily: "'Rajdhani',sans-serif", color: c.onSurface,
                        textDecoration: isRejected ? 'line-through' : 'none',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{t.Name}</p>
                      <p style={{ fontSize: '0.68rem', color: c.onSurfaceVar, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{t.TournamentName ?? `Giải #${t.TournamentID}`}</span>
                        {t.CaptainName && <span style={{ color: c.outline }}> · ĐT: {t.CaptainName}</span>}
                      </p>
                    </div>

                    {/* Player count */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: c.onSurfaceVar, flexShrink: 0 }}>
                      <MS icon="group" size={13} />
                      <span style={{ fontSize: '0.72rem', fontFamily: "'JetBrains Mono',monospace" }}>{t.PlayerCount ?? 0}</span>
                    </div>

                    {/* Status badge */}
                    <span style={{
                      padding: '2px 9px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700,
                      background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                      fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.07em', whiteSpace: 'nowrap', flexShrink: 0,
                    }}>{statusLabels[statusKey] ?? t.Status}</span>

                    {/* Admin: Approve/Reject buttons */}
                    {isAdmin && isPending && (
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                        <button onClick={() => action(t, 'approve')}
                          style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(104,211,145,0.1)', border: '1px solid rgba(104,211,145,0.3)', color: '#68D391', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 3, transition: 'all 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(104,211,145,0.22)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(104,211,145,0.1)')}>
                          <MS icon="check" size={12} />DUYỆT
                        </button>
                        <button onClick={() => action(t, 'reject')}
                          style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)', color: '#FC8181', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 3, transition: 'all 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(252,129,129,0.22)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(252,129,129,0.1)')}>
                          <MS icon="close" size={12} />TỪ CHỐI
                        </button>
                      </div>
                    )}

                    {/* Admin: Disqualify */}
                    {isAdmin && statusKey === 'approved' && (
                      <button onClick={() => disqualify(t)}
                        style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#FC8181', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, transition: 'all 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.18)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}>
                        <MS icon="person_remove" size={12} />LOẠI
                      </button>
                    )}

                    {/* Expand toggle */}
                    <button onClick={() => loadTeamPlayers(t.TeamID)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: c.outline, padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0, borderRadius: 6, transition: 'all 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(6,182,212,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <MS icon={isExpanded ? 'expand_less' : 'expand_more'} size={18} />
                    </button>
                  </div>

                  {/* Expanded player table */}
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${c.panelBorder}`, padding: '0.5rem 0.9rem 0.7rem 3.4rem', background: dark ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.02)' }}>
                      {!teamPlayers[t.TeamID] ? (
                        <p style={{ color: c.outline, fontSize: '0.75rem', margin: 0 }}>Đang tải...</p>
                      ) : teamPlayers[t.TeamID].length === 0 ? (
                        <p style={{ color: c.outline, fontSize: '0.75rem', margin: 0, fontStyle: 'italic' }}>Chưa có thành viên.</p>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                          <thead>
                            <tr>
                              {['#','Tên thật','Tên In-Game'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '2px 6px 5px', color: c.outline, fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.6rem', textTransform: 'uppercase' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {teamPlayers[t.TeamID].map((p: any, i: number) => (
                              <tr key={i} style={{ borderTop: `1px solid ${c.panelBorder}` }}>
                                <td style={{ padding: '4px 6px', color: c.outline, fontFamily: "'JetBrains Mono',monospace", width: 24 }}>{i+1}</td>
                                <td style={{ padding: '4px 6px', color: c.onSurface }}>{p.FullName || p.fullName || '—'}</td>
                                <td style={{ padding: '4px 6px', color: '#06B6D4', fontFamily: "'JetBrains Mono',monospace" }}>{p.InGameID || p.inGameID || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Register Team Modal ── */}
      {showRegister && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: c.surfaceCard, border: '1px solid rgba(6,182,212,0.3)', borderRadius: 20, padding: '2rem', width: 580, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: dark ? '0 32px 80px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.1)' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 20, borderRadius: 2, background: 'linear-gradient(180deg,#06B6D4,#7C3AED)' }} />
                <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.2rem', fontWeight: 700, margin: 0, letterSpacing: '0.08em', color: c.onSurface }}>ĐĂNG KÝ ĐỘI TUYỂN</h2>
              </div>
              <button onClick={() => setShowRegister(false)} style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8, cursor: 'pointer', color: '#06B6D4', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* ─ 1. Giải đấu ─ */}
              <div>
                <label style={labelStyle}>Giải đấu *</label>
                {tournaments.length === 0 ? (
                  <div style={{ padding: '12px 14px', borderRadius: 9, background: 'rgba(246,173,85,0.08)', border: '1px solid rgba(246,173,85,0.25)', color: '#F6AD55', fontSize: '0.82rem' }}>
                    {isAdmin ? '⚠ Không có giải nào khả dụng.' : '⚠ Không có giải đang nhận đăng ký.'}
                  </div>
                ) : (
                  <select value={form.TournamentID} onChange={e => setForm(f => ({ ...f, TournamentID: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }} className="nexora-input">
                    {tournaments.map(t => (
                      <option key={t.TournamentID} value={t.TournamentID}>
                        {t.Name} [{t.Status}] — Tối đa {t.MaxTeams} đội
                      </option>
                    ))}
                  </select>
                )}
                {selectedTourn && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, background: 'rgba(124,58,237,0.12)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.3)' }}>
                      🎮 {selectedTourn.GameType || 'N/A'}
                    </span>
                    <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, background: validPlayers.length >= minPlayers ? 'rgba(104,211,145,0.1)' : 'rgba(252,129,129,0.1)', color: validPlayers.length >= minPlayers ? '#68D391' : '#FC8181', border: `1px solid ${validPlayers.length >= minPlayers ? 'rgba(104,211,145,0.3)' : 'rgba(252,129,129,0.3)'}` }}>
                      👥 {validPlayers.length}/{minPlayers} thành viên tối thiểu
                    </span>
                  </div>
                )}
              </div>

              {/* ─ 2. Tên đội + Logo ─ */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Tên đội *</label>
                  <input value={form.Name} onChange={e => setForm(f => ({ ...f, Name: e.target.value }))}
                    placeholder="Alpha Wolves, NaVi VN..." maxLength={50}
                    className="nexora-input" style={inputStyle} />
                  <p style={{ fontSize: '0.68rem', color: c.outline, margin: '4px 0 0', fontFamily: "'JetBrains Mono',monospace" }}>{form.Name.length}/50</p>
                </div>
                <div>
                  <label style={labelStyle}>Logo URL (tùy chọn)</label>
                  <input value={form.LogoURL} onChange={e => setForm(f => ({ ...f, LogoURL: e.target.value }))}
                    placeholder="https://i.imgur.com/..."
                    className="nexora-input" style={inputStyle} />
                  <p style={{ fontSize: '0.68rem', color: c.outline, margin: '4px 0 0' }}>Link ảnh logo đội</p>
                </div>
              </div>

              {/* ─ 3. Thành viên ─ */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>
                    THÀNH VIÊN *
                    <span style={{ marginLeft: 8, fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: validPlayers.length >= minPlayers ? '#68D391' : '#FC8181', fontSize: '0.72rem' }}>
                      ({validPlayers.length}/{minPlayers} tối thiểu)
                    </span>
                  </label>
                  <button onClick={() => setPlayers(p => [...p, { fullName: '', inGameName: '' }])}
                    style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 7, cursor: 'pointer', color: '#06B6D4', padding: '4px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MS icon="add" size={14} /> Thêm dòng
                  </button>
                </div>

                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: c.outline, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tên thật</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: c.outline, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tên In-Game</span>
                  <span />
                </div>

                {players.map((p, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: 6, marginBottom: 6 }}>
                    <input value={p.fullName}
                      onChange={e => setPlayers(prev => prev.map((r, j) => j === i ? { ...r, fullName: e.target.value } : r))}
                      placeholder={`Nguyễn Văn A`}
                      style={{ ...inputStyle, fontSize: '0.82rem', padding: '7px 10px' }}
                      className="nexora-input" />
                    <input value={p.inGameName}
                      onChange={e => setPlayers(prev => prev.map((r, j) => j === i ? { ...r, inGameName: e.target.value } : r))}
                      placeholder={`Phoenix#VN`}
                      style={{ ...inputStyle, fontSize: '0.82rem', padding: '7px 10px', fontFamily: "'JetBrains Mono',monospace" }}
                      className="nexora-input" />
                    <button onClick={() => setPlayers(prev => prev.filter((_, j) => j !== i))}
                      disabled={players.length === 1}
                      style={{ background: 'rgba(252,129,129,0.08)', border: '1px solid rgba(252,129,129,0.2)', borderRadius: 7, cursor: players.length === 1 ? 'not-allowed' : 'pointer', color: '#FC8181', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: players.length === 1 ? 0.35 : 1 }}>
                      <MS icon="remove" size={14} />
                    </button>
                  </div>
                ))}
                <p style={{ fontSize: '0.7rem', color: c.outline, margin: '6px 0 0', lineHeight: 1.6 }}>
                  ℹ Nhập tên thật và tên trong game của mỗi thành viên. Có thể bổ sung thêm sau khi đăng ký.
                </p>
              </div>

              {/* Info */}
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.18)', display: 'flex', gap: 10 }}>
                <MS icon="info" size={16} />
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#06B6D4', lineHeight: 1.6 }}>
                  Đội sẽ ở trạng thái <strong>Chờ Duyệt</strong>. Admin kiểm tra đủ {minPlayers} thành viên trước khi duyệt.
                </p>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowRegister(false)}
                  style={{ padding: '10px 20px', borderRadius: 9, background: 'transparent', border: `1px solid ${c.panelBorder}`, color: c.onSurfaceVar, cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em' }}>
                  HỦY
                </button>
                <button onClick={handleRegister}
                  disabled={submitting || !form.Name.trim() || !form.TournamentID || tournaments.length === 0 || validPlayers.length < minPlayers}
                  className="nexora-btn-primary"
                  style={{ padding: '10px 28px', borderRadius: 9, fontSize: '0.9rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.08em', opacity: (submitting || !form.Name.trim() || validPlayers.length < minPlayers) ? 0.6 : 1 }}>
                  {submitting ? '⏳ Đang đăng ký...' : 'ĐĂNG KÝ ĐỘI'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
