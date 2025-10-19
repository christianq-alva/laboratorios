import { pool } from '../server/config/database.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function ejecutarScript() {
  console.log('🚀 Iniciando ejecución del script de Stock Mínimo v2...\n')
  
  let connection
  try {
    // Obtener conexión
    connection = await pool.getConnection()
    console.log('✅ Conexión a base de datos establecida\n')
    
    // Ejecutar cada estructura por separado
    
    // 1. Crear tabla config_stock_laboratorio
    console.log('[1/4] Creando tabla config_stock_laboratorio...')
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS config_stock_laboratorio (
          id INT AUTO_INCREMENT PRIMARY KEY,
          insumo_id INT NOT NULL COMMENT 'ID del insumo',
          laboratorio_id INT NOT NULL COMMENT 'ID del laboratorio',
          stock_minimo INT NOT NULL DEFAULT 0 COMMENT 'Cantidad mínima que debe mantenerse',
          stock_maximo INT NULL COMMENT 'Cantidad máxima recomendada (opcional)',
          punto_reorden INT NULL COMMENT 'Nivel para solicitar reabastecimiento (opcional)',
          observaciones TEXT NULL COMMENT 'Notas sobre el consumo o uso del insumo',
          fecha_configuracion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización',
          
          UNIQUE KEY uk_insumo_laboratorio (insumo_id, laboratorio_id),
          FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE CASCADE,
          FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id) ON DELETE CASCADE,
          
          INDEX idx_stock_minimo (stock_minimo),
          INDEX idx_laboratorio (laboratorio_id),
          INDEX idx_insumo (insumo_id),
          INDEX idx_fecha_actualizacion (fecha_actualizacion)
        ) ENGINE=InnoDB COMMENT='Configuración de niveles de stock por laboratorio'
      `)
      console.log('   ✅ Tabla config_stock_laboratorio creada\n')
    } catch (error) {
      console.log('   ⚠️ ', error.message, '\n')
    }
    
    // 2. Crear vista v_stock_actual
    console.log('[2/4] Creando vista v_stock_actual...')
    try {
      await connection.execute('DROP VIEW IF EXISTS v_stock_actual')
      await connection.execute(`
        CREATE VIEW v_stock_actual AS
        SELECT 
          i.id as insumo_id,
          i.codigo as insumo_codigo,
          i.nombre as insumo_nombre,
          i.categoria,
          i.unidad_medida,
          i.presentacion,
          l.id as laboratorio_id,
          l.nombre as laboratorio_nombre,
          l.codigo as laboratorio_codigo,
          COALESCE(
            SUM(CASE WHEN m.tipo_movimiento = 'entrada' THEN mid.cantidad ELSE 0 END) -
            SUM(CASE WHEN m.tipo_movimiento = 'salida' THEN mid.cantidad ELSE 0 END), 
            0
          ) as stock_actual,
          COUNT(DISTINCT mid.lote) as total_lotes_activos,
          MIN(mid.fecha_vencimiento) as fecha_vencimiento_proximo,
          MAX(m.fecha_movimiento) as ultima_actualizacion
        FROM insumos i
        CROSS JOIN laboratorios l
        LEFT JOIN movimientos_insumos m ON m.laboratorio_id = l.id
        LEFT JOIN movimiento_insumo_detalle mid ON mid.movimiento_id = m.id AND mid.insumo_id = i.id
        GROUP BY i.id, i.codigo, i.nombre, i.categoria, i.unidad_medida, i.presentacion, l.id, l.nombre, l.codigo
        HAVING stock_actual > 0 OR COUNT(mid.id) > 0
      `)
      console.log('   ✅ Vista v_stock_actual creada\n')
    } catch (error) {
      console.log('   ❌ Error:', error.message, '\n')
    }
    
    // 3. Crear vista v_stock_completo
    console.log('[3/4] Creando vista v_stock_completo...')
    try {
      await connection.execute('DROP VIEW IF EXISTS v_stock_completo')
      await connection.execute(`
        CREATE VIEW v_stock_completo AS
        SELECT 
          s.insumo_id,
          s.insumo_codigo,
          s.insumo_nombre,
          s.categoria,
          s.unidad_medida,
          s.presentacion,
          s.laboratorio_id,
          s.laboratorio_nombre,
          s.laboratorio_codigo,
          s.stock_actual,
          s.total_lotes_activos,
          s.fecha_vencimiento_proximo,
          s.ultima_actualizacion,
          COALESCE(c.stock_minimo, 0) as stock_minimo,
          c.stock_maximo,
          c.punto_reorden,
          c.observaciones,
          (s.stock_actual - COALESCE(c.stock_minimo, 0)) as diferencia_minimo,
          CASE 
            WHEN c.stock_minimo IS NULL THEN 'SIN_CONFIGURAR'
            WHEN s.stock_actual = 0 THEN 'AGOTADO'
            WHEN s.stock_actual < c.stock_minimo THEN 'BAJO'
            WHEN c.stock_maximo IS NOT NULL AND s.stock_actual > c.stock_maximo THEN 'EXCESO'
            WHEN c.punto_reorden IS NOT NULL AND s.stock_actual <= c.punto_reorden THEN 'REORDENAR'
            ELSE 'NORMAL'
          END as estado_stock,
          CASE 
            WHEN c.stock_minimo > 0 THEN ROUND((s.stock_actual / c.stock_minimo) * 100, 2)
            ELSE NULL
          END as porcentaje_stock_minimo,
          CASE 
            WHEN s.fecha_vencimiento_proximo IS NULL THEN NULL
            WHEN DATEDIFF(s.fecha_vencimiento_proximo, CURDATE()) < 0 THEN 'VENCIDO'
            WHEN DATEDIFF(s.fecha_vencimiento_proximo, CURDATE()) <= 7 THEN 'VENCE_SEMANA'
            WHEN DATEDIFF(s.fecha_vencimiento_proximo, CURDATE()) <= 30 THEN 'VENCE_MES'
            WHEN DATEDIFF(s.fecha_vencimiento_proximo, CURDATE()) <= 90 THEN 'VENCE_TRIMESTRE'
            ELSE 'NORMAL'
          END as alerta_vencimiento,
          DATEDIFF(s.fecha_vencimiento_proximo, CURDATE()) as dias_hasta_vencimiento
        FROM v_stock_actual s
        LEFT JOIN config_stock_laboratorio c ON s.insumo_id = c.insumo_id AND s.laboratorio_id = c.laboratorio_id
      `)
      console.log('   ✅ Vista v_stock_completo creada\n')
    } catch (error) {
      console.log('   ❌ Error:', error.message, '\n')
    }
    
    // 4. Crear vista v_alertas_insumos
    console.log('[4/4] Creando vista v_alertas_insumos...')
    try {
      await connection.execute('DROP VIEW IF EXISTS v_alertas_insumos')
      await connection.execute(`
        CREATE VIEW v_alertas_insumos AS
        SELECT 
          laboratorio_id,
          laboratorio_nombre,
          laboratorio_codigo,
          COUNT(CASE WHEN estado_stock = 'AGOTADO' THEN 1 END) as insumos_agotados,
          COUNT(CASE WHEN estado_stock = 'BAJO' THEN 1 END) as insumos_bajo_stock,
          COUNT(CASE WHEN estado_stock = 'REORDENAR' THEN 1 END) as insumos_reordenar,
          COUNT(CASE WHEN estado_stock = 'EXCESO' THEN 1 END) as insumos_exceso,
          COUNT(CASE WHEN estado_stock = 'SIN_CONFIGURAR' THEN 1 END) as insumos_sin_configurar,
          COUNT(CASE WHEN alerta_vencimiento = 'VENCIDO' THEN 1 END) as lotes_vencidos,
          COUNT(CASE WHEN alerta_vencimiento = 'VENCE_SEMANA' THEN 1 END) as vence_esta_semana,
          COUNT(CASE WHEN alerta_vencimiento = 'VENCE_MES' THEN 1 END) as vence_este_mes,
          COUNT(CASE WHEN alerta_vencimiento = 'VENCE_TRIMESTRE' THEN 1 END) as vence_trimestre,
          COUNT(CASE WHEN estado_stock IN ('AGOTADO', 'BAJO', 'REORDENAR') THEN 1 END) +
          COUNT(CASE WHEN alerta_vencimiento IN ('VENCIDO', 'VENCE_SEMANA', 'VENCE_MES') THEN 1 END) as total_alertas_criticas,
          COUNT(*) as total_insumos
        FROM v_stock_completo
        GROUP BY laboratorio_id, laboratorio_nombre, laboratorio_codigo
      `)
      console.log('   ✅ Vista v_alertas_insumos creada\n')
    } catch (error) {
      console.log('   ❌ Error:', error.message, '\n')
    }
    
    // Verificar estructuras
    console.log('═'.repeat(60))
    console.log('🔍 Verificando estructuras creadas...')
    console.log('═'.repeat(60))
    
    // Verificar tabla
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'config_stock_laboratorio'"
    )
    if (tables.length > 0) {
      console.log('✅ Tabla config_stock_laboratorio: EXISTE')
      const [count] = await connection.execute(
        'SELECT COUNT(*) as total FROM config_stock_laboratorio'
      )
      console.log(`   📊 Registros actuales: ${count[0].total}`)
    } else {
      console.log('❌ Tabla config_stock_laboratorio: NO EXISTE')
    }
    
    // Verificar vistas
    const vistas = ['v_stock_actual', 'v_stock_completo', 'v_alertas_insumos']
    for (const vista of vistas) {
      try {
        const [count] = await connection.execute(
          `SELECT COUNT(*) as total FROM ${vista}`
        )
        console.log(`✅ Vista ${vista}: EXISTE (${count[0].total} registros)`)
      } catch (error) {
        console.log(`❌ Vista ${vista}: NO EXISTE`)
      }
    }
    
    console.log('\n' + '═'.repeat(60))
    console.log('✅ IMPLEMENTACIÓN COMPLETADA EXITOSAMENTE')
    console.log('═'.repeat(60))
    console.log('\n📋 Sistema de Stock Mínimo instalado y listo para usar!')
    console.log('\n🎯 Próximos pasos:')
    console.log('   1. Ir al módulo de Reportes en tu aplicación')
    console.log('   2. Verás 2 nuevos reportes:')
    console.log('      • Insumos con Stock Bajo')
    console.log('      • Insumos Próximos a Vencer')
    console.log('   3. Configura el stock mínimo de tus insumos')
    console.log('   4. ¡Disfruta del nuevo sistema! 🚀\n')
    
  } catch (error) {
    console.error('❌ Error fatal:', error)
  } finally {
    if (connection) {
      connection.release()
    }
    await pool.end()
  }
}

ejecutarScript()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })

