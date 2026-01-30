# Estándar de Manejo de Conexiones de Base de Datos

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

### 1.1 Patrones Identificados

#### Patrón A: Controller-Managed Connection (con transacciones)
**Ubicación**: `server/controllers/horarioController.js`, `equipoController.js`, `inventarioController.js`

**Características**:
- Controller obtiene conexión con `pool.getConnection()`
- Controller inicia transacción con `beginTransaction()`
- Controller pasa conexión a los models
- Controller maneja commit/rollback
- Controller libera conexión en `finally`

**Ejemplo actual**:
```javascript
export const createHorario = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction() // ❌ PROBLEMA: No siempre se inicia
    // ... operaciones
    await connection.commit()
  } catch (error) {
    await connection.rollback()
  } finally {
    connection.release()
  }
}
```

#### Patrón B: Model-Managed Connection (con transacciones)
**Ubicación**: `server/models/ShareLink.js`, `User.js`, `TipoEquipo.js`

**Características**:
- Model obtiene su propia conexión
- Model maneja transacción completa
- Model libera conexión en `finally`

**Ejemplo actual**:
```javascript
export const ShareLink = {
  createOrUpdate: async (laboratorioId, userId) => {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      // ... operaciones
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

#### Patrón C: Connection Optional (sin transacciones)
**Ubicación**: `server/models/Insumo.js`, `Equipo.js`, `Unidad.js`

**Características**:
- Model acepta `connection` opcional: `const conn = connection || pool`
- Si se pasa conexión, la usa; si no, usa pool directamente
- No maneja transacciones

**Ejemplo actual**:
```javascript
export const Insumo = {
  create: async (nombre, descripcion, unidad_id, categoria, presentacion, connection) => {
    const conn = connection || pool
    const [result] = await conn.execute('INSERT INTO...', [...])
    return result.insertId
  }
}
```

#### Patrón D: Direct Pool (sin transacciones)
**Ubicación**: `server/models/Inventario.js`, `Horario.js` (algunos métodos)

**Características**:
- Usa `pool.execute()` directamente
- No maneja conexiones ni transacciones
- Para operaciones de solo lectura

**Ejemplo actual**:
```javascript
export const Inventario = {
  getAllInsumosConSaldo: async (user_rol, user_laboratorio_ids) => {
    const insumos = await pool.execute(query)
    return insumos
  }
}
```

#### Patrón E: Transacciones Anidadas (PROBLEMA)
**Ubicación**: `server/models/Horario.js`, `Inventario.js`

**Características**:
- Recibe conexión con transacción iniciada
- Inicia otra transacción dentro del método
- Causa errores o comportamiento inesperado

**Ejemplo problemático**:
```javascript
// Controller
const connection = await pool.getConnection()
await connection.beginTransaction()
await Horario.registroCreateHorario(..., connection)

// Model - ❌ PROBLEMA: Inicia otra transacción
registroCreateHorario: async (datosHorario, insumos, equipos, connection) => {
  await connection.beginTransaction() // ❌ Transacción anidada
  try {
    // ... operaciones
    await connection.commit()
  } catch (error) {
    await connection.rollback()
  }
}
```

---

## 2. Problemas Identificados

### 2.1 Problemas Críticos

#### ❌ Problema 1: Transacciones Anidadas
**Ubicación**: `server/models/Horario.js:290`, `server/models/Inventario.js:178, 235`

**Descripción**: Los models inician transacciones cuando ya reciben una conexión con transacción iniciada.

**Impacto**: 
- Comportamiento impredecible
- Posibles errores de MySQL
- Rollback parcial de datos

**Ejemplo**:
```javascript
// Controller
const connection = await pool.getConnection()
try {
  await connection.beginTransaction() // Transacción 1
  await Horario.registroCreateHorario(..., connection)
} finally {
  connection.release()
}

