# Guía de Migración: Router-Controller-Model → Router-Controller-Service-Model

Esta guía está adaptada al sistema actual de gestión de laboratorios: estructura en `server/`, ES modules (`import`/`export`), modelos como objetos (p. ej. `Horario`, `Equipo`, `Inventario`) y respuestas con `res.status().json({ success, message, data })`.

---

## Reglas de la arquitectura

1. **Validación de estructura** → Middleware `validate(schema)` en rutas (`server/validations/`, Zod). Tipos, required, longitudes; no reglas de negocio.
2. **Reglas de negocio** → Service (nunca en el Controller).
3. **Transacciones** → Service. El Service obtiene la conexión, hace `beginTransaction()`, `commit()`/`rollback()` y `release()`; el Controller solo llama al Service y no maneja la conexión.
4. **Respuestas HTTP** → Controller. Solo el Controller usa `res.status().json()`; el Service devuelve datos o lanza errores con `statusCode`.

---

## Cuándo crear un Service

### Módulos SIMPLES (NO necesitan Service)
- **Ir directo:** Router → Controller → Model
- **Características:**
  - CRUD básico sin validaciones complejas
  - Un solo modelo involucrado
  - Sin transacciones
  - Sin reglas de negocio que orquesten varios modelos

**En este sistema:** Ciclo, Rol, Escuela, Docente, Unidad, TipoEquipo, Laboratorio (CRUD y configuración de insumos), Usuario (CRUD);

### Módulos COMPLEJOS (SÍ necesitan Service)
- **Flujo:** Router → Controller → Service → Model
- **Características:**
  - Involucra 2+ modelos (p. ej. Horario + Escuela + Ciclo + Docente)
  - Requiere transacciones (crear reserva + detalles, eliminar equipo + actividad)
  - Validaciones de negocio complejas (cruces de horario, fechas de mantenimiento, saldo por lote)
  - Coordinación entre múltiples operaciones

**En este sistema:** Horarios, Equipos, Inventario (movimientos de insumos), Insumos (catálogo + eliminación con relaciones), Incidencias (permisos por reserva/laboratorio), Auth y Share.

---

## Paso 1: Identificar qué migrar

### Revisar cada módulo y preguntarse:

1. ¿Involucra más de un modelo? (p. ej. `horarioController` usa `Horario`, `Escuela`, `Ciclo`, `Docente`, `Inventario`)
2. ¿Necesita transacciones? (`pool.getConnection()`, `beginTransaction()`, `commit()`/`rollback()`)
3. ¿Tiene reglas de negocio complejas? (cruces, “no eliminar si tiene reservas”, saldo insuficiente en lote)
4. ¿Requiere coordinación entre operaciones? (crear reserva + insumos + equipos, cerrar horario + movimiento de salida)

**Si respondiste SÍ a cualquiera → Crear Service**

---

## Paso 2: Crear el Service

### Estructura base del Service (sistema actual)

Los modelos del proyecto son **objetos** con métodos (no clases). El Service puede ser un objeto con funciones exportadas o una “clase” de métodos estáticos; aquí se usa objeto para mantener el mismo estilo.

```javascript
// server/services/horarioService.js
import { pool } from '../config/database.js'
import { Horario } from '../models/Horario.js'
import { Escuela } from '../models/Escuela.js'
import { Ciclo } from '../models/Ciclo.js'
import { Docente } from '../models/Docente.js'
import { convertirFechaParaMySQL } from '../utils/utils.js'

/**
 * Lanza error con { statusCode, message } para que el controller
 * haga res.status(err.statusCode).json({ success: false, message: err.message })
 */
function throwError(message, statusCode = 400) {
  const err = new Error(message)
  err.statusCode = statusCode
  throw err
}

export const horarioService = {
  // Métodos aquí: verificarCruceHorarios, crearReserva, etc.
}
```

---

## Paso 3: Mover lógica de negocio del Controller al Service

