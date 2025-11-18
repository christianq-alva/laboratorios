import { pool } from '../config/database.js'

export const Horario = {
    getAllHorarios: async (user_rol, user_laboratorio_ids) => {

        let query = `
        SELECT 
          r.id,
          r.laboratorio_id,
          r.docente_id,
          r.escuela_id,
          r.ciclo_id,
          r.fecha_inicio,
          r.fecha_fin,
          r.cantidad_alumnos,
          r.descripcion,
          r.color,
          r.estado,
          l.nombre as laboratorio,
          d.nombre as docente,
          e.nombre as escuela,
          c.nombre as ciclo,
          COUNT(dri.id) as insumos_requeridos
        FROM reservas r
        LEFT JOIN laboratorios l ON r.laboratorio_id = l.id
        LEFT JOIN docentes d ON r.docente_id = d.id
        LEFT JOIN escuelas e ON r.escuela_id = e.id
        LEFT JOIN ciclos c ON r.ciclo_id = c.id
        LEFT JOIN detalle_reserva_insumos dri ON r.id = dri.reserva_id
      `
        let params = []

        // 🟡 JEFE DE LAB: Solo horarios de SUS laboratorios
        if (user_rol === 'Jefe de Laboratorio') {
            const labIds = user_laboratorio_ids

            if (labIds && labIds.length > 0) {
                const placeholders = labIds.map(() => '?').join(',')
                query += ` WHERE r.laboratorio_id IN (${placeholders})`
                params = labIds
            } else {
                // No tiene laboratorios asignados
                query += ' WHERE 1 = 0' // No mostrar nada
            }
        } else {
        }

        query += ' GROUP BY r.id ORDER BY r.fecha_inicio DESC'

        const [horarios] = await pool.execute(query, params)

        return horarios;
    },
    getHorarioById: async (reserva_id) => {
        const [horario] = await pool.execute(`
        SELECT 
          r.id,
          r.laboratorio_id,
          r.docente_id,
          r.escuela_id,
          r.ciclo_id,
          r.descripcion,
          r.fecha_inicio,
          r.fecha_fin,
          r.cantidad_alumnos,
          r.estado,
          l.nombre as laboratorio,
          d.nombre as docente,
          e.nombre as escuela,
          c.nombre as ciclo
        FROM reservas r
        JOIN laboratorios l ON r.laboratorio_id = l.id
        JOIN docentes d ON r.docente_id = d.id
        JOIN escuelas e ON r.escuela_id = e.id
        JOIN ciclos c ON r.ciclo_id = c.id
        WHERE r.id = ?
      `, [reserva_id])

        return horario[0] || null;
    },

    exitsById: async (reserva_id) => {
        const [result] = await pool.execute(`
            SELECT id FROM reservas WHERE id = ?
        `, [reserva_id])
        return result.length > 0;
    },

    getInsumosRequeridosByHorario: async (reserva_id) => {
        const [insumos] = await pool.execute(`
            SELECT 
              i.id,
              i.codigo,
              i.nombre,
              i.categoria,
              u.nombre as unidad_nombre,
              u.simbolo as unidad_simbolo,
              dri.cantidad_usada
            FROM detalle_reserva_insumos dri
            JOIN insumos i ON dri.insumo_id = i.id
            JOIN unidades u ON i.unidad_id = u.id
            WHERE dri.reserva_id = ?
            ORDER BY i.nombre
        `, [reserva_id])
        return insumos;
    },
    getEquiposRequeridosByHorario: async (reserva_id) => {
        const [equipos] = await pool.execute(`
            SELECT 
              dre.equipo_id as id,
              e.nombre,
              e.marca,
              e.modelo,
              e.codigo,
              e.estado
            FROM detalle_reserva_equipos dre
            JOIN equipos e ON dre.equipo_id = e.id
            WHERE dre.reserva_id = ?
            ORDER BY e.nombre
        `, [reserva_id])
        return equipos;
    },
    getCruceLab: async (laboratorio_id, reserva_id,
        fechaInicio, fechaFin) => {

        const [result] = await pool.execute(`
            SELECT 
            r.id,
            r.fecha_inicio,
            r.fecha_fin,
            r.descripcion,
            d.nombre as docente,
            l.nombre as laboratorio,
            l.ubicacion as laboratorio_ubicacion,
            e.nombre as escuela,
            c.nombre as ciclo
            FROM reservas r
            JOIN docentes d ON r.docente_id = d.id
            JOIN laboratorios l ON r.laboratorio_id = l.id
            LEFT JOIN escuelas e ON r.escuela_id = e.id
            LEFT JOIN ciclos c ON r.ciclo_id = c.id
            WHERE r.laboratorio_id = ?
            AND r.id != COALESCE(?, 0)
            AND (
                (? < r.fecha_fin AND ? > r.fecha_inicio) OR
                (? < r.fecha_fin AND ? > r.fecha_inicio) OR
                (? <= r.fecha_inicio AND ? >= r.fecha_fin)
            )`,
            [laboratorio_id, reserva_id, fechaInicio, fechaInicio, fechaFin, fechaFin, fechaInicio, fechaFin])

        return result;
    },

    getCruceDocente: async (laboratorio_id, reserva_id,
        fechaInicio, fechaFin) => {

        const [result] = await pool.execute(`
            SELECT 
            r.id,
            r.fecha_inicio,
            r.fecha_fin,
            r.descripcion,
            l.nombre as laboratorio,
            l.ubicacion as laboratorio_ubicacion,
            d.nombre as docente,
            e.nombre as escuela,
            c.nombre as ciclo
            FROM reservas r
            JOIN laboratorios l ON r.laboratorio_id = l.id
            JOIN docentes d ON r.docente_id = d.id
            LEFT JOIN escuelas e ON r.escuela_id = e.id
            LEFT JOIN ciclos c ON r.ciclo_id = c.id
            WHERE r.docente_id = ?
            AND r.id != COALESCE(?, 0)
            AND (
                (? < r.fecha_fin AND ? > r.fecha_inicio) OR
                (? < r.fecha_fin AND ? > r.fecha_inicio) OR
                (? <= r.fecha_inicio AND ? >= r.fecha_fin)
            )`,
            [laboratorio_id, reserva_id, fechaInicio, fechaInicio, fechaFin, fechaFin, fechaInicio, fechaFin])

        return result;
    },
    getActividadHorarios: async (user_rol, user_laboratorio_ids, laboratorio_id, fecha_inicio, fecha_fin, accion, usuario_id) => {
        let query = `
            SELECT 
                ah.id actividad_id,
                ah.accion,
                ah.descripcion,
                ah.created_at as fecha_actividad,
                ah.usuario_id,
                u.nombre_completo as usuario_nombre_completo,
                rl.nombre as usuario_rol,
                r.fecha_inicio,
                r.fecha_fin,
                r.cantidad_alumnos,
                l.nombre as laboratorio_nombre,
                l.ubicacion as laboratorio_ubicacion,
                'Docente: ' as docente_nombre,
                e.nombre as escuela_nombre,
                c.nombre as ciclo_nombre
            FROM actividad_horarios ah
            LEFT JOIN reservas r ON ah.reserva_id = r.id
            LEFT JOIN usuarios u ON ah.usuario_id = u.id
            INNER JOIN laboratorios l ON r.laboratorio_id = l.id
            INNER JOIN roles rl ON u.rol_id = rl.id
            INNER JOIN docentes d ON r.docente_id = d.id
            INNER JOIN escuelas e ON r.escuela_id = e.id
            INNER JOIN ciclos c ON r.ciclo_id = c.id
            WHERE 1=1
            `
        const params = []

        // Filtros según permisos del usuario
        if (user_rol === 'Jefe de Laboratorio' && user_laboratorio_ids && user_laboratorio_ids.length > 0) {
            // Necesitamos obtener los nombres de laboratorios para filtrar por nombre
            const labIds = user_laboratorio_ids.join(',')
            query += ` AND l.id IN (${labIds})`
        }
        if (usuario_id && user_rol === 'Administrador') {
            query += ` AND u.id = ?`
            params.push(usuario_id)
        }

        // Filtros opcionales
        if (laboratorio_id) {
            query += ` AND r.laboratorio_id = ?`
            params.push(laboratorio_id)
        }

        if (fecha_inicio) {
            query += ` AND DATE(ah.fecha_actividad) >= ?`
            params.push(fecha_inicio)
        }

        if (fecha_fin) {
            query += ` AND DATE(ah.fecha_actividad) <= ?`
            params.push(fecha_fin)
        }

        if (accion) {
            query += ` AND ah.accion = ?`
            params.push(accion)
        }

        query += ` ORDER BY ah.fecha_actividad DESC`

        const [rows] = await pool.execute(query, params)

        return rows;
    },

    registroCreateHorario: async (datosHorario, insumos_requeridos, equipos_requeridos, connection) => {
        await connection.beginTransaction()
        try {

            const {
                laboratorio_id,
                docente_id,
                escuela_id,
                ciclo_id,
                descripcion,
                fechaInicioMySQL,
                fechaFinMySQL,
                cantidad_alumnos,
                color
            } = datosHorario;

            // 1. CREAR LA RESERVA
            const reserva_id = await Horario.createHorario(laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color, connection)

            // 2. PROCESAR INSUMOS
            if (insumos_requeridos.length > 0) {
                await Horario.createHorarioInsumos(reserva_id, insumos_requeridos, connection)
            }

            // 3. PROCESAR EQUIPOS
            if (equipos_requeridos.length > 0) {
                await Horario.createHorarioEquipos(reserva_id, equipos_requeridos, connection)
            }

            await connection.commit()

            return reserva_id;

        } catch (error) {
            console.log('error', error)
            await connection.rollback();
            throw error;
        }
    },

    createHorario: async (laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color, connection) => {

        const [result] = await connection.execute(`
        INSERT INTO reservas (laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fecha_inicio, fecha_fin, cantidad_alumnos, color) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color])

        return result.insertId;

    },
    getInsumosRequeridosById: async (reserva_id) => {
        const [insumos] = await pool.execute(`
            SELECT 
              i.id,
              i.codigo,
              i.nombre,
              i.categoria,
              u.simbolo as unidad_simbolo,
              u.nombre as unidad_nombre,
              dri.cantidad_usada
            FROM detalle_reserva_insumos dri
            JOIN insumos i ON dri.insumo_id = i.id
            JOIN unidades u ON i.unidad_id = u.id
            WHERE dri.reserva_id = ?
        `, [reserva_id])
        return insumos;
    },
    registroUpdateHorario: async (datosHorario, insumos_requeridos, equipos_requeridos, connection) => {

        try {

            const {
                reserva_id,
                laboratorio_id,
                docente_id,
                escuela_id,
                ciclo_id,
                descripcion,
                fechaInicioMySQL,
                fechaFinMySQL,
                cantidad_alumnos,
                color
            } = datosHorario;

            // 1. CREAR LA RESERVA
            await Horario.updateHorario(laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color, reserva_id, connection)

            // 2. PROCESAR INSUMOS
            if (insumos_requeridos.length > 0) {
                await Horario.createHorarioInsumos(reserva_id, insumos_requeridos, connection)
            }

            // 3. PROCESAR EQUIPOS
            if (equipos_requeridos.length > 0) {
                await Horario.createHorarioEquipos(reserva_id, equipos_requeridos, connection)
            }

            await connection.commit()

            return reserva_id;

        } catch (error) {
            await connection.rollback();
            throw error;
        }
    },
    updateHorario: async (laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color, reserva_id, connection) => {
        await connection.execute(`
        UPDATE reservas 
        SET laboratorio_id = ?, docente_id = ?, escuela_id = ?, ciclo_id = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, cantidad_alumnos = ?, color = ?
        WHERE id = ?
      `, [laboratorio_id, docente_id, escuela_id, ciclo_id, descripcion, fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color, reserva_id])
    },

    createHorarioInsumos: async (reserva_id, insumos_requeridos, connection) => {

        for (const insumo of insumos_requeridos) {

            // Insertar en detalle_reserva_insumos
            await connection.execute(`
            INSERT INTO detalle_reserva_insumos (reserva_id, insumo_id, cantidad_usada)
            VALUES (?, ?, ?)
            `, [reserva_id, insumo.insumo_id, insumo.cantidad])

        }
    },

    createHorarioEquipos: async (reserva_id, equipos_requeridos, connection) => {

        for (const equipo of equipos_requeridos) {

            // Insertar en detalle_reserva_equipos
            await connection.execute(`
            INSERT INTO detalle_reserva_equipos (reserva_id, equipo_id)
            VALUES (?, ?)
            `, [reserva_id, equipo.equipo_id])
        }

    },
    deleteHorarioInsumos: async (reserva_id, connection) => {
        await connection.execute(`
            DELETE 
            FROM detalle_reserva_insumos
            WHERE reserva_id = ?`,
            [reserva_id])
    },
    deleteHorarioEquipos: async (reserva_id, connection) => {
        await connection.execute(`
            DELETE 
            FROM detalle_reserva_equipos
            WHERE reserva_id = ?`,
            [reserva_id])
    },
    deleteHorario: async (reserva_id, connection) => {
        await connection.execute(`
            DELETE 
            FROM reservas
            WHERE id = ?`,
            [reserva_id])
    },

    registrarActividadHorario: async ({ accion, reserva_id, descripcion, usuario_id, ip_address }) => {
        try {
            // Crear fecha en zona horaria de Perú
            const fechaPeru = new Date().toLocaleString('en-CA', {
                timeZone: 'America/Lima',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).replace(', ', ' ')

            const query = `
                INSERT INTO actividad_horarios (accion, reserva_id, descripcion, usuario_id, ip_address, fecha_actividad) 
                VALUES (?, ?, ?, ?, ?, ?)
            `

            await pool.execute(query, [accion, reserva_id, descripcion, usuario_id, ip_address, fechaPeru])
            console.log(`📋 Actividad registrada: ${accion} - ${descripcion} (${fechaPeru})`)
        } catch (error) {
            console.error('❌ Error al registrar actividad:', error)
            // No lanzamos el error para no interrumpir la operación principal
        }
    },
    estadoHorario: async (reserva_id) => {
        const [result] = await pool.execute(
            `SELECT estado
            FROM reservas
            WHERE id = ?`,
            [reserva_id])

        return (result[0].estado == 'C');
    },
    cerrarHorario: async (reserva_id, connection) => {
        await connection.execute(`
            UPDATE reservas
            SET estado = 'C'
            WHERE id = ?`,
            [reserva_id])
    },
    getHorarioLastMonth: async (user_rol, user_laboratorio_ids) => {
        let query = `
      SELECT 
        r.id,
        DATE_FORMAT(r.fecha_inicio, '%d/%m/%Y %H:%i') as fecha_clase,
        DATE_FORMAT(r.fecha_fin, '%H:%i') as hora_fin,
        l.nombre as laboratorio,
        d.nombre as docente,
        r.cantidad_alumnos
      FROM reservas r
      JOIN laboratorios l ON r.laboratorio_id = l.id
      JOIN docentes d ON r.docente_id = d.id
      WHERE r.fecha_inicio >= DATE_SUB(NOW(), INTERVAL 30 DAY)  -- Últimos 30 días
    `
        let params = []

        // 🟡 JEFE DE LAB: Solo horarios de SUS laboratorios
        if (user_rol === 'Jefe de Laboratorio') {
            const labIds = user_laboratorio_ids || []
            if (labIds.length > 0) {
                const placeholders = labIds.map(() => '?').join(',')
                query += ` AND r.laboratorio_id IN (${placeholders})`
                params = labIds
            } else {
                query += ' AND 1 = 0' // No mostrar nada
            }
        }

        query += ' ORDER BY r.fecha_inicio DESC LIMIT 100' // Últimos 100 horarios

        const [horarios] = await pool.execute(query, params)

        return horarios;
    },
    getDocentesReservasByLaboratorio: async (laboratorio_id) => {
        const [docentes] = await pool.execute(`
            SELECT DISTINCT d.nombre
            FROM reservas r
            JOIN docentes d ON r.docente_id = d.id
            WHERE r.laboratorio_id = ?
        `, [laboratorio_id])
        return docentes;
    },
    getCiclosReservasByLaboratorio: async (laboratorio_id) => {
        const [ciclos] = await pool.execute(`
            SELECT DISTINCT c.nombre
            FROM reservas r
            JOIN ciclos c ON r.ciclo_id = c.id
            WHERE r.laboratorio_id = ?
        `, [laboratorio_id])
        return ciclos;
    },
    getPublicHorarios: async (laboratorio_id) => {
        const [horarios] = await pool.execute(`
            SELECT 
                r.id as reserva_id,
                r.fecha_inicio,
                r.fecha_fin,
                r.cantidad_alumnos,
                r.descripcion,
                r.color,
                l.nombre as laboratorio,
                d.nombre as docente,
                e.nombre as escuela,
                c.nombre as ciclo
            FROM reservas r
            LEFT JOIN laboratorios l ON r.laboratorio_id = l.id
            LEFT JOIN docentes d ON r.docente_id = d.id
            LEFT JOIN escuelas e ON r.escuela_id = e.id
            LEFT JOIN ciclos c ON r.ciclo_id = c.id
            WHERE r.laboratorio_id = ?
            ORDER BY r.fecha_inicio DESC
        `, [laboratorio_id])
        return horarios;
    }
}
