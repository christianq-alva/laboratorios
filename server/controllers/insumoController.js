import { pool } from '../config/database.js'
import { Insumo } from '../models/Insumo.js'
import multer from 'multer'
import XLSX from 'xlsx'

//Crear insumo
export const createInsumo = async (req, res) => {
  try {
    const {
      nombre, descripcion, unidad_medida, categoria, presentacion } = req.body

    console.log('🔍 Creando insumo maestro:', req.body)

    // Validar campos requeridos
    if (!nombre || !unidad_medida) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y unidad de medida son requeridos'
      })
    }

    const { insumo_id, codigo } = await Insumo.createInsumo(nombre, descripcion || '', unidad_medida, categoria, presentacion || '')

    res.json({
      success: true,
      message: 'Insumo creado exitosamente',
      data: {
        id: insumo_id,
        codigo: codigo,
        nombre: nombre,
        unidad_medida: unidad_medida,
        categoria: categoria
      }
    })

  } catch (error) {
    console.error('Error en createInsumo:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

//Editar insumo
export const updateInsumo = async (req, res) => {
  try {
    const { id } = req.params
    const insumoId = parseInt(id, 10) // Convertir a número entero
    const { nombre, descripcion, unidad_medida, categoria, presentacion } = req.body

    // Limpiar espacios en blanco
    const nombreLimpio = nombre?.trim()
    const descripcionLimpia = descripcion?.trim()
    const unidadLimpia = unidad_medida?.trim()
    const presentacionLimpia = presentacion?.trim()

    console.log('🔄 Actualizando insumo:', { id, insumoId, nombre: nombreLimpio, descripcion: descripcionLimpia, unidad_medida: unidadLimpia })

    // Validar ID
    if (isNaN(insumoId) || insumoId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de insumo inválido'
      })
    }

    // Validar datos
    if (!nombreLimpio || !unidadLimpia) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y unidad de medida son requeridos'
      })
    }

    // Verificar que el insumo existe
    const [existingInsumo] = await pool.execute(
      'SELECT id FROM insumos WHERE id = ?',
      [insumoId]
    )

    if (existingInsumo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Insumo no encontrado'
      })
    }

    // Validación de duplicados deshabilitada para permitir edición libre
    console.log('ℹ️ Validación de duplicados omitida - permitiendo edición libre')

    await Insumo.updateInsumo(nombreLimpio, descripcionLimpia || '', unidadLimpia, categoria || 'Materiales', presentacionLimpia || '', insumoId)

    res.json({
      success: true,
      message: 'Insumo actualizado exitosamente',
      data: { id: insumoId, nombre: nombreLimpio, descripcion: descripcionLimpia, unidad_medida: unidadLimpia }
    })

  } catch (error) {
    console.error('❌ Error al actualizar insumo:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

//Eliminar insumo
export const deleteInsumo = async (req, res) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const { id } = req.params
    const insumoId = parseInt(id, 10)

    console.log('🗑️ Eliminando insumo:', insumoId)

    // Validar ID
    if (isNaN(insumoId) || insumoId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de insumo inválido'
      })
    }

    // Verificar que el insumo existe
    const [existingInsumo] = await connection.execute(
      'SELECT id, nombre FROM insumos WHERE id = ?',
      [insumoId]
    )

    if (existingInsumo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Insumo no encontrado'
      })
    }

    // Verificar si hay relaciones antes de eliminar

    const [detalleMovimientos] = await connection.execute(
      'SELECT COUNT(*) as total FROM movimiento_insumo_detalle WHERE insumo_id = ?',
      [insumoId]
    )

    const [inventario] = await connection.execute(
      'SELECT COUNT(*) as total FROM inventario_insumos WHERE insumo_id = ?',
      [insumoId]
    )

    // Si tiene relaciones, informar al usuario
    const totalRelaciones = detalleMovimientos[0].total + inventario[0].total

    if (totalRelaciones > 0) {
      const relaciones = []

      if (detalleMovimientos[0].total > 0) {
        relaciones.push(`${detalleMovimientos[0].total} registro(s) de lotes`)
      }
      if (inventario[0].total > 0) {
        relaciones.push(`${inventario[0].total} registro(s) de inventario`)
      }

      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el insumo "${existingInsumo[0].nombre}" porque está siendo usado en el sistema y tiene datos asociados: ${relaciones.join(', ')}. Primero debes eliminar estos registros relacionados para poder eliminar el insumo.`
      })
    }

    // Si no tiene relaciones, proceder con la eliminación
    await connection.execute('DELETE FROM insumos WHERE id = ?', [insumoId])

    await connection.commit()

    console.log('✅ Insumo eliminado exitosamente:', insumoId)

    res.json({
      success: true,
      message: 'Insumo eliminado exitosamente'
    })

  } catch (error) {
    await connection.rollback()
    console.error('❌ Error al eliminar insumo:', error)

    // Manejar errores de restricción de clave foránea
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el insumo porque está siendo usado en el sistema y tiene información relacionada (movimientos, lotes, inventario u otros registros). Primero debes eliminar o modificar estos registros para poder eliminar el insumo.'
      })
    }

    // Error genérico pero más descriptivo
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el insumo. Es posible que esté siendo usado en el sistema. Verifica que no tenga movimientos, lotes o registros de inventario asociados antes de eliminarlo.'
    })
  } finally {
    connection.release()
  }
}

export const getAllInsumos = async (req, res) => {
  try {
    console.log('Se está pidiendo todos los insumos')
    const [insumos] = await Insumo.getAllInsumos()
    res.json({
      data: insumos
    })

  } catch (error) {
    console.error('Error en getAllInsumos:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Configuración de multer para subida de archivos
const storage = multer.memoryStorage()
export const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false)
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  }
})

//Generar plantilla Excel para importación masiva de insumos
export const generarPlantillaImportacion = async (req, res) => {
  try {
    console.log('📊 Generando plantilla Excel para importación masiva de insumos...')

    // Crear workbook
    const wb = XLSX.utils.book_new()

    // Hoja 1: Plantilla de insumos
    const plantillaData = [
      [
        'NOMBRE',
        'DESCRIPCION',
        'UNIDAD_MEDIDA',
        'CATEGORIA',
        'PRESENTACION'
      ],
      [
        'Alcohol etílico 70%',
        'Alcohol para desinfección y limpieza',
        'Litros',
        'Reactivos',
        'Frasco 1L',
      ],
      [
        'Jeringas desechables 10ml',
        'Jeringas estériles para procedimientos',
        'Unidades',
        'Materiales',
        'Caja x 100 unidades',
      ],
      [
        'Cultivo bacteriano E.coli',
        'Cultivo para prácticas de microbiología',
        'Placas',
        'Material_Biologico',
        'Placa Petri',
      ]
    ]

    const wsPlantilla = XLSX.utils.aoa_to_sheet(plantillaData)

    // Configurar ancho de columnas
    wsPlantilla['!cols'] = [
      { width: 25 }, // NOMBRE
      { width: 35 }, // DESCRIPCION
      { width: 15 }, // UNIDAD_MEDIDA
      { width: 18 }, // CATEGORIA
      { width: 20 }, // PRESENTACION
    ]

    XLSX.utils.book_append_sheet(wb, wsPlantilla, 'Plantilla Insumos')

    // Hoja 2: Instrucciones y validaciones
    const instruccionesData = [
      ['INSTRUCCIONES PARA IMPORTACIÓN MASIVA DE INSUMOS'],
      [''],
      ['COLUMNAS OBLIGATORIAS:'],
      ['• NOMBRE: Nombre del insumo (texto, máximo 255 caracteres)'],
      ['• UNIDAD_MEDIDA: Unidad de medida (ej: Litros, Unidades, Gramos, ml)'],
      [''],
      ['COLUMNAS OPCIONALES:'],
      ['• DESCRIPCION: Descripción detallada del insumo'],
      ['• CATEGORIA: Reactivos | Materiales | Material_Biologico (por defecto: Materiales)'],
      ['• PRESENTACION: Formato de presentación (ej: Frasco 500ml, Caja x 100)'],
      [''],
      [''],
      ['NOTAS IMPORTANTES:'],
      ['• Los códigos de insumos se generan automáticamente'],
      ['• Las fechas deben estar en formato YYYY-MM-DD'],
      ['• El stock por laboratorio es opcional (0 por defecto)'],
      ['• Las categorías deben ser exactamente: Reactivos, Materiales o Material_Biologico'],
      ['• Elimine esta hoja antes de importar el archivo']
    ]

    const wsInstrucciones = XLSX.utils.aoa_to_sheet(instruccionesData)
    wsInstrucciones['!cols'] = [{ width: 80 }, { width: 15 }, { width: 30 }]

    // Hacer la primera fila más grande y en negrita
    wsInstrucciones['A1'].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center' }
    }

    XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'INSTRUCCIONES')

    // Configurar respuesta para descarga
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
    const timestamp = new Date().toISOString().slice(0, 10)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=plantilla_insumos_${timestamp}.xlsx`)
    res.send(buffer)

    console.log('✅ Plantilla Excel generada y enviada')

  } catch (error) {
    console.error('❌ Error al generar plantilla Excel:', error)
    res.status(500).json({
      success: false,
      message: 'Error al generar la plantilla Excel'
    })
  }
}

