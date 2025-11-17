import { pool } from '../config/database.js'
import bcrypt from 'bcryptjs'

export const User = {
  findByCredentials: async (usuario, contrasena) => {
    // Obtener usuario con su contraseña hasheada
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
    `;

    const [userRows] = await pool.execute(userQuery, [usuario])

    if (userRows.length === 0) {
      return null
    }

    const user = userRows[0]

    // Comparar contraseña con bcrypt
    const isPasswordValid = await bcrypt.compare(contrasena, user.contrasena)

    if (!isPasswordValid) {
      return null
    }

    return user
  },

  // Obtener permisos del usuario
  getUserPermissions: async (rolId) => {
    const [rows] = await pool.execute(`
      SELECT p.nombre, p.ruta
      FROM permisos p
      JOIN rol_permiso rp ON p.id = rp.permiso_id
      WHERE rp.rol_id = ?
    `, [rolId])

    return rows
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
      throw error
    }
  },

  // Obtener un usuario por ID
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
      throw error
    }
  },

  // Crear un nuevo usuario
  create: async (data) => {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // Verificar si ya existe un usuario con ese nombre de usuario
      const [existing] = await connection.execute(
        'SELECT id FROM usuarios WHERE usuario = ?',
        [data.usuario]
      )

      if (existing.length > 0) {
        throw new Error('Ya existe un usuario con ese nombre de usuario')
      }

      // Preparar laboratorio_ids como JSON
      let laboratorioIdsJson = null
      if (data.laboratorio_ids && data.laboratorio_ids.length > 0) {
        // Verificar que el rol sea Jefe de Laboratorio
        const [rolRows] = await connection.execute(
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

      // Insertar usuario con contraseña hasheada
      const [result] = await connection.execute(
        `INSERT INTO usuarios (nombre_completo, usuario, contrasena, rol_id, laboratorio_ids) 
         VALUES (?, ?, ?, ?, ?)`,
        [data.nombre_completo, data.usuario, hashedPassword, data.rol_id, laboratorioIdsJson]
      )

      await connection.commit()
      return result.insertId
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  // Actualizar un usuario
  update: async (id, data) => {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // Verificar si existe otro usuario con el mismo nombre de usuario
      if (data.usuario) {
        const [existing] = await connection.execute(
          'SELECT id FROM usuarios WHERE usuario = ? AND id != ?',
          [data.usuario, id]
        )

        if (existing.length > 0) {
          throw new Error('Ya existe otro usuario con ese nombre de usuario')
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
          const [userRows] = await connection.execute('SELECT rol_id FROM usuarios WHERE id = ?', [id])
          rolId = userRows[0]?.rol_id
        }

        if (rolId) {
          const [rolRows] = await connection.execute(
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

      if (updates.length > 0) {
        values.push(id)
        await connection.execute(
          `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`,
          values
        )
      }

      await connection.commit()
      return true
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  // Eliminar un usuario
  delete: async (id) => {
    try {
      const [result] = await pool.execute(
        'DELETE FROM usuarios WHERE id = ?',
        [id]
      )
      return result.affectedRows > 0
    } catch (error) {
      throw error
    }
  },

  // Cambiar el estado de un usuario
  updateEstado: async (id, estado) => {
    try {
      // Convertir 'activo'/'inactivo' a 'A'/'I' si es necesario
      const estadoChar = estado === 'activo' || estado === 'A' ? 'A' : 'I'
      const [result] = await pool.execute(
        'UPDATE usuarios SET estado = ? WHERE id = ?',
        [estadoChar, id]
      )
      return result.affectedRows > 0
    } catch (error) {
      throw error
    }
  },
  // Obtener laboratorios del usuario
  getLaboratoriosById: async (id) => {
    const [rows] = await pool.execute(`
      SELECT laboratorio_ids
      FROM usuarios
      WHERE id = ?
    `, [id])
    return rows[0]?.laboratorio_ids
  }
}