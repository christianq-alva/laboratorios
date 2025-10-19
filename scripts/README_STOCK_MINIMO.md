# 📋 Sistema de Stock Mínimo - Guía de Implementación

## ✅ Ya Implementado (Backend + Frontend Service)

### 1. Base de Datos
- ✅ Tabla `config_stock_laboratorio` - Configuración de stock por laboratorio
- ✅ Vista `v_stock_actual` - Stock calculado desde movimientos
- ✅ Vista `v_stock_completo` - Stock + configuración + alertas
- ✅ Vista `v_alertas_insumos` - Resumen de alertas por laboratorio

### 2. Backend (Controladores + Rutas)
- ✅ `getStockActual()` - Obtener stock actual de un insumo
- ✅ `configurarStockMinimo()` - Configurar stock mínimo
- ✅ `getConfiguracionStock()` - Ver configuración de un insumo
- ✅ `getInsumosStockBajo()` - Reporte de stock bajo
- ✅ `getInsumosProximosVencer()` - Reporte de insumos por vencer
- ✅ `getResumenAlertas()` - Resumen de alertas para dashboard

### 3. Frontend (Servicio)
- ✅ Métodos TypeScript en `insumoService.ts`
- ✅ Interfaces y tipos definidos

## 🔧 Siguiente Paso: Ejecutar Script SQL

**IMPORTANTE**: Antes de continuar, debes ejecutar el script SQL:

```bash
# Opción 1: Desde MySQL Workbench o phpMyAdmin
# Abrir y ejecutar: scripts/create_config_stock_sistema.sql

# Opción 2: Desde terminal
mysql -u root -p laboratorios < scripts/create_config_stock_sistema.sql
```

## 📝 Componentes Frontend Pendientes

1. **ConfigStockMinimoForm.tsx** - Formulario para configurar stock mínimo
2. **ReporteStockBajo.tsx** - Vista de reporte de stock bajo
3. **ReporteProximosVencer.tsx** - Vista de reporte de insumos por vencer
4. Integración en módulo de Reportes

## 🎯 Arquitectura Implementada

```
┌─────────────────────────────────────────────────────────────┐
│  TABLAS BASE (Sin inventario_insumos)                       │
├─────────────────────────────────────────────────────────────┤
│  • insumos (catálogo)                                        │
│  • laboratorios                                              │
│  • movimientos_insumos (transacciones)                      │
│  • movimiento_insumo_detalle (lotes + vencimiento)         │
│  • config_stock_laboratorio (stock mínimo) ← NUEVA         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  VISTAS CALCULADAS                                           │
├─────────────────────────────────────────────────────────────┤
│  • v_stock_actual (calcula desde movimientos)               │
│  • v_stock_completo (stock + config + alertas)              │
│  • v_alertas_insumos (resumen para dashboard)               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ENDPOINTS API (REST)                                        │
├─────────────────────────────────────────────────────────────┤
│  GET  /api/insumos/stock-actual/:id/:lab                    │
│  POST /api/insumos/config-stock                             │
│  GET  /api/insumos/config-stock/:id                         │
│  GET  /api/insumos/stock-bajo                               │
│  GET  /api/insumos/proximos-vencer                          │
│  GET  /api/insumos/resumen-alertas                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  SERVICIO FRONTEND (TypeScript)                              │
├─────────────────────────────────────────────────────────────┤
│  • insumoService.getStockActual()                            │
│  • insumoService.configurarStockMinimo()                     │
│  • insumoService.getInsumosStockBajo()                       │
│  • insumoService.getInsumosProximosVencer()                  │
│  • insumoService.getResumenAlertas()                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  COMPONENTES UI (Pendiente)                                  │
├─────────────────────────────────────────────────────────────┤
│  • ConfigStockMinimoForm.tsx                                 │
│  • ReporteStockBajo.tsx                                      │
│  • ReporteProximosVencer.tsx                                 │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 Características Principales

### Stock Mínimo Personalizado
- Cada insumo puede tener stock mínimo diferente por laboratorio
- Ejemplo: Ácido Sulfúrico tiene stock_minimo=50 en Lab Química, pero stock_minimo=10 en Lab Física

### Reportes Inteligentes
1. **Stock Bajo**: Muestra insumos agotados, bajos o que necesitan reorden
2. **Próximos a Vencer**: Lotes clasificados por urgencia (vencido, vence hoy, urgente, próximo)

### Sin Tabla Redundante
- Elimina `inventario_insumos` (redundante)
- Todo se calcula desde `movimientos_insumos` + `movimiento_insumo_detalle`
- Única fuente de verdad, totalmente auditable

## 📊 Ejemplos de Uso

### Configurar Stock Mínimo
```typescript
await insumoService.configurarStockMinimo({
  insumo_id: 15,
  laboratorio_id: 1,
  stock_minimo: 50,
  punto_reorden: 75,
  observaciones: 'Uso diario en prácticas de química'
})
```

### Obtener Reporte de Stock Bajo
```typescript
const reporte = await insumoService.getInsumosStockBajo(1) // Lab ID opcional
// Retorna: agotados, bajo stock, necesitan reorden
```

### Obtener Insumos por Vencer
```typescript
const reporte = await insumoService.getInsumosProximosVencer(1, 30) // Próximos 30 días
// Retorna: vencidos, vence hoy, urgente, próximo
```

## 🚀 Próximos Pasos

1. ✅ Ejecutar `create_config_stock_sistema.sql`
2. ⏳ Crear componentes UI
3. ⏳ Integrar en módulo de Reportes
4. ⏳ Probar flujo completo

---

**Estado**: Backend 100% completo | Frontend Service 100% | UI 0%

