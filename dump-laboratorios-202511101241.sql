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
-- Dumping data for table `actividad_equipos`
--

LOCK TABLES `actividad_equipos` WRITE;
/*!40000 ALTER TABLE `actividad_equipos` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `actividad_equipos` VALUES
(1,'crear',41,'Equipo creado: aaa (EQP-0010) - Marca: mdamdas, Modelo: dsdsd, Estado: En Mantenimiento, Condición: Bueno. Inventario inicial en 1 laboratorio(s).',1,'::1','2025-09-26 10:57:09'),
(2,'eliminar',NULL,'Equipo eliminado: aaa (EQP-0010) - Marca: mdamdas, Modelo: dsdsd, Estado: En Mantenimiento, Condición: Bueno.',1,'::1','2025-09-26 11:12:25'),
(3,'eliminar',NULL,'Equipo eliminado: Eq (EQP-0011) - Marca: Hettich, Modelo: EBA 200, Estado: Operativo, Condición: Regular. Se eliminaron 1 movimientos asociados.',1,'::1','2025-09-26 14:12:51'),
(4,'crear',42,'Equipo creado: Ejemplo eqqquipo (EQP-0008) - Marca: Olympus, Modelo: CXWWW23, Estado: En Mantenimiento, Condición: Bueno. Inventario inicial en 1 laboratorio(s).',1,'::1','2025-09-29 09:12:54'),
(5,'crear',43,'Equipo creado: Equipo X (EQP-0043) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Bueno. Inventario inicial en 0 laboratorio(s).',1,'::ffff:100.64.0.3','2025-09-29 12:50:06'),
(6,'crear',44,'Equipo creado: Equipo CX (EQP-0044) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Bueno. Inventario inicial en 0 laboratorio(s).',9,'::ffff:100.64.0.3','2025-09-29 12:53:55'),
(7,'crear',45,'Equipo creado: Equipo C1 (EQP-0045) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Bueno. Inventario inicial en 1 laboratorio(s).',9,'::ffff:100.64.0.5','2025-09-29 12:57:12'),
(8,'crear',46,'Equipo creado: Equipo C2 (EQP-0046) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Bueno. Inventario inicial en 0 laboratorio(s).',9,'::ffff:100.64.0.4','2025-09-29 20:51:48'),
(9,'eliminar',NULL,'Equipo eliminado: Equipo C2 (EQP-0046) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Bueno. Se eliminaron 0 movimientos asociados.',9,'::ffff:100.64.0.4','2025-09-29 20:51:53'),
(10,'crear',47,'Equipo creado: Equipo C2 (EQP-0046) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Bueno. Inventario inicial en 0 laboratorio(s).',9,'::ffff:100.64.0.4','2025-09-29 20:52:02'),
(11,'eliminar',NULL,'Equipo eliminado: Equipo C2 (EQP-0046) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Bueno. Se eliminaron 0 movimientos asociados.',9,'::ffff:100.64.0.4','2025-09-29 20:52:06'),
(12,'crear',48,'Equipo creado: Equipo C2 (EQP-0046) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Bueno. Inventario inicial en 1 laboratorio(s).',9,'::ffff:100.64.0.4','2025-09-29 20:52:18'),
(13,'crear',49,'Equipo creado: dddddd (EQP-0049) - Marca: ddddd, Modelo: dddd, Estado: En Mantenimiento, Condición: Bueno. Inventario inicial en 1 laboratorio(s).',1,'::1','2025-10-12 23:07:26'),
(14,'crear',50,'Equipo creado: Monitor de alta resolución (EQP-0050) - Marca: LG, Modelo: SMGLG23, Estado: Operativo, Condición: Bueno. Inventario inicial en 0 laboratorio(s).',1,'::1','2025-10-16 14:40:59'),
(15,'actualizar',50,'Equipo actualizado: Monitor de alta resolución - Marca: LG, Modelo: SMGLG23, Estado: Operativo, Condición: Bueno. Último mant.: 2025-10-17, Próximo mant.: 2025-10-17.',1,'::1','2025-10-16 14:41:16'),
(16,'actualizar',50,'Equipo actualizado: Monitor de alta resolución - Marca: LG, Modelo: SMGLG23, Estado: Operativo, Condición: Bueno. Último mant.: 2025-10-17, Próximo mant.: 2025-10-17.',1,'::1','2025-10-16 14:44:24'),
(17,'actualizar',6,'Equipo actualizado: Microscopio Óptico Binocular - Marca: Olympus, Modelo: CX23, Estado: Operativo, Condición: Bueno. Último mant.: 2024-03-20, Próximo mant.: 2024-09-20.',1,'::1','2025-10-16 14:44:39'),
(18,'actualizar',1,'Equipo actualizado: Simulador de paciente de alta fidelidad - Marca: Medical Simulator, Modelo: Estándar, Estado: Operativo, Condición: Bueno. Último mant.: 2025-09-03, Próximo mant.: 2025-09-28.',1,'::1','2025-10-16 20:13:38'),
(19,'crear',51,'Equipo creado: sssss (EQP-0051) - Marca: sss, Modelo: ssss, Estado: Operativo, Condición: Excelente. Inventario inicial en 0 laboratorio(s).',1,'::1','2025-10-16 20:18:13'),
(20,'crear',52,'Equipo creado: tttt (EQP-0052) - Marca: tttt, Modelo: tttt, Estado: En Mantenimiento, Condición: Excelente. Inventario inicial en 0 laboratorio(s).',1,'::1','2025-10-16 21:14:43'),
(21,'crear',53,'Equipo creado: Prueba (EQP-0053) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Bueno. Inventario inicial en 0 laboratorio(s).',1,'::ffff:100.64.0.6','2025-10-16 21:33:40'),
(22,'eliminar',NULL,'Equipo eliminado: Prueba (EQP-0053) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Bueno. Se eliminaron 0 movimientos asociados.',1,'::ffff:100.64.0.5','2025-10-16 21:34:11'),
(23,'crear',54,'Equipo creado: Prueba (EQP-0053) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Bueno. Inventario inicial en 0 laboratorio(s).',1,'::ffff:100.64.0.7','2025-10-16 21:34:33'),
(24,'eliminar',NULL,'Equipo eliminado: Prueba (EQP-0053) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Bueno. Se eliminaron 0 movimientos asociados.',1,'::ffff:100.64.0.8','2025-10-16 21:36:03'),
(25,'crear',55,'Equipo creado: Prueba (EQP-0053) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Bueno. Inventario inicial en 0 laboratorio(s).',1,'::ffff:100.64.0.10','2025-10-16 21:36:17'),
(26,'actualizar',49,'Equipo actualizado: dddddd - Marca: ddddd, Modelo: dddd, Estado: En Mantenimiento, Condición: Bueno. Último mant.: 2025-10-11, Próximo mant.: 2025-10-12.',1,'::1','2025-10-16 22:07:20'),
(27,'actualizar',2,'Equipo actualizado: Equipo de simulación de embarazo - Marca: Medical simulator, Modelo: Estándar, Estado: Fuera de Servicio, Condición: Bueno. Último mant.: 2025-07-30, Próximo mant.: 2026-01-22.',1,'::1','2025-10-16 22:18:26'),
(28,'actualizar',1,'Equipo actualizado: Simulador de paciente de alta fidelidad - Marca: Medical Simulator, Modelo: Estándar, Estado: Operativo, Condición: Bueno. Último mant.: 2025-09-03, Próximo mant.: 2025-09-28.',1,'::1','2025-10-16 22:18:35'),
(29,'actualizar',5,'Equipo actualizado: Simulador de Paciente Adulto - Marca: Laerdal, Modelo: SimMan 3G, Estado: Operativo, Condición: Excelente. Último mant.: 2024-01-15, Próximo mant.: 2024-07-15.',1,'::1','2025-10-16 22:18:46'),
(30,'actualizar',4,'Equipo actualizado: Equipo de prueba para prácticas de RCP - Marca: AyB, Modelo: Estándar, Estado: En Mantenimiento, Condición: Bueno. Último mant.: 2025-09-12, Próximo mant.: 2025-09-24.',1,'::1','2025-10-16 22:18:54'),
(31,'actualizar',52,'Equipo actualizado: tttt - Marca: tttt, Modelo: tttt, Estado: Operativo, Condición: Excelente. Último mant.: 2025-10-15, Próximo mant.: 2025-10-17.',1,'::1','2025-10-16 22:19:31'),
(32,'actualizar',55,'Equipo actualizado: Prueba - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Bueno. Último mant.: 2025-10-01, Próximo mant.: 2025-10-01.',1,'::1','2025-10-16 22:20:53'),
(33,'actualizar',50,'Equipo actualizado: Monitor de alta resolución - Marca: LG, Modelo: SMGLG23, Estado: Operativo, Condición: Bueno. Último mant.: 2025-10-17, Próximo mant.: 2025-10-17.',1,'::1','2025-10-16 22:21:01'),
(34,'crear',56,'Equipo creado por importación masiva: Simulador de Paciente Adulto (EQP-0056) - Marca: Laerdal, Modelo: SimMan 3G, Estado: Operativo, Condición: Excelente. Inventario en 1 laboratorio(s).',1,'::ffff:100.64.0.8','2025-10-16 23:27:56'),
(35,'crear',57,'Equipo creado por importación masiva: Microscopio Óptico Binocular (EQP-0058) - Marca: Olympus, Modelo: CX23, Estado: Operativo, Condición: Bueno. Inventario en 3 laboratorio(s).',1,'::ffff:100.64.0.8','2025-10-16 23:27:56'),
(36,'crear',58,'Equipo creado por importación masiva: Centrifuga de Mesa (EQP-0060) - Marca: Hettich, Modelo: EBA 200, Estado: En Mantenimiento, Condición: Regular. Inventario en 2 laboratorio(s).',1,'::ffff:100.64.0.8','2025-10-16 23:27:56'),
(37,'eliminar',NULL,'Equipo eliminado: dddddd (EQP-0049) - Marca: ddddd, Modelo: dddd, Estado: En Mantenimiento, Condición: Bueno. Se eliminaron 1 movimientos asociados.',1,'::ffff:100.64.0.7','2025-10-17 09:50:01'),
(38,'eliminar',NULL,'Equipo eliminado: tttt (EQP-0052) - Marca: tttt, Modelo: tttt, Estado: Operativo, Condición: Excelente. Se eliminaron 0 movimientos asociados.',1,'::ffff:100.64.0.7','2025-10-17 09:50:10'),
(39,'eliminar',NULL,'Equipo eliminado: sssss (EQP-0051) - Marca: sss, Modelo: ssss, Estado: Operativo, Condición: Excelente. Se eliminaron 0 movimientos asociados.',1,'::ffff:100.64.0.7','2025-10-17 09:50:20'),
(40,'crear',59,'Equipo creado: editarequipomantenimiento (EQP-0059) - Marca: aadaad, Modelo: 123, Estado: Operativo, Condición: Bueno. Inventario inicial en 0 laboratorio(s).',1,'::1','2025-10-19 02:18:12'),
(41,'eliminar',NULL,'Equipo eliminado: editarequipomantenimiento (EQP-0059) - Marca: aadaad, Modelo: 123, Estado: Operativo, Condición: Bueno. Se eliminaron 0 movimientos asociados.',1,'::1','2025-10-19 02:24:00'),
(42,'eliminar',NULL,'Equipo eliminado: Equipo de simulación de embarazo (EQP-0002) - Marca: Medical simulator, Modelo: Estándar, Estado: Fuera de Servicio, Condición: Bueno. Se eliminaron 1 movimientos asociados.',1,'::1','2025-10-19 02:24:23'),
(43,'eliminar',NULL,'Equipo eliminado: Simulador de paciente de alta fidelidad (EQP-0001) - Marca: Medical Simulator, Modelo: Estándar, Estado: Operativo, Condición: Bueno. Se eliminaron 1 movimientos asociados.',1,'::1','2025-10-19 02:24:32'),
(44,'eliminar',NULL,'Equipo eliminado: Monitor de alta resolución (EQP-0050) - Marca: LG, Modelo: SMGLG23, Estado: Operativo, Condición: Bueno. Se eliminaron 0 movimientos asociados.',1,'::1','2025-10-19 02:24:44'),
(45,'actualizar',5,'Equipo actualizado: Simulador de Paciente Adulto - Marca: Laerdal, Modelo: SimMan 3G, Estado: Operativo, Condición: Excelente. Último mant.: 2024-01-15, Próximo mant.: 2024-07-15.',1,'::1','2025-10-19 02:28:37'),
(46,'actualizar',5,'Equipo actualizado: Simulador de Paciente Adulto - Marca: Laerdal, Modelo: SimMan 3G, Estado: Operativo, Condición: Excelente. Último mant.: 2024-01-15, Próximo mant.: 2024-07-15.',1,'::1','2025-10-19 02:28:49'),
(47,'actualizar',55,'Equipo actualizado: Prueba - Marca: yiyi, Modelo: awww, Estado: Operativo, Condición: Bueno. Último mant.: 2025-10-01, Próximo mant.: 2025-10-01.',1,'::1','2025-10-19 02:59:04'),
(48,'actualizar',5,'Equipo actualizado: Simulador de Paciente Adulto - Marca: Laerdal, Modelo: SimMan 3G, Estado: Operativo, Condición: Excelente. Último mant.: 2024-01-15, Próximo mant.: 2024-07-15.',1,'::1','2025-10-19 10:28:13'),
(49,'crear',60,'Equipo creado: uuuuuuuuu (EQP-0059) - Marca: dw, Modelo: dwdwd, Estado: Operativo, Condición: Excelente. Inventario inicial en 0 laboratorio(s).',1,'::1','2025-10-20 22:00:40'),
(50,'eliminar',NULL,'Equipo eliminado: uuuuuuuuu (EQP-0059) - Marca: dw, Modelo: dwdwd, Estado: Operativo, Condición: Excelente. Se eliminaron 0 movimientos asociados.',1,'::1','2025-10-20 22:01:04'),
(51,'actualizar',4,'Equipo actualizado: Equipo de prueba para prácticas de RCP - Marca: AyB, Modelo: Estándar, Estado: En Mantenimiento, Condición: Bueno. Último mant.: 2025-09-12, Próximo mant.: 2025-09-24.',1,'::1','2025-10-27 20:56:55'),
(52,'crear',61,'Equipo creado: _Prueba (EQP-0059) - Marca: Prueba, Modelo: Prueba, Estado: Operativo, Condición: Excelente. Inventario inicial en 0 laboratorio(s).',1,'::1','2025-10-30 13:50:38'),
(53,'eliminar',NULL,'Equipo eliminado: _Prueba (EQP-0059) - Marca: Prueba, Modelo: Prueba, Estado: Operativo, Condición: Excelente. Se eliminaron 0 movimientos asociados.',1,'::1','2025-10-30 13:51:06'),
(54,'crear',62,'Equipo creado: _Prueba (EQP-0059) - Marca: Prueba, Modelo: Prueba, Estado: Operativo, Condición: Excelente. Inventario inicial en 0 laboratorio(s).',1,'::1','2025-10-30 13:51:26'),
(55,'eliminar',NULL,'Equipo eliminado: _Prueba (EQP-0059) - Marca: Prueba, Modelo: Prueba, Estado: Operativo, Condición: Excelente. Se eliminaron 0 movimientos asociados.',1,'::1','2025-10-30 13:51:39'),
(56,'crear',63,'Equipo creado: _Prueba (EQP-0059) - Marca: Prueba, Modelo: Prueba, Estado: Operativo, Condición: Excelente. Inventario inicial en 0 laboratorio(s).',1,'::1','2025-10-30 13:54:08'),
(57,'eliminar',NULL,'Equipo eliminado: _Prueba (EQP-0059) - Marca: Prueba, Modelo: Prueba, Estado: Operativo, Condición: Excelente. Se eliminaron 0 movimientos asociados.',1,'::1','2025-10-30 13:55:07'),
(58,'crear',64,'Equipo creado: Prueba (EQP-0059) - Marca: Prueba, Modelo: Prueba, Estado: Operativo, Condición: Excelente. Inventario inicial en 0 laboratorio(s).',1,'::1','2025-10-30 13:55:29'),
(59,'crear',65,'Equipo creado: Prueba (EQP-0065) - Marca: Prueba, Modelo: Prueba, Estado: Operativo, Condición: Excelente. Inventario inicial en 0 laboratorio(s).',1,'::1','2025-10-30 14:35:56'),
(60,'eliminar',NULL,'Equipo eliminado: Prueba (EQP-0065) - Marca: Prueba, Modelo: Prueba, Estado: Operativo, Condición: Excelente. Se eliminaron 0 movimientos asociados.',1,'::1','2025-10-30 14:36:59'),
(61,'actualizar',6,'Equipo actualizado: Microscopio Óptico Binocular - Marca: Olympus, Modelo: CX23, Estado: Operativo, Condición: Bueno. Último mant.: 2024-03-20, Próximo mant.: 2024-09-20.',1,'::1','2025-10-30 23:25:05'),
(62,'actualizar',7,'Equipo actualizado: Centrifuga de Mesa - Marca: Hettich, Modelo: EBA 200, Estado: En Mantenimiento, Condición: Regular. Último mant.: 2024-02-10, Próximo mant.: 2024-08-10.',1,'::1','2025-10-30 23:30:16'),
(63,'crear',67,'Equipo creado: PRUEBA (PRUEBA) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Excelente. Inventario inicial en 0 laboratorio(s).',1,'::1','2025-10-31 09:06:57'),
(64,'eliminar',66,'Equipo eliminado: PRUEBA (EQP-0066) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Excelente.',1,'::1','2025-10-31 09:10:10'),
(65,'crear',70,'Equipo creado por importación masiva: Prueba (PRUEBA) - Marca: Prueba, Modelo: Prueba, Estado: Operativo, Condición: Bueno. Inventario en  laboratorio SL02LA42.',1,'::1','2025-10-31 11:04:33'),
(66,'crear',71,'Equipo creado: PRUEBA (P0001) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Excelente. Inventario inicial en 0 laboratorio(s).',1,'::1','2025-11-04 10:21:02'),
(67,'actualizar',71,'Equipo actualizado: AAAAAAAAA - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Excelente. Último mant.: N/A, Próximo mant.: N/A.',1,'::1','2025-11-04 10:21:13'),
(68,'eliminar',71,'Equipo eliminado: AAAAAAAAA (P0001) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Excelente.',1,'::1','2025-11-04 10:21:40'),
(69,'eliminar',55,'Equipo eliminado: Prueba (EQP-0053) - Marca: yiyi, Modelo: awww, Estado: Operativo, Condición: Bueno.',1,'::1','2025-11-04 10:49:32'),
(70,'eliminar',70,'Equipo eliminado: Prueba (PRUEBA) - Marca: Prueba, Modelo: Prueba, Estado: Operativo, Condición: Bueno.',1,'::1','2025-11-04 10:49:42'),
(71,'eliminar',64,'Equipo eliminado: Prueba (EQP-0059) - Marca: Prueba, Modelo: Prueba, Estado: Operativo, Condición: Excelente.',1,'::1','2025-11-04 10:49:48'),
(72,'actualizar',58,'Equipo actualizado: Centrifuga de Mesa - Marca: Hettich, Modelo: EBA 200, Estado: En Mantenimiento, Condición: Regular. Último mant.: 2024-02-10, Próximo mant.: 2024-08-10.',1,'::1','2025-11-04 10:50:39'),
(73,'actualizar',57,'Equipo actualizado: Microscopio Óptico Binocular - Marca: Olympus, Modelo: CX23, Estado: Operativo, Condición: Bueno. Último mant.: 2024-03-20, Próximo mant.: 2024-09-20.',1,'::1','2025-11-04 10:53:32'),
(74,'eliminar',57,'Equipo eliminado: Microscopio Óptico Binocular (EQP-0058) - Marca: Olympus, Modelo: CX23, Estado: Operativo, Condición: Bueno.',9,'::1','2025-11-04 11:01:05'),
(75,'actualizar',4,'Equipo actualizado: Equipo de prueba para prácticas de RCP - Marca: AyB, Modelo: Estándar, Estado: En Mantenimiento, Condición: Bueno. Último mant.: 2025-09-12, Próximo mant.: 2025-09-24.',1,'::1','2025-11-04 11:05:59'),
(76,'actualizar',4,'Equipo actualizado: Equipo de prueba para prácticas de RCP - Marca: AyB, Modelo: Estándar, Estado: En Mantenimiento, Condición: Bueno. Último mant.: 2025-09-12, Próximo mant.: 2025-09-24.',1,'::1','2025-11-04 11:06:11'),
(77,'actualizar',4,'Equipo actualizado: Equipo de prueba para prácticas de RCP - Marca: AyB, Modelo: Estándar, Estado: En Mantenimiento, Condición: Bueno. Último mant.: 2025-09-12, Próximo mant.: 2025-09-24.',1,'::1','2025-11-04 11:07:25'),
(78,'actualizar',4,'Equipo actualizado: Equipo de prueba para prácticas de RCP - Marca: AyB, Modelo: Estándar, Estado: En Mantenimiento, Condición: Bueno. Último mant.: 2025-09-12, Próximo mant.: 2025-09-24.',1,'::1','2025-11-04 11:10:12'),
(79,'crear',72,'Equipo creado: Prueba (Prueb) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Excelente. Inventario inicial en 0 laboratorio(s).',1,'::1','2025-11-06 01:45:21'),
(80,'crear',74,'Equipo creado: Prueba (Prueba) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Excelente. Inventario inicial en 0 laboratorio(s).',1,'::1','2025-11-06 01:49:26'),
(81,'eliminar',74,'Equipo eliminado: Prueba (Prueba) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Excelente.',1,'::1','2025-11-06 01:49:35'),
(82,'eliminar',72,'Equipo eliminado: Prueba (Prueb) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Excelente.',1,'::1','2025-11-06 01:49:41'),
(83,'crear',75,'Equipo creado: prueba (Prueba) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Excelente. Inventario inicial en 0 laboratorio(s).',1,'::1','2025-11-06 01:59:25'),
(84,'actualizar',75,'Equipo actualizado: prueba - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Excelente. Último mant.: N/A, Próximo mant.: N/A.',1,'::1','2025-11-06 01:59:34'),
(85,'eliminar',75,'Equipo eliminado: prueba (Prueb) - Marca: N/A, Modelo: N/A, Estado: Operativo, Condición: Excelente.',1,'::1','2025-11-06 01:59:40'),
(86,'crear',76,'Equipo creado: Monitor (123345) - Marca: Dell, Modelo: WFT2025, Estado: Operativo, Condición: Excelente. Inventario inicial en 0 laboratorio(s).',9,'::1','2025-11-07 10:31:20'),
(87,'crear',77,'Equipo creado por importación masiva: Monitor carga masiva1 (234325235) - Marca: Dell, Modelo: SimMan 3G, Estado: Operativo, Condición: Excelente. Inventario en  laboratorio LAB-0021.',9,'::1','2025-11-07 11:10:17'),
(88,'crear',78,'Equipo creado por importación masiva: Monitor carga masiva2 (5434434) - Marca: LG, Modelo: CX23, Estado: Operativo, Condición: Bueno. Inventario en  laboratorio LAB-0021.',9,'::1','2025-11-07 11:10:17');
/*!40000 ALTER TABLE `actividad_equipos` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `actividad_horarios`
--

LOCK TABLES `actividad_horarios` WRITE;
/*!40000 ALTER TABLE `actividad_horarios` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `actividad_horarios` VALUES
(1,'eliminar',99,'Horario eliminado: \"Practica 4 de quimica\" | Lab: Laboratorio de Morfología Macroscópica | Docente: Brayan Porrassss | Grupo: G2 | Escuela: Medicina Humana | 22/9/2025 08:25 a. m. - 12:05 p. m. | 17 alumnos','2025-09-24 22:51:29',1,'::1','2025-09-25 03:51:30','2025-09-25 03:51:30'),
(2,'crear',113,'Horario creado: \"okokoko\" | Lab: Laboratorio de Cómputo 1 | Docente: Esteban | Grupo: G2 | Escuela: Medicina Humana | 27/9/2025 08:25 a. m. - 10:10 a. m. | 1 alumnos','2025-09-25 12:25:09',1,'::1','2025-09-25 17:25:09','2025-09-25 17:25:09'),
(4,'editar',108,'Horario editado: \"prueba\" | Lab: Laboratorio de Cómputo 1 | Docente: Esteban | Grupo: G2 | Escuela: Medicina Humana | 17/12/2025 07:30 a. m. - 11:10 a. m. | 14 alumnos','2025-09-25 22:02:33',1,'::ffff:100.64.0.4','2025-09-26 03:02:33','2025-09-26 03:02:33'),
(5,'crear',115,'Horario creado: \"Prueba x2\" | Lab: Laboratorio de Cómputo 1 | Docente: Esteban | Grupo: G1 | Escuela: Medicina Humana | 6/10/2025 11:15 a. m. - 11:10 a. m. | 14 alumnos','2025-09-25 22:06:11',1,'::ffff:100.64.0.4','2025-09-26 03:06:11','2025-09-26 03:06:11'),
(6,'eliminar',115,'Horario eliminado: \"Prueba x2\" | Lab: Laboratorio de Cómputo 1 | Docente: Esteban | Grupo: G1 | Escuela: Medicina Humana | 6/10/2025 11:15 a. m. - 11:10 a. m. | 14 alumnos','2025-09-25 22:10:56',1,'::ffff:100.64.0.8','2025-09-26 03:10:56','2025-09-26 03:10:56'),
(7,'crear',116,'Horario creado: \"Prueba X2\" | Lab: Pruebas 2 | Docente: Esteban | Grupo: G1 | Escuela: Medicina Humana | 6/10/2025 11:15 a. m. - 11:10 a. m. | 1 alumnos','2025-09-25 22:13:02',1,'::ffff:100.64.0.7','2025-09-26 03:13:02','2025-09-26 03:13:02'),
(8,'crear',117,'Horario creado: \"Prueba X2\" | Lab: Pruebas 2 | Docente: Esteban | Grupo: G1 | Escuela: Medicina Humana | 13/10/2025 11:15 a. m. - 11:10 a. m. | 1 alumnos','2025-09-25 22:13:02',1,'::ffff:100.64.0.7','2025-09-26 03:13:02','2025-09-26 03:13:02'),
(9,'eliminar',117,'Horario eliminado: \"Prueba X2\" | Lab: Pruebas 2 | Docente: Esteban | Grupo: G1 | Escuela: Medicina Humana | 13/10/2025 11:15 a. m. - 11:10 a. m. | 1 alumnos','2025-09-25 22:14:13',1,'::ffff:100.64.0.7','2025-09-26 03:14:13','2025-09-26 03:14:13'),
(10,'crear',118,'Horario creado: \"Prueba edición\" | Lab: US-01 | Docente: Juan | Grupo: G1 | Escuela: Medicina Humana | 30/9/2025 07:30 a. m. - 09:15 a. m. | 6 alumnos','2025-09-29 10:27:43',1,'::1','2025-09-29 15:27:44','2025-09-29 15:27:44'),
(11,'crear',119,'Horario creado: \"X\" | Lab: Laboratorio de Cómputo 1 | Docente: Esteban | Grupo: G1 | Escuela: Medicina Humana | 29/9/2025 07:40 p. m. - 08:30 p. m. | 1 alumnos','2025-09-29 20:58:54',9,'::ffff:100.64.0.4','2025-09-30 01:58:54','2025-09-30 01:58:54'),
(12,'eliminar',119,'Horario eliminado: \"X\" | Lab: Laboratorio de Cómputo 1 | Docente: Esteban | Grupo: G1 | Escuela: Medicina Humana | 29/9/2025 07:40 p. m. - 08:30 p. m. | 1 alumnos','2025-09-29 20:59:18',9,'::ffff:100.64.0.4','2025-09-30 01:59:18','2025-09-30 01:59:18'),
(13,'crear',120,'Horario creado: \"X\" | Lab: Laboratorio de Cómputo 1 | Docente: Esteban | Grupo: G1 | Escuela: Medicina Humana | 28/1/2026 11:15 a. m. - 12:05 p. m. | 1 alumnos','2025-09-29 20:59:55',9,'::ffff:100.64.0.4','2025-09-30 01:59:55','2025-09-30 01:59:55'),
(14,'crear',121,'Horario creado: \"Práctica 9: Anatomía e Histología de los Órganos Linfoides\" | Lab: Laboratorio de Cómputo 1 | Docente: Ruben Maxcarlo Jaimes Soncco | Grupo: G3 | Escuela: Medicina Humana | 1/10/2025 04:55 p. m. - 07:35 p. m. | 30 alumnos','2025-09-30 17:39:12',9,'::ffff:100.64.0.5','2025-09-30 22:39:12','2025-09-30 22:39:12'),
(15,'crear',122,'Horario creado: \"Práctica 13: PhysioEx: Terapia de sustitución hormonal\" | Lab: Laboratorio de Cómputo 2 | Docente: Marcos Levis Ronceros Arizaga | Grupo: G2 | Escuela: Medicina Humana | 14/10/2025 04:00 p. m. - 07:35 p. m. | 1 alumnos','2025-09-30 18:05:37',9,'::ffff:100.64.0.6','2025-09-30 23:05:37','2025-09-30 23:05:37'),
(16,'crear',123,'Horario creado: \"Práctica de Morfo Reproductor\" | Lab: Laboratorio de Cómputo 1 | Docente: Ruben Maxcarlo Jaimes Soncco | Grupo: G2 | Escuela: Medicina Humana | 14/10/2025 11:15 a. m. - 01:00 p. m. | 30 alumnos','2025-10-02 17:42:52',9,'::ffff:100.64.0.2','2025-10-02 22:42:52','2025-10-02 22:42:52'),
(17,'crear',124,'Horario creado: \"Prácticas Endocrino\" | Lab: Laboratorio de Cómputo 1 | Docente: Yemina Varillas Suarez | Grupo: G1 | Escuela: Medicina Humana | 13/10/2025 04:55 p. m. - 06:40 p. m. | 40 alumnos','2025-10-13 11:35:20',1,'::ffff:100.64.0.5','2025-10-13 16:35:20','2025-10-13 16:35:20'),
(18,'crear',125,'Horario creado: \"Prácticas Endocrino\" | Lab: Laboratorio de Cómputo 2 | Docente: Marcos Levis Ronceros Arizaga | Grupo: G1 | Escuela: Medicina Humana | 13/10/2025 04:55 p. m. - 05:45 p. m. | 30 alumnos','2025-10-13 11:36:47',1,'::ffff:100.64.0.5','2025-10-13 16:36:47','2025-10-13 16:36:47'),
(19,'eliminar',120,'Horario eliminado: \"X\" | Lab: Laboratorio de Cómputo 1 | Docente: Esteban | Grupo: G1 | Escuela: Medicina Humana | 28/1/2026 11:15 a. m. - 12:05 p. m. | 1 alumnos','2025-10-16 13:36:11',1,'::1','2025-10-16 18:36:13','2025-10-16 18:36:13'),
(20,'crear',126,'Horario creado: \"PRUEBA HOY\" | Lab: US-01 | Docente: Esteban | Grupo: G1 | Escuela: Medicina Humana | 16/10/2025 09:20 a. m. - 10:10 a. m. | 1 alumnos','2025-10-16 22:48:02',1,'::ffff:100.64.0.6','2025-10-17 03:48:02','2025-10-17 03:48:02'),
(21,'eliminar',126,'Horario eliminado: \"PRUEBA HOY\" | Lab: US-01 | Docente: Esteban | Grupo: G1 | Escuela: Medicina Humana | 16/10/2025 09:20 a. m. - 10:10 a. m. | 1 alumnos','2025-10-16 22:48:24',1,'::ffff:100.64.0.9','2025-10-17 03:48:24','2025-10-17 03:48:24'),
(22,'crear',127,'Horario creado: \"PRUEBA HOY\" | Lab: US-03 | Docente: Esteban | Grupo: G1 | Escuela: Medicina Humana | 17/10/2025 09:20 a. m. - 09:15 a. m. | 1 alumnos','2025-10-16 22:51:12',1,'::ffff:100.64.0.9','2025-10-17 03:51:12','2025-10-17 03:51:12'),
(23,'crear',128,'Horario creado: \"PRUEBA HOY\" | Lab: US-03 | Docente: Esteban | Grupo: G1 | Escuela: Medicina Humana | 18/10/2025 09:20 a. m. - 09:15 a. m. | 1 alumnos','2025-10-16 22:51:13',1,'::ffff:100.64.0.9','2025-10-17 03:51:13','2025-10-17 03:51:13'),
(24,'eliminar',127,'Horario eliminado: \"PRUEBA HOY\" | Lab: US-03 | Docente: Esteban | Grupo: G1 | Escuela: Medicina Humana | 17/10/2025 09:20 a. m. - 09:15 a. m. | 1 alumnos','2025-10-16 22:56:40',1,'::ffff:100.64.0.4','2025-10-17 03:56:40','2025-10-17 03:56:40'),
(25,'eliminar',128,'Horario eliminado: \"PRUEBA HOY\" | Lab: US-03 | Docente: Esteban | Grupo: G1 | Escuela: Medicina Humana | 18/10/2025 09:20 a. m. - 09:15 a. m. | 1 alumnos','2025-10-16 22:56:44',1,'::ffff:100.64.0.9','2025-10-17 03:56:44','2025-10-17 03:56:44'),
(26,'eliminar',70,'Horario eliminado: \"Morfofisiología del Sistema Digestivo\" | Lab: Laboratorio de Cómputo 2 | Docente: Marcos Levis Ronceros Arizaga | Grupo: G3 | Escuela: Medicina Humana | 14/10/2025 09:20 a. m. - 01:00 p. m. | 30 alumnos','2025-10-17 17:30:03',1,'::ffff:100.64.0.4','2025-10-17 22:30:03','2025-10-17 22:30:03'),
(27,'crear',130,'Horario creado: \"Prueba\" | Lab: US-01 | Docente: Esteban | Grupo: G1 | Escuela: Medicina Humana | 17/10/2025 02:05 p. m. - 02:55 p. m. | 1 alumnos','2025-10-17 17:30:45',1,'::ffff:100.64.0.4','2025-10-17 22:30:45','2025-10-17 22:30:45'),
(28,'eliminar',130,'Horario eliminado: \"Prueba\" | Lab: US-01 | Docente: Esteban | Grupo: G1 | Escuela: Medicina Humana | 17/10/2025 02:05 p. m. - 02:55 p. m. | 1 alumnos','2025-10-17 17:31:48',1,'::ffff:100.64.0.4','2025-10-17 22:31:48','2025-10-17 22:31:48'),
(29,'crear',132,'Horario creado: \"kokoo\" | Lab: US-01 | Docente: Esteban | Grupo: G1 | Escuela: Medicina Humana | 21/10/2025 11:15 a. m. - 03:50 p. m. | 10 alumnos','2025-10-19 03:14:54',1,'::1','2025-10-19 08:14:54','2025-10-19 08:14:54'),
(30,'crear',133,'Horario creado: \"Prueba\" | Lab: US-01 | Docente: Estebannnnnn | Grupo: G1 | Escuela: Medicina Humana | 22/10/2025 10:20 a. m. - 11:10 a. m. | 1 alumnos','2025-10-22 23:24:47',1,'::1','2025-10-23 04:24:47','2025-10-23 04:24:47'),
(31,'crear',134,'Horario creado: \"Prueba x\" | Lab: US-01 | Docente: Estebannnnnn | Grupo: G2 | Escuela: Medicina Humana | 24/10/2025 01:10 p. m. - 02:00 p. m. | 1 alumnos','2025-10-24 12:13:13',1,'::1','2025-10-24 17:13:14','2025-10-24 17:13:14'),
(32,'crear',135,'Horario creado: \"Prueba con Quinteros\" | Lab: US-02 | Docente: Estebannnnnn | Grupo: G1 | Escuela: Medicina Humana | 26/10/2025 10:20 a. m. - 11:10 a. m. | 1 alumnos','2025-10-26 09:19:56',1,'::1','2025-10-26 14:19:57','2025-10-26 14:19:57'),
(33,'crear',136,'Horario creado: \"ENDOCRINO\" | Lab: Laboratorio de Cómputo 1 | Docente: Yemina Varillas Suarez | Grupo: G3 | Escuela: Medicina Humana | 11/11/2025 02:05 p. m. - 05:45 p. m. | 30 alumnos','2025-10-27 10:14:50',9,'::ffff:100.64.0.10','2025-10-27 15:14:50','2025-10-27 15:14:50'),
(34,'crear',137,'Horario creado: \"Prueba noche\" | Lab: US-01 | Docente: Estebannnnnn | Grupo: G1 | Escuela: Medicina Humana | 27/10/2025 05:50 p. m. - 06:40 p. m. | 1 alumnos','2025-10-27 20:50:33',1,'::1','2025-10-28 01:50:33','2025-10-28 01:50:33'),
(35,'crear',138,'Horario creado: \"PRUEBA\" | Lab: US-01 | Docente: Estebannnnnn | Grupo: G1 | Escuela: Medicina Humana | 31/12/2025 07:30 a. m. - 08:20 a. m. | 1 alumnos','2025-11-02 12:35:33',1,'::ffff:100.64.0.3','2025-11-02 17:35:33','2025-11-02 17:35:33'),
(36,'crear',141,'Horario creado: \"prueba\" | Lab: US-01 | Docente: Estebannnnnn | Grupo: G2 | Escuela: Medicina Humana | 31/12/2025 01:10 p. m. - 02:00 p. m. | 1 alumnos','2025-11-02 14:35:30',1,'::1','2025-11-02 19:35:31','2025-11-02 19:35:31'),
(37,'eliminar',141,'Horario eliminado: \"prueba\" | Lab: US-01 | Docente: Estebannnnnn | Grupo: G2 | Escuela: Medicina Humana | 31/12/2025 08:10 a. m. - 09:00 a. m. | 1 alumnos','2025-11-02 14:36:02',1,'::1','2025-11-02 19:36:03','2025-11-02 19:36:03'),
(38,'crear',142,'Horario creado: \"PRUEBA\" | Lab: US-01 | Docente: N/A | Grupo: N/A | Escuela: N/A | 5/11/2025 01:10 p. m. - 02:00 p. m. | 1 alumnos','2025-11-05 12:51:35',1,'::1','2025-11-05 17:51:35','2025-11-05 17:51:35'),
(39,'eliminar',142,'Horario eliminado: \"PRUEBA\" | Lab: N/A | Docente: N/A | Grupo: N/A | Escuela: N/A | 5/11/2025 08:10 a. m. - 09:00 a. m. | 1 alumnos','2025-11-05 12:53:44',1,'::1','2025-11-05 17:53:45','2025-11-05 17:53:45'),
(40,'crear',143,'Horario creado: \"PRUEBA\" | Lab: Laboratorio de Cómputo 1 | Docente: N/A | Grupo: N/A | Escuela: N/A | 5/11/2025 07:40 p. m. - 08:30 p. m. | 1 alumnos','2025-11-05 13:46:03',9,'::1','2025-11-05 18:46:03','2025-11-05 18:46:03'),
(41,'eliminar',143,'Horario eliminado: \"PRUEBA\" | Lab: N/A | Docente: N/A | Grupo: N/A | Escuela: N/A | 5/11/2025 02:40 p. m. - 03:30 p. m. | 1 alumnos','2025-11-05 13:47:56',9,'::1','2025-11-05 18:47:57','2025-11-05 18:47:57'),
(42,'crear',144,'Horario creado: \"PRÁCTICA 14: Estudio por imágenes del sistema nervioso central\" | Lab: Laboratorio de Cómputo 1 | Docente: N/A | Grupo: N/A | Escuela: N/A | 25/11/2025 02:05 p. m. - 05:45 p. m. | 1 alumnos','2025-11-05 15:15:44',9,'::ffff:100.64.0.4','2025-11-05 20:15:44','2025-11-05 20:15:44'),
(43,'editar',140,'Horario editado: \"prueba\" | Lab: US-01 | Docente: N/A | Grupo: N/A | Escuela: N/A | 31/12/2025 12:10 p. m. - 01:00 p. m. | 1 alumnos','2025-11-06 15:47:01',1,'::1','2025-11-06 20:47:01','2025-11-06 20:47:01'),
(44,'editar',140,'Horario editado: \"prueba\" | Lab: US-01 | Docente: N/A | Grupo: N/A | Escuela: N/A | 31/12/2025 12:10 p. m. - 01:00 p. m. | 1 alumnos','2025-11-06 15:47:47',1,'::1','2025-11-06 20:47:47','2025-11-06 20:47:47'),
(45,'eliminar',140,'Horario eliminado: \"prueba\" | Lab: N/A | Docente: N/A | Grupo: N/A | Escuela: N/A | 31/12/2025 12:10 p. m. - 01:00 p. m. | 1 alumnos','2025-11-06 15:48:13',1,'::1','2025-11-06 20:48:14','2025-11-06 20:48:14'),
(46,'eliminar',138,'Horario eliminado: \"PRUEBA\" | Lab: N/A | Docente: N/A | Grupo: N/A | Escuela: N/A | 31/12/2025 07:30 a. m. - 08:20 a. m. | 1 alumnos','2025-11-06 15:48:20',1,'::1','2025-11-06 20:48:20','2025-11-06 20:48:20'),
(47,'crear',152,'Horario creado: \"Prueba\" | Lab: US-01 | Docente: N/A | Grupo: N/A | Escuela: N/A | 6/11/2025 10:20 a. m. - 11:10 a. m. | 1 alumnos','2025-11-06 16:51:17',1,'::1','2025-11-06 21:51:18','2025-11-06 21:51:18'),
(48,'crear',153,'Horario creado: \"Prueba\" | Lab: US-01 | Docente: N/A | Grupo: N/A | Escuela: N/A | 7/11/2025 10:20 a. m. - 11:10 a. m. | 1 alumnos','2025-11-06 16:51:18',1,'::1','2025-11-06 21:51:19','2025-11-06 21:51:19'),
(49,'eliminar',153,'Horario eliminado: \"Prueba\" | Lab: N/A | Docente: N/A | Grupo: N/A | Escuela: N/A | 7/11/2025 10:20 a. m. - 11:10 a. m. | 1 alumnos','2025-11-06 16:51:31',1,'::1','2025-11-06 21:51:31','2025-11-06 21:51:31'),
(50,'eliminar',152,'Horario eliminado: \"Prueba\" | Lab: N/A | Docente: N/A | Grupo: N/A | Escuela: N/A | 6/11/2025 10:20 a. m. - 11:10 a. m. | 1 alumnos','2025-11-06 16:51:35',1,'::1','2025-11-06 21:51:35','2025-11-06 21:51:35'),
(51,'crear',154,'Horario creado: \"Pruebita nueva\" | Lab: Laboratorio de Cómputo 1 | Docente: N/A | Grupo: N/A | Escuela: N/A | 31/12/2025 09:20 a. m. - 04:50 p. m. | 11 alumnos','2025-11-07 10:22:20',9,'::1','2025-11-07 15:22:20','2025-11-07 15:22:20'),
(52,'crear',155,'Horario creado: \"Pruebita refactor\" | Lab: Laboratorio de Cómputo 1 | Docente: N/A | Grupo: N/A | Escuela: N/A | 1/12/2025 07:30 a. m. - 01:00 p. m. | 12 alumnos','2025-11-07 10:24:54',9,'::1','2025-11-07 15:24:54','2025-11-07 15:24:54'),
(53,'crear',156,'Horario creado: \"Pruebita refactor\" | Lab: Laboratorio de Cómputo 1 | Docente: N/A | Grupo: N/A | Escuela: N/A | 3/12/2025 07:30 a. m. - 01:00 p. m. | 12 alumnos','2025-11-07 10:24:55',9,'::1','2025-11-07 15:24:55','2025-11-07 15:24:55'),
(54,'crear',157,'Horario creado: \"Pruebita refactor\" | Lab: Laboratorio de Cómputo 1 | Docente: N/A | Grupo: N/A | Escuela: N/A | 9/12/2025 07:30 a. m. - 01:00 p. m. | 12 alumnos','2025-11-07 10:24:56',9,'::1','2025-11-07 15:24:56','2025-11-07 15:24:56'),
(55,'crear',158,'Horario creado: \"Pruebita refactor\" | Lab: Laboratorio de Cómputo 1 | Docente: N/A | Grupo: N/A | Escuela: N/A | 4/1/2026 07:30 a. m. - 01:00 p. m. | 12 alumnos','2025-11-07 10:24:58',9,'::1','2025-11-07 15:24:58','2025-11-07 15:24:58'),
(56,'crear',159,'Horario creado: \"Pruebita refactor\" | Lab: Laboratorio de Cómputo 1 | Docente: N/A | Grupo: N/A | Escuela: N/A | 5/1/2026 07:30 a. m. - 01:00 p. m. | 12 alumnos','2025-11-07 10:24:59',9,'::1','2025-11-07 15:24:59','2025-11-07 15:24:59'),
(57,'crear',160,'Horario creado: \"Pruebita refactor\" | Lab: Laboratorio de Cómputo 1 | Docente: N/A | Grupo: N/A | Escuela: N/A | 8/1/2026 07:30 a. m. - 01:00 p. m. | 12 alumnos','2025-11-07 10:25:00',9,'::1','2025-11-07 15:25:00','2025-11-07 15:25:00'),
(58,'crear',161,'Horario creado: \"Pruebita refactor\" | Lab: Laboratorio de Cómputo 1 | Docente: N/A | Grupo: N/A | Escuela: N/A | 2/2/2026 07:30 a. m. - 01:00 p. m. | 12 alumnos','2025-11-07 10:25:01',9,'::1','2025-11-07 15:25:01','2025-11-07 15:25:01'),
(59,'crear',162,'Horario creado: \"Prueba refactor\" | Lab: Laboratorio de Cómputo 1 | Docente: N/A | Grupo: N/A | Escuela: N/A | 8/11/2025 07:30 a. m. - 11:10 a. m. | 1 alumnos','2025-11-07 10:28:11',9,'::1','2025-11-07 15:28:11','2025-11-07 15:28:11'),
(60,'editar',162,'Horario editado: \"Non ref\" | Lab: Laboratorio de Cómputo 1 | Docente: N/A | Grupo: N/A | Escuela: N/A | 8/11/2025 07:30 a. m. - 09:15 a. m. | 16 alumnos','2025-11-07 10:28:42',9,'::1','2025-11-07 15:28:42','2025-11-07 15:28:42'),
(61,'editar',162,'Horario editado: \"Non ref\" | Lab: Laboratorio de Cómputo 1 | Docente: N/A | Grupo: N/A | Escuela: N/A | 8/11/2025 07:30 a. m. - 09:15 a. m. | 16 alumnos','2025-11-07 10:31:42',9,'::1','2025-11-07 15:31:42','2025-11-07 15:31:42');
/*!40000 ALTER TABLE `actividad_horarios` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `actividad_sistema`
--

LOCK TABLES `actividad_sistema` WRITE;
/*!40000 ALTER TABLE `actividad_sistema` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `actividad_sistema` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `ciclos`
--

LOCK TABLES `ciclos` WRITE;
/*!40000 ALTER TABLE `ciclos` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `ciclos` VALUES
(1,'Ciclo 1'),
(2,'Ciclo 2'),
(3,'Ciclo 3'),
(4,'Ciclo 4'),
(5,'Ciclo 5'),
(6,'Ciclo 6'),
(7,'Ciclo 7'),
(8,'Ciclo 8'),
(9,'Ciclo 9'),
(10,'Ciclo 10'),
(11,'Ciclo 11'),
(12,'Ciclo 12'),
(13,'Ciclo 13'),
(14,'Ciclo 14');
/*!40000 ALTER TABLE `ciclos` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `config_stock_laboratorio`
--

LOCK TABLES `config_stock_laboratorio` WRITE;
/*!40000 ALTER TABLE `config_stock_laboratorio` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `config_stock_laboratorio` VALUES
(1,52,16,2,NULL,NULL,NULL,'2025-10-19 06:36:53','2025-10-19 06:39:28'),
(5,4,17,0,NULL,6,NULL,'2025-10-19 06:39:59','2025-10-19 06:40:37'),
(7,53,16,100,NULL,NULL,NULL,'2025-10-19 06:59:21','2025-10-19 06:59:21'),
(10,4,18,6,NULL,NULL,NULL,'2025-10-19 14:22:26','2025-10-19 14:22:26'),
(11,4,16,8,NULL,NULL,NULL,'2025-10-19 14:37:31','2025-10-19 14:37:31');
/*!40000 ALTER TABLE `config_stock_laboratorio` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `detalle_reserva_equipos`
--

LOCK TABLES `detalle_reserva_equipos` WRITE;
/*!40000 ALTER TABLE `detalle_reserva_equipos` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `detalle_reserva_equipos` VALUES
(8,132,4,'2025-10-19 08:14:53',NULL),
(13,162,76,'2025-11-07 15:31:42',NULL);
/*!40000 ALTER TABLE `detalle_reserva_equipos` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `detalle_reserva_insumos`
--

LOCK TABLES `detalle_reserva_insumos` WRITE;
/*!40000 ALTER TABLE `detalle_reserva_insumos` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `detalle_reserva_insumos` VALUES
(1,85,2,30),
(9,132,4,1),
(10,132,14,1),
(11,132,15,1),
(12,132,16,1),
(13,133,53,10),
(14,134,14,10),
(15,135,8,10),
(16,137,52,4);
/*!40000 ALTER TABLE `detalle_reserva_insumos` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `docentes`
--

LOCK TABLES `docentes` WRITE;
/*!40000 ALTER TABLE `docentes` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `docentes` VALUES
(2,'Flor Cerdan','',1),
(3,'Jhanet Chávez','',1),
(4,'Jordanna Scherman Razzeto','',1),
(5,'Ricardo Josué Rojas Humpire','',1),
(6,'Ruben Maxcarlo Jaimes Soncco','',1),
(7,'Marcos Levis Ronceros Arizaga','',1),
(8,'Luis Roberto Villar Bonilla','',1),
(9,'Leonel Martinez','',1),
(10,'Hayder Torres Contreras','',1),
(11,'Jorge Luis Peña Carmelo','',1),
(12,'Willian Mamani Apaza','',1),
(13,'Romell Edson Diaz Quispe','',1),
(14,'Juan','',1),
(16,'Estebannnnnn','',4),
(20,'Yemina Varillas Suarez','',1);
/*!40000 ALTER TABLE `docentes` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `enlaces_compartidos`
--

LOCK TABLES `enlaces_compartidos` WRITE;
/*!40000 ALTER TABLE `enlaces_compartidos` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `enlaces_compartidos` VALUES
(1,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6NCwiY3JlYXRlZF9ieSI6MSwidHlwZSI6InNoYXJlX2xpbmsiLCJ0aW1lc3RhbXAiOjE3NTU3MDc3NDI3ODQsImlhdCI6MTc1NTcwNzc0MiwiZXhwIjoxNzg3MjQzNzQyfQ.vvn8RLiErNqVYX71z3otvgYlpVDVBI-sa41vHphSoBc',1,'2025-09-19 11:38:40',0,'2025-08-20 16:35:44','2025-08-20 16:39:21'),
(2,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MSwiY3JlYXRlZF9ieSI6MSwidHlwZSI6InNoYXJlX2xpbmsiLCJ0aW1lc3RhbXAiOjE3NTU3MDc4OTEwOTgsImlhdCI6MTc1NTcwNzg5MSwiZXhwIjoxNzg3MjQzODkxfQ.3p0jcqcHRNq_4ttUv3lh4CqzFuup_AcpiK6HrrYNgcw',1,'2026-08-20 11:38:11',0,'2025-08-20 16:38:12','2025-08-20 16:39:22'),
(3,11,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTEsImNyZWF0ZWRfYnkiOjEsInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU1NzA3OTcyMTk0LCJpYXQiOjE3NTU3MDc5NzIsImV4cCI6MTc4NzI0Mzk3Mn0.c9V4JKybUhiVbjS43YKA3krdBh2rQxXN8HLZJxRUjkU',1,'2025-09-19 11:39:32',0,'2025-08-20 16:39:33','2025-08-21 07:03:16'),
(5,12,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTIsImNyZWF0ZWRfYnkiOjEsInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU1NzU2NDg1MDg0LCJpYXQiOjE3NTU3NTY0ODUsImV4cCI6MTc4NzI5MjQ4NX0.GEVuAkUEsp6Duv19O2wOsc-8fDkvRzqVqjGt2oytBsQ',1,'2025-11-19 06:08:05',0,'2025-08-21 06:08:05','2025-08-21 07:03:17'),
(7,11,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTEsImNyZWF0ZWRfYnkiOjksInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU1NzU2NzMyOTAzLCJpYXQiOjE3NTU3NTY3MzIsImV4cCI6MTc4NzI5MjczMn0.FXBKN32jhL2LlNdrfYA6BeZJYo9AoyIVAXacf1OffgM',9,'2025-09-20 06:17:39',0,'2025-08-21 06:12:12','2025-08-21 06:17:45'),
(8,11,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTEsImNyZWF0ZWRfYnkiOjksInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU1NzU3MDY2NTUxLCJpYXQiOjE3NTU3NTcwNjYsImV4cCI6MTc4NzI5MzA2Nn0.ulQ5mC3WnfNFyLBaVUiOdiHry_1c2dgh0QBHNwib2QU',9,'2025-09-20 06:17:47',0,'2025-08-21 06:17:46','2025-08-21 06:18:20'),
(9,11,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTEsImNyZWF0ZWRfYnkiOjksInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU1NzU3MTA0MDY0LCJpYXQiOjE3NTU3NTcxMDQsImV4cCI6MTc4NzI5MzEwNH0.GelywedGvy05DfAF-o5reQNNViV_gH4gXu79S0Pdg0g',9,'2025-08-28 06:18:24',0,'2025-08-21 06:18:24','2025-08-21 06:19:09'),
(10,11,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTEsImNyZWF0ZWRfYnkiOjksInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU1NzU3MTUzMDMzLCJpYXQiOjE3NTU3NTcxNTMsImV4cCI6MTc4NzI5MzE1M30.VN2ixAJer_rUfRf-VnySiVZXchovytHUkyUTgBBALn4',9,'2025-08-28 06:19:13',0,'2025-08-21 06:19:13','2025-08-21 06:23:03'),
(11,11,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTEsImNyZWF0ZWRfYnkiOjksInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU1NzU3Mzg2NzI4LCJpYXQiOjE3NTU3NTczODYsImV4cCI6MTc4NzI5MzM4Nn0.Lz4_ZdNS4gaYcwj-9uoHJnW6dziQ1s9LwOb3nvxPYuI',9,'2025-08-28 06:23:07',0,'2025-08-21 06:23:06','2025-08-21 06:33:40'),
(12,11,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTEsImNyZWF0ZWRfYnkiOjksInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU1NzU4MDI1NTA1LCJpYXQiOjE3NTU3NTgwMjUsImV4cCI6MTc4NzI5NDAyNX0.eOKHzkuHO6i37yJ_byzp0uGBa885_G-3zpCx6G1u9os',9,'2026-08-23 16:33:28',0,'2025-08-21 06:33:45','2025-08-23 16:33:31'),
(13,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6OCwiY3JlYXRlZF9ieSI6MSwidHlwZSI6InNoYXJlX2xpbmsiLCJ0aW1lc3RhbXAiOjE3NTU3NTk4MDI0OTksImlhdCI6MTc1NTc1OTgwMiwiZXhwIjoxNzg3Mjk1ODAyfQ.tWWRLVyz606Jl8FeXvVGp7kL891sANmw5s6lGdyj-9U',1,'2025-09-20 07:03:23',0,'2025-08-21 07:03:22','2025-09-04 03:09:26'),
(14,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTEsImNyZWF0ZWRfYnkiOjEsInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU1NzkwNDk4NDkyLCJpYXQiOjE3NTU3OTA0OTgsImV4cCI6MTc4NzMyNjQ5OH0.-pr4ChAKaltUEfEHmdJ-EnpJJvXGqk8QiY4MrNesam4',1,'2025-11-21 10:57:19',0,'2025-08-21 15:34:58','2025-09-04 03:09:26'),
(15,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTQsImNyZWF0ZWRfYnkiOjEsInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU1NzkwODA3ODg5LCJpYXQiOjE3NTU3OTA4MDcsImV4cCI6MTc4NzMyNjgwN30.kTAam2riml7_jiY7frzg2NAr4cpfVjhCq9er-7Ipp3A',1,'2025-09-22 16:35:02',0,'2025-08-21 15:40:08','2025-09-04 03:09:26'),
(16,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTMsImNyZWF0ZWRfYnkiOjEsInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU1NzkxNDQ1MTQyLCJpYXQiOjE3NTU3OTE0NDUsImV4cCI6MTc4NzMyNzQ0NX0.9gNOyUGio6Hwb6Tu8Zg8mpMjaKcjlUK0m6xVU_LGH4M',1,'2025-09-20 15:50:45',0,'2025-08-21 15:50:45','2025-09-04 03:09:26'),
(17,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MiwiY3JlYXRlZF9ieSI6MSwidHlwZSI6InNoYXJlX2xpbmsiLCJ0aW1lc3RhbXAiOjE3NTU3OTQ5OTI0MDIsImlhdCI6MTc1NTc5NDk5MiwiZXhwIjoxNzg3MzMwOTkyfQ.SmKmxZqiGbOcosTZayVSDiRijN8xGoyeTV74cd_5l24',1,'2025-10-03 22:05:54',0,'2025-08-21 16:49:52','2025-09-04 03:09:26'),
(18,12,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTIsImNyZWF0ZWRfYnkiOjksInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU1OTY0ODg3MTQ0LCJpYXQiOjE3NTU5NjQ4ODcsImV4cCI6MTc4NzUwMDg4N30.z8Ry6wXPoEHkz4Sk5ZMd9dcaicwQWs3cUvqnTYRPKdY',9,'2025-08-30 16:10:06',0,'2025-08-23 16:01:27','2025-08-23 16:33:30'),
(19,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTEsImNyZWF0ZWRfYnkiOjksInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU1OTY2ODE0NTc5LCJpYXQiOjE3NTU5NjY4MTQsImV4cCI6MTc4NzUwMjgxNH0.wDgIpd9b_AyboK8q9lD1UE69IbIfkRox7fDT8oSdnDc',9,'2025-11-26 12:18:18',0,'2025-08-23 16:33:34','2025-09-04 03:09:26'),
(20,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTIsImNyZWF0ZWRfYnkiOjksInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU1OTkxNDE1NTg4LCJpYXQiOjE3NTU5OTE0MTUsImV4cCI6MTc4NzUyNzQxNX0.A5X8drYwCn8sX2S2_t0ZfPQOpDv-0L72AA3PFX9vk1g',9,'2025-11-21 18:23:36',0,'2025-08-23 23:23:36','2025-09-04 03:09:26'),
(21,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTAsImNyZWF0ZWRfYnkiOjgsInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU2MTQ5ODA1MDk1LCJpYXQiOjE3NTYxNDk4MDUsImV4cCI6MTc4NzY4NTgwNX0.0e5_9bBN6cCkxvXmJ29c6LLXQDPkbg2enEzs-eH7jnc',8,'2025-09-26 17:23:45',0,'2025-08-25 19:23:26','2025-09-04 03:09:26'),
(22,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MSwiY3JlYXRlZF9ieSI6MywidHlwZSI6InNoYXJlX2xpbmsiLCJ0aW1lc3RhbXAiOjE3NTYzMjM3NDE2MzUsImlhdCI6MTc1NjMyMzc0MSwiZXhwIjoxNzg3ODU5NzQxfQ.344g7DoW8jK6J3owudQOwMQB9CyVO-ry1ygM1s9OUdA',3,'2025-09-26 14:42:22',0,'2025-08-27 19:42:22','2025-09-04 03:09:26'),
(23,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6OSwiY3JlYXRlZF9ieSI6MSwidHlwZSI6InNoYXJlX2xpbmsiLCJ0aW1lc3RhbXAiOjE3NTY0NzkzODEzNTUsImlhdCI6MTc1NjQ3OTM4MSwiZXhwIjoxNzg4MDE1MzgxfQ.iyeBJwtyAzRHz38g_1ZpNkmfiC6dWRGfhnuRp3rVfpk',1,'2025-10-02 17:40:41',0,'2025-08-29 14:56:21','2025-09-04 03:09:26'),
(24,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MiwiY3JlYXRlZF9ieSI6NCwidHlwZSI6InNoYXJlX2xpbmsiLCJ0aW1lc3RhbXAiOjE3NTY2MjQxMjAwNTcsImlhdCI6MTc1NjYyNDEyMCwiZXhwIjoxNzg4MTYwMTIwfQ.m53mjbLVv9DWD0SYz4Vuwjkj3pvUzI6yRUIK9sHUfFo',4,'2025-12-01 17:47:47',0,'2025-08-31 07:08:40','2025-09-04 03:09:26'),
(25,2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MiwiY3JlYXRlZF9ieSI6MSwidHlwZSI6InNoYXJlX2xpbmsiLCJ0aW1lc3RhbXAiOjE3NTY5NTUzNjY2ODgsImlhdCI6MTc1Njk1NTM2NiwiZXhwIjoxNzg4NDkxMzY2fQ.qF8pz93MJim4plbICCPCDwfrF726Bm2gtD7DFOSCa6A',1,'2026-09-03 22:09:27',0,'2025-09-04 03:09:26','2025-09-04 03:12:01'),
(26,2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MiwiY3JlYXRlZF9ieSI6MSwidHlwZSI6InNoYXJlX2xpbmsiLCJ0aW1lc3RhbXAiOjE3NTY5NTU1MjM4MjcsImlhdCI6MTc1Njk1NTUyMywiZXhwIjoxNzg4NDkxNTIzfQ.hrG533SmsiYVh6sU08OUjAh6bxCWsHmxnNZjOUxzles',1,'2025-10-03 22:12:04',1,'2025-09-04 03:12:04','2025-09-04 03:12:04'),
(27,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6NCwiY3JlYXRlZF9ieSI6MSwidHlwZSI6InNoYXJlX2xpbmsiLCJ0aW1lc3RhbXAiOjE3NTczNTg5MDA4NzEsImlhdCI6MTc1NzM1ODkwMCwiZXhwIjoxNzg4ODk0OTAwfQ.vvhV9wviObSUzns3B_3tj9wuMTFA8bX4Da1SVC5I3cI',1,'2025-09-15 14:15:01',1,'2025-09-08 19:15:00','2025-09-08 19:15:00'),
(28,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MSwiY3JlYXRlZF9ieSI6MSwidHlwZSI6InNoYXJlX2xpbmsiLCJ0aW1lc3RhbXAiOjE3NTczNTg5MjgzODEsImlhdCI6MTc1NzM1ODkyOCwiZXhwIjoxNzg4ODk0OTI4fQ.7iiwPcYL3upB-FU5X-NVw0hid22aBahjgnAc9rnXlgI',1,'2025-09-15 14:15:28',1,'2025-09-08 19:15:28','2025-09-08 19:15:28'),
(29,9,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6OSwiY3JlYXRlZF9ieSI6MSwidHlwZSI6InNoYXJlX2xpbmsiLCJ0aW1lc3RhbXAiOjE3NTczNTg5NTE4MTIsImlhdCI6MTc1NzM1ODk1MSwiZXhwIjoxNzg4ODk0OTUxfQ.Yd5DdyFxYGDCw4kJ3hmkaII8HcBesHyEPIvMkdqHU-U',1,'2025-09-15 14:15:52',1,'2025-09-08 19:15:51','2025-09-08 19:15:51'),
(30,12,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTIsImNyZWF0ZWRfYnkiOjksInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU3NTk1NTYyNzg3LCJpYXQiOjE3NTc1OTU1NjIsImV4cCI6MTc4OTEzMTU2Mn0.zluHqzq-9R2GuIQE-soNQHlf34zvqlXZDw0FDyKM_6c',9,'2026-10-14 10:44:16',1,'2025-09-11 12:59:23','2025-10-14 15:44:16'),
(31,11,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTEsImNyZWF0ZWRfYnkiOjksInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU3OTc5NTI0NDIzLCJpYXQiOjE3NTc5Nzk1MjQsImV4cCI6MTc4OTUxNTUyNH0.nAyFzXVmbLKkWPo6oi8g1GpmFCJR_ekVkbIdSbSSIwE',9,'2026-10-14 10:44:11',1,'2025-09-15 23:38:44','2025-10-14 15:44:11'),
(32,16,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTYsImNyZWF0ZWRfYnkiOjEsInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzU4MTQwNzYzOTU0LCJpYXQiOjE3NTgxNDA3NjMsImV4cCI6MTc4OTY3Njc2M30.5P6h1rVFrW7N1cwcmHa01zHxgXUz8LvPb6esK9QxrVg',1,'2025-09-24 15:26:04',1,'2025-09-17 20:26:03','2025-09-17 20:26:03'),
(33,9,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6OSwiY3JlYXRlZF9ieSI6NywidHlwZSI6InNoYXJlX2xpbmsiLCJ0aW1lc3RhbXAiOjE3NTgyMTUwNDI2MzgsImlhdCI6MTc1ODIxNTA0MiwiZXhwIjoxNzg5NzUxMDQyfQ.wGF3r6LyGjxj7qItMJSZVkvFQ_eFsBN-M8_Wb57I0vA',7,'2025-10-18 12:04:03',1,'2025-09-18 17:04:02','2025-09-18 17:04:02'),
(34,16,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTYsImNyZWF0ZWRfYnkiOjEwLCJ0eXBlIjoic2hhcmVfbGluayIsInRpbWVzdGFtcCI6MTc1ODY1MjAzODI0NCwiaWF0IjoxNzU4NjUyMDM4LCJleHAiOjE3OTAxODgwMzh9.yAJoUG7wSHd8EKS8eyVr64ug4r_QVzS3N9dhva1zu6s',10,'2025-10-23 13:27:18',1,'2025-09-23 18:27:18','2025-09-23 18:27:18'),
(35,11,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYWJvcmF0b3Jpb19pZCI6MTEsImNyZWF0ZWRfYnkiOjEsInR5cGUiOiJzaGFyZV9saW5rIiwidGltZXN0YW1wIjoxNzYwNjY5MTE1ODk2LCJpYXQiOjE3NjA2NjkxMTUsImV4cCI6MTc5MjIwNTExNX0.qWhlGbRJa3xYFTyQ2PmcDziuGp17HQOWpowcGmKb2FQ',1,'2025-11-15 21:45:16',1,'2025-10-17 02:45:15','2025-10-17 02:45:15');
/*!40000 ALTER TABLE `enlaces_compartidos` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `equipos`
--

LOCK TABLES `equipos` WRITE;
/*!40000 ALTER TABLE `equipos` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `equipos` VALUES
(4,'EQP-0003','Equipo de prueba para prácticas de RCP',3,16,'Sirve para hacer RCP - caso real','AyB','Estándar','0022229','En Mantenimiento','2025-09-22 14:31:44','2025-11-04 16:10:12','2025-09-12','2025-09-24','Ya lo arreglaron','Bueno','2021-01-01',0),
(5,'EQP-0005','Simulador de Paciente Adulto',NULL,24,'Simulador de alta fidelidad para prácticas clínicas','Laerdal','SimMan 3G','SM3G-2023-001','Operativo','2025-09-22 22:34:42','2025-10-19 15:28:13','2024-01-15','2024-07-15','Requiere calibración semestral','Excelente','2023-01-01',0),
(6,'EQP-0007','Microscopio Óptico Binocular',4,16,'Microscopio para observación de muestras biológicas','Olympus','CX23','CX23-2024-005','Operativo','2025-09-22 22:34:44','2025-10-31 04:25:05','2024-03-20','2024-09-20','Limpiar lentes semanalmente','Bueno','2024-01-01',0),
(7,'EQP-0009','Centrifuga de Mesa',5,16,'Centrifuga para separación de muestras','Hettich','EBA 200','EBA200-2022-012','En Mantenimiento','2025-09-22 22:34:44','2025-10-31 04:30:17','2024-02-10','2024-08-10','En reparación - motor defectuoso','Regular','2022-01-01',0),
(42,'EQP-0008','Ejemplo eqqquipo',NULL,NULL,'Descripción para el equipo','Olympus','CXWWW23','1234243423','En Mantenimiento','2025-09-29 14:12:54','2025-10-13 03:48:45','2025-09-30','2025-10-09','COmentarios random','Bueno','2021-01-01',0),
(43,'EQP-0043','Equipo X',NULL,NULL,'','','','','Operativo','2025-09-29 17:50:06','2025-09-29 17:50:06','2025-09-29','2025-09-23','','Bueno',NULL,0),
(44,'EQP-0044','Equipo CX',NULL,NULL,'','','','','Operativo','2025-09-29 17:53:55','2025-09-29 17:53:55','2025-09-29','2025-09-29','','Bueno',NULL,0),
(45,'EQP-0045','Equipo C1',NULL,NULL,'','','','','Operativo','2025-09-29 17:57:12','2025-09-29 17:57:12','2025-09-29','2025-09-29','','Bueno',NULL,0),
(48,'EQP-0046','Equipo C2',NULL,NULL,'','','','','Operativo','2025-09-30 01:52:18','2025-09-30 01:52:18','2025-09-28','2025-09-28','','Bueno',NULL,0),
(56,'EQP-0056','Simulador de Paciente Adulto',NULL,NULL,'X','Laerdal','SimMan 3G','SM3G-2023-001','Operativo','2025-10-17 04:27:56','2025-10-17 04:27:56','2024-01-15','2024-07-15','Requiere calibración semestral','Excelente','2023-01-01',0),
(58,'EQP-0060','Centrifuga de Mesa',9,17,'Z','Hettich','EBA 200','EBA200-2022-012','En Mantenimiento','2025-10-17 04:27:56','2025-11-04 15:50:39','2024-02-10','2024-08-10','En reparación - motor defectuoso','Regular','2022-01-01',0),
(76,'123345','Monitor',1,11,'Monitor de 24\"','Dell','WFT2025','12344325345433','Operativo','2025-11-07 15:31:20','2025-11-07 15:31:20','2025-11-06','2026-03-05','Monitor de prueba nuevo','Excelente','2025-10-10',0),
(77,'234325235','Monitor carga masiva1',1,21,'descripción de monitor carga masiva','Dell','SimMan 3G','SM3G-2023-001','Operativo','2025-11-07 16:10:17','2025-11-07 16:10:17','2024-01-15','2024-07-15','Requiere calibración semestral','Excelente','2023-01-01',0),
(78,'5434434','Monitor carga masiva2',1,21,'descripción de monitor carga masiva','LG','CX23','CX23-2024-005','Operativo','2025-11-07 16:10:17','2025-11-07 16:10:17','2024-03-20','2024-09-20','Limpiar lentes semanalmente','Bueno','2024-01-01',0);
/*!40000 ALTER TABLE `equipos` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `escuelas`
--

LOCK TABLES `escuelas` WRITE;
/*!40000 ALTER TABLE `escuelas` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `escuelas` VALUES
(1,'Medicina Humana'),
(2,'Enfermería'),
(3,'Nutrición Humana'),
(4,'Psicología'),
(5,'Laboratorio Clínico'),
(6,'Terapia Física');
/*!40000 ALTER TABLE `escuelas` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `grupos`
--

LOCK TABLES `grupos` WRITE;
/*!40000 ALTER TABLE `grupos` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `grupos` VALUES
(1,'G1',1,1),
(2,'G2',1,1),
(3,'G3',1,1),
(4,'G4',1,1),
(5,'G5',1,1),
(6,'G6',1,1),
(7,'G1',1,2),
(8,'G2',1,2),
(9,'G3',1,2),
(10,'G4',1,2),
(11,'G5',1,2),
(12,'G6',1,2),
(13,'G1',1,3),
(14,'G2',1,3),
(15,'G3',1,3),
(16,'G4',1,3),
(17,'G5',1,3),
(18,'G6',1,3),
(19,'G1',1,4),
(20,'G2',1,4),
(21,'G3',1,4),
(22,'G4',1,4),
(23,'G5',1,4),
(24,'G6',1,4);
/*!40000 ALTER TABLE `grupos` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `incidencias`
--

LOCK TABLES `incidencias` WRITE;
/*!40000 ALTER TABLE `incidencias` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `incidencias` VALUES
(1,18,'Microscopio dañado','El microscopio de la mesa 3 no enfoca correctamente. Los estudiantes no pudieron completar la práctica de microbiología.','2025-07-27 11:06:24',2),
(2,19,'Microscopio dañado-pruebapostman','El microscopio de la mesa 3 no enfoca correctamente. Los estudiantes no pudieron completar la práctica de microbiología.','2025-07-27 11:42:05',4),
(3,9,'Hubo una explosión','Un alumno tiró unos reactivos al suelo','2025-07-27 11:43:11',4),
(4,29,'El docente no se puso el EPP','gyrgyryhhht','2025-08-01 17:44:04',7),
(5,73,'No usó su EPP','Al momento de ingresar el Dr no usó su EPP, además llegó 1 hora tarde a la clase sin avisar.','2025-09-17 16:55:58',1),
(6,53,'Cambio de modalidad sin avisar','La docente no avisó que haría un cambio de modalidad virtual','2025-09-17 17:31:23',1),
(7,47,'malogró a pc','La docente derramó líquido sobre el equipo de cómputo','2025-09-17 20:39:14',1),
(8,108,'Visita rápida','Una descripción rápida','2025-09-24 04:28:17',1),
(9,108,'Prueba','Prueba X-1','2025-09-25 16:36:51',1),
(10,161,'pruebita de incidencia 1234567','HHEEEYYYYYYYYYYYY ohhhhhhhHHEEEYYYYYYYYYYYY ohhhhhhh','2025-11-10 03:42:50',1);
/*!40000 ALTER TABLE `incidencias` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `insumos`
--

LOCK TABLES `insumos` WRITE;
/*!40000 ALTER TABLE `insumos` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `insumos` VALUES
(2,'Jeringas','5ml','cajas','INS-0001','Materiales',NULL),
(3,'Guantes','Guantes blancos','pares','INS-0003','Materiales','Caja'),
(4,'Ácidos sulfúrico','200 ml','ml','INS-0004','Materiales','Frasco'),
(5,'E Coli','Cepa','ml','INS-0005','Material_Biologico',NULL),
(6,'Insumo de ejemplo','5 ml blanco ','Cajas','INS-0006','Materiales',NULL),
(7,'Insumo prueba','Descripción prueba de material biológico 25 ml','ml','INS-0007','Material_Biologico','Frasco'),
(8,'Insumo prueba 2','Reactivo peligroso 50 ml','ml','INS-0008','Reactivos','Botella'),
(9,'Insumo de prueba 3','Insumo altamente peligroso 43ml','ml','INS-0009','Reactivos','Botella'),
(10,'Alcohol etílico 70%','Alcohol para desinfección y limpieza','Litros','INS-0010','Reactivos','Frasco 1L'),
(11,'Jeringas desechables 10ml','Jeringas estériles para procedimientos','Unidades','INS-0012','Materiales','Caja x 100 unidades'),
(12,'Cultivo bacteriano E.coli','Cultivo para prácticas de microbiología','Placas','INS-0014','Material_Biologico','Placa Petri'),
(13,'CARGA 1','Descripción de la carga','Litros','INS-0013','Materiales','Frasco 1L'),
(14,'CARGA 2','Descripción de la carga 1','Litros','INS-0015','Reactivos','Frasco 2L'),
(15,'CARGA 3','Descripción de la carga 2','Litros','INS-0017','Material_Biologico','Frasco 3L'),
(16,'CARGA 4','Descripción de la carga 3','Litros','INS-0019','Reactivos','Frasco 4L'),
(17,'CARGA 5-1','Descripción de la carga 4','Litros','INS-0021','Material_Biologico','Frasco 5L'),
(18,'Prueba de carga','Carga prueba','Litros','INS-0018','Reactivos','Frasco 1L'),
(51,'Insumo prueba','Insumo x','ml','INS-0020','Materiales','Tabletas'),
(52,'inusmo de prueba','casdada','litros','INS-0052','Materiales','Cajas'),
(53,'Insumo del catálogo editar','Descripción corta editar','ml editar','INS-0053','Materiales','caja edit'),
(79,'Hola Prueba','Prueba','Prueba','INS-0079','Materiales',''),
(95,'Pruebita','prueba','P','INS-0095','Materiales','');
/*!40000 ALTER TABLE `insumos` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `inventario_equipos`
--

LOCK TABLES `inventario_equipos` WRITE;
/*!40000 ALTER TABLE `inventario_equipos` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `inventario_equipos` VALUES
(3,4,16,1,1,0,'2025-09-22 14:31:44','2025-11-02 19:36:00',0),
(4,5,16,1,1,0,'2025-09-22 22:34:43','2025-09-22 22:34:43',0),
(5,6,16,5,5,0,'2025-09-22 22:34:44','2025-09-22 22:34:44',0),
(6,7,16,2,2,0,'2025-09-22 22:34:44','2025-09-22 22:34:44',0),
(9,42,17,1,1,0,'2025-09-29 14:12:54','2025-09-29 14:12:54',0),
(10,45,11,1,1,0,'2025-09-29 17:57:12','2025-10-16 18:36:09',0),
(11,48,11,1,1,0,'2025-09-30 01:52:18','2025-09-30 01:52:18',0),
(13,56,1,1,1,0,'2025-10-17 04:27:56','2025-10-17 04:27:56',0),
(17,58,1,2,2,0,'2025-10-17 04:27:56','2025-10-17 04:27:56',0),
(18,58,2,1,1,0,'2025-10-17 04:27:56','2025-10-17 04:27:56',0);
/*!40000 ALTER TABLE `inventario_equipos` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `inventario_insumos`
--

LOCK TABLES `inventario_insumos` WRITE;
/*!40000 ALTER TABLE `inventario_insumos` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `inventario_insumos` VALUES
(2,2,170,1),
(3,3,120,16),
(4,4,19,16),
(5,5,30,16),
(6,6,110,16),
(7,7,18,16),
(8,8,30,16),
(9,2,400,16),
(10,9,700,16),
(11,10,10,1),
(12,10,5,2),
(13,11,200,1),
(14,11,150,2),
(15,11,100,3),
(16,12,5,1),
(17,12,3,2),
(18,12,2,3),
(19,13,200,16),
(20,14,389,16),
(21,15,399,16),
(22,16,499,16),
(23,17,600,16),
(24,18,10,17),
(25,2,8,9),
(26,51,12,17),
(27,52,10,16),
(28,53,1292,16),
(29,8,40,17),
(36,2,50,17),
(37,3,100,17);
/*!40000 ALTER TABLE `inventario_insumos` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `jefe_laboratorio`
--

LOCK TABLES `jefe_laboratorio` WRITE;
/*!40000 ALTER TABLE `jefe_laboratorio` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `jefe_laboratorio` VALUES
(1,2,7),
(8,2,8),
(2,3,1),
(3,4,2),
(4,5,3),
(5,6,4),
(6,6,5),
(7,6,6),
(9,7,9),
(23,8,10),
(24,8,16),
(11,9,11),
(12,9,12),
(13,10,16),
(14,10,17),
(15,10,18),
(16,10,19),
(17,10,20),
(18,10,21),
(19,10,22),
(20,10,23),
(21,10,24),
(22,10,25);
/*!40000 ALTER TABLE `jefe_laboratorio` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `laboratorios`
--

LOCK TABLES `laboratorios` WRITE;
/*!40000 ALTER TABLE `laboratorios` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `laboratorios` VALUES
(1,'Laboratorio de Microbiología y Parasitología','Planta 1',1,1,'Activo','SL01LA07'),
(2,'Laboratorio de Morfología Microscópica','Planta 1',1,1,'Activo','SL01LA08'),
(3,'Laboratorio de Morfología Microscópica 2','Planta 2',1,1,'Activo','SL01LA08.'),
(4,'Laboratorio Multifuncional 1','Planta 1',1,2,'Activo','SL01LA09.'),
(5,'Laboratorio Multifuncional 2','Planta 1',1,2,'Activo','SL01LA09'),
(6,'Laboratorio Multifuncional 3','Planta 2',1,2,'Activo','SL01LA09..'),
(7,'Laboratorio de Química y Bioquímica 1','Planta 1',1,3,'Activo','SL01LA06'),
(8,'Laboratorio de Química y Bioquímica 2','Planta 2',1,3,'Activo','SL01LA06.'),
(9,'Laboratorio de Morfología Macroscópica','Planta 1',1,3,'Activo','SL01LA05'),
(10,'Laboratorio de Biología Molecular','Planta 1',1,4,'Activo','SL03LA43'),
(11,'Laboratorio de Cómputo 1','Pabellón A',1,2,'Activo','SL01LA10'),
(12,'Laboratorio de Cómputo 2','Pabellón A',1,2,'Activo','SL01LA11'),
(16,'US-01','Pabellón A',1,4,'Activo','SL02LA42'),
(17,'US-02','Pabellón A',1,3,'Activo','LAB-0017'),
(18,'US-03','Pabellón A',1,4,'Activo','LAB-0018'),
(19,'US-04','Pabellón A',1,4,'Activo','LAB-0019'),
(20,'US-05','Pabellón A',1,4,'Activo','LAB-0020'),
(21,'US-06','Pabellón A',1,4,'Activo','LAB-0021'),
(22,'US-07','Pabellón A',1,4,'Activo','LAB-0022'),
(23,'US-08','Pabellón A',1,4,'Activo','LAB-0023'),
(24,'US-09','Pabellón A',1,4,'Activo','LAB-0024'),
(25,'US-10','Pabellón A',1,4,'Activo','LAB-0025'),
(27,'Laboratorio Cómputo Yq','Pabellón B',1,1,'Activo','LAB-0026'),
(28,'Pruebas 2','X',1,2,'Activo','LAB-0028');
/*!40000 ALTER TABLE `laboratorios` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `movimiento_insumo_detalle`
--

LOCK TABLES `movimiento_insumo_detalle` WRITE;
/*!40000 ALTER TABLE `movimiento_insumo_detalle` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `movimiento_insumo_detalle` VALUES
(1,43,53,90,NULL,NULL,NULL,70.00),
(2,43,52,4,NULL,NULL,NULL,0.00),
(3,44,53,10,'lote 3','2026-09-20',NULL,1.00),
(4,45,53,800,'lote 4','2028-07-11',NULL,800.00),
(5,46,53,100,'lote 5','2025-12-27',NULL,100.00),
(6,47,53,2,'SL','2025-10-13',NULL,2.00),
(7,48,8,50,'20001','2025-10-17',NULL,30.00),
(8,49,9,100,'3333','2025-10-29',NULL,100.00),
(9,50,9,200,'999','2025-11-29',NULL,200.00),
(10,51,53,300,'111','2025-12-24',NULL,300.00),
(15,56,14,100,'999999','2025-12-27',NULL,90.00),
(24,57,53,7,NULL,NULL,3,NULL),
(26,69,53,1,NULL,NULL,3,NULL),
(27,70,53,1,NULL,NULL,3,NULL),
(28,77,53,100,'P0053','2025-12-31',NULL,100.00),
(29,78,9,100,'PQ009','2025-12-31',NULL,0.00),
(30,79,9,50,NULL,NULL,29,NULL),
(31,80,9,50,NULL,NULL,29,NULL),
(32,81,53,10,'SALIDA-RESERVA',NULL,NULL,NULL),
(33,82,4,10,'PA0004','2025-12-31',NULL,5.00),
(34,83,4,5,NULL,NULL,33,NULL),
(35,84,53,10,NULL,NULL,1,NULL),
(36,85,53,10,NULL,NULL,1,NULL),
(37,86,14,10,'SALIDA-RESERVA',NULL,NULL,NULL),
(38,87,14,10,NULL,NULL,15,NULL),
(39,88,52,10,'PR-0052','2025-12-31',NULL,2.00),
(40,89,5,10,'PR-0005','2025-12-31',NULL,5.00),
(41,90,5,5,NULL,NULL,40,NULL),
(42,91,8,10,NULL,NULL,7,NULL),
(43,92,8,10,'SALIDA-RESERVA',NULL,NULL,NULL),
(44,93,8,10,NULL,NULL,7,NULL),
(45,94,8,10,'PR-0008','2025-10-26',NULL,10.00),
(46,95,52,4,'SALIDA-RESERVA',NULL,NULL,NULL),
(47,96,52,4,NULL,NULL,39,NULL),
(48,99,2,50,'L0001','2025-01-11',NULL,1.00),
(49,99,2,100,'L0002','2025-01-11',NULL,0.00),
(50,100,4,15,NULL,'2025-12-31',NULL,15.00),
(51,101,3,10,'G0001','2025-12-31',NULL,5.00),
(52,102,3,2,'G0001','4596-01-01',NULL,0.00),
(53,102,51,2,'L0002','4596-01-01',NULL,2.00),
(54,103,3,2,NULL,NULL,NULL,1.00),
(55,104,3,10,NULL,NULL,NULL,10.00),
(56,105,3,1,NULL,NULL,52,NULL),
(57,106,3,1,NULL,NULL,52,NULL),
(58,107,3,5,NULL,NULL,51,NULL),
(59,107,3,1,NULL,NULL,54,NULL),
(60,108,3,5,NULL,NULL,NULL,5.00),
(61,109,3,10,NULL,NULL,NULL,10.00),
(62,110,3,1,NULL,NULL,NULL,1.00),
(63,111,3,15,NULL,NULL,NULL,15.00),
(64,112,52,4,NULL,NULL,2,NULL),
(65,113,14,50,'L0001','2025-01-11',NULL,50.00),
(66,113,14,100,'L0002','2025-01-11',NULL,100.00),
(67,114,52,4,NULL,NULL,39,NULL),
(68,115,51,10,'L0020','2025-11-30',NULL,10.00),
(69,116,52,10,NULL,'2025-11-30',NULL,2.00),
(70,117,52,4,NULL,NULL,69,NULL),
(71,118,52,4,NULL,NULL,69,NULL),
(72,119,52,10,'P0211','2025-11-30',NULL,0.00),
(73,120,52,4,NULL,NULL,72,NULL),
(74,121,52,4,NULL,NULL,72,NULL),
(75,122,52,10,NULL,'2025-11-30',NULL,0.00),
(76,123,52,4,NULL,NULL,75,NULL),
(77,124,52,4,NULL,NULL,75,NULL),
(78,125,52,10,NULL,'2025-11-30',NULL,10.00),
(79,126,52,2,NULL,NULL,75,NULL),
(80,126,52,2,NULL,NULL,72,NULL),
(81,127,10,10,'PRUEBA-01','2025-12-20',NULL,10.00),
(82,128,13,5,'555','2025-11-12',NULL,5.00),
(83,129,2,200,'5000','2026-06-18',NULL,0.00),
(84,130,2,333,'90','2026-04-10',NULL,0.00),
(85,131,2,333,NULL,NULL,84,NULL),
(86,131,2,200,NULL,NULL,83,NULL),
(87,131,2,100,NULL,NULL,49,NULL),
(88,131,2,49,NULL,NULL,48,NULL);
/*!40000 ALTER TABLE `movimiento_insumo_detalle` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `movimientos_equipos`
--

LOCK TABLES `movimientos_equipos` WRITE;
/*!40000 ALTER TABLE `movimientos_equipos` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `movimientos_equipos` VALUES
(7,4,16,1,'entrada',1,NULL,'','2025-09-22 14:31:44'),
(8,5,16,1,'entrada',1,NULL,'Importación masiva','2025-09-22 17:34:43'),
(9,6,16,1,'entrada',5,NULL,'Importación masiva','2025-09-22 17:34:44'),
(10,7,16,1,'entrada',2,NULL,'Importación masiva','2025-09-22 17:34:44'),
(13,42,17,1,'entrada',1,NULL,'','2025-09-29 14:12:55'),
(14,45,11,9,'entrada',1,NULL,'','2025-09-29 17:57:12'),
(15,48,11,9,'entrada',1,NULL,'','2025-09-30 01:52:18'),
(25,56,1,1,'entrada',1,NULL,'Importación masiva','2025-10-16 23:27:56'),
(29,58,1,1,'entrada',2,NULL,'Importación masiva','2025-10-16 23:27:56'),
(30,58,2,1,'entrada',1,NULL,'Importación masiva','2025-10-16 23:27:56'),
(33,4,16,1,'reserva',1,132,'Equipo reservado para clase','2025-10-19 08:14:53');
/*!40000 ALTER TABLE `movimientos_equipos` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `movimientos_insumos`
--

LOCK TABLES `movimientos_insumos` WRITE;
/*!40000 ALTER TABLE `movimientos_insumos` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `movimientos_insumos` VALUES
(1,1,1,'entrada','2025-09-16',NULL,'Stock inicial','2025-10-11 17:37:01'),
(2,1,1,'salida','2025-09-16',85,'Consumo por reserva','2025-10-11 17:37:01'),
(3,1,1,'entrada','2025-09-16',NULL,'Carga masiva desde Excel','2025-10-11 17:37:01'),
(4,16,1,'entrada','2025-09-17',NULL,'Stock inicial','2025-10-11 17:37:01'),
(5,16,1,'entrada','2025-09-17',NULL,'Stock inicial','2025-10-11 17:37:01'),
(8,16,1,'entrada','2025-09-17',NULL,'Stock inicial','2025-10-11 17:37:01'),
(11,16,1,'entrada','2025-09-17',NULL,'Stock inicial','2025-10-11 17:37:01'),
(12,16,1,'entrada','2025-09-17',NULL,'Carga masiva desde Excel','2025-10-11 17:37:01'),
(13,16,1,'entrada','2025-09-17',NULL,'Carga masiva desde Excel','2025-10-11 17:37:01'),
(18,16,1,'entrada','2025-09-22',NULL,'Stock inicial','2025-10-11 17:37:01'),
(19,16,1,'entrada','2025-09-22',NULL,'Reabastecimiento','2025-10-11 17:37:01'),
(20,16,1,'entrada','2025-09-22',NULL,'Stock inicial','2025-10-11 17:37:01'),
(21,16,10,'entrada','2025-09-22',NULL,'Reabastecimiento','2025-10-11 17:37:01'),
(22,16,10,'entrada','2025-09-22',NULL,'Reabastecimiento','2025-10-11 17:37:01'),
(23,16,10,'entrada','2025-09-22',NULL,'Stock inicial','2025-10-11 17:37:01'),
(24,1,1,'entrada','2025-09-22',NULL,'Importación masiva','2025-10-11 17:37:01'),
(25,2,1,'entrada','2025-09-22',NULL,'Importación masiva','2025-10-11 17:37:01'),
(26,1,1,'entrada','2025-09-22',NULL,'Importación masiva','2025-10-11 17:37:01'),
(27,2,1,'entrada','2025-09-22',NULL,'Importación masiva','2025-10-11 17:37:01'),
(28,3,1,'entrada','2025-09-22',NULL,'Importación masiva','2025-10-11 17:37:01'),
(29,1,1,'entrada','2025-09-22',NULL,'Importación masiva','2025-10-11 17:37:01'),
(30,2,1,'entrada','2025-09-22',NULL,'Importación masiva','2025-10-11 17:37:01'),
(31,3,1,'entrada','2025-09-22',NULL,'Importación masiva','2025-10-11 17:37:01'),
(32,16,1,'entrada','2025-09-22',NULL,'Importación masiva','2025-10-11 17:37:01'),
(33,16,1,'entrada','2025-09-22',NULL,'Importación masiva','2025-10-11 17:37:01'),
(34,16,1,'entrada','2025-09-22',NULL,'Importación masiva','2025-10-11 17:37:01'),
(35,16,1,'entrada','2025-09-22',NULL,'Importación masiva','2025-10-11 17:37:01'),
(36,16,1,'entrada','2025-09-22',NULL,'Importación masiva','2025-10-11 17:37:01'),
(37,17,1,'entrada','2025-09-22',NULL,'Importación masiva','2025-10-11 17:37:01'),
(38,9,7,'entrada','2025-09-23',NULL,'Reabastecimiento','2025-10-11 17:37:01'),
(41,17,1,'entrada','2025-09-25',NULL,'Stock inicial','2025-10-11 17:37:01'),
(42,16,1,'entrada','2025-09-25',NULL,'Stock inicial','2025-10-11 17:37:01'),
(43,16,1,'entrada','2025-10-11',NULL,NULL,'2025-10-11 14:09:20'),
(44,16,1,'entrada','2025-10-11',NULL,NULL,'2025-10-11 14:11:06'),
(45,16,1,'entrada','2025-10-11',NULL,NULL,'2025-10-11 14:24:55'),
(46,16,1,'entrada','2025-10-11',NULL,NULL,'2025-10-11 15:24:30'),
(47,16,1,'entrada','2025-10-12',NULL,NULL,'2025-10-12 19:43:10'),
(48,17,1,'entrada','2025-10-16',NULL,NULL,'2025-10-16 23:16:58'),
(49,16,1,'entrada','2025-10-19',NULL,NULL,'2025-10-19 01:55:48'),
(50,16,1,'entrada','2025-10-19',NULL,NULL,'2025-10-19 01:57:31'),
(51,16,1,'entrada','2025-10-19',NULL,NULL,'2025-10-19 01:58:58'),
(56,16,1,'entrada','2025-10-19',NULL,NULL,'2025-10-19 09:39:15'),
(57,16,1,'entrada','2025-10-20',NULL,NULL,'2025-10-20 22:56:55'),
(69,16,1,'salida','2025-10-22',NULL,NULL,'2025-10-22 18:32:21'),
(70,16,1,'salida','2025-10-22',NULL,NULL,'2025-10-22 18:32:47'),
(77,16,1,'entrada','2025-10-22',NULL,NULL,'2025-10-22 19:09:49'),
(78,16,1,'entrada','2025-10-22',NULL,'Prueba con Quinteros','2025-10-22 19:17:49'),
(79,16,1,'salida','2025-10-22',NULL,'Prueba con Quinteros - Salida','2025-10-22 19:19:05'),
(80,16,1,'salida','2025-10-22',NULL,NULL,'2025-10-22 19:19:39'),
(81,16,1,'salida','2025-10-22',133,'Consumo por reserva','2025-10-23 04:24:46'),
(82,16,1,'entrada','2025-10-23',NULL,NULL,'2025-10-23 16:26:40'),
(83,16,1,'salida','2025-10-23',NULL,NULL,'2025-10-23 16:27:51'),
(84,16,1,'salida','2025-10-23',133,'Consumo de inventario en horarioId: 133','2025-10-23 20:34:46'),
(85,16,1,'salida','2025-10-24',133,'Consumo de inventario en horarioId: 133','2025-10-24 17:09:54'),
(86,16,1,'salida','2025-10-24',134,'Consumo por reserva','2025-10-24 17:13:12'),
(87,16,1,'salida','2025-10-24',134,'Consumo de inventario en horarioId: 134','2025-10-24 17:14:43'),
(88,16,1,'entrada','2025-10-01',NULL,'PRUEBA','2025-10-24 17:48:07'),
(89,16,1,'entrada','2025-10-24',NULL,NULL,'2025-10-24 17:57:00'),
(90,16,1,'salida','2025-10-24',NULL,NULL,'2025-10-24 17:58:46'),
(91,17,1,'salida','2025-10-26',NULL,NULL,'2025-10-26 14:18:13'),
(92,17,1,'salida','2025-10-26',135,'Consumo por reserva','2025-10-26 14:19:56'),
(93,17,1,'salida','2025-10-26',135,'Consumo de inventario en horarioId: 135','2025-10-26 14:20:47'),
(94,17,1,'entrada','2025-10-26',NULL,NULL,'2025-10-26 14:25:40'),
(95,16,1,'salida','2025-10-27',137,'Consumo por reserva','2025-10-28 01:50:32'),
(96,16,1,'salida','2025-10-27',137,'Consumo de inventario en horarioId: 137','2025-10-28 01:53:04'),
(99,16,1,'entrada','2025-10-28',NULL,'Prueba reabastecimiento','2025-10-28 14:46:32'),
(100,16,1,'entrada','2025-10-28',NULL,NULL,'2025-10-28 22:30:36'),
(101,17,1,'entrada','2025-10-28',NULL,NULL,'2025-10-28 22:42:42'),
(102,17,1,'entrada','2025-10-28',NULL,'','2025-10-28 22:45:07'),
(103,17,1,'entrada','2025-10-28',NULL,NULL,'2025-10-28 22:56:40'),
(104,17,1,'entrada','2025-10-28',NULL,NULL,'2025-10-28 23:01:30'),
(105,17,1,'salida','2025-10-28',NULL,NULL,'2025-10-28 23:06:47'),
(106,17,1,'salida','2025-10-28',NULL,NULL,'2025-10-28 23:08:54'),
(107,17,1,'salida','2025-10-29',NULL,'Prueba Movimientos','2025-10-29 00:12:44'),
(108,17,1,'entrada','2025-10-28',NULL,NULL,'2025-10-29 00:51:00'),
(109,17,1,'entrada','2025-10-29',NULL,NULL,'2025-10-29 00:54:23'),
(110,17,1,'entrada','2025-10-29',NULL,'Prueba Horario','2025-10-29 01:03:58'),
(111,17,1,'entrada','2025-10-29',NULL,'Prueba Fecha2','2025-10-29 02:27:12'),
(112,16,1,'salida','2025-10-27',137,'Consumo de inventario en horarioId: 137','2025-10-29 04:34:50'),
(113,16,1,'entrada','2025-10-28',NULL,'','2025-10-29 04:36:39'),
(114,16,1,'salida','2025-10-27',137,'Consumo de inventario en horarioId: 137','2025-11-03 00:58:01'),
(115,17,1,'entrada','2025-11-03',NULL,NULL,'2025-11-03 00:59:21'),
(116,16,1,'entrada','2025-11-03',NULL,NULL,'2025-11-03 01:00:24'),
(117,16,1,'salida','2025-10-27',137,'Consumo de inventario en horarioId: 137','2025-11-03 01:01:08'),
(118,16,1,'salida','2025-10-27',137,'Consumo de inventario en horarioId: 137','2025-11-03 01:03:34'),
(119,16,1,'entrada','2025-11-03',NULL,NULL,'2025-11-03 01:04:39'),
(120,16,1,'salida','2025-10-27',137,'Consumo de inventario en horarioId: 137','2025-11-03 01:09:01'),
(121,16,1,'salida','2025-10-27',137,'Consumo de inventario en horarioId: 137','2025-11-03 01:09:22'),
(122,16,1,'entrada','2025-11-03',NULL,NULL,'2025-11-03 01:10:23'),
(123,16,1,'salida','2025-10-27',137,'Consumo de inventario en horarioId: 137','2025-11-03 01:12:00'),
(124,16,1,'salida','2025-10-27',137,'Consumo de inventario en horarioId: 137','2025-11-03 01:14:26'),
(125,16,1,'entrada','2025-11-03',NULL,NULL,'2025-11-03 01:15:29'),
(126,16,1,'salida','2025-10-27',137,'Consumo de inventario en horarioId: 137','2025-11-03 01:16:14'),
(127,1,3,'entrada','2025-11-05',NULL,'prueba','2025-11-05 18:50:05'),
(128,16,1,'entrada','2025-11-07',NULL,'jijijiijij','2025-11-07 22:39:55'),
(129,16,1,'entrada','2025-11-10',NULL,'iooooooo','2025-11-10 03:44:36'),
(130,16,1,'entrada','2025-11-10',NULL,'Prueba de movimientoooo','2025-11-10 03:45:59'),
(131,16,1,'salida','2025-11-10',NULL,'yooooo','2025-11-10 03:48:06');
/*!40000 ALTER TABLE `movimientos_insumos` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `permisos`
--

LOCK TABLES `permisos` WRITE;
/*!40000 ALTER TABLE `permisos` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `permisos` VALUES
(1,'Dashboard Principal','admin/dashboard.php'),
(2,'Gestión de Usuarios','admin/usuarios.php'),
(3,'Gestión de Laboratorios','admin/laboratorios.php'),
(4,'Gestión de Equipos','admin/equipos.php'),
(5,'Gestión de Insumos','admin/insumos.php'),
(6,'Gestión de Reservas','admin/reservas.php'),
(7,'Reportes','admin/reportes.php'),
(8,'Configuración','admin/configuracion.php'),
(9,'Gestión de Docentes','admin/docentes.php'),
(10,'Gestión de Talleres','admin/talleres.php'),
(11,'Gestión de Escuelas','admin/escuelas.php'),
(12,'Inventario','admin/inventario.php'),
(13,'Mi Perfil','admin/perfil.php'),
(14,'Mis Reservas','docente/reservas.php'),
(15,'Consultar Disponibilidad','docente/disponibilidad.php');
/*!40000 ALTER TABLE `permisos` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `reservas`
--

LOCK TABLES `reservas` WRITE;
/*!40000 ALTER TABLE `reservas` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `reservas` VALUES
(1,11,3,9,'2025-09-10 14:05:00','2025-09-10 16:50:00',33,'Clase de Estadística e Investigación','#ab47bc',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(2,11,3,7,'2025-09-15 14:05:00','2025-09-15 16:50:00',33,'Clase de Estadística e Investigación II','#ab47bc',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(3,11,3,7,'2025-09-17 14:05:00','2025-09-17 16:50:00',33,'Clases de Estadística e Investigación','#ab47bc',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(4,11,3,7,'2025-09-22 14:05:00','2025-09-22 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#ab47bc',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(5,11,3,7,'2025-09-24 14:05:00','2025-09-24 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#ab47bc',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(6,11,3,7,'2025-09-29 14:05:00','2025-09-29 16:50:00',1,'ESTADISTICA E INVESTIGACION II','#ab47bc',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(7,11,3,7,'2025-10-01 14:05:00','2025-10-01 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#ab47bc',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(8,11,3,7,'2025-10-06 14:05:00','2025-10-06 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#ab47bc',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(9,11,3,7,'2025-10-15 14:05:00','2025-10-15 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#ab47bc',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(10,11,3,7,'2025-10-08 14:05:00','2025-10-08 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#ab47bc',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(11,11,3,7,'2025-10-13 14:05:00','2025-10-13 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#ab47bc',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(12,11,3,7,'2025-10-20 14:05:00','2025-10-20 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#ab47bc',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(13,11,3,7,'2025-10-22 14:05:00','2025-10-22 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#ab47bc',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(14,12,2,7,'2025-09-15 14:05:00','2025-09-15 16:50:00',33,'Estad´sitica e Investigación II','#1b6f29',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(15,12,2,7,'2025-09-17 14:05:00','2025-09-17 16:50:00',33,'Estad´sitica e Investigación II','#1b6f29',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(16,12,2,7,'2025-09-22 14:05:00','2025-09-22 16:50:00',33,'Estad´sitica e Investigación II','#1b6f29',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(17,12,2,7,'2025-09-24 14:05:00','2025-09-24 16:50:00',33,'Estad´sitica e Investigación II','#1b6f29',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(18,12,2,7,'2025-09-29 14:05:00','2025-09-29 16:50:00',33,'Estadística e Investigación II','#4b9e1f',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(19,12,2,7,'2025-10-01 14:05:00','2025-10-01 16:50:00',33,'Estadística e Investigación II','#4b9e1f',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(20,12,2,7,'2025-10-06 14:05:00','2025-10-06 16:50:00',33,'Estadística e Investigación II','#4b9e1f',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(21,12,2,7,'2025-10-08 14:05:00','2025-10-08 16:50:00',33,'Estadística e Investigación II','#4b9e1f',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(22,12,2,7,'2025-10-13 14:05:00','2025-10-13 16:50:00',33,'Estadística e Investigación II','#4b9e1f',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(23,12,2,7,'2025-10-15 14:05:00','2025-10-15 16:50:00',33,'Estadística e Investigación II','#4b9e1f',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(24,12,2,7,'2025-10-20 14:05:00','2025-10-20 16:50:00',33,'Estadística e Investigación II','#4b9e1f',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(25,12,2,7,'2025-10-22 14:05:00','2025-10-22 16:50:00',33,'Estadística e Investigación II','#4b9e1f',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(26,11,3,8,'2025-10-27 14:05:00','2025-10-27 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#e24822',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(27,11,3,8,'2025-10-29 14:05:00','2025-10-29 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#e24822',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(28,11,3,8,'2025-11-03 14:05:00','2025-11-03 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#e24822',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(29,11,3,8,'2025-11-05 14:05:00','2025-11-05 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#e24822',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(30,11,3,8,'2025-11-10 14:05:00','2025-11-10 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#e24822',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(31,11,3,8,'2025-11-12 14:05:00','2025-11-12 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#e24822',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(32,11,3,8,'2025-11-17 14:05:00','2025-11-17 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#e24822',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(33,11,3,8,'2025-11-19 14:05:00','2025-11-19 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#e24822',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(34,11,3,8,'2025-11-24 14:05:00','2025-11-24 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#e24822',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(35,11,3,8,'2025-11-26 14:05:00','2025-11-26 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#e24822',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(36,11,3,8,'2025-12-01 14:05:00','2025-12-01 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#e24822',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(37,11,3,8,'2025-12-03 14:05:00','2025-12-03 16:50:00',33,'ESTADISTICA E INVESTIGACION II','#e24822',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(38,11,4,7,'2025-09-18 14:05:00','2025-09-18 19:35:00',60,'Tecnologia de imagenes','#7d72ca',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(39,11,4,7,'2025-09-25 14:05:00','2025-09-25 19:35:00',60,'Tecnologia de imagenes','#7d72ca',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(40,11,4,7,'2025-10-23 14:05:00','2025-10-23 19:35:00',60,'Tecnologia de imagenes','#7d72ca',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(41,11,4,7,'2025-10-30 14:05:00','2025-10-30 19:35:00',60,'Tecnologia de imagenes','#7d72ca',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(42,12,2,8,'2025-10-27 14:05:00','2025-10-27 16:50:00',40,'ESTADISTICA E INVESTIGACION II','#95a5a6',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(43,12,2,8,'2025-10-29 14:05:00','2025-10-29 16:50:00',40,'ESTADISTICA E INVESTIGACION II','#95a5a6',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(44,12,2,8,'2025-11-03 14:05:00','2025-11-03 16:50:00',40,'ESTADISTICA E INVESTIGACION II','#95a5a6',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(45,12,2,8,'2025-11-05 14:05:00','2025-11-05 16:50:00',40,'ESTADISTICA E INVESTIGACION II','#95a5a6',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(46,12,2,8,'2025-11-10 14:05:00','2025-11-10 16:50:00',40,'ESTADISTICA E INVESTIGACION II','#95a5a6',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(47,12,2,8,'2025-11-12 14:05:00','2025-11-12 16:50:00',40,'ESTADISTICA E INVESTIGACION II','#95a5a6',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(48,12,2,8,'2025-11-17 14:05:00','2025-11-17 16:50:00',40,'ESTADISTICA E INVESTIGACION II','#95a5a6',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(49,12,2,8,'2025-11-19 14:05:00','2025-11-19 16:50:00',40,'ESTADISTICA E INVESTIGACION II','#95a5a6',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(50,12,2,8,'2025-11-24 14:05:00','2025-11-24 16:50:00',40,'ESTADISTICA E INVESTIGACION II','#95a5a6',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(51,12,2,8,'2025-11-26 14:05:00','2025-11-26 16:50:00',40,'ESTADISTICA E INVESTIGACION II','#95a5a6',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(52,12,2,8,'2025-12-01 14:05:00','2025-12-01 16:50:00',40,'ESTADISTICA E INVESTIGACION II','#95a5a6',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(53,12,2,8,'2025-12-03 14:05:00','2025-12-03 16:50:00',40,'ESTADISTICA E INVESTIGACION II','#95a5a6',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(54,11,5,8,'2025-09-16 14:05:00','2025-09-16 17:45:00',30,'Señalización celular','#66bb6a',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(55,11,5,8,'2025-10-07 14:05:00','2025-10-07 17:45:00',30,'Señalización Celular','#66bb6a',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(56,11,5,9,'2025-10-28 14:05:00','2025-10-28 17:45:00',33,'Señalización Celular','#66bb6a',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(57,11,5,9,'2025-11-18 14:05:00','2025-11-18 17:45:00',30,'Señalización Celular','#66bb6a',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(58,11,6,7,'2025-09-17 09:20:00','2025-09-17 13:00:00',30,'Morfofisiología del Sistema Reproductor, Desarrollo Embrionario y Fetal','#473678',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(59,11,6,7,'2025-09-24 09:20:00','2025-09-24 13:00:00',30,'Morfofisiología del Sistema Reproductor, Desarrollo Embrionario y Fetal','#473678',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(60,11,6,7,'2025-10-02 09:20:00','2025-10-02 13:00:00',30,'Morfofisiología del Sistema Reproductor, Desarrollo Embrionario y Fetal','#473678',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(61,11,6,7,'2025-10-13 09:20:00','2025-10-13 13:00:00',30,'Morfofisiología del Sistema Reproductor, Desarrollo Embrionario y Fetal','#473678',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(62,11,6,8,'2025-10-29 09:20:00','2025-10-29 13:00:00',33,'Morfofisiología del Sistema Reproductor, Desarrollo Embrionario y Fetal','#573579',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(63,11,6,8,'2025-11-05 09:20:00','2025-11-05 13:00:00',33,'Morfofisiología del Sistema Reproductor, Desarrollo Embrionario y Fetal','#573579',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(64,11,6,8,'2025-11-13 09:20:00','2025-11-13 13:00:00',33,'Morfofisiología del Sistema Reproductor, Desarrollo Embrionario y Fetal','#573579',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(65,11,6,8,'2025-11-20 09:20:00','2025-11-20 13:00:00',33,'Morfofisiología del Sistema Reproductor, Desarrollo Embrionario y Fetal','#573579',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(66,12,7,9,'2025-09-25 09:20:00','2025-09-25 13:00:00',30,'Morfofisiología del Sistema Digestivo','#7f4855',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(67,12,7,9,'2025-10-02 09:20:00','2025-10-02 13:00:00',30,'Morfofisiología del Sistema Digestivo','#7f4855',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(68,12,7,9,'2025-10-06 09:20:00','2025-10-06 13:00:00',30,'Morfofisiología del Sistema Digestivo','#7f4855',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(69,12,7,9,'2025-10-09 09:20:00','2025-10-09 13:00:00',30,'Morfofisiología del Sistema Digestivo','#7f4855',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(71,11,8,7,'2025-09-16 07:30:00','2025-09-16 13:00:00',30,'FARMACOLOGÍA 1','#ef5350',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(72,12,9,7,'2025-09-16 07:30:00','2025-09-16 13:00:00',33,'FARMACOLOGIA 1','#ef5350',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(73,12,9,7,'2025-11-18 07:30:00','2025-11-18 13:00:00',33,'FARMACOLOGIA 1','#901414',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(74,12,9,7,'2025-11-25 07:30:00','2025-11-25 13:00:00',33,'FARMACOLOGIA 1','#901414',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(75,11,8,7,'2025-11-18 07:30:00','2025-11-18 13:00:00',33,'FARMACOLOGIA 1','#ca4949',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(76,11,8,7,'2025-11-25 07:30:00','2025-11-25 13:00:00',33,'FARMACOLOGIA 1','#ca4949',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(77,11,10,20,'2025-09-26 07:30:00','2025-09-26 11:10:00',33,'Morfofisiología del Embarazo, Parto y Puerperio','#42a5f5',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(78,11,10,21,'2025-11-07 07:30:00','2025-11-07 11:10:00',1,'Morfofisiología del Embarazo, Parto y Puerperio','#ab47bc',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(79,12,11,21,'2025-10-07 14:05:00','2025-10-07 17:45:00',33,'Morfofisiología del Sistema Hematoinmune','#26a69a',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(80,12,11,19,'2025-11-18 14:05:00','2025-11-18 17:45:00',33,'Morfofisiología del Sistema Hematoinmune','#42a5f5',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(82,11,12,20,'2025-09-30 14:05:00','2025-09-30 17:45:00',33,'Morfofisiología del Sistema Endocrino','#ffa726',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(83,12,12,20,'2025-10-13 08:25:00','2025-10-13 10:10:00',30,'Morfofisiología del Sistema Endocrino','#4ecdc4',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(84,12,13,19,'2025-09-16 14:05:00','2025-09-16 17:45:00',36,'PRÁCTICA 2:  PhysioEx: Potencial de membrana y potencial receptor','#ab47bc',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(85,1,9,8,'2025-09-17 07:30:00','2025-09-17 11:10:00',10,'Práctica 1','#ff6b6b',NULL,'2025-09-18 16:43:17',NULL,'2025-09-18 16:43:17','P'),
(100,9,9,8,'2025-09-29 08:25:00','2025-09-29 12:05:00',17,'Practica 4 de quimica','#258e4d',NULL,'2025-09-18 17:03:25',NULL,'2025-09-18 17:03:25','P'),
(101,9,9,8,'2025-10-06 08:25:00','2025-10-06 12:05:00',17,'Practica 4 de quimica','#258e4d',NULL,'2025-09-18 17:03:25',NULL,'2025-09-18 17:03:25','P'),
(108,11,16,2,'2025-12-17 07:30:00','2025-12-17 11:10:00',14,'prueba','#66bb6a',NULL,'2025-09-23 18:06:27',NULL,'2025-09-26 03:02:33','P'),
(109,16,16,8,'2025-09-29 08:25:00','2025-09-29 11:10:00',10,'PRUEBA','#2c726d',NULL,'2025-09-23 18:24:13',NULL,'2025-09-23 18:24:13','P'),
(110,16,16,8,'2025-10-06 08:25:00','2025-10-06 11:10:00',10,'PRUEBA','#2c726d',NULL,'2025-09-23 18:24:14',NULL,'2025-09-23 18:24:14','P'),
(111,16,16,8,'2025-10-13 08:25:00','2025-10-13 11:10:00',10,'PRUEBA','#2c726d',NULL,'2025-09-23 18:24:14',NULL,'2025-09-23 18:24:14','P'),
(112,16,16,8,'2025-10-20 08:25:00','2025-10-20 11:10:00',10,'PRUEBA','#2c726d',NULL,'2025-09-23 18:24:14',NULL,'2025-09-23 18:24:14','P'),
(113,11,16,8,'2025-09-27 08:25:00','2025-09-27 10:10:00',1,'okokoko','#ab47bc',NULL,'2025-09-25 17:25:08',NULL,'2025-09-25 17:25:08','P'),
(114,28,16,1,'2025-09-25 11:15:00','2025-09-25 12:05:00',1,'A','#4ecdc4',NULL,'2025-09-26 02:57:55',NULL,'2025-09-26 02:57:55','P'),
(116,28,16,7,'2025-10-06 11:15:00','2025-10-06 11:10:00',1,'Prueba X2','#4ecdc4',NULL,'2025-09-26 03:13:02',NULL,'2025-09-26 03:13:02','P'),
(118,16,14,1,'2025-09-30 07:30:00','2025-09-30 09:15:00',6,'Prueba edición','#26a69a',NULL,'2025-09-29 15:27:43',NULL,'2025-09-29 15:27:43','P'),
(121,11,6,21,'2025-10-01 16:55:00','2025-10-01 19:35:00',30,'Práctica 9: Anatomía e Histología de los Órganos Linfoides','#26a69a',NULL,'2025-09-30 22:39:12',NULL,'2025-09-30 22:39:12','P'),
(122,12,7,20,'2025-10-14 16:00:00','2025-10-14 19:35:00',1,'Práctica 13: PhysioEx: Terapia de sustitución hormonal','#42a5f5',NULL,'2025-09-30 23:05:37',NULL,'2025-09-30 23:05:37','P'),
(123,11,6,20,'2025-10-14 11:15:00','2025-10-14 13:00:00',30,'Práctica de Morfo Reproductor','#26a69a',NULL,'2025-10-02 22:42:51',NULL,'2025-10-02 22:42:51','P'),
(124,11,20,7,'2025-10-13 16:55:00','2025-10-13 18:40:00',40,'Prácticas Endocrino','#66bb6a',NULL,'2025-10-13 16:35:19',NULL,'2025-10-13 16:35:19','P'),
(125,12,7,7,'2025-10-13 16:55:00','2025-10-13 17:45:00',30,'Prácticas Endocrino','#ab47bc',NULL,'2025-10-13 16:36:47',NULL,'2025-10-13 16:36:47','P'),
(132,16,16,1,'2025-10-21 11:15:00','2025-10-21 15:50:00',10,'kokoo','#ab47bc',NULL,'2025-10-19 08:14:51',NULL,'2025-10-19 08:14:51','P'),
(133,16,16,1,'2025-10-22 10:20:00','2025-10-22 11:10:00',1,'Prueba','#4ecdc4',NULL,'2025-10-23 04:24:45',NULL,'2025-10-23 04:24:45','P'),
(134,16,16,2,'2025-10-24 13:10:00','2025-10-24 14:00:00',1,'Prueba x','#4ecdc4',NULL,'2025-10-24 17:13:12',NULL,'2025-10-24 17:13:12','P'),
(135,17,16,1,'2025-10-26 10:20:00','2025-10-26 11:10:00',1,'Prueba con Quinteros','#4ecdc4',NULL,'2025-10-26 14:19:55',NULL,'2025-10-26 14:19:55','P'),
(136,11,20,21,'2025-11-11 14:05:00','2025-11-11 17:45:00',30,'ENDOCRINO','#42a5f5',NULL,'2025-10-27 15:14:50',NULL,'2025-10-27 15:14:50','P'),
(137,16,16,1,'2025-10-27 17:50:00','2025-10-27 18:40:00',1,'Prueba noche','#4ecdc4',NULL,'2025-10-28 01:50:32',NULL,'2025-11-03 01:09:00','C'),
(144,11,7,1,'2025-11-25 14:05:00','2025-11-25 17:45:00',1,'PRÁCTICA 14: Estudio por imágenes del sistema nervioso central','#ab47bc',NULL,'2025-11-05 20:15:44',NULL,'2025-11-05 20:15:44','P'),
(154,11,3,6,'2025-12-31 09:20:00','2025-12-31 16:50:00',11,'Pruebita nueva','#95a5a6',NULL,'2025-11-07 15:22:19',NULL,'2025-11-07 15:22:19','P'),
(155,11,10,1,'2025-12-01 07:30:00','2025-12-01 13:00:00',12,'Pruebita refactor','#6e7c7b',NULL,'2025-11-07 15:24:54',NULL,'2025-11-07 15:24:54','P'),
(156,11,10,1,'2025-12-03 07:30:00','2025-12-03 13:00:00',12,'Pruebita refactor','#6e7c7b',NULL,'2025-11-07 15:24:55',NULL,'2025-11-07 15:24:55','P'),
(157,11,10,1,'2025-12-09 07:30:00','2025-12-09 13:00:00',12,'Pruebita refactor','#6e7c7b',NULL,'2025-11-07 15:24:56',NULL,'2025-11-07 15:24:56','P'),
(158,11,10,1,'2026-01-04 07:30:00','2026-01-04 13:00:00',12,'Pruebita refactor','#6e7c7b',NULL,'2025-11-07 15:24:57',NULL,'2025-11-07 15:24:57','P'),
(159,11,10,1,'2026-01-05 07:30:00','2026-01-05 13:00:00',12,'Pruebita refactor','#6e7c7b',NULL,'2025-11-07 15:24:59',NULL,'2025-11-07 15:24:59','P'),
(160,11,10,1,'2026-01-08 07:30:00','2026-01-08 13:00:00',12,'Pruebita refactor','#6e7c7b',NULL,'2025-11-07 15:25:00',NULL,'2025-11-07 15:25:00','P'),
(161,11,10,1,'2026-02-02 07:30:00','2026-02-02 13:00:00',12,'Pruebita refactor','#6e7c7b',NULL,'2025-11-07 15:25:01',NULL,'2025-11-07 15:25:01','P'),
(162,11,7,1,'2025-11-08 07:30:00','2025-11-08 09:15:00',16,'Non ref','#4ecdc4',NULL,'2025-11-07 15:28:11',NULL,'2025-11-07 15:31:41','P');
/*!40000 ALTER TABLE `reservas` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `rol_permiso`
--

LOCK TABLES `rol_permiso` WRITE;
/*!40000 ALTER TABLE `rol_permiso` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `rol_permiso` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `roles` VALUES
(1,'Administrador'),
(4,'Asistente'),
(3,'Docente'),
(2,'Jefe de Laboratorio');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `tipos_equipo`
--

LOCK TABLES `tipos_equipo` WRITE;
/*!40000 ALTER TABLE `tipos_equipo` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `tipos_equipo` VALUES
(1,'Monitor','Monitor de signos vitales','2025-10-13 21:36:49'),
(2,'Bomba de Infusión','Bombas volumétricas o jeringa','2025-10-13 21:36:49'),
(3,'Desfibrilador','Equipo de desfibrilación','2025-10-13 21:36:49'),
(4,'Microscopio','Microscopios ópticos y variantes','2025-10-13 21:36:49'),
(5,'Centrífuga','Centrífugas de laboratorio','2025-10-13 21:36:49'),
(6,'Incubadora','Incubadoras','2025-10-13 21:36:49'),
(8,'Balanza','Balanza analítica / precisión','2025-10-13 21:36:49'),
(9,'Autoclave','Autoclave','2025-10-17 02:32:53'),
(16,'CPU U','CPU de oficina','2025-11-07 20:30:15');
/*!40000 ALTER TABLE `tipos_equipo` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `usuarios` VALUES
(1,'admin','admin','123',1,'[]','A','2025-11-05 21:24:59','2025-11-05 21:24:59'),
(2,'Jefe de Laboratorio de Química','jefelabquimica','quimica123',2,'[7, 8]','A','2025-11-05 21:24:59','2025-11-05 21:24:59'),
(3,'Jefe de Laboratorio de Microbiología y Parasitología','jefemicro','micro2025',2,'[1]','A','2025-11-05 21:24:59','2025-11-05 21:24:59'),
(4,'Jefe de Laboratorio de Morfología Microscópica','jefemorfo','morfo2025',2,'[9, 2]','A','2025-11-05 21:24:59','2025-11-05 21:24:59'),
(5,'Jefe de Laboratorio de Rebeca','jefelab','lab2025',2,'[13, 14, 15]','A','2025-11-05 21:24:59','2025-11-05 21:24:59'),
(6,'Jefe de Laboratorio Multifuncional','jefemulti','multi2025',2,'[4, 5, 6]','A','2025-11-05 21:24:59','2025-11-05 21:24:59'),
(7,'Jefe de Laboratorio de Morfología Macroscópica','jefemacro','macro2025',2,'[9]','A','2025-11-05 21:24:59','2025-11-05 21:24:59'),
(8,'Jefe de Laboratorio de Biología Molecular','jefebio','bio2025',2,'[10]','A','2025-11-05 21:24:59','2025-11-05 21:24:59'),
(9,'Jefe de Laboratorio de Cómputo 1','jefecompu','computo2025',2,'[11, 12]','A','2025-11-05 21:24:59','2025-11-05 21:24:59'),
(10,'Jefe de Simulación','jefesimulacion','simulacion2025',2,'[16, 17, 18, 19, 20, 21, 22, 23, 24, 25]','A','2025-11-05 21:24:59','2025-11-05 21:24:59');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
commit;

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

-- Dump completed on 2025-11-10 12:42:38
