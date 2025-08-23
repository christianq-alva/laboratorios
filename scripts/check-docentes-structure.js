#!/usr/bin/env node

/**
 * Script para verificar la estructura de la tabla docentes
 */

import { pool } from '../server/config/database.js'

console.log('🔍 === VERIFICANDO ESTRUCTURA DE TABLA DOCENTES ===')
console.log()

async function checkDocentesStructure() {
  try {
    // Verificar estructura de docentes
    console.log('📋 Estructura de la tabla docentes:')
    const [columns] = await pool.execute('DESCRIBE docentes')
    columns.forEach(col => {
      console.log(`   ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key} - ${col.Default}`)
    })
    console.log()
    
    // Verificar algunos datos
    console.log('📊 Datos de ejemplo en docentes:')
    const [docentes] = await pool.execute('SELECT * FROM docentes LIMIT 3')
    if (docentes.length === 0) {
      console.log('   ❌ No hay datos en la tabla')
    } else {
      console.log(`   ✅ ${docentes.length} registros encontrados`)
      docentes.forEach((docente, index) => {
        console.log(`   ${index + 1}. ID: ${docente.id}, Nombre: ${docente.nombre || 'N/A'}`)
        console.log(`      Columnas disponibles:`, Object.keys(docente))
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

checkDocentesStructure()