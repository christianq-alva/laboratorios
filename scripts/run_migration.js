import { pool } from '../server/config/database.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigration() {
  try {
    console.log('🚀 Ejecutando migración para tabla enlaces_compartidos...')
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'create_enlaces_compartidos_table.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Dividir por declaraciones SQL (separadas por ;)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    // Ejecutar cada declaración
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Ejecutando: ${statement.substring(0, 50)}...`)
        await pool.execute(statement)
      }
    }
    
    console.log('✅ Migración completada exitosamente')
    
    // Verificar que la tabla se creó correctamente
    try {
      const [columns] = await pool.execute('DESCRIBE enlaces_compartidos')
      console.log('✅ Tabla enlaces_compartidos creada correctamente')
      console.log('📋 Estructura de la tabla:')
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`)
      })
    } catch (describeError) {
      console.log('❌ Error: La tabla no se creó correctamente:', describeError.message)
    }
    
  } catch (error) {
    console.error('❌ Error en la migración:', error)
  } finally {
    process.exit(0)
  }
}

runMigration()
