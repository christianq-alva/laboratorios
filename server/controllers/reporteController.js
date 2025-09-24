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

// Obtener resumen de consumo por laboratorio (mensual/anual)
export const getConsumoResumen = async (req, res) => {
  try {
    const { 
      tipo_periodo = 'mensual', // 'mensual' | 'anual'
      fecha_inicio,
      fecha_fin,
      laboratorio_id,
      escuela_id,
      categoria_insumo
    } = req.query

    console.log('📊 getConsumoResumen - Parámetros:', {
      tipo_periodo,
      fecha_inicio,
      fecha_fin,
      laboratorio_id,
      escuela_id,
      categoria_insumo,
      user_role: req.user.rol,
      user_laboratorio_ids: req.user.laboratorio_ids || []
    })

    // Construir query base según el tipo de período
    let dateGroupBy = ''
    let dateFormat = ''
    
    if (tipo_periodo === 'mensual') {
      dateGroupBy = 'YEAR(m.fecha_movimiento), MONTH(m.fecha_movimiento)'
      dateFormat = 'DATE_FORMAT(m.fecha_movimiento, "%Y-%m") as periodo'
    } else {
      dateGroupBy = 'YEAR(m.fecha_movimiento)'
      dateFormat = 'YEAR(m.fecha_movimiento) as periodo'
    }

    let query = `
      SELECT 
        ${dateFormat},
        l.id as laboratorio_id,
        l.nombre as laboratorio_nombre,
        l.escuela_id,
        i.categoria,
        i.nombre as insumo_nombre,
        i.unidad_medida,
        SUM(CASE WHEN m.tipo_movimiento = 'salida' THEN m.cantidad ELSE 0 END) as total_consumido,
        SUM(CASE WHEN m.tipo_movimiento = 'entrada' THEN m.cantidad ELSE 0 END) as total_ingresado,
        COUNT(DISTINCT CASE WHEN m.tipo_movimiento = 'salida' THEN m.id END) as num_movimientos_salida,
        COUNT(DISTINCT CASE WHEN m.tipo_movimiento = 'entrada' THEN m.id END) as num_movimientos_entrada
      FROM movimientos_insumos m
      INNER JOIN insumos i ON m.insumo_id = i.id
      INNER JOIN laboratorios l ON m.laboratorio_id = l.id
      WHERE 1=1
    `

    const params = []

    // Filtros según permisos del usuario
    query += getFiltroLaboratorios(req.user)

    // Filtros opcionales
    if (fecha_inicio) {
      query += ` AND DATE(m.fecha_movimiento) >= ?`
      params.push(fecha_inicio)
    }

    if (fecha_fin) {
      query += ` AND DATE(m.fecha_movimiento) <= ?`
      params.push(fecha_fin)
    }

    if (laboratorio_id) {
      query += ` AND m.laboratorio_id = ?`
      params.push(laboratorio_id)
    }

    if (escuela_id) {
      query += ` AND l.escuela_id = ?`
      params.push(escuela_id)
    }

    if (categoria_insumo) {
      query += ` AND i.categoria = ?`
      params.push(categoria_insumo)
    }

    query += ` GROUP BY ${dateGroupBy}, l.id, i.categoria, i.id`
    query += ` ORDER BY periodo DESC, l.nombre, i.categoria, total_consumido DESC`

    const [rows] = await pool.execute(query, params)

    console.log('📈 Datos de consumo encontrados:', rows.length)

    res.json({
      success: true,
      data: rows,
      filtros: {
        tipo_periodo,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        laboratorio_id: laboratorio_id || null,
        escuela_id: escuela_id || null,
        categoria_insumo: categoria_insumo || null
      },
      total_registros: rows.length
    })

  } catch (error) {
    console.error('Error en getConsumoResumen:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message 
    })
  }
}

