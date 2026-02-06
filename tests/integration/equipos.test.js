import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { app } from '../../server/app.js'
import { loginAsAdmin, crearEquipo, crearHorario } from '../helpers.js'
import { pool } from '../../server/config/database.js'

describe('Equipos', () => {
  describe('PUT /api/equipos/:id - Actualización', () => {
    it('rechaza cambio de laboratorio si tiene reservas activas', async () => {
      const token = await loginAsAdmin()

      const equipo = await crearEquipo({ laboratorio_id: 1 })

      const horario = await crearHorario({ laboratorio_id: 1 })

      await pool.query(`
        INSERT INTO detalle_reserva_equipos (reserva_id, equipo_id)
        VALUES (?, ?)
      `, [horario.id, equipo.id])

      const res = await request(app)
        .put(`/api/equipos/${equipo.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: equipo.nombre,
          codigo: equipo.codigo,
          descripcion: equipo.descripcion,
          marca: equipo.marca,
          modelo: equipo.modelo,
          numero_serie: equipo.numero_serie,
          fecha_adquisicion: equipo.fecha_adquisicion,
          fecha_ultimo_mantenimiento: equipo.fecha_ultimo_mantenimiento,
          fecha_proximo_mantenimiento: equipo.fecha_proximo_mantenimiento,
          comentarios: equipo.comentarios,
          estado: equipo.estado,
          condicion: equipo.condicion,
          tipo_equipo_id: equipo.tipo_equipo_id,
          laboratorio_id: 2
        })

      expect(res.status).toBe(400)
      expect(res.body.message).toContain('reservas programadas')
      expect(res.body.message).toContain('laboratorio actual')
    })

    it('permite cambio de laboratorio si NO tiene reservas', async () => {
      const token = await loginAsAdmin()

      const equipo = await crearEquipo({ laboratorio_id: 1 })

      const res = await request(app)
        .put(`/api/equipos/${equipo.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: equipo.nombre,
          codigo: equipo.codigo,
          descripcion: equipo.descripcion,
          marca: equipo.marca,
          modelo: equipo.modelo,
          numero_serie: equipo.numero_serie,
          fecha_adquisicion: equipo.fecha_adquisicion,
          fecha_ultimo_mantenimiento: equipo.fecha_ultimo_mantenimiento,
          fecha_proximo_mantenimiento: equipo.fecha_proximo_mantenimiento,
          comentarios: equipo.comentarios,
          estado: equipo.estado,
          condicion: equipo.condicion,
          tipo_equipo_id: equipo.tipo_equipo_id,
          laboratorio_id: 2
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })
})
