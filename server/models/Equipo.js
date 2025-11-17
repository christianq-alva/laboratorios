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
  reservasActivasByLaboratorioId: async (equipo_id, laboratorio_id) => {
    const [rows] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM detalle_reserva_equipos dre
      INNER JOIN reservas r ON dre.reserva_id = r.id
      WHERE dre.equipo_id = ? AND r.laboratorio_id = ? AND r.estado = 'P' AND r.fecha_inicio > NOW()`,
      [equipo_id, laboratorio_id])
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
  getActividadEquipos: async (user_rol, user_laboratorio_ids, filters = { laboratorio_id: null, fecha_inicio: null, fecha_fin: null, tipo_movimiento: null }) => {
    let queryCRUD = `
      SELECT 
        'crud' as tipo_registro,
        a.id,
        a.accion as tipo_movimiento,
        a.fecha_actividad as fecha_movimiento,
        a.descripcion as observaciones,
        a.equipo_codigo,
        a.equipo_nombre,
        a.equipo_marca,
        a.equipo_modelo,
        a.usuario_nombre,
        a.usuario_rol,
        NULL as laboratorio_nombre,
        NULL as cantidad,
        NULL as reserva_descripcion
      FROM vista_actividad_equipos a
      WHERE 1=1
    `

    const params = []
    // Filtros según permisos del usuario
    if (user_rol === 'Jefe de Laboratorio') {
      // Para movimientos, filtrar por laboratorios del usuario
      queryCRUD += ` AND a.laboratorio_id IN (${user_laboratorio_ids.join(',')})`
    }
    // Filtros opcionales para ambas consultas
    if (filters.laboratorio_id) {
      queryCRUD += ` AND a.laboratorio_id = ?`
      params.push(filters.laboratorio_id)
    }
    if (filters.fecha_inicio) {
      queryCRUD += ` AND DATE(a.fecha_actividad) >= ?`
      params.push(filters.fecha_inicio)
    }
    if (filters.fecha_fin) {
      queryCRUD += ` AND DATE(a.fecha_actividad) <= ?`
      params.push(filters.fecha_fin)
    }
    if (filters.tipo_movimiento) {
      queryCRUD += ` AND a.accion = ?`
      params.push(filters.tipo_movimiento)
    }
    queryCRUD += ` ORDER BY a.fecha_actividad DESC`

    const [rows] = await pool.execute(queryCRUD, params)

    return rows;
  },
  getAll: async (user_rol, user_laboratorio_ids, filters = {}) => {
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
      WHERE 1=1
        `
    const params = []

    // Filtros según permisos del usuario
    if (user_rol === 'Jefe de Laboratorio') {
      query += ` AND e.laboratorio_id IN (${user_laboratorio_ids.join(',')})`
    }

    // Filtro por tipo de equipo
    if (filters.tipo_equipo_id) {
      query += ` AND e.tipo_equipo_id = ?`
      params.push(filters.tipo_equipo_id)
    }

    // Filtro por estado
    if (filters.estado) {
      query += ` AND e.estado = ?`
      params.push(filters.estado)
    }

    // Filtro por laboratorio
    if (filters.laboratorio_id) {
      query += ` AND e.laboratorio_id = ?`
      params.push(filters.laboratorio_id)
    }

    const [equipos] = await pool.execute(query, params)

    return equipos;
  },

  getByLaboratorio: async (laboratorio_id, filters = {}) => {
    try {
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
        WHERE e.laboratorio_id = ?
      `
      const params = [laboratorio_id]

      // Filtro por tipo de equipo
      if (filters.tipo_equipo_id) {
        query += ` AND e.tipo_equipo_id = ?`
        params.push(filters.tipo_equipo_id)
      }

      // Filtro por estado
      if (filters.estado) {
        query += ` AND e.estado = ?`
        params.push(filters.estado)
      }

      query += ` ORDER BY e.codigo, e.nombre`

      const [equipos] = await pool.execute(query, params)

      return equipos;

    } catch (error) {
      throw error
    }
  },
}
