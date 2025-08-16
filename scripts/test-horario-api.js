#!/usr/bin/env node

import axios from 'axios'

const API_BASE = 'https://beneficial-wholeness-production-9cd6.up.railway.app/api'

// Simular datos de prueba
const testData = {
  laboratorio_id: 1,
  docente_id: 1,
  grupo_id: 1,
  descripcion: 'Clase de prueba',
  fecha_inicio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Mañana
  fecha_fin: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Mañana + 1 hora
  cantidad_alumnos: 20,
  insumos: []
}

async function testHorarioAPI() {
  console.log('🧪 Probando API de Horarios...')
  console.log('')

  try {
    // 1. Probar health check
    console.log('1️⃣ Probando health check...')
    const healthResponse = await axios.get(`${API_BASE}/health`)
    console.log('✅ Health check:', healthResponse.data)
    console.log('')

    // 2. Probar obtener horarios
    console.log('2️⃣ Probando obtener horarios...')
    try {
      const horariosResponse = await axios.get(`${API_BASE}/horarios`)
      console.log('✅ Horarios obtenidos:', horariosResponse.data.success ? 'Sí' : 'No')
      console.log('📊 Total horarios:', horariosResponse.data.data?.length || 0)
    } catch (error) {
      console.log('❌ Error obteniendo horarios:', error.response?.status, error.response?.data?.message)
    }
    console.log('')

    // 3. Probar obtener laboratorios
    console.log('3️⃣ Probando obtener laboratorios...')
    try {
      const labsResponse = await axios.get(`${API_BASE}/laboratorios`)
      console.log('✅ Laboratorios obtenidos:', labsResponse.data.success ? 'Sí' : 'No')
      console.log('📊 Total laboratorios:', labsResponse.data.data?.length || 0)
      if (labsResponse.data.data?.length > 0) {
        console.log('🔍 Primer laboratorio:', labsResponse.data.data[0])
      }
    } catch (error) {
      console.log('❌ Error obteniendo laboratorios:', error.response?.status, error.response?.data?.message)
    }
    console.log('')

    // 4. Probar obtener docentes
    console.log('4️⃣ Probando obtener docentes...')
    try {
      const docentesResponse = await axios.get(`${API_BASE}/docentes`)
      console.log('✅ Docentes obtenidos:', docentesResponse.data.success ? 'Sí' : 'No')
      console.log('📊 Total docentes:', docentesResponse.data.data?.length || 0)
      if (docentesResponse.data.data?.length > 0) {
        console.log('🔍 Primer docente:', docentesResponse.data.data[0])
      }
    } catch (error) {
      console.log('❌ Error obteniendo docentes:', error.response?.status, error.response?.data?.message)
    }
    console.log('')

    // 5. Probar obtener grupos
    console.log('5️⃣ Probando obtener grupos...')
    try {
      const gruposResponse = await axios.get(`${API_BASE}/horarios/utils/grupos`)
      console.log('✅ Grupos obtenidos:', gruposResponse.data.success ? 'Sí' : 'No')
      console.log('📊 Total grupos:', gruposResponse.data.data?.length || 0)
      if (gruposResponse.data.data?.length > 0) {
        console.log('🔍 Primer grupo:', gruposResponse.data.data[0])
      }
    } catch (error) {
      console.log('❌ Error obteniendo grupos:', error.response?.status, error.response?.data?.message)
    }
    console.log('')

    // 6. Probar crear horario (sin autenticación - debería fallar)
    console.log('6️⃣ Probando crear horario (sin auth)...')
    try {
      const createResponse = await axios.post(`${API_BASE}/horarios`, testData)
      console.log('❌ ERROR: Se creó sin autenticación (no debería pasar)')
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correcto: Se requiere autenticación')
      } else {
        console.log('❌ Error inesperado:', error.response?.status, error.response?.data?.message)
      }
    }
    console.log('')

    console.log('📋 Datos de prueba que se usarían:')
    console.log(JSON.stringify(testData, null, 2))

  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

testHorarioAPI()
