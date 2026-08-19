// Generar plantilla Excel para carga masiva
import XLSX from 'xlsx'
import { Laboratorio } from '../models/Laboratorio.js'
import { inventarioService } from '../services/inventarioService.js'
//Obtener los insumos y su stock de todos los laboratorios
export const getAllInsumosWithStock = async (req, res, next) => {
  try {
    const insumos = await inventarioService.getAllInsumosWithStock(req.user.rol, req.user.laboratorio_ids)
    res.status(200).json({
      success: true,
      data: insumos
    })
  } catch (error) {
    next(error)
  }
}
//Obtener los insumos y su stock de un laboratorio
export const getInsumosWithStock = async (req, res, next) => {
  try {
    // El laboratorio_id ya está validado y transformado por el middleware de validación
    const { laboratorio_id } = req.query
    const insumos = await inventarioService.getInsumosWithStock(laboratorio_id)
    res.status(200).json({
      success: true,
      data: insumos
    })
  } catch (error) {
    next(error)
  }
}
//Obtener solo los insumos con stock de un laboratorio
export const getInsumosWithPositiveStock = async (req, res, next) => {
  try {
    // El laboratorio_id ya está validado y transformado por el middleware de validación
    const { laboratorio_id } = req.query
    const insumos = await inventarioService.getInsumosWithPositiveStock(laboratorio_id)
    res.status(200).json({
      success: true,
      data: insumos
    })
  } catch (error) {
    next(error)
  }
}
// Obtener actividad de movimientos de insumos
export const getActividadInsumos = async (req, res, next) => {
  try {
    // Los parámetros ya están validados y transformados por el middleware de validación
    const { laboratorio_id, fecha_inicio, fecha_fin, tipo_movimiento } = req.query
    const actividadConFechasISO = await inventarioService.getActividadInsumos(req.user.rol, req.user.laboratorio_ids, laboratorio_id, fecha_inicio, fecha_fin, tipo_movimiento)
    res.status(200).json({
      success: true,
      data: actividadConFechasISO,
      total_movimientos: actividadConFechasISO.length,
      filtros_aplicados: {
        laboratorio_id: laboratorio_id || null,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        tipo_movimiento: tipo_movimiento || null
      }
    })
  } catch (error) {
    next(error)
  }
}
export const generarPlantillaReabastecimiento = async (req, res) => {
  try {
    
    // Obtener todos los insumos y laboratorios con códigos
    const insumos_laboratorios = await Laboratorio.getLaboratorioInsumos()
    // Crear workbook
    const wb = XLSX.utils.book_new()
    // Hoja 1: Plantilla para completar
    const plantillaData = [
      ['CODIGO_INSUMO', 'LOTE', 'FECHA_VENCIMIENTO', 'CANTIDAD'],
      ['INS-0001', 'L0001', '01/11/2025', '50'],
      ['INS-0002', 'L0002', '01/11/2025', '100'],
      ['', '', '', '']
    ]
    const wsPlantilla = XLSX.utils.aoa_to_sheet(plantillaData)
    // Configurar ancho de columnas
    wsPlantilla['!cols'] = [
      { width: 18 },
      { width: 12 },
      { width: 19 },
      { width: 12 }
    ]
    // Agregar comentarios/validaciones en las celdas
    wsPlantilla['A1'].c = [{
      a: 'Sistema',
      t: 'Código único del insumo (Ej.: INS-0001)'
    }]
    wsPlantilla['B1'].c = [{
      a: 'Sistema',
      t: 'Lote del insumo'
    }]
    wsPlantilla['C1'].c = [{
      a: 'Sistema',
      t: 'Fecha de vencimiento del insumo'
    }]
    wsPlantilla['D1'].c = [{
      a: 'Sistema',
      t: 'Cantidad a abastecer en la unidad del insumo (ml, unidades, etc.), NO en presentaciones (frascos, cajas). Ver hoja de insumos disponibles'
    }]
    XLSX.utils.book_append_sheet(wb, wsPlantilla, 'Plantilla Reabastecimiento')
    // Hoja 2: Lista de insumos disponibles
    const insumosData = [
      ['LAB_CODIGO', 'LAB_NOMBRE', 'INS_CODIGO', 'INS_NOMBRE', 'INS_UNIDAD_SIMBOLO', 'INS_UNIDAD_NOMBRE'],
      ...insumos_laboratorios.map(i => [i.lab_codigo, i.lab_nombre, i.ins_codigo, i.ins_nombre, i.ins_unidad_simbolo, i.ins_unidad_nombre])
    ]
    const wsInsumos = XLSX.utils.aoa_to_sheet(insumosData)
    wsInsumos['!cols'] = [
      { width: 12 },
      { width: 40 },
      { width: 12 },
      { width: 30 },
      { width: 15 },
      { width: 15 }
    ]
    XLSX.utils.book_append_sheet(wb, wsInsumos, 'Insumos Configurados')
    // Generar buffer del archivo
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    // Configurar headers para descarga
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla_reabastecimiento.xlsx')
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Length', buffer.length)
    res.send(buffer)
  } catch (error) {
    next(error)
  }
}
// Procesar archivo Excel cargado
export const procesarArchivoExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha subido ningún archivo'
      })
    }
    // El laboratorio_id ya está validado y transformado por el middleware de validación
    const { laboratorio_id } = req.query
    // Leer el archivo Excel desde el buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    // Convertir a JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    // Validar que tenga datos
    if (jsonData.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El archivo Excel debe contener al menos una fila de datos además del encabezado'
      })
    }
    // Validar encabezados esperados
    const headers = jsonData[0]
    const expectedHeaders = ['CODIGO_INSUMO', 'LOTE', 'FECHA_VENCIMIENTO', 'CANTIDAD']
    const headersValid = expectedHeaders.every(header =>
      headers.some(h => h && h.toString().toUpperCase().includes(header))
    )
    if (!headersValid) {
      return res.status(400).json({
        success: false,
        message: 'El archivo debe contener las columnas: CODIGO_INSUMO, LOTE, FECHA_VENCIMIENTO, CANTIDAD'
      })
    }
    // Procesar datos
    const datosReabastecimiento = []
    const errores = []
    for (let i = 1; i < jsonData.length; i++) {
      const fila = jsonData[i]
      // Saltar filas vacías
      if (!fila || fila.every(cell => !cell)) continue
      const codigoInsumo = fila[0]?.toString().trim()
      const lote = fila[1].toString().trim()
      const fecha_vencimiento = fila[2].toString().trim()
      const cantidad = parseFloat(fila[3])
      // Validar datos básicos
      if (!codigoInsumo || !cantidad) {
        errores.push(`Fila ${i + 1}: Datos incompletos`)
        continue
      }
      if (isNaN(cantidad) || cantidad <= 0) {
        errores.push(`Fila ${i + 1}: La cantidad debe ser un número positivo mayor a 0`)
        continue
      }
      datosReabastecimiento.push({
        fila: i + 1,
        codigo_insumo: codigoInsumo,
        lote: lote,
        fecha_venc: fecha_vencimiento,
        cantidad: cantidad
      })
    }
    if (datosReabastecimiento.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se encontraron datos válidos para procesar',
        errores: errores
      })
    }
    // Obtener todos los pares válidos de laboratorio-insumo
    const inventario = await inventarioService.getInsumosConfiguradosByLaboratorio(laboratorio_id);
    // Crear mapa rápido de validación: "LABCODE|INSCODE" → datos combinados
    const mapaInventario = new Map(
      inventario.map(item => [
        item.ins_codigo,
        item
      ])
    );
    // Validar y enriquecer datos
    const datosValidados = []
    for (const dato of datosReabastecimiento) {
      const key = dato.codigo_insumo;
      const item = mapaInventario.get(key);
      if (!item) {
        errores.push(
          `Fila ${dato.fila}: El insumo "${dato.codigo_insumo}" no está configurado para el laboratorio seleccionado.`
        );
        continue;
      }
      datosValidados.push({
        fila: dato.fila,
        insumo_id: item.ins_id,
        insumo_codigo: item.ins_codigo,
        insumo_nombre: item.ins_nombre,
        insumo_unidad_simbolo: item.ins_unidad_simbolo,
        insumo_unidad_nombre: item.ins_unidad_nombre,
        cantidad: dato.cantidad,
        insumo_lote: dato.lote,
        insumo_fecha_venc: dato.fecha_venc
      });
    }
    res.status(200).json({
      success: true,
      message: 'Archivo procesado exitosamente',
      data: {
        archivo: req.file.originalname,
        total_filas: jsonData.length - 1,
        registros_validos: datosValidados.length,
        registros_con_errores: errores.length,
        datos_validados: datosValidados,
        errores: errores
      }
    })
  } catch (error) {
    next(error)
  }
}
// Ejecutar reabastecimiento masivo
export const ejecutarReabastecimientoMasivo = async (req, res, next) => {
  try {
    const { datos_reabastecimiento, fecha_movimiento, motivo_general, laboratorio_id } = req.body
    const userId = req.user.userId
    const data = await inventarioService.ejecutarReabastecimientoMasivo(userId, fecha_movimiento, laboratorio_id, motivo_general, datos_reabastecimiento)
    res.status(200).json({
      success: true,
      message: 'Reabastecimiento masivo completado exitosamente',
      data
    })
  } catch (error) {
    next(error)
  }
}
//Obtener lotes con saldo disponible por laboratorio e insumo
export const getLotesConSaldo = async (req, res, next) => {
  try {
    // Los IDs ya están validados y transformados por el middleware de validación
    const { laboratorio_id, insumo_id } = req.query

    const lotes = await inventarioService.getLotesConSaldo(laboratorio_id, insumo_id)
    res.status(200).json({
      success: true,
      data: lotes
    })
  } catch (error) {
    next(error)
  }
}

