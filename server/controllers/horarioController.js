import { pool } from '../config/database.js'
import { convertirFechaParaMySQL } from '../utils/utils.js'
import { Horario } from '../models/Horario.js'
import { Inventario } from '../models/Inventario.js'
import { Laboratorio } from '../models/Laboratorio.js'
import { Grupo } from '../models/Grupo.js'



// 🚫 FUNCIÓN PARA VERIFICAR CRUCES DE HORARIOS
const verificarCruceHorarios = async (connection, laboratorio_id, docente_id, fecha_inicio, fecha_fin, reserva_id = null) => {

  // ✅ CONVERTIR FECHAS A FORMATO MYSQL
  const fechaInicioMySQL = convertirFechaParaMySQL(fecha_inicio)
  const fechaFinMySQL = convertirFechaParaMySQL(fecha_fin)

  //Verificar cruce de Laboratorios
  const cruceLabRows = await Horario.getCruceLab(
    laboratorio_id, reserva_id,
    fechaInicioMySQL, fechaFinMySQL
  )

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

    const rows = await Horario.getActividadHorarios(req.user.rol, req.user.laboratorio_ids, laboratorio_id, fecha_inicio, fecha_fin, accion, usuario_id)

    // Mantener las fechas como están (la conversión se hará en el frontend)
    const rowsWithTimeZone = rows.map(row => ({
      ...row,
      // Asegurar que la fecha esté en formato ISO string
      fecha_actividad: new Date(row.fecha_actividad).toISOString()
    }))

    res.status(200).json({
      success: true,
      data: rowsWithTimeZone,
      total: rows.length
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getHorarios = async (req, res) => {
  try {

    const horarios = await Horario.getAllHorarios(req.user.rol, req.user.laboratorio_ids)

    res.status(200).json({
      success: true,
      data: horarios
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// Obtener un horario específico por ID
export const getHorario = async (req, res) => {
  try {
    const { id } = req.params

    const horario = await Horario.getHorarioById(id)

    if (!horario) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado o sin permisos para verlo'
      })
    }

    // 🔍 OBTENER INSUMOS DEL HORARIO
    const insumos = await Horario.getInsumosRequeridosByHorario(id)

    // Cargar equipos del horario
    const equipos = await Horario.getEquiposRequeridosByHorario(id)

    const horarioConInsumos = {
      ...horario,
      insumos: insumos,
      equipos: equipos
    }

    res.status(200).json({
      success: true,
      data: horarioConInsumos
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
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

    // ✅ VALIDACIÓN 1: Verificar que el grupo existe y obtener su información
    const grupoInfo = await Grupo.getGrupoById(grupo_id)

    if (!grupoInfo) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: 'El grupo seleccionado no existe'
      })
    }


    // ✅ VALIDACIÓN 2: Verificar que el docente existe (sin restricción de escuela)
    const docenteInfo = await Docente.getById(docente_id)

    if (!docenteInfo) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: 'Docente no encontrado'
      })
    }

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
    const labInfo = await Laboratorio.getLaboratorioById(laboratorio_id)
    await Horario.registrarActividadHorario({
      accion: 'crear',
      reserva_id: reserva_id,
      descripcion: `Horario creado: "${descripcion}" | Lab: ${labInfo.nombre} | Docente: ${docenteInfo?.docente_nombre || 'N/A'} | Grupo: ${grupoInfo?.grupo_nombre || 'N/A'} | Escuela: ${grupoInfo?.escuela_nombre || 'N/A'} | ${new Date(fechaInicioMySQL).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} ${new Date(fechaInicioMySQL).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} - ${new Date(fechaFinMySQL).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} | ${cantidad_alumnos} alumnos`,
      usuario_id: req.user.userId,
      ip_address: req.ip || req.connection.remoteAddress
    })

    res.status(201).json({
      success: true,
      message: 'Horario creado correctamente',
      data: {
        reserva_id: reserva_id,
        insumos_procesados: insumos.length,
        equipos_procesados: equipos.length
      }
    })

  } catch (error) {
    await connection.rollback()
    res.status(500).json({
      success: false,
      message: error.message
    })
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

    // ✅ VALIDACIÓN 1: Verificar que el grupo existe y obtener su información
    const grupoInfo = await Grupo.getGrupoById(grupo_id)

    if (!grupoInfo) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: 'El grupo seleccionado no existe'
      })
    }

    // ✅ VALIDACIÓN 2: Verificar que el docente existe (sin restricción de escuela)
    const docenteInfo = await Docente.getById(docente_id)

    if (!docenteInfo) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: 'Docente no encontrado'
      })
    }

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
    const labInfo = await Laboratorio.getLaboratorioById(laboratorio_id)
    await Horario.registrarActividadHorario({
      accion: 'editar',
      reserva_id: horarioId,
      descripcion: `Horario editado: "${descripcion}" | Lab: ${labInfo.nombre} | Docente: ${docenteInfo?.docente_nombre || 'N/A'} | Grupo: ${grupoInfo?.grupo_nombre || 'N/A'} | Escuela: ${grupoInfo?.escuela_nombre || 'N/A'} | ${new Date(fechaInicioMySQL).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} ${new Date(fechaInicioMySQL).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} - ${new Date(fechaFinMySQL).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} | ${cantidad_alumnos} alumnos`,
      usuario_id: req.user.userId,
      ip_address: req.ip || req.connection.remoteAddress
    })

    res.status(200).json({
      success: true,
      message: 'Horario actualizado correctamente',
      validaciones: {
        escuela: grupoInfo.escuela,
        ciclo: grupoInfo.ciclo,
        grupo: grupoInfo.grupo,
        docente: docenteInfo.nombre
      },
      insumos_anteriores: insumosActuales.length,
      insumos_nuevos: insumos.length,
      equipos_anteriores: equiposActuales.length,
      equipos_nuevos: equipos.length
    })

  } catch (error) {
    await connection.rollback()
    res.status(500).json({
      success: false,
      message: error.message
    })
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

    const horarioExists = await Horario.exitsById(horarioId)
    if (!horarioExists) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      })
    }
    // 1️⃣ OBTENER INFORMACIÓN COMPLETA DEL HORARIO
    const horario = await Horario.getHorarioById(horarioId)

    if (horario.estado === 'C') {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: 'Horario cerrado, no se puede eliminar'
      })
    }

    // 2️⃣ ELIMINAR REGISTROS RELACIONADOS
    await Horario.deleteHorarioInsumos(horarioId, connection)
    await Horario.deleteHorarioEquipos(horarioId, connection)

    // 3️⃣ ELIMINAR EL HORARIO/RESERVA
    await Horario.deleteHorario(horarioId, connection)

    await connection.commit()

    // Registrar actividad (después del commit)
    await Horario.registrarActividadHorario({
      accion: 'eliminar',
      reserva_id: horarioId,
      descripcion: `Horario eliminado: "${horario.descripcion}" | Lab: ${horario.laboratorio_nombre || 'N/A'} | Docente: ${horario.docente_nombre || 'N/A'} | Grupo: ${horario.grupo_nombre || 'N/A'} | Escuela: ${horario.escuela_nombre || 'N/A'} | ${new Date(horario.fecha_inicio).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} ${new Date(horario.fecha_inicio).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} - ${new Date(horario.fecha_fin).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} | ${horario.cantidad_alumnos} alumnos`,
      usuario_id: req.user.userId,
      ip_address: req.ip || req.connection.remoteAddress
    })

    res.status(200).json({
      success: true,
      message: 'Horario eliminado correctamente',
      data: {
        id: horario.id
      }
    })

  } catch (error) {
    await connection.rollback()
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
    res.status(500).json({
      success: false,
      message: error.message
    })
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
    const horarioExists = await Horario.exitsById(reserva_id)

    if (!horarioExists) {
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
      message: 'Horario cerrado correctamente',
      data: {
        movimiento_id: movimientoId
      }
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al cerrar el horario'
    })
  } finally {
    connection.release()
  }
}
