import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens } from '../theme'

interface LeaderboardEntry {
  Rank: number; TeamID: number; TeamName: string
  Wins: number; Losses: number; Points: number; WinRate: string
}

const MS = ({ icon, size = 20, color }: { icon: string; size?: number; color?: string }) => (
  <span style={{ fontSize: size, color, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', verticalAlign: 'middle' }}>{icon}</span>
)

const RANK_COLORS = ['#facc15', '#94a3b8', '#b45309']
const RANK_BG = ['rgba(250,204,21,0.08)', 'rgba(148,163,184,0.06)', 'rgba(180,83,9,0.06)']

export default function LeaderboardPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { dark } = useTheme()
  const { token } = useAuth()
  const c = getTokens(dark)
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tournamentName, setTournamentName] = useState('')

  useEffect(() => {
    if (!id) return
    // Load tournament name
    fetch(`/api/tournaments/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(d => setTournamentName(d.Name ?? `Giải #${id}`)).catch(() => {})
    // Load leaderboard
    setLoading(true)
    fetch(`/api/tournaments/${id}/leaderboard`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(d => setData(d.data ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [id, token])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>

      {/* Header */}
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => nav('/tournaments')} style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#facc15' }}>
          <MS icon="arrow_back" size={19} />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 22, borderRadius: 2, background: 'linear-gradient(180deg,#facc15,#F6AD55)' }} />
            <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.35rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>BẢNG XẾP HẠNG</h1>
            {data.length > 0 && (
              <span style={{ padding: '2px 10px', borderRadius: 999, background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.3)', color: '#facc15', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
                {data.length} đội
              </span>
            )}
          </div>
          <p style={{ margin: '2px 0 0 13px', color: c.onSurfaceVar, fontSize: '0.78rem', fontFamily: "'JetBrains Mono',monospace" }}>
            {tournamentName || `Giải #${id}`} · Single Elimination Standings
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ height: 64, borderRadius: 12, background: dark ? 'rgba(22,27,34,0.9)' : '#F5F5F5', animation: 'neon-pulse 2s ease-in-out infinite' }} />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: c.onSurfaceVar }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MS icon="trophy" size={40} color="#facc15" />
            </div>
            <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1rem', letterSpacing: '0.05em' }}>Chưa có dữ liệu xếp hạng.</p>
            <p style={{ fontSize: '0.8rem', color: c.outline }}>Leaderboard sẽ hiển thị sau khi giải đấu có kết quả trận đấu.</p>
          </div>
        ) : (
          <div style={{ maxWidth: 900, margin: '0 auto', background: c.surfaceCard, borderRadius: 20, border: `1px solid ${c.panelBorder}`, overflow: 'hidden', boxShadow: dark ? '0 10px 40px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)' }}>
            {/* Top 3 podium */}
            {data.length >= 3 && (
              <div style={{ padding: '1.5rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, background: 'linear-gradient(135deg,rgba(250,204,21,0.06),transparent)', display: 'flex', justifyContent: 'center', gap: '2rem', alignItems: 'flex-end' }}>
                {[1, 0, 2].map(i => {
                  const entry = data[i]
                  const heights = [90, 110, 80]
                  return (
                    <div key={i} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <MS icon="military_tech" size={i === 0 ? 36 : 28} color={RANK_COLORS[i]} />
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: i === 0 ? '1rem' : '0.88rem', color: c.onSurface }}>{entry.TeamName}</div>
                      <div style={{ fontSize: '0.72rem', color: RANK_COLORS[i], fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{entry.Points} pts</div>
                      <div style={{ width: i === 0 ? 80 : 64, height: heights[i], background: `linear-gradient(180deg,${RANK_COLORS[i]}30,${RANK_COLORS[i]}10)`, border: `1px solid ${RANK_COLORS[i]}40`, borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 8 }}>
                        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 800, fontSize: '1.4rem', color: RANK_COLORS[i] }}>{i + 1}</span>
                      </div>
                    </div>
                  )
                }).filter(Boolean)}
              </div>
            )}

            {/* Full table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${c.panelBorder}` }}>
                  {['#', 'ĐỘI', 'THẮNG', 'THUA', 'ĐIỂM', 'TỶ LỆ THẮNG'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', fontWeight: 700, color: c.onSurfaceVar, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Rajdhani',sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={row.TeamID}
                    style={{ borderBottom: `1px solid ${c.panelBorder}40`, background: idx < 3 ? RANK_BG[idx] : 'transparent', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = idx < 3 ? RANK_BG[idx] : 'transparent')}>
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: idx < 3 ? RANK_COLORS[idx] : c.onSurfaceVar, fontFamily: "'JetBrains Mono',monospace" }}>
                      {idx < 3 ? <MS icon="military_tech" color={RANK_COLORS[idx]} /> : row.Rank}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: idx < 3 ? `${RANK_COLORS[idx]}15` : c.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${idx < 3 ? RANK_COLORS[idx] + '30' : c.panelBorder}`, color: idx < 3 ? RANK_COLORS[idx] : c.onSurfaceVar, fontFamily: "'Rajdhani',sans-serif", fontWeight: 800, fontSize: '0.9rem' }}>
                        {row.TeamName.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.03em', color: c.onSurface }}>{row.TeamName}</span>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#68D391', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{row.Wins}</td>
                    <td style={{ padding: '16px 20px', color: '#FC8181', fontFamily: "'JetBrains Mono',monospace" }}>{row.Losses}</td>
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: '#A78BFA', fontFamily: "'JetBrains Mono',monospace', fontSize: '1.05rem" }}>{row.Points}</td>
                    <td style={{ padding: '16px 20px', color: c.onSurfaceVar }}>{row.WinRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
