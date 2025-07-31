import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3000/api')
  },
  server: {
    host: '0.0.0.0', // Permite acceso desde dispositivos móviles en desarrollo
    port: 5173
  }
})
