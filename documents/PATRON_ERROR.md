# Patrón de Errores y Logging

Este documento describe el **patrón de manejo de errores y logging** usado en este proyecto. Sirve como referencia para entender los componentes (AppError, handleDBError, Pino, middleware) y cómo aplicarlos en modelos, servicios y controladores.

**Convenciones del proyecto:** Backend en `server/`, **ES modules** (import/export). Punto de entrada del backend: `server/index.js`. Estructura: router → controller → service → model.

---

## Resumen del flujo

```
[Request]
   ↓
[Controller] → try/catch
   ↓
[Service] → throw new AppError() para validaciones de negocio
   ↓
[Model] → try/catch + handleDBError() para errores de BD
   ↓
[Controller catch] → next(error)
   ↓
[Middleware de Errores]
   ├─ Loguea según statusCode (fatal/warn/info)
   └─ Responde JSON con success: false y message
```

---

## Componentes del patrón

### 1. AppError

**Ubicación:** `server/utils/errors.js`

La clase `AppError` extiende `Error` y añade `statusCode` para respuestas HTTP. Soporta encadenado de errores con `options.cause` (ES2022/Node 16.9+).

```javascript
export class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message, options.cause != null ? { cause: options.cause } : undefined);
    this.statusCode = statusCode;
    this.name = 'AppError';
    if (options.cause != null) this.cause = options.cause;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
```

**Uso:**
- Errores de negocio: `throw new AppError('Recurso no encontrado', 404)`
- Errores con causa: `throw new AppError('Error de BD', 500, { cause: errorOriginal })` — el middleware loguea una sola vez incluyendo `err` (Pino serializa `err.cause`), sin duplicar logs.

---

### 2. handleDBError

**Ubicación:** `server/utils/handleDBError.js`

Traduce errores técnicos de MySQL a `AppError` con mensajes comprensibles y código HTTP adecuado.

```javascript
import { AppError } from './errors.js';

export function handleDBError(error, entityName = 'Registro') {
  if (error.code === 'ER_DUP_ENTRY') {
    throw new AppError(`${entityName} duplicado`, 409);
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    throw new AppError(`${entityName} relacionado no existe`, 400);
  }
  if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_FOREIGN_KEY_CONSTRAINT') {
    throw new AppError(`No se puede eliminar. ${entityName} está siendo usado en el sistema.`, 409);
  }
  if (error.code === 'ER_BAD_NULL_ERROR') {
    throw new AppError('Faltan campos obligatorios', 400);
  }
  if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
    throw new AppError('Error de conexión a base de datos', 500);
  }
  // Error desconocido: se adjunta cause para que el middleware loguee una sola vez con detalle
  throw new AppError('Error de base de datos', 500, { cause: error });
}
```

**Códigos MySQL mapeados:**
- `ER_DUP_ENTRY`: Violación de clave única/primaria → 409
- `ER_NO_REFERENCED_ROW_2`: Violación de clave foránea → 400
- `ER_ROW_IS_REFERENCED_2` / `ER_FOREIGN_KEY_CONSTRAINT`: No se puede eliminar (referenciado) → 409
- `ER_BAD_NULL_ERROR`: Campo NOT NULL con valor NULL → 400
- `ECONNREFUSED` / `PROTOCOL_CONNECTION_LOST`: Conexión a BD → 500

En errores no mapeados se usa `{ cause: error }` para que el middleware registre el detalle en un único log.

---

### 3. Logger (Pino)

**Ubicación:** `server/utils/logger.js`

En **desarrollo** se usa `pino-pretty` (logs legibles con colores). En **producción**, logs en JSON para herramientas de monitoreo. El nivel se controla con `LOG_LEVEL` en `.env`.

```javascript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'warn',
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname'
        }
      }
    : undefined
});

export default logger;
```

**Niveles de Pino (de menos a más crítico):** `trace`, `debug`, `info`, `warn`, `error`, `fatal`.

---

### 4. Middleware de errores

**Ubicación:** `server/index.js` — debe ir **al final**, después de todas las rutas y antes de `app.listen()`.

Para errores 5xx se incluye `err: error` en el log para que Pino serialice el error completo (incluido `error.cause` cuando viene de `handleDBError`).

```javascript
import 'dotenv/config';
import express from 'express';
import logger from './utils/logger.js';
// ... resto de imports

const app = express();
// Middlewares globales, rutas, etc.

// ⚠️ Middleware de errores: SIEMPRE al final, antes de app.listen
app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  const context = {
    message: error.message,
    statusCode,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  };

  if (statusCode >= 500) {
    logger.fatal({ err: error, ...context }, '🚨 Error del servidor');
  } else if (statusCode === 401 || statusCode === 403) {
    logger.warn(context, '🔒 Acceso denegado');
  } else if (statusCode >= 400) {
    logger.info(context, 'Error del cliente');
  }

  res.status(statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`🚀 Servidor corriendo en puerto ${port}`);
});
```

**Orden en `server/index.js`:**
1. `import 'dotenv/config'`
2. Middlewares globales (express.json, cors, etc.)
3. Rutas
4. Servir estáticos / SPA (si aplica)
5. **Middleware de errores (al final)**
6. `app.listen()`

---

## Configuración

### Variables de entorno

En `.env` (y `.env` en `.gitignore`):

