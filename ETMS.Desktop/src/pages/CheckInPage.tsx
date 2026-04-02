import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { getTokens } from '../theme'

interface MatchDetail {
  MatchID: number; Round: number; Status: string
  Team1ID?: number; Team1Name?: string; CheckIn_Team1: boolean
  Team2ID?: number; Team2Name?: string; CheckIn_Team2: boolean
}

const MS = ({ icon, size = 20 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)

export default function CheckInPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { dark } = useTheme()
  const { token, user, isCaptain, isAdmin } = useAuth()
  const toast = useToast()
  const c = getTokens(dark)
  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/matches/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(d => setMatch(d))
      .catch(() => toast.error('Không thể tải thông tin trận đấu.'))
      .finally(() => setLoading(false))
  }, [id, token])

  const doCheckIn = async (slot: 1 | 2) => {
    setSubmitting(true)
    try {
      const r = await fetch(`/api/matches/${id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ TeamSlot: slot })
      })
      const d = await r.json()
      if (r.ok) {
        toast.success(`Đội ${slot === 1 ? match?.Team1Name : match?.Team2Name} đã check-in thành công!`)
        // Refresh
        const updated = await fetch(`/api/matches/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r2 => r2.json())
        setMatch(updated)
      } else {
        toast.error(d.error ?? 'Check-in thất bại.')
      }
    } catch {
      toast.error('Không thể kết nối máy chủ.')
    } finally {
      setSubmitting(false)
    }
  }

  const bothCheckedIn = match?.CheckIn_Team1 && match?.CheckIn_Team2

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => nav('/matches')} style={{ background: 'rgba(233,69,96,0.08)', border: '1px solid rgba(233,69,96,0.2)', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#E94560' }}>
          <MS icon="arrow_back" size={19} />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 22, borderRadius: 2, background: 'linear-gradient(180deg,#F6AD55,#E94560)' }} />
            <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.35rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>CHECK-IN TRẬN ĐẤU</h1>
            <span style={{ padding: '2px 10px', borderRadius: 999, background: 'rgba(246,173,85,0.12)', border: '1px solid rgba(246,173,85,0.3)', color: '#F6AD55', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
              Match #{id}
            </span>
          </div>
          <p style={{ margin: '2px 0 0 13px', color: c.onSurfaceVar, fontSize: '0.78rem' }}>Vòng {match?.Round ?? '?'} · Cả hai đội phải check-in trước khi trận bắt đầu</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        {loading ? (
          <div style={{ width: 480, height: 300, borderRadius: 20, background: dark ? 'rgba(22,27,34,0.9)' : '#F0F0F5', animation: 'neon-pulse 2s ease-in-out infinite' }} />
        ) : !match ? (
          <div style={{ textAlign: 'center', color: c.onSurfaceVar }}>
            <MS icon="error_outline" size={48} />
            <p style={{ fontFamily: "'Rajdhani',sans-serif", marginTop: 16 }}>Không tìm thấy trận đấu.</p>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 560, background: c.surfaceCard, borderRadius: 20, border: `1px solid ${c.panelBorder}`, padding: '2rem', backdropFilter: 'blur(12px)', boxShadow: dark ? '0 15px 45px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.06)' }}>
            {/* Status banner */}
            {bothCheckedIn && (
              <div style={{ marginBottom: '1.5rem', padding: '12px 18px', borderRadius: 12, background: 'rgba(104,211,145,0.1)', border: '1px solid rgba(104,211,145,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <MS icon="check_circle" size={20} />
                <span style={{ color: '#68D391', fontWeight: 700, fontSize: '0.9rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em' }}>CẢ HAI ĐỘI ĐÃ CHECK-IN — SẴN SÀNG THI ĐẤU!</span>
              </div>
            )}

            {/* Teams grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: '2rem' }}>
              {/* Team 1 */}
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem', borderRadius: 14, background: match.CheckIn_Team1 ? 'rgba(104,211,145,0.08)' : (dark ? 'rgba(22,27,34,0.8)' : 'rgba(0,0,0,0.03)'), border: `1px solid ${match.CheckIn_Team1 ? 'rgba(104,211,145,0.3)' : c.panelBorder}` }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,rgba(233,69,96,0.2),rgba(124,58,237,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '1.5rem', fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, color: '#E94560' }}>
                  {match.Team1Name?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: '0 0 8px', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.03em', color: c.onSurface }}>{match.Team1Name ?? 'TBD'}</p>
                {match.CheckIn_Team1 ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 14px', borderRadius: 999, background: 'rgba(104,211,145,0.15)', border: '1px solid rgba(104,211,145,0.4)', color: '#68D391', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif" }}>
                    <MS icon="check" size={14} /> CHECKED IN
                  </span>
                ) : (isAdmin || isCaptain) ? (
                  <button onClick={() => doCheckIn(1)} disabled={submitting} style={{ padding: '8px 20px', borderRadius: 9, background: 'rgba(246,173,85,0.12)', border: '1px solid rgba(246,173,85,0.3)', color: '#F6AD55', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.06em', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(246,173,85,0.22)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(246,173,85,0.12)'}>
                    CHECK-IN
                  </button>
                ) : (
                  <span style={{ color: c.outline, fontSize: '0.75rem' }}>Chờ check-in...</span>
                )}
              </div>

              {/* VS */}
              <div style={{ textAlign: 'center', padding: '12px 16px', borderRadius: 12, background: dark ? 'rgba(233,69,96,0.08)' : 'rgba(233,69,96,0.06)', border: '1px solid rgba(233,69,96,0.2)' }}>
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#E94560', letterSpacing: '0.06em' }}>VS</span>
              </div>

              {/* Team 2 */}
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem', borderRadius: 14, background: match.CheckIn_Team2 ? 'rgba(104,211,145,0.08)' : (dark ? 'rgba(22,27,34,0.8)' : 'rgba(0,0,0,0.03)'), border: `1px solid ${match.CheckIn_Team2 ? 'rgba(104,211,145,0.3)' : c.panelBorder}` }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,rgba(99,179,237,0.2),rgba(124,58,237,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '1.5rem', fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, color: '#63B3ED' }}>
                  {match.Team2Name?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: '0 0 8px', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.03em', color: c.onSurface }}>{match.Team2Name ?? 'TBD'}</p>
                {match.CheckIn_Team2 ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 14px', borderRadius: 999, background: 'rgba(104,211,145,0.15)', border: '1px solid rgba(104,211,145,0.4)', color: '#68D391', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif" }}>
                    <MS icon="check" size={14} /> CHECKED IN
                  </span>
                ) : (isAdmin || isCaptain) ? (
                  <button onClick={() => doCheckIn(2)} disabled={submitting} style={{ padding: '8px 20px', borderRadius: 9, background: 'rgba(246,173,85,0.12)', border: '1px solid rgba(246,173,85,0.3)', color: '#F6AD55', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.06em', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(246,173,85,0.22)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(246,173,85,0.12)'}>
                    CHECK-IN
                  </button>
                ) : (
                  <span style={{ color: c.outline, fontSize: '0.75rem' }}>Chờ check-in...</span>
                )}
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: c.outline, margin: 0, fontFamily: "'JetBrains Mono',monospace" }}>
              Đăng nhập với tài khoản đội trưởng để thực hiện check-in.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
