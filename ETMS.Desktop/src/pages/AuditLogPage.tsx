import { useTheme } from '../contexts/ThemeContext'
import { getTokens } from '../theme'

const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none' }}>{icon}</span>
)

// Mock data để demo giao diện — sẽ thay bằng API thật khi endpoint AuditLog hoàn thiện
const MOCK = [
  { id: 1, action: 'LOGIN',           user: 'admin',    detail: 'Đăng nhập thành công',             at: new Date(Date.now() - 300000).toISOString()  },
  { id: 2, action: 'CREATE_TOURNAMENT',user: 'admin',  detail: 'Tạo giải đấu "ETMS Open Cup 2025"', at: new Date(Date.now() - 600000).toISOString()  },
  { id: 3, action: 'APPROVE_TEAM',    user: 'admin',    detail: 'Duyệt đội "Alpha Wolves"',          at: new Date(Date.now() - 900000).toISOString()  },
  { id: 4, action: 'RESOLVE_DISPUTE', user: 'admin',    detail: 'Giải quyết khiếu nại #3',           at: new Date(Date.now() - 1200000).toISOString() },
  { id: 5, action: 'RESET_PASSWORD',  user: 'admin',    detail: 'Reset mật khẩu user player01',      at: new Date(Date.now() - 1800000).toISOString() },
]

const ACTION_ICONS: Record<string, string> = {
  LOGIN: 'login', LOGOUT: 'logout',
  CREATE_TOURNAMENT: 'emoji_events', APPROVE_TEAM: 'how_to_reg',
  RESOLVE_DISPUTE: 'gavel', REJECT_DISPUTE: 'gavel',
  RESET_PASSWORD: 'key', LOCK_USER: 'lock', UNLOCK_USER: 'lock_open',
  CREATE_USER: 'person_add',
}

export default function AuditLogPage() {
  const { dark } = useTheme()
  const c = getTokens(dark)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>📋 Audit Log</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.78rem', color: c.onSurfaceVar, background: `${c.primary}15`, border: `1px solid ${c.primary}30`, padding: '4px 12px', borderRadius: 999 }}>
            API endpoint sẽ hoàn thiện Sprint 3
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {/* Timeline */}
        {MOCK.map((log, idx) => (
          <div key={log.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {/* Timeline line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${c.primary}16`, border: `1px solid ${c.primary}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.primary, flexShrink: 0 }}>
                <MS icon={ACTION_ICONS[log.action] ?? 'history'} size={17} />
              </div>
              {idx < MOCK.length - 1 && <div style={{ width: 1, height: 24, background: c.panelBorder, marginTop: 4 }} />}
            </div>
            {/* Content */}
            <div style={{ flex: 1, background: c.surfaceCard, border: `1px solid ${c.panelBorder}`, borderRadius: 10, padding: '0.9rem 1.1rem', marginBottom: 4, backdropFilter: 'blur(6px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: c.primary, fontFamily: 'monospace', letterSpacing: '0.04em' }}>{log.action}</span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: c.onSurface }}>{log.detail}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: c.onSurfaceVar }}>{log.user}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: c.outline }}>{new Date(log.at).toLocaleString('vi-VN')}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Placeholder note */}
        <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', borderRadius: 10, background: dark ? 'rgba(96,165,250,0.07)' : 'rgba(29,78,216,0.05)', border: `1px solid ${c.infoText}30`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <MS icon="info" size={18} />
          <p style={{ margin: 0, fontSize: '0.82rem', color: c.infoText, lineHeight: 1.6 }}>
            Audit log hiện đang hiển thị dữ liệu demo. Khi endpoint <code style={{ background: c.surfaceContainer, padding: '1px 6px', borderRadius: 4 }}>/api/audit-log</code> hoàn thiện, dữ liệu sẽ tự động cập nhật.
          </p>
        </div>
      </div>
    </div>
  )
}
