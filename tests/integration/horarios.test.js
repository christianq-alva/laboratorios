import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { app } from '../../server/app.js'
import { loginAsAdmin, crearHorario } from '../helpers.js'

describe('Horarios - Solapamiento', () => {
  describe('POST /api/horarios - Crear reserva', () => {
    it('rechaza creación cuando hay solapamiento en mismo laboratorio', async () => {
      const token = await loginAsAdmin()

      await crearHorario({
        laboratorio_id: 1,
        fecha_inicio: '2024-06-01 08:00:00',
        fecha_fin: '2024-06-01 10:00:00'
      })

      const res = await request(app)
        .post('/api/horarios')
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 1,
          docente_id: 1,
          escuela_id: 1,
          ciclo_id: 1,
          fecha_inicio: '2024-06-01 09:00:00',
          fecha_fin: '2024-06-01 11:00:00',
          cantidad_alumnos: 20,
          descripcion: 'Test',
          color: '#FF0000'
        })

      expect(res.status).toBe(409)
      expect(res.body.message).toContain('Conflicto')
      expect(res.body.message).toContain('laboratorio')
    })

    it('permite crear horarios contiguos sin solapamiento', async () => {
      const token = await loginAsAdmin()

      await crearHorario({
        laboratorio_id: 1,
        fecha_inicio: '2024-06-01 08:00:00',
        fecha_fin: '2024-06-01 10:00:00'
      })

      const res = await request(app)
        .post('/api/horarios')
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 1,
          docente_id: 1,
          escuela_id: 1,
          ciclo_id: 1,
          fecha_inicio: '2024-06-01 10:00:00',
          fecha_fin: '2024-06-01 12:00:00',
          cantidad_alumnos: 20,
          descripcion: 'Test',
          color: '#FF0000'
        })

      expect(res.status).toBe(201)
      expect(res.body.data).toBeDefined()
      expect(res.body.data.reserva_id).toBeDefined()
    })

    it('permite editar horario sin detectar conflicto consigo mismo', async () => {
      const token = await loginAsAdmin()

      const horario = await crearHorario({
        laboratorio_id: 1,
        fecha_inicio: '2024-06-01 08:00:00',
        fecha_fin: '2024-06-01 10:00:00'
      })

      const res = await request(app)
        .put(`/api/horarios/${horario.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 1,
          docente_id: 1,
          escuela_id: 1,
          ciclo_id: 1,
          fecha_inicio: '2024-06-01 08:00:00',
          fecha_fin: '2024-06-01 10:00:00',
          cantidad_alumnos: 25,
          descripcion: 'Actualizado',
          color: '#FF0000'
        })

      expect(res.status).toBe(200)
    })

    it('detecta solapamiento para mismo docente en diferente laboratorio', async () => {
      const token = await loginAsAdmin()

      await crearHorario({
        laboratorio_id: 1,
        docente_id: 1,
        fecha_inicio: '2024-06-01 08:00:00',
        fecha_fin: '2024-06-01 10:00:00'
      })

      const res = await request(app)
        .post('/api/horarios')
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 2,
          docente_id: 1,
          escuela_id: 1,
          ciclo_id: 1,
          fecha_inicio: '2024-06-01 09:00:00',
          fecha_fin: '2024-06-01 11:00:00',
          cantidad_alumnos: 20,
          descripcion: 'Test',
          color: '#FF0000'
        })

      expect(res.status).toBe(409)
      expect(res.body.message).toContain('docente')
    })
  })
})

describe('Horarios - Cierre', () => {
  describe('POST /api/horarios/:id/cerrar', () => {
    it('permite cerrar horario en estado Programado', async () => {
      const token = await loginAsAdmin()

      const horario = await crearHorario({ estado: 'P' })

      const res = await request(app)
        .post(`/api/horarios/${horario.id}/cerrar`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toContain('cerrado')
    })

    it('rechaza cerrar horario ya cerrado', async () => {
      const token = await loginAsAdmin()

      const horario = await crearHorario({ estado: 'C' })

      const res = await request(app)
        .post(`/api/horarios/${horario.id}/cerrar`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(409)
      expect(res.body.message).toContain('ya se encuentra cerrado')
    })

    it('rechaza eliminar horario cerrado', async () => {
      const token = await loginAsAdmin()

      const horario = await crearHorario({ estado: 'C' })

      const res = await request(app)
        .delete(`/api/horarios/${horario.id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(409)
      expect(res.body.message).toContain('cerrado')
      expect(res.body.message).toContain('no se puede eliminar')
    })

    it('rechaza editar horario cerrado', async () => {
      const token = await loginAsAdmin()

      const horario = await crearHorario({ estado: 'C' })

      const res = await request(app)
        .put(`/api/horarios/${horario.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          laboratorio_id: 1,
          docente_id: 1,
          escuela_id: 1,
          ciclo_id: 1,
          descripcion: 'Test',
          fecha_inicio: '2024-06-01 08:00:00',
          fecha_fin: '2024-06-01 10:00:00',
          cantidad_alumnos: 30,
          color: '#FF0000'
        })

      expect(res.status).toBe(409)
      expect(res.body.message).toContain('cerrado')
    })
  })
})
