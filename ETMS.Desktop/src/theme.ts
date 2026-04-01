// NEXORA Design System — Red-dominant Gaming Theme
export type Theme = 'dark' | 'light'

export interface ColorTokens {
  surface: string
  surfaceLow: string
  surfaceContainer: string
  surfaceCard: string
  onSurface: string
  onSurfaceVar: string
  outline: string
  primary: string         // NEXORA Red — chủ đạo
  primaryHover: string
  accent: string          // Violet — secondary
  accentHover: string
  inputBg: string
  panelBorder: string
  glowBorder: string
  errorText: string
  successText: string
  warningText: string
  infoText: string
}

// NEXORA Dark — Red-dominant Gaming
export const darkTokens: ColorTokens = {
  surface:          '#080A0F',
  surfaceLow:       '#0D1117',
  surfaceContainer: '#161B22',
  surfaceCard:      'rgba(22,27,34,0.92)',
  onSurface:        '#F0F2F8',      // ↑ contrast: was #E2E8F0
  onSurfaceVar:     '#A8B3CB',      // ↑ contrast: was #8B9AB5
  outline:          '#3A4358',
  primary:          '#E94560',      // NEXORA Red
  primaryHover:     '#FF5C78',
  accent:           '#7C3AED',      // Violet — secondary
  accentHover:      '#9F5FF0',
  inputBg:          '#0D1117',
  panelBorder:      'rgba(50,60,80,0.6)',
  glowBorder:       'rgba(233,69,96,0.5)',
  errorText:        '#FF7F96',      // ↑ brightness
  successText:      '#4ADE80',      // ↑ brightness
  warningText:      '#FBBF24',      // ↑ brightness
  infoText:         '#60A5FA',
}

// NEXORA Light — Premium Slate-White
export const lightTokens: ColorTokens = {
  surface:          '#F1F3F8',       // Cool light gray page bg
  surfaceLow:       '#FFFFFF',       // Pure white sidebar
  surfaceContainer: '#E4E7EF',       // Slightly darker for containers
  surfaceCard:      'rgba(255,255,255,0.98)', // White cards with subtle border
  onSurface:        '#0F172A',       // Near-black — maximum contrast
  onSurfaceVar:     '#374151',       // Dark gray secondary text
  outline:          '#9CA3AF',       // Mid gray outlines
  primary:          '#C92140',       // Deep crimson for light bg
  primaryHover:     '#E94560',
  accent:           '#6D28D9',
  accentHover:      '#7C3AED',
  inputBg:          '#FFFFFF',
  panelBorder:      'rgba(156,163,175,0.35)',
  glowBorder:       'rgba(201,33,64,0.5)',
  errorText:        '#DC2626',
  successText:      '#16A34A',
  warningText:      '#D97706',
  infoText:         '#2563EB',
}

export function getTokens(dark: boolean): ColorTokens {
  return dark ? darkTokens : lightTokens
}

// Game type → neon color
export function gameTypeColor(gameType: string): string {
  const map: Record<string, string> = {
    fps:         '#EF4444',
    moba:        '#06B6D4',
    battleroyale:'#F59E0B',
    fighting:    '#EC4899',
    rts:         '#10B981',
    sports:      '#3B82F6',
  }
  return map[gameType?.toLowerCase().replace(/\s/g, '')] ?? '#E94560'
}