### Ejemplo real: Crear horario (createHorario)

**ANTES (patrón legacy ya eliminado):**
- El controller o el model podían iniciar transacción y llamar a métodos que a su vez hacían `beginTransaction()` (transacción anidada).
- Se eliminaron los métodos legacy `Horario.registroCreateHorario` y `Horario.registroUpdateHorario` que recibían conexión y volvían a iniciar transacción.

**DESPUÉS**

**Service (`server/services/horarioService.js`):** Las transacciones se gestionan dentro del Service (obtener conexión, begin, commit/rollback, release).

```javascript
import { pool } from '../config/database.js'
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

async function verificarCruceHorarios(laboratorio_id, docente_id, fecha_inicio, fecha_fin, reserva_id = null) {
  const fechaInicioMySQL = convertirFechaParaMySQL(fecha_inicio)
  const fechaFinMySQL = convertirFechaParaMySQL(fecha_fin)
  const cruceLabRows = await Horario.getCruceLab(laboratorio_id, reserva_id, fechaInicioMySQL, fechaFinMySQL)
  if (cruceLabRows.length > 0) {
    const cruce = cruceLabRows[0]
    return { tipo: 'laboratorio', mensaje: `El laboratorio ${cruce.laboratorio} (${cruce.laboratorio_ubicacion}) ya está ocupado`, conflicto: cruce }
  }
  const cruceDocenteRows = await Horario.getCruceDocente(docente_id, reserva_id, fechaInicioMySQL, fechaFinMySQL)
  if (cruceDocenteRows.length > 0) {
    const cruce = cruceDocenteRows[0]
    return { tipo: 'docente', mensaje: `El docente ${cruce.docente} ya tiene una clase programada`, conflicto: cruce }
  }
  return null
}

export const horarioService = {
  async crearReserva(datos, insumos, equipos) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const { laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fecha_inicio, fecha_fin, cantidad_alumnos, color } = datos
      const escuelaInfo = await Escuela.getById(escuela_id)
      if (!escuelaInfo) throwError('La escuela seleccionada no existe', 404)
      const cicloInfo = await Ciclo.getById(ciclo_id)
      if (!cicloInfo) throwError('El ciclo seleccionado no existe', 404)
      const docenteInfo = await Docente.getById(docente_id)
      if (!docenteInfo) throwError('Docente no encontrado', 404)
      const cruce = await verificarCruceHorarios(laboratorio_id, docente_id, fecha_inicio, fecha_fin)
      if (cruce) throwError(`Conflicto de horario: ${cruce.mensaje}`, 409)
      const fechaInicioMySQL = convertirFechaParaMySQL(fecha_inicio)
      const fechaFinMySQL = convertirFechaParaMySQL(fecha_fin)
      const reserva_id = await Horario.createHorario(laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color, connection)
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
    const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 3600 * 24))
    if (diffDays > 60) throwError('El rango máximo permitido es de 60 días', 400)
    if (diffDays < 0) throwError('La fecha de inicio debe ser anterior a la fecha de fin', 400)
  }
}
```

**Controller (`server/controllers/horarioController.js`):** Solo extrae datos, llama al Service y envía la **respuesta HTTP**. No maneja conexión ni transacciones.

