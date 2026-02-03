# Guía de Documentación del Proyecto

## Principio Base
> **"Documentación estratégica: JSDoc formal donde aporta valor, comentarios simples donde el código habla por sí mismo"**

---

## Contexto del proyecto

- **Módulos:** ESM (`import` / `export`, `export default` para el router).
- **API:** Express; rutas montadas bajo `/api/` (ej. `/api/horarios`, `/api/reportes`).
- **Flujo:** router → controller → service → model; errores con `next(error)` y `AppError`.
- **Validación:** Zod; middleware `validate(schema)` que espera schemas con `body`, `params` y/o `query`.
- **Base de datos:** MySQL con `pool`; errores traducidos con `handleDBError(error, nombreEntidad)`.
- **Modelos:** Objetos exportados con métodos async (ej. `Reporte.getRequeridoVsConsumido`), no clases ORM.
- **Autorización:** `authenticateToken`, `authorize(action, resource)` (Casl); comentarios en español.
- **Permisos:** `defineAbilitiesFor(user)` en `abilities/`; usado por `authorize`.

Los ejemplos de esta guía siguen esta estructura y convenciones.

---

## 1. Routes - ❌ Solo comentario simple
```javascript
import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { validate } from '../validations/middleware.js'
import { getHorarioByIdSchema, createHorarioSchema } from '../validations/index.js'
import { getHorarios, getHorario, createHorario } from '../controllers/horarioController.js'

const router = express.Router()

// Listar horarios
router.get('/',
  authenticateToken,
  authorize('read', 'Horario'),
  getHorarios
)

// Obtener horario por ID
router.get('/:id',
  authenticateToken,
  authorize('read', 'Horario'),
  validate(getHorarioByIdSchema),
  getHorario
)

// Crear horario
router.post('/',
  authenticateToken,
  authorize('create', 'Horario'),
  validate(createHorarioSchema),
  createHorario
)

export default router
```

**Regla:** Una línea describiendo la acción del endpoint (sin método ni ruta, ya están en el código). Rutas usan `authenticateToken`, `authorize` y `validate(schema)` cuando aplica. No todas las rutas llevan `validate`; solo las que reciben body, params o query que deben validarse con Zod.

---

## 2. Controllers - ✅ SIEMPRE JSDoc con método + endpoint
```javascript
import * as reporteService from '../services/reporteService.js'

/**
 * Patrón: router → controller → service → model.
 * El controlador delega en el servicio y pasa errores con next(error).
 * (Opcional: este bloque una sola vez al inicio del archivo o antes del primer handler.)
 */

/**
 * GET /api/reportes/requerido-vs-consumido
 * @returns {object} { data, filtros, total_registros }
 */
export const getRequeridoVsConsumido = async (req, res, next) => {
  try {
    const params = req.query
    const payload = await reporteService.getRequeridoVsConsumido(params, req.user)
    res.status(200).json(payload)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/reportes/stock-vs-requerido
 * @returns {object} { data, filtros, total_registros }
 */
export const getStockVsRequerido = async (req, res, next) => {
  try {
    const params = req.query
    const payload = await reporteService.getStockVsRequerido(params, req.user)
    res.status(200).json(payload)
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/horarios - Crea un horario
 */
export const createHorario = async (req, res, next) => {
  try {
    const payload = await horarioService.create(req.body, req.user)
    res.status(201).json(payload)
  } catch (error) {
    next(error)
  }
}
```

**Formato obligatorio:** `MÉTODO /ruta - Descripción breve`  
**Ruta:** Ruta completa de la API (ej. `/api/users`), tal como la ve el cliente.

**Para endpoints GET:** Incluir `@returns` con la forma de la respuesta (objeto, lista, campos clave). No hace falta detallar cada campo; basta la estructura general para que consumidores y mantenedores sepan qué devuelve el endpoint. Para respuestas triviales (ej. `{ success: true }`) puede omitirse; para listados, detalle por ID o reportes, es recomendable.

**Para POST/PUT:** Opcionalmente documentar `@returns` con la forma del recurso creado o actualizado (ej. `@returns {object} recurso creado`) para mantener consistencia en la documentación de la API.

**Razón:** Documentación de API clara, facilita debugging, consumo desde frontend/otros servicios y generación de docs automáticas.

---

