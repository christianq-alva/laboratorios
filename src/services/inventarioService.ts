import type { ApiDataResponse } from "./types"
import { api } from "./api"


export interface DatoValidado {
    fila: number
    insumo_id: number
    insumo_codigo: string
    insumo_nombre: string
    insumo_unidad: string
    cantidad: number
    insumo_lote: string
    insumo_fecha_venc: string
}

export interface InsumoSaldo {
    id: number
    codigo: string
    nombre: string
    description: string
    unidad_simbolo: string
    unidad_nombre: string
    categoria: 'Reactivos' | 'Materiales' | 'Material_Biologico'
    presentacion: string
    total_lotes: number
    stock_disponible: number
}

export interface ActividadInsumo {
    id: number
    fecha_movimiento: string
    fecha_ingreso: string
    tipo_movimiento: 'entrada' | 'salida'
    observaciones: string
    laboratorio_nombre: string
    usuario_nombre: string
    usuario_rol: string
    reserva_descripcion?: string
    reserva_fecha_inicio?: string
    reserva_fecha_fin?: string
}

export interface LoteInsumo {
    detalle_id: number
    insumo_id: number
    insumo_nombre: string
    insumo_codigo: string
    unidad_simbolo: string
    unidad_nombre: string
    lote: string
    cantidad_original: number
    saldo: number
    fecha_vencimiento: string | null
    fecha_ingreso: string
    dias_para_vencer: number | null
}

export interface Lote {
    detalle_id: number
    insumo_id: number
    insumo_nombre: string
    insumo_codigo: string
    unidad_simbolo: string
    unidad_nombre: string
    lote: string
    cantidad_original: number
    saldo: number
    fecha_vencimiento: string | null
    fecha_ingreso: string
    fecha_movimiento: string
    laboratorio_id: number
    laboratorio_nombre: string
    laboratorio_codigo: string
    dias_para_vencer: number | null
}

