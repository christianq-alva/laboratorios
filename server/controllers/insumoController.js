import { pool } from '../config/database.js'
import { Insumo } from '../models/Insumo.js'
import multer from 'multer'
import XLSX from 'xlsx'
import { Unidad } from '../models/Unidad.js'

const categoriasValidas = ['Reactivos', 'Materiales', 'Material_Biologico']

// Crear insumo
export const createInsumo = async (req, res) => {
  try {
    // Los datos ya están validados y transformados por el middleware de validación
    const { nombre, descripcion, unidad_id, categoria, presentacion } = req.body

    const { insumo_id, codigo } = await Insumo.create(
      nombre,
      descripcion || '',
      unidad_id,
      categoria,
      presentacion || ''
    )

    res.status(201).json({
      success: true,
      message: 'Insumo creado exitosamente'

    })
  } catch (error) {
    console.error('Error al crear insumo:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}
// Actualizar insumo
export const updateInsumo = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: insumoId } = req.params
    const { nombre, descripcion, unidad_id, categoria, presentacion } = req.body

    // Verificar que el insumo existe
    const exists = await Insumo.existsById(insumoId)
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Insumo no encontrado'
      })
    }

    // Actualizar insumo
    const { affectedRows } = await Insumo.updateById(insumoId, {
      nombre,
      descripcion: descripcion || '',
      unidad_id,
      categoria,
      presentacion: presentacion || ''
    })

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Insumo no encontrado'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Insumo actualizado exitosamente'
    })
  } catch (error) {
    console.error('Error al actualizar insumo:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}
// Eliminar insumo
export const deleteInsumo = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    // El ID ya está validado y transformado por el middleware de validación
    const { id: insumoId } = req.params

    // Verificar que el insumo existe
    const insumo = await Insumo.getById(insumoId, connection)
    if (!insumo) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'Insumo no encontrado'
      })
    }

    // Verificar relaciones antes de eliminar (validación de negocio)
    const relations = await Insumo.checkRelations(insumoId, connection)
    if (relations.total > 0) {
      const relaciones = []
      if (relations.detalleMovimientos > 0) {
        relaciones.push(`Tiene ${relations.detalleMovimientos} registro(s) de lotes`)
      }
      if (relations.inventario > 0) {
        relaciones.push(`Configurado en ${relations.inventario} laboratorio(s)`)
      }
      await connection.rollback()
      return res.status(409).json({
        success: false,
        message: `No se puede eliminar. El insumo "${insumo.nombre}" está siendo usado en el sistema: ${relaciones.join(', ')}.`
      })
    }

    // Eliminar insumo
    const { affectedRows } = await Insumo.deleteById(insumoId, connection)
    if (affectedRows === 0) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'Insumo no encontrado'
      })
    }

    await connection.commit()
    res.status(200).json({
      success: true,
      message: 'Insumo eliminado exitosamente'
    })
  } catch (error) {
    await connection.rollback()
    // Manejar errores de restricción de clave foránea
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar. El insumo está siendo usado en el sistema.'
      })
    }
    console.error('Error al eliminar insumo:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  } finally {
    connection.release()
  }
}
// Obtener todos los insumos
export const getAllInsumos = async (req, res) => {
  try {
    const insumos = await Insumo.getAll()
    res.status(200).json({
      success: true,
      data: insumos
    })
  } catch (error) {
    console.error('Error al obtener insumos:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
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
    // Crear workbook
    const wb = XLSX.utils.book_new()
    const unidades = await Unidad.getAll()
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
        '1',
        'Reactivos',
        'Frasco 1L',
      ],
      [
        'Jeringas desechables 10ml',
        'Jeringas estériles para procedimientos',
        '2',
        'Materiales',
        'Caja x 100 unidades',
      ],
      [
        'Cultivo bacteriano E.coli',
        'Cultivo para prácticas de microbiología',
        '3',
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
      ['• UNIDAD_MEDIDA: ID de la unidad de medida'],
      ['• CATEGORIA: Reactivos | Materiales | Material_Biologico'],
      [''],
      ['COLUMNAS OPCIONALES:'],
      ['• DESCRIPCION: Descripción detallada del insumo'],
      ['• PRESENTACION: Formato de presentación (Ej.: Frasco 500ml, Caja x 100)'],
      [''],
      [''],
      ['NOTAS IMPORTANTES:'],
      ['• Los códigos de insumos se generan automáticamente'],
      ['• Las unidades deben ser válidas'],
      ['• Las categorías deben ser exactamente: Reactivos, Materiales o Material_Biologico'],
      ['• Las fechas deben estar en formato YYYY-MM-DD'],
      ['• Elimine esta hoja antes de importar el archivo']
    ]
    const unidadesData = [
      ['ID', 'NOMBRE', 'SIMBOLO'],
      ...unidades.map(u => [u.id, u.nombre, u.simbolo]),
      [''],
    ]
    const wsUnidades = XLSX.utils.aoa_to_sheet(unidadesData)
    wsUnidades['!cols'] = [{ width: 10 }, { width: 30 }, { width: 10 }]
    const wsInstrucciones = XLSX.utils.aoa_to_sheet(instruccionesData)
    wsInstrucciones['!cols'] = [{ width: 80 }, { width: 15 }, { width: 30 }]
    // Hacer la primera fila más grande y en negrita
    wsInstrucciones['A1'].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center' }
    }
    XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'INSTRUCCIONES')
    XLSX.utils.book_append_sheet(wb, wsUnidades, 'UNIDADES DISPONIBLES')
    // Configurar respuesta para descarga
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
    const timestamp = new Date().toISOString().slice(0, 10)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=plantilla_insumos_${timestamp}.xlsx`)
    res.send(buffer)
  } catch (error) {
    console.error('Error al generar plantilla Excel de insumos:', error)
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
    // Leer archivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)
    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El archivo Excel está vacío o no tiene el formato correcto'
      })
    }

    console.log('data', data)
    const previewData = []
    const erroresGenerales = []
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2 // +2 porque Excel empieza en 1 y tenemos header
      const erroresFila = []
      // Validar y limpiar datos
      const nombre = row.NOMBRE ? row.NOMBRE.toString().trim() : ''
      const descripcion = row.DESCRIPCION ? row.DESCRIPCION.toString().trim() : ''
      const unidad_id = row.UNIDAD_MEDIDA ? parseInt(row.UNIDAD_MEDIDA) : null
      const categoria = row.CATEGORIA ? row.CATEGORIA.toString().trim() : ''
      const presentacion = row.PRESENTACION ? row.PRESENTACION.toString().trim() : ''



      // Validar campos obligatorios
      if (!nombre) {
        erroresFila.push('NOMBRE es obligatorio')
      }

      if (!unidad_id) {
        erroresFila.push('UNIDAD_MEDIDA es obligatorio')
      }
      const unidad_medida = ''
      if (unidad_id) {
        unidad_medida = await Unidad.getById(unidad_id)
        if (!unidad_medida) {
          erroresFila.push(`UNIDAD_MEDIDA inválida: ${unidad_id}`)
        }
      }

      const unidad_nombre = unidad_medida ? unidad_medida.nombre : 'N/A'
      const unidad_simbolo = unidad_medida ? unidad_medida.simbolo : 'N/A'

      // Validar categoría
      if (!categoriasValidas.includes(categoria)) {
        erroresFila.push(`Categoría inválida. Debe ser: ${categoriasValidas.join(', ')}`)
      }



      previewData.push({
        fila: rowNum,
        nombre,
        descripcion,
        unidad_nombre,
        unidad_simbolo,
        categoria,
        presentacion,
        errores: erroresFila
      })
    }
    res.status(200).json({
      success: true,
      data: previewData,
      total_filas: previewData.length,
      errores_generales: erroresGenerales
    })
  } catch (error) {
    console.error('Error en previsualización de importación masiva de insumos:', error)
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
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      })
    }
    // Leer archivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)
    if (data.length === 0) {
      await connection.rollback()
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
        if (!row.NOMBRE) {
          errores.push(`Fila ${rowNum}: NOMBRE es obligatorio`)
          continue
        }
        if (!row.UNIDAD_MEDIDA) {
          errores.push(`Fila ${rowNum}: UNIDAD_MEDIDA es obligatorio`)
          continue
        }
        else {
          if (!await Unidad.existsById(row.UNIDAD_MEDIDA)) {
            errores.push(`Fila ${rowNum}: UNIDAD_MEDIDA inválida: ${row.UNIDAD_MEDIDA}`)
            continue
          }
        }
        // Limpiar y validar datos
        const nombre = row.NOMBRE.toString().trim()
        const descripcion = row.DESCRIPCION ? row.DESCRIPCION.toString().trim() : ''
        const categoria = row.CATEGORIA ? row.CATEGORIA.toString().trim() : ''
        const presentacion = row.PRESENTACION ? row.PRESENTACION.toString().trim() : ''
        const unidad_medida = await Unidad.getById(row.UNIDAD_MEDIDA)

        // Validar categoría
        if (!categoriasValidas.includes(categoria)) {
          errores.push(`Fila ${rowNum}: Categoría inválida. Debe ser: ${categoriasValidas.join(', ')}`)
          continue
        }
        const { insumo_id, codigo } = await Insumo.create(nombre, descripcion || '', unidad_medida.id, categoria, presentacion || '', connection)
        resultados.push({
          fila: rowNum,
          codigo: codigo,
          nombre: nombre,
          unidad_medida: unidad_medida.nombre,
          categoria: categoria,
        })
        procesados++
      } catch (error) {
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
    res.status(200).json({
      success: true,
      message: `Importación completada: ${procesados} insumos creados`,
      procesados: procesados,
      errores: errores.length,
      detalles_errores: errores,
      resultados: resultados
    })
  } catch (error) {
    await connection.rollback()
    console.error('Error en importación masiva de insumos:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno en la importación masiva',
      error: error.message
    })
  } finally {
    connection.release()
  }
}