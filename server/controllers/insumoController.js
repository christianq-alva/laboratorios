import { Insumo } from '../models/Insumo.js'
import { Laboratorio } from '../models/Laboratorio.js'
import { insumoService } from '../services/insumoService.js'
import multer from 'multer'
import XLSX from 'xlsx'
import { Unidad } from '../models/Unidad.js'
import { AppError } from '../utils/errors.js'

const categoriasValidas = ['Reactivos', 'Materiales', 'Material_Biologico', 'Farmacos']

// Crear insumo
export const createInsumo = async (req, res, next) => {
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
    next(error)
  }
}
// Actualizar insumo
export const updateInsumo = async (req, res, next) => {
  try {
    const { id: insumoId } = req.params
    const { nombre, descripcion, unidad_id, categoria, presentacion } = req.body
    await insumoService.actualizarInsumo(insumoId, { nombre, descripcion, unidad_id, categoria, presentacion })
    res.status(200).json({
      success: true,
      message: 'Insumo actualizado exitosamente'
    })
  } catch (error) {
    next(error)
  }
}
// Eliminar insumo
export const deleteInsumo = async (req, res, next) => {
  try {
    const { id: insumoId } = req.params
    await insumoService.eliminarInsumo(insumoId)
    res.status(200).json({
      success: true,
      message: 'Insumo eliminado exitosamente'
    })
  } catch (error) {
    next(error)
  }
}
// Obtener precio e historial de un insumo
export const getPrecioInsumo = async (req, res, next) => {
  try {
    const { id: insumoId } = req.params
    const exists = await Insumo.existsById(insumoId)
    if (!exists) throw new AppError('Insumo no encontrado', 404)

    const historial = await Insumo.getHistorialPrecios(insumoId)
    const precioActual = historial.find(h => h.vigente_hasta === null)?.precio ?? null

    res.status(200).json({
      success: true,
      data: { precio_actual: precioActual !== null ? parseFloat(precioActual) : null, historial }
    })
  } catch (error) {
    next(error)
  }
}

// Establecer nuevo precio para un insumo
export const setPrecioInsumo = async (req, res, next) => {
  try {
    const { id: insumoId } = req.params
    const { precio } = req.body

    const precioNum = Number(precio)
    if (precio === undefined || precio === null || isNaN(precioNum) || precioNum < 0) {
      throw new AppError('El precio debe ser un número mayor o igual a 0', 400)
    }

    const exists = await Insumo.existsById(insumoId)
    if (!exists) throw new AppError('Insumo no encontrado', 404)

    await Insumo.setPrecio(insumoId, precioNum.toFixed(2), req.user.userId)

    res.status(200).json({ success: true, message: 'Precio actualizado exitosamente' })
  } catch (error) {
    next(error)
  }
}

