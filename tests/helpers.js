import request from 'supertest'
import { app } from '../server/app.js'
import { pool } from '../server/config/database.js'
import bcrypt from 'bcryptjs'

export async function loginAsAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await pool.query(`
    INSERT INTO usuarios (nombre_completo, usuario, contrasena, rol_id, laboratorio_ids, estado)
    VALUES ('Admin User', 'admin', ?, 1, '[]', 'A')
  `, [hashedPassword])

  const res = await request(app)
    .post('/api/auth/login')
    .send({ usuario: 'admin', contrasena: 'admin123' })

  return res.body.token
}

export async function loginAsJefe(laboratorio_ids = [1]) {
  const hashedPassword = await bcrypt.hash('jefe123', 10)
  const laboratorioIdsJson = JSON.stringify(laboratorio_ids)
  await pool.query(`
    INSERT INTO usuarios (nombre_completo, usuario, contrasena, rol_id, laboratorio_ids, estado)
    VALUES ('Jefe User', 'jefe', ?, 2, ?, 'A')
  `, [hashedPassword, laboratorioIdsJson])

  const res = await request(app)
    .post('/api/auth/login')
    .send({ usuario: 'jefe', contrasena: 'jefe123' })

  return res.body.token
}

export async function crearHorario(data = {}) {
  const defaults = {
    laboratorio_id: data.laboratorio_id || 1,
    docente_id: 1,
    escuela_id: 1,
    ciclo_id: 1,
    fecha_inicio: '2026-03-01 08:00:00',
    fecha_fin: '2026-03-01 10:00:00',
    cantidad_alumnos: 20,
    descripcion: 'Test',
    color: '#FF0000',
    estado: 'P'
  }

  const horario = { ...defaults, ...data }

  const [result] = await pool.query(`
    INSERT INTO reservas (laboratorio_id, docente_id, escuela_id, ciclo_id, fecha_inicio, fecha_fin, cantidad_alumnos, descripcion, color, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [horario.laboratorio_id, horario.docente_id, horario.escuela_id, horario.ciclo_id, horario.fecha_inicio, horario.fecha_fin, horario.cantidad_alumnos, horario.descripcion, horario.color, horario.estado])

  return { id: result.insertId, ...horario }
}

export async function crearInsumo(data = {}) {
  const defaults = {
    nombre: 'Insumo Test',
    codigo: `INS-${Date.now()}`,
    categoria: 'Materiales',
    unidad_id: 1
  }

  const insumo = { ...defaults, ...data }

  const [result] = await pool.query(`
    INSERT INTO insumos (nombre, codigo, categoria, unidad_id) VALUES (?, ?, ?, ?)
  `, [insumo.nombre, insumo.codigo, insumo.categoria, insumo.unidad_id])

  return { id: result.insertId, ...insumo }
}

export async function crearEquipo(data = {}) {
  const defaults = {
    nombre: 'Equipo Test',
    codigo: `EQP-${Date.now()}`,
    tipo_equipo_id: 1,
    laboratorio_id: 1,
    estado: 'Operativo',
    condicion: 'Bueno',
    descripcion: 'Equipo Test',
    marca: 'Marca Test',
    modelo: 'Modelo Test',
    numero_serie: '1234567890',
    fecha_adquisicion: '2025-01-01',
    fecha_ultimo_mantenimiento: '2025-01-01',
    fecha_proximo_mantenimiento: '2025-01-01',
    comentarios: 'Comentarios Test'
  }

  const equipo = { ...defaults, ...data }

  const [result] = await pool.query(`
    INSERT INTO equipos (nombre, codigo, tipo_equipo_id, laboratorio_id, estado, condicion) VALUES (?, ?, ?, ?, ?, ?)
  `, [equipo.nombre, equipo.codigo, equipo.tipo_equipo_id, equipo.laboratorio_id, equipo.estado, equipo.condicion])

  return { id: result.insertId, ...equipo }
}

export async function crearEntrada(data = {}) {
  const defaults = {
    laboratorio_id: 1,
    usuario_id: 1,
    fecha_movimiento: '2025-06-01',
    observaciones: 'Entrada test'
  }

  const movimiento = { ...defaults, ...data }

  const [result] = await pool.query(`
    INSERT INTO movimientos_insumos (laboratorio_id, usuario_id, tipo_movimiento, fecha_movimiento, observaciones)
    VALUES (?, ?, 'entrada', ?, ?)
  `, [movimiento.laboratorio_id, movimiento.usuario_id, movimiento.fecha_movimiento, movimiento.observaciones])

  const movimiento_id = result.insertId
  let movimiento_detalle_id = null

  if (data.detalles && data.detalles.length) {
    for (const detalle of data.detalles) {
      const [detalleResult] = await pool.query(`
        INSERT INTO movimiento_insumo_detalle (movimiento_id, insumo_id, cantidad, lote, fecha_vencimiento, saldo)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        movimiento_id,
        detalle.insumo_id,
        detalle.cantidad,
        detalle.lote || 'LOTE-001',
        detalle.fecha_vencimiento || null,
        detalle.cantidad,
        detalle.entrada_detalle_id || null
      ])
      movimiento_detalle_id = detalleResult.insertId
    }
  }

  return { id: movimiento_id, movimiento_detalle_id }
}

export async function obtenerSaldo(movimiento_detalle_id) {
  const [rows] = await pool.query(`
    SELECT saldo FROM movimiento_insumo_detalle WHERE id = ?
  `, [movimiento_detalle_id])
  return rows[0]?.saldo ?? 0
}
