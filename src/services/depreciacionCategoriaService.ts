import { api } from './api'
import type { ApiResponse, ApiMessageResponse, ApiCreateUpdateResponse } from './types'

export interface DepreciacionCategoria {
  id: number
  nombre: string
  /** Puntos porcentuales aplicados por práctica sobre el valor del bien (1 = 1%, 0.05 = 0.05%) */
  porcentaje: number | string
  descripcion?: string | null
  activo: number | boolean
  count_equipos?: number
  count_materiales?: number
}

export interface DepreciacionCategoriaInput {
  nombre: string
  porcentaje: number
  descripcion?: string | null
  activo: boolean
}

export const depreciacionCategoriaService = {
  // Obtener todas las categorías
  getAll: async (): Promise<ApiResponse<DepreciacionCategoria[]>> => {
    const response = await api.get('/depreciacion-categorias')
    return response.data
  },

  // Obtener solo las categorías activas (para selectores)
  getActivas: async (): Promise<ApiResponse<DepreciacionCategoria[]>> => {
    const response = await api.get('/depreciacion-categorias/activas')
    return response.data
  },

  // Obtener categorías con la cantidad de bienes asignados
  getAllWithCount: async (): Promise<ApiResponse<DepreciacionCategoria[]>> => {
    const response = await api.get('/depreciacion-categorias/with-count')
    return response.data
  },

  // Obtener una categoría por ID
  getById: async (id: number): Promise<ApiResponse<DepreciacionCategoria>> => {
    const response = await api.get(`/depreciacion-categorias/${id}`)
    return response.data
  },

  // Crear una categoría
  create: async (data: DepreciacionCategoriaInput): Promise<ApiCreateUpdateResponse<DepreciacionCategoria>> => {
    const response = await api.post('/depreciacion-categorias', data)
    return response.data
  },

  // Actualizar una categoría
  update: async (id: number, data: DepreciacionCategoriaInput): Promise<ApiCreateUpdateResponse<DepreciacionCategoria>> => {
    const response = await api.put(`/depreciacion-categorias/${id}`, data)
    return response.data
  },

  // Eliminar una categoría
  delete: async (id: number): Promise<ApiMessageResponse> => {
    const response = await api.delete(`/depreciacion-categorias/${id}`)
    return response.data
  }
}

/** Formatea el porcentaje sin ceros sobrantes: 1 → "1%", 0.05 → "0.05%" */
export const formatPorcentaje = (porcentaje: number | string): string => {
  const valor = Number(porcentaje)
  if (!Number.isFinite(valor)) return '—'
  return `${parseFloat(valor.toFixed(4))}%`
}

/**
 * Costo de depreciación de una línea de práctica.
 * Debe coincidir con el cálculo congelado en el backend al guardar el horario.
 */
export const calcularDepreciacion = (
  valorUnitario: number | string | null | undefined,
  porcentaje: number | string | null | undefined,
  cantidad: number,
  numGrupos: number
): number => {
  const valor = Number(valorUnitario ?? 0)
  const pct = Number(porcentaje ?? 0)
  if (!Number.isFinite(valor) || !Number.isFinite(pct)) return 0
  return valor * (pct / 100) * cantidad * numGrupos
}
