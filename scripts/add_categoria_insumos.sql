-- Script para agregar categorías a la tabla insumos
-- Ejecutar este script en la base de datos

USE laboratorios;

-- Agregar columna de categoría a la tabla insumos
ALTER TABLE insumos 
ADD COLUMN categoria ENUM('Reactivos', 'Materiales', 'Material_Biologico') NOT NULL DEFAULT 'Materiales' 
COMMENT 'Categoría del insumo: Reactivos, Materiales o Material Biológico';

-- Agregar índice para mejorar el rendimiento de consultas por categoría
CREATE INDEX idx_insumos_categoria ON insumos(categoria);

-- Actualizar insumos existentes con categorías basadas en su nombre/descripción
-- (Esto es opcional, puedes ajustar las reglas según tus necesidades)

-- Reactivos (sustancias químicas, soluciones, etc.)
UPDATE insumos SET categoria = 'Reactivos' 
WHERE LOWER(nombre) LIKE '%ácido%' 
   OR LOWER(nombre) LIKE '%base%'
   OR LOWER(nombre) LIKE '%solución%'
   OR LOWER(nombre) LIKE '%reactivo%'
   OR LOWER(nombre) LIKE '%químico%'
   OR LOWER(nombre) LIKE '%cloruro%'
   OR LOWER(nombre) LIKE '%sulfato%'
   OR LOWER(nombre) LIKE '%nitrato%'
   OR LOWER(nombre) LIKE '%hidróxido%'
   OR LOWER(nombre) LIKE '%alcohol%'
   OR LOWER(nombre) LIKE '%etanol%'
   OR LOWER(nombre) LIKE '%metanol%'
   OR LOWER(nombre) LIKE '%acetona%'
   OR LOWER(nombre) LIKE '%benceno%'
   OR LOWER(nombre) LIKE '%tolueno%'
   OR LOWER(nombre) LIKE '%fenol%'
   OR LOWER(nombre) LIKE '%formaldehído%'
   OR LOWER(nombre) LIKE '%buffer%'
   OR LOWER(nombre) LIKE '%tampón%'
   OR LOWER(nombre) LIKE '%indicador%'
   OR LOWER(nombre) LIKE '%colorante%'
   OR LOWER(nombre) LIKE '%tinción%'
   OR LOWER(nombre) LIKE '%enzima%'
   OR LOWER(nombre) LIKE '%proteína%'
   OR LOWER(nombre) LIKE '%anticuerpo%'
   OR LOWER(nombre) LIKE '%antígeno%'
   OR LOWER(nombre) LIKE '%medio%'
   OR LOWER(nombre) LIKE '%cultivo%'
   OR LOWER(nombre) LIKE '%agar%'
   OR LOWER(nombre) LIKE '%caldo%'
   OR LOWER(nombre) LIKE '%suero%'
   OR LOWER(nombre) LIKE '%plasma%'
   OR LOWER(nombre) LIKE '%anticoagulante%'
   OR LOWER(nombre) LIKE '%conservante%'
   OR LOWER(nombre) LIKE '%fijador%'
   OR LOWER(nombre) LIKE '%desinfectante%'
   OR LOWER(nombre) LIKE '%antiséptico%';

-- Material Biológico (tejidos, células, organismos, etc.)
UPDATE insumos SET categoria = 'Material_Biologico' 
WHERE LOWER(nombre) LIKE '%tejido%'
   OR LOWER(nombre) LIKE '%célula%'
   OR LOWER(nombre) LIKE '%celular%'
   OR LOWER(nombre) LIKE '%organismo%'
   OR LOWER(nombre) LIKE '%bacteria%'
   OR LOWER(nombre) LIKE '%virus%'
   OR LOWER(nombre) LIKE '%hongo%'
   OR LOWER(nombre) LIKE '%levadura%'
   OR LOWER(nombre) LIKE '%protozoo%'
   OR LOWER(nombre) LIKE '%alga%'
   OR LOWER(nombre) LIKE '%planta%'
   OR LOWER(nombre) LIKE '%semilla%'
   OR LOWER(nombre) LIKE '%hoja%'
   OR LOWER(nombre) LIKE '%raíz%'
   OR LOWER(nombre) LIKE '%tallo%'
   OR LOWER(nombre) LIKE '%flor%'
   OR LOWER(nombre) LIKE '%fruto%'
   OR LOWER(nombre) LIKE '%animal%'
   OR LOWER(nombre) LIKE '%insecto%'
   OR LOWER(nombre) LIKE '%larva%'
   OR LOWER(nombre) LIKE '%huevo%'
   OR LOWER(nombre) LIKE '%embrión%'
   OR LOWER(nombre) LIKE '%sangre%'
   OR LOWER(nombre) LIKE '%orina%'
   OR LOWER(nombre) LIKE '%heces%'
   OR LOWER(nombre) LIKE '%saliva%'
   OR LOWER(nombre) LIKE '%moco%'
   OR LOWER(nombre) LIKE '%piel%'
   OR LOWER(nombre) LIKE '%cabello%'
   OR LOWER(nombre) LIKE '%uña%'
   OR LOWER(nombre) LIKE '%diente%'
   OR LOWER(nombre) LIKE '%hueso%'
   OR LOWER(nombre) LIKE '%músculo%'
   OR LOWER(nombre) LIKE '%órgano%'
   OR LOWER(nombre) LIKE '%cerebro%'
   OR LOWER(nombre) LIKE '%hígado%'
   OR LOWER(nombre) LIKE '%riñón%'
   OR LOWER(nombre) LIKE '%pulmón%'
   OR LOWER(nombre) LIKE '%corazón%'
   OR LOWER(nombre) LIKE '%estómago%'
   OR LOWER(nombre) LIKE '%intestino%'
   OR LOWER(nombre) LIKE '%biopsia%'
   OR LOWER(nombre) LIKE '%muestra%'
   OR LOWER(nombre) LIKE '%especimen%'
   OR LOWER(nombre) LIKE '%cultivo%'
   OR LOWER(nombre) LIKE '%cepa%'
   OR LOWER(nombre) LIKE '%linaje%'
   OR LOWER(nombre) LIKE '%estirpe%';

-- Los que no coincidan con las reglas anteriores se mantienen como 'Materiales'

-- Verificar los resultados
SELECT 
    categoria,
    COUNT(*) as cantidad,
    GROUP_CONCAT(nombre SEPARATOR ', ') as ejemplos
FROM insumos 
GROUP BY categoria
ORDER BY categoria;

-- Mostrar algunos ejemplos de cada categoría
SELECT 'Reactivos' as categoria, nombre, descripcion 
FROM insumos 
WHERE categoria = 'Reactivos' 
LIMIT 5;

SELECT 'Materiales' as categoria, nombre, descripcion 
FROM insumos 
WHERE categoria = 'Materiales' 
LIMIT 5;

SELECT 'Material_Biologico' as categoria, nombre, descripcion 
FROM insumos 
WHERE categoria = 'Material_Biologico' 
LIMIT 5;
