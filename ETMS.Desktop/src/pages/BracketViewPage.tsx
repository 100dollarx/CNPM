import { useParams, useNavigate } from 'react-router'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens } from '../theme'
import { useState, useEffect } from 'react'

const MS = ({ icon, size = 20 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', verticalAlign: 'middle' }}>{icon}</span>
)

export default function BracketViewPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { dark } = useTheme()
  const c = getTokens(dark)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [id])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface, overflowX: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: 16, borderBottom: `1px solid ${c.panelBorder}`, background: dark ? 'rgba(28,32,38,0.5)' : 'rgba(243,243,247,0.5)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => nav('/tournaments')} style={{ background: c.surfaceContainer, border: `1px solid ${c.panelBorder}`, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c.onSurfaceVar, transition: 'all 0.2s' }}>
          <MS icon="arrow_back" />
        </button>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Sơ đồ thi đấu</h1>
          <p style={{ margin: '4px 0 0', color: c.onSurfaceVar, fontSize: '0.875rem' }}>Giải đấu ID: {id} • Single Elimination</p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', gap: '2rem', minWidth: 'max-content' }}>
            {[1, 2, 3].map(round => (
              <div key={round} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', justifyContent: 'space-around' }}>
                <div style={{ width: 220, height: 80, background: c.surfaceCard, borderRadius: 12, border: `1px solid ${c.panelBorder}` }} />
                <div style={{ width: 220, height: 80, background: c.surfaceCard, borderRadius: 12, border: `1px solid ${c.panelBorder}` }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <div style={{ textAlign: 'center', padding: '3rem', background: c.surfaceCard, borderRadius: 20, border: `1px solid ${c.panelBorder}`, backdropFilter: 'blur(20px)', boxShadow: dark ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 40px rgba(0,0,0,0.05)', maxWidth: 400 }}>
              <MS icon="account_tree" size={56} />
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.25rem', marginTop: 16, marginBottom: 8, color: c.onSurface }}>Module Đang Phát Triển</h2>
              <p style={{ color: c.onSurfaceVar, fontSize: '0.9rem', lineHeight: 1.6 }}>Cây thư mục thi đấu thời gian thực sẽ được cập nhật trong phiên bản tiếp theo tương tự như Login.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
