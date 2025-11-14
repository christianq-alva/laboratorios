import { api } from './api'
import type { ApiDataResponse } from './types'

export interface Ciclo {
  id: number
  nombre: string
  numero_ciclo?: number
}

export const cicloService = {
  // Obtener todos los ciclos
  getAll: async (): Promise<ApiDataResponse<Ciclo[]>> => {
    const response = await api.get('/ciclos')
    return response.data
  }
}

