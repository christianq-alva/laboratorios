# Módulo de Reportes de Consumo de Insumos

## Descripción

Sistema completo de reportes ejecutivos para análisis de consumo mensual y anual de insumos por laboratorio, con gráficos estilo Power BI de nivel ejecutivo.

## Características Implementadas

### 🎯 Dashboard Ejecutivo
- **Métricas principales**: Laboratorios activos, total consumido, insumos utilizados, categorías activas
- **Gráficos interactivos**: Consumo por laboratorio, distribución por categoría, tendencia mensual
- **Análisis de eficiencia**: Variedad de insumos y días de actividad por laboratorio
- **Exportación**: CSV y JSON

### 📊 Consumo Detallado
- **Análisis temporal**: Reportes mensuales y anuales configurables
- **Filtros avanzados**: Por escuela, laboratorio, categoría y rango de fechas
- **Gráficos de tendencia**: Líneas de tiempo de consumo vs ingresos
- **Tabla detallada**: Registro completo con paginación
- **Top laboratorios**: Ranking de mayor consumo

### 🏆 Top Insumos
- **Ranking personalizable**: Top N insumos más consumidos
- **Métricas de popularidad**: Laboratorios usuarios, días activos, promedio por movimiento
- **Podio visual**: Top 3 con diseño de medallas
- **Análisis por categoría**: Distribución de consumo
- **Indicadores de rendimiento**: Barras de progreso y porcentajes

### 🔧 Funcionalidades Técnicas

#### Backend (Node.js + Express)
- **Controlador**: `server/controllers/reporteController.js`
- **Rutas**: `server/routes/reporteRoutes.js`
- **Endpoints**:
  - `GET /api/reportes/dashboard-ejecutivo` - Dashboard principal
  - `GET /api/reportes/consumo-resumen` - Consumo detallado
  - `GET /api/reportes/top-insumos` - Ranking de insumos
  - `GET /api/reportes/analisis-eficiencia` - Análisis de eficiencia
  - `GET /api/reportes/exportar` - Exportación de datos

#### Frontend (React + TypeScript)
- **Servicio**: `src/services/reporteService.ts`
- **Componentes de gráficos**:
  - `BarChart.tsx` - Gráficos de barras
  - `LineChart.tsx` - Gráficos de líneas
  - `PieChart.tsx` - Gráficos circulares
  - `AreaChart.tsx` - Gráficos de área
  - `MetricCard.tsx` - Tarjetas de métricas
- **Componentes principales**:
  - `DashboardEjecutivo.tsx` - Dashboard principal
  - `ConsumoDetallado.tsx` - Análisis detallado
  - `TopInsumos.tsx` - Ranking de insumos
  - `FiltrosReporte.tsx` - Sistema de filtros
- **Página**: `src/pages/Reportes.tsx`

### 📈 Gráficos Estilo Power BI

#### Características Visuales
- **Paleta de colores profesional**: Colores corporativos y gradientes modernos
- **Animaciones suaves**: Transiciones y efectos hover
- **Responsivo**: Adaptable a diferentes tamaños de pantalla
- **Tooltips informativos**: Información detallada al pasar el mouse
- **Leyendas interactivas**: Control de visibilidad de datos

#### Tipos de Gráficos
1. **Gráficos de Barras**: Comparación de consumo por laboratorio
2. **Gráficos de Líneas**: Tendencias temporales de consumo
3. **Gráficos Circulares**: Distribución por categorías
4. **Gráficos de Área**: Evolución temporal con relleno
5. **Tarjetas de Métricas**: KPIs con iconos y colores

### 🎛️ Sistema de Filtros

#### Filtros Disponibles
- **Tipo de período**: Mensual o anual
- **Rango de fechas**: Selector de fechas inicio/fin
- **Escuela**: Filtro por escuela específica
- **Laboratorio**: Filtro por laboratorio específico
- **Categoría de insumo**: Filtro por tipo de insumo
- **Límite de resultados**: Para top rankings

#### Rangos Rápidos
- Último mes
- Últimos 3 meses
- Este año
- Año pasado

### 📤 Sistema de Exportación

#### Formatos Disponibles
- **CSV**: Para análisis en Excel/hojas de cálculo
- **JSON**: Para integración con otros sistemas

#### Tipos de Reporte Exportables
- Dashboard ejecutivo completo
- Consumo detallado
- Top insumos
- Análisis de eficiencia

### 🔐 Control de Acceso

