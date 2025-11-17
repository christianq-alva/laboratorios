import rateLimit from 'express-rate-limit'

// ============================================
// RATE LIMITER GENERAL PARA TODA LA API
// ============================================
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Máximo 1000 peticiones por IP cada 15 minutos
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP, intenta de nuevo en 5 minutos'
  },
  standardHeaders: true, // Retorna rate limit info en headers `RateLimit-*`
  legacyHeaders: false, // Desactiva `X-RateLimit-*` headers
  // Función para obtener el identificador único (IP o userId)
  skip: (req) => req.method === 'OPTIONS',
  keyGenerator: (req) => {
    // Si el usuario está autenticado, usar su ID (más preciso)
    if (req.user?.userId) {
      return `user:${req.user.userId}`
    }
    // Si no, usar IP
    return req.ip || req.connection?.remoteAddress || 'unknown'
  },
  // Función para personalizar el mensaje de error
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Demasiadas peticiones. Por favor, intenta de nuevo en 5 minutos.',
      retryAfter: req.rateLimit?.resetTime
        ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        : 300 // Segundos hasta poder intentar de nuevo
    })
  }
})

// ============================================
// RATE LIMITER ESTRICTO PARA LOGIN
// ============================================
// Más restrictivo para prevenir fuerza bruta
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos de login cada 15 minutos por IP
  message: {
    success: false,
    message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Usar IP siempre para login (no hay usuario autenticado aún)
  skip: (req) => req.method === 'OPTIONS',
  keyGenerator: (req) => {
    return req.ip || req.connection?.remoteAddress || 'unknown'
  },
  // Mensaje personalizado
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Demasiados intentos de inicio de sesión. Por seguridad, espera 15 minutos antes de intentar nuevamente.',
      retryAfter: req.rateLimit?.resetTime
        ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        : 900
    })
  },
  // Contar todos los intentos, incluso los exitosos
  skipSuccessfulRequests: false,
  skipFailedRequests: false
})

// ============================================
// RATE LIMITER PARA OPERACIONES PESADAS
// ============================================
// Para endpoints que consumen muchos recursos (importaciones, reportes, etc.)
export const heavyOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Solo 10 operaciones pesadas por hora
  message: {
    success: false,
    message: 'Has alcanzado el límite de operaciones pesadas. Intenta de nuevo en 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  keyGenerator: (req) => {
    if (req.user?.userId) {
      return `heavy:user:${req.user.userId}`
    }
    return `heavy:${req.ip || req.connection?.remoteAddress || 'unknown'}`
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Has alcanzado el límite de operaciones pesadas. Intenta de nuevo en 1 hora.',
      retryAfter: req.rateLimit?.resetTime
        ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        : 3600
    })
  }
})

// ============================================
// RATE LIMITER PARA CREAR RECURSOS
// ============================================
// Limitar creación de recursos (POST) para prevenir spam
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // Máximo 50 creaciones por hora
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  keyGenerator: (req) => {
    if (req.user?.userId) {
      return `create:user:${req.user.userId}`
    }
    return `create:${req.ip || req.connection?.remoteAddress || 'unknown'}`
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Has alcanzado el límite de creación de recursos. Intenta de nuevo en 1 hora.',
      retryAfter: req.rateLimit?.resetTime
        ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        : 3600
    })
  }
})

// ============================================
// RATE LIMITER PARA RUTAS PÚBLICAS
// ============================================
// Para endpoints públicos como horarios compartidos
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // 30 peticiones cada 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  keyGenerator: (req) => {
    return req.ip || req.connection?.remoteAddress || 'unknown'
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.',
      retryAfter: req.rateLimit?.resetTime
        ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        : 900
    })
  }
})

