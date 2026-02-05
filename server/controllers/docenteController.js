import { Docente } from '../models/Docente.js'

export const getDocentes = async (req, res, next) => {
  try {
    const docentes = await Docente.getAll()
    res.status(200).json({
      success: true,
      data: docentes
    })
  } catch (error) {
    next(error)
  }
}

export const getDocente = async (req, res, next) => {
  try {
    const { id: docenteId } = req.params
    const docente = await Docente.getById(docenteId)
    res.status(200).json({
      success: true,
      data: docente
    })
  } catch (error) {
    next(error)
  }
}

export const createDocente = async (req, res, next) => {
  try {
    const { nombre, correo, escuela_id } = req.body
    await Docente.create({ nombre, correo, escuela_id })
    res.status(201).json({
      success: true,
      message: 'Docente creado correctamente'
    })
  } catch (error) {
    next(error)
  }
}

export const updateDocente = async (req, res, next) => {
  try {
    const { id: docenteId } = req.params
    const { nombre, correo, escuela_id } = req.body
    const docenteActual = await Docente.getById(docenteId)
    const nombreFinal = nombre !== undefined ? nombre : docenteActual.nombre
    await Docente.update(docenteId, { nombre: nombreFinal, correo, escuela_id })
    res.status(200).json({
      success: true,
      message: 'Docente actualizado correctamente'
    })
  } catch (error) {
    next(error)
  }
}

export const deleteDocente = async (req, res, next) => {
  try {
    const { id: docenteId } = req.params
    await Docente.delete(docenteId)
    res.status(200).json({
      success: true,
      message: 'Docente eliminado correctamente'
    })
  } catch (error) {
    next(error)
  }
}
