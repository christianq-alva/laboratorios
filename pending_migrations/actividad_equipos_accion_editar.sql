-- Migración: Unificar acción "actualizar" a "editar" en actividad_equipos (consistente con actividad_horarios)
-- Fecha: 2026-02-03
-- Descripción: Cambia el enum accion de ('crear','actualizar','eliminar') a ('crear','editar','eliminar').

-- 1. Añadir valor 'editar' al enum
ALTER TABLE actividad_equipos
  MODIFY COLUMN accion enum('crear','actualizar','editar','eliminar') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- 2. Migrar datos existentes
UPDATE actividad_equipos SET accion = 'editar' WHERE accion = 'actualizar';

-- 3. Dejar solo los valores finales (quitar 'actualizar')
ALTER TABLE actividad_equipos
  MODIFY COLUMN accion enum('crear','editar','eliminar') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
