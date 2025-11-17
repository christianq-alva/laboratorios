import { Escuela } from '../models/Escuela.js'
// Obtener todas las escuelas
export const getEscuelas = async (req, res) => {
  try {
    const escuelas = await Escuela.getAll()
    res.status(200).json({
      success: true,
      data: escuelas
    })
  } catch (error) {
    console.error('Error al obtener escuelas:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener escuelas'
    })
  }
}
// Obtener una escuela por ID
export const getEscuelaById = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: escuelaId } = req.params
    const escuela = await Escuela.getById(escuelaId)
    if (!escuela) {
      return res.status(404).json({
        success: false,
        message: 'Escuela no encontrada'
      })
    }
    res.status(200).json({
      success: true,
      data: escuela
    })
  } catch (error) {
    console.error('Error al obtener la escuela:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener la escuela'
    })
  }
}
// Crear nueva escuela
export const createEscuela = async (req, res) => {
  try {
    // Los datos ya están validados y transformados por el middleware de validación
    const { nombre } = req.body

    // Verificar si ya existe una escuela con ese nombre (validación de negocio)
    const existingEscuela = await Escuela.existsByName(nombre)
    if (existingEscuela) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una escuela con ese nombre'
      })
    }

    // Insertar escuela
    const insertId = await Escuela.create(nombre)
    res.status(201).json({
      success: true,
      message: 'Escuela creada exitosamente'
    })
  } catch (error) {
    console.error('Error al crear la escuela:', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear la escuela'
    })
  }
}
// Actualizar escuela
export const updateEscuela = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: escuelaId } = req.params
    const { nombre } = req.body

    // Verificar que la escuela existe
    const escuelaCheck = await Escuela.exists(escuelaId)
    if (!escuelaCheck) {
      return res.status(404).json({
        success: false,
        message: 'Escuela no encontrada'
      })
    }

    // Verificar si ya existe otra escuela con ese nombre (validación de negocio)
    const existingEscuela = await Escuela.existsByNameExcludingId(nombre, escuelaId)
    if (existingEscuela) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe otra escuela con ese nombre'
      })
    }

    // Actualizar escuela
    const affectedRows = await Escuela.update(escuelaId, nombre)
    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Escuela no encontrada'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Escuela actualizada exitosamente'
    })
  } catch (error) {
    console.error('Error al actualizar la escuela:', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la escuela'
    })
  }
}
// Eliminar escuela
export const deleteEscuela = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: escuelaId } = req.params

    // Verificar que la escuela existe
    const escuelaCheck = await Escuela.exists(escuelaId)
    if (!escuelaCheck) {
      return res.status(404).json({
        success: false,
        message: 'Escuela no encontrada'
      })
    }

    // Verificar si tiene relaciones antes de eliminar (validación de negocio)
    const relations = await Escuela.checkRelations(escuelaId)
    if (relations.total > 0) {
      const relaciones = []
      if (relations.docentes > 0) {
        relaciones.push(`${relations.docentes} docente(s)`)
      }
      // Obtener nombre para el mensaje
      const escuela = await Escuela.getById(escuelaId)
      return res.status(409).json({
        success: false,
        message: `No se puede eliminar. La escuela "${escuela.nombre}" está siendo usada en el sistema: ${relaciones.join(', ')}.`
      })
    }

    // Si no tiene relaciones, proceder con la eliminación
    const affectedRows = await Escuela.delete(escuelaId)
    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Escuela no encontrada'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Escuela eliminada exitosamente'
    })
  } catch (error) {
    // Manejar errores de restricción de clave foránea
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar. La escuela está siendo usada en el sistema.'
      })
    }
    console.error('Error al eliminar la escuela:', error)
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la escuela'
    })
  }
}
