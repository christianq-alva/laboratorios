import { Ciclo } from "../models/Ciclo.js"

export const getCiclos = async (req, res) => {
    try {
        const ciclos = await Ciclo.getCiclos()

        res.status(200).json({
            success: true,
            data: ciclos
        })
    } catch (error) {
        console.error('Error en getCiclos:', error)
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
