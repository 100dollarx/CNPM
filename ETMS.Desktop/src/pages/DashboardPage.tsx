import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface Stats { activeTournaments: number; registrationTournaments: number; totalTournaments: number }
const StatCard = ({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) => (
  <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <span style={{ color:'#64748b', fontSize:'0.8rem', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
      <span style={{ fontSize:'1.4rem' }}>{icon}</span>
    </div>
    <span style={{ fontSize:'2.25rem', fontWeight:700, color, lineHeight:1 }}>{value}</span>
  </div>
)

export default function DashboardPage() {
  const { user, token, isAdmin } = useAuth()
  const [stats, setStats] = useState<Stats|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/overview/stats', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(setStats).catch(() => {}).finally(() => setLoading(false))
  }, [token])

  return (
    <div style={{ padding:'2rem', overflowY:'auto', height:'100%', color:'#f1f5f9', fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ marginBottom:'2rem' }}>
        <h1 style={{ fontSize:'1.6rem', fontWeight:700, margin:0 }}>Xin chào, {user?.FullName} 👋</h1>
        <p style={{ color:'#64748b', margin:'0.4rem 0 0', fontSize:'0.875rem' }}>
          {new Date().toLocaleDateString('vi-VN',{ weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem' }}>
        {loading ? [1,2,3].map(i => <div key={i} style={{ height:'110px', background:'rgba(255,255,255,0.03)', borderRadius:'12px' }} />) : (
          <>
            <StatCard label="Đang diễn ra"  value={stats?.activeTournaments??0}        icon="🏆" color="#10b981" />
            <StatCard label="Đăng ký"        value={stats?.registrationTournaments??0}  icon="📋" color="#3b82f6" />
            <StatCard label="Tổng giải đấu"  value={stats?.totalTournaments??0}         icon="📊" color="#a78bfa" />
          </>
        )}
      </div>
      {isAdmin && (
        <div style={{ marginBottom:'2rem' }}>
          <h2 style={{ fontSize:'1rem', fontWeight:600, color:'#94a3b8', marginBottom:'1rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>Thao tác nhanh</h2>
          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
            {[{label:'+ Tạo giải đấu mới',color:'#E94560'},{label:'📋 Duyệt đội thi đấu',color:'#2563eb'},{label:'⚠️ Xem khiếu nại',color:'#d97706'}].map(a => (
              <button key={a.label} style={{ background:`${a.color}22`,border:`1px solid ${a.color}44`,borderRadius:'8px',padding:'0.6rem 1.1rem',color:'#f1f5f9',fontSize:'0.85rem',cursor:'pointer',fontFamily:'inherit' }}>{a.label}</button>
            ))}
          </div>
        </div>
      )}
      <div style={{ background:'rgba(233,69,96,0.08)', border:'1px solid rgba(233,69,96,0.2)', borderRadius:'12px', padding:'1.25rem 1.5rem' }}>
        <h3 style={{ margin:'0 0 0.5rem', color:'#E94560', fontSize:'0.9rem', fontWeight:600 }}>🚀 Sprint 1 Backend</h3>
        <p style={{ margin:0, color:'#94a3b8', fontSize:'0.82rem', lineHeight:1.6 }}>
          API sẵn sàng với <strong style={{ color:'#f1f5f9' }}>38 endpoints</strong>. Đang triển khai giao diện Sprint 2.
        </p>
      </div>
    </div>
  )
}
