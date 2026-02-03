import React, { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { AuthContext, type User } from '@/lib/auth'
import { client } from '@/lib/api'
import { logger, LogKeys } from '@/lib/logger'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  )
  const [user, setUser] = useState<User | null>(null)

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    logger.info('User session ended')
    toast.success('Signed out successfully')
  }, [])

  const fetchUser = useCallback(async () => {
    if (!token) return

    try {
      const { data, error, response } = await client.GET('/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (error || !response.ok) {
        // If the token is invalid or user doesn't exist, we must log out
        // This ensures strict sync between token validity and user existence
        logger.warn('failed to fetch user context, logging out', {
          status: response.status,
          error,
        })
        logout()
        return
      }

      if (data) {
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
      }
    } catch (err) {
      logger.error('failed to fetch user info', { error: err })
      // If we completely fail to execute the request, we should probably logout too
      // to avoid stuck states, but let's be careful about network errors vs auth errors.
      // For now, let's assume if we can't verify the user, we aren't authenticated.
      logout()
    }
  }, [token, logout])

  const login = useCallback((newToken: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    logger.info('User session started')
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
      // eslint-disable-next-line
      fetchUser()
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
