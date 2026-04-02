import { useParams, useNavigate } from 'react-router'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { getTokens } from '../theme'
import { useState, useEffect } from 'react'

interface MatchDetail {
  MatchID: number; Round: number; Status: string
  Team1ID?: number; Team1Name?: string
  Team2ID?: number; Team2Name?: string
  ResultID?: number
}

const MS = ({ icon, size = 20, color }: { icon: string; size?: number; color?: string }) => (
  <span style={{ fontSize: size, color, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', verticalAlign: 'middle' }}>{icon}</span>
)

export default function ResultSubmitPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { dark } = useTheme()
  const { token, isAdmin } = useAuth()
  const toast = useToast()
  const c = getTokens(dark)
  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [scoreA, setScoreA] = useState('')
  const [scoreB, setScoreB] = useState('')
  const [winnerId, setWinnerId] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/matches/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(setMatch).catch(() => {})
  }, [id, token])

  const handleScoreChange = (sA: string, sB: string) => {
    const a = parseInt(sA), b = parseInt(sB)
    if (!isNaN(a) && !isNaN(b) && match) {
      if (a > b) setWinnerId(match.Team1ID ?? null)
      else if (b > a) setWinnerId(match.Team2ID ?? null)
      else setWinnerId(null)
    }
  }

  const handleSubmit = async () => {
    if (!scoreA || !scoreB) { toast.error('Vui lòng nhập tỉ số cho cả hai đội.'); return }
    if (!winnerId) { toast.error('Không xác định được đội thắng. Tỉ số phải chênh lệch rõ ràng.'); return }
    setSubmitting(true)
    try {
      const r = await fetch(`/api/matches/${id}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          WinnerTeamID: winnerId,
          ScoreA: parseInt(scoreA),
          ScoreB: parseInt(scoreB),
          Evidence: file ? file.name : ''
        })
      })
      const d = await r.json()
      if (r.ok) { toast.success('Kết quả đã được nộp! Chờ admin xác nhận.'); nav('/matches') }
      else toast.error(d.error ?? 'Nộp kết quả thất bại.')
    } catch { toast.error('Không thể kết nối máy chủ.') } finally { setSubmitting(false) }
  }

  const isValid = scoreA !== '' && scoreB !== '' && winnerId !== null

  const teamColor = (teamId?: number) => winnerId === teamId ? '#68D391' : c.onSurface

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.surface, color: c.onSurface }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', gap: 16, borderBottom: `1px solid ${c.panelBorder}` }}>
        <button onClick={() => nav('/matches')} style={{ background: 'rgba(104,211,145,0.08)', border: '1px solid rgba(104,211,145,0.2)', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#68D391' }}>
          <MS icon="arrow_back" size={19} />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 22, borderRadius: 2, background: 'linear-gradient(180deg,#68D391,#06B6D4)' }} />
            <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.35rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>NỘP KẾT QUẢ</h1>
            <span style={{ padding: '2px 10px', borderRadius: 999, background: 'rgba(104,211,145,0.12)', border: '1px solid rgba(104,211,145,0.3)', color: '#68D391', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>Match #{id}</span>
          </div>
          <p style={{ margin: '2px 0 0 13px', color: c.onSurfaceVar, fontSize: '0.78rem' }}>Vòng {match?.Round ?? '?'} · Nộp tỉ số và bằng chứng</p>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 580, background: c.surfaceCard, borderRadius: 20, border: `1px solid ${c.panelBorder}`, padding: '2rem', backdropFilter: 'blur(12px)', boxShadow: dark ? '0 20px 60px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.06)' }}>

          {/* Score grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1.5rem', alignItems: 'center', marginBottom: '2rem' }}>

            {/* Team 1 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: 'linear-gradient(135deg,rgba(233,69,96,0.2),rgba(124,58,237,0.2))', border: `2px solid ${winnerId === match?.Team1ID ? '#68D391' : 'rgba(233,69,96,0.3)'}`, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, color: '#E94560', transition: 'all 0.2s' }}>
                {match?.Team1Name?.charAt(0).toUpperCase() ?? 'A'}
              </div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: '0 0 10px', fontFamily: "'Rajdhani',sans-serif", color: teamColor(match?.Team1ID) }}>
                {match?.Team1Name ?? 'Đội A'}
              </p>
              <input type="number" min="0" max="99" value={scoreA}
                onChange={e => { setScoreA(e.target.value); handleScoreChange(e.target.value, scoreB) }}
                placeholder="0"
                style={{ width: 80, textAlign: 'center', fontSize: '1.8rem', fontWeight: 700, background: c.inputBg, border: `2px solid ${winnerId === match?.Team1ID ? 'rgba(104,211,145,0.5)' : c.panelBorder}`, padding: '8px', borderRadius: 12, color: teamColor(match?.Team1ID), outline: 'none', transition: 'all 0.2s', fontFamily: "'Rajdhani',sans-serif" }} />
            </div>

            {/* VS */}
            <div style={{ textAlign: 'center', padding: '12px 16px', borderRadius: 12, background: dark ? 'rgba(233,69,96,0.08)' : 'rgba(233,69,96,0.06)', border: '1px solid rgba(233,69,96,0.2)' }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 800, fontSize: '1.3rem', color: '#E94560' }}>VS</div>
              {isValid && winnerId && (
                <div style={{ marginTop: 6, fontSize: '0.62rem', color: '#68D391', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                  WIN ↑
                </div>
              )}
            </div>

            {/* Team 2 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: 'linear-gradient(135deg,rgba(99,179,237,0.2),rgba(124,58,237,0.2))', border: `2px solid ${winnerId === match?.Team2ID ? '#68D391' : 'rgba(99,179,237,0.3)'}`, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, color: '#63B3ED', transition: 'all 0.2s' }}>
                {match?.Team2Name?.charAt(0).toUpperCase() ?? 'B'}
              </div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: '0 0 10px', fontFamily: "'Rajdhani',sans-serif", color: teamColor(match?.Team2ID) }}>
                {match?.Team2Name ?? 'Đội B'}
              </p>
              <input type="number" min="0" max="99" value={scoreB}
                onChange={e => { setScoreB(e.target.value); handleScoreChange(scoreA, e.target.value) }}
                placeholder="0"
                style={{ width: 80, textAlign: 'center', fontSize: '1.8rem', fontWeight: 700, background: c.inputBg, border: `2px solid ${winnerId === match?.Team2ID ? 'rgba(104,211,145,0.5)' : c.panelBorder}`, padding: '8px', borderRadius: 12, color: teamColor(match?.Team2ID), outline: 'none', transition: 'all 0.2s', fontFamily: "'Rajdhani',sans-serif" }} />
            </div>
          </div>

          {/* Evidence upload */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: c.onSurfaceVar, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Minh Chứng (Screenshot) *</label>
            <label htmlFor="upload-result" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `2px dashed ${file ? 'rgba(104,211,145,0.4)' : c.panelBorder}`, borderRadius: 14, padding: '2rem', cursor: 'pointer', background: file ? 'rgba(104,211,145,0.06)' : c.surfaceContainer, transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(104,211,145,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = file ? 'rgba(104,211,145,0.4)' : c.panelBorder}>
              <MS icon={file ? 'check_circle' : 'cloud_upload'} size={40} color={file ? '#68D391' : c.onSurfaceVar} />
              <span style={{ marginTop: 12, color: file ? '#68D391' : c.onSurface, fontWeight: 600, fontSize: '0.9rem' }}>{file ? file.name : 'Nhấn để chọn hình ảnh'}</span>
              <span style={{ marginTop: 6, color: c.onSurfaceVar, fontSize: '0.78rem' }}>JPEG, PNG, WEBP (Tối đa 5MB)</span>
              <input id="upload-result" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          {/* Winner indicator */}
          {isValid && (
            <div style={{ marginBottom: '1.5rem', padding: '10px 16px', borderRadius: 10, background: 'rgba(104,211,145,0.08)', border: '1px solid rgba(104,211,145,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MS icon="emoji_events" size={18} color="#68D391" />
              <span style={{ fontSize: '0.85rem', color: '#68D391', fontWeight: 700, fontFamily: "'Rajdhani',sans-serif" }}>
                Đội thắng: {winnerId === match?.Team1ID ? match?.Team1Name : match?.Team2Name} ({scoreA} – {scoreB})
              </span>
            </div>
          )}

          {/* Submit */}
          <button disabled={!isValid || submitting} onClick={handleSubmit}
            className={isValid ? 'nexora-btn-primary' : ''}
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: isValid ? undefined : c.surfaceContainer, color: isValid ? undefined : c.onSurfaceVar, border: 'none', cursor: isValid ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '1rem', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.08em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: !isValid || submitting ? 0.6 : 1, transition: 'all 0.2s' }}>
            <MS icon={submitting ? 'hourglass_empty' : 'send'} size={20} />
            {submitting ? 'Đang nộp...' : 'NỘP KẾT QUẢ'}
          </button>

          {/* Admin verify panel */}
          {isAdmin && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: 12, background: dark ? 'rgba(233,69,96,0.05)' : 'rgba(0,0,0,0.03)', border: `1px solid ${c.panelBorder}` }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: c.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px', fontFamily: "'Rajdhani',sans-serif" }}>Admin — Xác Nhận Kết Quả</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {match?.ResultID && (
                  <>
                    <button onClick={async () => {
                      const r = await fetch(`/api/results/${match.ResultID}/verify`, { method: 'PATCH', headers: token ? { Authorization: `Bearer ${token}` } : {} })
                      if (r.ok) { toast.success('Đã xác nhận kết quả.'); nav('/matches') }
                      else toast.error('Xác nhận thất bại.')
                    }} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(104,211,145,0.1)', border: '1px solid rgba(104,211,145,0.3)', color: '#68D391', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', fontFamily: "'Rajdhani',sans-serif" }}>
                      ✓ XÁC NHẬN
                    </button>
                    <button onClick={async () => {
                      const reason = window.prompt('Lý do từ chối:')
                      if (!reason) return
                      const r = await fetch(`/api/results/${match.ResultID}/reject`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ Reason: reason }) })
                      if (r.ok) { toast.success('Đã từ chối kết quả.'); nav('/matches') }
                      else toast.error('Từ chối thất bại.')
                    }} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)', color: '#FC8181', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', fontFamily: "'Rajdhani',sans-serif" }}>
                      ✕ TỪ CHỐI
                    </button>
                  </>
                )}
                {!match?.ResultID && <p style={{ color: c.outline, fontSize: '0.8rem', margin: 0 }}>Chưa có kết quả được nộp.</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
