import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/dashboard',       icon: '⬛', label: 'Tổng quan'      },
  { to: '/tournaments',     icon: '🏆', label: 'Giải đấu'       },
  { to: '/teams',           icon: '👥', label: 'Đội thi đấu'    },
  { to: '/matches',         icon: '⚔️',  label: 'Trận đấu'      },
  { to: '/disputes',        icon: '⚠️',  label: 'Khiếu nại'     },
  { to: '/notifications',   icon: '🔔', label: 'Thông báo'      },
]
const adminNav = [
  { to: '/users',     icon: '👤', label: 'Quản lý User' },
  { to: '/audit-log', icon: '📋', label: 'Audit Log'    },
]

export default function MainLayout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const sideW = collapsed ? 64 : 220

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{ display:'flex', height:'100vh', background:'#060611', fontFamily:"'Inter', system-ui, sans-serif", overflow:'hidden' }}>
      <aside style={{ width:sideW, minWidth:sideW, background:'linear-gradient(180deg,#0d0d1a,#0a0a14)', borderRight:'1px solid rgba(233,69,96,0.12)', display:'flex', flexDirection:'column', transition:'width 0.25s ease', overflow:'hidden' }}>
        <div style={{ padding:collapsed?'1.25rem 0':'1.25rem 1rem', display:'flex', alignItems:'center', gap:'0.6rem', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <img src="/logo.png" alt="logo" style={{ width:'36px', height:'36px', objectFit:'contain', flexShrink:0 }} />
          {!collapsed && <span style={{ fontWeight:800, fontSize:'1rem', fontFamily:"'Space Grotesk',sans-serif", background:'linear-gradient(135deg,#E94560,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>ETMS</span>}
        </div>
        <nav style={{ flex:1, padding:'0.75rem 0', overflowY:'auto' }}>
          {[...navItems,...(isAdmin?adminNav:[])].map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({ display:'flex', alignItems:'center', gap:'0.75rem', padding:collapsed?'0.65rem 0':'0.65rem 1rem', margin:'2px 8px', borderRadius:'8px', textDecoration:'none', justifyContent:collapsed?'center':'flex-start', background:isActive?'rgba(233,69,96,0.12)':'transparent', color:isActive?'#E94560':'#64748b', borderLeft:isActive?'2px solid #E94560':'2px solid transparent', fontSize:'0.85rem', fontWeight:500, transition:'all 0.15s' })}>
              <span style={{ fontSize:'1rem', flexShrink:0 }}>{item.icon}</span>
              {!collapsed && <span style={{ whiteSpace:'nowrap' }}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'0.75rem 0' }}>
          {!collapsed && <div style={{ padding:'0.5rem 1rem', marginBottom:'0.25rem' }}>
            <p style={{ color:'#f1f5f9', fontSize:'0.85rem', fontWeight:600, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.FullName}</p>
            <p style={{ color:'#E94560', fontSize:'0.7rem', margin:'2px 0 0', textTransform:'uppercase', letterSpacing:'0.05em' }}>{user?.Role}</p>
          </div>}
          <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:collapsed?'0.6rem 0':'0.6rem 1rem', margin:'0 8px', width:'calc(100% - 16px)', background:'transparent', border:'none', borderRadius:'8px', color:'#ef4444', cursor:'pointer', fontSize:'0.82rem', justifyContent:collapsed?'center':'flex-start' }}>
            <span style={{ fontSize:'1rem' }}>🚪</span>{!collapsed && 'Đăng xuất'}
          </button>
          <button onClick={() => setCollapsed(p => !p)} style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:collapsed?'0.6rem 0':'0.6rem 1rem', margin:'0 8px', width:'calc(100% - 16px)', background:'transparent', border:'none', borderRadius:'8px', color:'#475569', cursor:'pointer', fontSize:'0.82rem', justifyContent:collapsed?'center':'flex-start' }}>
            <span>{collapsed?'→':'←'}</span>{!collapsed && 'Thu gọn'}
          </button>
        </div>
      </aside>
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}><Outlet /></main>
    </div>
  )
}
