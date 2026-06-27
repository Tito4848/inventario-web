import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  login as apiLogin,
  logout as apiLogout,
  getMe,
  isRememberSession,
  refreshSession,
  type AuthUser,
} from './auth'
import type { UserPermissions } from './permissions'
import { getDefaultRoute } from './permissions'

const REFRESH_INTERVAL_MS = 50 * 60 * 1000

type AuthContextValue = {
  user: AuthUser | null
  permissions: UserPermissions | null
  loading: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<string>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshTimerRef = useRef<number | null>(null)

  function clearRefreshTimer() {
    if (refreshTimerRef.current !== null) {
      window.clearInterval(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }

  function scheduleRefresh() {
    clearRefreshTimer()
    refreshTimerRef.current = window.setInterval(async () => {
      const refreshed = await refreshSession()
      if (!refreshed) {
        const session = await getMe()
        if (!session.user) {
          setUser(null)
          setPermissions(null)
          clearRefreshTimer()
        }
        return
      }
      const session = await getMe()
      setUser(session.user ?? refreshed)
      setPermissions(session.permissions)
    }, REFRESH_INTERVAL_MS)
  }

  async function refreshUser() {
    const session = await getMe()
    setUser(session.user)
    setPermissions(session.permissions)
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const session = await getMe()
        if (!session.user) {
          await refreshSession()
          const retry = await getMe()
          if (mounted) {
            setUser(retry.user)
            setPermissions(retry.permissions)
          }
        } else if (mounted) {
          setUser(session.user)
          setPermissions(session.permissions)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
      clearRefreshTimer()
    }
  }, [])

  useEffect(() => {
    if (user && isRememberSession()) {
      scheduleRefresh()
      return clearRefreshTimer
    }
    clearRefreshTimer()
    return undefined
  }, [user?.id])

  async function login(email: string, password: string, remember = false): Promise<string> {
    const loginUser = await apiLogin(email, password, remember)
    if (loginUser) {
      setUser(loginUser)
    }
    const session = await getMe()
    setUser(session.user ?? loginUser)
    setPermissions(session.permissions)
    if (!session.user && !loginUser) {
      throw new Error('Inicio de sesión exitoso pero no se pudo cargar el usuario')
    }
    if (remember) scheduleRefresh()
    return getDefaultRoute(session.permissions, session.user?.roles ?? loginUser?.roles)
  }

  async function logout() {
    clearRefreshTimer()
    await apiLogout()
    setUser(null)
    setPermissions(null)
  }

  return (
    <AuthContext.Provider value={{ user, permissions, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
