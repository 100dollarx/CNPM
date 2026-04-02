import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getTokens } from '../theme'

interface AuditLog { LogID: number; Action: string; Username: string; Detail: string; CreatedAt: string }

const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)

const ACTION_ICONS: Record<string, string> = {
  LOGIN: 'login', LOGOUT: 'logout',
  CREATE_TOURNAMENT: 'emoji_events', ADVANCE_STATUS: 'upgrade',
  APPROVE_TEAM: 'how_to_reg', REJECT_TEAM: 'cancel',
  RESOLVE_DISPUTE: 'gavel', DISMISS_DISPUTE: 'block',
  RESET_PASSWORD: 'key', LOCK_USER: 'lock', UNLOCK_USER: 'lock_open',
  CREATE_USER: 'person_add', GENERATE_BRACKET: 'account_tree',
  SUBMIT_RESULT: 'scoreboard', VERIFY_RESULT: 'verified',
}
const ACTION_COLORS: Record<string, string> = {
  LOGIN: '#68D391', LOGOUT: '#FC8181',
  CREATE_TOURNAMENT: '#A78BFA', ADVANCE_STATUS: '#06B6D4',
  APPROVE_TEAM: '#68D391', REJECT_TEAM: '#FC8181',
  RESOLVE_DISPUTE: '#68D391', DISMISS_DISPUTE: '#FC8181',
  RESET_PASSWORD: '#F6AD55', LOCK_USER: '#FC8181', UNLOCK_USER: '#68D391',
  CREATE_USER: '#63B3ED', GENERATE_BRACKET: '#A78BFA',
  SUBMIT_RESULT: '#F6AD55', VERIFY_RESULT: '#68D391',
}

export default function AuditLogPage() {
  const { token } = useAuth()
  const { dark } = useTheme()
  const c = getTokens(dark)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('all')

  useEffect(() => {
    setLoading(true)
    fetch('/api/audit-log', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(d => setLogs(d.data ?? []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [token])

  const filtered = logs.filter(l => {
    const matchSearch = !search ||
      l.Action?.toLowerCase().includes(search.toLowerCase()) ||
      l.Username?.toLowerCase().includes(search.toLowerCase()) ||
      l.Detail?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filterAction === 'all' || l.Action === filterAction
    return matchSearch && matchFilter
  })

  const inputStyle: React.CSSProperties = {
    background: c.inputBg, border: `1px solid ${c.panelBorder}`,
    borderRadius: 8, padding: '8px 12px', color: c.onSurface,
    fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none',
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>

      {/* Header */}
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 24, borderRadius: 2, background: 'linear-gradient(180deg,#63B3ED,#A78BFA)' }} />
          <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.4rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>AUDIT LOG</h1>
          <span style={{ padding: '2px 10px', borderRadius: 999, background: 'rgba(99,179,237,0.12)', border: '1px solid rgba(99,179,237,0.3)', color: '#63B3ED', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
            {filtered.length} entries
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.onSurfaceVar, pointerEvents: 'none' }}><MS icon="search" /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm action, user..."
              className="nexora-input" style={{ ...inputStyle, width: 200, paddingLeft: 36 }} />
          </div>
          {/* Action filter */}
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer', minWidth: 160 }}>
            <option value="all">Tất cả action</option>
            {['LOGIN', 'CREATE_TOURNAMENT', 'APPROVE_TEAM', 'REJECT_TEAM', 'GENERATE_BRACKET',
              'RESOLVE_DISPUTE', 'SUBMIT_RESULT', 'VERIFY_RESULT', 'CREATE_USER',
              'RESET_PASSWORD', 'LOCK_USER', 'UNLOCK_USER'].map(a =>
              <option key={a} value={a}>{a}</option>
            )}
          </select>
          {/* Refresh */}
          <button onClick={() => {
            setLoading(true)
            fetch('/api/audit-log', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
              .then(r => r.json()).then(d => setLogs(d.data ?? [])).catch(() => {}).finally(() => setLoading(false))
          }} style={{ padding: '8px 14px', borderRadius: 8, background: c.surfaceContainer, border: `1px solid ${c.panelBorder}`, color: c.onSurfaceVar, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,179,237,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = c.surfaceContainer}>
            <MS icon="refresh" size={16} /> Làm mới
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 70, background: dark ? 'rgba(22,27,34,0.9)' : '#F5F5F5', borderRadius: 12, animation: 'neon-pulse 2s ease-in-out infinite', marginBottom: 6 }} />
          ))
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: c.onSurfaceVar }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(99,179,237,0.08)', border: '1px solid rgba(99,179,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MS icon="history" size={36} />
            </div>
            <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1rem', letterSpacing: '0.05em' }}>Chưa có log nào.</p>
          </div>
        ) : filtered.map((log, idx) => {
          const color = ACTION_COLORS[log.Action] ?? '#A78BFA'
          return (
            <div key={log.LogID ?? idx} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              {/* Timeline dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 6 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 8px ${color}20` }}>
                  <span style={{ fontSize: 16, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", color, lineHeight: 1 }}>
                    {ACTION_ICONS[log.Action] ?? 'history'}
                  </span>
                </div>
                {idx < filtered.length - 1 && (
                  <div style={{ width: 1, flex: 1, minHeight: 16, background: `linear-gradient(180deg,${color}40,transparent)`, marginTop: 4 }} />
                )}
              </div>

              {/* Log card */}
              <div className="nexora-card" style={{ flex: 1, background: dark ? 'rgba(22,27,34,0.90)' : '#FAFAFA', border: `1px solid ${dark ? 'rgba(45,55,72,0.5)' : c.panelBorder}`, borderRadius: 12, padding: '0.9rem 1.1rem', marginBottom: 8, backdropFilter: 'blur(6px)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: `linear-gradient(180deg,${color},transparent)`, borderRadius: '12px 0 0 12px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ paddingLeft: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.78rem', color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.06em' }}>{log.Action}</span>
                    <p style={{ margin: '5px 0 0', fontSize: '0.875rem', color: c.onSurfaceVar, lineHeight: 1.55 }}>{log.Detail}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: c.onSurface, fontFamily: "'JetBrains Mono',monospace" }}>{log.Username}</p>
                    <p style={{ margin: '3px 0 0', fontSize: '0.68rem', color: c.outline, fontFamily: "'JetBrains Mono',monospace" }}>
                      {log.CreatedAt ? new Date(log.CreatedAt).toLocaleString('vi-VN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
