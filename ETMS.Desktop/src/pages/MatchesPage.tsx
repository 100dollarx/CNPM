import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens, statusColor } from '../theme'

interface Match { MatchID: number; TournamentID: number; Round: number; Team1Name?: string; Team2Name?: string; Status: string; ScheduledTime?: string; WinnerTeamID?: number }
const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none' }}>{icon}</span>
)

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
    const r = `Vòng ${m.Round ?? '?'}`
    if (!acc[r]) acc[r] = []
    acc[r].push(m)
    return acc
  }, {} as Record<string, Match[]>)

  const matchStatusColor = (s: string) => statusColor(s, dark)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>⚔️ Quản lý Trận đấu</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: '0.8rem', color: c.onSurfaceVar }}>Lọc theo giải:</label>
          <input value={tournId} onChange={e => setTournId(e.target.value)} placeholder="ID giải đấu" style={{ background: c.inputBg, border: `1px solid ${c.panelBorder}`, borderRadius: 8, padding: '7px 12px', color: c.onSurface, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', width: 120 }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1,2,3].map(i => <div key={i} style={{ height: 80, background: c.surfaceCard, borderRadius: 12 }} />)}</div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: c.onSurfaceVar }}>
            <MS icon="sports_esports" size={52} />
            <p style={{ marginTop: 12 }}>Chưa có trận đấu nào. Nhập ID giải đấu để lọc.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([round, matches]) => (
            <div key={round} style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: c.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MS icon="account_tree" size={16} />{round}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {matches.map(m => {
                  const sc = matchStatusColor(m.Status)
                  return (
                    <div key={m.MatchID} style={{ background: c.surfaceCard, border: `1px solid ${c.panelBorder}`, borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 16, backdropFilter: 'blur(6px)' }}>
                      {/* Team names */}
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: m.WinnerTeamID ? c.successText : c.onSurface, flex: 1, textAlign: 'right' }}>{m.Team1Name ?? `Đội #?`}</span>
                        <div style={{ padding: '4px 10px', borderRadius: 6, background: c.surfaceContainer, color: c.onSurfaceVar, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.1em' }}>VS</div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: c.onSurface, flex: 1 }}>{m.Team2Name ?? `Đội #?`}</span>
                      </div>
                      {/* Status + time */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{m.Status}</span>
                        {m.ScheduledTime && <span style={{ fontSize: '0.72rem', color: c.onSurfaceVar }}>{new Date(m.ScheduledTime).toLocaleString('vi-VN')}</span>}
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
