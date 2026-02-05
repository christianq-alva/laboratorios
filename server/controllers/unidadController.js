import { Unidad } from '../models/Unidad.js'

export const createUnidad = async (req, res, next) => {
  try {
    const { simbolo, nombre, descripcion } = req.body
    await Unidad.create({ simbolo, nombre, descripcion })
    res.status(201).json({
      success: true,
      message: 'Unidad creada exitosamente'
    })
  } catch (error) {
    next(error)
  }
}

export const updateUnidad = async (req, res, next) => {
  try {
    const { id: unidadId } = req.params
    const { simbolo, nombre, descripcion } = req.body
    await Unidad.updateById(unidadId, { simbolo, nombre, descripcion })
    res.status(200).json({
      success: true,
      message: 'Unidad actualizada exitosamente'
    })
  } catch (error) {
    next(error)
  }
}

export const deleteUnidad = async (req, res, next) => {
  try {
    const { id: unidadId } = req.params
    await Unidad.deleteById(unidadId)
    res.status(200).json({
      success: true,
      message: 'Unidad eliminada exitosamente'
    })
  } catch (error) {
    next(error)
  }
}

export const getAllUnidades = async (req, res, next) => {
  try {
    const unidades = await Unidad.getAll()
    res.status(200).json({
      success: true,
      data: unidades
    })
  } catch (error) {
    next(error)
  }
}

export const getUnidadById = async (req, res, next) => {
  try {
    const { id: unidadId } = req.params
    const unidad = await Unidad.getById(unidadId)
    res.status(200).json({
      success: true,
      data: unidad
    })
  } catch (error) {
    next(error)
  }
}
