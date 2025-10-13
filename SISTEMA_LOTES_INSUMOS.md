# 📦 Sistema de Gestión de Lotes de Insumos

## 📋 Descripción General

El sistema ahora gestiona los insumos por **lotes individuales**, cada uno con su propio:
- Número de lote
- Cantidad específica
- Fecha de vencimiento
- Fecha de ingreso

Esto permite una trazabilidad completa y gestión FEFO (First Expired, First Out).

---

## 🔄 Flujo de Reabastecimiento

### Ejemplo Práctico

**Insumo:** Agua Destilada (ID: 1)

#### Reabastecimiento 1:
```
- Cantidad: 50 unidades
- Lote: LOTE-2024-001
- Fecha de vencimiento: 2025-12-31
- Fecha de ingreso: 2024-10-11
```

#### Reabastecimiento 2:
```
- Cantidad: 200 unidades
- Lote: LOTE-2024-002
- Fecha de vencimiento: 2026-06-30
- Fecha de ingreso: 2024-10-15
```

### Resultado en Base de Datos

#### Tabla: `movimiento_insumo_detalle`
```
| id | movimiento_id | insumo_id | cantidad | lote          | fecha_vencimiento |
|----|---------------|-----------|----------|---------------|-------------------|
| 1  | 101           | 1         | 50       | LOTE-2024-001 | 2025-12-31        |
| 2  | 102           | 1         | 200      | LOTE-2024-002 | 2026-06-30        |
```

#### Tabla: `inventario_insumos` (total consolidado)
```
| id | insumo_id | laboratorio_id | cantidad |
|----|-----------|----------------|----------|
| 1  | 1         | 5              | 250      |
```

---

## 📊 Consulta SQL para Todos los Registros de Lotes

### Query Implementada

```sql
SELECT 
  mid.id as detalle_id,
  COALESCE(mid.lote, 'SIN-LOTE') as lote,
  mid.cantidad,
  mid.fecha_vencimiento,
  m.fecha_ingreso,
  m.fecha_movimiento,
  l.nombre as laboratorio_nombre,
  l.id as laboratorio_id
FROM movimiento_insumo_detalle mid
INNER JOIN movimientos_insumos m ON mid.movimiento_id = m.id
INNER JOIN laboratorios l ON m.laboratorio_id = l.id
WHERE mid.insumo_id = ? 
  AND m.tipo_movimiento = 'entrada'
ORDER BY m.fecha_ingreso DESC, mid.fecha_vencimiento ASC
```

### ¿Por qué NO agrupamos?

Cada reabastecimiento es un **registro independiente** para mantener:
- La cantidad específica de ese ingreso
- La fecha exacta de ingreso
- Las observaciones particulares
- Trazabilidad completa del movimiento

**Ejemplo:**
```
Reabastecimiento 1 (10-ene): 50 unidades, LOTE-001, vence 31-dic-2025
Reabastecimiento 2 (15-mar): 30 unidades, LOTE-001, vence 31-dic-2025
```

**Resultado (2 registros separados):**
```
LOTE-001: 50 unidades, ingreso: 10-ene-2024, vence: 31-dic-2025
LOTE-001: 30 unidades, ingreso: 15-mar-2024, vence: 31-dic-2025
Total: 80 unidades
```

---

## 🎯 Vista en el Listado Principal

### Interfaz de Usuario

Para el insumo "Agua Destilada" con múltiples registros de lotes:

```
┌──────────────────────────────────────────────────────────────┐
│ Lotes Registrados                                             │
├──────────────────────────────────────────────────────────────┤
│ 🔵 3 registros  ✅ Total: 280 ml  ⚠️ 1 por vencer            │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────┐    │
│ │ LOTE-2024-001                      [50 ml]            │    │
│ │ 📅 Vence: 31 dic 2025 (15 días)                      │    │
│ │ 📥 Ingreso: 10 ene 2024                              │    │
│ └──────────────────────────────────────────────────────┘    │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ LOTE-2024-002                      [200 ml]           │    │
│ │ 📅 Vence: 30 jun 2026                                │    │
│ │ 📥 Ingreso: 15 mar 2024                              │    │
│ └──────────────────────────────────────────────────────┘    │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ LOTE-2024-003                      [30 ml]            │    │
│ │ 📅 Vence: 15 ago 2026                                │    │
│ │ 📥 Ingreso: 20 abr 2024                              │    │
│ └──────────────────────────────────────────────────────┘    │
│                       ▼ Scroll para más                      │
└──────────────────────────────────────────────────────────────┘
```

### Información Mostrada

1. **Resumen (Chips en la parte superior):**
   - 🔵 **Registros:** Número total de registros de reabastecimientos
   - ✅ **Total:** Suma de todas las cantidades de lotes
   - ⚠️ **Por vencer:** Lotes que vencen en ≤ 30 días

2. **Cada Registro Individual (con scroll):**
   - **Número de lote** (en negrita, monospace)
   - **Cantidad** específica del reabastecimiento (chip azul)
   - **Fecha de vencimiento** con icono 📅
   - **Días para vencer** (solo si es ≤ 30 días, en amarillo)
   - **Fecha de ingreso** con icono 📥

