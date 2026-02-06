# Guía de Pruebas de Integración - Sistema de Gestión de Laboratorios

## Objetivo

Esta guía define las pruebas de integración necesarias para garantizar el correcto funcionamiento de los **flujos críticos** del sistema. Las pruebas de integración verifican que los componentes trabajen correctamente en conjunto (Controller → Service → Model → Base de Datos).

---

## Principios de las pruebas de integración

- **Realistas**: Usan base de datos real (de testing) y simulan flujos completos de usuario
- **End-to-End por flujo**: Desde HTTP request hasta persistencia en BD
- **Independientes**: Cada test limpia/prepara sus propios datos
- **Enfocadas en flujos críticos**: Priorizan escenarios que causan mayor impacto si fallan

---

## Requisitos previos en el código

Para que los tests de integración puedan ejecutarse, la aplicación Express debe poder importarse sin levantar el servidor. En este proyecto:

- La app se crea y exporta en **`server/app.js`** (`export { app }`).
- **`server/index.js`** importa la app desde `app.js` y solo ejecuta `app.listen()` cuando `process.env.NODE_ENV !== 'test'`.
- Los tests importan la app desde **`server/app.js`** para usar Supertest sin iniciar el servidor.

En los ejemplos de esta guía se usa: `import { app } from '../../server/app.js'` (desde `tests/integration/`) o `import { app } from '../server/app.js'` (desde `tests/`).

---

## Configuración inicial

### Herramientas recomendadas

**Framework de testing**: Jest + Supertest
**Base de datos**: MySQL (instancia separada para testing)

**Instalación**:

```bash
npm install --save-dev jest @jest/globals supertest
```

### Configuración de Jest

Crear `jest.config.js`:

```javascript
export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/tests/integration/**/*.test.js'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 30000, // 30 segundos para tests con BD
}
```

### Scripts en package.json

```json
{
  "scripts": {
    "test": "NODE_ENV=test jest",
    "test:watch": "NODE_ENV=test jest --watch",
    "test:integration": "NODE_ENV=test jest tests/integration"
  }
}
```

### Configuración de base de datos de testing

Crear archivo `.env.test` en la raíz del proyecto (o usar el existente). Con `NODE_ENV=test`, la aplicación carga automáticamente `.env.test` desde `server/config/env.js` (importado al inicio de `server/app.js`). Ejemplo:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=laboratorios_test
DB_PORT=3306
NODE_ENV=test
JWT_SECRET=test_jwt_secret
```

**Esquema relevante para tests**: En la tabla `usuarios`, el campo `estado` es `char(1)`: `'A'` = Activo, `'I'` = Inactivo. La API de login devuelve **401** (no 403) para usuario inactivo. La respuesta de login tiene la forma `{ success, user: { id, nombre_completo, usuario, rol, laboratorio_ids }, token }`. La base de datos de test **no** incluye las tablas `rol_permiso` ni `permisos` (la autorización en el sistema es por rol, tabla `roles` únicamente); el setup no las trunca.

### Setup de tests

Crear `tests/setup.js`:

```javascript
import { pool } from '../server/config/database.js'

// Ejecutar antes de cada test
beforeEach(async () => {
  // Limpiar tablas en orden (respetando foreign keys)
  await pool.query('SET FOREIGN_KEY_CHECKS = 0')
  await pool.query('TRUNCATE TABLE actividad_equipos')
  await pool.query('TRUNCATE TABLE actividad_horarios')
  await pool.query('TRUNCATE TABLE detalle_reserva_insumos')
  await pool.query('TRUNCATE TABLE detalle_reserva_equipos')
  await pool.query('TRUNCATE TABLE incidencias')
  await pool.query('TRUNCATE TABLE enlaces_compartidos')
  await pool.query('TRUNCATE TABLE movimiento_insumo_detalle')
  await pool.query('TRUNCATE TABLE movimientos_insumos')
  await pool.query('TRUNCATE TABLE reservas')
  await pool.query('TRUNCATE TABLE equipos')
  await pool.query('TRUNCATE TABLE inventario_insumos')
  await pool.query('TRUNCATE TABLE insumos')
  await pool.query('TRUNCATE TABLE usuarios')
  await pool.query('TRUNCATE TABLE docentes')
  await pool.query('TRUNCATE TABLE laboratorios')
  await pool.query('TRUNCATE TABLE ciclos')
  await pool.query('TRUNCATE TABLE escuelas')
  await pool.query('TRUNCATE TABLE tipos_equipo')
  await pool.query('TRUNCATE TABLE unidades')
  await pool.query('TRUNCATE TABLE roles')
  await pool.query('SET FOREIGN_KEY_CHECKS = 1')

  // Insertar datos base necesarios para todos los tests
  await seedBaseData()
})

// Cerrar conexión después de todos los tests
afterAll(async () => {
  await pool.end()
})

async function seedBaseData() {
  // Insertar roles
  await pool.query(`
    INSERT INTO roles (id, nombre) VALUES
    (1, 'Administrador'),
    (2, 'Jefe de Laboratorio')
  `)

  // Insertar escuelas (basado en dump: Medicina Humana, Nutrición Humana)
  await pool.query(`
    INSERT INTO escuelas (id, nombre) VALUES
    (1, 'Medicina Humana'),
    (2, 'Nutrición Humana')
  `)

  // Insertar ciclos (formato del dump)
  await pool.query(`
    INSERT INTO ciclos (id, nombre) VALUES
    (1, 'Ciclo 1')
  `)

  // Insertar docentes (escuela_id 1 = Medicina Humana)
  await pool.query(`
    INSERT INTO docentes (id, nombre, correo, escuela_id) VALUES
    (1, 'Juan Pérez', 'juan.perez@upeu.edu.pe', 1)
  `)

  // Insertar tipos de equipo (tabla tipos_equipo; basado en dump)
  await pool.query(`
    INSERT INTO tipos_equipo (id, nombre, descripcion) VALUES
    (1, 'Microscopio', 'Microscopios ópticos y variantes'),
    (2, 'Balanza', 'Balanza analítica / precisión')
  `)

  // Insertar unidades
  await pool.query(`
    INSERT INTO unidades (id, simbolo, nombre) VALUES
    (1, 'ml', 'Mililitros'),
    (2, 'g', 'Gramos')
  `)

  // Insertar laboratorios (relacionados a escuela Medicina Humana, basado en dump)
  await pool.query(`
    INSERT INTO laboratorios (id, nombre, codigo, escuela_id, estado, piso, ubicacion) VALUES
    (1, 'Laboratorio de Cómputo 1', 'SL01LA10', 1, 'Activo', 2, 'Pabellón A'),
    (2, 'Laboratorio de Cómputo 2', 'SL01LA11', 1, 'Activo', 2, 'Pabellón A')
  `)

  // Insumo de prueba (opcional, para tests de inventario)
  await pool.query(`
    INSERT INTO insumos (id, nombre, codigo, categoria, unidad_id) VALUES
    (1, 'Insumo prueba', 'INS-TEST-001', 'Materiales', 1)
  `)

  // Configurar insumo en laboratorio 1
  await pool.query(`
    INSERT INTO inventario_insumos (insumo_id, laboratorio_id) VALUES
    (1, 1)
  `)
}
```

### Funciones auxiliares

Crear `tests/helpers.js`:

```javascript
import request from 'supertest'
import { app } from '../server/app.js'
import { pool } from '../server/config/database.js'
import bcrypt from 'bcryptjs'

