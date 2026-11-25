/**
 * Platform Admin API Client
 * Reuses existing CSRF token and session architecture.
 * All methods now call real backend endpoints with no mock fallbacks.
 */
import type { AdminUser, PlatformActivity, OrganizationRecord, OrganizationStats, OrgStatus } from '../types/admin.types'

function getCookie(name: string): string {
  return document.cookie.split('; ').find(x => x.startsWith(name + '='))?.split('=').slice(1).join('=') ?? ''
}

async function ensureCsrf() {
  await fetch('/api/v1/auth/csrf/', { credentials: 'include' })
}

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-CSRFToken': decodeURIComponent(getCookie('csrftoken')),
  }
}

export class AdminApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public role?: string | null
  ) {
    super(message)
    this.name = 'AdminApiError'
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  await ensureCsrf()
  const res = await fetch(path, {
    method,
    headers: headers(),
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let message = 'An unexpected error occurred.'
    let role: string | null = null
    try {
      const data = await res.json()
      if (data.detail) message = data.detail
      if (data.role !== undefined) role = data.role
    } catch {
      message = `${res.status} ${res.statusText}`
    }
    throw new AdminApiError(message, res.status, role)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : ({} as T)
}

// ---------------------------------------------------------------------------
// Types returned by the backend
// ---------------------------------------------------------------------------

export interface DashboardStats {
  organizations: { total: number; active: number; suspended: number }
  users: { total: number }
  subscriptions: { active: number; trial: number; past_due: number; total: number }
  ai_requests: { today: number; this_month: number; errors_today: number }
  recent_activity: Array<{
    id: string
    action: string
    organization: string | null
    actor: string
    summary: string
    createdAt: string
  }>
}

export interface BackendUserResponse {
  id: number
  email: string
  fullName: string
  isActive: boolean
  isStaff: boolean
  isSuperuser: boolean
  dateJoined: string
  lastLogin: string | null
  organizations: Array<{ orgId: string; orgName: string; role: string }>
  orgCount: number
}

export interface UserRecord {
  id: string
  name: string
  email: string
  organizationName: string
  organizationId: string
  roleInOrg: string
  status: 'active' | 'suspended' | 'pending'
  lastLogin: string
  createdAt: string
  sessionsActive: number
}

export interface SubscriptionRecord {
  id: string
  organizationId: string
  organizationName: string
  planId: string
  planName: string
  planTier: string
  status: string
  trialEndsAt: string | null
  periodStart: string | null
  periodEnd: string | null
  cancelledAt: string | null
  createdAt: string
}

export interface AuditLogRecord {
  id: number
  organizationId: string | null
  organization: string | null
  actor: string
  actorId: number | null
  action: string
  entityType: string
  entityId: string
  summary: string
  createdAt: string
}

export interface AIMonitoringData {
  today: {
    total: number
    success: number
    failed: number
    errorRate: number
    promptTokens: number
    completionTokens: number
  }
  thisMonth: {
    total: number
    success: number
    promptTokens: number
    completionTokens: number
  }
  perOrg: Array<{ orgId: string; orgName: string; requests: number; success: number; failed: number; tokens: number }>
  perModel: Array<{ model: string; requests: number; tokens: number }>
  recentRuns: Array<{
    id: string
    orgName: string
    userEmail: string
    taskType: string
    model: string
    status: string
    promptTokens: number
    completionTokens: number
    createdAt: string
  }>
}

export interface RemindersData {
  stats: {
    total: number
    proposed: number
    approved: number
    scheduled: number
    dispatched: number
    blocked: number
    rejected: number
    failed: number
  }
  perOrg: Array<{ orgId: string; orgName: string; total: number; dispatched: number; pending: number; failed: number }>
  recentJobs: Array<{
    id: string
    orgName: string
    customerName: string
    invoiceNumber: string
    channel: string
    status: string
    scheduledDate: string
    dispatchedAt: string | null
    createdAt: string
  }>
}

export interface UsageRecord {
  orgId: string
  orgName: string
  orgStatus: string
  plan: string
  planTier: string | null
  usage: { customers: number; invoices: number; members: number; aiRuns: number; reminderJobs: number }
  limits: { maxUsers: number; maxInvoicesPerMonth: number; maxAiRequestsPerMonth: number }
}

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------

export const adminApi = {
  csrf: () => ensureCsrf(),

  // Auth
  login: async (email: string, password: string) => {
    return request<{ detail: string }>('POST', '/api/v1/auth/login/', {
      username: email,
      password: password,
    })
  },

  me: async (): Promise<AdminUser> => {
    return request<AdminUser>('GET', '/api/v1/admin/me/')
  },

  logout: async () => {
    try {
      await request<{ detail: string }>('POST', '/api/v1/admin/auth/logout/')
    } catch {
      await fetch('/api/v1/auth/logout/', {
        method: 'POST',
        headers: headers(),
        credentials: 'include',
      })
    }
  },

  // Dashboard — real data from DB
  getDashboardStats: async (): Promise<DashboardStats> => {
    return request<DashboardStats>('GET', '/api/v1/admin/dashboard/')
  },

  // Organizations — full real data
  getOrganizations: async (): Promise<{
    items: OrganizationRecord[]
    stats: OrganizationStats
    isLive: boolean
  }> => {
    const liveOrgs = await request<OrganizationRecord[]>('GET', '/api/v1/admin/orgs/')

    const items: OrganizationRecord[] = liveOrgs.map((o: any) => ({
      id: o.id,
      name: o.name,
      legalName: o.legalName || o.name,
      ownerName: o.ownerName || '',
      ownerEmail: o.ownerEmail || '',
      plan: o.plan || (o.subscription?.planName ?? 'No Plan'),
      planTier: o.planTier || (o.subscription?.planTier ?? 'starter'),
      status: (o.status || 'active') as OrgStatus,
      createdAt: o.createdAt,
      currency: o.currency || 'INR',
      timezone: o.timezone || 'Asia/Kolkata',
      state: o.state || '',
      isLiveApiData: true,
      counts: o.counts || {
        customers: 0,
        invoices: 0,
        payments: 0,
        activeReminders: 0,
        totalUsers: 0,
      },
      subscription: o.subscription || null,
      usage: o.usage || {
        usersUsed: 0,
        usersLimit: 0,
        invoicesUsed: 0,
        invoicesLimit: 0,
        aiTokensUsed: 0,
        aiTokensLimit: 0,
      },
      members: o.members || [],
      auditLogs: o.auditLogs || [],
    }))

    const stats: OrganizationStats = {
      total: items.length,
      active: items.filter(o => o.status === 'active').length,
      trial: items.filter(o => o.status === 'trial').length,
      suspended: items.filter(o => o.status === 'suspended').length,
      closed: items.filter(o => o.status === 'closed').length,
    }

    return { items, stats, isLive: true }
  },

  getOrganizationDetail: async (id: string): Promise<OrganizationRecord | null> => {
    try {
      const o = await request<any>('GET', `/api/v1/admin/orgs/${id}/`)
      return {
        id: o.id,
        name: o.name,
        legalName: o.legalName || o.name,
        ownerName: o.ownerName || '',
        ownerEmail: o.ownerEmail || '',
        plan: o.subscription?.planName || 'No Plan',
        planTier: o.subscription?.planTier || 'starter',
        status: (o.status || 'active') as OrgStatus,
        createdAt: o.createdAt,
        currency: o.currency || 'INR',
        timezone: o.timezone || 'Asia/Kolkata',
        state: o.state || '',
        isLiveApiData: true,
        counts: o.counts || { customers: 0, invoices: 0, payments: 0, activeReminders: 0, totalUsers: 0 },
        subscription: o.subscription || null,
        usage: o.usage || { usersUsed: 0, usersLimit: 0, invoicesUsed: 0, invoicesLimit: 0, aiTokensUsed: 0, aiTokensLimit: 0 },
        members: o.members || [],
        auditLogs: o.auditLogs || [],
      }
    } catch {
      return null
    }
  },

  suspendOrganization: async (id: string, action: 'suspend' | 'reactivate', reason?: string) => {
    return request<{ status: string; detail: string }>('POST', `/api/v1/admin/orgs/${id}/suspend/`, { action, reason })
  },

  toggleOrgAI: async (id: string) => {
    return request<{ ai_disabled: boolean }>('POST', `/api/v1/admin/orgs/${id}/ai-toggle/`, {})
  },

  // Users
  getUsers: async (): Promise<UserRecord[]> => {
    const rawUsers = await request<BackendUserResponse[]>('GET', '/api/v1/admin/users/')
    return (rawUsers || []).map((u) => {
      const primaryOrg = u.organizations?.[0]
      return {
        id: String(u.id),
        name: u.fullName || u.email.split('@')[0],
        email: u.email,
        organizationName: primaryOrg?.orgName || 'No Organization',
        organizationId: primaryOrg?.orgId || '',
        roleInOrg: primaryOrg?.role || (u.isSuperuser ? 'Super Admin' : u.isStaff ? 'Platform Admin' : 'Member'),
        status: u.isActive ? 'active' : 'suspended',
        lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never',
        createdAt: u.dateJoined ? u.dateJoined.slice(0, 10) : '',
        sessionsActive: u.isActive ? 1 : 0,
      }
    })
  },

  // Subscriptions
  getSubscriptions: async (): Promise<SubscriptionRecord[]> => {
    return request<SubscriptionRecord[]>('GET', '/api/v1/admin/subscriptions/')
  },

  // Audit logs
  getAuditLogs: async (params?: { org_id?: string; action?: string; days?: number }): Promise<AuditLogRecord[]> => {
    const qs = new URLSearchParams()
    if (params?.org_id) qs.set('org_id', params.org_id)
    if (params?.action) qs.set('action', params.action)
    if (params?.days) qs.set('days', String(params.days))
    const query = qs.toString() ? `?${qs.toString()}` : ''
    return request<AuditLogRecord[]>('GET', `/api/v1/admin/audit-logs/${query}`)
  },

  // AI Monitoring
  getAIMonitoring: async (): Promise<AIMonitoringData> => {
    return request<AIMonitoringData>('GET', '/api/v1/admin/ai-monitoring/')
  },

  // Reminders
  getReminders: async (): Promise<RemindersData> => {
    return request<RemindersData>('GET', '/api/v1/admin/reminders/')
  },

  // Usage
  getUsage: async (): Promise<UsageRecord[]> => {
    return request<UsageRecord[]>('GET', '/api/v1/admin/usage/')
  },

  // Plans
  getPlans: async () => {
    return request<any[]>('GET', '/api/v1/admin/plans/')
  },

  // Legacy compat (used by Dashboard.tsx)
  getSubscriptionOverview: async () => {
    const subs = await adminApi.getSubscriptions()
    const active = subs.filter(s => s.status === 'active').length
    const trial = subs.filter(s => s.status === 'trial').length
    const pastDue = subs.filter(s => s.status === 'past_due').length
    return { active, trial, pastDue, total: subs.length }
  },

  getRecentActivity: async (): Promise<PlatformActivity[]> => {
    const dash = await adminApi.getDashboardStats()
    return dash.recent_activity.map((a, idx) => ({
      id: a.id || String(idx),
      type: (a.action.startsWith('auth') ? 'user_login' : 'org_registered') as any,
      title: a.action,
      description: a.summary || `${a.actor} performed ${a.action}${a.organization ? ' on ' + a.organization : ''}`,
      timestamp: new Date(a.createdAt).toLocaleString(),
      severity: 'info' as const,
    }))
  },
}