//Procesar archivo Excel para importación masiva de insumos
export const previsualizarImportacionMasiva = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      })
    }

    console.log('📊 Previsualizando importación masiva de insumos...')
    console.log('📁 Archivo recibido:', req.file.originalname, 'Tamaño:', req.file.size)

    // Leer archivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    console.log('📋 Registros encontrados en Excel:', data.length)

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El archivo Excel está vacío o no tiene el formato correcto'
      })
    }

    const previewData = []
    const erroresGenerales = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2 // +2 porque Excel empieza en 1 y tenemos header
      const erroresFila = []

      // Validar y limpiar datos
      const nombre = row.NOMBRE ? row.NOMBRE.toString().trim() : ''
      const descripcion = row.DESCRIPCION ? row.DESCRIPCION.toString().trim() : ''
      const unidad_medida = row.UNIDAD_MEDIDA ? row.UNIDAD_MEDIDA.toString().trim() : ''
      const categoria = row.CATEGORIA ? row.CATEGORIA.toString().trim() : ''
      const presentacion = row.PRESENTACION ? row.PRESENTACION.toString().trim() : ''

      // Validar campos obligatorios
      if (!nombre) {
        erroresFila.push('NOMBRE es obligatorio')
      }
      if (!unidad_medida) {
        erroresFila.push('UNIDAD_MEDIDA es obligatorio')
      }

      // Validar categoría
      const categoriasValidas = ['Reactivos', 'Materiales', 'Material_Biologico']
      if (!categoriasValidas.includes(categoria)) {
        erroresFila.push(`Categoría inválida. Debe ser: ${categoriasValidas.join(', ')}`)
      }


      previewData.push({
        fila: rowNum,
        nombre,
        descripcion,
        unidad_medida,
        categoria,
        presentacion,
        errores: erroresFila
      })
    }

    console.log(`📊 Previsualización completada: ${previewData.length} filas procesadas`)

    res.json({
      success: true,
      data: previewData,
      total_filas: previewData.length,
      errores_generales: erroresGenerales
    })

  } catch (error) {
    console.error('❌ Error en previsualización de insumos:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno en la previsualización',
      error: error.message
    })
  }
}

