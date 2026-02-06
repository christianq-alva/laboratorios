import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { app } from '../../server/app.js'
import { loginAsAdmin, loginAsJefe, crearHorario } from '../helpers.js'
import { pool } from '../../server/config/database.js'

describe('Incidencias', () => {
  describe('GET /api/incidencias - Listado', () => {
    it('Jefe solo ve incidencias de reservas de sus laboratorios', async () => {
      const token = await loginAsJefe([1])

      const horario1 = await crearHorario({ laboratorio_id: 1 })
      const horario2 = await crearHorario({ laboratorio_id: 2 })

      const [rows] = await pool.query('SELECT id FROM usuarios WHERE usuario = ?', ['jefe'])
      const userId = rows[0].id

      await pool.query(`
        INSERT INTO incidencias (reserva_id, titulo, descripcion, reportado_por)
        VALUES (?, 'Problema 1', 'Detalle 1', ?)
      `, [horario1.id, userId])

      await pool.query(`
        INSERT INTO incidencias (reserva_id, titulo, descripcion, reportado_por)
        VALUES (?, 'Problema 2', 'Detalle 2', ?)
      `, [horario2.id, userId])

      const res = await request(app)
        .get('/api/incidencias')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toBeDefined()
      expect(res.body.data.length).toBe(1)
    })
  })

  describe('POST /api/incidencias - Crear', () => {
    it('Jefe no puede crear incidencia para reserva de otro laboratorio', async () => {
      const token = await loginAsJefe([1])

      const horario = await crearHorario({ laboratorio_id: 2 })

      const res = await request(app)
        .post('/api/incidencias')
        .set('Authorization', `Bearer ${token}`)
        .send({
          reserva_id: horario.id,
          titulo: 'Problema',
          descripcion: 'Detalle'
        })

      expect(res.status).toBe(403)
    })
  })
})
