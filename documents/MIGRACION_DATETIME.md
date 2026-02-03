# Migración: TIMESTAMP → DATETIME

## Objetivo
Simplificar el manejo de fechas migrando todas las columnas TIMESTAMP a DATETIME, ya que el sistema funciona únicamente en la zona horaria America/Lima (UTC-5).

## Beneficios
- ✅ Código más simple (sin conversiones de timezone)
- ✅ Mejor rendimiento (sin conversiones automáticas)
- ✅ Menos bugs (fechas predecibles)
- ✅ Más fácil de mantener
- ✅ Consistencia total en el sistema

## Pasos de Migración

### 1. Backup de Base de Datos
```bash
mysqldump -u usuario -p laboratorios > backup_antes_migracion_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Ejecutar Script de Migración
```bash
mysql -u usuario -p laboratorios < scripts/migrate_timestamp_to_datetime.sql
```

### 3. Verificar Migración
```sql
-- Verificar que todas las columnas son DATETIME
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'laboratorios'
  AND DATA_TYPE IN ('timestamp', 'datetime')
ORDER BY TABLE_NAME, COLUMN_NAME;
```

### 4. Actualizar Código
- Reemplazar `convertirFechaParaMySQL` por `dateUtils.toMySQL`
- Actualizar imports en controladores
- Actualizar utilidades del frontend

## Configuración Requerida

### MySQL
```sql
-- Configurar timezone del servidor (opcional pero recomendado)
SET GLOBAL time_zone = '-05:00';
```

### Node.js
```javascript
// server/index.js (al inicio del archivo)
process.env.TZ = 'America/Lima'
```

## Tablas Migradas

- ✅ actividad_horarios (3 columnas: fecha_actividad, created_at, updated_at)
- ✅ actividad_sistema (1 columna: fecha_creacion)
- ✅ config_stock_laboratorio (2 columnas: fecha_configuracion, fecha_actualizacion)
- ✅ detalle_reserva_equipos (1 columna: created_at)
- ✅ enlaces_compartidos (2 columnas: created_at, updated_at)
- ✅ equipos (2 columnas: created_at, updated_at)
- ✅ inventario_equipos (2 columnas: created_at, updated_at)
- ✅ movimientos_equipos (1 columna: fecha_movimiento)
- ✅ movimientos_insumos (1 columna: fecha_ingreso)
- ✅ reservas (2 columnas: created_at, updated_at)
- ✅ tipos_equipo (1 columna: created_at)
- ✅ usuarios (2 columnas: created_at, updated_at)

**Total: 20 columnas migradas**

## Notas Importantes

1. **No hay pérdida de datos**: Los valores existentes se mantienen
2. **DEFAULT CURRENT_TIMESTAMP se mantiene**: Las columnas siguen teniendo valores por defecto
3. **ON UPDATE CURRENT_TIMESTAMP se mantiene**: Las columnas updated_at siguen actualizándose automáticamente
4. **Compatibilidad**: El código existente seguirá funcionando gracias al alias `convertirFechaParaMySQL` en `utils.js`

## Archivos Creados

### Backend
- ✅ `server/utils/dateUtils.js` - Utilidades simplificadas de fechas
- ✅ `server/utils/utils.js` - Actualizado para usar dateUtils (compatibilidad hacia atrás)

### Frontend
- ✅ `src/utils/dateUtils.ts` - Utilidades simplificadas de fechas

## Guía de Actualización de Código

### Backend

#### Opción 1: Usar nuevas utilidades (recomendado)
```javascript
// ✅ NUEVO
import { dateUtils } from '../utils/dateUtils.js'
const fechaMySQL = dateUtils.toMySQL(fechaInput)
const fechaISO = dateUtils.toISO(fechaMySQL)
const fechaFormateada = dateUtils.format(fechaMySQL, 'DD/MM/YYYY HH:mm')
```

#### Opción 2: Mantener compatibilidad (funciona sin cambios)
```javascript
// ✅ SIGUE FUNCIONANDO (usa dateUtils internamente)
import { convertirFechaParaMySQL } from '../utils/utils.js'
const fechaMySQL = convertirFechaParaMySQL(fechaInput)
```

### Frontend

#### Reemplazar conversiones manuales:
```typescript
// ❌ ANTES
const formatDateTimeLocal = (isoString: string) => {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  // ... más código
}

// ✅ DESPUÉS
import { dateUtils } from '../../utils/dateUtils'
const fechaLocal = dateUtils.toDateTimeLocal(fechaMySQL)
```

#### Reemplazar combineDateWithTime:
```typescript
// ❌ ANTES
import { combineDateWithTime } from '../../utils/timeBlocks'
const fecha = combineDateWithTime(date, time)

// ✅ DESPUÉS
import { dateUtils } from '../../utils/dateUtils'
const fecha = dateUtils.fromDateTimeLocal(`${date}T${time}`)
```

## Testing

Después de la migración, verificar:
1. ✅ Crear un nuevo horario
2. ✅ Editar un horario existente
3. ✅ Ver fechas en el calendario
4. ✅ Crear movimiento de insumos
5. ✅ Ver actividad de horarios
6. ✅ Verificar que las fechas se muestran correctamente
7. ✅ Verificar que created_at y updated_at se actualizan automáticamente

## Rollback (si es necesario)

Si necesitas revertir la migración:
```sql
-- Restaurar desde backup
mysql -u usuario -p laboratorios < backup_antes_migracion_YYYYMMDD_HHMMSS.sql
```

## Fecha de Migración
_Completar después de ejecutar: _______________


