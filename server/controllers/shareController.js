import { pool } from '../config/database.js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
// Generar token único para enlace compartible
const generateShareToken = (laboratorioId, userId) => {
  const payload = {
    laboratorio_id: laboratorioId,
    created_by: userId,
    type: 'share_link',
    timestamp: Date.now()
  }
  // Token que no expira (o expira en 1 año)
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '365d' })
}
// Crear enlace compartible
export const createShareLink = async (req, res) => {
  try {
    const { laboratorio_id, expires_in_days = 365 } = req.body
    const userId = req.user.userId
    console.log('🔗 Creando enlace compartible:', { laboratorio_id, userId, expires_in_days })
    // Verificar que el usuario tiene permisos sobre este laboratorio
    if (req.user.rol === 'Jefe de Laboratorio') {
      if (!req.user.laboratorio_ids.includes(parseInt(laboratorio_id))) {
        return res.status(403).json({
          message: 'No tienes permisos para compartir este laboratorio'
        })
      }
    }
    // Verificar que el laboratorio existe
    const [labCheck] = await pool.execute(
      'SELECT id, nombre, ubicacion FROM laboratorios WHERE id = ?',
      [laboratorio_id]
    )
    if (labCheck.length === 0) {
      return res.status(404).json({
        message: 'Laboratorio no encontrado'
      })
    }
    // Generar token único
    const token = generateShareToken(laboratorio_id, userId)
    // Calcular fecha de expiración
    const fechaExpiracion = new Date()
    fechaExpiracion.setDate(fechaExpiracion.getDate() + expires_in_days)
    // Verificar si ya existe un enlace activo para este laboratorio y usuario
    const [existingLink] = await pool.execute(`
      SELECT id, token FROM enlaces_compartidos 
      WHERE laboratorio_id = ? AND creado_por = ? AND activo = TRUE
    `, [laboratorio_id, userId])
    let shareId, shareToken
    if (existingLink.length > 0) {
      // Actualizar enlace existente
      shareId = existingLink[0].id
      shareToken = existingLink[0].token
      await pool.execute(`
        UPDATE enlaces_compartidos 
        SET fecha_expiracion = ?, updated_at = NOW()
        WHERE id = ?
      `, [fechaExpiracion, shareId])
      console.log('🔄 Enlace existente actualizado:', shareId)
    } else {
      // Crear nuevo enlace
      const [result] = await pool.execute(`
        INSERT INTO enlaces_compartidos 
        (laboratorio_id, token, creado_por, fecha_expiracion, activo, created_at, updated_at)
        VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())
      `, [laboratorio_id, token, userId, fechaExpiracion])
      shareId = result.insertId
      shareToken = token
      console.log('✅ Nuevo enlace creado:', shareId)
    }
    // Construir URL pública - Detectar entorno de manera robusta
    const isProduction = process.env.RAILWAY_ENVIRONMENT ||
      process.env.NODE_ENV === 'production' ||
      process.env.RAILWAY_PROJECT_ID ||
      process.env.PORT // Railway siempre establece PORT
    // Usar variables de entorno para URLs dinámicas
    let baseUrl
    if (isProduction) {
      // En producción, usar la variable de entorno o construir dinámicamente
      baseUrl = process.env.FRONTEND_URL ||
        process.env.VITE_BASE_URL ||
        (process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : null) ||
        'https://beneficial-wholeness-production-9cd6.up.railway.app'
    } else {
      // En desarrollo
      baseUrl = 'http://localhost:5173'
    }
    const publicUrl = `${baseUrl}/horarios/publico/${laboratorio_id}?token=${shareToken}`
    console.log('🔗 URL generada:', publicUrl)
    console.log('🔗 Entorno detectado:', isProduction ? 'PRODUCTION (Railway)' : 'DEVELOPMENT (Local)')
    console.log('🔗 Base URL utilizada:', baseUrl)
    console.log('🔗 Variables de entorno:', {
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      RAILWAY_PROJECT_ID: !!process.env.RAILWAY_PROJECT_ID,
      FRONTEND_URL: process.env.FRONTEND_URL,
      VITE_BASE_URL: process.env.VITE_BASE_URL,
      RAILWAY_STATIC_URL: process.env.RAILWAY_STATIC_URL,
      PORT: process.env.PORT
    })
    res.status(201).json({
      message: 'Enlace compartible creado exitosamente',
      data: {
        id: shareId,
        laboratorio_id: parseInt(laboratorio_id),
        laboratorio_nombre: labCheck[0].nombre,
        laboratorio_ubicacion: labCheck[0].ubicacion,
        token: shareToken,
        url: publicUrl,
        fecha_expiracion: fechaExpiracion,
        activo: true
      }
    })
  } catch (error) {
    console.error('❌ Error al crear enlace compartible:', error)
    res.status(500).json({
      message: 'Error interno del servidor'
    })
  }
}
// Obtener horarios públicos (sin autenticación)
export const getPublicHorarios = async (req, res) => {
  try {
    const { laboratorio_id } = req.params
    const { token } = req.query
    console.log('🌐 Obteniendo horarios públicos:', { laboratorio_id, token: token?.substring(0, 20) + '...' })
    if (!token) {
      return res.status(401).json({
        message: 'Token requerido'
      })
    }
    // Verificar token
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    } catch (err) {
      return res.status(401).json({
        message: 'Token inválido o expirado'
      })
    }
    // Verificar que el token es para este laboratorio
    if (decoded.laboratorio_id !== parseInt(laboratorio_id)) {
      return res.status(403).json({
        message: 'Token no válido para este laboratorio'
      })
    }
    // Verificar que el enlace sigue activo en la base de datos
    const [linkCheck] = await pool.execute(`
      SELECT id, activo, fecha_expiracion 
      FROM enlaces_compartidos 
      WHERE token = ? AND laboratorio_id = ?
    `, [token, laboratorio_id])
    if (linkCheck.length === 0) {
      return res.status(404).json({
        message: 'Enlace no encontrado'
      })
    }
    const link = linkCheck[0]
    if (!link.activo) {
      return res.status(403).json({
        message: 'Enlace desactivado'
      })
    }
    if (new Date() > new Date(link.fecha_expiracion)) {
      return res.status(403).json({
        message: 'Enlace expirado'
      })
    }
    // Obtener información del laboratorio
    const [laboratorio] = await pool.execute(`
      SELECT l.*, e.nombre as escuela 
      FROM laboratorios l
      LEFT JOIN escuelas e ON l.escuela_id = e.id
      WHERE l.id = ?
    `, [laboratorio_id])
    if (laboratorio.length === 0) {
      return res.status(404).json({
        message: 'Laboratorio no encontrado'
      })
    }
    // Obtener horarios del laboratorio (incluye fechas pasadas y futuras)
    const [horarios] = await pool.execute(`
      SELECT 
        r.id,
        r.fecha_inicio,
        r.fecha_fin,
        r.cantidad_alumnos,
        r.descripcion,
        r.color,
        l.nombre as laboratorio,
        d.nombre as docente,
        e.nombre as escuela,
        c.nombre as ciclo,
        g.nombre as grupo
      FROM reservas r
      LEFT JOIN laboratorios l ON r.laboratorio_id = l.id
      LEFT JOIN docentes d ON r.docente_id = d.id
      LEFT JOIN grupos g ON r.grupo_id = g.id
      LEFT JOIN escuelas e ON g.escuela_id = e.id
      LEFT JOIN ciclos c ON g.ciclo_id = c.id
      WHERE r.laboratorio_id = ?
      ORDER BY r.fecha_inicio DESC
    `, [laboratorio_id])
    // Obtener insumos para cada horario usando detalle_reserva_insumos
    console.log('✅ Obteniendo insumos para horarios públicos...')
    const horariosConInsumos = await Promise.all(
      horarios.map(async (horario) => {
        try {
          const [insumos] = await pool.execute(`
            SELECT 
              i.id,
              i.nombre,
              i.descripcion,
              dri.cantidad_usada,
              i.unidad_medida
            FROM detalle_reserva_insumos dri
            JOIN insumos i ON dri.insumo_id = i.id
            WHERE dri.reserva_id = ?
            ORDER BY i.nombre
          `, [horario.id])
          console.log(`🔍 Horario ${horario.id}: ${insumos.length} insumos encontrados`)
          if (insumos.length > 0) {
            console.log(`   Insumos:`, insumos.map(i => `${i.nombre} (${i.cantidad_usada})`))
          }
          return {
            ...horario,
            insumos: insumos || []
          }
        } catch (error) {
          console.log(`⚠️ Error obteniendo insumos para horario ${horario.id}:`, error.message)
          return {
            ...horario,
            insumos: []
          }
        }
      })
    )
    console.log('🕐 Diagnóstico horarios públicos:', {
      timezone: process.env.TZ || 'UTC',
      total_horarios: horariosConInsumos.length,
      primer_horario: horariosConInsumos[0] ? {
        id: horariosConInsumos[0].id,
        fecha_inicio_raw: horariosConInsumos[0].fecha_inicio,
        fecha_fin_raw: horariosConInsumos[0].fecha_fin,
        fecha_inicio_string: horariosConInsumos[0].fecha_inicio?.toString(),
        fecha_fin_string: horariosConInsumos[0].fecha_fin?.toString(),
        insumos_count: horariosConInsumos[0].insumos?.length || 0
      } : null
    })
    // Obtener lista de docentes y ciclos para filtros (incluye todos los horarios)
    const [docentes] = await pool.execute(`
      SELECT DISTINCT d.nombre
      FROM reservas r
      JOIN docentes d ON r.docente_id = d.id
      WHERE r.laboratorio_id = ?
      ORDER BY d.nombre
    `, [laboratorio_id])
    const [ciclos] = await pool.execute(`
      SELECT DISTINCT c.nombre
      FROM reservas r
      JOIN grupos g ON r.grupo_id = g.id
      JOIN ciclos c ON g.ciclo_id = c.id
      WHERE r.laboratorio_id = ?
      ORDER BY c.nombre
    `, [laboratorio_id])
    console.log('✅ Horarios públicos obtenidos:', horariosConInsumos.length)
    res.json({
      data: {
        laboratorio: laboratorio[0],
        horarios: horariosConInsumos,
        filtros: {
          docentes: docentes.map(d => d.nombre),
          ciclos: ciclos.map(c => c.nombre)
        }
      }
    })
  } catch (error) {
    console.error('❌ Error al obtener horarios públicos:', error)
    res.status(500).json({
      message: 'Error interno del servidor'
    })
  }
}
// Listar enlaces activos del usuario
export const getUserShareLinks = async (req, res) => {
  try {
    const userId = req.user.userId
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
    // Si es jefe de laboratorio, filtrar por sus laboratorios
    if (req.user.rol === 'Jefe de Laboratorio') {
      const labIds = req.user.laboratorio_ids || []
      if (labIds.length > 0) {
        const placeholders = labIds.map(() => '?').join(',')
        query += ` AND es.laboratorio_id IN (${placeholders})`
        params = [userId, ...labIds]
      } else {
        query += ' AND 1 = 0' // No mostrar nada si no tiene laboratorios
      }
    }
    query += ' ORDER BY es.created_at DESC'
    const [enlaces] = await pool.execute(query, params)
    // Construir URLs completas
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const enlacesConUrl = enlaces.map(enlace => ({
      ...enlace,
      url: `${baseUrl}/horarios/publico/${enlace.laboratorio_id}?token=${enlace.token}`,
      expirado: new Date() > new Date(enlace.fecha_expiracion)
    }))
    res.json({
      data: enlacesConUrl
    })
  } catch (error) {
    console.error('❌ Error al obtener enlaces del usuario:', error)
    res.status(500).json({
      message: 'Error interno del servidor'
    })
  }
}
// Desactivar enlace compartible
export const deactivateShareLink = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    // Verificar que el enlace pertenece al usuario
    const [linkCheck] = await pool.execute(`
      SELECT es.*, l.nombre as laboratorio_nombre
      FROM enlaces_compartidos es
      JOIN laboratorios l ON es.laboratorio_id = l.id
      WHERE es.id = ? AND es.creado_por = ?
    `, [id, userId])
    if (linkCheck.length === 0) {
      return res.status(404).json({
        message: 'Enlace no encontrado'
      })
    }
    // Desactivar enlace
    await pool.execute(`
      UPDATE enlaces_compartidos 
      SET activo = FALSE, updated_at = NOW()
      WHERE id = ?
    `, [id])
    console.log('🔇 Enlace desactivado:', id)
    res.json({
      message: `Enlace para ${linkCheck[0].laboratorio_nombre} desactivado`
    })
  } catch (error) {
    console.error('❌ Error al desactivar enlace:', error)
    res.status(500).json({
      message: 'Error interno del servidor'
    })
  }
}
