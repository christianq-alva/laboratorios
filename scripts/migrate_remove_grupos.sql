-- Script de migración: Eliminar grupos y usar escuela_id/ciclo_id directamente en reservas
-- Ejecutar este script en la base de datos antes de actualizar el código

-- 1. Agregar nuevas columnas a la tabla reservas
ALTER TABLE reservas 
ADD COLUMN escuela_id INT NULL AFTER grupo_id,
ADD COLUMN ciclo_id INT NULL AFTER escuela_id;

-- 2. Migrar datos existentes desde grupos a reservas
UPDATE reservas r
INNER JOIN grupos g ON r.grupo_id = g.id
SET r.escuela_id = g.escuela_id,
    r.ciclo_id = g.ciclo_id;

-- 3. Verificar que todos los registros tienen escuela_id y ciclo_id
-- Si hay registros sin grupo_id, necesitarás manejarlos manualmente
SELECT COUNT(*) as registros_sin_grupo 
FROM reservas 
WHERE escuela_id IS NULL OR ciclo_id IS NULL;

-- 4. Hacer las columnas NOT NULL después de verificar
ALTER TABLE reservas 
MODIFY COLUMN escuela_id INT NOT NULL,
MODIFY COLUMN ciclo_id INT NOT NULL;

-- 5. Agregar foreign keys
ALTER TABLE reservas
ADD CONSTRAINT fk_reservas_escuela FOREIGN KEY (escuela_id) REFERENCES escuelas(id),
ADD CONSTRAINT fk_reservas_ciclo FOREIGN KEY (ciclo_id) REFERENCES ciclos(id);

-- 6. Eliminar la columna grupo_id de reservas
ALTER TABLE reservas DROP COLUMN grupo_id;

-- 7. (Opcional) Eliminar la tabla grupos si no se usa en otros lugares
-- Verificar primero si hay otras tablas que referencien grupos
-- DROP TABLE grupos;