## 3. Middlewares - ✅ SIEMPRE JSDoc completo
```javascript
import jwt from 'jsonwebtoken'
import { AppError } from '../utils/errors.js'
import { defineAbilitiesFor } from '../abilities/defineAbilities.js'

/**
 * Valida que el usuario esté autenticado mediante JWT.
 * Asigna req.user con el payload del token.
 * @throws {AppError} 401 si no hay token o es inválido/expirado
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.get('Authorization')
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return next(new AppError('Token requerido', 401))
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      const message = err.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido'
      return next(new AppError(message, 401))
    }
    req.user = user
    next()
  })
}

/**
 * Verifica que el usuario tenga permiso (action, resource) según Casl.
 * Para Jefe de Laboratorio valida además que laboratorio_id esté en sus laboratorios.
 * @param {string} action - Acción (read, create, update, delete)
 * @param {string} resource - Recurso (Horario, Reporte, Laboratorio, etc.)
 * @returns {Function} Middleware de Express
 */
export const authorize = (action, resource) => {
  return (req, res, next) => {
    try {
      const ability = defineAbilitiesFor(req.user)
      if (!ability.can(action, resource)) {
        return next(new AppError(`No tienes permisos para ${action} ${resource}`, 403))
      }
      // Verificación adicional por laboratorio si aplica...
      next()
    } catch (error) {
      next(error)
    }
  }
}
```

**Elementos requeridos:**
- Descripción clara
- En middlewares que devuelven una función (authorize, validate): `@param` de los argumentos y `@returns {Function}`
- `@throws` para errores que se pasan con next (AppError con código HTTP)
- Comentarios inline para pasos no obvios  
*(Opcional: @param req, res, next en middlewares estándar de Express; su firma es conocida.)*

---

## 4. Services

### Services Simples - ❌ Solo comentario de una línea
```javascript
// Busca laboratorio por ID
export async function getLaboratorioById(id) {
  return Laboratorio.getLaboratorioById(id)
}

// Crea un horario
export async function create(data) {
  return Horario.create(data)
}

// Actualiza horario por ID
export async function updateHorario(id, data) {
  return Horario.update(id, data)
}
```

### Services Complejos - ✅ Comentario multilínea (NO JSDoc formal) o JSDoc con @param/@returns
```javascript
import { Reporte, buildLabFilter } from '../models/Reporte.js'

/**
 * Determina si el usuario tiene restricción por laboratorios (Jefe de Laboratorio con laboratorios asignados).
 */
function tieneRestriccionLaboratorio(user) {
  return user?.rol === 'Jefe de Laboratorio' && user?.laboratorio_ids?.length > 0
}

/**
 * Comparación cantidad requerida vs consumida.
 */
export async function getRequeridoVsConsumido(params, user) {
  const { laboratorio_id, escuela_id, fecha_inicio, fecha_fin } = params
  const labFilter = tieneRestriccionLaboratorio(user)
    ? buildLabFilter(user.laboratorio_ids)
    : ''

  const { data, total_registros } = await Reporte.getRequeridoVsConsumido(
    { fecha_inicio, fecha_fin, laboratorio_id, escuela_id },
    labFilter
  )

  return {
    data,
    filtros: {
      laboratorio_id: laboratorio_id || null,
      escuela_id: escuela_id || null,
      fecha_inicio: fecha_inicio || null,
      fecha_fin: fecha_fin || null
    },
    total_registros
  }
}
```

**Criterio:**
- **CRUD básico** → Comentario de una línea
- **Lógica compleja** → Comentario multilínea explicando flujo y errores; opcionalmente JSDoc con `@param` y `@returns` si ayuda al contrato entre controller y service

No documentar en el service el patrón "router → controller → service → model": ya es implícito por la capa; en el controller sí tiene sentido aclararlo.

---

## 5. Models

En este proyecto los modelos son **objetos exportados** con métodos async que usan `pool` y `handleDBError`; no se usan clases ORM.

### Models Simples - ❌ Solo comentario de una línea
```javascript
import { pool } from '../config/database.js'
import { handleDBError } from '../utils/handleDBError.js'

// Busca laboratorio por ID
export const Laboratorio = {
  getLaboratorioById: async (id) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM laboratorios WHERE id = ?', [id])
      return rows[0] ?? null
    } catch (error) {
      handleDBError(error, 'Laboratorio')
    }
  }
}
```

