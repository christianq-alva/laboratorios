#!/usr/bin/env node

import axios from 'axios'

const API_BASE = 'https://beneficial-wholeness-production-9cd6.up.railway.app/api'

// Diferentes escenarios de datos que podrían causar error 400
const testScenarios = [
  {
    name: 'Datos completos válidos',
    data: {
      laboratorio_id: 1,
      docente_id: 1,
      grupo_id: 1,
      descripcion: 'Clase de prueba completa',
      fecha_inicio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      fecha_fin: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      cantidad_alumnos: 20,
      insumos: []
    }
  },
  {
    name: 'Sin descripción',
    data: {
      laboratorio_id: 1,
      docente_id: 1,
      grupo_id: 1,
      descripcion: '',
      fecha_inicio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      fecha_fin: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      cantidad_alumnos: 20,
      insumos: []
    }
  },
  {
    name: 'IDs inválidos (0)',
    data: {
      laboratorio_id: 0,
      docente_id: 0,
      grupo_id: 0,
      descripcion: 'Clase con IDs inválidos',
      fecha_inicio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      fecha_fin: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      cantidad_alumnos: 20,
      insumos: []
    }
  },
  {
    name: 'Fechas inválidas',
    data: {
      laboratorio_id: 1,
      docente_id: 1,
      grupo_id: 1,
      descripcion: 'Clase con fechas inválidas',
      fecha_inicio: 'fecha-invalida',
      fecha_fin: 'fecha-invalida',
      cantidad_alumnos: 20,
      insumos: []
    }
  },
  {
    name: 'Fecha fin antes que inicio',
    data: {
      laboratorio_id: 1,
      docente_id: 1,
      grupo_id: 1,
      descripcion: 'Clase con fecha fin antes que inicio',
      fecha_inicio: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      fecha_fin: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      cantidad_alumnos: 20,
      insumos: []
    }
  }
]

async function debugHorarioError() {
  console.log('🔍 Debuggeando error 400 en creación de horarios...')
  console.log('')

  for (const scenario of testScenarios) {
    console.log(`🧪 Probando: ${scenario.name}`)
    console.log('📤 Datos enviados:', JSON.stringify(scenario.data, null, 2))
    
    try {
      const response = await axios.post(`${API_BASE}/horarios`, scenario.data)
      console.log('✅ ÉXITO (no debería pasar sin auth):', response.status)
    } catch (error) {
      if (error.response) {
        console.log(`❌ Error ${error.response.status}:`, error.response.data?.message || error.response.data)
        if (error.response.data?.message) {
          console.log('📝 Mensaje específico:', error.response.data.message)
        }
      } else {
        console.log('❌ Error de red:', error.message)
      }
    }
    console.log('---')
  }

  console.log('')
  console.log('🔍 Posibles causas del error 400:')
  console.log('1. IDs de laboratorio, docente o grupo que no existen en la BD')
  console.log('2. Fechas en formato incorrecto')
  console.log('3. Campos requeridos faltantes')
  console.log('4. Validaciones de negocio (escuela del docente vs grupo)')
  console.log('5. Conflictos de horario')
  console.log('6. Stock insuficiente de insumos')
}

debugHorarioError()
