import { pool } from '../config/database.js'
import { Inventario } from '../models/Inventario.js'
import { AppError } from '../utils/errors.js'

export const inventarioService = {

  async ejecutarReabastecimientoMasivo(userId, fecha_movimiento, laboratorio_id, motivo_general, datos_reabastecimiento) {
    const connection = await pool.getConnection()
    try {
      await Inventario.registrarMovimientoManual(connection, userId, fecha_movimiento, laboratorio_id, 'entrada', motivo_general, null, datos_reabastecimiento)
      return {
        total_registros: datos_reabastecimiento.length,
        registros_procesados: datos_reabastecimiento.length,
        registros_fallidos: 0,
        motivo: motivo_general,
        resultados: []
      }
    } catch (error) {
      throw error
    } finally {
      connection.release()
    }
  },

  async registrarMovimientoManual(userId, fecha_movimiento, laboratorio_id, tipo_movimiento, observaciones, reserva_id, detalles) {
    const connection = await pool.getConnection()
    try {
      const movimientoId = await Inventario.registrarMovimientoManual(connection, userId, fecha_movimiento, laboratorio_id, tipo_movimiento, observaciones, reserva_id, detalles)
      return movimientoId
    } catch (error) {
      throw new AppError(error.message || 'Error al registrar el movimiento', error.statusCode || 400)
    } finally {
      connection.release()
    }
  },

  async eliminarMovimientoInventario(movimiento_id) {
    const connection = await pool.getConnection()
    try {
      await Inventario.eliminarMovimientoInventario(connection, movimiento_id)
    } catch (error) {
      throw new AppError(error.message || 'Error al eliminar el movimiento de inventario', error.statusCode || 500)
    } finally {
      connection.release()
    }
  },

  async getLotesPorInsumo(insumo_id, laboratorio_id, user) {
    let userLaboratorioIds = user.laboratorio_ids || []
    if (laboratorio_id) {
      if (user.rol === 'Jefe de Laboratorio') {
        if (userLaboratorioIds.length > 0 && !userLaboratorioIds.includes(laboratorio_id)) {
          throw new AppError('No tienes acceso a este laboratorio', 403)
        }
      }
      userLaboratorioIds = [laboratorio_id]
    } else {
      if (user.rol === 'Jefe de Laboratorio' && userLaboratorioIds.length > 0) {
        // ya configurado
      } else if (user.rol === 'Administrador') {
        userLaboratorioIds = []
      }
    }
    return await Inventario.getLotesPorInsumo(insumo_id, user.rol, userLaboratorioIds)
  }
}
