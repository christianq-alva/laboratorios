const API_URL = 'http://localhost:3000/api/auth'

export interface LoginData {
  usuario: string
  contrasena: string
}

export interface User {
  id: number
  nombre: string
  usuario: string
  rol: string
}

export interface LoginResponse {
  success: boolean
  user?: User
  permisos?: Array<{nombre: string, ruta: string}>
  token?: string
  message?: string
}

export const authService = {
  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }
}