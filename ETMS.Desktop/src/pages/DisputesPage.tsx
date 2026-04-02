import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { getTokens, statusColor } from '../theme'

interface Dispute { DisputeID: number; MatchID: number; Description: string; Status: string; Category?: string; CreatedAt?: string }
const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)
const statusLabels: Record<string, string> = { open: 'MO', resolved: 'DA GIAI QUYET', dismissed: 'BAC BO' }
const categoryColors: Record<string, string> = { hackcheat: '#EF4444', wrongscore: '#F6AD55', unauthorizedplayer: '#FC8181', other: '#8B9AB5' }

export default function DisputesPage() {
  const { token, isAdmin } = useAuth()
  const { dark } = useTheme()
  const toast = useToast()
  const c = getTokens(dark)
  const [list, setList] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Dispute | null>(null)
  const [note, setNote] = useState('')
  const [action, setAction] = useState<'resolve' | 'dismiss' | null>(null)
  // Captain submit dispute
  const [showSubmit, setShowSubmit] = useState(false)
  const [submitForm, setSubmitForm] = useState({ MatchID: '', Category: 'HackCheat', Description: '', EvidenceURL: '' })
  const [submitting, setSubmitting] = useState(false)
  const inputSt: React.CSSProperties = { width: '100%', background: c.inputBg, border: `1px solid ${c.panelBorder}`, borderRadius: 9, padding: '10px 13px', color: c.onSurface, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none' }
  const labelSt: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 700, color: c.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }

  const load = () => {
    setLoading(true)
    fetch('/api/disputes', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(d => setList(d.data ?? []))
      .catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [token])

  const handleSubmitDispute = async () => {
    if (!submitForm.MatchID.trim()) { toast.error('Nhap ID tran dau'); return }
    if (!submitForm.Description.trim()) { toast.error('Mo ta khieu nai'); return }
    if (submitForm.Description.length > 1000) { toast.error('Mo ta toi da 1000 ky tu'); return }
    setSubmitting(true)
    try {
      const r = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ MatchID: parseInt(submitForm.MatchID), Category: submitForm.Category, Description: submitForm.Description.trim(), EvidenceURL: submitForm.EvidenceURL.trim() || null })
      })
      const d = await r.json()
      if (r.ok || r.status === 201) {
        toast.success('Da nop khieu nai! Admin xu ly trong 48 gio.')
        setShowSubmit(false)
        setSubmitForm({ MatchID: '', Category: 'HackCheat', Description: '', EvidenceURL: '' })
        load()
      } else { toast.error(d.error ?? 'Nop khieu nai that bai.') }
    } catch { toast.error('Khong the ket noi.') } finally { setSubmitting(false) }
  }

  const handleAction = async () => {
    if (!selected || !action || !note.trim()) return
    try {
      const r = await fetch(`/api/disputes/${selected.DisputeID}/${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(action === 'resolve' ? { Resolution: note } : { Reason: note })
      })
      if (r.ok) {
        toast.success(action === 'resolve' ? `Da chap nhan khieu nai #${selected.DisputeID}.` : `Da bac bo khieu nai #${selected.DisputeID}.`)
      } else {
        const d = await r.json(); toast.error(d.error ?? 'Thao tac that bai.')
      }
    } catch { toast.error('Khong the ket noi.') }
    setSelected(null); setNote(''); setAction(null); load()
  }

  const openCount = list.filter(d => d.Status?.toLowerCase() === 'open').length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 24, borderRadius: 2, background: 'linear-gradient(180deg,#F6AD55,#FC8181)' }} />
          <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.4rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>KHIEU NAI</h1>
          {openCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className="live-dot" style={{ background: '#F6AD55', boxShadow: '0 0 8px rgba(246,173,85,0.6)' }} />
              <span style={{ padding: '2px 10px', borderRadius: 999, background: 'rgba(246,173,85,0.12)', border: '1px solid rgba(246,173,85,0.3)', color: '#F6AD55', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{openCount} cho xu ly</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: c.onSurfaceVar, background: 'rgba(45,55,72,0.4)', border: `1px solid ${c.panelBorder}`, padding: '4px 12px', borderRadius: 999, fontFamily: "'JetBrains Mono',monospace" }}>{list.length} tong</span>
          {!isAdmin && (
            <button onClick={() => setShowSubmit(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: 'rgba(246,173,85,0.12)', border: '1px solid rgba(246,173,85,0.3)', color: '#F6AD55', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
              <MS icon="report" size={16} /><span>NOP KHIEU NAI</span>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading ? (
          [1,2,3].map(i => <div key={i} style={{ height: 100, background: 'rgba(22,27,34,0.9)', borderRadius: 14, animation: 'neon-pulse 2s ease-in-out infinite' }} />)
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: c.onSurfaceVar }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(246,173,85,0.08)', border: '1px solid rgba(246,173,85,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MS icon="gavel" size={36} />
            </div>
            <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1rem', letterSpacing: '0.05em' }}>Khong co khieu nai nao.</p>
            {!isAdmin && (
              <button onClick={() => setShowSubmit(true)} style={{ marginTop: 12, padding: '9px 20px', borderRadius: 10, border: '1px solid rgba(246,173,85,0.3)', background: 'rgba(246,173,85,0.08)', color: '#F6AD55', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', fontFamily: "'Rajdhani',sans-serif" }}>
                + Nop khieu nai ngay
              </button>
            )}
          </div>
        ) : list.map(d => {
          const sc = statusColor(d.Status, dark)
          const isOpen = d.Status?.toLowerCase() === 'open'
          const catKey = d.Category?.toLowerCase().replace(/\s/g,'') ?? 'other'
          const catColor = categoryColors[catKey] ?? '#8B9AB5'
          return (
            <div key={d.DisputeID} className="nexora-card" style={{ background: c.surfaceCard, border: `1px solid ${isOpen ? 'rgba(246,173,85,0.3)' : c.panelBorder}`, borderRadius: 14, padding: '1.25rem', backdropFilter: 'blur(8px)', position: 'relative', overflow: 'hidden', boxShadow: isOpen ? '0 0 20px rgba(246,173,85,0.06)' : 'none' }}>
              {isOpen && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#F6AD55,#FC8181,transparent)' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: c.onSurface, fontFamily: "'Rajdhani',sans-serif" }}>Khieu Nai #{d.DisputeID}</span>
                    <span style={{ fontSize: '0.72rem', color: c.onSurfaceVar, fontFamily: "'JetBrains Mono',monospace" }}>Tran #{d.MatchID}</span>
                    {d.Category && <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30`, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.06em' }}>{d.Category.toUpperCase()}</span>}
                    {isOpen && <span className="live-dot" style={{ background: '#F6AD55', width: 6, height: 6 }} />}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: c.onSurfaceVar, lineHeight: 1.6 }}>{d.Description}</p>
                  {d.CreatedAt && <span style={{ fontSize: '0.7rem', color: c.outline, fontFamily: "'JetBrains Mono',monospace" }}>{new Date(d.CreatedAt).toLocaleString('vi-VN')}</span>}
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, marginLeft: 12, whiteSpace: 'nowrap', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.06em' }}>
                  {statusLabels[d.Status?.toLowerCase()] ?? d.Status}
                </span>
              </div>
              {isAdmin && isOpen && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => { setSelected(d); setAction('resolve'); setNote('') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'rgba(104,211,145,0.1)', border: '1px solid rgba(104,211,145,0.3)', color: '#68D391', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em', transition: 'all 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(104,211,145,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(104,211,145,0.1)')}>
                    <MS icon="task_alt" size={15} />CHAP NHAN
                  </button>
                  <button onClick={() => { setSelected(d); setAction('dismiss'); setNote('') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)', color: '#FC8181', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em', transition: 'all 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(252,129,129,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(252,129,129,0.1)')}>
                    <MS icon="block" size={15} />BAC BO
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal: Captain NOP KHIEU NAI */}
      {showSubmit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) setShowSubmit(false) }}>
          <div style={{ background: c.surfaceCard, border: '1px solid rgba(246,173,85,0.3)', borderRadius: 18, padding: '2rem', width: 500, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: dark ? '0 32px 80px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.1)', animation: 'slide-in 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 20, borderRadius: 2, background: 'linear-gradient(180deg,#F6AD55,#FC8181)' }} />
                <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.2rem', fontWeight: 700, margin: 0, letterSpacing: '0.08em', color: c.onSurface }}>NOP KHIEU NAI</h2>
              </div>
              <button onClick={() => setShowSubmit(false)} style={{ background: 'rgba(246,173,85,0.08)', border: '1px solid rgba(246,173,85,0.2)', borderRadius: 8, cursor: 'pointer', color: '#F6AD55', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>X</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={labelSt}>Match ID *</label>
                <input value={submitForm.MatchID} onChange={e => setSubmitForm(f => ({ ...f, MatchID: e.target.value }))} type="number" placeholder="VD: 42" className="nexora-input" style={inputSt} /></div>
              <div><label style={labelSt}>Category *</label>
                <select value={submitForm.Category} onChange={e => setSubmitForm(f => ({ ...f, Category: e.target.value }))} className="nexora-input" style={{ ...inputSt, cursor: 'pointer' }}>
                  <option value="HackCheat">Hack / Cheat</option>
                  <option value="WrongScore">Sai ty so</option>
                  <option value="UnauthorizedPlayer">Tay nap khong hop le</option>
                  <option value="Other">Khac</option>
                </select></div>
              <div><label style={labelSt}>Mo ta * (toi da 1000)</label>
                <textarea value={submitForm.Description} onChange={e => setSubmitForm(f => ({ ...f, Description: e.target.value }))} rows={4} maxLength={1000} className="nexora-input" style={{ ...inputSt, resize: 'vertical' }} />
                <p style={{ fontSize: '0.68rem', color: c.onSurfaceVar, margin: '4px 0 0' }}>{submitForm.Description.length}/1000</p></div>
              <div><label style={labelSt}>Evidence URL</label>
                <input value={submitForm.EvidenceURL} onChange={e => setSubmitForm(f => ({ ...f, EvidenceURL: e.target.value }))} placeholder="https://..." className="nexora-input" style={inputSt} /></div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => setShowSubmit(false)} style={{ padding: '10px 20px', borderRadius: 9, background: 'transparent', border: `1px solid ${c.panelBorder}`, color: c.onSurfaceVar, cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif" }}>HUY</button>
                <button onClick={handleSubmitDispute} disabled={submitting || !submitForm.MatchID || !submitForm.Description.trim()}
                  style={{ padding: '10px 24px', borderRadius: 9, background: 'rgba(246,173,85,0.15)', border: '1px solid rgba(246,173,85,0.4)', color: '#F6AD55', cursor: 'pointer', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Dang nop...' : 'NOP KHIEU NAI'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Admin giai quyet */}
      {selected && action && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: c.surfaceCard, border: `1px solid ${action === 'resolve' ? 'rgba(104,211,145,0.3)' : 'rgba(252,129,129,0.3)'}`, borderRadius: 18, padding: '2rem', width: 460, maxWidth: '95vw', animation: 'slide-in 0.3s ease', boxShadow: dark ? '0 32px 80px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: action === 'resolve' ? '#68D391' : '#FC8181' }} />
              <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.2rem', fontWeight: 700, color: c.onSurface, margin: 0, letterSpacing: '0.08em' }}>
                {action === 'resolve' ? 'CHAP NHAN KHIEU NAI' : 'BAC BO KHIEU NAI'} #{selected.DisputeID}
              </h2>
            </div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: c.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
              {action === 'resolve' ? 'Noi dung phan quyet *' : 'Ly do bac bo *'}
            </label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={4} placeholder="Nhap noi dung xu ly..." className="nexora-input"
              style={{ width: '100%', background: c.inputBg, border: `1px solid ${c.panelBorder}`, borderRadius: 10, padding: '12px', color: c.onSurface, fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button onClick={() => { setSelected(null); setAction(null) }} style={{ padding: '10px 20px', borderRadius: 9, background: 'transparent', border: `1px solid ${c.panelBorder}`, color: c.onSurfaceVar, cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif" }}>HUY</button>
              <button onClick={handleAction} disabled={!note.trim()}
                style={{ padding: '10px 24px', borderRadius: 9, background: action === 'resolve' ? 'rgba(104,211,145,0.2)' : 'rgba(252,129,129,0.2)', border: `1px solid ${action === 'resolve' ? 'rgba(104,211,145,0.4)' : 'rgba(252,129,129,0.4)'}`, color: action === 'resolve' ? '#68D391' : '#FC8181', cursor: !note.trim() ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", opacity: !note.trim() ? 0.4 : 1 }}>
                XAC NHAN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
