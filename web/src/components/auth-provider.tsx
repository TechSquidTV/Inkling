import React, { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { AuthContext, type User } from '@/lib/auth'
import { fetchWithAuth } from '@/lib/api'
import { logger, LogKeys } from '@/lib/logger'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  )
  const [user, setUser] = useState<User | null>(null)

  const fetchUser = useCallback(async () => {
    if (!token) return

    try {
      const data = await fetchWithAuth<{
        id: number
        email: string
        name: string
        role: 'admin' | 'user'
        has_password: boolean
      }>('/api/me', { token })

      setUser({
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role as 'admin' | 'user',
        hasPassword: data.has_password,
      })
      logger
        .with({ [LogKeys.USER_ID]: data.id })
        .debug('user info fetched', { email: data.email, role: data.role })
    } catch (err) {
      logger.error('failed to fetch user info', { error: err })
      setUser(null)
    }
  }, [token])

  const login = useCallback((newToken: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    logger.info('User session started')
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    logger.info('User session ended')
    toast.success('Signed out successfully')
  }, [])

  const refreshUser = useCallback(async () => {
    await fetchUser()
  }, [fetchUser])

  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [logout])

  // Fetch user info when token changes
  useEffect(() => {
    if (token) {
      fetchUser() // eslint-disable-line
    }
  }, [token, fetchUser])

  const isAuthenticated = !!token
  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        user,
        isAdmin,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
