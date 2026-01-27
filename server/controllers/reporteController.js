import { pool } from '../config/database.js'
// Función auxiliar para verificar si el usuario tiene permisos de laboratorio específicos
const tieneRestriccionLaboratorio = (user) => {
  return user.rol === 'Jefe de Laboratorio' && user.laboratorio_ids && user.laboratorio_ids.length > 0
}
// Función auxiliar para obtener filtro de laboratorios
const getFiltroLaboratorios = (user) => {
  if (tieneRestriccionLaboratorio(user)) {
    return ` AND m.laboratorio_id IN (${user.laboratorio_ids.join(',')})`
  }
  return ''
}
// Obtener comparación de cantidad requerida vs consumida
export const getRequeridoVsConsumido = async (req, res) => {
  try {
    const {
      laboratorio_id,
      escuela_id,
      fecha_inicio,
      fecha_fin
    } = req.query

    console.log('📊 getRequeridoVsConsumido - Parámetros:', {
      laboratorio_id,
      escuela_id,
      fecha_inicio,
      fecha_fin,
      user_role: req.user.rol,
      user_laboratorio_ids: req.user.laboratorio_ids || []
    })

    // Query para obtener cantidad requerida (desde reservas/horarios)
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
      `

    // Query para obtener cantidad consumida (desde movimientos)
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
      INNER JOIN reservas r ON m.reserva_id = r.id and r.estado = 'C'
      WHERE m.tipo_movimiento = 'salida'
      AND DATE(r.fecha_inicio) >= ? AND DATE(r.fecha_inicio) <= ? AND r.laboratorio_id = ? AND r.escuela_id = ?
    `

    const paramsRequerido = [fecha_inicio, fecha_fin, laboratorio_id, escuela_id]
    const paramsConsumido = [fecha_inicio, fecha_fin, laboratorio_id, escuela_id]

    // Filtros según permisos del usuario
    if (tieneRestriccionLaboratorio(req.user)) {
      const labFilter = ` AND r.laboratorio_id IN (${req.user.laboratorio_ids.join(',')})`
      queryRequerido += labFilter
      queryConsumido += labFilter
    }

    // Agrupación de querys
    queryRequerido += ` GROUP BY l.id, e.id, i.id`
    queryConsumido += ` GROUP BY l.id, e.id, i.id`

    // Ejecutar ambas consultas
    const [requeridos] = await pool.execute(queryRequerido, paramsRequerido)
    const [consumidos] = await pool.execute(queryConsumido, paramsConsumido)

    // Crear mapa de consumidos para facilitar la búsqueda
    const consumidosMap = new Map()
    consumidos.forEach(cons => {
      const key = `${cons.laboratorio_id}_${cons.escuela_id}_${cons.insumo_id}`
      consumidosMap.set(key, cons.cantidad_consumida)
    })

    // Combinar datos
    const resultado = requeridos.map(req => {
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

    res.status(200).json({
      data: resultado,
      filtros: {
        laboratorio_id: laboratorio_id || null,
        escuela_id: escuela_id || null,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null
      },
      total_registros: resultado.length
    })
  } catch (error) {
    console.error('Error en getRequeridoVsConsumido:', error)
    res.status(500).json({
      message: error.message
    })
  }
}

// Obtener comparación de stock actual vs cantidad requerida
export const getStockVsRequerido = async (req, res) => {
  try {
    const {
      laboratorio_id,
      fecha_inicio,
      fecha_fin
    } = req.query

    console.log('📊 getStockVsRequerido - Parámetros:', {
      laboratorio_id,
      fecha_inicio,
      fecha_fin,
      user_role: req.user.rol,
      user_laboratorio_ids: req.user.laboratorio_ids || []
    })

    // Query para obtener cantidad requerida (desde reservas/horarios)
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
    `

    // Query para obtener stock actual
    let queryStock = `
      SELECT 
        l.id as laboratorio_id,
        i.id as insumo_id,
        SUM(CASE WHEN m.tipo_movimiento = 'salida' THEN mid.cantidad * -1 ELSE mid.cantidad END) as stock_actual
      FROM movimientos_insumos m
      INNER JOIN movimiento_insumo_detalle mid ON m.id = mid.movimiento_id
      INNER JOIN insumos i ON mid.insumo_id = i.id
      INNER JOIN laboratorios l ON m.laboratorio_id = l.id
      WHERE 1=1
      AND m.laboratorio_id = ?
    `

    const paramsRequerido = [fecha_inicio, fecha_fin, laboratorio_id]
    const paramsStock = [laboratorio_id]

    // Filtros según permisos del usuario
    if (tieneRestriccionLaboratorio(req.user)) {
      const labFilter = ` AND r.laboratorio_id IN (${req.user.laboratorio_ids.join(',')})`
      queryRequerido += labFilter
      queryStock += labFilter
    }

    queryRequerido += ` GROUP BY l.id, i.id`
    queryStock += ` GROUP BY l.id, i.id`

    // Ejecutar ambas consultas
    const [requeridos] = await pool.execute(queryRequerido, paramsRequerido)
    const [stocks] = await pool.execute(queryStock, paramsStock)

    // Crear mapa de stocks para facilitar la búsqueda
    const stocksMap = new Map()
    stocks.forEach(stock => {
      const key = `${stock.laboratorio_id}_${stock.insumo_id}`
      stocksMap.set(key, stock.stock_actual)
    })

    // Combinar datos
    const resultado = requeridos.map(req => {
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

    console.log('📈 Datos de stock vs requerido encontrados:', resultado.length)

    res.status(200).json({
      data: resultado,
      filtros: {
        laboratorio_id: laboratorio_id || null,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null
      },
      total_registros: resultado.length
    })
  } catch (error) {
    console.error('Error en getStockVsRequerido:', error)
    res.status(500).json({
      message: error.message
    })
  }
}

// Función auxiliar para convertir datos a CSV
function convertirACSV(datos, tipoReporte) {
  if (!datos || datos.length === 0) {
    return 'No hay datos disponibles'
  }
  // Obtener las claves del primer objeto para crear el encabezado
  const headers = Object.keys(datos[0]).join(',')
  // Convertir cada fila de datos
  const filas = datos.map(item => {
    return Object.values(item).map(valor => {
      // Escapar valores que contengan comas o comillas
      if (typeof valor === 'string' && (valor.includes(',') || valor.includes('"'))) {
        return `"${valor.replace(/"/g, '""')}"`
      }
      return valor || ''
    }).join(',')
  })
  return [headers, ...filas].join('\n')
}
