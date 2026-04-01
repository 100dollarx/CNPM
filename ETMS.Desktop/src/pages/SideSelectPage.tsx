import { useParams, useNavigate } from 'react-router'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens } from '../theme'
import { useState } from 'react'

const MS = ({ icon, size = 20, color }: { icon: string; size?: number; color?: string }) => (
  <span style={{ fontSize: size, color, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', verticalAlign: 'middle' }}>{icon}</span>
)

export default function SideSelectPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { dark } = useTheme()
  const c = getTokens(dark)
  const [side, setSide] = useState<'blue'|'red'|null>(null)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      <div style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: 16, borderBottom: `1px solid ${c.panelBorder}`, background: dark ? 'rgba(28,32,38,0.5)' : 'rgba(243,243,247,0.5)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => nav('/matches')} style={{ background: c.surfaceContainer, border: `1px solid ${c.panelBorder}`, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c.onSurfaceVar }}>
          <MS icon="arrow_back" />
        </button>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Chọn Phe (MOBA)</h1>
          <p style={{ margin: '4px 0 0', color: c.onSurfaceVar, fontSize: '0.875rem' }}>Match ID: {id} • Lượt của Đội xanh</p>
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', padding: '2rem', justifyContent: 'center' }}>
         <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '2rem', fontWeight: 700, marginBottom: '3rem', color: c.onSurface }}>Bạn chọn phe nào?</h2>
         
         <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div onClick={() => setSide('blue')} style={{ width: 280, height: 320, borderRadius: 24, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: side === 'blue' ? 'rgba(56,189,248,0.15)' : c.surfaceCard, border: `2px solid ${side === 'blue' ? '#38bdf8' : c.panelBorder}`, transition: 'all 0.3s', boxShadow: side === 'blue' ? '0 0 40px rgba(56,189,248,0.3)' : 'none' }}>
               <MS icon="shield" size={80} color="#38bdf8" />
               <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.75rem', color: '#38bdf8', marginTop: 24, fontWeight: 700 }}>BLUE SIDE</h3>
               <p style={{ color: c.onSurfaceVar, marginTop: 12, textAlign: 'center', fontSize: '0.9rem' }}>First Pick</p>
            </div>
            
            <div onClick={() => setSide('red')} style={{ width: 280, height: 320, borderRadius: 24, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: side === 'red' ? 'rgba(239,68,68,0.15)' : c.surfaceCard, border: `2px solid ${side === 'red' ? '#ef4444' : c.panelBorder}`, transition: 'all 0.3s', boxShadow: side === 'red' ? '0 0 40px rgba(239,68,68,0.3)' : 'none' }}>
               <MS icon="local_fire_department" size={80} color="#ef4444" />
               <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.75rem', color: '#ef4444', marginTop: 24, fontWeight: 700 }}>RED SIDE</h3>
               <p style={{ color: c.onSurfaceVar, marginTop: 12, textAlign: 'center', fontSize: '0.9rem' }}>Last Pick Counter</p>
            </div>
         </div>
         
         <button disabled={!side} onClick={() => { alert(`Đã xác nhận chọn phe: ${side?.toUpperCase()}`); nav('/matches'); }} style={{ marginTop: '4rem', padding: '16px 48px', borderRadius: 999, background: side ? 'linear-gradient(135deg,#E94560,#91002b)' : c.surfaceContainer, color: side ? '#fff' : c.onSurfaceVar, border: 'none', cursor: side ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '1.1rem', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: side ? '0 8px 32px rgba(233,69,96,0.3)' : 'none' }}>
            Xác nhận
         </button>
      </div>
    </div>
  )
}
