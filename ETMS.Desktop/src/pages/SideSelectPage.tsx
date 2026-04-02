import { useParams, useNavigate } from 'react-router'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { getTokens } from '../theme'
import { useState, useEffect } from 'react'

interface MatchDetail {
  MatchID: number; Round: number; Status: string
  Team1ID?: number; Team1Name?: string
  Team2ID?: number; Team2Name?: string
  GameType?: string
}

const MS = ({ icon, size = 20, color }: { icon: string; size?: number; color?: string }) => (
  <span style={{ fontSize: size, color, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', verticalAlign: 'middle' }}>{icon}</span>
)

export default function SideSelectPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { dark } = useTheme()
  const { token, user } = useAuth()
  const toast = useToast()
  const c = getTokens(dark)
  const [side, setSide] = useState<'Blue' | 'Red' | null>(null)
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

  const handleConfirm = async () => {
    if (!side || !match) return
    setSubmitting(true)
    try {
      const r = await fetch(`/api/matches/${id}/side-select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ Side: side, TeamID: 0 })
      })
      const d = await r.json()
      if (r.ok) {
        toast.success(`Đã chọn phe ${side === 'Blue' ? 'BLUE SIDE' : 'RED SIDE'} thành công!`)
        nav('/matches')
      } else {
        toast.error(d.error ?? 'Không thể chọn phe.')
      }
    } catch {
      toast.error('Không thể kết nối máy chủ.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.surface }}>
        <div style={{ width: 48, height: 48, border: `3px solid ${c.panelBorder}`, borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      {/* Header */}
      <div style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: 16, borderBottom: `1px solid ${c.panelBorder}`, background: dark ? 'rgba(28,32,38,0.5)' : 'rgba(243,243,247,0.5)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => nav('/matches')} style={{ background: c.surfaceContainer, border: `1px solid ${c.panelBorder}`, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c.onSurfaceVar }}>
          <MS icon="arrow_back" />
        </button>
        <div>
          <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>
            CHỌN PHE (MOBA)
          </h1>
          <p style={{ margin: '4px 0 0', color: c.onSurfaceVar, fontSize: '0.875rem', fontFamily: "'JetBrains Mono',monospace" }}>
            Match #{id} · {match?.Team1Name ?? 'TBD'} vs {match?.Team2Name ?? 'TBD'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '2rem' }}>
        <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.8rem', fontWeight: 700, margin: 0, textAlign: 'center', letterSpacing: '0.05em' }}>
          BẠN CHỌN PHE NÀO?
        </h2>
        <p style={{ color: c.onSurfaceVar, margin: 0, fontSize: '0.875rem', textAlign: 'center' }}>
          Đội thắng coin toss chọn phe trước trận đấu
        </p>

        <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Blue Side */}
          <div onClick={() => setSide('Blue')}
            style={{ width: 280, height: 320, borderRadius: 24, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: side === 'Blue' ? 'rgba(56,189,248,0.15)' : c.surfaceCard, border: `2px solid ${side === 'Blue' ? '#38bdf8' : c.panelBorder}`, transition: 'all 0.3s', boxShadow: side === 'Blue' ? '0 0 40px rgba(56,189,248,0.3)' : 'none', transform: side === 'Blue' ? 'translateY(-4px)' : 'none' }}>
            <MS icon="shield" size={80} color="#38bdf8" />
            <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.75rem', color: '#38bdf8', marginTop: 24, fontWeight: 700, letterSpacing: '0.05em' }}>BLUE SIDE</h3>
            <p style={{ color: c.onSurfaceVar, marginTop: 12, textAlign: 'center', fontSize: '0.9rem', margin: '12px 0 0' }}>First Pick Priority</p>
            {side === 'Blue' && <div style={{ marginTop: 16, padding: '4px 14px', borderRadius: 999, background: 'rgba(56,189,248,0.2)', border: '1px solid #38bdf8', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif" }}>ĐÃ CHỌN ✓</div>}
          </div>

          {/* Red Side */}
          <div onClick={() => setSide('Red')}
            style={{ width: 280, height: 320, borderRadius: 24, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: side === 'Red' ? 'rgba(239,68,68,0.15)' : c.surfaceCard, border: `2px solid ${side === 'Red' ? '#ef4444' : c.panelBorder}`, transition: 'all 0.3s', boxShadow: side === 'Red' ? '0 0 40px rgba(239,68,68,0.3)' : 'none', transform: side === 'Red' ? 'translateY(-4px)' : 'none' }}>
            <MS icon="local_fire_department" size={80} color="#ef4444" />
            <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.75rem', color: '#ef4444', marginTop: 24, fontWeight: 700, letterSpacing: '0.05em' }}>RED SIDE</h3>
            <p style={{ color: c.onSurfaceVar, marginTop: 12, textAlign: 'center', fontSize: '0.9rem', margin: '12px 0 0' }}>Last Pick Counter</p>
            {side === 'Red' && <div style={{ marginTop: 16, padding: '4px 14px', borderRadius: 999, background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif" }}>ĐÃ CHỌN ✓</div>}
          </div>
        </div>

        <button
          disabled={!side || submitting}
          onClick={handleConfirm}
          style={{ padding: '16px 64px', borderRadius: 999, background: side ? 'linear-gradient(135deg,#38bdf8,#0ea5e9)' : c.surfaceContainer, color: side ? '#fff' : c.onSurfaceVar, border: 'none', cursor: side && !submitting ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '1.1rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.1em', transition: 'all 0.2s', boxShadow: side ? '0 8px 32px rgba(56,189,248,0.3)' : 'none', opacity: submitting ? 0.7 : 1 }}>
          {submitting ? '⏳ Đang xác nhận...' : side ? `XÁC NHẬN ${side.toUpperCase()} SIDE` : 'CHỌN PHE ĐỂ TIẾP TỤC'}
        </button>
      </div>
    </div>
  )
}
