import { pool } from "../config/database.js"

export const Inventario = {
  getAllInsumosConSaldo: async (user_rol, user_laboratorio_ids) => {
    //Query base
    let query = `
          SELECT 
            i.id, 
            i.codigo, 
            i.nombre,
            i.descripcion,
            i.unidad_medida,
            i.categoria,
            i.presentacion,
            count(case when coalesce(mid.saldo,0) > 0 then 1 end) total_lotes,
            sum(case when mi.tipo_movimiento = 'salida' then mid.cantidad*-1 else mid.cantidad end) stock_disponible
          FROM movimientos_insumos mi
          INNER JOIN movimiento_insumo_detalle mid on mi.id  = mid.movimiento_id
          RIGHT JOIN inventario_insumos ii on mid.insumo_id = ii.insumo_id and mi.laboratorio_id = ii.laboratorio_id
          INNER JOIN insumos i on ii.insumo_id = i.id
        `
    // Filtros según permisos del usuario
    if (user_rol === 'Jefe de Laboratorio') {
      query += ` AND ii.laboratorio_id IN (${user_laboratorio_ids.join(',')})`
    }

    // Agrupación
    query += `
          GROUP BY i.id
          ORDER BY i.nombre; `

    const insumos = await pool.execute(query)

    return insumos;
  },

  getInsumosConSaldo: async (laboratorio_id) => {
    const insumos = await pool.execute(`
          SELECT 
            i.id, 
            i.codigo, 
            i.nombre,
            i.descripcion,
            i.unidad_medida,
            i.categoria,
            i.presentacion,
            count(case when coalesce(mid.saldo,0) > 0 then 1 end) total_lotes,
            sum(case when mi.tipo_movimiento = 'salida' then mid.cantidad*-1 else mid.cantidad end) stock_disponible
          FROM movimientos_insumos mi
          INNER JOIN movimiento_insumo_detalle mid on mi.id  = mid.movimiento_id 
          RIGHT JOIN inventario_insumos ii on mid.insumo_id = ii.insumo_id and mi.laboratorio_id = ii.laboratorio_id
          INNER JOIN insumos i on ii.insumo_id = i.id
          WHERE ii.laboratorio_id = ?
          GROUP BY i.id
          ORDER BY i.nombre;
          `, [laboratorio_id])

    return insumos;
  },

  getInsumosConSaldoPositivo: async (laboratorio_id) => {
    const insumos = await pool.execute(`
          SELECT 
            i.id, 
            i.codigo, 
            i.nombre,
            i.descripcion,
            i.unidad_medida,
            i.categoria,
            i.presentacion,
            count(case when coalesce(mid.saldo,0) > 0 then 1 end) total_lotes,
            sum(case when mi.tipo_movimiento = 'salida' then mid.cantidad*-1 else mid.cantidad end) stock_disponible
          FROM movimientos_insumos mi
          INNER JOIN movimiento_insumo_detalle mid on mi.id  = mid.movimiento_id 
          INNER JOIN insumos i on mid.insumo_id = i.id
          WHERE mi.laboratorio_id = ?
          GROUP BY i.id
          ORDER BY i.nombre;
          `, [laboratorio_id])

    return insumos;
  },
  getLotesConSaldo: async (laboratorio_id, insumo_id) => {
    const [lotes] = await pool.execute(`
          SELECT 
            mid.id as detalle_id,
            mid.insumo_id,
            i.nombre as insumo_nombre,
            i.codigo as insumo_codigo,
            i.unidad_medida,
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
          WHERE mi.laboratorio_id = ?
            AND mi.tipo_movimiento = 'entrada'
            AND COALESCE(mid.saldo, 0) > 0
            AND mid.insumo_id = ?
          ORDER BY       
           COALESCE(mid.fecha_vencimiento, 0) asc
        `, [laboratorio_id, insumo_id])

    return lotes;
  },


  registrarMovimientoManual: async (connection, usuario_id, fecha_movimiento, laboratorio_id, tipo_movimiento, observaciones, reserva_id, detalles) => {
    await connection.beginTransaction();

    try {
      const movimientoId = await Inventario.insertarMovimiento(connection, usuario_id, fecha_movimiento, laboratorio_id, tipo_movimiento, reserva_id, observaciones);

      await Inventario.procesarDetallesMovimiento(connection, movimientoId, tipo_movimiento, detalles);

      await connection.commit();
      return movimientoId;

    } catch (error) {
      await connection.rollback();
      throw new Error(error.message || 'Error al registrar el movimiento');
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

  procesarDetallesMovimiento: async (connection, movimientoId, tipo_movimiento, detalles) => {
    for (const detalle of detalles) {
      const { insumo_id, cantidad, lote, fecha_vencimiento, entrada_detalle_id } = detalle;


      if (tipo_movimiento === 'salida') {
        await Inventario.validarSaldo(connection, entrada_detalle_id, cantidad);
        await Inventario.actualizarSaldoEntrada(connection, entrada_detalle_id, cantidad);
      }

      await Inventario.registrarDetalleMovimiento(connection, tipo_movimiento, { movimientoId, insumo_id, cantidad, entrada_detalle_id, lote, fecha_vencimiento });
    }
  },

  validarSaldo: async (connection, entrada_detalle_id, cantidad) => {
    const [row] = await connection.execute(`
          SELECT saldo FROM movimiento_insumo_detalle
          WHERE id = ?
        `, [entrada_detalle_id]);

    if (!row) {
      throw new Error(`No se encontró el lote con ID ${entrada_detalle_id}`);
    }

    if (row.saldo < cantidad) {
      throw new Error(`Saldo insuficiente en el lote ${entrada_detalle_id}. Disponible: ${row.saldo}, solicitado: ${cantidad}`);
    }
  },

  actualizarSaldoEntrada: async (connection, entrada_detalle_id, cantidad) => {
    await connection.execute(`
          UPDATE movimiento_insumo_detalle
          SET saldo = saldo - ?
          WHERE id = ?
        `, [cantidad, entrada_detalle_id]);
  },

  registrarDetalleMovimiento: async (connection, tipo_movimiento, { movimientoId, insumo_id, cantidad, entrada_detalle_id, lote, fecha_vencimiento }) => {

    if (tipo_movimiento === 'entrada') {
      await connection.execute(`
            INSERT INTO movimiento_insumo_detalle
            (movimiento_id, insumo_id, cantidad, lote, fecha_vencimiento, saldo)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [movimientoId, insumo_id, cantidad, lote, fecha_vencimiento, cantidad]);
    } else if (tipo_movimiento === 'salida') {
      await connection.execute(`
            INSERT INTO movimiento_insumo_detalle
            (movimiento_id, insumo_id, cantidad, mov_det_ref)
            VALUES (?, ?, ?, ?)
          `, [movimientoId, insumo_id, cantidad, entrada_detalle_id]);
    }


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

    const [rows] = await pool.execute(query, params)

    return rows;
  },

  getInsumosConfiguradosByLaboratorio: async (laboratorio_id) => {
    const [insumos] = await pool.execute(`
        SELECT 
          l.codigo AS lab_codigo,
          l.id AS lab_id,
          l.nombre AS lab_nombre,
          i.codigo AS ins_codigo,
          i.id AS ins_id,
          i.nombre AS ins_nombre,
          i.unidad_medida AS ins_unidad_medida
        FROM inventario_insumos ii
        INNER JOIN laboratorios l ON l.id = ii.laboratorio_id 
        INNER JOIN insumos i ON i.id = ii.insumo_id
        WHERE ii.laboratorio_id = ?
        `, [laboratorio_id])
    return insumos;
  },
  validarSaldoByInsumoId: async (laboratorio_id, insumo_id, cantidad) => {
    const [stock_disponible] = await pool.execute(`
      SELECT 
      sum(mid.saldo) stock_disponible
      FROM movimientos_insumos mi
      INNER JOIN movimiento_insumo_detalle mid on mi.id  = mid.movimiento_id 
      WHERE mi.laboratorio_id = ? and mid.insumo_id = ?
      `, [laboratorio_id, insumo_id])

    return stock_disponible > cantidad;
  },
}