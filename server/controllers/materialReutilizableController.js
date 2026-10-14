import { materialReutilizableService } from '../services/materialReutilizableService.js'

export const getMateriales = async (req, res, next) => {
  try {
    const { laboratorio_id, depreciacion_categoria_id, activo } = req.query
    const filters = {}
    if (laboratorio_id) filters.laboratorio_id = laboratorio_id
    if (depreciacion_categoria_id) filters.depreciacion_categoria_id = depreciacion_categoria_id
    if (activo !== undefined) filters.activo = activo === 'true' || activo === '1'

    const materiales = await materialReutilizableService.getMateriales(
      req.user.rol, req.user.laboratorio_ids, filters
    )
    res.status(200).json({
      success: true,
      data: materiales,
      total_materiales: materiales.length
    })
  } catch (error) {
    next(error)
  }
}

export const getMaterialesByLaboratorio = async (req, res, next) => {
  try {
    const { laboratorio_id } = req.params
    const { incluir_inactivos } = req.query
    const materiales = await materialReutilizableService.getMaterialesByLaboratorio(
      laboratorio_id,
      { incluir_inactivos: incluir_inactivos === 'true' }
    )
    res.status(200).json({
      success: true,
      data: materiales
    })
  } catch (error) {
    next(error)
  }
}

export const getMaterialById = async (req, res, next) => {
  try {
    const { id } = req.params
    const material = await materialReutilizableService.getMaterialById(id)
    res.status(200).json({
      success: true,
      data: material
    })
  } catch (error) {
    next(error)
  }
}

export const createMaterial = async (req, res, next) => {
  try {
    const {
      codigo,
      nombre,
      descripcion,
      laboratorio_id,
      cantidad_total,
      valor_unitario,
      depreciacion_categoria_id,
      activo
    } = req.body
    await materialReutilizableService.crearMaterial({
      codigo,
      nombre,
      descripcion: descripcion ?? null,
      laboratorio_id,
      cantidad_total: cantidad_total ?? 0,
      valor_unitario: valor_unitario ?? null,
      depreciacion_categoria_id: depreciacion_categoria_id ?? null,
      activo
    })
    res.status(201).json({
      success: true,
      message: 'Material reutilizable creado exitosamente'
    })
  } catch (error) {
    next(error)
  }
}

export const updateMaterial = async (req, res, next) => {
  try {
    const { id } = req.params
    const {
      codigo,
      nombre,
      descripcion,
      laboratorio_id,
      cantidad_total,
      valor_unitario,
      depreciacion_categoria_id,
      activo
    } = req.body
    const material = await materialReutilizableService.actualizarMaterial(id, {
      codigo,
      nombre,
      descripcion: descripcion ?? null,
      laboratorio_id,
      cantidad_total: cantidad_total ?? 0,
      valor_unitario: valor_unitario ?? null,
      depreciacion_categoria_id: depreciacion_categoria_id ?? null,
      activo
    })
    res.status(200).json({
      success: true,
      message: 'Material reutilizable actualizado exitosamente',
      data: material
    })
  } catch (error) {
    next(error)
  }
}

export const deleteMaterial = async (req, res, next) => {
  try {
    const { id } = req.params
    await materialReutilizableService.eliminarMaterial(id)
    res.status(200).json({
      success: true,
      message: 'Material reutilizable eliminado exitosamente'
    })
  } catch (error) {
    next(error)
  }
}
