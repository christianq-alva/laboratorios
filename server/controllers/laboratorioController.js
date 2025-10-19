import { pool } from '../config/database.js'
import { defineAbilitiesFor } from '../abilities/defineAbilities.js'

export const getLaboratorios = async (req, res) => {
  try {
    let query, params = []

    if (req.user.rol === 'Administrador') {
      query = `
        SELECT l.*, e.nombre as escuela 
        FROM laboratorios l
        LEFT JOIN escuelas e ON l.escuela_id = e.id
        ORDER BY l.codigo, l.nombre
      `
    } else if (req.user.rol === 'Jefe de Laboratorio') {
      query = `
        SELECT l.*, e.nombre as escuela  
        FROM laboratorios l
        LEFT JOIN escuelas e ON l.escuela_id = e.id
        JOIN jefe_laboratorio jl ON l.id = jl.laboratorio_id
        WHERE jl.usuario_id = ?
        ORDER BY l.codigo, l.nombre
      `
      params = [req.user.userId]
    } else {
      query = 'SELECT * FROM laboratorios WHERE 1=0'
    }

    const [laboratorios] = await pool.execute(query, params)

    res.json({
      success: true,
      data: laboratorios,
      user_role: req.user.rol,
      cantidad_laboratorios: laboratorios.length
    })

  } catch (error) {
    console.error('Error en getLaboratorios:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

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
    const [escuelaCheck] = await pool.execute(
      'SELECT id, nombre FROM escuelas WHERE id = ?', 
      [escuela_id]
    )
    
    if (escuelaCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La escuela seleccionada no existe'
      })
    }

    // Usar el código proporcionado por el usuario (sin validar unicidad)
    const codigoFinal = codigo.trim()

    // Insertar laboratorio
    const [result] = await pool.execute(`
      INSERT INTO laboratorios (codigo, nombre, ubicacion, escuela_id, piso, estado) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [codigoFinal, nombre.trim(), ubicacion.trim(), escuela_id, piso.toString().trim(), estado])

    console.log('✅ Laboratorio creado con ID:', result.insertId)

    res.json({
      success: true,
      data: {
        id: result.insertId,
        codigo: codigoFinal,
        nombre: nombre.trim(),
        ubicacion: ubicacion.trim(),
        escuela_id,
        piso: piso.toString().trim(),
        estado,
        escuela: escuelaCheck[0].nombre
      },
      message: 'Laboratorio creado correctamente'
    })

  } catch (error) {
    console.error('Error en createLaboratorio:', error)
    
    // Manejar error de duplicado (si aún existe la restricción)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un laboratorio con ese código. Puedes usar el mismo código si es necesario.'
      })
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const updateLaboratorio = async (req, res) => {
  try {
    const { id } = req.params
    const { codigo, nombre, ubicacion, escuela_id, piso, estado } = req.body

    console.log('🔄 Actualizando laboratorio:', { id, codigo, nombre, ubicacion, escuela_id, piso, estado })

    // Verificar que el laboratorio existe
    const [labCheck] = await pool.execute(
      'SELECT * FROM laboratorios WHERE id = ?', 
      [id]
    )
    
    if (labCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    // Validar que la escuela existe
    const [escuelaCheck] = await pool.execute(
      'SELECT id, nombre FROM escuelas WHERE id = ?', 
      [escuela_id]
    )
    
    if (escuelaCheck.length === 0) {
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
    const [result] = await pool.execute(`
      UPDATE laboratorios 
      SET codigo = ?, nombre = ?, ubicacion = ?, escuela_id = ?, piso = ?, estado = ?
      WHERE id = ?
    `, [codigo.trim(), nombre, ubicacion, escuela_id, piso, estado || 'Activo', id])

    console.log('✅ Laboratorio actualizado:', id)

    res.json({
      success: true,
      data: {
        id: parseInt(id),
        codigo: codigo.trim(),
        nombre,
        ubicacion,
        escuela_id,
        piso,
        estado: estado || 'Activo',
        escuela: escuelaCheck[0].nombre
      },
      message: 'Laboratorio actualizado correctamente'
    })

  } catch (error) {
    console.error('Error en updateLaboratorio:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const deleteLaboratorio = async (req, res) => {
  try {
    const { id } = req.params

    // Verificar que el laboratorio existe
    const [labCheck] = await pool.execute(
      'SELECT * FROM laboratorios WHERE id = ?', 
      [id]
    )
    
    if (labCheck.length === 0) {
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

    // Verificar si tiene relaciones antes de eliminar
    const [equiposCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM equipos WHERE laboratorio_id = ?',
      [id]
    )
    
    const [horariosCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM horarios WHERE laboratorio_id = ?',
      [id]
    )

    const [insumosCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM insumos WHERE laboratorio_id = ?',
      [id]
    )

    const [incidenciasCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM incidencias WHERE laboratorio_id = ?',
      [id]
    )

    const [jefesCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM jefe_laboratorio WHERE laboratorio_id = ?',
      [id]
    )

    // Si tiene relaciones, informar al usuario
    const totalRelaciones = equiposCount[0].total + horariosCount[0].total + 
                           insumosCount[0].total + incidenciasCount[0].total + 
                           jefesCount[0].total

    if (totalRelaciones > 0) {
      const relaciones = []
      if (equiposCount[0].total > 0) {
        relaciones.push(`${equiposCount[0].total} equipo(s)`)
      }
      if (insumosCount[0].total > 0) {
        relaciones.push(`${insumosCount[0].total} insumo(s)`)
      }
      if (horariosCount[0].total > 0) {
        relaciones.push(`${horariosCount[0].total} horario(s)`)
      }
      if (incidenciasCount[0].total > 0) {
        relaciones.push(`${incidenciasCount[0].total} incidencia(s)`)
      }
      if (jefesCount[0].total > 0) {
        relaciones.push(`${jefesCount[0].total} jefe(s) asignado(s)`)
      }

      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el laboratorio "${labCheck[0].nombre}" porque está relacionado con otras tablas del sistema y tiene datos asociados: ${relaciones.join(', ')}. Primero debes eliminar o reasignar estos registros para poder eliminar el laboratorio.`
      })
    }

    // Si no tiene relaciones, proceder con la eliminación
    const [result] = await pool.execute('DELETE FROM laboratorios WHERE id = ?', [id])

    console.log('✅ Laboratorio eliminado:', id)

    res.json({
      success: true,
      message: 'Laboratorio eliminado correctamente'
    })

  } catch (error) {
    console.error('Error en deleteLaboratorio:', error)
    
    // Manejar errores de restricción de clave foránea
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el laboratorio porque está relacionado con otras tablas del sistema y tiene datos asociados (equipos, insumos, horarios, incidencias u otros registros). Primero debes eliminar o reasignar estos registros para poder eliminar el laboratorio.'
      })
    }
    
    // Error genérico pero con contexto de posibles relaciones
    res.status(500).json({
      success: false,
      message: 'No se puede eliminar el laboratorio porque está relacionado con otras tablas del sistema y tiene datos asociados. Primero debes eliminar o reasignar los registros relacionados (equipos, insumos, horarios, etc.) antes de poder eliminar el laboratorio.'
    })
  }
}