```javascript
import { Horario } from '../models/Horario.js'
import { horarioService } from '../services/horarioService.js'

export const getHorarios = async (req, res) => {
  try {
    const { laboratorio_id, escuela_id, docente_id, ciclo_id, fecha_inicio, fecha_fin, estado } = req.query
    const filters = { laboratorio_id: laboratorio_id ? parseInt(laboratorio_id) : undefined, /* ... */ }
    horarioService.validarRangoFechas(fecha_inicio, fecha_fin)
    const horarios = await Horario.getAllHorarios(req.user.rol, req.user.laboratorio_ids, filters)
    res.status(200).json({ success: true, data: horarios })
  } catch (error) {
    const code = error.statusCode || 500
    res.status(code).json({ success: false, message: error.message })
  }
}

export const createHorario = async (req, res) => {
  try {
    const { laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fecha_inicio, fecha_fin, cantidad_alumnos, color = '#4ecdc4', insumos = [], equipos = [] } = req.body
    const reserva_id = await horarioService.crearReserva(
      { laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fecha_inicio, fecha_fin, cantidad_alumnos, color },
      insumos, equipos
    )
    res.status(201).json({ success: true, data: { reserva_id }, message: 'Horario creado correctamente' })
  } catch (error) {
    const code = error.statusCode || 500
    res.status(code).json({ success: false, message: error.message })
  }
}
```

La ruta debe usar `validate(createHorarioSchema)` para validación de estructura (Zod). La convención de errores: el Service lanza `Error` con `statusCode`; el Controller solo responde con `res.status(code).json({ success: false, message: error.message })`.

---

## Paso 4: Implementar transacciones en Service (si aplica)

**Regla: Transacciones → Service.** El Service obtiene la conexión (`pool.getConnection()`), hace `beginTransaction()`, ejecuta las operaciones, `commit()` o `rollback()`, y `connection.release()` en un `try/catch/finally`. El Controller no maneja la conexión; solo llama al Service y envía la **respuesta HTTP**.

### Ejemplo: Crear / eliminar equipo (transacción dentro del Service)

**Service (`server/services/equipoService.js`):**

```javascript
import { pool } from '../config/database.js'
import { Equipo } from '../models/Equipo.js'

function throwError(message, statusCode = 400) {
  const err = new Error(message)
  err.statusCode = statusCode
  throw err
}

export const equipoService = {
  validarFechasMantenimiento(fecha_ultimo_mantenimiento, fecha_proximo_mantenimiento) {
    if (!fecha_ultimo_mantenimiento || !fecha_proximo_mantenimiento) return
    const fechaProximo = new Date(fecha_proximo_mantenimiento)
    const fechaUltimo = new Date(fecha_ultimo_mantenimiento)
    if (fechaProximo < fechaUltimo) {
      throwError('La fecha del próximo mantenimiento no puede ser anterior a la fecha del último mantenimiento', 400)
    }
  },

  async crearEquipo(datos, usuario_id, ip_address) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const existingCodigo = await Equipo.existsByCodigo(datos.codigo)
      if (existingCodigo) throwError('Ya existe otro equipo con ese código', 400)
      const equipo_id = await Equipo.create(datos, connection)
      await Equipo.registrarActividadEquipo({
        accion: 'crear',
        equipo_id,
        descripcion: `Equipo creado: ${datos.nombre} (${datos.codigo})...`,
        usuario_id,
        ip_address
      }, connection)
      await connection.commit()
      return equipo_id
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  async eliminarEquipo(equipoId) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const existingEquipo = await Equipo.existsById(equipoId)
      if (!existingEquipo) throwError('Equipo no encontrado', 404)
      const tieneReservas = await Equipo.tieneReservasActivas(equipoId)
      if (tieneReservas) throwError('No se puede eliminar. El equipo está siendo usado en el sistema.', 400)
      await Equipo.delete(equipoId, connection)
      // Registrar actividad si aplica
      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}
```

El Controller solo llama a `equipoService.crearEquipo(datos, req.user.userId, req.ip)` (sin pasar `connection`) y responde con `res.status(201).json(...)` o `res.status(error.statusCode).json({ success: false, message: error.message })`.

---

## Paso 5: Patrones comunes por módulo (sistema actual)

