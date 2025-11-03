import { pool } from '../config/database.js'

export const Horario = {
    getAllHorarios: async () => {


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
            g.nombre as grupo,
            e.nombre as escuela,
            c.nombre as ciclo
            FROM reservas r
            JOIN docentes d ON r.docente_id = d.id
            JOIN laboratorios l ON r.laboratorio_id = l.id
            LEFT JOIN grupos g ON r.grupo_id = g.id
            LEFT JOIN escuelas e ON g.escuela_id = e.id
            LEFT JOIN ciclos c ON g.ciclo_id = c.id
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
            g.nombre as grupo,
            e.nombre as escuela,
            c.nombre as ciclo
            FROM reservas r
            JOIN laboratorios l ON r.laboratorio_id = l.id
            JOIN docentes d ON r.docente_id = d.id
            LEFT JOIN grupos g ON r.grupo_id = g.id
            LEFT JOIN escuelas e ON g.escuela_id = e.id
            LEFT JOIN ciclos c ON g.ciclo_id = c.id
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
        actividad_id,
        accion,
        reserva_id,
        descripcion,
        fecha_actividad,
        ip_address,
        usuario_id,
        usuario_nombre,
        usuario_nombre_completo,
        usuario_rol,
        horario_descripcion,
        fecha_inicio,
        fecha_fin,
        cantidad_alumnos,
        color,
        horario_creado_en,
        horario_actualizado_en,
        laboratorio_nombre,
        laboratorio_ubicacion,
        docente_nombre,
        docente_correo,
        grupo_nombre,
        escuela_nombre,
        ciclo_nombre
      FROM vista_actividad_horarios
      WHERE 1=1
    `

        const params = []

        // Filtros según permisos del usuario
        if (user_rol === 'Jefe de Laboratorio' && user_laboratorio_ids && user_laboratorio_ids.length > 0) {
            // Necesitamos obtener los nombres de laboratorios para filtrar por nombre
            const labIds = user_laboratorio_ids.join(',')
            query += ` AND reserva_id IN (
        SELECT r.id FROM reservas r 
        INNER JOIN laboratorios l ON r.laboratorio_id = l.id 
        WHERE l.id IN (${labIds})
      )`
        }

        // Filtros opcionales
        if (laboratorio_id) {
            query += ` AND reserva_id IN (
        SELECT r.id FROM reservas r 
        WHERE r.laboratorio_id = ?
      )`
            params.push(laboratorio_id)
        }

        if (fecha_inicio) {
            query += ` AND DATE(fecha_actividad) >= ?`
            params.push(fecha_inicio)
        }

        if (fecha_fin) {
            query += ` AND DATE(fecha_actividad) <= ?`
            params.push(fecha_fin)
        }

        if (accion) {
            query += ` AND accion = ?`
            params.push(accion)
        }

        if (usuario_id) {
            query += ` AND usuario_id = ?`
            params.push(usuario_id)
        }

        query += ` ORDER BY fecha_actividad DESC LIMIT 500`

        const [rows] = await pool.execute(query, params)

        return rows;
    },

    registroCreateHorario: async (datosHorario, insumos_requeridos, equipos_requeridos, connection) => {
        await connection.beginTransaction()
        try {

            const {
                laboratorio_id,
                docente_id,
                grupo_id,
                descripcion,
                fechaInicioMySQL,
                fechaFinMySQL,
                cantidad_alumnos,
                color
            } = datosHorario;

            // 1. CREAR LA RESERVA
            const reserva_id = await Horario.createHorario(laboratorio_id, docente_id, grupo_id, descripcion, fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color, connection)

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

    createHorario: async (laboratorio_id, docente_id, grupo_id, descripcion, fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color, connection) => {

        const [result] = await connection.execute(`
        INSERT INTO reservas (laboratorio_id, docente_id, grupo_id, descripcion, fecha_inicio, fecha_fin, cantidad_alumnos, color) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [laboratorio_id, docente_id, grupo_id, descripcion, fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color])

        return result.insertId;

    },
    registroUpdateHorario: async (datosHorario, insumos_requeridos, equipos_requeridos, connection) => {

        try {

            const {
                reserva_id,
                laboratorio_id,
                docente_id,
                grupo_id,
                descripcion,
                fechaInicioMySQL,
                fechaFinMySQL,
                cantidad_alumnos,
                color
            } = datosHorario;

            // 1. CREAR LA RESERVA
            await Horario.updateHorario(laboratorio_id, docente_id, grupo_id, descripcion, fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color, connection)

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
    updateHorario: async (laboratorio_id, docente_id, grupo_id, descripcion, fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color, reserva_id, connection) => {
        await connection.execute(`
        UPDATE reservas 
        SET laboratorio_id = ?, docente_id = ?, grupo_id = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, cantidad_alumnos = ?, color = ?
        WHERE id = ?
      `, [laboratorio_id, docente_id, grupo_id, descripcion, fechaInicioMySQL, fechaFinMySQL, cantidad_alumnos, color, reserva_id])
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
            INSERT INTO detalle_reserva_equipos (reserva_id, equipo_id, cantidad)
            VALUES (?, ?, ?)
            `, [reserva_id, equipo.equipo_id, equipo.cantidad])
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
    getGrupoValidacion: async (grupo_id) => {

        const conn = pool

        const [grupoValidacion] = await conn.execute(`
        SELECT 
          g.id,
          g.nombre as grupo_nombre,
          g.escuela_id,
          g.ciclo_id,
          e.nombre as escuela_nombre,
          c.nombre as ciclo_nombre
        FROM grupos g
        JOIN escuelas e ON g.escuela_id = e.id
        JOIN ciclos c ON g.ciclo_id = c.id
        WHERE g.id = ?
      `, [grupo_id])

        return grupoValidacion;
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
      INSERT INTO actividad_horarios (
        accion, reserva_id, descripcion, usuario_id, ip_address, fecha_actividad
      ) VALUES (?, ?, ?, ?, ?, ?)
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
    }
}