// Model
registroCreateHorario: async (..., connection) => {
  await connection.beginTransaction() // ❌ Transacción 2 (anidada)
  // ...
}
```

#### ❌ Problema 2: Rollback sin BeginTransaction
**Ubicación**: `server/controllers/horarioController.js:173`

**Descripción**: Se hace `rollback()` sin haber iniciado transacción primero.

**Impacto**:
- Errores de MySQL
- Comportamiento inconsistente

**Ejemplo**:
```javascript
export const createHorario = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    // ❌ No hay beginTransaction()
    const escuelaInfo = await Escuela.getById(escuela_id)
    if (!escuelaInfo) {
      await connection.rollback() // ❌ Error: No hay transacción activa
      return res.status(404).json({...})
    }
  } finally {
    connection.release()
  }
}
```

#### ❌ Problema 3: Conexiones No Liberadas
**Ubicación**: `server/controllers/equipoController.js:236` (antes de corrección)

**Descripción**: Se obtiene conexión pero no se libera en `finally`.

**Impacto**:
- Agotamiento del pool de conexiones
- Timeouts y errores de conexión
- Degradación del rendimiento

#### ❌ Problema 4: Inconsistencia de Patrones
**Descripción**: Diferentes archivos usan diferentes patrones, incluso dentro del mismo archivo.

**Impacto**:
- Código difícil de mantener
- Errores difíciles de detectar
- Curva de aprendizaje alta

### 2.2 Problemas Menores

- Falta de logging consistente
- Manejo de errores inconsistente
- Validaciones antes de transacciones innecesarias

---

## 3. Propuesta Estandarizada

### 3.1 Principios Fundamentales

1. **Separación de Responsabilidades**:
   - Controllers: Manejan conexiones y transacciones para operaciones complejas
   - Models: Aceptan conexión opcional, nunca inician transacciones si reciben conexión

2. **Regla de Transacciones**:
   - Una transacción = Un `beginTransaction()` = Un `commit()` o `rollback()`
   - Los models nunca deben iniciar transacciones si reciben una conexión

3. **Regla de Conexiones**:
   - Toda conexión obtenida debe liberarse en `finally`
   - Operaciones simples pueden usar `pool.execute()` directamente

4. **Regla de Operaciones**:
   - Operaciones simples (1 query): `pool.execute()` directo
   - Operaciones complejas (2+ queries relacionadas): Transacción manejada por controller

### 3.2 Patrón Híbrido Propuesto

#### Patrón 1: Controller con Transacción (Operaciones Complejas)
**Cuándo usar**: 
- Múltiples operaciones relacionadas
- Necesidad de atomicidad
- Validaciones complejas antes de operaciones

**Estructura**:
```javascript
export const createResource = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    
    // Validaciones (sin usar conexión)
    const exists = await Model.existsById(id)
    if (!exists) {
      await connection.rollback()
      return res.status(404).json({ success: false, message: 'No encontrado' })
    }
    
    // Operaciones con conexión
    const result = await Model.create(data, connection)
    await Model.createRelated(result.id, relatedData, connection)
    
    await connection.commit()
    res.status(201).json({ success: true, data: result })
  } catch (error) {
    await connection.rollback()
    console.error('Error:', error)
    res.status(500).json({ success: false, message: error.message })
  } finally {
    connection.release()
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

**Estructura**:
```javascript
export const getResources = async (req, res) => {
  try {
    const resources = await Model.getAll()
    res.status(200).json({ success: true, data: resources })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ success: false, message: error.message })
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

### 4.1 Template: Controller con Transacción

```javascript
import { pool } from '../config/database.js'
import { Model } from '../models/Model.js'

export const createResource = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    
    // 1. Validaciones (preferiblemente sin conexión para no bloquear)
    const { field1, field2 } = req.body
    
    // Validaciones simples (sin DB)
    if (!field1 || !field2) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos faltantes'
      })
    }
    
    // Validaciones de negocio (con conexión si es necesario)
    const exists = await Model.existsByField(field1, connection)
    if (exists) {
      await connection.rollback()
      return res.status(409).json({
        success: false,
        message: 'Recurso ya existe'
      })
    }
    
    // 2. Operaciones principales
    const resourceId = await Model.create({ field1, field2 }, connection)
    
    // 3. Operaciones relacionadas
    if (req.body.relatedData) {
      await Model.createRelated(resourceId, req.body.relatedData, connection)
    }
    
    // 4. Commit
    await connection.commit()
    
    // 5. Respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Recurso creado exitosamente',
      data: { id: resourceId }
    })
  } catch (error) {
    // Rollback en caso de error
    await connection.rollback()
    console.error('Error al crear recurso:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    })
  } finally {
    // SIEMPRE liberar conexión
    connection.release()
  }
}
```

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

### 6.1 Pasos para Migrar un Controller

1. **Identificar el patrón actual**
   - ¿Usa transacciones?
   - ¿Maneja conexiones?
   - ¿Pasa conexión a models?

2. **Aplicar el patrón correcto**
   - Si tiene múltiples operaciones → Patrón 1 (Controller con transacción)
   - Si es operación simple → Patrón 3 (Sin transacción)

3. **Verificar que los models no inicien transacciones**
   - Si un model recibe `connection`, no debe hacer `beginTransaction()`

4. **Asegurar liberación de conexión**
   - Todo `getConnection()` debe tener `finally` con `release()`

5. **Probar la migración**
   - Verificar que las transacciones funcionan correctamente
   - Verificar que no hay conexiones sin liberar

### 6.2 Pasos para Migrar un Model

1. **Identificar métodos que reciben conexión**
   - Si reciben `connection`, usar `const conn = connection || pool`

2. **Eliminar transacciones anidadas**
   - Si el método recibe `connection`, NO hacer `beginTransaction()`
   - Asumir que la transacción ya está iniciada

3. **Mantener compatibilidad**
   - Los métodos deben funcionar con o sin conexión

### 6.3 Checklist de Migración

- [ ] Controller obtiene conexión con `pool.getConnection()`
- [ ] Controller inicia transacción con `beginTransaction()` antes de operaciones
- [ ] Controller hace `commit()` antes de respuesta exitosa
- [ ] Controller hace `rollback()` en `catch` y antes de `return` tempranos
- [ ] Controller libera conexión en `finally` con `connection.release()`
- [ ] Models aceptan `connection` opcional: `const conn = connection || pool`
- [ ] Models NO inician transacciones si reciben `connection`
- [ ] Operaciones simples usan `pool.execute()` directamente
- [ ] No hay transacciones anidadas
- [ ] No hay `rollback()` sin `beginTransaction()`
- [ ] Todas las conexiones se liberan

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

### 8.1 Ejemplo: Crear Horario (Corregido)

**Controller** (`server/controllers/horarioController.js`):

```javascript
import { pool } from '../config/database.js'
import { Horario } from '../models/Horario.js'
import { Escuela } from '../models/Escuela.js'
import { Ciclo } from '../models/Ciclo.js'
import { Docente } from '../models/Docente.js'

