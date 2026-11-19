import type { AdminUser } from '../types/admin.types'
import { ADMIN_ROLES, hasPermission, type RoleConfig } from '../permissions/adminRoles'

export function useAdminPermissions(user: AdminUser | null) {
  const role = user?.role

  const canManagePlans = role ? hasPermission(role, 'canManagePlans') : false
  const canManageStaff = role ? hasPermission(role, 'canManageStaff') : false
  const canManageSuperSettings = role ? hasPermission(role, 'canManageSuperSettings') : false
  const canManageOrgs = role ? hasPermission(role, 'canManageOrgs') : false
  const canManageUsers = role ? hasPermission(role, 'canManageUsers') : false
  const canManageSubscriptions = role ? hasPermission(role, 'canManageSubscriptions') : false
  const canManageUsage = role ? hasPermission(role, 'canManageUsage') : false
  const canAccessAI = role ? hasPermission(role, 'canAccessAI') : false
  const canAccessAuditLogs = role ? hasPermission(role, 'canAccessAuditLogs') : false
  const canManageSupportAccess = role ? hasPermission(role, 'canManageSupportAccess') : false

  const roleInfo: RoleConfig | null = role ? ADMIN_ROLES[role] : null

  return {
    role,
    roleInfo,
    canManagePlans,
    canManageStaff,
    canManageSuperSettings,
    canManageOrgs,
    canManageUsers,
    canManageSubscriptions,
    canManageUsage,
    canAccessAI,
    canAccessAuditLogs,
    canManageSupportAccess,
    isSuperAdmin: role === 'super_admin',
    isPlatformAdmin: role === 'platform_admin',
  }
}
