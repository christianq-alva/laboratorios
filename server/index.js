import { app } from './app.js'
import { testConnection } from './config/database.js'
import logger from './utils/logger.js'

const port = process.env.PORT || 3000

// ============================================
// INICIAR SERVIDOR
// ============================================
// Solo levantar servidor si NO es test
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(`🚀 Servidor corriendo en puerto ${port}`)
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
    logger.info(`🔗 Health check: http://localhost:${port}/health`)
    testConnection()
  })
}

// ============================================
// MANEJO DE ERRORES NO CAPTURADOS
// ============================================
process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, '❌ Unhandled Rejection')
})

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, '❌ Uncaught Exception')
  process.exit(1)
})