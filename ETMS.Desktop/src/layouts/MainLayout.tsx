import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useLang } from '../contexts/LangContext'
import { getTokens, NEXORA_GLOBAL_CSS } from '../theme'

const MS = ({ icon, size = 20 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0, 'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)

const NAV_ITEMS = [
  { to: '/dashboard',     icon: 'dashboard',       vi: 'Tổng Quan',    en: 'Overview'     },
  { to: '/tournaments',   icon: 'emoji_events',    vi: 'Giải Đấu',     en: 'Tournaments'  },
  { to: '/teams',         icon: 'groups',          vi: 'Đội Tuyển',    en: 'Teams'        },
  { to: '/matches',       icon: 'sports_esports',  vi: 'Trận Đấu',     en: 'Matches'      },
  { to: '/disputes',      icon: 'gavel',           vi: 'Khiếu Nại',   en: 'Disputes'     },
  { to: '/notifications', icon: 'notifications',   vi: 'Thông Báo',    en: 'Notifications'},
]
const ADMIN_NAV = [
  { to: '/users',     icon: 'manage_accounts', vi: 'Quản Lý User', en: 'Users'     },
  { to: '/audit-log', icon: 'history',         vi: 'Audit Log',    en: 'Audit Log' },
]

export default function MainLayout() {
  const { user, logout, isAdmin } = useAuth()
  const { dark, toggle: toggleTheme } = useTheme()
  const { lang, toggle: toggleLang } = useLang()
  const c = getTokens(dark)
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const W = collapsed ? 64 : 224

  const roleInitial = user?.FullName?.charAt(0)?.toUpperCase() ?? '?'
  const L = (vi: string, en: string) => lang === 'vi' ? vi : en

  return (
    <>
      <style>{NEXORA_GLOBAL_CSS}</style>
      {!dark && (
        <style>{`
          .nexora-nav-link { color: #374151 !important; }
          .nexora-nav-link:hover { background: rgba(201,33,64,0.07) !important; color: #C92140 !important; border-left-color: rgba(201,33,64,0.4) !important; }
          .nexora-nav-link.active { background: rgba(201,33,64,0.12) !important; color: #C92140 !important; border-left-color: #C92140 !important; }
        `}</style>
      )}

      <div style={{ display: 'flex', height: '100vh', background: c.surface, color: c.onSurface, overflow: 'hidden', fontFamily: "'Inter',system-ui,sans-serif" }}>

        {/* ─── SIDEBAR ─── */}
        <aside style={{
          width: W, minWidth: W,
          background: c.surfaceLow,
          borderRight: `1px solid ${c.panelBorder}`,
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden', position: 'relative',
          boxShadow: dark ? '2px 0 16px rgba(0,0,0,0.3)' : '2px 0 12px rgba(0,0,0,0.06)',
        }}>
          {/* Hex grid bg */}
          <div className="hex-grid" style={{ position: 'absolute', inset: 0, opacity: dark ? 0.5 : 0.25, pointerEvents: 'none' }} />

          {/* Logo */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '0.75rem 0' : '0.65rem 1rem',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderBottom: `1px solid ${c.panelBorder}`,
            minHeight: 76, position: 'relative', zIndex: 1,
          }}>
            {/* Logo in a dark pill so gamepad is visible on both light & dark sidebar */}
            <div style={{
              width: collapsed ? 48 : 60, height: collapsed ? 48 : 60,
              borderRadius: 12, flexShrink: 0,
              background: '#0F1623',
              border: '1.5px solid rgba(233,69,96,0.4)',
              boxShadow: '0 0 12px rgba(233,69,96,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'width 0.2s, height 0.2s',
            }}>
              <img
                src="/logo.png" alt="NEXORA"
                style={{
                  width: collapsed ? 36 : 48, height: collapsed ? 36 : 48,
                  objectFit: 'contain',
                  transition: 'width 0.2s, height 0.2s',
                }}
              />
            </div>
            {!collapsed && (
              <div>
                <span style={{
                  fontFamily: "'Rajdhani',sans-serif", fontWeight: 800, fontSize: '1.3rem',
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  display: 'block', lineHeight: 1.15,
                  ...(dark ? {
                    background: 'linear-gradient(135deg,#FF5C78,#E94560,#C2185B)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 8px rgba(233,69,96,0.5))',
                  } : {
                    color: '#B91C2A',
                    letterSpacing: '0.16em',
                  })
                }}>NEXORA</span>
                <span style={{
                  fontSize: '0.58rem',
                  color: dark ? '#A8B3CB' : '#64748B',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  fontFamily: "'JetBrains Mono',monospace",
                  fontWeight: dark ? 400 : 600,
                }}>
                  ESPORTS PLATFORM
                </span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '0.5rem 0', overflowY: 'auto', position: 'relative', zIndex: 1 }}>
            {!collapsed && (
              <div style={{ padding: '0.75rem 1rem 0.25rem', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.outline }}>
                {L('MENU CHÍNH', 'MAIN MENU')}
              </div>
            )}
            {NAV_ITEMS.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nexora-nav-link${isActive ? ' active' : ''}`}
                style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
                <MS icon={item.icon} size={19} />
                {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{L(item.vi, item.en)}</span>}
              </NavLink>
            ))}
            {isAdmin && (
              <>
                {!collapsed && (
                  <div style={{ padding: '0.75rem 1rem 0.25rem', marginTop: '0.5rem', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.outline }}>ADMIN</div>
                )}
                {ADMIN_NAV.map(item => (
                  <NavLink key={item.to} to={item.to} className={({ isActive }) => `nexora-nav-link${isActive ? ' active' : ''}`}
                    style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
                    <MS icon={item.icon} size={19} />
                    {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{L(item.vi, item.en)}</span>}
                  </NavLink>
                ))}
              </>
            )}
          </nav>

          {/* Bottom: user card + collapse only */}
          <div style={{ borderTop: `1px solid ${c.panelBorder}`, padding: '0.5rem 0', position: 'relative', zIndex: 1 }}>
            {/* User card */}
            {!collapsed && user && (
              <div style={{ padding: '0.6rem 1rem', margin: '0 6px 4px', borderRadius: 9, background: dark ? 'rgba(233,69,96,0.07)' : 'rgba(201,33,64,0.06)', border: `1px solid ${dark ? 'rgba(233,69,96,0.18)' : 'rgba(201,33,64,0.2)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, background: 'linear-gradient(135deg,#E94560,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{roleInitial}</div>
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: c.onSurface, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.FullName}</p>
                    <p style={{ fontSize: '0.65rem', color: '#E94560', margin: '1px 0 0', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono',monospace" }}>{user.Role}</p>
                  </div>
                </div>
              </div>
            )}
            {/* Collapse btn */}
            <button onClick={() => setCollapsed(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: collapsed ? '0.55rem 0' : '0.55rem 1rem', margin: '0 6px', width: 'calc(100% - 12px)', background: 'transparent', border: 'none', borderRadius: 8, color: c.outline, cursor: 'pointer', fontSize: '0.82rem', justifyContent: collapsed ? 'center' : 'flex-start', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(233,69,96,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <MS icon={collapsed ? 'chevron_right' : 'chevron_left'} size={19} />
              {!collapsed && <span style={{ fontSize: '0.78rem' }}>{L('Thu gọn', 'Collapse')}</span>}
            </button>
          </div>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Top header bar — 3 controls on right */}
          <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6,
            padding: '0 20px', height: 48, flexShrink: 0,
            background: c.surfaceLow, borderBottom: `1px solid ${c.panelBorder}`,
            position: 'relative', zIndex: 50,
          }}>
            {/* Language toggle */}
            <button onClick={toggleLang}
              title={L('Chuyển sang English', 'Switch to Tiếng Việt')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'transparent', border: `1px solid ${c.panelBorder}`, borderRadius: 8, cursor: 'pointer', color: c.onSurfaceVar, fontSize: '0.82rem', transition: 'all 0.15s', fontFamily: "'JetBrains Mono',monospace" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(233,69,96,0.08)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(233,69,96,0.4)'; (e.currentTarget as HTMLButtonElement).style.color = '#E94560' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = c.panelBorder; (e.currentTarget as HTMLButtonElement).style.color = c.onSurfaceVar }}>
              <span style={{ fontWeight: 700, fontSize: '0.72rem', color: '#E94560' }}>{lang.toUpperCase()}</span>
              {!collapsed && <span style={{ fontSize: '0.78rem' }}>{lang === 'vi' ? 'Tiếng Việt' : 'English'}</span>}
            </button>

            {/* Theme toggle */}
            <button onClick={toggleTheme}
              title={dark ? L('Chế độ sáng', 'Light mode') : L('Chế độ tối', 'Dark mode')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'transparent', border: `1px solid ${c.panelBorder}`, borderRadius: 8, cursor: 'pointer', color: c.onSurfaceVar, fontSize: '0.82rem', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(233,69,96,0.08)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(233,69,96,0.4)'; (e.currentTarget as HTMLButtonElement).style.color = '#E94560' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = c.panelBorder; (e.currentTarget as HTMLButtonElement).style.color = c.onSurfaceVar }}>
              <MS icon={dark ? 'light_mode' : 'dark_mode'} size={18} />
              {!collapsed && <span>{dark ? L('Sáng', 'Light') : L('Tối', 'Dark')}</span>}
            </button>

            {/* Logout */}
            <button onClick={() => { logout(); navigate('/login') }}
              title={L('Đăng xuất', 'Logout')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'transparent', border: '1px solid rgba(252,129,129,0.3)', borderRadius: 8, cursor: 'pointer', color: '#FC8181', fontSize: '0.82rem', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(252,129,129,0.08)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(252,129,129,0.6)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(252,129,129,0.3)' }}>
              <MS icon="logout" size={18} />
              {!collapsed && <span>{L('Đăng Xuất', 'Logout')}</span>}
            </button>
          </header>

          {/* Page content */}
          <main style={{ flex: 1, overflow: 'hidden', background: c.surface }}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}
