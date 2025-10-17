# Implementación de Tipos de Equipo

## 📋 Resumen
Se ha implementado un módulo completo de gestión de **Tipos de Equipo** como tabla maestra en el módulo de configuración del sistema. Esto permite estandarizar la clasificación de equipos (Monitor, Microscopio, Centrífuga, etc.).

---

## 🗄️ Cambios en Base de Datos

### Script SQL Creado
**Archivo**: `scripts/create_tipos_equipo_table.sql`

### Tabla: `tipos_equipo`
```sql
CREATE TABLE tipos_equipo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tipos_equipo_estado (estado),
  INDEX idx_tipos_equipo_nombre (nombre)
)
```

### Modificación a Tabla: `equipos`
```sql
ALTER TABLE equipos
  ADD COLUMN tipo_equipo_id INT NULL AFTER nombre,
  ADD INDEX idx_equipos_tipo_equipo_id (tipo_equipo_id),
  ADD CONSTRAINT fk_equipos_tipo_equipo
    FOREIGN KEY (tipo_equipo_id) REFERENCES tipos_equipo(id)
    ON UPDATE CASCADE ON DELETE RESTRICT;
```

### Tipos Precargados
El script incluye 16 tipos comunes:
- Monitor
- Bomba de Infusión
- Desfibrilador
- Microscopio
- Centrífuga
- Incubadora
- Autoclave
- Balanza
- Espectrofotómetro
- Refrigerador
- Agitador
- Baño María
- Destilador
- pH-metro
- Termómetro
- Otro

### Instrucciones de Ejecución

#### FASE 1: Crear tabla y agregar columna
```bash
# Ejecutar el script SQL completo hasta la línea "COMMIT;"
# Esto creará la tabla tipos_equipo y agregará la columna tipo_equipo_id (nullable)
```

#### FASE 2 (Opcional): Scripts de backfill
El script incluye queries comentados para asignar tipos automáticamente basándose en nombres:
```sql
-- Ejemplo: Asignar "Monitor" a todos los equipos que contengan "monitor" en el nombre
UPDATE equipos e
JOIN tipos_equipo t ON t.nombre = 'Monitor'
SET e.tipo_equipo_id = t.id
WHERE e.tipo_equipo_id IS NULL 
  AND (e.nombre LIKE '%monitor%' OR e.nombre LIKE '%Monitor%');
```

#### FASE 3 (Opcional): Hacer la columna obligatoria
Una vez que todos los equipos tengan asignado un tipo:
```sql
ALTER TABLE equipos MODIFY COLUMN tipo_equipo_id INT NOT NULL;
```

---

## 🔧 Backend

### 1. Modelo: `server/models/TipoEquipo.js`
**Métodos**:
- `getAll()` - Obtener todos los tipos
- `getActivos()` - Obtener solo tipos activos
- `getById(id)` - Obtener un tipo por ID
- `create(data)` - Crear nuevo tipo
- `update(id, data)` - Actualizar tipo
- `delete(id)` - Eliminar tipo (valida que no tenga equipos asociados)
- `countEquiposByTipo(id)` - Contar equipos asociados

**Características**:
- Validación de nombres únicos
- Transacciones para operaciones CRUD
- Ordenamiento: tipos por nombre (excepto "Otro" que va al final)

### 2. Controlador: `server/controllers/tipoEquipoController.js`
**Endpoints implementados**:
- `GET /api/tipos-equipo` - Listar todos
- `GET /api/tipos-equipo/activos` - Listar activos
- `GET /api/tipos-equipo/:id` - Obtener por ID
- `GET /api/tipos-equipo/:id/count-equipos` - Contar equipos
- `POST /api/tipos-equipo` - Crear
- `PUT /api/tipos-equipo/:id` - Actualizar
- `DELETE /api/tipos-equipo/:id` - Eliminar

**Validaciones**:
- Nombre obligatorio (máx. 100 caracteres)
- Descripción opcional (máx. 255 caracteres)
- Estado: 'activo' o 'inactivo'
- Prevención de duplicados por nombre
- Prevención de eliminación si hay equipos asociados

### 3. Rutas: `server/routes/tipoEquipoRoutes.js`
- Autenticación requerida en todas las rutas
- Autorización mediante CASL:
  - **Administrador**: CRUD completo
  - **Jefe de Laboratorio**: Solo lectura

