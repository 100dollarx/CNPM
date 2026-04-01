import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens, statusColor } from '../theme'

interface Match { MatchID: number; TournamentID: number; Round: number; MatchOrder: number; Team1Name?: string; Team2Name?: string; Status: string; ScheduledTime?: string; WinnerID?: number; IsBye: boolean }
const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)

const statusLabels: Record<string, string> = { scheduled: 'LỊCH THI', checkinopen: 'CHECK-IN', live: 'LIVE', completed: 'HOÀN THÀNH', walkover: 'WALKOVER' }

export default function MatchesPage() {
  const { token } = useAuth()
  const { dark } = useTheme()
  const c = getTokens(dark)
  const [list, setList] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [tournId, setTournId] = useState<string>('')

  useEffect(() => {
    setLoading(true)
    const url = tournId ? `/api/matches?tournamentId=${tournId}` : '/api/matches'
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(d => setList(d.data ?? []))
      .catch(() => {}).finally(() => setLoading(false))
  }, [token, tournId])

  const grouped = list.reduce((acc, m) => {
    const r = `VÒNG ${m.Round ?? '?'}`
    if (!acc[r]) acc[r] = []
    acc[r].push(m)
    return acc
  }, {} as Record<string, Match[]>)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>

      {/* Header */}
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 24, borderRadius: 2, background: 'linear-gradient(180deg,#EF4444,#F59E0B)' }} />
          <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.4rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>TRẬN ĐẤU</h1>
          {list.length > 0 && <span style={{ padding: '2px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{list.length}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: '0.75rem', color: c.onSurfaceVar, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Giải đấu ID:</label>
          <input value={tournId} onChange={e => setTournId(e.target.value)} placeholder="Nhập ID..." className="nexora-input"
            style={{ background: c.inputBg, border: `1px solid ${c.panelBorder}`, borderRadius: 8, padding: '8px 12px', color: c.onSurface, fontSize: '0.875rem', fontFamily: "'JetBrains Mono',monospace", outline: 'none', width: 120, transition: 'all 0.2s' }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 80, background: 'rgba(22,27,34,0.9)', borderRadius: 14, animation: 'neon-pulse 2s ease-in-out infinite' }} />)}
          </div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: c.onSurfaceVar }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MS icon="sports_esports" size={36} />
            </div>
            <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1rem', letterSpacing: '0.05em' }}>Chưa có trận đấu. Nhập ID giải đấu để xem bracket.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([round, matches]) => (
            <div key={round} style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                <div style={{ width: 2, height: 18, borderRadius: 1, background: 'linear-gradient(180deg,#EF4444,#F59E0B)' }} />
                <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0, fontFamily: "'Rajdhani',sans-serif" }}>{round}</h2>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(239,68,68,0.3),transparent)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {matches.filter(m => !m.IsBye).map(m => {
                  const sc = statusColor(m.Status, dark)
                  const isLive = m.Status?.toLowerCase() === 'live'
                  const isCheckIn = m.Status?.toLowerCase() === 'checkinopen'
                  return (
                    <div key={m.MatchID} className="nexora-card" style={{ background: 'rgba(22,27,34,0.9)', border: `1px solid ${isLive ? 'rgba(239,68,68,0.4)' : 'rgba(45,55,72,0.5)'}`, borderRadius: 14, padding: '1rem 1.5rem', backdropFilter: 'blur(8px)', position: 'relative', overflow: 'hidden', boxShadow: isLive ? '0 0 20px rgba(239,68,68,0.1)' : 'none' }}>
                      {isLive && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#EF4444,#F59E0B,transparent)' }} />}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Match ID */}
                        <span style={{ fontSize: '0.68rem', color: '#2D3748', fontFamily: "'JetBrains Mono',monospace", minWidth: 40 }}>#{String(m.MatchID).padStart(3,'0')}</span>

                        {/* Team 1 */}
                        <div style={{ flex: 1, textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: m.WinnerID ? '#68D391' : c.onSurface, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.03em' }}>
                            {m.Team1Name ?? 'TBD'}
                          </span>
                          {m.WinnerID === undefined && <div style={{ fontSize: '0.65rem', color: c.onSurfaceVar, marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>T1</div>}
                        </div>

                        {/* VS divider */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <div style={{ padding: '5px 12px', borderRadius: 8, background: isLive ? 'rgba(239,68,68,0.15)' : c.surfaceContainer, border: `1px solid ${isLive ? 'rgba(239,68,68,0.4)' : c.panelBorder}`, color: isLive ? '#EF4444' : c.onSurfaceVar, fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em', fontFamily: "'Rajdhani',sans-serif" }}>VS</div>
                        </div>

                        {/* Team 2 */}
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: c.onSurface, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.03em' }}>
                            {m.Team2Name ?? 'TBD'}
                          </span>
                          {m.WinnerID === undefined && <div style={{ fontSize: '0.65rem', color: c.onSurfaceVar, marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>T2</div>}
                        </div>

                        {/* Status */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, minWidth: 100 }}>
                          <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                            {isLive && <span className="live-dot" style={{ width: 6, height: 6 }} />}
                            {isCheckIn && <span className="live-dot" style={{ width: 6, height: 6, background: '#F6AD55', animation: 'live-blink 0.8s ease-in-out infinite' }} />}
                            {statusLabels[m.Status?.toLowerCase()] ?? m.Status}
                          </span>
                          {m.ScheduledTime && <span style={{ fontSize: '0.68rem', color: c.onSurfaceVar, fontFamily: "'JetBrains Mono',monospace" }}>{new Date(m.ScheduledTime).toLocaleString('vi-VN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