### Models Complejos - ✅ JSDoc con @param y @returns
```javascript
import { pool } from '../config/database.js'
import { handleDBError } from '../utils/handleDBError.js'

/**
 * Construye el filtro SQL por laboratorios según permisos del usuario.
 * @param {number[]} laboratorioIds - Array de IDs de laboratorio (vacío = sin restricción)
 * @returns {string} Fragmento SQL para añadir a WHERE (incluye " AND ..." o "")
 */
export function buildLabFilter(laboratorioIds) {
  if (!laboratorioIds || laboratorioIds.length === 0) return ''
  return ` AND r.laboratorio_id IN (${laboratorioIds.join(',')})`
}

export const Reporte = {
  /**
   * Comparación cantidad requerida vs consumida por laboratorio/escuela/insumo.
   * @param {object} params - { fecha_inicio, fecha_fin, laboratorio_id, escuela_id }
   * @param {string} labFilter - Fragmento SQL para filtrar por laboratorios (buildLabFilter)
   * @returns {Promise<{ data: object[], total_registros: number }>}
   */
  getRequeridoVsConsumido: async (params, labFilter = '') => {
    const { fecha_inicio, fecha_fin, laboratorio_id, escuela_id } = params
    try {
      const [requeridos] = await pool.execute(queryRequerido, [fecha_inicio, fecha_fin, laboratorio_id, escuela_id])
      // ... lógica de mapeo ...
      return { data, total_registros: data.length }
    } catch (error) {
      handleDBError(error, 'Reporte')
    }
  }
}
```

**Criterio:**
- **Queries simples** → Comentario de una línea
- **Lógica de negocio o métodos con parámetros/retorno no obvios** → JSDoc con `@param`, `@returns` (y `@throws` si aplica)

---

## 6. Utils - ✅ SIEMPRE JSDoc completo
```javascript
import { AppError } from './errors.js'

/**
 * Clase de error con statusCode para respuestas HTTP.
 * Soporta encadenado de errores con options.cause (estándar ES2022/Node 16.9+).
 * @example throw new AppError('Mensaje', 404)
 * @example throw new AppError('Error de base de datos', 500, { cause: errorOriginal })
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message, options.cause != null ? { cause: options.cause } : undefined)
    this.statusCode = statusCode
    this.name = 'AppError'
    if (options.cause != null) this.cause = options.cause
    Error.captureStackTrace?.(this, this.constructor)
  }
}

/**
 * Traduce errores técnicos de MySQL a AppError con mensaje y código HTTP adecuados.
 * @param {Error} error - Error capturado de pool.execute/query
 * @param {string} [entityName='Registro'] - Nombre de la entidad para mensajes (ej: "Usuario", "Laboratorio")
 * @throws {AppError}
 */
export function handleDBError(error, entityName = 'Registro') {
  if (error.code === 'ER_DUP_ENTRY') {
    throw new AppError(`${entityName} duplicado`, 409)
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    throw new AppError(`${entityName} relacionado no existe`, 400)
  }
  // ... más códigos ...
  throw new AppError('Error de base de datos', 500, { cause: error })
}
```

**Elementos requeridos:**
- Descripción clara
- `@param` con tipos y descripción
- `@returns` con tipo y descripción (o `@throws` si solo lanza)
- `@throws` si puede lanzar errores
- `@example` cuando ayude (AppError, formateadores, etc.)

**Razón:** Son funciones reutilizables, autodocumentables y candidatas a testing.

---

## 7. Validation Middlewares - ✅ SIEMPRE JSDoc completo

En este proyecto se usa un **único middleware** `validate(schema)` que valida `req.body`, `req.params` y `req.query` según un schema Zod con forma `{ body?, params?, query? }`. También existen `validateBody`, `validateParams` y `validateQuery` que envuelven schemas parciales.

