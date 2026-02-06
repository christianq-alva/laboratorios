import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { app } from '../../server/app.js'
import { loginAsAdmin, loginAsJefe, crearHorario } from '../helpers.js'

describe('Permisos por rol', () => {
  describe('GET /api/horarios - Filtrado por laboratorio', () => {
    it('Administrador puede ver horarios de cualquier laboratorio', async () => {
      const token = await loginAsAdmin()

      await crearHorario({ laboratorio_id: 1 })
      await crearHorario({ laboratorio_id: 2 })

      const res = await request(app)
        .get('/api/horarios')
        .set('Authorization', `Bearer ${token}`)
        .query({
          fecha_inicio: '2026-03-01',
          fecha_fin: '2026-03-31'
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toBeDefined()
      expect(res.body.data.length).toBe(2)
    })

    it('Jefe solo puede ver horarios de sus laboratorios asignados', async () => {
      const token = await loginAsJefe([1])

      await crearHorario({ laboratorio_id: 1 })
      await crearHorario({ laboratorio_id: 2 })

      const res = await request(app)
        .get('/api/horarios')
        .set('Authorization', `Bearer ${token}`)
        .query({
          fecha_inicio: '2026-03-01',
          fecha_fin: '2026-03-31'
        })

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBe(1)
      expect(res.body.data[0].laboratorio_id).toBe(1)
    })

    it('Jefe no puede crear incidencia para reserva de otro laboratorio', async () => {
      const token = await loginAsJefe([1])

      const horario = await crearHorario({ laboratorio_id: 2 })

      const res = await request(app)
        .post('/api/incidencias')
        .set('Authorization', `Bearer ${token}`)
        .send({
          reserva_id: horario.id,
          titulo: 'Problema',
          descripcion: 'Detalle del problema'
        })

      expect(res.status).toBe(403)
      expect(res.body.message).toContain('No puedes')
    })

    it('Jefe sin laboratorios asignados no ve ningún horario', async () => {
      const token = await loginAsJefe([])

      await crearHorario({ laboratorio_id: 1 })
      await crearHorario({ laboratorio_id: 2 })

      const res = await request(app)
        .get('/api/horarios')
        .set('Authorization', `Bearer ${token}`)
        .query({
          fecha_inicio: '2026-03-01',
          fecha_fin: '2026-03-31'
        })

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBe(0)
    })
  })
})