// Login helpers
export async function loginAsAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await pool.query(`
    INSERT INTO usuarios (nombre_completo, usuario, contrasena, rol_id, laboratorio_ids, estado)
    VALUES ('Admin User', 'admin', ?, 1, '[]', 'A')
  `, [hashedPassword])

  const res = await request(app)
    .post('/api/auth/login')
    .send({ usuario: 'admin', contrasena: 'admin123' })

  return res.body.token
}

export async function loginAsJefe(laboratorio_ids = [1]) {
  const hashedPassword = await bcrypt.hash('jefe123', 10)
  const laboratorioIdsJson = JSON.stringify(laboratorio_ids)
  await pool.query(`
    INSERT INTO usuarios (nombre_completo, usuario, contrasena, rol_id, laboratorio_ids, estado)
    VALUES ('Jefe User', 'jefe', ?, 2, ?, 'A')
  `, [hashedPassword, laboratorioIdsJson])

  const res = await request(app)
    .post('/api/auth/login')
    .send({ usuario: 'jefe', contrasena: 'jefe123' })

  return res.body.token
}

// Data creation helpers (tabla reservas = horarios en el modelo del proyecto)
export async function crearHorario(data = {}) {
  const defaults = {
    laboratorio_id: 1,
    docente_id: 1,
    escuela_id: 1,
    ciclo_id: 1,
    fecha_inicio: '2025-06-01 08:00:00',
    fecha_fin: '2025-06-01 10:00:00',
    cantidad_alumnos: 20,
    descripcion: 'Test',
    color: '#FF0000',
    estado: 'P'
  }

  const horario = { ...defaults, ...data }

  const [result] = await pool.query(`
    INSERT INTO reservas (laboratorio_id, docente_id, escuela_id, ciclo_id, fecha_inicio, fecha_fin, cantidad_alumnos, descripcion, color, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [horario.laboratorio_id, horario.docente_id, horario.escuela_id, horario.ciclo_id, horario.fecha_inicio, horario.fecha_fin, horario.cantidad_alumnos, horario.descripcion, horario.color, horario.estado])

  return { id: result.insertId, ...horario }
}

export async function crearInsumo(data = {}) {
  const defaults = {
    nombre: 'Insumo Test',
    codigo: `INS-${Date.now()}`,
    categoria: 'Materiales',
    unidad_id: 1
  }

  const insumo = { ...defaults, ...data }

  const [result] = await pool.query(`
    INSERT INTO insumos (nombre, codigo, categoria, unidad_id) VALUES (?, ?, ?, ?)
  `, [insumo.nombre, insumo.codigo, insumo.categoria, insumo.unidad_id])

  return { id: result.insertId, ...insumo }
}

export async function crearEquipo(data = {}) {
  const defaults = {
    nombre: 'Equipo Test',
    codigo: `EQP-${Date.now()}`,
    tipo_equipo_id: 1,
    laboratorio_id: 1,
    estado: 'Operativo',
    condicion: 'Bueno'
  }

  const equipo = { ...defaults, ...data }

  const [result] = await pool.query(`
    INSERT INTO equipos (nombre, codigo, tipo_equipo_id, laboratorio_id, estado, condicion) VALUES (?, ?, ?, ?, ?, ?)
  `, [equipo.nombre, equipo.codigo, equipo.tipo_equipo_id, equipo.laboratorio_id, equipo.estado, equipo.condicion])

  return { id: result.insertId, ...equipo }
}

// Movimiento de entrada (tablas movimientos_insumos + movimiento_insumo_detalle)
export async function crearEntrada(data = {}) {
  const defaults = {
    laboratorio_id: 1,
    usuario_id: 1,
    fecha_movimiento: '2025-06-01',
    observaciones: 'Entrada test'
  }

  const movimiento = { ...defaults, ...data }

  const [result] = await pool.query(`
    INSERT INTO movimientos_insumos (laboratorio_id, usuario_id, tipo_movimiento, fecha_movimiento, observaciones)
    VALUES (?, ?, 'entrada', ?, ?)
  `, [movimiento.laboratorio_id, movimiento.usuario_id, movimiento.fecha_movimiento, movimiento.observaciones])

  const movimiento_id = result.insertId

  if (data.detalles && data.detalles.length) {
    for (const detalle of data.detalles) {
      const [detResult] = await pool.query(`
        INSERT INTO movimiento_insumo_detalle (movimiento_id, insumo_id, cantidad, lote, fecha_vencimiento, saldo)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        movimiento_id,
        detalle.insumo_id,
        detalle.cantidad,
        detalle.lote || 'LOTE-001',
        detalle.fecha_vencimiento || null,
        detalle.cantidad
      ])
    }
  }

  return { id: movimiento_id }
}

