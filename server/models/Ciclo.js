import { pool } from '../config/database.js'

export const Ciclo = {
    getCiclos: async () => {
        const [ciclos] = await pool.execute(`
            SELECT id, nombre,
                   CAST(SUBSTRING_INDEX(nombre, ' ', -1) AS UNSIGNED) as numero_ciclo
            FROM ciclos 
            ORDER BY numero_ciclo ASC
        `)
        return ciclos
    }
}