### 4. Integración en `server/index.js`
```javascript
import tipoEquipoRoutes from './routes/tipoEquipoRoutes.js'
app.use('/api/tipos-equipo', tipoEquipoRoutes)
```

### 5. Permisos en `server/abilities/defineAbilities.js`
```javascript
// Jefe de Laboratorio puede leer tipos
can('read', 'TipoEquipo')
```

---

## 🎨 Frontend

### 1. Servicio: `src/services/tipoEquipoService.ts`
**TypeScript Interfaces**:
```typescript
interface TipoEquipo {
  id: number
  nombre: string
  descripcion?: string
  estado: 'activo' | 'inactivo'
  created_at?: string
  updated_at?: string
  count_equipos?: number
}
```

**Métodos**:
- `getAll()` - Obtener todos
- `getActivos()` - Obtener activos
- `getById(id)` - Obtener por ID
- `create(data)` - Crear
- `update(id, data)` - Actualizar
- `delete(id)` - Eliminar
- `countEquipos(id)` - Contar equipos

### 2. Componente: `src/components/Configuracion/TipoEquipoForm.tsx`
**Props**:
- `open: boolean` - Controla visibilidad del diálogo
- `onClose: () => void` - Callback al cerrar
- `onSuccess: () => void` - Callback al guardar exitosamente
- `tipoEquipo?: TipoEquipo | null` - Datos para edición

**Características**:
- Formulario modal con Material-UI
- Validación en tiempo real
- Soporte para crear y editar
- Campos: Nombre, Descripción, Estado

### 3. Componente: `src/components/Configuracion/TiposEquipoTable.tsx`
**Props**:
- `tipos: TipoEquipo[]` - Lista de tipos
- `onEdit: (tipo) => void` - Callback para editar
- `onDelete: (tipo) => void` - Callback para eliminar

**Características**:
- Tabla responsiva con Material-UI
- Columnas: ID, Nombre, Descripción, Estado, Equipos, Fecha Creación, Acciones
- Chips de colores para estado
- Botones de editar/eliminar por fila
- Estado vacío con ícono y mensaje

### 4. Página: `src/pages/Configuracion.tsx`
**Características**:
- Sistema de tabs para múltiples configuraciones (extensible)
- Tab "Tipos de Equipo" implementado
- Botón "Nuevo Tipo" en header
- Carga automática de datos con conteo de equipos
- Diálogo de confirmación para eliminar
- Snackbar para mensajes de éxito/error
- Loading states con CircularProgress

**Estados manejados**:
- Lista de tipos de equipo
- Formulario abierto/cerrado
- Tipo en edición
- Diálogo de eliminación
- Snackbar de notificaciones

### 5. Integración en Rutas
**Archivo**: `src/App.tsx`
```typescript
<Route path="/configuracion" element={<Configuracion />} />
```

**Archivo**: `src/pages/index.ts`
```typescript
export { Configuracion } from './Configuracion'
```

### 6. Menú Lateral
La opción "Configuración" ya existía en `src/components/Layout/MainLayout.tsx`:
```typescript
{ 
  text: 'Configuración', 
  icon: <Settings />, 
  path: '/configuracion', 
  roles: ['Administrador'] 
}
```

---

## 🔐 Seguridad y Permisos

### Roles y Acceso
| Acción | Administrador | Jefe de Laboratorio |
|--------|---------------|---------------------|
| Ver tipos | ✅ | ✅ |
| Crear tipo | ✅ | ❌ |
| Editar tipo | ✅ | ❌ |
| Eliminar tipo | ✅ | ❌ |
| Acceder a Configuración | ✅ | ❌ |

### Validaciones de Seguridad
1. **Backend**: Middleware de autorización CASL
2. **Frontend**: Menú solo visible para Administrador
3. **Base de datos**: Foreign key ON DELETE RESTRICT

---

## 📦 Archivos Creados

### Backend (6 archivos)
- `scripts/create_tipos_equipo_table.sql`
- `server/models/TipoEquipo.js`
- `server/controllers/tipoEquipoController.js`
- `server/routes/tipoEquipoRoutes.js`

### Backend (2 archivos modificados)
- `server/index.js`
- `server/abilities/defineAbilities.js`

