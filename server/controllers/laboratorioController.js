import { Laboratorio } from '../models/Laboratorio.js'
import { Escuela } from '../models/Escuela.js'
// Obtener todos los laboratorios
export const getLaboratorios = async (req, res) => {
  try {
    const laboratorios = await Laboratorio.getAllByUser(req.user.rol, req.user.laboratorio_ids)
    res.status(200).json({
      success: true,
      data: laboratorios
    })
  } catch (error) {
    console.error('Error al obtener laboratorios:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener laboratorios'
    })
  }
}
// Crear nuevo laboratorio
export const createLaboratorio = async (req, res) => {
  try {
    // Los datos ya están validados y transformados por el middleware de validación
    const { codigo, nombre, ubicacion, escuela_id, piso, estado } = req.body

    // Validar que la escuela existe (validación de negocio)
    const escuelaCheck = await Escuela.exists(escuela_id)
    if (!escuelaCheck) {
      return res.status(400).json({
        success: false,
        message: 'La escuela seleccionada no existe'
      })
    }

    // Insertar laboratorio
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
    console.error('Error al crear laboratorio:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}
// Actualizar laboratorio
export const updateLaboratorio = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: laboratorioId } = req.params
    const { codigo, nombre, ubicacion, escuela_id, piso, estado } = req.body

    // Obtener el laboratorio actual para usar sus valores si no se proporcionan nuevos
    const laboratorioActual = await Laboratorio.getLaboratorioById(laboratorioId)
    if (!laboratorioActual) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    // Usar valores proporcionados o mantener los actuales
    const codigoFinal = codigo || laboratorioActual.codigo
    const nombreFinal = nombre !== undefined ? nombre : laboratorioActual.nombre
    const ubicacionFinal = ubicacion !== undefined ? ubicacion : laboratorioActual.ubicacion
    const escuelaIdFinal = escuela_id !== undefined ? escuela_id : laboratorioActual.escuela_id
    const pisoFinal = piso !== undefined ? piso : laboratorioActual.piso
    const estadoFinal = estado || laboratorioActual.estado

    // Validar que la escuela existe si se proporciona (validación de negocio)
    if (escuela_id !== undefined) {
      const escuelaCheck = await Escuela.exists(escuelaIdFinal)
      if (!escuelaCheck) {
        return res.status(400).json({
          success: false,
          message: 'La escuela seleccionada no existe'
        })
      }
    }

    // Actualizar laboratorio
    const affectedRows = await Laboratorio.update(
      laboratorioId,
      codigoFinal,
      nombreFinal,
      ubicacionFinal,
      escuelaIdFinal,
      pisoFinal,
      estadoFinal
    )

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
    console.error('Error al actualizar laboratorio:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}
// Eliminar laboratorio
export const deleteLaboratorio = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: laboratorioId } = req.params

    // Verificar que el laboratorio existe
    const labCheck = await Laboratorio.exists(laboratorioId)
    if (!labCheck) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    // Eliminar laboratorio
    const affectedRows = await Laboratorio.delete(laboratorioId)
    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Laboratorio eliminado correctamente'
    })
  } catch (error) {
    // Manejar errores de restricción de clave foránea
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el laboratorio porque está relacionado con otras tablas del sistema y tiene datos asociados (equipos, insumos, horarios, incidencias u otros registros). Primero debes eliminar o reasignar estos registros para poder eliminar el laboratorio.'
      })
    }
    console.error('Error al eliminar laboratorio:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}
// Cambiar estado de un laboratorio
export const changeEstadoLaboratorio = async (req, res) => {
  try {
    // El ID y estado ya están validados por el middleware de validación
    const { id: laboratorioId } = req.params
    const { estado } = req.body

    // Validar que el laboratorio existe
    const labCheck = await Laboratorio.exists(laboratorioId)
    if (!labCheck) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    // Actualizar solo el estado
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
    console.error('Error al cambiar estado del laboratorio:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// Obtener insumos configurados para un laboratorio
export const getInsumosLaboratorio = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: laboratorioId } = req.params

    // Verificar que el laboratorio existe
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
    console.error('Error al obtener insumos del laboratorio:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener insumos del laboratorio'
    })
  }
}

// Configurar insumos para un laboratorio
export const configurarInsumosLaboratorio = async (req, res) => {
  try {
    // El ID y insumo_ids ya están validados por el middleware de validación
    const { id: laboratorioId } = req.params
    const { insumo_ids } = req.body

    // Verificar que el laboratorio existe
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
    console.error('Error al configurar insumos del laboratorio:', error)
    res.status(500).json({
      success: false,
      message: 'Error al configurar insumos del laboratorio'
    })
  }
}