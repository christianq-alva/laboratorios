import { pool } from "../config/database.js"

export const Rol = {
    getAll: async () => {
        const [roles] = await pool.execute(`
            SELECT id, nombre FROM roles
        `)
        return roles
    },
    getById: async (id) => {
        const [roles] = await pool.execute(`
            SELECT id, nombre FROM roles WHERE id = ?
        `, [id])
        return roles[0]
    }
}