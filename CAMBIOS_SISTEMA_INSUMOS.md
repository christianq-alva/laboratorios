# Cambios en el Sistema de Gestión de Insumos

## Resumen
Se ha realizado una refactorización importante en el módulo de insumos para mejorar la gestión de inventarios y permitir un seguimiento más detallado de los movimientos por lote.

## Cambios Principales

### 1. Creación de Insumos (Frontend y Backend)

#### Antes:
- El formulario de creación de insumos permitía agregar stock inicial directamente
- Se podían agregar campos como `fecha_vencimiento`, `cantidad`, `lote` al crear el insumo
- El backend manejaba la creación del insumo y el stock inicial en una sola transacción

#### Ahora:
- **El formulario solo crea el insumo maestro** (catálogo)
- Los campos eliminados del formulario: `fecha_vencimiento`, `stock_inicial`
- Los campos que se mantienen: `nombre`, `descripcion`, `unidad_medida`, `categoria`, `presentacion`, `condicion`, `observacion`
- El backend solo crea el registro en la tabla `insumos` sin tocar el inventario

#### Beneficios:
- Separación clara entre el catálogo de insumos y el inventario
- Simplifica el proceso de creación de nuevos insumos
- Facilita la gestión de insumos compartidos entre laboratorios

**Archivos modificados:**
- `src/components/Insumos/InsumoForm.tsx`
- `server/controllers/insumoController.js` (función `createInsumo`)

---

### 2. Nueva Tabla: `movimiento_insumo_detalle`

#### Estructura:
```sql
CREATE TABLE movimiento_insumo_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movimiento_id INT NOT NULL,      -- FK a movimientos_insumos
    insumo_id INT NOT NULL,          -- FK a insumos
    cantidad INT NOT NULL,            -- Cantidad específica de este lote
    lote VARCHAR(50),                 -- Número de lote
    fecha_vencimiento DATE,           -- Fecha de vencimiento específica del lote
    
    FOREIGN KEY (movimiento_id) REFERENCES movimientos_insumos(id) ON DELETE CASCADE,
    FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE CASCADE
);
```

#### Propósito:
- Permite registrar múltiples insumos en un solo movimiento
- Almacena información específica por lote (cantidad, número de lote, fecha de vencimiento)
- Facilita la trazabilidad de insumos perecederos

**Script de creación:**
- `scripts/create_movimiento_insumo_detalle.sql`

---

### 3. Modificación de `movimientos_insumos`

#### Cambios en la estructura:
- **Nueva columna**: `fecha_ingreso DATE` - Fecha en que se recibió el insumo
- **Columnas que pueden eliminarse** (si se migran datos antiguos): `insumo_id`, `cantidad`

#### Nueva relación:
```
movimientos_insumos (1) -----> (N) movimiento_insumo_detalle
    (cabecera)                        (detalle por insumo/lote)
```

**Script de migración:**
- `scripts/migrate_movimientos_insumos_structure.sql`

---

### 4. Modal de Reabastecimiento Mejorado

#### Antes:
- Solo se registraba: insumo, cantidad, observaciones
- No había forma de especificar lotes o fechas de vencimiento

#### Ahora:
- **Nuevos campos por insumo**:
  - `lote`: Número de lote del insumo
  - `fecha_ingreso`: Fecha en que se recibió (por defecto: fecha actual)
  - `fecha_vencimiento`: Fecha de caducidad del lote (opcional)
  - `cantidad`: Cantidad a agregar
  - `observaciones`: Notas específicas para este insumo

#### UI mejorado:
- Campos organizados en secciones lógicas
- Validación de fechas
- Fecha de ingreso predeterminada al día actual

**Archivos modificados:**
- `src/components/Insumos/ReabastecimientoModal.tsx`

---

### 5. Backend de Reabastecimiento Actualizado

#### Flujo anterior:
1. Por cada insumo: actualizar inventario
2. Por cada insumo: crear un movimiento individual

#### Flujo nuevo:
1. **Crear un movimiento principal** (cabecera) con fecha de ingreso
2. **Por cada insumo**: crear un registro en `movimiento_insumo_detalle` con:
   - `movimiento_id`: ID del movimiento principal
   - `insumo_id`, `cantidad`, `lote`, `fecha_vencimiento`
3. **Por cada insumo**: actualizar el inventario (agregando la cantidad)

#### Ventajas:
- Un solo movimiento puede contener múltiples insumos
- Cada insumo puede tener diferentes lotes y fechas de vencimiento
- Mejor trazabilidad y auditoría
- Facilita reportes por lote

**Archivos modificados:**
- `server/controllers/insumoController.js` (función `reabastecimientoInsumos`)

---

## Flujo Completo Actualizado

### Paso 1: Crear Insumo Maestro
1. Usuario accede al módulo de Insumos
2. Hace clic en "Nuevo Insumo"
3. Completa el formulario simplificado (solo datos maestros)
4. El sistema genera un código único (ej: `INS-0001`)
5. Se crea el registro en la tabla `insumos`
6. **NO se crea inventario en este paso**

