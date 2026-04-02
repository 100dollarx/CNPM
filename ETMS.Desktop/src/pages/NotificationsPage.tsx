import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens } from '../theme'

interface Notification { NotificationID: number; Title?: string; Message: string; IsRead: boolean; CreatedAt?: string; Type?: string }
const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)

const typeConfig: Record<string, { icon: string; color: string }> = {
  system:    { icon: 'info',           color: '#63B3ED' },
  match:     { icon: 'sports_esports', color: '#EF4444' },
  dispute:   { icon: 'gavel',          color: '#F6AD55' },
  team:      { icon: 'groups',         color: '#06B6D4' },
  result:    { icon: 'emoji_events',   color: '#68D391' },
  default:   { icon: 'notifications',  color: '#A78BFA' },
}

export default function NotificationsPage() {
  const { token, user } = useAuth()
  const { dark } = useTheme()
  const c = getTokens(dark)
  const [list, setList] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch(`/api/notifications?userId=${user?.UserID ?? 0}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(d => setList(d.data ?? []))
      .catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [token])

  const markRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', headers: token ? { Authorization: `Bearer ${token}` } : {} })
    setList(l => l.map(n => n.NotificationID === id ? { ...n, IsRead: true } : n))
  }

  const markAllRead = async () => {
    await fetch(`/api/notifications/read-all?rawUserId=${user?.UserID ?? 0}`, { method: 'PATCH', headers: token ? { Authorization: `Bearer ${token}` } : {} })
    setList(l => l.map(n => ({ ...n, IsRead: true })))
  }

  const unreadCount = list.filter(n => !n.IsRead).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>

      {/* Header */}
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 24, borderRadius: 2, background: 'linear-gradient(180deg,#A78BFA,#06B6D4)' }} />
          <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.4rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>THÔNG BÁO</h1>
          {unreadCount > 0 && (
            <span style={{ padding: '2px 10px', borderRadius: 999, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.4)', color: '#A78BFA', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", animation: 'glow-pulse 2s ease-in-out infinite' }}>
              {unreadCount} chưa đọc
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', color: '#A78BFA', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em', transition: 'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(167,139,250,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(167,139,250,0.1)')}>
            <MS icon="done_all" size={16} />ĐỌC TẤT CẢ
          </button>
        )}
      </div>

      {/* Notifications */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {loading ? (
          [1,2,3,4].map(i => <div key={i} style={{ height: 76, background: 'rgba(22,27,34,0.9)', borderRadius: 12, animation: 'neon-pulse 2s ease-in-out infinite' }} />)
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: c.onSurfaceVar }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MS icon="notifications_none" size={36} />
            </div>
            <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1rem', letterSpacing: '0.05em' }}>Không có thông báo nào.</p>
          </div>
        ) : list.map(n => {
          const tc = typeConfig[n.Type?.toLowerCase() ?? 'default'] ?? typeConfig.default
          return (
            <div key={n.NotificationID} onClick={() => !n.IsRead && markRead(n.NotificationID)}
              style={{ background: n.IsRead ? c.surfaceContainer : c.surfaceCard, border: `1px solid ${n.IsRead ? c.panelBorder : 'rgba(167,139,250,0.25)'}`, borderLeft: `3px solid ${n.IsRead ? c.panelBorder : '#A78BFA'}`, borderRadius: 12, padding: '0.9rem 1.25rem', cursor: n.IsRead ? 'default' : 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12, transition: 'all 0.2s', opacity: n.IsRead ? 0.7 : 1 }}>

              {/* Icon */}
              <div style={{ width: 36, height: 36, borderRadius: 9, background: `${tc.color}15`, border: `1px solid ${tc.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 18, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", color: tc.color, lineHeight: 1 }}>{tc.icon}</span>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {n.Title && <p style={{ fontWeight: 700, fontSize: '0.875rem', margin: '0 0 3px', color: c.onSurface, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.02em' }}>{n.Title}</p>}
                <p style={{ margin: 0, fontSize: '0.82rem', color: c.onSurfaceVar, lineHeight: 1.55 }}>{n.Message}</p>
                {n.CreatedAt && <span style={{ fontSize: '0.68rem', color: c.outline, display: 'block', marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>{new Date(n.CreatedAt).toLocaleString('vi-VN')}</span>}
              </div>

              {!n.IsRead && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#A78BFA', boxShadow: '0 0 8px rgba(167,139,250,0.6)' }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
