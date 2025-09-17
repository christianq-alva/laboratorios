import { pool } from '../config/database.js'
import { Equipo } from '../models/Equipo.js'

export const getEquipos = async (req, res) => {
  try {
    const { laboratorio_id } = req.query
    
    console.log('🔍 getEquipos - Parámetros:', { 
      laboratorio_id, 
      user_role: req.user.rol, 
      user_laboratorio_ids: req.user.laboratorio_ids 
    })
    
    let equipos = []
    
    // Si se especifica un laboratorio específico
    if (laboratorio_id) {
      const labId = parseInt(laboratorio_id)
      
      // Verificar permisos
      if (req.user.rol === 'Administrador' || req.user.laboratorio_ids.includes(labId)) {
        console.log('✅ Usuario autorizado para ver equipos del laboratorio:', labId)
        equipos = await Equipo.getByLaboratorio(labId)
        console.log('🔧 Equipos encontrados:', equipos.length)
      } else {
        console.log('❌ Usuario no autorizado para ver equipos del laboratorio:', labId)
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para ver los equipos de este laboratorio' 
        })
      }
    } else {
      // Sin laboratorio específico, devolver todos según rol
      if (req.user.rol === 'Jefe de Laboratorio') {
        // Solo equipos de sus laboratorios
        for (const labId of req.user.laboratorio_ids) {
          const equiposLab = await Equipo.getByLaboratorio(labId)
          equipos = [...equipos, ...equiposLab]
        }
      } else if (req.user.rol === 'Administrador') {
        // Todos los equipos con información de inventario
        const [rows] = await pool.execute(`
          SELECT e.*, 
                 GROUP_CONCAT(CONCAT(l.nombre, ':', COALESCE(ie.cantidad_disponible, 0), '/', COALESCE(ie.cantidad_total, 0)) SEPARATOR '; ') as inventario_por_laboratorio
          FROM equipos e
          LEFT JOIN inventario_equipos ie ON e.id = ie.equipo_id
          LEFT JOIN laboratorios l ON ie.laboratorio_id = l.id
          GROUP BY e.id
          ORDER BY e.codigo, e.nombre
        `)
        equipos = rows
      }
    }
    
    res.json({ 
      success: true, 
      data: equipos,
      laboratorio_filtrado: laboratorio_id || null,
      total_equipos: equipos.length
    })
  } catch (error) {
    console.error('Error en getEquipos:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const createEquipo = async (req, res) => {
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    
    const { 
      nombre, 
      descripcion, 
      marca,
      modelo,
      numero_serie,
      estado = 'Operativo',
      inventario_inicial = []
    } = req.body
    
    console.log('🔍 Creando equipo:', req.body)
    
    // Generar código único para el equipo
    const [maxId] = await connection.execute('SELECT MAX(id) as max_id FROM equipos')
    const nextId = (maxId[0].max_id || 0) + 1
    const codigo = `EQP-${nextId.toString().padStart(4, '0')}`
    
    // Crear el equipo
    const [equipoResult] = await connection.execute(`
      INSERT INTO equipos (codigo, nombre, descripcion, marca, modelo, numero_serie, estado) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [codigo, nombre, descripcion, marca, modelo, numero_serie, estado])
    
    const equipo_id = equipoResult.insertId
    console.log('✅ Equipo creado con ID:', equipo_id)
    
    // Agregar inventario inicial (si se proporciona)
    if (inventario_inicial && inventario_inicial.length > 0) {
      for (const inventario of inventario_inicial) {
        const { laboratorio_id, cantidad_total, observaciones = 'Inventario inicial' } = inventario
        
        // Verificar permisos del laboratorio
        if (req.user.rol === 'Jefe de Laboratorio') {
          if (!req.user.laboratorio_ids.includes(parseInt(laboratorio_id))) {
            await connection.rollback()
            return res.status(403).json({ 
              success: false, 
              message: `No puedes agregar equipos al laboratorio ${laboratorio_id}` 
            })
          }
        }
        
        console.log(`🔄 Agregando inventario: Lab ${laboratorio_id}, Cantidad ${cantidad_total}`)
        
        // Crear entrada en inventario
        await connection.execute(`
          INSERT INTO inventario_equipos (equipo_id, laboratorio_id, cantidad_total, cantidad_disponible, cantidad_en_uso)
          VALUES (?, ?, ?, ?, 0)
        `, [equipo_id, laboratorio_id, cantidad_total, cantidad_total])
        
        // Registrar movimiento de entrada
        await connection.execute(`
          INSERT INTO movimientos_equipos 
          (equipo_id, laboratorio_id, usuario_id, tipo_movimiento, cantidad, observaciones)
          VALUES (?, ?, ?, 'entrada', ?, ?)
        `, [equipo_id, laboratorio_id, req.user.userId, cantidad_total, observaciones])
      }
    }
    
    await connection.commit()
    
    res.json({ 
      success: true, 
      message: 'Equipo creado con inventario inicial',
      equipo_id: equipo_id,
      laboratorios_con_inventario: inventario_inicial.length
    })
    
  } catch (error) {
    await connection.rollback()
    console.error('Error en createEquipo:', error)
    res.status(500).json({ success: false, message: error.message })
  } finally {
    connection.release()
  }
}

export const updateEquipo = async (req, res) => {
  try {
    const { id } = req.params
    const equipoId = parseInt(id, 10)
    const { nombre, descripcion, marca, modelo, numero_serie, estado } = req.body
    
    console.log('🔄 Actualizando equipo:', { id, equipoId, nombre, marca, modelo })
    
    // Validar ID
    if (isNaN(equipoId) || equipoId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de equipo inválido'
      })
    }
    
    // Validar datos
    if (!nombre?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nombre es requerido'
      })
    }
    
    // Verificar que el equipo existe
    const [existingEquipo] = await pool.execute(
      'SELECT id FROM equipos WHERE id = ?',
      [equipoId]
    )
    
    if (existingEquipo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      })
    }
    
    // Actualizar equipo
    await pool.execute(`
      UPDATE equipos 
      SET nombre = ?, descripcion = ?, marca = ?, modelo = ?, numero_serie = ?, estado = ?
      WHERE id = ?
    `, [nombre.trim(), descripcion?.trim() || '', marca?.trim() || '', modelo?.trim() || '', numero_serie?.trim() || '', estado || 'Operativo', equipoId])
    
    console.log('✅ Equipo actualizado exitosamente:', equipoId)
    
    res.json({
      success: true,
      message: 'Equipo actualizado exitosamente',
      data: { id: equipoId, nombre: nombre.trim(), descripcion, marca, modelo, numero_serie, estado }
    })
    
  } catch (error) {
    console.error('❌ Error al actualizar equipo:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

export const deleteEquipo = async (req, res) => {
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    
    const { id } = req.params
    const equipoId = parseInt(id, 10)
    
    console.log('🗑️ Eliminando equipo:', equipoId)
    
    // Validar ID
    if (isNaN(equipoId) || equipoId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de equipo inválido'
      })
    }
    
    // Verificar que el equipo existe
    const [existingEquipo] = await connection.execute(
      'SELECT id, nombre FROM equipos WHERE id = ?',
      [equipoId]
    )
    
    if (existingEquipo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      })
    }

    // Verificar si hay movimientos asociados
    const [movimientos] = await connection.execute(
      'SELECT COUNT(*) as total FROM movimientos_equipos WHERE equipo_id = ?',
      [equipoId]
    )

    if (movimientos[0].total > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el equipo porque tiene movimientos registrados'
      })
    }

    // Eliminar registros relacionados en orden
    await connection.execute('DELETE FROM inventario_equipos WHERE equipo_id = ?', [equipoId])
    await connection.execute('DELETE FROM equipos WHERE id = ?', [equipoId])
    
    await connection.commit()
    
    console.log('✅ Equipo eliminado exitosamente:', equipoId)
    
    res.json({
      success: true,
      message: 'Equipo eliminado exitosamente'
    })
    
  } catch (error) {
    await connection.rollback()
    console.error('❌ Error al eliminar equipo:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno al eliminar el equipo'
    })
  } finally {
    connection.release()
  }
}

// Obtener actividad de movimientos de equipos
export const getActividadEquipos = async (req, res) => {
  try {
    const { laboratorio_id, fecha_inicio, fecha_fin, tipo_movimiento } = req.query
    
    console.log('🔍 getActividadEquipos - Parámetros:', { 
      laboratorio_id, 
      fecha_inicio, 
      fecha_fin, 
      tipo_movimiento,
      user_role: req.user.rol, 
      user_laboratorio_ids: req.user.laboratorio_ids 
    })
    
    let query = `
      SELECT 
        m.id,
        m.fecha_movimiento,
        m.tipo_movimiento,
        m.cantidad,
        m.observaciones,
        e.nombre as equipo_nombre,
        e.codigo as equipo_codigo,
        e.marca as equipo_marca,
        e.modelo as equipo_modelo,
        l.nombre as laboratorio_nombre,
        u.nombre_completo as usuario_nombre,
        rol.nombre as usuario_rol,
        r.descripcion as reserva_descripcion,
        r.fecha_inicio as reserva_fecha_inicio,
        r.fecha_fin as reserva_fecha_fin
      FROM movimientos_equipos m
      INNER JOIN equipos e ON m.equipo_id = e.id
      INNER JOIN laboratorios l ON m.laboratorio_id = l.id
      INNER JOIN usuarios u ON m.usuario_id = u.id
      INNER JOIN roles rol ON u.rol_id = rol.id
      LEFT JOIN reservas r ON m.reserva_id = r.id
      WHERE 1=1
    `
    
    const params = []
    
    // Filtros según permisos del usuario
    if (req.user.rol === 'Jefe de Laboratorio') {
      query += ` AND m.laboratorio_id IN (${req.user.laboratorio_ids.join(',')})`
    }
    
    // Filtros opcionales
    if (laboratorio_id) {
      query += ` AND m.laboratorio_id = ?`
      params.push(laboratorio_id)
    }
    
    if (fecha_inicio) {
      query += ` AND DATE(m.fecha_movimiento) >= ?`
      params.push(fecha_inicio)
    }
    
    if (fecha_fin) {
      query += ` AND DATE(m.fecha_movimiento) <= ?`
      params.push(fecha_fin)
    }
    
    if (tipo_movimiento) {
      query += ` AND m.tipo_movimiento = ?`
      params.push(tipo_movimiento)
    }
    
    query += ` ORDER BY m.fecha_movimiento DESC LIMIT 100`
    
    const [rows] = await pool.execute(query, params)
    
    console.log('📊 Actividad encontrada:', rows.length)
    
    res.json({ 
      success: true, 
      data: rows,
      total_movimientos: rows.length,
      filtros_aplicados: {
        laboratorio_id: laboratorio_id || null,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        tipo_movimiento: tipo_movimiento || null
      }
    })
  } catch (error) {
    console.error('Error en getActividadEquipos:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
