/**
 * Utilities para roles de usuarios
 */

/**
 * Tipo para los roles válidos del sistema
 */
export type UserRole = 'admin' | 'operador_lab' | 'operador_campo' | 'viewer'

/**
 * Obtiene la descripción amigable de un rol
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    admin: 'Administrador - Acceso completo al sistema',
    operador_lab: 'Operador de Laboratorio - Gestión de ensayos y producción',
    operador_campo: 'Operador de Campo - Gestión de proyectos forestales',
    viewer: 'Visualizador - Solo lectura',
  }

  return descriptions[role]
}

/**
 * Obtiene todos los roles disponibles con sus descripciones
 */
export function getAvailableRoles(): Array<{ value: UserRole; label: string; description: string }> {
  const roles: UserRole[] = ['admin', 'operador_lab', 'operador_campo', 'viewer']

  return roles.map(role => ({
    value: role,
    label: role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: getRoleDescription(role),
  }))
}
