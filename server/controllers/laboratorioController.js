import { Laboratorio } from '../models/Laboratorio.js'

export const getLaboratorios = async (req, res, next) => {
  try {
    const laboratorios = await Laboratorio.getAllByUser(req.user.rol, req.user.laboratorio_ids)
    res.status(200).json({
      success: true,
      data: laboratorios
    })
  } catch (error) {
    next(error)
  }
}

export const createLaboratorio = async (req, res, next) => {
  try {
    const { codigo, nombre, ubicacion, escuela_id, piso, estado } = req.body
    const insertId = await Laboratorio.create(codigo, nombre, ubicacion, escuela_id, piso, estado)
    res.status(201).json({
      success: true,
      data: {
        id: insertId,
        codigo,
        nombre,
        ubicacion,
        escuela_id,
        piso,
        estado,
        escuela: ''
      },
      message: 'Laboratorio creado correctamente'
    })
  } catch (error) {
    next(error)
  }
}

export const updateLaboratorio = async (req, res, next) => {
  try {
    const { id: laboratorioId } = req.params
    const { codigo, nombre, ubicacion, escuela_id, piso, estado } = req.body
    const laboratorioActual = await Laboratorio.getLaboratorioById(laboratorioId)
    if (!laboratorioActual) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }
    const codigoFinal = codigo || laboratorioActual.codigo
    const nombreFinal = nombre !== undefined ? nombre : laboratorioActual.nombre
    const ubicacionFinal = ubicacion !== undefined ? ubicacion : laboratorioActual.ubicacion
    const escuelaIdFinal = escuela_id !== undefined ? escuela_id : laboratorioActual.escuela_id
    const pisoFinal = piso !== undefined ? piso : laboratorioActual.piso
    const estadoFinal = estado || laboratorioActual.estado

    await Laboratorio.update(
      laboratorioId,
      codigoFinal,
      nombreFinal,
      ubicacionFinal,
      escuelaIdFinal,
      pisoFinal,
      estadoFinal
    )

    res.status(200).json({
      success: true,
      data: {
        id: laboratorioId,
        codigo: codigoFinal,
        nombre: nombreFinal,
        ubicacion: ubicacionFinal,
        escuela_id: escuelaIdFinal,
        piso: pisoFinal,
        estado: estadoFinal,
        escuela: ''
      },
      message: 'Laboratorio actualizado correctamente'
    })
  } catch (error) {
    next(error)
  }
}

export const deleteLaboratorio = async (req, res, next) => {
  try {
    const { id: laboratorioId } = req.params
    await Laboratorio.delete(laboratorioId)
    res.status(200).json({
      success: true,
      message: 'Laboratorio eliminado correctamente'
    })
  } catch (error) {
    next(error)
  }
}

export const changeEstadoLaboratorio = async (req, res, next) => {
  try {
    const { id: laboratorioId } = req.params
    const { estado } = req.body

    const labCheck = await Laboratorio.exists(laboratorioId)
    if (!labCheck) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    const affectedRows = await Laboratorio.updateEstado(laboratorioId, estado)
    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    res.status(200).json({
      success: true,
      data: {
        id: laboratorioId,
        estado_anterior: '',
        estado_nuevo: estado
      },
      message: `Estado cambiado a "${estado}" correctamente`
    })
  } catch (error) {
    next(error)
  }
}

export const getInsumosLaboratorio = async (req, res, next) => {
  try {
    const { id: laboratorioId } = req.params

    const labCheck = await Laboratorio.exists(laboratorioId)
    if (!labCheck) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    const insumos = await Laboratorio.getInsumosByLaboratorio(laboratorioId)

    res.status(200).json({
      success: true,
      data: insumos
    })
  } catch (error) {
    next(error)
  }
}

export const configurarInsumosLaboratorio = async (req, res, next) => {
  try {
    const { id: laboratorioId } = req.params
    const { insumo_ids } = req.body

    const labCheck = await Laboratorio.exists(laboratorioId)
    if (!labCheck) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    await Laboratorio.configurarInsumos(laboratorioId, insumo_ids)

    res.status(200).json({
      success: true,
      message: 'Insumos configurados correctamente',
      data: {
        laboratorio_id: laboratorioId,
        insumos_configurados: insumo_ids.length
      }
    })
  } catch (error) {
    next(error)
  }
}