```properties
NODE_ENV=development
LOG_LEVEL=warn

# Base de datos, JWT, etc.
```

`LOG_LEVEL` controla qué se loguea: `info`, `warn`, `error`, `fatal`, etc.

### Dependencias

El patrón usa `pino`, `pino-pretty` y `dotenv`. Si faltan: `npm install pino pino-pretty dotenv`.

---

## Uso del patrón

### En modelos

En este proyecto los modelos son objetos con métodos async (no clases). En cada método que use `pool.execute` o `pool.query`, envolver en try/catch y en el catch llamar `handleDBError(error, 'NombreEntidad')`. `handleDBError` siempre lanza; no hace falta `throw` delante.

**Forma recomendada:**

```javascript
import { pool } from '../config/database.js';
import { handleDBError } from '../utils/handleDBError.js';

export const Ciclo = {
  getCiclos: async () => {
    try {
      const [ciclos] = await pool.execute('SELECT ... FROM ciclos ...');
      return ciclos;
    } catch (error) {
      handleDBError(error, 'Ciclo');
    }
  },
  getById: async (id) => {
    try {
      const [rows] = await pool.execute('SELECT ... WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      handleDBError(error, 'Ciclo');
    }
  }
};
```

**Evitar:** Dejar las consultas sin try/catch o devolver respuestas HTTP manualmente desde el modelo.

---

### En servicios

Para validaciones de negocio (recurso no existe, duplicado, reglas de dominio, permisos), lanzar `AppError` con el código HTTP adecuado.

```javascript
import { AppError } from '../utils/errors.js';

// Ejemplo: recurso no encontrado
if (!existingEquipo) {
  throw new AppError('Equipo no encontrado', 404);
}
```

En este proyecto también existe `throwError('Mensaje', 404)` en `server/utils/errors.js`, equivalente a `throw new AppError('Mensaje', 404)`; se puede usar cualquiera de los dos.

---

### En controladores

El controlador debe recibir `next` y en el catch llamar `next(error)`. El middleware de errores en `server/index.js` se encarga del status, del log y de la respuesta JSON. No usar `res.status(...).json(...)` dentro del catch cuando se sigue este patrón.

**Forma recomendada:**

```javascript
import { Ciclo } from '../models/Ciclo.js';

export const getCiclos = async (req, res, next) => {
  try {
    const ciclos = await Ciclo.getCiclos();
    res.status(200).json({ success: true, data: ciclos });
  } catch (error) {
    next(error);
  }
};
```

**Evitar:** Manejar el error manualmente en cada controlador (status, mensaje, log). Eso se centraliza en el middleware.

---

## Estrategia de logging por código HTTP

| Código    | Nivel  | Significado      | Uso                    |
|-----------|--------|------------------|------------------------|
| 500-599   | `fatal`| Error del servidor | Revisar de inmediato   |
| 401, 403  | `warn` | Acceso denegado  | Monitorear seguridad   |
| 400-499   | `info` | Error del cliente| Solo registro          |

**LOG_LEVEL:**
- `info` → loguea info, warn, error, fatal (incluye errores 4xx normales)
- `warn` → loguea warn, error, fatal (sin errores 4xx normales)
- `error` → loguea error, fatal (solo errores del servidor)

---

## Estructura de archivos

```
server/
├── config/
│   └── database.js
├── utils/
│   ├── errors.js          ← AppError (soporta options.cause)
│   ├── handleDBError.js   ← Traductor de errores MySQL
│   └── logger.js          ← Pino
├── models/                ← try/catch + handleDBError donde usen pool
├── services/              ← throw new AppError() para validaciones
├── controllers/           ← try/catch + next(error)
├── routes/
└── index.js               ← middleware de errores al final + logger
```

`.env` debe incluir `LOG_LEVEL`, `NODE_ENV` y el resto de variables necesarias. `.env` en `.gitignore`.

---

## Errores comunes y soluciones

| Problema | Solución |
|----------|----------|
| "Cannot find module 'pino'" | `npm install pino pino-pretty dotenv` |
| Logs no aparecen en consola | Verificar `LOG_LEVEL` en `.env` (p. ej. `info` o `warn`) |
| "error.statusCode is undefined" | Usar siempre `AppError` o `handleDBError`; no lanzar `Error` genérico |
| Stack trace en producción | Verificar `NODE_ENV=production` en el servidor |
| Middleware de errores no se ejecuta | Debe estar **después** de todas las rutas; controladores deben usar `next(error)` en el catch |

---

## Probar el patrón

- **Iniciar servidor:** `npm run dev` o `node server/index.js`. Con `LOG_LEVEL=info` o `warn` debería verse en consola el log de arranque.
- **404:** Ruta que use un controller con `next(error)` y un service/model que lance `AppError('...', 404)`.
- **409 (duplicado):** Request que provoque `ER_DUP_ENTRY` y el model use `handleDBError(error, 'Entidad')`.
- **500:** Si MySQL no está disponible y el model usa `handleDBError`, el middleware logueará con nivel `fatal`.

Las respuestas JSON tendrán `success: false` y `message`. En desarrollo puede incluirse `stack`.

---

**Con este patrón, los errores quedan centralizados, logueados de forma consistente y el código en controladores y modelos se mantiene simple.**
