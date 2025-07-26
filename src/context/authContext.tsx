/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode, useEffect } from 'react'
import { authService, type User, type LoginData } from '../services/authService'

interface AuthContextType {
  user: User | null
  login: (data: LoginData) => Promise<{success: boolean, message?: string}>
  logout: () => void
  loading: boolean
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 🔄 RECUPERAR TOKEN AL CARGAR LA APP
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const login = async (data: LoginData) => {
    setLoading(true)
    try {
      const response = await authService.login(data)
      
      if (response.success && response.user && response.token) {
        setUser(response.user)
        setToken(response.token)
        
        // 💾 GUARDAR EN LOCALSTORAGE
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        
        console.log('🎫 Token guardado:', response.token)
        return { success: true }
      } else {
        return { success: false, message: response.message }
      }
    } catch (error) {
      return { success: false, message: 'Error de conexión' }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    // 🗑️ LIMPIAR LOCALSTORAGE
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}