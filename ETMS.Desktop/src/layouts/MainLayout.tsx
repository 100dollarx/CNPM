import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens } from '../theme'

const NAV = [
  { to: '/dashboard',       icon: 'dashboard',        label: 'Tổng quan'       },
  { to: '/tournaments',     icon: 'emoji_events',     label: 'Giải đấu'        },
  { to: '/teams',           icon: 'groups',           label: 'Đội thi đấu'     },
  { to: '/matches',         icon: 'sports_esports',   label: 'Trận đấu'        },
  { to: '/disputes',        icon: 'gavel',            label: 'Khiếu nại'       },
  { to: '/notifications',   icon: 'notifications',    label: 'Thông báo'       },
]
const ADMIN_NAV = [
  { to: '/users',     icon: 'manage_accounts', label: 'Quản lý User' },
  { to: '/audit-log', icon: 'history',         label: 'Audit Log'    },
]

const MS = ({ icon, size = 20 }: { icon: string; size?: number }) => (
  <span className="ms" style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0, 'wght' 400", lineHeight: 1, userSelect: 'none' }}>{icon}</span>
)

export default function MainLayout() {
  const { user, logout, isAdmin } = useAuth()
  const { dark, toggle } = useTheme()
  const c = getTokens(dark)
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const W = collapsed ? 64 : 224

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,1&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root{width:100%;height:100%;overflow:hidden;}
      `}</style>
      <div style={{ display: 'flex', height: '100vh', background: c.surface, fontFamily: "'Inter',system-ui,sans-serif", color: c.onSurface, overflow: 'hidden' }}>

        {/* SIDEBAR */}
        <aside style={{ width: W, minWidth: W, background: c.surfaceLow, borderRight: `1px solid ${c.panelBorder}`, display: 'flex', flexDirection: 'column', transition: 'width 0.22s ease', overflow: 'hidden' }}>

          {/* Logo header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '1rem 0' : '1rem 1rem', justifyContent: collapsed ? 'center' : 'flex-start', borderBottom: `1px solid ${c.panelBorder}`, minHeight: 64 }}>
            <img src="/logo.png" alt="logo" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
            {!collapsed && <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: '1.05rem', background: 'linear-gradient(135deg,#E94560,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ETMS</span>}
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '0.5rem 0', overflowY: 'auto' }}>
            {[...NAV, ...(isAdmin ? ADMIN_NAV : [])].map(item => (
              <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '0.6rem 0' : '0.6rem 1rem',
                margin: '2px 6px', borderRadius: 8, textDecoration: 'none',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive ? (dark ? 'rgba(233,69,96,0.14)' : 'rgba(233,69,96,0.08)') : 'transparent',
                color: isActive ? c.primary : c.onSurfaceVar,
                borderLeft: isActive ? `2px solid ${c.primary}` : '2px solid transparent',
                fontSize: '0.84rem', fontWeight: isActive ? 600 : 400, transition: 'all 0.15s',
              })}>
                <MS icon={item.icon} size={20} />
                {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Bottom: user, theme toggle, collapse */}
          <div style={{ borderTop: `1px solid ${c.panelBorder}`, padding: '0.5rem 0' }}>
            {/* Theme toggle */}
            <button onClick={toggle} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '0.55rem 0' : '0.55rem 1rem', margin: '0 6px', width: 'calc(100% - 12px)', background: 'transparent', border: 'none', borderRadius: 8, color: c.onSurfaceVar, cursor: 'pointer', fontSize: '0.84rem', justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <MS icon={dark ? 'light_mode' : 'dark_mode'} size={20} />
              {!collapsed && <span>{dark ? 'Giao diện sáng' : 'Giao diện tối'}</span>}
            </button>
            {/* User info */}
            {!collapsed && user && (
              <div style={{ padding: '0.4rem 1rem', margin: '0 6px' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: c.onSurface, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.FullName}</p>
                <p style={{ fontSize: '0.7rem', color: c.primary, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{user.Role}</p>
              </div>
            )}
            {/* Logout */}
            <button onClick={() => { logout(); navigate('/login') }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '0.55rem 0' : '0.55rem 1rem', margin: '0 6px', width: 'calc(100% - 12px)', background: 'transparent', border: 'none', borderRadius: 8, color: '#ef4444', cursor: 'pointer', fontSize: '0.84rem', justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <MS icon="logout" size={20} />
              {!collapsed && <span>Đăng xuất</span>}
            </button>
            {/* Collapse */}
            <button onClick={() => setCollapsed(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '0.55rem 0' : '0.55rem 1rem', margin: '0 6px', width: 'calc(100% - 12px)', background: 'transparent', border: 'none', borderRadius: 8, color: c.onSurfaceVar, cursor: 'pointer', fontSize: '0.84rem', justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <MS icon={collapsed ? 'chevron_right' : 'chevron_left'} size={20} />
              {!collapsed && <span>Thu gọn</span>}
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: c.surface }}>
          <Outlet />
        </main>
      </div>
    </>
  )
}
