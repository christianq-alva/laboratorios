import { DepreciacionCategoria } from '../models/DepreciacionCategoria.js'

export const getAll = async (req, res, next) => {
  try {
    const categorias = await DepreciacionCategoria.getAll()
    res.status(200).json({
      success: true,
      data: categorias
    })
  } catch (error) {
    next(error)
  }
}

export const getActivas = async (req, res, next) => {
  try {
    const categorias = await DepreciacionCategoria.getActivas()
    res.status(200).json({
      success: true,
      data: categorias
    })
  } catch (error) {
    next(error)
  }
}

export const getAllWithCount = async (req, res, next) => {
  try {
    const categorias = await DepreciacionCategoria.getAllWithCount()
    res.status(200).json({
      success: true,
      data: categorias
    })
  } catch (error) {
    next(error)
  }
}

export const getById = async (req, res, next) => {
  try {
    const { id: categoriaId } = req.params
    const categoria = await DepreciacionCategoria.getById(categoriaId)
    res.status(200).json({
      success: true,
      data: categoria
    })
  } catch (error) {
    next(error)
  }
}

export const createDepreciacionCategoria = async (req, res, next) => {
  try {
    const { nombre, porcentaje, descripcion, activo } = req.body
    await DepreciacionCategoria.create({ nombre, porcentaje, descripcion, activo })
    res.status(201).json({
      success: true,
      message: 'Categoría de depreciación creada exitosamente'
    })
  } catch (error) {
    next(error)
  }
}

export const updateDepreciacionCategoria = async (req, res, next) => {
  try {
    const { id: categoriaId } = req.params
    const { nombre, porcentaje, descripcion, activo } = req.body
    await DepreciacionCategoria.update(categoriaId, { nombre, porcentaje, descripcion, activo })
    const categoriaActualizada = await DepreciacionCategoria.getById(categoriaId)
    res.status(200).json({
      success: true,
      message: 'Categoría de depreciación actualizada exitosamente',
      data: categoriaActualizada
    })
  } catch (error) {
    next(error)
  }
}

export const deleteDepreciacionCategoria = async (req, res, next) => {
  try {
    const { id: categoriaId } = req.params
    await DepreciacionCategoria.delete(categoriaId)
    res.status(200).json({
      success: true,
      message: 'Categoría de depreciación eliminada exitosamente'
    })
  } catch (error) {
    next(error)
  }
}
