import { AbilityBuilder, createMongoAbility } from '@casl/ability'

export const defineAbilitiesFor = (user) => {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility)

  console.log('🔍 defineAbilitiesFor user:', user) // ← AGREGAR DEBUG

  // 🔴 ADMIN: Puede hacer TODO
  if (user.rol === 'Administrador') {
    can('manage', 'all')
    return build()
  }

  // 🟡 JEFE DE LABORATORIO: Solo sus laboratorios
  if (user.rol === 'Jefe de Laboratorio') {
    const labIds = user.laboratorio_ids || [] // ← USAR ARRAY


    if (labIds.length > 0) {
      // Para cada laboratorio que maneja
      labIds.forEach(labId => {
        can(['create', 'read', 'update', 'delete'], 'Horario', { laboratorio_id: labId })
        can(['create', 'read'], 'Incidencia', { laboratorio_id: labId })
        can(['create', 'read', 'update', 'delete'], 'Equipo', { laboratorio_id: labId })
        can(['create', 'read', 'update', 'delete'], 'Insumo', { laboratorio_id: labId })
        can(['create', 'read', 'update', 'delete'], 'Reserva', { laboratorio_id: labId })
        can(['read', 'update'], 'Laboratorio', { id: labId })
      })
    }

    // Permisos generales (sin condiciones de laboratorio)
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