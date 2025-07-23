import { useState } from 'react'
import { authService, type User, type LoginData } from '../services/authService'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  const login = async (data: LoginData) => {
    setLoading(true)
    try {
      const response = await authService.login(data)
      console.log('🔍 Full server response:', response)
      if (response.success && response.user) {
        console.log('✅ Setting user:', response.user)
        setUser(response.user)
        console.log('✅ User set successfully')
        return { success: true }
      } else {
        console.log('❌ No user in response')
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
  }

  return { user, login, logout, loading }
}