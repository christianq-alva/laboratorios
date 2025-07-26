import { pool } from '../config/database.js'
import { defineAbilitiesFor } from '../abilities/defineAbilities.js'

export const getLaboratorios = async (req, res) => {
    try {
      console.log('🔍 req.user completo:', req.user)
      
      let query, params = []
      
      if (req.user.rol === 'Administrador') {
        // Admin ve todos
        query = 'SELECT * FROM laboratorios'
      } else if (req.user.rol === 'Jefe de Laboratorio') {
        // Jefe ve solo sus laboratorios asignados
        query = `
          SELECT l.* 
          FROM laboratorios l
          JOIN jefe_laboratorio jl ON l.id = jl.laboratorio_id
          WHERE jl.usuario_id = ?
        `
        params = [req.user.userId]
      } else {
        // Otros roles: sin laboratorios
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
      res.status(500).json({ success: false, message: error.message })
    }
  }

export const createLaboratorio = async (req, res) => {
  try {
    const { nombre, ubicacion, escuela_id } = req.body
    
    const [result] = await pool.execute(`
      INSERT INTO laboratorios (nombre, ubicacion, escuela_id) 
      VALUES (?, ?, ?)
    `, [nombre, ubicacion, escuela_id])
    
    res.json({ 
      success: true, 
      message: 'Laboratorio creado',
      id: result.insertId 
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateLaboratorio = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, ubicacion, escuela_id } = req.body
    
    // 🔒 VERIFICACIÓN ADICIONAL: Solo puede editar si es su laboratorio
    if (req.user.rol === 'Jefe de Laboratorio' && req.user.laboratorio_id !== parseInt(id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo puedes editar tu laboratorio' 
      })
    }
    
    await pool.execute(`
      UPDATE laboratorios 
      SET nombre = ?, ubicacion = ?, escuela_id = ? 
      WHERE id = ?
    `, [nombre, ubicacion, escuela_id, id])
    
    res.json({ success: true, message: 'Laboratorio actualizado' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteLaboratorio = async (req, res) => {
  try {
    const { id } = req.params
    
    await pool.execute('DELETE FROM laboratorios WHERE id = ?', [id])
    
    res.json({ success: true, message: 'Laboratorio eliminado' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}