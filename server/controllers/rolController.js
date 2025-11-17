import { Rol } from "../models/Rol.js"

export const getAll = async (req, res) => {
    try {
        const roles = await Rol.getAll()
        res.status(200).json({
            success: true,
            data: roles
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}