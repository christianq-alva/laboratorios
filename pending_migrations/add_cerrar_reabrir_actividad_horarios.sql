-- Migración: Agregar acciones 'cerrar' y 'reabrir' al enum de actividad_horarios
-- Fecha: 2025-01-XX
-- Descripción: Permite registrar actividades de cierre y reapertura de horarios

ALTER TABLE actividad_horarios 
MODIFY COLUMN accion ENUM('crear','editar','eliminar', 'cerrar','reabrir') 
COLLATE utf8mb4_unicode_ci NOT NULL;

