#!/usr/bin/env node

/**
 * Script para probar el endpoint completo de horarios compartidos
 */

import { pool } from '../server/config/database.js'

console.log('🌐 === PROBANDO ENDPOINT COMPLETO DE HORARIOS COMPARTIDOS ===')
console.log()

async function testApiEndpoint() {
  try {
    // 1. Obtener un token activo
    console.log('🔑 === OBTENIENDO TOKEN ACTIVO ===')
    const [enlaces] = await pool.execute(`
      SELECT token, laboratorio_id, fecha_expiracion
      FROM enlaces_compartidos 
      WHERE activo = 1 
      ORDER BY created_at DESC 
      LIMIT 1
    `)
    
    if (enlaces.length === 0) {
      console.log('❌ No hay enlaces activos')
      return
    }
    
    const enlace = enlaces[0]
    const token = enlace.token
    const laboratorio_id = enlace.laboratorio_id
    
    console.log(`✅ Token encontrado para laboratorio ${laboratorio_id}`)
    console.log(`   Token: ${token.substring(0, 30)}...`)
    console.log(`   Expira: ${new Date(enlace.fecha_expiracion).toLocaleString()}`)
    console.log()
    
    // 2. Simular la petición HTTP
    console.log('🚀 === SIMULANDO PETICIÓN HTTP ===')
    console.log(`URL simulada: /api/share/laboratorio/${laboratorio_id}/horarios?token=${token.substring(0, 20)}...`)
    console.log()
    
    // 3. Ejecutar la lógica del shareController paso a paso
    console.log('🔄 === EJECUTANDO LÓGICA DEL SHARECONTROLLER ===')
    
    // Verificar token JWT
    console.log('🔐 Verificando token JWT...')
    let decoded
    try {
      const jwt = await import('jsonwebtoken')
      decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'your-secret-key')
      console.log('✅ Token JWT válido')
      console.log(`   Laboratorio en token: ${decoded.laboratorio_id}`)
      console.log(`   Creado por usuario: ${decoded.created_by}`)
    } catch (err) {
      console.log('❌ Token JWT inválido:', err.message)
      return
    }
    
    // Verificar que el token es para este laboratorio
    if (decoded.laboratorio_id !== parseInt(laboratorio_id)) {
      console.log('❌ Token no válido para este laboratorio')
      return
    }
    console.log('✅ Token corresponde al laboratorio correcto')
    
    // Verificar enlace en base de datos
    console.log('🔍 Verificando enlace en base de datos...')
    const [linkCheck] = await pool.execute(`
      SELECT id, activo, fecha_expiracion 
      FROM enlaces_compartidos 
      WHERE token = ? AND laboratorio_id = ?
    `, [token, laboratorio_id])
    
    if (linkCheck.length === 0) {
      console.log('❌ Enlace no encontrado en base de datos')
      return
    }
    
    const link = linkCheck[0]
    console.log('✅ Enlace encontrado en base de datos')
    console.log(`   Activo: ${link.activo ? 'Sí' : 'No'}`)
    console.log(`   Expira: ${new Date(link.fecha_expiracion).toLocaleString()}`)
    
    if (!link.activo) {
      console.log('❌ Enlace desactivado')
      return
    }
    
    if (new Date() > new Date(link.fecha_expiracion)) {
      console.log('❌ Enlace expirado')
      return
    }
    
    console.log('✅ Enlace válido y activo')
    console.log()
    
    // Obtener información del laboratorio
    console.log('🏢 Obteniendo información del laboratorio...')
    const [laboratorio] = await pool.execute(`
      SELECT l.*, e.nombre as escuela 
      FROM laboratorios l
      LEFT JOIN escuelas e ON l.escuela_id = e.id
      WHERE l.id = ?
    `, [laboratorio_id])
    
    if (laboratorio.length === 0) {
      console.log('❌ Laboratorio no encontrado')
      return
    }
    
    console.log('✅ Laboratorio encontrado:')
    console.log(`   Nombre: ${laboratorio[0].nombre}`)
    console.log(`   Escuela: ${laboratorio[0].escuela || 'No asignada'}`)
    console.log()
    
    // Obtener horarios del laboratorio
    console.log('📅 Obteniendo horarios del laboratorio...')
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
    
    console.log(`✅ Horarios obtenidos: ${horarios.length} registros`)
    
    if (horarios.length > 0) {
      console.log('📋 Horarios encontrados:')
      horarios.forEach((horario, index) => {
        const inicio = new Date(horario.fecha_inicio).toLocaleString()
        const fin = new Date(horario.fecha_fin).toLocaleString()
        console.log(`   ${index + 1}. ${inicio} - ${fin}`)
        console.log(`      Docente: ${horario.docente || 'Sin docente'}`)
        console.log(`      Grupo: ${horario.grupo || 'Sin grupo'}`)
        console.log(`      Descripción: ${horario.descripcion || 'Sin descripción'}`)
      })
    } else {
      console.log('❌ No se encontraron horarios')
    }
    console.log()
    
    // Obtener filtros
    console.log('🔍 Obteniendo filtros...')
    
    const [docentes] = await pool.execute(`
      SELECT DISTINCT d.nombre
      FROM reservas r
      JOIN docentes d ON r.docente_id = d.id
      WHERE r.laboratorio_id = ? AND r.fecha_inicio >= CURDATE()
      ORDER BY d.nombre
    `, [laboratorio_id])
    
    const [ciclos] = await pool.execute(`
      SELECT DISTINCT c.nombre
      FROM reservas r
      JOIN grupos g ON r.grupo_id = g.id
      JOIN ciclos c ON g.ciclo_id = c.id
      WHERE r.laboratorio_id = ? AND r.fecha_inicio >= CURDATE()
      ORDER BY c.nombre
    `, [laboratorio_id])
    
    console.log(`✅ Filtros obtenidos:`)
    console.log(`   Docentes: ${docentes.length} (${docentes.map(d => d.nombre).join(', ')})`)
    console.log(`   Ciclos: ${ciclos.length} (${ciclos.map(c => c.nombre).join(', ')})`)
    console.log()
    
    // 4. Generar respuesta final
    console.log('📤 === RESPUESTA FINAL SIMULADA ===')
    const respuesta = {
      success: true,
      data: {
        laboratorio: laboratorio[0],
        horarios: horarios,
        filtros: {
          docentes: docentes.map(d => d.nombre),
          ciclos: ciclos.map(c => c.nombre)
        }
      }
    }
    
    console.log('✅ Respuesta generada exitosamente:')
    console.log(`   Success: ${respuesta.success}`)
    console.log(`   Laboratorio: ${respuesta.data.laboratorio.nombre}`)
    console.log(`   Horarios: ${respuesta.data.horarios.length} registros`)
    console.log(`   Filtros docentes: ${respuesta.data.filtros.docentes.length}`)
    console.log(`   Filtros ciclos: ${respuesta.data.filtros.ciclos.length}`)
    console.log()
    
    // 5. Mostrar JSON de respuesta (truncado)
    console.log('📋 === ESTRUCTURA DE RESPUESTA JSON ===')
    const respuestaParaMostrar = {
      ...respuesta,
      data: {
        ...respuesta.data,
        horarios: respuesta.data.horarios.map(h => ({
          id: h.id,
          fecha_inicio: h.fecha_inicio,
          fecha_fin: h.fecha_fin,
          docente: h.docente,
          grupo: h.grupo,
          descripcion: h.descripcion
        }))
      }
    }
    
    console.log(JSON.stringify(respuestaParaMostrar, null, 2))
    console.log()
    
    // 6. Conclusiones
    console.log('💡 === CONCLUSIONES ===')
    if (horarios.length > 0) {
      console.log('✅ EL BACKEND FUNCIONA CORRECTAMENTE')
      console.log('📝 El problema debe estar en:')
      console.log('   1. El frontend no está haciendo la petición correcta')
      console.log('   2. El frontend no está procesando la respuesta correctamente')
      console.log('   3. Hay un error JavaScript en el frontend')
      console.log('   4. El token no se está enviando correctamente desde el frontend')
      console.log()
      console.log('🔧 Para diagnosticar:')
      console.log('   1. Abrir las herramientas de desarrollador del navegador')
      console.log('   2. Ir a la pestaña Network/Red')
      console.log('   3. Abrir el enlace compartido')
      console.log('   4. Verificar si se hace la petición HTTP al endpoint')
      console.log('   5. Verificar la respuesta del servidor')
      console.log('   6. Revisar la consola por errores JavaScript')
    } else {
      console.log('❌ NO HAY HORARIOS PARA MOSTRAR')
      console.log('📝 Esto es normal si no hay reservas futuras')
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error)
  } finally {
    await pool.end()
  }
}

testApiEndpoint()