#!/usr/bin/env node

/**
 * Script para diagnosticar por qué no aparecen los horarios en enlaces compartidos
 */

import { pool } from '../server/config/database.js'

console.log('🔍 === DIAGNÓSTICO DE HORARIOS COMPARTIDOS ===')
console.log()

async function main() {
  try {
    // 1. Verificar enlaces compartidos activos
    console.log('🔗 === VERIFICANDO ENLACES COMPARTIDOS ===')
    const [enlaces] = await pool.execute(`
      SELECT 
        e.id, 
        e.laboratorio_id, 
        e.token,
        e.activo, 
        e.fecha_expiracion,
        e.created_at,
        l.nombre as laboratorio
      FROM enlaces_compartidos e
      LEFT JOIN laboratorios l ON e.laboratorio_id = l.id
      ORDER BY e.created_at DESC
      LIMIT 5
    `)
    
    if (enlaces.length === 0) {
      console.log('❌ No hay enlaces compartidos')
      return
    }
    
    console.log(`📊 ${enlaces.length} enlaces encontrados:`)
    enlaces.forEach((enlace, index) => {
      const expira = new Date(enlace.fecha_expiracion).toLocaleString()
      const activo = enlace.activo ? '✅ Activo' : '❌ Inactivo'
      console.log(`   ${index + 1}. ${activo} - Lab: ${enlace.laboratorio} (ID: ${enlace.laboratorio_id})`)
      console.log(`      Token: ${enlace.token.substring(0, 20)}...`)
      console.log(`      Expira: ${expira}`)
    })
    console.log()
    
    // 2. Activar un enlace para pruebas si todos están inactivos
    const enlaceActivo = enlaces.find(e => e.activo === 1)
    let tokenPrueba = null
    
    if (!enlaceActivo) {
      console.log('⚠️  Todos los enlaces están inactivos. Activando el más reciente para pruebas...')
      const enlaceReciente = enlaces[0]
      await pool.execute(
        'UPDATE enlaces_compartidos SET activo = 1 WHERE id = ?',
        [enlaceReciente.id]
      )
      tokenPrueba = enlaceReciente.token
      console.log(`✅ Enlace ID ${enlaceReciente.id} activado temporalmente`)
    } else {
      tokenPrueba = enlaceActivo.token
      console.log(`✅ Usando enlace activo: ${enlaceActivo.laboratorio}`)
    }
    console.log()
    
    // 3. Probar la consulta del shareController
    console.log('🎯 === PROBANDO CONSULTA DE HORARIOS ===')
    console.log(`Token de prueba: ${tokenPrueba.substring(0, 20)}...`)
    
    // Verificar el token
    const [tokenResult] = await pool.execute(`
      SELECT 
        e.laboratorio_id, 
        e.activo, 
        e.fecha_expiracion,
        l.nombre as laboratorio_nombre
      FROM enlaces_compartidos e
      LEFT JOIN laboratorios l ON e.laboratorio_id = l.id
      WHERE e.token = ?
    `, [tokenPrueba])
    
    if (tokenResult.length === 0) {
      console.log('❌ Token no encontrado')
      return
    }
    
    const enlaceInfo = tokenResult[0]
    console.log(`📍 Laboratorio: ${enlaceInfo.laboratorio_nombre} (ID: ${enlaceInfo.laboratorio_id})`)
    console.log(`📅 Activo: ${enlaceInfo.activo ? 'Sí' : 'No'}`)
    console.log(`⏰ Expira: ${new Date(enlaceInfo.fecha_expiracion).toLocaleString()}`)
    
    // Verificar si el enlace está expirado
    const ahora = new Date()
    const expiracion = new Date(enlaceInfo.fecha_expiracion)
    if (expiracion < ahora) {
      console.log('❌ El enlace ha expirado')
      return
    }
    
    if (!enlaceInfo.activo) {
      console.log('❌ El enlace está inactivo')
      return
    }
    
    console.log('✅ Token válido y activo')
    console.log()
    
    // 4. Consultar horarios (reservas) para este laboratorio
    console.log('📅 === CONSULTANDO HORARIOS/RESERVAS ===')
    const [reservas] = await pool.execute(`
       SELECT 
         r.id,
         r.fecha_inicio,
         r.fecha_fin,
         r.cantidad_alumnos,
         r.descripcion,
         r.color,
         d.nombre as docente_nombre,
         g.nombre as grupo_nombre,
         c.nombre as ciclo_nombre
       FROM reservas r
       LEFT JOIN docentes d ON r.docente_id = d.id
       LEFT JOIN grupos g ON r.grupo_id = g.id
       LEFT JOIN ciclos c ON g.ciclo_id = c.id
       WHERE r.laboratorio_id = ? AND r.fecha_inicio >= CURDATE()
       ORDER BY r.fecha_inicio ASC
     `, [enlaceInfo.laboratorio_id])
    
    console.log(`📊 Reservas futuras para laboratorio ${enlaceInfo.laboratorio_nombre}:`)
    if (reservas.length === 0) {
      console.log('❌ No hay reservas futuras para este laboratorio')
      
      // Verificar si hay reservas en general para este laboratorio
      const [todasReservas] = await pool.execute(`
        SELECT COUNT(*) as total 
        FROM reservas 
        WHERE laboratorio_id = ?
      `, [enlaceInfo.laboratorio_id])
      
      console.log(`📊 Total de reservas (incluyendo pasadas): ${todasReservas[0].total}`)
      
      if (todasReservas[0].total > 0) {
        const [ultimasReservas] = await pool.execute(`
          SELECT fecha_inicio, fecha_fin
          FROM reservas 
          WHERE laboratorio_id = ?
          ORDER BY fecha_inicio DESC 
          LIMIT 3
        `, [enlaceInfo.laboratorio_id])
        
        console.log('📅 Últimas reservas (pueden ser del pasado):')
        ultimasReservas.forEach((reserva, index) => {
          const inicio = new Date(reserva.fecha_inicio).toLocaleString()
          const fin = new Date(reserva.fecha_fin).toLocaleString()
          console.log(`   ${index + 1}. ${inicio} - ${fin}`)
        })
      }
    } else {
      console.log(`✅ ${reservas.length} reservas futuras encontradas:`)
      reservas.forEach((reserva, index) => {
        const inicio = new Date(reserva.fecha_inicio).toLocaleString()
        const fin = new Date(reserva.fecha_fin).toLocaleString()
        const docente = reserva.docente_nombre || 'Sin docente'
        const grupo = reserva.grupo_nombre || 'Sin grupo'
        console.log(`   ${index + 1}. ${inicio} - ${fin}`)
        console.log(`      Docente: ${docente}, Grupo: ${grupo}`)
        console.log(`      Descripción: ${reserva.descripcion || 'Sin descripción'}`)
      })
    }
    console.log()
    
    // 5. Simular la respuesta completa del shareController
    console.log('🎭 === SIMULANDO RESPUESTA DEL SHARECONTROLLER ===')
    
    // Consultar información del laboratorio
     const [laboratorio] = await pool.execute(`
       SELECT id, nombre, ubicacion 
       FROM laboratorios 
       WHERE id = ?
     `, [enlaceInfo.laboratorio_id])
    
    // Consultar docentes únicos
    const [docentes] = await pool.execute(`
       SELECT DISTINCT d.id, d.nombre
       FROM docentes d
       INNER JOIN reservas r ON d.id = r.docente_id
       WHERE r.laboratorio_id = ? AND r.fecha_inicio >= CURDATE()
     `, [enlaceInfo.laboratorio_id])
    
    // Consultar ciclos únicos
    const [ciclos] = await pool.execute(`
      SELECT DISTINCT c.id, c.nombre
      FROM ciclos c
      INNER JOIN grupos g ON c.id = g.ciclo_id
      INNER JOIN reservas r ON g.id = r.grupo_id
      WHERE r.laboratorio_id = ? AND r.fecha_inicio >= CURDATE()
    `, [enlaceInfo.laboratorio_id])
    
    const respuestaSimulada = {
      success: true,
      laboratorio: laboratorio[0] || null,
      horarios: reservas,
      filtros: {
        docentes: docentes,
        ciclos: ciclos
      }
    }
    
    console.log('📋 Respuesta simulada:')
    console.log(`   Laboratorio: ${respuestaSimulada.laboratorio?.nombre || 'No encontrado'}`)
    console.log(`   Horarios: ${respuestaSimulada.horarios.length} reservas`)
    console.log(`   Docentes disponibles: ${respuestaSimulada.filtros.docentes.length}`)
    console.log(`   Ciclos disponibles: ${respuestaSimulada.filtros.ciclos.length}`)
    console.log()
    
    // 6. Diagnóstico y recomendaciones
    console.log('💡 === DIAGNÓSTICO Y RECOMENDACIONES ===')
    
    if (respuestaSimulada.horarios.length === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO: No hay reservas futuras')
      console.log('📝 Posibles causas:')
      console.log('   1. No se han creado reservas para fechas futuras')
      console.log('   2. Las reservas existentes son para fechas pasadas')
      console.log('   3. Las reservas están en otro laboratorio')
      console.log()
      console.log('🔧 Soluciones:')
      console.log('   1. Crear nuevas reservas con fechas futuras')
      console.log('   2. Verificar que las reservas estén asignadas al laboratorio correcto')
      console.log('   3. Verificar la zona horaria del servidor vs la base de datos')
    } else {
      console.log('✅ DIAGNÓSTICO: Los datos están correctos')
      console.log('📝 Si no aparecen en el frontend:')
      console.log('   1. Verificar que el enlace esté activo y no expirado')
      console.log('   2. Revisar la consola del navegador por errores JavaScript')
      console.log('   3. Verificar que el frontend esté haciendo la petición correcta')
      console.log('   4. Limpiar caché del navegador')
    }
    
    console.log()
    console.log('🕐 Fecha actual del servidor:', new Date().toLocaleString())
    
  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error)
  } finally {
    await pool.end()
  }
}

main()