3. **Características visuales:**
   - **Fondo amarillo claro** para lotes próximos a vencer
   - **Scroll vertical** si hay más de ~3-4 registros
   - **Scrollbar personalizada** (discreta)
   - **Máximo 200px de altura** con scroll automático

---

## 🔍 Lógica de Alertas

### Lotes Próximos a Vencer

Un lote se considera "próximo a vencer" si:
- Tiene fecha de vencimiento definida
- Faltan ≤ 30 días para vencer
- No ha vencido aún (días ≥ 0)

```javascript
const diasParaVencer = Math.ceil(
  (new Date(fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
)
return diasParaVencer <= 30 && diasParaVencer >= 0
```

---

## 📈 Casos de Uso

### Caso 1: Mismo Insumo, Diferentes Lotes

**Escenario:**
- Compro 100 unidades de NaCl el 2024-01-15 (Lote A, vence 2025-01-31)
- Compro 150 unidades de NaCl el 2024-06-20 (Lote B, vence 2026-08-31)

**Resultado:**
```
Insumo: NaCl
Stock Total: 250 unidades
Lotes:
  - Lote A: 100 unidades (vence ene 2025) ⚠️ PRÓXIMO A VENCER
  - Lote B: 150 unidades (vence ago 2026)
```

### Caso 2: Mismo Lote, Múltiples Reabastecimientos

**Escenario:**
- Recibo 50 unidades de Etanol, Lote X (2024-02-10)
- Recibo 30 unidades de Etanol, Lote X (2024-03-15)
- Recibo 20 unidades de Etanol, Lote X (2024-04-05)

**Resultado (3 registros separados):**
```
Insumo: Etanol
Stock Total: 100 unidades (calculado)
Registros:
  - Lote X: 50 unidades, ingreso: 10-feb-2024
  - Lote X: 30 unidades, ingreso: 15-mar-2024
  - Lote X: 20 unidades, ingreso: 05-abr-2024
```

### Caso 3: Insumo Sin Lote

**Escenario:**
- Registro insumo sin especificar lote

**Resultado:**
```
Lote: SIN-LOTE
Cantidad: 75 unidades
```

---

## 🛠️ Implementación Técnica

### Backend

**Archivos modificados:**
1. `server/controllers/insumoController.js`
   - Función `getInsumos()` - Agrega consulta de lotes para admins
   
2. `server/models/Insumo.js`
   - Función `getByLaboratorio()` - Agrega consulta de lotes por lab

**Características:**
- ✅ `GROUP BY` lote + fecha de vencimiento + laboratorio
- ✅ `SUM()` para agrupar cantidades del mismo lote
- ✅ `MIN()` para la fecha de ingreso más antigua del lote
- ✅ Filtro `tipo_movimiento = 'entrada'` para no incluir salidas
- ✅ `ORDER BY` fecha de vencimiento (FEFO) y fecha de ingreso

### Frontend

**Archivos modificados:**
1. `src/services/insumoService.ts`
   - Nueva interfaz `LoteInsumo`
   - Campos agregados a `Insumo`: `lotes`, `total_lotes`, `lotes_proximos_vencer`

2. `src/components/Insumos/InsumosTable.tsx`
   - Nueva columna "Lotes Registrados"
   - Renderizado de chips con resumen
   - Display de primeros 2 lotes con detalles

**Características:**
- ✅ Vista compacta con scroll
- ✅ Alertas visuales (chips de colores)
- ✅ Formato de fechas amigable
- ✅ Indicador "+X lotes más"

---

## 🎨 Mejoras Futuras

### Corto Plazo
1. **Modal de detalles:** Click en lote para ver historial completo
2. **Exportación:** Descargar reporte de lotes por insumo
3. **Gráficos:** Visualización de vencimientos próximos

### Mediano Plazo
1. **Gestión de salidas por lote:** Consumir específicamente del lote más antiguo
2. **Alertas automáticas:** Notificaciones de lotes por vencer
3. **Ajustes de inventario:** Corrección de cantidades por lote

### Largo Plazo
1. **Trazabilidad completa:** Ver todos los movimientos de un lote específico
2. **Códigos de barras:** Escaneo de lotes para registro rápido
3. **Integración con compras:** Generación automática de lotes desde OC

---

## 📝 Notas Importantes

1. **Sincronización:** 
   - `inventario_insumos` debe ser la suma de `movimiento_insumo_detalle`
   - Los reabastecimientos actualizan ambas tablas

2. **Performance:**
   - Se ejecuta una consulta adicional por cada insumo
   - Para optimizar: considerar materialized views o caché

3. **Integridad:**
   - Los lotes se identifican por: `lote + fecha_vencimiento + laboratorio`
   - Mismo lote con diferentes fechas = lotes distintos

4. **Movimientos de salida:**
   - Actualmente no se descuentan por lote
   - Solo afectan `inventario_insumos` (total)
   - Mejora futura: implementar FEFO en salidas

---

**Última actualización:** 2024-10-11

