import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens, statusColor, gameTypeColor } from '../theme'

interface Tournament { TournamentID: number; Name: string; GameType: string; Format: string; Status: string; MaxTeams: number; MinPlayersPerTeam: number; StartDate: string }

const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)

const statusLabels: Record<string, string> = { draft: 'BẢN NHÁP', registration: 'ĐĂNG KÝ', active: 'ĐANG DIỄN RA', completed: 'HOÀN THÀNH' }
const gameTypeIcon: Record<string, string> = { fps: 'crosshair', moba: 'groups', battleroyale: 'explore', fighting: 'sports_martial_arts', rts: 'account_tree', sports: 'sports_soccer' }
const formatLabels: Record<string, string> = { singleelimination: 'Single Elim', roundrobin: 'Round Robin', swiss: 'Swiss' }

export default function TournamentsPage() {
  const { token, isAdmin } = useAuth()
  const { dark } = useTheme()
  const c = getTokens(dark)
  const [list, setList] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ Name: '', GameType: 'FPS', Format: 'SingleElimination', StartDate: '', MaxTeams: 16, MinPlayersPerTeam: 5 })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    fetch('/api/tournaments', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(d => setList(d.data ?? [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [token])

  const filtered = list.filter(t => {
    const matchStatus = filter === 'all' || t.Status?.toLowerCase() === filter
    const matchSearch = !search || t.Name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const handleCreate = async () => {
    if (!form.Name.trim()) { setError('Vui lòng nhập tên giải đấu.'); return }
    setSubmitting(true); setError('')
    try {
      const r = await fetch('/api/tournaments', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ ...form, StartDate: form.StartDate || new Date().toISOString() }) })
      if (r.ok) { setShowModal(false); load() } else { const d = await r.json(); setError(d.error ?? 'Tạo thất bại.') }
    } catch { setError('Không thể kết nối máy chủ.') } finally { setSubmitting(false) }
  }

  const advanceStatus = async (id: number) => {
    await fetch(`/api/tournaments/${id}/advance`, { method: 'PATCH', headers: token ? { Authorization: `Bearer ${token}` } : {} })
    load()
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: c.inputBg, border: `1px solid ${c.panelBorder}`, borderRadius: 8, padding: '10px 12px', color: c.onSurface, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s' }
  const labelStyle: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 700, color: c.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }
  const statuses = [['all', 'Tất Cả'], ['draft', 'Bản Nháp'], ['registration', 'Đăng Ký'], ['active', 'Live'], ['completed', 'Hoàn Thành']]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>

      {/* Header */}
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 24, borderRadius: 2, background: 'linear-gradient(180deg,#7C3AED,#06B6D4)' }} />
          <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.4rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>QUẢN LÝ GIẢI ĐẤU</h1>
          <span style={{ padding: '2px 10px', borderRadius: 999, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{list.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.onSurfaceVar, pointerEvents: 'none' }}><MS icon="search" /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm giải đấu..." className="nexora-input"
              style={{ ...inputStyle, width: 220, paddingLeft: 36 }} />
          </div>
          {isAdmin && (
            <button onClick={() => { setShowModal(true); setError('') }} className="nexora-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, fontSize: '0.875rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em' }}>
              <MS icon="add" /><span>TẠO GIẢI ĐẤU</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ padding: '0.75rem 2rem', display: 'flex', gap: 6, borderBottom: `1px solid ${c.panelBorder}`, overflowX: 'auto' }}>
        {statuses.map(([v, l]) => {
          const sc = v !== 'all' ? statusColor(v, dark) : null
          return (
            <button key={v} onClick={() => setFilter(v)} style={{
              padding: '5px 16px', borderRadius: 999, border: filter === v ? `1px solid ${sc?.border ?? 'rgba(124,58,237,0.5)'}` : `1px solid ${c.panelBorder}`,
              background: filter === v ? (sc?.bg ?? 'rgba(124,58,237,0.12)') : 'transparent',
              color: filter === v ? (sc?.text ?? '#A78BFA') : c.onSurfaceVar,
              cursor: 'pointer', fontSize: '0.78rem', fontWeight: filter === v ? 700 : 400,
              fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.06em', whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}>{l}</button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 2rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 60, background: 'rgba(22,27,34,0.9)', borderRadius: 12, animation: 'neon-pulse 2s ease-in-out infinite' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: c.onSurfaceVar }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MS icon="emoji_events" size={36} />
            </div>
            <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1rem', letterSpacing: '0.05em' }}>Không có giải đấu nào.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.panelBorder}` }}>
                {['#', 'Tên Giải Đấu', 'Thể Loại', 'Thể Thức', 'Trạng Thái', 'Đội', 'Ngày Bắt Đầu', isAdmin ? 'Thao Tác' : ''].filter(Boolean).map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: c.onSurfaceVar, fontFamily: "'Rajdhani',sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, idx) => {
                const sc = statusColor(t.Status, dark)
                const gtColor = gameTypeColor(t.GameType)
                return (
                  <tr key={t.TournamentID} style={{ borderBottom: `1px solid ${c.panelBorder}40`, transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px', color: c.onSurfaceVar, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem' }}>{String(idx + 1).padStart(2, '0')}</td>
                    <td style={{ padding: '12px', fontWeight: 600, color: c.onSurface, fontFamily: "'Rajdhani',sans-serif", fontSize: '0.95rem', letterSpacing: '0.03em' }}>{t.Name}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: gtColor }}>
                        <span style={{ fontSize: 14, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1 }}>
                          {gameTypeIcon[t.GameType?.toLowerCase()] ?? 'sports_esports'}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t.GameType}</span>
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: c.onSurfaceVar, fontSize: '0.8rem' }}>{formatLabels[t.Format?.toLowerCase()] ?? t.Format}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em', background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontFamily: "'Rajdhani',sans-serif" }}>
                        {t.Status?.toLowerCase() === 'active' && <span className="live-dot" style={{ marginRight: 5 }} />}
                        {statusLabels[t.Status?.toLowerCase()] ?? t.Status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: c.onSurfaceVar, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.8rem' }}>{t.MaxTeams}</td>
                    <td style={{ padding: '12px', color: c.onSurfaceVar, fontSize: '0.8rem' }}>{t.StartDate ? new Date(t.StartDate).toLocaleDateString('vi-VN') : '—'}</td>
                    {isAdmin && (
                      <td style={{ padding: '12px' }}>
                        {t.Status !== 'Completed' && (
                          <button onClick={() => advanceStatus(t.TournamentID)}
                            style={{ padding: '5px 12px', borderRadius: 7, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.04em', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.2)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)' }}>
                            Tiến Trạng Thái →
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: c.surfaceCard, border: '1px solid rgba(124,58,237,0.3)', borderRadius: 18, padding: '2rem', width: 500, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: dark ? '0 32px 80px rgba(0,0,0,0.6), 0 0 40px rgba(124,58,237,0.1)' : '0 8px 32px rgba(0,0,0,0.08)', animation: 'slide-in 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 20, borderRadius: 2, background: 'linear-gradient(180deg,#7C3AED,#06B6D4)' }} />
                <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.2rem', fontWeight: 700, margin: 0, letterSpacing: '0.08em', color: c.onSurface }}>TẠO GIẢI ĐẤU MỚI</h2>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.2)', borderRadius: 8, cursor: 'pointer', color: '#FC8181', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={labelStyle}>Tên giải đấu *</label><input value={form.Name} onChange={e => setForm(f => ({ ...f, Name: e.target.value }))} placeholder="VD: NEXORA Open Cup 2025" style={inputStyle} className="nexora-input" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Thể loại</label>
                  <select value={form.GameType} onChange={e => setForm(f => ({ ...f, GameType: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {['FPS', 'MOBA', 'BattleRoyale', 'Fighting', 'RTS', 'Sports'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Thể thức</label>
                  <select value={form.Format} onChange={e => setForm(f => ({ ...f, Format: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {['SingleElimination', 'RoundRobin', 'Swiss'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Số đội tối đa</label><input type="number" min={2} max={128} value={form.MaxTeams} onChange={e => setForm(f => ({ ...f, MaxTeams: +e.target.value }))} style={inputStyle} className="nexora-input" /></div>
                <div><label style={labelStyle}>Thành viên tối thiểu / đội</label><input type="number" min={1} max={10} value={form.MinPlayersPerTeam} onChange={e => setForm(f => ({ ...f, MinPlayersPerTeam: +e.target.value }))} style={inputStyle} className="nexora-input" /></div>
              </div>
              <div><label style={labelStyle}>Ngày bắt đầu</label><input type="date" value={form.StartDate} onChange={e => setForm(f => ({ ...f, StartDate: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} className="nexora-input" /></div>
              {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(252,129,129,0.08)', border: '1px solid rgba(252,129,129,0.25)', color: '#FC8181', fontSize: '0.85rem' }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: 9, background: 'transparent', border: `1px solid ${c.panelBorder}`, color: c.onSurfaceVar, cursor: 'pointer', fontSize: '0.875rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em', transition: 'all 0.15s' }}>HỦY</button>
                <button onClick={handleCreate} disabled={submitting} className="nexora-btn-primary" style={{ padding: '10px 24px', borderRadius: 9, fontSize: '0.9rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.08em' }}>
                  {submitting ? 'Đang tạo...' : 'TẠO GIẢI ĐẤU'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
