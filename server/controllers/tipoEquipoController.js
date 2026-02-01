import { TipoEquipo } from '../models/TipoEquipo.js'

export const getAll = async (req, res, next) => {
  try {
    const tipos = await TipoEquipo.getAll()
    res.status(200).json({
      success: true,
      data: tipos
    })
  } catch (error) {
    next(error)
  }
}

export const getActivos = async (req, res, next) => {
  try {
    const tipos = await TipoEquipo.getActivos()
    res.status(200).json({
      success: true,
      data: tipos
    })
  } catch (error) {
    next(error)
  }
}

export const getById = async (req, res, next) => {
  try {
    const { id: tipoId } = req.params
    const tipo = await TipoEquipo.getById(tipoId)
    if (!tipo) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de equipo no encontrado'
      })
    }
    res.status(200).json({
      success: true,
      data: tipo
    })
  } catch (error) {
    next(error)
  }
}

export const createTipoEquipo = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body
    await TipoEquipo.create({ nombre, descripcion })
    res.status(201).json({
      success: true,
      message: 'Tipo de equipo creado exitosamente'
    })
  } catch (error) {
    next(error)
  }
}

export const updateTipoEquipo = async (req, res, next) => {
  try {
    const { id: tipoId } = req.params
    const { nombre, descripcion } = req.body
    const actualizado = await TipoEquipo.update(tipoId, { nombre, descripcion })
    const tipoActualizado = actualizado ? await TipoEquipo.getById(tipoId) : null
    res.status(200).json({
      success: true,
      message: 'Tipo de equipo actualizado exitosamente',
      data: tipoActualizado
    })
  } catch (error) {
    next(error)
  }
}

export const deleteTipoEquipo = async (req, res, next) => {
  try {
    const { id: tipoId } = req.params
    await TipoEquipo.delete(tipoId)
    res.status(200).json({
      success: true,
      message: 'Tipo de equipo eliminado exitosamente'
    })
  } catch (error) {
    next(error)
  }
}

export const getAllWithCountEquipos = async (req, res, next) => {
  try {
    const tiposWithCount = await TipoEquipo.getAllWithCountEquipos()
    res.status(200).json({
      success: true,
      data: tiposWithCount
    })
  } catch (error) {
    next(error)
  }
}