### Frontend (5 archivos)
- `src/services/tipoEquipoService.ts`
- `src/components/Configuracion/TipoEquipoForm.tsx`
- `src/components/Configuracion/TiposEquipoTable.tsx`
- `src/pages/Configuracion.tsx`
- `IMPLEMENTACION_TIPOS_EQUIPO.md` (este archivo)

### Frontend (2 archivos modificados)
- `src/App.tsx`
- `src/pages/index.ts`

**Total**: 13 archivos (11 nuevos, 4 modificados)

---

## 🚀 Cómo Usar

### 1. Ejecutar Migraciones
```bash
# Conectar a tu base de datos y ejecutar:
mysql -u usuario -p laboratorios_db < scripts/create_tipos_equipo_table.sql
```

### 2. Verificar Backend
```bash
# Iniciar servidor
npm run dev

# Verificar endpoint
curl http://localhost:3000/api/tipos-equipo
```

### 3. Usar en Frontend
1. Iniciar sesión como **Administrador**
2. Navegar a **Configuración** en el menú lateral
3. Ir al tab **Tipos de Equipo**
4. Usar botón **Nuevo Tipo** para crear
5. Usar botones de **Editar/Eliminar** en cada fila

---

## 🔄 Próximos Pasos (Opcional)

### 1. Integrar en Módulo de Equipos
Modificar `src/components/Equipos/EquipoForm.tsx` para:
- Agregar select de "Tipo de Equipo" (requerido)
- Cargar opciones desde `tipoEquipoService.getActivos()`
- Enviar `tipo_equipo_id` al crear/editar equipos

### 2. Actualizar Controlador de Equipos
Modificar `server/controllers/equipoController.js`:
- Validar que `tipo_equipo_id` exista y esté activo
- Incluir `tipo_equipo_nombre` en respuestas (JOIN)

### 3. Actualizar Listado de Equipos
Mostrar columna "Tipo" en `src/components/Equipos/EquiposTable.tsx`

### 4. Importación Masiva
Actualizar `src/components/Equipos/ImportacionMasivaEquipos.tsx`:
- Agregar columna "TIPO_EQUIPO" en plantilla Excel
- Resolver nombre → `tipo_equipo_id` en backend

---

## ✅ Checklist de Testing

- [ ] Ejecutar script SQL en base de datos
- [ ] Verificar que la tabla `tipos_equipo` se creó correctamente
- [ ] Verificar que hay 16 tipos precargados
- [ ] Iniciar backend sin errores
- [ ] Endpoint GET `/api/tipos-equipo` responde correctamente
- [ ] Iniciar frontend sin errores de compilación
- [ ] Acceder a Configuración como Administrador
- [ ] Crear un nuevo tipo de equipo
- [ ] Editar un tipo existente
- [ ] Cambiar estado de activo a inactivo
- [ ] Intentar eliminar tipo sin equipos asociados (debe funcionar)
- [ ] Crear equipo de prueba con `tipo_equipo_id = 1`
- [ ] Intentar eliminar tipo con equipos asociados (debe fallar)
- [ ] Verificar que Jefe de Laboratorio no ve "Configuración" en menú

---

## 📝 Notas Adicionales

- La columna `tipo_equipo_id` en `equipos` es **nullable** inicialmente para permitir migración gradual
- El tipo "Otro" siempre aparece al final de las listas
- Los tipos inactivos siguen apareciendo en el listado pero se pueden filtrar usando `getActivos()`
- El sistema de tabs en Configuración está preparado para agregar más maestros (ej: Marcas, Modelos, Proveedores)

---

## 🐛 Troubleshooting

### Error: "Unknown column 'tipo_equipo_id'"
- Asegúrate de haber ejecutado el script SQL completo (FASE 1)

### Error: "Cannot add foreign key constraint"
- Verifica que la tabla `tipos_equipo` exista antes de modificar `equipos`

### Página de Configuración en blanco
- Verifica permisos en `defineAbilities.js`
- Revisa consola del navegador para errores
- Asegúrate de estar logueado como Administrador

### No se puede eliminar un tipo
- Verifica que no tenga equipos asociados:
  ```sql
  SELECT COUNT(*) FROM equipos WHERE tipo_equipo_id = ?;
  ```
- Si tiene equipos, reasígnalos a otro tipo primero

---

**Fecha de implementación**: Octubre 2025  
**Autor**: Sistema de Laboratorios - UPeU