// Obtener todos los lotes de un insumo agrupados por laboratorio
export const getLotesPorInsumo = async (req, res, next) => {
  try {
    const { insumo_id, laboratorio_id } = req.query
    const lotes = await inventarioService.getLotesPorInsumo(insumo_id, laboratorio_id, req.user)
    res.status(200).json({
      success: true,
      data: lotes
    })
  } catch (error) {
    next(error)
  }
}

export const getActividadDetalleInsumos = async (req, res, next) => {
  try {
    // Los IDs ya están validados y transformados por el middleware de validación
    const { insumo_id, laboratorio_id } = req.query
    const actividad = await inventarioService.getActividadDetalleInsumos(req.user.rol, req.user.laboratorio_ids, laboratorio_id, insumo_id)
    res.status(200).json({
      success: true,
      data: actividad
    })
  } catch (error) {
    next(error)
  }
}


// Registrar movimiento manual (entrada o salida)
export const registrarMovimientoManual = async (req, res, next) => {
  try {
    const { laboratorio_id, tipo_movimiento, fecha_movimiento, observaciones, reserva_id, detalles } = req.body
    const movimientoId = await inventarioService.registrarMovimientoManual(req.user.userId, fecha_movimiento, laboratorio_id, tipo_movimiento, observaciones, reserva_id, detalles)
    res.status(200).json({
      success: true,
      message: `Movimiento de ${tipo_movimiento} registrado correctamente`,
      movimiento_id: movimientoId
    })
  } catch (error) {
    next(error)
  }
}

export const getDetalleMovimiento = async (req, res, next) => {
  try {
    const { movimiento_id } = req.params
    const result = await inventarioService.getDetalleMovimiento(movimiento_id, req.user.rol, req.user.laboratorio_ids)
    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const eliminarMovimientoInventario = async (req, res) => {
  try {
    const { movimiento_id } = req.params
    await inventarioService.eliminarMovimientoInventario(movimiento_id)
    res.status(200).json({
      success: true,
      message: 'Movimiento de inventario eliminado correctamente'
    })
  } catch (error) {
    next(error)
  }
}