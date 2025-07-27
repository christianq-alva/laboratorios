import { pool } from '../config/database.js'
import { Insumo } from '../models/Insumo.js'

// 🚫 FUNCIÓN PARA VERIFICAR CRUCES DE HORARIOS
const verificarCruceHorarios = async (connection, laboratorio_id, docente_id, fecha_inicio, fecha_fin, reserva_id = null) => {
  
  // 🏢 VERIFICAR CRUCE DE LABORATORIO
  const queryLab = `
    SELECT 
      r.id,
      r.fecha_inicio,
      r.fecha_fin,
      d.nombre as docente
    FROM reservas r
    JOIN docentes d ON r.docente_id = d.id
    WHERE r.laboratorio_id = ?
      AND r.id != COALESCE(?, 0)
      AND (
        (? < r.fecha_fin AND ? > r.fecha_inicio) OR
        (? < r.fecha_fin AND ? > r.fecha_inicio) OR
        (? <= r.fecha_inicio AND ? >= r.fecha_fin)
      )
  `
  
  const [cruceLabRows] = await connection.execute(queryLab, [
    laboratorio_id, reserva_id,
    fecha_inicio, fecha_inicio,
    fecha_fin, fecha_fin, 
    fecha_inicio, fecha_fin
  ])
  
  if (cruceLabRows.length > 0) {
    const cruce = cruceLabRows[0]
    return {
      tipo: 'laboratorio',
      mensaje: `El laboratorio ya está ocupado de ${cruce.fecha_inicio} a ${cruce.fecha_fin} por ${cruce.docente}`,
      conflicto: cruce
    }
  }
  
  // 👨‍🏫 VERIFICAR CRUCE DE DOCENTE
  const queryDocente = `
    SELECT 
      r.id,
      r.fecha_inicio,
      r.fecha_fin,
      l.nombre as laboratorio
    FROM reservas r
    JOIN laboratorios l ON r.laboratorio_id = l.id
    WHERE r.docente_id = ?
      AND r.id != COALESCE(?, 0)
      AND (
        (? < r.fecha_fin AND ? > r.fecha_inicio) OR
        (? < r.fecha_fin AND ? > r.fecha_inicio) OR
        (? <= r.fecha_inicio AND ? >= r.fecha_fin)
      )
  `
  
  const [cruceDocenteRows] = await connection.execute(queryDocente, [
    docente_id, reserva_id,
    fecha_inicio, fecha_inicio,
    fecha_fin, fecha_fin,
    fecha_inicio, fecha_fin
  ])
  
  if (cruceDocenteRows.length > 0) {
    const cruce = cruceDocenteRows[0]
    return {
      tipo: 'docente', 
      mensaje: `El docente ya tiene clase de ${cruce.fecha_inicio} a ${cruce.fecha_fin} en ${cruce.laboratorio}`,
      conflicto: cruce
    }
  }
  
  return null // No hay cruces
}

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
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()
      
      const { 
        laboratorio_id, 
        docente_id, 
        fecha_inicio, 
        fecha_fin, 
        cantidad_alumnos,
        insumos = [] // ← NUEVO: Array de insumos a usar
      } = req.body
      
      console.log('🔍 Insumos recibidos:', insumos)
      console.log('🔍 Verificando cruces de horario...')
      
      // ⚠️ VERIFICAR CRUCES ANTES DE CREAR
      const cruce = await verificarCruceHorarios(
        connection, 
        laboratorio_id, 
        docente_id, 
        fecha_inicio, 
        fecha_fin
      )
      
      if (cruce) {
        await connection.rollback()
        return res.status(409).json({ // 409 = Conflict
          success: false,
          message: `Conflicto de horario: ${cruce.mensaje}`,
          tipo_conflicto: cruce.tipo,
          conflicto_detalle: cruce.conflicto
        })
      }
      
      console.log('✅ No hay cruces de horario')
      
      // Verificación de permisos (igual que antes)
      if (req.user.rol === 'Jefe de Laboratorio') {
        const labIds = req.user.laboratorio_ids || []
        if (!labIds.includes(parseInt(laboratorio_id))) {
          await connection.rollback()
          return res.status(403).json({ 
            success: false, 
            message: `Solo puedes crear horarios en tus laboratorios: ${labIds.join(', ')}` 
          })
        }
      }
      
      // 🔍 VERIFICAR STOCK DE INSUMOS
      for (const insumo of insumos) {
        const stockSuficiente = await Insumo.checkStock(
          insumo.insumo_id, 
          laboratorio_id, 
          insumo.cantidad
        )
        
        if (!stockSuficiente) {
          await connection.rollback()
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente para insumo ID ${insumo.insumo_id}`
          })
        }
      }
      
      // 1. CREAR LA RESERVA
      const [reservaResult] = await connection.execute(`
        INSERT INTO reservas (laboratorio_id, docente_id, fecha_inicio, fecha_fin, cantidad_alumnos) 
        VALUES (?, ?, ?, ?, ?)
      `, [laboratorio_id, docente_id, fecha_inicio, fecha_fin, cantidad_alumnos])
      
      const reserva_id = reservaResult.insertId
      console.log('✅ Reserva creada con ID:', reserva_id)
      
      // 2. PROCESAR INSUMOS
      for (const insumo of insumos) {
        console.log('🔄 Procesando insumo:', insumo)
        
        // Insertar en detalle_reserva_insumos
        await connection.execute(`
          INSERT INTO detalle_reserva_insumos (reserva_id, insumo_id, cantidad_usada)
          VALUES (?, ?, ?)
        `, [reserva_id, insumo.insumo_id, insumo.cantidad])
        
        // Reducir stock y registrar movimiento
        await Insumo.reducirStock(
          connection,
          insumo.insumo_id,
          laboratorio_id,
          insumo.cantidad,
          req.user.userId,
          reserva_id
        )
      }
      
      await connection.commit()
      
      res.json({ 
        success: true, 
        message: 'Horario creado con insumos',
        reserva_id: reserva_id,
        insumos_procesados: insumos.length
      })
      
    } catch (error) {
      await connection.rollback()
      console.error('Error en createHorario:', error)
      res.status(500).json({ success: false, message: error.message })
    } finally {
      connection.release()
    }
  }

  export const updateHorario = async (req, res) => {
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()
      
      const { id } = req.params
      const { 
        laboratorio_id, 
        docente_id, 
        fecha_inicio, 
        fecha_fin, 
        cantidad_alumnos,
        insumos = [] // ← NUEVO: Insumos actualizados
      } = req.body
      
      console.log('🔍 Editando horario:', id)
      console.log('🔍 Nuevos insumos:', insumos)
      console.log('🔍 Verificando cruces para edición...')
      
      // ⚠️ VERIFICAR CRUCES (excluyendo la reserva actual)
      const cruce = await verificarCruceHorarios(
        connection, 
        laboratorio_id, 
        docente_id, 
        fecha_inicio, 
        fecha_fin,
        id // Excluir la reserva que estamos editando
      )
      
      if (cruce) {
        await connection.rollback()
        return res.status(409).json({
          success: false,
          message: `Conflicto de horario: ${cruce.mensaje}`,
          tipo_conflicto: cruce.tipo,
          conflicto_detalle: cruce.conflicto
        })
      }
      
      console.log('✅ No hay cruces de horario para edición')
      
      // Verificación de permisos (igual que antes)
      if (req.user.rol === 'Jefe de Laboratorio') {
        const [existing] = await connection.execute('SELECT laboratorio_id FROM reservas WHERE id = ?', [id])
        if (existing.length === 0 || !req.user.laboratorio_ids.includes(existing[0].laboratorio_id)) {
          await connection.rollback()
          return res.status(403).json({ 
            success: false, 
            message: 'Solo puedes editar horarios de tus laboratorios' 
          })
        }
      }
      
      // 1️⃣ OBTENER INSUMOS ACTUALES
      const [insumosActuales] = await connection.execute(`
        SELECT insumo_id, cantidad_usada 
        FROM detalle_reserva_insumos 
        WHERE reserva_id = ?
      `, [id])
      
      console.log('🔍 Insumos actuales:', insumosActuales)
      
      // 2️⃣ DEVOLVER STOCK DE INSUMOS ACTUALES
      for (const insumoActual of insumosActuales) {
        // Devolver stock
        await connection.execute(`
          UPDATE inventario_insumos 
          SET cantidad = cantidad + ? 
          WHERE insumo_id = ? AND laboratorio_id = (
            SELECT laboratorio_id FROM reservas WHERE id = ?
          )
        `, [insumoActual.cantidad_usada, insumoActual.insumo_id, id])
        
        // Registrar movimiento de devolución
        await connection.execute(`
          INSERT INTO movimientos_insumos 
          (insumo_id, laboratorio_id, usuario_id, tipo_movimiento, cantidad, reserva_id, observaciones)
          VALUES (?, (SELECT laboratorio_id FROM reservas WHERE id = ?), ?, 'entrada', ?, ?, 'Devolución por edición de horario')
        `, [insumoActual.insumo_id, id, req.user.userId, insumoActual.cantidad_usada, id])
      }
      
      // 3️⃣ ELIMINAR REGISTROS ANTIGUOS DE INSUMOS
      await connection.execute('DELETE FROM detalle_reserva_insumos WHERE reserva_id = ?', [id])
      
      // 4️⃣ VERIFICAR STOCK DE NUEVOS INSUMOS
      for (const insumo of insumos) {
        const stockSuficiente = await Insumo.checkStock(
          insumo.insumo_id, 
          laboratorio_id, 
          insumo.cantidad
        )
        
        if (!stockSuficiente) {
          await connection.rollback()
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente para insumo ID ${insumo.insumo_id}`
          })
        }
      }
      
      // 5️⃣ ACTUALIZAR DATOS BÁSICOS DEL HORARIO
      await connection.execute(`
        UPDATE reservas 
        SET laboratorio_id = ?, docente_id = ?, fecha_inicio = ?, fecha_fin = ?, cantidad_alumnos = ?
        WHERE id = ?
      `, [laboratorio_id, docente_id, fecha_inicio, fecha_fin, cantidad_alumnos, id])
      
      // 6️⃣ PROCESAR NUEVOS INSUMOS
      for (const insumo of insumos) {
        // Insertar en detalle_reserva_insumos
        await connection.execute(`
          INSERT INTO detalle_reserva_insumos (reserva_id, insumo_id, cantidad_usada)
          VALUES (?, ?, ?)
        `, [id, insumo.insumo_id, insumo.cantidad])
        
        // Reducir stock y registrar movimiento
        await Insumo.reducirStock(
          connection,
          insumo.insumo_id,
          laboratorio_id,
          insumo.cantidad,
          req.user.userId,
          id
        )
      }
      
      await connection.commit()
      
      res.json({ 
        success: true, 
        message: 'Horario actualizado con insumos',
        insumos_anteriores: insumosActuales.length,
        insumos_nuevos: insumos.length
      })
      
    } catch (error) {
      await connection.rollback()
      console.error('Error en updateHorario:', error)
      res.status(500).json({ success: false, message: error.message })
    } finally {
      connection.release()
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

  // 🔍 VERIFICAR DISPONIBILIDAD DE HORARIO
  export const verificarDisponibilidad = async (req, res) => {
    try {
      const { laboratorio_id, docente_id, fecha_inicio, fecha_fin } = req.body
      
      console.log('🔍 Verificando disponibilidad:', { laboratorio_id, docente_id, fecha_inicio, fecha_fin })
      
      const connection = await pool.getConnection()
      const cruce = await verificarCruceHorarios(
        connection, 
        laboratorio_id, 
        docente_id, 
        fecha_inicio, 
        fecha_fin
      )
      connection.release()
      
      if (cruce) {
        res.json({
          disponible: false,
          motivo: cruce.mensaje,
          tipo_conflicto: cruce.tipo,
          conflicto_detalle: cruce.conflicto
        })
      } else {
        res.json({
          disponible: true,
          mensaje: 'Horario disponible - sin conflictos'
        })
      }
    } catch (error) {
      console.error('Error en verificarDisponibilidad:', error)
      res.status(500).json({ success: false, message: error.message })
    }
  }