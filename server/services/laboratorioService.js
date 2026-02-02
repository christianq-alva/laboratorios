import { pool } from '../config/database.js'
import { Laboratorio } from '../models/Laboratorio.js'
import { AppError } from '../utils/errors.js'

export const laboratorioService = {

  async getAllByUser(user_rol, user_laboratorio_ids) {
    return await Laboratorio.getAllByUser(user_rol, user_laboratorio_ids)
  },

  async create(codigo, nombre, ubicacion, escuela_id, piso, estado) {
    const insertId = await Laboratorio.create(codigo, nombre, ubicacion, escuela_id, piso, estado)
    return { id: insertId, codigo, nombre, ubicacion, escuela_id, piso, estado }
  },

  async update(laboratorioId, body) {
    const laboratorioActual = await Laboratorio.getLaboratorioById(laboratorioId)
    if (!laboratorioActual) {
      throw new AppError('Laboratorio no encontrado', 404)
    }
    const codigo = body.codigo !== undefined ? body.codigo : laboratorioActual.codigo
    const nombre = body.nombre !== undefined ? body.nombre : laboratorioActual.nombre
    const ubicacion = body.ubicacion !== undefined ? body.ubicacion : laboratorioActual.ubicacion
    const escuela_id = body.escuela_id !== undefined ? body.escuela_id : laboratorioActual.escuela_id
    const piso = body.piso !== undefined ? body.piso : laboratorioActual.piso
    const estado = body.estado || laboratorioActual.estado

    await Laboratorio.update(laboratorioId, codigo, nombre, ubicacion, escuela_id, piso, estado)
    return { id: laboratorioId, codigo, nombre, ubicacion, escuela_id, piso, estado }
  },

  async delete(laboratorioId) {
    await Laboratorio.delete(laboratorioId)
  },

  async changeEstado(laboratorioId, estado) {
    const exists = await Laboratorio.exists(laboratorioId)
    if (!exists) {
      throw new AppError('Laboratorio no encontrado', 404)
    }
    const affectedRows = await Laboratorio.updateEstado(laboratorioId, estado)
    if (affectedRows === 0) {
      throw new AppError('Laboratorio no encontrado', 404)
    }
    return { id: laboratorioId, estado }
  },

  async getInsumos(laboratorioId) {
    const exists = await Laboratorio.exists(laboratorioId)
    if (!exists) {
      throw new AppError('Laboratorio no encontrado', 404)
    }
    return await Laboratorio.getInsumosByLaboratorio(laboratorioId)
  },

  async configurarInsumos(laboratorio_id, insumo_ids) {
    const exists = await Laboratorio.exists(laboratorio_id)
    if (!exists) {
      throw new AppError('Laboratorio no encontrado', 404)
    }
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      await Laboratorio.configurarInsumos(laboratorio_id, insumo_ids, connection)
      await connection.commit()
      return true
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}
