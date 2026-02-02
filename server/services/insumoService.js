import { pool } from '../config/database.js'
import { Insumo } from '../models/Insumo.js'
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
          const { insumo_id, codigo } = await Insumo.create(nombre, descripcion || '', unidad_medida.id, categoria, presentacion || '', connection)
          resultados.push({
            fila: rowNum,
            codigo,
            nombre,
            unidad_medida: unidad_medida.nombre,
            categoria
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
