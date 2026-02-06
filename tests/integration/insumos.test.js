import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { app } from '../../server/app.js'
import { loginAsAdmin, crearInsumo, crearEntrada } from '../helpers.js'
import { pool } from '../../server/config/database.js'

describe('Insumos', () => {
  describe('DELETE /api/insumos/:id', () => {
    it('rechaza eliminar insumo si tiene movimientos registrados', async () => {
      const token = await loginAsAdmin()

      const insumo = await crearInsumo()

      await pool.query(`
        INSERT INTO inventario_insumos (insumo_id, laboratorio_id)
        VALUES (?, 1)
      `, [insumo.id])

      await crearEntrada({
        laboratorio_id: 1,
        detalles: [{
          insumo_id: insumo.id,
          cantidad: 10
        }]
      })

      const res = await request(app)
        .delete(`/api/insumos/${insumo.id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(409)
      expect(res.body.message).toContain(insumo.nombre)
      expect(res.body.message).toContain('No se puede eliminar')
    })

    it('permite eliminar insumo sin relaciones', async () => {
      const token = await loginAsAdmin()

      const insumo = await crearInsumo()

      const res = await request(app)
        .delete(`/api/insumos/${insumo.id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })
})
