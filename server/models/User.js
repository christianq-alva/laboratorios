import { pool } from '../config/database.js'
import bcrypt from 'bcryptjs'
import { AppError } from '../utils/errors.js'
import { handleDBError } from '../utils/handleDBError.js'

export const User = {
  findByCredentials: async (usuario, contrasena) => {
    try {
      const userQuery = `
        SELECT 
          u.id,
          u.nombre_completo,
          u.usuario,
          u.contrasena,
          u.laboratorio_ids,
          u.estado,
          r.id as rol_id,
          r.nombre as rol_nombre
        FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
        WHERE u.usuario = ?
      `
      const [userRows] = await pool.execute(userQuery, [usuario])

      if (userRows.length === 0) {
        return null
      }

      const user = userRows[0]
      const isPasswordValid = await bcrypt.compare(contrasena, user.contrasena)

      if (!isPasswordValid) {
        return null
      }
      return user
    } catch (error) {
      handleDBError(error, 'Usuario')
    }
  },

  // Obtener todos los usuarios
  getAll: async () => {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          u.id,
          u.nombre_completo,
          u.usuario,
          u.estado,
          u.laboratorio_ids,
          u.created_at,
          u.updated_at,
          r.id as rol_id,
          r.nombre as rol_nombre
        FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
        ORDER BY u.nombre_completo ASC
      `)

      // Procesar laboratorio_ids JSON y obtener nombres de laboratorios si es necesario
      for (const user of rows) {

        // Si es Jefe de Laboratorio y tiene laboratorios, obtener nombres
        if (user.rol_nombre === 'Jefe de Laboratorio' && user.laboratorio_ids.length > 0) {
          const placeholders = user.laboratorio_ids.map(() => '?').join(',')
          const [labRows] = await pool.execute(`
            SELECT id, codigo, nombre
            FROM laboratorios
            WHERE id IN (${placeholders})
          `, user.laboratorio_ids)

          user.laboratorios_nombres = labRows.map(row => ({
            id: row.id,
            codigo: row.codigo,
            nombre: row.nombre
          }))
        } else {
          user.laboratorios_nombres = []
        }
      }

      return rows
    } catch (error) {
      handleDBError(error, 'Usuario')
    }
  },

  getById: async (id) => {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          u.id,
          u.nombre_completo,
          u.usuario,
          u.estado,
          u.laboratorio_ids,
          u.created_at,
          u.updated_at,
          r.id as rol_id,
          r.nombre as rol_nombre
        FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
        WHERE u.id = ?
      `, [id])

      if (rows.length === 0) {
        return null
      }

      const user = rows[0]

      return user
    } catch (error) {
      handleDBError(error, 'Usuario')
    }
  },

  create: async (data) => {
    // Verificar si ya existe un usuario con ese nombre de usuario
    const [existing] = await pool.execute(
      'SELECT id FROM usuarios WHERE usuario = ?',
      [data.usuario]
    )

    if (existing.length > 0) {
      throw new AppError('Ya existe un usuario con ese nombre de usuario', 409)
    }

    // Preparar laboratorio_ids como JSON
    let laboratorioIdsJson = null
    if (data.laboratorio_ids && data.laboratorio_ids.length > 0) {
      // Verificar que el rol sea Jefe de Laboratorio
      const [rolRows] = await pool.execute(
        'SELECT nombre FROM roles WHERE id = ?',
        [data.rol_id]
      )

      if (rolRows[0]?.nombre === 'Jefe de Laboratorio') {
        laboratorioIdsJson = JSON.stringify(data.laboratorio_ids)
      }
    }

    // Hashear la contraseña antes de guardarla
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(data.contrasena, saltRounds)

    try {
      // Insertar usuario con contraseña hasheada
      const [result] = await pool.execute(
        `INSERT INTO usuarios (nombre_completo, usuario, contrasena, rol_id, laboratorio_ids) 
         VALUES (?, ?, ?, ?, ?)`,
        [data.nombre_completo, data.usuario, hashedPassword, data.rol_id, laboratorioIdsJson]
      )

      return result.insertId
    } catch (error) {
      handleDBError(error, 'Usuario')
    }
  },

  update: async (id, data) => {
    const usuarioExistente = await User.getById(id)
    if (!usuarioExistente) {
      throw new AppError('Usuario no encontrado', 404)
    }

    // Verificar si existe otro usuario con el mismo nombre de usuario
    if (data.usuario) {
      const [existing] = await pool.execute(
        'SELECT id FROM usuarios WHERE usuario = ? AND id != ?',
        [data.usuario, id]
      )

      if (existing.length > 0) {
        throw new AppError('Ya existe otro usuario con ese nombre de usuario', 409)
      }
    }

    // Construir query de actualización dinámicamente
    const updates = []
    const values = []

    if (data.nombre_completo) {
      updates.push('nombre_completo = ?')
      values.push(data.nombre_completo)
    }
    if (data.usuario) {
      updates.push('usuario = ?')
      values.push(data.usuario)
    }
    if (data.contrasena) {
      // Hashear la nueva contraseña antes de actualizar
      const saltRounds = 10
      const hashedPassword = await bcrypt.hash(data.contrasena, saltRounds)
      updates.push('contrasena = ?')
      values.push(hashedPassword)
    }
    if (data.rol_id) {
      updates.push('rol_id = ?')
      values.push(data.rol_id)
    }

    // Actualizar laboratorio_ids como JSON
    if (data.laboratorio_ids !== undefined || data.rol_id) {
      let rolId = data.rol_id
      if (!rolId) {
        const [userRows] = await pool.execute('SELECT rol_id FROM usuarios WHERE id = ?', [id])
        rolId = userRows[0]?.rol_id
      }

      if (rolId) {
        const [rolRows] = await pool.execute(
          'SELECT nombre FROM roles WHERE id = ?',
          [rolId]
        )

        let laboratorioIdsJson = null
        // Si es Jefe de Laboratorio y hay laboratorios, guardarlos
        if (rolRows[0]?.nombre === 'Jefe de Laboratorio' && data.laboratorio_ids && data.laboratorio_ids.length > 0) {
          laboratorioIdsJson = JSON.stringify(data.laboratorio_ids)
        }
        // Si cambió a Administrador, limpiar laboratorio_ids
        // Si es Jefe pero no se proporcionaron laboratorios, mantener null o vacío

        updates.push('laboratorio_ids = ?')
        values.push(laboratorioIdsJson)
      }
    }

    try {
      if (updates.length > 0) {
        values.push(id)
        await pool.execute(
          `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`,
          values
        )
      }

      return true
    } catch (error) {
      handleDBError(error, 'Usuario')
    }
  },

  delete: async (id) => {
    const usuario = await User.getById(id)
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404)
    }
    try {
      const [result] = await pool.execute(
        'DELETE FROM usuarios WHERE id = ?',
        [id]
      )
      return result.affectedRows > 0
    } catch (error) {
      handleDBError(error, 'Usuario')
    }
  },

  updateEstado: async (id, estado) => {
    try {
      const estadoChar = estado === 'activo' || estado === 'A' ? 'A' : 'I'
      const [result] = await pool.execute(
        'UPDATE usuarios SET estado = ? WHERE id = ?',
        [estadoChar, id]
      )
      return result.affectedRows > 0
    } catch (error) {
      handleDBError(error, 'Usuario')
    }
  },

  getLaboratoriosById: async (id) => {
    try {
      const [rows] = await pool.execute(`
        SELECT laboratorio_ids
        FROM usuarios
        WHERE id = ?
      `, [id])
      return rows[0]?.laboratorio_ids
    } catch (error) {
      handleDBError(error, 'Usuario')
    }
  }
}