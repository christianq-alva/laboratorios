-- Migración: Eliminar columnas de BD que no se usan en el backend
-- Fecha: 2025-02-03
-- Descripción: Elimina columnas redundantes o no utilizadas.
--   - reservas: created_by, updated_by (la auditoría se hace en actividad_horarios).
--   - equipos: eliminado (el backend hace borrado físico, no soft delete).

-- Reservas: quitar auditoría en tabla (ya existe actividad_horarios)
ALTER TABLE reservas DROP COLUMN created_by;
ALTER TABLE reservas DROP COLUMN updated_by;

-- Equipos: quitar soft delete (el backend usa DELETE físico)
ALTER TABLE equipos DROP COLUMN eliminado;
