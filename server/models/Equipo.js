import { pool } from '../config/database.js'
import { handleDBError } from '../utils/handleDBError.js'

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
      handleDBError(error, 'Equipo')
    }
  },
  update: async (id, equipoData, connection) => {
    const conn = connection || pool
    try {
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
      handleDBError(error, 'Equipo')
    }
  },
  delete: async (id, connection) => {
    const conn = connection || pool
    try {
      const [result] = await conn.execute('DELETE FROM equipos WHERE id = ?', [id])
      return result.affectedRows
    } catch (error) {
      handleDBError(error, 'Equipo')
    }
  },

  existsById: async (id) => {
    try {
      const [rows] = await pool.execute('SELECT id FROM equipos WHERE id = ?', [id])
      return rows.length > 0
    } catch (error) {
      handleDBError(error, 'Equipo')
    }
  },

  getById: async (id) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM equipos WHERE id = ?', [id])
      return rows[0]
    } catch (error) {
      handleDBError(error, 'Equipo')
    }
  },

  existsByCodigo: async (codigo, excludeId) => {
    try {
      let query = 'SELECT id FROM equipos WHERE codigo = ?'
      let params = [codigo]
      if (excludeId) {
        query += ' AND id <> ?'
        params = [codigo, excludeId]
      }
      const [rows] = await pool.execute(query, params)
      return rows.length > 0
    } catch (error) {
      handleDBError(error, 'Equipo')
    }
  },

  reservasActivas: async (id) => {
    try {
      const [rows] = await pool.execute('SELECT COUNT(*) as total FROM detalle_reserva_equipos WHERE equipo_id = ?', [id])
      return rows[0].total > 0
    } catch (error) {
      handleDBError(error, 'Equipo')
    }
  },

  reservasActivasByLaboratorioId: async (equipo_id, laboratorio_id) => {
    try {
      const [rows] = await pool.execute(`
        SELECT COUNT(*) as total 
        FROM detalle_reserva_equipos dre
        INNER JOIN reservas r ON dre.reserva_id = r.id
        WHERE dre.equipo_id = ? AND r.laboratorio_id = ? AND r.estado = 'P' AND r.fecha_inicio > NOW()`,
        [equipo_id, laboratorio_id])
      return rows[0].total > 0
    } catch (error) {
      handleDBError(error, 'Equipo')
    }
  },
  registrarActividadEquipo: async ({ accion, equipo_id, descripcion, usuario_id, ip_address }, connection) => {
    try {
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
      await connection.execute(query, [accion, equipo_id, descripcion, usuario_id, ip_address, fechaPeru])
    } catch (error) {
      handleDBError(error, 'Equipo')
    }
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

    try {
      const [equipos] = await pool.execute(query, params)
      return equipos
    } catch (error) {
      handleDBError(error, 'Equipo')
    }
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
      handleDBError(error, 'Equipo')
    }
  },
  getActividadEquipos: async (user_rol, user_laboratorio_ids, laboratorio_id, fecha_inicio, fecha_fin, tipo_actividad, usuario_id) => {
    try {
      let query = `
      SELECT 
        a.id,
        a.accion as tipo_actividad,
        a.fecha_actividad as fecha_actividad,
        a.descripcion as observaciones,
        e.codigo as equipo_codigo,
        e.nombre as equipo_nombre,
        e.marca as equipo_marca,
        e.modelo as equipo_modelo,
        l.nombre as laboratorio_nombre,
        l.ubicacion as laboratorio_ubicacion,
        u.nombre_completo as usuario_nombre,
        r.nombre as usuario_rol
      FROM actividad_equipos a
      LEFT JOIN equipos e ON a.equipo_id = e.id
      LEFT JOIN laboratorios l ON e.laboratorio_id = l.id
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      LEFT JOIN roles r ON u.rol_id = r.id

      WHERE 1=1
    `
      const params = []
      // Filtros según permisos del usuario
      if (user_rol === 'Jefe de Laboratorio') {
        // Filtrar por laboratorios del usuario
        query += ` AND e.laboratorio_id IN (${user_laboratorio_ids.join(',')})`
      }
      if (usuario_id && user_rol === 'Administrador') {
        query += ` AND u.id = ?`
        params.push(usuario_id)
      }
      // Filtros opcionales
      if (laboratorio_id) {
        query += ` AND e.laboratorio_id = ?`
        params.push(laboratorio_id)
      }
      if (fecha_inicio) {
        query += ` AND DATE(a.fecha_actividad) >= ?`
        params.push(fecha_inicio)
      }
      if (fecha_fin) {
        query += ` AND DATE(a.fecha_actividad) <= ?`
        params.push(fecha_fin)
      }
      if (tipo_actividad) {
        query += ` AND a.accion = ?`
        params.push(tipo_actividad)
      }

      query += ` ORDER BY a.fecha_actividad DESC`

      const [actividad] = await pool.execute(query, params)
      return actividad
    } catch (error) {
      handleDBError(error, 'Equipo')
    }
  }
}
