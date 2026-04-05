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
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string; status?: number }>
  logout: () => void
  isAdmin: boolean
  isCaptain: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

// Normalize API camelCase response (userID, role) → PascalCase (UserID, Role)
function normalizeUser(raw: any): User | null {
  if (!raw) return null
  return {
    UserID:   raw.UserID   ?? raw.userID   ?? raw.userId   ?? 0,
    Username: raw.Username ?? raw.username ?? '',
    FullName: raw.FullName ?? raw.fullName ?? '',
    Role:     raw.Role     ?? raw.role     ?? 'Player',
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const s = sessionStorage.getItem('etms_user')
    return s ? normalizeUser(JSON.parse(s)) : null
  })
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('etms_token'))

  const login = useCallback(async (username: string, password: string) => {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      })
      clearTimeout(timer)
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'Login failed.', status: res.status }
      const normalized = normalizeUser(data.user)
      setUser(normalized); setToken(data.token)
      sessionStorage.setItem('etms_user', JSON.stringify(normalized))
      sessionStorage.setItem('etms_token', data.token)
      return { ok: true }
    } catch (e: unknown) {
      console.error('[AuthContext] Login error:', e)
      if (e instanceof Error && e.name === 'AbortError')
        return { ok: false, error: 'Connection timeout (8s). Check backend on port 5126.' }
      return { ok: false, error: 'Cannot connect to server (localhost:5126).' }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null); setToken(null)
    sessionStorage.removeItem('etms_user'); sessionStorage.removeItem('etms_token')
  }, [])

  const role = user?.Role?.toLowerCase() ?? ''

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin: role === 'admin', isCaptain: role === 'captain' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
