-- Script para migrar la estructura de movimientos_insumos
-- Este script adapta la tabla para trabajar con movimiento_insumo_detalle

-- Primero, verificar la estructura actual
DESCRIBE movimientos_insumos;

-- Agregar columna fecha_ingreso si no existe
ALTER TABLE movimientos_insumos
ADD COLUMN IF NOT EXISTS fecha_ingreso DATE;

-- IMPORTANTE: Este script NO elimina las columnas insumo_id y cantidad
-- porque puede que aún haya datos históricos que las usen.
-- Si quieres hacer una migración limpia:
-- 1. Primero asegúrate de que todos los movimientos antiguos se migren a la nueva estructura
-- 2. Luego ejecuta manualmente:
--    ALTER TABLE movimientos_insumos DROP FOREIGN KEY movimientos_insumos_ibfk_1;
--    ALTER TABLE movimientos_insumos DROP COLUMN insumo_id;
--    ALTER TABLE movimientos_insumos DROP COLUMN cantidad;

-- Comentario: La nueva estructura es:
-- movimientos_insumos (cabecera): id, laboratorio_id, tipo_movimiento, usuario_id, fecha_movimiento, fecha_ingreso
-- movimiento_insumo_detalle (detalle): id, movimiento_id, insumo_id, cantidad, lote, fecha_vencimiento

-- Verificar estructura actualizada
DESCRIBE movimientos_insumos;

