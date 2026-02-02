import { pool } from '../config/database.js'
import { AppError } from '../utils/errors.js'
import { ShareLink } from '../models/ShareLink.js'
import { Laboratorio } from '../models/Laboratorio.js'
import { Horario } from '../models/Horario.js'

/**
 * Crear o actualizar enlace compartido para un laboratorio.
 * Transacción manejada por el service; el modelo recibe connection.
 */
export async function createShareLink(laboratorioId, userId, expiresInDays = 365) {
  const laboratorio = await Laboratorio.getLaboratorioById(laboratorioId)
  if (!laboratorio) {
    throw new AppError('Laboratorio no encontrado', 404)
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const shareId = await ShareLink.createOrUpdate(connection, laboratorioId, userId, expiresInDays)
    await connection.commit()
    const shareLink = await ShareLink.getById(shareId)
    return {
      shareLink,
      laboratorio
    }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

/**
 * Obtener horarios públicos por laboratorio y token.
 * Valida token y existencia del laboratorio.
 */
export async function getPublicHorarios(laboratorioId, token) {
  if (!token) {
    throw new AppError('Token requerido', 401)
  }

  const tokenVerification = await ShareLink.verifyToken(token, laboratorioId)
  if (!tokenVerification.valid) {
    throw new AppError(tokenVerification.reason || 'Token inválido', 401)
  }

  const laboratorioExists = await Laboratorio.exists(laboratorioId)
  if (!laboratorioExists) {
    throw new AppError('Laboratorio no encontrado', 404)
  }

  const laboratorioWithEscuela = await Laboratorio.getLaboratorioById(laboratorioId)
  const horarios = await Horario.getPublicHorarios(laboratorioId)

  const horariosConInsumos = await Promise.all(
    horarios.map(async (horario) => {
      try {
        const insumos = await Horario.getInsumosRequeridosByHorario(horario.reserva_id)
        return { ...horario, insumos: insumos || [] }
      } catch {
        return { ...horario, insumos: [] }
      }
    })
  )

  const docentes = await Horario.getDocentesReservasByLaboratorio(laboratorioId)
  const ciclos = await Horario.getCiclosReservasByLaboratorio(laboratorioId)

  return {
    laboratorio: laboratorioWithEscuela,
    horarios: horariosConInsumos,
    filtros: {
      docentes: docentes.map((d) => d.nombre),
      ciclos: ciclos.map((c) => c.nombre)
    }
  }
}

/**
 * Obtener enlaces del usuario según rol y laboratorios asignados.
 */
export async function getUserShareLinks(userId, userRole, laboratorioIds = []) {
  return ShareLink.getByUserId(userId, userRole, laboratorioIds)
}

/**
 * Desactivar enlace compartido. Solo el creador puede desactivar.
 */
export async function deactivateShareLink(id, userId) {
  const link = await ShareLink.deactivate(id, userId)
  if (!link) {
    throw new AppError('Enlace no encontrado', 404)
  }
  return link
}

/**
 * Eliminar enlace compartido. Solo el creador puede eliminar.
 */
export async function deleteShareLink(id, userId) {
  const link = await ShareLink.delete(id, userId)
  if (!link) {
    throw new AppError('Enlace no encontrado', 404)
  }
  return link
}
