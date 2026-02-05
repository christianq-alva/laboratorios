import { pool } from '../config/database.js'
import { Inventario } from '../models/Inventario.js'
import { AppError } from '../utils/errors.js'

export const inventarioService = {

  async ejecutarReabastecimientoMasivo(userId, fecha_movimiento, laboratorio_id, motivo_general, datos_reabastecimiento) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      await Inventario.registrarMovimiento(connection, userId, fecha_movimiento, laboratorio_id, 'entrada', motivo_general, null, datos_reabastecimiento)
      await connection.commit()
      return {
        total_registros: datos_reabastecimiento.length,
        registros_procesados: datos_reabastecimiento.length,
        registros_fallidos: 0,
        motivo: motivo_general,
        resultados: []
      }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  async registrarMovimientoManual(userId, fecha_movimiento, laboratorio_id, tipo_movimiento, observaciones, reserva_id, detalles) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const movimientoId = await Inventario.registrarMovimiento(connection, userId, fecha_movimiento, laboratorio_id, tipo_movimiento, observaciones, reserva_id, detalles)
      await connection.commit()
      return movimientoId
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  async eliminarMovimientoInventario(movimiento_id) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      await Inventario.eliminarMovimientoInventario(connection, movimiento_id)
      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
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
  },

  async getAllInsumosWithStock(user_rol, user_laboratorio_ids) {
    return await Inventario.getAllInsumosConSaldo(user_rol, user_laboratorio_ids)
  },

  async getInsumosWithStock(laboratorio_id) {
    return await Inventario.getInsumosConSaldo(laboratorio_id)
  },

  async getInsumosWithPositiveStock(laboratorio_id) {
    return await Inventario.getInsumosConSaldoPositivo(laboratorio_id)
  },

  async getActividadInsumos(user_rol, user_laboratorio_ids, laboratorio_id, fecha_inicio, fecha_fin, tipo_movimiento) {
    const rows = await Inventario.getActividadInsumos(user_rol, user_laboratorio_ids, laboratorio_id, fecha_inicio, fecha_fin, tipo_movimiento)
    // Convertir fechas al formato ISO para el frontend
    return rows.map(row => ({
      ...row,
      fecha_ingreso: row.fecha_ingreso ? new Date(row.fecha_ingreso).toISOString() : null,
      fecha_movimiento: row.fecha_movimiento,
      reserva_fecha_inicio: row.reserva_fecha_inicio ? new Date(row.reserva_fecha_inicio).toISOString() : null,
      reserva_fecha_fin: row.reserva_fecha_fin ? new Date(row.reserva_fecha_fin).toISOString() : null
    }))
  },

  async getLotesConSaldo(laboratorio_id, insumo_id) {
    return await Inventario.getLotesConSaldo(laboratorio_id, insumo_id)
  },

  async getActividadDetalleInsumos(user_rol, user_laboratorio_ids, laboratorio_id, insumo_id) {
    return await Inventario.getActividadDetalleInsumos(user_rol, user_laboratorio_ids, laboratorio_id, insumo_id)
  },

  async getDetalleMovimiento(movimiento_id, user_rol, user_laboratorio_ids) {
    const result = await Inventario.getDetalleMovimiento(movimiento_id, user_rol, user_laboratorio_ids)
    if (!result) {
      throw new AppError('Movimiento no encontrado o sin permisos para verlo', 404)
    }
    const cabecera = {
      ...result.cabecera,
      fecha_ingreso: result.cabecera.fecha_ingreso ? new Date(result.cabecera.fecha_ingreso).toISOString() : null,
      fecha_movimiento: result.cabecera.fecha_movimiento
    }
    return { cabecera, detalle: result.detalle }
  },

  async getInsumosConfiguradosByLaboratorio(laboratorio_id) {
    return await Inventario.getInsumosConfiguradosByLaboratorio(laboratorio_id)
  }
}
