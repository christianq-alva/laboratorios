# Arquitectura Backend - Guía de Implementación

Esta guía está adaptada al sistema actual de gestión de laboratorios: estructura en `server/`, ES modules (`import`/`export`), modelos como objetos (`Horario`, `Equipo`, `Inventario`), validación con Zod en rutas y respuestas con `{ success, message, data }`.

---

## Stack y Flujo

- **Backend:** router → controller → service (cuando aplica) → model
- **Validación:** middleware `validate(schema)` desde `server/validations/` (Zod) en tipos, required, longitud
- **Errores:** errores de negocio con `statusCode` en el objeto Error (o clase `AppError` opcional); middleware central al final de `server/index.js`
- **Logging:** opcional con Pino clasificado por código HTTP; si no se usa, el middleware puede usar `console.error` para 5xx

---

## Responsabilidades por Capa

### 1. Model

- **Solo** queries y acceso a la base de datos
- Usa `pool` (o `connection` cuando recibe transacción) desde `server/config/database.js`
- Opcional: usar `handleDBError` para traducir errores de MySQL a un Error con `statusCode`
- Puede manejar reglas simples si el módulo es simple (p. ej. filtrado por rol en la misma query)
- **No** contiene lógica de negocio compleja (cruces de horario, “no eliminar si tiene reservas”, etc.)

**Ejemplo (sistema actual – modelos como objeto):**

```javascript
// server/models/Horario.js
import { pool } from '../config/database.js'
// import { handleDBError } from '../utils/handleDBError.js'  // opcional

export const Horario = {
  getCruceLab: async (laboratorio_id, reserva_id, fechaInicio, fechaFin) => {
    const [result] = await pool.execute(
      `SELECT r.id, r.fecha_inicio, r.fecha_fin, l.nombre as laboratorio, ...
       WHERE r.laboratorio_id = ? AND r.id != COALESCE(?, 0) AND (...)`,
      [laboratorio_id, reserva_id, fechaInicio, fechaInicio, fechaFin, fechaFin, fechaInicio, fechaFin]
    )
    return result
  },

  createHorario: async (laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color, connection) => {
    const conn = connection || pool
    const [res] = await conn.execute(
      `INSERT INTO reservas (laboratorio_id, docente_id, escuela_id, ...) VALUES (?, ?, ?, ...)`,
      [laboratorio_id, docente_id, escuela_id, ...]
    )
    return res.insertId
  },
  createHorarioInsumos: async (reserva_id, insumos, connection) => { /* ... */ },
  createHorarioEquipos: async (reserva_id, equipos, connection) => { /* ... */ }
}
```

**El model no debe** iniciar transacciones ni orquestar validaciones de negocio; el Service obtiene la conexión, inicia la transacción y llama a `createHorario`, `createHorarioInsumos`, `createHorarioEquipos` por separado.

---

### 2. Service

- Orquesta varios modelos y aplica **reglas de negocio complejas**
- Recibe `connection` desde el Controller cuando hay transacción; no crea ni libera la conexión
- Lanza `Error` con propiedad `statusCode` (404, 400, 409, 403) para que el Controller responda con el código correcto
- No necesita try/catch solo para re-lanzar; el Controller captura y traduce a HTTP

**Cuándo usar Service en este sistema:**

- Operación involucra 2+ modelos (p. ej. Horario + Escuela + Ciclo + Docente en `createHorario`)
- Requiere transacciones (crear reserva + detalles, eliminar equipo + actividad)
- Reglas de negocio: cruces de horario, fechas de mantenimiento, “no eliminar si tiene reservas”, saldo insuficiente en lote

**Ejemplo (sistema actual):**

