import React, { createContext, useContext, useState } from 'react'

interface ThemeCtx { dark: boolean; toggle: () => void }
const Ctx = createContext<ThemeCtx>({ dark: true, toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('nexora-theme')
    return saved ? saved === 'dark' : true  // default: dark
  })
  const toggle = () => setDark(d => {
    const next = !d
    localStorage.setItem('nexora-theme', next ? 'dark' : 'light')
    return next
  })
  return <Ctx.Provider value={{ dark, toggle }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)
