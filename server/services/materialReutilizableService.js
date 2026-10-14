import { MaterialReutilizable } from '../models/MaterialReutilizable.js'
import { Laboratorio } from '../models/Laboratorio.js'
import { DepreciacionCategoria } from '../models/DepreciacionCategoria.js'
import { AppError } from '../utils/errors.js'

export const materialReutilizableService = {

  async getMateriales(user_rol, user_laboratorio_ids, filters) {
    return await MaterialReutilizable.getAll(user_rol, user_laboratorio_ids, filters)
  },

  async getMaterialesByLaboratorio(laboratorio_id, filters) {
    const lab = await Laboratorio.getLaboratorioById(laboratorio_id)
    if (!lab) throw new AppError('Laboratorio no encontrado', 404)
    return await MaterialReutilizable.getByLaboratorio(laboratorio_id, filters)
  },

  async getMaterialById(materialId) {
    const material = await MaterialReutilizable.getById(materialId)
    if (!material) throw new AppError('Material reutilizable no encontrado', 404)
    return material
  },

  async crearMaterial(datos) {
    const existingCodigo = await MaterialReutilizable.existsByCodigo(datos.codigo)
    if (existingCodigo) throw new AppError('Ya existe otro material reutilizable con ese código', 409)

    const lab = await Laboratorio.getLaboratorioById(datos.laboratorio_id)
    if (!lab) throw new AppError('Laboratorio no encontrado', 404)

    if (datos.depreciacion_categoria_id) {
      // Lanza 404 si la categoría no existe
      await DepreciacionCategoria.getById(datos.depreciacion_categoria_id)
    }

    return await MaterialReutilizable.create(datos)
  },

  async actualizarMaterial(materialId, datos) {
    const actual = await MaterialReutilizable.getById(materialId)
    if (!actual) throw new AppError('Material reutilizable no encontrado', 404)

    const existingCodigo = await MaterialReutilizable.existsByCodigo(datos.codigo, materialId)
    if (existingCodigo) throw new AppError('Ya existe otro material reutilizable con ese código', 409)

    const lab = await Laboratorio.getLaboratorioById(datos.laboratorio_id)
    if (!lab) throw new AppError('Laboratorio no encontrado', 404)

    if (datos.depreciacion_categoria_id) {
      await DepreciacionCategoria.getById(datos.depreciacion_categoria_id)
    }

    // Mover el material a otro laboratorio rompería los horarios que ya lo reservaron ahí
    if (Number(datos.laboratorio_id) !== Number(actual.laboratorio_id)) {
      const tieneReservas = await MaterialReutilizable.reservasProgramadasByLaboratorioId(
        materialId, actual.laboratorio_id
      )
      if (tieneReservas) {
        throw new AppError(
          'No se puede cambiar de laboratorio. El material tiene horarios programados en el laboratorio actual.',
          400
        )
      }
    }

    const affectedRows = await MaterialReutilizable.update(materialId, datos)
    if (affectedRows === 0) throw new AppError('Material reutilizable no encontrado', 404)
    return await MaterialReutilizable.getById(materialId)
  },

  async eliminarMaterial(materialId) {
    const existe = await MaterialReutilizable.existsById(materialId)
    if (!existe) throw new AppError('Material reutilizable no encontrado', 404)

    const reservas = await MaterialReutilizable.contarReservas(materialId)
    if (reservas > 0) {
      throw new AppError(
        `No se puede eliminar. El material está registrado en ${reservas} horario(s). Puedes desactivarlo para que deje de ofrecerse sin perder el historial de costos.`,
        409
      )
    }

    const affectedRows = await MaterialReutilizable.delete(materialId)
    if (affectedRows === 0) throw new AppError('Material reutilizable no encontrado', 404)
    return true
  }
}
