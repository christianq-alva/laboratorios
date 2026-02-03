import { pool } from '../config/database.js'
import { handleDBError } from '../utils/handleDBError.js'
import { AppError } from '../utils/errors.js'

export const Inventario = {
  getAllInsumosConSaldo: async (user_rol, user_laboratorio_ids) => {
    //Query base
    let query = `
          SELECT 
            i.id, 
            i.codigo, 
            i.nombre,
            i.descripcion,
            i.unidad_id,
            u.simbolo as unidad_simbolo,
            u.nombre as unidad_nombre,
            i.categoria,
            i.presentacion,
            count(case when coalesce(mid.saldo,0) > 0 then 1 end) total_lotes,
            sum(case when mi.tipo_movimiento = 'salida' then mid.cantidad*-1 else mid.cantidad end) stock_disponible
          FROM movimientos_insumos mi
          INNER JOIN movimiento_insumo_detalle mid on mi.id  = mid.movimiento_id
          RIGHT JOIN inventario_insumos ii on mid.insumo_id = ii.insumo_id and mi.laboratorio_id = ii.laboratorio_id
          INNER JOIN insumos i on ii.insumo_id = i.id
          INNER JOIN unidades u on i.unidad_id = u.id
        `
    // Filtros según permisos del usuario
    if (user_rol === 'Jefe de Laboratorio') {
      query += ` AND ii.laboratorio_id IN (${user_laboratorio_ids.join(',')})`
    }

    // Agrupación
    query += `
          GROUP BY i.id
          ORDER BY i.nombre; `

    try {
      const [insumos] = await pool.execute(query)
      return insumos
    } catch (error) {
      handleDBError(error, 'Inventario')
    }
  },

  getInsumosConSaldo: async (laboratorio_id) => {
    try {
      const [insumos] = await pool.execute(`
          SELECT 
            i.id, 
            i.codigo, 
            i.nombre,
            i.descripcion,
            i.unidad_id,
            u.simbolo as unidad_simbolo,
            u.nombre as unidad_nombre,
            i.categoria,
            i.presentacion,
            count(case when coalesce(mid.saldo,0) > 0 then 1 end) total_lotes,
            sum(case when mi.tipo_movimiento = 'salida' then mid.cantidad*-1 else mid.cantidad end) stock_disponible
          FROM movimientos_insumos mi
          INNER JOIN movimiento_insumo_detalle mid on mi.id  = mid.movimiento_id 
          RIGHT JOIN inventario_insumos ii on mid.insumo_id = ii.insumo_id and mi.laboratorio_id = ii.laboratorio_id
          INNER JOIN insumos i on ii.insumo_id = i.id
          INNER JOIN unidades u on i.unidad_id = u.id
          WHERE ii.laboratorio_id = ?
          GROUP BY i.id
          ORDER BY i.nombre;
          `, [laboratorio_id])

      return insumos;
    } catch (error) {
      handleDBError(error, 'Inventario')
    }
  },

  getInsumosConSaldoPositivo: async (laboratorio_id) => {
    try {
      const insumos = await pool.execute(`
          SELECT 
            i.id, 
            i.codigo, 
            i.nombre,
            i.descripcion,
            i.unidad_id,
            u.simbolo as unidad_simbolo,
            u.nombre as unidad_nombre,
            i.categoria,
            i.presentacion,
            count(case when coalesce(mid.saldo,0) > 0 then 1 end) total_lotes,
            sum(case when mi.tipo_movimiento = 'salida' then mid.cantidad*-1 else mid.cantidad end) stock_disponible
          FROM movimientos_insumos mi
          INNER JOIN movimiento_insumo_detalle mid on mi.id  = mid.movimiento_id 
          INNER JOIN insumos i on mid.insumo_id = i.id
          INNER JOIN unidades u on i.unidad_id = u.id
          WHERE mi.laboratorio_id = ?
          GROUP BY i.id
          ORDER BY i.nombre;
          `, [laboratorio_id])

      return insumos
    } catch (error) {
      handleDBError(error, 'Inventario')
    }
  },

  /**
   * Indica si el laboratorio tiene al menos un insumo con saldo (stock) mayor a cero.
   * @param {number} laboratorio_id - ID del laboratorio
   * @returns {Promise<boolean>}
   */
  tieneInsumosConSaldoPositivo: async (laboratorio_id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT 1
         FROM movimientos_insumos mi
         INNER JOIN movimiento_insumo_detalle mid ON mi.id = mid.movimiento_id
         WHERE mi.laboratorio_id = ?
         GROUP BY mid.insumo_id
         HAVING SUM(CASE WHEN mi.tipo_movimiento = 'salida' THEN mid.cantidad * -1 ELSE mid.cantidad END) > 0
         LIMIT 1`,
        [laboratorio_id]
      )
      return rows.length > 0
    } catch (error) {
      handleDBError(error, 'Inventario')
    }
  },

  getLotesConSaldo: async (laboratorio_id, insumo_id) => {
    try {
      const [lotes] = await pool.execute(`
          SELECT 
            mid.id as detalle_id,
            mid.insumo_id,
            i.nombre as insumo_nombre,
            i.codigo as insumo_codigo,
            i.unidad_id,
            u.simbolo as unidad_simbolo,
            u.nombre as unidad_nombre,
            COALESCE(mid.lote, 'SIN-LOTE') as lote,
            mid.cantidad as cantidad_original,
            COALESCE(mid.saldo, 0) as saldo,
            mid.fecha_vencimiento,
            mi.fecha_ingreso,
            CASE 
              WHEN mid.fecha_vencimiento IS NULL THEN NULL
              WHEN mid.fecha_vencimiento < CURDATE() THEN 0
              ELSE DATEDIFF(mid.fecha_vencimiento, CURDATE())
            END as dias_para_vencer
          FROM movimiento_insumo_detalle mid
          INNER JOIN movimientos_insumos mi ON mid.movimiento_id = mi.id
          INNER JOIN insumos i ON mid.insumo_id = i.id
          INNER JOIN unidades u on i.unidad_id = u.id
          WHERE mi.laboratorio_id = ?
            AND mi.tipo_movimiento = 'entrada'
            AND COALESCE(mid.saldo, 0) > 0
            AND mid.insumo_id = ?
          ORDER BY       
           COALESCE(mid.fecha_vencimiento, 0) asc
        `, [laboratorio_id, insumo_id])

      return lotes
    } catch (error) {
      handleDBError(error, 'Inventario')
    }
  },

  getLotesPorInsumo: async (insumo_id, user_rol, user_laboratorio_ids) => {
    let query = `
      SELECT 
        mid.id as detalle_id,
        mid.insumo_id,
        i.nombre as insumo_nombre,
        i.codigo as insumo_codigo,
        i.unidad_id,
        u.simbolo as unidad_simbolo,
        u.nombre as unidad_nombre,
        COALESCE(mid.lote, 'SIN-LOTE') as lote,
        mid.cantidad as cantidad_original,
        COALESCE(mid.saldo, 0) as saldo,
        mid.fecha_vencimiento,
        mi.fecha_ingreso,
        mi.fecha_movimiento,
        l.id as laboratorio_id,
        l.nombre as laboratorio_nombre,
        l.codigo as laboratorio_codigo,
        CASE 
          WHEN mid.fecha_vencimiento IS NULL THEN NULL
          WHEN mid.fecha_vencimiento < CURDATE() THEN DATEDIFF(mid.fecha_vencimiento, CURDATE())
          ELSE DATEDIFF(mid.fecha_vencimiento, CURDATE())
        END as dias_para_vencer
      FROM movimiento_insumo_detalle mid
      INNER JOIN movimientos_insumos mi ON mid.movimiento_id = mi.id
      INNER JOIN insumos i ON mid.insumo_id = i.id
      INNER JOIN unidades u on i.unidad_id = u.id
      INNER JOIN laboratorios l ON mi.laboratorio_id = l.id
      WHERE mid.insumo_id = ?
        AND mi.tipo_movimiento = 'entrada'
        AND COALESCE(mid.saldo, 0) > 0
    `
    const params = [insumo_id]

    // Filtro por laboratorios (aplicado cuando se proporciona user_laboratorio_ids)
    // El controlador ya maneja la lógica de permisos, aquí solo aplicamos el filtro
    if (user_laboratorio_ids && user_laboratorio_ids.length > 0) {
      const placeholders = user_laboratorio_ids.map(() => '?').join(',')
      query += ` AND mi.laboratorio_id IN (${placeholders})`
      params.push(...user_laboratorio_ids)
    }

    query += ` ORDER BY l.nombre, COALESCE(mid.fecha_vencimiento, '9999-12-31') ASC, mi.fecha_ingreso DESC`

    try {
      const [lotes] = await pool.execute(query, params)
      return lotes
    } catch (error) {
      handleDBError(error, 'Inventario')
    }
  },

  eliminarMovimientoInventario: async (connection, movimiento_id) => {
    try {
      const [movimientoRows] = await connection.execute(`
        SELECT tipo_movimiento, reserva_id
        FROM movimientos_insumos
        WHERE id = ?
      `, [movimiento_id]);

      if (!movimientoRows || movimientoRows.length === 0) {
        throw new AppError('Movimiento no encontrado', 404)
      }

      const [detalleMovimiento] = await connection.execute(`
        SELECT id, mov_det_ref, cantidad
        FROM movimiento_insumo_detalle
        WHERE movimiento_id = ?
      `, [movimiento_id]);

      for (const detalle of detalleMovimiento) {
        const { mov_det_ref, cantidad } = detalle;
        if (mov_det_ref) {
          await connection.execute(`
            UPDATE movimiento_insumo_detalle
            SET saldo = saldo + ?
            WHERE id = ?
          `, [cantidad, mov_det_ref]);
        }
      }

      if (movimientoRows[0].reserva_id) {
        await connection.execute(`
          UPDATE reservas
          SET estado = 'P', tiene_consumo_insumos = 0
          WHERE id = ?
        `, [movimientoRows[0].reserva_id]);
      }

      await connection.execute(`
        DELETE FROM movimientos_insumos
        WHERE id = ?
      `, [movimiento_id]);
    } catch (error) {
      if (error.statusCode != null) throw error
      handleDBError(error, 'Inventario')
    }
  },

  registrarMovimiento: async (connection, usuario_id, fecha_movimiento, laboratorio_id, tipo_movimiento, observaciones, reserva_id, detalles) => {
    try {
      if (!detalles?.length) {
        throw new AppError('Debe incluir al menos un detalle', 400)
      }
      if (tipo_movimiento === 'salida') {
        await Inventario.validarSaldosEnLote(connection, detalles)
        await Inventario.actualizarSaldosEnLote(connection, detalles)
      }
      const movimientoId = await Inventario.insertarMovimiento(connection, usuario_id, fecha_movimiento, laboratorio_id, tipo_movimiento, reserva_id, observaciones)
      await Inventario.insertarDetallesMovimientoBatch(connection, movimientoId, tipo_movimiento, detalles)
      return movimientoId
    } catch (error) {
      if (error.statusCode != null) throw error
      handleDBError(error, 'Inventario')
    }
  },

  validarSaldosEnLote: async (connection, detalles) => {
    const ids = [...new Set(detalles.map(d => d.entrada_detalle_id).filter(Boolean))]
    if (ids.length === 0) return
    const placeholders = ids.map(() => '?').join(',')
    const [rows] = await connection.execute(
      `SELECT id, saldo FROM movimiento_insumo_detalle WHERE id IN (${placeholders})`,
      ids
    )
    const mapSaldo = new Map(rows.map(r => [r.id, r.saldo]))
    for (const d of detalles) {
      if (d.entrada_detalle_id == null) continue
      const saldo = mapSaldo.get(d.entrada_detalle_id)
      if (saldo == null) throw new AppError('No se encontró el lote con ID ' + d.entrada_detalle_id, 404)
      if (saldo < d.cantidad) throw new AppError('Saldo insuficiente en uno o más lotes', 400)
    }
  },

  actualizarSaldosEnLote: async (connection, detalles) => {
    const salidas = detalles.filter(d => d.entrada_detalle_id != null)
    if (salidas.length === 0) return
    const cantidadesPorId = new Map()
    for (const d of salidas) {
      const id = d.entrada_detalle_id
      cantidadesPorId.set(id, (cantidadesPorId.get(id) || 0) + d.cantidad)
    }
    const ids = [...cantidadesPorId.keys()]
    const caseParts = ids.map(() => 'WHEN ? THEN ?').join(' ')
    const params = ids.flatMap(id => [id, cantidadesPorId.get(id)]).concat(ids)
    await connection.execute(
      `UPDATE movimiento_insumo_detalle SET saldo = saldo - CASE id ${caseParts} END WHERE id IN (${ids.map(() => '?').join(',')})`,
      params
    )
  },

  insertarDetallesMovimientoBatch: async (connection, movimientoId, tipo_movimiento, detalles) => {
    if (tipo_movimiento === 'entrada') {
      const placeholders = detalles.map(() => '(?, ?, ?, ?, ?, ?)').join(', ')
      const params = detalles.flatMap(d => [movimientoId, d.insumo_id, d.cantidad, d.lote ?? null, d.fecha_vencimiento ?? null, d.cantidad])
      await connection.execute(
        `INSERT INTO movimiento_insumo_detalle (movimiento_id, insumo_id, cantidad, lote, fecha_vencimiento, saldo) VALUES ${placeholders}`,
        params
      )
    } else if (tipo_movimiento === 'salida') {
      const placeholders = detalles.map(() => '(?, ?, ?, ?)').join(', ')
      const params = detalles.flatMap(d => [movimientoId, d.insumo_id, d.cantidad, d.entrada_detalle_id ?? null])
      await connection.execute(
        `INSERT INTO movimiento_insumo_detalle (movimiento_id, insumo_id, cantidad, mov_det_ref) VALUES ${placeholders}`,
        params
      )
    }
  },

  insertarMovimiento: async (connection, usuario_id, fecha_movimiento, laboratorio_id, tipo_movimiento, reserva_id, observaciones) => {
    const [result] = await connection.execute(`
          INSERT INTO movimientos_insumos 
          (laboratorio_id, usuario_id, tipo_movimiento, reserva_id, observaciones, fecha_movimiento, fecha_ingreso)
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [laboratorio_id, usuario_id, tipo_movimiento, reserva_id, observaciones, fecha_movimiento]);

    return result.insertId;
  },

  getActividadInsumos: async (user_rol, user_laboratorio_ids, laboratorio_id, fecha_inicio, fecha_fin, tipo_movimiento) => {

    let query = `
        SELECT 
          m.id,
          m.fecha_movimiento,
          m.tipo_movimiento,
          m.fecha_ingreso,
          m.observaciones,
          l.nombre as laboratorio_nombre,
          u.nombre_completo as usuario_nombre,
          rol.nombre as usuario_rol,
          r.descripcion as reserva_descripcion,
          r.fecha_inicio as reserva_fecha_inicio,
          r.fecha_fin as reserva_fecha_fin
        FROM movimientos_insumos m
        INNER JOIN laboratorios l ON m.laboratorio_id = l.id
        INNER JOIN usuarios u ON m.usuario_id = u.id
        INNER JOIN roles rol ON u.rol_id = rol.id
        LEFT JOIN reservas r ON m.reserva_id = r.id
        WHERE 1=1
      `

    const params = []

    // Filtros según permisos del usuario
    if (user_rol === 'Jefe de Laboratorio' && Array.isArray(user_laboratorio_ids) && user_laboratorio_ids.length) {
      query += ` AND m.laboratorio_id IN (${user_laboratorio_ids.join(',')})`
    }

    // Filtros opcionales
    if (laboratorio_id) {
      query += ` AND m.laboratorio_id = ?`
      params.push(laboratorio_id)
    }

    if (fecha_inicio) {
      query += ` AND DATE(m.fecha_movimiento) >= ?`
      params.push(fecha_inicio)
    }

    if (fecha_fin) {
      query += ` AND DATE(m.fecha_movimiento) <= ?`
      params.push(fecha_fin)
    }

    if (tipo_movimiento) {
      query += ` AND m.tipo_movimiento = ?`
      params.push(tipo_movimiento)
    }

    query += ` ORDER BY m.fecha_movimiento DESC LIMIT 100`

    try {
      const [rows] = await pool.execute(query, params)
      return rows;
    } catch (error) {
      handleDBError(error, 'Inventario')
    }
  },

  getActividadDetalleInsumos: async (user_rol, user_laboratorio_ids, laboratorio_id, insumo_id) => {
    let query = `
      SELECT 
        m.id,
        m.fecha_movimiento,
        m.tipo_movimiento,
        m.fecha_ingreso,
        m.observaciones,
        l.nombre as laboratorio_nombre,
        mid.cantidad as cantidad,
        mid.lote as lote
      FROM movimientos_insumos m
      INNER JOIN movimiento_insumo_detalle mid ON m.id = mid.movimiento_id
      INNER JOIN laboratorios l ON m.laboratorio_id = l.id
      WHERE mid.insumo_id = ${insumo_id}
    `
    // Filtros según permisos del usuario
    if (user_rol === 'Jefe de Laboratorio' && Array.isArray(user_laboratorio_ids) && user_laboratorio_ids.length) {
      query += ` AND m.laboratorio_id IN (${user_laboratorio_ids.join(',')})`
    }

    if (laboratorio_id) {
      query += ` AND m.laboratorio_id = ${laboratorio_id}`
    }

    query += ` ORDER BY m.fecha_movimiento DESC LIMIT 100`

    try {
      const [rows] = await pool.execute(query)
      return rows;
    } catch (error) {
      handleDBError(error, 'Inventario')
    }
  },
  getInsumosConfiguradosByLaboratorio: async (laboratorio_id) => {
    try {
      const [insumos] = await pool.execute(`
        SELECT 
          l.codigo AS lab_codigo,
          l.id AS lab_id,
          l.nombre AS lab_nombre,
          i.codigo AS ins_codigo,
          i.id AS ins_id,
          i.nombre AS ins_nombre,
          i.unidad_id,
          u.simbolo as unidad_simbolo,
          u.nombre as unidad_nombre
        FROM inventario_insumos ii
        INNER JOIN laboratorios l ON l.id = ii.laboratorio_id 
        INNER JOIN insumos i ON i.id = ii.insumo_id
        INNER JOIN unidades u on i.unidad_id = u.id
        WHERE ii.laboratorio_id = ?
        `, [laboratorio_id])
      return insumos;
    } catch (error) {
      handleDBError(error, 'Inventario')
    }
  },
  validarSaldoByInsumoId: async (laboratorio_id, insumo_id, cantidad) => {
    try {
      const [result] = await pool.execute(`
      SELECT 
      sum(mid.saldo) stock_disponible
      FROM movimientos_insumos mi
      INNER JOIN movimiento_insumo_detalle mid on mi.id  = mid.movimiento_id 
      WHERE mi.laboratorio_id = ? and mid.insumo_id = ?
      `, [laboratorio_id, insumo_id])

      return result[0].stock_disponible > cantidad;
    } catch (error) {
      handleDBError(error, 'Inventario')
    }
  },
}