import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens, statusColor } from '../theme'

interface User { UserID: number; Username: string; FullName: string; Role: string; IsLocked: boolean }
const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none' }}>{icon}</span>
)

export default function UsersPage() {
  const { token } = useAuth()
  const { dark } = useTheme()
  const c = getTokens(dark)
  const [list, setList] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ Username: '', FullName: '', Role: 'Captain', Email: '' })
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const headers = (extra?: Record<string, string>) => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra })

  const load = () => {
    setLoading(true)
    fetch('/api/users', { headers: headers() })
      .then(r => r.json()).then(d => setList(d.data ?? [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [token])

  const filtered = list.filter(u => !search || u.Username.toLowerCase().includes(search.toLowerCase()) || u.FullName.toLowerCase().includes(search.toLowerCase()))

  const toggleLock = async (u: User) => {
    await fetch(`/api/users/${u.UserID}/lock`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ IsLocked: !u.IsLocked }) })
    showToast(u.IsLocked ? `Đã mở khóa ${u.Username}` : `Đã khóa ${u.Username}`)
    load()
  }

  const resetPwd = async (u: User) => {
    await fetch(`/api/users/${u.UserID}/reset-password`, { method: 'POST', headers: headers() })
    showToast(`Đã reset mật khẩu ${u.Username} về 'admin'`)
  }

  const handleCreate = async () => {
    if (!form.Username.trim() || !form.FullName.trim()) { setErr('Username và FullName không được trống.'); return }
    setSubmitting(true); setErr('')
    try {
      const r = await fetch('/api/users', { method: 'POST', headers: headers(), body: JSON.stringify(form) })
      if (r.ok) { setShowCreate(false); setForm({ Username: '', FullName: '', Role: 'Captain', Email: '' }); load(); showToast('Tạo tài khoản thành công!') }
      else { const d = await r.json(); setErr(d.error ?? 'Tạo thất bại.') }
    } catch { setErr('Không thể kết nối.') } finally { setSubmitting(false) }
  }

  const roleColor = (role: string) => {
    if (role === 'Admin') return { bg: 'rgba(233,69,96,0.12)', text: '#E94560' }
    if (role === 'Captain') return { bg: dark ? 'rgba(96,165,250,0.12)' : 'rgba(29,78,216,0.1)', text: dark ? '#60a5fa' : '#1d4ed8' }
    return { bg: c.surfaceContainer, text: c.onSurfaceVar }
  }

  const inputStyle = { background: c.inputBg, border: `1px solid ${c.panelBorder}`, borderRadius: 8, padding: '9px 12px', color: c.onSurface, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', width: '100%' }
  const labelStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 600, color: c.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      {/* Toast */}
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, background: c.successText, color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: '0.875rem', fontWeight: 600, zIndex: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>{toast}</div>}

      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>👤 Quản lý User</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.onSurfaceVar }}><MS icon="search" /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm user..." style={{ ...inputStyle, width: 200, paddingLeft: 34 }} />
          </div>
          <button onClick={() => { setShowCreate(true); setErr('') }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 9, background: 'linear-gradient(135deg,#E94560,#91002b)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(233,69,96,0.3)' }}>
            <MS icon="person_add" size={18} /><span>Tạo tài khoản</span>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem' }}>
        {loading ? [1,2,3,4].map(i => <div key={i} style={{ height: 52, background: c.surfaceCard, borderRadius: 10, marginBottom: 8 }} />)
          : filtered.length === 0 ? <div style={{ textAlign: 'center', padding: '5rem', color: c.onSurfaceVar }}><MS icon="manage_accounts" size={52} /><p style={{ marginTop: 12 }}>Không có user nào.</p></div>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${c.panelBorder}` }}>
                  {['Username', 'Họ tên', 'Role', 'Trạng thái', 'Thao tác'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: c.onSurfaceVar }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const rc = roleColor(u.Role)
                  const lc = statusColor(u.IsLocked ? 'locked' : 'active', dark)
                  return (
                    <tr key={u.UserID} style={{ borderBottom: `1px solid ${c.panelBorder}40`, transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${c.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.primary, fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>{u.Username[0]?.toUpperCase()}</div>
                          <span style={{ fontWeight: 600, color: c.onSurface }}>{u.Username}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: c.onSurfaceVar }}>{u.FullName}</td>
                      <td style={{ padding: '12px' }}><span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: rc.bg, color: rc.text }}>{u.Role}</span></td>
                      <td style={{ padding: '12px' }}><span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: lc.bg, color: lc.text, border: `1px solid ${lc.border}` }}>{u.IsLocked ? '🔒 Khóa' : '✓ Hoạt động'}</span></td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => toggleLock(u)} style={{ padding: '5px 10px', borderRadius: 6, background: u.IsLocked ? `${c.successText}18` : `${c.errorText}18`, border: `1px solid ${u.IsLocked ? c.successText : c.errorText}40`, color: u.IsLocked ? c.successText : c.errorText, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MS icon={u.IsLocked ? 'lock_open' : 'lock'} size={14} />{u.IsLocked ? 'Mở khóa' : 'Khóa'}
                          </button>
                          <button onClick={() => resetPwd(u)} style={{ padding: '5px 10px', borderRadius: 6, background: c.surfaceContainer, border: `1px solid ${c.panelBorder}`, color: c.onSurfaceVar, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MS icon="key" size={14} />Reset pwd
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
      </div>

      {/* Create user modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: c.surfaceLow, border: `1px solid ${c.panelBorder}`, borderRadius: 16, padding: '2rem', width: 420, maxWidth: '95vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.1rem', fontWeight: 700, color: c.onSurface, margin: 0 }}>Tạo tài khoản mới</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.onSurfaceVar, fontSize: '1.2rem' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={labelStyle}>Username *</label><input value={form.Username} onChange={e => setForm(f => ({ ...f, Username: e.target.value }))} style={inputStyle} placeholder="vd. player01" /></div>
              <div><label style={labelStyle}>Họ tên *</label><input value={form.FullName} onChange={e => setForm(f => ({ ...f, FullName: e.target.value }))} style={inputStyle} placeholder="vd. Nguyễn Văn A" /></div>
              <div><label style={labelStyle}>Role</label>
                <select value={form.Role} onChange={e => setForm(f => ({ ...f, Role: e.target.value }))} style={inputStyle}>
                  {['Admin','Captain','Player'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Email (tùy chọn)</label><input type="email" value={form.Email} onChange={e => setForm(f => ({ ...f, Email: e.target.value }))} style={inputStyle} placeholder="vd. user@example.com" /></div>
              {err && <div style={{ padding: '10px', borderRadius: 8, background: 'rgba(233,69,96,0.1)', border: '1px solid rgba(233,69,96,0.25)', color: c.errorText, fontSize: '0.8rem' }}>{err}</div>}
              <p style={{ margin: 0, fontSize: '0.78rem', color: c.onSurfaceVar }}>💡 Mật khẩu mặc định: <strong style={{ color: c.primary }}>admin</strong></p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCreate(false)} style={{ padding: '9px 20px', borderRadius: 8, background: 'transparent', border: `1px solid ${c.panelBorder}`, color: c.onSurfaceVar, cursor: 'pointer', fontFamily: 'inherit' }}>Hủy</button>
                <button onClick={handleCreate} disabled={submitting} style={{ padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#E94560,#91002b)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Đang tạo...' : 'Tạo tài khoản'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
