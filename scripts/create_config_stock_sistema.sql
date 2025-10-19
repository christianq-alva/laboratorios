-- ================================================================
-- Script para implementar el sistema de gestión de stock mínimo
-- sin usar la tabla inventario_insumos (redundante)
-- ================================================================
-- Autor: Sistema de Gestión de Laboratorios
-- Fecha: 2025-10-19
-- Descripción: Implementa stock mínimo personalizado por laboratorio
--              y reportes de stock bajo / insumos por vencer
-- ================================================================

USE laboratorios;

-- ================================================================
-- 1. CREAR TABLA DE CONFIGURACIÓN DE STOCK POR LABORATORIO
-- ================================================================

CREATE TABLE IF NOT EXISTS config_stock_laboratorio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  insumo_id INT NOT NULL COMMENT 'ID del insumo',
  laboratorio_id INT NOT NULL COMMENT 'ID del laboratorio',
  stock_minimo INT NOT NULL DEFAULT 0 COMMENT 'Cantidad mínima que debe mantenerse',
  stock_maximo INT NULL COMMENT 'Cantidad máxima recomendada (opcional)',
  punto_reorden INT NULL COMMENT 'Nivel para solicitar reabastecimiento (opcional)',
  observaciones TEXT NULL COMMENT 'Notas sobre el consumo o uso del insumo',
  fecha_configuracion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización',
  
  -- Restricciones
  UNIQUE KEY uk_insumo_laboratorio (insumo_id, laboratorio_id),
  FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE CASCADE,
  FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id) ON DELETE CASCADE,
  
  -- Índices para optimización
  INDEX idx_stock_minimo (stock_minimo),
  INDEX idx_laboratorio (laboratorio_id),
  INDEX idx_insumo (insumo_id),
  INDEX idx_fecha_actualizacion (fecha_actualizacion)
) ENGINE=InnoDB COMMENT='Configuración de niveles de stock por laboratorio';

-- ================================================================
-- 2. CREAR VISTA DE STOCK ACTUAL (Calculado desde movimientos)
-- ================================================================

CREATE OR REPLACE VIEW v_stock_actual AS
SELECT 
  i.id as insumo_id,
  i.codigo as insumo_codigo,
  i.nombre as insumo_nombre,
  i.categoria,
  i.unidad_medida,
  i.presentacion,
  l.id as laboratorio_id,
  l.nombre as laboratorio_nombre,
  l.codigo as laboratorio_codigo,
  -- Calcula stock: suma entradas y resta salidas (consistente con Insumo.getByLaboratorio)
  COALESCE(SUM(
    CASE 
      WHEN m.tipo_movimiento = 'entrada' THEN mid.cantidad
      WHEN m.tipo_movimiento = 'salida' THEN -mid.cantidad
      ELSE 0
    END
  ), 0) as stock_actual,
  COUNT(DISTINCT mid.lote) as total_lotes_activos,
  MIN(mid.fecha_vencimiento) as fecha_vencimiento_proximo,
  MAX(m.fecha_movimiento) as ultima_actualizacion
FROM insumos i
CROSS JOIN laboratorios l
LEFT JOIN movimiento_insumo_detalle mid ON mid.insumo_id = i.id
LEFT JOIN movimientos_insumos m ON m.id = mid.movimiento_id AND m.laboratorio_id = l.id
GROUP BY i.id, i.codigo, i.nombre, i.categoria, i.unidad_medida, i.presentacion, l.id, l.nombre, l.codigo;

-- ================================================================
-- 3. CREAR VISTA DE STOCK COMPLETO (Stock + Configuración + Alertas)
-- ================================================================

CREATE OR REPLACE VIEW v_stock_completo AS
SELECT 
  s.insumo_id,
  s.insumo_codigo,
  s.insumo_nombre,
  s.categoria,
  s.unidad_medida,
  s.presentacion,
  s.laboratorio_id,
  s.laboratorio_nombre,
  s.laboratorio_codigo,
  s.stock_actual,
  s.total_lotes_activos,
  s.fecha_vencimiento_proximo,
  s.ultima_actualizacion,
  COALESCE(c.stock_minimo, 0) as stock_minimo,
  c.stock_maximo,
  c.punto_reorden,
  c.observaciones,
  -- Indicadores calculados
  (s.stock_actual - COALESCE(c.stock_minimo, 0)) as diferencia_minimo,
  CASE 
    WHEN c.stock_minimo IS NULL THEN 'SIN_CONFIGURAR'
    WHEN s.stock_actual = 0 THEN 'AGOTADO'
    WHEN s.stock_actual < c.stock_minimo THEN 'BAJO'
    WHEN c.stock_maximo IS NOT NULL AND s.stock_actual > c.stock_maximo THEN 'EXCESO'
    WHEN c.punto_reorden IS NOT NULL AND s.stock_actual <= c.punto_reorden THEN 'REORDENAR'
    ELSE 'NORMAL'
  END as estado_stock,
  CASE 
    WHEN c.stock_minimo > 0 THEN ROUND((s.stock_actual / c.stock_minimo) * 100, 2)
    ELSE NULL
  END as porcentaje_stock_minimo,
  -- Alertas de vencimiento
  CASE 
    WHEN s.fecha_vencimiento_proximo IS NULL THEN NULL
    WHEN DATEDIFF(s.fecha_vencimiento_proximo, CURDATE()) < 0 THEN 'VENCIDO'
    WHEN DATEDIFF(s.fecha_vencimiento_proximo, CURDATE()) <= 7 THEN 'VENCE_SEMANA'
    WHEN DATEDIFF(s.fecha_vencimiento_proximo, CURDATE()) <= 30 THEN 'VENCE_MES'
    WHEN DATEDIFF(s.fecha_vencimiento_proximo, CURDATE()) <= 90 THEN 'VENCE_TRIMESTRE'
    ELSE 'NORMAL'
  END as alerta_vencimiento,
  DATEDIFF(s.fecha_vencimiento_proximo, CURDATE()) as dias_hasta_vencimiento
