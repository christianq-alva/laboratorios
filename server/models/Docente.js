import { pool } from '../config/database.js'

export const Docente = {
  // Obtener docentes según el rol del usuario
  getByUser: async (user) => {
    let query = `
      SELECT 
        d.id,
        d.nombre,
        d.correo,
        e.nombre as escuela,
        COUNT(r.id) as total_horarios
      FROM docentes d
      LEFT JOIN escuelas e ON d.escuela_id = e.id
      LEFT JOIN reservas r ON d.id = r.docente_id AND r.fecha_inicio >= CURDATE()
    `
    let params = []

    // 🟡 JEFE DE LAB: Todos los docentes (pueden asignar cualquier docente)
    // 🔴 ADMIN: Todos los docentes
    // No hay restricciones por laboratorio para docentes

    query += ` GROUP BY d.id, d.nombre, d.correo, e.nombre
               ORDER BY d.nombre ASC`

    const [rows] = await pool.execute(query, params)
    return rows
  },

  // Obtener docente por ID
  getById: async (id) => {
    const [rows] = await pool.execute(`
      SELECT 
        d.id,
        d.nombre,
        d.correo,
        d.escuela_id,
        e.nombre as escuela
      FROM docentes d
      LEFT JOIN escuelas e ON d.escuela_id = e.id
      WHERE d.id = ?
    `, [id])
    
    return rows[0] || null
  },

  // Crear nuevo docente
  create: async (data) => {
    const [result] = await pool.execute(`
      INSERT INTO docentes (nombre, correo, escuela_id)
      VALUES (?, ?, ?)
    `, [data.nombre, data.correo, data.escuela_id])
    
    return result.insertId
  },

  // Actualizar docente
  update: async (id, data) => {
    await pool.execute(`
      UPDATE docentes 
      SET nombre = ?, correo = ?, escuela_id = ?
      WHERE id = ?
    `, [data.nombre, data.correo, data.escuela_id, id])
    
    return true
  },

  // Obtener horarios de un docente específico
  getHorarios: async (docente_id, user) => {
    let query = `
      SELECT 
        r.id,
        r.fecha_inicio,
        r.fecha_fin,
        r.cantidad_alumnos,
        l.nombre as laboratorio,
        l.id as laboratorio_id
      FROM reservas r
      JOIN laboratorios l ON r.laboratorio_id = l.id
      WHERE r.docente_id = ?
    `
    let params = [docente_id]

    // 🟡 JEFE DE LAB: Solo horarios de SUS laboratorios
    if (user.rol === 'Jefe de Laboratorio') {
      const labIds = user.laboratorio_ids || []
      if (labIds.length > 0) {
        const placeholders = labIds.map(() => '?').join(',')
        query += ` AND r.laboratorio_id IN (${placeholders})`
        params = [docente_id, ...labIds]
      } else {
        query += ' AND 1 = 0' // No mostrar nada
      }
    }

    query += ' ORDER BY r.fecha_inicio DESC'

    const [rows] = await pool.execute(query, params)
    return rows
  },

  // Eliminar docente (solo si no tiene horarios asignados)
  delete: async (id) => {
    await pool.execute(`
      DELETE FROM docentes 
      WHERE id = ?
    `, [id])
    
    return true
  },

  // Verificar si el docente tiene horarios pendientes
  hasActiveSchedules: async (docente_id) => {
    const [rows] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM reservas r
      WHERE r.docente_id = ? AND r.fecha_inicio > NOW()
    `, [docente_id])
    
    return rows[0].count > 0
  }
} 