// Configuración de entorno para desarrollo y producción
export const config = {
  // URL base de la API
  apiUrl: import.meta.env.VITE_API_URL || 
          (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api'),
  
  // URL base del frontend
  baseUrl: import.meta.env.VITE_BASE_URL || 
           (window.location.hostname === 'localhost' ? 'http://localhost:5173' : window.location.origin),
  
  // Entorno
  isDevelopment: window.location.hostname === 'localhost',
  isProduction: window.location.hostname !== 'localhost',
  
  // Configuración de la aplicación
  appName: 'Sistema de Laboratorios',
  version: '1.0.0'
}


