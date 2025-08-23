#!/usr/bin/env node

/**
 * Script para verificar la estructura de las tablas
 */

import { pool } from '../server/config/database.js'

console.log('🔍 === VERIFICANDO ESTRUCTURA DE TABLAS ===')
console.log()

async function checkTableStructure() {
  try {
    // Verificar estructura de enlaces_compartidos
    console.log('📋 Estructura de la tabla enlaces_compartidos:')
    const [columns] = await pool.execute('DESCRIBE enlaces_compartidos')
    columns.forEach(col => {
      console.log(`   ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key} - ${col.Default}`)
    })
    console.log()
    
    // Verificar datos en enlaces_compartidos
    console.log('📊 Datos en enlaces_compartidos:')
    const [enlaces] = await pool.execute('SELECT * FROM enlaces_compartidos LIMIT 3')
    if (enlaces.length === 0) {
      console.log('   ❌ No hay datos en la tabla')
    } else {
      console.log(`   ✅ ${enlaces.length} registros encontrados`)
      enlaces.forEach((enlace, index) => {
        console.log(`   ${index + 1}. ID: ${enlace.id}, Lab: ${enlace.laboratorio_id}, Activo: ${enlace.activo}`)
      })
    }
    console.log()
    
    // Verificar estructura de reservas
    console.log('📋 Estructura de la tabla reservas:')
    const [reservasColumns] = await pool.execute('DESCRIBE reservas')
    reservasColumns.forEach(col => {
      console.log(`   ${col.Field} - ${col.Type}`)
    })
    console.log()
    
    // Verificar datos en reservas
    console.log('📊 Datos en reservas:')
    const [reservas] = await pool.execute(`
      SELECT id, laboratorio_id, fecha_inicio, fecha_fin 
      FROM reservas 
      WHERE fecha_inicio >= CURDATE() 
      LIMIT 5
    `)
    
    if (reservas.length === 0) {
      console.log('   ❌ No hay reservas futuras')
      
      // Verificar si hay reservas en general
      const [todasReservas] = await pool.execute('SELECT COUNT(*) as total FROM reservas')
      console.log(`   📊 Total de reservas en la tabla: ${todasReservas[0].total}`)
      
      if (todasReservas[0].total > 0) {
        const [ultimasReservas] = await pool.execute(`
          SELECT id, laboratorio_id, fecha_inicio, fecha_fin 
          FROM reservas 
          ORDER BY fecha_inicio DESC 
          LIMIT 3
        `)
        console.log('   📅 Últimas reservas (pueden ser del pasado):')
        ultimasReservas.forEach((reserva, index) => {
          const fecha = new Date(reserva.fecha_inicio).toLocaleString()
          console.log(`   ${index + 1}. ID: ${reserva.id}, Lab: ${reserva.laboratorio_id}, Fecha: ${fecha}`)
        })
      }
    } else {
      console.log(`   ✅ ${reservas.length} reservas futuras encontradas`)
      reservas.forEach((reserva, index) => {
        const fecha = new Date(reserva.fecha_inicio).toLocaleString()
        console.log(`   ${index + 1}. ID: ${reserva.id}, Lab: ${reserva.laboratorio_id}, Fecha: ${fecha}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

checkTableStructure()