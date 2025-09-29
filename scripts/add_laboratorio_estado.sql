-- Script para agregar el campo estado a la tabla laboratorios
-- Ejecutar este script para permitir estados en laboratorios

USE laboratorios_db;

-- Agregar la columna estado con valores predefinidos
ALTER TABLE laboratorios 
ADD COLUMN estado ENUM('Activo', 'En Mantenimiento', 'Inhabilitado', 'Baja') 
DEFAULT 'Activo' 
AFTER piso;

-- Actualizar todos los registros existentes para que tengan estado 'Activo'
UPDATE laboratorios SET estado = 'Activo' WHERE estado IS NULL;

-- Verificar que se agregó correctamente
DESCRIBE laboratorios;

-- Mostrar algunos registros para verificar
SELECT id, codigo, nombre, estado FROM laboratorios LIMIT 5;

-- Mostrar estadísticas de estados
SELECT estado, COUNT(*) as cantidad 
FROM laboratorios 
GROUP BY estado;