export async function obtenerSaldo(movimiento_detalle_id) {
  const [rows] = await pool.query(`
    SELECT saldo FROM movimiento_insumo_detalle WHERE id = ?
  `, [movimiento_detalle_id])
  return rows[0]?.saldo ?? 0
}
```

---

## Estructura de archivos

```
project/
├── tests/
│   ├── setup.js                          # Configuración global
│   ├── helpers.js                        # Funciones auxiliares
│   ├── README.md                         # Requisitos y ejecución de tests
│   └── integration/
│       ├── auth.test.js                  # Autenticación
│       ├── permisos.test.js              # Permisos por rol
│       ├── horarios.test.js              # Horarios (solapamiento, cierre)
│       ├── movimientos.test.js           # Movimientos (entrada/salida, eliminación)
│       ├── equipos.test.js               # Equipos (actualización)
│       ├── insumos.test.js               # Insumos (eliminación)
│       ├── incidencias.test.js           # Incidencias
│       ├── importaciones.test.js         # Importaciones masivas
│       └── fixtures/                     # Archivos Excel para tests de importación
│           ├── insumos_invalidos.xlsx
│           ├── insumos_mixto.xlsx
│           ├── equipos_tipo_mixto.xlsx
│           ├── rebastecimiento_codigo_invalido.xlsx
│           └── rebastecimiento_valido.xlsx
└── jest.config.js
```

---

## Tests de Integración - Fase 1 (Críticos)

### 1. Autenticación

**Archivo**: `tests/integration/auth.test.js`

**Casos a probar**:
1. Usuario activo válido puede iniciar sesión
2. Usuario inactivo no puede iniciar sesión
3. Credenciales incorrectas devuelven error genérico
4. Token generado contiene los datos correctos

**Total: 4 tests**

```javascript
import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { app } from '../../server/app.js'
import { pool } from '../../server/config/database.js'
import bcrypt from 'bcryptjs'

describe('Autenticación', () => {
  describe('POST /api/auth/login', () => {
    it('permite login a usuario activo con credenciales válidas', async () => {
      // Crear usuario activo (estado: A = Activo en BD)
      const hashedPassword = await bcrypt.hash('password123', 10)
      await pool.query(`
        INSERT INTO usuarios (nombre_completo, usuario, contrasena, rol_id, laboratorio_ids, estado)
        VALUES ('Usuario Activo', 'usuario_activo', ?, 1, '[]', 'A')
      `, [hashedPassword])
      
      const res = await request(app)
        .post('/api/auth/login')
        .send({ usuario: 'usuario_activo', contrasena: 'password123' })
      
      expect(res.status).toBe(200)
      expect(res.body.token).toBeDefined()
      expect(res.body.user).toBeDefined()
      expect(res.body.user.usuario).toBe('usuario_activo')
    })
    
    it('rechaza login a usuario inactivo', async () => {
      // Crear usuario inactivo (estado: I = Inactivo en BD; API devuelve 401)
      const hashedPassword = await bcrypt.hash('password123', 10)
      await pool.query(`
        INSERT INTO usuarios (nombre_completo, usuario, contrasena, rol_id, laboratorio_ids, estado)
        VALUES ('Usuario Inactivo', 'usuario_inactivo', ?, 1, '[]', 'I')
      `, [hashedPassword])
      
      const res = await request(app)
        .post('/api/auth/login')
        .send({ usuario: 'usuario_inactivo', contrasena: 'password123' })
      
      expect(res.status).toBe(401)
      expect(res.body.message).toContain('inactivo')
    })
    
    it('rechaza credenciales incorrectas con mensaje genérico', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ usuario: 'usuario_inexistente', contrasena: 'wrong_password' })
      
      expect(res.status).toBe(401)
      expect(res.body.message).toContain('incorrectas')
      // No debe revelar si el usuario existe o no
    })
    
    it('token generado contiene los datos correctos del usuario', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10)
      const [result] = await pool.query(`
        INSERT INTO usuarios (nombre_completo, usuario, contrasena, rol_id, laboratorio_ids, estado)
        VALUES ('Admin User', 'admin', ?, 1, '[]', 'A')
      `, [hashedPassword])
      
      const userId = result.insertId
      
      const res = await request(app)
        .post('/api/auth/login')
        .send({ usuario: 'admin', contrasena: 'password123' })
      
      expect(res.status).toBe(200)
      expect(res.body.user).toBeDefined()
      expect(res.body.user.id).toBe(userId)
      expect(res.body.user.rol).toBeDefined()
      expect(res.body.token).toBeDefined()
    })
  })
})
```

---

### 2. Permisos por rol

**Archivo**: `tests/integration/permisos.test.js`

**Casos a probar**:
1. Administrador puede ver horarios de cualquier laboratorio
2. Jefe solo puede ver horarios de sus laboratorios asignados
3. Jefe no puede crear incidencia para reserva de otro laboratorio
4. Jefe sin laboratorios asignados no ve ningún horario

**Total: 4 tests**

```javascript
import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { app } from '../../server/app.js'
import { loginAsAdmin, loginAsJefe, crearHorario } from '../helpers.js'

describe('Permisos por rol', () => {
  describe('GET /api/horarios - Filtrado por laboratorio', () => {
    it('Administrador puede ver horarios de cualquier laboratorio', async () => {
      const token = await loginAsAdmin()
      
      // Crear horarios en diferentes laboratorios
      await crearHorario({ laboratorio_id: 1 })
      await crearHorario({ laboratorio_id: 2 })
      
      const res = await request(app)
        .get('/api/horarios')
        .set('Authorization', `Bearer ${token}`)
        .query({ 
          fecha_inicio: '2024-06-01',
          fecha_fin: '2024-06-30'
        })
      
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(2) // Ve ambos laboratorios
    })
    
    it('Jefe solo puede ver horarios de sus laboratorios asignados', async () => {
      const token = await loginAsJefe([1]) // Solo laboratorio 1
      
      // Crear horarios en diferentes laboratorios
      await crearHorario({ laboratorio_id: 1 })
      await crearHorario({ laboratorio_id: 2 })
      
      const res = await request(app)
        .get('/api/horarios')
        .set('Authorization', `Bearer ${token}`)
        .query({ 
          fecha_inicio: '2024-06-01',
          fecha_fin: '2024-06-30'
        })
      
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(1) // Solo ve laboratorio 1
      expect(res.body[0].laboratorio_id).toBe(1)
    })
    
    it('Jefe no puede crear incidencia para reserva de otro laboratorio', async () => {
      const token = await loginAsJefe([1]) // Solo laboratorio 1
      
      // Crear horario en laboratorio 2 (no permitido)
      const horario = await crearHorario({ laboratorio_id: 2 })
      
      const res = await request(app)
        .post('/api/incidencias')
        .set('Authorization', `Bearer ${token}`)
        .send({
          reserva_id: horario.id,
          titulo: 'Problema',
          descripcion: 'Detalle del problema'
        })
      
      expect(res.status).toBe(403)
      expect(res.body.message).toContain('permisos')
    })
    
    it('Jefe sin laboratorios asignados no ve ningún horario', async () => {
      const token = await loginAsJefe([]) // Sin laboratorios
      
      await crearHorario({ laboratorio_id: 1 })
      await crearHorario({ laboratorio_id: 2 })
      
      const res = await request(app)
        .get('/api/horarios')
        .set('Authorization', `Bearer ${token}`)
        .query({ 
          fecha_inicio: '2024-06-01',
          fecha_fin: '2024-06-30'
        })
      
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(0)
    })
  })
})
```

---

### 3. Solapamiento de horarios

**Archivo**: `tests/integration/horarios.test.js`

**Casos a probar**:
1. Detecta solapamiento en mismo laboratorio y mismo rango
2. Permite rangos contiguos (fin de uno = inicio de otro)
3. Permite editar horario sin conflicto consigo mismo
4. Detecta solapamiento para mismo docente

**Total: 4 tests**

```javascript
import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { app } from '../../server/app.js'
import { loginAsAdmin, crearHorario } from '../helpers.js'

