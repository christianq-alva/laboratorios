import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { app } from '../../server/app.js'
import { pool } from '../../server/config/database.js'
import bcrypt from 'bcryptjs'

describe('Autenticación', () => {
  describe('POST /api/auth/login', () => {
    it('permite login a usuario activo con credenciales válidas', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10)
      await pool.query(`
        INSERT INTO usuarios (nombre_completo, usuario, contrasena, rol_id, laboratorio_ids, estado)
        VALUES ('Usuario Activo', 'usuario_activo', ?, 1, '[]', 'A')
      `, [hashedPassword])

      const res = await request(app)
        .post('/api/auth/login')
        .send({ usuario: 'usuario_activo', contrasena: 'password123' })

      expect(res.status).toBe(200)
      expect(res.body.token).toBeDefined()
      expect(res.body.user).toBeDefined()
      expect(res.body.user.usuario).toBe('usuario_activo')
    })

    it('rechaza login a usuario inactivo', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10)
      await pool.query(`
        INSERT INTO usuarios (nombre_completo, usuario, contrasena, rol_id, laboratorio_ids, estado)
        VALUES ('Usuario Inactivo', 'usuario_inactivo', ?, 1, '[]', 'I')
      `, [hashedPassword])

      const res = await request(app)
        .post('/api/auth/login')
        .send({ usuario: 'usuario_inactivo', contrasena: 'password123' })

      expect(res.status).toBe(401)
      expect(res.body.message).toContain('inactivo')
    })

    it('rechaza credenciales incorrectas con mensaje genérico', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ usuario: 'usuario_inexistente', contrasena: 'wrong_password' })

      expect(res.status).toBe(401)
      expect(res.body.message).toContain('incorrectas')
    })

    it('token generado contiene los datos correctos del usuario', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10)
      const [result] = await pool.query(`
        INSERT INTO usuarios (nombre_completo, usuario, contrasena, rol_id, laboratorio_ids, estado)
        VALUES ('Admin User', 'admin', ?, 1, '[]', 'A')
      `, [hashedPassword])

      const userId = result.insertId

      const res = await request(app)
        .post('/api/auth/login')
        .send({ usuario: 'admin', contrasena: 'password123' })

      expect(res.status).toBe(200)
      expect(res.body.user).toBeDefined()
      expect(res.body.user.id).toBe(userId)
      expect(res.body.user.rol).toBeDefined()
      expect(res.body.token).toBeDefined()
    })
  })
})
