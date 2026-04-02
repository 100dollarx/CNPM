import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'
interface Toast { id: number; type: ToastType; message: string }

interface ToastContextType {
  toast: (type: ToastType, message: string) => void
  success: (msg: string) => void
  error: (msg: string) => void
  warning: (msg: string) => void
  info: (msg: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const icons: Record<ToastType, string> = {
  success: 'check_circle', error: 'cancel', warning: 'warning', info: 'info'
}
const colors: Record<ToastType, { bg: string; border: string; color: string }> = {
  success: { bg: 'rgba(104,211,145,0.12)', border: 'rgba(104,211,145,0.4)', color: '#68D391' },
  error:   { bg: 'rgba(252,129,129,0.12)', border: 'rgba(252,129,129,0.4)', color: '#FC8181' },
  warning: { bg: 'rgba(246,173,85,0.12)',  border: 'rgba(246,173,85,0.4)',  color: '#F6AD55' },
  info:    { bg: 'rgba(99,179,237,0.12)',  border: 'rgba(99,179,237,0.4)',  color: '#63B3ED' },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const toast = useCallback((type: ToastType, message: string) => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3800)
  }, [])

  const success = useCallback((msg: string) => toast('success', msg), [toast])
  const error   = useCallback((msg: string) => toast('error', msg),   [toast])
  const warning = useCallback((msg: string) => toast('warning', msg), [toast])
  const info    = useCallback((msg: string) => toast('info', msg),    [toast])

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Toast container */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 10,
        zIndex: 9999, maxWidth: 380, pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const c = colors[t.type]
          return (
            <div key={t.id} onClick={() => dismiss(t.id)} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '12px 16px',
              background: c.bg, backdropFilter: 'blur(12px)',
              border: `1px solid ${c.border}`, borderLeft: `3px solid ${c.color}`,
              borderRadius: 12,
              boxShadow: `0 8px 24px rgba(0,0,0,0.25), 0 0 0 1px ${c.border}`,
              animation: 'toast-in 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              pointerEvents: 'auto', cursor: 'pointer',
              fontFamily: "'Inter',system-ui,sans-serif",
            }}>
              <span style={{
                fontSize: 20, fontFamily: 'Material Symbols Outlined',
                fontVariationSettings: "'FILL' 1,'wght' 400",
                color: c.color, lineHeight: 1, flexShrink: 0, marginTop: 1,
              }}>{icons[t.type]}</span>
              <span style={{ fontSize: '0.85rem', color: '#E2E8F0', lineHeight: 1.5 }}>
                {t.message}
              </span>
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(40px) scale(0.92); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
