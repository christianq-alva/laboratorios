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
    res.status(500).json({
      success: false,
      message: 'Error al obtener escuelas',
      error: error.message
    })
  }
}

// Obtener una escuela por ID
export const getEscuelaById = async (req, res) => {
  try {
    const { id } = req.params
    const idNum = parseInt(id, 10)

    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      })
    }

    const escuela = await Escuela.getById(idNum)

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
    res.status(500).json({
      success: false,
      message: 'Error al obtener la escuela',
      error: error.message
    })
  }
}

// Crear nueva escuela
export const createEscuela = async (req, res) => {
  try {
    const { nombre } = req.body

    // Validaciones
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la escuela es requerido'
      })
    }

    // Verificar si ya existe una escuela con ese nombre
    const existingEscuela = await Escuela.existsByName(nombre.trim())

    if (existingEscuela) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una escuela con ese nombre'
      })
    }

    // Insertar escuela
    const insertId = await Escuela.create(nombre.trim())


    res.status(201).json({
      success: true,
      data: {
        id: insertId,
        nombre: nombre.trim()
      },
      message: 'Escuela creada exitosamente'
    })
  } catch (error) {
    console.error('❌ Error al crear la escuela:', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear la escuela',
      error: error.message
    })
  }
}

// Actualizar escuela
export const updateEscuela = async (req, res) => {
  try {
    const { id } = req.params
    const idNum = parseInt(id, 10)
    const { nombre } = req.body

    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      })
    }

    // Verificar que la escuela existe
    const escuelaCheck = await Escuela.exists(idNum)

    if (!escuelaCheck) {
      return res.status(404).json({
        success: false,
        message: 'Escuela no encontrada'
      })
    }

    // Validaciones
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la escuela es requerido'
      })
    }

    // Verificar si ya existe otra escuela con ese nombre
    const existingEscuela = await Escuela.existsByNameExcludingId(nombre.trim(), idNum)

    if (existingEscuela) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe otra escuela con ese nombre'
      })
    }

    // Actualizar escuela
    const affectedRows = await Escuela.update(idNum, { nombre: nombre.trim(), descripcion: null, codigo: null })

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Escuela no encontrada'
      })
    }

    res.status(200).json({
      success: true,
      data: {
        id: idNum,
        nombre: nombre.trim()
      },
      message: 'Escuela actualizada exitosamente'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la escuela',
      error: error.message
    })
  }
}

// Eliminar escuela
export const deleteEscuela = async (req, res) => {
  try {
    const { id } = req.params
    const idNum = parseInt(id, 10)

    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      })
    }

    // Verificar que la escuela existe
    const escuelaCheck = await Escuela.exists(idNum)

    if (!escuelaCheck) {
      return res.status(404).json({
        success: false,
        message: 'Escuela no encontrada'
      })
    }

    // Verificar si tiene relaciones antes de eliminar
    const relations = await Escuela.checkRelations(idNum)

    if (relations.total > 0) {
      const relaciones = []
      if (relations.docentes > 0) {
        relaciones.push(`${relations.docentes} docente(s)`)
      }

      // Obtener nombre para el mensaje
      const escuela = await Escuela.getById(idNum)
      return res.status(409).json({
        success: false,
        message: `No se puede eliminar. La escuela "${escuela.nombre}" está siendo usada en el sistema: ${relaciones.join(', ')}.`
      })
    }

    // Si no tiene relaciones, proceder con la eliminación
    const affectedRows = await Escuela.delete(idNum)

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
        message: 'No se puede eliminar la escuela porque está relacionada con otras tablas del sistema y tiene datos asociados (laboratorios, docentes u otros registros). Primero debes eliminar o reasignar estos registros para poder eliminar la escuela.'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Error al eliminar la escuela',
      error: error.message
    })
  }
}

