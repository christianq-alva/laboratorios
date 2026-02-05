import { Escuela } from '../models/Escuela.js'

export const getEscuelas = async (req, res, next) => {
  try {
    const escuelas = await Escuela.getAll()
    res.status(200).json({
      success: true,
      data: escuelas
    })
  } catch (error) {
    next(error)
  }
}

export const getEscuelaById = async (req, res, next) => {
  try {
    const { id: escuelaId } = req.params
    const escuela = await Escuela.getById(escuelaId)
    res.status(200).json({
      success: true,
      data: escuela
    })
  } catch (error) {
    next(error)
  }
}

export const createEscuela = async (req, res, next) => {
  try {
    const { nombre } = req.body
    await Escuela.create(nombre)
    res.status(201).json({
      success: true,
      message: 'Escuela creada exitosamente'
    })
  } catch (error) {
    next(error)
  }
}

export const updateEscuela = async (req, res, next) => {
  try {
    const { id: escuelaId } = req.params
    const { nombre } = req.body
    await Escuela.update(escuelaId, nombre)
    res.status(200).json({
      success: true,
      message: 'Escuela actualizada exitosamente'
    })
  } catch (error) {
    next(error)
  }
}

export const deleteEscuela = async (req, res, next) => {
  try {
    const { id: escuelaId } = req.params
    await Escuela.delete(escuelaId)
    res.status(200).json({
      success: true,
      message: 'Escuela eliminada exitosamente'
    })
  } catch (error) {
    next(error)
  }
}
