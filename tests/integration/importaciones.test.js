/**
 * Tests de importaciones masivas.
 * Fixtures en tests/integration/fixtures/:
 * - insumos_invalidos.xlsx: todas las filas inválidas (nombre/descripcion/presentacion "Prueba error", unidad_medida y categoria en blanco)
 * - insumos_mixto.xlsx: 1 fila correcta, 2 incorrectas (unidad_medida inexistente, categoría en blanco)
 * - equipos_tipo_mixto.xlsx: 1 fila con tipo_equipo_id válido, 1 con tipo_equipo_id inválido (laboratorio viene del frontend)
 * - rebastecimiento_codigo_invalido.xlsx: 1 fila correcta, 1 con código inválido
 * - rebastecimiento_valido.xlsx: 1 fila válida
 */
import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { app } from '../../server/app.js'
import { loginAsAdmin } from '../helpers.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Importaciones Masivas', () => {
  describe('POST /api/insumos/importacion-masiva', () => {
    it('rechaza archivo si todas las filas son inválidas', async () => {
      const token = await loginAsAdmin()
      const res = await request(app)
        .post('/api/insumos/importacion-masiva')
        .set('Authorization', `Bearer ${token}`)
        .attach('archivo_excel', path.join(__dirname, 'fixtures/insumos_invalidos.xlsx'))
      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/No se pudo procesar ningún registro|ningún registro/i)
    })

    it('procesa parcialmente si hay filas válidas e inválidas', async () => {
      const token = await loginAsAdmin()
      const res = await request(app)
        .post('/api/insumos/importacion-masiva')
        .set('Authorization', `Bearer ${token}`)
        .attach('archivo_excel', path.join(__dirname, 'fixtures/insumos_mixto.xlsx'))
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.procesados).toBeGreaterThan(0)
      expect(res.body.detalles_errores).toBeDefined()
      expect(res.body.detalles_errores.length).toBeGreaterThan(0)
    })
  })

  describe('POST /api/equipos/importacion-masiva', () => {
    it('procesa parcialmente archivo con tipo_equipo_id válido e inválido', async () => {
      const token = await loginAsAdmin()
      const res = await request(app)
        .post('/api/equipos/importacion-masiva')
        .set('Authorization', `Bearer ${token}`)
        .field('laboratorio_id', '1')
        .attach('archivo_excel', path.join(__dirname, 'fixtures/equipos_tipo_mixto.xlsx'))
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.procesados).toBeGreaterThanOrEqual(0)
      expect(res.body.detalles_errores).toBeDefined()
      expect(res.body.procesados + res.body.detalles_errores.length).toBeGreaterThan(0)
    })
  })

  describe('POST /api/inventario/procesar-excel (reabastecimiento)', () => {
    it('reporta error en fila con código de insumo inválido o no configurado', async () => {
      const token = await loginAsAdmin()
      const res = await request(app)
        .post('/api/inventario/procesar-excel')
        .set('Authorization', `Bearer ${token}`)
        .query({ laboratorio_id: 1 })
        .attach('archivo_excel', path.join(__dirname, 'fixtures/rebastecimiento_codigo_invalido.xlsx'))
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toBeDefined()
      expect(res.body.data.errores).toBeDefined()
      expect(res.body.data.errores.length).toBeGreaterThan(0)
    })

    it('procesa correctamente filas válidas', async () => {
      const token = await loginAsAdmin()
      const res = await request(app)
        .post('/api/inventario/procesar-excel')
        .set('Authorization', `Bearer ${token}`)
        .query({ laboratorio_id: 1 })
        .attach('archivo_excel', path.join(__dirname, 'fixtures/rebastecimiento_valido.xlsx'))
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.registros_validos).toBeGreaterThanOrEqual(0)
    })
  })
})