```javascript
// server/services/horarioService.js
import { Horario } from '../models/Horario.js'
import { Escuela } from '../models/Escuela.js'
import { Ciclo } from '../models/Ciclo.js'
import { Docente } from '../models/Docente.js'
import { convertirFechaParaMySQL } from '../utils/utils.js'

function throwError(message, statusCode = 400) {
  const err = new Error(message)
  err.statusCode = statusCode
  throw err
}

export const horarioService = {
  async crearReserva(datos, insumos, equipos, userId, ip) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const escuelaInfo = await Escuela.getById(datos.escuela_id)
      if (!escuelaInfo) throwError('La escuela seleccionada no existe', 404)
      const cicloInfo = await Ciclo.getById(datos.ciclo_id)
      if (!cicloInfo) throwError('El ciclo seleccionado no existe', 404)
      const docenteInfo = await Docente.getById(datos.docente_id)
      if (!docenteInfo) throwError('Docente no encontrado', 404)

      const cruce = await verificarCruceHorarios(datos.laboratorio_id, datos.docente_id, datos.fecha_inicio, datos.fecha_fin, null)
      if (cruce) throwError(`Conflicto de horario: ${cruce.mensaje}`, 409)

      const fechaInicioMySQL = convertirFechaParaMySQL(datos.fecha_inicio)
      const fechaFinMySQL = convertirFechaParaMySQL(datos.fecha_fin)
      const reserva_id = await Horario.createHorario(datos.laboratorio_id, datos.docente_id, datos.escuela_id, datos.ciclo_id, datos.descripcion, fechaInicioMySQL, fechaFinMySQL, datos.cantidad_alumnos, datos.color, connection)
      if (insumos?.length > 0) await Horario.createHorarioInsumos(reserva_id, insumos, connection)
      if (equipos?.length > 0) await Horario.createHorarioEquipos(reserva_id, equipos, connection)
      await connection.commit()
      return reserva_id
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  validarRangoFechas(fecha_inicio, fecha_fin) {
    if (!fecha_inicio || !fecha_fin) return
    const start = new Date(fecha_inicio)
    const end = new Date(fecha_fin)
    const diffDays = Math.floor((end - start) / (1000 * 3600 * 24))
    if (diffDays > 60) throwError('El rango máximo permitido es de 60 días', 400)
    if (diffDays < 0) throwError('La fecha de inicio debe ser anterior a la fecha de fin', 400)
  }
}
```

---

### 3. Controller

- Extrae datos de `req.body`, `req.query`, `req.params` y de `req.user` (auth)
- Llama al Service (o al Model en módulos simples) con esos datos
- Obtiene y libera `connection` cuando hay transacción (`pool.getConnection()`, `beginTransaction()`, `commit()`/`rollback()`, `connection.release()`)
- Captura errores y responde con `res.status(error.statusCode || 500).json({ success: false, message: error.message })`
- **No** contiene lógica de negocio (validaciones de existencia, cruces, reglas “no eliminar si…”)

**Ejemplo (sistema actual):**

```javascript
// server/controllers/horarioController.js
import { pool } from '../config/database.js'
import { Horario } from '../models/Horario.js'
import { horarioService } from '../services/horarioService.js'

export const getHorarios = async (req, res) => {
  try {
    const { laboratorio_id, escuela_id, docente_id, ciclo_id, fecha_inicio, fecha_fin, estado } = req.query
    const filters = {
      laboratorio_id: laboratorio_id ? parseInt(laboratorio_id) : undefined,
      escuela_id: escuela_id ? parseInt(escuela_id) : undefined,
      docente_id: docente_id ? parseInt(docente_id) : undefined,
      ciclo_id: ciclo_id ? parseInt(ciclo_id) : undefined,
      fecha_inicio, fecha_fin, estado
    }
    horarioService.validarRangoFechas(fecha_inicio, fecha_fin)
    const horarios = await Horario.getAllHorarios(req.user.rol, req.user.laboratorio_ids, filters)
    res.status(200).json({ success: true, data: horarios })
  } catch (error) {
    const code = error.statusCode || 500
    res.status(code).json({ success: false, message: error.message })
  }
}

export const createHorario = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const { laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fecha_inicio, fecha_fin, cantidad_alumnos, color = '#4ecdc4', insumos = [], equipos = [] } = req.body
    const reserva_id = await horarioService.crearReserva(
      { laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fecha_inicio, fecha_fin, cantidad_alumnos, color },
      insumos, equipos, connection
    )
    await connection.commit()
    res.status(201).json({ success: true, data: { reserva_id }, message: 'Horario creado correctamente' })
  } catch (error) {
    await connection.rollback()
    const code = error.statusCode || 500
    res.status(code).json({ success: false, message: error.message })
  } finally {
    connection.release()
  }
}
```

---

### 4. Middleware de Errores (añadir al final de `server/index.js`)

En el sistema actual no hay un middleware global de errores. Se puede añadir uno **antes** de `app.listen()` para centralizar la respuesta y el logging. Los controllers que usen `next(error)` delegarán aquí; los que hagan `res.status().json()` en el catch siguen funcionando. Para unificar, se puede pasar a usar `next(error)` en todos los controllers y este middleware responderá.

**Ejemplo de middleware (ES modules, sistema actual):**

