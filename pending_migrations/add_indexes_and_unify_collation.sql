-- Migración: Índices compuestos recomendados y unificación de collation
-- Fecha: 2026-02-03
-- Requisitos previos: insumos.unidad_medida y detalle_reserva_equipos.cantidad ya eliminados por el usuario.
--
-- Contenido:
--   1. Índices compuestos para consultas frecuentes (reservas por lab+estado, movimientos por lab+fecha).
--   2. Unificación de collation a utf8mb4_unicode_ci en todas las tablas.

-- =============================================================================
-- 1. Índices compuestos
-- =============================================================================

-- Reservas: listados por laboratorio y estado (Programado/Cerrado)
ALTER TABLE reservas
  ADD KEY idx_reservas_laboratorio_estado (laboratorio_id, estado);

-- Movimientos insumos: reportes por laboratorio y período
ALTER TABLE movimientos_insumos
  ADD KEY idx_movimientos_lab_fecha (laboratorio_id, fecha_movimiento);

-- =============================================================================
-- 2. Unificación de collation (utf8mb4_unicode_ci)
-- =============================================================================
-- Aplica a tablas que no usan ya utf8mb4_unicode_ci.
-- CONVERT TO modifica charset/collation de la tabla y columnas de texto.

ALTER TABLE actividad_equipos   CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE actividad_horarios  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE ciclos              CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE detalle_reserva_equipos  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE detalle_reserva_insumos  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE docentes            CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE enlaces_compartidos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE equipos             CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE escuelas            CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE incidencias         CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE insumos             CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE inventario_insumos  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE laboratorios        CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE movimiento_insumo_detalle CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE movimientos_insumos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE permisos            CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE reservas            CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE rol_permiso         CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE roles               CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE tipos_equipo        CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE unidades            CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE usuarios            CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