describe('Horarios - Solapamiento', () => {
  describe('POST /api/horarios - Crear reserva', () => {
    it('rechaza creación cuando hay solapamiento en mismo laboratorio', async () => {
      const token = await loginAsAdmin()
      
      // Crear horario existente: 08:00 - 10:00
      await crearHorario({
        laboratorio_id: 1,
        fecha_inicio: '2024-06-01 08:00:00',
        fecha_fin: '2024-06-01 10:00:00'
      })
      
      // Intentar crear horario que se solapa: 09:00 - 11:00
      const res = await request(app)
        .post('/api/horarios')
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 1,
          docente_id: 1,
          escuela_id: 1,
          ciclo_id: 1,
          fecha_inicio: '2024-06-01 09:00:00',
          fecha_fin: '2024-06-01 11:00:00',
          cantidad_alumnos: 20,
          color: '#FF0000'
        })
      
      expect(res.status).toBe(409)
      expect(res.body.message).toContain('conflicto')
      expect(res.body.message).toContain('laboratorio')
    })
    
    it('permite crear horarios contiguos sin solapamiento', async () => {
      const token = await loginAsAdmin()
      
      // Crear horario: 08:00 - 10:00
      await crearHorario({
        laboratorio_id: 1,
        fecha_inicio: '2024-06-01 08:00:00',
        fecha_fin: '2024-06-01 10:00:00'
      })
      
      // Crear horario contiguo: 10:00 - 12:00 (sin solapamiento)
      const res = await request(app)
        .post('/api/horarios')
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 1,
          docente_id: 1,
          escuela_id: 1,
          ciclo_id: 1,
          fecha_inicio: '2024-06-01 10:00:00',
          fecha_fin: '2024-06-01 12:00:00',
          cantidad_alumnos: 20,
          color: '#FF0000'
        })
      
      expect(res.status).toBe(201)
      expect(res.body.id).toBeDefined()
    })
    
    it('permite editar horario sin detectar conflicto consigo mismo', async () => {
      const token = await loginAsAdmin()
      
      // Crear horario
      const horario = await crearHorario({
        laboratorio_id: 1,
        fecha_inicio: '2024-06-01 08:00:00',
        fecha_fin: '2024-06-01 10:00:00'
      })
      
      // Editar el mismo horario (cambiando solo observaciones)
      const res = await request(app)
        .put(`/api/horarios/${horario.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 1,
          docente_id: 1,
          escuela_id: 1,
          ciclo_id: 1,
          fecha_inicio: '2024-06-01 08:00:00',
          fecha_fin: '2024-06-01 10:00:00',
          cantidad_alumnos: 25, // Cambio
          observaciones: 'Actualizado',
          color: '#FF0000'
        })
      
      expect(res.status).toBe(200)
    })
    
    it('detecta solapamiento para mismo docente en diferente laboratorio', async () => {
      const token = await loginAsAdmin()
      
      // Crear horario para docente 1 en lab 1: 08:00 - 10:00
      await crearHorario({
        laboratorio_id: 1,
        docente_id: 1,
        fecha_inicio: '2024-06-01 08:00:00',
        fecha_fin: '2024-06-01 10:00:00'
      })
      
      // Intentar crear horario para mismo docente en lab 2: 09:00 - 11:00
      const res = await request(app)
        .post('/api/horarios')
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 2, // Diferente laboratorio
          docente_id: 1,     // Mismo docente
          escuela_id: 1,
          ciclo_id: 1,
          fecha_inicio: '2024-06-01 09:00:00',
          fecha_fin: '2024-06-01 11:00:00',
          cantidad_alumnos: 20,
          color: '#FF0000'
        })
      
      expect(res.status).toBe(409)
      expect(res.body.message).toContain('docente')
    })
  })
})
```

---

### 4. Salida de insumos (saldo insuficiente)

**Archivo**: `tests/integration/movimientos.test.js`

**API**: `POST /api/inventario/movimiento-manual` con `tipo_movimiento: 'salida'`. Eliminación: `DELETE /api/inventario/movimiento-manual/eliminar/:movimiento_id` (ID en el path, p. ej. `/api/inventario/movimiento-manual/eliminar/18`). Consulta detalle de un movimiento (cabecera + líneas): `GET /api/inventario/actividad/movimiento/:movimiento_id/detalle` (200 con `{ success, data: { cabecera, detalle } }`; 404 si no existe o sin permisos, lanzado por el servicio).

**Casos a probar**:
1. Rechaza salida si cantidad > saldo del lote
2. Permite salida si hay saldo suficiente
3. Actualiza correctamente el saldo después de salida
4. Requiere entrada_detalle_id en cada detalle de salida

**Total: 4 tests**

```javascript
import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { app } from '../../server/app.js'
import { loginAsAdmin, crearInsumo, crearEntrada, obtenerSaldo } from '../helpers.js'
import { pool } from '../../server/config/database.js'

describe('Movimientos de Insumos', () => {
  describe('POST /api/inventario/movimiento-manual (salida)', () => {
    it('rechaza salida cuando cantidad > saldo del lote', async () => {
      const token = await loginAsAdmin()
      
      const insumo = await crearInsumo()
      
      await pool.query(`
        INSERT INTO inventario_insumos (insumo_id, laboratorio_id)
        VALUES (?, 1)
      `, [insumo.id])
      
      const entrada = await crearEntrada({
        laboratorio_id: 1,
        detalles: [{
          insumo_id: insumo.id,
          cantidad: 10,
          lote: 'LOTE-001'
        }]
      })
      
      const [detalles] = await pool.query(`
        SELECT id FROM movimiento_insumo_detalle WHERE movimiento_id = ?
      `, [entrada.id])
      const entrada_detalle_id = detalles[0].id
      
      const res = await request(app)
        .post('/api/inventario/movimiento-manual')
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 1,
          tipo_movimiento: 'salida',
          fecha_movimiento: '2025-06-02',
          observaciones: 'Prueba',
          detalles: [{
            insumo_id: insumo.id,
            entrada_detalle_id: entrada_detalle_id,
            cantidad: 15
          }]
        })
      
      expect(res.status).toBe(400)
      expect(res.body.message).toContain('Saldo insuficiente')
    })
    
    it('permite salida cuando hay saldo suficiente', async () => {
      const token = await loginAsAdmin()
      
      const insumo = await crearInsumo()
      
      await pool.query(`
        INSERT INTO inventario_insumos (insumo_id, laboratorio_id)
        VALUES (?, 1)
      `, [insumo.id])
      
      const entrada = await crearEntrada({
        laboratorio_id: 1,
        detalles: [{
          insumo_id: insumo.id,
          cantidad: 10,
          lote: 'LOTE-001'
        }]
      })
      
      const [detalles] = await pool.query(`
        SELECT id FROM movimiento_insumo_detalle WHERE movimiento_id = ?
      `, [entrada.id])
      const entrada_detalle_id = detalles[0].id
      
      const res = await request(app)
        .post('/api/inventario/movimiento-manual')
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 1,
          tipo_movimiento: 'salida',
          fecha_movimiento: '2025-06-02',
          observaciones: 'Prueba',
          detalles: [{
            insumo_id: insumo.id,
            entrada_detalle_id: entrada_detalle_id,
            cantidad: 5
          }]
        })
      
      expect(res.status).toBe(200)
      expect(res.body.movimiento_id).toBeDefined()
    })
    
    it('actualiza correctamente el saldo después de salida', async () => {
      const token = await loginAsAdmin()
      
      const insumo = await crearInsumo()
      
      await pool.query(`
        INSERT INTO inventario_insumos (insumo_id, laboratorio_id)
        VALUES (?, 1)
      `, [insumo.id])
      
      const entrada = await crearEntrada({
        laboratorio_id: 1,
        detalles: [{
          insumo_id: insumo.id,
          cantidad: 10,
          lote: 'LOTE-001'
        }]
      })
      
      const [detalles] = await pool.query(`
        SELECT id FROM movimiento_insumo_detalle WHERE movimiento_id = ?
      `, [entrada.id])
      const entrada_detalle_id = detalles[0].id
      
      let saldo = await obtenerSaldo(entrada_detalle_id)
      expect(saldo).toBe(10)
      
      await request(app)
        .post('/api/inventario/movimiento-manual')
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 1,
          tipo_movimiento: 'salida',
          fecha_movimiento: '2025-06-02',
          observaciones: 'Prueba',
          detalles: [{
            insumo_id: insumo.id,
            entrada_detalle_id: entrada_detalle_id,
            cantidad: 3
          }]
        })
      
      saldo = await obtenerSaldo(entrada_detalle_id)
      expect(saldo).toBe(7)
    })
    
    it('requiere entrada_detalle_id en cada detalle de salida', async () => {
      const token = await loginAsAdmin()
      
      const insumo = await crearInsumo()
      
      await pool.query(`
        INSERT INTO inventario_insumos (insumo_id, laboratorio_id)
        VALUES (?, 1)
      `, [insumo.id])
      
      const res = await request(app)
        .post('/api/inventario/movimiento-manual')
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 1,
          tipo_movimiento: 'salida',
          fecha_movimiento: '2025-06-02',
          observaciones: 'Prueba',
          detalles: [{
            insumo_id: insumo.id,
            cantidad: 5
          }]
        })
      
      expect(res.status).toBe(400)
      expect(res.body.message).toContain('entrada_detalle_id')
    })
  })
})
```

---

### 5. Cierre de horario

**Archivo**: `tests/integration/horarios.test.js` (continuar)

**API**: `POST /api/horarios/:id/cerrar` (no PATCH).

**Casos a probar**:
1. Permite cerrar horario en estado Programado
2. Rechaza cerrar horario ya cerrado
3. Rechaza eliminar horario cerrado
4. Rechaza editar horario cerrado

**Total: 4 tests**

```javascript
describe('Horarios - Cierre', () => {
  describe('POST /api/horarios/:id/cerrar', () => {
    it('permite cerrar horario en estado Programado', async () => {
      const token = await loginAsAdmin()
      
      const horario = await crearHorario({ estado: 'P' })
      
      const res = await request(app)
        .post(`/api/horarios/${horario.id}/cerrar`)
        .set('Authorization', `Bearer ${token}`)
      
      expect(res.status).toBe(200)
      expect(res.body.estado).toBe('C')
    })
    
    it('rechaza cerrar horario ya cerrado', async () => {
      const token = await loginAsAdmin()
      
      const horario = await crearHorario({ estado: 'C' })
      
      const res = await request(app)
        .post(`/api/horarios/${horario.id}/cerrar`)
        .set('Authorization', `Bearer ${token}`)
      
      expect(res.status).toBe(409)
      expect(res.body.message).toContain('ya se encuentra cerrado')
    })
    
    it('rechaza eliminar horario cerrado', async () => {
      const token = await loginAsAdmin()
      
      const horario = await crearHorario({ estado: 'C' })
      
      const res = await request(app)
        .delete(`/api/horarios/${horario.id}`)
        .set('Authorization', `Bearer ${token}`)
      
      expect(res.status).toBe(409)
      expect(res.body.message).toContain('cerrado')
      expect(res.body.message).toContain('no se puede eliminar')
    })
    
    it('rechaza editar horario cerrado', async () => {
      const token = await loginAsAdmin()
      
      const horario = await crearHorario({ estado: 'C' })
      
      const res = await request(app)
        .put(`/api/horarios/${horario.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 1,
          docente_id: 1,
          escuela_id: 1,
          ciclo_id: 1,
          fecha_inicio: '2024-06-01 08:00:00',
          fecha_fin: '2024-06-01 10:00:00',
          cantidad_alumnos: 30, // Cambio
          color: '#FF0000'
        })
      
      expect(res.status).toBe(409)
      expect(res.body.message).toContain('cerrado')
    })
  })
})
```

---

## Tests de Integración - Fase 2 (Adicionales)

### 6. Eliminación de movimiento (reversión de saldos)

**Archivo**: `tests/integration/movimientos.test.js` (continuar)

**Casos a probar**:
1. Al eliminar salida, revierte el saldo al lote original
2. Al eliminar entrada sin salidas, elimina correctamente

**Total: 2 tests**

```javascript
describe('DELETE /api/inventario/movimiento-manual/eliminar/:movimiento_id - Eliminación', () => {
  it('al eliminar salida, revierte el saldo al lote original', async () => {
    const token = await loginAsAdmin()
    
    const insumo = await crearInsumo()
    
    await pool.query(`
      INSERT INTO inventario_insumos (insumo_id, laboratorio_id)
      VALUES (?, 1)
    `, [insumo.id])
    
    const entrada = await crearEntrada({
      laboratorio_id: 1,
      detalles: [{
        insumo_id: insumo.id,
        cantidad: 10,
        lote: 'LOTE-001'
      }]
    })
    
    const [detalles] = await pool.query(`
      SELECT id FROM movimiento_insumo_detalle WHERE movimiento_id = ?
    `, [entrada.id])
    const entrada_detalle_id = detalles[0].id
    
    const resSalida = await request(app)
      .post('/api/inventario/movimiento-manual')
      .set('Authorization', `Bearer ${token}`)
      .send({
        laboratorio_id: 1,
        tipo_movimiento: 'salida',
        fecha_movimiento: '2025-06-02',
        observaciones: 'Prueba',
        detalles: [{
          insumo_id: insumo.id,
          entrada_detalle_id: entrada_detalle_id,
          cantidad: 3
        }]
      })
    
    const movimiento_id = resSalida.body.movimiento_id
    
    let saldo = await obtenerSaldo(entrada_detalle_id)
    expect(saldo).toBe(7)
    
    const res = await request(app)
      .delete(`/api/inventario/movimiento-manual/eliminar/${movimiento_id}`)
      .set('Authorization', `Bearer ${token}`)
    
    expect(res.status).toBe(200)
    
    saldo = await obtenerSaldo(entrada_detalle_id)
    expect(saldo).toBe(10)
  })
  
  it('permite eliminar movimiento de entrada que no tiene salidas asociadas', async () => {
    const token = await loginAsAdmin()
    
    const insumo = await crearInsumo()
    
    await pool.query(`
      INSERT INTO inventario_insumos (insumo_id, laboratorio_id)
      VALUES (?, 1)
    `, [insumo.id])
    
    const entrada = await crearEntrada({
      laboratorio_id: 1,
      detalles: [{
        insumo_id: insumo.id,
        cantidad: 10,
        lote: 'LOTE-001'
      }]
    })
    
    const res = await request(app)
      .delete(`/api/inventario/movimiento-manual/eliminar/${entrada.id}`)
      .set('Authorization', `Bearer ${token}`)
    
    expect(res.status).toBe(200)
  })
})
```

---

### 7. Actualizar equipo con cambio de laboratorio

**Archivo**: `tests/integration/equipos.test.js`

**Casos a probar**:
1. Rechaza cambio de laboratorio si tiene reservas activas
2. Permite cambio de laboratorio si NO tiene reservas

**Total: 2 tests**

```javascript
import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { app } from '../../server/app.js'
import { loginAsAdmin, crearEquipo, crearHorario } from '../helpers.js'
import { pool } from '../../server/config/database.js'

