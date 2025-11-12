import { AbilityBuilder, createMongoAbility } from '@casl/ability'

export const defineAbilitiesFor = (user) => {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility)

  // Usuario con rol Administrador puede hacer TODO
  if (user.rol === 'Administrador') {
    can('manage', 'all')
    return build()
  }

  // Usuario con rol Jefe de Laboratorio puede hacer:
  if (user.rol === 'Jefe de Laboratorio') {

    // Permisos generales para el Jefe de Laboratorio
    // El Middleware de autorización se encarga de verificar si el usuario tiene permisos para el laboratorio
    can(['create', 'read', 'update', 'delete'], 'Horario')
    can(['create', 'read', 'update', 'delete'], 'Inventario')
    can(['create', 'read', 'update', 'delete'], 'Equipo')
    can(['create', 'read', 'update'], 'ShareLink')
    can(['create', 'read'], 'Incidencia')
    can('read', 'Laboratorio')
    can('read', 'Insumo')
    can('read', 'Horario')
    can('read', 'TipoEquipo')
    can('read', 'Docente')
    can('read', 'Ciclo')
    can('read', 'Grupo')
    can('read', 'Escuela')

    return build()
  }

  // Rol diferente a Administrador o Jefe de Laboratorio: Sin permisos asignados
  return build()
}