// Obtener datos agregados para dashboard ejecutivo
export const getDashboardEjecutivo = async (req, res) => {
  try {
    const { 
      fecha_inicio,
      fecha_fin,
      laboratorio_id,
      escuela_id
    } = req.query

    console.log('📊 getDashboardEjecutivo - Parámetros:', {
      fecha_inicio,
      fecha_fin,
      laboratorio_id,
      escuela_id,
      user_role: req.user.rol
    })

    // Query para obtener métricas principales
    let metricsQuery = `
      SELECT 
        COUNT(DISTINCT m.laboratorio_id) as total_laboratorios_activos,
        COUNT(DISTINCT i.categoria) as total_categorias,
        COUNT(DISTINCT i.id) as total_insumos_utilizados,
        SUM(CASE WHEN m.tipo_movimiento = 'salida' THEN m.cantidad ELSE 0 END) as total_consumo,
        SUM(CASE WHEN m.tipo_movimiento = 'entrada' THEN m.cantidad ELSE 0 END) as total_ingresos,
        COUNT(DISTINCT DATE(m.fecha_movimiento)) as dias_actividad
      FROM movimientos_insumos m
      INNER JOIN insumos i ON m.insumo_id = i.id
      INNER JOIN laboratorios l ON m.laboratorio_id = l.id
      WHERE 1=1
    `

    // Query para consumo por laboratorio
    let consumoPorLabQuery = `
      SELECT 
        l.id as laboratorio_id,
        l.nombre as laboratorio_nombre,
        l.escuela_id,
        SUM(CASE WHEN m.tipo_movimiento = 'salida' THEN m.cantidad ELSE 0 END) as total_consumido,
        COUNT(DISTINCT i.id) as insumos_diferentes,
        COUNT(DISTINCT DATE(m.fecha_movimiento)) as dias_activo
      FROM movimientos_insumos m
      INNER JOIN insumos i ON m.insumo_id = i.id
      INNER JOIN laboratorios l ON m.laboratorio_id = l.id
      WHERE 1=1
    `

    // Query para consumo por categoría
    let consumoPorCategoriaQuery = `
      SELECT 
        i.categoria,
        SUM(CASE WHEN m.tipo_movimiento = 'salida' THEN m.cantidad ELSE 0 END) as total_consumido,
        COUNT(DISTINCT i.id) as insumos_diferentes,
        COUNT(DISTINCT m.laboratorio_id) as laboratorios_usuarios
      FROM movimientos_insumos m
      INNER JOIN insumos i ON m.insumo_id = i.id
      INNER JOIN laboratorios l ON m.laboratorio_id = l.id
      WHERE 1=1
    `

    // Query para tendencia mensual
    let tendenciaMensualQuery = `
      SELECT 
        DATE_FORMAT(m.fecha_movimiento, '%Y-%m') as periodo,
        SUM(CASE WHEN m.tipo_movimiento = 'salida' THEN m.cantidad ELSE 0 END) as consumo_mes,
        SUM(CASE WHEN m.tipo_movimiento = 'entrada' THEN m.cantidad ELSE 0 END) as ingreso_mes,
        COUNT(DISTINCT m.laboratorio_id) as laboratorios_activos
      FROM movimientos_insumos m
      INNER JOIN insumos i ON m.insumo_id = i.id
      INNER JOIN laboratorios l ON m.laboratorio_id = l.id
      WHERE 1=1
    `

    const params = []

    // Aplicar filtros de permisos
    if (tieneRestriccionLaboratorio(req.user)) {
      const labFilter = ` AND m.laboratorio_id IN (${req.user.laboratorio_ids.join(',')})`
      metricsQuery += labFilter
      consumoPorLabQuery += labFilter
      consumoPorCategoriaQuery += labFilter
      tendenciaMensualQuery += labFilter
    }

    // Aplicar filtros de fecha
    if (fecha_inicio) {
      const dateFilter = ` AND DATE(m.fecha_movimiento) >= ?`
      metricsQuery += dateFilter
      consumoPorLabQuery += dateFilter
      consumoPorCategoriaQuery += dateFilter
      tendenciaMensualQuery += dateFilter
    }

    if (fecha_fin) {
      const dateFilter = ` AND DATE(m.fecha_movimiento) <= ?`
      metricsQuery += dateFilter
      consumoPorLabQuery += dateFilter
      consumoPorCategoriaQuery += dateFilter
      tendenciaMensualQuery += dateFilter
    }

    if (laboratorio_id) {
      const labFilter = ` AND m.laboratorio_id = ?`
      metricsQuery += labFilter
      consumoPorLabQuery += labFilter
      consumoPorCategoriaQuery += labFilter
      tendenciaMensualQuery += labFilter
    }

    if (escuela_id) {
      const escuelaFilter = ` AND l.escuela_id = ?`
      metricsQuery += escuelaFilter
      consumoPorLabQuery += escuelaFilter
      consumoPorCategoriaQuery += escuelaFilter
      tendenciaMensualQuery += escuelaFilter
    }

    // Completar queries con GROUP BY y ORDER BY
    consumoPorLabQuery += ` GROUP BY l.id ORDER BY total_consumido DESC LIMIT 10`
    consumoPorCategoriaQuery += ` GROUP BY i.categoria ORDER BY total_consumido DESC`
    tendenciaMensualQuery += ` GROUP BY DATE_FORMAT(m.fecha_movimiento, '%Y-%m') ORDER BY periodo DESC LIMIT 12`

    // Construir array de parámetros según filtros aplicados
    const queryParams = []
    if (fecha_inicio) queryParams.push(fecha_inicio)
    if (fecha_fin) queryParams.push(fecha_fin)
    if (laboratorio_id) queryParams.push(laboratorio_id)
    if (escuela_id) queryParams.push(escuela_id)

    // Ejecutar todas las consultas en paralelo
    const [
      [metricas],
      [consumoPorLab],
      [consumoPorCategoria],
      [tendenciaMensual]
    ] = await Promise.all([
      pool.execute(metricsQuery, queryParams),
      pool.execute(consumoPorLabQuery, queryParams),
      pool.execute(consumoPorCategoriaQuery, queryParams),
      pool.execute(tendenciaMensualQuery, queryParams)
    ])

    console.log('📊 Dashboard ejecutivo generado:', {
      metricas: metricas[0],
      laboratorios: consumoPorLab.length,
      categorias: consumoPorCategoria.length,
      meses: tendenciaMensual.length
    })

    res.json({
      success: true,
      data: {
        metricas_generales: metricas[0],
        consumo_por_laboratorio: consumoPorLab,
        consumo_por_categoria: consumoPorCategoria,
        tendencia_mensual: tendenciaMensual
      },
      filtros: {
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        laboratorio_id: laboratorio_id || null,
        escuela_id: escuela_id || null
      }
    })

  } catch (error) {
    console.error('Error en getDashboardEjecutivo:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message 
    })
  }
}

