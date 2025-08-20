import { pool } from '../server/config/database.js'

async function createTable() {
  try {
    console.log('🚀 Creando tabla enlaces_compartidos...')
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS enlaces_compartidos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        laboratorio_id INT NOT NULL,
        token VARCHAR(512) NOT NULL UNIQUE,
        creado_por INT NOT NULL,
        fecha_expiracion DATETIME NOT NULL,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id) ON DELETE CASCADE,
        FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE CASCADE,
        
        INDEX idx_laboratorio_id (laboratorio_id),
        INDEX idx_creado_por (creado_por),
        INDEX idx_token (token),
        INDEX idx_activo (activo),
        INDEX idx_fecha_expiracion (fecha_expiracion)
      )
    `
    
    await pool.execute(createTableSQL)
    console.log('✅ Tabla creada exitosamente')
    
    // Verificar estructura
    const [columns] = await pool.execute('DESCRIBE enlaces_compartidos')
    console.log('📋 Estructura de la tabla:')
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    process.exit(0)
  }
}

createTable()
