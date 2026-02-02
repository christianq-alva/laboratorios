import { horarioService } from '../services/horarioService.js'

export const getActividadHorarios = async (req, res, next) => {
  try {
    const { laboratorio_id, fecha_inicio, fecha_fin, accion, usuario_id } = req.query
    const rows = await horarioService.getActividadHorarios(req.user.rol, req.user.laboratorio_ids, laboratorio_id, fecha_inicio, fecha_fin, accion, usuario_id)
    res.status(200).json({
      success: true,
      data: rows,
      total: rows.length
    })
  } catch (error) {
    next(error)
  }
}

export const getHorarios = async (req, res, next) => {
  try {
    const { laboratorio_id, escuela_id, docente_id, ciclo_id, fecha_inicio, fecha_fin, estado } = req.query
    const filters = {
      laboratorio_id: laboratorio_id ? parseInt(laboratorio_id) : undefined,
      escuela_id: escuela_id ? parseInt(escuela_id) : undefined,
      docente_id: docente_id ? parseInt(docente_id) : undefined,
      ciclo_id: ciclo_id ? parseInt(ciclo_id) : undefined,
      fecha_inicio,
      fecha_fin,
      estado
    }
    const horarios = await horarioService.getHorarios(req.user.rol, req.user.laboratorio_ids, filters)
    res.status(200).json({
      success: true,
      data: horarios
    })
  } catch (error) {
    next(error)
  }
}

export const getHorario = async (req, res, next) => {
  try {
    const { id: horarioId } = req.params
    const horarioConInsumos = await horarioService.getHorarioById(horarioId)
    res.status(200).json({
      success: true,
      data: horarioConInsumos
    })
  } catch (error) {
    next(error)
  }
}

export const createHorario = async (req, res, next) => {
  try {
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
    const result = await horarioService.crearReserva(
      { laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fecha_inicio, fecha_fin, cantidad_alumnos, color },
      insumos,
      equipos,
      req.user.userId,
      req.ip || req.connection?.remoteAddress
    )
    res.status(201).json({
      success: true,
      message: 'Horario creado correctamente',
      data: {
        reserva_id: result.reserva_id,
        insumos_procesados: result.insumos_procesados,
        equipos_procesados: result.equipos_procesados
      }
    })
  } catch (error) {
    next(error)
  }
}

export const updateHorario = async (req, res, next) => {
  try {
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
    const result = await horarioService.actualizarReserva(
      horarioId,
      { laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fecha_inicio, fecha_fin, cantidad_alumnos, color },
      insumos,
      equipos,
      req.user.userId,
      req.ip || req.connection?.remoteAddress
    )
    res.status(200).json({
      success: true,
      message: 'Horario actualizado correctamente',
      validaciones: {
        escuela: result.escuela,
        ciclo: result.ciclo,
        docente: result.docente
      },
      insumos_nuevos: result.insumos_nuevos,
      equipos_nuevos: result.equipos_nuevos
    })
  } catch (error) {
    next(error)
  }
}

export const deleteHorario = async (req, res, next) => {
  try {
    const { id: horarioId } = req.params
    const result = await horarioService.eliminarReserva(
      horarioId,
      req.user.userId,
      req.ip || req.connection?.remoteAddress
    )
    res.status(200).json({
      success: true,
      message: 'Horario eliminado correctamente',
      data: { id: result.id }
    })
  } catch (error) {
    next(error)
  }
}

export const verificarDisponibilidad = async (req, res, next) => {
  try {
    const { laboratorio_id, docente_id, fecha_inicio, fecha_fin, horario_id } = req.body
    const result = await horarioService.verificarDisponibilidad(laboratorio_id, docente_id, fecha_inicio, fecha_fin, horario_id)
    if (result.disponible) {
      res.status(200).json({
        success: true,
        disponible: true,
        mensaje: result.mensaje
      })
    } else {
      res.status(200).json({
        success: true,
        disponible: false,
        motivo: result.motivo,
        tipo_conflicto: result.tipo_conflicto,
        conflicto_detalle: result.conflicto_detalle
      })
    }
  } catch (error) {
    next(error)
  }
}

export const cerrarHorarioConInsumos = async (req, res, next) => {
  try {
    const { laboratorio_id, tipo_movimiento, fecha_movimiento, observaciones, reserva_id, detalles } = req.body
    const result = await horarioService.cerrarHorarioConInsumos(
      reserva_id,
      laboratorio_id,
      tipo_movimiento,
      fecha_movimiento,
      detalles,
      observaciones,
      req.user.userId,
      req.ip || req.connection?.remoteAddress
    )
    res.status(200).json({
      success: true,
      message: 'Horario cerrado correctamente',
      data: { movimiento_id: result.movimiento_id }
    })
  } catch (error) {
    next(error)
  }
}

export const cerrarHorario = async (req, res, next) => {
  try {
    const { id: reserva_id } = req.params
    await horarioService.cerrarHorario(
      reserva_id,
      req.user.userId,
      req.ip || req.connection?.remoteAddress
    )
    res.status(200).json({
      success: true,
      message: 'Horario cerrado correctamente'
    })
  } catch (error) {
    next(error)
  }
}

export const reabrirHorario = async (req, res, next) => {
  try {
    const { id: reserva_id } = req.params
    const result = await horarioService.reabrirHorario(
      reserva_id,
      req.user.userId,
      req.ip || req.connection?.remoteAddress
    )
    res.status(200).json({
      success: true,
      message: 'Horario reabierto correctamente',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const getInsumosRequeridosById = async (req, res, next) => {
  try {
    const { id: horarioId } = req.params
    const insumos = await horarioService.getInsumosRequeridosById(horarioId)
    res.status(200).json({
      success: true,
      data: insumos
    })
  } catch (error) {
    next(error)
  }
}
