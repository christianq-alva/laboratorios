// Generar plantilla Excel para carga masiva
import { pool } from '../config/database.js'
import XLSX from 'xlsx'
import { Inventario } from '../models/Inventario.js'
import { Laboratorio } from '../models/Laboratorio.js'
//Obtener los insumos y su stock de todos los laboratorios
export const getAllInsumosWithStock = async (req, res) => {
  try {
    const [insumos] = await Inventario.getAllInsumosConSaldo(req.user.rol, req.user.laboratorio_ids)
    res.status(200).json({
      data: insumos
    })
  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
}
//Obtener los insumos y su stock de un laboratorio
export const getInsumosWithStock = async (req, res) => {
  const { laboratorio_id } = req.query;
  try {
    const [insumos] = await Inventario.getInsumosConSaldo(laboratorio_id)
    res.status(200).json({
      data: insumos
    })
  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
}
//Obtener solo los insumos con stock de un laboratorio
export const getInsumosWithPositiveStock = async (req, res) => {
  const { laboratorio_id } = req.query;
  try {
    const [insumos] = await Inventario.getInsumosConSaldoPositivo(laboratorio_id)
    res.status(200).json({
      data: insumos
    })
  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
}
// Obtener actividad de movimientos de insumos
export const getActividadInsumos = async (req, res) => {
  try {
    const { laboratorio_id, fecha_inicio, fecha_fin, tipo_movimiento } = req.query
    const rows = await Inventario.getActividadInsumos(req.user.rol, req.user.laboratorio_ids, laboratorio_id, fecha_inicio, fecha_fin, tipo_movimiento)
    // Convertir fechas al formato ISO para el frontend
    const actividadConFechasISO = rows.map(row => ({
      ...row,
      fecha_ingreso: row.fecha_ingreso ? new Date(row.fecha_ingreso).toISOString() : null,
      fecha_movimiento: row.fecha_movimiento,
      reserva_fecha_inicio: row.reserva_fecha_inicio ? new Date(row.reserva_fecha_inicio).toISOString() : null,
      reserva_fecha_fin: row.reserva_fecha_fin ? new Date(row.reserva_fecha_fin).toISOString() : null
    }))
    res.status(200).json({
      data: actividadConFechasISO,
      total_movimientos: rows.length,
      filtros_aplicados: {
        laboratorio_id: laboratorio_id || null,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        tipo_movimiento: tipo_movimiento || null
      }
    })
  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
}
export const generarPlantillaReabastecimiento = async (req, res) => {
  try {
    console.log('📊 Generando plantilla Excel para carga masiva...')
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
      t: 'Código único del insumo (ej: INS-0001)'
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
      t: 'Cantidad a abastecer (número entero positivo)'
    }]
    XLSX.utils.book_append_sheet(wb, wsPlantilla, 'Plantilla Reabastecimiento')
    // Hoja 2: Lista de insumos disponibles
    const insumosData = [
      ['LAB_CODIGO', 'LAB_NOMBRE', 'INS_CODIGO', 'INS_NOMBRE', 'INS_UNIDAD_MEDIDA'],
      ...insumos_laboratorios.map(i => [i.lab_codigo, i.lab_nombre, i.ins_codigo, i.ins_nombre, i.ins_unidad_medida])
    ]
    const wsInsumos = XLSX.utils.aoa_to_sheet(insumosData)
    wsInsumos['!cols'] = [
      { width: 12 },
      { width: 40 },
      { width: 12 },
      { width: 30 },
      { width: 15 }
    ]
    XLSX.utils.book_append_sheet(wb, wsInsumos, 'Insumos Configurados')
    // Generar buffer del archivo
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    // Configurar headers para descarga
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla_reabastecimiento.xlsx')
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Length', buffer.length)
    console.log('✅ Plantilla Excel generada exitosamente')
    res.send(buffer)
  } catch (error) {
    console.error('Error generando plantilla Excel:', error)
    res.status(500).json({
      message: 'Error al generar la plantilla Excel'
    })
  }
}
// Procesar archivo Excel cargado
export const procesarArchivoExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No se ha subido ningún archivo'
      })
    }
    const { laboratorio_id } = req.query;
    // Leer el archivo Excel desde el buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    // Convertir a JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    // Validar que tenga datos
    if (jsonData.length < 2) {
      return res.status(400).json({
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
      const cantidad = parseInt(fila[3])
      // Validar datos básicos
      if (!codigoInsumo || !cantidad) {
        errores.push(`Fila ${i + 1}: Datos incompletos`)
        continue
      }
      if (isNaN(cantidad) || cantidad <= 0) {
        errores.push(`Fila ${i + 1}: La cantidad debe ser un número entero positivo`)
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
    console.log(datosReabastecimiento);
    console.log(laboratorio_id)
    if (datosReabastecimiento.length === 0) {
      return res.status(400).json({
        message: 'No se encontraron datos válidos para procesar',
        errores: errores
      })
    }
    // Obtener todos los pares válidos de laboratorio-insumo
    const inventario = await Inventario.getInsumosConfiguradosByLaboratorio(laboratorio_id);
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
        insumo_unidad: item.ins_unidad_medida,
        cantidad: dato.cantidad,
        insumo_lote: dato.lote,
        insumo_fecha_venc: dato.fecha_venc
      });
    }
    res.status(200).json({
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
    res.status(500).json({
      message: 'Error al procesar el archivo Excel',
      error: error.message
    })
  }
}
// Ejecutar reabastecimiento masivo
export const ejecutarReabastecimientoMasivo = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const { datos_reabastecimiento, fecha_movimiento, motivo_general, laboratorio_id } = req.body
    const userId = req.user.userId
    await Inventario.registrarMovimientoManual(connection, userId, fecha_movimiento, laboratorio_id, 'entrada', motivo_general, null, datos_reabastecimiento)
    res.status(200).json({
      message: 'Reabastecimiento masivo completado exitosamente',
      data: {
        total_registros: datos_reabastecimiento.length,
        registros_procesados: 0,
        registros_fallidos: 0,
        motivo: motivo_general,
        resultados: []
      }
    })
  } catch (error) {
    await connection.rollback()
    res.status(500).json({
      message: 'Error interno al ejecutar el reabastecimiento masivo',
      error: error.message
    })
  } finally {
    connection.release()
  }
}
//Obtener lotes con saldo disponible por laboratorio e insumo
export const getLotesConSaldo = async (req, res) => {
  try {
    const { laboratorio_id, insumo_id } = req.query
    if (!laboratorio_id) {
      return res.status(400).json({
        message: 'El laboratorio_id es requerido'
      })
    }
    if (!insumo_id) {
      return res.status(400).json({
        message: 'El insumo_id es requerido'
      })
    }
    const labId = parseInt(laboratorio_id)
    // Verificar permisos
    if (req.user.rol !== 'Administrador' && !req.user.laboratorio_ids.includes(labId)) {
      return res.status(403).json({
        message: 'No tienes permisos para ver los lotes de este laboratorio'
      })
    }
    const lotes = await Inventario.getLotesConSaldo(laboratorio_id, insumo_id);
    res.status(200).json({
      data: lotes
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener lotes con saldo',
      error: error.message
    })
  }
}
// Registrar movimiento manual (entrada o salida)
export const registrarMovimientoManual = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const { laboratorio_id, tipo_movimiento, fecha_movimiento, observaciones, reserva_id, detalles } = req.body
    // Validaciones básicas
    if (!laboratorio_id) {
      return res.status(400).json({
        message: 'El laboratorio_id es requerido'
      })
    }
    if (!tipo_movimiento || !['entrada', 'salida'].includes(tipo_movimiento)) {
      return res.status(400).json({
        message: 'El tipo_movimiento debe ser "entrada" o "salida"'
      })
    }
    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        message: 'Los detalles del movimiento son requeridos'
      })
    }
    const movimientoId = await Inventario.registrarMovimientoManual(connection, req.user.userId, fecha_movimiento, laboratorio_id, tipo_movimiento, observaciones, reserva_id, detalles)
    //Respuesta
    res.status(200).json({
      message: `Movimiento de ${tipo_movimiento} registrado correctamente`,
      movimiento_id: movimientoId
    })
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error al registrar el movimiento'
    })
  }
  finally {
    connection.release()
  }
}