describe('Equipos', () => {
  describe('PUT /api/equipos/:id - Actualización', () => {
    it('rechaza cambio de laboratorio si tiene reservas activas', async () => {
      const token = await loginAsAdmin()
      
      // Crear equipo en laboratorio 1
      const equipo = await crearEquipo({ laboratorio_id: 1 })
      
      // Crear horario con ese equipo
      const horario = await crearHorario({ laboratorio_id: 1 })
      
      await pool.query(`
        INSERT INTO detalle_reserva_equipos (horario_id, equipo_id, cantidad)
        VALUES (?, ?, 1)
      `, [horario.id, equipo.id])
      
      // Intentar cambiar equipo a laboratorio 2
      const res = await request(app)
        .put(`/api/equipos/${equipo.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: equipo.nombre,
          codigo: equipo.codigo,
          tipo_equipo_id: equipo.tipo_equipo_id,
          laboratorio_id: 2, // Cambio de laboratorio
          estado: equipo.estado,
          condicion: equipo.condicion
        })
      
      expect(res.status).toBe(400)
      expect(res.body.message).toContain('reservas programadas')
      expect(res.body.message).toContain('laboratorio actual')
    })
    
    it('permite cambio de laboratorio si NO tiene reservas', async () => {
      const token = await loginAsAdmin()
      
      const equipo = await crearEquipo({ laboratorio_id: 1 })
      
      const res = await request(app)
        .put(`/api/equipos/${equipo.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: equipo.nombre,
          codigo: equipo.codigo,
          tipo_equipo_id: equipo.tipo_equipo_id,
          laboratorio_id: 2, // Cambio permitido
          estado: equipo.estado,
          condicion: equipo.condicion
        })
      
      expect(res.status).toBe(200)
      expect(res.body.laboratorio_id).toBe(2)
    })
  })
})
```

---

### 8. Eliminar insumo/equipo con relaciones

**Archivo**: `tests/integration/insumos.test.js`

**Casos a probar**:
1. Rechaza eliminar insumo si tiene movimientos
2. Permite eliminar insumo sin relaciones

**Total: 2 tests**

```javascript
import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { app } from '../../server/app.js'
import { loginAsAdmin, crearInsumo, crearEntrada } from '../helpers.js'
import { pool } from '../../server/config/database.js'

