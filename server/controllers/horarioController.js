import { pool } from '../config/database.js'
import { Insumo } from '../models/Insumo.js'

// Función para convertir fecha ISO a formato MySQL
const convertirFechaParaMySQL = (fechaISO) => {
  if (!fechaISO) return null
  // Convertir ISO string a formato MySQL (YYYY-MM-DD HH:MM:SS)
  const fecha = new Date(fechaISO)
  return fecha.toISOString().slice(0, 19).replace('T', ' ')
}

// 🚫 FUNCIÓN PARA VERIFICAR CRUCES DE HORARIOS
const verificarCruceHorarios = async (connection, laboratorio_id, docente_id, fecha_inicio, fecha_fin, reserva_id = null) => {
  
  // ✅ CONVERTIR FECHAS A FORMATO MYSQL
  const fechaInicioMySQL = convertirFechaParaMySQL(fecha_inicio)
  const fechaFinMySQL = convertirFechaParaMySQL(fecha_fin)
  
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
    fechaInicioMySQL, fechaInicioMySQL,
    fechaFinMySQL, fechaFinMySQL, 
    fechaInicioMySQL, fechaFinMySQL
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
    fechaInicioMySQL, fechaInicioMySQL,
    fechaFinMySQL, fechaFinMySQL,
    fechaInicioMySQL, fechaFinMySQL
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
      console.log('🔍 getHorarios - Usuario:', {
        rol: req.user.rol,
        userId: req.user.userId,
        laboratorio_ids: req.user.laboratorio_ids
      })

      let query = `
        SELECT 
          r.id,
          r.fecha_inicio,
          r.fecha_fin,
          r.cantidad_alumnos,
          r.descripcion,
          l.nombre as laboratorio,
          d.nombre as docente,
          e.nombre as escuela,
          c.nombre as ciclo,
          g.nombre as grupo
        FROM reservas r
        LEFT JOIN laboratorios l ON r.laboratorio_id = l.id
        LEFT JOIN docentes d ON r.docente_id = d.id
        LEFT JOIN grupos g ON r.grupo_id = g.id
        LEFT JOIN escuelas e ON g.escuela_id = e.id
        LEFT JOIN ciclos c ON g.ciclo_id = c.id
      `
      let params = []
      
      // 🟡 JEFE DE LAB: Solo horarios de SUS laboratorios
      if (req.user.rol === 'Jefe de Laboratorio') {
        const labIds = req.user.laboratorio_ids
        console.log('🔍 Jefe de Laboratorio - Laboratorios asignados:', labIds)
        
        if (labIds && labIds.length > 0) {
          const placeholders = labIds.map(() => '?').join(',')
          query += ` WHERE r.laboratorio_id IN (${placeholders})`
          params = labIds
          console.log('🔍 Query con filtro de laboratorios:', query)
        } else {
          // No tiene laboratorios asignados
          query += ' WHERE 1 = 0' // No mostrar nada
          console.log('⚠️ Jefe de Laboratorio sin laboratorios asignados')
        }
      } else {
        console.log('🔍 Administrador - Mostrando todos los horarios')
      }
      
      query += ' ORDER BY r.fecha_inicio DESC'
      
      console.log('🔍 Query final:', query)
      console.log('🔍 Parámetros:', params)
      
      const [horarios] = await pool.execute(query, params)
      console.log('🔍 Horarios encontrados (sin insumos):', horarios.length)
      
      // 🔍 DEBUG: Verificar registros con datos faltantes
      const registrosConNulls = horarios.filter(h => 
        !h.laboratorio || !h.docente || !h.grupo || !h.escuela || !h.ciclo
      )
      
      if (registrosConNulls.length > 0) {
        console.log('⚠️ Registros con datos faltantes:', registrosConNulls.length)
        console.log('🔍 Primer registro con datos faltantes:', {
          id: registrosConNulls[0].id,
          laboratorio: registrosConNulls[0].laboratorio,
          docente: registrosConNulls[0].docente,
          grupo: registrosConNulls[0].grupo,
          escuela: registrosConNulls[0].escuela,
          ciclo: registrosConNulls[0].ciclo
        })
      }
      
      // 🔍 DEBUG: Verificar total de registros en la tabla
      const [totalRegistros] = await pool.execute('SELECT COUNT(*) as total FROM reservas')
      console.log('🔍 Total de registros en tabla reservas:', totalRegistros[0].total)
      
      if (horarios.length > 0) {
        console.log('🔍 Primer horario encontrado:', {
          id: horarios[0].id,
          laboratorio: horarios[0].laboratorio,
          docente: horarios[0].docente,
          fecha_inicio: horarios[0].fecha_inicio
        })
      }
      
      // 🔍 OBTENER INSUMOS PARA CADA HORARIO
      const horariosConInsumos = await Promise.all(
        horarios.map(async (horario) => {
          const [insumos] = await pool.execute(`
            SELECT 
              dri.insumo_id as id,
              i.nombre,
              dri.cantidad_usada
            FROM detalle_reserva_insumos dri
            JOIN insumos i ON dri.insumo_id = i.id
            WHERE dri.reserva_id = ?
          `, [horario.id])
          
          return {
            ...horario,
            insumos: insumos
          }
        })
      )
      
      res.json({ 
        success: true, 
        data: horariosConInsumos,
        user_role: req.user.rol,
        laboratorios_asignados: req.user.laboratorio_ids // ← Para debug
      })
      
      console.log('📋 Horarios enviados:', {
        total: horariosConInsumos.length,
        primer_horario: horariosConInsumos[0] ? {
          id: horariosConInsumos[0].id,
          laboratorio: horariosConInsumos[0].laboratorio,
          docente: horariosConInsumos[0].docente,
          grupo: horariosConInsumos[0].grupo,
          escuela: horariosConInsumos[0].escuela,
          ciclo: horariosConInsumos[0].ciclo,
          insumos_count: horariosConInsumos[0].insumos?.length || 0
        } : null
      })
    } catch (error) {
      console.error('Error en getHorarios:', error)
      res.status(500).json({ success: false, message: error.message })
    }
  }

  // Obtener un horario específico por ID
  export const getHorario = async (req, res) => {
    try {
      const { id } = req.params
      
      console.log('🔍 getHorario - Buscando horario ID:', id, 'para usuario:', req.user.usuario)
      
      let query = `
        SELECT 
          r.id,
          r.laboratorio_id,
          r.docente_id,
          r.grupo_id,
          r.descripcion,
          r.fecha_inicio,
          r.fecha_fin,
          r.cantidad_alumnos,
          l.nombre as laboratorio,
          d.nombre as docente,
          g.nombre as grupo,
          e.nombre as escuela,
          c.nombre as ciclo
        FROM reservas r
        JOIN laboratorios l ON r.laboratorio_id = l.id
        JOIN docentes d ON r.docente_id = d.id
        JOIN grupos g ON r.grupo_id = g.id
        JOIN escuelas e ON g.escuela_id = e.id
        JOIN ciclos c ON g.ciclo_id = c.id
        WHERE r.id = ?
      `
      let params = [id]
      
      // 🟡 JEFE DE LAB: Solo horarios de SUS laboratorios
      if (req.user.rol === 'Jefe de Laboratorio') {
        const labIds = req.user.laboratorio_ids || []
        if (labIds.length > 0) {
          const placeholders = labIds.map(() => '?').join(',')
          query += ` AND r.laboratorio_id IN (${placeholders})`
          params = [id, ...labIds]
        } else {
          query += ' AND 1 = 0' // No mostrar nada
        }
      }
      // 🔴 ADMIN: Ve todos los horarios
      
      const [horarios] = await pool.execute(query, params)
      
      if (horarios.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Horario no encontrado o sin permisos para verlo' 
        })
      }
      
      const horario = horarios[0]
      
      // 🔍 OBTENER INSUMOS DEL HORARIO
      const [insumos] = await pool.execute(`
        SELECT 
          dri.insumo_id as id,
          i.nombre,
          i.descripcion,
          i.unidad_medida,
          dri.cantidad_usada
        FROM detalle_reserva_insumos dri
        JOIN insumos i ON dri.insumo_id = i.id
        WHERE dri.reserva_id = ?
        ORDER BY i.nombre
      `, [id])
      
      const horarioConInsumos = {
        ...horario,
        insumos: insumos
      }
      
      console.log('📋 Horario encontrado:', {
        id: horarioConInsumos.id,
        laboratorio: horarioConInsumos.laboratorio,
        docente: horarioConInsumos.docente,
        grupo: horarioConInsumos.grupo,
        escuela: horarioConInsumos.escuela,
        ciclo: horarioConInsumos.ciclo,
        insumos_count: horarioConInsumos.insumos?.length || 0
      })
      
      res.json({ 
        success: true, 
        data: horarioConInsumos
      })
    } catch (error) {
      console.error('Error en getHorario:', error)
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
        grupo_id,        // ← Para guardar
        descripcion,     // ← Descripción de la clase
        fecha_inicio, 
        fecha_fin, 
        cantidad_alumnos = 1, // ← Valor por defecto
        insumos = [] // ← Array de insumos a usar
      } = req.body
      
      console.log('🔍 Datos recibidos:', { 
        laboratorio_id, docente_id, grupo_id, descripcion, fecha_inicio, fecha_fin, cantidad_alumnos
      })

      // ✅ VALIDACIÓN 0: Verificar que no hay valores undefined
      if (!laboratorio_id || !docente_id || !grupo_id || !descripcion || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos: laboratorio_id, docente_id, grupo_id, descripcion, fecha_inicio, fecha_fin'
        })
      }

      // ✅ CONVERTIR FECHAS A FORMATO MYSQL
      const fechaInicioMySQL = convertirFechaParaMySQL(fecha_inicio)
      const fechaFinMySQL = convertirFechaParaMySQL(fecha_fin)
      
      console.log('📅 Fechas convertidas:', { 
        original_inicio: fecha_inicio, 
        mysql_inicio: fechaInicioMySQL,
        original_fin: fecha_fin, 
        mysql_fin: fechaFinMySQL
      })

      // ✅ VALIDACIÓN 1: Verificar que el grupo existe y obtener su información
      const [grupoValidacion] = await connection.execute(`
        SELECT 
          g.id,
          g.nombre as grupo_nombre,
          g.escuela_id,
          g.ciclo_id,
          e.nombre as escuela_nombre,
          c.nombre as ciclo_nombre
        FROM grupos g
        JOIN escuelas e ON g.escuela_id = e.id
        JOIN ciclos c ON g.ciclo_id = c.id
        WHERE g.id = ?
      `, [grupo_id])
      
      if (grupoValidacion.length === 0) {
        await connection.rollback()
        return res.status(400).json({
          success: false,
          message: 'El grupo seleccionado no existe o no está válida su configuración'
        })
      }

      // Extraer información del grupo validado
      const grupoInfo = grupoValidacion[0]
      console.log('✅ Grupo validado:', grupoInfo)
      
      // ✅ VALIDACIÓN 2: Verificar que el docente existe (sin restricción de escuela)
      const [docenteValidacion] = await connection.execute(`
        SELECT 
          d.id,
          d.nombre as docente_nombre,
          d.escuela_id as docente_escuela_id,
          e.nombre as docente_escuela
        FROM docentes d
        JOIN escuelas e ON d.escuela_id = e.id
        WHERE d.id = ?
      `, [docente_id])
      
      if (docenteValidacion.length === 0) {
        await connection.rollback()
        return res.status(400).json({
          success: false,
          message: 'Docente no encontrado'
        })
      }
      
      const docenteInfo = docenteValidacion[0]
      console.log('✅ Docente validado:', docenteInfo.docente_nombre, 'de', docenteInfo.docente_escuela, 'puede enseñar al grupo de', grupoInfo.escuela_nombre)
      
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
        INSERT INTO reservas (laboratorio_id, docente_id, grupo_id, descripcion, fecha_inicio, fecha_fin, cantidad_alumnos) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [laboratorio_id, docente_id, grupo_id, descripcion, fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos])
      
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
        message: 'Horario creado correctamente',
        reserva_id: reserva_id,
        validaciones: {
          escuela: grupoInfo.escuela_nombre,
          ciclo: grupoInfo.ciclo_nombre,
          grupo: grupoInfo.grupo_nombre,
          docente: docenteInfo.docente_nombre
        },
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
        grupo_id,        // ← Para guardar
        descripcion,     // ← Descripción de la clase
        fecha_inicio, 
        fecha_fin, 
        cantidad_alumnos = 1, // ← Valor por defecto
        insumos = [] // ← Insumos actualizados
      } = req.body
      
      console.log('🔍 Editando horario:', id)
      console.log('🔍 Datos recibidos:', { 
        laboratorio_id, docente_id, grupo_id, descripcion, fecha_inicio, fecha_fin, cantidad_alumnos
      })

      // ✅ VALIDACIÓN 0: Verificar que no hay valores undefined
      if (!laboratorio_id || !docente_id || !grupo_id || !descripcion || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos: laboratorio_id, docente_id, grupo_id, descripcion, fecha_inicio, fecha_fin'
        })
      }

      // ✅ CONVERTIR FECHAS A FORMATO MYSQL
      const fechaInicioMySQL = convertirFechaParaMySQL(fecha_inicio)
      const fechaFinMySQL = convertirFechaParaMySQL(fecha_fin)
      
      console.log(' Fechas convertidas para edición:', { 
        original_inicio: fecha_inicio, 
        mysql_inicio: fechaInicioMySQL,
        original_fin: fecha_fin, 
        mysql_fin: fechaFinMySQL
      })

      // ✅ VALIDACIÓN 1: Verificar que el grupo existe y obtener su información
      const [grupoValidacion] = await connection.execute(`
        SELECT 
          g.id,
          g.nombre as grupo_nombre,
          g.escuela_id,
          g.ciclo_id,
          e.nombre as escuela_nombre,
          c.nombre as ciclo_nombre
        FROM grupos g
        JOIN escuelas e ON g.escuela_id = e.id
        JOIN ciclos c ON g.ciclo_id = c.id
        WHERE g.id = ?
      `, [grupo_id])
      
      if (grupoValidacion.length === 0) {
        await connection.rollback()
        return res.status(400).json({
          success: false,
          message: 'El grupo seleccionado no existe o no está válida su configuración'
        })
      }

      // Extraer información del grupo validado
      const grupoInfo = grupoValidacion[0]
      console.log('✅ Grupo validado:', grupoInfo)
      
      // ✅ VALIDACIÓN 2: Verificar que el docente existe (sin restricción de escuela)
      const [docenteValidacion] = await connection.execute(`
        SELECT 
          d.id,
          d.nombre as docente_nombre,
          d.escuela_id as docente_escuela_id,
          e.nombre as docente_escuela
        FROM docentes d
        JOIN escuelas e ON d.escuela_id = e.id
        WHERE d.id = ?
      `, [docente_id])
      
      if (docenteValidacion.length === 0) {
        await connection.rollback()
        return res.status(400).json({
          success: false,
          message: 'Docente no encontrado'
        })
      }
      
      const docenteInfo = docenteValidacion[0]
      console.log('✅ Docente validado:', docenteInfo.docente_nombre, 'de', docenteInfo.docente_escuela, 'puede enseñar al grupo de', grupoInfo.escuela_nombre)
      
      console.log(' Verificando cruces para edición...')
      
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
      
      // 5️⃣ ACTUALIZAR DATOS BÁSICOS DEL HORARIO (ACTUALIZADO)
      await connection.execute(`
        UPDATE reservas 
        SET laboratorio_id = ?, docente_id = ?, grupo_id = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, cantidad_alumnos = ?
        WHERE id = ?
      `, [laboratorio_id, docente_id, grupo_id, descripcion, fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, id])
      
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
        message: 'Horario actualizado correctamente',
        validaciones: {
          escuela: grupoInfo.escuela_nombre,
          ciclo: grupoInfo.ciclo_nombre,
          grupo: grupoInfo.grupo_nombre,
          docente: docenteInfo.docente_nombre
        },
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
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()
      
      const { id } = req.params
      
      console.log('🔍 Eliminando horario ID:', id)
      
      // 1️⃣ OBTENER INFORMACIÓN COMPLETA DEL HORARIO
      const [horarioInfo] = await connection.execute(`
        SELECT 
          r.id,
          r.laboratorio_id,
          r.docente_id,
          r.grupo_id,
          r.descripcion,
          r.fecha_inicio,
          r.fecha_fin,
          r.cantidad_alumnos,
          l.nombre as laboratorio_nombre,
          d.nombre as docente_nombre,
          e.nombre as escuela_nombre,
          c.nombre as ciclo_nombre,
          g.nombre as grupo_nombre
        FROM reservas r
        JOIN laboratorios l ON r.laboratorio_id = l.id
        JOIN docentes d ON r.docente_id = d.id
        JOIN grupos g ON r.grupo_id = g.id
        JOIN escuelas e ON g.escuela_id = e.id
        JOIN ciclos c ON g.ciclo_id = c.id
        WHERE r.id = ?
      `, [id])
      
      if (horarioInfo.length === 0) {
        await connection.rollback()
        return res.status(404).json({ 
          success: false, 
          message: 'Horario no encontrado' 
        })
      }
      
      const horario = horarioInfo[0]
      console.log('📋 Horario encontrado:', {
        laboratorio: horario.laboratorio_nombre,
        docente: horario.docente_nombre,
        escuela: horario.escuela_nombre,
        grupo: horario.grupo_nombre
      })
      
      // 2️⃣ VERIFICACIÓN DE PERMISOS
      if (req.user.rol === 'Jefe de Laboratorio') {
        const labIds = req.user.laboratorio_ids || []
        
        console.log('🔍 Verificando permisos - Lab del horario:', horario.laboratorio_id)
        console.log('🔍 Labs permitidos:', labIds)
        
        if (!labIds.includes(horario.laboratorio_id)) {
          await connection.rollback()
          return res.status(403).json({ 
            success: false, 
            message: `Solo puedes eliminar horarios de tus laboratorios: ${labIds.join(', ')}` 
          })
        }
      }
      
      // 3️⃣ OBTENER INSUMOS USADOS EN ESTE HORARIO
      const [insumosUsados] = await connection.execute(`
        SELECT 
          dri.insumo_id,
          dri.cantidad_usada,
          i.nombre as insumo_nombre
        FROM detalle_reserva_insumos dri
        JOIN insumos i ON dri.insumo_id = i.id
        WHERE dri.reserva_id = ?
      `, [id])
      
      console.log('📦 Insumos a devolver:', insumosUsados.length)
      
      // 4️⃣ DEVOLVER STOCK DE TODOS LOS INSUMOS
      for (const insumo of insumosUsados) {
        console.log(`🔄 Devolviendo ${insumo.cantidad_usada} de ${insumo.insumo_nombre}`)
        
        // Devolver stock al inventario
        await connection.execute(`
          UPDATE inventario_insumos 
          SET cantidad = cantidad + ? 
          WHERE insumo_id = ? AND laboratorio_id = ?
        `, [insumo.cantidad_usada, insumo.insumo_id, horario.laboratorio_id])
        
        // Registrar movimiento de devolución
        await connection.execute(`
          INSERT INTO movimientos_insumos 
          (insumo_id, laboratorio_id, usuario_id, tipo_movimiento, cantidad, reserva_id, observaciones)
          VALUES (?, ?, ?, 'entrada', ?, ?, 'Devolución por eliminación de horario')
        `, [insumo.insumo_id, horario.laboratorio_id, req.user.userId, insumo.cantidad_usada, id])
      }
      
      // 5️⃣ ELIMINAR REGISTROS RELACIONADOS
      await connection.execute('DELETE FROM detalle_reserva_insumos WHERE reserva_id = ?', [id])
      console.log('✅ Registros de insumos eliminados')
      
      // 6️⃣ ELIMINAR EL HORARIO/RESERVA
      await connection.execute('DELETE FROM reservas WHERE id = ?', [id])
      console.log('✅ Horario eliminado')
      
      await connection.commit()
      
      res.json({ 
        success: true, 
        message: 'Horario eliminado correctamente',
        eliminado: {
          id: horario.id,
          laboratorio: horario.laboratorio_nombre,
          docente: horario.docente_nombre,
          escuela: horario.escuela_nombre,
          ciclo: horario.ciclo_nombre,
          grupo: horario.grupo_nombre,
          descripcion: horario.descripcion,
          fecha_inicio: horario.fecha_inicio,
          fecha_fin: horario.fecha_fin
        },
        insumos_devueltos: insumosUsados.length
      })
      
    } catch (error) {
      await connection.rollback()
      console.error('Error en deleteHorario:', error)
      res.status(500).json({ 
        success: false, 
        message: error.message 
      })
    } finally {
      connection.release()
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

  // 🔍 FUNCIÓN DE DEBUG TEMPORAL
  export const debugHorarios = async (req, res) => {
    try {
      console.log('🔍 DEBUG: Verificando todos los registros...')
      
      // 1. Total de registros en reservas
      const [totalReservas] = await pool.execute('SELECT COUNT(*) as total FROM reservas')
      
      // 2. Todos los registros sin filtros
      const [todasReservas] = await pool.execute(`
        SELECT 
          r.id,
          r.laboratorio_id,
          r.docente_id,
          r.grupo_id,
          r.descripcion,
          r.fecha_inicio,
          r.fecha_fin,
          r.cantidad_alumnos
        FROM reservas r
        ORDER BY r.fecha_inicio DESC
      `)
      
      // 3. Verificar JOINs con LEFT JOIN
      const [reservasConJoins] = await pool.execute(`
        SELECT 
          r.id,
          l.nombre as laboratorio,
          d.nombre as docente,
          g.nombre as grupo,
          e.nombre as escuela,
          c.nombre as ciclo
        FROM reservas r
        LEFT JOIN laboratorios l ON r.laboratorio_id = l.id
        LEFT JOIN docentes d ON r.docente_id = d.id
        LEFT JOIN grupos g ON r.grupo_id = g.id
        LEFT JOIN escuelas e ON g.escuela_id = e.id
        LEFT JOIN ciclos c ON g.ciclo_id = c.id
        ORDER BY r.fecha_inicio DESC
      `)
      
      // 4. Verificar registros huérfanos
      const registrosHuerfanos = reservasConJoins.filter(r => 
        !r.laboratorio || !r.docente || !r.grupo || !r.escuela || !r.ciclo
      )
      
      // 5. Verificar IDs que no existen
      const [laboratoriosExistentes] = await pool.execute('SELECT id FROM laboratorios')
      const [docentesExistentes] = await pool.execute('SELECT id FROM docentes')
      const [gruposExistentes] = await pool.execute('SELECT id FROM grupos')
      
      const idsLaboratorios = laboratoriosExistentes.map(l => l.id)
      const idsDocentes = docentesExistentes.map(d => d.id)
      const idsGrupos = gruposExistentes.map(g => g.id)
      
      const registrosConIdsInvalidos = todasReservas.filter(r => 
        !idsLaboratorios.includes(r.laboratorio_id) ||
        !idsDocentes.includes(r.docente_id) ||
        !idsGrupos.includes(r.grupo_id)
      )
      
      res.json({
        success: true,
        debug_info: {
          total_reservas: totalReservas[0].total,
          reservas_sin_joins: todasReservas.length,
          reservas_con_joins: reservasConJoins.length,
          registros_huerfanos: registrosHuerfanos.length,
          registros_con_ids_invalidos: registrosConIdsInvalidos.length,
          todas_reservas: todasReservas,
          reservas_con_joins_detalle: reservasConJoins,
          registros_huerfanos_detalle: registrosHuerfanos,
          registros_con_ids_invalidos_detalle: registrosConIdsInvalidos,
          ids_laboratorios: idsLaboratorios,
          ids_docentes: idsDocentes,
          ids_grupos: idsGrupos
        }
      })
      
    } catch (error) {
      console.error('Error en debugHorarios:', error)
      res.status(500).json({ success: false, message: error.message })
    }
  }

// ==================== FUNCIONES UTILITARIAS ==================== 

// 🏫 OBTENER ESCUELAS DISPONIBLES
export const getEscuelas = async (req, res) => {
  try {
    const [escuelas] = await pool.execute(`
      SELECT id, nombre 
      FROM escuelas 
      ORDER BY nombre
    `)
    
    res.json({ 
      success: true, 
      data: escuelas 
    })
  } catch (error) {
    console.error('Error en getEscuelas:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// 📅 OBTENER CICLOS DISPONIBLES  
export const getCiclos = async (req, res) => {
  try {
    const [ciclos] = await pool.execute(`
      SELECT id, nombre 
      FROM ciclos 
      ORDER BY nombre
    `)
    
    res.json({ 
      success: true, 
      data: ciclos 
    })
  } catch (error) {
    console.error('Error en getCiclos:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// 👥 OBTENER GRUPOS (CON FILTROS OPCIONALES)
export const getGrupos = async (req, res) => {
  try {
    const { escuela_id, ciclo_id } = req.query
    
    let query = `
      SELECT 
        g.id,
        g.nombre,
        g.escuela_id,
        g.ciclo_id,
        e.nombre as escuela,
        c.nombre as ciclo
      FROM grupos g
      JOIN escuelas e ON g.escuela_id = e.id
      JOIN ciclos c ON g.ciclo_id = c.id
      WHERE 1=1
    `
    const params = []
    
    if (escuela_id) {
      query += ' AND g.escuela_id = ?'
      params.push(escuela_id)
    }
    
    if (ciclo_id) {
      query += ' AND g.ciclo_id = ?'  
      params.push(ciclo_id)
    }
    
    query += ' ORDER BY e.nombre, c.nombre, g.nombre'
    
    const [grupos] = await pool.execute(query, params)
    
    res.json({ 
      success: true, 
      data: grupos,
      filters: { escuela_id, ciclo_id }
    })
  } catch (error) {
    console.error('Error en getGrupos:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
