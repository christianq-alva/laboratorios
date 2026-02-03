-- Migración: Eliminar tablas de BD que ya no se usan en el backend
-- Fecha: 2025-02-03
-- Descripción: Elimina la referencia reservas -> grupos y luego las tablas
--   grupos, actividad_sistema, inventario_equipos, movimientos_equipos,
--   jefe_laboratorio y config_stock_laboratorio.
-- Reservas ya tiene escuela_id, ciclo_id y sus FKs; solo falta quitar grupo_id.

SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar referencia de reservas a grupos
ALTER TABLE reservas DROP FOREIGN KEY reservas_ibfk_5;
ALTER TABLE reservas DROP COLUMN grupo_id;

-- Vistas que pueden depender de config_stock_laboratorio
DROP VIEW IF EXISTS v_stock_completo;
DROP VIEW IF EXISTS v_stock_actual;

-- Tablas no usadas por el backend
DROP TABLE IF EXISTS actividad_sistema;
DROP TABLE IF EXISTS config_stock_laboratorio;
DROP TABLE IF EXISTS jefe_laboratorio;
DROP TABLE IF EXISTS inventario_equipos;
DROP TABLE IF EXISTS movimientos_equipos;
DROP TABLE IF EXISTS grupos;

SET FOREIGN_KEY_CHECKS = 1;