// Status → badge colors (NEXORA Red palette)
export function statusColor(status: string, dark: boolean) {
  const s = status?.toLowerCase()
  if (s === 'active' || s === 'approved' || s === 'verified' || s === 'resolved' || s === 'admin')
    return { bg: dark ? 'rgba(74,222,128,0.13)' : 'rgba(21,128,61,0.1)', text: dark ? '#4ADE80' : '#15803D', border: dark ? 'rgba(74,222,128,0.35)' : 'rgba(21,128,61,0.35)' }
  if (s === 'registration' || s === 'pending' || s === 'open' || s === 'captain')
    return { bg: dark ? 'rgba(251,191,36,0.13)' : 'rgba(180,83,9,0.1)', text: dark ? '#FBBF24' : '#B45309', border: dark ? 'rgba(251,191,36,0.35)' : 'rgba(180,83,9,0.35)' }
  if (s === 'completed' || s === 'read' || s === 'guest')
    return { bg: dark ? 'rgba(148,163,184,0.13)' : 'rgba(71,85,105,0.1)', text: dark ? '#94A3B8' : '#475569', border: dark ? 'rgba(148,163,184,0.25)' : 'rgba(71,85,105,0.25)' }
  if (s === 'rejected' || s === 'dismissed' || s === 'locked')
    return { bg: dark ? 'rgba(239,68,68,0.13)' : 'rgba(185,28,28,0.1)', text: dark ? '#F87171' : '#B91C1C', border: dark ? 'rgba(239,68,68,0.35)' : 'rgba(185,28,28,0.35)' }
  if (s === 'live' || s === 'checkinopen')
    return { bg: 'rgba(233,69,96,0.15)', text: '#FF5C78', border: 'rgba(233,69,96,0.45)' }
  if (s === 'player')
    return { bg: dark ? 'rgba(96,165,250,0.13)' : 'rgba(29,78,216,0.1)', text: dark ? '#60A5FA' : '#2563EB', border: dark ? 'rgba(96,165,250,0.35)' : 'rgba(29,78,216,0.35)' }
  // draft, default → red-tinted
  return { bg: dark ? 'rgba(233,69,96,0.1)' : 'rgba(201,33,64,0.08)', text: dark ? '#F4637A' : '#C92140', border: dark ? 'rgba(233,69,96,0.3)' : 'rgba(201,33,64,0.3)' }
}

// Global CSS — NEXORA Red-primary
export const NEXORA_GLOBAL_CSS = `
  @keyframes neon-pulse {
    0%, 100% { box-shadow: 0 0 8px rgba(233,69,96,0.3), 0 0 16px rgba(233,69,96,0.15); }
    50%       { box-shadow: 0 0 16px rgba(233,69,96,0.6), 0 0 32px rgba(233,69,96,0.3); }
  }
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.65; }
    50%       { opacity: 1; }
  }
  @keyframes live-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.25; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slide-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-8px); }
    40%     { transform: translateX(8px); }
    60%     { transform: translateX(-5px); }
    80%     { transform: translateX(5px); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-12px); }
  }
  .nexora-card {
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  }
  .nexora-card:hover {
    border-color: rgba(233,69,96,0.4) !important;
    box-shadow: 0 4px 24px rgba(233,69,96,0.12) !important;
    transform: translateY(-1px);
  }
  .nexora-btn-primary {
    background: linear-gradient(135deg, #E94560, #91002b);
    color: #fff;
    border: none;
    cursor: pointer;
    font-weight: 700;
    transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(233,69,96,0.35);
  }
  .nexora-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #FF5C78, #C0002E);
    box-shadow: 0 6px 28px rgba(233,69,96,0.55);
    transform: translateY(-1px);
  }
  .nexora-btn-primary:active:not(:disabled) { transform: scale(0.97); }
  .nexora-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
  .nexora-input:focus {
    outline: none;
    border-color: rgba(233,69,96,0.8) !important;
    box-shadow: 0 0 0 3px rgba(233,69,96,0.2) !important;
  }
  .nexora-nav-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    margin: 1px 6px;
    border-radius: 8px;
    text-decoration: none;
    font-size: 0.84rem;
    font-weight: 500;
    transition: all 0.15s;
    border-left: 2px solid transparent;
    color: #A8B3CB;
  }
  .nexora-nav-link:hover {
    background: rgba(233,69,96,0.08);
    color: #F0A0AE;
    border-left-color: rgba(233,69,96,0.45);
  }
  .nexora-nav-link.active {
    background: rgba(233,69,96,0.14);
    color: #FF7F96;
    border-left-color: #E94560;
    font-weight: 600;
  }
  .live-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #E94560;
    display: inline-block;
    animation: live-blink 1s ease-in-out infinite;
    box-shadow: 0 0 6px rgba(233,69,96,0.7);
  }
  .hex-grid {
    background-image:
      linear-gradient(rgba(233,69,96,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(233,69,96,0.05) 1px, transparent 1px);
    background-size: 32px 32px;
  }
`
