import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens, statusColor } from '../theme'

interface Dispute { DisputeID: number; MatchID: number; Description: string; Status: string; Category?: string; CreatedAt?: string }
const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none' }}>{icon}</span>
)

export default function DisputesPage() {
  const { token, isAdmin } = useAuth()
  const { dark } = useTheme()
  const c = getTokens(dark)
  const [list, setList] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Dispute | null>(null)
  const [note, setNote] = useState('')
  const [action, setAction] = useState<'resolve' | 'dismiss' | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/disputes?tournamentId=1', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(d => setList(d.data ?? []))
      .catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [token])

  const handleAction = async () => {
    if (!selected || !action || !note.trim()) return
    await fetch(`/api/disputes/${selected.DisputeID}/${action}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(action === 'resolve' ? { Resolution: note } : { Reason: note }) })
    setSelected(null); setNote(''); setAction(null); load()
  }

  const inputStyle = { background: c.inputBg, border: `1px solid ${c.panelBorder}`, borderRadius: 8, padding: '8px 12px', color: c.onSurface, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', width: '100%' }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>⚠️ Khiếu nại</h1>
        {!loading && <span style={{ fontSize: '0.8rem', color: c.onSurfaceVar }}>{list.filter(d => d.Status?.toLowerCase() === 'open').length} chờ xử lý</span>}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? [1,2,3].map(i => <div key={i} style={{ height: 90, background: c.surfaceCard, borderRadius: 12 }} />)
          : list.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: c.onSurfaceVar }}>
              <MS icon="gavel" size={52} /><p style={{ marginTop: 12 }}>Không có khiếu nại nào.</p>
            </div>
          ) : list.map(d => {
            const sc = statusColor(d.Status, dark)
            return (
              <div key={d.DisputeID} style={{ background: c.surfaceCard, border: `1px solid ${c.panelBorder}`, borderRadius: 12, padding: '1.25rem', backdropFilter: 'blur(6px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: c.onSurface }}>Khiếu nại #{d.DisputeID}</span>
                      <span style={{ fontSize: '0.72rem', color: c.onSurfaceVar }}>· Trận #{d.MatchID}</span>
                      {d.Category && <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', background: c.surfaceContainer, color: c.onSurfaceVar }}>{d.Category}</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: c.onSurfaceVar, lineHeight: 1.6 }}>{d.Description}</p>
                    {d.CreatedAt && <span style={{ fontSize: '0.72rem', color: c.outline }}>{new Date(d.CreatedAt).toLocaleString('vi-VN')}</span>}
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, marginLeft: 12, whiteSpace: 'nowrap' }}>{d.Status}</span>
                </div>
                {isAdmin && d.Status?.toLowerCase() === 'open' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => { setSelected(d); setAction('resolve'); setNote('') }} style={{ padding: '6px 14px', borderRadius: 7, background: `${c.successText}18`, border: `1px solid ${c.successText}40`, color: c.successText, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MS icon="task_alt" size={16} />Chấp nhận
                    </button>
                    <button onClick={() => { setSelected(d); setAction('dismiss'); setNote('') }} style={{ padding: '6px 14px', borderRadius: 7, background: `${c.errorText}18`, border: `1px solid ${c.errorText}40`, color: c.errorText, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MS icon="block" size={16} />Bác bỏ
                    </button>
                  </div>
                )}
              </div>
            )
          })}
      </div>

      {/* Action modal */}
      {selected && action && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: c.surfaceLow, border: `1px solid ${c.panelBorder}`, borderRadius: 14, padding: '1.75rem', width: 440, maxWidth: '95vw' }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.1rem', fontWeight: 700, color: c.onSurface, margin: '0 0 1.25rem' }}>
              {action === 'resolve' ? '✅ Chấp nhận khiếu nại' : '❌ Bác bỏ khiếu nại'}
            </h2>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: c.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
              {action === 'resolve' ? 'Nội dung phán quyết *' : 'Lý do bác bỏ *'}
            </label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={4} placeholder="Nhập nội dung..." style={{ ...inputStyle, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button onClick={() => { setSelected(null); setAction(null) }} style={{ padding: '8px 18px', borderRadius: 8, background: 'transparent', border: `1px solid ${c.panelBorder}`, color: c.onSurfaceVar, cursor: 'pointer', fontFamily: 'inherit' }}>Hủy</button>
              <button onClick={handleAction} disabled={!note.trim()} style={{ padding: '8px 18px', borderRadius: 8, background: action === 'resolve' ? c.successText : c.errorText, color: '#fff', border: 'none', cursor: !note.trim() ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: 'inherit', opacity: !note.trim() ? 0.5 : 1 }}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