FROM v_stock_actual s
LEFT JOIN config_stock_laboratorio c ON s.insumo_id = c.insumo_id AND s.laboratorio_id = c.laboratorio_id;

-- ================================================================
-- 4. CREAR VISTA DE RESUMEN DE ALERTAS POR LABORATORIO
-- ================================================================

CREATE OR REPLACE VIEW v_alertas_insumos AS
SELECT 
  laboratorio_id,
  laboratorio_nombre,
  laboratorio_codigo,
  -- Alertas de stock
  COUNT(CASE WHEN estado_stock = 'AGOTADO' THEN 1 END) as insumos_agotados,
  COUNT(CASE WHEN estado_stock = 'BAJO' THEN 1 END) as insumos_bajo_stock,
  COUNT(CASE WHEN estado_stock = 'REORDENAR' THEN 1 END) as insumos_reordenar,
  COUNT(CASE WHEN estado_stock = 'EXCESO' THEN 1 END) as insumos_exceso,
  COUNT(CASE WHEN estado_stock = 'SIN_CONFIGURAR' THEN 1 END) as insumos_sin_configurar,
  -- Alertas de vencimiento
  COUNT(CASE WHEN alerta_vencimiento = 'VENCIDO' THEN 1 END) as lotes_vencidos,
  COUNT(CASE WHEN alerta_vencimiento = 'VENCE_SEMANA' THEN 1 END) as vence_esta_semana,
  COUNT(CASE WHEN alerta_vencimiento = 'VENCE_MES' THEN 1 END) as vence_este_mes,
  COUNT(CASE WHEN alerta_vencimiento = 'VENCE_TRIMESTRE' THEN 1 END) as vence_trimestre,
  -- Total de alertas críticas
  COUNT(CASE WHEN estado_stock IN ('AGOTADO', 'BAJO', 'REORDENAR') THEN 1 END) +
  COUNT(CASE WHEN alerta_vencimiento IN ('VENCIDO', 'VENCE_SEMANA', 'VENCE_MES') THEN 1 END) as total_alertas_criticas,
  -- Total de insumos monitoreados
  COUNT(*) as total_insumos
FROM v_stock_completo
GROUP BY laboratorio_id, laboratorio_nombre, laboratorio_codigo;

-- ================================================================
-- 5. VERIFICAR CREACIÓN DE OBJETOS
-- ================================================================

-- Verificar tabla
SELECT 'Tabla config_stock_laboratorio creada' as resultado;
DESCRIBE config_stock_laboratorio;

-- Verificar vistas
SELECT 'Vista v_stock_actual creada' as resultado;
SELECT COUNT(*) as total_registros FROM v_stock_actual;

SELECT 'Vista v_stock_completo creada' as resultado;
SELECT COUNT(*) as total_registros FROM v_stock_completo;

SELECT 'Vista v_alertas_insumos creada' as resultado;
SELECT * FROM v_alertas_insumos;

-- ================================================================
-- 6. DATOS DE EJEMPLO (OPCIONAL - Comentado por defecto)
-- ================================================================

/*
-- Ejemplo: Configurar stock mínimo para algunos insumos
INSERT INTO config_stock_laboratorio (insumo_id, laboratorio_id, stock_minimo, punto_reorden, observaciones)
VALUES 
  (1, 1, 50, 75, 'Uso diario en prácticas de química analítica'),
  (1, 2, 10, 15, 'Uso esporádico para experimentos específicos'),
  (2, 1, 100, 150, 'Material de uso frecuente en todas las prácticas'),
  (3, 1, 20, 30, 'Reactivo de alta rotación');
*/

-- ================================================================
-- FIN DEL SCRIPT
-- ================================================================

SELECT '✅ Script ejecutado exitosamente' as resultado;
SELECT '📊 Sistema de stock mínimo implementado correctamente' as mensaje;

