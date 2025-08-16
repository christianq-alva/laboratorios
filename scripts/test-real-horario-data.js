#!/usr/bin/env node

import axios from 'axios'

const API_BASE = 'https://beneficial-wholeness-production-9cd6.up.railway.app/api'

// Función para obtener datos reales de la base de datos
async function getRealData() {
  console.log('🔍 Obteniendo datos reales de la base de datos...')
  console.log('')

  try {
    // 1. Obtener laboratorios
    console.log('1️⃣ Obteniendo laboratorios...')
    const labsResponse = await axios.get(`${API_BASE}/laboratorios`)
    const laboratorios = labsResponse.data.data || []
    console.log(`✅ Laboratorios encontrados: ${laboratorios.length}`)
    if (laboratorios.length > 0) {
      console.log('🔍 Primer laboratorio:', laboratorios[0])
    }
    console.log('')

    // 2. Obtener docentes
    console.log('2️⃣ Obteniendo docentes...')
    const docentesResponse = await axios.get(`${API_BASE}/docentes`)
    const docentes = docentesResponse.data.data || []
    console.log(`✅ Docentes encontrados: ${docentes.length}`)
    if (docentes.length > 0) {
      console.log('🔍 Primer docente:', docentes[0])
    }
    console.log('')

    // 3. Obtener grupos
    console.log('3️⃣ Obteniendo grupos...')
    const gruposResponse = await axios.get(`${API_BASE}/horarios/utils/grupos`)
    const grupos = gruposResponse.data.data || []
    console.log(`✅ Grupos encontrados: ${grupos.length}`)
    if (grupos.length > 0) {
      console.log('🔍 Primer grupo:', grupos[0])
    }
    console.log('')

    return {
      laboratorios,
      docentes,
      grupos
    }

  } catch (error) {
    console.log('❌ Error obteniendo datos:', error.response?.status, error.response?.data?.message)
    return null
  }
}

// Función para probar creación con datos reales
async function testWithRealData() {
  console.log('🧪 Probando creación de horarios con datos reales...')
  console.log('')

  const data = await getRealData()
  if (!data) {
    console.log('❌ No se pudieron obtener datos reales')
    return
  }

  const { laboratorios, docentes, grupos } = data

  if (laboratorios.length === 0 || docentes.length === 0 || grupos.length === 0) {
    console.log('❌ Faltan datos en la base de datos:')
    console.log(`   - Laboratorios: ${laboratorios.length}`)
    console.log(`   - Docentes: ${docentes.length}`)
    console.log(`   - Grupos: ${grupos.length}`)
    return
  }

  // Crear datos de prueba con IDs reales
  const testData = {
    laboratorio_id: laboratorios[0].id,
    docente_id: docentes[0].id,
    grupo_id: grupos[0].id,
    descripcion: 'Clase de prueba con datos reales',
    fecha_inicio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    fecha_fin: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    cantidad_alumnos: 20,
    insumos: []
  }

  console.log('📤 Datos de prueba con IDs reales:')
  console.log(JSON.stringify(testData, null, 2))
  console.log('')

  console.log('🔍 Verificando compatibilidad de escuela...')
  const docente = docentes.find(d => d.id === testData.docente_id)
  const grupo = grupos.find(g => g.id === testData.grupo_id)
  
  if (docente && grupo) {
    console.log(`📋 Docente: ${docente.nombre} (Escuela: ${docente.escuela_id})`)
    console.log(`📋 Grupo: ${grupo.nombre} (Escuela: ${grupo.escuela_id})`)
    
    if (docente.escuela_id === grupo.escuela_id) {
      console.log('✅ Compatibles: Misma escuela')
    } else {
      console.log('❌ Incompatibles: Diferentes escuelas')
      console.log('   Esto causará error 400')
    }
  }
  console.log('')

  console.log('🚨 NOTA: Este script no puede probar la creación real porque requiere autenticación.')
  console.log('   Pero te muestra los datos que se usarían y posibles problemas.')
}

testWithRealData()
