import { pool } from '../config/database.js'

export class TipoEquipo {
  // Obtener todos los tipos de equipo
  static async getAll() {
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
  }

  // Obtener solo tipos activos (sin filtro de estado)
  static async getActivos() {
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
  }

  // Obtener un tipo por ID
  static async getById(id) {
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
  }

  // Crear un nuevo tipo de equipo
  static async create(data) {
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
  }

  // Actualizar un tipo de equipo
  static async update(id, data) {
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
  }

  // Eliminar un tipo de equipo (solo si no tiene equipos asociados)
  static async delete(id) {
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
  }

  // Contar equipos por tipo
  static async countEquiposByTipo(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM equipos WHERE tipo_equipo_id = ?',
        [id]
      )
      
      return rows[0].count
    } catch (error) {
      console.error('❌ Error al contar equipos por tipo:', error)
      throw error
    }
  }
}

