import { pool } from '../config/database.js'

export const TipoEquipo = {
  // Obtener todos los tipos de equipo
  getAll: async () => {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          id,
          nombre,
          descripcion,
          created_at
        FROM tipos_equipo
        ORDER BY 
          CASE WHEN nombre = 'Otro' THEN 1 ELSE 0 END,
          nombre ASC
      `)

      return rows
    } catch (error) {
      console.error('❌ Error al obtener tipos de equipo:', error)
      throw error
    }
  },

  // Obtener solo tipos activos (sin filtro de estado)
  getActivos: async () => {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          id,
          nombre,
          descripcion,
          created_at
        FROM tipos_equipo
        ORDER BY 
          CASE WHEN nombre = 'Otro' THEN 1 ELSE 0 END,
          nombre ASC
      `)

      return rows
    } catch (error) {
      console.error('❌ Error al obtener tipos activos:', error)
      throw error
    }
  },

  // Obtener un tipo por ID
  getById: async (id) => {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          id,
          nombre,
          descripcion,
          created_at
        FROM tipos_equipo
        WHERE id = ?
      `, [id])

      return rows[0]
    } catch (error) {
      console.error('❌ Error al obtener tipo por ID:', error)
      throw error
    }
  },

  // Crear un nuevo tipo de equipo
  create: async (data) => {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // Verificar si ya existe un tipo con ese nombre
      const [existing] = await connection.execute(
        'SELECT id FROM tipos_equipo WHERE nombre = ?',
        [data.nombre]
      )

      if (existing.length > 0) {
        throw new Error('Ya existe un tipo de equipo con ese nombre')
      }

      const [result] = await connection.execute(
        `INSERT INTO tipos_equipo (nombre, descripcion) 
         VALUES (?, ?)`,
        [data.nombre, data.descripcion || null]
      )

      await connection.commit()
      return result.insertId
    } catch (error) {
      await connection.rollback()
      console.error('❌ Error al crear tipo de equipo:', error)
      throw error
    } finally {
      connection.release()
    }
  },

  // Actualizar un tipo de equipo
  update: async (id, data) => {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // Verificar si existe otro tipo con el mismo nombre
      const [existing] = await connection.execute(
        'SELECT id FROM tipos_equipo WHERE nombre = ? AND id != ?',
        [data.nombre, id]
      )

      if (existing.length > 0) {
        throw new Error('Ya existe otro tipo de equipo con ese nombre')
      }

      const [result] = await connection.execute(
        `UPDATE tipos_equipo 
         SET nombre = ?, descripcion = ?
         WHERE id = ?`,
        [data.nombre, data.descripcion || null, id]
      )

      await connection.commit()
      return result.affectedRows > 0
    } catch (error) {
      await connection.rollback()
      console.error('❌ Error al actualizar tipo de equipo:', error)
      throw error
    } finally {
      connection.release()
    }
  },

  // Eliminar un tipo de equipo (solo si no tiene equipos asociados)
  delete: async (id) => {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // Verificar si hay equipos asociados
      const [equipos] = await connection.execute(
        'SELECT COUNT(*) as count FROM equipos WHERE tipo_equipo_id = ?',
        [id]
      )

      if (equipos[0].count > 0) {
        throw new Error(`No se puede eliminar el tipo porque tiene ${equipos[0].count} equipo(s) asociado(s)`)
      }

      const [result] = await connection.execute(
        'DELETE FROM tipos_equipo WHERE id = ?',
        [id]
      )

      await connection.commit()
      return result.affectedRows > 0
    } catch (error) {
      await connection.rollback()
      console.error('❌ Error al eliminar tipo de equipo:', error)
      throw error
    } finally {
      connection.release()
    }
  },

  // Listar tipos de equipo con conteo de equipos
  getAllWithCountEquipos: async () => {
    try {
      const [rows] = await pool.execute(`	
        SELECT te.id, te.nombre, te.descripcion, te.created_at, COUNT(e.id) as count_equipos 
        FROM tipos_equipo te
        LEFT JOIN equipos e ON te.id = e.tipo_equipo_id
        GROUP BY te.id
        ORDER BY te.nombre ASC
      `)

      return rows
    } catch (error) {
      console.error('❌ Error al listar tipos de equipo con conteo de equipos:', error)
      throw error
    }
  }
}

