import { laboratorioService } from '../services/laboratorioService.js'

export const getLaboratorios = async (req, res, next) => {
  try {
    const laboratorios = await laboratorioService.getAllByUser(req.user.rol, req.user.laboratorio_ids)
    res.status(200).json({
      success: true,
      data: laboratorios
    })
  } catch (error) {
    next(error)
  }
}

export const createLaboratorio = async (req, res, next) => {
  try {
    const { codigo, nombre, ubicacion, escuela_id, piso, estado } = req.body
    const data = await laboratorioService.create(codigo, nombre, ubicacion, escuela_id, piso, estado)
    res.status(201).json({
      success: true,
      data: { ...data, escuela: '' },
      message: 'Laboratorio creado correctamente'
    })
  } catch (error) {
    next(error)
  }
}

export const updateLaboratorio = async (req, res, next) => {
  try {
    const { id: laboratorioId } = req.params
    const body = req.body
    const data = await laboratorioService.update(laboratorioId, body)
    res.status(200).json({
      success: true,
      data: { ...data, escuela: '' },
      message: 'Laboratorio actualizado correctamente'
    })
  } catch (error) {
    next(error)
  }
}

export const deleteLaboratorio = async (req, res, next) => {
  try {
    const { id: laboratorioId } = req.params
    await laboratorioService.delete(laboratorioId)
    res.status(200).json({
      success: true,
      message: 'Laboratorio eliminado correctamente'
    })
  } catch (error) {
    next(error)
  }
}

export const changeEstadoLaboratorio = async (req, res, next) => {
  try {
    const { id: laboratorioId } = req.params
    const { estado } = req.body
    const data = await laboratorioService.changeEstado(laboratorioId, estado)
    res.status(200).json({
      success: true,
      data: {
        id: data.id,
        estado_anterior: '',
        estado_nuevo: data.estado
      },
      message: `Estado cambiado a "${data.estado}" correctamente`
    })
  } catch (error) {
    next(error)
  }
}

export const getInsumosLaboratorio = async (req, res, next) => {
  try {
    const { id: laboratorioId } = req.params
    const insumos = await laboratorioService.getInsumos(laboratorioId)
    res.status(200).json({
      success: true,
      data: insumos
    })
  } catch (error) {
    next(error)
  }
}

export const configurarInsumosLaboratorio = async (req, res, next) => {
  try {
    const { id: laboratorioId } = req.params
    const { insumo_ids } = req.body
    await laboratorioService.configurarInsumos(laboratorioId, insumo_ids)
    res.status(200).json({
      success: true,
      message: 'Insumos configurados correctamente',
      data: {
        laboratorio_id: laboratorioId,
        insumos_configurados: insumo_ids.length
      }
    })
  } catch (error) {
    next(error)
  }
}