//Ejecutar importación masiva de insumos
export const importacionMasiva = async (req, res) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      })
    }

    console.log('📊 Procesando importación masiva de insumos...')
    console.log('📁 Archivo recibido:', req.file.originalname, 'Tamaño:', req.file.size)

    // Leer archivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    console.log('📋 Registros encontrados en Excel:', data.length)

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El archivo Excel está vacío o no tiene el formato correcto'
      })
    }

    let procesados = 0
    let errores = []
    const resultados = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2 // +2 porque Excel empieza en 1 y tenemos header

      try {
        // Validar campos obligatorios
        if (!row.NOMBRE || !row.UNIDAD_MEDIDA) {
          errores.push(`Fila ${rowNum}: NOMBRE y UNIDAD_MEDIDA son obligatorios`)
          continue
        }

        // Limpiar y validar datos
        const nombre = row.NOMBRE.toString().trim()
        const descripcion = row.DESCRIPCION ? row.DESCRIPCION.toString().trim() : ''
        const unidad_medida = row.UNIDAD_MEDIDA.toString().trim()
        const categoria = row.CATEGORIA ? row.CATEGORIA.toString().trim() : ''
        const presentacion = row.PRESENTACION ? row.PRESENTACION.toString().trim() : ''

        // Validar categoría
        const categoriasValidas = ['Reactivos', 'Materiales', 'Material_Biologico']
        if (!categoriasValidas.includes(categoria)) {
          errores.push(`Fila ${rowNum}: Categoría inválida. Debe ser: ${categoriasValidas.join(', ')}`)
          continue
        }

        const { insumo_id, codigo } = await Insumo.createInsumo(nombre, descripcion || '', unidad_medida, categoria, presentacion || '', connection)


        resultados.push({
          fila: rowNum,
          codigo: codigo,
          nombre: nombre,
          categoria: categoria,
        })

        procesados++

      } catch (error) {
        console.error(`❌ Error procesando fila ${rowNum}:`, error)
        errores.push(`Fila ${rowNum}: ${error.message}`)
      }
    }

    if (errores.length > 0 && procesados === 0) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: 'No se pudo procesar ningún registro',
        errores: errores
      })
    }

    await connection.commit()

    console.log(`✅ Importación completada: ${procesados} insumos creados, ${errores.length} errores`)

    res.json({
      success: true,
      message: `Importación completada: ${procesados} insumos creados`,
      procesados: procesados,
      errores: errores.length,
      detalles_errores: errores,
      resultados: resultados
    })

  } catch (error) {
    await connection.rollback()
    console.error('❌ Error en importación masiva:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno en la importación masiva',
      error: error.message
    })
  } finally {
    connection.release()
  }
}

