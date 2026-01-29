import { pool } from '../config/database.js'
import { convertirFechaParaMySQL } from '../utils/utils.js'
import { Horario } from '../models/Horario.js'
import { Inventario } from '../models/Inventario.js'
import { Laboratorio } from '../models/Laboratorio.js'
import { Escuela } from '../models/Escuela.js'
import { Ciclo } from '../models/Ciclo.js'
import { Docente } from '../models/Docente.js'

// Función para verificar cruces de horarios
const verificarCruceHorarios = async (connection, laboratorio_id, docente_id, fecha_inicio, fecha_fin, reserva_id = null) => {
  // Convertir fechas a formato MySQL
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
    // Los parámetros ya están validados y transformados por el middleware de validación
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
    console.error('Error al obtener actividad de horarios:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
export const getHorarios = async (req, res) => {
  try {
    const { laboratorio_id, escuela_id, docente_id, ciclo_id, fecha_inicio, fecha_fin, estado } = req.query

    // Convertir los parámetros al tipo correcto si existen
    const filters = {
      laboratorio_id: laboratorio_id ? parseInt(laboratorio_id) : undefined,
      escuela_id: escuela_id ? parseInt(escuela_id) : undefined,
      docente_id: docente_id ? parseInt(docente_id) : undefined,
      ciclo_id: ciclo_id ? parseInt(ciclo_id) : undefined,
      fecha_inicio,
      fecha_fin,
      estado
    }

    // Validación: Verificar rango máximo de 30 días
    if (fecha_inicio && fecha_fin) {
      const start = new Date(fecha_inicio)
      const end = new Date(fecha_fin)
      const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 3600 * 24))

      if (diffDays > 60) {
        return res.status(400).json({
          success: false,
          message: 'El rango máximo permitido es de 60 días'
        })
      }

      if (diffDays < 0) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio debe ser anterior a la fecha de fin'
        })
      }
    }

    const horarios = await Horario.getAllHorarios(req.user.rol, req.user.laboratorio_ids, filters)
    
    res.status(200).json({
      success: true,
      data: horarios
    })
  } catch (error) {
    console.error('Error al obtener horarios:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
// Obtener un horario específico por ID
export const getHorario = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: horarioId } = req.params
    const horario = await Horario.getHorarioById(horarioId)
    if (!horario) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado o sin permisos para verlo'
      })
    }
    // 🔍 OBTENER INSUMOS DEL HORARIO
    const insumos = await Horario.getInsumosRequeridosByHorario(horarioId)
    // Cargar equipos del horario
    const equipos = await Horario.getEquiposRequeridosByHorario(horarioId)
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
    console.error('Error al obtener horario:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
export const createHorario = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    // Los datos ya están validados y transformados por el middleware de validación
    const {
      laboratorio_id,
      docente_id,
      escuela_id,
      ciclo_id,
      descripcion,
      fecha_inicio,
      fecha_fin,
      cantidad_alumnos,
      color = '#4ecdc4',
      insumos = [],
      equipos = []
    } = req.body

    // Convertir fechas a formato MySQL
    const fechaInicioMySQL = convertirFechaParaMySQL(fecha_inicio)
    const fechaFinMySQL = convertirFechaParaMySQL(fecha_fin)

    // Validación de negocio: Verificar que la escuela existe
    const escuelaInfo = await Escuela.getById(escuela_id)
    if (!escuelaInfo) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'La escuela seleccionada no existe'
      })
    }

    // Validación de negocio: Verificar que el ciclo existe
    const cicloInfo = await Ciclo.getById(ciclo_id)
    if (!cicloInfo) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'El ciclo seleccionado no existe'
      })
    }
    // Validación de negocio: Verificar que el docente existe (sin restricción de escuela)
    const docenteInfo = await Docente.getById(docente_id)
    if (!docenteInfo) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'Docente no encontrado'
      })
    }
    // Verificación: Verificar cruces antes de crear
    const cruce = await verificarCruceHorarios(
      connection,
      laboratorio_id,
      docente_id,
      fecha_inicio,
      fecha_fin
    )
    if (cruce) {
      await connection.rollback()
      return res.status(409).json({
        message: `Conflicto de horario: ${cruce.mensaje}`,
        tipo_conflicto: cruce.tipo,
        conflicto_detalle: cruce.conflicto
      })
    }

    const reserva_id = await Horario.registroCreateHorario({
      laboratorio_id,
      docente_id,
      escuela_id,
      ciclo_id,
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
      descripcion: `Horario creado: "${descripcion}" | Lab: ${labInfo.nombre} | Docente: ${docenteInfo?.docente_nombre || 'N/A'} | Escuela: ${escuelaInfo?.nombre || 'N/A'} | Ciclo: ${cicloInfo?.nombre || 'N/A'} | ${new Date(fechaInicioMySQL).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} ${new Date(fechaInicioMySQL).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} - ${new Date(fechaFinMySQL).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} | ${cantidad_alumnos} alumnos`,
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
    console.error('Error al crear horario:', error)
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
    // El ID ya está validado y transformado por el middleware de validación
    const { id: horarioId } = req.params
    const {
      laboratorio_id,
      docente_id,
      escuela_id,
      ciclo_id,
      descripcion,
      fecha_inicio,
      fecha_fin,
      cantidad_alumnos = 1,
      color = '#4ecdc4',
      insumos = [],
      equipos = []
    } = req.body

    // Convertir fechas a formato MySQL
    const fechaInicioMySQL = convertirFechaParaMySQL(fecha_inicio)
    const fechaFinMySQL = convertirFechaParaMySQL(fecha_fin)

    // Validación de negocio: Verificar que la escuela existe
    const escuelaInfo = await Escuela.getById(escuela_id)
    if (!escuelaInfo) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'La escuela seleccionada no existe'
      })
    }

    // Validación de negocio: Verificar que el ciclo existe
    const cicloInfo = await Ciclo.getById(ciclo_id)
    if (!cicloInfo) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'El ciclo seleccionado no existe'
      })
    }
    // Validación de negocio: Verificar que el docente existe (sin restricción de escuela)
    const docenteInfo = await Docente.getById(docente_id)
    if (!docenteInfo) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'Docente no encontrado'
      })
    }
    // Verificación: Verificar cruces (excluyendo la reserva actual)
    const cruce = await verificarCruceHorarios(
      connection,
      laboratorio_id,
      docente_id,
      fecha_inicio,
      fecha_fin,
      horarioId
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
    // Validación de negocio: Obtener datos del horario
    const horarioExists = await Horario.exitsById(horarioId)
    if (!horarioExists) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      })
    }
    // Eliminar registros antiguos de insumos y equipos
    await Horario.deleteHorarioInsumos(horarioId, connection)
    await Horario.deleteHorarioEquipos(horarioId, connection)

    // Actualizar datos básicos del horario
    await Horario.registroUpdateHorario({ reserva_id: horarioId, laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color }, insumos, equipos, connection)
    await connection.commit()
    // Obtener información del laboratorio y registrar actividad
    const labInfo = await Laboratorio.getLaboratorioById(laboratorio_id)
    await Horario.registrarActividadHorario({
      accion: 'editar',
      reserva_id: horarioId,
      descripcion: `Horario editado: "${descripcion}" | Lab: ${labInfo.nombre} | Docente: ${docenteInfo?.docente_nombre || 'N/A'} | Escuela: ${escuelaInfo?.nombre || 'N/A'} | Ciclo: ${cicloInfo?.nombre || 'N/A'} | ${new Date(fechaInicioMySQL).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} ${new Date(fechaInicioMySQL).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} - ${new Date(fechaFinMySQL).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} | ${cantidad_alumnos} alumnos`,
      usuario_id: req.user.userId,
      ip_address: req.ip || req.connection.remoteAddress
    })
    res.status(200).json({
      success: true,
      message: 'Horario actualizado correctamente',
      validaciones: {
        escuela: escuelaInfo.nombre,
        ciclo: cicloInfo.nombre,
        docente: docenteInfo.nombre
      },
      insumos_nuevos: insumos.length,
      equipos_nuevos: equipos.length
    })
  } catch (error) {
    console.error('Error al actualizar horario:', error)
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
    // El ID ya está validado y transformado por el middleware de validación
    const { id: horarioId } = req.params

    // Validación de negocio: Verificar que el horario existe
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
      return res.status(409).json({
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
      descripcion: `Horario eliminado: "${horario.descripcion}" | Lab: ${horario.laboratorio || 'N/A'} | Docente: ${horario.docente || 'N/A'} | Escuela: ${horario.escuela || 'N/A'} | Ciclo: ${horario.ciclo || 'N/A'} | ${new Date(horario.fecha_inicio).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} ${new Date(horario.fecha_inicio).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} - ${new Date(horario.fecha_fin).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} | ${horario.cantidad_alumnos} alumnos`,
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
    console.error('Error al eliminar horario:', error)
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
  const connection = await pool.getConnection()
  try {
    // Los datos ya están validados y transformados por el middleware de validación
    const { laboratorio_id, docente_id, fecha_inicio, fecha_fin, horario_id } = req.body

    const cruce = await verificarCruceHorarios(
      connection,
      laboratorio_id,
      docente_id,
      fecha_inicio,
      fecha_fin,
      horario_id // ← Pasar el horario_id para excluirlo
    )

    if (cruce) {
      res.status(200).json({
        success: true,
        disponible: false,
        motivo: cruce.mensaje,
        tipo_conflicto: cruce.tipo,
        conflicto_detalle: cruce.conflicto
      })
    } else {
      res.status(200).json({
        success: true,
        disponible: true,
        mensaje: 'Horario disponible - sin conflictos'
      })
    }
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  } finally {
    connection.release()
  }
}
// Cerrar horario y registrar consumo de insumos
export const cerrarHorarioConInsumos = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    // Los datos ya están validados y transformados por el middleware de validación
    const { laboratorio_id, tipo_movimiento, fecha_movimiento, observaciones, reserva_id, detalles } = req.body

    // Validación de negocio: Obtener datos del horario
    const horarioExists = await Horario.exitsById(reserva_id)
    if (!horarioExists) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      })
    }
    const estadoHorario = await Horario.estadoHorario(reserva_id)
    if (estadoHorario) {
      await connection.rollback()
      return res.status(409).json({
        success: false,
        message: 'El Horario está cerrado'
      })
    }
    //Cerrar horario
    await Horario.cerrarHorario(reserva_id, connection)
    //Registrar salida de inventario (esta función maneja su propia transacción, pero usamos la misma connection)
    // Nota: registrarMovimientoManual inicia su propia transacción, así que necesitamos usar sus métodos internos
    const movimientoId = await Inventario.insertarMovimiento(connection, req.user.userId, fecha_movimiento, laboratorio_id, tipo_movimiento, reserva_id, observaciones)
    await Inventario.procesarDetallesMovimiento(connection, movimientoId, tipo_movimiento, detalles)
    await connection.commit()
    res.status(200).json({
      success: true,
      message: 'Horario cerrado correctamente',
      data: {
        movimiento_id: movimientoId
      }
    })
  } catch (error) {
    await connection.rollback()
    console.error('Error al cerrar horario:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Error al cerrar el horario'
    })
  } finally {
    connection.release()
  }
}

export const cerrarHorario = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    // El ID ya está validado y transformado por el middleware de validación
    const { id: reserva_id } = req.params

    // Validación de negocio: Obtener datos del horario
    const horarioExists = await Horario.exitsById(reserva_id)
    if (!horarioExists) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      })
    }
    const estadoHorario = await Horario.estadoHorario(reserva_id)
    if (estadoHorario) {
      await connection.rollback()
      return res.status(409).json({
        success: false,
        message: 'El Horario ya se encuentra cerrado'
      })
    }
    //Cerrar horario
    await Horario.cerrarHorario(reserva_id, connection)
    await connection.commit()
    res.status(200).json({
      success: true,
      message:  'Horario cerrado correctamente'
    })
  } catch (error) {
    await connection.rollback()
    console.error('Error al cerrar horario:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Error al cerrar el horario'
    })
  } finally {
    connection.release()
  }
}

// Obtener insumos requeridos por horario
export const getInsumosRequeridosById = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: horarioId } = req.params
    const insumos = await Horario.getInsumosRequeridosById(horarioId)
    res.status(200).json({
      success: true,
      data: insumos
    })
  } catch (error) {
    console.error('Error al obtener insumos requeridos:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}