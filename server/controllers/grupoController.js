import { Grupo } from "../models/Grupo.js"

// Obtener todos los grupos (con filtros opcionales)
export const getGrupos = async (req, res) => {
    try {
        const { escuela_id, ciclo_id } = req.query
        const grupos = await Grupo.getGrupos(escuela_id, ciclo_id)
        res.status(200).json({
            data: grupos,
            filters: { escuela_id, ciclo_id }
        })
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener grupos'
        })
    }
}

// Obtener un grupo por ID
export const getGrupoById = async (req, res) => {
    try {
        const { id } = req.params
        const idNum = parseInt(id, 10)
        if (isNaN(idNum) || idNum <= 0) {
            return res.status(400).json({
                message: 'ID inválido'
            })
        }
        const grupo = await Grupo.getGrupoById(idNum)
        if (!grupo) {
            return res.status(404).json({
                message: 'Grupo no encontrado'
            })
        }
        res.status(200).json({
            data: grupo
        })
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener el grupo'
        })
    }
}

// Crear nuevo grupo
export const createGrupo = async (req, res) => {
    try {
        const { nombre, escuela_id, ciclo_id } = req.body
        
        // Validaciones
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({
                message: 'El nombre del grupo es requerido'
            })
        }
        if (!escuela_id || isNaN(parseInt(escuela_id))) {
            return res.status(400).json({
                message: 'La escuela es requerida'
            })
        }
        if (!ciclo_id || isNaN(parseInt(ciclo_id))) {
            return res.status(400).json({
                message: 'El ciclo es requerido'
            })
        }

        // Verificar si ya existe un grupo con ese nombre, escuela y ciclo
        const existingGrupo = await Grupo.existsByName(nombre.trim(), parseInt(escuela_id), parseInt(ciclo_id))
        if (existingGrupo) {
            return res.status(409).json({
                message: 'Ya existe un grupo con ese nombre para esta escuela y ciclo'
            })
        }

        // Insertar grupo
        const insertId = await Grupo.create(nombre.trim(), parseInt(escuela_id), parseInt(ciclo_id))
        const nuevoGrupo = await Grupo.getGrupoById(insertId)
        
        res.status(201).json({
            data: nuevoGrupo,
            message: 'Grupo creado exitosamente'
        })
    } catch (error) {
        res.status(500).json({
            message: 'Error al crear el grupo'
        })
    }
}

// Actualizar grupo
export const updateGrupo = async (req, res) => {
    try {
        const { id } = req.params
        const idNum = parseInt(id, 10)
        const { nombre, escuela_id, ciclo_id } = req.body

        if (isNaN(idNum) || idNum <= 0) {
            return res.status(400).json({
                message: 'ID inválido'
            })
        }

        // Verificar que el grupo existe
        const grupoCheck = await Grupo.exists(idNum)
        if (!grupoCheck) {
            return res.status(404).json({
                message: 'Grupo no encontrado'
            })
        }

        // Validaciones
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({
                message: 'El nombre del grupo es requerido'
            })
        }
        if (!escuela_id || isNaN(parseInt(escuela_id))) {
            return res.status(400).json({
                message: 'La escuela es requerida'
            })
        }
        if (!ciclo_id || isNaN(parseInt(ciclo_id))) {
            return res.status(400).json({
                message: 'El ciclo es requerido'
            })
        }

        // Verificar si ya existe otro grupo con ese nombre, escuela y ciclo
        const existingGrupo = await Grupo.existsByNameExcludingId(
            nombre.trim(), 
            parseInt(escuela_id), 
            parseInt(ciclo_id), 
            idNum
        )
        if (existingGrupo) {
            return res.status(409).json({
                message: 'Ya existe otro grupo con ese nombre para esta escuela y ciclo'
            })
        }

        // Actualizar grupo
        const affectedRows = await Grupo.update(idNum, nombre.trim(), parseInt(escuela_id), parseInt(ciclo_id))
        if (affectedRows === 0) {
            return res.status(404).json({
                message: 'Grupo no encontrado'
            })
        }

        const grupoActualizado = await Grupo.getGrupoById(idNum)
        res.status(200).json({
            data: grupoActualizado,
            message: 'Grupo actualizado exitosamente'
        })
    } catch (error) {
        res.status(500).json({
            message: 'Error al actualizar el grupo'
        })
    }
}

// Eliminar grupo
export const deleteGrupo = async (req, res) => {
    try {
        const { id } = req.params
        const idNum = parseInt(id, 10)

        if (isNaN(idNum) || idNum <= 0) {
            return res.status(400).json({
                message: 'ID inválido'
            })
        }

        // Verificar que el grupo existe
        const grupoCheck = await Grupo.exists(idNum)
        if (!grupoCheck) {
            return res.status(404).json({
                message: 'Grupo no encontrado'
            })
        }

        // Verificar si tiene relaciones antes de eliminar
        const relations = await Grupo.checkRelations(idNum)
        if (relations.total > 0) {
            const relaciones = []
            if (relations.reservas > 0) {
                relaciones.push(`${relations.reservas} reserva(s)`)
            }
            const grupo = await Grupo.getGrupoById(idNum)
            return res.status(409).json({
                message: `No se puede eliminar. El grupo "${grupo.nombre}" está siendo usado en el sistema: ${relaciones.join(', ')}.`
            })
        }

        // Si no tiene relaciones, proceder con la eliminación
        const affectedRows = await Grupo.delete(idNum)
        if (affectedRows === 0) {
            return res.status(404).json({
                message: 'Grupo no encontrado'
            })
        }

        res.status(200).json({
            message: 'Grupo eliminado exitosamente'
        })
    } catch (error) {
        // Manejar errores de restricción de clave foránea
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(409).json({
                message: 'No se puede eliminar el grupo porque está relacionado con otras tablas del sistema y tiene datos asociados (reservas u otros registros). Primero debes eliminar o reasignar estos registros para poder eliminar el grupo.'
            })
        }
        res.status(500).json({
            message: 'Error al eliminar el grupo'
        })
    }
}
