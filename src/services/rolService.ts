import { api } from "./api"
import type { ApiDataResponse } from "./types"

export interface Rol {
  id: number
  nombre: string
}

export const rolService = {
  getAll: async (): Promise<ApiDataResponse<Rol[]>> => {
    const response = await api.get('/roles')
    return response.data
  }
}