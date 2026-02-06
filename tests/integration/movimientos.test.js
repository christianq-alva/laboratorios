import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { app } from '../../server/app.js'
import { loginAsAdmin, crearInsumo, crearEntrada, obtenerSaldo } from '../helpers.js'
import { pool } from '../../server/config/database.js'

describe('Movimientos de Insumos', () => {
  describe('POST /api/inventario/movimiento-manual (salida)', () => {
    it('rechaza salida cuando cantidad > saldo del lote', async () => {
      const token = await loginAsAdmin()

      const insumo = await crearInsumo()

      await pool.query(`
        INSERT INTO inventario_insumos (insumo_id, laboratorio_id)
        VALUES (?, 1)
      `, [insumo.id])

      const entrada = await crearEntrada({
        laboratorio_id: 1,
        detalles: [{
          insumo_id: insumo.id,
          cantidad: 10,
          lote: 'LOTE-001'
        }]
      })

      const res = await request(app)
        .post('/api/inventario/movimiento-manual')
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 1,
          tipo_movimiento: 'salida',
          fecha_movimiento: '2025-06-02',
          observaciones: 'Prueba',
          reserva_id: null,
          detalles: [{
            insumo_id: insumo.id,
            entrada_detalle_id: entrada.movimiento_detalle_id,
            cantidad: 15
          }]
        })

      expect(res.status).toBe(400)
      expect(res.body.message).toContain('Saldo insuficiente')
    })

    it('permite salida cuando hay saldo suficiente', async () => {
      const token = await loginAsAdmin()

      const insumo = await crearInsumo()

      await pool.query(`
        INSERT INTO inventario_insumos (insumo_id, laboratorio_id)
        VALUES (?, 1)
      `, [insumo.id])

      const entrada = await crearEntrada({
        laboratorio_id: 1,
        detalles: [{
          insumo_id: insumo.id,
          cantidad: 10,
          lote: 'LOTE-001'
        }]
      })

      const res = await request(app)
        .post('/api/inventario/movimiento-manual')
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 1,
          tipo_movimiento: 'salida',
          fecha_movimiento: '2025-06-02',
          observaciones: 'Prueba',
          reserva_id: null,
          detalles: [{
            insumo_id: insumo.id,
            entrada_detalle_id: entrada.movimiento_detalle_id,
            cantidad: 5
          }]
        })

      expect(res.status).toBe(200)
      expect(res.body.movimiento_id).toBeDefined()
    })

    it('actualiza correctamente el saldo después de salida', async () => {
      const token = await loginAsAdmin()

      const insumo = await crearInsumo()

      await pool.query(`
        INSERT INTO inventario_insumos (insumo_id, laboratorio_id)
        VALUES (?, 1)
      `, [insumo.id])

      const entrada = await crearEntrada({
        laboratorio_id: 1,
        detalles: [{
          insumo_id: insumo.id,
          cantidad: 10,
          lote: 'LOTE-001'
        }]
      })

      let saldo = await obtenerSaldo(entrada.movimiento_detalle_id)
      expect(Number(saldo)).toBe(10)

      await request(app)
        .post('/api/inventario/movimiento-manual')
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 1,
          tipo_movimiento: 'salida',
          fecha_movimiento: '2025-06-02',
          observaciones: 'Prueba',
          reserva_id: null,
          detalles: [{
            insumo_id: insumo.id,
            entrada_detalle_id: entrada.movimiento_detalle_id,
            cantidad: 3
          }]
        })

      saldo = await obtenerSaldo(entrada.movimiento_detalle_id)
      expect(Number(saldo)).toBe(7)
    })

    it('requiere entrada_detalle_id en cada detalle de salida', async () => {
      const token = await loginAsAdmin()

      const insumo = await crearInsumo()

      await pool.query(`
        INSERT INTO inventario_insumos (insumo_id, laboratorio_id)
        VALUES (?, 1)
      `, [insumo.id])

      const res = await request(app)
        .post('/api/inventario/movimiento-manual')
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 1,
          tipo_movimiento: 'salida',
          fecha_movimiento: '2025-06-02',
          observaciones: 'Prueba',
          detalles: [{
            insumo_id: insumo.id,
            cantidad: 5
          }]
        })

      expect(res.status).toBe(400)
      expect(
        res.body.errors.some(e => e.field === 'body.detalles')
      ).toBe(true)
    })
  })

  describe('DELETE /api/inventario/movimiento-manual/eliminar/:movimiento_id - Eliminación', () => {
    it('al eliminar salida, revierte el saldo al lote original', async () => {
      const token = await loginAsAdmin()

      const insumo = await crearInsumo()

      await pool.query(`
        INSERT INTO inventario_insumos (insumo_id, laboratorio_id)
        VALUES (?, 1)
      `, [insumo.id])

      const entrada = await crearEntrada({
        laboratorio_id: 1,
        detalles: [{
          insumo_id: insumo.id,
          cantidad: 10,
          lote: 'LOTE-001'
        }]
      })

      const resSalida = await request(app)
        .post('/api/inventario/movimiento-manual')
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 1,
          tipo_movimiento: 'salida',
          fecha_movimiento: '2025-06-02',
          observaciones: 'Prueba',
          reserva_id: null,
          detalles: [{
            insumo_id: insumo.id,
            entrada_detalle_id: entrada.movimiento_detalle_id,
            cantidad: 3
          }]
        })

      const movimiento_id = resSalida.body.movimiento_id

      let saldo = await obtenerSaldo(entrada.movimiento_detalle_id)
      expect(Number(saldo)).toBe(7)

      const res = await request(app)
        .delete(`/api/inventario/movimiento-manual/eliminar/${movimiento_id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      saldo = await obtenerSaldo(entrada.movimiento_detalle_id)
      expect(Number(saldo)).toBe(10)
    })

    it('permite eliminar movimiento de entrada que no tiene salidas asociadas', async () => {
      const token = await loginAsAdmin()

      const insumo = await crearInsumo()

      await pool.query(`
        INSERT INTO inventario_insumos (insumo_id, laboratorio_id)
        VALUES (?, 1)
      `, [insumo.id])

      const entrada = await crearEntrada({
        laboratorio_id: 1,
        detalles: [{
          insumo_id: insumo.id,
          cantidad: 10,
          lote: 'LOTE-001'

        }]
      })

      const res = await request(app)
        .delete(`/api/inventario/movimiento-manual/eliminar/${entrada.id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })
})
