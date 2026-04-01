import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens } from '../theme'

interface Notification { NotificationID: number; Title?: string; Message: string; IsRead: boolean; CreatedAt?: string }
const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none' }}>{icon}</span>
)

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
    await fetch(`/api/notifications/read-all?userId=${user?.UserID ?? 0}`, { method: 'PATCH', headers: token ? { Authorization: `Bearer ${token}` } : {} })
    setList(l => l.map(n => ({ ...n, IsRead: true })))
  }

  const unreadCount = list.filter(n => !n.IsRead).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>🔔 Thông báo</h1>
          {unreadCount > 0 && <span style={{ padding: '2px 9px', borderRadius: 999, background: c.primary, color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>{unreadCount}</span>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${c.panelBorder}`, color: c.onSurfaceVar, cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }}>
            <MS icon="done_all" size={16} />Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {loading ? [1,2,3,4].map(i => <div key={i} style={{ height: 70, background: c.surfaceCard, borderRadius: 10 }} />)
          : list.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: c.onSurfaceVar }}>
              <MS icon="notifications_none" size={52} />
              <p style={{ marginTop: 12 }}>Không có thông báo nào.</p>
            </div>
          ) : list.map(n => (
            <div key={n.NotificationID} onClick={() => !n.IsRead && markRead(n.NotificationID)}
              style={{ background: n.IsRead ? c.surfaceCard : (dark ? 'rgba(233,69,96,0.07)' : 'rgba(233,69,96,0.05)'), border: `1px solid ${n.IsRead ? c.panelBorder : c.primary + '40'}`, borderRadius: 10, padding: '1rem 1.25rem', cursor: n.IsRead ? 'default' : 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12, transition: 'background 0.2s' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.IsRead ? 'transparent' : c.primary, marginTop: 6, flexShrink: 0, boxShadow: n.IsRead ? 'none' : `0 0 8px ${c.primary}` }} />
              <div style={{ flex: 1 }}>
                {n.Title && <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: '0 0 4px', color: c.onSurface }}>{n.Title}</p>}
                <p style={{ margin: 0, fontSize: '0.85rem', color: c.onSurfaceVar, lineHeight: 1.55 }}>{n.Message}</p>
                {n.CreatedAt && <span style={{ fontSize: '0.72rem', color: c.outline, display: 'block', marginTop: 4 }}>{new Date(n.CreatedAt).toLocaleString('vi-VN')}</span>}
              </div>
              {!n.IsRead && <MS icon="mark_email_read" size={18} />}
            </div>
          ))}
      </div>
    </div>
  )
}