export const inventarioService = {
    //Obtener los insumos y su stock de todos los laboratorios
    getAllWithStock: async (): Promise<ApiDataResponse<InsumoSaldo[]>> => {
        const response = await api.get('/inventario/all-con-saldo')
        console.log(response.data)
        return response.data
    },

    //Obtener los insumos y su stock de un laboratorio
    getWithStock: async (laboratorio_id: number): Promise<ApiDataResponse<InsumoSaldo[]>> => {
        const params = new URLSearchParams()
        params.append('laboratorio_id', laboratorio_id.toString());
        const response = await api.get(`/inventario/insumos-con-saldo?${params.toString()}`)
        return response.data
    },

    //Obtener solo los insumos con stock de un laboratorio
    getWithPositiveStock: async (laboratorio_id: number): Promise<ApiDataResponse<InsumoSaldo[]>> => {
        const params = new URLSearchParams()
        params.append('laboratorio_id', laboratorio_id.toString());
        const response = await api.get(`/inventario/insumos-con-saldo-positivo?${params.toString()}`)
        return response.data
    },

    //Obtener listado de movimiento con filtro de laboratorio, rango de fechas y tipo de movimiento
    getActividad: async (filters?: {
        laboratorio_id?: number
        fecha_inicio?: string
        fecha_fin?: string
        tipo_movimiento?: string
    }): Promise<ApiDataResponse<ActividadInsumo[]>> => {
        const params = new URLSearchParams()
        if (filters?.laboratorio_id) params.append('laboratorio_id', filters.laboratorio_id.toString())
        if (filters?.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
        if (filters?.fecha_fin) params.append('fecha_fin', filters.fecha_fin)
        if (filters?.tipo_movimiento) params.append('tipo_movimiento', filters.tipo_movimiento)
        const response = await api.get(`/inventario/actividad?${params.toString()}`)
        return response.data
    },

    //Generar plantilla excel para reabastecimiento masivo
    descargarPlantillaExcel: async (): Promise<{ data: Blob }> => {
        try {
            const response = await api.get('/inventario/plantilla-excel', {
                responseType: 'blob'
            })
            return { data: response.data }
        } catch (error: any) {
            console.error('Error al descargar plantilla Excel:', error)
            throw new Error(error.response?.data?.message || 'Error al descargar plantilla Excel')
        }
    },

    //Procesar archivo excel para reabastecimiento masivo
    procesarArchivoExcel: async (formData: FormData, laboratorio_id: number
    ): Promise<{
        success: boolean
        message: string
        data: {
            archivo: string
            total_filas: number
            registros_validos: number
            registros_con_errores: number
            datos_validados: DatoValidado[]
            errores: string[]
        }
    }> => {
        try {
            const response = await api.post('/inventario/procesar-excel', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                params: {
                    laboratorio_id
                }
            })
            return response.data
        } catch (error: any) {
            console.error('Error al procesar archivo Excel:', error)
            throw new Error(error.response?.data?.message || 'Error al procesar archivo Excel')
        }
    },

    //Ejecutar reabastecimiento masivo 
    ejecutarReabastecimientoMasivo: async (data: {
        datos_reabastecimiento: Array<{
            insumo_id: number
            cantidad: number
            lote: string | null
            fecha_vencimiento?: string | null
            entrada_detalle_id?: number | null
        }>
        fecha_movimiento: string | null
        motivo_general: string
        laboratorio_id: number
    }): Promise<{
        success: boolean
        message: string
        data: {
            total_registros: number
            registros_procesados: number
            registros_fallidos: number
            motivo: string
            resultados: Array<{
                insumo: string
                laboratorio: string
                cantidad: number
                estado: 'exitoso' | 'error'
                error?: string
            }>
        }
    }> => {
        try {
            const response = await api.post('/inventario/reabastecimiento-masivo', data)
            return response.data
        } catch (error: any) {
            console.error('Error al ejecutar reabastecimiento masivo:', error)
            throw new Error(error.response?.data?.message || 'Error al ejecutar reabastecimiento masivo')
        }
    },

    //Obtener lotes con saldo disponible por laboratorio e insumo
    getLotesConSaldo: async (laboratorioId: number, insumoId?: number): Promise<ApiDataResponse<LoteInsumo[]>> => {
        const params = new URLSearchParams()
        params.append('laboratorio_id', laboratorioId.toString())
        if (insumoId) params.append('insumo_id', insumoId.toString())
        const response = await api.get(`/inventario/lotes-con-saldo?${params.toString()}`)
        return response.data
    },

    // Registrar movimiento manual (entrada o salida)
    registrarMovimiento: async (data: {
        laboratorio_id: number
        tipo_movimiento: 'entrada' | 'salida'
        observaciones?: string | null
        reserva_id?: number | null
        fecha_movimiento?: string | null
        detalles: Array<{
            insumo_id: number
            cantidad: number
            lote?: string | null
            fecha_vencimiento?: string | null
            entrada_detalle_id?: number | null  // Para salidas: ID del lote de entrada a reducir
        }>
    }): Promise<{ success: boolean; message: string; movimiento_id: number }> => {
        const response = await api.post('/inventario/movimiento-manual', data)
        return response.data
    },

    // Eliminar movimiento de inventario por ID
    eliminarMovimiento: async (movimientoId: number): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete(`/inventario/movimiento-manual/eliminar/${movimientoId}`)
        return response.data
    },

    // Obtener todos los lotes de un insumo agrupados por laboratorio
    getLotesPorInsumo: async (insumoId: number, laboratorioId?: number): Promise<ApiDataResponse<Lote[]>> => {
        const params = new URLSearchParams()
        params.append('insumo_id', insumoId.toString())
        if (laboratorioId) {
            params.append('laboratorio_id', laboratorioId.toString())
        }
        const response = await api.get(`/inventario/lotes-por-insumo?${params.toString()}`)
        return response.data
    },

    // Obtener detalle de movimientos de un insumo específico
    getActividadDetalleInsumos: async (insumoId: number, laboratorioId?: number): Promise<ApiDataResponse<Array<{
        id: number
        fecha_movimiento: string
        tipo_movimiento: 'entrada' | 'salida'
        fecha_ingreso: string | null
        observaciones: string | null
        laboratorio_nombre: string
        cantidad: number
        lote: string | null
    }>>> => {
        const params = new URLSearchParams()
        params.append('insumo_id', insumoId.toString())
        if (laboratorioId) {
            params.append('laboratorio_id', laboratorioId.toString())
        }
        const response = await api.get(`/inventario/actividad-detalle?${params.toString()}`)
        return response.data
    }
}
