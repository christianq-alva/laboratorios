#!/usr/bin/env node

/**
 * Script para generar un enlace compartido de prueba
 * y mostrar la URL completa para probar en el navegador
 */

import { pool } from '../server/config/database.js'

console.log('🔗 === GENERANDO ENLACE DE PRUEBA ===\n')

async function main() {
  try {
    // 1. Obtener un enlace activo existente
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
      console.log('\n🔧 Creando un enlace de prueba...')
      
      // Obtener un laboratorio para crear el enlace
      const [labs] = await pool.execute('SELECT id, nombre FROM laboratorios LIMIT 1')
      if (labs.length === 0) {
        console.log('❌ No hay laboratorios disponibles')
        return
      }
      
      const lab = labs[0]
      console.log(`📍 Usando laboratorio: ${lab.nombre} (ID: ${lab.id})`)
      
      // Usar un token existente de la base de datos si está disponible
      const [tokensExistentes] = await pool.execute(`
        SELECT token FROM enlaces_compartidos 
        WHERE laboratorio_id = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      `, [lab.id])
      
      let token
      if (tokensExistentes.length > 0) {
        token = tokensExistentes[0].token
        console.log('🔄 Reutilizando token existente')
      } else {
        // Crear un token simple para pruebas (no es JWT real, solo para testing)
        token = `test_token_${lab.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`
        console.log('🆕 Creando token de prueba simple')
      }
      
      // Insertar en la base de datos
      const fechaExpiracion = new Date()
      fechaExpiracion.setFullYear(fechaExpiracion.getFullYear() + 1)
      
      await pool.execute(`
        INSERT INTO enlaces_compartidos 
        (laboratorio_id, token, creado_por, fecha_expiracion, activo)
        VALUES (?, ?, ?, ?, ?)
      `, [lab.id, token, 1, fechaExpiracion, 1])
      
      console.log('✅ Enlace de prueba creado')
      
      // Obtener el enlace recién creado
      const [nuevoEnlace] = await pool.execute(`
        SELECT 
          e.id, 
          e.laboratorio_id, 
          e.token,
          e.activo, 
          e.fecha_expiracion,
          l.nombre as laboratorio
        FROM enlaces_compartidos e
        LEFT JOIN laboratorios l ON e.laboratorio_id = l.id
        WHERE e.token = ?
      `, [token])
      
      if (nuevoEnlace.length > 0) {
        enlaces.push(nuevoEnlace[0])
      }
    }
    
    const enlace = enlaces[0]
    console.log(`✅ Enlace encontrado: ${enlace.laboratorio} (ID: ${enlace.laboratorio_id})`)
    console.log(`🔑 Token: ${enlace.token.substring(0, 30)}...`)
    console.log(`⏰ Expira: ${new Date(enlace.fecha_expiracion).toLocaleString()}`)
    console.log()
    
    // 2. Generar URLs de prueba
    console.log('🌐 === URLS DE PRUEBA ===\n')
    
    const frontendUrls = [
      `http://localhost:5173/horarios/publico/${enlace.laboratorio_id}?token=${enlace.token}`,
      `https://beneficial-wholeness-production-9cd6.up.railway.app/horarios/publico/${enlace.laboratorio_id}?token=${enlace.token}`
    ]
    
    console.log('📱 URLs para probar en el navegador:')
    frontendUrls.forEach((url, index) => {
      const tipo = index === 0 ? 'Local (desarrollo)' : 'Producción (Railway)'
      console.log(`\n${index + 1}. ${tipo}:`)
      console.log(`   ${url}`)
    })
    
    console.log('\n🔧 === INSTRUCCIONES DE PRUEBA ===\n')
    console.log('1. Copia una de las URLs de arriba')
    console.log('2. Pégala en tu navegador')
    console.log('3. Abre las herramientas de desarrollador (F12)')
    console.log('4. Ve a la pestaña "Console" para ver errores JavaScript')
    console.log('5. Ve a la pestaña "Network" para ver las peticiones HTTP')
    console.log('6. Recarga la página y observa:')
    console.log('   - ¿Se hace la petición a /api/share/public/...?')
    console.log('   - ¿Qué respuesta devuelve el servidor?')
    console.log('   - ¿Hay errores en la consola?')
    
    console.log('\n📊 === DATOS ESPERADOS ===\n')
    console.log('Si todo funciona correctamente, deberías ver:')
    console.log('- El nombre del laboratorio en la parte superior')
    console.log('- Una tabla semanal con horarios')
    console.log('- 2 horarios programados (según nuestras pruebas del backend)')
    console.log('- Filtros por docente y ciclo')
    
    console.log('\n❌ === SI NO APARECEN LOS HORARIOS ===\n')
    console.log('Revisa en la consola del navegador:')
    console.log('1. Errores de JavaScript (texto en rojo)')
    console.log('2. Peticiones HTTP fallidas (status 4xx o 5xx)')
    console.log('3. Problemas de CORS')
    console.log('4. Problemas con el token o la URL')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

main()