/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, type ReactNode, useEffect } from 'react'
import { authService, type User, type LoginRequest } from '../services/authService'
import { type ApiError } from '../services/api'

interface AuthContextType {
  user: User | null
  login: (data: LoginRequest) => Promise<{ success: boolean, message?: string }>
  logout: () => void
  loading: boolean
  isLoggingIn: boolean
  token: string | null
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }

    setLoading(false)
  }, [])

  const login = async (data: LoginRequest) => {
    setIsLoggingIn(true)
    try {
      const response = await authService.login(data)

      if (response.success && response.user && response.token) {
        setUser(response.user)
        setToken(response.token)

        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))

        return { success: true }
      } else {
        return { success: false, message: response.message }
      }
    } catch (error) {
      const apiError = error as ApiError
      const errorData = apiError.response?.data as any

      const errorMessage = errorData?.message ||
        (apiError as any).message ||
        apiError.message ||
        'Error al iniciar sesión'

      return { success: false, message: errorMessage }
    } finally {
      setIsLoggingIn(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isLoggingIn, token }}>
      {children}
    </AuthContext.Provider>
  )
}

