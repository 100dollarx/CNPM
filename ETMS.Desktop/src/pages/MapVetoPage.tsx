import { useParams, useNavigate } from 'react-router'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens } from '../theme'
import { useState } from 'react'

const MS = ({ icon, size = 20, color }: { icon: string; size?: number; color?: string }) => (
  <span style={{ fontSize: size, color, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', verticalAlign: 'middle' }}>{icon}</span>
)

export default function MapVetoPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { dark } = useTheme()
  const c = getTokens(dark)
  const [maps, setMaps] = useState([
    { name: 'Dust II', status: 'available' },
    { name: 'Mirage', status: 'available' },
    { name: 'Inferno', status: 'available' },
    { name: 'Nuke', status: 'banned' },
    { name: 'Overpass', status: 'picked' },
  ])
  const [selectedMap, setSelectedMap] = useState<number | null>(null)

  const handleAction = (status: 'banned' | 'picked') => {
    if (selectedMap === null) return;
    const newMaps = [...maps];
    newMaps[selectedMap].status = status;
    setMaps(newMaps);
    setSelectedMap(null);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      <div style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: 16, borderBottom: `1px solid ${c.panelBorder}`, background: dark ? 'rgba(28,32,38,0.5)' : 'rgba(243,243,247,0.5)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => nav('/matches')} style={{ background: c.surfaceContainer, border: `1px solid ${c.panelBorder}`, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c.onSurfaceVar }}>
          <MS icon="arrow_back" />
        </button>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Veto Bản Đồ (FPS)</h1>
          <p style={{ margin: '4px 0 0', color: c.onSurfaceVar, fontSize: '0.875rem' }}>Match ID: {id} • Lượt của Đội A</p>
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflowY: 'auto' }}>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', width: '100%', maxWidth: 800 }}>
            {maps.map((m, i) => {
               const isBanned = m.status === 'banned'
               const isPicked = m.status === 'picked'
               const isSelected = selectedMap === i
               return (
                 <div key={i} onClick={() => !isBanned && !isPicked && setSelectedMap(i)} style={{ padding: '1.5rem', borderRadius: 16, background: isBanned ? `${c.errorText}15` : isPicked ? `${c.successText}15` : isSelected ? `${c.primary}15` : c.surfaceContainer, border: `2px solid ${isSelected ? c.primary : isBanned ? c.errorText+'40' : isPicked ? c.successText+'40' : c.panelBorder}`, position: 'relative', overflow: 'hidden', textAlign: 'center', cursor: (isBanned || isPicked) ? 'default' : 'pointer', transition: 'all 0.2s', opacity: isBanned ? 0.6 : 1, transform: isSelected ? 'scale(1.02)' : 'scale(1)' }} onMouseEnter={e => !isBanned && !isPicked && !isSelected && (e.currentTarget.style.transform = 'translateY(-4px)')} onMouseLeave={e => !isBanned && !isPicked && !isSelected && (e.currentTarget.style.transform = 'translateY(0) scale(1)')}>
                    {isBanned && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}><MS icon="block" size={48} color={c.errorText} /></div>}
                    <MS icon="map" size={40} color={isPicked ? c.successText : isSelected ? c.primary : c.onSurfaceVar} />
                    <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.1rem', marginTop: 12, color: isPicked ? c.successText : isSelected ? c.primary : c.onSurface }}>{m.name}</h3>
                 </div>
               )
            })}
         </div>
         <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
            <button disabled={selectedMap === null} onClick={() => handleAction('banned')} style={{ padding: '12px 24px', borderRadius: 12, border: `1px solid ${selectedMap === null ? c.panelBorder : c.errorText}`, background: selectedMap === null ? 'transparent' : `${c.errorText}20`, color: selectedMap === null ? c.onSurfaceVar : c.errorText, cursor: selectedMap === null ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s' }}><MS icon="do_not_disturb" /> Ban Map</button>
            <button disabled={selectedMap === null} onClick={() => handleAction('picked')} style={{ padding: '12px 24px', borderRadius: 12, border: `1px solid ${selectedMap === null ? c.panelBorder : c.successText}`, background: selectedMap === null ? 'transparent' : `${c.successText}20`, color: selectedMap === null ? c.onSurfaceVar : c.successText, cursor: selectedMap === null ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s' }}><MS icon="done" /> Pick Map</button>
         </div>
      </div>
    </div>
  )
}
