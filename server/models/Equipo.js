import { pool } from '../config/database.js'

export class Equipo {
  // Obtener equipos por laboratorio
  static async getByLaboratorio(laboratorio_id) {
    try {
      console.log('🔍 Obteniendo equipos del laboratorio:', laboratorio_id)
      
      const [rows] = await pool.execute(`
        SELECT 
          e.id,
          e.codigo,
          e.nombre,
          e.descripcion,
          e.marca,
          e.modelo,
          e.numero_serie,
          e.estado,
          e.fecha_ultimo_mantenimiento,
          e.fecha_proximo_mantenimiento,
          e.comentarios,
          e.condicion,
          e.fecha_adquisicion,
          e.tipo_equipo_id,
          te.nombre as tipo_equipo_nombre,
          COALESCE(ie.cantidad_disponible, 0) as cantidad_disponible,
          COALESCE(ie.cantidad_total, 0) as cantidad_total,
          COALESCE(ie.cantidad_en_uso, 0) as cantidad_en_uso
        FROM equipos e
        LEFT JOIN tipos_equipo te ON e.tipo_equipo_id = te.id
        LEFT JOIN inventario_equipos ie ON e.id = ie.equipo_id AND ie.laboratorio_id = ?
        WHERE ie.laboratorio_id = ? OR ie.laboratorio_id IS NULL
        ORDER BY e.codigo, e.nombre
      `, [laboratorio_id, laboratorio_id])
      
      console.log('📦 Equipos encontrados:', rows.length)
      return rows
    } catch (error) {
      console.error('❌ Error al obtener equipos por laboratorio:', error)
      throw error
    }
  }

  // Verificar disponibilidad de equipo
  static async checkDisponibilidad(equipo_id, laboratorio_id, cantidad_requerida) {
    try {
      const [rows] = await pool.execute(`
        SELECT cantidad_disponible
        FROM inventario_equipos 
        WHERE equipo_id = ? AND laboratorio_id = ?
      `, [equipo_id, laboratorio_id])
      
      if (rows.length === 0) return false
      
      const disponible = rows[0].cantidad_disponible || 0
      return disponible >= cantidad_requerida
    } catch (error) {
      console.error('❌ Error verificando disponibilidad de equipo:', error)
      return false
    }
  }

  // Reservar equipo (marcar como en uso)
  static async reservarEquipo(connection, equipo_id, laboratorio_id, cantidad, usuario_id, reserva_id) {
    try {
      console.log('🔒 Reservando equipo:', { equipo_id, laboratorio_id, cantidad })
      
      // Actualizar inventario
      await connection.execute(`
        UPDATE inventario_equipos 
        SET cantidad_disponible = cantidad_disponible - ?,
            cantidad_en_uso = cantidad_en_uso + ?
        WHERE equipo_id = ? AND laboratorio_id = ?
      `, [cantidad, cantidad, equipo_id, laboratorio_id])
      
      // Registrar movimiento
      await connection.execute(`
        INSERT INTO movimientos_equipos 
        (equipo_id, laboratorio_id, usuario_id, tipo_movimiento, cantidad, reserva_id, observaciones)
        VALUES (?, ?, ?, 'reserva', ?, ?, 'Equipo reservado para clase')
      `, [equipo_id, laboratorio_id, usuario_id, cantidad, reserva_id])
      
      console.log('✅ Equipo reservado exitosamente')
    } catch (error) {
      console.error('❌ Error reservando equipo:', error)
      throw error
    }
  }

  // Devolver equipo (marcar como disponible)
  static async devolverEquipo(connection, equipo_id, laboratorio_id, cantidad, usuario_id, reserva_id) {
    try {
      console.log('🔓 Devolviendo equipo:', { equipo_id, laboratorio_id, cantidad })
      
      // Actualizar inventario
      await connection.execute(`
        UPDATE inventario_equipos 
        SET cantidad_disponible = cantidad_disponible + ?,
            cantidad_en_uso = cantidad_en_uso - ?
        WHERE equipo_id = ? AND laboratorio_id = ?
      `, [cantidad, cantidad, equipo_id, laboratorio_id])
      
      // Registrar movimiento
      await connection.execute(`
        INSERT INTO movimientos_equipos 
        (equipo_id, laboratorio_id, usuario_id, tipo_movimiento, cantidad, reserva_id, observaciones)
        VALUES (?, ?, ?, 'devolucion', ?, ?, 'Equipo devuelto después de clase')
      `, [equipo_id, laboratorio_id, usuario_id, cantidad, reserva_id])
      
      console.log('✅ Equipo devuelto exitosamente')
    } catch (error) {
      console.error('❌ Error devolviendo equipo:', error)
      throw error
    }
  }
}
