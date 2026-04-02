import { useParams, useNavigate } from 'react-router'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { getTokens } from '../theme'
import { useState, useEffect } from 'react'

interface Match {
  MatchID: number; Round: number; MatchOrder: number
  Team1Name?: string; Team2Name?: string; Team1ID?: number; Team2ID?: number
  WinnerID?: number; Status: string; IsBye: boolean; NextMatchID?: number
}

const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)

function MatchCard({ m, dark, c }: { m: Match; dark: boolean; c: ReturnType<typeof getTokens> }) {
  const isWalkover = m.IsBye || m.Status?.toLowerCase() === 'walkover'
  const isDone = m.Status?.toLowerCase() === 'completed' || isWalkover
  const isLive = m.Status?.toLowerCase() === 'live'

  const teamStyle = (teamId?: number): React.CSSProperties => ({
    flex: 1, padding: '8px 12px', borderRadius: 8,
    background: isDone && m.WinnerID === teamId
      ? (dark ? 'rgba(104,211,145,0.12)' : 'rgba(104,211,145,0.15)')
      : 'transparent',
    borderLeft: isDone && m.WinnerID === teamId ? '2px solid #68D391' : '2px solid transparent',
    transition: 'all 0.2s',
  })

  return (
    <div style={{
      width: 200, background: dark ? 'rgba(22,27,34,0.95)' : 'rgba(255,255,255,0.95)',
      border: `1px solid ${isLive ? 'rgba(239,68,68,0.5)' : c.panelBorder}`,
      borderRadius: 12, overflow: 'hidden', flexShrink: 0,
      boxShadow: isLive ? '0 0 16px rgba(239,68,68,0.15)' : 'none',
      position: 'relative',
    }}>
      {isLive && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#EF4444,#F59E0B)' }} />}

      {/* Team 1 */}
      <div style={{ ...teamStyle(m.Team1ID), display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${c.panelBorder}` }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isDone && m.WinnerID === m.Team1ID ? '#68D391' : c.onSurface, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {m.Team1Name ?? (isWalkover ? 'BYE' : 'TBD')}
        </span>
        {isDone && m.WinnerID === m.Team1ID && <MS icon="emoji_events" size={14} />}
      </div>

      {/* Team 2 */}
      <div style={{ ...teamStyle(m.Team2ID), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isDone && m.WinnerID === m.Team2ID ? '#68D391' : c.onSurface, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {m.Team2Name ?? (isWalkover ? 'BYE' : 'TBD')}
        </span>
        {isDone && m.WinnerID === m.Team2ID && <MS icon="emoji_events" size={14} />}
      </div>

      {/* Status footer */}
      <div style={{ padding: '4px 12px', background: dark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', textAlign: 'center', borderTop: `1px solid ${c.panelBorder}` }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', fontFamily: "'JetBrains Mono',monospace", color: isLive ? '#EF4444' : c.outline }}>
          {isLive && <span className="live-dot" style={{ marginRight: 4 }} />}
          #{String(m.MatchID).padStart(3, '0')} · {isWalkover ? 'WALKOVER' : m.Status?.toUpperCase()}
        </span>
      </div>
    </div>
  )
}

export default function BracketViewPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { dark } = useTheme()
  const { token } = useAuth()
  const c = getTokens(dark)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true); setError('')
    fetch(`/api/tournaments/${id}/bracket`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(d => {
        if (d.data) setMatches(d.data)
        else setError('Không có dữ liệu bracket.')
      })
      .catch(() => setError('Không thể kết nối máy chủ.'))
      .finally(() => setLoading(false))
  }, [id, token])

  // Group by round
  const rounds = matches.reduce((acc, m) => {
    const r = m.Round ?? 1
    if (!acc[r]) acc[r] = []
    acc[r].push(m)
    return acc
  }, {} as Record<number, Match[]>)

  const sortedRounds = Object.keys(rounds).map(Number).sort((a, b) => a - b)
  const totalRounds = sortedRounds.length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>

      {/* Header */}
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <button onClick={() => nav('/tournaments')} style={{ background: 'rgba(124,58,237,0.08)', border: `1px solid rgba(124,58,237,0.2)`, borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#A78BFA', transition: 'all 0.2s', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.08)'}>
          <MS icon="arrow_back" size={19} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 22, borderRadius: 2, background: 'linear-gradient(180deg,#A78BFA,#E94560)' }} />
            <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.35rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>
              SƠ ĐỒ THI ĐẤU
            </h1>
            <span style={{ padding: '2px 10px', borderRadius: 999, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
              Giải #{id}
            </span>
          </div>
          <p style={{ margin: '2px 0 0 13px', color: c.onSurfaceVar, fontSize: '0.78rem', fontFamily: "'JetBrains Mono',monospace" }}>
            Single Elimination · {totalRounds} vòng · {matches.filter(m => !m.IsBye).length} trận
          </p>
        </div>
      </div>

      {/* Bracket area */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: '2rem' }}>
        {loading ? (
          <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
            {[1, 2, 3].map(r => (
              <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {[1, 2, 3, 4].slice(0, 4 / r).map(i => (
                  <div key={i} style={{ width: 200, height: 90, borderRadius: 12, background: dark ? 'rgba(22,27,34,0.9)' : '#F0F0F5', animation: 'neon-pulse 2s ease-in-out infinite' }} />
                ))}
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: c.onSurfaceVar }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(252,129,129,0.08)', border: '1px solid rgba(252,129,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MS icon="bracket" size={36} />
            </div>
            <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1rem', letterSpacing: '0.05em' }}>{error}</p>
            <p style={{ fontSize: '0.8rem', color: c.outline }}>Kiểm tra bracket đã được tạo chưa tại trang Giải Đấu.</p>
          </div>
        ) : matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: c.onSurfaceVar }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MS icon="account_tree" size={36} />
            </div>
            <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1rem', letterSpacing: '0.05em' }}>Bracket chưa được tạo.</p>
            <p style={{ fontSize: '0.8rem', color: c.outline }}>Vui lòng tạo bracket từ trang Giải Đấu (trạng thái Registration).</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', minWidth: 'max-content', paddingBottom: '1rem' }}>
            {sortedRounds.map((roundNum, roundIdx) => {
              const roundMatches = [...(rounds[roundNum] ?? [])].filter(m => !m.IsBye).sort((a, b) => a.MatchOrder - b.MatchOrder)
              const totalMatchesInRound = roundMatches.length
              const isLastRound = roundIdx === sortedRounds.length - 1

              return (
                <div key={roundNum} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {/* Round header */}
                  <div style={{ marginBottom: 16, textAlign: 'center' }}>
                    <span style={{ padding: '3px 14px', borderRadius: 999, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: '#A78BFA', fontSize: '0.7rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {isLastRound ? '🏆 CHUNG KẾT' : `VÒNG ${roundNum}`}
                    </span>
                  </div>

                  {/* Match cards, evenly spaced */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1, gap: '1.5rem' }}>
                    {roundMatches.map(m => (
                      <div key={m.MatchID} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MatchCard m={m} dark={dark} c={c} />
                        {/* Connector line */}
                        {!isLastRound && (
                          <div style={{ width: 24, height: 2, background: `linear-gradient(90deg,${c.panelBorder},rgba(124,58,237,0.3))`, borderRadius: 1 }} />
                        )}
                      </div>
                    ))}
                    {totalMatchesInRound === 0 && (
                      <div style={{ width: 200, height: 80, borderRadius: 12, border: `1px dashed ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.outline, fontSize: '0.75rem' }}>TBD</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
