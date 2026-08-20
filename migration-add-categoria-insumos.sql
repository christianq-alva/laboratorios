-- Migración: agregar la categoría 'Insumos' al ENUM de insumos.categoria
-- Solo extiende los valores permitidos del ENUM. NO renombra ni reestructura la tabla.
-- Ejecutar en BD local y en Railway.
--
-- NOTA: el ENUM real de cada entorno ya debe incluir 'Farmacos' (usado por la app).
-- Este ALTER deja el conjunto completo: Reactivos, Materiales, Material_Biologico, Farmacos, Insumos.

ALTER TABLE `insumos`
  MODIFY `categoria` ENUM(
    'Reactivos',
    'Materiales',
    'Material_Biologico',
    'Farmacos',
    'Insumos'
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Materiales'
  COMMENT 'Categoría del insumo: Reactivos, Materiales, Material Biológico, Fármacos o Insumos';