export const createHorario = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    
    const {
      laboratorio_id,
      docente_id,
      escuela_id,
      ciclo_id,
      descripcion,
      fecha_inicio,
      fecha_fin,
      cantidad_alumnos,
      color = '#4ecdc4',
      insumos = [],
      equipos = []
    } = req.body

    // Convertir fechas
    const fechaInicioMySQL = convertirFechaParaMySQL(fecha_inicio)
    const fechaFinMySQL = convertirFechaParaMySQL(fecha_fin)

    // Validaciones (sin conexión para no bloquear)
    const escuelaInfo = await Escuela.getById(escuela_id)
    if (!escuelaInfo) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'La escuela seleccionada no existe'
      })
    }

    const cicloInfo = await Ciclo.getById(ciclo_id)
    if (!cicloInfo) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'El ciclo seleccionado no existe'
      })
    }

    const docenteInfo = await Docente.getById(docente_id)
    if (!docenteInfo) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'Docente no encontrado'
      })
    }

    // Verificar cruces (con conexión)
    const cruce = await verificarCruceHorarios(
      connection,
      laboratorio_id,
      docente_id,
      fecha_inicio,
      fecha_fin
    )
    if (cruce) {
      await connection.rollback()
      return res.status(409).json({
        success: false,
        message: `Conflicto de horario: ${cruce.mensaje}`,
        tipo_conflicto: cruce.tipo,
        conflicto_detalle: cruce.conflicto
      })
    }

    // Operaciones principales (con conexión)
    const reserva_id = await Horario.createHorario({
      laboratorio_id,
      docente_id,
      escuela_id,
      ciclo_id,
      descripcion,
      fechaInicioMySQL,
      fechaFinMySQL,
      cantidad_alumnos,
      color
    }, connection)

    // Operaciones relacionadas
    if (insumos.length > 0) {
      await Horario.createHorarioInsumos(reserva_id, insumos, connection)
    }

    if (equipos.length > 0) {
      await Horario.createHorarioEquipos(reserva_id, equipos, connection)
    }

    await connection.commit()

    // Registrar actividad (después del commit, sin conexión)
    await Horario.registrarActividadHorario({
      accion: 'crear',
      reserva_id: reserva_id,
      descripcion: `Horario creado: "${descripcion}"...`,
      usuario_id: req.user.userId,
      ip_address: req.ip || req.connection.remoteAddress
    })

    res.status(201).json({
      success: true,
      message: 'Horario creado correctamente',
      data: {
        reserva_id: reserva_id,
        insumos_procesados: insumos.length,
        equipos_procesados: equipos.length
      }
    })
  } catch (error) {
    await connection.rollback()
    console.error('Error al crear horario:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  } finally {
    connection.release()
  }
}
```

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

### 8.2 Ejemplo: Eliminar Equipo (Corregido)

**Controller** (`server/controllers/equipoController.js`):

```javascript
import { pool } from '../config/database.js'
import { Equipo } from '../models/Equipo.js'

export const deleteEquipo = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    
    const { id } = req.params
    const equipoId = parseInt(id, 10)

    // Validación de ID
    if (isNaN(equipoId) || equipoId <= 0) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: 'ID de equipo inválido'
      })
    }

    // Verificar existencia
    const existingEquipo = await Equipo.existsById(equipoId)
    if (!existingEquipo) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      })
    }

    // Verificar relaciones
    const reservasActivas = await Equipo.reservasActivas(equipoId)
    if (reservasActivas) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar. El equipo está siendo usado en el sistema.'
      })
    }

    // Obtener información para actividad
    const equipoInfo = await Equipo.getById(equipoId)

    // Eliminar equipo
    await Equipo.delete(equipoId, connection)

    await connection.commit()

    // Registrar actividad (después del commit)
    await Equipo.registrarActividadEquipo({
      accion: 'eliminar',
      equipo_id: equipoInfo.id,
      descripcion: `Equipo eliminado: ${equipoInfo.nombre}...`,
      usuario_id: req.user.userId,
      ip_address: req.ip || req.connection.remoteAddress
    })

    res.status(200).json({
      success: true,
      message: 'Equipo eliminado exitosamente'
    })
  } catch (error) {
    await connection.rollback()
    console.error('Error al eliminar equipo:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno al eliminar el equipo'
    })
  } finally {
    connection.release()
  }
}
```

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
5. **Operaciones complejas requieren transacción manejada por controller**

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

**Última actualización**: Enero 2026  
**Versión**: 1.0  
**Autor**: Análisis y propuesta estandarizada del sistema
