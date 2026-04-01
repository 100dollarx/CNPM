import { createContext, useContext, useState, ReactNode } from 'react'

type Lang = 'vi' | 'en'

interface LangContextType {
  lang: Lang
  toggle: () => void
  t: (vi: string, en: string) => string
}

const LangContext = createContext<LangContextType>(null!)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('nexora-lang') as Lang) ?? 'vi')
  const toggle = () => setLang(l => {
    const next = l === 'vi' ? 'en' : 'vi'
    localStorage.setItem('nexora-lang', next)
    return next
  })
  const t = (vi: string, en: string) => lang === 'vi' ? vi : en
  return <LangContext.Provider value={{ lang, toggle, t }}>{children}</LangContext.Provider>
}

export function useLang() { return useContext(LangContext) }
