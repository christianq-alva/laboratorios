// Configuración de entorno para desarrollo y producción
export const config = {
  // URL base de la API
  apiUrl: import.meta.env.VITE_API_URL || 
          (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api'),
  
  // URL base del frontend
  baseUrl: import.meta.env.VITE_BASE_URL || 
           (import.meta.env.DEV ? 'http://localhost:5173' : ''),
  
  // Entorno
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Configuración de la aplicación
  appName: 'Sistema de Laboratorios',
  version: '1.0.0'
}

// Log de configuración en desarrollo
if (config.isDevelopment) {
  console.log('🔧 Configuración de entorno:', {
    apiUrl: config.apiUrl,
    baseUrl: config.baseUrl,
    environment: config.isDevelopment ? 'development' : 'production'
  })
}
