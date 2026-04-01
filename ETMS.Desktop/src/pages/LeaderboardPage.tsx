import { useParams, useNavigate } from 'react-router'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens } from '../theme'
import { useState } from 'react'

const MS = ({ icon, size = 20, color }: { icon: string; size?: number; color?: string }) => (
  <span style={{ fontSize: size, color, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', verticalAlign: 'middle' }}>{icon}</span>
)

export default function LeaderboardPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { dark } = useTheme()
  const c = getTokens(dark)
  
  const [data] = useState([
    { rank: 1, name: 'T1', points: 300, kills: 45, wr: '100%' },
    { rank: 2, name: 'Gen.G', points: 280, kills: 38, wr: '80%' },
    { rank: 3, name: 'DK', points: 250, kills: 40, wr: '75%' },
    { rank: 4, name: 'HLE', points: 200, kills: 28, wr: '60%' },
    { rank: 5, name: 'KT', points: 150, kills: 22, wr: '50%' },
  ])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      <div style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: 16, borderBottom: `1px solid ${c.panelBorder}`, background: dark ? 'rgba(28,32,38,0.5)' : 'rgba(243,243,247,0.5)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => nav('/tournaments')} style={{ background: c.surfaceContainer, border: `1px solid ${c.panelBorder}`, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c.onSurfaceVar }}>
          <MS icon="arrow_back" />
        </button>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Bảng xếp hạng (Leaderboard)</h1>
          <p style={{ margin: '4px 0 0', color: c.onSurfaceVar, fontSize: '0.875rem' }}>Giải đấu ID: {id} • Giai đoạn: Vòng Bảng</p>
        </div>
      </div>
      
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
         <div style={{ maxWidth: 1000, margin: '0 auto', background: c.surfaceCard, backdropFilter: 'blur(16px)', borderRadius: 20, border: `1px solid ${c.panelBorder}`, overflow: 'hidden', boxShadow: dark ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 40px rgba(0,0,0,0.05)' }}>
            
            <div style={{ padding: '2rem', textAlign: 'center', borderBottom: `1px solid ${c.panelBorder}`, background: `linear-gradient(135deg, ${c.surfaceCard}, ${c.surfaceContainer})` }}>
               <MS icon="trophy" size={56} color="#facc15" />
               <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.75rem', fontWeight: 700, marginTop: 16, color: c.onSurface }}>Xếp hạng hiện tại</h2>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                  <tr style={{ background: c.surfaceContainer, borderBottom: `1px solid ${c.panelBorder}` }}>
                     <th style={{ padding: '16px 24px', fontWeight: 700, color: c.onSurfaceVar, fontSize: '0.875rem', textTransform: 'uppercase', width: 80 }}>#</th>
                     <th style={{ padding: '16px 24px', fontWeight: 700, color: c.onSurfaceVar, fontSize: '0.875rem', textTransform: 'uppercase' }}>Tên Đội</th>
                     <th style={{ padding: '16px 24px', fontWeight: 700, color: c.onSurfaceVar, fontSize: '0.875rem', textTransform: 'uppercase' }}>Điểm số</th>
                     <th style={{ padding: '16px 24px', fontWeight: 700, color: c.onSurfaceVar, fontSize: '0.875rem', textTransform: 'uppercase' }}>Kills</th>
                     <th style={{ padding: '16px 24px', fontWeight: 700, color: c.onSurfaceVar, fontSize: '0.875rem', textTransform: 'uppercase' }}>Tỷ lệ thắng</th>
                  </tr>
               </thead>
               <tbody>
                  {data.map((row, i) => (
                     <tr key={i} style={{ borderBottom: `1px solid ${c.panelBorder}`, transition: 'background 0.2s', background: i === 0 ? 'rgba(250,204,21,0.08)' : i === 1 ? 'rgba(148,163,184,0.08)' : i === 2 ? 'rgba(180,83,9,0.08)' : 'transparent' }} onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'} onMouseLeave={e => e.currentTarget.style.background = i === 0 ? 'rgba(250,204,21,0.08)' : i === 1 ? 'rgba(148,163,184,0.08)' : i === 2 ? 'rgba(180,83,9,0.08)' : 'transparent'}>
                        <td style={{ padding: '20px 24px', fontSize: '1.1rem', fontWeight: 700, color: i === 0 ? '#facc15' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : c.onSurfaceVar }}>
                           {i < 3 ? <MS icon="military_tech" color={i === 0 ? '#facc15' : i === 1 ? '#94a3b8' : '#b45309'} /> : row.rank}
                        </td>
                        <td style={{ padding: '20px 24px', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                           <div style={{ width: 32, height: 32, borderRadius: 8, background: c.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${c.panelBorder}` }}>
                              <MS icon="shield" size={18} color={c.onSurfaceVar} />
                           </div>
                           {row.name}
                        </td>
                        <td style={{ padding: '20px 24px', fontWeight: 700, color: c.primary, fontSize: '1.1rem' }}>{row.points}</td>
                        <td style={{ padding: '20px 24px', color: c.onSurface }}>{row.kills}</td>
                        <td style={{ padding: '20px 24px', color: c.onSurfaceVar }}>{row.wr}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
            
         </div>
      </div>
    </div>
  )
}
