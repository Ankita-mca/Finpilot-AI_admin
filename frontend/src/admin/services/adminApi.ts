/**
 * Platform Admin API Client
 * Reuses existing CSRF token and session architecture.
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

// Representative mock organizations with varied statuses (clearly labelled)
const MOCK_ORGANIZATIONS: OrganizationRecord[] = [
  {
    id: 'de042d83-8642-40b9-abe3-9f1aae4f28f0',
    name: 'Acme Industries Pvt Ltd',
    legalName: 'Acme Industries Private Limited',
    ownerName: 'Rahul Sharma',
    ownerEmail: 'rahul@acme.com',
    plan: 'Growth Plan',
    planTier: 'growth',
    status: 'active',
    createdAt: '2026-10-12T10:30:00Z',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    state: '27 (Maharashtra)',
    isLiveApiData: false,
    counts: {
      customers: 24,
      invoices: 142,
      payments: 98,
      activeReminders: 14,
      totalUsers: 4,
    },
    subscription: {
      planName: 'Growth Plan',
      billingCycle: 'monthly',
      periodEnd: '2026-12-12',
      status: 'active',
    },
    usage: {
      usersUsed: 4,
      usersLimit: 10,
      invoicesUsed: 142,
      invoicesLimit: 500,
      aiTokensUsed: 124500,
      aiTokensLimit: 500000,
    },
    members: [
      { id: 'm-1', name: 'Rahul Sharma', email: 'rahul@acme.com', role: 'Business Owner', joinedAt: '2026-10-12' },
      { id: 'm-2', name: 'Priya Verma', email: 'priya.v@acme.com', role: 'Finance Manager', joinedAt: '2026-10-15' },
      { id: 'm-3', name: 'Sanjay Patel', email: 'sanjay@acme.com', role: 'Accountant', joinedAt: '2026-10-20' },
      { id: 'm-4', name: 'Neha Iyer', email: 'neha@acme.com', role: 'Viewer', joinedAt: '2026-11-01' },
    ],
    auditLogs: [
      { id: 'log-1', action: 'auth.login', actor: 'rahul@acme.com', timestamp: '1 hour ago', summary: 'Owner signed in from Mumbai, IN' },
      { id: 'log-2', action: 'invoice.created', actor: 'priya.v@acme.com', timestamp: '3 hours ago', summary: 'Generated tax invoice INV-2026-089' },
      { id: 'log-3', action: 'reminder.dispatched', actor: 'system', timestamp: 'Yesterday', summary: 'WhatsApp reminder sequence triggered for 3 overdue accounts' },
    ],
  },
  {
    id: '0609ee71-f978-4196-9fac-ce5aa0959629',
    name: 'Vanguard Logistics Corp',
    legalName: 'Vanguard Logistics Corporation India Ltd',
    ownerName: 'Ankita Mohanty',
    ownerEmail: 'ankitamohanty020@gmail.com',
    plan: 'Business Plan',
    planTier: 'business',
    status: 'active',
    createdAt: '2026-11-01T08:15:00Z',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    state: '21 (Odisha)',
    isLiveApiData: false,
    counts: {
      customers: 68,
      invoices: 380,
      payments: 310,
      activeReminders: 28,
      totalUsers: 8,
    },
    subscription: {
      planName: 'Business Plan',
      billingCycle: 'annually',
      periodEnd: '2027-11-01',
      status: 'active',
    },
    usage: {
      usersUsed: 8,
      usersLimit: 25,
      invoicesUsed: 380,
      invoicesLimit: 2500,
      aiTokensUsed: 340000,
      aiTokensLimit: 1000000,
    },
    members: [
      { id: 'm-10', name: 'Ankita Mohanty', email: 'ankitamohanty020@gmail.com', role: 'Business Owner', joinedAt: '2026-11-01' },
      { id: 'm-11', name: 'Arun Jena', email: 'arun@vanguard.in', role: 'Finance Manager', joinedAt: '2026-11-04' },
    ],
    auditLogs: [
      { id: 'log-10', action: 'subscription.renewed', actor: 'system', timestamp: '2 days ago', summary: 'Annual renewal processed successfully' },
      { id: 'log-11', action: 'settings.updated', actor: 'ankitamohanty020@gmail.com', timestamp: '3 days ago', summary: 'Updated default payment terms to 30 days' },
    ],
  },
  {
    id: '9b3f4120-7a8e-4d22-9844-31eef4a87211',
    name: 'Zenith Tech Solutions',
    legalName: 'Zenith Technology Solutions LLP',
    ownerName: 'Karan Mehra',
    ownerEmail: 'karan@zenithtech.io',
    plan: 'Starter Plan',
    planTier: 'starter',
    status: 'trial',
    createdAt: '2026-11-10T14:20:00Z',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    state: '07 (Delhi)',
    isLiveApiData: false,
    counts: {
      customers: 8,
      invoices: 18,
      payments: 12,
      activeReminders: 4,
      totalUsers: 2,
    },
    subscription: {
      planName: 'Starter Plan (14-Day Free Trial)',
      billingCycle: 'monthly',
      periodEnd: '2026-11-24',
      status: 'trial',
      trialEndsAt: '2026-11-24',
    },
    usage: {
      usersUsed: 2,
      usersLimit: 3,
      invoicesUsed: 18,
      invoicesLimit: 50,
      aiTokensUsed: 18500,
      aiTokensLimit: 100000,
    },
    members: [
      { id: 'm-20', name: 'Karan Mehra', email: 'karan@zenithtech.io', role: 'Business Owner', joinedAt: '2026-11-10' },
      { id: 'm-21', name: 'Divya Sood', email: 'divya@zenithtech.io', role: 'Accountant', joinedAt: '2026-11-11' },
    ],
    auditLogs: [
      { id: 'log-20', action: 'trial.started', actor: 'system', timestamp: '8 days ago', summary: '14-day trial activated' },
    ],
  },
  {
    id: '81c0021b-41f2-49da-a212-0fe923984180',
    name: 'Apex Retail Distribution',
    legalName: 'Apex Retailers & Distributors India Pvt Ltd',
    ownerName: 'Vikram Chawla',
    ownerEmail: 'vikram@apexretail.in',
    plan: 'Growth Plan',
    planTier: 'growth',
    status: 'suspended',
    createdAt: '2026-08-14T09:00:00Z',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    state: '24 (Gujarat)',
    isLiveApiData: false,
    counts: {
      customers: 45,
      invoices: 310,
      payments: 240,
      activeReminders: 0,
      totalUsers: 5,
    },
    subscription: {
      planName: 'Growth Plan',
      billingCycle: 'monthly',
      periodEnd: '2026-10-30',
      status: 'suspended',
    },
    usage: {
      usersUsed: 5,
      usersLimit: 10,
      invoicesUsed: 310,
      invoicesLimit: 500,
      aiTokensUsed: 98000,
      aiTokensLimit: 500000,
    },
    members: [
      { id: 'm-30', name: 'Vikram Chawla', email: 'vikram@apexretail.in', role: 'Business Owner', joinedAt: '2026-08-14' },
    ],
    auditLogs: [
      { id: 'log-30', action: 'org.suspended', actor: 'platform_ops', timestamp: '15 days ago', summary: 'Tenant suspended due to recurring billing failures' },
    ],
  },
  {
    id: '3f9202ba-94a1-4288-bf12-429910019283',
    name: 'Deccan Fabricators & Mills',
    legalName: 'Deccan Mills & Fabricators Ltd',
    ownerName: 'Sunil Rao',
    ownerEmail: 'sunil@deccanmills.com',
    plan: 'Enterprise Plan',
    planTier: 'enterprise',
    status: 'closed',
    createdAt: '2026-05-19T11:45:00Z',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    state: '29 (Karnataka)',
    isLiveApiData: false,
    counts: {
      customers: 120,
      invoices: 1420,
      payments: 1390,
      activeReminders: 0,
      totalUsers: 14,
    },
    subscription: {
      planName: 'Enterprise Plan',
      billingCycle: 'annually',
      periodEnd: '2026-09-30',
      status: 'closed',
    },
    usage: {
      usersUsed: 14,
      usersLimit: 100,
      invoicesUsed: 1420,
      invoicesLimit: 10000,
      aiTokensUsed: 940000,
      aiTokensLimit: 5000000,
    },
    members: [
      { id: 'm-40', name: 'Sunil Rao', email: 'sunil@deccanmills.com', role: 'Business Owner', joinedAt: '2026-05-19' },
    ],
    auditLogs: [
      { id: 'log-40', action: 'org.closed', actor: 'sunil@deccanmills.com', timestamp: '48 days ago', summary: 'Organization account closed by tenant owner' },
    ],
  },
  {
    id: '1ff52f0c-3815-457f-ab36-f5416aed0815',
    name: 'BlueStar Pharma Traders',
    legalName: 'BlueStar Pharmaceuticals LLP',
    ownerName: 'Ritu Mohanty',
    ownerEmail: 'ankitamohanty024@gmail.com',
    plan: 'Starter Plan',
    planTier: 'starter',
    status: 'active',
    createdAt: '2026-11-16T05:38:00Z',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    state: '21 (Odisha)',
    isLiveApiData: false,
    counts: {
      customers: 14,
      invoices: 42,
      payments: 36,
      activeReminders: 6,
      totalUsers: 2,
    },
    subscription: {
      planName: 'Starter Plan',
      billingCycle: 'monthly',
      periodEnd: '2026-12-16',
      status: 'active',
    },
    usage: {
      usersUsed: 2,
      usersLimit: 3,
      invoicesUsed: 42,
      invoicesLimit: 50,
      aiTokensUsed: 31200,
      aiTokensLimit: 100000,
    },
    members: [
      { id: 'm-50', name: 'Ritu Mohanty', email: 'ankitamohanty024@gmail.com', role: 'Business Owner', joinedAt: '2026-11-16' },
    ],
    auditLogs: [
      { id: 'log-50', action: 'auth.login', actor: 'ankitamohanty024@gmail.com', timestamp: '2 days ago', summary: 'Owner logged in' },
    ],
  },
]

export const adminApi = {
  csrf: () => ensureCsrf(),

  // Uses existing auth login endpoint (session-based)
  login: async (email: string, password: string) => {
    return request<{ detail: string }>('POST', '/api/v1/auth/login/', {
      username: email,
      password: password,
    })
  },

  // Calls platform admin verification endpoint
  me: async (): Promise<AdminUser> => {
    return request<AdminUser>('GET', '/api/v1/admin/me/')
  },

  // Logout from platform admin
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

  // Organizations API — attempts live backend fetch and combines with rich demo data
  getOrganizations: async (): Promise<{
    items: OrganizationRecord[]
    stats: OrganizationStats
    isLive: boolean
  }> => {
    let combinedItems: OrganizationRecord[] = [...MOCK_ORGANIZATIONS]
    let isLive = false

    try {
      // Attempt live endpoint
      const liveOrgs = await request<Array<{
        id: string
        name: string
        status: OrgStatus
        default_currency: string
        created_at: string
      }>>('GET', '/api/v1/admin/orgs/')

      if (Array.isArray(liveOrgs) && liveOrgs.length > 0) {
        isLive = true
        // Map live database records
        const mappedLive: OrganizationRecord[] = liveOrgs.map(lo => {
          const matchedMock = MOCK_ORGANIZATIONS.find(m => m.id === lo.id)
          return {
            id: lo.id,
            name: lo.name,
            legalName: matchedMock?.legalName || lo.name,
            ownerName: matchedMock?.ownerName || 'Organization Owner',
            ownerEmail: matchedMock?.ownerEmail || `admin@${lo.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            plan: matchedMock?.plan || 'Growth Plan',
            planTier: matchedMock?.planTier || 'growth',
            status: (lo.status || 'active') as OrgStatus,
            createdAt: lo.created_at,
            currency: lo.default_currency || 'INR',
            timezone: 'Asia/Kolkata',
            state: matchedMock?.state || '27 (Maharashtra)',
            isLiveApiData: true,
            counts: matchedMock?.counts || {
              customers: 18,
              invoices: 65,
              payments: 48,
              activeReminders: 5,
              totalUsers: 3,
            },
            subscription: matchedMock?.subscription || {
              planName: 'Growth Plan',
              billingCycle: 'monthly',
              periodEnd: '2026-12-31',
              status: lo.status,
            },
            usage: matchedMock?.usage || {
              usersUsed: 3,
              usersLimit: 10,
              invoicesUsed: 65,
              invoicesLimit: 500,
              aiTokensUsed: 45000,
              aiTokensLimit: 500000,
            },
            members: matchedMock?.members || [
              { id: `live-m-${lo.id}`, name: 'Organization Owner', email: `owner@${lo.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`, role: 'Business Owner', joinedAt: lo.created_at.slice(0, 10) }
            ],
            auditLogs: matchedMock?.auditLogs || [
              { id: `live-log-${lo.id}`, action: 'auth.login', actor: 'owner', timestamp: 'Today', summary: 'Tenant workspace accessed' }
            ],
          }
        })

        // Merge live records with any demo records not already present
        const liveIds = new Set(mappedLive.map(o => o.id))
        const remainingDemos = MOCK_ORGANIZATIONS.filter(m => !liveIds.has(m.id))
        combinedItems = [...mappedLive, ...remainingDemos]
      }
    } catch {
      // Backend admin org endpoint offline or unauthenticated — fallback to mock
      isLive = false
    }

    // Compute stats
    const stats: OrganizationStats = {
      total: combinedItems.length,
      active: combinedItems.filter(o => o.status === 'active').length,
      trial: combinedItems.filter(o => o.status === 'trial').length,
      suspended: combinedItems.filter(o => o.status === 'suspended').length,
      closed: combinedItems.filter(o => o.status === 'closed').length,
    }

    return {
      items: combinedItems,
      stats,
      isLive,
    }
  },

  getOrganizationDetail: async (id: string): Promise<OrganizationRecord | null> => {
    const orgsResponse = await adminApi.getOrganizations()
    const found = orgsResponse.items.find(o => o.id === id)
    return found || null
  },

  // Mock / API ready data for Dashboard
  getDashboardStats: async () => {
    return {
      organizations: { label: 'Total Organizations', value: '1,248', change: '+12.5%', changeType: 'positive' as const },
      users: { label: 'Total Customers', value: '8,642', change: '+8.2%', changeType: 'positive' as const },
      activeSubscriptions: { label: 'Active Subscriptions', value: '986', change: '+6.4%', changeType: 'positive' as const },
      aiRequests: { label: 'AI Requests', value: '42.8K', change: '+18.3%', changeType: 'positive' as const },
    }
  },

  getSubscriptionOverview: async () => {
    return {
      active: 986,
      trial: 162,
      pastDue: 100,
      total: 1248,
    }
  },

  getRecentActivity: async (): Promise<PlatformActivity[]> => {
    return [
      {
        id: 'act-1',
        type: 'org_registered',
        title: 'New organization registered',
        description: 'Acme Technologies completed tenant registration and configured organization profile.',
        timestamp: '12 minutes ago',
        severity: 'success',
      },
      {
        id: 'act-2',
        type: 'org_registered',
        title: 'Subscription upgraded',
        description: 'Nova Enterprises upgraded active subscription tier to Growth Plan.',
        timestamp: '45 minutes ago',
        severity: 'info',
      },
      {
        id: 'act-3',
        type: 'org_registered',
        title: 'Started free trial',
        description: 'Bright Solutions initiated 14-day free trial on Starter Plan.',
        timestamp: '2 hours ago',
        severity: 'info',
      },
      {
        id: 'act-4',
        type: 'user_login',
        title: 'Team permissions updated',
        description: 'Vanguard Logistics added 4 team members with GST Accountant role.',
        timestamp: '4 hours ago',
        severity: 'success',
      },
      {
        id: 'act-5',
        type: 'payment_overdue',
        title: 'Subscription payment overdue',
        description: 'Apex Retail Distribution recurring card billing attempt failed (grace period active).',
        timestamp: '6 hours ago',
        severity: 'warning',
      },
    ]
  },
}
