import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens, statusColor } from '../theme'

interface Stats { activeTournaments: number; registrationTournaments: number; completedTournaments: number; totalTournaments: number; totalTeams: number; pendingDisputes: number }

const MS = ({ icon, size = 20 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none' }}>{icon}</span>
)

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
    { label: 'Giải đang diễn ra', value: stats?.activeTournaments ?? 0,        icon: 'emoji_events',  color: c.successText  },
    { label: 'Đang nhận đăng ký',  value: stats?.registrationTournaments ?? 0, icon: 'how_to_reg',    color: c.infoText     },
    { label: 'Tổng giải đấu',      value: stats?.totalTournaments ?? 0,        icon: 'workspace_premium', color: c.primary  },
    { label: 'Tổng đội tham dự',   value: stats?.totalTeams ?? 0,              icon: 'groups',        color: '#a78bfa'      },
    { label: 'Khiếu nại chờ duyệt',value: stats?.pendingDisputes ?? 0,        icon: 'gavel',         color: c.warningText  },
    { label: 'Giải đã hoàn thành', value: stats?.completedTournaments ?? 0,    icon: 'verified',      color: c.onSurfaceVar },
  ]

  const quickActions = [
    { label: 'Tạo giải đấu',     icon: 'add_circle',     to: '/tournaments', color: c.primary       },
    { label: 'Duyệt đội',        icon: 'how_to_reg',     to: '/teams',       color: c.infoText      },
    { label: 'Xem khiếu nại',    icon: 'gavel',          to: '/disputes',    color: c.warningText   },
    { label: 'Quản lý User',     icon: 'manage_accounts',to: '/users',       color: '#a78bfa', adminOnly: true },
  ]

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '1.75rem 2rem', background: c.surface, color: c.onSurface }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Xin chào, {user?.FullName} 👋
          </h1>
          <p style={{ color: c.onSurfaceVar, margin: '6px 0 0', fontSize: '0.875rem' }}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <span style={{ padding: '4px 14px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', ...statusColor(user?.Role ?? '', dark) }}>{user?.Role}</span>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: c.surfaceCard, border: `1px solid ${c.panelBorder}`, borderRadius: 14, padding: '1.25rem 1.5rem', backdropFilter: 'blur(8px)', transition: 'border-color 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ color: c.onSurfaceVar, fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
              <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${s.color}18` }}>
                <MS icon={s.icon} size={20} />
              </div>
            </div>
            {loading
              ? <div style={{ height: 36, width: 60, background: c.surfaceContainer, borderRadius: 6 }} />
              : <span style={{ fontSize: '2.25rem', fontWeight: 700, color: s.color, lineHeight: 1, fontFamily: "'Space Grotesk',sans-serif" }}>{s.value}</span>
            }
          </div>
        ))}
      </div>

      {/* Quick Actions — Admin only */}
      {isAdmin && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: c.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Thao tác nhanh</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {quickActions.filter(a => !a.adminOnly || isAdmin).map(a => (
              <button key={a.label} onClick={() => nav(a.to)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 1.25rem', borderRadius: 10, border: `1px solid ${a.color}40`, background: `${a.color}14`, color: a.color, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = `${a.color}22`)}
                onMouseLeave={e => (e.currentTarget.style.background = `${a.color}14`)}>
                <MS icon={a.icon} size={18} />{a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sprint status */}
      <div style={{ background: dark ? 'rgba(233,69,96,0.07)' : 'rgba(233,69,96,0.05)', border: `1px solid ${c.primary}30`, borderRadius: 12, padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <MS icon="rocket_launch" size={18} />
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", margin: 0, color: c.primary, fontSize: '0.9rem', fontWeight: 700 }}>Sprint 1 hoàn thành ✓</h3>
        </div>
        <p style={{ margin: 0, color: c.onSurfaceVar, fontSize: '0.82rem', lineHeight: 1.65 }}>
          Backend API sẵn sàng với <strong style={{ color: c.onSurface }}>38 endpoints</strong> — Auth, Tournament, Team, Match, Result, Dispute, Notification, User, Audit.
          Sprint 2 đang triển khai giao diện đầy đủ.
        </p>
      </div>
    </div>
  )
}
