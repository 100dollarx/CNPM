const PH = ({ title, icon }: { title: string; icon: string }) => (
  <div style={{ padding:'2rem', color:'#f1f5f9', fontFamily:"'Inter',system-ui,sans-serif" }}>
    <h1 style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:'1rem' }}>{icon} {title}</h1>
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', padding:'3rem', textAlign:'center' }}>
      <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>{icon}</div>
      <p style={{ color:'#64748b', margin:0 }}>Module <strong style={{ color:'#E94560' }}>{title}</strong> đang phát triển trong Sprint 2.</p>
    </div>
  </div>
)

export const TournamentsPage   = () => <PH title="Quản lý Giải đấu"   icon="🏆" />
export const TeamsPage         = () => <PH title="Đội thi đấu"          icon="👥" />
export const MatchesPage       = () => <PH title="Quản lý Trận đấu"   icon="⚔️" />
export const DisputesPage      = () => <PH title="Khiếu nại"            icon="⚠️" />
export const NotificationsPage = () => <PH title="Thông báo"            icon="🔔" />
export const UsersPage         = () => <PH title="Quản lý User"         icon="👤" />
export const AuditLogPage      = () => <PH title="Audit Log"             icon="📋" />
