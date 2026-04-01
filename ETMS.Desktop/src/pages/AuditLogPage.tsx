import { useTheme } from '../contexts/ThemeContext'
import { getTokens } from '../theme'

const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)

// Mock data — will be replaced with real API when /api/audit-log is ready (Sprint 3)
const MOCK = [
  { id: 1, action: 'LOGIN',             user: 'admin',   detail: 'Đăng nhập hệ thống thành công',          at: new Date(Date.now() - 300000).toISOString()  },
  { id: 2, action: 'CREATE_TOURNAMENT', user: 'admin',   detail: 'Tạo giải đấu "NEXORA Open Cup 2025"',    at: new Date(Date.now() - 600000).toISOString()  },
  { id: 3, action: 'APPROVE_TEAM',      user: 'admin',   detail: 'Duyệt đội "Alpha Wolves" vào giải #1',  at: new Date(Date.now() - 900000).toISOString()  },
  { id: 4, action: 'RESOLVE_DISPUTE',   user: 'admin',   detail: 'Giải quyết khiếu nại #3 — Accepted',    at: new Date(Date.now() - 1200000).toISOString() },
  { id: 5, action: 'RESET_PASSWORD',    user: 'admin',   detail: 'Reset mật khẩu user "player01" → admin', at: new Date(Date.now() - 1800000).toISOString() },
  { id: 6, action: 'ADVANCE_STATUS',    user: 'admin',   detail: 'Giải #1: Draft → Registration',          at: new Date(Date.now() - 2400000).toISOString() },
  { id: 7, action: 'CREATE_USER',       user: 'admin',   detail: 'Tạo tài khoản mới: "captain02"',         at: new Date(Date.now() - 3600000).toISOString() },
]

const ACTION_ICONS: Record<string, string> = {
  LOGIN: 'login', LOGOUT: 'logout',
  CREATE_TOURNAMENT: 'emoji_events', ADVANCE_STATUS: 'upgrade',
  APPROVE_TEAM: 'how_to_reg', REJECT_TEAM: 'cancel',
  RESOLVE_DISPUTE: 'gavel', REJECT_DISPUTE: 'gavel',
  DISMISS_DISPUTE: 'block',
  RESET_PASSWORD: 'key', LOCK_USER: 'lock', UNLOCK_USER: 'lock_open',
  CREATE_USER: 'person_add',
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN: '#68D391', LOGOUT: '#FC8181',
  CREATE_TOURNAMENT: '#A78BFA', ADVANCE_STATUS: '#06B6D4',
  APPROVE_TEAM: '#68D391', REJECT_TEAM: '#FC8181',
  RESOLVE_DISPUTE: '#68D391', REJECT_DISPUTE: '#FC8181', DISMISS_DISPUTE: '#FC8181',
  RESET_PASSWORD: '#F6AD55', LOCK_USER: '#FC8181', UNLOCK_USER: '#68D391',
  CREATE_USER: '#63B3ED',
}

export default function AuditLogPage() {
  const { dark } = useTheme()
  const c = getTokens(dark)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>

      {/* Header */}
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 24, borderRadius: 2, background: 'linear-gradient(180deg,#63B3ED,#A78BFA)' }} />
          <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.4rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>AUDIT LOG</h1>
          <span style={{ padding: '2px 10px', borderRadius: 999, background: 'rgba(99,179,237,0.12)', border: '1px solid rgba(99,179,237,0.3)', color: '#63B3ED', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{MOCK.length} entries</span>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#63B3ED', background: 'rgba(99,179,237,0.08)', border: '1px solid rgba(99,179,237,0.2)', padding: '4px 12px', borderRadius: 999, fontFamily: "'JetBrains Mono',monospace" }}>
          API endpoint → Sprint 3
        </span>
      </div>

      {/* Timeline */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {MOCK.map((log, idx) => {
          const color = ACTION_COLORS[log.action] ?? '#A78BFA'
          return (
            <div key={log.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              {/* Timeline indicator */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 6 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 8px ${color}20` }}>
                  <span style={{ fontSize: 16, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", color, lineHeight: 1 }}>
                    {ACTION_ICONS[log.action] ?? 'history'}
                  </span>
                </div>
                {idx < MOCK.length - 1 && (
                  <div style={{ width: 1, flex: 1, minHeight: 16, background: `linear-gradient(180deg,${color}40,transparent)`, marginTop: 4 }} />
                )}
              </div>

              {/* Log card */}
              <div className="nexora-card" style={{ flex: 1, background: 'rgba(22,27,34,0.9)', border: `1px solid rgba(45,55,72,0.5)`, borderRadius: 12, padding: '0.9rem 1.1rem', marginBottom: 8, backdropFilter: 'blur(6px)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: `linear-gradient(180deg,${color},transparent)`, borderRadius: '12px 0 0 12px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ paddingLeft: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.78rem', color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.06em' }}>{log.action}</span>
                    <p style={{ margin: '5px 0 0', fontSize: '0.875rem', color: c.onSurfaceVar, lineHeight: 1.55 }}>{log.detail}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: c.onSurface, fontFamily: "'JetBrains Mono',monospace" }}>{log.user}</p>
                    <p style={{ margin: '3px 0 0', fontSize: '0.68rem', color: c.outline, fontFamily: "'JetBrains Mono',monospace" }}>
                      {new Date(log.at).toLocaleString('vi-VN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Info banner */}
        <div style={{ marginTop: '0.5rem', padding: '1rem 1.25rem', borderRadius: 12, background: 'rgba(99,179,237,0.06)', border: '1px solid rgba(99,179,237,0.2)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <MS icon="info" size={18} />
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#63B3ED', lineHeight: 1.65 }}>
            Audit log đang hiển thị dữ liệu demo. Khi endpoint{' '}
            <code style={{ background: 'rgba(99,179,237,0.1)', padding: '1px 8px', borderRadius: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.78rem', color: '#A78BFA' }}>/api/audit-log</code>{' '}
            hoàn thiện, hệ thống sẽ hiển thị dữ liệu thực.
          </p>
        </div>
      </div>
    </div>
  )
}