/*  try {
    const { laboratorio_id, tipo_movimiento, observaciones, reserva_id, detalles } = req.body

    // 🐛 DEBUG: Ver qué está llegando desde el frontend
    console.log('📦 Datos recibidos en registrarMovimientoManual:')
    console.log('  - laboratorio_id:', laboratorio_id, typeof laboratorio_id)
    console.log('  - tipo_movimiento:', tipo_movimiento, typeof tipo_movimiento)
    console.log('  - observaciones:', observaciones, typeof observaciones)
    console.log('  - reserva_id:', reserva_id, typeof reserva_id)
    console.log('  - detalles:', JSON.stringify(detalles, null, 2))

    // Validaciones
    if (!laboratorio_id || !tipo_movimiento || !detalles || detalles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos: laboratorio_id, tipo_movimiento y detalles son requeridos'
      })
    }

    // Verificar permisos
    if (req.user.rol !== 'Administrador' && !req.user.laboratorio_ids.includes(laboratorio_id)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para registrar movimientos en este laboratorio'
      })
    }

    await connection.beginTransaction()

    // 1. Crear el movimiento principal
    // Normalizar valores undefined/null/vacío
    const observacionesNormalizadas = (observaciones !== undefined && observaciones !== null && observaciones.trim() !== '') 
      ? observaciones.trim() 
      : null
    const reservaIdNormalizado = (reserva_id !== undefined && reserva_id !== null && reserva_id > 0) 
      ? reserva_id 
      : null

    console.log('🔧 Valores normalizados para INSERT:')
    console.log('  - observaciones:', observacionesNormalizadas, typeof observacionesNormalizadas)
    console.log('  - reserva_id:', reservaIdNormalizado, typeof reservaIdNormalizado)

    const [movimientoResult] = await connection.execute(
      `INSERT INTO movimientos_insumos 
       (laboratorio_id, usuario_id, tipo_movimiento, fecha_movimiento, fecha_ingreso, observaciones, reserva_id)
       VALUES (?, ?, ?, NOW(), NOW(), 'PRUEBA', 'Movimiento manual')`,
      [
        laboratorio_id, 
        req.user.id, 
        tipo_movimiento, 
        observacionesNormalizadas, 
        reservaIdNormalizado
      ]
    )

    console.log('✅ Movimiento manual:', movimientoResult.insertId)
    const movimientoId = movimientoResult.insertId

    // 2. Procesar cada detalle
    for (const detalle of detalles) {
      const { insumo_id, cantidad, lote, fecha_vencimiento, entrada_detalle_id } = detalle

      if (tipo_movimiento === 'entrada') {
        // ENTRADA: Crear nuevo lote con saldo = cantidad
        // Normalizar valores: cadena vacía '', undefined o null -> valor por defecto
        const loteNormalizado = (lote !== undefined && lote !== null && lote.trim() !== '') 
          ? lote.trim() 
          : `LOTE-${Date.now()}-${insumo_id}`
        
        const fechaVencimientoNormalizada = (fecha_vencimiento !== undefined && fecha_vencimiento !== null && fecha_vencimiento.trim() !== '') 
          ? fecha_vencimiento.trim() 
          : null
        

        await connection.execute(
          `INSERT INTO movimiento_insumo_detalle 
           (movimiento_id, insumo_id, cantidad, saldo, lote, fecha_vencimiento)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            movimientoId,
            insumo_id,
            cantidad,
            cantidad, // saldo inicial = cantidad
            loteNormalizado,
            fechaVencimientoNormalizada
          ]
        )

        // Actualizar inventario_insumos (aumentar)
        await connection.execute(
          `INSERT INTO inventario_insumos (laboratorio_id, insumo_id, stock_disponible)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE stock_disponible = stock_disponible + ?`,
          [laboratorio_id, insumo_id, cantidad, cantidad]
        )

      } else if (tipo_movimiento === 'salida') {
        // SALIDA: Reducir saldo del lote de entrada seleccionado
        if (!entrada_detalle_id) {
          throw new Error(`El insumo ${insumo_id} requiere entrada_detalle_id para salidas`)
        }

        // Verificar que el lote tiene saldo suficiente
        const [loteCheck] = await connection.execute(
          `SELECT mid.saldo, mi.laboratorio_id
           FROM movimiento_insumo_detalle mid
           INNER JOIN movimientos_insumos mi ON mid.movimiento_id = mi.id
           WHERE mid.id = ? AND mid.insumo_id = ?`,
          [entrada_detalle_id, insumo_id]
        )

        if (loteCheck.length === 0) {
          throw new Error(`Lote de entrada ${entrada_detalle_id} no encontrado`)
        }

        if (loteCheck[0].laboratorio_id !== laboratorio_id) {
          throw new Error(`El lote pertenece a otro laboratorio`)
        }

        const saldoActual = loteCheck[0].saldo || 0
        if (saldoActual < cantidad) {
          throw new Error(`Saldo insuficiente en el lote ${entrada_detalle_id}. Disponible: ${saldoActual}, Solicitado: ${cantidad}`)
        }

        // Reducir saldo del lote de entrada
        await connection.execute(
          `UPDATE movimiento_insumo_detalle 
           SET saldo = saldo - ?
           WHERE id = ?`,
          [cantidad, entrada_detalle_id]
        )

        // Registrar el detalle de salida (sin saldo, ya que es salida)
        await connection.execute(
          `INSERT INTO movimiento_insumo_detalle 
           (movimiento_id, insumo_id, cantidad, saldo, lote)
           VALUES (?, ?, ?, NULL, 
             (SELECT lote FROM movimiento_insumo_detalle WHERE id = ?))`,
          [movimientoId, insumo_id, cantidad, entrada_detalle_id]
        )

        // Actualizar inventario_insumos (reducir)
        await connection.execute(
          `UPDATE inventario_insumos 
           SET stock_disponible = stock_disponible - ?
           WHERE laboratorio_id = ? AND insumo_id = ?`,
          [cantidad, laboratorio_id, insumo_id]
        )
      }
    }

    await connection.commit()

    console.log(`✅ Movimiento ${tipo_movimiento} registrado exitosamente: ID ${movimientoId}`)

    res.json({
      success: true,
      message: `Movimiento de ${tipo_movimiento} registrado correctamente`,
      movimiento_id: movimientoId
    })

  } catch (error) {
    await connection.rollback()
    console.error('❌ Error al registrar movimiento manual:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Error al registrar el movimiento',
      error: error.message
    })
  } finally {
    connection.release()
  }
}
*/