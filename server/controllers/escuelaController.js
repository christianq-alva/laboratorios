import { pool } from '../config/database.js'

// Obtener todas las escuelas
export const getEscuelas = async (req, res) => {
  try {
    // Primero verificar qué columnas existen en la tabla escuelas
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'escuelas' AND TABLE_SCHEMA = DATABASE()
    `)
    
    console.log('📋 Columnas disponibles en tabla escuelas:', columns.map(c => c.COLUMN_NAME))
    
    const hasDescripcion = columns.some(c => c.COLUMN_NAME === 'descripcion')
    const hasCodigo = columns.some(c => c.COLUMN_NAME === 'codigo')
    const hasCreatedAt = columns.some(c => c.COLUMN_NAME === 'created_at')
    
    // Construir consulta basada en columnas disponibles
    let selectFields = 'e.id, e.nombre'
    if (hasCodigo) selectFields += ', e.codigo'
    if (hasDescripcion) selectFields += ', e.descripcion'
    if (hasCreatedAt) selectFields += ', e.created_at'
    
    const [escuelas] = await pool.execute(`
      SELECT ${selectFields}, 
        COUNT(DISTINCT l.id) as total_laboratorios,
        COUNT(DISTINCT d.id) as total_docentes
      FROM escuelas e
      LEFT JOIN laboratorios l ON e.id = l.escuela_id
      LEFT JOIN docentes d ON e.id = d.escuela_id
      GROUP BY e.id
      ORDER BY e.nombre ASC
    `)
    
    console.log('✅ Escuelas encontradas:', escuelas.length)
    
    res.json({ 
      success: true, 
      data: escuelas
    })
  } catch (error) {
    console.error('❌ Error en getEscuelas:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener escuelas',
      error: error.message 
    })
  }
}

// Obtener una escuela por ID
export const getEscuelaById = async (req, res) => {
  try {
    const { id } = req.params
    
    const [escuelas] = await pool.execute(
      'SELECT * FROM escuelas WHERE id = ?',
      [id]
    )
    
    if (escuelas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Escuela no encontrada'
      })
    }
    
    res.json({
      success: true,
      data: escuelas[0]
    })
  } catch (error) {
    console.error('Error en getEscuelaById:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener la escuela',
      error: error.message
    })
  }
}

// Crear nueva escuela
export const createEscuela = async (req, res) => {
  try {
    const { nombre, descripcion, codigo } = req.body
    
    // Validaciones
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la escuela es requerido'
      })
    }
    
    // Verificar si ya existe una escuela con ese nombre
    const [existingEscuela] = await pool.execute(
      'SELECT id FROM escuelas WHERE nombre = ?',
      [nombre.trim()]
    )
    
    if (existingEscuela.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una escuela con ese nombre'
      })
    }
    
    // Verificar qué columnas existen
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'escuelas' AND TABLE_SCHEMA = DATABASE()
    `)
    
    const hasDescripcion = columns.some(c => c.COLUMN_NAME === 'descripcion')
    const hasCodigo = columns.some(c => c.COLUMN_NAME === 'codigo')
    
    // Construir consulta dinámica
    let fields = 'nombre'
    let placeholders = '?'
    let values = [nombre.trim()]
    
    if (hasCodigo && codigo) {
      fields += ', codigo'
      placeholders += ', ?'
      values.push(codigo.trim())
    }
    
    if (hasDescripcion && descripcion) {
      fields += ', descripcion'
      placeholders += ', ?'
      values.push(descripcion.trim())
    }
    
    // Insertar escuela
    const [result] = await pool.execute(
      `INSERT INTO escuelas (${fields}) VALUES (${placeholders})`,
      values
    )
    
    console.log('✅ Escuela creada con ID:', result.insertId)
    
    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        nombre: nombre.trim(),
        ...(hasCodigo && codigo ? { codigo: codigo.trim() } : {}),
        ...(hasDescripcion && descripcion ? { descripcion: descripcion.trim() } : {})
      },
      message: 'Escuela creada exitosamente'
    })
  } catch (error) {
    console.error('❌ Error en createEscuela:', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear la escuela',
      error: error.message
    })
  }
}

