import { pool } from '../config/database.js'

export const Equipo = {

  create: async (equipoData, connection) => {
    const conn = connection || pool
    try {
      const [result] = await conn.execute(`
        INSERT INTO equipos (codigo, nombre, descripcion, marca, modelo, numero_serie, estado, fecha_ultimo_mantenimiento, fecha_proximo_mantenimiento, comentarios, condicion, fecha_adquisicion, tipo_equipo_id, laboratorio_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        equipoData.codigo,
        equipoData.nombre,
        equipoData.descripcion,
        equipoData.marca,
        equipoData.modelo,
        equipoData.numero_serie,
        equipoData.estado,
        equipoData.fecha_ultimo_mantenimiento,
        equipoData.fecha_proximo_mantenimiento,
        equipoData.comentarios,
        equipoData.condicion,
        equipoData.fecha_adquisicion,
        equipoData.tipo_equipo_id,
        equipoData.laboratorio_id])

      const equipo_id = result.insertId
      return equipo_id
    } catch (error) {
      console.error('❌ Error al crear equipo:', error)
      throw error
    }
  },
  update: async (id, equipoData, connection) => {
    const conn = connection || pool
    try {
      console.log('🔄 Actualizando equipo:', { id, equipoData })
      const [result] = await conn.execute(`
        UPDATE equipos 
        SET codigo = ?, nombre = ?, descripcion = ?, marca = ?, modelo = ?, numero_serie = ?, estado = ?, fecha_ultimo_mantenimiento = ?, fecha_proximo_mantenimiento = ?, comentarios = ?, condicion = ?, fecha_adquisicion = ?, tipo_equipo_id = ?, laboratorio_id = ?
        WHERE id = ?`, [
        equipoData.codigo,
        equipoData.nombre,
        equipoData.descripcion,
        equipoData.marca,
        equipoData.modelo,
        equipoData.numero_serie,
        equipoData.estado,
        equipoData.fecha_ultimo_mantenimiento,
        equipoData.fecha_proximo_mantenimiento,
        equipoData.comentarios,
        equipoData.condicion,
        equipoData.fecha_adquisicion,
        equipoData.tipo_equipo_id,
        equipoData.laboratorio_id,
        id])

      return result.affectedRows

    } catch (error) {
      console.error('❌ Error al actualizar equipo:', error)
      throw error
    }
  },
  delete: async (id, connection) => {
    const conn = connection || pool
    try {
      const [result] = await conn.execute('DELETE FROM equipos WHERE id = ?', [id])
      return result.affectedRows
    } catch (error) {
      console.error('❌ Error al eliminar equipo:', error)
      throw error
    }
  },

  existsById: async (id) => {
    const [rows] = await pool.execute('SELECT id FROM equipos WHERE id = ?', [id])
    return rows.length > 0
  },

  getById: async (id) => {
    const [rows] = await pool.execute('SELECT * FROM equipos WHERE id = ?', [id])
    return rows[0]
  },

  existsByCodigo: async (codigo, excludeId) => {

    let query = 'SELECT id FROM equipos WHERE codigo = ?'
    let params = [codigo]

    if (excludeId) {
      query += ' AND id <> ?'
      params = [codigo, excludeId]
    }
    const [rows] = await pool.execute(query, params)
    return rows.length > 0
  },
  reservasActivas: async (id) => {
    const [rows] = await pool.execute('SELECT COUNT(*) as total FROM detalle_reserva_equipos WHERE equipo_id = ?', [id])
    return rows[0].total > 0
  },

  registrarActividadEquipo: async ({ accion, equipo_id, descripcion, usuario_id, ip_address }) => {
    try {
      // Crear fecha en zona horaria de Perú
      const fechaPeru = new Date().toLocaleString('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(', ', ' ')

      const query = `
        INSERT INTO actividad_equipos (
          accion, equipo_id, descripcion, usuario_id, ip_address, fecha_actividad
        ) VALUES (?, ?, ?, ?, ?, ?)
      `

      await pool.execute(query, [accion, equipo_id, descripcion, usuario_id, ip_address, fechaPeru])
      console.log(`📋 Actividad de equipo registrada: ${accion} - ${descripcion} (${fechaPeru})`)
    } catch (error) {
      console.error('❌ Error al registrar actividad de equipo:', error)
      // No lanzamos el error para no interrumpir la operación principal
    }
  },

  getAll: async (user_rol, user_laboratorio_ids) => {
    //Query base
    let query = `
      SELECT 
        e.id,
        e.codigo,
        e.nombre,
        e.descripcion,
        e.marca,
        e.modelo,
        e.numero_serie,
        e.estado,
        e.fecha_ultimo_mantenimiento,
        e.fecha_proximo_mantenimiento,
        e.comentarios,
        e.condicion,
        e.fecha_adquisicion,
        e.tipo_equipo_id,
        e.laboratorio_id,
        te.nombre as tipo_equipo_nombre,
        lab.nombre as laboratorio_nombre
      FROM equipos e
      LEFT JOIN tipos_equipo te ON e.tipo_equipo_id = te.id
      LEFT JOIN laboratorios lab ON e.laboratorio_id = lab.id
        `
    // Filtros según permisos del usuario
    if (user_rol === 'Jefe de Laboratorio') {
      query += ` AND ii.laboratorio_id IN (${user_laboratorio_ids.join(',')})`
    }

    const [equipos] = await pool.execute(query)

    return equipos;
  },

  getByLaboratorio: async (laboratorio_id) => {
    try {
      const [equipos] = await pool.execute(`
        SELECT 
          e.id,
          e.codigo,
          e.nombre,
          e.descripcion,
          e.marca,
          e.modelo,
          e.numero_serie,
          e.estado,
          e.fecha_ultimo_mantenimiento,
          e.fecha_proximo_mantenimiento,
          e.comentarios,
          e.condicion,
          e.fecha_adquisicion,
          e.tipo_equipo_id,
          e.laboratorio_id,
          te.nombre as tipo_equipo_nombre,
          lab.nombre as laboratorio_nombre
        FROM equipos e
        LEFT JOIN tipos_equipo te ON e.tipo_equipo_id = te.id
        LEFT JOIN laboratorios lab ON e.laboratorio_id = lab.id
        WHERE e.laboratorio_id = ?
        ORDER BY e.codigo, e.nombre
      `, [laboratorio_id])

      return equipos;

    } catch (error) {
      console.error('❌ Error al obtener equipos por laboratorio:', error)
      throw error
    }
  },

  // Verificar disponibilidad de equipo
  checkDisponibilidad: async (equipo_id, laboratorio_id, cantidad_requerida) => {
    try {
      const [rows] = await pool.execute(`
        SELECT cantidad_disponible
        FROM inventario_equipos 
        WHERE equipo_id = ? AND laboratorio_id = ?
      `, [equipo_id, laboratorio_id])

      if (rows.length === 0) return false

      const disponible = rows[0].cantidad_disponible || 0
      return disponible >= cantidad_requerida
    } catch (error) {
      console.error('❌ Error verificando disponibilidad de equipo:', error)
      return false
    }
  },

  // Reservar equipo (marcar como en uso)
  reservarEquipo: async (connection, equipo_id, laboratorio_id, cantidad, usuario_id, reserva_id) => {
    try {
      console.log('🔒 Reservando equipo:', { equipo_id, laboratorio_id, cantidad })

      // Actualizar inventario
      await connection.execute(`
        UPDATE inventario_equipos 
        SET cantidad_disponible = cantidad_disponible - ?,
            cantidad_en_uso = cantidad_en_uso + ?
        WHERE equipo_id = ? AND laboratorio_id = ?
      `, [cantidad, cantidad, equipo_id, laboratorio_id])

      // Registrar movimiento
      await connection.execute(`
        INSERT INTO movimientos_equipos 
        (equipo_id, laboratorio_id, usuario_id, tipo_movimiento, cantidad, reserva_id, observaciones)
        VALUES (?, ?, ?, 'reserva', ?, ?, 'Equipo reservado para clase')
      `, [equipo_id, laboratorio_id, usuario_id, cantidad, reserva_id])

      console.log('✅ Equipo reservado exitosamente')
    } catch (error) {
      console.error('❌ Error reservando equipo:', error)
      throw error
    }
  },



  // Devolver equipo (marcar como disponible)
  devolverEquipo: async (connection, equipo_id, laboratorio_id, cantidad, usuario_id, reserva_id) => {
    try {
      console.log('🔓 Devolviendo equipo:', { equipo_id, laboratorio_id, cantidad })

      // Actualizar inventario
      await connection.execute(`
        UPDATE inventario_equipos 
        SET cantidad_disponible = cantidad_disponible + ?,
            cantidad_en_uso = cantidad_en_uso - ?
        WHERE equipo_id = ? AND laboratorio_id = ?
      `, [cantidad, cantidad, equipo_id, laboratorio_id])

      // Registrar movimiento
      await connection.execute(`
        INSERT INTO movimientos_equipos 
        (equipo_id, laboratorio_id, usuario_id, tipo_movimiento, cantidad, reserva_id, observaciones)
        VALUES (?, ?, ?, 'devolucion', ?, ?, 'Equipo devuelto después de clase')
      `, [equipo_id, laboratorio_id, usuario_id, cantidad, reserva_id])

      console.log('✅ Equipo devuelto exitosamente')
    } catch (error) {
      console.error('❌ Error devolviendo equipo:', error)
      throw error
    }
  }
}
