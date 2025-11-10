import { pool } from "../config/database.js"

export const Laboratorio = {

    getAll: async () => {
        const [laboratorios] = await pool.execute(`
            SELECT * FROM laboratorios
            ORDER BY codigo, nombre
        `)
        return laboratorios;
    },

    getAllByUser: async (user_rol, user_laboratorio_ids) => {

        let query = []

        query = `
        SELECT l.id, l.codigo, l.nombre, l.ubicacion, l.escuela_id, l.piso, l.estado, e.nombre as escuela 
        FROM laboratorios l
        LEFT JOIN escuelas e ON l.escuela_id = e.id
        WHERE 1=1
        
      `
        if (user_rol === 'Jefe de Laboratorio') {
            query += ` AND l.id IN (${user_laboratorio_ids.join(',')})`
        }

        query += ' ORDER BY l.codigo, l.nombre';

        const [laboratorios] = await pool.execute(query)

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
    getLaboratorioInsumos: async () => {
        const [laboratorioInsumos] = await pool.execute(`
        SELECT l.codigo lab_codigo, l.nombre lab_nombre, i.codigo ins_codigo, i.nombre ins_nombre, i.unidad_medida ins_unidad_medida
        FROM inventario_insumos ii
        INNER JOIN laboratorios l on l.id = ii.laboratorio_id 
        INNER JOIN insumos i on i.id = ii.insumo_id 
        ORDER BY l.nombre, i.nombre;
        `)
        return laboratorioInsumos;
    },

    // Obtener insumos configurados para un laboratorio
    getInsumosByLaboratorio: async (laboratorio_id) => {
        const [insumos] = await pool.execute(`
            SELECT 
                i.id,
                i.codigo,
                i.nombre,
                i.descripcion,
                i.unidad_medida,
                i.categoria,
                i.presentacion
            FROM inventario_insumos ii
            INNER JOIN insumos i ON i.id = ii.insumo_id
            WHERE ii.laboratorio_id = ?
            ORDER BY i.nombre
        `, [laboratorio_id])
        return insumos
    },

    // Configurar insumos para un laboratorio (reemplaza todos los insumos configurados)
    configurarInsumos: async (laboratorio_id, insumo_ids) => {
        const connection = await pool.getConnection()
        try {
            await connection.beginTransaction()

            // Eliminar todos los insumos configurados para este laboratorio
            await connection.execute(
                'DELETE FROM inventario_insumos WHERE laboratorio_id = ?',
                [laboratorio_id]
            )

            // Insertar los nuevos insumos configurados
            if (insumo_ids && insumo_ids.length > 0) {
                const values = insumo_ids.map(insumo_id => [laboratorio_id, insumo_id])
                const placeholders = values.map(() => '(?, ?)').join(', ')
                const flatValues = values.flat()
                
                await connection.execute(
                    `INSERT INTO inventario_insumos (laboratorio_id, insumo_id) VALUES ${placeholders}`,
                    flatValues
                )
            }

            await connection.commit()
            return true
        } catch (error) {
            await connection.rollback()
            throw error
        } finally {
            connection.release()
        }
    },
}