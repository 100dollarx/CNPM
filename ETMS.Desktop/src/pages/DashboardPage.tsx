import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens, statusColor } from '../theme'

interface Stats {
  activeTournaments: number
  registrationTournaments: number
  completedTournaments: number
  totalTournaments: number
  totalTeams: number
  pendingDisputes: number
}

const MS = ({ icon, size = 20 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)

interface StatCardProps { label: string; value: number | string; icon: string; color: string; loading: boolean; gradient?: string }

function StatCard({ label, value, icon, color, loading, gradient }: StatCardProps) {
  const { dark } = useTheme()
  return (
    <div className="nexora-card" style={{
      background: dark ? 'rgba(22,27,34,0.9)' : 'rgba(255,255,255,0.95)',
      border: `1px solid rgba(45,55,72,0.5)`,
      borderRadius: 14, padding: '1.25rem 1.5rem',
      backdropFilter: 'blur(8px)', position: 'relative', overflow: 'hidden',
    }}>
      {/* Top glow line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: gradient ?? `linear-gradient(90deg,${color},transparent)`, borderRadius: '14px 14px 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ color: dark ? '#8B9AB5' : '#475569', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}18`, border: `1px solid ${color}30` }}>
          <span style={{ fontSize: 18, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", color, lineHeight: 1 }}>{icon}</span>
        </div>
      </div>
      {loading
        ? <div style={{ height: 36, width: 64, background: dark ? 'rgba(45,55,72,0.5)' : '#E2E8F0', borderRadius: 6, animation: 'neon-pulse 2s ease-in-out infinite' }} />
        : <span style={{ fontSize: '2.2rem', fontWeight: 700, color, lineHeight: 1, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '-0.02em' }}>{value}</span>
      }
    </div>
  )
}

export default function DashboardPage() {
  const { user, token, isAdmin } = useAuth()
  const { dark } = useTheme()
  const c = getTokens(dark)
  const nav = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/overview/stats', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(setStats).catch(() => {}).finally(() => setLoading(false))
  }, [token])

  const statCards = [
    { label: 'Giải đang diễn ra', value: stats?.activeTournaments ?? 0,        icon: 'emoji_events',    color: '#68D391', gradient: 'linear-gradient(90deg,#68D391,#10B981,transparent)' },
    { label: 'Đang nhận đăng ký',  value: stats?.registrationTournaments ?? 0, icon: 'how_to_reg',      color: '#F6AD55', gradient: 'linear-gradient(90deg,#F6AD55,#D97706,transparent)' },
    { label: 'Tổng giải đấu',       value: stats?.totalTournaments ?? 0,       icon: 'workspace_premium',color: '#A78BFA', gradient: 'linear-gradient(90deg,#A78BFA,#7C3AED,transparent)' },
    { label: 'Tổng đội tham dự',    value: stats?.totalTeams ?? 0,             icon: 'groups',           color: '#63B3ED', gradient: 'linear-gradient(90deg,#63B3ED,#2563EB,transparent)' },
    { label: 'Khiếu nại chờ xử lý', value: stats?.pendingDisputes ?? 0,       icon: 'gavel',            color: '#FC8181', gradient: 'linear-gradient(90deg,#FC8181,#DC2626,transparent)' },
    { label: 'Giải đã hoàn thành',  value: stats?.completedTournaments ?? 0,   icon: 'verified',         color: '#8B9AB5', gradient: 'linear-gradient(90deg,#8B9AB5,#475569,transparent)' },
  ]

  const quickActions = [
    { label: 'Tạo giải đấu', icon: 'add_circle',      to: '/tournaments', color: '#A78BFA' },
    { label: 'Duyệt đội',    icon: 'how_to_reg',      to: '/teams',       color: '#F6AD55' },
    { label: 'Xem khiếu nại',icon: 'gavel',           to: '/disputes',    color: '#FC8181' },
    { label: 'Quản lý User', icon: 'manage_accounts', to: '/users',       color: '#63B3ED', adminOnly: true },
  ]

  const roleStyle = statusColor(user?.Role ?? '', dark)

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '2rem', background: c.surface, color: c.onSurface }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 3, height: 28, borderRadius: 2, background: 'linear-gradient(180deg,#7C3AED,#06B6D4)' }} />
            <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.8rem', fontWeight: 700, margin: 0, letterSpacing: '0.02em' }}>
              Xin chào, <span style={{ background: 'linear-gradient(135deg,#A78BFA,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.FullName}</span> 👋
            </h1>
          </div>
          <p style={{ color: c.onSurfaceVar, margin: '0 0 0 13px', fontSize: '0.875rem' }}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <span style={{ padding: '5px 14px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: roleStyle.bg, color: roleStyle.text, border: `1px solid ${roleStyle.border}`, fontFamily: "'JetBrains Mono',monospace" }}>
          {user?.Role}
        </span>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {statCards.map(s => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} loading={loading} gradient={s.gradient} />
        ))}
      </div>

      {/* Quick Actions */}
      {isAdmin && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '0.72rem', fontWeight: 700, color: c.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 16, height: 2, background: '#7C3AED', borderRadius: 1, display: 'inline-block' }} />
            Thao Tác Nhanh
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {quickActions.filter(a => !a.adminOnly || isAdmin).map(a => (
              <button key={a.label} onClick={() => nav(a.to)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 1.25rem', borderRadius: 10, border: `1px solid ${a.color}30`, background: `${a.color}0f`, color: a.color, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${a.color}20`; e.currentTarget.style.borderColor = `${a.color}60`; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = `${a.color}0f`; e.currentTarget.style.borderColor = `${a.color}30`; e.currentTarget.style.transform = 'translateY(0)' }}>
                <MS icon={a.icon} size={17} />{a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Platform status */}
      <div style={{ background: dark ? 'rgba(124,58,237,0.07)' : 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: '1.25rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#7C3AED,#06B6D4,transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div className="live-dot" />
          <h3 style={{ fontFamily: "'Rajdhani',sans-serif", margin: 0, color: '#A78BFA', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.05em' }}>NEXORA PLATFORM — ONLINE</h3>
        </div>
        <p style={{ margin: 0, color: c.onSurfaceVar, fontSize: '0.82rem', lineHeight: 1.7, fontFamily: "'JetBrains Mono',monospace" }}>
          Backend API: <span style={{ color: '#68D391' }}>✓ 38 endpoints sẵn sàng</span> — Auth · Tournament · Team · Match · Result · Dispute · Notification · User · Audit
        </p>
      </div>
    </div>
  )
}
