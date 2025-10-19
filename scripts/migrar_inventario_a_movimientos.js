import { pool } from '../server/config/database.js'
import dotenv from 'dotenv'

dotenv.config()

console.log('🔄 Migrando datos de inventario_insumos a movimientos_insumos...\n')

async function migrarInventarioAMovimientos() {
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    
    // 1. Obtener todos los registros de inventario_insumos
    const [inventarios] = await connection.execute(`
      SELECT 
        ii.id,
        ii.insumo_id,
        ii.laboratorio_id,
        ii.cantidad,
        ii.fecha_actualizacion,
        i.nombre as insumo_nombre,
        l.nombre as laboratorio_nombre
      FROM inventario_insumos ii
      INNER JOIN insumos i ON ii.insumo_id = i.id
      INNER JOIN laboratorios l ON ii.laboratorio_id = l.id
      WHERE ii.cantidad > 0
      ORDER BY l.nombre, i.nombre
    `)
    
    console.log(`📦 Registros de inventario encontrados: ${inventarios.length}\n`)
    
    if (inventarios.length === 0) {
      console.log('⚠️ No hay registros con stock > 0 para migrar')
      await connection.rollback()
      return
    }
    
    let migrados = 0
    let omitidos = 0
    
    for (const inv of inventarios) {
      // Verificar si ya existe un movimiento para este insumo en este laboratorio
      const [existentes] = await connection.execute(`
        SELECT COUNT(*) as total
        FROM movimientos_insumos m
        WHERE m.insumo_id = ? AND m.laboratorio_id = ? AND m.tipo_movimiento = 'entrada'
      `, [inv.insumo_id, inv.laboratorio_id])
      
      if (existentes[0].total > 0) {
        console.log(`⏭️ Omitiendo "${inv.insumo_nombre}" en "${inv.laboratorio_nombre}" (ya tiene movimientos)`)
        omitidos++
        continue
      }
      
      // Crear un movimiento de entrada con la cantidad del inventario
      const fechaMigracion = inv.fecha_actualizacion || new Date()
      
      const [resultMovimiento] = await connection.execute(`
        INSERT INTO movimientos_insumos (
          insumo_id,
          laboratorio_id,
          tipo_movimiento,
          fecha_movimiento,
          fecha_ingreso,
          cantidad,
          motivo,
          observaciones,
          usuario_id
        ) VALUES (?, ?, 'entrada', ?, ?, ?, 'Migración de inventario', 'Stock inicial migrado desde inventario_insumos', 1)
      `, [
        inv.insumo_id,
        inv.laboratorio_id,
        fechaMigracion,
        fechaMigracion,
        inv.cantidad
      ])
      
      const movimientoId = resultMovimiento.insertId
      
      // Crear el detalle del movimiento (un único lote sin fecha de vencimiento)
      await connection.execute(`
        INSERT INTO movimiento_insumo_detalle (
          movimiento_id,
          insumo_id,
          lote,
          cantidad,
          fecha_vencimiento
        ) VALUES (?, ?, 'MIGRADO-INV', ?, NULL)
      `, [movimientoId, inv.insumo_id, inv.cantidad])
      
      console.log(`✅ Migrado: "${inv.insumo_nombre}" en "${inv.laboratorio_nombre}" (${inv.cantidad} unidades)`)
      migrados++
    }
    
    await connection.commit()
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ Migración completada con éxito')
    console.log(`📊 Total migrados: ${migrados}`)
    console.log(`⏭️ Total omitidos (ya existían): ${omitidos}`)
    console.log('='.repeat(60))
    console.log('\n⚡ Ahora REINICIA el servidor backend para que los cambios surtan efecto')
    
  } catch (error) {
    await connection.rollback()
    console.error('❌ Error durante la migración:', error)
    throw error
  } finally {
    connection.release()
    await pool.end()
  }
}

migrarInventarioAMovimientos()

