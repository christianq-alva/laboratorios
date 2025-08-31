# Funcionalidad de Carga Masiva de Stock de Insumos

## Descripción

Esta funcionalidad permite cargar masivamente el stock de insumos mediante una plantilla de Excel que contiene códigos únicos de insumos, cantidades y códigos de laboratorios. El sistema incluye validación de datos, previsualización y confirmación antes de ejecutar el reabastecimiento.

## Características Implementadas

### 1. Códigos Únicos
- **Insumos**: Código formato `INS-XXXX` (ej: `INS-0001`)
- **Laboratorios**: Código formato `LAB-XXXX` (ej: `LAB-0001`)
- Generación automática al crear nuevos registros
- Índices únicos para optimización de búsquedas

### 2. Plantilla Excel
- **Descarga automática** de plantilla con formato correcto
- **Tres hojas**:
  - Plantilla de Reabastecimiento (para completar)
  - Insumos Disponibles (códigos y nombres)
  - Laboratorios Disponibles (códigos y nombres)
- **Validación de columnas**: `CODIGO_INSUMO`, `CANTIDAD`, `CODIGO_LABORATORIO`

### 3. Procesamiento de Archivos
- **Validación de formato**: Solo archivos .xlsx y .xls
- **Límite de tamaño**: 5MB máximo
- **Validación de datos**:
  - Códigos de insumos existentes
  - Códigos de laboratorios existentes
  - Cantidades numéricas positivas
  - Permisos del usuario sobre laboratorios

### 4. Modal de Previsualización
- **Stepper de 4 pasos**:
  1. Descargar Plantilla
  2. Subir Archivo
  3. Previsualizar Datos
  4. Confirmar Reabastecimiento
- **Tabla de previsualización** con datos validados
- **Lista de errores** detallada por fila
- **Campo de motivo** personalizable

### 5. Reabastecimiento Masivo
- **Transacciones atómicas**: Todo o nada
- **Actualización de stock**: Suma a inventario existente
- **Registro de movimientos**: Historial completo
- **Resultados detallados**: Estado por cada registro

## Estructura de la Base de Datos

### Campos Agregados

```sql
-- Tabla insumos
ALTER TABLE insumos ADD COLUMN codigo VARCHAR(50) UNIQUE;
CREATE INDEX idx_insumos_codigo ON insumos(codigo);

-- Tabla laboratorios  
ALTER TABLE laboratorios ADD COLUMN codigo VARCHAR(50) UNIQUE;
CREATE INDEX idx_laboratorios_codigo ON laboratorios(codigo);
```

### Migración Ejecutada
- Script: `scripts/add_codigo_fields.js`
- Códigos generados automáticamente para registros existentes
- Restricciones UNIQUE aplicadas

## API Endpoints

### Nuevas Rutas

```javascript
// Descargar plantilla Excel
GET /api/insumos/plantilla-excel

// Procesar archivo Excel subido
POST /api/insumos/procesar-excel
// Body: FormData con archivo_excel

// Ejecutar reabastecimiento masivo
POST /api/insumos/reabastecimiento-masivo
// Body: { datos_reabastecimiento: [...], motivo_general: "..." }
```

## Componentes del Frontend

### Nuevos Componentes
- `CargaMasivaModal.tsx`: Modal principal con stepper
- Actualización de `InsumosTable.tsx`: Botón de carga masiva y columna de códigos
- Actualización de `Insumos.tsx`: Integración del modal

### Servicios Actualizados
- `insumoService.ts`: Métodos para plantilla, procesamiento y reabastecimiento masivo
- `laboratorioService.ts`: Interface actualizada con códigos

## Uso de la Funcionalidad

### Para el Usuario

1. **Acceder al módulo de Insumos**
2. **Hacer clic en "Carga Masiva"** (botón azul en la parte superior)
3. **Descargar plantilla Excel** desde el modal
4. **Completar la plantilla** con los datos de reabastecimiento
5. **Subir el archivo** completado
6. **Revisar la previsualización** de datos validados
7. **Confirmar el reabastecimiento** si todo es correcto

### Formato de la Plantilla Excel

| CODIGO_INSUMO | CANTIDAD | CODIGO_LABORATORIO |
|---------------|----------|-------------------|
| INS-0001      | 50       | LAB-0001          |
| INS-0002      | 100      | LAB-0002          |
| INS-0003      | 25       | LAB-0001          |

## Validaciones Implementadas

### Validaciones de Archivo
- ✅ Formato de archivo (.xlsx, .xls)
- ✅ Tamaño máximo (5MB)
- ✅ Estructura de columnas correcta
- ✅ Al menos una fila de datos

### Validaciones de Datos
- ✅ Códigos de insumos existentes en la base de datos
- ✅ Códigos de laboratorios existentes en la base de datos
- ✅ Cantidades numéricas enteras positivas
- ✅ Permisos del usuario sobre laboratorios específicos
- ✅ Datos completos por fila

### Validaciones de Seguridad
- ✅ Autenticación requerida
- ✅ Autorización por rol
- ✅ Validación de permisos por laboratorio
- ✅ Transacciones atómicas

## Manejo de Errores

### Errores por Fila
- Datos incompletos
- Códigos inexistentes
- Cantidades inválidas
- Permisos insuficientes

### Errores Generales
- Archivo corrupto o inválido
- Error de conexión a base de datos
- Falla en transacción

## Beneficios

### Para Administradores
- **Eficiencia**: Carga de cientos de registros en minutos
- **Precisión**: Validación automática reduce errores
- **Trazabilidad**: Historial completo de movimientos
- **Flexibilidad**: Plantilla adaptable a diferentes necesidades

### Para el Sistema
- **Integridad**: Códigos únicos evitan duplicados
- **Performance**: Índices optimizados para búsquedas
- **Escalabilidad**: Procesamiento por lotes
- **Mantenibilidad**: Código modular y documentado

## Archivos Principales

### Backend
- `server/controllers/insumoController.js`: Lógica de carga masiva
- `server/routes/insumoRoutes.js`: Nuevas rutas API
- `server/models/Insumo.js`: Consultas actualizadas con códigos
- `scripts/add_codigo_fields.js`: Migración de códigos únicos

### Frontend
- `src/components/Insumos/CargaMasivaModal.tsx`: Modal principal
- `src/components/Insumos/InsumosTable.tsx`: Tabla actualizada
- `src/services/insumoService.ts`: Servicios API
- `src/pages/Insumos.tsx`: Página principal actualizada

### Dependencias Agregadas
- `xlsx`: Procesamiento de archivos Excel
- `multer`: Subida de archivos

## Próximas Mejoras Posibles

1. **Validación en tiempo real** durante la subida
2. **Plantillas personalizadas** por laboratorio
3. **Importación de múltiples archivos** simultáneamente
4. **Notificaciones por email** de resultados
5. **Exportación de resultados** a Excel
6. **Programación de cargas** automáticas
7. **Integración con códigos de barras**

---

*Implementación completada el $(date) - Sistema de Gestión de Laboratorios*