### Paso 2: Registrar Entrada de Insumos (Reabastecimiento)
1. Usuario accede a "Reabastecimiento" dentro del módulo de Insumos
2. Selecciona el laboratorio destino
3. Agrega uno o más insumos del catálogo
4. Por cada insumo, especifica:
   - Cantidad a agregar
   - Número de lote
   - Fecha de ingreso (predeterminada: hoy)
   - Fecha de vencimiento (opcional)
   - Observaciones específicas
5. Al enviar:
   - Se crea 1 movimiento principal en `movimientos_insumos`
   - Se crean N registros en `movimiento_insumo_detalle` (uno por insumo)
   - Se actualizan N registros en `inventario_insumos`

### Paso 3: Consultar Inventario
- El inventario muestra la cantidad total por insumo y laboratorio
- El historial de movimientos muestra cada entrada/salida
- Los detalles del movimiento muestran lotes y fechas específicas

---

## Migración de Datos Existentes

### Opción 1: Mantener compatibilidad (recomendado para producción)
- Mantener las columnas `insumo_id` y `cantidad` en `movimientos_insumos`
- Los movimientos antiguos seguirán funcionando
- Los nuevos movimientos usarán `movimiento_insumo_detalle`
- Migrar gradualmente los datos antiguos

### Opción 2: Migración completa (requiere downtime)
1. Ejecutar script de migración de datos:
   ```sql
   -- Migrar datos antiguos a la nueva estructura
   INSERT INTO movimiento_insumo_detalle (movimiento_id, insumo_id, cantidad, lote, fecha_vencimiento)
   SELECT id, insumo_id, cantidad, NULL, NULL
   FROM movimientos_insumos
   WHERE insumo_id IS NOT NULL;
   ```

2. Eliminar columnas antiguas:
   ```sql
   ALTER TABLE movimientos_insumos DROP FOREIGN KEY movimientos_insumos_ibfk_1;
   ALTER TABLE movimientos_insumos DROP COLUMN insumo_id;
   ALTER TABLE movimientos_insumos DROP COLUMN cantidad;
   ```

---

## Testing

### Test 1: Crear Insumo
1. ✅ Abrir formulario de nuevo insumo
2. ✅ Verificar que no hay campos de stock
3. ✅ Completar formulario con datos válidos
4. ✅ Verificar que se crea el insumo en la base de datos
5. ✅ Verificar que NO se crea inventario

### Test 2: Reabastecimiento con Lote
1. ✅ Abrir modal de reabastecimiento
2. ✅ Seleccionar laboratorio
3. ✅ Agregar un insumo
4. ✅ Completar campos: cantidad, lote, fecha_ingreso, fecha_vencimiento
5. ✅ Enviar reabastecimiento
6. ✅ Verificar creación de movimiento en `movimientos_insumos`
7. ✅ Verificar creación de detalle en `movimiento_insumo_detalle`
8. ✅ Verificar actualización de inventario en `inventario_insumos`

### Test 3: Reabastecimiento Múltiple
1. ✅ Agregar 3 insumos diferentes con lotes distintos
2. ✅ Verificar que se crea 1 movimiento
3. ✅ Verificar que se crean 3 detalles
4. ✅ Verificar que se actualizan 3 inventarios

---

## Beneficios del Nuevo Sistema

### 1. Trazabilidad Mejorada
- Seguimiento por lote
- Fechas de vencimiento específicas por lote
- Auditoría completa de entradas

### 2. Flexibilidad
- Un movimiento puede incluir múltiples insumos
- Diferentes lotes del mismo insumo en un solo movimiento
- Información detallada por cada entrada

### 3. Separación de Responsabilidades
- Catálogo de insumos independiente del inventario
- Movimientos separados del stock actual
- Facilita reportes y análisis

### 4. Escalabilidad
- Estructura preparada para funcionalidades futuras:
  - Alertas por vencimiento de lotes
  - Reportes por lote
  - Trazabilidad completa de insumos críticos
  - Integración con sistemas de compras

---

## Notas Importantes

1. **Permisos**: Los permisos existentes se mantienen sin cambios
2. **Validaciones**: Se agregaron validaciones para fechas y lotes
3. **Compatibilidad**: El sistema puede coexistir con movimientos antiguos
4. **Performance**: Los índices en la nueva tabla aseguran consultas rápidas

---

## Próximos Pasos Recomendados

1. ✅ Crear la tabla `movimiento_insumo_detalle` en producción
2. ✅ Agregar columna `fecha_ingreso` a `movimientos_insumos`
3. ⬜ Migrar datos históricos (opcional)
4. ⬜ Eliminar columnas antiguas (opcional, después de migración)
5. ⬜ Actualizar reportes para mostrar información de lotes
6. ⬜ Implementar alertas de vencimiento por lote
7. ⬜ Crear vista de inventario por lote

