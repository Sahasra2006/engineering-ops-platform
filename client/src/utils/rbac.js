export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  DEVELOPER: 'DEVELOPER',
  QA: 'QA',
}

export const hasRole = (user, allowedRoles = []) => {
  if (!user?.role) return false
  return allowedRoles.includes(user.role)
}

export const canManageTeams = (user) => hasRole(user, [ROLES.ADMIN, ROLES.MANAGER])
export const canManageProjects = (user) => hasRole(user, [ROLES.ADMIN, ROLES.MANAGER])
export const canManageTasks = (user) => hasRole(user, [ROLES.ADMIN, ROLES.MANAGER])
export const canManageBugs = (user) => hasRole(user, [ROLES.ADMIN, ROLES.MANAGER])
export const canManageIncidents = (user) => hasRole(user, [ROLES.ADMIN, ROLES.MANAGER])
export const canViewTeams = (user) => hasRole(user, [ROLES.ADMIN, ROLES.MANAGER, ROLES.DEVELOPER, ROLES.QA])
export const canViewProjects = (user) => hasRole(user, [ROLES.ADMIN, ROLES.MANAGER])

