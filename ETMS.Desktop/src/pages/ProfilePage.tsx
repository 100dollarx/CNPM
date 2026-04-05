import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens } from '../theme'
import { useToast } from '../contexts/ToastContext'
import { useLang } from '../contexts/LangContext'

const MS = ({ icon, size = 20 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)

interface Profile {
  UserID: number; Username: string; FullName: string; Email?: string;
  Phone?: string; Role: string; IsLocked: boolean; IsActivated: boolean;
}

export default function ProfilePage() {
  const { token } = useAuth()
  const { dark } = useTheme()
  const c = getTokens(dark)
  const toast = useToast()
  const { t } = useLang()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Edit fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')

  const headers = () => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) })

  const loadProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/profile', { headers: headers() })
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setFullName(data.FullName ?? '')
        setEmail(data.Email ?? '')
        setPhone(data.Phone ?? '')
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { loadProfile() }, [token])

  const handleSave = async () => {
    if (!fullName.trim()) { toast.error(t('Họ tên không được trống.', 'Full name is required.')); return }
    setSaving(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH', headers: headers(),
        body: JSON.stringify({ FullName: fullName.trim(), Email: email.trim() || null, Phone: phone.trim() || null }),
      })
      const data = await res.json()
      if (res.ok) { toast.success(data.message ?? t('Đã lưu!', 'Saved!')); loadProfile() }
      else toast.error(data.error ?? t('Lưu thất bại.', 'Save failed.'))
    } catch { toast.error(t('Không kết nối được server.', 'Connection failed.')) }
    finally { setSaving(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: c.inputBg, border: `1px solid ${c.panelBorder}`,
    borderRadius: 10, padding: '12px 14px', color: c.onSurface, fontSize: '0.9rem',
    fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem', fontWeight: 700, color: c.onSurfaceVar, textTransform: 'uppercase',
    letterSpacing: '0.1em', display: 'block', marginBottom: 6,
  }

  const roleColors: Record<string, string> = { Admin: '#FC8181', Captain: '#F6AD55', Player: '#63B3ED' }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 3, height: 24, borderRadius: 2, background: 'linear-gradient(180deg,#A78BFA,#E94560)' }} />
        <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.3rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>
          {t('THÔNG TIN CÁ NHÂN', 'MY PROFILE')}
        </h1>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem', display: 'flex', justifyContent: 'center' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.onSurfaceVar }}>
            <MS icon="hourglass_top" /> {t('Đang tải...', 'Loading...')}
          </div>
        ) : profile ? (
          <div style={{ width: 520, maxWidth: '100%' }}>
            {/* Avatar + Username Card */}
            <div style={{
              background: c.surfaceCard, border: `1px solid ${c.panelBorder}`, borderRadius: 16,
              padding: '2rem', marginBottom: '1.5rem', textAlign: 'center',
              boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 16, margin: '0 auto 12px',
                background: 'linear-gradient(135deg,#E94560,#7C3AED)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', fontWeight: 800, color: '#fff',
                boxShadow: '0 0 24px rgba(233,69,96,0.4)',
              }}>
                {profile.FullName?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px', color: c.onSurface }}>
                {profile.Username}
              </h2>
              <span style={{
                display: 'inline-block', padding: '3px 12px', borderRadius: 999,
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
                background: `${roleColors[profile.Role] ?? '#8B9AB5'}18`,
                color: roleColors[profile.Role] ?? '#8B9AB5',
                fontFamily: "'Rajdhani',sans-serif",
              }}>
                {profile.Role?.toUpperCase()}
              </span>
              <span style={{
                display: 'inline-block', marginLeft: 8, padding: '3px 10px', borderRadius: 999,
                fontSize: '0.68rem', fontWeight: 700,
                background: profile.IsActivated ? 'rgba(104,211,145,0.12)' : 'rgba(246,173,85,0.12)',
                color: profile.IsActivated ? '#68D391' : '#F6AD55',
                fontFamily: "'Rajdhani',sans-serif",
              }}>
                {profile.IsActivated ? t('ĐÃ KÍCH HOẠT', 'ACTIVATED') : t('CHƯA KÍCH HOẠT', 'PENDING')}
              </span>
            </div>

            {/* Edit Form */}
            <div style={{
              background: c.surfaceCard, border: `1px solid ${c.panelBorder}`, borderRadius: 16,
              padding: '2rem',
              boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
                <div style={{ width: 3, height: 18, borderRadius: 2, background: '#A78BFA' }} />
                <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1rem', fontWeight: 700, margin: 0, letterSpacing: '0.06em', color: c.onSurface }}>
                  {t('CHỈNH SỬA THÔNG TIN', 'EDIT INFORMATION')}
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <label style={labelStyle}>{t('Họ và Tên', 'Full Name')} *</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.onSurfaceVar, pointerEvents: 'none' }}><MS icon="badge" size={18} /></span>
                    <input value={fullName} onChange={e => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A" style={{ ...inputStyle, paddingLeft: 40 }} className="nexora-input" />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Email</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.onSurfaceVar, pointerEvents: 'none' }}><MS icon="email" size={18} /></span>
                    <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                      placeholder="user@email.com" style={{ ...inputStyle, paddingLeft: 40 }} className="nexora-input" />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>{t('Số Điện Thoại', 'Phone Number')}</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.onSurfaceVar, pointerEvents: 'none' }}><MS icon="phone" size={18} /></span>
                    <input value={phone} onChange={e => setPhone(e.target.value)} type="tel"
                      placeholder="0901234567" style={{ ...inputStyle, paddingLeft: 40 }} className="nexora-input" />
                  </div>
                </div>

                <button onClick={handleSave} disabled={saving} className="nexora-btn-primary"
                  style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: '0.95rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.08em', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {saving ? t('Đang lưu...', 'Saving...') : <><MS icon="save" size={18} />{t('LƯU THAY ĐỔI', 'SAVE CHANGES')}</>}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: '#FC8181' }}>{t('Không tải được thông tin.', 'Failed to load profile.')}</div>
        )}
      </div>
    </div>
  )
}
