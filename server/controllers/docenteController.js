import { pool } from '../config/database.js'
import { Docente } from '../models/Docente.js'

export const getDocentes = async (req, res) => {
  try {
    console.log('🔍 Usuario solicitando docentes:', req.user.usuario, req.user.rol)
    
    const docentes = await Docente.getByUser(req.user)
    
    res.json({ 
      success: true, 
      data: docentes,
      user_role: req.user.rol,
      total: docentes.length
    })
  } catch (error) {
    console.error('Error en getDocentes:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getDocente = async (req, res) => {
  try {
    const { id } = req.params
    
    console.log('🔍 Buscando docente ID:', id)
    
    const docente = await Docente.getById(id)
    
    if (!docente) {
      return res.status(404).json({ 
        success: false, 
        message: 'Docente no encontrado' 
      })
    }
    
    res.json({ 
      success: true, 
      data: docente 
    })
  } catch (error) {
    console.error('Error en getDocente:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const createDocente = async (req, res) => {
  try {
    const { nombre, correo, escuela_id } = req.body
    
    console.log('🔍 Creando docente:', { nombre, correo, usuario: req.user.usuario })
    
    // Validaciones básicas
    if (!nombre || !correo) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y correo son requeridos'
      })
    }
    
    // Verificar si el correo ya existe
    const [existing] = await pool.execute('SELECT id FROM docentes WHERE correo = ?', [correo])
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un docente con ese correo'
      })
    }
    
    // Crear el docente
    const docente_id = await Docente.create({
      nombre, 
      correo, 
      escuela_id
    })
    
    console.log('✅ Docente creado con ID:', docente_id)
    
    res.json({ 
      success: true, 
      message: 'Docente creado correctamente',
      docente_id: docente_id
    })
  } catch (error) {
    console.error('Error en createDocente:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateDocente = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, correo, escuela_id } = req.body
    
    console.log('🔍 Actualizando docente ID:', id)
    
    // Verificar que el docente existe
    const docente = await Docente.getById(id)
    if (!docente) {
      return res.status(404).json({
        success: false,
        message: 'Docente no encontrado'
      })
    }
    
    // Verificar si el correo ya existe (excluyendo el propio docente)
    const [existing] = await pool.execute('SELECT id FROM docentes WHERE correo = ? AND id != ?', [correo, id])
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe otro docente con ese correo'
      })
    }
    
    // Actualizar el docente
    await Docente.update(id, {
      nombre, 
      correo, 
      escuela_id
    })
    
    console.log('✅ Docente actualizado ID:', id)
    
    res.json({ 
      success: true, 
      message: 'Docente actualizado correctamente'
    })
  } catch (error) {
    console.error('Error en updateDocente:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteDocente = async (req, res) => {
  try {
    const { id } = req.params
    
    console.log('🔍 Eliminando docente ID:', id)
    
    // Verificar que el docente existe
    const docente = await Docente.getById(id)
    if (!docente) {
      return res.status(404).json({
        success: false,
        message: 'Docente no encontrado'
      })
    }
    
    // Verificar que no tenga horarios asignados
    const hasSchedules = await Docente.hasActiveSchedules(id)
    if (hasSchedules) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar: el docente tiene horarios programados'
      })
    }
    
    // Eliminar el docente
    await Docente.delete(id)
    
    console.log('✅ Docente eliminado ID:', id)
    
    res.json({ 
      success: true, 
      message: 'Docente eliminado correctamente'
    })
  } catch (error) {
    console.error('Error en deleteDocente:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getDocenteHorarios = async (req, res) => {
  try {
    const { id } = req.params
    
    console.log('🔍 Obteniendo horarios del docente ID:', id)
    
    // Verificar que el docente existe
    const docente = await Docente.getById(id)
    if (!docente) {
      return res.status(404).json({
        success: false,
        message: 'Docente no encontrado'
      })
    }
    
    // Obtener horarios según permisos del usuario
    const horarios = await Docente.getHorarios(id, req.user)
    
    res.json({ 
      success: true, 
      data: {
        docente: {
          id: docente.id,
          nombre: docente.nombre,
          correo: docente.correo
        },
        horarios: horarios,
        total_horarios: horarios.length
      }
    })
  } catch (error) {
    console.error('Error en getDocenteHorarios:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Obtener escuelas disponibles para el selector
export const getEscuelas = async (req, res) => {
  try {
    const [escuelas] = await pool.execute('SELECT id, nombre FROM escuelas ORDER BY nombre')
    
    res.json({ 
      success: true, 
      data: escuelas
    })
  } catch (error) {
    console.error('Error en getEscuelas:', error)
    res.status(500).json({ success: false, message: error.message })
  }
} 