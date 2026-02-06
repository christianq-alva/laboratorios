# Logging del backend

El backend usa **Pino** como logger. La configuración está en `server/utils/logger.js`.

## Comportamiento por entorno

| Situación | Consola | BetterStack |
|-----------|--------|-------------|
| Desarrollo (sin token) | ✅ pino-pretty (legible) | — |
| Desarrollo (con token) | ✅ pino-pretty | ✅ |
| Producción (sin token) | stdout en JSON | — |
| Producción (con token) | stdout en JSON | ✅ |

- **Consola en desarrollo**: los logs se muestran formateados con colores y hora.
- **Consola en producción**: Pino escribe una línea JSON por log en stdout (útil para plataformas como Railway que capturan stdout).
- **BetterStack**: opcional. Solo se usa si está definida la variable `LOGTAIL_SOURCE_TOKEN`.

## Variables de entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `LOG_LEVEL` | No | Nivel mínimo de log (`trace`, `debug`, `info`, `warn`, `error`, `fatal`). Por defecto: `warn`. |
| `LOGTAIL_SOURCE_TOKEN` | No | Token del source en BetterStack. Si está definido, los logs se envían además a BetterStack. |
| `LOGTAIL_ENDPOINT` | No | Endpoint de ingesta (solo si BetterStack indica uno distinto al por defecto). |

BetterStack es **opcional y no definitivo**: si no configuras el token, el sistema funciona igual; los logs solo salen por consola/stdout.

## Uso en código

```javascript
import logger from './utils/logger.js'

logger.info('Mensaje')
logger.warn({ clave: 'valor' }, 'Mensaje con contexto')
logger.error({ err: error }, 'Error')
```

## Niveles

Se usan los niveles estándar de Pino: `trace`, `debug`, `info`, `warn`, `error`, `fatal`. El nivel configurado en `LOG_LEVEL` filtra los de menor prioridad.
