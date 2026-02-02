import { pool } from '../config/database.js'
import { Horario } from '../models/Horario.js'
import { Escuela } from '../models/Escuela.js'
import { Ciclo } from '../models/Ciclo.js'
import { Docente } from '../models/Docente.js'
import { Laboratorio } from '../models/Laboratorio.js'
import { Inventario } from '../models/Inventario.js'
import { convertirFechaParaMySQL } from '../utils/utils.js'
import { AppError } from '../utils/errors.js'

async function verificarCruceHorarios(laboratorio_id, docente_id, fecha_inicio, fecha_fin, reserva_id = null) {
  const fechaInicioMySQL = convertirFechaParaMySQL(fecha_inicio)
  const fechaFinMySQL = convertirFechaParaMySQL(fecha_fin)
  const cruceLabRows = await Horario.getCruceLab(laboratorio_id, reserva_id, fechaInicioMySQL, fechaFinMySQL)
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
  const cruceDocenteRows = await Horario.getCruceDocente(docente_id, reserva_id, fechaInicioMySQL, fechaFinMySQL)
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
  return null
}

export const horarioService = {
  validarRangoFechas(fecha_inicio, fecha_fin) {
    if (!fecha_inicio || !fecha_fin) return
    const start = new Date(fecha_inicio)
    const end = new Date(fecha_fin)
    const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 3600 * 24))
    if (diffDays > 60) throw new AppError('El rango máximo permitido es de 60 días', 400)
    if (diffDays < 0) throw new AppError('La fecha de inicio debe ser anterior a la fecha de fin', 400)
  },

  async crearReserva(datos, insumos, equipos, usuario_id, ip_address) {
    const { laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fecha_inicio, fecha_fin, cantidad_alumnos, color } = datos
    const escuelaInfo = await Escuela.getById(escuela_id)
    if (!escuelaInfo) throw new AppError('La escuela seleccionada no existe', 404)
    const cicloInfo = await Ciclo.getById(ciclo_id)
    if (!cicloInfo) throw new AppError('El ciclo seleccionado no existe', 404)
    const docenteInfo = await Docente.getById(docente_id)
    if (!docenteInfo) throw new AppError('Docente no encontrado', 404)
    const cruce = await verificarCruceHorarios(laboratorio_id, docente_id, fecha_inicio, fecha_fin, null)
    if (cruce) {
      const err = new AppError(`Conflicto de horario: ${cruce.mensaje}`, 409)
      err.tipo_conflicto = cruce.tipo
      err.conflicto_detalle = cruce.conflicto
      throw err
    }

    const fechaInicioMySQL = convertirFechaParaMySQL(fecha_inicio)
    const fechaFinMySQL = convertirFechaParaMySQL(fecha_fin)
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const reserva_id = await Horario.createHorario(
        laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion,
        fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color, connection
      )
      if (insumos && insumos.length > 0) {
        await Horario.createHorarioInsumos(reserva_id, insumos, connection)
      }
      if (equipos && equipos.length > 0) {
        await Horario.createHorarioEquipos(reserva_id, equipos, connection)
      }
      const labInfo = await Laboratorio.getLaboratorioById(laboratorio_id)
      await Horario.registrarActividadHorario({
        accion: 'crear',
        reserva_id,
        descripcion: `Horario creado: "${descripcion}" | Lab: ${labInfo?.nombre || 'N/A'} | Docente: ${docenteInfo?.nombre || 'N/A'} | Escuela: ${escuelaInfo?.nombre || 'N/A'} | Ciclo: ${cicloInfo?.nombre || 'N/A'} | ${new Date(fechaInicioMySQL).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} ${new Date(fechaInicioMySQL).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} - ${new Date(fechaFinMySQL).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} | ${cantidad_alumnos} alumnos`,
        usuario_id,
        ip_address
      }, connection)
      await connection.commit()
      return { reserva_id, insumos_procesados: insumos?.length || 0, equipos_procesados: equipos?.length || 0 }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  async actualizarReserva(horarioId, datos, insumos, equipos, usuario_id, ip_address) {
    const { laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fecha_inicio, fecha_fin, cantidad_alumnos = 1, color = '#4ecdc4' } = datos
    const escuelaInfo = await Escuela.getById(escuela_id)
    if (!escuelaInfo) throw new AppError('La escuela seleccionada no existe', 404)
    const cicloInfo = await Ciclo.getById(ciclo_id)
    if (!cicloInfo) throw new AppError('El ciclo seleccionado no existe', 404)
    const docenteInfo = await Docente.getById(docente_id)
    if (!docenteInfo) throw new AppError('Docente no encontrado', 404)
    const cruce = await verificarCruceHorarios(laboratorio_id, docente_id, fecha_inicio, fecha_fin, horarioId)
    if (cruce) {
      const err = new AppError(`Conflicto de horario: ${cruce.mensaje}`, 409)
      err.tipo_conflicto = cruce.tipo
      err.conflicto_detalle = cruce.conflicto
      throw err
    }
    const horarioExists = await Horario.exitsById(horarioId)
    if (!horarioExists) throw new AppError('Horario no encontrado', 404)
    const horario = await Horario.getHorarioById(horarioId)
    if (horario?.estado === 'C') throw new AppError('Horario cerrado, no se puede editar', 409)

    const fechaInicioMySQL = convertirFechaParaMySQL(fecha_inicio)
    const fechaFinMySQL = convertirFechaParaMySQL(fecha_fin)
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      await Horario.deleteHorarioInsumos(horarioId, connection)
      await Horario.deleteHorarioEquipos(horarioId, connection)
      await Horario.updateHorario(
        laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion,
        fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color, horarioId, connection
      )
      if (insumos && insumos.length > 0) {
        await Horario.createHorarioInsumos(horarioId, insumos, connection)
      }
      if (equipos && equipos.length > 0) {
        await Horario.createHorarioEquipos(horarioId, equipos, connection)
      }
      const labInfo = await Laboratorio.getLaboratorioById(laboratorio_id)
      await Horario.registrarActividadHorario({
        accion: 'editar',
        reserva_id: horarioId,
        descripcion: `Horario editado: "${descripcion}" | Lab: ${labInfo?.nombre || 'N/A'} | Docente: ${docenteInfo?.nombre || 'N/A'} | Escuela: ${escuelaInfo?.nombre || 'N/A'} | Ciclo: ${cicloInfo?.nombre || 'N/A'} | ${new Date(fechaInicioMySQL).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} ${new Date(fechaInicioMySQL).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} - ${new Date(fechaFinMySQL).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} | ${cantidad_alumnos} alumnos`,
        usuario_id,
        ip_address
      }, connection)
      await connection.commit()
      return { escuela: escuelaInfo.nombre, ciclo: cicloInfo.nombre, docente: docenteInfo.nombre, insumos_nuevos: insumos?.length || 0, equipos_nuevos: equipos?.length || 0 }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  async eliminarReserva(horarioId, usuario_id, ip_address) {
    const horarioExists = await Horario.exitsById(horarioId)
    if (!horarioExists) throw new AppError('Horario no encontrado', 404)
    const horario = await Horario.getHorarioById(horarioId)
    if (horario?.estado === 'C') throw new AppError('Horario cerrado, no se puede eliminar', 409)

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      await Horario.deleteHorarioInsumos(horarioId, connection)
      await Horario.deleteHorarioEquipos(horarioId, connection)
      await Horario.deleteHorario(horarioId, connection)
      await Horario.registrarActividadHorario({
        accion: 'eliminar',
        reserva_id: horarioId,
        descripcion: `Horario eliminado: "${horario?.descripcion}" | Lab: ${horario?.laboratorio || 'N/A'} | Docente: ${horario?.docente || 'N/A'} | Escuela: ${horario?.escuela || 'N/A'} | Ciclo: ${horario?.ciclo || 'N/A'} | ${new Date(horario?.fecha_inicio).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} ${new Date(horario?.fecha_inicio).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} - ${new Date(horario?.fecha_fin).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} | ${horario?.cantidad_alumnos} alumnos`,
        usuario_id,
        ip_address
      }, connection)
      await connection.commit()
      return { id: horario?.id }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  async verificarDisponibilidad(laboratorio_id, docente_id, fecha_inicio, fecha_fin, horario_id = null) {
    const cruce = await verificarCruceHorarios(laboratorio_id, docente_id, fecha_inicio, fecha_fin, horario_id)
    if (cruce) {
      return { disponible: false, motivo: cruce.mensaje, tipo_conflicto: cruce.tipo, conflicto_detalle: cruce.conflicto }
    }
    return { disponible: true, mensaje: 'Horario disponible - sin conflictos' }
  },

  async cerrarHorario(reserva_id, usuario_id, ip_address) {
    const horarioExists = await Horario.exitsById(reserva_id)
    if (!horarioExists) throw new AppError('Horario no encontrado', 404)
    const yaCerrado = await Horario.estadoHorario(reserva_id)
    if (yaCerrado) throw new AppError('El Horario ya se encuentra cerrado', 409)

    // Obtener información del horario
    const horario = await Horario.getHorarioById(reserva_id)

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      await Horario.cerrarHorario(reserva_id, connection)
      await Horario.registrarActividadHorario({
        accion: 'cerrar',
        reserva_id: reserva_id,
        descripcion: `Horario cerrado: "${horario?.descripcion}" | Lab: ${horario?.laboratorio || 'N/A'} | Docente: ${horario?.docente || 'N/A'} | Escuela: ${horario?.escuela || 'N/A'} | Ciclo: ${horario?.ciclo || 'N/A'} | ${new Date(horario?.fecha_inicio).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} ${new Date(horario?.fecha_inicio).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} - ${new Date(horario?.fecha_fin).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} | ${horario?.cantidad_alumnos} alumnos`,
        usuario_id,
        ip_address
      }, connection)
      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  async cerrarHorarioConInsumos(reserva_id, laboratorio_id, tipo_movimiento, fecha_movimiento, detalles, observaciones, usuario_id, ip_address) {
    const horarioExists = await Horario.exitsById(reserva_id)
    if (!horarioExists) throw new AppError('Horario no encontrado', 404)
    const yaCerrado = await Horario.estadoHorario(reserva_id)
    if (yaCerrado) throw new AppError('El Horario está cerrado', 409)

    // Obtener información del horario
    const horario = await Horario.getHorarioById(reserva_id)

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      await Horario.cerrarHorario(reserva_id, connection)
      const movimientoId = await Inventario.insertarMovimiento(connection, usuario_id, fecha_movimiento, laboratorio_id, tipo_movimiento, reserva_id, observaciones)
      await Inventario.procesarDetallesMovimiento(connection, movimientoId, tipo_movimiento, detalles)
      
      // Marcar que tiene consumo de insumos
      await connection.execute(
        'UPDATE reservas SET tiene_consumo_insumos = 1 WHERE id = ?',
        [reserva_id]
      )
      await Horario.registrarActividadHorario({
        accion: 'cerrar',
        reserva_id: reserva_id,
        descripcion: `Horario cerrado con consumo de insumos: "${horario?.descripcion}" | Lab: ${horario?.laboratorio || 'N/A'} | Docente: ${horario?.docente || 'N/A'} | Escuela: ${horario?.escuela || 'N/A'} | Ciclo: ${horario?.ciclo || 'N/A'} | ${new Date(horario?.fecha_inicio).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} ${new Date(horario?.fecha_inicio).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} - ${new Date(horario?.fecha_fin).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} | ${horario?.cantidad_alumnos} alumnos | Movimiento ID: ${movimientoId}`,
        usuario_id,
        ip_address
      }, connection)
      await connection.commit()
      return { movimiento_id: movimientoId }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  async reabrirHorario(reserva_id, usuario_id, ip_address) {
    const horarioExists = await Horario.exitsById(reserva_id)
    if (!horarioExists) throw new AppError('Horario no encontrado', 404)
    const estaCerrado = await Horario.estadoHorario(reserva_id)
    if (!estaCerrado) throw new AppError('El horario no está cerrado', 409)

    // Verificar si tiene movimiento asociado
    const movimiento = await Horario.getMovimientoByReservaId(reserva_id)
    
    // Obtener información del horario
    const horario = await Horario.getHorarioById(reserva_id)

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      
      // Si tiene movimiento, eliminarlo (esto revierte los saldos automáticamente)
      if (movimiento) {
        await Inventario.eliminarMovimientoInventario(connection, movimiento.id)
        // Desmarcar que tiene consumo de insumos
        await connection.execute(
          'UPDATE reservas SET tiene_consumo_insumos = 0 WHERE id = ?',
          [reserva_id]
        )
      }
      
      await Horario.reabrirHorario(reserva_id, connection)
      await Horario.registrarActividadHorario({
        accion: 'reabrir',
        reserva_id: reserva_id,
        descripcion: `Horario reabierto${movimiento ? ' (movimiento de inventario eliminado)' : ''}: "${horario?.descripcion}" | Lab: ${horario?.laboratorio || 'N/A'} | Docente: ${horario?.docente || 'N/A'} | Escuela: ${horario?.escuela || 'N/A'} | Ciclo: ${horario?.ciclo || 'N/A'} | ${new Date(horario?.fecha_inicio).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} ${new Date(horario?.fecha_inicio).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} - ${new Date(horario?.fecha_fin).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })} | ${horario?.cantidad_alumnos} alumnos`,
        usuario_id,
        ip_address
      }, connection)
      await connection.commit()
      return { tiene_movimiento: !!movimiento, movimiento_id: movimiento?.id }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  async getActividadHorarios(user_rol, user_laboratorio_ids, laboratorio_id, fecha_inicio, fecha_fin, accion, usuario_id) {
    const rows = await Horario.getActividadHorarios(user_rol, user_laboratorio_ids, laboratorio_id, fecha_inicio, fecha_fin, accion, usuario_id)
    return rows.map(row => ({
      ...row,
      fecha_actividad: new Date(row.fecha_actividad).toISOString()
    }))
  },

  async getHorarios(user_rol, user_laboratorio_ids, filters) {
    this.validarRangoFechas(filters.fecha_inicio, filters.fecha_fin)
    return await Horario.getAllHorarios(user_rol, user_laboratorio_ids, filters)
  },

  async getHorarioById(horarioId) {
    const horario = await Horario.getHorarioById(horarioId)
    if (!horario) throw new AppError('Horario no encontrado o sin permisos para verlo', 404)
    const insumos = await Horario.getInsumosRequeridosByHorario(horarioId)
    const insumosConsumidos = await Horario.getInsumosConsumidosByHorario(horarioId)
    const equipos = await Horario.getEquiposRequeridosByHorario(horarioId)
    return {
      ...horario,
      insumos: insumos || [],
      insumos_consumidos: insumosConsumidos || [],
      equipos: equipos || []
    }
  },

  async getInsumosRequeridosById(horarioId) {
    return await Horario.getInsumosRequeridosById(horarioId)
  }
}
