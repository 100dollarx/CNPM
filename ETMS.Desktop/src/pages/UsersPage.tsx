import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens } from '../theme'
import { useToast } from '../contexts/ToastContext'
import { useLang } from '../contexts/LangContext'

interface User { UserID: number; Username: string; FullName: string; Role: string; IsLocked: boolean; Email?: string; IsActivated?: boolean }
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
  const toast = useToast()
  const { t } = useLang()
  const [list, setList] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ Username: '', FullName: '', Role: 'Captain', Email: '' })
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  const headers = (extra?: Record<string, string>) => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra })
  const inputStyle: React.CSSProperties = { width: '100%', background: c.inputBg, border: `1px solid ${c.panelBorder}`, borderRadius: 8, padding: '10px 12px', color: c.onSurface, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s' }
  const labelStyle: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 700, color: c.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }

  const load = () => {
    setLoading(true)
    fetch('/api/users', { headers: headers() })
      .then(r => r.json()).then(d => setList(d.data ?? [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [token])

  const filtered = list.filter(u => !search || u.Username?.toLowerCase().includes(search.toLowerCase()) || u.FullName?.toLowerCase().includes(search.toLowerCase()))

  const toggleLock = async (u: User) => {
    await fetch(`/api/users/${u.UserID}/lock`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ IsLocked: !u.IsLocked }) })
    toast.success(u.IsLocked ? t(`Đã mở khóa ${u.Username}`,`Unlocked ${u.Username}`) : t(`Đã khóa ${u.Username}`,`Locked ${u.Username}`))
    load()
  }

  const resetPwd = async (u: User) => {
    await fetch(`/api/users/${u.UserID}/reset-password`, { method: 'POST', headers: headers() })
    toast.success(t(`Đã reset mật khẩu ${u.Username} về: admin`,`Reset password for ${u.Username} to: admin`))
  }

  const resendActivation = async (u: User) => {
    try {
      const r = await fetch(`/api/users/${u.UserID}/resend-activation`, { method: 'POST', headers: headers() })
      const d = await r.json()
      if (r.ok) toast.success(d.message ?? t('Gửi thành công!','Sent successfully!'))
      else toast.error(d.error ?? t('Gửi thất bại','Send failed'))
    } catch { toast.error(t('Không thể kết nối.','Connection failed.')) }
  }

  const deleteUser = async (u: User) => {
    if (!confirm(t(`Bạn có chắc muốn XÓA VĨNH VIỄN tài khoản "${u.Username}"?\n\nHành động này không thể hoàn tác!`,
                    `Are you sure you want to PERMANENTLY DELETE "${u.Username}"?\n\nThis action cannot be undone!`))) return
    try {
      const r = await fetch(`/api/users/${u.UserID}`, { method: 'DELETE', headers: headers() })
      const d = await r.json()
      if (r.ok) { toast.success(d.message ?? t('Đã xóa!','Deleted!')); load() }
      else toast.error(d.error ?? t('Xóa thất bại','Delete failed'))
    } catch { toast.error(t('Không thể kết nối.','Connection failed.')) }
  }

  const handleCreate = async () => {
    if (!form.Username.trim() || !form.FullName.trim()) { setErr(t('Username và Họ tên không được trống.','Username and Full Name are required.')); return }
    setSubmitting(true); setErr('')
    try {
      const r = await fetch('/api/users', { method: 'POST', headers: headers(), body: JSON.stringify(form) })
      if (r.ok) { setShowCreate(false); setForm({ Username: '', FullName: '', Role: 'Captain', Email: '' }); load(); toast.success(t('Tạo tài khoản thành công!','Account created successfully!')) }
      else { const d = await r.json(); setErr(d.error ?? t('Tạo thất bại.','Creation failed.')) }
    } catch { setErr(t('Không thể kết nối.','Connection failed.')) } finally { setSubmitting(false) }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 24, borderRadius: 2, background: 'linear-gradient(180deg,#FC8181,#A78BFA)' }} />
          <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.3rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>{t('QUẢN LÝ NGƯỜI DÙNG','USER MANAGEMENT')}</h1>
          <span style={{ padding: '2px 10px', borderRadius: 999, background: 'rgba(252,129,129,0.12)', border: '1px solid rgba(252,129,129,0.3)', color: '#FC8181', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{list.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.onSurfaceVar, pointerEvents: 'none' }}><MS icon="search" /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Tìm người dùng...','Search users...')} className="nexora-input"
              style={{ ...inputStyle, width: 200, paddingLeft: 36 }} />
          </div>
          <button onClick={() => setShowCreate(true)} className="nexora-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, fontSize: '0.85rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            <MS icon="person_add" size={18} /><span>{t('TẠO TÀI KHOẢN','CREATE ACCOUNT')}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1rem 1.5rem' }}>
        {loading ? (
          [1,2,3,4].map(i => <div key={i} style={{ height: 56, background: 'rgba(22,27,34,0.9)', borderRadius: 12, marginBottom: 10, animation: 'neon-pulse 2s ease-in-out infinite' }} />)
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.panelBorder}` }}>
                {['#', 'Username', t('Họ Tên','Full Name'), t('Vai Trò','Role'), t('Trạng Thái','Status'), t('Kích Hoạt','Activated'), t('Thao Tác','Actions')].map(h => (
                  <th key={h} style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: c.onSurfaceVar, fontFamily: "'Rajdhani',sans-serif", whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, idx) => {
                const rc = roleColors[u.Role?.toLowerCase()] ?? { bg: 'rgba(139,154,181,0.12)', color: '#8B9AB5' }
                return (
                  <tr key={u.UserID} style={{ borderBottom: `1px solid ${c.panelBorder}40`, transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(252,129,129,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px', color: c.onSurfaceVar, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem' }}>{String(idx+1).padStart(2,'0')}</td>
                    <td style={{ padding: '10px', fontWeight: 600, color: c.onSurface, fontFamily: "'Rajdhani',sans-serif", fontSize: '0.95rem' }}>{u.Username}</td>
                    <td style={{ padding: '10px', color: c.onSurfaceVar, fontSize: '0.85rem' }}>{u.FullName}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, background: rc.bg, color: rc.color, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.06em' }}>
                        {u.Role?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, background: u.IsLocked ? 'rgba(252,129,129,0.12)' : 'rgba(104,211,145,0.12)', color: u.IsLocked ? '#FC8181' : '#68D391', fontFamily: "'Rajdhani',sans-serif" }}>
                        {u.IsLocked ? t('KHÓA','LOCKED') : t('HOẠT ĐỘNG','ACTIVE')}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700,
                        background: u.IsActivated !== false ? 'rgba(104,211,145,0.12)' : 'rgba(246,173,85,0.12)',
                        color: u.IsActivated !== false ? '#68D391' : '#F6AD55',
                        fontFamily: "'Rajdhani',sans-serif" }}>
                        {u.IsActivated !== false ? t('ĐÃ KÍCH HOẠT','ACTIVATED') : t('CHỮA','PENDING')}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => toggleLock(u)}
                          style={{ padding: '5px 10px', borderRadius: 7, background: u.IsLocked ? 'rgba(104,211,145,0.1)' : 'rgba(252,129,129,0.1)', border: `1px solid ${u.IsLocked ? 'rgba(104,211,145,0.3)' : 'rgba(252,129,129,0.3)'}`, color: u.IsLocked ? '#68D391' : '#FC8181', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                          <MS icon={u.IsLocked ? "lock_open" : "lock"} size={13} />{u.IsLocked ? t('MỞ KHÓA','UNLOCK') : t('KHÓA','LOCK')}
                        </button>
                        <button onClick={() => resetPwd(u)}
                          style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', color: '#A78BFA', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                          <MS icon="key" size={13} />RESET MK
                        </button>
                        {u.IsActivated === false && u.Email && (
                          <button onClick={() => resendActivation(u)}
                            style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', color: '#22D3EE', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                            <MS icon="send" size={13} />{t('GỬI LẠI LINK','RESEND LINK')}
                          </button>
                        )}
                        {u.Role?.toLowerCase() !== 'admin' && (
                          <button onClick={() => deleteUser(u)}
                            style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                            <MS icon="delete" size={13} />{t('XÓA','DELETE')}
                          </button>
                        )}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false) }}>
          <div style={{ background: c.surfaceCard, border: '1px solid rgba(252,129,129,0.3)', borderRadius: 18, padding: '2rem', width: 460, maxWidth: '95vw', boxShadow: dark ? '0 32px 80px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.08)', animation: 'slide-in 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 20, borderRadius: 2, background: '#FC8181' }} />
                <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.2rem', fontWeight: 700, margin: 0, letterSpacing: '0.08em', color: c.onSurface }}>{t('TẠO TÀI KHOẢN MỚI','CREATE NEW ACCOUNT')}</h2>
              </div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'rgba(252,129,129,0.08)', border: '1px solid rgba(252,129,129,0.2)', borderRadius: 8, cursor: 'pointer', color: '#FC8181', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={labelStyle}>Username *</label>
                <input value={form.Username} onChange={e => setForm(f => ({ ...f, Username: e.target.value }))} placeholder="vd. captain02" style={inputStyle} className="nexora-input" /></div>
              <div><label style={labelStyle}>{t('Họ Tên','Full Name')} *</label>
                <input value={form.FullName} onChange={e => setForm(f => ({ ...f, FullName: e.target.value }))} placeholder="vd. Nguyễn Văn A" style={inputStyle} className="nexora-input" /></div>
              <div><label style={labelStyle}>Email</label>
                <input value={form.Email} onChange={e => setForm(f => ({ ...f, Email: e.target.value }))} type="email" placeholder="vd. captain@etms.vn" style={inputStyle} className="nexora-input" /></div>
              <div><label style={labelStyle}>{t('Vai Trò','Role')}</label>
                <select value={form.Role} onChange={e => setForm(f => ({ ...f, Role: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }} className="nexora-input">
                  <option value="Admin">Admin</option>
                  <option value="Captain">Captain</option>
                  <option value="Player">Player</option>
                </select></div>
              {err && <p style={{ color: '#FC8181', fontSize: '0.8rem', margin: 0 }}>{err}</p>}
              <p style={{ margin: 0, fontSize: '0.78rem', color: c.onSurfaceVar }}>{t('Mật khẩu mặc định:','Default password:')} <code style={{ color: '#A78BFA', fontFamily: "'JetBrains Mono',monospace", background: 'rgba(124,58,237,0.1)', padding: '1px 6px', borderRadius: 4 }}>admin</code></p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => setShowCreate(false)} style={{ padding: '10px 20px', borderRadius: 9, background: 'transparent', border: `1px solid ${c.panelBorder}`, color: c.onSurfaceVar, cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em' }}>{t('HỦY','CANCEL')}</button>
                <button onClick={handleCreate} disabled={submitting} className="nexora-btn-primary" style={{ padding: '10px 24px', borderRadius: 9, fontSize: '0.9rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.08em' }}>
                  {submitting ? `⏳ ${t('Đang tạo...','Creating...')}` : t('TẠO TÀI KHOẢN','CREATE ACCOUNT')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
