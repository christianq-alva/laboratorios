import pino from 'pino'

const isDev = process.env.NODE_ENV === 'development'
const logtailToken = process.env.LOGTAIL_SOURCE_TOKEN
const level = process.env.LOG_LEVEL || 'warn'

// Varios targets: consola (pino-pretty en dev) y BetterStack si hay token
const targets = []

if (isDev) {
  targets.push({
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    },
    level
  })
}

if (logtailToken) {
  targets.push({
    target: '@logtail/pino',
    options: {
      sourceToken: logtailToken,
      options: { endpoint: process.env.LOGTAIL_ENDPOINT }
    },
    level
  })
}

const logger = pino({
  level,
  transport: targets.length > 0 ? { targets } : undefined
})

export default logger
