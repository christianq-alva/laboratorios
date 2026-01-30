import { pool } from '../config/database.js'
import { AppError } from '../utils/errors.js'
import { handleDBError } from '../utils/handleDBError.js'

export const TipoEquipo = {
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
      handleDBError(error, 'Tipo de equipo')
    }
  },

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
      handleDBError(error, 'Tipo de equipo')
    }
  },

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
      handleDBError(error, 'Tipo de equipo')
    }
  },

  create: async (data) => {
    try {
      // Verificar si ya existe un tipo con ese nombre
      const [existing] = await pool.execute(
        'SELECT id FROM tipos_equipo WHERE nombre = ?',
        [data.nombre]
      )

      if (existing.length > 0) {
        throw new AppError('Ya existe un tipo de equipo con ese nombre', 409)
      }

      const [result] = await pool.execute(
        `INSERT INTO tipos_equipo (nombre, descripcion) 
         VALUES (?, ?)`,
        [data.nombre, data.descripcion || null]
      )

      return result.insertId
    } catch (error) {
      handleDBError(error, 'Tipo de equipo')
    } finally {
    }
  },

  update: async (id, data) => {

    const tipo = await TipoEquipo.getById(id)
    if (!tipo) {
      throw new AppError('Tipo de equipo no encontrado', 404)
    }

    // Verificar si existe otro tipo con el mismo nombre
    const [existing] = await pool.execute(
      'SELECT id FROM tipos_equipo WHERE nombre = ? AND id != ?',
      [data.nombre, id]
    )

    if (existing.length > 0) {
      throw new AppError('Ya existe otro tipo de equipo con ese nombre', 409)
    }

    try {
      const [result] = await pool.execute(
        `UPDATE tipos_equipo 
         SET nombre = ?, descripcion = ?
         WHERE id = ?`,
        [data.nombre, data.descripcion || null, id]
      )

      return result.affectedRows > 0
    } catch (error) {
      handleDBError(error, 'Tipo de equipo')
    }
  },

  delete: async (id) => {
    const tipo = await TipoEquipo.getById(id)
    if (!tipo) {
      throw new AppError('Tipo de equipo no encontrado', 404)
    }

    // Verificar si hay equipos asociados
    const [equipos] = await pool.execute(
      'SELECT COUNT(*) as count FROM equipos WHERE tipo_equipo_id = ?',
      [id]
    )

    if (equipos[0].count > 0) {
      throw new AppError(`No se puede eliminar el tipo porque tiene ${equipos[0].count} equipo(s) asociado(s)`, 409)
    }

    try {
      const [result] = await pool.execute(
        'DELETE FROM tipos_equipo WHERE id = ?',
        [id]
      )

      return result.affectedRows > 0
    } catch (error) {
      handleDBError(error, 'Tipo de equipo')
    }
  },

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
      handleDBError(error, 'Tipo de equipo')
    }
  }
}