#### Roles Permitidos
- **Administrador**: Acceso completo a todos los laboratorios
- **Jefe de Laboratorio**: Acceso limitado a sus laboratorios asignados

#### Filtros de Seguridad
- Los datos se filtran automáticamente según los permisos del usuario
- Las consultas SQL incluyen validación de permisos por rol

### 🛠️ Tecnologías Utilizadas

#### Backend
- **Node.js** con Express
- **MySQL** para consultas de datos
- **Middleware de autenticación** para control de acceso

#### Frontend
- **React** con TypeScript
- **Material-UI** para componentes de interfaz
- **Recharts** para gráficos interactivos
- **Day.js** para manejo de fechas

### 🚀 Instalación y Configuración

#### Dependencias Nuevas
```bash
npm install recharts
```

#### Configuración de Base de Datos
El módulo utiliza las tablas existentes:
- `movimientos_insumos` - Historial de movimientos
- `insumos` - Catálogo de insumos
- `laboratorios` - Información de laboratorios
- `usuarios` - Control de acceso

### 📊 Consultas SQL Optimizadas

#### Características de Rendimiento
- **Índices**: Utiliza índices existentes en fechas y IDs
- **Agrupación eficiente**: GROUP BY optimizado para reportes
- **Límites de resultados**: LIMIT para evitar sobrecarga
- **Filtros en WHERE**: Aplicación temprana de filtros

#### Ejemplos de Consultas
```sql
-- Dashboard ejecutivo - métricas generales
SELECT 
  COUNT(DISTINCT m.laboratorio_id) as total_laboratorios_activos,
  COUNT(DISTINCT i.categoria) as total_categorias,
  SUM(CASE WHEN m.tipo_movimiento = 'salida' THEN m.cantidad ELSE 0 END) as total_consumo
FROM movimientos_insumos m
INNER JOIN insumos i ON m.insumo_id = i.id
WHERE DATE(m.fecha_movimiento) >= ? AND DATE(m.fecha_movimiento) <= ?

-- Top insumos más consumidos
SELECT 
  i.nombre as insumo_nombre,
  SUM(m.cantidad) as total_consumido,
  COUNT(DISTINCT m.laboratorio_id) as laboratorios_usuarios
FROM movimientos_insumos m
INNER JOIN insumos i ON m.insumo_id = i.id
WHERE m.tipo_movimiento = 'salida'
GROUP BY i.id
ORDER BY total_consumido DESC
LIMIT ?
```

### 🎨 Diseño de Interfaz

#### Principios de Diseño
- **Jerarquía visual clara**: Uso de tipografía y espaciado
- **Colores corporativos**: Paleta consistente con la marca
- **Gradientes modernos**: Headers con gradientes atractivos
- **Iconografía coherente**: Material Design Icons
- **Espaciado consistente**: Grid system de Material-UI

#### Componentes Reutilizables
- Tarjetas de métricas con iconos
- Filtros unificados para todos los reportes
- Botones de exportación consistentes
- Tablas con paginación y ordenamiento

### 📱 Responsive Design

#### Breakpoints
- **Móvil**: < 600px - Gráficos apilados verticalmente
- **Tablet**: 600px - 960px - Gráficos en grilla 2x2
- **Desktop**: > 960px - Layout completo con sidebar

#### Adaptaciones Móviles
- Navegación por tabs en lugar de sidebar
- Gráficos con altura optimizada
- Tablas con scroll horizontal
- Filtros colapsables

### 🔄 Actualizaciones Futuras

#### Funcionalidades Planificadas
- **Alertas automáticas**: Notificaciones por consumo excesivo
- **Predicciones**: ML para predecir demanda futura
- **Comparaciones**: Benchmarking entre laboratorios
- **Reportes programados**: Envío automático por email
- **API externa**: Integración con sistemas ERP

#### Mejoras de Rendimiento
- **Caché de consultas**: Redis para consultas frecuentes
- **Paginación del servidor**: Para grandes volúmenes de datos
- **Lazy loading**: Carga diferida de gráficos
- **Compresión**: Gzip para respuestas de API

### 📞 Soporte

Para soporte técnico o consultas sobre el módulo de reportes:
- Revisar logs del servidor en caso de errores de API
- Verificar permisos de usuario para acceso a datos
- Consultar documentación de Recharts para personalización de gráficos
- Revisar configuración de base de datos para consultas lentas

---

**Última actualización**: Septiembre 2025  
**Versión**: 1.0.0  
**Desarrollado para**: Universidad Peruana Unión - Sistema de Gestión de Laboratorios
