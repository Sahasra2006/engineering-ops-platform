import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(false)

  const isAuthenticated = !!localStorage.getItem('accessToken')
  const role = user?.role || null

  const login = async ({ email, password }) => {
    setLoading(true)
    try {
      const res = await authApi.login({ email, password })
      localStorage.setItem('accessToken', res.token)
      localStorage.setItem('refreshToken', res.refreshToken)
      localStorage.setItem('user', JSON.stringify(res.user))
      setUser(res.user)
      return res
    } finally {
      setLoading(false)
    }
  }

  const signup = async (payload) => {
    setLoading(true)
    try {
      return await authApi.signup(payload)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      if (refreshToken) await authApi.logout({ refresh_token: refreshToken })
    } catch {
      // ignore logout errors
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      setUser(null)
    }
  }

  // Keep state consistent if user manually clears storage
  useEffect(() => {
    if (!localStorage.getItem('accessToken')) setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, role, isAuthenticated, loading, login, signup, logout }),
    [user, role, isAuthenticated, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

