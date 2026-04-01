import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens, statusColor } from '../theme'

interface Team { TeamID: number; Name: string; TournamentID: number; Status: string; PlayerCount?: number }
const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none' }}>{icon}</span>
)
const Badge = ({ status, dark }: { status: string; dark: boolean }) => {
  const sc = statusColor(status, dark)
  const map: Record<string, string> = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' }
  return <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{map[status?.toLowerCase()] ?? status}</span>
}

export default function TeamsPage() {
  const { token, isAdmin } = useAuth()
  const { dark } = useTheme()
  const c = getTokens(dark)
  const [list, setList] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    fetch('/api/teams', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(d => setList(d.data ?? []))
      .catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [token])

  const filtered = list.filter(t => {
    const ms = filter === 'all' || t.Status?.toLowerCase() === filter
    const ss = !search || t.Name.toLowerCase().includes(search.toLowerCase())
    return ms && ss
  })

  const action = async (id: number, act: 'approve' | 'reject') => {
    const body = act === 'approve' ? { TournamentID: 1, MinPlayers: 1 } : { Reason: 'Admin từ chối.' }
    await fetch(`/api/teams/${id}/${act}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) })
    load()
  }

  const inputStyle = { background: c.inputBg, border: `1px solid ${c.panelBorder}`, borderRadius: 8, padding: '8px 12px', color: c.onSurface, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none' }
  const statuses = [['all','Tất cả'],['pending','Chờ duyệt'],['approved','Đã duyệt'],['rejected','Từ chối']]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>👥 Đội thi đấu</h1>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.onSurfaceVar }}><MS icon="search" /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm đội..." style={{ ...inputStyle, width: 200, paddingLeft: 34 }} />
        </div>
      </div>

      <div style={{ padding: '0.75rem 2rem', display: 'flex', gap: 6, borderBottom: `1px solid ${c.panelBorder}` }}>
        {statuses.map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: '5px 14px', borderRadius: 999, border: filter === v ? `1px solid ${c.primary}` : `1px solid ${c.panelBorder}`, background: filter === v ? `${c.primary}18` : 'transparent', color: filter === v ? c.primary : c.onSurfaceVar, cursor: 'pointer', fontSize: '0.8rem', fontWeight: filter === v ? 700 : 400, fontFamily: 'inherit' }}>{l}</button>
        ))}
        {!loading && <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: c.onSurfaceVar, alignSelf: 'center' }}>{filtered.length} đội</span>}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem' }}>
        {loading ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1,2,3].map(i => <div key={i} style={{ height: 56, background: c.surfaceCard, borderRadius: 10 }} />)}</div>
          : filtered.length === 0 ? <div style={{ textAlign: 'center', padding: '4rem', color: c.onSurfaceVar }}><MS icon="groups" size={48}/><p style={{ marginTop: 12 }}>Không có đội nào.</p></div>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {filtered.map(t => (
                <div key={t.TeamID} style={{ background: c.surfaceCard, border: `1px solid ${c.panelBorder}`, borderRadius: 12, padding: '1.25rem', backdropFilter: 'blur(6px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0, color: c.onSurface }}>{t.Name}</p>
                      <p style={{ fontSize: '0.75rem', color: c.onSurfaceVar, margin: '3px 0 0' }}>Giải đấu #{t.TournamentID}</p>
                    </div>
                    <Badge status={t.Status} dark={dark} />
                  </div>
                  {isAdmin && t.Status?.toLowerCase() === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button onClick={() => action(t.TeamID, 'approve')} style={{ flex: 1, padding: '7px', borderRadius: 7, background: `${c.successText}18`, border: `1px solid ${c.successText}40`, color: c.successText, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        <MS icon="check_circle" size={16} />Duyệt
                      </button>
                      <button onClick={() => action(t.TeamID, 'reject')} style={{ flex: 1, padding: '7px', borderRadius: 7, background: `${c.errorText}18`, border: `1px solid ${c.errorText}40`, color: c.errorText, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        <MS icon="cancel" size={16} />Từ chối
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}
