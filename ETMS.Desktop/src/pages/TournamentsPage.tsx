import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens, statusColor } from '../theme'

interface Tournament { TournamentID: number; Name: string; GameType: string; Format: string; Status: string; MaxTeams: number; StartDate: string }

const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none' }}>{icon}</span>
)

const Badge = ({ status, dark }: { status: string; dark: boolean }) => {
  const sc = statusColor(status, dark)
  const labels: Record<string, string> = { draft: 'Bản nháp', registration: 'Đăng ký', active: 'Đang diễn ra', completed: 'Hoàn thành' }
  return <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{labels[status?.toLowerCase()] ?? status}</span>
}

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

  const inputStyle = { width: '100%', background: c.inputBg, border: `1px solid ${c.panelBorder}`, borderRadius: 8, padding: '9px 12px', color: c.onSurface, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none' }
  const labelStyle = { fontSize: '0.75rem', fontWeight: 600, color: c.onSurfaceVar, textTransform: 'uppercase' as const, letterSpacing: '0.08em', display: 'block', marginBottom: 6 }
  const gameTypes = ['FPS', 'MOBA', 'BattleRoyale', 'Fighting']
  const formats = ['SingleElimination', 'RoundRobin', 'Swiss']
  const statuses = [['all', 'Tất cả'], ['draft', 'Bản nháp'], ['registration', 'Đăng ký'], ['active', 'Đang diễn ra'], ['completed', 'Hoàn thành']]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      {/* Header bar */}
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>🏆 Quản lý Giải đấu</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.onSurfaceVar }}><MS icon="search" /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm giải đấu..." style={{ ...inputStyle, width: 220, paddingLeft: 34 }} />
          </div>
          {isAdmin && (
            <button onClick={() => { setShowModal(true); setError('') }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 9, background: 'linear-gradient(135deg,#E94560,#91002b)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(233,69,96,0.3)' }}>
              <MS icon="add" /><span>Tạo giải đấu</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ padding: '0.75rem 2rem', display: 'flex', gap: 6, borderBottom: `1px solid ${c.panelBorder}`, overflowX: 'auto' }}>
        {statuses.map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: '5px 14px', borderRadius: 999, border: filter === v ? `1px solid ${c.primary}` : `1px solid ${c.panelBorder}`, background: filter === v ? `${c.primary}18` : 'transparent', color: filter === v ? c.primary : c.onSurfaceVar, cursor: 'pointer', fontSize: '0.8rem', fontWeight: filter === v ? 700 : 400, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{l}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 56, background: c.surfaceCard, borderRadius: 10 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: c.onSurfaceVar }}>
            <MS icon="emoji_events" size={48} /><p style={{ marginTop: 12 }}>Không có giải đấu nào.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.panelBorder}` }}>
                {['Tên giải đấu', 'Thể loại', 'Thể thức', 'Trạng thái', 'Số đội tối đa', 'Ngày bắt đầu', isAdmin ? 'Thao tác' : ''].filter(Boolean).map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: c.onSurfaceVar }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.TournamentID} style={{ borderBottom: `1px solid ${c.panelBorder}40`, transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px', fontWeight: 600, color: c.onSurface }}>{t.Name}</td>
                  <td style={{ padding: '12px', color: c.onSurfaceVar }}>{t.GameType}</td>
                  <td style={{ padding: '12px', color: c.onSurfaceVar }}>{t.Format}</td>
                  <td style={{ padding: '12px' }}><Badge status={t.Status} dark={dark} /></td>
                  <td style={{ padding: '12px', color: c.onSurfaceVar }}>{t.MaxTeams}</td>
                  <td style={{ padding: '12px', color: c.onSurfaceVar }}>{t.StartDate ? new Date(t.StartDate).toLocaleDateString('vi-VN') : '—'}</td>
                  {isAdmin && (
                    <td style={{ padding: '12px' }}>
                      {t.Status !== 'Completed' && (
                        <button onClick={() => advanceStatus(t.TournamentID)} style={{ padding: '4px 12px', borderRadius: 6, background: `${c.primary}18`, border: `1px solid ${c.primary}40`, color: c.primary, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit' }}>
                          Chuyển trạng thái
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: c.surfaceLow, border: `1px solid ${c.panelBorder}`, borderRadius: 16, padding: '2rem', width: 480, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.15rem', fontWeight: 700, margin: 0, color: c.onSurface }}>Tạo giải đấu mới</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.onSurfaceVar, fontSize: '1.2rem' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={labelStyle}>Tên giải đấu *</label><input value={form.Name} onChange={e => setForm(f => ({ ...f, Name: e.target.value }))} placeholder="VD: ETMS Open Cup 2025" style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Thể loại</label>
                  <select value={form.GameType} onChange={e => setForm(f => ({ ...f, GameType: e.target.value }))} style={inputStyle}>
                    {gameTypes.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Thể thức</label>
                  <select value={form.Format} onChange={e => setForm(f => ({ ...f, Format: e.target.value }))} style={inputStyle}>
                    {formats.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Số đội tối đa</label><input type="number" min={2} max={128} value={form.MaxTeams} onChange={e => setForm(f => ({ ...f, MaxTeams: +e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>TV tối thiểu / đội</label><input type="number" min={1} max={10} value={form.MinPlayersPerTeam} onChange={e => setForm(f => ({ ...f, MinPlayersPerTeam: +e.target.value }))} style={inputStyle} /></div>
              </div>
              <div><label style={labelStyle}>Ngày bắt đầu</label><input type="date" value={form.StartDate} onChange={e => setForm(f => ({ ...f, StartDate: e.target.value }))} style={inputStyle} /></div>
              {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(233,69,96,0.1)', border: '1px solid rgba(233,69,96,0.25)', color: c.errorText, fontSize: '0.85rem' }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '9px 20px', borderRadius: 8, background: 'transparent', border: `1px solid ${c.panelBorder}`, color: c.onSurfaceVar, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}>Hủy</button>
                <button onClick={handleCreate} disabled={submitting} style={{ padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#E94560,#91002b)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit', opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Đang tạo...' : 'Tạo giải đấu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
