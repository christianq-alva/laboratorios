-- Migración: NOT NULL en tablas de detalle, eliminar columna cantidad de inventario_insumos, eliminar índices redundantes
-- Fecha: 2026-02-03
-- Descripción:
--   1. detalle_reserva_insumos: reserva_id, insumo_id, cantidad_usada NOT NULL.
--   2. inventario_insumos: eliminar columna cantidad (no usada), insumo_id y laboratorio_id NOT NULL, UNIQUE(insumo_id, laboratorio_id).
--   3. Eliminar índices redundantes (duplican UNIQUE o misma columna).

-- =============================================================================
-- 1. detalle_reserva_insumos
-- =============================================================================
ALTER TABLE detalle_reserva_insumos
  MODIFY COLUMN reserva_id int NOT NULL,
  MODIFY COLUMN insumo_id int NOT NULL,
  MODIFY COLUMN cantidad_usada int NOT NULL DEFAULT 0;

-- =============================================================================
-- 2. inventario_insumos
-- =============================================================================
ALTER TABLE inventario_insumos DROP COLUMN cantidad;

ALTER TABLE inventario_insumos
  MODIFY COLUMN insumo_id int NOT NULL,
  MODIFY COLUMN laboratorio_id int NOT NULL;

ALTER TABLE inventario_insumos
  ADD UNIQUE KEY uq_inventario_insumos_insumo_lab (insumo_id, laboratorio_id);

-- =============================================================================
-- 3. Índices redundantes (ya cubiertos por UNIQUE o por otro índice en la misma columna)
-- =============================================================================
ALTER TABLE actividad_horarios DROP INDEX idx_actividad_reserva_id;
ALTER TABLE enlaces_compartidos DROP INDEX idx_token;
ALTER TABLE insumos DROP INDEX idx_insumos_codigo;
ALTER TABLE laboratorios DROP INDEX idx_laboratorios_codigo;