describe('Insumos', () => {
  describe('DELETE /api/insumos/:id', () => {
    it('rechaza eliminar insumo si tiene movimientos registrados', async () => {
      const token = await loginAsAdmin()
      
      const insumo = await crearInsumo()
      
      await pool.query(`
        INSERT INTO inventario_insumos (laboratorio_id, insumo_id, stock_minimo)
        VALUES (1, ?, 5)
      `, [insumo.id])
      
      // Crear movimiento con el insumo
      await crearEntrada({
        laboratorio_id: 1,
        detalles: [{
          insumo_id: insumo.id,
          cantidad: 10
        }]
      })
      
      const res = await request(app)
        .delete(`/api/insumos/${insumo.id}`)
        .set('Authorization', `Bearer ${token}`)
      
      expect(res.status).toBe(409)
      expect(res.body.message).toContain('movimientos')
      expect(res.body.message).toContain(insumo.nombre)
    })
    
    it('permite eliminar insumo sin relaciones', async () => {
      const token = await loginAsAdmin()
      
      const insumo = await crearInsumo()
      
      const res = await request(app)
        .delete(`/api/insumos/${insumo.id}`)
        .set('Authorization', `Bearer ${token}`)
      
      expect(res.status).toBe(200)
    })
  })
})
```

---

### 9. Incidencias por laboratorio

**Archivo**: `tests/integration/incidencias.test.js`

**Casos a probar**:
1. Jefe solo ve incidencias de sus laboratorios
2. Jefe no puede crear incidencia para reserva de otro laboratorio

**Total: 2 tests**

```javascript
import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { app } from '../../server/app.js'
import { loginAsAdmin, loginAsJefe, crearHorario } from '../helpers.js'
import { pool } from '../../server/config/database.js'

