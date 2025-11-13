import { Docente } from '../models/Docente.js'
// Obtener todos los docentes
export const getDocentes = async (req, res) => {
  try {
    const docentes = await Docente.getAll()
    res.status(200).json({
      data: docentes,
    })
  } catch (error) {
    console.error('Error en getDocentes:', error)
    res.status(500).json({
      message: error.message
    })
  }
}
// Obtener docente por ID
export const getDocente = async (req, res) => {
  try {
    const { id } = req.params
    const docente = await Docente.getById(id)
    if (!docente) {
      return res.status(404).json({
        message: 'Docente no encontrado'
      })
    }
    res.status(200).json({
      data: docente
    })
  } catch (error) {
    console.error('Error en getDocente:', error)
    res.status(500).json({
      message: error.message
    })
  }
}
// Crear docente
export const createDocente = async (req, res) => {
  try {
    const { nombre, correo, escuela_id } = req.body
    // Validaciones básicas
    if (!nombre) {
      return res.status(400).json({
        message: 'El nombre es requerido'
      })
    }
    // Verificar si el correo ya existe (solo si se proporciona)
    if (correo && correo.trim()) {
      const existByEmail = await Docente.existsByEmail(correo)
      if (existByEmail) {
        return res.status(400).json({
          message: 'Ya existe un docente con ese correo'
        })
      }
    }
    // Crear el docente
    const docente_id = await Docente.create({ nombre, correo, escuela_id })
    res.status(201).json({
      message: 'Docente creado correctamente'
    })
  } catch (error) {
    console.error('Error en createDocente:', error)
    res.status(500).json({ message: error.message })
  }
}
// Actualizar docente
export const updateDocente = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, correo, escuela_id } = req.body
    // Verificar que el docente existe
    const existById = await Docente.existsById(id)
    if (!existById) {
      return res.status(404).json({
        message: 'Docente no encontrado'
      })
    }
    // Verificar si el correo ya existe (solo si se proporciona y excluyendo el propio docente)
    if (correo && correo.trim()) {
      const existByEmail = await Docente.existsByEmail(correo, parseInt(id))
      if (existByEmail) {
        return res.status(400).json({
          message: 'Ya existe otro docente con ese correo'
        })
      }
    }
    // Actualizar el docente
    await Docente.update(id, { nombre, correo, escuela_id })
    res.status(200).json({
      message: 'Docente actualizado correctamente'
    })
  } catch (error) {
    console.error('Error en updateDocente:', error)
    res.status(500).json({
      message: 'Error interno del servidor'
    })
  }
}
// Eliminar docente
export const deleteDocente = async (req, res) => {
  try {
    const { id } = req.params
    // Verificar que el docente existe
    const existById = await Docente.existsById(id)
    if (!existById) {
      return res.status(404).json({
        message: 'Docente no encontrado'
      })
    }
    // Verificar que no tenga horarios asignados
    const hasSchedules = await Docente.hasActiveSchedules(id)
    if (hasSchedules) {
      return res.status(400).json({
        message: 'No se puede eliminar. El docente tiene horarios programados'
      })
    }
    // Eliminar el docente
    await Docente.delete(id)
    res.status(200).json({
      message: 'Docente eliminado correctamente'
    })
  } catch (error) {
    console.error('Error en deleteDocente:', error)
    res.status(500).json({
      message: 'Error interno del servidor'
    })
  }
}