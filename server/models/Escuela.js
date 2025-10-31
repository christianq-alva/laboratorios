import { pool } from '../config/database.js'

export const Escuela = {

    // Obtener todas las escuelas
    getAll: async () => {
        const [rows] = await pool.execute('SELECT * FROM escuelas ORDER BY nombre ASC')
        return rows
    },

    // Obtener una escuela por ID
    getById: async (id) => {
        const [rows] = await pool.execute('SELECT * FROM escuelas WHERE id = ?', [id])
        return rows[0]
    },

    // Crear una nueva escuela
    create: async (nombre) => {
        const [result] = await pool.execute('INSERT INTO escuelas (nombre) VALUES (?)', [nombre])
        return result.insertId
    },

    // Actualizar una escuela
    update: async (id, nombre) => {
        const [result] = await pool.execute('UPDATE escuelas SET nombre = ? WHERE id = ?', [nombre, id])
        return result.affectedRows
    },

    // Eliminar una escuela
    delete: async (id) => {
        const [result] = await pool.execute('DELETE FROM escuelas WHERE id = ?', [id])
        return result.affectedRows
    },

    // Verificar si existe una escuela
    exists: async (id) => {
        const [rows] = await pool.execute('SELECT id FROM escuelas WHERE id = ?', [id])
        return rows.length > 0
    },

    // Verificar si existe una escuela con el nombre
    existsByName: async (nombre) => {
        const [rows] = await pool.execute('SELECT id FROM escuelas WHERE nombre = ?', [nombre])
        return rows.length > 0
    },

    // Verificar si existe una escuela con el nombre excluyendo un ID
    existsByNameExcludingId: async (nombre, excludeId) => {
        const [rows] = await pool.execute('SELECT id FROM escuelas WHERE nombre = ? AND id <> ?', [nombre, excludeId])
        return rows.length > 0
    },

    checkRelations: async (id) => {
        const [docentesCount] = await pool.execute('SELECT COUNT(*) as total FROM docentes WHERE escuela_id = ?', [id])

        return {
            docentes: docentesCount[0].total,
            total: docentesCount[0].total
        }
    },
}