### Horarios
**Operaciones que conviene llevar al Service:**
- Validar rango de fechas (60 días) → `horarioService.validarRangoFechas(fecha_inicio, fecha_fin)`
- Verificar cruces (laboratorio y docente) → `verificarCruceHorarios(...)` dentro del service
- Crear reserva (validar escuela, ciclo, docente, cruces; transacción dentro del Service) → `horarioService.crearReserva(datos, insumos, equipos)`
- Actualizar reserva (mismas validaciones excluyendo `horario_id`; transacción en Service) → `horarioService.actualizarReserva(horarioId, datos, insumos, equipos)`
- Eliminar (solo si no está cerrado; transacción en Service) → `horarioService.eliminarReserva(horarioId)`
- Cerrar horario / cerrar con insumos (validar no cerrado; registrar movimiento si aplica; transacción en Service) → `horarioService.cerrarHorario(...)` / `horarioService.cerrarHorarioConInsumos(...)`

### Equipos
**Operaciones que conviene llevar al Service:**
- Validar fechas de mantenimiento (próximo ≥ último) → `equipoService.validarFechasMantenimiento(...)`
- Crear equipo (código único, fechas, transacción en Service) → `equipoService.crearEquipo(datos, usuario_id, ip_address)`
- Actualizar equipo (código único, fechas, no cambiar laboratorio si tiene reservas) → `equipoService.actualizarEquipo(equipoId, datos, usuario_id, ip_address)`
- Eliminar (no si tiene reservas activas; transacción en Service) → `equipoService.eliminarEquipo(equipoId)`
- Importación masiva Excel (validar filas, laboratorio, tipo_equipo; transacción y commit parcial en Service) → `equipoService.importarMasivo(rows, laboratorio_id, usuario_id)`

### Inventario (movimientos de insumos)
**Operaciones que conviene llevar al Service:**
- Registrar movimiento manual (entrada/salida; validar insumos por laboratorio; salida con `entrada_detalle_id` y saldo suficiente; transacción en Service) → `inventarioService.registrarMovimientoManual(userId, fecha_movimiento, laboratorio_id, tipo_movimiento, observaciones, reserva_id, detalles)`. El modelo expone `Inventario.registrarMovimiento(connection, ...)` (usado también por reabastecimiento masivo).
- Reabastecimiento masivo (validar códigos y laboratorio; procesar filas; transacción en Service) → `inventarioService.ejecutarReabastecimientoMasivo(userId, fecha_movimiento, laboratorio_id, motivo_general, datos_reabastecimiento)`. Usa `Inventario.registrarMovimiento(connection, ...)`.
- Eliminar movimiento (revertir saldos si es salida; transacción en Service) → `inventarioService.eliminarMovimientoInventario(movimiento_id)`; modelo `Inventario.eliminarMovimientoInventario(connection, movimiento_id)`.

### Insumos (catálogo)
**Operaciones que conviene llevar al Service:**
- Eliminar insumo (no si tiene movimientos o está en `inventario_insumos`) → `insumoService.puedeEliminar(insumo_id)` o `insumoService.eliminarInsumo(insumo_id)` que internamente valida y lanza si no puede.

### Incidencias
**Operaciones que conviene llevar al Service:**
- Crear incidencia: validar permiso con `Incidencia.canCreateForReserva(reserva_id, user)` y luego `Incidencia.create(...)` → puede quedar en Controller o moverse a `incidenciaService.crearIncidencia(reserva_id, titulo, descripcion, user)`.
- Eliminar: una sola lectura con `Incidencia.getById(incidenciaId, user)`; si devuelve null (no existe o sin permiso) → 404; luego `Incidencia.delete(incidenciaId)` → `incidenciaService.eliminarIncidencia(incidenciaId, user)`.

---

## Paso 6: Migración paso a paso de un módulo

### 1. Crear el archivo Service
```bash
touch server/services/horarioService.js
```

### 2. Copiar estructura base (ES modules, rutas del proyecto)
```javascript
// server/services/horarioService.js
import { Horario } from '../models/Horario.js'
// importar otros modelos que use este módulo

function throwError(message, statusCode = 400) {
  const err = new Error(message)
  err.statusCode = statusCode
  throw err
}

export const horarioService = {
  // Métodos aquí
}
```

