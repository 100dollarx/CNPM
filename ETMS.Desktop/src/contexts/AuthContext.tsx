import React, { createContext, useContext, useState, useCallback } from 'react'

interface User {
  UserID: number
  Username: string
  FullName: string
  Role: 'Admin' | 'Captain' | 'Player'
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  isAdmin: boolean
  isCaptain: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const s = sessionStorage.getItem('etms_user')
    return s ? JSON.parse(s) : null
  })
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('etms_token'))

  const login = useCallback(async (username: string, password: string) => {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000) // 8s timeout
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      })
      clearTimeout(timer)
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'Đăng nhập thất bại.' }
      setUser(data.user); setToken(data.token)
      sessionStorage.setItem('etms_user', JSON.stringify(data.user))
      sessionStorage.setItem('etms_token', data.token)
      return { ok: true }
    } catch (e: unknown) {
      console.error('[AuthContext] Login error:', e)
      if (e instanceof Error && e.name === 'AbortError')
        return { ok: false, error: 'Hết thời gian kết nối (8s). Kiểm tra backend đang chạy trên port 5126.' }
      return { ok: false, error: 'Không thể kết nối tới máy chủ (localhost:5126). Hãy chạy: cd ETMS.Api && dotnet run' }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null); setToken(null)
    sessionStorage.removeItem('etms_user'); sessionStorage.removeItem('etms_token')
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin: user?.Role === 'Admin', isCaptain: user?.Role === 'Captain' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
