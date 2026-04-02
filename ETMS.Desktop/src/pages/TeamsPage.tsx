import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { getTokens, statusColor } from '../theme'

interface Team { TeamID: number; Name: string; TournamentID: number; Status: string; PlayerCount?: number; CaptainName?: string }
interface Tournament { TournamentID: number; Name: string; Status: string; MaxTeams: number }

const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)

const statusLabels: Record<string, string> = { pending: 'CHỜ DUYỆT', approved: 'ĐÃ DUYỆT', rejected: 'TỪ CHỐI' }

export default function TeamsPage() {
  const { token, user, isAdmin } = useAuth()
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
  const [form, setForm] = useState({ TournamentID: '', Name: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/teams', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(d => setList(d.data ?? []))
      .catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [token])

  // Load tournaments for registration dropdown (Registration status only)
  useEffect(() => {
    fetch('/api/tournaments', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(d => {
        const reg = (d.data ?? []).filter((t: Tournament) => t.Status?.toLowerCase() === 'registration')
        setTournaments(reg)
        if (reg.length > 0) setForm(f => ({ ...f, TournamentID: String(reg[0].TournamentID) }))
      }).catch(() => {})
  }, [token])

  const filtered = list.filter(t => {
    const ms = filter === 'all' || t.Status?.toLowerCase() === filter
    const ss = !search || t.Name.toLowerCase().includes(search.toLowerCase())
    return ms && ss
  })

  const action = async (team: Team, act: 'approve' | 'reject') => {
    const body = act === 'approve'
      ? { TournamentID: team.TournamentID, MinPlayers: 1 }
      : { Reason: 'Admin t\u1EEB ch\u1ED1i.' }
    const r = await fetch(`/api/teams/${team.TeamID}/${act}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body)
    })
    if (r.ok) {
      toast.success(act === 'approve' ? `\u0110\u00E3 duy\u1EC7t \u0111\u1ED9i "${team.Name}".` : `\u0110\u00E3 t\u1EEB ch\u1ED1i \u0111\u1ED9i "${team.Name}".`)
      load()
    } else {
      const d = await r.json()
      toast.error(d.error ?? 'Thao t\u00E1c th\u1EA5t b\u1EA1i.')
    }
  }

  const disqualify = async (team: Team) => {
    if (!window.confirm(`X\u00E1c nh\u1EADn lo\u1EA1i \u0111\u1ED9i "${team.Name}" kh\u1ECFi gi\u1EA3i \u0111\u1EA5u?`)) return
    const r = await fetch(`/api/teams/${team.TeamID}/disqualify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ Reason: 'Vi ph\u1EA1m quy \u0111\u1ECBnh.' })
    })
    if (r.ok) {
      toast.success(`\u0110\u00E3 lo\u1EA1i \u0111\u1ED9i "${team.Name}" kh\u1ECFi gi\u1EA3i.`)
      load()
    } else {
      const d = await r.json()
      toast.error(d.error ?? 'Kh\u00F4ng th\u1EC3 lo\u1EA1i \u0111\u1ED9i.')
    }
  }

  const handleRegister = async () => {
    if (!form.Name.trim()) { toast.error('Vui lòng nhập tên đội.'); return }
    if (!form.TournamentID) { toast.error('Vui lòng chọn giải đấu.'); return }
    setSubmitting(true)
    try {
      const r = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          TournamentID: parseInt(form.TournamentID),
          Name: form.Name.trim(),
          CaptainID: user?.UserID ?? 0
        })
      })
      const d = await r.json()
      if (r.ok || r.status === 201) {
        toast.success('Đội đã đăng ký thành công! Chờ Admin xét duyệt.')
        setShowRegister(false)
        setForm(f => ({ ...f, Name: '' }))
        load()
      } else {
        toast.error(d.error ?? 'Đăng ký thất bại.')
      }
    } catch {
      toast.error('Không thể kết nối máy chủ.')
    } finally {
      setSubmitting(false)
    }
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
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.onSurfaceVar, pointerEvents: 'none' }}><MS icon="search" /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm đội tuyển..."
              className="nexora-input" style={{ ...inputStyle, width: 220, paddingLeft: 36 }} />
          </div>
          {/* Register button — visible to all logged in users */}
          <button onClick={() => setShowRegister(true)} className="nexora-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, fontSize: '0.875rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            <MS icon="group_add" size={18} />
            <span>ĐĂNG KÝ ĐỘI</span>
          </button>
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

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 120, background: dark ? 'rgba(22,27,34,0.9)' : '#F0F0F5', borderRadius: 14, animation: 'neon-pulse 2s ease-in-out infinite' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: c.onSurfaceVar }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MS icon="groups" size={36} />
            </div>
            <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1rem', letterSpacing: '0.05em' }}>Không có đội tuyển nào.</p>
            <button onClick={() => setShowRegister(true)} style={{ marginTop: 12, padding: '9px 20px', borderRadius: 10, border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.08)', color: '#06B6D4', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em' }}>
              + Đăng ký đội ngay
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {filtered.map(t => {
              const sc = statusColor(t.Status, dark)
              const isPending = t.Status?.toLowerCase() === 'pending'
              return (
                <div key={t.TeamID} className="nexora-card" style={{ background: dark ? 'rgba(22,27,34,0.9)' : 'rgba(255,255,255,0.95)', border: `1px solid ${dark ? 'rgba(45,55,72,0.5)' : c.panelBorder}`, borderRadius: 14, padding: '1.25rem', backdropFilter: 'blur(8px)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${sc.text},transparent)` }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,rgba(6,182,212,0.2),rgba(124,58,237,0.2))', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: '1rem', color: '#06B6D4' }}>
                        {t.Name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0, color: c.onSurface, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.03em' }}>{t.Name}</p>
                        <p style={{ fontSize: '0.72rem', color: c.onSurfaceVar, margin: '2px 0 0', fontFamily: "'JetBrains Mono',monospace" }}>Giải #{t.TournamentID}</p>
                      </div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      {statusLabels[t.Status?.toLowerCase()] ?? t.Status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: (isPending || t.Status?.toLowerCase() === 'approved') && isAdmin ? 12 : 0 }}>
                    <span style={{ fontSize: 14, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", color: c.onSurfaceVar }}>group</span>
                    <span style={{ fontSize: '0.78rem', color: c.onSurfaceVar }}>{t.PlayerCount ?? 0} thành viên</span>
                    {t.CaptainName && <><span style={{ color: c.outline }}>·</span><span style={{ fontSize: '0.78rem', color: c.onSurfaceVar }}>ĐT: <span style={{ color: c.onSurface }}>{t.CaptainName}</span></span></>}
                  </div>

                  {isAdmin && isPending && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => action(t, 'approve')} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(104,211,145,0.1)', border: '1px solid rgba(104,211,145,0.3)', color: '#68D391', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(104,211,145,0.2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(104,211,145,0.1)')}>
                        <MS icon="check_circle" size={15} />DUYỆT
                      </button>
                      <button onClick={() => action(t, 'reject')} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)', color: '#FC8181', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(252,129,129,0.2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(252,129,129,0.1)')}>
                        <MS icon="cancel" size={15} />TỪ CHỐI
                      </button>
                    </div>
                  )}
                  {isAdmin && t.Status?.toLowerCase() === 'approved' && (
                    <button onClick={() => disqualify(t)}
                      style={{ width: '100%', marginTop: 8, padding: '7px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#FC8181', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.16)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}>
                      <MS icon="person_remove" size={14} />LOẠI ĐỘI
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Register Team Modal ────────────────────────────────────────────────── */}
      {showRegister && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) setShowRegister(false) }}>
          <div style={{ background: c.surfaceCard, border: '1px solid rgba(6,182,212,0.3)', borderRadius: 20, padding: '2rem', width: 460, maxWidth: '95vw', boxShadow: dark ? '0 32px 80px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.1)', animation: 'slide-in 0.3s ease' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 20, borderRadius: 2, background: 'linear-gradient(180deg,#06B6D4,#7C3AED)' }} />
                <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.2rem', fontWeight: 700, margin: 0, letterSpacing: '0.08em', color: c.onSurface }}>ĐĂNG KÝ ĐỘI TUYỂN</h2>
              </div>
              <button onClick={() => setShowRegister(false)} style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8, cursor: 'pointer', color: '#06B6D4', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {/* Tournament selector */}
              <div>
                <label style={labelStyle}>Giải đấu *</label>
                {tournaments.length === 0 ? (
                  <div style={{ padding: '12px 14px', borderRadius: 9, background: 'rgba(246,173,85,0.08)', border: '1px solid rgba(246,173,85,0.25)', color: '#F6AD55', fontSize: '0.82rem' }}>
                    ⚠ Hiện không có giải đấu nào đang nhận đăng ký.
                  </div>
                ) : (
                  <select value={form.TournamentID} onChange={e => setForm(f => ({ ...f, TournamentID: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }} className="nexora-input">
                    {tournaments.map(t => (
                      <option key={t.TournamentID} value={t.TournamentID}>
                        {t.Name} (Tối đa {t.MaxTeams} đội)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Team name */}
              <div>
                <label style={labelStyle}>Tên đội *</label>
                <input
                  value={form.Name}
                  onChange={e => setForm(f => ({ ...f, Name: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter' && !submitting) handleRegister() }}
                  placeholder="vd. Alpha Wolves, NaVi VN..."
                  maxLength={50}
                  className="nexora-input"
                  style={inputStyle}
                />
                <p style={{ fontSize: '0.7rem', color: c.outline, margin: '5px 0 0', fontFamily: "'JetBrains Mono',monospace" }}>
                  {form.Name.length}/50 · Tên đội sẽ hiển thị công khai
                </p>
              </div>

              {/* Info box */}
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.18)', display: 'flex', gap: 10 }}>
                <MS icon="info" size={16} />
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#06B6D4', lineHeight: 1.6 }}>
                  Đội sẽ ở trạng thái <strong>Chờ Duyệt</strong> sau khi đăng ký. Admin sẽ xét duyệt trong vòng 24h.
                  Bạn sẽ nhận thông báo khi đội được duyệt.
                </p>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => setShowRegister(false)}
                  style={{ padding: '10px 20px', borderRadius: 9, background: 'transparent', border: `1px solid ${c.panelBorder}`, color: c.onSurfaceVar, cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em', transition: 'all 0.15s' }}>
                  HỦY
                </button>
                <button onClick={handleRegister} disabled={submitting || !form.Name.trim() || !form.TournamentID || tournaments.length === 0}
                  className="nexora-btn-primary"
                  style={{ padding: '10px 28px', borderRadius: 9, fontSize: '0.9rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.08em', opacity: (submitting || !form.Name.trim() || !form.TournamentID) ? 0.6 : 1 }}>
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
