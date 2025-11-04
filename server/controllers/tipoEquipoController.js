import { TipoEquipo } from '../models/TipoEquipo.js'
import moment from 'moment-timezone'

const TIMEZONE = 'America/Lima'

export const getAll = async (req, res) => {
  // Obtener todos los tipos de equipo

  try {
    const tipos = await TipoEquipo.getAll()

    res.status(200).json({
      success: true,
      data: tipos
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de equipo'
    })
  }
}

// Obtener solo tipos activos
export const getActivos = async (req, res) => {
  try {
    const tipos = await TipoEquipo.getActivos()

    res.status(200).json({
      success: true,
      data: tipos
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos activos'
    })
  }
}

// Obtener un tipo por ID
export const getById = async (req, res) => {
  try {
    const { id } = req.params
    const tipoId = parseInt(id, 10)

    // Validar ID
    if (isNaN(tipoId) || tipoId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de tipo de equipo inválido'
      })
    }

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
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipo de equipo'
    })
  }
}

// Crear un nuevo tipo de equipo
export const createTipoEquipo = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body

    // Validaciones
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre es obligatorio'
      })
    }

    if (nombre.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'El nombre no puede exceder 100 caracteres'
      })
    }

    if (descripcion && descripcion.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'La descripción no puede exceder 255 caracteres'
      })
    }

    const tipoId = await TipoEquipo.create({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null
    })

    const nuevoTipo = await TipoEquipo.getById(tipoId)

    res.status(201).json({
      success: true,
      message: 'Tipo de equipo creado exitosamente',
      data: nuevoTipo
    })
  } catch (error) {
    if (error.message.includes('Ya existe')) {
      return res.status(409).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear tipo de equipo'
    })
  }
}

// Actualizar un tipo de equipo
export const updateTipoEquipo = async (req, res) => {
  try {
    const { id } = req.params
    const tipoId = parseInt(id, 10)
    const { nombre, descripcion } = req.body

    // Validar ID
    if (isNaN(tipoId) || tipoId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de tipo de equipo inválido'
      })
    }

    // Verificar que el tipo existe
    const tipoExistente = await TipoEquipo.getById(tipoId)
    if (!tipoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de equipo no encontrado'
      })
    }

    // Validaciones
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre es obligatorio'
      })
    }

    if (nombre.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'El nombre no puede exceder 100 caracteres'
      })
    }

    if (descripcion && descripcion.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'La descripción no puede exceder 255 caracteres'
      })
    }

    const actualizado = await TipoEquipo.update(tipoId, {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null
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

    res.status(500).json({
      success: false,
      message: 'Error al actualizar tipo de equipo'
    })
  }
}

// Eliminar un tipo de equipo
export const deleteTipoEquipo = async (req, res) => {
  try {
    const { id } = req.params
    const tipoId = parseInt(id, 10)

    // Validar ID
    if (isNaN(tipoId) || tipoId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de tipo de equipo inválido'
      })
    }

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
    res.status(500).json({
      success: false,
      message: 'Error al contar equipos'
    })
  }
}

