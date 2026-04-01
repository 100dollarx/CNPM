import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens, statusColor } from '../theme'

interface User { UserID: number; Username: string; FullName: string; Role: string; IsLocked: boolean }
const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)

const roleColors: Record<string, { bg: string; color: string }> = {
  admin:   { bg: 'rgba(252,129,129,0.12)', color: '#FC8181' },
  captain: { bg: 'rgba(246,173,85,0.12)',  color: '#F6AD55' },
  player:  { bg: 'rgba(99,179,237,0.12)',  color: '#63B3ED' },
}

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
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500) }
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
    showToast(u.IsLocked ? `✓ Đã mở khóa ${u.Username}` : `🔒 Đã khóa ${u.Username}`)
    load()
  }

  const resetPwd = async (u: User) => {
    await fetch(`/api/users/${u.UserID}/reset-password`, { method: 'POST', headers: headers() })
    showToast(`🔑 Reset mật khẩu ${u.Username} → 'admin'`)
  }

  const handleCreate = async () => {
    if (!form.Username.trim() || !form.FullName.trim()) { setErr('Username và FullName không được trống.'); return }
    setSubmitting(true); setErr('')
    try {
      const r = await fetch('/api/users', { method: 'POST', headers: headers(), body: JSON.stringify(form) })
      if (r.ok) { setShowCreate(false); setForm({ Username: '', FullName: '', Role: 'Captain', Email: '' }); load(); showToast('✓ Tạo tài khoản thành công!') }
      else { const d = await r.json(); setErr(d.error ?? 'Tạo thất bại.') }
    } catch { setErr('Không thể kết nối.') } finally { setSubmitting(false) }
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: c.inputBg, border: `1px solid ${c.panelBorder}`, borderRadius: 8, padding: '10px 12px', color: c.onSurface, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s' }
  const labelStyle: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 700, color: c.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: toast.type === 'success' ? 'rgba(104,211,145,0.15)' : 'rgba(252,129,129,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(104,211,145,0.4)' : 'rgba(252,129,129,0.4)'}`, color: toast.type === 'success' ? '#68D391' : '#FC8181', padding: '10px 18px', borderRadius: 10, fontSize: '0.875rem', fontWeight: 600, zIndex: 200, backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', animation: 'slide-in 0.3s ease' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 24, borderRadius: 2, background: 'linear-gradient(180deg,#FC8181,#F6AD55)' }} />
          <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.4rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>QUẢN LÝ USER</h1>
          <span style={{ padding: '2px 10px', borderRadius: 999, background: 'rgba(252,129,129,0.12)', border: '1px solid rgba(252,129,129,0.3)', color: '#FC8181', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{filtered.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.onSurfaceVar, pointerEvents: 'none' }}><MS icon="search" /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm user..." className="nexora-input"
              style={{ ...inputStyle, width: 200, paddingLeft: 36 }} />
          </div>
          <button onClick={() => { setShowCreate(true); setErr('') }} className="nexora-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, fontSize: '0.875rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em' }}>
            <MS icon="person_add" size={18} /><span>TẠO TÀI KHOẢN</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem' }}>
        {loading ? (
          [1,2,3,4].map(i => <div key={i} style={{ height: 52, background: 'rgba(22,27,34,0.9)', borderRadius: 10, marginBottom: 8, animation: 'neon-pulse 2s ease-in-out infinite' }} />)
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: c.onSurfaceVar }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(252,129,129,0.08)', border: '1px solid rgba(252,129,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MS icon="manage_accounts" size={36} />
            </div>
            <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1rem', letterSpacing: '0.05em' }}>Không có user nào.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.panelBorder}` }}>
                {['#', 'USER', 'HỌ TÊN', 'ROLE', 'TRẠNG THÁI', 'THAO TÁC'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: c.onSurfaceVar, fontFamily: "'Rajdhani',sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, idx) => {
                const rc = roleColors[u.Role?.toLowerCase()] ?? { bg: 'rgba(45,55,72,0.3)', color: '#8B9AB5' }
                const lc = statusColor(u.IsLocked ? 'locked' : 'active', dark)
                return (
                  <tr key={u.UserID} style={{ borderBottom: `1px solid ${c.panelBorder}40`, transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px', color: c.onSurfaceVar, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem' }}>{String(idx + 1).padStart(2, '0')}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${rc.color}20`, border: `1px solid ${rc.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: rc.color, fontWeight: 700, fontSize: '0.8rem', flexShrink: 0, fontFamily: "'Rajdhani',sans-serif" }}>
                          {u.Username[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: c.onSurface, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.82rem' }}>{u.Username}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', color: c.onSurfaceVar, fontSize: '0.875rem' }}>{u.FullName}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, background: rc.bg, color: rc.color, border: `1px solid ${rc.color}30`, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.08em' }}>{u.Role?.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, background: lc.bg, color: lc.text, border: `1px solid ${lc.border}`, fontFamily: "'JetBrains Mono',monospace" }}>
                        {u.IsLocked ? '🔒 LOCKED' : '● ACTIVE'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => toggleLock(u)} style={{ padding: '5px 10px', borderRadius: 6, background: u.IsLocked ? 'rgba(104,211,145,0.1)' : 'rgba(252,129,129,0.1)', border: `1px solid ${u.IsLocked ? 'rgba(104,211,145,0.3)' : 'rgba(252,129,129,0.3)'}`, color: u.IsLocked ? '#68D391' : '#FC8181', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}>
                          <MS icon={u.IsLocked ? 'lock_open' : 'lock'} size={13} />{u.IsLocked ? 'MỞ KHÓA' : 'KHÓA'}
                        </button>
                        <button onClick={() => resetPwd(u)} style={{ padding: '5px 10px', borderRadius: 6, background: c.surfaceContainer, border: `1px solid ${c.panelBorder}`, color: c.onSurfaceVar, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, fontFamily: "'Rajdhani',sans-serif", display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}>
                          <MS icon="key" size={13} />RESET
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

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: c.surfaceCard, border: '1px solid rgba(252,129,129,0.3)', borderRadius: 18, padding: '2rem', width: 440, maxWidth: '95vw', boxShadow: dark ? '0 32px 80px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.1)', animation: 'slide-in 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 20, borderRadius: 2, background: 'linear-gradient(180deg,#FC8181,#F6AD55)' }} />
                <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.2rem', fontWeight: 700, margin: 0, letterSpacing: '0.08em', color: c.onSurface }}>TẠO TÀI KHOẢN MỚI</h2>
              </div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.2)', borderRadius: 8, cursor: 'pointer', color: '#FC8181', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={labelStyle}>Username *</label><input value={form.Username} onChange={e => setForm(f => ({ ...f, Username: e.target.value }))} placeholder="vd. player01" style={inputStyle} className="nexora-input" /></div>
              <div><label style={labelStyle}>Họ và tên *</label><input value={form.FullName} onChange={e => setForm(f => ({ ...f, FullName: e.target.value }))} placeholder="vd. Nguyễn Văn A" style={inputStyle} className="nexora-input" /></div>
              <div><label style={labelStyle}>Role</label>
                <select value={form.Role} onChange={e => setForm(f => ({ ...f, Role: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {['Admin', 'Captain', 'Player'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Email (tùy chọn)</label><input type="email" value={form.Email} onChange={e => setForm(f => ({ ...f, Email: e.target.value }))} placeholder="vd. user@nexora.gg" style={inputStyle} className="nexora-input" /></div>
              {err && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(252,129,129,0.08)', border: '1px solid rgba(252,129,129,0.25)', color: '#FC8181', fontSize: '0.82rem' }}>{err}</div>}
              <p style={{ margin: 0, fontSize: '0.78rem', color: c.onSurfaceVar }}>Mật khẩu mặc định: <code style={{ color: '#A78BFA', fontFamily: "'JetBrains Mono',monospace", background: 'rgba(124,58,237,0.1)', padding: '1px 6px', borderRadius: 4 }}>admin</code></p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => setShowCreate(false)} style={{ padding: '10px 20px', borderRadius: 9, background: 'transparent', border: `1px solid ${c.panelBorder}`, color: c.onSurfaceVar, cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em' }}>HỦY</button>
                <button onClick={handleCreate} disabled={submitting} className="nexora-btn-primary" style={{ padding: '10px 24px', borderRadius: 9, fontSize: '0.9rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.08em' }}>
                  {submitting ? 'Đang tạo...' : 'TẠO TÀI KHOẢN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