```javascript
import { z } from 'zod'
import { AppError } from '../utils/errors.js'

/**
 * Middleware de validación genérico para Express.
 * Valida req.body, req.params, req.query según el schema proporcionado (schema con body, params, query).
 * Asigna los datos validados/transformados de vuelta a req.
 * @param {z.ZodSchema} schema - Schema de Zod que puede validar body, params, query
 * @returns {Function} Middleware de Express
 */
export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      const validationResult = await schema.safeParseAsync({
        body: req.body,
        params: req.params,
        query: req.query
      })
      if (!validationResult.success) {
        return next(new AppError('Error en el formato de validación', 400))
      }
      // Actualizar req con datos validados y transformados
      if (validationResult.data.params) Object.assign(req.params, validationResult.data.params)
      if (validationResult.data.body) req.body = validationResult.data.body
      if (validationResult.data.query) Object.assign(req.query, validationResult.data.query)
      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Valida solo el body.
 * @param {z.ZodSchema} schema - Schema para el body
 * @returns {Function} Middleware de Express
 */
export const validateBody = (schema) => validate(z.object({ body: schema }))
```

**Elementos requeridos:**
- Descripción clara del comportamiento (qué partes del request valida)
- `@param` con tipo `z.ZodSchema` (o `import('zod').ZodSchema`)
- `@returns {Function}` indicando que devuelve middleware

---

## 8. Schemas Zod - ✅ Comentario descriptivo (JSDoc de una línea)

En este proyecto los schemas tienen forma `{ body?, params?, query? }` porque el middleware `validate(schema)` espera ese objeto. Se exportan con JSDoc de una o dos líneas indicando propósito y ruta.

```javascript
import { z } from 'zod'

/**
 * Schema para query de reporte requerido vs consumido
 * GET /api/reportes/requerido-vs-consumido
 */
export const getRequeridoVsConsumidoSchema = z.object({
  query: z.object({
    laboratorio_id: z.string().regex(/^\d+$/).transform((val) => parseInt(val, 10)).optional(),
    escuela_id: z.string().regex(/^\d+$/).transform((val) => parseInt(val, 10)).optional(),
    fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  }).refine((data) => !data.fecha_inicio || !data.fecha_fin || new Date(data.fecha_inicio) <= new Date(data.fecha_fin), {
    message: 'La fecha de inicio no puede ser mayor a la fecha de fin',
    path: ['fecha_inicio', 'fecha_fin']
  })
})

/**
 * Schema para crear un horario
 * POST /api/horarios
 */
export const createHorarioSchema = z.object({
  body: z.object({
    laboratorio_id: z.number().int().positive(),
    escuela_id: z.number().int().positive(),
    fecha_inicio: z.string(),
    fecha_fin: z.string()
    // ...
  }),
  params: z.object({}),
  query: z.object({})
})

/**
 * Schema para obtener horario por ID
 * GET /api/horarios/:id
 */
export const getHorarioByIdSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/).transform(Number) }),
  query: z.object({}),
  body: z.object({})
})
```

**Formato:**
- JSDoc de una o dos líneas: propósito + método y ruta (ej. `GET /api/reportes/...`)
- Comentarios inline para campos con reglas o validaciones no obvias
- Si existen schemas comunes en el proyecto (ej. `idParamSchema` para `params.id`), reutilizarlos en los schemas de cada entidad.

---

## Resumen - Tabla de Referencia Rápida

| Capa | Documentación | Formato |
|------|--------------|---------|
| **Routes** | ❌ Comentario simple | `// Obtiene usuarios` |
| **Controllers** | ✅ JSDoc | `GET /api/reportes/... - Descripción`; en GET, añadir `@returns` con forma de la respuesta; en POST/PUT opcional |
| **Middlewares** | ✅ JSDoc completo | `@param`, `@returns`, `@throws` |
| **Services simples** | ❌ Comentario simple | `// Busca por ID` |
| **Services complejos** | ✅ Comentario multilínea | Explica flujo, pasos, errores |
| **Models simples** | ❌ Comentario simple | `// Busca por ID` (objeto con métodos, pool, handleDBError) |
| **Models complejos** | ✅ JSDoc con @param y @returns | Métodos con parámetros/retorno no obvios |
| **Utils** | ✅ JSDoc completo | `@param`, `@returns`, `@example`, `@throws` |
| **Validation Middlewares** | ✅ JSDoc completo | `@param`, `@returns` |
| **Schemas Zod** | ✅ JSDoc de una o dos líneas | Propósito + método y ruta (GET /api/...); inline para reglas no obvias |

---

## Checklist Antes de Documentar

Antes de escribir documentación, pregúntate:

1. ✅ **¿Es un controller?** → Siempre JSDoc con método + ruta; si es GET, añadir `@returns` con la forma de la respuesta
2. ✅ **¿Es un util o middleware de validación?** → Siempre JSDoc completo
3. ✅ **¿Es un middleware general?** → Siempre JSDoc completo
4. ✅ **¿Es CRUD simple en service/model?** → Solo comentario de una línea
5. ✅ **¿Tiene lógica compleja en service/model?** → Comentario multilínea
6. ✅ **¿Es un schema Zod?** → Comentario con propósito + endpoint

---

## Ejemplo Completo de Archivo

Los siguientes ejemplos reflejan la estructura real del proyecto (ESM, `server/`, rutas bajo `/api/`, `next(error)`, `AppError`, Zod con `body/params/query`).

### `server/routes/reporteRoutes.js`
```javascript
import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { validate } from '../validations/middleware.js'
import { getRequeridoVsConsumidoSchema, getStockVsRequeridoSchema } from '../validations/index.js'
import { getRequeridoVsConsumido, getStockVsRequerido } from '../controllers/reporteController.js'

const router = express.Router()

// Comparación de cantidad requerida vs consumida
router.get('/requerido-vs-consumido',
  authenticateToken,
  authorize('read', 'Reporte'),
  validate(getRequeridoVsConsumidoSchema),
  getRequeridoVsConsumido
)

// Comparación de stock actual vs cantidad requerida
router.get('/stock-vs-requerido',
  authenticateToken,
  authorize('read', 'Reporte'),
  validate(getStockVsRequeridoSchema),
  getStockVsRequerido
)

export default router
```

### `server/controllers/reporteController.js`
```javascript
import * as reporteService from '../services/reporteService.js'

/**
 * Patrón: router → controller → service → model.
 * El controlador delega en el servicio y pasa errores con next(error).
 * (Opcional: este bloque una sola vez al inicio del archivo o antes del primer handler.)
 */

/**
 * GET /api/reportes/requerido-vs-consumido
 * @returns {object} { data, filtros, total_registros }
 */
export const getRequeridoVsConsumido = async (req, res, next) => {
  try {
    const params = req.query
    const payload = await reporteService.getRequeridoVsConsumido(params, req.user)
    res.status(200).json(payload)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/reportes/stock-vs-requerido
 * @returns {object} { data, filtros, total_registros }
 */
export const getStockVsRequerido = async (req, res, next) => {
  try {
    const params = req.query
    const payload = await reporteService.getStockVsRequerido(params, req.user)
    res.status(200).json(payload)
  } catch (error) {
    next(error)
  }
}
```

### `server/services/reporteService.js`
```javascript
import { Reporte, buildLabFilter } from '../models/Reporte.js'

/**
 * Determina si el usuario tiene restricción por laboratorios (Jefe de Laboratorio con laboratorios asignados).
 */
function tieneRestriccionLaboratorio(user) {
  return user?.rol === 'Jefe de Laboratorio' && user?.laboratorio_ids?.length > 0
}

/**
 * Comparación cantidad requerida vs consumida.
 */
export async function getRequeridoVsConsumido(params, user) {
  const labFilter = tieneRestriccionLaboratorio(user)
    ? buildLabFilter(user.laboratorio_ids)
    : ''
  const { data, total_registros } = await Reporte.getRequeridoVsConsumido(params, labFilter)
  return { data, filtros: { ... }, total_registros }
}
```

### `server/validations/schemas/reporte.js`
```javascript
import { z } from 'zod'

/**
 * Schema para query de reporte requerido vs consumido
 * GET /api/reportes/requerido-vs-consumido
 */
export const getRequeridoVsConsumidoSchema = z.object({
  query: z.object({
    laboratorio_id: z.string().regex(/^\d+$/).transform((val) => parseInt(val, 10)).optional(),
    escuela_id: z.string().regex(/^\d+$/).transform((val) => parseInt(val, 10)).optional(),
    fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  }).refine(...)
})
```

### `server/utils/errors.js`
```javascript
/**
 * Clase de error con statusCode para respuestas HTTP.
 * Soporta encadenado de errores con options.cause (estándar ES2022/Node 16.9+).
 * @example throw new AppError('Mensaje', 404)
 * @example throw new AppError('Error de base de datos', 500, { cause: errorOriginal })
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) { ... }
}
```

---

Esta guía garantiza documentación **consistente, útil y mantenible** en todo el proyecto, alineada con la estructura real del servidor (ESM, Express, Zod, pool MySQL, AppError, Casl).