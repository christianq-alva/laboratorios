-- ===========================================================================
-- Depreciación por práctica — seed + verificación
-- Estructura de costos por práctica 2026-1, §1 Depreciación por equipos
--
-- Uso:  mysql -h <host> -P <port> -u <user> -p <database> < este_archivo.sql
-- Es idempotente: se puede ejecutar varias veces sin efectos secundarios.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1) SEED de las categorías
--
-- INSERT IGNORE: si ya lo ejecutaste o editaste los porcentajes desde
-- Configuración → Depreciación, las filas existentes NO se tocan
-- (depreciacion_categorias.nombre es UNIQUE).
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO depreciacion_categorias (nombre, porcentaje, descripcion, activo) VALUES
  ('Pequeño', 1.0000,
   'Vaso precipitado, probeta, fiola, materiales afines a cristalería.', 1),
  ('Mediano', 1.0000,
   'Glucómetro, micropipeta, tensiómetro, estetoscopio, pulsioxímetro.', 1),
  ('Grande',  0.0500,
   'Microscopio, incubadora, horno en seco, centrifugadora, equipo baño maría, espectrofotómetro, analizador bioquímico.', 1);


-- ---------------------------------------------------------------------------
-- 2) VERIFICACIÓN del seed — deben salir 3 filas
-- ---------------------------------------------------------------------------
SELECT '--- categorías cargadas (esperado: 3) ---' AS paso;
SELECT id, nombre, porcentaje, activo FROM depreciacion_categorias
 ORDER BY porcentaje DESC, nombre;


-- ---------------------------------------------------------------------------
-- 3) VERIFICACIÓN del DDL de las fases 1-4
--    Esperado: 3 tablas y 10 columnas
-- ---------------------------------------------------------------------------
SELECT '--- tablas nuevas (esperado: 3) ---' AS paso;
SELECT table_name FROM information_schema.tables
 WHERE table_schema = DATABASE()
   AND table_name IN ('depreciacion_categorias','materiales_reutilizables','detalle_reserva_materiales')
 ORDER BY table_name;

SELECT '--- columnas nuevas (esperado: 10) ---' AS paso;
SELECT table_name, column_name, column_type, is_nullable FROM information_schema.columns
 WHERE table_schema = DATABASE()
   AND ((table_name = 'equipos'
         AND column_name IN ('valor_adquisicion','depreciacion_categoria_id'))
     OR (table_name = 'detalle_reserva_equipos'
         AND column_name IN ('cantidad','valor_unitario','porcentaje_depreciacion','costo_depreciacion'))
     OR (table_name = 'detalle_reserva_materiales'
         AND column_name IN ('cantidad','valor_unitario','porcentaje_depreciacion','costo_depreciacion')))
 ORDER BY table_name, column_name;


-- ---------------------------------------------------------------------------
-- 4) PRUEBA DE HUMO de las consultas de reportes (fase 5)
--    Solo comprueba que corren sin error de sintaxis y que los costos no se
--    multiplican entre sí. Sin horarios con depreciación devuelve ceros.
-- ---------------------------------------------------------------------------
SELECT '--- costo por escuela (fase 5) ---' AS paso;
SELECT
  e.id   AS escuela_id,
  e.nombre AS escuela,
  COUNT(DISTINCT r.id) AS total_horarios,
  CAST(COALESCE(SUM(ins.costo * r.num_grupos), 0) AS DECIMAL(12,2)) AS costo_insumos,
  CAST(COALESCE(SUM(dep.costo), 0) AS DECIMAL(12,2)) AS costo_depreciacion,
  CAST(
    COALESCE(SUM(ins.costo * r.num_grupos), 0) + COALESCE(SUM(dep.costo), 0)
    AS DECIMAL(12,2)
  ) AS costo_total
FROM reservas r
JOIN escuelas e ON r.escuela_id = e.id
LEFT JOIN (
  SELECT
    dri.reserva_id,
    SUM(dri.cantidad_usada * COALESCE(ip.precio, 0) / COALESCE(NULLIF(i.cantidad_por_presentacion, 0), 1)) AS costo
  FROM detalle_reserva_insumos dri
  JOIN insumos i ON i.id = dri.insumo_id
  LEFT JOIN insumos_precios ip
    ON ip.insumo_id = dri.insumo_id AND ip.vigente_hasta IS NULL
  GROUP BY dri.reserva_id
) ins ON ins.reserva_id = r.id
LEFT JOIN (
  SELECT reserva_id, SUM(costo_depreciacion) AS costo
  FROM (
    SELECT reserva_id, costo_depreciacion FROM detalle_reserva_equipos
    UNION ALL
    SELECT reserva_id, costo_depreciacion FROM detalle_reserva_materiales
  ) d
  GROUP BY reserva_id
) dep ON dep.reserva_id = r.id
GROUP BY e.id, e.nombre
ORDER BY costo_total DESC;
