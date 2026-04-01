import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens, statusColor } from '../theme'

interface Team { TeamID: number; Name: string; TournamentID: number; Status: string; PlayerCount?: number; CaptainName?: string }
const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)

const statusLabels: Record<string, string> = { pending: 'CHỜ DUYỆT', approved: 'ĐÃ DUYỆT', rejected: 'TỪ CHỐI' }

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

  const statuses = [['all', 'TẤT CẢ'], ['pending', 'CHỜ DUYỆT'], ['approved', 'ĐÃ DUYỆT'], ['rejected', 'TỪ CHỐI']]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>

      {/* Header */}
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 24, borderRadius: 2, background: 'linear-gradient(180deg,#06B6D4,#7C3AED)' }} />
          <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.4rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>ĐỘI TUYỂN</h1>
          <span style={{ padding: '2px 10px', borderRadius: 999, background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: '#06B6D4', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{filtered.length}</span>
        </div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.onSurfaceVar, pointerEvents: 'none' }}><MS icon="search" /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm đội tuyển..." className="nexora-input"
            style={{ background: c.inputBg, border: `1px solid ${c.panelBorder}`, borderRadius: 9, padding: '9px 14px 9px 36px', color: c.onSurface, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', width: 220, transition: 'all 0.2s' }} />
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
            {[1,2,3,4].map(i => <div key={i} style={{ height: 120, background: 'rgba(22,27,34,0.9)', borderRadius: 14, animation: 'neon-pulse 2s ease-in-out infinite' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: c.onSurfaceVar }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MS icon="groups" size={36} />
            </div>
            <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1rem', letterSpacing: '0.05em' }}>Không có đội tuyển nào.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {filtered.map(t => {
              const sc = statusColor(t.Status, dark)
              const isPending = t.Status?.toLowerCase() === 'pending'
              return (
                <div key={t.TeamID} className="nexora-card" style={{ background: 'rgba(22,27,34,0.9)', border: `1px solid rgba(45,55,72,0.5)`, borderRadius: 14, padding: '1.25rem', backdropFilter: 'blur(8px)', position: 'relative', overflow: 'hidden' }}>
                  {/* Top border */}
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: isPending && isAdmin ? 12 : 0 }}>
                    <span style={{ fontSize: 14, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", color: c.onSurfaceVar }}>group</span>
                    <span style={{ fontSize: '0.78rem', color: c.onSurfaceVar }}>{t.PlayerCount ?? 0} thành viên</span>
                    {t.CaptainName && <><span style={{ color: c.outline }}>·</span><span style={{ fontSize: '0.78rem', color: c.onSurfaceVar }}>Đội trưởng: <span style={{ color: c.onSurface }}>{t.CaptainName}</span></span></>}
                  </div>

                  {isAdmin && isPending && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => action(t.TeamID, 'approve')} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(104,211,145,0.1)', border: '1px solid rgba(104,211,145,0.3)', color: '#68D391', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(104,211,145,0.2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(104,211,145,0.1)')}>
                        <MS icon="check_circle" size={15} />DUYỆT
                      </button>
                      <button onClick={() => action(t.TeamID, 'reject')} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)', color: '#FC8181', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(252,129,129,0.2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(252,129,129,0.1)')}>
                        <MS icon="cancel" size={15} />TỪ CHỐI
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
