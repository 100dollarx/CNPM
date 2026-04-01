// Design tokens — khớp 1:1 với LoginPage
export type Theme = 'dark' | 'light'

export interface ColorTokens {
  surface: string
  surfaceLow: string
  surfaceContainer: string
  surfaceCard: string
  onSurface: string
  onSurfaceVar: string
  outline: string
  primary: string
  primaryHover: string
  inputBg: string
  panelBorder: string
  errorText: string
  successText: string
  warningText: string
  infoText: string
}

export const darkTokens: ColorTokens = {
  surface:          '#10141a',
  surfaceLow:       '#181c22',
  surfaceContainer: '#1c2026',
  surfaceCard:      'rgba(28,32,38,0.85)',
  onSurface:        '#dfe2eb',
  onSurfaceVar:     '#9a9db0',
  outline:          '#3d4050',
  primary:          '#E94560',
  primaryHover:     '#ff5c78',
  inputBg:          '#0a0e14',
  panelBorder:      'rgba(74,69,80,0.18)',
  errorText:        '#ffb2b7',
  successText:      '#4ade80',
  warningText:      '#facc15',
  infoText:         '#60a5fa',
}

export const lightTokens: ColorTokens = {
  surface:          '#f9f9ff',
  surfaceLow:       '#f3f3f7',
  surfaceContainer: '#ececf0',
  surfaceCard:      'rgba(255,255,255,0.95)',
  onSurface:        '#191c20',
  onSurfaceVar:     '#49454f',
  outline:          '#c4c7d4',
  primary:          '#E94560',
  primaryHover:     '#c73050',
  inputBg:          '#ffffff',
  panelBorder:      'rgba(201,197,208,0.35)',
  errorText:        '#ba1a1a',
  successText:      '#15803d',
  warningText:      '#b45309',
  infoText:         '#1d4ed8',
}

export function getTokens(dark: boolean): ColorTokens {
  return dark ? darkTokens : lightTokens
}

// Status → badge color
export function statusColor(status: string, dark: boolean) {
  const s = status?.toLowerCase()
  if (s === 'active' || s === 'approved' || s === 'verified' || s === 'resolved')
    return { bg: dark ? 'rgba(74,222,128,0.12)' : 'rgba(21,128,61,0.1)', text: dark ? '#4ade80' : '#15803d', border: dark ? 'rgba(74,222,128,0.25)' : 'rgba(21,128,61,0.3)' }
  if (s === 'registration' || s === 'pending' || s === 'open')
    return { bg: dark ? 'rgba(250,204,21,0.12)' : 'rgba(180,83,9,0.1)', text: dark ? '#facc15' : '#b45309', border: dark ? 'rgba(250,204,21,0.25)' : 'rgba(180,83,9,0.3)' }
  if (s === 'completed' || s === 'read')
    return { bg: dark ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.1)', text: dark ? '#94a3b8' : '#475569', border: dark ? 'rgba(148,163,184,0.2)' : 'rgba(100,116,139,0.2)' }
  if (s === 'rejected' || s === 'dismissed' || s === 'locked')
    return { bg: dark ? 'rgba(239,68,68,0.12)' : 'rgba(185,28,28,0.1)', text: dark ? '#f87171' : '#b91c1c', border: dark ? 'rgba(239,68,68,0.25)' : 'rgba(185,28,28,0.3)' }
  // draft, default
  return { bg: dark ? 'rgba(96,165,250,0.12)' : 'rgba(29,78,216,0.1)', text: dark ? '#60a5fa' : '#1d4ed8', border: dark ? 'rgba(96,165,250,0.25)' : 'rgba(29,78,216,0.3)' }
}
