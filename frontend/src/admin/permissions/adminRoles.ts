// Platform Admin roles & permissions definition

export type AdminRole = 'super_admin' | 'platform_admin' | 'support_agent' | 'analyst'

export interface RoleConfig {
  id: AdminRole
  name: string
  tagline: string
  description: string
  canManagePlans: boolean
  canManageStaff: boolean
  canManageSuperSettings: boolean
  canManageOrgs: boolean
  canManageUsers: boolean
  canManageSubscriptions: boolean
  canManageUsage: boolean
  canAccessAI: boolean
  canAccessAuditLogs: boolean
  canManageSupportAccess: boolean
}

export const ADMIN_ROLES: Record<AdminRole, RoleConfig> = {
  super_admin: {
    id: 'super_admin',
    name: 'Super Admin',
    tagline: 'Complete system control & governance',
    description: 'Full platform administration, manage staff, manage subscription plans, approve support access, and platform settings.',
    canManagePlans: true,
    canManageStaff: true,
    canManageSuperSettings: true,
    canManageOrgs: true,
    canManageUsers: true,
    canManageSubscriptions: true,
    canManageUsage: true,
    canAccessAI: true,
    canAccessAuditLogs: true,
    canManageSupportAccess: true,
  },
  platform_admin: {
    id: 'platform_admin',
    name: 'Platform Admin',
    tagline: 'Platform operations & tenant oversight',
    description: 'Manage organizations, customers, subscriptions, usage limits, and AI controls. No access to staff roles or billing plans.',
    canManagePlans: false,
    canManageStaff: false,
    canManageSuperSettings: false,
    canManageOrgs: true,
    canManageUsers: true,
    canManageSubscriptions: true,
    canManageUsage: true,
    canAccessAI: true,
    canAccessAuditLogs: true,
    canManageSupportAccess: true,
  },
  support_agent: {
    id: 'support_agent',
    name: 'Support Agent',
    tagline: 'Customer support & diagnostics',
    description: 'Read-only organization view, request temporary support access, resend emails, and unlock accounts.',
    canManagePlans: false,
    canManageStaff: false,
    canManageSuperSettings: false,
    canManageOrgs: false,
    canManageUsers: false,
    canManageSubscriptions: false,
    canManageUsage: false,
    canAccessAI: false,
    canAccessAuditLogs: true,
    canManageSupportAccess: false,
  },
  analyst: {
    id: 'analyst',
    name: 'Analyst',
    tagline: 'Business intelligence & telemetry',
    description: 'Read-only aggregate metrics, financial reports, usage insights, and audit logs. No tenant modification.',
    canManagePlans: false,
    canManageStaff: false,
    canManageSuperSettings: false,
    canManageOrgs: false,
    canManageUsers: false,
    canManageSubscriptions: false,
    canManageUsage: true,
    canAccessAI: true,
    canAccessAuditLogs: true,
    canManageSupportAccess: false,
  },
}

export function hasPermission(role: AdminRole, permissionKey: keyof Omit<RoleConfig, 'id' | 'name' | 'tagline' | 'description'>): boolean {
  return !!ADMIN_ROLES[role]?.[permissionKey]
}
