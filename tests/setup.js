// Cargar variables de entorno (NODE_ENV=test → .env.test) antes de usar BD
import '../server/config/env.js'
import { pool } from '../server/config/database.js'

beforeEach(async () => {
  await pool.query('SET FOREIGN_KEY_CHECKS = 0')
  await pool.query('TRUNCATE TABLE actividad_equipos')
  await pool.query('TRUNCATE TABLE actividad_horarios')
  await pool.query('TRUNCATE TABLE detalle_reserva_insumos')
  await pool.query('TRUNCATE TABLE detalle_reserva_equipos')
  await pool.query('TRUNCATE TABLE incidencias')
  await pool.query('TRUNCATE TABLE enlaces_compartidos')
  await pool.query('TRUNCATE TABLE movimiento_insumo_detalle')
  await pool.query('TRUNCATE TABLE movimientos_insumos')
  await pool.query('TRUNCATE TABLE reservas')
  await pool.query('TRUNCATE TABLE equipos')
  await pool.query('TRUNCATE TABLE inventario_insumos')
  await pool.query('TRUNCATE TABLE insumos')
  await pool.query('TRUNCATE TABLE usuarios')
  await pool.query('TRUNCATE TABLE docentes')
  await pool.query('TRUNCATE TABLE laboratorios')
  await pool.query('TRUNCATE TABLE ciclos')
  await pool.query('TRUNCATE TABLE escuelas')
  await pool.query('TRUNCATE TABLE tipos_equipo')
  await pool.query('TRUNCATE TABLE unidades')
  await pool.query('TRUNCATE TABLE roles')
  await pool.query('SET FOREIGN_KEY_CHECKS = 1')

  await seedBaseData()
})

afterAll(async () => {
  await pool.end()
})

async function seedBaseData() {
  await pool.query(`
    INSERT INTO roles (id, nombre) VALUES
    (1, 'Administrador'),
    (2, 'Jefe de Laboratorio')
  `)

  await pool.query(`
    INSERT INTO escuelas (id, nombre) VALUES
    (1, 'Medicina Humana'),
    (2, 'Nutrición Humana')
  `)

  await pool.query(`
    INSERT INTO ciclos (id, nombre) VALUES
    (1, 'Ciclo 1')
  `)

  await pool.query(`
    INSERT INTO docentes (id, nombre, correo, escuela_id) VALUES
    (1, 'Juan Pérez', 'juan.perez@upeu.edu.pe', 1)
  `)

  await pool.query(`
    INSERT INTO tipos_equipo (id, nombre, descripcion) VALUES
    (1, 'Microscopio', 'Microscopios ópticos y variantes'),
    (2, 'Balanza', 'Balanza analítica / precisión')
  `)

  await pool.query(`
    INSERT INTO unidades (id, simbolo, nombre) VALUES
    (1, 'ml', 'Mililitros'),
    (2, 'g', 'Gramos')
  `)

  await pool.query(`
    INSERT INTO laboratorios (id, nombre, codigo, escuela_id, estado, piso, ubicacion) VALUES
    (1, 'Laboratorio de Cómputo 1', 'SL01LA10', 1, 'Activo', 2, 'Pabellón A'),
    (2, 'Laboratorio de Cómputo 2', 'SL01LA11', 1, 'Activo', 2, 'Pabellón A')
  `)

  await pool.query(`
    INSERT INTO insumos (id, nombre, codigo, categoria, unidad_id) VALUES
    (1, 'Insumo prueba', 'INS-TEST-001', 'Materiales', 1)
  `)

  await pool.query(`
    INSERT INTO inventario_insumos (insumo_id, laboratorio_id) VALUES
    (1, 1)
  `)
}
