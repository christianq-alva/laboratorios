import { pool } from '../config/database.js'
import { Insumo } from '../models/Insumo.js'
import { Equipo } from '../models/Equipo.js'
import { convertirFechaParaMySQL } from '../utils/utils.js'
import { Horario } from '../models/Horario.js'
import { Inventario } from '../models/Inventario.js'



// 🚫 FUNCIÓN PARA VERIFICAR CRUCES DE HORARIOS
const verificarCruceHorarios = async (connection, laboratorio_id, docente_id, fecha_inicio, fecha_fin, reserva_id = null) => {

  console.log('🔍 verificarCruceHorarios - Parámetros recibidos:', {
    laboratorio_id,
    docente_id,
    fecha_inicio,
    fecha_fin,
    reserva_id,
    reserva_id_type: typeof reserva_id
  })

  // ✅ CONVERTIR FECHAS A FORMATO MYSQL
  const fechaInicioMySQL = convertirFechaParaMySQL(fecha_inicio)
  const fechaFinMySQL = convertirFechaParaMySQL(fecha_fin)

  console.log('🔍 Fechas convertidas:', { fechaInicioMySQL, fechaFinMySQL })


  //Verificar cruce de Laboratorios
  const cruceLabRows = await Horario.getCruceLab(
    laboratorio_id, reserva_id,
    fechaInicioMySQL, fechaFinMySQL
  )

  console.log('🔍 Consulta de laboratorio ejecutada:', {
    params: [laboratorio_id, reserva_id, fechaInicioMySQL, fechaInicioMySQL, fechaFinMySQL, fechaFinMySQL, fechaInicioMySQL, fechaFinMySQL],
    resultados: cruceLabRows.length,
    conflictos_encontrados: cruceLabRows
  })

  if (cruceLabRows.length > 0) {
    const cruce = cruceLabRows[0]
    return {
      tipo: 'laboratorio',
      mensaje: `El laboratorio ${cruce.laboratorio} (${cruce.laboratorio_ubicacion}) ya está ocupado`,
      detalles: {
        laboratorio: cruce.laboratorio,
        ubicacion: cruce.laboratorio_ubicacion,
        docente: cruce.docente,
        grupo: cruce.grupo,
        escuela: cruce.escuela,
        ciclo: cruce.ciclo,
        descripcion: cruce.descripcion,
        fecha_inicio: cruce.fecha_inicio,
        fecha_fin: cruce.fecha_fin,
        horario_id: cruce.id
      },
      conflicto: cruce
    }
  }

  //Verificar cruce de Docente
  const cruceDocenteRows = await Horario.getCruceDocente(
    docente_id, reserva_id, fechaInicioMySQL, fechaFinMySQL
  )

  if (cruceDocenteRows.length > 0) {
    const cruce = cruceDocenteRows[0]
    return {
      tipo: 'docente',
      mensaje: `El docente ${cruce.docente} ya tiene una clase programada`,
      detalles: {
        laboratorio: cruce.laboratorio,
        ubicacion: cruce.laboratorio_ubicacion,
        docente: cruce.docente,
        grupo: cruce.grupo,
        escuela: cruce.escuela,
        ciclo: cruce.ciclo,
        descripcion: cruce.descripcion,
        fecha_inicio: cruce.fecha_inicio,
        fecha_fin: cruce.fecha_fin,
        horario_id: cruce.id
      },
      conflicto: cruce
    }
  }

  return null // No hay cruces
}

