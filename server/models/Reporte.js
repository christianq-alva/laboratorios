import { pool } from '../config/database.js'
import { handleDBError } from '../utils/handleDBError.js'

/**
 * Construye el filtro SQL por laboratorios según permisos del usuario.
 * @param {number[]} laboratorioIds - Array de IDs de laboratorio (vacío = sin restricción)
 * @returns {string} Fragmento SQL para añadir a WHERE (incluye " AND ..." o "")
 */
export function buildLabFilter(laboratorioIds) {
  if (!laboratorioIds || laboratorioIds.length === 0) return ''
  return ` AND r.laboratorio_id IN (${laboratorioIds.join(',')})`
}

export const Reporte = {
  /**
   * Comparación cantidad requerida vs consumida por laboratorio/escuela/insumo.
   * @param {object} params - { fecha_inicio, fecha_fin, laboratorio_id, escuela_id }
   * @param {string} labFilter - Fragmento SQL para filtrar por laboratorios (buildLabFilter)
   * @returns {{ data: object[], total_registros: number }}
   */
  getRequeridoVsConsumido: async (params, labFilter = '') => {
    const { fecha_inicio, fecha_fin, laboratorio_id, escuela_id } = params
    try {
      let queryRequerido = `
        SELECT 
          l.id as laboratorio_id,
          l.nombre as laboratorio_nombre,
          e.id as escuela_id,
          e.nombre as escuela_nombre,
          i.id as insumo_id,
          i.nombre as insumo_nombre,
          u.simbolo as unidad_simbolo,
          u.nombre as unidad_nombre,
          SUM(dri.cantidad_usada) as cantidad_requerida
        FROM reservas r
        INNER JOIN detalle_reserva_insumos dri ON r.id = dri.reserva_id
        INNER JOIN insumos i ON dri.insumo_id = i.id
        INNER JOIN unidades u ON i.unidad_id = u.id
        INNER JOIN laboratorios l ON r.laboratorio_id = l.id
        INNER JOIN escuelas e ON r.escuela_id = e.id
        WHERE 1=1 AND r.estado = 'C' 
        AND DATE(r.fecha_inicio) >= ? AND DATE(r.fecha_inicio) <= ? AND r.laboratorio_id = ? AND r.escuela_id = ?
        ${labFilter}
        GROUP BY l.id, e.id, i.id
      `
      let queryConsumido = `
        SELECT 
          l.id as laboratorio_id,
          e.id as escuela_id,
          i.id as insumo_id,
          SUM(mid.cantidad) as cantidad_consumida
        FROM movimientos_insumos m
        INNER JOIN movimiento_insumo_detalle mid ON m.id = mid.movimiento_id
        INNER JOIN insumos i ON mid.insumo_id = i.id
        INNER JOIN laboratorios l ON m.laboratorio_id = l.id
        INNER JOIN escuelas e ON l.escuela_id = e.id
        INNER JOIN reservas r ON m.reserva_id = r.id AND r.estado = 'C'
        WHERE m.tipo_movimiento = 'salida'
        AND DATE(r.fecha_inicio) >= ? AND DATE(r.fecha_inicio) <= ? AND r.laboratorio_id = ? AND r.escuela_id = ?
        ${labFilter}
        GROUP BY l.id, e.id, i.id
      `
      const queryParams = [fecha_inicio, fecha_fin, laboratorio_id, escuela_id]
      const [requeridos] = await pool.execute(queryRequerido, queryParams)
      const [consumidos] = await pool.execute(queryConsumido, queryParams)

      const consumidosMap = new Map()
      consumidos.forEach((c) => {
        const key = `${c.laboratorio_id}_${c.escuela_id}_${c.insumo_id}`
        consumidosMap.set(key, c.cantidad_consumida)
      })

      const data = requeridos.map((req) => {
        const key = `${req.laboratorio_id}_${req.escuela_id}_${req.insumo_id}`
        const cantidadConsumida = consumidosMap.get(key) || 0
        return {
          laboratorio_id: req.laboratorio_id,
          laboratorio_nombre: req.laboratorio_nombre,
          escuela_id: req.escuela_id,
          escuela_nombre: req.escuela_nombre,
          insumo_id: req.insumo_id,
          insumo_nombre: req.insumo_nombre,
          unidad_simbolo: req.unidad_simbolo,
          unidad_nombre: req.unidad_nombre,
          cantidad_requerida: parseFloat(req.cantidad_requerida) || 0,
          cantidad_consumida: parseFloat(cantidadConsumida) || 0
        }
      })

      return { data, total_registros: data.length }
    } catch (error) {
      handleDBError(error, 'Reporte')
    }
  },

  /**
   * Comparación stock actual vs cantidad requerida por laboratorio/insumo.
   * @param {object} params - { fecha_inicio, fecha_fin, laboratorio_id }
   * @param {string} labFilter - Fragmento SQL (buildLabFilter)
   * @returns {{ data: object[], total_registros: number }}
   */
  getStockVsRequerido: async (params, labFilter = '') => {
    const { fecha_inicio, fecha_fin, laboratorio_id } = params
    try {
      let queryRequerido = `
        SELECT 
          l.id as laboratorio_id,
          l.nombre as laboratorio_nombre,
          i.id as insumo_id,
          i.nombre as insumo_nombre,
          u.simbolo as unidad_simbolo,
          u.nombre as unidad_nombre,
          SUM(dri.cantidad_usada) as cantidad_requerida
        FROM reservas r
        INNER JOIN detalle_reserva_insumos dri ON r.id = dri.reserva_id
        INNER JOIN insumos i ON dri.insumo_id = i.id
        INNER JOIN unidades u ON i.unidad_id = u.id
        INNER JOIN laboratorios l ON r.laboratorio_id = l.id
        WHERE 1=1 AND r.estado = 'P'
        AND DATE(r.fecha_inicio) >= ? AND DATE(r.fecha_inicio) <= ? AND r.laboratorio_id = ?
        ${labFilter}
        GROUP BY l.id, i.id
      `
      const labFilterStock = labFilter ? labFilter.replace(/r\.laboratorio_id/g, 'm.laboratorio_id') : ''
      let queryStock = `
        SELECT 
          l.id as laboratorio_id,
          i.id as insumo_id,
          SUM(CASE WHEN m.tipo_movimiento = 'salida' THEN mid.cantidad * -1 ELSE mid.cantidad END) as stock_actual
        FROM movimientos_insumos m
        INNER JOIN movimiento_insumo_detalle mid ON m.id = mid.movimiento_id
        INNER JOIN insumos i ON mid.insumo_id = i.id
        INNER JOIN laboratorios l ON m.laboratorio_id = l.id
        WHERE 1=1 AND m.laboratorio_id = ?
        ${labFilterStock}
        GROUP BY l.id, i.id
      `
      const paramsRequerido = [fecha_inicio, fecha_fin, laboratorio_id]
      const paramsStock = [laboratorio_id]

      const [requeridos] = await pool.execute(queryRequerido, paramsRequerido)
      const [stocks] = await pool.execute(queryStock, paramsStock)

      const stocksMap = new Map()
      stocks.forEach((s) => {
        const key = `${s.laboratorio_id}_${s.insumo_id}`
        stocksMap.set(key, s.stock_actual)
      })

      const data = requeridos.map((req) => {
        const key = `${req.laboratorio_id}_${req.insumo_id}`
        const stockActual = stocksMap.get(key) || 0
        return {
          laboratorio_id: req.laboratorio_id,
          laboratorio_nombre: req.laboratorio_nombre,
          insumo_id: req.insumo_id,
          insumo_nombre: req.insumo_nombre,
          unidad_simbolo: req.unidad_simbolo,
          unidad_nombre: req.unidad_nombre,
          stock_actual: parseFloat(stockActual) || 0,
          cantidad_requerida: parseFloat(req.cantidad_requerida) || 0
        }
      })

      return { data, total_registros: data.length }
    } catch (error) {
      handleDBError(error, 'Reporte')
    }
  },

  getHorariosConCosto: async (params, labFilter = '') => {
    const { escuela_id, laboratorio_id, ciclo_id, fecha_desde, fecha_hasta } = params
    try {
      let query = `
        SELECT
          r.id,
          r.descripcion,
          r.fecha_inicio,
          r.fecha_fin,
          r.estado,
          r.num_grupos,
          r.cantidad_alumnos,
          e.id   AS escuela_id,
          e.nombre AS escuela,
          d.nombre AS docente,
          l.nombre AS laboratorio,
          c.nombre AS ciclo,
          CAST(
            COALESCE(SUM(dri.cantidad_usada * COALESCE(ip.precio, 0)) * r.num_grupos, 0)
            AS DECIMAL(10,2)
          ) AS costo_total_insumos,
          COUNT(DISTINCT dri.id) AS num_insumos
        FROM reservas r
        JOIN escuelas    e ON r.escuela_id    = e.id
        JOIN docentes    d ON r.docente_id    = d.id
        JOIN laboratorios l ON r.laboratorio_id = l.id
        JOIN ciclos      c ON r.ciclo_id      = c.id
        LEFT JOIN detalle_reserva_insumos dri ON dri.reserva_id = r.id
        LEFT JOIN insumos_precios ip
          ON ip.insumo_id = dri.insumo_id AND ip.vigente_hasta IS NULL
        WHERE 1=1
      `
      const queryParams = []

      if (escuela_id) {
        query += ' AND r.escuela_id = ?'
        queryParams.push(escuela_id)
      }
      if (laboratorio_id) {
        query += ' AND r.laboratorio_id = ?'
        queryParams.push(laboratorio_id)
      }
      if (ciclo_id) {
        query += ' AND r.ciclo_id = ?'
        queryParams.push(ciclo_id)
      }
      if (fecha_desde) {
        query += ' AND DATE(r.fecha_inicio) >= ?'
        queryParams.push(fecha_desde)
      }
      if (fecha_hasta) {
        query += ' AND DATE(r.fecha_inicio) <= ?'
        queryParams.push(fecha_hasta)
      }
      query += `${labFilter}
        GROUP BY r.id, r.descripcion, r.fecha_inicio, r.fecha_fin, r.estado,
                 r.num_grupos, r.cantidad_alumnos, e.id, e.nombre, d.nombre, l.nombre, c.nombre
        ORDER BY r.fecha_inicio DESC
      `
      const [rows] = await pool.execute(query, queryParams)
      return { data: rows, total_registros: rows.length }
    } catch (error) {
      handleDBError(error, 'Reporte')
    }
  },

  getCostoPorEscuela: async (params, labFilter = '') => {
    const { laboratorio_id, fecha_desde, fecha_hasta } = params
    try {
      let query = `
        SELECT
          e.id   AS escuela_id,
          e.nombre AS escuela,
          COUNT(DISTINCT r.id) AS total_horarios,
          CAST(
            COALESCE(SUM(dri.cantidad_usada * COALESCE(ip.precio, 0) * r.num_grupos), 0)
            AS DECIMAL(10,2)
          ) AS costo_total
        FROM reservas r
        JOIN escuelas e ON r.escuela_id = e.id
        LEFT JOIN detalle_reserva_insumos dri ON dri.reserva_id = r.id
        LEFT JOIN insumos_precios ip
          ON ip.insumo_id = dri.insumo_id AND ip.vigente_hasta IS NULL
        WHERE 1=1
      `
      const queryParams = []

      if (laboratorio_id) {
        query += ' AND r.laboratorio_id = ?'
        queryParams.push(laboratorio_id)
      }
      if (fecha_desde) {
        query += ' AND DATE(r.fecha_inicio) >= ?'
        queryParams.push(fecha_desde)
      }
      if (fecha_hasta) {
        query += ' AND DATE(r.fecha_inicio) <= ?'
        queryParams.push(fecha_hasta)
      }
      query += `${labFilter}
        GROUP BY e.id, e.nombre
        ORDER BY costo_total DESC
      `
      const [rows] = await pool.execute(query, queryParams)
      return { data: rows, total_registros: rows.length }
    } catch (error) {
      handleDBError(error, 'Reporte')
    }
  },

  getHorariosPorLaboratorio: async (params, labFilter = '') => {
    const { laboratorio_id, escuela_id, fecha_desde, fecha_hasta } = params
    try {
      let query = `
        SELECT
          l.id   AS laboratorio_id,
          l.nombre AS laboratorio,
          COUNT(DISTINCT r.id) AS total_horarios,
          COUNT(DISTINCT CASE WHEN r.estado = 'C' THEN r.id END) AS horarios_cerrados,
          COUNT(DISTINCT CASE WHEN r.estado = 'P' THEN r.id END) AS horarios_programados
        FROM reservas r
        JOIN laboratorios l ON r.laboratorio_id = l.id
        WHERE 1=1
      `
      const queryParams = []

      if (laboratorio_id) {
        query += ' AND r.laboratorio_id = ?'
        queryParams.push(laboratorio_id)
      }
      if (escuela_id) {
        query += ' AND r.escuela_id = ?'
        queryParams.push(escuela_id)
      }
      if (fecha_desde) {
        query += ' AND DATE(r.fecha_inicio) >= ?'
        queryParams.push(fecha_desde)
      }
      if (fecha_hasta) {
        query += ' AND DATE(r.fecha_inicio) <= ?'
        queryParams.push(fecha_hasta)
      }
      query += `${labFilter}
        GROUP BY l.id, l.nombre
        ORDER BY total_horarios DESC
      `
      const [rows] = await pool.execute(query, queryParams)
      return { data: rows, total_registros: rows.length }
    } catch (error) {
      handleDBError(error, 'Reporte')
    }
  }
}
