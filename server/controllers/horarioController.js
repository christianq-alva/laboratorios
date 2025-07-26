import { pool } from '../config/database.js'

export const getHorarios = async (req, res) => {
    try {
      let query = `
        SELECT 
          r.id,
          r.fecha_inicio,
          r.fecha_fin,
          r.cantidad_alumnos,
          l.nombre as laboratorio_nombre,
          d.nombre as docente_nombre
        FROM reservas r
        JOIN laboratorios l ON r.laboratorio_id = l.id
        JOIN docentes d ON r.docente_id = d.id
      `
      let params = []
      
      // 🟡 JEFE DE LAB: Solo horarios de SUS laboratorios
      if (req.user.rol === 'Jefe de Laboratorio') {
        const labIds = req.user.laboratorio_ids
        if (labIds && labIds.length > 0) {
          const placeholders = labIds.map(() => '?').join(',')
          query += ` WHERE r.laboratorio_id IN (${placeholders})`
          params = labIds
        } else {
          // No tiene laboratorios asignados
          query += ' WHERE 1 = 0' // No mostrar nada
        }
      }
      
      query += ' ORDER BY r.fecha_inicio DESC'
      
      const [horarios] = await pool.execute(query, params)
      
      res.json({ 
        success: true, 
        data: horarios,
        user_role: req.user.rol,
        laboratorios_asignados: req.user.laboratorio_ids // ← Para debug
      })
    } catch (error) {
      console.error('Error en getHorarios:', error)
      res.status(500).json({ success: false, message: error.message })
    }
  }
  
  export const createHorario = async (req, res) => {
    try {
      const { laboratorio_id, docente_id, fecha_inicio, fecha_fin, cantidad_alumnos } = req.body
      
      
      // 🔒 VERIFICACIÓN: Jefe solo puede crear horarios en SUS laboratorios
      if (req.user.rol === 'Jefe de Laboratorio') {
        const labIds = req.user.laboratorio_ids || []
        if (!labIds.includes(parseInt(laboratorio_id))) {
          return res.status(403).json({ 
            success: false, 
            message: `Solo puedes crear horarios en tus laboratorios: ${labIds.join(', ')}` 
          })
        }
      }
      
      const [result] = await pool.execute(`
        INSERT INTO reservas (laboratorio_id, docente_id, fecha_inicio, fecha_fin, cantidad_alumnos) 
        VALUES (?, ?, ?, ?, ?)
      `, [laboratorio_id, docente_id, fecha_inicio, fecha_fin, cantidad_alumnos])
      
      res.json({ 
        success: true, 
        message: 'Horario creado',
        id: result.insertId 
      })
    } catch (error) {
      console.error('Error en createHorario:', error)
      res.status(500).json({ success: false, message: error.message })
    }
  }

  export const updateHorario = async (req, res) => {
    try {
      const { id } = req.params
      const { laboratorio_id, docente_id, fecha_inicio, fecha_fin, cantidad_alumnos } = req.body
      
      // 🔒 VERIFICACIÓN: Jefe solo puede editar horarios de SUS laboratorios
      if (req.user.rol === 'Jefe de Laboratorio') {
        // Paso 1: Obtener el horario existente para ver a qué laboratorio pertenece
        const [existing] = await pool.execute('SELECT laboratorio_id FROM reservas WHERE id = ?', [id])
        
        if (existing.length === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Horario no encontrado' 
          })
        }
        
        const horarioLaboratorioId = existing[0].laboratorio_id
        const labIds = req.user.laboratorio_ids || []
        
        console.log('🔍 Horario pertenece al lab:', horarioLaboratorioId)
        console.log('🔍 Usuario puede gestionar labs:', labIds)
        
        // Verificar que el horario pertenece a uno de sus laboratorios
        if (!labIds.includes(horarioLaboratorioId)) {
          return res.status(403).json({ 
            success: false, 
            message: `Solo puedes editar horarios de tus laboratorios: ${labIds.join(', ')}` 
          })
        }
        
        // Verificar que el nuevo laboratorio_id también es uno de los suyos
        if (!labIds.includes(parseInt(laboratorio_id))) {
          return res.status(403).json({ 
            success: false, 
            message: `Solo puedes asignar horarios a tus laboratorios: ${labIds.join(', ')}` 
          })
        }
      }
      
      await pool.execute(`
        UPDATE reservas 
        SET laboratorio_id = ?, docente_id = ?, fecha_inicio = ?, fecha_fin = ?, cantidad_alumnos = ?
        WHERE id = ?
      `, [laboratorio_id, docente_id, fecha_inicio, fecha_fin, cantidad_alumnos, id])
      
      res.json({ success: true, message: 'Horario actualizado' })
    } catch (error) {
      console.error('Error en updateHorario:', error)
      res.status(500).json({ success: false, message: error.message })
    }
  }

  export const deleteHorario = async (req, res) => {
    try {
      const { id } = req.params
      
      // 🔒 VERIFICACIÓN: Jefe solo puede eliminar horarios de SUS laboratorios
      if (req.user.rol === 'Jefe de Laboratorio') {
        // Paso 1: Obtener el horario existente para ver a qué laboratorio pertenece
        const [existing] = await pool.execute('SELECT laboratorio_id FROM reservas WHERE id = ?', [id])
        
        if (existing.length === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Horario no encontrado' 
          })
        }
        
        const horarioLaboratorioId = existing[0].laboratorio_id
        const labIds = req.user.laboratorio_ids || []
        
        console.log('🔍 Intentando eliminar horario del lab:', horarioLaboratorioId)
        console.log('🔍 Usuario puede gestionar labs:', labIds)
        
        // Verificar que el horario pertenece a uno de sus laboratorios
        if (!labIds.includes(horarioLaboratorioId)) {
          return res.status(403).json({ 
            success: false, 
            message: `Solo puedes eliminar horarios de tus laboratorios: ${labIds.join(', ')}` 
          })
        }
      }
      
      await pool.execute('DELETE FROM reservas WHERE id = ?', [id])
      
      res.json({ success: true, message: 'Horario eliminado' })
    } catch (error) {
      console.error('Error en deleteHorario:', error)
      res.status(500).json({ success: false, message: error.message })
    }
  }