```javascript
// server/index.js - añadir ANTES de app.listen(), DESPUÉS de todas las rutas

// Middleware de errores (cuando los controllers usen next(error))
app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500

  if (statusCode >= 500) {
    console.error('❌ Error del servidor:', error.message, error.stack)
  } else if (statusCode === 401 || statusCode === 403) {
    console.warn('⚠️ Acceso denegado:', statusCode, req.method, req.originalUrl, error.message)
  }

  res.status(statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: error.stack })
  })
})

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`)
  // ...
})
```

Si más adelante se añade Pino, se reemplaza `console.error`/`console.warn` por `logger.fatal`/`logger.warn` según el código HTTP.

---

## Sistema de Logging (opcional)

### Configuración de Pino (ES modules)

```javascript
// server/utils/logger.js
import pino from 'pino'

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
})

export default logger
```

### Instalación

```bash
npm install pino pino-pretty
```

### Uso en middleware de errores

```javascript
// server/index.js
import logger from './utils/logger.js'

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500
  const context = { message: error.message, statusCode, method: req.method, url: req.originalUrl, ip: req.ip }

  if (statusCode >= 500) logger.fatal(context, 'Error del servidor')
  else if (statusCode === 401 || statusCode === 403) logger.warn(context, 'Acceso denegado')
  else if (statusCode >= 400) logger.info(context, 'Error del cliente')

  res.status(statusCode).json({ success: false, message: error.message })
})
```

### Variables de entorno (sistema actual)

El proyecto ya usa variables como en `server/config/database.js` y `ENVIRONMENT_VARIABLES.md`. Para logging opcional:

```properties
# .env (complementar las existentes)
PORT=3000
NODE_ENV=development
TZ=America/Lima

# Base de datos (ya existentes)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=laboratorios

# JWT (ya existente)
JWT_SECRET=...

# Logging (opcional)
LOG_LEVEL=warn
```

### Estrategia de logging por código HTTP

| Código HTTP | Nivel      | Significado           | Acción                |
|-------------|------------|------------------------|------------------------|
| **500-599** | `fatal`    | Error del servidor     | Revisar inmediatamente |
| **401, 403**| `warn`     | Acceso no autorizado   | Monitorear seguridad   |
| **400-499** | `info`     | Error del cliente      | Solo registro          |

No es necesario loguear cada operación exitosa en una aplicación pequeña.

---

## Clases / utilidades de error

### Opción A: Error con `statusCode` (sin nueva clase)

Ya usado en la guía de migración: el Service hace `const err = new Error(message); err.statusCode = statusCode; throw err`. El Controller (o middleware) usa `error.statusCode || 500`.

### Opción B: Clase AppError (opcional)

```javascript
// server/utils/errors.js
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
  }
}
```

Uso en Service: `throw new AppError('Horario no encontrado', 404)`.

### handleDBError (opcional, para usar en Model)

```javascript
// server/utils/handleDBError.js
import { AppError } from './errors.js'

export function handleDBError(error, entityName = 'Registro') {
  if (error.code === 'ER_DUP_ENTRY') {
    throw new AppError(`${entityName} duplicado`, 409)
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    throw new AppError(`${entityName} relacionado no existe`, 400)
  }
  if (error.code === 'ER_BAD_NULL_ERROR') {
    throw new AppError('Faltan campos obligatorios', 400)
  }
  if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
    throw new AppError('Error de conexión a base de datos', 500)
  }
  throw new AppError('Error de base de datos', 500)
}
```

En el Model, dentro del `catch`: `throw handleDBError(error, 'Horario')`.

---

## Decisión: ¿Controller → Model o Controller → Service → Model?

### Ir directo a Model cuando (sistema actual)

- CRUD simple sin reglas de negocio que involucren varios modelos
- Un solo modelo involucrado y sin transacciones
- **Ejemplos en este sistema:** listar ciclos, roles, unidades, tipos de equipo; obtener laboratorio por ID; listar docentes; CRUD de escuela (salvo la validación de “no eliminar si tiene docentes”, que puede seguir en controller o moverse a un service ligero)

### Usar Service cuando

- Múltiples modelos (Horario + Escuela + Ciclo + Docente; Inventario + Laboratorio + movimientos)
- Transacciones (crear reserva + detalles; eliminar equipo + actividad)
- Reglas de negocio: cruces de horario, fechas de mantenimiento, “no eliminar si tiene reservas”, saldo insuficiente en lote, permisos por laboratorio en incidencias
- **Ejemplos en este sistema:** Horarios (`horarioService`), Equipos (`equipoService`), Inventario (`inventarioService`), Insumos (eliminación con relaciones), Incidencias (`incidenciaService` para permisos), Laboratorio (`laboratorioService` — módulo complejo con CRUD, cambio de estado, insumos y configurarInsumos)

---

## Flujo visual

```
[Request]
   ↓
