import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { useLang } from '../contexts/LangContext'
import { useNavigate } from 'react-router'
import { getTokens, statusColor, gameTypeColor } from '../theme'

interface Tournament { TournamentID: number; Name: string; GameType: string; GameName?: string; Format: string; Status: string; MaxTeams: number; MinPlayersPerTeam: number; StartDate: string }

const MS = ({ icon, size = 18 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)

const statusLabelsVI: Record<string, string> = { draft: 'BẢN NHÁP', registration: 'ĐĂNG KÝ', active: 'ĐANG DIỄN RA', completed: 'HOÀN THÀNH', cancelled: 'ĐÃ HỦY' }
const statusLabelsEN: Record<string, string> = { draft: 'DRAFT', registration: 'REGISTRATION', active: 'LIVE', completed: 'COMPLETED', cancelled: 'CANCELLED' }
const gameTypeIcon: Record<string, string> = { fps: 'crosshair', moba: 'groups', battleroyale: 'explore', fighting: 'sports_martial_arts', rts: 'account_tree', sports: 'sports_soccer' }
const formatLabels: Record<string, string> = { singleelimination: 'Single Elim', roundrobin: 'Round Robin', swiss: 'Swiss', battleroyale: 'Battle Royale' }

// Danh sách game nổi tiếng nhất 2024-2025 theo thể loại
const GAME_LIST: Record<string, { name: string; icon: string; color: string }[]> = {
  FPS: [
    { name: 'Valorant',      icon: '🔫', color: '#FF4655' },
    { name: 'CS2',           icon: '💣', color: '#F0A000' },
    { name: 'Apex Legends',  icon: '🎯', color: '#CD3333' },
    { name: 'Overwatch 2',   icon: '⚡', color: '#F99E1A' },
  ],
  MOBA: [
    { name: 'League of Legends', icon: '👑', color: '#C89B3C' },
    { name: 'Dota 2',            icon: '📦', color: '#D70E21' },
    { name: 'Liên Quân Mobile',   icon: '⚔️', color: '#7C3AED' },
    { name: 'Honor of Kings',    icon: '👸', color: '#F59E0B' },
  ],
  BattleRoyale: [
    { name: 'PUBG',              icon: '🌍', color: '#F6AD55' },
    { name: 'Free Fire',         icon: '💥', color: '#EF4444' },
    { name: 'Fortnite',          icon: '🛡️', color: '#3B82F6' },
    { name: 'Apex Legends',      icon: '🎯', color: '#CD3333' },
  ],
  Fighting: [
    { name: 'Tekken 8',          icon: '🥊', color: '#F97316' },
    { name: 'Street Fighter 6',  icon: '🔥', color: '#EF4444' },
    { name: 'Mortal Kombat 1',   icon: '💧', color: '#6B21A8' },
    { name: 'Guilty Gear Strive',icon: '🎼', color: '#0EA5E9' },
  ],
  RTS: [
    { name: 'StarCraft II',      icon: '🚀', color: '#3B82F6' },
    { name: 'Age of Empires IV', icon: '🏰', color: '#A16207' },
    { name: 'Warcraft III',      icon: '💫', color: '#7C3AED' },
    { name: 'Total War',         icon: '⚔️', color: '#64748B' },
  ],
  Sports: [
    { name: 'EA Sports FC 25',   icon: '⚽', color: '#16A34A' },
    { name: 'Rocket League',     icon: '🚗', color: '#0EA5E9' },
    { name: 'NBA 2K25',          icon: '🏀', color: '#F97316' },
    { name: 'eFootball 2025',    icon: '🥅', color: '#16A34A' },
  ],
}

// Design rules per GameType: min players, max teams, supported formats
const GAME_RULES: Record<string, { minPlayers: number; maxTeams: number; formats: string[]; teamSizes: string }> = {
  FPS:         { minPlayers: 5, maxTeams: 32,  formats: ['SingleElimination'], teamSizes: '5 người' },
  MOBA:        { minPlayers: 5, maxTeams: 32,  formats: ['SingleElimination'], teamSizes: '5-6 người' },
  BattleRoyale:{ minPlayers: 4, maxTeams: 100, formats: ['BattleRoyale'],      teamSizes: '4-8 người' },
  Fighting:    { minPlayers: 1, maxTeams: 64,  formats: ['SingleElimination'], teamSizes: '1 người (1v1)' },
  RTS:         { minPlayers: 1, maxTeams: 32,  formats: ['SingleElimination'], teamSizes: '1-2 người' },
  Sports:      { minPlayers: 1, maxTeams: 64,  formats: ['SingleElimination'], teamSizes: '1-11 người' },
}

export default function TournamentsPage() {
  const { token, isAdmin } = useAuth()
  const { dark } = useTheme()
  const { t, lang } = useLang()
  const toast = useToast()
  const c = getTokens(dark)
  const nav = useNavigate()
  const [list, setList] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ Name: '', GameType: 'FPS', GameName: 'Valorant', Format: 'SingleElimination', StartDate: '', MaxTeams: 16, MinPlayersPerTeam: 5 })
  const [submitting, setSubmitting] = useState(false)
  const [generatingId, setGeneratingId] = useState<number | null>(null)
  const [editTarget, setEditTarget] = useState<Tournament | null>(null)
  const [editForm, setEditForm]     = useState({ Name: '', GameType: 'FPS', Format: 'SingleElimination', StartDate: '' })
  const [editSubmitting, setEditSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/tournaments', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(d => setList(d.data ?? [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [token])

  const filtered = list.filter(t => {
    const matchStatus = filter === 'all' || t.Status?.toLowerCase() === filter
    const matchSearch = !search || t.Name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const handleCreate = async () => {
    if (!form.Name.trim()) { toast.error('Vui lòng nhập tên giải đấu.'); return }
    if (!form.GameName)    { toast.error('Vui lòng chọn game cụ thể.'); return }
    const rules = GAME_RULES[form.GameType]
    if (rules && form.MinPlayersPerTeam < rules.minPlayers)
      { toast.error(`${form.GameType} cần tối thiểu ${rules.minPlayers} thành viên/đội.`); return }
    if (rules && form.MaxTeams < 2)
      { toast.error('Giải đấu phải có ít nhất 2 đội.'); return }
    if (!form.StartDate)
      { toast.error('Vui lòng chọn ngày bắt đầu.'); return }
    setSubmitting(true)
    try {
      const payload = {
        Name:              form.Name.trim(),
        GameType:          form.GameType,
        GameName:          form.GameName,
        Format:            form.Format,
        StartDate:         new Date(form.StartDate).toISOString(),
        MaxTeams:          form.MaxTeams,
        MinPlayersPerTeam: form.MinPlayersPerTeam,
      }
      const r = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      })
      if (r.ok || r.status === 201) {
        setShowModal(false)
        setForm({ Name: '', GameType: 'FPS', GameName: 'Valorant', Format: 'SingleElimination', StartDate: '', MaxTeams: 16, MinPlayersPerTeam: 5 })
        load()
        toast.success('Đã tạo giải đấu thành công!')
      } else {
        const d = await r.json(); toast.error(d.error ?? 'Tạo giải thất bại.')
      }
    } catch { toast.error('Không thể kết nối máy chủ.') } finally { setSubmitting(false) }
  }

  const openEdit = (t: Tournament) => {
    setEditTarget(t)
    setEditForm({
      Name:      t.Name,
      GameType:  t.GameType ?? 'FPS',
      Format:    t.Format   ?? 'SingleElimination',
      StartDate: t.StartDate ? new Date(t.StartDate).toISOString().split('T')[0] : '',
    })
  }

  const handleEdit = async () => {
    if (!editTarget || !editForm.Name.trim()) return
    setEditSubmitting(true)
    try {
      const r = await fetch(`/api/tournaments/${editTarget.TournamentID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          Name:      editForm.Name,
          GameType:  editForm.GameType,
          Format:    editForm.Format,
          StartDate: editForm.StartDate || undefined,
        })
      })
      if (r.ok) { setEditTarget(null); load(); toast.success('Đã cập nhật giải đấu.') }
      else { const d = await r.json(); toast.error(d.error ?? 'Cập nhật thất bại.') }
    } catch { toast.error('Không thể kết nối máy chủ.') } finally { setEditSubmitting(false) }
  }


  const advanceStatus = async (id: number) => {
    const r = await fetch(`/api/tournaments/${id}/advance`, { method: 'PATCH', headers: token ? { Authorization: `Bearer ${token}` } : {} })
    if (r.ok) { toast.success('Đã chuyển trạng thái giải đấu.'); load() }
    else { const d = await r.json(); toast.error(d.error ?? 'Không thể chuyển trạng thái.') }
  }

  const generateBracket = async (id: number) => {
    if (!window.confirm('Xác nhận tạo bracket cho giải đấu này?')) return
    setGeneratingId(id)
    try {
      const r = await fetch(`/api/tournaments/${id}/generate-bracket`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} })
      const d = await r.json()
      if (r.ok) { toast.success(d.message ?? 'Tạo bracket thành công!'); load() }
      else toast.error(d.error ?? 'Không thể tạo bracket.')
    } catch { toast.error('Không thể kết nối máy chủ.') } finally { setGeneratingId(null) }
  }

  const cancelTournament = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn hủy giải đấu này? Hành động không thể hoàn tác.')) return
    try {
      const r = await fetch(`/api/tournaments/${id}/cancel`, { method: 'PATCH', headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (r.ok) { toast.success('Đã hủy giải đấu.'); load() }
      else { const d = await r.json(); toast.error(d.error ?? 'Không thể hủy giải đấu.') }
    } catch { toast.error('Không thể kết nối máy chủ.') }
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: c.inputBg, border: `1px solid ${c.panelBorder}`, borderRadius: 8, padding: '10px 12px', color: c.onSurface, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s' }
  const labelStyle: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 700, color: c.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }
  const statusLabels = lang === 'vi' ? statusLabelsVI : statusLabelsEN
  const statuses: [string,string][] = [
    ['all', t('Tất Cả','All')], ['draft', t('Bản Nháp','Draft')], ['registration', t('Đăng Ký','Registration')],
    ['active', 'Live'], ['completed', t('Hoàn Thành','Completed')]
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>

      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${c.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 24, borderRadius: 2, background: 'linear-gradient(180deg,#7C3AED,#06B6D4)' }} />
          <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.3rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>{t('QUẢN LÝ GIẢI ĐẤU','TOURNAMENT MANAGEMENT')}</h1>
          <span style={{ padding: '2px 10px', borderRadius: 999, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{list.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.onSurfaceVar, pointerEvents: 'none' }}><MS icon="search" /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Tìm giải đấu...','Search tournament...')} className="nexora-input"
              style={{ ...inputStyle, width: 220, paddingLeft: 36 }} />
          </div>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} className="nexora-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, fontSize: '0.875rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em' }}>
              <MS icon="add" /><span>{t('TẠO GIẢI ĐẤU','NEW TOURNAMENT')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ padding: '0.75rem 1.5rem', display: 'flex', gap: 6, borderBottom: `1px solid ${c.panelBorder}`, overflowX: 'auto' }}>
        {statuses.map(([v, l]) => {
          const sc = v !== 'all' ? statusColor(v, dark) : null
          return (
            <button key={v} onClick={() => setFilter(v)} style={{
              padding: '5px 16px', borderRadius: 999, border: filter === v ? `1px solid ${sc?.border ?? 'rgba(124,58,237,0.5)'}` : `1px solid ${c.panelBorder}`,
              background: filter === v ? (sc?.bg ?? 'rgba(124,58,237,0.12)') : 'transparent',
              color: filter === v ? (sc?.text ?? '#A78BFA') : c.onSurfaceVar,
              cursor: 'pointer', fontSize: '0.78rem', fontWeight: filter === v ? 700 : 400,
              fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.06em', whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}>{l}</button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 60, background: 'rgba(22,27,34,0.9)', borderRadius: 12, animation: 'neon-pulse 2s ease-in-out infinite' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: c.onSurfaceVar }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MS icon="emoji_events" size={36} />
            </div>
            <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1rem', letterSpacing: '0.05em' }}>Không có giải đấu nào.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 40 }} />
              <col />
              <col style={{ width: '14%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 50 }} />
              <col style={{ width: '9%' }} />
              {isAdmin && <col style={{ width: '22%' }} />}
            </colgroup>
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.panelBorder}` }}>
                {['#', t('Tên Giải Đấu','Tournament'), t('Thể Loại','Game'), t('Thể Thức','Format'), t('Trạng Thái','Status'), t('Đội','Teams'), t('Ngày Bắt Đầu','Start Date'), isAdmin ? t('Thao Tác','Actions') : ''].filter(Boolean).map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: c.onSurfaceVar, fontFamily: "'Rajdhani',sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tr, idx) => {
                const sc = statusColor(tr.Status, dark)
                const gtColor = gameTypeColor(tr.GameType)
                return (
                  <tr key={tr.TournamentID} style={{ borderBottom: `1px solid ${c.panelBorder}40`, transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px', color: c.onSurfaceVar, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem' }}>{String(idx + 1).padStart(2, '0')}</td>
                    <td style={{ padding: '12px', fontWeight: 600, color: c.onSurface, fontFamily: "'Exo 2',sans-serif", fontSize: '0.9rem', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tr.Name}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: gtColor }}>
                          <span style={{ fontSize: 14, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1 }}>
                            {gameTypeIcon[tr.GameType?.toLowerCase()] ?? 'sports_esports'}
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{tr.GameType}</span>
                        </span>
                        {tr.GameName && <span style={{ fontSize: '0.72rem', color: c.onSurfaceVar, paddingLeft: 20, fontFamily: "'JetBrains Mono',monospace" }}>{tr.GameName}</span>}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: c.onSurfaceVar, fontSize: '0.8rem' }}>{formatLabels[tr.Format?.toLowerCase()] ?? tr.Format}</td>
                    <td style={{ padding: '12px' }}>
                      {/* ── STATUS BADGE ─ inline-flex prevents live-dot from jumping row height ── */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 999,
                        fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.07em',
                        background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                        fontFamily: "'Exo 2',sans-serif",
                        lineHeight: 1, whiteSpace: 'nowrap',
                      }}>
                        {tr.Status?.toLowerCase() === 'active' && (
                          <span style={{
                            display: 'block', width: 6, height: 6, borderRadius: '50%',
                            background: 'currentColor', flexShrink: 0,
                            animation: 'live-blink 1s ease-in-out infinite',
                            boxShadow: '0 0 5px currentColor',
                          }} />
                        )}
                        {statusLabels[tr.Status?.toLowerCase()] ?? tr.Status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: c.onSurfaceVar, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.8rem', textAlign: 'center' }}>{tr.MaxTeams}</td>
                    <td style={{ padding: '12px', color: c.onSurfaceVar, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{tr.StartDate ? new Date(tr.StartDate).toLocaleDateString('vi-VN') : '—'}</td>
                    {isAdmin && (
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>

                          {(tr.Status?.toLowerCase() === 'draft' || tr.Status?.toLowerCase() === 'registration') && (
                            <button onClick={() => openEdit(tr)}
                              style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(99,179,237,0.1)', border: '1px solid rgba(99,179,237,0.3)', color: '#63B3ED', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Rajdhani',sans-serif", transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,179,237,0.2)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,179,237,0.1)' }}>
                              ✒ {t('Chỉnh sửa','Edit')}
                            </button>
                          )}
                          {/* Advance Status */}
                          {tr.Status !== 'Completed' && tr.Status !== 'Cancelled' && (
                            <button onClick={() => advanceStatus(tr.TournamentID)}
                              style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.04em', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.2)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)' }}>
                              {t('Chuyển giai đoạn','Advance')} →
                            </button>
                          )}
                          {/* Cancel Tournament */}
                          {tr.Status !== 'Completed' && tr.Status !== 'Cancelled' && (
                            <button onClick={() => cancelTournament(tr.TournamentID)}
                              style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#FC8181', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Rajdhani',sans-serif", transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.16)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}>
                              {t('Hủy giải','Cancel')}
                            </button>
                          )}
                          {/* Generate Bracket */}
                          {tr.Status?.toLowerCase() === 'registration' && (
                            <button onClick={() => generateBracket(tr.TournamentID)}
                              disabled={generatingId === tr.TournamentID}
                              style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(104,211,145,0.1)', border: '1px solid rgba(104,211,145,0.3)', color: '#68D391', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Rajdhani',sans-serif", transition: 'all 0.15s', whiteSpace: 'nowrap', opacity: generatingId === tr.TournamentID ? 0.6 : 1 }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(104,211,145,0.2)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(104,211,145,0.1)' }}>
                              {generatingId === tr.TournamentID ? `⏳ ${t('Đang tạo...','Generating...')}` : `⚡ ${t('Tạo nhánh','Gen Bracket')}`}
                            </button>
                          )}
                          {/* View Bracket */}
                          {(tr.Status?.toLowerCase() === 'active' || tr.Status?.toLowerCase() === 'completed') && (
                            <button onClick={() => nav(`/tournaments/${tr.TournamentID}/bracket`)}
                              style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(99,179,237,0.1)', border: '1px solid rgba(99,179,237,0.3)', color: '#63B3ED', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Rajdhani',sans-serif", transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,179,237,0.2)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,179,237,0.1)' }}>
                              🏆 {t('Xem nhánh','Bracket')}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>

                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: c.surfaceCard, border: '1px solid rgba(124,58,237,0.3)', borderRadius: 18, padding: '2rem', width: 500, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: dark ? '0 32px 80px rgba(0,0,0,0.6), 0 0 40px rgba(124,58,237,0.1)' : '0 8px 32px rgba(0,0,0,0.08)', animation: 'slide-in 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 20, borderRadius: 2, background: 'linear-gradient(180deg,#7C3AED,#06B6D4)' }} />
                <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.2rem', fontWeight: 700, margin: 0, letterSpacing: '0.08em', color: c.onSurface }}>TẠO GIẢI ĐẤU MỚI</h2>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.2)', borderRadius: 8, cursor: 'pointer', color: '#FC8181', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={labelStyle}>Tên giải đấu *</label><input value={form.Name} onChange={e => setForm(f => ({ ...f, Name: e.target.value }))} placeholder="VD: NEXORA Open Cup 2025" style={inputStyle} className="nexora-input" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Thể loại</label>
                  <select value={form.GameType} onChange={e => {
                    const gt = e.target.value
                    const first = GAME_LIST[gt]?.[0]?.name ?? ''
                    const rules = GAME_RULES[gt]
                    const defaultFormat = gt === 'BattleRoyale' ? 'BattleRoyale' : 'SingleElimination'
                    setForm(f => ({
                      ...f,
                      GameType: gt,
                      GameName: first,
                      MinPlayersPerTeam: rules?.minPlayers ?? 5,
                      Format: defaultFormat
                    }))
                  }} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {['FPS', 'MOBA', 'BattleRoyale', 'Fighting', 'RTS', 'Sports'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Thể thức</label>
                  <select value={form.Format} onChange={e => setForm(f => ({ ...f, Format: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {(form.GameType === 'BattleRoyale'
                      ? ['BattleRoyale']
                      : ['SingleElimination', 'RoundRobin', 'Swiss']
                    ).map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              {/* Game type rule info */}
              {GAME_RULES[form.GameType] && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.18)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", color: '#06B6D4', lineHeight: 1 }}>info</span>
                  <span style={{ fontSize: '0.75rem', color: '#06B6D4', lineHeight: 1.5 }}>
                    <strong>{form.GameType}</strong>: {GAME_RULES[form.GameType].teamSizes}/đội · Tối đa {GAME_RULES[form.GameType].maxTeams} đội
                  </span>
                </div>
              )}
              {/* Game selection */}
              <div>
                <label style={labelStyle}>Chọn Game *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(GAME_LIST[form.GameType] ?? []).map(g => {
                    const selected = form.GameName === g.name
                    return (
                      <button key={g.name} type="button"
                        onClick={() => setForm(f => ({ ...f, GameName: g.name }))}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                          borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                          border: selected ? `2px solid ${g.color}` : `1px solid ${c.panelBorder}`,
                          background: selected ? `${g.color}1a` : c.surfaceContainer,
                          color: selected ? g.color : c.onSurface,
                          fontWeight: selected ? 700 : 400,
                          fontSize: '0.82rem',
                          transition: 'all 0.15s',
                          boxShadow: selected ? `0 0 12px ${g.color}30` : 'none'
                        }}
                        onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = `${g.color}50` }}
                        onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = c.panelBorder }}
                      >
                        <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{g.icon}</span>
                        <span style={{ fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.02em' }}>{g.name}</span>
                        {selected && <span style={{ marginLeft: 'auto', fontSize: 14, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 1,'wght' 400", color: g.color }}>check_circle</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Số đội tối đa</label><input type="number" min={2} max={128} value={form.MaxTeams} onChange={e => setForm(f => ({ ...f, MaxTeams: +e.target.value }))} style={inputStyle} className="nexora-input" /></div>
                <div><label style={labelStyle}>Thành viên tối thiểu / đội</label><input type="number" min={1} max={10} value={form.MinPlayersPerTeam} onChange={e => setForm(f => ({ ...f, MinPlayersPerTeam: +e.target.value }))} style={inputStyle} className="nexora-input" /></div>
              </div>
              <div><label style={labelStyle}>Ngày bắt đầu</label><input type="date" value={form.StartDate} onChange={e => setForm(f => ({ ...f, StartDate: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} className="nexora-input" /></div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: 9, background: 'transparent', border: `1px solid ${c.panelBorder}`, color: c.onSurfaceVar, cursor: 'pointer', fontSize: '0.875rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em', transition: 'all 0.15s' }}>HỦY</button>
                <button onClick={handleCreate} disabled={submitting} className="nexora-btn-primary" style={{ padding: '10px 24px', borderRadius: 9, fontSize: '0.9rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.08em' }}>
                  {submitting ? 'Đang tạo...' : 'TẠO GIẢI ĐẤU'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tournament Modal */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: c.surfaceCard, border: '1px solid rgba(99,179,237,0.3)', borderRadius: 18, padding: '2rem', width: 460, maxWidth: '95vw', boxShadow: dark ? '0 32px 80px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.08)', animation: 'slide-in 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 20, borderRadius: 2, background: '#63B3ED' }} />
                <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.2rem', fontWeight: 700, margin: 0, letterSpacing: '0.08em', color: c.onSurface }}>CHỈNH SỬA GIẢI ĐẤU</h2>
              </div>
              <button onClick={() => setEditTarget(null)} style={{ background: 'rgba(99,179,237,0.08)', border: '1px solid rgba(99,179,237,0.2)', borderRadius: 8, cursor: 'pointer', color: '#63B3ED', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Tên giải đấu *</label>
                <input value={editForm.Name} onChange={e => setEditForm(f => ({ ...f, Name: e.target.value }))} style={inputStyle} className="nexora-input" />
              </div>

              {/* ── Thể loại + Thể thức ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Thể Loại Game</label>
                  <select value={editForm.GameType} onChange={e => {
                    const gt = e.target.value
                    const defaultFormat = gt === 'BattleRoyale' ? 'BattleRoyale' : 'SingleElimination'
                    setEditForm(f => ({ ...f, GameType: gt, Format: defaultFormat }))
                  }} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {['FPS', 'MOBA', 'BattleRoyale', 'Fighting', 'RTS', 'Sports'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Thể Thức</label>
                  <select value={editForm.Format} onChange={e => setEditForm(f => ({ ...f, Format: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {(editForm.GameType === 'BattleRoyale'
                      ? ['BattleRoyale']
                      : ['SingleElimination', 'RoundRobin', 'Swiss']
                    ).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {editForm.GameType === 'BattleRoyale' && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.75rem', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: 16, lineHeight: 1 }}>star</span>
                  Sau khi lưu, giải này sẽ xuất hiện trong trang <strong>BR Scoring</strong>.
                </div>
              )}

              <div>
                <label style={labelStyle}>Ngày bắt đầu</label>
                <input type="date" value={editForm.StartDate} onChange={e => setEditForm(f => ({ ...f, StartDate: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} className="nexora-input" />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => setEditTarget(null)} style={{ padding: '10px 20px', borderRadius: 9, background: 'transparent', border: `1px solid ${c.panelBorder}`, color: c.onSurfaceVar, cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.05em' }}>HỦY</button>
                <button onClick={handleEdit} disabled={editSubmitting || !editForm.Name.trim()}
                  style={{ padding: '10px 24px', borderRadius: 9, background: 'rgba(99,179,237,0.15)', border: '1px solid rgba(99,179,237,0.4)', color: '#63B3ED', cursor: editSubmitting ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.08em', opacity: editSubmitting ? 0.6 : 1 }}>
                  {editSubmitting ? 'Đang lưu...' : 'LƯU THAY ĐỔI'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
