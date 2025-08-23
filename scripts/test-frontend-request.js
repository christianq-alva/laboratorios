#!/usr/bin/env node

/**
 * Script para simular la petición del frontend a los horarios públicos
 * Esto nos ayudará a identificar si el problema está en el frontend o backend
 */

import { pool } from '../server/config/database.js'
// Usar fetch nativo de Node.js (disponible desde v18)

console.log('🌐 === SIMULANDO PETICIÓN DEL FRONTEND ===\n')

async function main() {
  try {
    // 1. Obtener un token activo de la base de datos
    console.log('🔍 Buscando enlace activo...')
    const [enlaces] = await pool.execute(`
      SELECT 
        e.id, 
        e.laboratorio_id, 
        e.token,
        e.activo, 
        e.fecha_expiracion,
        l.nombre as laboratorio
      FROM enlaces_compartidos e
      LEFT JOIN laboratorios l ON e.laboratorio_id = l.id
      WHERE e.activo = 1 AND e.fecha_expiracion > NOW()
      ORDER BY e.created_at DESC
      LIMIT 1
    `)
    
    if (enlaces.length === 0) {
      console.log('❌ No hay enlaces activos disponibles')
      return
    }
    
    const enlace = enlaces[0]
    console.log(`✅ Enlace encontrado: ${enlace.laboratorio} (ID: ${enlace.laboratorio_id})`)
    console.log(`🔑 Token: ${enlace.token.substring(0, 20)}...`)
    console.log()
    
    // 2. Simular la petición del frontend
    console.log('🌐 === SIMULANDO PETICIÓN HTTP ===\n')
    
    // Determinar la URL base (simular la lógica del frontend)
    const isDevelopment = process.env.NODE_ENV !== 'production'
    const baseUrl = isDevelopment ? 'http://localhost:3000' : 'http://localhost:3000' // Usar localhost para pruebas
    const apiUrl = `${baseUrl}/api/share/public/${enlace.laboratorio_id}?token=${encodeURIComponent(enlace.token)}`
    
    console.log(`📡 URL de la petición: ${apiUrl}`)
    console.log(`🔧 Entorno detectado: ${isDevelopment ? 'development' : 'production'}`)
    console.log()
    
    // 3. Hacer la petición HTTP
    console.log('📤 Enviando petición HTTP...')
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log(`📥 Respuesta HTTP: ${response.status} ${response.statusText}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log(`❌ Error en la respuesta: ${errorText}`)
        return
      }
      
      const data = await response.json()
      
      console.log('✅ Respuesta exitosa:')
      console.log(`   Success: ${data.success}`)
      console.log(`   Message: ${data.message || 'N/A'}`)
      
      if (data.success && data.data) {
        const { laboratorio, horarios, filtros } = data.data
        
        console.log('\n📊 === DATOS RECIBIDOS ===')
        console.log(`🏢 Laboratorio: ${laboratorio.nombre}`)
        console.log(`📍 Ubicación: ${laboratorio.ubicacion}`)
        console.log(`🏫 Escuela: ${laboratorio.escuela || 'N/A'}`)
        
        console.log(`\n📅 Horarios encontrados: ${horarios.length}`)
        horarios.forEach((horario, index) => {
          const inicio = new Date(horario.fecha_inicio).toLocaleString()
          const fin = new Date(horario.fecha_fin).toLocaleString()
          console.log(`   ${index + 1}. ${horario.descripcion}`)
          console.log(`      📅 ${inicio} - ${fin}`)
          console.log(`      👨‍🏫 ${horario.docente} | 👥 ${horario.grupo}`)
          console.log(`      🎓 ${horario.ciclo || 'N/A'} | 🏫 ${horario.escuela || 'N/A'}`)
        })
        
        console.log(`\n🔍 Filtros disponibles:`)
        console.log(`   👨‍🏫 Docentes: ${filtros.docentes.length} (${filtros.docentes.join(', ')})`)
        console.log(`   🎓 Ciclos: ${filtros.ciclos.length} (${filtros.ciclos.join(', ')})`)
        
        // 4. Análisis de la respuesta
        console.log('\n🔍 === ANÁLISIS ===\n')
        
        if (horarios.length === 0) {
          console.log('❌ PROBLEMA IDENTIFICADO: No hay horarios en la respuesta')
          console.log('\n🔧 Posibles causas:')
          console.log('   1. No hay reservas futuras para este laboratorio')
          console.log('   2. Las reservas están en el pasado')
          console.log('   3. Problema con la consulta SQL en el backend')
          console.log('   4. Problema con el filtro de fechas')
        } else {
          console.log('✅ BACKEND FUNCIONA CORRECTAMENTE')
          console.log('\n📝 Si el frontend no muestra los horarios:')
          console.log('   1. Verificar la consola del navegador por errores JavaScript')
          console.log('   2. Verificar que el componente HorarioPublico procese correctamente los datos')
          console.log('   3. Verificar los filtros de fecha en el frontend')
          console.log('   4. Verificar que la URL del enlace sea correcta')
        }
        
      } else {
        console.log('❌ Respuesta sin datos válidos')
        console.log('Respuesta completa:', JSON.stringify(data, null, 2))
      }
      
    } catch (fetchError) {
      console.error('❌ Error en la petición HTTP:', fetchError.message)
      
      if (fetchError.code === 'ECONNREFUSED') {
        console.log('\n🔧 El servidor no está ejecutándose en el puerto 3000')
        console.log('   Asegúrate de que el backend esté corriendo con: npm run dev')
      }
    }
    
  } catch (error) {
    console.error('❌ Error en el script:', error)
  } finally {
    await pool.end()
  }
}

main()