// Obtener escuelas disponibles para el selector
export const getEscuelas = async (req, res) => {
  try {
    const [escuelas] = await pool.execute('SELECT id, nombre FROM escuelas ORDER BY nombre')
    
    res.json({ 
      success: true, 
      data: escuelas
    })
  } catch (error) {
    console.error('Error en getEscuelas:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Cambiar estado de un laboratorio
export const changeEstadoLaboratorio = async (req, res) => {
  try {
    const { id } = req.params
    const { estado } = req.body

    console.log('🔄 Cambiando estado del laboratorio:', { id, estado })

    // Validar que el laboratorio existe
    const [labCheck] = await pool.execute(
      'SELECT * FROM laboratorios WHERE id = ?', 
      [id]
    )
    
    if (labCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }

    // Validar estado
    const estadosValidos = ['Activo', 'En Mantenimiento', 'Inhabilitado', 'Baja']
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
    const [result] = await pool.execute(`
      UPDATE laboratorios 
      SET estado = ?
      WHERE id = ?
    `, [estado, id])

    console.log('✅ Estado del laboratorio actualizado:', id)

    res.json({
      success: true,
      data: {
        id: parseInt(id),
        estado_anterior: labCheck[0].estado,
        estado_nuevo: estado
      },
      message: `Estado cambiado a "${estado}" correctamente`
    })

  } catch (error) {
    console.error('Error en changeEstadoLaboratorio:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}