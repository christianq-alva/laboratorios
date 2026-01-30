import { pool } from '../config/database.js'
import { AppError } from '../utils/errors.js'
import { handleDBError } from '../utils/handleDBError.js'

export const Escuela = {
  getAll: async () => {
    try {
      const [rows] = await pool.execute('SELECT * FROM escuelas ORDER BY nombre ASC')
      return rows
    } catch (error) {
      handleDBError(error, 'Escuela')
    }
  },

  getById: async (id) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM escuelas WHERE id = ?', [id])
      return rows[0]
    } catch (error) {
      handleDBError(error, 'Escuela')
    }
  },

  create: async (nombre) => {
    if (await Escuela.existsByName(nombre)) {
      throw new AppError('Ya existe una escuela con ese nombre', 409)
    }
    try {
      const [result] = await pool.execute('INSERT INTO escuelas (nombre) VALUES (?)', [nombre])
      return result.insertId
    } catch (error) {
      handleDBError(error, 'Escuela')
    }
  },

  update: async (id, nombre) => {
    if (!(await Escuela.exists(id))) {
      throw new AppError('Escuela no encontrada', 404)
    }
    if (await Escuela.existsByNameExcludingId(nombre, id)) {
      throw new AppError('Ya existe otra escuela con ese nombre', 409)
    }
    try {
      const [result] = await pool.execute('UPDATE escuelas SET nombre = ? WHERE id = ?', [nombre, id])
      return result.affectedRows
    } catch (error) {
      handleDBError(error, 'Escuela')
    }
  },

  delete: async (id) => {
    const escuela = await Escuela.getById(id)
    if (!escuela) {
      throw new AppError('Escuela no encontrada', 404)
    }
    const relations = await Escuela.checkRelations(id)
    if (relations.total > 0) {
      const partes = []
      if (relations.docentes > 0) partes.push(`${relations.docentes} docente(s)`)
      throw new AppError(`No se puede eliminar. La escuela "${escuela.nombre}" está siendo usada en el sistema: ${partes.join(', ')}.`, 409)
    }
    try {
      const [result] = await pool.execute('DELETE FROM escuelas WHERE id = ?', [id])
      return result.affectedRows
    } catch (error) {
      handleDBError(error, 'Escuela')
    }
  },

  exists: async (id) => {
    try {
      const [rows] = await pool.execute('SELECT id FROM escuelas WHERE id = ?', [id])
      return rows.length > 0
    } catch (error) {
      handleDBError(error, 'Escuela')
    }
  },

  existsByName: async (nombre) => {
    try {
      const [rows] = await pool.execute('SELECT id FROM escuelas WHERE nombre = ?', [nombre])
      return rows.length > 0
    } catch (error) {
      handleDBError(error, 'Escuela')
    }
  },

  existsByNameExcludingId: async (nombre, excludeId) => {
    try {
      const [rows] = await pool.execute('SELECT id FROM escuelas WHERE nombre = ? AND id <> ?', [nombre, excludeId])
      return rows.length > 0
    } catch (error) {
      handleDBError(error, 'Escuela')
    }
  },

  checkRelations: async (id) => {
    try {
      const [docentesCount] = await pool.execute('SELECT COUNT(*) as total FROM docentes WHERE escuela_id = ?', [id])
      return {
        docentes: docentesCount[0].total,
        total: docentesCount[0].total
      }
    } catch (error) {
      handleDBError(error, 'Escuela')
    }
  }
}