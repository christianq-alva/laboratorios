-- Migración: Eliminar tablas permisos y rol_permiso
-- Fecha: 2026-02-03
-- Descripción: La autorización es por rol (tabla roles); las tablas permisos y rol_permiso
--   ya no se usan. Se elimina rol_permiso primero por su FK a permisos.

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS rol_permiso;
DROP TABLE IF EXISTS permisos;

SET FOREIGN_KEY_CHECKS = 1;
