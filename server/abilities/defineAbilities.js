import { AbilityBuilder, createMongoAbility } from '@casl/ability'

export const defineAbilitiesFor = (user) => {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility)

  console.log('🔍 defineAbilitiesFor user:', user) // ← AGREGAR DEBUG

  // Usuario con rol Administrador puede hacer TODO
  if (user.rol === 'Administrador') {
    can('manage', 'all')
    return build()
  }

  // Usuario con rol Jefe de Laboratorio puede hacer:
  if (user.rol === 'Jefe de Laboratorio') {
    const labIds = user.laboratorio_ids || []

    // Permisos con condiciones de laboratorio     
    if (labIds.length > 0) {
    
      labIds.forEach(labId => {
        can(['create', 'read', 'update', 'delete'], 'Horario', { laboratorio_id: labId })
        can(['create', 'read'], 'Incidencia', { laboratorio_id: labId })
        can(['create', 'read', 'update', 'delete'], 'Equipo', { laboratorio_id: labId })
        can(['create', 'read', 'update', 'delete'], 'Reserva', { laboratorio_id: labId })
        can(['read', 'update'], 'Laboratorio', { id: labId })
      })
    }

    // Permisos sin condiciones de laboratorio
    can(['create', 'read', 'update', 'delete'], 'Inventario') // ← Permitir gestionar inventario
    can('read', 'Insumo') // ← Permitir leer insumos
    can('read', 'Horario') // ← Permitir leer horarios
    can('read', 'TipoEquipo') // ← Permitir leer tipos de equipo
    can('read', 'Docente') // ← Permitir leer docentes
    can('read', 'Ciclo') // ← Permitir leer ciclos
    can('read', 'Grupo') // ← Permitir leer grupos
    can('read', 'Escuela') // ← Permitir leer escuelas

    return build()
  }

  // 🟢 ROL POR DEFECTO: Sin permisos
  return build()
}