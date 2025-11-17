import { TipoEquipo } from '../models/TipoEquipo.js'

export const getAll = async (req,res) => {
  // Obtener todos los tipos de equipo
  try {
    const tipos = await TipoEquipo.getAll()
    res.status(200).json({
      success: true,
      data: tipos
    })
  } catch (error) {
    console.error('Error al obtener tipos de equipo:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de equipo'
    })
  }
}

// Obtener solo tipos activos
export const getActivos = async (req,res) => {
  try {
    const tipos = await TipoEquipo.getActivos()
    res.status(200).json({
      success: true,
      data: tipos
    })
  } catch (error) {
    console.error('Error al obtener tipos activos:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos activos'
    })
  }
}

// Obtener un tipo por ID
export const getById = async (req, res) => {
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
    console.error('Error al obtener tipo de equipo:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipo de equipo'
    })
  }
}

// Crear un nuevo tipo de equipo
export const createTipoEquipo = async (req, res) => {
  try {
    // Los datos ya están validados y transformados por el middleware de validación
    const { nombre, descripcion } = req.body

    await TipoEquipo.create({
      nombre,
      descripcion
    })

    res.status(201).json({
      success: true,
      message: 'Tipo de equipo creado exitosamente'
    })
  } catch (error) {
    if (error.message.includes('Ya existe')) {
      return res.status(409).json({
        success: false,
        message: error.message
      })
    }

    console.error('Error al crear tipo de equipo:', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear tipo de equipo'
    })
  }
}

// Actualizar un tipo de equipo
export const updateTipoEquipo = async (req, res) => {
  try {
    // El ID y los datos ya están validados y transformados por el middleware de validación
    const { id: tipoId } = req.params
    const { nombre, descripcion } = req.body

    // Verificar que el tipo existe
    const tipoExistente = await TipoEquipo.getById(tipoId)
    if (!tipoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de equipo no encontrado'
      })
    }

    const actualizado = await TipoEquipo.update(tipoId, {
      nombre,
      descripcion
    })

    if (!actualizado) {
      return res.status(404).json({
        success: false,
        message: 'No se pudo actualizar el tipo de equipo'
      })
    }

    const tipoActualizado = await TipoEquipo.getById(tipoId)

    res.status(200).json({
      success: true,
      message: 'Tipo de equipo actualizado exitosamente',
      data: tipoActualizado
    })
  } catch (error) {
    if (error.message.includes('Ya existe')) {
      return res.status(409).json({
        success: false,
        message: error.message
      })
    }

    console.error('Error al actualizar tipo de equipo:', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar tipo de equipo'
    })
  }
}

// Eliminar un tipo de equipo
export const deleteTipoEquipo = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: tipoId } = req.params

    // Verificar que el tipo existe
    const tipoExistente = await TipoEquipo.getById(tipoId)
    if (!tipoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de equipo no encontrado'
      })
    }

    const eliminado = await TipoEquipo.delete(tipoId)

    if (!eliminado) {
      return res.status(404).json({
        success: false,
        message: 'No se pudo eliminar el tipo de equipo'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Tipo de equipo eliminado exitosamente'
    })
  } catch (error) {
    if (error.message.includes('tiene') && error.message.includes('asociado')) {
      return res.status(409).json({
        success: false,
        message: error.message
      })
    }

    // Manejar errores de restricción de clave foránea
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar el tipo porque tiene equipos asociados'
      })
    }

    console.error('Error al eliminar tipo de equipo:', error)
    res.status(500).json({
      success: false,
      message: 'Error al eliminar tipo de equipo'
    })
  }
}

// Contar equipos por tipo
export const getAllWithCountEquipos = async (req, res) => {
  try {
    const tiposWithCount = await TipoEquipo.getAllWithCountEquipos()
    res.status(200).json({
      success: true,
      data: tiposWithCount
    })
  } catch (error) {
    console.error('Error al contar equipos:', error)
    res.status(500).json({
      success: false,
      message: 'Error al contar equipos'
    })
  }
}
