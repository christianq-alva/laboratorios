# Implementación de Sistema de Errores y Logging

Este documento describe la implementación del sistema centralizado de manejo de errores y logging con Pino en una aplicación Node.js + Express existente.

**Adaptado a este proyecto:** rutas y ejemplos usan `server/` (no `src/`) y **ES modules** (import/export). El punto de entrada del backend es `server/index.js`.

---

## Requisitos Previos

- Aplicación Node.js + Express existente
- MySQL con `mysql2/promise`
- Estructura básica: router → controller → model

---

## Paso 1: Instalar Dependencias

```bash
npm install pino pino-pretty dotenv
```

**Dependencias:**
- `pino`: Logger de alto rendimiento
- `pino-pretty`: Formateo bonito para logs en desarrollo
- `dotenv`: Manejo de variables de entorno

---

## Paso 2: Crear Archivo .env

Crear archivo `.env` en la raíz del proyecto:

```properties
# Configuración de la API
API_PORT=3000
NODE_ENV=development
LOG_LEVEL=warn

# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=tu_base_datos
TZ=America/Lima

# JWT (si aplica)
JWT_SECRET=tu_clave_secreta
```

**Importante:** Agregar `.env` al `.gitignore`:

```bash
# .gitignore
node_modules/
.env
```

---

## Paso 3: Clase AppError y throwError

**Ubicación:** `server/utils/errors.js`

En este proyecto se usa **ES modules** (import/export). El archivo incluye la clase `AppError` y la función `throwError` (compatibilidad con código existente):

```javascript
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/** @deprecated Preferir throw new AppError(message, statusCode) */
export function throwError(message, statusCode = 400) {
  throw new AppError(message, statusCode);
}
```

**¿Qué hace?**
- Extiende la clase `Error` nativa de JavaScript
- Agrega la propiedad `statusCode` para códigos HTTP
- Permite crear errores personalizados con `throw new AppError('Mensaje', 404)`
- `throwError` se mantiene para no romper modelos/servicios que ya lo usan

---

## Paso 4: Función handleDBError

**Ubicación:** `server/utils/handleDBError.js`

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
  throw new AppError('Error de base de datos', 500);
}
```

**¿Qué hace?**
- Traduce errores técnicos de MySQL a errores comprensibles
- Asigna el código HTTP correcto según el tipo de error
- Permite personalizar el nombre de la entidad (ej: "Usuario duplicado")

**Códigos de error MySQL comunes:**
- `ER_DUP_ENTRY`: Violación de clave única/primaria
- `ER_NO_REFERENCED_ROW_2`: Violación de clave foránea
- `ER_ROW_IS_REFERENCED_2` / `ER_FOREIGN_KEY_CONSTRAINT`: No se puede eliminar (referenciado)
- `ER_BAD_NULL_ERROR`: Campo NOT NULL con valor NULL
- `ECONNREFUSED`: No se puede conectar a MySQL
- `PROTOCOL_CONNECTION_LOST`: Conexión perdida

---

## Paso 5: Configurar Logger con Pino

**Ubicación:** `server/utils/logger.js`

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

**¿Qué hace?**
- En **desarrollo**: Logs bonitos y legibles con colores
- En **producción**: Logs en formato JSON para herramientas de monitoreo
- `LOG_LEVEL` controla qué se loguea (warn, error, info, etc.)

**Niveles de Pino (de menos a más crítico):**
- `trace` (10): Debugging extremo
- `debug` (20): Información de desarrollo
- `info` (30): Información general
- `warn` (40): Advertencias
- `error` (50): Errores
- `fatal` (60): Errores críticos

---

## Paso 6: Configurar server/index.js

**Modificaciones en:** `server/index.js` (punto de entrada del backend en este proyecto)

### 6.1: Agregar al inicio del archivo

```javascript
import 'dotenv/config';
import express from 'express';
import logger from './utils/logger.js';
// ... resto de imports

const app = express();
// Middlewares y rutas...
```

### 6.2: Agregar middleware de errores AL FINAL (antes de app.listen)

```javascript
// ⚠️ IMPORTANTE: Este middleware debe ir DESPUÉS de todas las rutas

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
    logger.fatal(context, '🚨 Error del servidor');
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

