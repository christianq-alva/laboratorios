import { pool } from "../config/database.js"

export const Laboratorio = {

    getAll: async () => {
        const [laboratorios] = await pool.execute(`
            SELECT * FROM laboratorios
            ORDER BY codigo, nombre
        `)
        return laboratorios;
    },

    getAllByUser: async (user_id, user_rol) => {

        let query, params = []

        if (user_rol === 'Administrador') {
            query = `
        SELECT l.*, e.nombre as escuela 
        FROM laboratorios l
        LEFT JOIN escuelas e ON l.escuela_id = e.id
        ORDER BY l.codigo, l.nombre
      `
        } else if (user_rol === 'Jefe de Laboratorio') {
            query = `
        SELECT l.*, e.nombre as escuela  
        FROM laboratorios l
        LEFT JOIN escuelas e ON l.escuela_id = e.id
        JOIN jefe_laboratorio jl ON l.id = jl.laboratorio_id
        WHERE jl.usuario_id = ?
        ORDER BY l.codigo, l.nombre
      `
            params = [user_id]
        } else {
            query = 'SELECT * FROM laboratorios WHERE 1=0'
        }

        console.log(query)
        console.log(params)


        const [laboratorios] = await pool.execute(query, params)

        return laboratorios;
    },

    create: async (codigo, nombre, ubicacion, escuela_id, piso, estado) => {
        const [result] = await pool.execute(`
            INSERT INTO laboratorios (codigo, nombre, ubicacion, escuela_id, piso, estado) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [codigo, nombre, ubicacion, escuela_id, piso, estado])

        return result.insertId;
    },

    update: async (id, codigo, nombre, ubicacion, escuela_id, piso, estado) => {
        const [result] = await pool.execute(`
            UPDATE laboratorios SET codigo = ?, nombre = ?, ubicacion = ?, escuela_id = ?, piso = ?, estado = ? WHERE id = ?
        `, [codigo, nombre, ubicacion, escuela_id, piso, estado, id])
        return result.affectedRows;
    },

    delete: async (id) => {
        const [result] = await pool.execute('DELETE FROM laboratorios WHERE id = ?', [id])
        return result.affectedRows;
    },

    exists: async (id) => {
        const [rows] = await pool.execute('SELECT id FROM laboratorios WHERE id = ?', [id])
        return rows.length > 0;
    },
    updateEstado: async (id, estado) => {
        const [result] = await pool.execute('UPDATE laboratorios SET estado = ? WHERE id = ?', [estado, id])
        return result.affectedRows;
    },

    getLaboratorioById: async (id) => {
        const [rows] = await pool.execute('SELECT * FROM laboratorios WHERE id = ?', [id])
        return rows[0];
    },
}