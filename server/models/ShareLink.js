import { pool } from '../config/database.js'
import jwt from 'jsonwebtoken'

const generateShareToken = (laboratorioId, userId) => {
  const payload = {
    laboratorio_id: laboratorioId,
    created_by: userId,
    type: 'share_link',
    timestamp: Date.now()
  }
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '365d' })
}

const buildPublicUrl = (laboratorioId, token) => {
  const isProduction = process.env.RAILWAY_ENVIRONMENT ||
    process.env.NODE_ENV === 'production' ||
    process.env.RAILWAY_PROJECT_ID ||
    process.env.PORT

  let baseUrl
  if (isProduction) {
    baseUrl = process.env.FRONTEND_URL ||
      process.env.VITE_BASE_URL ||
      (process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : null) ||
      'https://beneficial-wholeness-production-9cd6.up.railway.app'
  } else {
    baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  }

  return `${baseUrl}/horarios/publico/${laboratorioId}?token=${token}`
}

export const ShareLink = {
  createOrUpdate: async (laboratorioId, userId, expiresInDays = 365) => {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const fechaExpiracion = new Date()
      fechaExpiracion.setDate(fechaExpiracion.getDate() + expiresInDays)

      const [existingLink] = await connection.execute(`
        SELECT id, token FROM enlaces_compartidos 
        WHERE laboratorio_id = ? AND creado_por = ? AND activo = TRUE
      `, [laboratorioId, userId])

      let shareId, shareToken

      if (existingLink.length > 0) {
        shareId = existingLink[0].id
        shareToken = existingLink[0].token
        await connection.execute(`
          UPDATE enlaces_compartidos 
          SET fecha_expiracion = ?, updated_at = NOW()
          WHERE id = ?
        `, [fechaExpiracion, shareId])
      } else {
        shareToken = generateShareToken(laboratorioId, userId)
        const [result] = await connection.execute(`
          INSERT INTO enlaces_compartidos 
          (laboratorio_id, token, creado_por, fecha_expiracion, activo, created_at, updated_at)
          VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())
        `, [laboratorioId, shareToken, userId, fechaExpiracion])
        shareId = result.insertId
      }

      await connection.commit()

      const shareLink = await ShareLink.getById(shareId)
      return shareLink
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  deactivate: async (id, userId) => {
    const [linkCheck] = await pool.execute(`
      SELECT es.*, l.nombre as laboratorio_nombre
      FROM enlaces_compartidos es
      JOIN laboratorios l ON es.laboratorio_id = l.id
      WHERE es.id = ? AND es.creado_por = ?
    `, [id, userId])

    if (linkCheck.length === 0) {
      return null
    }

    await pool.execute(`
      UPDATE enlaces_compartidos 
      SET activo = FALSE, updated_at = NOW()
      WHERE id = ?
    `, [id])

    return linkCheck[0]
  },

  getByUserId: async (userId, userRole, laboratorioIds = []) => {
    let query = `
      SELECT 
        es.id,
        es.laboratorio_id,
        es.token,
        es.fecha_expiracion,
        es.activo,
        es.created_at,
        l.nombre as laboratorio_nombre,
        l.ubicacion as laboratorio_ubicacion,
        e.nombre as escuela
      FROM enlaces_compartidos es
      JOIN laboratorios l ON es.laboratorio_id = l.id
      LEFT JOIN escuelas e ON l.escuela_id = e.id
      WHERE es.creado_por = ?
    `
    let params = [userId]

    if (userRole === 'Jefe de Laboratorio' && laboratorioIds.length > 0) {
      const placeholders = laboratorioIds.map(() => '?').join(',')
      query += ` AND es.laboratorio_id IN (${placeholders})`
      params = [...params, ...laboratorioIds]
    } else if (userRole === 'Jefe de Laboratorio' && laboratorioIds.length === 0) {
      query += ' AND 1 = 0'
    }

    query += ' ORDER BY es.created_at DESC'

    const [enlaces] = await pool.execute(query, params)

    return enlaces.map(enlace => ({
      ...enlace,
      url: buildPublicUrl(enlace.laboratorio_id, enlace.token),
      expirado: new Date() > new Date(enlace.fecha_expiracion)
    }))
  },

  getById: async (id) => {
    const [rows] = await pool.execute(`
      SELECT 
        es.*,
        l.nombre as laboratorio_nombre,
        l.ubicacion as laboratorio_ubicacion,
        e.nombre as escuela
      FROM enlaces_compartidos es
      JOIN laboratorios l ON es.laboratorio_id = l.id
      LEFT JOIN escuelas e ON l.escuela_id = e.id
      WHERE es.id = ?
    `, [id])

    if (rows.length === 0) {
      return null
    }

    const enlace = rows[0]
    return {
      ...enlace,
      url: buildPublicUrl(enlace.laboratorio_id, enlace.token),
      expirado: new Date() > new Date(enlace.fecha_expiracion)
    }
  },

  getByTokenAndLaboratorio: async (token, laboratorioId) => {
    const [rows] = await pool.execute(`
      SELECT id, activo, fecha_expiracion, creado_por
      FROM enlaces_compartidos 
      WHERE token = ? AND laboratorio_id = ?
    `, [token, laboratorioId])

    if (rows.length === 0) {
      return null
    }

    return rows[0]
  },

  verifyToken: async (token, laboratorioId) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')

      if (decoded.laboratorio_id !== parseInt(laboratorioId)) {
        return { valid: false, reason: 'Token no válido para este laboratorio' }
      }

      const link = await ShareLink.getByTokenAndLaboratorio(token, laboratorioId)

      if (!link) {
        return { valid: false, reason: 'Enlace no encontrado' }
      }

      if (!link.activo) {
        return { valid: false, reason: 'Enlace desactivado' }
      }

      if (new Date() > new Date(link.fecha_expiracion)) {
        return { valid: false, reason: 'Enlace expirado' }
      }

      return { valid: true, link }
    } catch (error) {
      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
        return { valid: false, reason: 'Token inválido o expirado' }
      }
      throw error
    }
  }
}

