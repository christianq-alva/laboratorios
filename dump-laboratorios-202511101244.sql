/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-12.0.2-MariaDB, for osx10.20 (arm64)
--
-- Host: crossover.proxy.rlwy.net    Database: laboratorios
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `actividad_equipos`
--

DROP TABLE IF EXISTS `actividad_equipos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `actividad_equipos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `accion` enum('crear','actualizar','eliminar') COLLATE utf8mb4_unicode_ci NOT NULL,
  `equipo_id` int DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario_id` int NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_actividad` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_equipo_id` (`equipo_id`),
  KEY `idx_usuario_id` (`usuario_id`),
  KEY `idx_fecha` (`fecha_actividad`),
  CONSTRAINT `actividad_equipos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `actividad_horarios`
--

DROP TABLE IF EXISTS `actividad_horarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `actividad_horarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `accion` enum('crear','editar','eliminar','ver') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reserva_id` int NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `fecha_actividad` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `usuario_id` int NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reserva_id` (`reserva_id`),
  KEY `idx_usuario_id` (`usuario_id`),
  KEY `idx_fecha_actividad` (`fecha_actividad`),
  KEY `idx_accion` (`accion`),
  KEY `idx_actividad_reserva_id` (`reserva_id`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `actividad_sistema`
--

DROP TABLE IF EXISTS `actividad_sistema`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `actividad_sistema` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `accion` enum('crear','editar','eliminar','ver') NOT NULL,
  `modulo` enum('horario','insumo','equipo','laboratorio','docente','incidencia') NOT NULL,
  `registro_id` int NOT NULL,
  `descripcion` text,
  `datos_anteriores` json DEFAULT NULL,
  `datos_nuevos` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_usuario_fecha` (`usuario_id`,`fecha_creacion`),
  KEY `idx_modulo_registro` (`modulo`,`registro_id`),
  KEY `idx_accion_fecha` (`accion`,`fecha_creacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ciclos`
--

DROP TABLE IF EXISTS `ciclos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ciclos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `config_stock_laboratorio`
--

DROP TABLE IF EXISTS `config_stock_laboratorio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `config_stock_laboratorio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `insumo_id` int NOT NULL COMMENT 'ID del insumo',
  `laboratorio_id` int NOT NULL COMMENT 'ID del laboratorio',
  `stock_minimo` int NOT NULL DEFAULT '0' COMMENT 'Cantidad mínima que debe mantenerse',
  `stock_maximo` int DEFAULT NULL COMMENT 'Cantidad máxima recomendada (opcional)',
  `punto_reorden` int DEFAULT NULL COMMENT 'Nivel para solicitar reabastecimiento (opcional)',
  `observaciones` text COMMENT 'Notas sobre el consumo o uso del insumo',
  `fecha_configuracion` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_insumo_laboratorio` (`insumo_id`,`laboratorio_id`),
  KEY `idx_stock_minimo` (`stock_minimo`),
  KEY `idx_laboratorio` (`laboratorio_id`),
  KEY `idx_insumo` (`insumo_id`),
  KEY `idx_fecha_actualizacion` (`fecha_actualizacion`),
  CONSTRAINT `config_stock_laboratorio_ibfk_1` FOREIGN KEY (`insumo_id`) REFERENCES `insumos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `config_stock_laboratorio_ibfk_2` FOREIGN KEY (`laboratorio_id`) REFERENCES `laboratorios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Configuración de niveles de stock por laboratorio';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `detalle_reserva_equipos`
--

DROP TABLE IF EXISTS `detalle_reserva_equipos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_reserva_equipos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reserva_id` int NOT NULL,
  `equipo_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `cantidad` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reserva_id` (`reserva_id`),
  KEY `equipo_id` (`equipo_id`),
  CONSTRAINT `detalle_reserva_equipos_ibfk_1` FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detalle_reserva_equipos_ibfk_2` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `detalle_reserva_insumos`
--

DROP TABLE IF EXISTS `detalle_reserva_insumos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_reserva_insumos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reserva_id` int DEFAULT NULL,
  `insumo_id` int DEFAULT NULL,
  `cantidad_usada` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reserva_id` (`reserva_id`),
  KEY `insumo_id` (`insumo_id`),
  CONSTRAINT `detalle_reserva_insumos_ibfk_1` FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`id`),
  CONSTRAINT `detalle_reserva_insumos_ibfk_2` FOREIGN KEY (`insumo_id`) REFERENCES `insumos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `docentes`
--

DROP TABLE IF EXISTS `docentes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `docentes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `correo` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `escuela_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `escuela_id` (`escuela_id`),
  CONSTRAINT `docentes_ibfk_1` FOREIGN KEY (`escuela_id`) REFERENCES `escuelas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `enlaces_compartidos`
--

DROP TABLE IF EXISTS `enlaces_compartidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `enlaces_compartidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `laboratorio_id` int NOT NULL,
  `token` varchar(512) NOT NULL,
  `creado_por` int NOT NULL,
  `fecha_expiracion` datetime NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_laboratorio_id` (`laboratorio_id`),
  KEY `idx_creado_por` (`creado_por`),
  KEY `idx_token` (`token`),
  KEY `idx_activo` (`activo`),
  KEY `idx_fecha_expiracion` (`fecha_expiracion`),
  CONSTRAINT `enlaces_compartidos_ibfk_1` FOREIGN KEY (`laboratorio_id`) REFERENCES `laboratorios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `enlaces_compartidos_ibfk_2` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `equipos`
--

DROP TABLE IF EXISTS `equipos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `nombre` varchar(255) NOT NULL,
  `tipo_equipo_id` int DEFAULT NULL,
  `laboratorio_id` int DEFAULT NULL,
  `descripcion` text,
  `marca` varchar(100) DEFAULT NULL,
  `modelo` varchar(100) DEFAULT NULL,
  `numero_serie` varchar(100) DEFAULT NULL,
  `estado` enum('Operativo','En Mantenimiento','Fuera de Servicio') DEFAULT 'Operativo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_ultimo_mantenimiento` date DEFAULT NULL COMMENT 'Fecha del último mantenimiento realizado',
  `fecha_proximo_mantenimiento` date DEFAULT NULL COMMENT 'Fecha programada para el próximo mantenimiento',
  `comentarios` text,
  `condicion` enum('Excelente','Bueno','Regular','Malo') DEFAULT 'Bueno',
  `fecha_adquisicion` date DEFAULT NULL,
  `eliminado` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_equipos_ultimo_mantenimiento` (`fecha_ultimo_mantenimiento`),
  KEY `idx_equipos_proximo_mantenimiento` (`fecha_proximo_mantenimiento`),
  KEY `idx_equipos_eliminado` (`eliminado`),
  KEY `idx_equipos_tipo_equipo_id` (`tipo_equipo_id`),
  KEY `idx_equipos_laboratorio_id` (`laboratorio_id`),
  CONSTRAINT `fk_equipos_laboratorio` FOREIGN KEY (`laboratorio_id`) REFERENCES `laboratorios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_equipos_tipo_equipo` FOREIGN KEY (`tipo_equipo_id`) REFERENCES `tipos_equipo` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `escuelas`
--

DROP TABLE IF EXISTS `escuelas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `escuelas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `grupos`
--

DROP TABLE IF EXISTS `grupos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `grupos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `escuela_id` int DEFAULT NULL,
  `ciclo_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_grupos_escuela` (`escuela_id`),
  KEY `fk_grupos_ciclo` (`ciclo_id`),
  CONSTRAINT `fk_grupos_ciclo` FOREIGN KEY (`ciclo_id`) REFERENCES `ciclos` (`id`),
  CONSTRAINT `fk_grupos_escuela` FOREIGN KEY (`escuela_id`) REFERENCES `escuelas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `incidencias`
--

DROP TABLE IF EXISTS `incidencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `incidencias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reserva_id` int DEFAULT NULL,
  `titulo` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_general_ci,
  `fecha_reporte` datetime DEFAULT CURRENT_TIMESTAMP,
  `reportado_por` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reserva_id` (`reserva_id`),
  KEY `reportado_por` (`reportado_por`),
  CONSTRAINT `incidencias_ibfk_1` FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`id`),
  CONSTRAINT `incidencias_ibfk_2` FOREIGN KEY (`reportado_por`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `insumos`
--

DROP TABLE IF EXISTS `insumos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `insumos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_general_ci,
  `unidad_medida` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `codigo` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `categoria` enum('Reactivos','Materiales','Material_Biologico') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Materiales' COMMENT 'Categoría del insumo: Reactivos, Materiales o Material Biológico',
  `presentacion` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Presentación del insumo',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_codigo_insumo` (`codigo`),
  KEY `idx_insumos_codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inventario_equipos`
--

DROP TABLE IF EXISTS `inventario_equipos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventario_equipos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `equipo_id` int NOT NULL,
  `laboratorio_id` int NOT NULL,
  `cantidad_total` int NOT NULL DEFAULT '0',
  `cantidad_disponible` int NOT NULL DEFAULT '0',
  `cantidad_en_uso` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `eliminado` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_equipo_laboratorio` (`equipo_id`,`laboratorio_id`),
  KEY `laboratorio_id` (`laboratorio_id`),
  KEY `idx_inventario_equipos_eliminado` (`eliminado`),
  CONSTRAINT `inventario_equipos_ibfk_1` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventario_equipos_ibfk_2` FOREIGN KEY (`laboratorio_id`) REFERENCES `laboratorios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inventario_insumos`
--

DROP TABLE IF EXISTS `inventario_insumos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventario_insumos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `insumo_id` int DEFAULT NULL,
  `cantidad` int DEFAULT NULL,
  `laboratorio_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `insumo_id` (`insumo_id`),
  KEY `laboratorio_id` (`laboratorio_id`),
  CONSTRAINT `inventario_insumos_ibfk_1` FOREIGN KEY (`insumo_id`) REFERENCES `insumos` (`id`),
  CONSTRAINT `inventario_insumos_ibfk_2` FOREIGN KEY (`laboratorio_id`) REFERENCES `laboratorios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `jefe_laboratorio`
--

DROP TABLE IF EXISTS `jefe_laboratorio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `jefe_laboratorio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `laboratorio_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`,`laboratorio_id`),
  KEY `laboratorio_id` (`laboratorio_id`),
  CONSTRAINT `jefe_laboratorio_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `jefe_laboratorio_ibfk_2` FOREIGN KEY (`laboratorio_id`) REFERENCES `laboratorios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `laboratorios`
