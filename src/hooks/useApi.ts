import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ApiError } from '../services/api.ts'

interface ApiResult<T> {
    data?: T
    error?: string
    validationErrors?: Record<string, string[]>
}

export const useApi = () => {
    const navigate = useNavigate()

    const execute = useCallback(async <T,>(
        apiCall: () => Promise<T>
    ): Promise<ApiResult<T>> => {

        try {
            const data = await apiCall()
            return { data }
        } catch (error) {
            const apiError = error as ApiError

            // Manejar errores 401 (logout + redirect)
            if (apiError.isUnauthorized) {
                console.log('❌ Token expirado o no autorizado, limpiando sesión')
                localStorage.removeItem('token')
                localStorage.removeItem('user')

                // Redirigir al login
                if (window.location.pathname !== '/login') {
                    navigate('/login')
                }

                return {
                    error: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
                }
            }

            // Manejar errores de red
            if (apiError.isNetworkError) {
                return {
                    error: 'Error de conexión. No se pudo conectar al servidor. Por favor, verifica tu conexión a internet.',
                }
            }

            // Manejar errores de validación
            if (apiError.isValidationError) {
                const message = (apiError.response?.data as any).message || 'Error de validación'
                const validationErrors = apiError.validationErrors

                return {
                    error: message,
                    validationErrors,
                }
            }

            // Manejar errores del servidor
            if (apiError.isServerError) {
                const errorData = (apiError.response?.data as any)
                return {
                    error: errorData?.message || 'Error interno del servidor. Intenta nuevamente.',
                }
            }

            // Error genérico
            const errorData = (apiError.response?.data as any)
            const errorMessage = errorData?.message ||
                (apiError as any).message ||
                apiError.message ||
                'Error inesperado. Por favor, intenta nuevamente.'

            return {
                error: errorMessage,
            }
        }
    }, [navigate])

    return { execute }
}