// Obtener actividad de horarios
export const getActividadHorarios = async (req, res) => {
  try {
    const { laboratorio_id, fecha_inicio, fecha_fin, accion, usuario_id } = req.query

    console.log('🔍 getActividadHorarios - Parámetros:', {
      laboratorio_id,
      fecha_inicio,
      fecha_fin,
      accion,
      usuario_id,
      user_role: req.user.rol,
      user_laboratorio_ids: req.user.laboratorio_ids || []
    })

    const rows = await Horario.getActividadHorarios(req.user.rol, req.user.laboratorio_ids, laboratorio_id, fecha_inicio, fecha_fin, accion, usuario_id)

    // Mantener las fechas como están (la conversión se hará en el frontend)
    const rowsWithTimeZone = rows.map(row => ({
      ...row,
      // Asegurar que la fecha esté en formato ISO string
      fecha_actividad: new Date(row.fecha_actividad).toISOString()
    }))

    console.log('📊 Actividad encontrada:', rows.length)

    res.json({
      success: true,
      data: rowsWithTimeZone,
      total: rows.length
    })

  } catch (error) {
    console.error('Error en getActividadHorarios:', error)
    res.status(500).json({ success: false, message: error.message })
  }
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
          r.color,
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

        // Cargar equipos del horario
        const [equipos] = await pool.execute(`
            SELECT 
              dre.equipo_id as id,
              e.nombre,
              e.marca,
              e.modelo,
              e.codigo,
              e.estado,
              dre.cantidad as cantidad_usada
            FROM detalle_reserva_equipos dre
            JOIN equipos e ON dre.equipo_id = e.id
            WHERE dre.reserva_id = ?
            ORDER BY e.nombre
          `, [horario.id])

        return {
          ...horario,
          insumos: insumos,
          equipos: equipos
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
        insumos_count: horariosConInsumos[0].insumos?.length || 0,
        equipos_count: horariosConInsumos[0].equipos?.length || 0
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

    // Cargar equipos del horario
    const [equipos] = await pool.execute(`
        SELECT 
          dre.equipo_id as id,
          e.nombre,
          e.marca,
          e.modelo,
          e.codigo,
          e.estado,
          dre.cantidad as cantidad_usada
        FROM detalle_reserva_equipos dre
        JOIN equipos e ON dre.equipo_id = e.id
        WHERE dre.reserva_id = ?
        ORDER BY e.nombre
      `, [id])

    const horarioConInsumos = {
      ...horario,
      insumos: insumos,
      equipos: equipos
    }

    console.log('📋 Horario encontrado:', {
      id: horarioConInsumos.id,
      laboratorio: horarioConInsumos.laboratorio,
      docente: horarioConInsumos.docente,
      grupo: horarioConInsumos.grupo,
      escuela: horarioConInsumos.escuela,
      ciclo: horarioConInsumos.ciclo,
      insumos_count: horarioConInsumos.insumos?.length || 0,
      equipos_count: horarioConInsumos.equipos?.length || 0
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

    const {
      laboratorio_id,
      docente_id,
      grupo_id,        // ← Para guardar
      descripcion,     // ← Descripción de la clase
      fecha_inicio,
      fecha_fin,
      cantidad_alumnos = 1, // ← Valor por defecto
      color = '#4ecdc4', // ← Color del horario
      insumos = [], // ← Array de insumos a usar
      equipos = [] // ← Array de equipos a usar
    } = req.body

    console.log('🔍 Datos recibidos:', {
      laboratorio_id, docente_id, grupo_id, descripcion, fecha_inicio, fecha_fin, cantidad_alumnos,
      insumos_count: insumos.length,
      equipos_count: equipos.length
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
    const grupoValidacion = await Horario.getGrupoValidacion(grupo_id)

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
      const stockSuficiente = await Inventario.validarSaldoByInsumoId(
        laboratorio_id,
        insumo.insumo_id,
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

    const reserva_id = await Horario.registroCreateHorario({
      laboratorio_id,
      docente_id,
      grupo_id,
      descripcion,
      fechaInicioMySQL,
      fechaFinMySQL,
      cantidad_alumnos,
      color
    }, insumos, equipos, connection)

    // Obtener información del laboratorio y registrar actividad
    const labInfo = await obtenerInfoLaboratorio(laboratorio_id)
    await Horario.registrarActividadHorario({
      accion: 'crear',
      reserva_id: reserva_id,
      descripcion: `Horario creado: "${descripcion}" | Lab: ${labInfo.laboratorio_nombre} | Docente: ${docenteInfo?.docente_nombre || 'N/A'} | Grupo: ${grupoInfo?.grupo_nombre || 'N/A'} | Escuela: ${grupoInfo?.escuela_nombre || 'N/A'} | ${new Date(fechaInicioMySQL).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} ${new Date(fechaInicioMySQL).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} - ${new Date(fechaFinMySQL).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} | ${cantidad_alumnos} alumnos`,
      usuario_id: req.user.userId,
      ip_address: req.ip || req.connection.remoteAddress
    })

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
      insumos_procesados: insumos.length,
      equipos_procesados: equipos.length
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

    const { id } = req.params
    const horarioId = parseInt(id, 10) // ← Convertir a número
    const {
      laboratorio_id,
      docente_id,
      grupo_id,        // ← Para guardar
      descripcion,     // ← Descripción de la clase
      fecha_inicio,
      fecha_fin,
      cantidad_alumnos = 1, // ← Valor por defecto
      color = '#4ecdc4', // ← Color del horario
      insumos = [], // ← Insumos actualizados
      equipos = [] // ← Equipos actualizados
    } = req.body

    console.log('🔍 Editando horario:', id)
    console.log('🔍 Datos recibidos:', {
      laboratorio_id, docente_id, grupo_id, descripcion, fecha_inicio, fecha_fin, cantidad_alumnos,
      insumos_count: insumos.length,
      equipos_count: equipos.length
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
      horarioId // Excluir la reserva que estamos editando
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
      const [existing] = await connection.execute('SELECT laboratorio_id FROM reservas WHERE id = ?', [horarioId])
      if (existing.length === 0 || !req.user.laboratorio_ids.includes(existing[0].laboratorio_id)) {
        await connection.rollback()
        return res.status(403).json({
          success: false,
          message: 'Solo puedes editar horarios de tus laboratorios'
        })
      }
    }

    // 5️⃣ ELIMINAR REGISTROS ANTIGUOS DE INSUMOS Y EQUIPOS
    await Horario.deleteHorarioInsumos(horarioId, connection)
    await Horario.deleteHorarioEquipos(horarioId, connection)

    // 6️⃣ VERIFICAR STOCK DE NUEVOS INSUMOS
    for (const insumo of insumos) {
      const stockSuficiente = await Inventario.validarSaldoByInsumoId(
        laboratorio_id,
        insumo.insumo_id,
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

    // 8️⃣ ACTUALIZAR DATOS BÁSICOS DEL HORARIO (ACTUALIZADO)
    await Horario.registroUpdateHorario({ horarioId, laboratorio_id, docente_id, grupo_id, descripcion, fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color }, insumos, equipos, connection)

    await connection.commit()

    // Obtener información del laboratorio y registrar actividad
    const labInfo = await obtenerInfoLaboratorio(laboratorio_id)
    await Horario.registrarActividadHorario({
      accion: 'editar',
      reserva_id: horarioId,
      descripcion: `Horario editado: "${descripcion}" | Lab: ${labInfo.laboratorio_nombre} | Docente: ${docenteInfo?.docente_nombre || 'N/A'} | Grupo: ${grupoInfo?.grupo_nombre || 'N/A'} | Escuela: ${grupoInfo?.escuela_nombre || 'N/A'} | ${new Date(fechaInicioMySQL).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} ${new Date(fechaInicioMySQL).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} - ${new Date(fechaFinMySQL).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} | ${cantidad_alumnos} alumnos`,
      usuario_id: req.user.userId,
      ip_address: req.ip || req.connection.remoteAddress
    })

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
      insumos_nuevos: insumos.length,
      equipos_anteriores: equiposActuales.length,
      equipos_nuevos: equipos.length
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
    const horarioId = parseInt(id, 10) // ← Convertir a número

    console.log('🔍 Eliminando horario ID:', horarioId)

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
      `, [horarioId])

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
      `, [horarioId])

    console.log('📦 Insumos a devolver:', insumosUsados.length)

    // 4️⃣ OBTENER EQUIPOS A DEVOLVER
    const [equiposUsados] = await connection.execute(`
        SELECT dre.equipo_id, dre.cantidad, e.nombre as equipo_nombre
        FROM detalle_reserva_equipos dre
        JOIN equipos e ON dre.equipo_id = e.id
        WHERE dre.reserva_id = ?
      `, [horarioId])

    console.log('🔧 Equipos a devolver:', equiposUsados.length)

    // 5️⃣ DEVOLVER TODOS LOS EQUIPOS
    for (const equipo of equiposUsados) {
      console.log(`🔄 Devolviendo ${equipo.cantidad} de ${equipo.equipo_nombre}`)

      // Devolver equipo (marcar como disponible)
      await Equipo.devolverEquipo(
        connection,
        equipo.equipo_id,
        horario.laboratorio_id,
        equipo.cantidad,
        req.user.userId,
        horarioId
      )
    }

    // 6️⃣ DEVOLVER STOCK DE TODOS LOS INSUMOS
    for (const insumo of insumosUsados) {
      console.log(`🔄 Devolviendo ${insumo.cantidad_usada} de ${insumo.insumo_nombre}`)

      // Devolver stock al inventario
      await connection.execute(`
          UPDATE inventario_insumos 
          SET cantidad = cantidad + ? 
          WHERE insumo_id = ? AND laboratorio_id = ?
        `, [insumo.cantidad_usada, insumo.insumo_id, horario.laboratorio_id])

      // Registrar movimiento de devolución con estructura correcta
      const [movimientoResult] = await connection.execute(`
          INSERT INTO movimientos_insumos 
          (laboratorio_id, usuario_id, tipo_movimiento, reserva_id, observaciones)
          VALUES (?, ?, 'entrada', ?, 'Devolución por eliminación de horario')
        `, [horario.laboratorio_id, req.user.userId, horarioId])

      const movimiento_id = movimientoResult.insertId

      // Registrar detalle de la devolución
      await connection.execute(`
          INSERT INTO movimiento_insumo_detalle 
          (movimiento_id, insumo_id, cantidad, lote)
          VALUES (?, ?, ?, 'DEVOLUCION-ELIMINACION')
        `, [movimiento_id, insumo.insumo_id, insumo.cantidad_usada])
    }

    // 7️⃣ ELIMINAR REGISTROS EN ORDEN
    // 1. Eliminar movimientos de insumos
    await connection.execute('DELETE FROM movimientos_insumos WHERE reserva_id = ?', [horarioId])
    console.log('✅ Movimientos de insumos eliminados')

    // 2. Eliminar movimientos de equipos
    await connection.execute('DELETE FROM movimientos_equipos WHERE reserva_id = ?', [horarioId])
    console.log('✅ Movimientos de equipos eliminados')

    // 3. Eliminar detalles de insumos
    await connection.execute('DELETE FROM detalle_reserva_insumos WHERE reserva_id = ?', [horarioId])
    console.log('✅ Detalles de insumos eliminados')

    // 4. Eliminar detalles de equipos
    await connection.execute('DELETE FROM detalle_reserva_equipos WHERE reserva_id = ?', [horarioId])
    console.log('✅ Detalles de equipos eliminados')

    // 5. Eliminar el horario/reserva
    await connection.execute('DELETE FROM reservas WHERE id = ?', [horarioId])
    console.log('✅ Horario eliminado')

    await connection.commit()

    // Registrar actividad (después del commit)
    await Horario.registrarActividadHorario({
      accion: 'eliminar',
      reserva_id: horarioId,
      descripcion: `Horario eliminado: "${horario.descripcion}" | Lab: ${horario.laboratorio_nombre || 'N/A'} | Docente: ${horario.docente_nombre || 'N/A'} | Grupo: ${horario.grupo_nombre || 'N/A'} | Escuela: ${horario.escuela_nombre || 'N/A'} | ${new Date(horario.fecha_inicio).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} ${new Date(horario.fecha_inicio).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} - ${new Date(horario.fecha_fin).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} | ${horario.cantidad_alumnos} alumnos`,
      usuario_id: req.user.userId,
      ip_address: req.ip || req.connection.remoteAddress
    })

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
      insumos_devueltos: insumosUsados.length,
      equipos_devueltos: equiposUsados.length
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
    const { laboratorio_id, docente_id, fecha_inicio, fecha_fin, horario_id } = req.body

    console.log('🔍 Verificando disponibilidad:', {
      laboratorio_id,
      docente_id,
      fecha_inicio,
      fecha_fin,
      horario_id,
      horario_id_type: typeof horario_id
    })

    const connection = await pool.getConnection()
    const cruce = await verificarCruceHorarios(
      connection,
      laboratorio_id,
      docente_id,
      fecha_inicio,
      fecha_fin,
      horario_id // ← Pasar el horario_id para excluirlo
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

// 📅 OBTENER CICLOS DISPONIBLES  
export const getCiclos = async (req, res) => {
  try {
    const [ciclos] = await pool.execute(`
      SELECT id, nombre,
             CAST(SUBSTRING_INDEX(nombre, ' ', -1) AS UNSIGNED) as numero_ciclo
      FROM ciclos 
      ORDER BY numero_ciclo ASC
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

// 🕐 ENDPOINT PARA DIAGNOSTICAR ZONA HORARIA
export const diagnosticarZonaHoraria = async (req, res) => {
  try {
    const ahora = new Date()
    const fechaUTC = new Date().toISOString()
    const fechaLocal = ahora.toLocaleString()
    const offsetMinutos = ahora.getTimezoneOffset()

    // Información detallada de zona horaria
    const diagnostico = {
      servidor: {
        timezone_env: process.env.TZ || 'No configurado',
        fecha_utc: fechaUTC,
        fecha_local: fechaLocal,
        offset_minutos: offsetMinutos,
        offset_horas: offsetMinutos / -60,
        timestamp_unix: ahora.getTime()
      },
      prueba_conversion: {
        input_ejemplo: '2024-01-15 07:30:00',
        output_mysql: convertirFechaParaMySQL('2024-01-15 07:30:00')
      },
      fecha_sistema: {
        year: ahora.getFullYear(),
        month: ahora.getMonth() + 1,
        day: ahora.getDate(),
        hours: ahora.getHours(),
        minutes: ahora.getMinutes(),
        seconds: ahora.getSeconds()
      }
    }

    console.log('🕐 Diagnóstico de zona horaria:', diagnostico)

    res.json({
      success: true,
      data: diagnostico
    })
  } catch (error) {
    console.error('Error en diagnosticarZonaHoraria:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// 🏢 FUNCIÓN AUXILIAR PARA OBTENER INFORMACIÓN DEL LABORATORIO
const obtenerInfoLaboratorio = async (laboratorio_id) => {
  try {
    const [labInfo] = await pool.execute(`
      SELECT nombre as laboratorio_nombre, ubicacion as laboratorio_ubicacion
      FROM laboratorios 
      WHERE id = ?
    `, [laboratorio_id])

    return labInfo.length > 0 ? labInfo[0] : { laboratorio_nombre: 'Lab Desconocido', laboratorio_ubicacion: 'N/A' }
  } catch (error) {
    console.error('Error obteniendo info laboratorio:', error)
    return { laboratorio_nombre: 'Error Lab', laboratorio_ubicacion: 'N/A' }
  }
}

// Cerrar horario y registrar consumo de insumos
export const cerrarHorario = async (req, res) => {
  const connection = await pool.getConnection()

  try {
    const { laboratorio_id, tipo_movimiento, fecha_movimiento, observaciones, reserva_id, detalles } = req.body

    // Validaciones básicas
    if (!laboratorio_id) {
      return res.status(400).json({
        success: false,
        message: 'El laboratorio_id es requerido'
      })
    }

    if (!tipo_movimiento || !['entrada', 'salida'].includes(tipo_movimiento)) {
      return res.status(400).json({
        success: false,
        message: 'El tipo_movimiento debe ser "entrada" o "salida"'
      })
    }

    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Los detalles del movimiento son requeridos'
      })
    }
    // Obtener datos del horario
    const [horarios] = await connection.execute(
      'SELECT * FROM reservas WHERE id = ?',
      [reserva_id]
    )

    if (horarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      })
    }

    const estadoHorario = await Horario.estadoHorario(reserva_id);

    if (estadoHorario) {
      return res.status(404).json({
        success: false,
        message: 'El Horario está cerrado'
      })
    }

    //Cerrar horario
    await Horario.cerrarHorario(reserva_id, connection);

    //Registrar salida de inventario
    const movimientoId = await Inventario.registrarMovimientoManual(connection, req.user.userId, fecha_movimiento, laboratorio_id, tipo_movimiento, observaciones, reserva_id, detalles);

    //Respuesta
    res.status(200).json({
      success: true,
      message: `Horario cerrado correctamente`,
      movimiento_id: movimientoId
    })

  } catch (error) {
    console.error('❌ Error al cerrar horario:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Error al cerrar el horario'
    })
  } finally {
    connection.release()
  }
}