// Obtener todos los insumos
export const getAllInsumos = async (req, res, next) => {
  try {
    const insumos = await Insumo.getAll()
    res.status(200).json({
      success: true,
      data: insumos
    })
  } catch (error) {
    next(error)
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
      cb(new AppError('Solo se permiten archivos Excel (.xlsx, .xls)', 400), false)
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  }
})
//Generar plantilla Excel para importación masiva de insumos
export const generarPlantillaImportacion = async (req, res, next) => {
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
        'PRESENTACION',
        'LABORATORIO_CODIGO',
        'LOTE',
        'CANTIDAD',
        'FECHA_VENCIMIENTO'
      ],
      [
        'Alcohol etílico 70%',
        'Alcohol para desinfección y limpieza',
        '1',
        'Reactivos',
        'Frasco 1L',
        'LAB-001',
        'L-2026-001',
        '10',
        '2026-12-31',
      ],
      [
        'Jeringas desechables 10ml',
        'Jeringas estériles para procedimientos',
        '2',
        'Materiales',
        'Caja x 100 unidades',
        'LAB-002',
        '',
        '50',
        '',
      ],
      [
        'Cultivo bacteriano E.coli',
        'Cultivo para prácticas de microbiología',
        '3',
        'Material_Biologico',
        'Placa Petri',
        '',
        '',
        '',
        '',
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
      { width: 20 }, // LABORATORIO_CODIGO
      { width: 15 }, // LOTE
      { width: 12 }, // CANTIDAD
      { width: 20 }, // FECHA_VENCIMIENTO
    ]
    XLSX.utils.book_append_sheet(wb, wsPlantilla, 'Plantilla Insumos')
    // Hoja 2: Instrucciones y validaciones
    const instruccionesData = [
      ['INSTRUCCIONES PARA IMPORTACIÓN MASIVA DE INSUMOS'],
      [''],
      ['COLUMNAS OBLIGATORIAS:'],
      ['• NOMBRE: Nombre del insumo (texto, máximo 255 caracteres)'],
      ['• UNIDAD_MEDIDA: ID de la unidad de medida'],
      ['• CATEGORIA: Reactivos | Materiales | Material_Biologico | Farmacos'],
      [''],
      ['COLUMNAS OPCIONALES:'],
      ['• DESCRIPCION: Descripción detallada del insumo'],
      ['• PRESENTACION: Formato de presentación (Ej.: Frasco 500ml, Caja x 100)'],
      ['• LABORATORIO_CODIGO: Código del laboratorio al que se asignará el insumo (Ej.: LAB-001)'],
      ['• LOTE: Número o código de lote (Ej.: L-2026-001). Requiere CANTIDAD si se especifica'],
      ['• CANTIDAD: Cantidad de stock a registrar. Requiere LABORATORIO_CODIGO si se especifica'],
      ['• FECHA_VENCIMIENTO: Fecha de vencimiento del lote en formato YYYY-MM-DD (Ej.: 2026-12-31)'],
      [''],
      [''],
      ['NOTAS IMPORTANTES:'],
      ['• Los códigos de insumos se generan automáticamente'],
      ['• Las unidades deben ser válidas'],
      ['• Las categorías deben ser exactamente: Reactivos, Materiales, Material_Biologico o Farmacos'],
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
    next(error)
  }
}
//Procesar archivo Excel para importación masiva de insumos
export const previsualizarImportacionMasiva = async (req, res, next) => {
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
      const laboratorio_codigo = row.LABORATORIO_CODIGO ? row.LABORATORIO_CODIGO.toString().trim() : ''
      const lote = row.LOTE ? row.LOTE.toString().trim() : ''
      const cantidad = row.CANTIDAD ? parseFloat(row.CANTIDAD.toString()) : 0
      const fecha_vencimiento_raw = row.FECHA_VENCIMIENTO
      let fecha_vencimiento = ''
      if (fecha_vencimiento_raw) {
        if (fecha_vencimiento_raw instanceof Date) {
          fecha_vencimiento = fecha_vencimiento_raw.toISOString().slice(0, 10)
        } else {
          fecha_vencimiento = fecha_vencimiento_raw.toString().trim()
        }
      }

      // Validar campos obligatorios
      if (!nombre) {
        erroresFila.push('NOMBRE es obligatorio')
      }

      if (!unidad_id) {
        erroresFila.push('UNIDAD_MEDIDA es obligatorio')
      }
      let unidad_medida = ''
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

      // Validar LABORATORIO_CODIGO si se proporcionó
      if (laboratorio_codigo) {
        const lab = await Laboratorio.findByCodigo(laboratorio_codigo)
        if (!lab) {
          erroresFila.push(`LABORATORIO_CODIGO inválido: ${laboratorio_codigo}`)
        }
      }

      // Validar campos de stock
      if (row.CANTIDAD && (isNaN(cantidad) || cantidad <= 0)) {
        erroresFila.push('CANTIDAD debe ser un número positivo')
      }
      if (lote && !cantidad) {
        erroresFila.push('LOTE requiere CANTIDAD')
      }
      if (cantidad > 0 && !laboratorio_codigo) {
        erroresFila.push('CANTIDAD requiere LABORATORIO_CODIGO')
      }
      if (fecha_vencimiento && !/^\d{4}-\d{2}-\d{2}$/.test(fecha_vencimiento)) {
        erroresFila.push('FECHA_VENCIMIENTO debe tener formato YYYY-MM-DD')
      }

      previewData.push({
        fila: rowNum,
        nombre,
        descripcion,
        unidad_nombre,
        unidad_simbolo,
        categoria,
        presentacion,
        laboratorio_codigo,
        lote,
        cantidad: cantidad || null,
        fecha_vencimiento,
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
    next(error)
  }
}
//Ejecutar importación masiva de insumos
export const importacionMasiva = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      })
    }
    const result = await insumoService.importacionMasiva(req.file.buffer, req.user)
    res.status(200).json({
      success: true,
      message: `Importación completada: ${result.procesados} insumos creados`,
      procesados: result.procesados,
      errores: result.errores.length,
      detalles_errores: result.errores,
      resultados: result.resultados
    })
  } catch (error) {
    next(error)
  }
}