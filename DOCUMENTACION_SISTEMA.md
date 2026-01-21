# Documentación Técnica del Sistema de Gestión de Laboratorios

## Índice
1. [Arquitectura y Patrones de Diseño](#1-arquitectura-y-patrones-de-diseño)
2. [Lógica de Funcionamiento / Flujo de Negocio](#2-lógica-de-funcionamiento--flujo-de-negocio)

---

# 1. ARQUITECTURA Y PATRONES DE DISEÑO
## Enfoque Técnico para Debugging

### 1.1 Tipo de Arquitectura

**Arquitectura en Capas (Layered Architecture) con separación Frontend/Backend**

El sistema implementa una arquitectura en capas clásica con separación clara entre:

- **Frontend (Cliente)**: Aplicación React + TypeScript con Vite
- **Backend (Servidor)**: API REST con Express.js
- **Base de Datos**: MySQL con pool de conexiones

**Estructura de Capas del Backend:**
```
┌─────────────────────────────────────┐
│   Routes (Rutas HTTP)                │  ← Punto de entrada HTTP
├─────────────────────────────────────┤
│   Middleware (Validación/Auth)       │  ← Validación, Autenticación, Autorización
├─────────────────────────────────────┤
│   Controllers (Lógica de Negocio)   │  ← Orquestación de operaciones
├─────────────────────────────────────┤
│   Models (Acceso a Datos)           │  ← Abstracción de base de datos
├─────────────────────────────────────┤
│   Database (MySQL Pool)              │  ← Persistencia
└─────────────────────────────────────┘
```

**Estructura del Frontend:**
```
┌─────────────────────────────────────┐
│   Pages (Vistas Principales)        │  ← Componentes de página
├─────────────────────────────────────┤
│   Components (Componentes UI)      │  ← Componentes reutilizables
├─────────────────────────────────────┤
│   Services (Llamadas API)           │  ← Comunicación con backend
├─────────────────────────────────────┤
│   Context (Estado Global)           │  ← Gestión de estado (Auth)
├─────────────────────────────────────┤
│   Hooks (Lógica Reutilizable)       │  ← Custom hooks
└─────────────────────────────────────┘
```

### 1.2 Patrones de Diseño Utilizados

#### 1.2.1 Patrón Repository (Modelos)
**Ubicación**: `server/models/`

Cada modelo actúa como un repositorio que encapsula el acceso a datos:
- **Propósito**: Centralizar consultas SQL y abstraer la base de datos
- **Ejemplo**: `Inventario.js`, `Horario.js`, `Insumo.js`
- **Ventaja para debugging**: Todas las consultas SQL están centralizadas, facilitando la identificación de problemas de rendimiento

```javascript
// Ejemplo: server/models/Inventario.js
export const Inventario = {
  getInsumosConSaldo: async (laboratorio_id) => {
    // Lógica de consulta centralizada
  },
  getLotesConSaldo: async (laboratorio_id, insumo_id) => {
    // Otra consulta relacionada
  }
}
```

#### 1.2.2 Patrón Middleware Chain (Express)
**Ubicación**: `server/routes/*.js`

Cada ruta aplica una cadena de middlewares:
1. `authenticateToken` - Verifica JWT
2. `authorize(action, resource)` - Verifica permisos (CASL)
3. `validate(schema)` - Valida entrada con Zod
4. `controller` - Ejecuta lógica de negocio

**Ejemplo de cadena**:
```javascript
router.post('/',
  authenticateToken,        // 1. Autenticación
  authorize('create', 'Insumo'),  // 2. Autorización
  validate(createInsumoSchema),  // 3. Validación
  createInsumo            // 4. Controlador
)
```

**Punto crítico para debugging**: Si una petición falla, revisar en orden:
1. ¿Token válido? → `authenticateToken`
2. ¿Tiene permisos? → `authorize`
3. ¿Datos válidos? → `validate`
4. ¿Error en lógica? → `controller`

#### 1.2.3 Patrón Service Layer (Frontend)
**Ubicación**: `src/services/*.ts`

Cada servicio encapsula las llamadas API a un recurso específico:
- **Propósito**: Centralizar comunicación HTTP y manejo de errores
- **Ejemplo**: `insumoService.ts`, `horarioService.ts`, `inventarioService.ts`
- **Ventaja**: Interceptores de Axios centralizados para logging y manejo de errores

#### 1.2.4 Patrón Context Provider (React)
**Ubicación**: `src/context/authContext.tsx`

- **Propósito**: Gestión global del estado de autenticación
- **Implementación**: React Context API
- **Almacenamiento**: localStorage para persistencia

#### 1.2.5 Patrón Lazy Loading (React)
**Ubicación**: `src/App.tsx`

- **Propósito**: Carga bajo demanda de componentes de página
- **Implementación**: `React.lazy()` + `Suspense`
- **Beneficio**: Reduce bundle inicial, mejora tiempo de carga

#### 1.2.6 Patrón RBAC (Role-Based Access Control)
**Ubicación**: `server/abilities/defineAbilities.js`

- **Librería**: CASL (Isomorphic Authorization)
- **Roles**: Administrador, Jefe de Laboratorio
- **Recursos**: Horario, Inventario, Equipo, Insumo, etc.
- **Implementación**: Middleware `authorize` verifica permisos antes de ejecutar controladores

### 1.3 Componentes, Módulos y Dependencias

#### 1.3.1 Stack Tecnológico

**Backend:**
- **Runtime**: Node.js (>=20.0.0)
- **Framework**: Express.js 5.1.0
- **Base de Datos**: MySQL 2 (mysql2 3.14.2) con connection pooling
- **Autenticación**: JWT (jsonwebtoken 9.0.2)
- **Validación**: Zod 4.1.12
- **Autorización**: CASL (@casl/ability 6.7.3)
- **Seguridad**: bcryptjs 3.0.2, express-rate-limit 8.2.1
- **Archivos**: multer 2.0.2, xlsx 0.18.5

**Frontend:**
- **Framework**: React 19.1.0
- **Lenguaje**: TypeScript 5.8.3
- **Build Tool**: Vite 7.0.4
- **UI Library**: Material-UI (@mui/material 7.2.0)
- **Routing**: React Router DOM 7.7.1
- **HTTP Client**: Axios 1.10.0
- **Fechas**: dayjs 1.11.13, date-fns 4.1.0
- **Calendario**: react-big-calendar 1.19.4
- **Gráficos**: recharts 3.2.1
- **Exportación**: jspdf 3.0.1, html2canvas 1.4.1

#### 1.3.2 Módulos del Backend

**Estructura de Directorios:**
```
server/
├── abilities/          # Definición de permisos (CASL)
├── config/            # Configuración (DB, variables)
├── controllers/       # Lógica de negocio (18 controladores)
├── middleware/        # Auth, autorización, rate limiting, validación
├── models/            # Acceso a datos (14 modelos)
├── routes/            # Definición de rutas HTTP (18 rutas)
├── utils/             # Utilidades (conversión de fechas, etc.)
└── validations/       # Schemas Zod (12 schemas)
    └── schemas/       # Schemas por recurso
```

**Controladores Principales:**
- `authController.js` - Autenticación y gestión de usuarios
- `insumoController.js` - CRUD insumos, importación masiva
- `inventarioController.js` - Gestión de stock, movimientos, lotes
- `horarioController.js` - Reservas de laboratorios, validación de cruces
- `equipoController.js` - CRUD equipos, mantenimiento
- `incidenciaController.js` - Reportes de incidencias
- `reporteController.js` - Generación de reportes
- `dashboardController.js` - Estadísticas y métricas

**Modelos Principales:**
- `Inventario.js` - Consultas complejas de stock, lotes, movimientos
- `Horario.js` - Reservas, cruces de horarios, actividad
- `Insumo.js` - CRUD insumos, validación de relaciones
- `Equipo.js` - Gestión de equipos, estados
- `User.js` - Autenticación, permisos, laboratorios asignados
- `Laboratorio.js` - CRUD laboratorios, configuración de insumos

#### 1.3.3 Módulos del Frontend

**Estructura de Directorios:**
```
src/
├── components/         # Componentes React organizados por módulo
│   ├── Common/        # Componentes compartidos
│   ├── Configuracion/ # 16 componentes de configuración
│   ├── Dashboard/     # Componentes del dashboard
│   ├── Equipos/       # 4 componentes de equipos
│   ├── Horarios/      # 11 componentes de horarios
│   ├── Insumos/       # 6 componentes de insumos
│   ├── Incidencias/   # 3 componentes de incidencias
│   ├── Reportes/      # 12 componentes de reportes
│   └── Share/         # Enlaces compartidos
├── pages/             # Páginas principales (lazy loaded)
├── services/          # Servicios API (20 servicios)
├── context/           # Context providers (Auth)
├── hooks/             # Custom hooks
├── config/            # Configuración (environment)
└── utils/             # Utilidades
```

**Servicios Principales:**
- `api.ts` - Configuración base de Axios, interceptores
- `authService.ts` - Login, logout, gestión de sesión
- `insumoService.ts` - Operaciones con insumos
- `inventarioService.ts` - Stock, movimientos, lotes
- `horarioService.ts` - Reservas, calendario
- `reporteService.ts` - Generación de reportes

### 1.4 Flujo Técnico Interno

#### 1.4.1 Flujo de una Petición HTTP (Backend)

```
1. Cliente HTTP (Frontend)
   ↓
2. Express Router (server/routes/*.js)
   ↓
3. Rate Limiter Middleware (server/middleware/rateLimiter.js)
   - Limita peticiones por IP
   - Retorna 429 si excede límite
   ↓
4. CORS Middleware (server/index.js)
   - Permite peticiones desde frontend
   ↓
5. Authenticate Token Middleware (server/middleware/auth.js)
   - Extrae JWT del header Authorization
   - Verifica firma con JWT_SECRET
   - Decodifica y agrega req.user
   - Retorna 401 si token inválido/expirado
   ↓
6. Authorize Middleware (server/middleware/authorize.js)
   - Usa CASL para verificar permisos
   - Si es "Jefe de Laboratorio", verifica laboratorio_ids
   - Retorna 403 si no tiene permisos
   ↓
7. Validate Middleware (server/validations/middleware.js)
   - Valida req.body, req.params, req.query con Zod
   - Transforma tipos (string → number, etc.)
   - Retorna 400 con errores detallados si falla
   ↓
8. Controller (server/controllers/*.js)
   - Ejecuta lógica de negocio
   - Llama a modelos para acceso a datos
   - Maneja transacciones si es necesario
   - Retorna respuesta JSON
   ↓
9. Model (server/models/*.js)
   - Ejecuta consultas SQL
   - Usa connection pool
   - Retorna datos procesados
   ↓
10. Database (MySQL)
    - Ejecuta query
    - Retorna resultados
```

#### 1.4.2 Flujo de una Petición HTTP (Frontend)

```
1. Componente React
   ↓
2. Service (src/services/*.ts)
   - Construye URL con baseURL
   - Agrega token JWT automáticamente (interceptor)
   ↓
3. Axios Interceptor Request (src/services/api.ts)
   - Lee token de localStorage
   - Agrega header Authorization: Bearer {token}
   ↓
4. HTTP Request (Axios)
   ↓
5. Axios Interceptor Response (src/services/api.ts)
   - Si éxito (200-299): retorna response
   - Si error (400-599):
     * Enriquece error con flags (isUnauthorized, isValidationError, etc.)
     * Loggea error con detalles
     * Retorna Promise.reject(error)
   ↓
6. Manejo de Error en Componente
   - Captura error
   - Muestra mensaje al usuario
   - Redirige a login si isUnauthorized
```

#### 1.4.3 Flujo de Autenticación

```
1. Usuario ingresa credenciales (Login.tsx)
   ↓
2. authService.login() envía POST /api/auth/login
   ↓
3. authController.login() (Backend)
   - Valida credenciales con User.findByCredentials()
   - Compara password con bcrypt
   - Genera JWT con user data (id, rol, laboratorio_ids)
   - Retorna token + user
   ↓
4. Frontend recibe respuesta
   - Guarda token en localStorage
   - Guarda user en localStorage
   - Actualiza AuthContext
   - Redirige a /dashboard
   ↓
5. Peticiones subsecuentes
   - Interceptor agrega token automáticamente
   - Backend valida token en cada request
```

#### 1.4.4 Flujo de Autorización (RBAC)

```
1. Request llega con req.user (del JWT)
   ↓
2. authorize(action, resource) middleware
   ↓
3. defineAbilitiesFor(req.user) (CASL)
   - Si rol === 'Administrador': can('manage', 'all')
   - Si rol === 'Jefe de Laboratorio':
     * Verifica permisos específicos por recurso
     * Si accede a laboratorio, verifica laboratorio_ids
   ↓
4. ability.can(action, resource)
   - Retorna true/false
   ↓
5. Si false: retorna 403
   Si true: continúa al siguiente middleware
```

### 1.5 Puntos Críticos para Mantenimiento y Debugging

#### 1.5.1 Puntos de Falla Comunes

**1. Autenticación JWT**
- **Ubicación**: `server/middleware/auth.js`
- **Problemas comunes**:
  - Token expirado → Error 401 "Token expirado"
  - Token inválido → Error 401 "Token inválido"
  - JWT_SECRET no configurado → Error al iniciar servidor
- **Debugging**: Verificar `process.env.JWT_SECRET`, revisar logs de JWT verify

**2. Autorización CASL**
- **Ubicación**: `server/middleware/authorize.js`, `server/abilities/defineAbilities.js`
- **Problemas comunes**:
  - Usuario sin permisos → Error 403
  - Jefe de Laboratorio accediendo a laboratorio no asignado → Error 403
- **Debugging**: Verificar `req.user.rol` y `req.user.laboratorio_ids`, revisar definición de abilities

**3. Validación Zod**
- **Ubicación**: `server/validations/middleware.js`, `server/validations/schemas/*.js`
- **Problemas comunes**:
  - Tipos incorrectos (string en lugar de number) → Error 400 con detalles
  - Campos requeridos faltantes → Error 400
- **Debugging**: Revisar `validationResult.error.issues` en logs

**4. Connection Pool MySQL**
- **Ubicación**: `server/config/database.js`
- **Problemas comunes**:
  - Pool agotado → Timeout en conexiones
  - Credenciales incorrectas → Error de conexión
  - Timezone incorrecto → Fechas desfasadas
- **Debugging**: Verificar `connectionLimit`, revisar logs de conexión, verificar timezone configurado (-05:00)

**5. Transacciones SQL**
- **Ubicación**: Controladores que usan `connection.beginTransaction()`
- **Problemas comunes**:
  - Transacción no commiteada → Datos no guardados
  - Rollback no ejecutado en catch → Estado inconsistente
- **Debugging**: Verificar que todos los `beginTransaction` tengan `commit` o `rollback`

**6. Rate Limiting**
- **Ubicación**: `server/middleware/rateLimiter.js`
- **Tipos de limitadores**:
  - `generalLimiter`: 1000 peticiones/15min por usuario o IP
  - `loginLimiter`: 5 intentos/15min por IP (más restrictivo)
  - `heavyOperationLimiter`: 10 operaciones/hora (importaciones, reportes)
  - `createLimiter`: 50 creaciones/hora
  - `publicLimiter`: 30 peticiones/15min para rutas públicas
- **Problemas comunes**:
  - Límite excedido → Error 429 con `retryAfter` en segundos
  - IP no detectada correctamente en producción → Límites incorrectos
- **Debugging**: Verificar `trust proxy` configurado, revisar `keyGenerator` que usa userId si está autenticado

#### 1.5.2 Cuellos de Botella Potenciales

**1. Consultas SQL Complejas**
- **Ubicación**: `server/models/Inventario.js`
- **Problemas**:
  - `getAllInsumosConSaldo()` - JOINs múltiples, cálculos de stock
  - `getActividadInsumos()` - Filtros complejos, múltiples tablas
- **Optimización**: Revisar índices en tablas, considerar vistas materializadas

**2. Cálculo de Stock en Tiempo Real**
- **Ubicación**: `server/models/Inventario.js`
- **Problemas**:
  - Stock se calcula mediante JOINs complejos entre `movimientos_insumos`, `movimiento_insumo_detalle`, `inventario_insumos` e `insumos`
  - Consultas con múltiples CASE WHEN para calcular entradas vs salidas
  - Sin cache, cada consulta recalcula todo desde cero
  - Consultas pueden ser lentas con muchos movimientos históricos
- **Optimización**: 
  - Considerar tabla de stock actualizado (snapshot periódico)
  - Cache Redis para consultas frecuentes
  - Índices en `tipo_movimiento`, `laboratorio_id`, `insumo_id`
  - Vistas materializadas para reportes

**3. Validación de Cruces de Horarios**
- **Ubicación**: `server/controllers/horarioController.js` → `verificarCruceHorarios()`
- **Problemas**:
  - Dos consultas SQL por cada creación/actualización de horario:
    * `getCruceLab()` - Verifica cruces de laboratorio
    * `getCruceDocente()` - Verifica cruces de docente
  - Consultas con múltiples condiciones de fecha (rangos superpuestos):
    * `(? < r.fecha_fin AND ? > r.fecha_inicio) OR`
    * `(? < r.fecha_fin AND ? > r.fecha_inicio) OR`
    * `(? <= r.fecha_inicio AND ? >= r.fecha_fin)`
  - Se excluye la reserva actual en actualizaciones (COALESCE)
- **Optimización**: 
  - Índices compuestos en `(laboratorio_id, fecha_inicio, fecha_fin)` y `(docente_id, fecha_inicio, fecha_fin)`
  - Considerar validación asíncrona para mejor UX

**4. Importación Masiva de Insumos**
- **Ubicación**: `server/controllers/inventarioController.js` → `procesarArchivoExcel()` y `ejecutarReabastecimientoMasivo()`
- **Problemas**:
  - Procesamiento de archivos Excel grandes (lectura desde buffer)
  - Validación fila por fila
  - Múltiples inserts en base de datos (una transacción por reabastecimiento)
  - Proceso en dos pasos (preview + ejecución) puede ser confuso
- **Optimización**: 
  - Usar `heavyOperationLimiter` (10 operaciones/hora)
  - Procesar en lotes de inserts (bulk insert)
  - Considerar jobs en background para archivos muy grandes
  - Cache de validaciones de insumos por laboratorio

**5. Generación de Reportes**
- **Ubicación**: `server/controllers/reporteController.js`
- **Problemas**:
  - Consultas complejas con múltiples JOINs
  - Generación de PDFs/Excel
- **Optimización**: Cache de reportes, procesamiento asíncrono

#### 1.5.3 Puntos de Entrada para Debugging

**1. Logs del Servidor**
- **Ubicación**: Console logs en controladores y middlewares
- **Formato**: Emojis para identificación rápida (✅, ❌, 🚨, etc.)
- **Ejemplo**: `console.error('Error al crear insumo:', error)`

**2. Manejo de Errores**
- **Ubicación**: `process.on('unhandledRejection')` y `process.on('uncaughtException')` en `server/index.js`
- **Propósito**: Capturar errores no manejados

**3. Health Checks**
- **Endpoints**: `/health` y `/api/health`
- **Propósito**: Verificar que el servidor está funcionando

**4. Test de Conexión a BD**
- **Ubicación**: `server/config/database.js` → `testConnection()`
- **Propósito**: Verificar conexión al iniciar servidor

**5. Interceptores de Axios**
- **Ubicación**: `src/services/api.ts`
- **Propósito**: Logging automático de errores HTTP con detalles completos

---

# 2. LÓGICA DE FUNCIONAMIENTO / FLUJO DE NEGOCIO
## Enfoque para Cotización

### 2.1 Descripción General del Sistema

**Sistema de Gestión de Laboratorios Universitarios**

El sistema gestiona la administración integral de laboratorios universitarios, incluyendo:
- Reserva y gestión de horarios de laboratorios
- Control de inventario de insumos (reactivos, materiales, material biológico)
- Gestión de equipos y su mantenimiento
- Control de stock con sistema de lotes y fechas de vencimiento
- Reportes de incidencias
- Sistema de roles y permisos
- Enlaces compartidos para visualización pública de horarios

### 2.2 Actores o Roles Involucrados

#### 2.2.1 Administrador
- **Permisos**: Acceso completo al sistema (manage all)
- **Responsabilidades**:
  - Gestión de usuarios y roles
  - Configuración de laboratorios, escuelas, ciclos
  - Gestión de insumos y equipos
  - Visualización de todos los reportes
  - Configuración del sistema

#### 2.2.2 Jefe de Laboratorio
- **Permisos**: Limitados a sus laboratorios asignados
- **Responsabilidades**:
  - Gestión de horarios de sus laboratorios
  - Control de inventario de insumos de sus laboratorios
  - Gestión de equipos de sus laboratorios
  - Reporte de incidencias
  - Configuración de stock mínimo por laboratorio
  - Visualización de reportes de sus laboratorios

### 2.3 Recorrido Completo de Procesos Principales

#### 2.3.1 Proceso: Reserva de Horario de Laboratorio

**Actores**: Jefe de Laboratorio

**Flujo Completo**:

```
1. INICIO: Usuario accede a módulo "Horarios"
   ↓
2. Usuario hace clic en "Nueva Reserva"
   ↓
3. Sistema muestra formulario con campos:
   - Laboratorio (filtrado por laboratorios asignados)
   - Docente
   - Escuela
   - Ciclo
   - Fecha y hora de inicio
   - Fecha y hora de fin
   - Cantidad de alumnos
   - Descripción
   - Insumos requeridos (opcional)
   - Equipos requeridos (opcional)
   ↓
4. Usuario completa formulario y envía
   ↓
5. VALIDACIÓN EN FRONTEND:
   - Campos requeridos completos
   - Fecha fin > fecha inicio
   - Formato de fechas válido
   ↓
6. VALIDACIÓN EN BACKEND (horarioController.js):
   a) Validación de datos con Zod
   b) Verificación de permisos (authorize)
   c) Verificación de cruces de horarios:
      - ¿Laboratorio ya ocupado en ese rango?
      - ¿Docente ya tiene clase en ese rango?
   ↓
7. DECISIÓN: ¿Hay cruce de horarios?
   ├─ SÍ → Retorna error 400 con detalles del conflicto
   │         Usuario ve mensaje: "El laboratorio X ya está ocupado..."
   │         Usuario puede modificar fechas y reintentar
   │
   └─ NO → Continúa al paso 8
   ↓
8. CREACIÓN DE RESERVA:
   a) Inicia transacción SQL
   b) Inserta en tabla `reservas`:
      - laboratorio_id
      - docente_id
      - escuela_id
      - ciclo_id
      - fecha_inicio
      - fecha_fin
      - cantidad_alumnos
      - descripcion
      - estado = 'P' (Programado)
      - color (asignado automáticamente, default '#4ecdc4')
   c) Si hay insumos requeridos:
      - Inserta en `detalle_reserva_insumos` (por cada insumo)
   d) Si hay equipos requeridos:
      - Inserta en `detalle_reserva_equipos` (por cada equipo)
   e) Registra actividad en `actividad_horarios`:
      - accion = 'crear'
      - descripcion = "Reserva creada..."
      - usuario_id
   f) Commit transacción
   ↓
9. RESPUESTA: Éxito 201
   ↓
10. FRONTEND:
    - Muestra mensaje de éxito
    - Actualiza lista de horarios
    - Cierra modal/formulario
    ↓
11. FIN: Reserva creada y visible en calendario
```

**Estados de una Reserva**:
- `P` (Programado) - Reserva programada y activa
- `C` (Cerrado) - Reserva cerrada (no se puede eliminar ni modificar)

**Ramas del Flujo**:
- **Con cruce de laboratorio**: Usuario debe cambiar laboratorio o fechas
- **Con cruce de docente**: Usuario debe cambiar docente o fechas
- **Sin cruces**: Reserva creada exitosamente

#### 2.3.2 Proceso: Gestión de Stock de Insumos (Entrada)

**Actores**: Jefe de Laboratorio

**Flujo Completo**:

```
1. INICIO: Usuario accede a módulo "Insumos" → "Inventario"
   ↓
2. Usuario selecciona laboratorio
   ↓
3. Sistema muestra insumos del laboratorio con stock actual
   ↓
4. Usuario hace clic en "Nueva Entrada"
   ↓
5. Sistema muestra formulario:
   - Laboratorio (pre-seleccionado)
   - Tipo de movimiento: "entrada"
   - Fecha de ingreso
   - Observaciones
   - Detalles de insumos (tabla):
     * Insumo (selector)
     * Lote (opcional)
     * Fecha de vencimiento (opcional)
     * Cantidad
   ↓
6. Usuario agrega insumos y completa datos
   ↓
7. VALIDACIÓN EN FRONTEND:
   - Al menos un insumo agregado
   - Cantidades > 0
   - Fechas de vencimiento válidas (si aplica)
   ↓
8. VALIDACIÓN EN BACKEND (inventarioController.js):
   a) Validación con Zod
   b) Verificación de permisos
   c) Verificación de que insumos existen
   d) Verificación de que insumos están configurados para el laboratorio
   ↓
9. CREACIÓN DE MOVIMIENTO:
   a) Inicia transacción SQL
   b) Inserta en `movimientos_insumos`:
      - laboratorio_id
      - tipo_movimiento = 'entrada'
      - fecha_ingreso
      - fecha_movimiento (timestamp actual)
      - usuario_id
      - observaciones
   c) Por cada insumo en detalles:
      - Inserta en `movimiento_insumo_detalle`:
        * movimiento_id
        * insumo_id
        * lote (o NULL)
        * fecha_vencimiento (o NULL)
        * cantidad
        * saldo = cantidad (saldo inicial igual a cantidad)
   d) Commit transacción
   ↓
10. CÁLCULO DE STOCK:
    - El stock se calcula dinámicamente desde movimientos mediante consultas SQL complejas
    - Fórmula para stock total: 
      SUM(CASE WHEN tipo_movimiento = 'salida' THEN cantidad*-1 ELSE cantidad END)
      agrupado por insumo_id y laboratorio_id
    - Stock por lote: campo `saldo` en `movimiento_insumo_detalle` donde tipo_movimiento = 'entrada'
    - Solo se consideran lotes con saldo > 0 para disponibilidad
    - Los lotes se ordenan por fecha_vencimiento (ascendente) para FIFO manual
   ↓
11. RESPUESTA: Éxito 201
   ↓
12. FRONTEND:
    - Muestra mensaje de éxito
    - Actualiza vista de inventario
    - Muestra nuevo stock calculado
    ↓
13. FIN: Stock actualizado
```

**Reglas de Negocio**:
- El stock se calcula desde movimientos (no hay tabla redundante)
- Cada entrada crea un registro en `movimiento_insumo_detalle` con saldo inicial = cantidad
- El saldo de un lote se reduce cuando hay salidas (UPDATE directo en el registro original)
- Si un insumo no está configurado para el laboratorio en `inventario_insumos`, no se puede registrar entrada
- Los lotes con saldo = 0 no se muestran como disponibles
- Los lotes vencidos (fecha_vencimiento < CURDATE()) se pueden identificar pero no se excluyen automáticamente

#### 2.3.3 Proceso: Gestión de Stock de Insumos (Salida)

**Actores**: Jefe de Laboratorio

**Flujo Completo**:

```
1. INICIO: Usuario en módulo "Insumos" → "Inventario"
   ↓
2. Usuario selecciona insumo con stock disponible
   ↓
3. Usuario hace clic en "Nueva Salida"
   ↓
4. Sistema muestra formulario:
   - Laboratorio (pre-seleccionado)
   - Tipo de movimiento: "salida"
   - Fecha de salida
   - Reserva asociada (opcional, selector de reservas activas)
   - Observaciones
   - Detalles de insumos:
     * Insumo (pre-seleccionado)
     * Cantidad a retirar
     * Sistema muestra lotes disponibles con:
       - Lote
       - Saldo disponible
       - Fecha de vencimiento
       - Días para vencer
   ↓
5. Usuario selecciona lotes y cantidades
   ↓
6. VALIDACIÓN EN FRONTEND:
   - Cantidad total <= stock disponible
   - Cantidades por lote <= saldo del lote
   ↓
7. VALIDACIÓN EN BACKEND:
   a) Validación con Zod
   b) Verificación de permisos
   c) Verificación de stock disponible por lote
   d) Verificación de que no se exceda el saldo
   ↓
8. CREACIÓN DE MOVIMIENTO:
   a) Inicia transacción SQL
   b) Inserta en `movimientos_insumos`:
      - tipo_movimiento = 'salida'
      - reserva_id (si aplica)
      - usuario_id
   c) Por cada lote seleccionado:
      - Valida que el saldo del lote sea suficiente (validarSaldo)
      - Actualiza saldo del lote original (actualizarSaldoEntrada):
        UPDATE movimiento_insumo_detalle
        SET saldo = saldo - cantidad_retirada
        WHERE id = entrada_detalle_id
      - Inserta en `movimiento_insumo_detalle`:
        * movimiento_id
        * insumo_id
        * cantidad
        * mov_det_ref = entrada_detalle_id (referencia al lote original)
   d) Commit transacción
   ↓
9. ACTUALIZACIÓN DE STOCK:
   - Stock disponible se recalcula automáticamente
   - Saldos de lotes se actualizan
   ↓
10. RESPUESTA: Éxito 201
   ↓
11. FRONTEND:
    - Muestra mensaje de éxito
    - Actualiza vista de inventario
    - Muestra nuevo stock
   ↓
12. FIN: Stock reducido, salida registrada
```

**Reglas de Negocio**:
- No se puede retirar más de lo disponible en el lote (validación previa con validarSaldo)
- El saldo del lote original se reduce al registrar la salida (UPDATE antes de insertar detalle)
- Cada salida referencia el lote original mediante `mov_det_ref` (entrada_detalle_id)
- Si se asocia a una reserva, se vincula en `reserva_id` de `movimientos_insumos`
- Se puede registrar salida manual (sin reserva, reserva_id = NULL)
- Las salidas NO tienen campo `saldo` (solo las entradas)
- Se pueden hacer múltiples salidas del mismo lote hasta agotar el saldo

#### 2.3.4 Proceso: Sistema de Stock Mínimo y Alertas

**Actores**: Jefe de Laboratorio, Administrador

**Flujo Completo**:

```
1. CONFIGURACIÓN INICIAL (una vez por insumo/laboratorio):
   a) Usuario accede a "Configuración" → "Stock Mínimo"
   b) Selecciona laboratorio
   c) Sistema muestra tabla de insumos con:
      - Stock actual
      - Stock mínimo (si configurado)
      - Estado (Agotado, Bajo, Normal, Exceso)
   d) Usuario hace clic en configurar insumo
   e) Ingresa:
      - Stock mínimo
      - Stock máximo (opcional)
      - Punto de reorden (opcional)
      - Observaciones
   f) Sistema guarda en `config_stock_laboratorio`
   ↓
2. MONITOREO CONTINUO (automático):
   a) Sistema calcula stock actual desde movimientos
   b) Compara con stock mínimo configurado
   c) Evalúa estado:
      - AGOTADO: stock = 0
      - BAJO: stock < stock_minimo
      - NORMAL: stock >= stock_minimo
      - EXCESO: stock > stock_maximo (si configurado)
      - REORDENAR: stock <= punto_reorden (si configurado)
   ↓
3. REPORTE DE STOCK BAJO:
   a) Usuario accede a "Reportes" → "Insumos con Stock Bajo"
   b) Sistema consulta vista `v_stock_completo`
   c) Filtra por estado = 'BAJO' o 'AGOTADO'
   d) Muestra:
      - Insumo
      - Laboratorio
      - Stock actual
      - Stock mínimo
      - Diferencia
      - Porcentaje respecto al mínimo
   e) Usuario puede exportar a CSV
   ↓
4. REPORTE DE VENCIMIENTOS:
   a) Usuario accede a "Reportes" → "Insumos Próximos a Vencer"
   b) Sistema consulta lotes con fecha_vencimiento
   c) Calcula días hasta vencimiento
   d) Clasifica:
      - VENCIDO: días < 0
      - VENCE_SEMANA: días <= 7
      - VENCE_MES: días <= 30
      - VENCE_TRIMESTRE: días <= 90
   e) Muestra:
      - Insumo
      - Lote
      - Cantidad
      - Fecha de vencimiento
      - Días para vencer
      - Laboratorio
   f) Usuario puede filtrar por días y exportar
   ↓
5. FIN: Sistema de alertas operativo
```

**Reglas de Negocio**:
- Stock mínimo es personalizado por laboratorio
- Un mismo insumo puede tener diferentes mínimos en diferentes laboratorios
- Las alertas se calculan en tiempo real (no hay cache)
- Los reportes se pueden filtrar por laboratorio y fechas

#### 2.3.5 Proceso: Importación Masiva de Insumos (Crear Nuevos Insumos)

**Actores**: Administrador

**Flujo Completo**:

```
1. INICIO: Usuario accede a módulo "Insumos"
   ↓
2. Usuario hace clic en "Importación Masiva"
   ↓
3. Sistema muestra opción de "Generar Plantilla"
   ↓
4. Usuario descarga plantilla Excel con columnas:
   - NOMBRE (obligatorio)
   - DESCRIPCION (opcional)
   - UNIDAD_MEDIDA (obligatorio, debe existir en BD)
   - CATEGORIA (obligatorio: Reactivos, Materiales, Material_Biologico)
   - PRESENTACION (opcional)
   - Ejemplos de datos incluidos
   ↓
5. Usuario completa plantilla con nuevos insumos
   ↓
6. Usuario sube archivo Excel
   ↓
7. PREVISUALIZACIÓN (previsualizarImportacionMasiva):
   a) Sistema lee archivo Excel desde buffer
   b) Valida formato y columnas
   c) Por cada fila:
      - Valida campos obligatorios (nombre, unidad_medida, categoria)
      - Valida que categoria sea válida (Reactivos, Materiales, Material_Biologico)
      - Nota: La validación de unidad_medida se hace en la ejecución
   d) Retorna preview con:
      - Filas válidas (listas para importar)
      - Filas con errores (y motivo específico por campo)
   ↓
8. DECISIÓN: ¿Continuar con importación?
   ├─ NO → Usuario corrige archivo y reintenta
   │
   └─ SÍ → Continúa al paso 9
   ↓
9. IMPORTACIÓN MASIVA (importacionMasiva):
   a) Inicia transacción SQL
   b) Por cada fila válida del preview:
      - Busca unidad por nombre (unidad_medida) en BD
      - Si no existe, genera error para esa fila
      - Si existe, obtiene unidad_id
      - Crea insumo con Insumo.create(nombre, descripcion, unidad_id, categoria, presentacion):
        * Inserta con codigo = 'PENDIENTE'
        * Obtiene insertId
        * Genera codigo = 'INS-{id_padded}' (ej: INS-0001)
        * Actualiza codigo en la misma transacción
      - Registra resultado (éxito o error)
   c) Commit transacción
   ↓
10. RESPUESTA: Éxito con resumen:
    - Total de insumos creados
    - Total de errores
    - Detalle por fila
    ↓
11. FRONTEND:
    - Muestra resumen
    - Actualiza lista de insumos
    ↓
12. FIN: Insumos creados (aún no configurados para laboratorios)
```

**Reglas de Negocio**:
- Solo Administrador puede importar insumos
- Los insumos creados aún no están configurados para ningún laboratorio (deben configurarse después en `inventario_insumos`)
- Después de crear, se debe configurar cada insumo en los laboratorios donde se usará
- Los códigos se generan automáticamente: INS-0001, INS-0002, etc. (basado en el ID autoincremental)
- Las unidades se buscan por nombre (debe coincidir exactamente con el nombre en BD)
- Si una unidad no existe, esa fila genera error y no se crea el insumo
- El proceso es transaccional: si todas las filas fallan, se hace rollback completo

#### 2.3.6 Proceso: Reabastecimiento Masivo de Insumos (Agregar Stock)

**Actores**: Jefe de Laboratorio

**Flujo Completo**:

```
1. INICIO: Usuario accede a "Insumos" → "Reabastecimiento"
   ↓
2. Usuario hace clic en "Generar Plantilla"
   ↓
3. Sistema genera archivo Excel con 2 hojas:
   - Hoja 1 "Plantilla Reabastecimiento": Columnas:
     * CODIGO_INSUMO
     * LOTE
     * FECHA_VENCIMIENTO
     * CANTIDAD
     * Ejemplos de datos incluidos
   - Hoja 2 "Insumos Configurados": Lista de insumos disponibles
     con códigos, nombres, unidades por laboratorio
   ↓
4. Usuario completa plantilla con datos de reabastecimiento
   ↓
5. Usuario sube archivo Excel
   ↓
6. PROCESAMIENTO PREVIO (procesarArchivoExcel):
   a) Sistema lee archivo Excel desde buffer
   b) Valida formato y columnas esperadas
   c) Procesa cada fila:
      - Extrae código de insumo, lote, fecha de vencimiento, cantidad
      - Valida que cantidad sea número positivo
      - Valida que código de insumo exista
      - Valida que insumo esté configurado para el laboratorio seleccionado
   d) Retorna preview con:
      - Total de filas procesadas
      - Registros válidos (con datos enriquecidos: insumo_id, nombre, unidad)
      - Registros con errores (y motivo específico)
   ↓
7. DECISIÓN: ¿Continuar con importación?
   ├─ NO → Usuario corrige archivo y reintenta
   │
   └─ SÍ → Continúa al paso 8
   ↓
8. EJECUCIÓN DE REABASTECIMIENTO (ejecutarReabastecimientoMasivo):
   a) Usuario envía datos validados del preview
   b) Inicia transacción SQL
   c) Por cada registro válido:
      - Crea movimiento de entrada (insertarMovimiento)
      - Crea detalle con lote y fecha de vencimiento (procesarDetallesMovimiento)
      - Saldo inicial = cantidad
   d) Commit transacción
   ↓
9. RESPUESTA: Éxito con resumen:
   - Total de registros procesados
   - Motivo general del reabastecimiento
   ↓
10. FRONTEND:
    - Muestra resumen
    - Actualiza inventario
    ↓
11. FIN: Reabastecimiento completado
```

**Reglas de Negocio**:
- Solo se pueden importar insumos configurados para el laboratorio (tabla `inventario_insumos`)
- Los códigos de insumo deben coincidir exactamente
- Se pueden crear múltiples lotes del mismo insumo en una importación
- El proceso es en dos pasos: primero preview (procesar-excel), luego ejecución (reabastecimiento-masivo)

#### 2.3.7 Proceso: Cerrar Horario y Registrar Consumo de Insumos

**Actores**: Jefe de Laboratorio

**Flujo Completo**:

```
1. INICIO: Usuario accede a módulo "Horarios"
   ↓
2. Usuario selecciona un horario con estado 'P' (Programado)
   ↓
3. Usuario hace clic en "Cerrar Horario"
   ↓
4. Sistema muestra modal/formulario:
   - Información del horario
   - Lista de insumos requeridos (de detalle_reserva_insumos)
   - Para cada insumo requerido:
     * Nombre y cantidad requerida
     * Sistema muestra lotes disponibles del insumo
     * Usuario selecciona lotes y cantidades consumidas
   - Opción de agregar insumos adicionales no requeridos
   - Fecha de movimiento
   - Observaciones
   ↓
5. VALIDACIÓN EN FRONTEND:
   - Al menos un insumo con consumo > 0
   - Para insumos requeridos: cantidad consumida >= cantidad requerida
   - Cantidades por lote <= saldo disponible del lote
   ↓
6. VALIDACIÓN EN BACKEND (cerrarHorario):
   a) Validación con Zod
   b) Verificación de permisos
   c) Verificación de que el horario existe
   d) Verificación de que el horario NO está cerrado (estado != 'C')
   ↓
7. CERRAR HORARIO Y REGISTRAR CONSUMO:
   a) Inicia transacción SQL
   b) Actualiza estado del horario a 'C' (Cerrado):
      UPDATE reservas SET estado = 'C' WHERE id = reserva_id
   c) Crea movimiento de salida:
      - Inserta en `movimientos_insumos`:
        * tipo_movimiento = 'salida'
        * reserva_id = reserva_id (vinculado al horario)
        * laboratorio_id
        * usuario_id
        * fecha_movimiento
        * observaciones
   d) Por cada insumo consumido:
      - Valida saldo del lote (validarSaldo)
      - Actualiza saldo del lote original (actualizarSaldoEntrada)
      - Inserta en `movimiento_insumo_detalle`:
        * movimiento_id
        * insumo_id
        * cantidad
        * mov_det_ref = entrada_detalle_id (referencia al lote)
   e) Commit transacción
   ↓
8. RESPUESTA: Éxito 200
   ↓
9. FRONTEND:
   - Muestra mensaje de éxito
   - Actualiza vista de horarios (horario ahora aparece como cerrado)
   - Actualiza inventario (stock reducido)
   ↓
10. FIN: Horario cerrado, consumo registrado
```

**Reglas de Negocio**:
- Solo se pueden cerrar horarios con estado 'P' (Programado)
- Un horario cerrado no se puede eliminar ni modificar (validación en deleteHorario)
- El consumo de insumos es obligatorio para cerrar el horario (validación en frontend)
- Para insumos requeridos: cantidad consumida >= cantidad requerida
- Se puede consumir más de lo requerido (insumos adicionales no requeridos)
- El consumo se registra como movimiento de salida vinculado al horario (reserva_id)
- Se puede seleccionar múltiples lotes del mismo insumo para completar la cantidad
- El proceso es atómico: si falla el cierre o el registro de consumo, se hace rollback completo

#### 2.3.8 Proceso: Gestión de Equipos y Mantenimiento

**Actores**: Jefe de Laboratorio

**Flujo Completo**:

```
1. INICIO: Usuario accede a módulo "Equipos"
   ↓
2. Sistema muestra lista de equipos del laboratorio
   ↓
3. OPERACIONES DISPONIBLES:
   
   A) CREAR EQUIPO:
      a) Usuario hace clic en "Nuevo Equipo"
      b) Completa formulario:
         - Código
         - Nombre
         - Marca
         - Modelo
         - Tipo de equipo
         - Laboratorio
         - Estado (Operativo, En Mantenimiento, Fuera de Servicio)
      c) Sistema valida y crea en tabla `equipos`
      ↓
   
   B) REGISTRAR MANTENIMIENTO:
      a) Usuario selecciona equipo
      b) Hace clic en "Registrar Mantenimiento"
      c) Completa:
         - Tipo (Preventivo, Correctivo)
         - Fecha de inicio
         - Fecha de fin (opcional)
         - Descripción
         - Costo (opcional)
      d) Sistema:
         - Actualiza estado del equipo a "En mantenimiento"
         - Registra en `movimientos_equipos` con tipo = 'mantenimiento'
      ↓
   
   C) MOVER EQUIPO:
      a) Usuario selecciona equipo
      b) Hace clic en "Mover Equipo"
      c) Selecciona laboratorio destino
      d) Sistema:
         - Crea movimiento en `movimientos_equipos`
         - Actualiza `laboratorio_id` del equipo
      ↓
   
   D) REPORTAR INCIDENCIA:
      a) Usuario selecciona equipo
      b) Hace clic en "Reportar Incidencia"
      c) Completa:
         - Tipo de incidencia
         - Descripción
         - Severidad
         - Reserva asociada (si aplica)
      d) Sistema:
         - Crea registro en `incidencias`
         - Actualiza estado del equipo si es necesario
   ↓
4. FIN: Equipos gestionados
```

**Estados de Equipo**:
- `Operativo` - Equipo disponible y funcionando correctamente
- `En Mantenimiento` - Equipo en proceso de mantenimiento
- `Fuera de Servicio` - Equipo no disponible (dañado o retirado)

#### 2.3.9 Proceso: Enlaces Compartidos para Visualización Pública

**Actores**: Jefe de Laboratorio

**Flujo Completo**:

```
1. INICIO: Usuario accede a módulo "Horarios" o "Configuración"
   ↓
2. Usuario hace clic en "Generar Enlace Compartido" para un laboratorio
   ↓
3. Sistema muestra formulario:
   - Laboratorio (pre-seleccionado)
   - Días de expiración (default 365, opcional)
   ↓
4. Usuario confirma creación
   ↓
5. CREACIÓN/ACTUALIZACIÓN DE ENLACE (createShareLink):
   a) Verifica que el laboratorio existe
   b) Busca si ya existe un enlace activo para ese laboratorio y usuario
   c) DECISIÓN: ¿Existe enlace activo?
      ├─ SÍ → Actualiza fecha de expiración
      │
      └─ NO → Crea nuevo enlace:
         * Genera token JWT con payload:
           - laboratorio_id
           - created_by (usuario_id)
           - type: 'share_link'
           - timestamp
         * Expiración: 365 días (o según parámetro)
         * Inserta en `enlaces_compartidos`:
           - laboratorio_id
           - token
           - creado_por
           - fecha_expiracion
           - activo = TRUE
   d) Construye URL pública:
      {baseUrl}/horarios/publico/{laboratorio_id}?token={token}
   ↓
6. RESPUESTA: Éxito con URL completa
   ↓
7. FRONTEND:
   - Muestra URL compartible
   - Opción de copiar al portapapeles
   - Opción de desactivar o eliminar enlace
   ↓
8. ACCESO PÚBLICO (sin autenticación):
   a) Usuario accede a URL pública
   b) Sistema extrae token de query string
   c) VALIDACIÓN (getPublicHorarios):
      - Verifica token con JWT_SECRET
      - Verifica que token corresponde al laboratorio_id
      - Verifica que enlace existe en BD
      - Verifica que enlace está activo
      - Verifica que no ha expirado
   d) Si válido:
      - Consulta horarios del laboratorio (getPublicHorarios)
      - Enriquece con insumos requeridos por horario
      - Retorna datos públicos (solo lectura)
   e) Si inválido:
      - Retorna error 401 con motivo específico
   ↓
9. FIN: Enlace compartible funcional
```

**Reglas de Negocio**:
- Un usuario puede tener un enlace activo por laboratorio
- El token es un JWT con expiración de 365 días (configurable)
- Los enlaces pueden desactivarse sin eliminarlos
- Los enlaces expirados no funcionan aunque existan en BD
- El acceso público es de solo lectura (no se pueden modificar datos)

#### 2.3.10 Proceso: Generación de Reportes

**Actores**: Administrador, Jefe de Laboratorio

**Tipos de Reportes Disponibles**:

**1. Reporte de Actividad de Insumos**:
```
1. Usuario accede a "Reportes" → "Actividad de Insumos"
2. Selecciona filtros:
   - Laboratorio (opcional)
   - Fecha inicio
   - Fecha fin
   - Tipo de movimiento (entrada/salida, opcional)
3. Sistema consulta `movimientos_insumos` y `movimiento_insumo_detalle`
4. Muestra tabla con:
   - Fecha de movimiento
   - Tipo
   - Insumo
   - Lote
   - Cantidad
   - Usuario
   - Observaciones
5. Usuario puede exportar a Excel/PDF
```

**2. Reporte de Actividad de Horarios**:
```
1. Usuario accede a "Reportes" → "Actividad de Horarios"
2. Selecciona filtros:
   - Laboratorio
   - Fecha inicio
   - Fecha fin
   - Acción (crear, actualizar, eliminar)
   - Usuario
3. Sistema consulta `actividad_horarios`
4. Muestra historial de cambios en reservas
5. Usuario puede exportar
```

**3. Reporte de Stock Bajo**:
- Descrito en proceso 2.3.4

**4. Reporte de Insumos Próximos a Vencer**:
- Descrito en proceso 2.3.4

**5. Reporte de Consumo de Insumos**:
```
1. Usuario accede a "Reportes" → "Consumo de Insumos"
2. Selecciona filtros:
   - Tipo de período (mensual/anual)
   - Fecha inicio
   - Fecha fin
   - Laboratorio (opcional)
   - Escuela (opcional)
   - Categoría de insumo (opcional)
3. Sistema consulta movimientos agrupados por período
4. Muestra:
   - Período
   - Laboratorio
   - Insumo
   - Total consumido
   - Total ingresado
   - Número de movimientos
5. Usuario puede exportar
```

**6. Reporte de Comparación de Insumos**:
```
1. Usuario accede a "Reportes" → "Comparación de Insumos"
2. Selecciona múltiples laboratorios
3. Sistema muestra comparativa de stock por insumo entre laboratorios
4. Identifica diferencias y excesos
```

**7. Dashboard Ejecutivo**:
```
1. Usuario accede a "Dashboard" o "Reportes" → "Dashboard Ejecutivo"
2. Selecciona filtros:
   - Fecha inicio
   - Fecha fin
   - Laboratorio (opcional)
   - Escuela (opcional)
3. Sistema muestra métricas agregadas:
   - Total de laboratorios activos
   - Total de categorías de insumos
   - Total de insumos utilizados
   - Total de consumo
   - Total de ingresos
   - Días de actividad
4. Muestra consumo por laboratorio
5. Muestra consumo por categoría de insumo
```

### 2.4 Reglas de Negocio Principales

#### 2.4.1 Reglas de Horarios
1. **No se permiten cruces de horarios**: Un laboratorio no puede estar ocupado por dos reservas simultáneas (validación mediante consulta SQL con rangos de fechas superpuestos)
2. **No se permiten cruces de docentes**: Un docente no puede tener dos clases al mismo tiempo (validación mediante consulta SQL con rangos de fechas superpuestos)
3. **Validación de fechas**: La fecha de fin debe ser posterior a la fecha de inicio
4. **Asignación de color**: Cada reserva recibe un color automático (default '#4ecdc4') para visualización en calendario
5. **Insumos y equipos requeridos**: Se pueden asociar insumos y equipos a una reserva en `detalle_reserva_insumos` y `detalle_reserva_equipos`, pero no es obligatorio
6. **Estados de reserva**: 
   - 'P' (Programado): Reserva activa, se puede modificar o eliminar
   - 'C' (Cerrado): Reserva cerrada, no se puede modificar ni eliminar
7. **Cierre de horario**: Al cerrar un horario, se registra automáticamente el consumo de insumos como movimiento de salida vinculado a la reserva
8. **Validación de entidades**: Se valida que escuela, ciclo y docente existan antes de crear/actualizar
9. **Auditoría**: Todas las acciones (crear, editar, eliminar) se registran en `actividad_horarios` con descripción detallada, usuario e IP
10. **Eliminación en cascada**: Al eliminar un horario, se eliminan automáticamente sus detalles de insumos y equipos (ON DELETE CASCADE)

#### 2.4.2 Reglas de Inventario de Insumos
1. **Stock calculado desde movimientos**: El stock no se almacena, se calcula dinámicamente sumando entradas y restando salidas mediante consultas SQL complejas con JOINs múltiples
2. **Sistema de lotes**: Cada entrada crea un registro en `movimiento_insumo_detalle` con su propio saldo inicial igual a la cantidad. El lote puede ser NULL ('SIN-LOTE')
3. **Control de saldo por lote**: Al hacer una salida:
   - Se valida que el saldo del lote sea suficiente (validarSaldo)
   - Se reduce el saldo del lote original (UPDATE saldo = saldo - cantidad)
   - Se crea un nuevo registro en `movimiento_insumo_detalle` con `mov_det_ref` apuntando al lote original (entrada_detalle_id)
   - Las salidas NO tienen saldo propio, solo referencian el lote de entrada
4. **Configuración por laboratorio**: Un insumo debe estar configurado en `inventario_insumos` para poder registrar movimientos en ese laboratorio
5. **FIFO manual**: El sistema muestra lotes ordenados por fecha de vencimiento (ascendente, NULL al final), pero la selección de lotes es manual
6. **Stock mínimo personalizado**: Cada insumo puede tener un stock mínimo diferente en cada laboratorio (tabla `config_stock_laboratorio`)
7. **Movimientos vinculados a reservas**: Las salidas pueden estar vinculadas a una reserva mediante `reserva_id` en `movimientos_insumos`
8. **Códigos automáticos**: Los insumos reciben códigos automáticos al crearse: `INS-{id_padded}` (ej: INS-0001, INS-0023)
9. **Categorías de insumos**: Reactivos, Materiales, Material_Biologico (validado en backend)

#### 2.4.3 Reglas de Equipos
1. **Un equipo pertenece a un laboratorio**: Cada equipo está asignado a un laboratorio específico
2. **Estados mutuamente excluyentes**: Un equipo solo puede estar en un estado a la vez (Operativo, En Mantenimiento, Fuera de Servicio)
3. **Condiciones de equipo**: Excelente, Bueno, Regular, Malo (validado en backend)
4. **Movimientos auditables**: Todos los movimientos de equipos se registran en `movimientos_equipos` con tipo (asignación, mantenimiento, etc.)
5. **Asociación con reservas**: Los equipos se pueden asociar a reservas en `detalle_reserva_equipos`
6. **Códigos únicos**: Cada equipo tiene un código único (validado antes de crear)
7. **Mantenimiento**: Se registran fechas de último y próximo mantenimiento
8. **Auditoría**: Todas las acciones (crear, actualizar, eliminar) se registran en `actividad_equipos`

#### 2.4.4 Reglas de Usuarios y Permisos
1. **Roles jerárquicos**: Administrador tiene acceso completo, Jefe de Laboratorio tiene acceso limitado
2. **Asignación de laboratorios**: Un Jefe de Laboratorio solo puede gestionar sus laboratorios asignados (almacenados en `laboratorio_ids` JSON)
3. **Autenticación obligatoria**: Todas las rutas protegidas requieren JWT válido
4. **Autorización por acción y recurso**: CASL verifica permisos antes de ejecutar operaciones

#### 2.4.5 Reglas de Enlaces Compartidos
1. **Enlaces temporales**: Los enlaces compartidos tienen fecha de expiración (default 365 días, configurable)
2. **Acceso público**: Los enlaces permiten ver horarios sin autenticación mediante token JWT especial
3. **Un enlace activo por laboratorio y usuario**: Si ya existe un enlace activo para un laboratorio, se actualiza en lugar de crear uno nuevo
4. **Validación de token**: El token se verifica contra JWT_SECRET y debe coincidir con el laboratorio_id
5. **Estados del enlace**: 
   - `activo = TRUE`: Enlace funcional
   - `activo = FALSE`: Enlace desactivado (no funciona aunque no haya expirado)
   - `fecha_expiracion`: Fecha límite de validez
6. **URL pública**: Formato `/horarios/publico/{laboratorio_id}?token={token}`
7. **Datos mostrados**: Horarios del laboratorio con insumos requeridos, docentes y ciclos (solo lectura)

### 2.5 Estados, Decisiones y Ramificaciones

#### 2.5.1 Estados de Reservas (Horarios)

```
Estado Inicial: No existe
    ↓
[Crear Reserva]
    ↓
Estado: 'P' (Programado)
    ├─ [Actualizar] → Estado: 'P' (con nuevos datos)
    ├─ [Cerrar Horario] → Estado: 'C' (Cerrado)
    │   └─ Registra consumo de insumos
    └─ [Eliminar] → Solo si estado != 'C'
```

**Decisiones en el flujo**:
- ¿Hay cruce de laboratorio? → SÍ: Error 409 con detalles del conflicto, NO: Continúa
- ¿Hay cruce de docente? → SÍ: Error 409 con detalles del conflicto, NO: Continúa
- ¿Datos válidos? → SÍ: Crea, NO: Error 400 de validación
- ¿Horario cerrado? → SÍ: No se puede eliminar (Error 409), NO: Se puede eliminar

#### 2.5.2 Estados de Stock de Insumos

```
Estado Inicial: Sin stock
    ↓
[Entrada de Insumos]
    ↓
Estado: Con stock (por lote)
    ├─ [Salida] → Reduce saldo del lote
    │   └─ ¿Saldo = 0? → Lote agotado
    ├─ [Vencimiento] → Lote vencido (no disponible)
    └─ [Reabastecimiento] → Nuevos lotes agregados
```

**Decisiones en el flujo**:
- ¿Stock suficiente? → SÍ: Permite salida, NO: Error
- ¿Lote vencido? → SÍ: No disponible, NO: Disponible
- ¿Stock < mínimo? → SÍ: Alerta, NO: Normal

#### 2.5.3 Estados de Equipos

```
Estado Inicial: Operativo
    ↓
[Registrar Mantenimiento] → Estado: En Mantenimiento
    ↓
[Finalizar Mantenimiento] → Estado: Operativo
    ↓
[Reportar Problema] → Estado: Fuera de Servicio
    ↓
[Reparar/Reactivar] → Estado: Operativo
```

**Decisiones en el flujo**:
- ¿Equipo operativo? → SÍ: Disponible, NO: No disponible
- ¿Equipo en mantenimiento? → SÍ: No disponible, NO: Verificar estado

### 2.6 Complejidad Funcional

#### 2.6.1 Módulos Principales

1. **Módulo de Autenticación y Autorización**
   - Complejidad: Media
   - Funcionalidades: Login, logout, gestión de usuarios, roles, permisos
   - Endpoints: ~8
   - Componentes Frontend: 1 (Login)

2. **Módulo de Horarios**
   - Complejidad: Alta
   - Funcionalidades: CRUD reservas, validación de cruces, calendario, asociación de insumos/equipos
   - Endpoints: ~12
   - Componentes Frontend: 11
   - Lógica crítica: Validación de cruces de horarios

3. **Módulo de Insumos**
   - Complejidad: Muy Alta
   - Funcionalidades: CRUD insumos, gestión de stock, sistema de lotes, movimientos, importación masiva, stock mínimo
   - Endpoints: ~20
   - Componentes Frontend: 6
   - Lógica crítica: Cálculo de stock, gestión de lotes, FIFO

4. **Módulo de Inventario**
   - Complejidad: Muy Alta
   - Funcionalidades: Entradas, salidas, consulta de stock, lotes, actividad
   - Endpoints: ~15
   - Componentes Frontend: Integrado en Insumos
   - Lógica crítica: Cálculo dinámico de stock, actualización de saldos

5. **Módulo de Equipos**
   - Complejidad: Media-Alta
   - Funcionalidades: CRUD equipos, mantenimiento, movimientos, estados
   - Endpoints: ~10
   - Componentes Frontend: 4
   - Lógica crítica: Gestión de estados, movimientos

6. **Módulo de Incidencias**
   - Complejidad: Baja-Media
   - Funcionalidades: Reportar incidencias, listar, filtrar
   - Endpoints: ~5
   - Componentes Frontend: 3

7. **Módulo de Reportes**
   - Complejidad: Alta
   - Funcionalidades: Múltiples tipos de reportes, filtros, exportación
   - Endpoints: ~8
   - Componentes Frontend: 12
   - Lógica crítica: Consultas complejas, generación de PDFs/Excel

8. **Módulo de Configuración**
   - Complejidad: Media
   - Funcionalidades: Gestión de catálogos (escuelas, ciclos, docentes, unidades, tipos de equipo), stock mínimo
   - Endpoints: ~30
   - Componentes Frontend: 16

9. **Módulo de Enlaces Compartidos**
   - Complejidad: Media
   - Funcionalidades: Generar enlaces, desactivar, eliminar, visualización pública con token JWT
   - Endpoints: ~5
   - Componentes Frontend: 2
   - Lógica crítica: Validación de tokens JWT, construcción de URLs públicas

10. **Módulo de Dashboard**
    - Complejidad: Media
    - Funcionalidades: Estadísticas, métricas, gráficos
    - Endpoints: ~5
    - Componentes Frontend: 2

#### 2.6.2 Métricas de Complejidad

**Backend**:
- **Controladores**: 18
- **Modelos**: 14
- **Rutas**: 18
- **Schemas de validación**: 12
- **Endpoints totales**: ~130
- **Tablas de base de datos**: ~25
- **Vistas SQL**: 3 (v_stock_actual, v_stock_completo, v_alertas_insumos)

**Frontend**:
- **Páginas**: 10
- **Componentes**: ~60
- **Servicios**: 20
- **Hooks personalizados**: 2

**Base de Datos**:
- **Tablas principales**: ~25
  - `reservas` - Horarios/reservas de laboratorios
  - `movimientos_insumos` - Movimientos de entrada/salida
  - `movimiento_insumo_detalle` - Detalles de movimientos (lotes)
  - `inventario_insumos` - Configuración de insumos por laboratorio
  - `config_stock_laboratorio` - Stock mínimo por laboratorio
  - `equipos` - Equipos de laboratorio
  - `movimientos_equipos` - Movimientos de equipos
  - `actividad_horarios` - Auditoría de cambios en horarios
  - `actividad_equipos` - Auditoría de cambios en equipos
  - `enlaces_compartidos` - Enlaces públicos para horarios
  - Y otras tablas de catálogos (usuarios, roles, laboratorios, escuelas, ciclos, docentes, unidades, tipos_equipo, incidencias)
- **Vistas**: 3 (v_stock_actual, v_stock_completo, v_alertas_insumos)
- **Relaciones**: Múltiples foreign keys con CASCADE y RESTRICT según el caso

#### 2.6.3 Funcionalidades de Alta Complejidad

1. **Sistema de Stock con Lotes**:
   - Cálculo dinámico de stock desde movimientos
   - Gestión de saldos por lote
   - Control de vencimientos
   - FIFO manual
   - **Estimación**: 40-60 horas de desarrollo

2. **Validación de Cruces de Horarios**:
   - Consultas SQL complejas con rangos de fechas
   - Validación de dos tipos de cruces (laboratorio y docente)
   - **Estimación**: 20-30 horas de desarrollo

3. **Sistema de Stock Mínimo**:
   - Configuración personalizada por laboratorio
   - Cálculo de estados y alertas
   - Reportes de stock bajo y vencimientos
   - **Estimación**: 30-40 horas de desarrollo

4. **Importación Masiva**:
   - Procesamiento de archivos Excel
   - Validación previa con preview
   - Transacciones SQL para múltiples inserts
   - **Estimación**: 25-35 horas de desarrollo

5. **Sistema de Reportes**:
   - Múltiples tipos de reportes
   - Consultas complejas con múltiples JOINs
   - Exportación a PDF/Excel
   - **Estimación**: 50-70 horas de desarrollo

#### 2.6.4 Estimación Total del Proyecto

**Desarrollo Backend**:
- Estructura base y configuración: 40 horas
- Módulos CRUD básicos: 80 horas
- Lógica de negocio compleja: 120 horas
- Validaciones y seguridad: 40 horas
- **Subtotal Backend**: ~280 horas

**Desarrollo Frontend**:
- Estructura base y configuración: 30 horas
- Componentes UI y páginas: 100 horas
- Integración con API: 60 horas
- Lógica de estado y hooks: 40 horas
- **Subtotal Frontend**: ~230 horas

**Base de Datos**:
- Diseño de esquema: 20 horas
- Migraciones y scripts: 30 horas
- Optimización y vistas: 20 horas
- **Subtotal BD**: ~70 horas

**Testing y Debugging**:
- Testing manual: 60 horas
- Corrección de bugs: 40 horas
- **Subtotal Testing**: ~100 horas

**Documentación**:
- Documentación técnica: 20 horas
- Documentación de usuario: 15 horas
- **Subtotal Documentación**: ~35 horas

**TOTAL ESTIMADO**: ~715 horas (~18 semanas con 1 desarrollador a tiempo completo)

**Desglose por Complejidad**:
- **Alta Complejidad** (Inventario, Horarios, Reportes): ~200 horas
- **Media-Alta Complejidad** (Equipos, Configuración): ~150 horas
- **Media Complejidad** (Autenticación, Dashboard, Enlaces): ~120 horas
- **Baja-Media Complejidad** (Incidencias, CRUD básicos): ~100 horas
- **Infraestructura** (BD, Testing, Documentación): ~145 horas

**Consideraciones para Cotización**:
- Proyecto de tamaño medio-grande
- Alta complejidad en módulos de inventario y horarios
- Requiere conocimiento especializado de:
  - React + TypeScript (frontend moderno)
  - Node.js + Express (backend REST)
  - MySQL (consultas complejas, transacciones, vistas)
  - Sistemas de inventario con lotes y vencimientos
  - JWT y seguridad web
  - Material-UI y componentes complejos
- Mantenimiento continuo necesario por la complejidad del dominio
- Sistema en producción (Railway) con despliegue automatizado

---

## Conclusión

Este sistema es una aplicación empresarial completa con arquitectura en capas, separación frontend/backend, y lógica de negocio compleja. Los puntos críticos para debugging están bien definidos en la arquitectura, y la complejidad funcional es significativa, especialmente en los módulos de inventario y horarios. El sistema requiere mantenimiento continuo debido a la naturaleza crítica de la gestión de laboratorios universitarios.