**Orden CRÍTICO en server/index.js:**
```javascript
1. import 'dotenv/config'
2. Middlewares globales (express.json, cors, etc.)
3. Rutas
4. Servir estáticos / SPA (si aplica)
5. Middleware de errores (AL FINAL)
6. app.listen()
```

---

## Paso 7: Usar en Models

**Ejemplo:** `server/models/Ciclo.js` (en este proyecto los modelos son objetos con métodos, no clases)

### ANTES (sin manejo de errores):
```javascript
export const Ciclo = {
  getCiclos: async () => {
    const [ciclos] = await pool.execute('SELECT ... FROM ciclos ...');
    return ciclos;
  }
};
```

### DESPUÉS (con handleDBError):
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

**Patrón:** En cada método que use `pool.execute` o `pool.query`, envolver en try/catch y en catch llamar `handleDBError(error, 'NombreEntidad')`. `handleDBError` siempre lanza (no retorna), por lo que no hace falta `throw` delante.

---

## Paso 8: Usar en Services (si existen)

**Ejemplo:** `server/services/equipoService.js` (este proyecto usa objetos/funciones, no clases)

```javascript
import { AppError } from '../utils/errors.js';
// o para compatibilidad: import { throwError } from '../utils/errors.js';
// throwError('Mensaje', 404) equivale a throw new AppError('Mensaje', 404)

// Validación de negocio
if (!existingEquipo) {
  throw new AppError('Equipo no encontrado', 404);
}
// o: throwError('Equipo no encontrado', 404);
```

**Cuándo usar AppError (o throwError) en Services:**
- Validaciones de negocio (recurso no existe, duplicado)
- Reglas de dominio (saldo insuficiente, stock bajo)
- Permisos (no autorizado para esta acción)

Los services de este proyecto ya usan `throwError` de `server/utils/errors.js`; pueden seguir usándolo o migrar a `throw new AppError(message, statusCode)`.

---

## Paso 9: Usar en Controllers

**Ejemplo:** `server/controllers/cicloController.js`

### ANTES (manejo manual en cada catch):
```javascript
export const getCiclos = async (req, res) => {
  try {
    const ciclos = await Ciclo.getCiclos();
    res.status(200).json({ success: true, data: ciclos });
  } catch (error) {
    const status = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Error al obtener ciclos';
    res.status(status).json({ success: false, message });
  }
};
```

### DESPUÉS (try/catch + next para usar el middleware central):
```javascript
import { Ciclo } from '../models/Ciclo.js';

export const getCiclos = async (req, res, next) => {
  try {
    const ciclos = await Ciclo.getCiclos();
    res.status(200).json({ success: true, data: ciclos });
  } catch (error) {
    next(error); // Envía al middleware de errores en server/index.js
  }
};
```

**Patrón:** Añadir el tercer parámetro `next` al handler y en el catch llamar `next(error)`. El middleware de errores en `server/index.js` se encargará del status, del log y de la respuesta JSON. No usar `res.status(...).json(...)` en el catch cuando se use este patrón.

---

## Paso 10: Probar la Implementación

### 10.1: Iniciar servidor
```bash
npm run dev
# o solo backend:
npm run dev:backend
# o
node server/index.js
```

**Deberías ver en consola (con LOG_LEVEL=info o warn):**
```
[14:32:45] INFO: 🚀 Servidor corriendo en puerto 3000
```

### 10.2: Probar diferentes tipos de errores

**1. Error 404 (recurso no encontrado):**  
Ruta que use un controller con `next(error)` y un service/model que lance `AppError('...', 404)`.

**2. Error 409 (duplicado):**  
Request que provoque `ER_DUP_ENTRY` en BD y el model use `handleDBError(error, 'Entidad')`.

**3. Error 500 (error de base de datos):**  
Si MySQL no está disponible y el model usa `handleDBError`, el middleware logueará con nivel `fatal`.

En todos los casos la respuesta JSON tendrá `success: false` y `message` con el texto del error. En desarrollo puede incluirse `stack`.

---

## Estrategia de Logging por Código HTTP

