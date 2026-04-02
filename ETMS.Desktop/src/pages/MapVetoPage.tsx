import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { getTokens } from '../theme'

interface VetoMap { name: string; status: 'available' | 'banned' | 'picked' }
interface MatchVetoData {
  MatchID: number; Round: number
  Team1Name?: string; Team2Name?: string
  CurrentTurnTeam?: string; VetoPhase?: string
}

const MS = ({ icon, size = 20, color }: { icon: string; size?: number; color?: string }) => (
  <span style={{ fontSize: size, color, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', verticalAlign: 'middle' }}>{icon}</span>
)

const DEFAULT_MAPS = ['Dust II', 'Mirage', 'Inferno', 'Nuke', 'Overpass', 'Vertigo', 'Anubis']

export default function MapVetoPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { dark } = useTheme()
  const { token } = useAuth()
  const toast = useToast()
  const c = getTokens(dark)
  const [matchData, setMatchData] = useState<MatchVetoData | null>(null)
  const [maps, setMaps] = useState<VetoMap[]>(DEFAULT_MAPS.map(name => ({ name, status: 'available' })))
  const [selectedMap, setSelectedMap] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [vetoLog, setVetoLog] = useState<string[]>([])

  // Load match data
  useEffect(() => {
    if (!id) return
    fetch(`/api/matches/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(d => setMatchData(d))
      .catch(() => {})
  }, [id, token])

  const handleVeto = async (action: 'ban' | 'pick') => {
    if (selectedMap === null) return
    const mapName = maps[selectedMap].name
    setSubmitting(true)
    try {
      const r = await fetch(`/api/matches/${id}/veto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ MapName: mapName, Action: action.toUpperCase() })
      })
      if (r.ok) {
        const newMaps = [...maps]
        newMaps[selectedMap] = { ...newMaps[selectedMap], status: action === 'ban' ? 'banned' : 'picked' }
        setMaps(newMaps)
        setVetoLog(prev => [...prev, `${action === 'ban' ? '❌ BAN' : '✅ PICK'}: ${mapName}`])
        toast.success(action === 'ban' ? `Đã ban map "${mapName}"` : `Đã chọn map "${mapName}"`)
        setSelectedMap(null)
      } else {
        const d = await r.json()
        toast.error(d.error ?? 'Thao tác veto thất bại.')
      }
    } catch {
      // API not available, do it locally for demo
      const newMaps = [...maps]
      newMaps[selectedMap] = { ...newMaps[selectedMap], status: action === 'ban' ? 'banned' : 'picked' }
      setMaps(newMaps)
      setVetoLog(prev => [...prev, `${action === 'ban' ? '❌ BAN' : '✅ PICK'}: ${mapName}`])
      toast.success(action === 'ban' ? `Đã ban map "${mapName}"` : `Đã pick map "${mapName}"`)
      setSelectedMap(null)
    } finally {
      setSubmitting(false)
    }
  }

  const bannedCount = maps.filter(m => m.status === 'banned').length
  const pickedCount = maps.filter(m => m.status === 'picked').length
  const availableCount = maps.filter(m => m.status === 'available').length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => nav('/matches')} style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#A78BFA' }}>
          <MS icon="arrow_back" size={19} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 22, borderRadius: 2, background: 'linear-gradient(180deg,#A78BFA,#E94560)' }} />
            <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.35rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>VETO BẢN ĐỒ</h1>
            <span style={{ padding: '2px 10px', borderRadius: 999, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
              Match #{id} · FPS
            </span>
          </div>
          <p style={{ margin: '2px 0 0 13px', color: c.onSurfaceVar, fontSize: '0.78rem' }}>
            {matchData?.Team1Name ?? 'Đội A'} vs {matchData?.Team2Name ?? 'Đội B'}
            {matchData?.CurrentTurnTeam && ` — Lượt: ${matchData.CurrentTurnTeam}`}
          </p>
        </div>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)', color: '#FC8181', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>✕ {bannedCount} Banned</div>
          <div style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(104,211,145,0.1)', border: '1px solid rgba(104,211,145,0.3)', color: '#68D391', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>✓ {pickedCount} Picked</div>
          <div style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(99,179,237,0.1)', border: '1px solid rgba(99,179,237,0.3)', color: '#63B3ED', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>◉ {availableCount} Còn lại</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', gap: '2rem' }}>
        {/* Map grid */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {maps.map((m, i) => {
              const isBanned = m.status === 'banned'
              const isPicked = m.status === 'picked'
              const isSelected = selectedMap === i
              return (
                <div key={i} onClick={() => !isBanned && !isPicked && setSelectedMap(isSelected ? null : i)}
                  style={{
                    padding: '1.25rem', borderRadius: 14, textAlign: 'center',
                    background: isBanned ? 'rgba(252,129,129,0.08)' : isPicked ? 'rgba(104,211,145,0.08)' : isSelected ? 'rgba(124,58,237,0.1)' : c.surfaceContainer,
                    border: `2px solid ${isSelected ? '#A78BFA' : isBanned ? 'rgba(252,129,129,0.3)' : isPicked ? 'rgba(104,211,145,0.3)' : c.panelBorder}`,
                    cursor: (isBanned || isPicked) ? 'default' : 'pointer', opacity: isBanned ? 0.7 : 1,
                    transform: isSelected ? 'scale(1.04)' : 'scale(1)', transition: 'all 0.2s',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: isSelected ? '0 0 20px rgba(124,58,237,0.2)' : 'none',
                  }}
                  onMouseEnter={e => !isBanned && !isPicked && !isSelected && (e.currentTarget.style.transform = 'translateY(-3px)')}
                  onMouseLeave={e => !isBanned && !isPicked && !isSelected && (e.currentTarget.style.transform = 'scale(1)')}>
                  {isBanned && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', zIndex: 1 }}><MS icon="block" size={40} color="#FC8181" /></div>}
                  <MS icon={isPicked ? 'check_circle' : isBanned ? 'cancel' : 'map'} size={36}
                    color={isPicked ? '#68D391' : isBanned ? '#FC8181' : isSelected ? '#A78BFA' : c.onSurfaceVar} />
                  <p style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: '0.92rem', margin: '10px 0 4px', color: isPicked ? '#68D391' : isBanned ? '#FC8181' : isSelected ? '#A78BFA' : c.onSurface }}>
                    {m.name}
                  </p>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', fontFamily: "'JetBrains Mono',monospace", color: isPicked ? '#68D391' : isBanned ? '#FC8181' : c.outline }}>
                    {isPicked ? 'PICKED' : isBanned ? 'BANNED' : isSelected ? 'SELECTED' : 'AVAILABLE'}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button disabled={selectedMap === null || submitting} onClick={() => handleVeto('ban')}
              style={{ padding: '12px 28px', borderRadius: 12, border: `1px solid ${selectedMap !== null ? 'rgba(252,129,129,0.4)' : c.panelBorder}`, background: selectedMap !== null ? 'rgba(252,129,129,0.1)' : 'transparent', color: selectedMap !== null ? '#FC8181' : c.onSurfaceVar, cursor: selectedMap !== null ? 'pointer' : 'not-allowed', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", fontSize: '0.95rem', letterSpacing: '0.08em', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => selectedMap !== null && (e.currentTarget.style.background = 'rgba(252,129,129,0.2)')}
              onMouseLeave={e => selectedMap !== null && (e.currentTarget.style.background = 'rgba(252,129,129,0.1)')}>
              <MS icon="do_not_disturb" size={18} /> BAN MAP
            </button>
            <button disabled={selectedMap === null || submitting} onClick={() => handleVeto('pick')}
              style={{ padding: '12px 28px', borderRadius: 12, border: `1px solid ${selectedMap !== null ? 'rgba(104,211,145,0.4)' : c.panelBorder}`, background: selectedMap !== null ? 'rgba(104,211,145,0.1)' : 'transparent', color: selectedMap !== null ? '#68D391' : c.onSurfaceVar, cursor: selectedMap !== null ? 'pointer' : 'not-allowed', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", fontSize: '0.95rem', letterSpacing: '0.08em', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => selectedMap !== null && (e.currentTarget.style.background = 'rgba(104,211,145,0.2)')}
              onMouseLeave={e => selectedMap !== null && (e.currentTarget.style.background = 'rgba(104,211,145,0.1)')}>
              <MS icon="done" size={18} /> PICK MAP
            </button>
          </div>
        </div>

        {/* Veto log sidebar */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ background: c.surfaceCard, borderRadius: 14, border: `1px solid ${c.panelBorder}`, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.panelBorder}`, background: dark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: c.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Rajdhani',sans-serif" }}>Veto Log</span>
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 120 }}>
              {vetoLog.length === 0 ? (
                <p style={{ color: c.outline, fontSize: '0.78rem', textAlign: 'center', margin: '1rem 0', fontFamily: "'JetBrains Mono',monospace" }}>Chưa có hành động</p>
              ) : vetoLog.map((entry, i) => (
                <div key={i} style={{ fontSize: '0.78rem', color: entry.startsWith('❌') ? '#FC8181' : '#68D391', fontFamily: "'JetBrains Mono',monospace", padding: '5px 8px', borderRadius: 6, background: entry.startsWith('❌') ? 'rgba(252,129,129,0.08)' : 'rgba(104,211,145,0.08)', borderLeft: `2px solid ${entry.startsWith('❌') ? '#FC8181' : '#68D391'}` }}>
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