// Obtener top insumos más consumidos
export const getTopInsumosConsumidos = async (req, res) => {
  try {
    const { 
      fecha_inicio,
      fecha_fin,
      laboratorio_id,
      escuela_id,
      limite = 20
    } = req.query

    console.log('🏆 getTopInsumosConsumidos - Parámetros:', {
      fecha_inicio,
      fecha_fin,
      laboratorio_id,
      escuela_id,
      limite
    })

    let query = `
      SELECT 
        i.id as insumo_id,
        i.codigo as insumo_codigo,
        i.nombre as insumo_nombre,
        i.categoria,
        i.unidad_medida,
        SUM(m.cantidad) as total_consumido,
        COUNT(DISTINCT m.laboratorio_id) as laboratorios_usuarios,
        COUNT(DISTINCT DATE(m.fecha_movimiento)) as dias_consumo,
        AVG(m.cantidad) as promedio_por_movimiento,
        MAX(m.fecha_movimiento) as ultimo_consumo
      FROM movimientos_insumos m
      INNER JOIN insumos i ON m.insumo_id = i.id
      INNER JOIN laboratorios l ON m.laboratorio_id = l.id
      WHERE m.tipo_movimiento = 'salida'
    `

    const params = []

    // Filtros según permisos del usuario
    query += getFiltroLaboratorios(req.user)

    // Filtros opcionales
    if (fecha_inicio) {
      query += ` AND DATE(m.fecha_movimiento) >= ?`
      params.push(fecha_inicio)
    }

    if (fecha_fin) {
      query += ` AND DATE(m.fecha_movimiento) <= ?`
      params.push(fecha_fin)
    }

    if (laboratorio_id) {
      query += ` AND m.laboratorio_id = ?`
      params.push(laboratorio_id)
    }

    if (escuela_id) {
      query += ` AND l.escuela_id = ?`
      params.push(escuela_id)
    }

    query += ` GROUP BY i.id`
    query += ` ORDER BY total_consumido DESC`
    query += ` LIMIT ${parseInt(limite) || 20}`

    const [rows] = await pool.execute(query, params)

    console.log('🏆 Top insumos encontrados:', rows.length)

    res.json({
      success: true,
      data: rows,
      filtros: {
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        laboratorio_id: laboratorio_id || null,
        escuela_id: escuela_id || null,
        limite: parseInt(limite)
      }
    })

  } catch (error) {
    console.error('Error en getTopInsumosConsumidos:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message 
    })
  }
}

