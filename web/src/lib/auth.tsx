import { createContext, useContext } from 'react'

export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'user'
  hasPassword: boolean
}

export interface AuthContextType {
  isAuthenticated: boolean
  token: string | null
  user: User | null
  isAdmin: boolean
  login: (token: string) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
