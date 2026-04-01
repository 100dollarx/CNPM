import { useParams, useNavigate } from 'react-router'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens } from '../theme'
import { useState } from 'react'

const MS = ({ icon, size = 20, color }: { icon: string; size?: number; color?: string }) => (
  <span style={{ fontSize: size, color, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', verticalAlign: 'middle' }}>{icon}</span>
)

export default function ResultSubmitPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { dark } = useTheme()
  const c = getTokens(dark)
  const [scoreA, setScoreA] = useState('')
  const [scoreB, setScoreB] = useState('')
  const [file, setFile] = useState<File|null>(null)

  const isValid = scoreA !== '' && scoreB !== '' && file !== null;
  const handleSubmit = () => {
    if (isValid) {
      alert('Kết quả đã được nộp thành công!');
      nav('/matches');
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      <div style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: 16, borderBottom: `1px solid ${c.panelBorder}`, background: dark ? 'rgba(28,32,38,0.5)' : 'rgba(243,243,247,0.5)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => nav('/matches')} style={{ background: c.surfaceContainer, border: `1px solid ${c.panelBorder}`, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c.onSurfaceVar, transition: 'all 0.2s' }}>
          <MS icon="arrow_back" />
        </button>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Nộp kết quả thi đấu</h1>
          <p style={{ margin: '4px 0 0', color: c.onSurfaceVar, fontSize: '0.875rem' }}>Trận {id}</p>
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflowY: 'auto' }}>
         <div style={{ width: '100%', maxWidth: 640, background: c.surfaceCard, backdropFilter: 'blur(24px)', borderRadius: 24, border: `1px solid ${c.panelBorder}`, padding: '3rem', boxShadow: dark ? '0 20px 60px rgba(0,0,0,0.45)' : '0 15px 45px rgba(0,0,0,0.06)' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '2rem', alignItems: 'center', marginBottom: '3rem' }}>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${c.infoText}20`, border: `2px solid ${c.infoText}`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <MS icon="groups" size={40} color={c.infoText} />
                  </div>
                  <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.25rem', margin: '0 0 12px' }}>Đội A</h3>
                  <input type="number" min="0" value={scoreA} onChange={e=>setScoreA(e.target.value)} placeholder="Tỉ số" style={{ width: 100, textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, background: c.inputBg, border: `2px solid ${c.primary}40`, padding: '10px', borderRadius: 12, color: c.onSurface, outline: 'none' }} />
               </div>
               
               <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '2rem', fontWeight: 700, color: c.onSurfaceVar, marginTop: 40 }}>VS</div>
               
               <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${c.errorText}20`, border: `2px solid ${c.errorText}`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <MS icon="groups" size={40} color={c.errorText} />
                  </div>
                  <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.25rem', margin: '0 0 12px' }}>Đội B</h3>
                  <input type="number" min="0" value={scoreB} onChange={e=>setScoreB(e.target.value)} placeholder="Tỉ số" style={{ width: 100, textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, background: c.inputBg, border: `2px solid ${c.primary}40`, padding: '10px', borderRadius: 12, color: c.onSurface, outline: 'none' }} />
               </div>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
               <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: c.onSurfaceVar, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Minh chứng (Screenshot)</label>
               <label htmlFor="upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `2px dashed ${c.panelBorder}`, borderRadius: 16, padding: '3rem 2rem', cursor: 'pointer', background: c.surfaceContainer, transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = c.primary} onMouseLeave={e => e.currentTarget.style.borderColor = c.panelBorder}>
                  <MS icon="cloud_upload" size={48} color={c.onSurfaceVar} />
                  <span style={{ marginTop: 16, color: c.onSurface, fontWeight: 600 }}>{file ? file.name : 'Nhấn để chọn hình ảnh'}</span>
                  <span style={{ marginTop: 8, color: c.onSurfaceVar, fontSize: '0.85rem' }}>JPEG, PNG, WEBP (Tối đa 5MB)</span>
                  <input id="upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
               </label>
            </div>
            
            <button disabled={!isValid} onClick={handleSubmit} style={{ width: '100%', padding: '16px', borderRadius: 12, background: isValid ? 'linear-gradient(135deg,#E94560,#91002b)' : c.surfaceContainer, color: isValid ? '#fff' : c.onSurfaceVar, border: 'none', cursor: isValid ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '1.05rem', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: isValid ? '0 8px 32px rgba(233,69,96,0.3)' : 'none', transition: 'all 0.2s', opacity: isValid ? 1 : 0.6 }} onMouseDown={e => isValid && (e.currentTarget.style.transform = 'scale(0.98)')} onMouseUp={e => isValid && (e.currentTarget.style.transform = 'scale(1)')}>
               <MS icon="send" /> Nộp kết quả
            </button>
         </div>
      </div>
    </div>
  )
}