// Actualizar escuela
export const updateEscuela = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, descripcion, codigo } = req.body
    
    // Verificar que la escuela existe
    const [escuelaCheck] = await pool.execute(
      'SELECT * FROM escuelas WHERE id = ?',
      [id]
    )
    
    if (escuelaCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Escuela no encontrada'
      })
    }
    
    // Validaciones
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la escuela es requerido'
      })
    }
    
    // Verificar si ya existe otra escuela con ese nombre
    const [existingEscuela] = await pool.execute(
      'SELECT id FROM escuelas WHERE nombre = ? AND id != ?',
      [nombre.trim(), id]
    )
    
    if (existingEscuela.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe otra escuela con ese nombre'
      })
    }
    
    // Verificar qué columnas existen
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'escuelas' AND TABLE_SCHEMA = DATABASE()
    `)
    
    const hasDescripcion = columns.some(c => c.COLUMN_NAME === 'descripcion')
    const hasCodigo = columns.some(c => c.COLUMN_NAME === 'codigo')
    
    // Construir consulta dinámica
    let setClause = 'nombre = ?'
    let values = [nombre.trim()]
    
    if (hasCodigo) {
      setClause += ', codigo = ?'
      values.push(codigo?.trim() || null)
    }
    
    if (hasDescripcion) {
      setClause += ', descripcion = ?'
      values.push(descripcion?.trim() || null)
    }
    
    values.push(id)
    
    // Actualizar escuela
    await pool.execute(
      `UPDATE escuelas SET ${setClause} WHERE id = ?`,
      values
    )
    
    console.log('✅ Escuela actualizada:', id)
    
    res.json({
      success: true,
      data: {
        id: parseInt(id),
        nombre: nombre.trim(),
        ...(hasCodigo ? { codigo: codigo?.trim() || null } : {}),
        ...(hasDescripcion ? { descripcion: descripcion?.trim() || null } : {})
      },
      message: 'Escuela actualizada exitosamente'
    })
  } catch (error) {
    console.error('❌ Error en updateEscuela:', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la escuela',
      error: error.message
    })
  }
}

// Eliminar escuela
export const deleteEscuela = async (req, res) => {
  try {
    const { id } = req.params
    
    // Verificar que la escuela existe
    const [escuelaCheck] = await pool.execute(
      'SELECT * FROM escuelas WHERE id = ?',
      [id]
    )
    
    if (escuelaCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Escuela no encontrada'
      })
    }
    
    // Verificar si tiene relaciones antes de eliminar
    const [laboratoriosCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM laboratorios WHERE escuela_id = ?',
      [id]
    )
    
    const [docentesCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM docentes WHERE escuela_id = ?',
      [id]
    )
    
    // Si tiene relaciones, informar al usuario
    const totalRelaciones = laboratoriosCount[0].total + docentesCount[0].total
    
    if (totalRelaciones > 0) {
      const relaciones = []
      if (laboratoriosCount[0].total > 0) {
        relaciones.push(`${laboratoriosCount[0].total} laboratorio(s)`)
      }
      if (docentesCount[0].total > 0) {
        relaciones.push(`${docentesCount[0].total} docente(s)`)
      }
      
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la escuela "${escuelaCheck[0].nombre}" porque está relacionada con otras tablas del sistema y tiene datos asociados: ${relaciones.join(', ')}. Primero debes eliminar o reasignar estos registros para poder eliminar la escuela.`
      })
    }
    
    // Si no tiene relaciones, proceder con la eliminación
    await pool.execute('DELETE FROM escuelas WHERE id = ?', [id])
    
    console.log('✅ Escuela eliminada:', id)
    
    res.json({
      success: true,
      message: 'Escuela eliminada exitosamente'
    })
  } catch (error) {
    console.error('Error en deleteEscuela:', error)
    
    // Manejar errores de restricción de clave foránea
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la escuela porque está relacionada con otras tablas del sistema y tiene datos asociados (laboratorios, docentes u otros registros). Primero debes eliminar o reasignar estos registros para poder eliminar la escuela.'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la escuela',
      error: error.message
    })
  }
}