| Código | Nivel | Significado | ¿Revisar? |
|--------|-------|-------------|-----------|
| 500-599 | `fatal` | Error del servidor | ✅ Sí, inmediatamente |
| 401, 403 | `warn` | Acceso denegado | ⚠️ Monitorear seguridad |
| 400-499 | `info` | Error del cliente | ℹ️ Solo registro |

**Configuración de LOG_LEVEL:**

```properties
# Desarrollo - Ver todos los errores
LOG_LEVEL=info

# Producción - Solo errores críticos y advertencias
LOG_LEVEL=warn
```

**Niveles y qué loguean:**
- `LOG_LEVEL=info` → Loguea info, warn, error, fatal (TODO)
- `LOG_LEVEL=warn` → Loguea warn, error, fatal (sin errores 4xx normales)
- `LOG_LEVEL=error` → Loguea error, fatal (solo errores del servidor)

---

## Estructura Final de Archivos (este proyecto)

```
laboratorios/
├── server/
│   ├── config/
│   │   └── database.js
│   ├── utils/
│   │   ├── errors.js          ← AppError + throwError
│   │   ├── handleDBError.js   ← Traductor de errores MySQL
│   │   └── logger.js          ← Pino
│   ├── models/                (MODIFICAR: try/catch + handleDBError donde aplique)
│   ├── services/              (ya usan throwError; opcional migrar a AppError)
│   ├── controllers/           (MODIFICAR: try/catch + next(error) para usar middleware)
│   ├── routes/                (sin cambios)
│   └── index.js               (middleware de errores + logger)
├── .env                        (LOG_LEVEL, NODE_ENV, DB_*, etc.)
├── .gitignore                  (.env ya incluido)
├── package.json                (pino, pino-pretty, dotenv)
└── node_modules/
```

---

## Checklist de Implementación

### Configuración Base
- [ ] Dependencias instaladas (`pino`, `pino-pretty`, `dotenv`)
- [ ] Archivo `.env` creado con variables necesarias
- [ ] `.env` agregado a `.gitignore`

### Archivos de Utilidades
- [x] `server/utils/errors.js` (AppError + throwError)
- [x] `server/utils/handleDBError.js` creado
- [x] `server/utils/logger.js` creado

### Configuración de server/index.js
- [x] `import 'dotenv/config'` (o cargar dotenv al inicio)
- [x] Logger importado
- [x] Middleware de errores agregado al final (antes de app.listen)
- [x] Log de inicio del servidor con logger

### Migración de Código
- [ ] Models: try/catch + handleDBError en métodos que usan pool.execute (ejemplo: Ciclo)
- [x] Services: ya usan throwError (compatible con AppError)
- [ ] Controllers: ir migrando a try/catch + next(error) (ejemplo: cicloController)

### Pruebas
- [ ] Servidor inicia correctamente
- [ ] Error 404 se loguea con nivel `info`
- [ ] Error 500 se loguea con nivel `fatal`
- [ ] Logs se ven correctamente en consola
- [ ] Stack trace solo aparece en desarrollo

---

## Errores Comunes y Soluciones

### 1. "Cannot find module 'pino'"
**Solución:** Ejecutar `npm install pino pino-pretty dotenv`

### 2. Logs no aparecen en consola
**Solución:** Verificar que `LOG_LEVEL` en `.env` sea `info` o `warn`

### 3. "error.statusCode is undefined"
**Solución:** Asegurarse de que todos los errores usan `AppError` o `handleDBError`

### 4. Stack trace aparece en producción
**Solución:** Verificar que `NODE_ENV=production` en el servidor

### 5. Middleware de errores no se ejecuta
**Solución:** Verificar que está **después** de todas las rutas en `server/index.js`. Los controladores deben recibir `next` y llamar `next(error)` en el catch.

---

## Resumen del Flujo

```
[Request]
   ↓
[Controller] → try/catch
   ↓
[Service] → throw new AppError() para validaciones
   ↓
[Model] → try/catch + handleDBError() para errores DB
   ↓
[Controller catch] → next(error)
   ↓
[Middleware de Errores]
   ├─ Loguea según statusCode
   └─ Responde JSON con error
```

---

**Con este sistema implementado, todos los errores están centralizados, logueados automáticamente, y el código queda limpio y mantenible.**