// Obtener análisis de eficiencia por laboratorio
export const getAnalisisEficiencia = async (req, res) => {
  try {
    const { 
      fecha_inicio,
      fecha_fin,
      escuela_id
    } = req.query

    console.log('⚡ getAnalisisEficiencia - Parámetros:', {
      fecha_inicio,
      fecha_fin,
      escuela_id
    })

    let query = `
      SELECT 
        l.id as laboratorio_id,
        l.nombre as laboratorio_nombre,
        l.escuela_id,
        COUNT(DISTINCT i.id) as variedad_insumos,
        SUM(CASE WHEN m.tipo_movimiento = 'salida' THEN m.cantidad ELSE 0 END) as total_consumo,
        SUM(CASE WHEN m.tipo_movimiento = 'entrada' THEN m.cantidad ELSE 0 END) as total_reabastecimiento,
        COUNT(DISTINCT DATE(m.fecha_movimiento)) as dias_actividad,
        COUNT(DISTINCT CASE WHEN m.tipo_movimiento = 'salida' THEN DATE(m.fecha_movimiento) END) as dias_consumo,
        ROUND(
          SUM(CASE WHEN m.tipo_movimiento = 'salida' THEN m.cantidad ELSE 0 END) / 
          NULLIF(COUNT(DISTINCT CASE WHEN m.tipo_movimiento = 'salida' THEN DATE(m.fecha_movimiento) END), 0),
          2
        ) as consumo_promedio_diario,
        ROUND(
          SUM(CASE WHEN m.tipo_movimiento = 'salida' THEN m.cantidad ELSE 0 END) / 
          NULLIF(SUM(CASE WHEN m.tipo_movimiento = 'entrada' THEN m.cantidad ELSE 0 END), 0) * 100,
          2
        ) as porcentaje_utilizacion
      FROM laboratorios l
      LEFT JOIN movimientos_insumos m ON l.id = m.laboratorio_id
      LEFT JOIN insumos i ON m.insumo_id = i.id
      WHERE 1=1
    `

    const params = []

    // Filtros según permisos del usuario
    if (tieneRestriccionLaboratorio(req.user)) {
      query += ` AND l.id IN (${req.user.laboratorio_ids.join(',')})`
    }

    // Filtros opcionales
    if (fecha_inicio) {
      query += ` AND (m.fecha_movimiento IS NULL OR DATE(m.fecha_movimiento) >= ?)`
      params.push(fecha_inicio)
    }

    if (fecha_fin) {
      query += ` AND (m.fecha_movimiento IS NULL OR DATE(m.fecha_movimiento) <= ?)`
      params.push(fecha_fin)
    }

    if (escuela_id) {
      query += ` AND l.escuela_id = ?`
      params.push(escuela_id)
    }

    query += ` GROUP BY l.id`
    query += ` ORDER BY total_consumo DESC`

    const [rows] = await pool.execute(query, params)

    console.log('⚡ Análisis de eficiencia generado:', rows.length)

    res.json({
      success: true,
      data: rows,
      filtros: {
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        escuela_id: escuela_id || null
      }
    })

  } catch (error) {
    console.error('Error en getAnalisisEficiencia:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message 
    })
  }
}

// Obtener datos para exportar reportes
export const exportarReporte = async (req, res) => {
  try {
    const { 
      tipo_reporte = 'consumo_detallado', // 'consumo_detallado' | 'dashboard_ejecutivo' | 'top_insumos' | 'eficiencia'
      formato = 'json', // 'json' | 'csv'
      ...filtros
    } = req.query

    console.log('📤 exportarReporte - Parámetros:', {
      tipo_reporte,
      formato,
      filtros
    })

    let datos = []
    let nombreArchivo = ''

    // Seleccionar el tipo de reporte a exportar
    switch (tipo_reporte) {
      case 'consumo_detallado':
        const consumoRes = await getConsumoResumen({ ...req, query: filtros }, { json: (data) => data })
        datos = consumoRes.data
        nombreArchivo = 'reporte_consumo_detallado'
        break
      
      case 'dashboard_ejecutivo':
        const dashboardRes = await getDashboardEjecutivo({ ...req, query: filtros }, { json: (data) => data })
        datos = dashboardRes.data
        nombreArchivo = 'dashboard_ejecutivo'
        break
      
      case 'top_insumos':
        const topRes = await getTopInsumosConsumidos({ ...req, query: filtros }, { json: (data) => data })
        datos = topRes.data
        nombreArchivo = 'top_insumos_consumidos'
        break
      
      case 'eficiencia':
        const eficienciaRes = await getAnalisisEficiencia({ ...req, query: filtros }, { json: (data) => data })
        datos = eficienciaRes.data
        nombreArchivo = 'analisis_eficiencia'
        break
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Tipo de reporte no válido'
        })
    }

    if (formato === 'csv') {
      // Convertir a CSV
      const csv = convertirACSV(datos, tipo_reporte)
      
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}_${new Date().toISOString().split('T')[0]}.csv"`)
      res.send(csv)
    } else {
      // Retornar JSON
      res.json({
        success: true,
        data: datos,
        tipo_reporte,
        fecha_generacion: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Error en exportarReporte:', error)
    res.status(500).json({ 
      success: false, 
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
