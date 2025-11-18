import { pool } from '../config/database.js'
import { Unidad } from '../models/Unidad.js'

// Crear unidad
export const createUnidad = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    
    // Los datos ya están validados y transformados por el middleware de validación
    const { simbolo, nombre, descripcion } = req.body

    // Verificar si ya existe una unidad con el mismo símbolo
    const existeSimbolo = await Unidad.existsBySimbolo(simbolo, null, connection)
    if (existeSimbolo) {
      await connection.rollback()
      return res.status(409).json({
        success: false,
        message: 'Ya existe una unidad con ese símbolo'
      })
    }

    // Verificar si ya existe una unidad con el mismo nombre
    const existeNombre = await Unidad.existsByNombre(nombre, null, connection)
    if (existeNombre) {
      await connection.rollback()
      return res.status(409).json({
        success: false,
        message: 'Ya existe una unidad con ese nombre'
      })
    }

    const unidadId = await Unidad.create({
      simbolo,
      nombre,
      descripcion
    }, connection)

    await connection.commit()

    const unidadCreada = await Unidad.getById(unidadId)

    res.status(201).json({
      success: true,
      message: 'Unidad creada exitosamente'
    })
  } catch (error) {
    await connection.rollback()
    console.error('Error al crear unidad:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  } finally {
    connection.release()
  }
}

// Actualizar unidad
export const updateUnidad = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    
    // El ID ya está validado y transformado por el middleware de validación
    const { id: unidadId } = req.params
    const { simbolo, nombre, descripcion } = req.body

    // Verificar que la unidad existe
    const exists = await Unidad.existsById(unidadId, connection)
    if (!exists) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'Unidad no encontrada'
      })
    }

    // Verificar si ya existe otra unidad con el mismo símbolo
    const existeSimbolo = await Unidad.existsBySimbolo(simbolo, unidadId, connection)
    if (existeSimbolo) {
      await connection.rollback()
      return res.status(409).json({
        success: false,
        message: 'Ya existe otra unidad con ese símbolo'
      })
    }

    // Verificar si ya existe otra unidad con el mismo nombre
    const existeNombre = await Unidad.existsByNombre(nombre, unidadId, connection)
    if (existeNombre) {
      await connection.rollback()
      return res.status(409).json({
        success: false,
        message: 'Ya existe otra unidad con ese nombre'
      })
    }

    // Actualizar unidad
    const { affectedRows } = await Unidad.updateById(unidadId, {
      simbolo,
      nombre,
      descripcion
    }, connection)

    if (affectedRows === 0) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'Unidad no encontrada'
      })
    }

    await connection.commit()

    const unidadActualizada = await Unidad.getById(unidadId)

    res.status(200).json({
      success: true,
      message: 'Unidad actualizada exitosamente'
    })
  } catch (error) {
    await connection.rollback()
    console.error('Error al actualizar unidad:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  } finally {
    connection.release()
  }
}

// Eliminar unidad
export const deleteUnidad = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    
    // El ID ya está validado y transformado por el middleware de validación
    const { id: unidadId } = req.params

    // Verificar que la unidad existe
    const unidad = await Unidad.getById(unidadId, connection)
    if (!unidad) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'Unidad no encontrada'
      })
    }

    // Verificar relaciones antes de eliminar (validación de negocio)
    const relations = await Unidad.checkRelations(unidadId, connection)
    if (relations.total > 0) {
      const relaciones = []
      if (relations.insumos > 0) {
        relaciones.push(`Tiene ${relations.insumos} insumo(s) asociado(s)`)
      }
      await connection.rollback()
      return res.status(409).json({
        success: false,
        message: `No se puede eliminar. La unidad "${unidad.nombre}" está siendo usada en el sistema: ${relaciones.join(', ')}.`
      })
    }

    // Eliminar unidad
    const { affectedRows } = await Unidad.deleteById(unidadId, connection)
    if (affectedRows === 0) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'Unidad no encontrada'
      })
    }

    await connection.commit()
    res.status(200).json({
      success: true,
      message: 'Unidad eliminada exitosamente'
    })
  } catch (error) {
    await connection.rollback()
    // Manejar errores de restricción de clave foránea
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar. La unidad está siendo usada en el sistema.'
      })
    }
    console.error('Error al eliminar unidad:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  } finally {
    connection.release()
  }
}

// Obtener todas las unidades
export const getAllUnidades = async (req, res) => {
  try {
    const unidades = await Unidad.getAll()
    res.status(200).json({
      success: true,
      data: unidades
    })
  } catch (error) {
    console.error('Error al obtener unidades:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// Obtener unidad por ID
export const getUnidadById = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: unidadId } = req.params

    const unidad = await Unidad.getById(unidadId)

    if (!unidad) {
      return res.status(404).json({
        success: false,
        message: 'Unidad no encontrada'
      })
    }

    res.status(200).json({
      success: true,
      data: unidad
    })
  } catch (error) {
    console.error('Error al obtener unidad:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