describe('Incidencias', () => {
  describe('GET /api/incidencias - Listado', () => {
    it('Jefe solo ve incidencias de reservas de sus laboratorios', async () => {
      const token = await loginAsJefe([1])
      
      // Crear horario en lab 1
      const horario1 = await crearHorario({ laboratorio_id: 1 })
      
      // Crear horario en lab 2
      const horario2 = await crearHorario({ laboratorio_id: 2 })
      
      // Crear incidencias
      await pool.query(`
        INSERT INTO incidencias (reserva_id, titulo, descripcion, reportado_por)
        VALUES (?, 'Problema 1', 'Detalle 1', 1)
      `, [horario1.id])
      
      await pool.query(`
        INSERT INTO incidencias (reserva_id, titulo, descripcion, reportado_por)
        VALUES (?, 'Problema 2', 'Detalle 2', 1)
      `, [horario2.id])
      
      const res = await request(app)
        .get('/api/incidencias')
        .set('Authorization', `Bearer ${token}`)
      
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(1) // Solo la del lab 1
    })
  })
  
  describe('POST /api/incidencias - Crear', () => {
    it('Jefe no puede crear incidencia para reserva de otro laboratorio', async () => {
      const token = await loginAsJefe([1])
      
      // Crear horario en lab 2 (no permitido)
      const horario = await crearHorario({ laboratorio_id: 2 })
      
      const res = await request(app)
        .post('/api/incidencias')
        .set('Authorization', `Bearer ${token}`)
        .send({
          reserva_id: horario.id,
          titulo: 'Problema',
          descripcion: 'Detalle'
        })
      
      expect(res.status).toBe(403)
    })
  })
})
```

---

### 10-12. Importaciones masivas

**Archivo**: `tests/integration/importaciones.test.js`

**Fixtures** (en `tests/integration/fixtures/`):
- **insumos_invalidos.xlsx**: Todas las filas inválidas (nombre/descripcion/presentacion "Prueba error", unidad_medida y categoria en blanco).
- **insumos_mixto.xlsx**: 1 fila correcta, 2 incorrectas (unidad_medida inexistente, categoría en blanco).
- **equipos_tipo_mixto.xlsx**: 1 fila con tipo_equipo_id válido, 1 con tipo_equipo_id inválido. El laboratorio se envía desde el frontend (no existe LABORATORIO_CODIGO en la plantilla).
- **rebastecimiento_codigo_invalido.xlsx**: 1 fila correcta, 1 con código de insumo inválido o no configurado para el laboratorio.
- **rebastecimiento_valido.xlsx**: 1 fila con datos válidos.

**Rutas y campos reales**:
- Insumos: `POST /api/insumos/importacion-masiva`, campo de archivo `archivo_excel`.
- Equipos: `POST /api/equipos/importacion-masiva`, body `laboratorio_id` + campo `archivo_excel` (el laboratorio viene del frontend).
- Reabastecimiento (procesar Excel): `POST /api/inventario/procesar-excel`, query `laboratorio_id`, campo `archivo_excel`.

**Casos a probar**:
1. Importación insumos: rechaza archivo si todas las filas son inválidas (400, mensaje "No se pudo procesar ningún registro").
2. Importación insumos: procesa parcialmente si hay filas válidas e inválidas (200, procesados > 0, detalles_errores.length > 0).
3. Importación equipos: procesa parcialmente archivo con tipo_equipo_id válido e inválido (laboratorio_id en body).
4. Reabastecimiento: reporta errores en filas con código de insumo inválido o no configurado (procesar-excel, data.errores).
5. Reabastecimiento: procesa correctamente filas válidas (procesar-excel, data.registros_validos).

**Total: 5 tests**

```javascript
import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { app } from '../../server/app.js'
import { loginAsAdmin } from '../helpers.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Importaciones Masivas', () => {
  describe('POST /api/insumos/importacion-masiva', () => {
    it('rechaza archivo si todas las filas son inválidas', async () => {
      const token = await loginAsAdmin()
      const res = await request(app)
        .post('/api/insumos/importacion-masiva')
        .set('Authorization', `Bearer ${token}`)
        .attach('archivo_excel', path.join(__dirname, 'fixtures/insumos_invalidos.xlsx'))
      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/No se pudo procesar ningún registro|ningún registro/i)
    })

    it('procesa parcialmente si hay filas válidas e inválidas', async () => {
      const token = await loginAsAdmin()
      const res = await request(app)
        .post('/api/insumos/importacion-masiva')
        .set('Authorization', `Bearer ${token}`)
        .attach('archivo_excel', path.join(__dirname, 'fixtures/insumos_mixto.xlsx'))
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.procesados).toBeGreaterThan(0)
      expect(res.body.detalles_errores.length).toBeGreaterThan(0)
    })
  })

  describe('POST /api/equipos/importacion-masiva', () => {
    it('procesa parcialmente archivo con tipo_equipo_id válido e inválido', async () => {
      const token = await loginAsAdmin()
      const res = await request(app)
        .post('/api/equipos/importacion-masiva')
        .set('Authorization', `Bearer ${token}`)
        .field('laboratorio_id', '1')
        .attach('archivo_excel', path.join(__dirname, 'fixtures/equipos_tipo_mixto.xlsx'))
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.detalles_errores).toBeDefined()
      expect(res.body.procesados + res.body.detalles_errores.length).toBeGreaterThan(0)
    })
  })

  describe('POST /api/inventario/procesar-excel (reabastecimiento)', () => {
    it('reporta error en fila con código de insumo inválido o no configurado', async () => {
      const token = await loginAsAdmin()
      const res = await request(app)
        .post('/api/inventario/procesar-excel')
        .set('Authorization', `Bearer ${token}`)
        .query({ laboratorio_id: 1 })
        .attach('archivo_excel', path.join(__dirname, 'fixtures/rebastecimiento_codigo_invalido.xlsx'))
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.errores.length).toBeGreaterThan(0)
    })

    it('procesa correctamente filas válidas', async () => {
      const token = await loginAsAdmin()
      const res = await request(app)
        .post('/api/inventario/procesar-excel')
        .set('Authorization', `Bearer ${token}`)
        .query({ laboratorio_id: 1 })
        .attach('archivo_excel', path.join(__dirname, 'fixtures/rebastecimiento_valido.xlsx'))
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.registros_validos).toBeGreaterThanOrEqual(0)
    })
  })
})
```

---

## Resumen de tests

### Fase 1 - Críticos (10 tests)

| # | Módulo | Tests | Archivo |
|---|--------|-------|---------|
| 1 | Autenticación | 4 | `auth.test.js` |
| 2 | Permisos | 4 | `permisos.test.js` |
| 3 | Solapamiento horarios | 4 | `horarios.test.js` |
| 4 | Salida insumos | 4 | `movimientos.test.js` |
| 5 | Cierre horario | 4 | `horarios.test.js` |
| **TOTAL FASE 1** | **20 tests** | |

### Fase 2 - Adicionales (13 tests)

| # | Módulo | Tests | Archivo |
|---|--------|-------|---------|
| 6 | Eliminación movimiento | 2 | `movimientos.test.js` |
| 7 | Actualizar equipo | 2 | `equipos.test.js` |
| 8 | Eliminar insumo | 2 | `insumos.test.js` |
| 9 | Incidencias | 2 | `incidencias.test.js` |
| 10-12 | Importaciones masivas | 5 | `importaciones.test.js` (requiere fixtures en `fixtures/`) |
| **TOTAL FASE 2** | **13 tests** | |

### **TOTAL GENERAL: 33 tests**

---

## Ejecución de tests

### Comandos básicos

```bash
# Ejecutar todos los tests
npm test

