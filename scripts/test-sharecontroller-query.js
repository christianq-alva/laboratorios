#!/usr/bin/env node

/**
 * Script para probar la consulta exacta del shareController
 */

import { pool } from '../server/config/database.js'

console.log('🔍 === PROBANDO CONSULTA EXACTA DEL SHARECONTROLLER ===')
console.log()

async function testShareControllerQuery() {
  try {
    const laboratorio_id = 11 // Laboratorio de Cómputo 1 que sabemos tiene reservas
    
    console.log(`🎯 Probando consulta para laboratorio ID: ${laboratorio_id}`)
    console.log()
    
    // 1. Probar consulta de laboratorio
    console.log('📍 === CONSULTA DE LABORATORIO ===')
    try {
      const [laboratorio] = await pool.execute(`
        SELECT l.*, e.nombre as escuela 
        FROM laboratorios l
        LEFT JOIN escuelas e ON l.escuela_id = e.id
        WHERE l.id = ?
      `, [laboratorio_id])
      
      if (laboratorio.length > 0) {
        console.log('✅ Consulta de laboratorio exitosa')
        console.log(`   Laboratorio: ${laboratorio[0].nombre}`)
        console.log(`   Escuela: ${laboratorio[0].escuela || 'No asignada'}`)
      } else {
        console.log('❌ No se encontró el laboratorio')
      }
    } catch (error) {
      console.log('❌ Error en consulta de laboratorio:', error.message)
    }
    console.log()
    
    // 2. Probar consulta de horarios (la problemática)
    console.log('📅 === CONSULTA DE HORARIOS ===')
    try {
      const [horarios] = await pool.execute(`
        SELECT 
          r.id,
          r.fecha_inicio,
          r.fecha_fin,
          r.cantidad_alumnos,
          r.descripcion,
          r.color,
          l.nombre as laboratorio,
          d.nombre as docente,
          e.nombre as escuela,
          c.nombre as ciclo,
          g.nombre as grupo
        FROM reservas r
        LEFT JOIN laboratorios l ON r.laboratorio_id = l.id
        LEFT JOIN docentes d ON r.docente_id = d.id
        LEFT JOIN grupos g ON r.grupo_id = g.id
        LEFT JOIN escuelas e ON g.escuela_id = e.id
        LEFT JOIN ciclos c ON g.ciclo_id = c.id
        WHERE r.laboratorio_id = ?
          AND r.fecha_inicio >= CURDATE()
        ORDER BY r.fecha_inicio ASC
      `, [laboratorio_id])
      
      console.log(`✅ Consulta de horarios exitosa: ${horarios.length} resultados`)
      
      if (horarios.length > 0) {
        console.log('📋 Primeros horarios encontrados:')
        horarios.slice(0, 3).forEach((horario, index) => {
          const inicio = new Date(horario.fecha_inicio).toLocaleString()
          const fin = new Date(horario.fecha_fin).toLocaleString()
          console.log(`   ${index + 1}. ${inicio} - ${fin}`)
          console.log(`      Docente: ${horario.docente || 'Sin docente'}`)
          console.log(`      Grupo: ${horario.grupo || 'Sin grupo'}`)
          console.log(`      Escuela: ${horario.escuela || 'Sin escuela'}`)
          console.log(`      Ciclo: ${horario.ciclo || 'Sin ciclo'}`)
        })
      } else {
        console.log('❌ No se encontraron horarios')
      }
      
    } catch (error) {
      console.log('❌ Error en consulta de horarios:', error.message)
      console.log('🔧 Intentando consulta simplificada...')
      
      // Consulta simplificada sin escuelas
      try {
        const [horariosSimple] = await pool.execute(`
          SELECT 
            r.id,
            r.fecha_inicio,
            r.fecha_fin,
            r.cantidad_alumnos,
            r.descripcion,
            r.color,
            l.nombre as laboratorio,
            d.nombre as docente,
            c.nombre as ciclo,
            g.nombre as grupo
          FROM reservas r
          LEFT JOIN laboratorios l ON r.laboratorio_id = l.id
          LEFT JOIN docentes d ON r.docente_id = d.id
          LEFT JOIN grupos g ON r.grupo_id = g.id
          LEFT JOIN ciclos c ON g.ciclo_id = c.id
          WHERE r.laboratorio_id = ?
            AND r.fecha_inicio >= CURDATE()
          ORDER BY r.fecha_inicio ASC
        `, [laboratorio_id])
        
        console.log(`✅ Consulta simplificada exitosa: ${horariosSimple.length} resultados`)
        
        if (horariosSimple.length > 0) {
          console.log('📋 Horarios con consulta simplificada:')
          horariosSimple.slice(0, 2).forEach((horario, index) => {
            const inicio = new Date(horario.fecha_inicio).toLocaleString()
            console.log(`   ${index + 1}. ${inicio} - Docente: ${horario.docente || 'N/A'}`)
          })
        }
        
      } catch (simpleError) {
        console.log('❌ Error también en consulta simplificada:', simpleError.message)
      }
    }
    console.log()
    
    // 3. Verificar estructura de tabla grupos
    console.log('🔍 === VERIFICANDO ESTRUCTURA DE GRUPOS ===')
    try {
      const [gruposStructure] = await pool.execute('DESCRIBE grupos')
      console.log('📋 Columnas en tabla grupos:')
      gruposStructure.forEach(col => {
        console.log(`   ${col.Field} - ${col.Type}`)
      })
      
      const tieneEscuelaId = gruposStructure.some(col => col.Field === 'escuela_id')
      console.log(`\n🎯 ¿Tiene columna escuela_id? ${tieneEscuelaId ? '✅ Sí' : '❌ No'}`)
      
    } catch (error) {
      console.log('❌ Error al verificar estructura de grupos:', error.message)
    }
    console.log()
    
    // 4. Probar consultas de filtros
    console.log('🔍 === PROBANDO CONSULTAS DE FILTROS ===')
    
    // Docentes
    try {
      const [docentes] = await pool.execute(`
        SELECT DISTINCT d.nombre
        FROM reservas r
        JOIN docentes d ON r.docente_id = d.id
        WHERE r.laboratorio_id = ? AND r.fecha_inicio >= CURDATE()
        ORDER BY d.nombre
      `, [laboratorio_id])
      
      console.log(`✅ Consulta de docentes: ${docentes.length} encontrados`)
      docentes.forEach((docente, index) => {
        console.log(`   ${index + 1}. ${docente.nombre}`)
      })
      
    } catch (error) {
      console.log('❌ Error en consulta de docentes:', error.message)
    }
    
    // Ciclos
    try {
      const [ciclos] = await pool.execute(`
        SELECT DISTINCT c.nombre
        FROM reservas r
        JOIN grupos g ON r.grupo_id = g.id
        JOIN ciclos c ON g.ciclo_id = c.id
        WHERE r.laboratorio_id = ? AND r.fecha_inicio >= CURDATE()
        ORDER BY c.nombre
      `, [laboratorio_id])
      
      console.log(`✅ Consulta de ciclos: ${ciclos.length} encontrados`)
      ciclos.forEach((ciclo, index) => {
        console.log(`   ${index + 1}. ${ciclo.nombre}`)
      })
      
    } catch (error) {
      console.log('❌ Error en consulta de ciclos:', error.message)
    }
    
    console.log()
    console.log('💡 === CONCLUSIONES ===')
    console.log('Si hay errores en las consultas, el problema está en:')
    console.log('1. Estructura de tablas (columnas faltantes)')
    console.log('2. Relaciones incorrectas entre tablas')
    console.log('3. Datos inconsistentes')
    
  } catch (error) {
    console.error('❌ Error general:', error)
  } finally {
    await pool.end()
  }
}

testShareControllerQuery()