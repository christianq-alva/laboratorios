-- Script para remover la restricción de unicidad del código de laboratorio
-- Ejecutar este script para permitir códigos duplicados en laboratorios

USE laboratorios_db;

-- Verificar si existe la restricción de unicidad en el código
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    TABLE_NAME,
    COLUMN_NAME
FROM information_schema.TABLE_CONSTRAINTS tc
JOIN information_schema.KEY_COLUMN_USAGE kcu 
    ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
WHERE tc.TABLE_SCHEMA = 'laboratorios_db' 
    AND tc.TABLE_NAME = 'laboratorios' 
    AND kcu.COLUMN_NAME = 'codigo'
    AND tc.CONSTRAINT_TYPE = 'UNIQUE';

-- Si existe una restricción UNIQUE en el código, eliminarla
-- (El nombre exacto puede variar, ajustar según el resultado de la consulta anterior)

-- Posibles nombres de restricción que podrían existir:
-- ALTER TABLE laboratorios DROP INDEX unique_codigo_laboratorio;
-- ALTER TABLE laboratorios DROP INDEX codigo;
-- ALTER TABLE laboratorios DROP INDEX codigo_UNIQUE;

-- Comando genérico para eliminar cualquier índice único en la columna codigo:
SET @sql = NULL;
SELECT GROUP_CONCAT(DISTINCT
    CONCAT('ALTER TABLE laboratorios DROP INDEX ', INDEX_NAME, ';')
    SEPARATOR ' '
) INTO @sql
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'laboratorios_db' 
    AND TABLE_NAME = 'laboratorios' 
    AND COLUMN_NAME = 'codigo'
    AND NON_UNIQUE = 0;

-- Ejecutar el comando si existe
SET @sql = IFNULL(@sql, 'SELECT "No hay restricciones de unicidad en la columna codigo" as mensaje;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar que se eliminó correctamente
SELECT 'Restricciones restantes en la tabla laboratorios:' as mensaje;
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    COLUMN_NAME
FROM information_schema.TABLE_CONSTRAINTS tc
JOIN information_schema.KEY_COLUMN_USAGE kcu 
    ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
WHERE tc.TABLE_SCHEMA = 'laboratorios_db' 
    AND tc.TABLE_NAME = 'laboratorios';
