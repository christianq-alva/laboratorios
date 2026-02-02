# Estándar de Manejo de Conexiones de Base de Datos

## Estado actual del sistema (resumen)

- **Arquitectura**: Controller → **Service** → Model. Los **controllers** no obtienen conexiones ni inician transacciones; delegan en **services**.
- **Configuración del pool**: `server/config/database.js` — `mysql2/promise`, `connectionLimit: 10`, `queueLimit: 0`, `acquireTimeout: 60000`, `timeout: 60000`, `timezone: '-05:00'`, puerto por `DB_PORT` o `31787`, SSL en producción. Helper `testConnection()` para verificar conexión.
- **Quién maneja conexiones y transacciones**:
  - **horarioService**: Obtiene conexión, inicia transacción, commit/rollback, libera en `finally`. Usado en crearReserva, actualizarReserva, eliminarReserva, cerrarHorario, cerrarHorarioConInsumos, reabrirHorario.
  - **equipoService**: Solo en **importarMasiva** obtiene conexión y transacción; create/update/delete usan `pool` vía modelo (sin transacción en service).
  - **insumoService**: Obtiene conexión, beginTransaction, commit/rollback, libera en `finally`. Usado en eliminarInsumo e importacionMasiva. En el `catch` solo hace rollback y `throw error` (propaga el error); las sentencias SQL y las reglas de negocio ya lanzan errores normalizados (handleDBError en modelo, AppError en service).
  - **inventarioService**: Obtiene conexión, inicia transacción, commit/rollback, libera en `finally`. Usado en ejecutarReabastecimientoMasivo, registrarMovimientoManual, eliminarMovimientoInventario. El **modelo** Inventario expone `registrarMovimiento(connection, ...)` (usado por movimiento manual y reabastecimiento masivo) y `eliminarMovimientoInventario(connection, ...)`; solo ejecuta sentencias con la conexión recibida y **no** inicia transacciones. Para movimientos usa validación/actualización/inserción en lote (menos round-trips).

---

## 📋 Tabla de Contenidos

