import { pool } from '../config/database.js'
import { Insumo } from '../models/Insumo.js'
import { Laboratorio } from '../models/Laboratorio.js'
import { Inventario } from '../models/Inventario.js'
import { Unidad } from '../models/Unidad.js'
import { AppError } from '../utils/errors.js'
import XLSX from 'xlsx'

const categoriasValidas = ['Reactivos', 'Materiales', 'Material_Biologico']

export const insumoService = {

  async actualizarInsumo(insumoId, data) {
    const exists = await Insumo.existsById(insumoId)
    if (!exists) throw new AppError('Insumo no encontrado', 404)
    const { affectedRows } = await Insumo.updateById(insumoId, {
      nombre: data.nombre,
      descripcion: data.descripcion || '',
      unidad_id: data.unidad_id,
      categoria: data.categoria,
      presentacion: data.presentacion || ''
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
          const unidad_medida = await Unidad.getById(row.UNIDAD_MEDIDA, connection)
          if (!categoriasValidas.includes(categoria)) {
            errores.push(`Fila ${rowNum}: Categoría inválida. Debe ser: ${categoriasValidas.join(', ')}`)
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
          const { insumo_id, codigo } = await Insumo.create(nombre, descripcion || '', unidad_medida.id, categoria, presentacion || '', connection)
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
  }
}
