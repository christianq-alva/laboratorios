import { ShareLink } from '../models/ShareLink.js'
import { Laboratorio } from '../models/Laboratorio.js'
import { Horario } from '../models/Horario.js'

export const createShareLink = async (req, res) => {
  try {
    // Los datos ya están validados y transformados por el middleware de validación
    const { laboratorio_id, expires_in_days = 365 } = req.body
    const userId = req.user.userId

    // Validación de negocio: Verificar que el laboratorio existe
    const laboratorio = await Laboratorio.getLaboratorioById(laboratorio_id)
    if (!laboratorio) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    const shareLink = await ShareLink.createOrUpdate(laboratorio_id, userId, expires_in_days)

    res.status(201).json({
      success: true,
      message: 'Enlace compartible creado exitosamente',
      data: {
        id: shareLink.id,
        laboratorio_id: laboratorio_id,
        laboratorio_nombre: shareLink.laboratorio_nombre,
        laboratorio_ubicacion: shareLink.laboratorio_ubicacion,
        token: shareLink.token,
        url: shareLink.url,
        fecha_expiracion: shareLink.fecha_expiracion,
        activo: shareLink.activo
      }
    })
  } catch (error) {
    console.error('Error al crear enlace compartible:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    })
  }
}

export const getPublicHorarios = async (req, res) => {
  try {
    // Los datos ya están validados y transformados por el middleware de validación
    const { laboratorio_id } = req.params
    const { token } = req.query

    // Validación de negocio: Verificar token
    const tokenVerification = await ShareLink.verifyToken(token, laboratorio_id)
    if (!tokenVerification.valid) {
      return res.status(401).json({
        success: false,
        message: tokenVerification.reason
      })
    }

    // Validación de negocio: Verificar que el laboratorio existe
    const laboratorioExists = await Laboratorio.exists(laboratorio_id)
    if (!laboratorioExists) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    const laboratorioWithEscuela = await Laboratorio.getLaboratorioById(laboratorio_id)

    const horarios = await Horario.getPublicHorarios(laboratorio_id)

    console.log('✅ Obteniendo insumos para horarios públicos...')
    const horariosConInsumos = await Promise.all(
      horarios.map(async (horario) => {
        try {
          const insumos = await Horario.getInsumosRequeridosByHorario(horario.reserva_id)

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

    const docentes = await Horario.getDocentesReservasByLaboratorio(laboratorio_id)

    const ciclos = await Horario.getCiclosReservasByLaboratorio(laboratorio_id)

    res.status(200).json({
      success: true,
      data: {
        laboratorio: laboratorioWithEscuela,
        horarios: horariosConInsumos,
        filtros: {
          docentes: docentes.map(d => d.nombre),
          ciclos: ciclos.map(c => c.nombre)
        }
      }
    })
  } catch (error) {
    console.error('Error al obtener horarios públicos:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    })
  }
}

export const getUserShareLinks = async (req, res) => {
  try {
    const userId = req.user.userId
    const userRole = req.user.rol
    const laboratorioIds = req.user.laboratorio_ids || []

    const enlaces = await ShareLink.getByUserId(userId, userRole, laboratorioIds)

    res.status(200).json({
      success: true,
      data: enlaces
    })
  } catch (error) {
    console.error('Error al obtener enlaces del usuario:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    })
  }
}

export const deactivateShareLink = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: linkId } = req.params
    const userId = req.user.userId

    // Validación de negocio: Verificar que el enlace existe y pertenece al usuario
    const link = await ShareLink.deactivate(linkId, userId)

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Enlace no encontrado'
      })
    }

    res.status(200).json({
      success: true,
      message: `Enlace para ${link.laboratorio_nombre} desactivado`
    })
  } catch (error) {
    console.error('Error al desactivar enlace:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    })
  }
}

export const deleteShareLink = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: linkId } = req.params
    const userId = req.user.userId

    // Validación de negocio: Verificar que el enlace existe y pertenece al usuario
    const link = await ShareLink.delete(linkId, userId)

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Enlace no encontrado'
      })
    }

    res.status(200).json({
      success: true,
      message: `Enlace para ${link.laboratorio_nombre} eliminado correctamente`
    })
  } catch (error) {
    console.error('Error al eliminar enlace:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    })
  }
}