--

DROP TABLE IF EXISTS `laboratorios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `laboratorios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ubicacion` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `escuela_id` int DEFAULT NULL,
  `piso` int NOT NULL,
  `estado` enum('Activo','En Mantenimiento','Inhabilitado','Baja') COLLATE utf8mb4_general_ci DEFAULT 'Activo',
  `codigo` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_codigo_laboratorio` (`codigo`),
  KEY `escuela_id` (`escuela_id`),
  KEY `idx_laboratorios_codigo` (`codigo`),
  CONSTRAINT `laboratorios_ibfk_1` FOREIGN KEY (`escuela_id`) REFERENCES `escuelas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `movimiento_insumo_detalle`
--

DROP TABLE IF EXISTS `movimiento_insumo_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimiento_insumo_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `movimiento_id` int NOT NULL,
  `insumo_id` int NOT NULL,
  `cantidad` int NOT NULL,
  `lote` varchar(50) DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `mov_det_ref` int DEFAULT NULL,
  `saldo` decimal(10,2) DEFAULT NULL COMMENT 'Saldo del movimiento',
  PRIMARY KEY (`id`),
  KEY `fk_movimiento` (`movimiento_id`),
  KEY `fk_insumo` (`insumo_id`),
  CONSTRAINT `fk_insumo` FOREIGN KEY (`insumo_id`) REFERENCES `insumos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_movimiento` FOREIGN KEY (`movimiento_id`) REFERENCES `movimientos_insumos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `movimientos_equipos`
--

DROP TABLE IF EXISTS `movimientos_equipos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_equipos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `equipo_id` int NOT NULL,
  `laboratorio_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `tipo_movimiento` enum('entrada','reserva','devolucion') NOT NULL,
  `cantidad` int NOT NULL,
  `reserva_id` int DEFAULT NULL,
  `observaciones` text,
  `fecha_movimiento` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `equipo_id` (`equipo_id`),
  KEY `laboratorio_id` (`laboratorio_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `reserva_id` (`reserva_id`),
  CONSTRAINT `movimientos_equipos_ibfk_1` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `movimientos_equipos_ibfk_2` FOREIGN KEY (`laboratorio_id`) REFERENCES `laboratorios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `movimientos_equipos_ibfk_3` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `movimientos_equipos_ibfk_4` FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `movimientos_insumos`
--

DROP TABLE IF EXISTS `movimientos_insumos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_insumos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `laboratorio_id` int DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  `tipo_movimiento` enum('entrada','salida','ajuste') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `fecha_movimiento` date DEFAULT NULL,
  `reserva_id` int DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_general_ci,
  `fecha_ingreso` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `laboratorio_id` (`laboratorio_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `reserva_id` (`reserva_id`),
  CONSTRAINT `movimientos_insumos_ibfk_2` FOREIGN KEY (`laboratorio_id`) REFERENCES `laboratorios` (`id`),
  CONSTRAINT `movimientos_insumos_ibfk_3` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `movimientos_insumos_ibfk_4` FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=132 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `permisos`
--

DROP TABLE IF EXISTS `permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `permisos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `ruta` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reservas`
--

DROP TABLE IF EXISTS `reservas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `laboratorio_id` int DEFAULT NULL,
  `docente_id` int DEFAULT NULL,
  `grupo_id` int DEFAULT NULL,
  `fecha_inicio` datetime DEFAULT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `cantidad_alumnos` int DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_general_ci,
  `color` varchar(7) COLLATE utf8mb4_general_ci DEFAULT '#95a5a6' COMMENT 'Color hexadecimal para el horario',
  `created_by` int DEFAULT NULL COMMENT 'Usuario que creó el horario',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
  `updated_by` int DEFAULT NULL COMMENT 'Usuario que modificó por última vez',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última modificación',
  `estado` char(1) COLLATE utf8mb4_general_ci DEFAULT 'P' COMMENT 'P="Programado", C="Cerrado"',
  PRIMARY KEY (`id`),
  KEY `laboratorio_id` (`laboratorio_id`),
  KEY `docente_id` (`docente_id`),
  KEY `grupo_id` (`grupo_id`),
  CONSTRAINT `reservas_ibfk_1` FOREIGN KEY (`laboratorio_id`) REFERENCES `laboratorios` (`id`),
  CONSTRAINT `reservas_ibfk_2` FOREIGN KEY (`docente_id`) REFERENCES `docentes` (`id`),
  CONSTRAINT `reservas_ibfk_5` FOREIGN KEY (`grupo_id`) REFERENCES `grupos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=163 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rol_permiso`
--

DROP TABLE IF EXISTS `rol_permiso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol_permiso` (
  `rol_id` int NOT NULL,
  `permiso_id` int NOT NULL,
  PRIMARY KEY (`rol_id`,`permiso_id`),
  KEY `permiso_id` (`permiso_id`),
  CONSTRAINT `rol_permiso_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `rol_permiso_ibfk_2` FOREIGN KEY (`permiso_id`) REFERENCES `permisos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tipos_equipo`
--

DROP TABLE IF EXISTS `tipos_equipo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_equipo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_completo` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `usuario` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `contrasena` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `rol_id` int NOT NULL,
  `laboratorio_ids` json DEFAULT NULL,
  `estado` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'A' COMMENT 'A = ''Activo'', I = ''Inactivo''',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario` (`usuario`),
  KEY `rol_id` (`rol_id`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary table structure for view `v_stock_actual`
--

DROP TABLE IF EXISTS `v_stock_actual`;
/*!50001 DROP VIEW IF EXISTS `v_stock_actual`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_stock_actual` AS SELECT
 1 AS `insumo_id`,
  1 AS `insumo_codigo`,
  1 AS `insumo_nombre`,
  1 AS `categoria`,
  1 AS `unidad_medida`,
  1 AS `presentacion`,
  1 AS `laboratorio_id`,
  1 AS `laboratorio_nombre`,
  1 AS `laboratorio_codigo`,
  1 AS `stock_actual`,
  1 AS `total_lotes_activos`,
  1 AS `fecha_vencimiento_proximo`,
  1 AS `ultima_actualizacion` */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `v_stock_completo`
--

DROP TABLE IF EXISTS `v_stock_completo`;
/*!50001 DROP VIEW IF EXISTS `v_stock_completo`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_stock_completo` AS SELECT
 1 AS `insumo_id`,
  1 AS `insumo_codigo`,
  1 AS `insumo_nombre`,
  1 AS `categoria`,
  1 AS `unidad_medida`,
  1 AS `presentacion`,
  1 AS `laboratorio_id`,
  1 AS `laboratorio_nombre`,
  1 AS `laboratorio_codigo`,
  1 AS `stock_actual`,
  1 AS `total_lotes_activos`,
  1 AS `fecha_vencimiento_proximo`,
  1 AS `ultima_actualizacion`,
  1 AS `stock_minimo`,
  1 AS `stock_maximo`,
  1 AS `punto_reorden`,
  1 AS `observaciones`,
  1 AS `diferencia_minimo`,
  1 AS `estado_stock`,
  1 AS `fecha_configuracion`,
  1 AS `fecha_config_actualizacion` */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `vista_actividad_equipos`
--

DROP TABLE IF EXISTS `vista_actividad_equipos`;
/*!50001 DROP VIEW IF EXISTS `vista_actividad_equipos`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `vista_actividad_equipos` AS SELECT
 1 AS `id`,
  1 AS `accion`,
  1 AS `equipo_id`,
  1 AS `descripcion`,
  1 AS `fecha_actividad`,
  1 AS `ip_address`,
  1 AS `equipo_codigo`,
  1 AS `equipo_nombre`,
  1 AS `equipo_marca`,
  1 AS `equipo_modelo`,
  1 AS `usuario_nombre`,
  1 AS `usuario_rol` */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `vista_actividad_horarios`
--

DROP TABLE IF EXISTS `vista_actividad_horarios`;
/*!50001 DROP VIEW IF EXISTS `vista_actividad_horarios`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `vista_actividad_horarios` AS SELECT
 1 AS `actividad_id`,
  1 AS `accion`,
  1 AS `reserva_id`,
  1 AS `descripcion`,
  1 AS `fecha_actividad`,
  1 AS `ip_address`,
  1 AS `usuario_id`,
  1 AS `usuario_nombre`,
  1 AS `usuario_nombre_completo`,
  1 AS `usuario_rol`,
  1 AS `horario_descripcion`,
  1 AS `fecha_inicio`,
  1 AS `fecha_fin`,
  1 AS `cantidad_alumnos`,
  1 AS `color`,
  1 AS `horario_creado_en`,
  1 AS `horario_actualizado_en`,
  1 AS `laboratorio_nombre`,
  1 AS `laboratorio_ubicacion`,
  1 AS `docente_nombre`,
  1 AS `docente_correo`,
  1 AS `grupo_nombre`,
  1 AS `escuela_nombre`,
  1 AS `ciclo_nombre` */;
SET character_set_client = @saved_cs_client;

--
-- Dumping routines for database 'laboratorios'
--

--
-- Final view structure for view `v_stock_actual`
--

/*!50001 DROP VIEW IF EXISTS `v_stock_actual`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_stock_actual` AS select `i`.`id` AS `insumo_id`,`i`.`codigo` AS `insumo_codigo`,`i`.`nombre` AS `insumo_nombre`,`i`.`categoria` AS `categoria`,`i`.`unidad_medida` AS `unidad_medida`,`i`.`presentacion` AS `presentacion`,`l`.`id` AS `laboratorio_id`,`l`.`nombre` AS `laboratorio_nombre`,`l`.`codigo` AS `laboratorio_codigo`,coalesce(sum((case when (`m`.`tipo_movimiento` = 'entrada') then `mid`.`cantidad` when (`m`.`tipo_movimiento` = 'salida') then -(`mid`.`cantidad`) else 0 end)),0) AS `stock_actual`,count(distinct `mid`.`lote`) AS `total_lotes_activos`,min(`mid`.`fecha_vencimiento`) AS `fecha_vencimiento_proximo`,max(`m`.`fecha_movimiento`) AS `ultima_actualizacion` from (((`insumos` `i` join `laboratorios` `l`) left join `movimiento_insumo_detalle` `mid` on((`mid`.`insumo_id` = `i`.`id`))) left join `movimientos_insumos` `m` on(((`m`.`id` = `mid`.`movimiento_id`) and (`m`.`laboratorio_id` = `l`.`id`)))) group by `i`.`id`,`i`.`codigo`,`i`.`nombre`,`i`.`categoria`,`i`.`unidad_medida`,`i`.`presentacion`,`l`.`id`,`l`.`nombre`,`l`.`codigo` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_stock_completo`
--

/*!50001 DROP VIEW IF EXISTS `v_stock_completo`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_stock_completo` AS select `s`.`insumo_id` AS `insumo_id`,`s`.`insumo_codigo` AS `insumo_codigo`,`s`.`insumo_nombre` AS `insumo_nombre`,`s`.`categoria` AS `categoria`,`s`.`unidad_medida` AS `unidad_medida`,`s`.`presentacion` AS `presentacion`,`s`.`laboratorio_id` AS `laboratorio_id`,`s`.`laboratorio_nombre` AS `laboratorio_nombre`,`s`.`laboratorio_codigo` AS `laboratorio_codigo`,`s`.`stock_actual` AS `stock_actual`,`s`.`total_lotes_activos` AS `total_lotes_activos`,`s`.`fecha_vencimiento_proximo` AS `fecha_vencimiento_proximo`,`s`.`ultima_actualizacion` AS `ultima_actualizacion`,coalesce(`c`.`stock_minimo`,0) AS `stock_minimo`,`c`.`stock_maximo` AS `stock_maximo`,`c`.`punto_reorden` AS `punto_reorden`,`c`.`observaciones` AS `observaciones`,(`s`.`stock_actual` - coalesce(`c`.`stock_minimo`,0)) AS `diferencia_minimo`,(case when (`c`.`id` is null) then 'SIN_CONFIGURAR' when (`s`.`stock_actual` = 0) then 'AGOTADO' when (`s`.`stock_actual` < coalesce(`c`.`stock_minimo`,0)) then 'BAJO' when ((`c`.`punto_reorden` is not null) and (`s`.`stock_actual` <= `c`.`punto_reorden`)) then 'REORDENAR' when ((`c`.`stock_maximo` is not null) and (`s`.`stock_actual` > `c`.`stock_maximo`)) then 'EXCESO' else 'NORMAL' end) AS `estado_stock`,`c`.`fecha_configuracion` AS `fecha_configuracion`,`c`.`fecha_actualizacion` AS `fecha_config_actualizacion` from (`v_stock_actual` `s` left join `config_stock_laboratorio` `c` on(((`s`.`insumo_id` = `c`.`insumo_id`) and (`s`.`laboratorio_id` = `c`.`laboratorio_id`)))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vista_actividad_equipos`
--

/*!50001 DROP VIEW IF EXISTS `vista_actividad_equipos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_actividad_equipos` AS select `a`.`id` AS `id`,`a`.`accion` AS `accion`,`a`.`equipo_id` AS `equipo_id`,`a`.`descripcion` AS `descripcion`,`a`.`fecha_actividad` AS `fecha_actividad`,`a`.`ip_address` AS `ip_address`,coalesce(`e`.`codigo`,'N/A') AS `equipo_codigo`,coalesce(`e`.`nombre`,'Equipo eliminado') AS `equipo_nombre`,coalesce(`e`.`marca`,'N/A') AS `equipo_marca`,coalesce(`e`.`modelo`,'N/A') AS `equipo_modelo`,`u`.`nombre_completo` AS `usuario_nombre`,`r`.`nombre` AS `usuario_rol` from (((`actividad_equipos` `a` left join `equipos` `e` on((`a`.`equipo_id` = `e`.`id`))) left join `usuarios` `u` on((`a`.`usuario_id` = `u`.`id`))) left join `roles` `r` on((`u`.`rol_id` = `r`.`id`))) order by `a`.`fecha_actividad` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vista_actividad_horarios`
--

/*!50001 DROP VIEW IF EXISTS `vista_actividad_horarios`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_actividad_horarios` AS select `ah`.`id` AS `actividad_id`,`ah`.`accion` AS `accion`,`ah`.`reserva_id` AS `reserva_id`,`ah`.`descripcion` AS `descripcion`,`ah`.`fecha_actividad` AS `fecha_actividad`,`ah`.`ip_address` AS `ip_address`,`ah`.`usuario_id` AS `usuario_id`,`u`.`usuario` AS `usuario_nombre`,`u`.`nombre_completo` AS `usuario_nombre_completo`,coalesce(`r_roles`.`nombre`,'N/A') AS `usuario_rol`,(case when (`r`.`id` is not null) then `r`.`descripcion` else 'Horario eliminado' end) AS `horario_descripcion`,`r`.`fecha_inicio` AS `fecha_inicio`,`r`.`fecha_fin` AS `fecha_fin`,`r`.`cantidad_alumnos` AS `cantidad_alumnos`,`r`.`color` AS `color`,`r`.`created_at` AS `horario_creado_en`,`r`.`updated_at` AS `horario_actualizado_en`,(case when (`l`.`id` is not null) then `l`.`nombre` else 'Laboratorio eliminado' end) AS `laboratorio_nombre`,(case when (`l`.`id` is not null) then `l`.`ubicacion` else 'Ubicación N/A' end) AS `laboratorio_ubicacion`,(case when (`d`.`id` is not null) then `d`.`nombre` else 'Docente eliminado' end) AS `docente_nombre`,(case when (`d`.`id` is not null) then `d`.`correo` else 'Correo N/A' end) AS `docente_correo`,(case when (`g`.`id` is not null) then `g`.`nombre` else 'Grupo eliminado' end) AS `grupo_nombre`,(case when (`e`.`id` is not null) then `e`.`nombre` else 'Escuela eliminada' end) AS `escuela_nombre`,(case when (`c`.`id` is not null) then `c`.`nombre` else 'Ciclo eliminado' end) AS `ciclo_nombre` from ((((((((`actividad_horarios` `ah` left join `usuarios` `u` on((`ah`.`usuario_id` = `u`.`id`))) left join `roles` `r_roles` on((`u`.`rol_id` = `r_roles`.`id`))) left join `reservas` `r` on((`ah`.`reserva_id` = `r`.`id`))) left join `laboratorios` `l` on((`r`.`laboratorio_id` = `l`.`id`))) left join `docentes` `d` on((`r`.`docente_id` = `d`.`id`))) left join `grupos` `g` on((`r`.`grupo_id` = `g`.`id`))) left join `escuelas` `e` on((`g`.`escuela_id` = `e`.`id`))) left join `ciclos` `c` on((`g`.`ciclo_id` = `c`.`id`))) order by `ah`.`fecha_actividad` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-11-10 12:45:29
