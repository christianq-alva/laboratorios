import { pool } from '../config/database.js'
import { Insumo } from '../models/Insumo.js'
import { Laboratorio } from '../models/Laboratorio.js'
import { Inventario } from '../models/Inventario.js'
import { Unidad } from '../models/Unidad.js'
import { AppError } from '../utils/errors.js'
import XLSX from 'xlsx'

const categoriasValidas = ['Reactivos', 'Materiales', 'Material_Biologico', 'Farmacos', 'Insumos']

export const insumoService = {

  async actualizarInsumo(insumoId, data) {
    const exists = await Insumo.existsById(insumoId)
    if (!exists) throw new AppError('Insumo no encontrado', 404)
    const { affectedRows } = await Insumo.updateById(insumoId, {
      nombre: data.nombre,
      descripcion: data.descripcion || '',
      unidad_id: data.unidad_id,
      categoria: data.categoria,
      presentacion: data.presentacion || '',
      cantidad_por_presentacion: data.cantidad_por_presentacion || 1
    })
    if (affectedRows === 0) throw new AppError('Insumo no encontrado', 404)
  },

  async eliminarInsumo(insumoId) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const insumo = await Insumo.getById(insumoId, connection)
      if (!insumo) {
        await connection.rollback()
        throw new AppError('Insumo no encontrado', 404)
      }
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
        throw new AppError(`No se puede eliminar. El insumo "${insumo.nombre}" está siendo usado en el sistema: ${relaciones.join(', ')}.`, 409)
      }
      const { affectedRows } = await Insumo.deleteById(insumoId, connection)
      if (affectedRows === 0) {
        await connection.rollback()
        throw new AppError('Insumo no encontrado', 404)
      }
      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  async importacionMasiva(fileBuffer, user) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)
    if (!data || data.length === 0) {
      throw new AppError('El archivo Excel está vacío o no tiene el formato correcto', 400)
    }
    let procesados = 0
    const errores = []
    const resultados = []
    const labAsignaciones = []
    const stockPorLab = new Map() // Map<laboratorio_id, [{insumo_id, cantidad, lote, fecha_vencimiento}]>
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const rowNum = i + 2
        try {
          if (!row.NOMBRE) {
            errores.push(`Fila ${rowNum}: NOMBRE es obligatorio`)
            continue
          }
          if (!row.UNIDAD_MEDIDA) {
            errores.push(`Fila ${rowNum}: UNIDAD_MEDIDA es obligatorio`)
            continue
          }
          const unidadExists = await Unidad.existsById(row.UNIDAD_MEDIDA, connection)
          if (!unidadExists) {
            errores.push(`Fila ${rowNum}: UNIDAD_MEDIDA inválida: ${row.UNIDAD_MEDIDA}`)
            continue
          }
          const nombre = row.NOMBRE.toString().trim()
          const descripcion = row.DESCRIPCION ? row.DESCRIPCION.toString().trim() : ''
          const categoria = row.CATEGORIA ? row.CATEGORIA.toString().trim() : ''
          const presentacion = row.PRESENTACION ? row.PRESENTACION.toString().trim() : ''
          const cantidad_por_presentacion = row.CANTIDAD_POR_PRESENTACION != null && row.CANTIDAD_POR_PRESENTACION.toString().trim() !== ''
            ? parseFloat(row.CANTIDAD_POR_PRESENTACION.toString().trim())
            : 1
          const unidad_medida = await Unidad.getById(row.UNIDAD_MEDIDA, connection)
          if (!categoriasValidas.includes(categoria)) {
            errores.push(`Fila ${rowNum}: Categoría inválida. Debe ser: ${categoriasValidas.join(', ')}`)
            continue
          }
          if (isNaN(cantidad_por_presentacion) || cantidad_por_presentacion <= 0) {
            errores.push(`Fila ${rowNum}: CANTIDAD_POR_PRESENTACION debe ser un número mayor a 0`)
            continue
          }
          // Validar LABORATORIO_CODIGO si se proporcionó
          let laboratorio_id = null
          if (row.LABORATORIO_CODIGO) {
            const labCodigo = row.LABORATORIO_CODIGO.toString().trim()
            const lab = await Laboratorio.findByCodigo(labCodigo, connection)
            if (!lab) {
              errores.push(`Fila ${rowNum}: LABORATORIO_CODIGO inválido: ${labCodigo}`)
              continue
            }
            laboratorio_id = lab.id
          }
          // Parsear y validar campos de stock
          const cantidad = row.CANTIDAD ? parseFloat(row.CANTIDAD.toString()) : 0
          if (row.CANTIDAD && (isNaN(cantidad) || cantidad <= 0)) {
            errores.push(`Fila ${rowNum}: CANTIDAD debe ser un número positivo`)
            continue
          }
          const lote = row.LOTE ? row.LOTE.toString().trim() : null
          if (lote && !cantidad) {
            errores.push(`Fila ${rowNum}: LOTE requiere CANTIDAD`)
            continue
          }
          if (cantidad > 0 && !laboratorio_id) {
            errores.push(`Fila ${rowNum}: CANTIDAD requiere LABORATORIO_CODIGO`)
            continue
          }
          // Parsear FECHA_VENCIMIENTO — acepta Date (celda Excel) o texto YYYY-MM-DD
          let fecha_vencimiento = null
          if (row.FECHA_VENCIMIENTO) {
            const raw = row.FECHA_VENCIMIENTO
            if (raw instanceof Date) {
              fecha_vencimiento = raw.toISOString().slice(0, 10)
            } else {
              fecha_vencimiento = raw.toString().trim()
              if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_vencimiento)) {
                errores.push(`Fila ${rowNum}: FECHA_VENCIMIENTO debe tener formato YYYY-MM-DD`)
                continue
              }
            }
          }
          const { insumo_id, codigo } = await Insumo.create(nombre, descripcion || '', unidad_medida.id, categoria, presentacion || '', cantidad_por_presentacion, connection)
          if (laboratorio_id !== null) {
            labAsignaciones.push({ laboratorio_id, insumo_id })
          }
          if (cantidad > 0 && laboratorio_id !== null) {
            if (!stockPorLab.has(laboratorio_id)) stockPorLab.set(laboratorio_id, [])
            stockPorLab.get(laboratorio_id).push({ insumo_id, cantidad, lote, fecha_vencimiento })
          }
          resultados.push({
            fila: rowNum,
            codigo,
            nombre,
            unidad_medida: unidad_medida.nombre,
            categoria,
            laboratorio_codigo: laboratorio_id !== null ? row.LABORATORIO_CODIGO.toString().trim() : null,
            lote,
            cantidad: cantidad || null
          })
          procesados++
        } catch (error) {
          errores.push(`Fila ${rowNum}: ${error.message}`)
        }
      }
      if (errores.length > 0 && procesados === 0) {
        await connection.rollback()
        const err = new AppError('No se pudo procesar ningún registro', 400)
        err.errores = errores
        throw err
      }
      await Laboratorio.asignarInsumosNuevos(labAsignaciones, connection)
      const hoy = new Date().toISOString().slice(0, 10)
      for (const [laboratorio_id, detalles] of stockPorLab.entries()) {
        await Inventario.registrarMovimiento(
          connection,
          user.userId,
          hoy,
          laboratorio_id,
          'entrada',
          'Importación masiva de insumos',
          null,
          detalles
        )
      }
      await connection.commit()
      return { procesados, errores, resultados }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  async actualizarPreciosMasivo(fileBuffer, user) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      throw new AppError('El archivo Excel está vacío', 400)
    }
    const worksheet = workbook.Sheets[sheetName]

    // Validar headers estrictamente: CODIGO y PRECIO deben existir tal cual
    const headerRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0, blankrows: false })
    const headers = (headerRows[0] || []).map((h) => (h == null ? '' : h.toString().trim()))
    if (!headers.includes('CODIGO') || !headers.includes('PRECIO')) {
      throw new AppError(
        'El archivo no tiene los encabezados esperados. Debe contener las columnas exactas: CODIGO y PRECIO (CANTIDAD_POR_PRESENTACION es opcional; no modifiques los nombres del Excel exportado).',
        400
      )
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null })
    if (!rows || rows.length === 0) {
      throw new AppError('El archivo no contiene filas para procesar', 400)
    }

    const errores = []
    const round2 = (n) => Math.round(n * 100) / 100
    const round4 = (n) => Math.round(n * 10000) / 10000

    // Primera pasada: validar cada fila y detectar duplicados de CODIGO con valores distintos
    const filasValidas = []   // { rowNum, codigo, precio, cantidad_por_presentacion }
    const codigoBuckets = new Map() // codigo -> Set de combinaciones precio|cantidad

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2

      const codigoRaw = row.CODIGO
      const precioRaw = row.PRECIO
      const cantidadRaw = row.CANTIDAD_POR_PRESENTACION

      if (codigoRaw == null || codigoRaw.toString().trim() === '') {
        errores.push(`Fila ${rowNum}: CODIGO es obligatorio`)
        continue
      }
      if (precioRaw == null || precioRaw.toString().trim() === '') {
        errores.push(`Fila ${rowNum}: PRECIO es obligatorio`)
        continue
      }

      const codigo = codigoRaw.toString().trim()
      const precio = parseFloat(precioRaw.toString().trim())

      if (isNaN(precio) || precio < 0) {
        errores.push(`Fila ${rowNum}: PRECIO debe ser un número mayor o igual a 0`)
        continue
      }

      // CANTIDAD_POR_PRESENTACION es opcional: vacío = conservar el valor actual del insumo
      let cantidad_por_presentacion = null
      if (cantidadRaw != null && cantidadRaw.toString().trim() !== '') {
        const cantidad = parseFloat(cantidadRaw.toString().trim())
        if (isNaN(cantidad) || cantidad <= 0) {
          errores.push(`Fila ${rowNum}: CANTIDAD_POR_PRESENTACION debe ser un número mayor a 0`)
          continue
        }
        cantidad_por_presentacion = round4(cantidad)
      }

      const precioRedondeado = round2(precio)
      if (!codigoBuckets.has(codigo)) codigoBuckets.set(codigo, new Set())
      codigoBuckets.get(codigo).add(`${precioRedondeado}|${cantidad_por_presentacion ?? ''}`)

      filasValidas.push({ rowNum, codigo, precio: precioRedondeado, cantidad_por_presentacion })
    }

    // Detectar códigos duplicados con valores distintos → marcar como error y excluir
    const codigosConflictivos = new Set()
    for (const [codigo, combos] of codigoBuckets.entries()) {
      if (combos.size > 1) {
        codigosConflictivos.add(codigo)
        errores.push(`CODIGO '${codigo}' aparece en varias filas con valores distintos. No se actualizará.`)
      }
    }

    // Dedupe: para los códigos válidos sin conflicto, quedarse con una sola entrada (la primera)
    const codigosProcesados = new Set()
    const filasAProcesar = []
    for (const fila of filasValidas) {
      if (codigosConflictivos.has(fila.codigo)) continue
      if (codigosProcesados.has(fila.codigo)) continue
      codigosProcesados.add(fila.codigo)
      filasAProcesar.push(fila)
    }

    if (filasAProcesar.length === 0) {
      const err = new AppError('No hay filas válidas para procesar', 400)
      err.errores = errores
      throw err
    }

    // Segunda pasada: actualizar precios en transacción
    let actualizados = 0
    let omitidos = 0
    const omitidosDetalle = []
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      for (const fila of filasAProcesar) {
        const insumo = await Insumo.findByCodigo(fila.codigo, connection)
        if (!insumo) {
          errores.push(`Fila ${fila.rowNum}: CODIGO '${fila.codigo}' no encontrado en el catálogo`)
          continue
        }

        const precioActual = await Insumo.getPrecioActual(insumo.id, connection)
        const precioActualRedondeado = precioActual != null ? round2(precioActual) : null
        const precioCambia = precioActualRedondeado !== fila.precio

        const cantidadActual = insumo.cantidad_por_presentacion != null
          ? round4(parseFloat(insumo.cantidad_por_presentacion))
          : 1
        const cantidadCambia = fila.cantidad_por_presentacion != null
          && fila.cantidad_por_presentacion !== cantidadActual

        if (!precioCambia && !cantidadCambia) {
          omitidos++
          omitidosDetalle.push(`Fila ${fila.rowNum}: ${fila.codigo} ya tiene el precio S/. ${fila.precio.toFixed(2)} y la misma presentación (sin cambio)`)
          continue
        }

        if (precioCambia) {
          await Insumo.setPrecio(insumo.id, fila.precio, user.userId, connection)
        }
        if (cantidadCambia) {
          await Insumo.setCantidadPorPresentacion(insumo.id, fila.cantidad_por_presentacion, connection)
        }
        actualizados++
      }

      await connection.commit()
      return {
        actualizados,
        omitidos,
        errores: errores.length,
        detalles_errores: errores,
        detalles_omitidos: omitidosDetalle,
      }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}
