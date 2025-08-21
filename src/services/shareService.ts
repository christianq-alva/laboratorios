import { api } from './api'
import { config } from '../config/environment'

export interface ShareLink {
  id: number
  laboratorio_id: number
  laboratorio_nombre: string
  laboratorio_ubicacion: string
  escuela?: string
  token: string
  url: string
  fecha_expiracion: string
  activo: boolean
  expirado: boolean
  created_at: string
}

export interface PublicHorario {
  id: number
  fecha_inicio: string
  fecha_fin: string
  cantidad_alumnos?: number
  descripcion: string
  color?: string
  laboratorio: string
  docente: string
  escuela?: string
  ciclo?: string
  grupo: string
}

export interface PublicLaboratorio {
  id: number
  nombre: string
  ubicacion: string
  escuela?: string
  piso?: string
}

export interface PublicData {
  laboratorio: PublicLaboratorio
  horarios: PublicHorario[]
  filtros: {
    docentes: string[]
    ciclos: string[]
  }
}

export interface CreateShareLinkData {
  laboratorio_id: number
  expires_in_days?: number
}

export const shareService = {
  // Crear enlace compartible
  createShareLink: async (data: CreateShareLinkData) => {
    try {
      console.log('🔗 Creando enlace compartible:', data)
      const response = await api.post('/share/create', data)
      return response.data
    } catch (error: any) {
      console.error('❌ Error al crear enlace:', error)
      throw new Error(error.response?.data?.message || 'Error al crear enlace compartible')
    }
  },

  // Obtener enlaces del usuario
  getMyShareLinks: async () => {
    try {
      const response = await api.get('/share/my-links')
      return response.data
    } catch (error: any) {
      console.error('❌ Error al obtener enlaces:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener enlaces')
    }
  },

  // Desactivar enlace
  deactivateShareLink: async (id: number) => {
    try {
      const response = await api.put(`/share/deactivate/${id}`)
      return response.data
    } catch (error: any) {
      console.error('❌ Error al desactivar enlace:', error)
      throw new Error(error.response?.data?.message || 'Error al desactivar enlace')
    }
  },

  // Obtener horarios públicos (sin autenticación)
  getPublicHorarios: async (laboratorioId: number, token: string): Promise<PublicData> => {
    try {
      console.log('🌐 Obteniendo horarios públicos:', { laboratorioId, token: token.substring(0, 20) + '...' })
      
      // Hacer petición directa sin el interceptor de autenticación
      const baseUrl = config.isDevelopment ? 'http://localhost:3000' : config.baseUrl
      const response = await fetch(`${baseUrl}/api/share/public/${laboratorioId}?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || `Error ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Error al obtener horarios')
      }
      
      return data.data
    } catch (error: any) {
      console.error('❌ Error al obtener horarios públicos:', error)
      throw error
    }
  },

  // Validar token público
  validatePublicToken: async (laboratorioId: number, token: string): Promise<boolean> => {
    try {
      await shareService.getPublicHorarios(laboratorioId, token)
      return true
    } catch (error) {
      return false
    }
  },

  // Copiar enlace al portapapeles
  copyToClipboard: async (url: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
        return true
      } else {
        // Fallback para navegadores más antiguos
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        const success = document.execCommand('copy')
        document.body.removeChild(textArea)
        return success
      }
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error)
      return false
    }
  }
}
