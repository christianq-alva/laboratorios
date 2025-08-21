import { pool } from '../server/config/database.js'

async function checkTable() {
  try {
    console.log('📋 Verificando tabla movimientos_insumos...')
    
    const [columns] = await pool.execute('DESCRIBE movimientos_insumos')
    const columnNames = columns.map(col => col.Field)
    
    console.log('Columnas disponibles:')
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })
    
    // Verificar columnas específicas
    const hasUsuarioId = columnNames.includes('usuario_id')
    const hasCreatedAt = columnNames.includes('created_at')
    const hasUpdatedAt = columnNames.includes('updated_at')
    
    console.log('\n✅ Verificación de columnas:')
    console.log('  - usuario_id:', hasUsuarioId ? 'EXISTS' : 'MISSING')
    console.log('  - created_at:', hasCreatedAt ? 'EXISTS' : 'MISSING')
    console.log('  - updated_at:', hasUpdatedAt ? 'EXISTS' : 'MISSING')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    process.exit(0)
  }
}

checkTable()