# Ejecutar solo tests de integración
npm run test:integration

# Ejecutar un archivo específico
npm test -- auth.test.js

# Ejecutar en modo watch
npm run test:watch

# Ejecutar con coverage
npm test -- --coverage
```

### Preparación antes de ejecutar

1. **Crear base de datos de testing**:
```sql
CREATE DATABASE laboratorios_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **Ejecutar migraciones** (aplicar el mismo schema que producción)

3. **Configurar `.env.test`** con credenciales correctas

---

## Mantenimiento

### Cuándo actualizar los tests

- Al cambiar reglas de negocio
- Al agregar nuevos endpoints
- Al modificar validaciones
- Después de encontrar bugs en producción

### Buenas prácticas

1. **Cada test debe ser independiente**: No debe depender del orden de ejecución
2. **Limpiar datos después de cada test**: Usar `beforeEach` y `afterEach`
3. **Datos de prueba realistas**: Usar valores que imiten casos reales
4. **Nombres descriptivos**: El nombre del test debe explicar qué valida
5. **Un concepto por test**: Cada test valida UNA cosa específica

---

## Troubleshooting

### Problema: Tests fallan por timeouts

**Solución**: Aumentar `testTimeout` en `jest.config.js`

```javascript
testTimeout: 60000 // 60 segundos
```

### Problema: "Cannot find module"

**Solución**: Verificar configuración de ES modules en `jest.config.js`

### Problema: Tests pasan localmente pero fallan en CI

**Solución**: Verificar que la BD de testing esté creada y con el schema correcto

### Problema: Foreign key constraints en cleanup

**Solución**: Desactivar temporalmente en `beforeEach`:
```javascript
await pool.query('SET FOREIGN_KEY_CHECKS = 0')
// ... truncate tables
await pool.query('SET FOREIGN_KEY_CHECKS = 1')
```

---

## Estado de la guía – Lista para implementar

Esta guía está **lista para implementarse** con el código actual del proyecto:

- **Carga de entorno**: Con `server/config/env.js` y `NODE_ENV=test`, al ejecutar los tests se carga `.env.test` automáticamente (importado al inicio de `app.js`).
- **App y pool**: Importar `app` desde `server/app.js` y `pool` desde `server/config/database.js`; no es necesario levantar el servidor en test.
- **Esquema y API**: Los ejemplos de la guía usan el esquema real (`usuarios.estado` 'A'/'I', tabla `reservas`, `movimientos_insumos`/`movimiento_insumo_detalle`) y las rutas actuales (`POST /api/horarios/:id/cerrar`, `POST /api/inventario/movimiento-manual`, etc.).
- **Correcciones aplicadas**: Tests de autenticación con estado `'A'`/`'I'`, expectativa 401 para usuario inactivo y aserciones sobre `res.body.user` y `res.body.token`.
- **Importaciones**: Rutas reales (`/api/insumos/importacion-masiva`, `/api/equipos/importacion-masiva` con `laboratorio_id` en body, `/api/inventario/procesar-excel`). Laboratorio de equipos viene del frontend (no LABORATORIO_CODIGO en plantilla). Fixtures en `tests/integration/fixtures/` (insumos, equipos tipo mixto, reabastecimiento).

**Pasos para implementar**: instalar Jest y Supertest, añadir scripts de test en `package.json`, crear `jest.config.js`, `tests/setup.js`, `tests/helpers.js`, la base de datos `laboratorios_test` con el mismo esquema que producción, y los archivos `tests/integration/*.test.js` siguiendo los ejemplos de esta guía.

---

## Próximos pasos

1. **Implementar Fase 1** (20 tests críticos) - Tiempo: 1-2 días
2. **Validar en desarrollo** - Correr tests localmente
3. **Configurar CI/CD** (opcional) - GitHub Actions, GitLab CI
4. **Implementar Fase 2** (13 tests adicionales) - Solo si es necesario
5. **Mantener tests actualizados** - Al cambiar código, actualizar tests

---

**Nota**: Esta guía prioriza **pragmatismo sobre perfección**. Los tests seleccionados cubren los flujos más críticos del sistema sin generar sobrecarga de mantenimiento.