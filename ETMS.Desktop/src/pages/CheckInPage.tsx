import { useParams, useNavigate } from 'react-router'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens } from '../theme'

const MS = ({ icon, size = 20 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', verticalAlign: 'middle' }}>{icon}</span>
)

export default function CheckInPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { dark } = useTheme()
  const c = getTokens(dark)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      <div style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: 16, borderBottom: `1px solid ${c.panelBorder}`, background: dark ? 'rgba(28,32,38,0.5)' : 'rgba(243,243,247,0.5)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => nav('/matches')} style={{ background: c.surfaceContainer, border: `1px solid ${c.panelBorder}`, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c.onSurfaceVar }}>
          <MS icon="arrow_back" />
        </button>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Check-in Trận đấu</h1>
          <p style={{ margin: '4px 0 0', color: c.onSurfaceVar, fontSize: '0.875rem' }}>Match ID: {id}</p>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: 480, background: c.surfaceCard, backdropFilter: 'blur(24px)', borderRadius: 20, border: `1px solid ${c.panelBorder}`, padding: '2.5rem', textAlign: 'center', boxShadow: dark ? '0 15px 45px rgba(0,0,0,0.4)' : '0 15px 45px rgba(0,0,0,0.08)' }}>
           <div style={{ background: 'linear-gradient(135deg,#E94560 0%,#91002b 100%)', width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 8px 24px rgba(233,69,96,0.3)' }}>
              <MS icon="fact_check" size={36} />
           </div>
           <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.5rem', fontWeight: 700, margin: '0 0 1rem' }}>Đội trưởng xác nhận</h2>
           <p style={{ color: c.onSurfaceVar, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>Vui lòng xác nhận 5 thành viên của đội đã sẵn sàng tham gia trận đấu này.</p>
           <button onClick={() => { alert('Xác nhận Check-in thành công!'); nav('/matches'); }} style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,#E94560,#91002b)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
             <MS icon="done_all" /> Xác nhận Check-in
           </button>
        </div>
      </div>
    </div>
  )
}
