import { api } from './api'
import { config } from '../config/environment'
import type { ApiDataResponse } from './types'

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

export interface PublicInsumo {
  id: number
  nombre: string
  descripcion?: string
  cantidad_usada: number
  unidad_medida?: string
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
  insumos?: PublicInsumo[]
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
  // Obtener enlaces del usuario
  getMyShareLinks: async (): Promise<ApiDataResponse<ShareLink[]>> => {
    const response = await api.get('/share/my-links')
    return response.data
  },
  // Crear enlace compartible
  createShareLink: async (data: CreateShareLinkData) => {
    const response = await api.post('/share/create', data)
    return response.data
  },
  // Desactivar enlace
  deactivateShareLink: async (id: number) => {
    const response = await api.put(`/share/deactivate/${id}`)
    return response.data
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

      if (data.message && !data.data) {
        throw new Error(data.message || 'Error al obtener horarios')
      }

      return data.data
    } catch (error: any) {
      console.error('❌ Error al obtener horarios públicos:', error)
      throw error
    }
  },
}
