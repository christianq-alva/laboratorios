import { pool } from '../config/database.js'
export const getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas del dashboard...')
    // 1️⃣ ESTADÍSTICAS DE LABORATORIOS
    console.log('🔍 Consultando laboratorios...')
    const [laboratoriosResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM laboratorios
    `)
    console.log('✅ Laboratorios resultado:', laboratoriosResult[0])
    const laboratoriosStats = {
      total: laboratoriosResult[0]?.total || 0,
      activos: laboratoriosResult[0]?.total || 0
    }
    // 2️⃣ ESTADÍSTICAS DE DOCENTES
    console.log('🔍 Consultando docentes...')
    const [docentesResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM docentes
    `)
    console.log('✅ Docentes resultado:', docentesResult[0])
    console.log('🔍 Consultando docentes por escuela...')
    const [docentesPorEscuelaResult] = await pool.execute(`
      SELECT e.nombre as escuela, COUNT(d.id) as cantidad
      FROM escuelas e
      LEFT JOIN docentes d ON e.id = d.escuela_id
      GROUP BY e.id, e.nombre
      HAVING cantidad > 0
      ORDER BY cantidad DESC
    `)
    console.log('✅ Docentes por escuela resultado:', docentesPorEscuelaResult)
    const docentesStats = {
      total: docentesResult[0]?.total || 0,
      porEscuela: docentesPorEscuelaResult || []
    }
    // 3️⃣ ESTADÍSTICAS DE HORARIOS
    console.log('🔍 Consultando horarios...')
    const [horariosResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM reservas
    `)
    console.log('✅ Horarios resultado:', horariosResult[0])
    // Horarios de hoy
    console.log('🔍 Consultando horarios de hoy...')
    const [horariosHoyResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM reservas
      WHERE DATE(fecha_inicio) = CURDATE()
    `)
    console.log('✅ Horarios hoy resultado:', horariosHoyResult[0])
    // Horarios de esta semana
    console.log('🔍 Consultando horarios de esta semana...')
    const [horariosSemanáResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM reservas
      WHERE YEARWEEK(fecha_inicio, 1) = YEARWEEK(CURDATE(), 1)
    `)
    console.log('✅ Horarios semana resultado:', horariosSemanáResult[0])
    // Horarios por laboratorio
    console.log('🔍 Consultando horarios por laboratorio...')
    const [horariosPorLabResult] = await pool.execute(`
      SELECT l.nombre as laboratorio, COUNT(r.id) as cantidad
      FROM laboratorios l
      LEFT JOIN reservas r ON l.id = r.laboratorio_id
      GROUP BY l.id, l.nombre
      HAVING cantidad > 0
      ORDER BY cantidad DESC
    `)
    console.log('✅ Horarios por laboratorio resultado:', horariosPorLabResult)
    const horariosStats = {
      total: horariosResult[0]?.total || 0,
      hoy: horariosHoyResult[0]?.total || 0,
      estaSemana: horariosSemanáResult[0]?.total || 0,
      porLaboratorio: horariosPorLabResult || []
    }
    // 4️⃣ ESTADÍSTICAS DE INSUMOS
    console.log('🔍 Consultando insumos...')
    const [insumosResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM insumos
    `)
    console.log('✅ Insumos resultado:', insumosResult[0])
    // Para insumos, vamos a simplificar primero para debug
    const insumosStats = {
      total: insumosResult[0]?.total || 0,
      conStock: 0,
      sinStock: 0,
      porLaboratorio: []
    }
    // 📊 RESPUESTA FINAL
    const dashboardStats = {
      laboratorios: laboratoriosStats,
      docentes: docentesStats,
      horarios: horariosStats,
      insumos: insumosStats
    }
    console.log('✅ Estadísticas calculadas correctamente:', dashboardStats)
    res.json({
      data: dashboardStats
    })
  } catch (error) {
    console.error('❌ Error al obtener estadísticas del dashboard:', error)
    console.error('❌ Stack trace:', error.stack)
    res.status(500).json({
      message: 'Error al cargar estadísticas del dashboard: ' + error.message
    })
  }
} 