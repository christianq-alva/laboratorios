#!/usr/bin/env node

/**
 * Script para analizar posibles problemas en el frontend
 * Específicamente en el componente HorarioPublico y filtros de fecha
 */

import { pool } from '../server/config/database.js'
import fs from 'fs'
import path from 'path'

console.log('🔍 === ANÁLISIS DE PROBLEMAS DEL FRONTEND ===\n')

async function main() {
  try {
    // 1. Verificar datos del backend
    console.log('📊 === VERIFICANDO DATOS DEL BACKEND ===\n')
    
    const [reservas] = await pool.execute(`
      SELECT 
        r.id,
        r.fecha_inicio,
        r.fecha_fin,
        r.descripcion,
        r.laboratorio_id,
        l.nombre as laboratorio,
        d.nombre as docente,
        g.nombre as grupo,
        c.nombre as ciclo
      FROM reservas r
      LEFT JOIN laboratorios l ON r.laboratorio_id = l.id
      LEFT JOIN docentes d ON r.docente_id = d.id
      LEFT JOIN grupos g ON r.grupo_id = g.id
      LEFT JOIN ciclos c ON g.ciclo_id = c.id
      WHERE r.laboratorio_id = 11 AND r.fecha_inicio >= CURDATE()
      ORDER BY r.fecha_inicio ASC
    `)
    
    console.log(`📅 Reservas futuras encontradas: ${reservas.length}`)
    
    if (reservas.length === 0) {
      console.log('❌ No hay reservas futuras. El problema está en los datos.')
      return
    }
    
    reservas.forEach((reserva, index) => {
      const inicio = new Date(reserva.fecha_inicio)
      const fin = new Date(reserva.fecha_fin)
      
      console.log(`\n${index + 1}. ${reserva.descripcion}`)
      console.log(`   📅 Inicio: ${inicio.toISOString()} (${inicio.toLocaleString()})`)
      console.log(`   📅 Fin: ${fin.toISOString()} (${fin.toLocaleString()})`)
      console.log(`   👨‍🏫 Docente: ${reserva.docente}`)
      console.log(`   👥 Grupo: ${reserva.grupo}`)
      console.log(`   🎓 Ciclo: ${reserva.ciclo}`)
      
      // Análisis de fechas
      const ahora = new Date()
      const esFuturo = inicio > ahora
      const diasHastaInicio = Math.ceil((inicio - ahora) / (1000 * 60 * 60 * 24))
      
      console.log(`   ⏰ Es futuro: ${esFuturo ? '✅ Sí' : '❌ No'}`)
      console.log(`   📊 Días hasta inicio: ${diasHastaInicio}`)
      
      // Verificar si está en la semana actual
      const inicioSemana = new Date()
      inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay() + 1) // Lunes
      inicioSemana.setHours(0, 0, 0, 0)
      
      const finSemana = new Date(inicioSemana)
      finSemana.setDate(finSemana.getDate() + 6) // Domingo
      finSemana.setHours(23, 59, 59, 999)
      
      const estaEnSemanaActual = inicio >= inicioSemana && inicio <= finSemana
      console.log(`   📅 Está en semana actual: ${estaEnSemanaActual ? '✅ Sí' : '❌ No'}`)
      
      if (!estaEnSemanaActual) {
        console.log(`   📊 Semana actual: ${inicioSemana.toLocaleDateString()} - ${finSemana.toLocaleDateString()}`)
        console.log(`   📊 Fecha reserva: ${inicio.toLocaleDateString()}`)
      }
    })
    
    // 2. Analizar el componente HorarioPublico.tsx
    console.log('\n\n🔍 === ANALIZANDO COMPONENTE FRONTEND ===\n')
    
    const componentPath = path.join(process.cwd(), 'src/components/Public/HorarioPublico.tsx')
    
    if (!fs.existsSync(componentPath)) {
      console.log('❌ No se encontró el componente HorarioPublico.tsx')
      return
    }
    
    const componentContent = fs.readFileSync(componentPath, 'utf8')
    
    // Buscar patrones problemáticos
    const problemas = []
    
    // 1. Verificar filtros de fecha
    if (componentContent.includes('isBetween')) {
      console.log('✅ Usa dayjs.isBetween para filtrar fechas')
      
      // Verificar configuración de dayjs
      if (componentContent.includes("dayjs.extend(isoWeek)")) {
        console.log('✅ Extensión isoWeek configurada')
      } else {
        problemas.push('❌ Falta extensión isoWeek de dayjs')
      }
      
      if (componentContent.includes("dayjs.extend(isBetween)")) {
        console.log('✅ Extensión isBetween configurada')
      } else {
        problemas.push('❌ Falta extensión isBetween de dayjs')
      }
    } else {
      problemas.push('❌ No usa dayjs.isBetween para filtrar fechas')
    }
    
    // 2. Verificar manejo de zona horaria
    if (componentContent.includes('UTC') || componentContent.includes('timezone')) {
      console.log('⚠️  Maneja zonas horarias - verificar configuración')
    } else {
      console.log('ℹ️  No maneja zonas horarias explícitamente')
    }
    
    // 3. Verificar filtros de semana
    if (componentContent.includes('startOf(\'isoWeek\')')) {
      console.log('✅ Usa startOf(\'isoWeek\') para inicio de semana')
    } else if (componentContent.includes('startOf(\'week\')')) {
      problemas.push('⚠️  Usa startOf(\'week\') en lugar de startOf(\'isoWeek\')')
    } else {
      problemas.push('❌ No define correctamente el inicio de semana')
    }
    
    // 4. Verificar procesamiento de datos
    if (componentContent.includes('horariosSemana')) {
      console.log('✅ Tiene filtro horariosSemana')
    } else {
      problemas.push('❌ No tiene filtro horariosSemana')
    }
    
    // 5. Verificar manejo de errores
    if (componentContent.includes('catch') && componentContent.includes('setError')) {
      console.log('✅ Maneja errores correctamente')
    } else {
      problemas.push('⚠️  Manejo de errores incompleto')
    }
    
    // 6. Verificar estado de carga
    if (componentContent.includes('loading') && componentContent.includes('setLoading')) {
      console.log('✅ Maneja estado de carga')
    } else {
      problemas.push('⚠️  No maneja estado de carga')
    }
    
    // Mostrar problemas encontrados
    if (problemas.length > 0) {
      console.log('\n❌ === PROBLEMAS IDENTIFICADOS ===\n')
      problemas.forEach((problema, index) => {
        console.log(`${index + 1}. ${problema}`)
      })
    } else {
      console.log('\n✅ No se encontraron problemas obvios en el código')
    }
    
    // 3. Recomendaciones específicas
    console.log('\n\n🔧 === RECOMENDACIONES ESPECÍFICAS ===\n')
    
    console.log('Para debuggear el problema:')
    console.log('\n1. 🌐 Abre el enlace en el navegador:')
    console.log('   http://localhost:5173/horarios/publico/11?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTEsImNyZWF0ZWRfYnkiOjksInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU1OTY2ODE0NTc5LCJpYXQiOjE3NTU5NjY4MTQsImV4cCI6MTc4NzUwMjgxNH0.wDgIpd9b_AyboK8q9lD1UE69IbIfkRox7fDT8oSdnDc')
    
    console.log('\n2. 🔍 En las herramientas de desarrollador:')
    console.log('   - Pestaña Console: busca errores JavaScript')
    console.log('   - Pestaña Network: verifica la petición a /api/share/public/11')
    console.log('   - Pestaña Elements: verifica que los datos lleguen al DOM')
    
    console.log('\n3. 📊 Agrega logs temporales en HorarioPublico.tsx:')
    console.log('   - console.log(\'Datos recibidos:\', publicData)')
    console.log('   - console.log(\'Horarios filtrados:\', horariosSemana)')
    console.log('   - console.log(\'Semana actual:\', currentWeek.format())')
    
    console.log('\n4. 📅 Verifica filtros de fecha:')
    console.log('   - La semana actual puede no incluir las fechas de las reservas')
    console.log('   - Las reservas están en fechas futuras pero fuera de la semana actual')
    console.log('   - Problema con zona horaria o formato de fechas')
    
    console.log('\n5. 🎯 Pruebas específicas:')
    console.log('   - Cambia temporalmente el filtro de semana para mostrar todas las fechas')
    console.log('   - Verifica que dayjs esté parseando correctamente las fechas del backend')
    console.log('   - Comprueba si los filtros de docente/ciclo están afectando')
    
    // Mostrar fechas importantes para debugging
    console.log('\n📊 === INFORMACIÓN DE FECHAS PARA DEBUGGING ===\n')
    const ahora = new Date()
    console.log(`🕐 Fecha/hora actual del servidor: ${ahora.toISOString()} (${ahora.toLocaleString()})`)
    
    const inicioSemana = new Date()
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay() + 1)
    inicioSemana.setHours(0, 0, 0, 0)
    
    const finSemana = new Date(inicioSemana)
    finSemana.setDate(finSemana.getDate() + 6)
    finSemana.setHours(23, 59, 59, 999)
    
    console.log(`📅 Semana actual (Lunes-Domingo): ${inicioSemana.toLocaleDateString()} - ${finSemana.toLocaleDateString()}`)
    
    if (reservas.length > 0) {
      const primeraReserva = new Date(reservas[0].fecha_inicio)
      console.log(`📅 Primera reserva: ${primeraReserva.toLocaleDateString()}`)
      
      const estaEnSemana = primeraReserva >= inicioSemana && primeraReserva <= finSemana
      console.log(`📊 ¿Primera reserva está en semana actual? ${estaEnSemana ? '✅ Sí' : '❌ No'}`)
      
      if (!estaEnSemana) {
        console.log('\n⚠️  POSIBLE CAUSA: Las reservas están fuera de la semana actual')
        console.log('💡 SOLUCIÓN: Navegar a la semana correcta o ajustar el filtro de fechas')
      }
    }
    
  } catch (error) {
    console.error('❌ Error en el análisis:', error)
  } finally {
    await pool.end()
  }
}

main()