import { Laboratorio } from '../models/Laboratorio.js'
import { Escuela } from '../models/Escuela.js'

const estadosValidos = ['Activo', 'En Mantenimiento', 'Inhabilitado', 'Baja']


// Obtener todos los laboratorios
export const getLaboratorios = async (req, res) => {
  try {

    const laboratorios = await Laboratorio.getAllByUser(req.user.rol, req.user.laboratorio_ids)

    res.status(200).json({
      success: true,
      data: laboratorios,
      //user_role: req.user.rol,
      //cantidad_laboratorios: laboratorios.length
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// Crear nuevo laboratorio
export const createLaboratorio = async (req, res) => {
  try {
    const { codigo, nombre, ubicacion, escuela_id, piso, estado = 'Activo' } = req.body

    console.log('🔍 Creando laboratorio:', { codigo, nombre, ubicacion, escuela_id, piso, estado })

    // Validaciones básicas
    if (!codigo || !codigo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El código del laboratorio es requerido'
      })
    }

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del laboratorio es requerido'
      })
    }

    if (!ubicacion || !ubicacion.trim()) {
      return res.status(400).json({
        success: false,
        message: 'La ubicación del laboratorio es requerida'
      })
    }

    if (!piso || !piso.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'El piso del laboratorio es requerido'
      })
    }

    // Validar que la escuela existe
    const escuelaCheck = await Escuela.exists(escuela_id)

    if (!escuelaCheck) {
      return res.status(400).json({
        success: false,
        message: 'La escuela seleccionada no existe'
      })
    }

    // Insertar laboratorio
    const insertId = await Laboratorio.create(codigo.trim(), nombre.trim(), ubicacion.trim(), escuela_id, piso.toString().trim(), estado)

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      data: {
        id: insertId,
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        ubicacion: ubicacion.trim(),
        escuela_id,
        piso: piso.toString().trim(),
        estado,
        escuela: ''
      },
      message: 'Laboratorio creado correctamente'
    })

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// Actualizar laboratorio
export const updateLaboratorio = async (req, res) => {
  try {
    const { id } = req.params
    const { codigo, nombre, ubicacion, escuela_id, piso, estado } = req.body

    // Verificar que el laboratorio existe
    const labCheck = await Laboratorio.exists(id)

    if (!labCheck) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    // Validar que la escuela existe
    const escuelaCheck = await Escuela.exists(escuela_id)

    if (!escuelaCheck) {
      return res.status(400).json({
        success: false,
        message: 'La escuela seleccionada no existe'
      })
    }

    // Verificar permisos para Jefe de Laboratorio
    if (req.user.rol === 'Jefe de Laboratorio') {
      if (!req.user.laboratorio_ids.includes(parseInt(id))) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para editar este laboratorio'
        })
      }
    }

    // Validaciones básicas
    if (!codigo || !codigo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El código del laboratorio es requerido'
      })
    }

    // Actualizar laboratorio incluyendo el código y estado
    const affectedRows = await Laboratorio.update(id, codigo.trim(), nombre, ubicacion, escuela_id, piso, estado || 'Activo')

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    res.status(200).json({
      success: true,
      data: {
        id: parseInt(id),
        codigo: codigo.trim(),
        nombre,
        ubicacion,
        escuela_id,
        piso,
        estado: estado || 'Activo',
        escuela: ''
      },
      message: 'Laboratorio actualizado correctamente'
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// Eliminar laboratorio
export const deleteLaboratorio = async (req, res) => {
  try {
    const { id } = req.params

    // Verificar que el laboratorio existe
    const labCheck = await Laboratorio.exists(id)

    if (!labCheck) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    // Verificar permisos para Jefe de Laboratorio
    if (req.user.rol === 'Jefe de Laboratorio') {
      if (!req.user.laboratorio_ids.includes(parseInt(id))) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar este laboratorio'
        })
      }
    }

    // Eliminar laboratorio
    const affectedRows = await Laboratorio.delete(id)

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

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}


// Cambiar estado de un laboratorio
export const changeEstadoLaboratorio = async (req, res) => {
  try {
    const { id } = req.params
    const { estado } = req.body

    // Validar que el laboratorio existe
    const labCheck = await Laboratorio.exists(id)

    if (!labCheck) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    // Validar estado
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`
      })
    }

    // Verificar permisos para Jefe de Laboratorio
    if (req.user.rol === 'Jefe de Laboratorio') {
      if (!req.user.laboratorio_ids.includes(parseInt(id))) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para cambiar el estado de este laboratorio'
        })
      }
    }

    // Actualizar solo el estado
    const affectedRows = await Laboratorio.updateEstado(id, estado)

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    res.status(200).json({
      success: true,
      data: {
        id: parseInt(id),
        estado_anterior: '',
        estado_nuevo: estado
      },
      message: `Estado cambiado a "${estado}" correctamente`
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}