[Middleware auth] → authenticateToken, authorize('read'|'create'|...)
   ↓
[Middleware validate(schema)] → Zod en body/params/query (server/validations/)
   ↓
[Controller] → try/catch, extrae req.body/query/params/user, llama Service o Model
   ↓
[Service] (si aplica) → reglas de negocio, varios modelos, lanza Error con statusCode
   ↓
[Model] → queries con pool/connection, opcional handleDBError
   ↓
[Database]
   ↓
[Controller] → res.status(200|201).json({ success: true, data })
   ↓
[Si error] → catch: res.status(error.statusCode || 500).json({ success: false, message })
   (o next(error) si se usa middleware de errores global)
```

---

## Uso en Services (sistema actual)

Los services no necesitan logging manual si existe el middleware de errores: este loguea según el código HTTP. El service solo lanza errores con `statusCode`.

```javascript
// server/services/equipoService.js
function throwError(message, statusCode = 400) {
  const err = new Error(message)
  err.statusCode = statusCode
  throw err
}

export const equipoService = {
  async validarFechasMantenimiento(fecha_ultimo, fecha_proximo) {
    if (!fecha_ultimo || !fecha_proximo) return
    if (new Date(fecha_proximo) < new Date(fecha_ultimo)) {
      throwError('La fecha del próximo mantenimiento no puede ser anterior a la fecha del último mantenimiento', 400)
    }
  },

  async crearEquipo(datos, usuario_id, ip_address, connection) {
    const existingCodigo = await Equipo.existsByCodigo(datos.codigo)
    if (existingCodigo) throwError('Ya existe otro equipo con ese código', 400)
    const equipo_id = await Equipo.create(datos, connection)
    await Equipo.registrarActividadEquipo({ accion: 'crear', equipo_id, descripcion: '...', usuario_id, ip_address }, connection)
    return equipo_id
  }
}
```

---

## Reglas de oro

1. **Validación de estructura** → Middleware `validate(schema)` en rutas (`server/validations/`, Zod)
2. **Reglas de negocio** → Service (nunca Controller)
3. **Errores de DB** → Opcional: `handleDBError` en Model
4. **Transacciones** → Controller obtiene/libera `connection`; Service recibe `connection` y ejecuta las operaciones
5. **Respuestas HTTP** → Controller (o middleware de errores si se usa `next(error)`)
6. **Logging** → Opcional: middleware de errores con Pino según código HTTP
7. **DRY** → Centralizar manejo de errores en middleware y convención `error.statusCode`

---

## Estructura de archivos (sistema actual)

```
server/
├── config/
│   └── database.js           # pool MySQL (mysql2/promise)
├── utils/
│   ├── utils.js              # convertirFechaParaMySQL, etc.
│   ├── errors.js             # (opcional) Clase AppError
│   ├── handleDBError.js       # (opcional) Traducción errores MySQL
│   └── logger.js              # (opcional) Pino
├── models/                    # Solo queries + opcional handleDBError
│   ├── Horario.js
│   ├── Equipo.js
│   ├── Inventario.js
│   ├── Laboratorio.js
│   ├── Escuela.js
│   ├── Ciclo.js
│   ├── Docente.js
│   └── ...
├── services/                  # Reglas de negocio (Horarios, Equipos, Inventario, etc.)
│   ├── horarioService.js
│   ├── equipoService.js
│   └── inventarioService.js
├── controllers/               # try/catch, llamada a Service o Model, res.json
│   ├── horarioController.js
│   ├── equipoController.js
│   └── ...
├── routes/                    # Rutas + authenticateToken, authorize, validate(schema)
│   ├── horarioRoutes.js
│   ├── equipoRoutes.js
│   └── ...
├── validations/               # Zod schemas y middleware validate
│   ├── index.js
│   ├── middleware.js
│   └── schemas/
│       ├── horario.js
│       ├── equipo.js
│       └── ...
├── middleware/
│   ├── auth.js
│   ├── authorize.js
│   └── rateLimiter.js
└── index.js                   # app, rutas /api/*, middleware de errores, listen
```

Rutas API actuales: `/api/auth`, `/api/horarios`, `/api/equipos`, `/api/inventario`, `/api/insumos`, `/api/incidencias`, `/api/laboratorios`, `/api/docentes`, `/api/escuelas`, `/api/ciclos`, `/api/usuarios`, `/api/roles`, `/api/unidades`, `/api/tipos-equipo`, `/api/share`, `/api/reportes`, `/api/dashboard`.

---

**Aplica esta arquitectura de forma consistente. El middleware de errores central (y opcionalmente Pino) evita repetir manejo de errores y logging en cada controller.**
