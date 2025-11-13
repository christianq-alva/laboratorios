import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import { writeFileSync, statSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Cargar variables de entorno
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 31787,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'laboratorios',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
}

// Generar nombre de archivo con timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '-')
const filename = `dump-laboratorios-${timestamp}.sql`
const filepath = join(projectRoot, filename)

console.log('🔄 Creando dump de la base de datos usando Node.js...')
console.log(`📁 Archivo: ${filename}`)
console.log(`🔗 Host: ${dbConfig.host}:${dbConfig.port}`)
console.log(`💾 Base de datos: ${dbConfig.database}`)
console.log('')

// Crear conexión
const connection = await mysql.createConnection(dbConfig)

let dumpContent = `-- MySQL dump generado con Node.js
-- Fecha: ${new Date().toISOString()}
-- Base de datos: ${dbConfig.database}
-- Host: ${dbConfig.host}:${dbConfig.port}
-- NOTA: Las fechas han sido convertidas a la zona horaria 'America/Lima'

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "-05:00";
SET NAMES utf8mb4;

`

try {
  // Obtener todas las tablas
  const [tables] = await connection.execute(`
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = ? 
    AND TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME
  `, [dbConfig.database])

  console.log(`📋 Encontradas ${tables.length} tablas`)

  for (const table of tables) {
    const tableName = table.TABLE_NAME
    console.log(`  📊 Procesando tabla: ${tableName}`)

    // Obtener estructura de la tabla
    const [createTable] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\``)
    dumpContent += `\n--\n-- Estructura de tabla para \`${tableName}\`\n--\n\n`
    dumpContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`
    dumpContent += `${createTable[0]['Create Table']};\n\n`

    // Obtener datos de la tabla
    const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``)
    
    if (rows.length > 0) {
      dumpContent += `--\n-- Datos de tabla \`${tableName}\`\n--\n\n`
      
      // Obtener nombres de columnas
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [dbConfig.database, tableName])
      
      const columnNames = columns.map(col => col.COLUMN_NAME)
      const columnTypes = {}
      const dateColumns = new Set() // Columnas que son de tipo fecha/hora
      
      columns.forEach(col => {
        const dataType = col.DATA_TYPE.toLowerCase()
        columnTypes[col.COLUMN_NAME] = {
          type: col.DATA_TYPE,
          nullable: col.IS_NULLABLE === 'YES'
        }
        
        // Identificar columnas de fecha/hora que necesitan conversión
        if (dataType === 'datetime' || dataType === 'timestamp' || dataType === 'date') {
          dateColumns.add(col.COLUMN_NAME)
        }
      })
      
      // Generar INSERT statements en lotes para mejor rendimiento
      const batchSize = 100
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize)
        
        for (const row of batch) {
          const values = await Promise.all(columnNames.map(async (col) => {
            const value = row[col]
            if (value === null || value === undefined) {
              return 'NULL'
            }
            
            const colType = columnTypes[col].type.toLowerCase()
            
            // Si es una columna de fecha/hora, convertir a America/Lima
            if (dateColumns.has(col) && value) {
              try {
                // Las fechas en la BD están en UTC, convertir manualmente a Lima (UTC-5)
                let dateValue = value
                
                // Parsear la fecha como UTC
                if (typeof value === 'string') {
                  // Si es un string sin zona horaria, asumir UTC
                  if (!value.includes('Z') && !value.match(/[+-]\d{2}:?\d{2}$/)) {
                    dateValue = new Date(value + 'Z') // Agregar Z para indicar UTC
                  } else {
                    dateValue = new Date(value)
                  }
                } else if (value instanceof Date) {
                  dateValue = value
                } else {
                  dateValue = new Date(value)
                }
                
                if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
                  // Convertir de UTC a Lima (UTC-5): restar 5 horas (5 * 60 * 60 * 1000 ms)
                  const limaTime = new Date(dateValue.getTime() - (5 * 60 * 60 * 1000))
                  
                  // Formatear en formato MySQL (YYYY-MM-DD HH:MM:SS)
                  const year = limaTime.getUTCFullYear()
                  const month = String(limaTime.getUTCMonth() + 1).padStart(2, '0')
                  const day = String(limaTime.getUTCDate()).padStart(2, '0')
                  const hours = String(limaTime.getUTCHours()).padStart(2, '0')
                  const minutes = String(limaTime.getUTCMinutes()).padStart(2, '0')
                  const seconds = String(limaTime.getUTCSeconds()).padStart(2, '0')
                  
                  if (colType === 'date') {
                    return `'${year}-${month}-${day}'`
                  } else {
                    return `'${year}-${month}-${day} ${hours}:${minutes}:${seconds}'`
                  }
                }
              } catch (error) {
                // Si falla la conversión, usar el valor original
                console.log(`    ⚠️ No se pudo convertir fecha en columna ${col}: ${error.message}`)
              }
            }
            
            // Manejar strings
            if (typeof value === 'string') {
              // Escapar comillas simples
              const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
              return `'${escaped}'`
            }
            
            // Manejar fechas (si no se convirtió arriba)
            if (value instanceof Date) {
              return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`
            }
            
            // Manejar booleanos
            if (typeof value === 'boolean') {
              return value ? '1' : '0'
            }
            
            // Manejar números
            if (typeof value === 'number') {
              return value.toString()
            }
            
            // Manejar JSON/objetos
            if (typeof value === 'object') {
              const jsonStr = JSON.stringify(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
              return `'${jsonStr}'`
            }
            
            return `'${String(value).replace(/'/g, "\\'")}'`
          }))
          
          dumpContent += `INSERT INTO \`${tableName}\` (\`${columnNames.join('`, `')}\`) VALUES (${values.join(', ')});\n`
        }
      }
      dumpContent += `\n`
    } else {
      dumpContent += `--\n-- Tabla \`${tableName}\` está vacía\n--\n\n`
    }
  }

  // Obtener procedimientos almacenados y funciones
  try {
    const [procedures] = await connection.execute(`
      SELECT ROUTINE_NAME, ROUTINE_TYPE, ROUTINE_DEFINITION
      FROM information_schema.ROUTINES
      WHERE ROUTINE_SCHEMA = ?
      ORDER BY ROUTINE_NAME
    `, [dbConfig.database])

    if (procedures.length > 0) {
      dumpContent += `\n--\n-- Procedimientos almacenados y funciones\n--\n\n`
      for (const proc of procedures) {
        dumpContent += `-- ${proc.ROUTINE_TYPE}: ${proc.ROUTINE_NAME}\n`
        dumpContent += `-- ${proc.ROUTINE_DEFINITION}\n\n`
      }
    }
  } catch (error) {
    console.log(`  ⚠️ No se pudieron obtener procedimientos almacenados: ${error.message}`)
  }

  dumpContent += `\nSET FOREIGN_KEY_CHECKS=1;\n`

  // Escribir archivo
  writeFileSync(filepath, dumpContent, 'utf8')

  const stats = statSync(filepath)
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)

  console.log('')
  console.log('✅ Dump creado exitosamente!')
  console.log(`📄 Archivo guardado en: ${filepath}`)
  console.log(`📊 Tamaño del archivo: ${fileSizeInMB} MB`)
  console.log(`📋 Total de tablas procesadas: ${tables.length}`)

  await connection.end()
  process.exit(0)

} catch (error) {
  console.error('')
  console.error('❌ Error al crear el dump:')
  console.error(error.message)
  if (error.stack) {
    console.error(error.stack)
  }
  await connection.end()
  process.exit(1)
}

