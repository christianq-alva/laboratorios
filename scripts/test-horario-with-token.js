#!/usr/bin/env node

import axios from 'axios'

const API_BASE = 'https://beneficial-wholeness-production-9cd6.up.railway.app/api'

console.log('🔍 Script para probar creación de horarios con token real')
console.log('')
console.log('📋 INSTRUCCIONES:')
console.log('1. Abre las herramientas de desarrollador (F12) en tu navegador')
console.log('2. Ve a la pestaña "Application" o "Aplicación"')
console.log('3. En Local Storage, busca la clave "token"')
console.log('4. Copia el valor del token')
console.log('5. Pega el token cuando te lo solicite este script')
console.log('')

// Simular entrada del usuario (en un script real necesitarías usar readline)
const mockToken = process.argv[2] || ''

if (!mockToken) {
  console.log('❌ No se proporcionó token')
  console.log('Uso: node scripts/test-horario-with-token.js "tu-token-aqui"')
  console.log('')
  console.log('🔍 Para obtener tu token:')
  console.log('1. Abre las herramientas de desarrollador (F12)')
  console.log('2. Ve a Application > Local Storage')
  console.log('3. Busca la clave "token" y copia su valor')
  process.exit(1)
}

async function testWithToken() {
  console.log('🧪 Probando con token proporcionado...')
  console.log('')

  // Crear instancia de axios con token
  const api = axios.create({
    baseURL: API_BASE,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mockToken}`
    }
  })

  try {
    // 1. Probar que el token funciona
    console.log('1️⃣ Verificando token...')
    const userResponse = await api.get('/auth/me')
    console.log('✅ Token válido - Usuario:', userResponse.data.data?.nombre || 'N/A')
    console.log('')

    // 2. Obtener datos necesarios
    console.log('2️⃣ Obteniendo datos de la base de datos...')
    
    const [labsResponse, docentesResponse, gruposResponse] = await Promise.all([
      api.get('/laboratorios'),
      api.get('/docentes'),
      api.get('/horarios/utils/grupos')
    ])

    const laboratorios = labsResponse.data.data || []
    const docentes = docentesResponse.data.data || []
    const grupos = gruposResponse.data.data || []

    console.log(`✅ Laboratorios: ${laboratorios.length}`)
    console.log(`✅ Docentes: ${docentes.length}`)
    console.log(`✅ Grupos: ${grupos.length}`)
    console.log('')

    if (laboratorios.length === 0 || docentes.length === 0 || grupos.length === 0) {
      console.log('❌ Faltan datos en la base de datos')
      return
    }

    // 3. Crear datos de prueba
    const testData = {
      laboratorio_id: laboratorios[0].id,
      docente_id: docentes[0].id,
      grupo_id: grupos[0].id,
      descripcion: 'Clase de prueba desde script',
      fecha_inicio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      fecha_fin: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      cantidad_alumnos: 20,
      insumos: []
    }

    console.log('3️⃣ Datos de prueba:')
    console.log(JSON.stringify(testData, null, 2))
    console.log('')

    // 4. Verificar compatibilidad de escuela
    const docente = docentes.find(d => d.id === testData.docente_id)
    const grupo = grupos.find(g => g.id === testData.grupo_id)
    
    if (docente && grupo) {
      console.log('4️⃣ Verificando compatibilidad:')
      console.log(`   Docente: ${docente.nombre} (Escuela: ${docente.escuela_id})`)
      console.log(`   Grupo: ${grupo.nombre} (Escuela: ${grupo.escuela_id})`)
      
      if (docente.escuela_id === grupo.escuela_id) {
        console.log('   ✅ Compatibles: Misma escuela')
      } else {
        console.log('   ❌ Incompatibles: Diferentes escuelas')
        console.log('   Esto causará error 400')
        return
      }
    }
    console.log('')

    // 5. Intentar crear el horario
    console.log('5️⃣ Intentando crear horario...')
    const createResponse = await api.post('/horarios', testData)
    console.log('✅ ¡ÉXITO! Horario creado correctamente')
    console.log('📋 Respuesta:', createResponse.data)

  } catch (error) {
    console.log('❌ Error en la prueba:')
    
    if (error.response) {
      const { status, data } = error.response
      console.log(`   Status: ${status}`)
      console.log(`   Mensaje: ${data?.message || 'Sin mensaje'}`)
      console.log(`   Datos:`, data)
    } else {
      console.log(`   Error: ${error.message}`)
    }
  }
}

testWithToken()
