import { pool } from '../server/config/database.js'

async function addColorField() {
  try {
    console.log('🎨 Agregando campo de color a la tabla reservas...')
    
    // Agregar columna de color
    await pool.execute(`
      ALTER TABLE reservas 
      ADD COLUMN color VARCHAR(7) DEFAULT '#95a5a6' 
      COMMENT 'Color hexadecimal para el horario'
    `)
    
    console.log('✅ Campo color agregado exitosamente')
    
    // Actualizar colores existentes basados en la descripción
    console.log('🔄 Actualizando colores existentes...')
    
    const colorMappings = [
      { keyword: 'reproductor', color: '#ff6b6b' },
      { keyword: 'neurología', color: '#4ecdc4' },
      { keyword: 'neurologia', color: '#4ecdc4' },
      { keyword: 'señalización', color: '#ffa726' },
      { keyword: 'señalizacion', color: '#ffa726' },
      { keyword: 'histología', color: '#ab47bc' },
      { keyword: 'histologia', color: '#ab47bc' },
      { keyword: 'fisioex', color: '#26a69a' },
      { keyword: 'physioex', color: '#26a69a' }
    ]
    
    for (const mapping of colorMappings) {
      await pool.execute(`
        UPDATE reservas 
        SET color = ? 
        WHERE LOWER(descripcion) LIKE ? AND color = '#95a5a6'
      `, [mapping.color, `%${mapping.keyword}%`])
      
      console.log(`  ✅ Actualizado color para "${mapping.keyword}": ${mapping.color}`)
    }
    
    // Verificar la estructura actualizada
    const [columns] = await pool.execute('DESCRIBE reservas')
    const colorColumn = columns.find(col => col.Field === 'color')
    
    if (colorColumn) {
      console.log('📋 Campo color agregado:', colorColumn)
    }
    
    // Contar registros actualizados
    const [stats] = await pool.execute(`
      SELECT 
        color,
        COUNT(*) as cantidad
      FROM reservas 
      GROUP BY color
      ORDER BY cantidad DESC
    `)
    
    console.log('📊 Estadísticas de colores:')
    stats.forEach(stat => {
      console.log(`  - ${stat.color}: ${stat.cantidad} horarios`)
    })
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ El campo color ya existe en la tabla')
    } else {
      console.error('❌ Error:', error.message)
    }
  } finally {
    process.exit(0)
  }
}

addColorField()
