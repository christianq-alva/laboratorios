import { pool } from '../config/database.js'
import { defineAbilitiesFor } from '../abilities/defineAbilities.js'

export const getLaboratorios = async (req, res) => {
  try {
    let query, params = []

    if (req.user.rol === 'Administrador') {
      query = `
        SELECT l.*, e.nombre as escuela 
        FROM laboratorios l
        LEFT JOIN escuelas e ON l.escuela_id = e.id
        ORDER BY l.nombre
      `
    } else if (req.user.rol === 'Jefe de Laboratorio') {
      query = `
        SELECT l.*, e.nombre as escuela  
        FROM laboratorios l
        LEFT JOIN escuelas e ON l.escuela_id = e.id
        JOIN jefe_laboratorio jl ON l.id = jl.laboratorio_id
        WHERE jl.usuario_id = ?
        ORDER BY l.nombre
      `
      params = [req.user.userId]
    } else {
      query = 'SELECT * FROM laboratorios WHERE 1=0'
    }

    const [laboratorios] = await pool.execute(query, params)

    res.json({
      success: true,
      data: laboratorios,
      user_role: req.user.rol,
      cantidad_laboratorios: laboratorios.length
    })

  } catch (error) {
    console.error('Error en getLaboratorios:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const createLaboratorio = async (req, res) => {
  try {
    const { nombre, ubicacion, escuela_id, piso } = req.body

    // Validar que la escuela existe
    const [escuelaCheck] = await pool.execute(
      'SELECT id, nombre FROM escuelas WHERE id = ?', 
      [escuela_id]
    )
    
    if (escuelaCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La escuela seleccionada no existe'
      })
    }

    // Insertar laboratorio
    const [result] = await pool.execute(`
      INSERT INTO laboratorios (nombre, ubicacion, escuela_id, piso) 
      VALUES (?, ?, ?, ?)
    `, [nombre, ubicacion, escuela_id, piso])

    console.log('✅ Laboratorio creado con ID:', result.insertId)

    res.json({
      success: true,
      data: {
        id: result.insertId,
        nombre,
        ubicacion,
        escuela_id,
        piso,
        escuela: escuelaCheck[0].nombre
      },
      message: 'Laboratorio creado correctamente'
    })

  } catch (error) {
    console.error('Error en createLaboratorio:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const updateLaboratorio = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, ubicacion, escuela_id, piso } = req.body

    // Verificar que el laboratorio existe
    const [labCheck] = await pool.execute(
      'SELECT * FROM laboratorios WHERE id = ?', 
      [id]
    )
    
    if (labCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    // Validar que la escuela existe
    const [escuelaCheck] = await pool.execute(
      'SELECT id, nombre FROM escuelas WHERE id = ?', 
      [escuela_id]
    )
    
    if (escuelaCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La escuela seleccionada no existe'
      })
    }

    // Verificar permisos para Jefe de Laboratorio
    if (req.user.rol === 'Jefe de Laboratorio') {
      if (!req.user.laboratorio_ids.includes(parseInt(id))) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para editar este laboratorio'
        })
      }
    }

    // Actualizar laboratorio
    const [result] = await pool.execute(`
      UPDATE laboratorios 
      SET nombre = ?, ubicacion = ?, escuela_id = ?, piso = ?
      WHERE id = ?
    `, [nombre, ubicacion, escuela_id, piso, id])

    console.log('✅ Laboratorio actualizado:', id)

    res.json({
      success: true,
      data: {
        id: parseInt(id),
        nombre,
        ubicacion,
        escuela_id,
        piso,
        escuela: escuelaCheck[0].nombre
      },
      message: 'Laboratorio actualizado correctamente'
    })

  } catch (error) {
    console.error('Error en updateLaboratorio:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const deleteLaboratorio = async (req, res) => {
  try {
    const { id } = req.params

    // Verificar que el laboratorio existe
    const [labCheck] = await pool.execute(
      'SELECT * FROM laboratorios WHERE id = ?', 
      [id]
    )
    
    if (labCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    // Verificar permisos para Jefe de Laboratorio
    if (req.user.rol === 'Jefe de Laboratorio') {
      if (!req.user.laboratorio_ids.includes(parseInt(id))) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar este laboratorio'
        })
      }
    }

    // TODO: Verificar si tiene reservas activas antes de eliminar
    const [result] = await pool.execute('DELETE FROM laboratorios WHERE id = ?', [id])

    console.log('✅ Laboratorio eliminado:', id)

    res.json({
      success: true,
      message: 'Laboratorio eliminado correctamente'
    })

  } catch (error) {
    console.error('Error en deleteLaboratorio:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}