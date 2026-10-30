import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { authApi, UserProfile } from './api'

interface AuthContextValue {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string, confirmPassword: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('cs_token'))
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // On mount, try to load user from stored token
  useEffect(() => {
    const stored = localStorage.getItem('cs_token')
    if (!stored) {
      setIsLoading(false)
      return
    }
    authApi.me()
      .then(profile => setUser(profile))
      .catch(() => {
        localStorage.removeItem('cs_token')
        setToken(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response: any = await authApi.login({ email, password })
    const tokenStr = response.access_token || response.token
    if (tokenStr) {
      localStorage.setItem('cs_token', tokenStr)
      setToken(tokenStr)
      try {
        const profile = await authApi.me()
        setUser(profile)
      } catch {
        // Fallback user
        setUser({ id: 'current', email, username: email.split('@')[0], role: 'user', created_at: new Date().toISOString() })
      }
    }
  }, [])

  const register = useCallback(async (
    email: string, username: string, password: string, confirmPassword: string
  ) => {
    await authApi.register({ email, username, password, confirmPassword })
    // Log in immediately with new credentials
    const response: any = await authApi.login({ email, password })
    const tokenStr = response.access_token || response.token
    if (tokenStr) {
      localStorage.setItem('cs_token', tokenStr)
      setToken(tokenStr)
      try {
        const profile = await authApi.me()
        setUser(profile)
      } catch {
        setUser({ id: 'current', email, username, role: 'user', created_at: new Date().toISOString() })
      }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cs_token')
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }, [])

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin',
    isLoading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
