import { Grupo } from "../models/Grupo.js"


// 👥 OBTENER GRUPOS (CON FILTROS OPCIONALES)
export const getGrupos = async (req, res) => {
    try {
        const { escuela_id, ciclo_id } = req.query

        const grupos = await Grupo.getGrupos(escuela_id, ciclo_id)

        res.status(200).json({
            success: true,
            data: grupos,
            filters: { escuela_id, ciclo_id }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
