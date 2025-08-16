#!/usr/bin/env node

import axios from 'axios'

const API_BASE = 'https://beneficial-wholeness-production-9cd6.up.railway.app/api'

// Simular el comportamiento del frontend
async function checkFrontendToken() {
  console.log('🔍 Verificando token del frontend...')
  console.log('')

  // 1. Verificar si hay token en localStorage (simulado)
  const mockToken = 'mock-token-for-testing'
  console.log('1️⃣ Token simulado:', mockToken ? 'Presente' : 'Ausente')
  console.log('')

  // 2. Crear instancia de axios como en el frontend
  const api = axios.create({
    baseURL: API_BASE,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // 3. Agregar interceptor como en el frontend
  api.interceptors.request.use(
    (config) => {
      if (mockToken) {
        config.headers.Authorization = `Bearer ${mockToken}`
        console.log('🎫 Token agregado automáticamente')
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // 4. Probar con token válido
  console.log('2️⃣ Probando con token válido...')
  try {
    const response = await api.get('/horarios')
    console.log('✅ ÉXITO con token válido:', response.status)
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('❌ Error 401: Token inválido o expirado')
      console.log('📝 Mensaje:', error.response.data?.message)
    } else {
      console.log('❌ Error inesperado:', error.response?.status, error.response?.data?.message)
    }
  }
  console.log('')

  // 5. Probar sin token
  console.log('3️⃣ Probando sin token...')
  const apiWithoutToken = axios.create({
    baseURL: API_BASE,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  try {
    const response = await apiWithoutToken.get('/horarios')
    console.log('❌ ERROR: Se accedió sin token (no debería pasar)')
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correcto: Se requiere token')
      console.log('📝 Mensaje:', error.response.data?.message)
    } else {
      console.log('❌ Error inesperado:', error.response?.status, error.response?.data?.message)
    }
  }
  console.log('')

  // 6. Probar creación de horario con token inválido
  console.log('4️⃣ Probando crear horario con token inválido...')
  const testData = {
    laboratorio_id: 1,
    docente_id: 1,
    grupo_id: 1,
    descripcion: 'Clase de prueba',
    fecha_inicio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    fecha_fin: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    cantidad_alumnos: 20,
    insumos: []
  }

  try {
    const response = await api.post('/horarios', testData)
    console.log('❌ ERROR: Se creó con token inválido (no debería pasar)')
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correcto: Se requiere token válido para crear')
      console.log('📝 Mensaje:', error.response.data?.message)
    } else if (error.response?.status === 400) {
      console.log('❌ Error 400: Datos inválidos')
      console.log('📝 Mensaje:', error.response.data?.message)
    } else {
      console.log('❌ Error inesperado:', error.response?.status, error.response?.data?.message)
    }
  }

  console.log('')
  console.log('🔍 Diagnóstico:')
  console.log('- Si ves error 401: El token no se está enviando o es inválido')
  console.log('- Si ves error 400: Los datos son inválidos pero la autenticación funciona')
  console.log('- Si ves éxito: Hay un problema de seguridad')
}

checkFrontendToken()