1. [Análisis de Patrones Actuales](#1-análisis-de-patrones-actuales)
2. [Problemas Identificados](#2-problemas-identificados)
3. [Propuesta Estandarizada](#3-propuesta-estandarizada)
4. [Patrones de Implementación](#4-patrones-de-implementación)
5. [Utilidades y Helpers](#5-utilidades-y-helpers)
6. [Guía de Migración](#6-guía-de-migración)
7. [Checklist de Buenas Prácticas](#7-checklist-de-buenas-prácticas)
8. [Ejemplos Completos](#8-ejemplos-completos)

---

## 1. Análisis de Patrones Actuales

### 1.1 Configuración del pool

**Ubicación**: `server/config/database.js`

- **Driver**: `mysql2/promise` (`mysql.createPool(dbConfig)`).
- **Parámetros**: `host`, `port` (env `DB_PORT` o `31787`), `user`, `password`, `database`, `waitForConnections: true`, `connectionLimit: 10`, `queueLimit: 0`, `acquireTimeout: 60000`, `timeout: 60000`, `timezone: '-05:00'`, `ssl` en producción (`rejectUnauthorized: false`).
- **Export**: `pool`, `testConnection()` (obtiene conexión, `SELECT 1`, libera, log de éxito/error).

### 1.2 Patrones en uso

#### Patrón A: Service-Managed Connection (transacciones en Service)
**Ubicación**: `server/services/horarioService.js`, `server/services/insumoService.js`, `server/services/equipoService.js` (solo en `importarMasiva`), `server/services/inventarioService.js` (ejecutarReabastecimientoMasivo, registrarMovimientoManual, eliminarMovimientoInventario)

**Características**:
- El **service** obtiene conexión con `pool.getConnection()`.
- El service inicia transacción con `beginTransaction()`, hace commit/rollback y libera en `finally`.
- El service pasa `connection` a los modelos; los modelos **no** inician transacción (usan la conexión recibida).
- En el `catch` del service: solo `await connection.rollback()` y `throw error` (propagar). No se convierte ni normaliza errores; el modelo (handleDBError) y las reglas de negocio (AppError) ya lanzan errores listos para el controller/middleware.
- Los controllers solo llaman al service y devuelven la respuesta; no tocan conexiones.

**Ejemplo actual** (`horarioService.crearReserva`):
```javascript
const connection = await pool.getConnection()
try {
  await connection.beginTransaction()
  const reserva_id = await Horario.createHorario(..., connection)
  if (insumos?.length > 0) await Horario.createHorarioInsumos(reserva_id, insumos, connection)
  if (equipos?.length > 0) await Horario.createHorarioEquipos(reserva_id, equipos, connection)
  await connection.commit()
  await Horario.registrarActividadHorario({ ... }) // usa pool, fuera de transacción
  return { reserva_id, ... }
} catch (error) {
  await connection.rollback()
  throw error
} finally {
  connection.release()
}
```

#### Patrón B: Model con conexión opcional
**Ubicación**: `server/models/Insumo.js`, `server/models/Equipo.js` (y otros)

**Características**:
- Métodos del modelo aceptan `connection` opcional: `const conn = connection || pool`.
- Si reciben conexión, la usan; si no, usan `pool`. No inician transacciones.

**Ejemplo actual** (`Insumo.create`, `Equipo.create`):
```javascript
create: async (data, connection) => {
  const conn = connection || pool
  const [result] = await conn.execute('INSERT INTO...', [...])
  return result.insertId
}
```

#### Patrón C: Direct Pool (solo lectura o una sola escritura)
**Ubicación**: `server/models/Inventario.js`, `server/models/Horario.js`, `Reporte.js`, `User.js`, `Laboratorio.js`, etc.

**Características**:
- Consultas con `pool.execute()` directamente, sin conexión explícita ni transacción.
- Usado para lecturas, reportes y operaciones de una sola sentencia.

#### Patrón D: Model autónomo (conexión y transacción en el modelo)
**Ubicación**: `server/models/ShareLink.js` (`createOrUpdate`), `server/models/Laboratorio.js` (método con transacción interna)

**Características**:
- El modelo obtiene su propia conexión, inicia transacción, commit/rollback y libera en `finally`.
- No reciben conexión desde fuera; usados en flujos independientes.

### 1.3 Controllers

Los controllers **no** obtienen conexiones ni manejan transacciones. Solo extraen datos de `req`, llaman al service y envían la respuesta (o pasan errores con `next(error)`).

**Ejemplo** (`horarioController.createHorario`):
```javascript
const result = await horarioService.crearReserva(
  { laboratorio_id, docente_id, ... }, insumos, equipos, req.user.userId, req.ip
)
res.status(201).json({ success: true, message: '...', data: result })
```

---

## 2. Problemas Identificados

### 2.1 Inconsistencia de patrones

- **Equipo**: create/update/delete sin transacción en el service (una sola escritura o lecturas); solo la importación masiva usa transacción en el service.

### 2.2 Otros

- No existe `server/utils/transaction.js` (el documento lo propone como opcional).
- Manejo de errores: uso de `AppError` y `next(error)` en controllers; los services hacen `throw` y liberan conexión en `finally`.

---

## 3. Propuesta Estandarizada

### 3.1 Principios Fundamentales

1. **Separación de Responsabilidades** (alineado con el estado actual):
   - **Controllers**: No obtienen conexiones ni transacciones; delegan en services y responden.
   - **Services**: Para operaciones complejas (varias escrituras relacionadas), el service obtiene la conexión, inicia la transacción, hace commit/rollback y libera en `finally`.
   - **Models**: Aceptan `connection` opcional; si reciben conexión, **no** deben iniciar transacciones (`beginTransaction()`).

2. **Regla de Transacciones**:
   - Una transacción = Un `beginTransaction()` = Un `commit()` o `rollback()`
   - Quien inicia la transacción (service o, en casos legacy, modelo) es el único que hace commit/rollback en ese flujo.
   - Los models que reciben `connection` no deben llamar a `beginTransaction()`.

3. **Regla de Conexiones**:
   - Toda conexión obtenida (`pool.getConnection()`) debe liberarse en `finally` con `connection.release()`.
   - Operaciones simples pueden usar `pool.execute()` directamente sin obtener conexión.

4. **Regla de Operaciones**:
   - Operaciones simples (1 query o lecturas): `pool.execute()` en el modelo, sin transacción.
   - Operaciones complejas (2+ queries relacionadas): Transacción manejada por **service** (no por controller).

### 3.2 Patrón Híbrido Propuesto

#### Patrón 1: Service con Transacción (Operaciones Complejas)
**Cuándo usar**: 
- Múltiples operaciones relacionadas
- Necesidad de atomicidad
- Validaciones complejas antes de operaciones

**Estructura** (el controller solo llama al service y responde):
```javascript
// Service
export const resourceService = {
  async createResource(data, userId, ip) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const exists = await Model.existsById(data.id)
      if (!exists) {
        await connection.rollback()
        throw new AppError('No encontrado', 404)
      }
      const result = await Model.create(data, connection)
      await Model.createRelated(result.id, data.related, connection)
      await connection.commit()
      return result
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}

// Controller
export const createResource = async (req, res, next) => {
  try {
    const result = await resourceService.createResource(req.body, req.user.userId, req.ip)
    res.status(201).json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}
```

#### Patrón 2: Model con Conexión Opcional (Sin Iniciar Transacciones)
**Cuándo usar**: 
- Métodos de model que pueden usarse con o sin transacción
- Reutilización de código

**Estructura**:
```javascript
export const Model = {
  create: async (data, connection) => {
    const conn = connection || pool
    const [result] = await conn.execute(
      'INSERT INTO table (field1, field2) VALUES (?, ?)',
      [data.field1, data.field2]
    )
    return result.insertId
  },
  
  getById: async (id, connection) => {
    const conn = connection || pool
    const [rows] = await conn.execute(
      'SELECT * FROM table WHERE id = ?',
      [id]
    )
    return rows[0] || null
  }
}
```

#### Patrón 3: Operaciones Simples (Sin Transacción)
**Cuándo usar**: 
- Una sola query
- Operaciones de solo lectura
- No hay necesidad de atomicidad

**Estructura** (controller llama al service o al modelo; no se usa conexión explícita):
```javascript
export const getResources = async (req, res, next) => {
  try {
    const resources = await resourceService.getAll(req.query) // o Model.getAll()
    res.status(200).json({ success: true, data: resources })
  } catch (error) {
    next(error)
  }
}
```

#### Patrón 4: Model Autónomo (Solo para Casos Específicos)
**Cuándo usar**: 
- Operaciones completamente independientes
- No se reutiliza en transacciones
- Ejemplo: `ShareLink.createOrUpdate()`

**Estructura**:
```javascript
export const Model = {
  createOrUpdate: async (data) => {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      
      // Operaciones
      const existing = await connection.execute('SELECT...', [...])
      if (existing.length > 0) {
        await connection.execute('UPDATE...', [...])
      } else {
        await connection.execute('INSERT...', [...])
      }
      
      await connection.commit()
      return result
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}
```

---

## 4. Patrones de Implementación

### 4.1 Template: Service con Transacción

En el sistema actual la transacción la maneja el **service**; el controller solo invoca al service y envía la respuesta. Ejemplo de service:

```javascript
import { pool } from '../config/database.js'
import { Model } from '../models/Model.js'
import { AppError } from '../utils/errors.js'

export const resourceService = {
  async createResource(body, userId, ip) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const { field1, field2 } = body

      if (!field1 || !field2) {
        await connection.rollback()
        throw new AppError('Campos requeridos faltantes', 400)
      }

      const exists = await Model.existsByField(field1, connection)
      if (exists) {
        await connection.rollback()
        throw new AppError('Recurso ya existe', 409)
      }

      const resourceId = await Model.create({ field1, field2 }, connection)
      if (body.relatedData) {
        await Model.createRelated(resourceId, body.relatedData, connection)
      }

      await connection.commit()
      return { id: resourceId }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}
```

Controller: `const result = await resourceService.createResource(req.body, req.user.userId, req.ip)` y `res.status(201).json({ success: true, data: result })`.

### 4.2 Template: Model con Conexión Opcional

```javascript
import { pool } from '../config/database.js'

export const Model = {
  // Crear recurso
  create: async (data, connection) => {
    const conn = connection || pool
    
    const [result] = await conn.execute(
      `INSERT INTO table_name (field1, field2, created_at) 
       VALUES (?, ?, NOW())`,
      [data.field1, data.field2]
    )
    
    return result.insertId
  },
  
  // Actualizar recurso
  update: async (id, data, connection) => {
    const conn = connection || pool
    
    const [result] = await conn.execute(
      `UPDATE table_name 
       SET field1 = ?, field2 = ?, updated_at = NOW()
       WHERE id = ?`,
      [data.field1, data.field2, id]
    )
    
    return { affectedRows: result.affectedRows }
  },
  
  // Eliminar recurso
  delete: async (id, connection) => {
    const conn = connection || pool
    
    const [result] = await conn.execute(
      'DELETE FROM table_name WHERE id = ?',
      [id]
    )
    
    return { affectedRows: result.affectedRows }
  },
  
  // Obtener por ID
  getById: async (id, connection) => {
    const conn = connection || pool
    
    const [rows] = await conn.execute(
      'SELECT * FROM table_name WHERE id = ?',
      [id]
    )
    
    return rows[0] || null
  },
  
  // Obtener todos
  getAll: async (connection) => {
    const conn = connection || pool
    
    const [rows] = await conn.execute(
      'SELECT * FROM table_name ORDER BY created_at DESC'
    )
    
    return rows
  },
  
  // Verificar existencia
  existsById: async (id, connection) => {
    const conn = connection || pool
    
    const [rows] = await conn.execute(
      'SELECT id FROM table_name WHERE id = ?',
      [id]
    )
    
    return rows.length > 0
  },
  
  // Verificar existencia por campo único
  existsByField: async (fieldValue, connection) => {
    const conn = connection || pool
    
    const [rows] = await conn.execute(
      'SELECT id FROM table_name WHERE unique_field = ?',
      [fieldValue]
    )
    
    return rows.length > 0
  }
}
```

### 4.3 Template: Operación Simple (Sin Transacción)

```javascript
import { Model } from '../models/Model.js'

export const getResources = async (req, res) => {
  try {
    const { filter } = req.query
    const resources = await Model.getAll(filter)
    
    res.status(200).json({
      success: true,
      data: resources,
      total: resources.length
    })
  } catch (error) {
    console.error('Error al obtener recursos:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    })
  }
}
```

---

## 5. Utilidades y Helpers

### 5.1 Helper para Transacciones (Opcional)

Crear `server/utils/transaction.js`:

```javascript
import { pool } from '../config/database.js'

/**
 * Ejecuta una función dentro de una transacción
 * @param {Function} callback - Función que recibe la conexión y debe retornar un resultado
 * @returns {Promise} Resultado de la función callback
 */
export const withTransaction = async (callback) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

/**
 * Ejecuta una función con una conexión (sin transacción)
 * @param {Function} callback - Función que recibe la conexión
 * @returns {Promise} Resultado de la función callback
 */
export const withConnection = async (callback) => {
  const connection = await pool.getConnection()
  try {
    return await callback(connection)
  } finally {
    connection.release()
  }
}
```

**Uso del helper**:

```javascript
import { withTransaction } from '../utils/transaction.js'
import { Model } from '../models/Model.js'

export const createResource = async (req, res) => {
  try {
    const result = await withTransaction(async (connection) => {
      const resourceId = await Model.create(req.body, connection)
      await Model.createRelated(resourceId, req.body.related, connection)
      return resourceId
    })
    
    res.status(201).json({ success: true, data: { id: result } })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
```

### 5.2 Helper para Validar Transacciones

```javascript
/**
 * Verifica si una conexión tiene una transacción activa
 * @param {Object} connection - Conexión de MySQL
 * @returns {Promise<boolean>}
 */
export const hasActiveTransaction = async (connection) => {
  try {
    const [rows] = await connection.execute('SELECT @@autocommit as autocommit')
    return rows[0].autocommit === 0
  } catch (error) {
    return false
  }
}
```

---

## 6. Guía de Migración

### 6.1 Pasos para migrar un flujo con transacción

1. **Identificar el patrón actual**
   - ¿La transacción está en el service o en el controller/model?
   - ¿Quién obtiene la conexión y quién la libera?

2. **Aplicar el patrón correcto**
   - Múltiples operaciones relacionadas → Patrón 1: **Service** obtiene conexión, inicia transacción, commit/rollback, release en `finally`. Controller solo llama al service.
   - Operación simple → Sin transacción; modelo usa `pool` o service sin conexión explícita.

3. **Verificar que los models no inicien transacciones**
   - Si un model recibe `connection`, no debe hacer `beginTransaction()`.

4. **Asegurar liberación de conexión**
   - Todo `pool.getConnection()` debe tener `finally { connection.release() }`.

5. **Probar la migración**
   - Verificar que las transacciones funcionan correctamente y que no hay conexiones sin liberar.

### 6.2 Pasos para Migrar un Model

1. **Identificar métodos que reciben conexión**
   - Si reciben `connection`, usar `const conn = connection || pool`

2. **Eliminar transacciones anidadas**
   - Si el método recibe `connection`, NO hacer `beginTransaction()`
   - Asumir que la transacción ya está iniciada

3. **Mantener compatibilidad**
   - Los métodos deben funcionar con o sin conexión

### 6.3 Checklist de Migración

- [ ] Para flujos con transacción: **Service** (no controller) obtiene conexión con `pool.getConnection()`
- [ ] Service inicia transacción con `beginTransaction()` antes de operaciones
- [ ] Service hace `commit()` antes de retornar resultado exitoso
- [ ] Service hace `rollback()` en `catch` y antes de `throw` tempranos
- [ ] Service libera conexión en `finally` con `connection.release()`
- [ ] Models aceptan `connection` opcional: `const conn = connection || pool`
- [ ] Models NO inician transacciones si reciben `connection`
- [ ] Operaciones simples usan `pool.execute()` directamente en el modelo
- [ ] No hay transacciones anidadas (un solo `beginTransaction()` por flujo)
- [ ] No hay `rollback()` sin `beginTransaction()` previo
- [ ] Todas las conexiones obtenidas se liberan

---

## 7. Checklist de Buenas Prácticas

### 7.1 Manejo de Conexiones

- [ ] Toda conexión obtenida se libera en `finally`
- [ ] No se obtienen múltiples conexiones innecesariamente
- [ ] Las operaciones simples usan `pool.execute()` directamente
- [ ] Las conexiones se obtienen lo más tarde posible y se liberan lo antes posible

### 7.2 Manejo de Transacciones

- [ ] Una transacción = Un `beginTransaction()` = Un `commit()` o `rollback()`
- [ ] No hay transacciones anidadas
- [ ] No se hace `rollback()` sin `beginTransaction()`
- [ ] Los `rollback()` están en `catch` y antes de `return` tempranos
- [ ] Los `commit()` están antes de la respuesta exitosa

### 7.3 Manejo de Errores

- [ ] Todos los errores se capturan en `catch`
- [ ] Se hace `rollback()` en caso de error
- [ ] Se registran errores con `console.error()`
- [ ] Se retornan mensajes de error apropiados al cliente

### 7.4 Código Limpio

- [ ] Los métodos de model son reutilizables (aceptan conexión opcional)
- [ ] No hay duplicación de código
- [ ] Los nombres de variables son descriptivos (`connection`, `conn`, `result`)
- [ ] Los comentarios explican el "por qué", no el "qué"

---

## 8. Ejemplos Completos

Los ejemplos siguientes ilustran el **patrón recomendado** (service con transacción). El sistema actual ya sigue este patrón en `horarioService.crearReserva`, etc.: el controller llama al service y el service maneja conexión y transacción.

### 8.1 Ejemplo: Crear Horario (patrón recomendado; implementación actual en service)

**Service** (`server/services/horarioService.js`) — el controller solo llama a `horarioService.crearReserva(...)` y responde. Ejemplo de flujo equivalente:

```javascript
// Service (horarioService.crearReserva) — estado actual
const connection = await pool.getConnection()
try {
  await connection.beginTransaction()
  // Validaciones: Escuela.getById, Ciclo.getById, Docente.getById, verificarCruceHorarios
  const reserva_id = await Horario.createHorario(..., connection)
  if (insumos?.length > 0) await Horario.createHorarioInsumos(reserva_id, insumos, connection)
  if (equipos?.length > 0) await Horario.createHorarioEquipos(reserva_id, equipos, connection)
  await connection.commit()
  await Horario.registrarActividadHorario({ accion: 'crear', ... }) // usa pool
  return { reserva_id, insumos_procesados, equipos_procesados }
} catch (error) {
  await connection.rollback()
  throw error
} finally {
  connection.release()
}
```

El controller solo hace: `const result = await horarioService.crearReserva(...); res.status(201).json({ success: true, data: result })`.

**Model** (`server/models/Horario.js`):

```javascript
import { pool } from '../config/database.js'

export const Horario = {
  // ✅ CORRECTO: No inicia transacción, solo usa la conexión recibida
  createHorario: async (datosHorario, connection) => {
    const {
      laboratorio_id,
      docente_id,
      escuela_id,
      ciclo_id,
      descripcion,
      fechaInicioMySQL,
      fechaFinMySQL,
      cantidad_alumnos,
      color
    } = datosHorario

    const [result] = await connection.execute(
      `INSERT INTO reservas 
       (laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, 
        fecha_inicio, fecha_fin, cantidad_alumnos, color) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion,
       fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color]
    )

    return result.insertId
  },

  createHorarioInsumos: async (reserva_id, insumos, connection) => {
    if (insumos.length === 0) return

    const values = insumos.map(insumo => [reserva_id, insumo.insumo_id, insumo.cantidad])
    const placeholders = values.map(() => '(?, ?, ?)').join(', ')
    const flatValues = values.flat()

    await connection.execute(
      `INSERT INTO detalle_reserva_insumos (reserva_id, insumo_id, cantidad) 
       VALUES ${placeholders}`,
      flatValues
    )
  },

  createHorarioEquipos: async (reserva_id, equipos, connection) => {
    if (equipos.length === 0) return

    const values = equipos.map(equipo => [reserva_id, equipo.equipo_id])
    const placeholders = values.map(() => '(?, ?)').join(', ')
    const flatValues = values.flat()

    await connection.execute(
      `INSERT INTO detalle_reserva_equipos (reserva_id, equipo_id) 
       VALUES ${placeholders}`,
      flatValues
    )
  },

  // Operación simple (sin transacción)
  registrarActividadHorario: async (data) => {
    const { accion, reserva_id, descripcion, usuario_id, ip_address } = data
    
    await pool.execute(
      `INSERT INTO actividad_horarios 
       (accion, reserva_id, descripcion, usuario_id, ip_address, fecha_actividad) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [accion, reserva_id, descripcion, usuario_id, ip_address]
    )
  }
}
```

### 8.2 Ejemplo: Eliminar Equipo

En el sistema actual, **equipoService.eliminarEquipo** no usa transacción (una sola eliminación y registro de actividad). Si en el futuro se requieren varias operaciones atómicas, el patrón sería: **service** obtiene conexión, beginTransaction, operaciones, commit/rollback, release. Ejemplo de template (service con transacción):

```javascript
// Service con transacción (template)
async eliminarEquipo(equipoId, userId, ip) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    if (!(await Equipo.existsById(equipoId))) throw new AppError('Equipo no encontrado', 404)
    if (await Equipo.reservasActivas(equipoId)) throw new AppError('Equipo en uso', 400)
    const equipoInfo = await Equipo.getById(equipoId)
    await Equipo.delete(equipoId, connection)
    await connection.commit()
    await Equipo.registrarActividadEquipo({ accion: 'eliminar', ... })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}
```

Hoy `equipoService.eliminarEquipo` usa `Equipo.delete(equipoId)` sin conexión y luego `Equipo.registrarActividadEquipo` (pool); no hay transacción porque son operaciones secuenciales aceptables.

### 8.3 Ejemplo: Model con Conexión Opcional

**Model** (`server/models/Insumo.js`):

```javascript
import { pool } from '../config/database.js'

export const Insumo = {
  create: async (nombre, descripcion, unidad_id, categoria, presentacion, connection) => {
    const conn = connection || pool

    const [insumoResult] = await conn.execute(
      `INSERT INTO insumos (codigo, nombre, descripcion, unidad_id, categoria, presentacion) 
       VALUES ('PENDIENTE', ?, ?, ?, ?, ?)`,
      [nombre, descripcion || '', unidad_id, categoria, presentacion || '']
    )

    const insumo_id = insumoResult.insertId
    const codigo = `INS-${insumo_id.toString().padStart(4, '0')}`

    await conn.execute('UPDATE insumos SET codigo = ? WHERE id = ?', [codigo, insumo_id])

    return { insumo_id, codigo }
  },

  getById: async (id, connection) => {
    const conn = connection || pool

    const [rows] = await conn.execute(
      `SELECT i.id, i.codigo, i.nombre, i.descripcion, i.unidad_id, 
              u.simbolo as unidad_simbolo, u.nombre as unidad_nombre
       FROM insumos i
       LEFT JOIN unidades u ON i.unidad_id = u.id
       WHERE i.id = ?`,
      [id]
    )

    return rows[0] || null
  },

  getAll: async (connection) => {
    const conn = connection || pool

    const [rows] = await conn.execute(
      `SELECT i.id, i.codigo, i.nombre, i.descripcion, i.categoria, i.presentacion, 
              i.unidad_id, u.simbolo as unidad_simbolo, u.nombre as unidad_nombre
       FROM insumos i
       LEFT JOIN unidades u ON i.unidad_id = u.id
       ORDER BY i.nombre`
    )

    return rows
  }
}
```

---

## 9. Resumen de Reglas

### ✅ Reglas de Oro

1. **Toda conexión obtenida debe liberarse en `finally`**
2. **Una transacción = Un `beginTransaction()` = Un `commit()` o `rollback()`**
3. **Los models nunca inician transacciones si reciben `connection`**
4. **Operaciones simples usan `pool.execute()` directamente**
5. **Operaciones complejas requieren transacción manejada por service**

### ❌ Errores Comunes a Evitar

1. ❌ Hacer `rollback()` sin `beginTransaction()`
2. ❌ Iniciar transacción en model cuando ya se recibió conexión con transacción
3. ❌ Olvidar `connection.release()` en `finally`
4. ❌ Usar transacciones para operaciones simples
5. ❌ Obtener conexión innecesariamente para operaciones simples

---

## 10. Referencias y Recursos

- [MySQL2 Promise Pool Documentation](https://github.com/sidorares/node-mysql2#using-promise-wrapper)
- [Node.js Best Practices - Database](https://github.com/goldbergyoni/nodebestpractices#8-database-best-practices)
- [Transaction Management Patterns](https://www.postgresql.org/docs/current/tutorial-transactions.html)

---

**Última actualización**: Febrero 2026  
**Versión**: 1.1  
**Estado**: Documento alineado con la arquitectura actual: Controller → Service → Model; transacciones y conexiones manejadas por **services** (horarioService, equipoService en importación, insumoService, inventarioService). El modelo Inventario ya no inicia transacciones; el service es dueño de beginTransaction/commit/rollback.
