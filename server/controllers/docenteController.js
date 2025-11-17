import { Docente } from '../models/Docente.js'
// Obtener todos los docentes
export const getDocentes = async (req, res) => {
  try {
    const docentes = await Docente.getAll()
    res.status(200).json({
      success: true,
      data: docentes
    })
  } catch (error) {
    console.error('Error en getDocentes:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener docentes'
    })
  }
}
// Obtener docente por ID
export const getDocente = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: docenteId } = req.params
    const docente = await Docente.getById(docenteId)
    if (!docente) {
      return res.status(404).json({
        success: false,
        message: 'Docente no encontrado'
      })
    }
    res.status(200).json({
      success: true,
      data: docente
    })
  } catch (error) {
    console.error('Error en getDocente:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener docente'
    })
  }
}
// Crear docente
export const createDocente = async (req, res) => {
  try {
    // Los datos ya están validados y transformados por el middleware de validación
    const { nombre, correo, escuela_id } = req.body

    // Verificar si el correo ya existe (validación de negocio)
    if (correo) {
      const existByEmail = await Docente.existsByEmail(correo)
      if (existByEmail) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un docente con ese correo'
        })
      }
    }

    // Crear el docente
    await Docente.create({ nombre, correo, escuela_id })
    res.status(201).json({
      success: true,
      message: 'Docente creado correctamente'
    })
  } catch (error) {
    console.error('Error en createDocente:', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear docente'
    })
  }
}
// Actualizar docente
export const updateDocente = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: docenteId } = req.params
    const { nombre, correo, escuela_id } = req.body

    // Verificar que el docente existe
    const existById = await Docente.existsById(docenteId)
    if (!existById) {
      return res.status(404).json({
        success: false,
        message: 'Docente no encontrado'
      })
    }

    // Obtener el docente actual para usar sus valores si no se proporcionan nuevos
    const docenteActual = await Docente.getById(docenteId)
    const nombreFinal = nombre !== undefined ? nombre : docenteActual.nombre

    // Verificar si el correo ya existe (validación de negocio)
    if (correo !== undefined && correo !== null) {
      const existByEmail = await Docente.existsByEmail(correo, docenteId)
      if (existByEmail) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro docente con ese correo'
        })
      }
    }

    // Actualizar el docente
    await Docente.update(docenteId, { nombre: nombreFinal, correo, escuela_id })
    res.status(200).json({
      success: true,
      message: 'Docente actualizado correctamente'
    })
  } catch (error) {
    console.error('Error en updateDocente:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}
// Eliminar docente
export const deleteDocente = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: docenteId } = req.params

    // Verificar que el docente existe
    const existById = await Docente.existsById(docenteId)
    if (!existById) {
      return res.status(404).json({
        success: false,
        message: 'Docente no encontrado'
      })
    }

    // Verificar que no tenga horarios asignados (validación de negocio)
    const hasSchedules = await Docente.hasActiveSchedules(docenteId)
    if (hasSchedules) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar. El docente tiene horarios programados'
      })
    }

    // Eliminar el docente
    await Docente.delete(docenteId)
    res.status(200).json({
      success: true,
      message: 'Docente eliminado correctamente'
    })
  } catch (error) {
    console.error('Error en deleteDocente:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}