### 3. Identificar lógica en Controller
- Validación de estructura ya va en rutas con `validate(schema)` (Zod en `server/validations/`); no mover eso al Service.
- Validaciones de negocio: `if (!x) return res.status(404).json(...)`, rango 60 días, fechas de mantenimiento, código duplicado, “no eliminar si cerrado”, “no cambiar lab si tiene reservas” → mover al Service.
- Operaciones que usan más de un modelo o transacciones: Escuela, Ciclo, Docente, Horario en `createHorario` → Service con transacción interna.

### 4. Mover lógica al Service
- Extraer funciones que reciban **datos** (no `req`/`res`). Si hay transacción, el Service obtiene la conexión con `pool.getConnection()` y gestiona begin/commit/rollback/release.
- En caso de error de negocio: `throwError('mensaje', 400)` (o 404, 409, 403 según corresponda).
- Devolver el resultado (id, objeto) para que el Controller envíe la respuesta HTTP.

### 5. Simplificar Controller
- Extraer de `req.body`/`req.query`/`req.params` los datos necesarios.
- Llamar al Service con esos datos (el Service gestiona la transacción internamente si aplica).
- **Solo el Controller** envía respuestas HTTP: `res.status(200|201).json({ success: true, data })` en éxito; en `catch`: `res.status(error.statusCode || 500).json({ success: false, message: error.message })`.
- No duplicar validaciones de negocio en el Controller; la estructura se valida en rutas con `validate(schema)` (Zod).

### 6. Actualizar imports en Controller
```javascript
// Añadir o reemplazar:
import { horarioService } from '../services/horarioService.js'
// Mantener imports de modelos que el Controller siga usando (p. ej. para listados que no pasen por Service)
import { Horario } from '../models/Horario.js'
```

---

## Checklist de Migración

### Por cada módulo complejo (Horarios, Equipos, Inventario, Insumos, Incidencias):

- [ ] Archivo Service creado en `server/services/<nombre>Service.js`
- [ ] Lógica de validación movida del Controller al Service (fechas, unicidad, “no eliminar si…”)
- [ ] Operaciones multi-modelo implementadas en Service (Escuela, Ciclo, Docente, Horario; Equipo + actividad; Inventario + movimientos)
- [ ] Transacciones: el Service obtiene la conexión, hace begin/commit/rollback/release; el Controller no maneja conexión
- [ ] Controller simplificado: try/catch, llamada al Service, **solo respuestas HTTP** con `res.status().json({ success, message, data })`
- [ ] Rutas con `validate(schema)` (Zod) para validación de estructura
- [ ] Imports actualizados (ES modules, rutas `../services/`, `../models/`)
- [ ] Probado y funcionando (rutas existentes en `horarioRoutes.js`, `equipoRoutes.js`, etc., sin cambios en la API)

---

## Resumen

### Módulos SIMPLES (sin Service)
```
Router (server/routes/*) → Controller (server/controllers/*) → Model (server/models/*) → DB
```

### Módulos COMPLEJOS (con Service)
```
Router (validate(schema) en rutas) → Controller (solo respuestas HTTP) → Service → Model(s) → DB
                        ↓                    ↓                           ↓
                  Validación estructura   res.status().json()    Reglas de negocio
                                                                  Transacciones (pool, begin, commit/rollback, release)
                                                                  Lógica que involucra varios modelos
```

### Convención de errores en el sistema actual
- Service: `throw new Error(message)` y asignar `error.statusCode = 404 | 400 | 409 | 403`.
- Controller: `catch (error)` → `res.status(error.statusCode || 500).json({ success: false, message: error.message })`.

---

**Migra primero UN módulo complejo (por ejemplo Horarios), verifica que las rutas y respuestas se mantienen, y luego replica el patrón en Equipos, Inventario, Insumos e Incidencias.**
