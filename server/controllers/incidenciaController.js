import { pool } from '../config/database.js'
import { Incidencia } from '../models/Incidencia.js'

export const getIncidencias = async (req, res) => {
  try {
    console.log('🔍 Usuario solicitando incidencias:', req.user.usuario, req.user.rol)
    
    const incidencias = await Incidencia.getByUser(req.user)
    
    res.json({ 
      success: true, 
      data: incidencias,
      user_role: req.user.rol,
      total: incidencias.length
    })
  } catch (error) {
    console.error('Error en getIncidencias:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getIncidencia = async (req, res) => {
  try {
    const { id } = req.params
    
    console.log('🔍 Buscando incidencia ID:', id, 'para usuario:', req.user.usuario)
    
    const incidencia = await Incidencia.getById(id, req.user)
    
    if (!incidencia) {
      return res.status(404).json({ 
        success: false, 
        message: 'Incidencia no encontrada o sin permisos para verla' 
      })
    }
    
    res.json({ 
      success: true, 
      data: incidencia 
    })
  } catch (error) {
    console.error('Error en getIncidencia:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const createIncidencia = async (req, res) => {
  try {
    const { reserva_id, titulo, descripcion } = req.body
    
    console.log('🔍 Creando incidencia:', { reserva_id, titulo, usuario: req.user.usuario })
    
    // Verificar que puede crear incidencia para esta reserva
    const canCreate = await Incidencia.canCreateForReserva(reserva_id, req.user)
    
    if (!canCreate) {
      return res.status(403).json({
        success: false,
        message: 'No puedes crear incidencias para esta reserva'
      })
    }
    
    // Crear la incidencia
    const incidencia_id = await Incidencia.create(
      { reserva_id, titulo, descripcion }, 
      req.user.userId
    )
    
    console.log('✅ Incidencia creada con ID:', incidencia_id)
    
    res.json({ 
      success: true, 
      message: 'Incidencia creada correctamente',
      incidencia_id: incidencia_id
    })
  } catch (error) {
    console.error('Error en createIncidencia:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Obtener horarios disponibles para reportar incidencias
export const getHorariosParaIncidencias = async (req, res) => {
  try {
    let query = `
      SELECT 
        r.id,
        DATE_FORMAT(r.fecha_inicio, '%d/%m/%Y %H:%i') as fecha_clase,
        DATE_FORMAT(r.fecha_fin, '%H:%i') as hora_fin,
        l.nombre as laboratorio,
        d.nombre as docente,
        r.cantidad_alumnos
      FROM reservas r
      JOIN laboratorios l ON r.laboratorio_id = l.id
      JOIN docentes d ON r.docente_id = d.id
      WHERE r.fecha_fin < NOW()  -- Solo horarios ya ejecutados
    `
    let params = []
    
    // 🟡 JEFE DE LAB: Solo horarios de SUS laboratorios
    if (req.user.rol === 'Jefe de Laboratorio') {
      const labIds = req.user.laboratorio_ids || []
      if (labIds.length > 0) {
        const placeholders = labIds.map(() => '?').join(',')
        query += ` AND r.laboratorio_id IN (${placeholders})`
        params = labIds
      } else {
        query += ' AND 1 = 0' // No mostrar nada
      }
    }
    
    query += ' ORDER BY r.fecha_inicio DESC LIMIT 20' // Solo últimos 20 horarios
    
    const [horarios] = await pool.execute(query, params)
    
    res.json({ 
      success: true, 
      data: horarios 
    })
  } catch (error) {
    console.error('Error en getHorariosParaIncidencias:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}