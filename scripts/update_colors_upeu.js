import { pool } from '../server/config/database.js'

async function updateColorsUPeU() {
  try {
    console.log('🎨 Actualizando colores con paleta UPeU...')
    
    // Colores inspirados en el logo de UPeU
    const colorMappings = [
      { keyword: 'reproductor', color: '#d32f2f', name: 'Rojo' },
      { keyword: 'neurología', color: '#2e5984', name: 'Azul medio' },
      { keyword: 'neurologia', color: '#2e5984', name: 'Azul medio' },
      { keyword: 'señalización', color: '#f4a900', name: 'Dorado UPeU' },
      { keyword: 'señalizacion', color: '#f4a900', name: 'Dorado UPeU' },
      { keyword: 'histología', color: '#4a6fa5', name: 'Azul claro' },
      { keyword: 'histologia', color: '#4a6fa5', name: 'Azul claro' },
      { keyword: 'fisioex', color: '#2e7d32', name: 'Verde' },
      { keyword: 'physioex', color: '#2e7d32', name: 'Verde' }
    ]
    
    // Actualizar colores por descripción
    for (const mapping of colorMappings) {
      const [result] = await pool.execute(`
        UPDATE reservas 
        SET color = ? 
        WHERE LOWER(descripcion) LIKE ?
      `, [mapping.color, `%${mapping.keyword}%`])
      
      console.log(`  ✅ ${mapping.name} (${mapping.color}): ${result.affectedRows} horarios actualizados`)
    }
    
    // Actualizar colores por laboratorio (para horarios sin descripción específica)
    await pool.execute(`
      UPDATE reservas 
      SET color = CASE 
        WHEN laboratorio_id = 1 THEN '#1e3a5f'
        WHEN laboratorio_id = 2 THEN '#f4a900'
        WHEN laboratorio_id = 3 THEN '#2e5984'
        WHEN laboratorio_id = 4 THEN '#4a6fa5'
        WHEN laboratorio_id = 5 THEN '#2e7d32'
        WHEN laboratorio_id % 6 = 0 THEN '#ffc947'
        WHEN laboratorio_id % 6 = 1 THEN '#b8790a'
        WHEN laboratorio_id % 6 = 2 THEN '#d32f2f'
        WHEN laboratorio_id % 6 = 3 THEN '#6b7280'
        ELSE '#0f1e2d'
      END
      WHERE color IN ('#95a5a6', '#4ecdc4', '#ff6b6b', '#ffa726', '#ab47bc', '#26a69a', '#66bb6a')
         OR color IS NULL
    `)
    
    console.log('✅ Colores por laboratorio actualizados')
    
    // Mostrar estadísticas finales
    const [stats] = await pool.execute(`
      SELECT 
        color,
        COUNT(*) as cantidad
      FROM reservas 
      GROUP BY color
      ORDER BY cantidad DESC
    `)
    
    console.log('📊 Distribución final de colores UPeU:')
    stats.forEach(stat => {
      const colorName = COLOR_PALETTE.find(c => c.color === stat.color)?.name || 'Desconocido'
      console.log(`  - ${stat.color} (${colorName}): ${stat.cantidad} horarios`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    process.exit(0)
  }
}

// Paleta de referencia
const COLOR_PALETTE = [
  { color: '#1e3a5f', name: 'Azul UPeU' },
  { color: '#f4a900', name: 'Dorado UPeU' },
  { color: '#2e5984', name: 'Azul Medio' },
  { color: '#4a6fa5', name: 'Azul Claro' },
  { color: '#ffc947', name: 'Dorado Claro' },
  { color: '#b8790a', name: 'Dorado Oscuro' },
  { color: '#2e7d32', name: 'Verde' },
  { color: '#d32f2f', name: 'Rojo' },
  { color: '#6b7280', name: 'Gris' },
  { color: '#0f1e2d', name: 'Azul Oscuro' }
]

updateColorsUPeU()
