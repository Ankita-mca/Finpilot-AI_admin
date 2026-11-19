// Platform Admin type definitions

export type AdminRole = 'super_admin' | 'platform_admin' | 'support_agent' | 'analyst'
export type OrgStatus = 'active' | 'trial' | 'suspended' | 'closed' | 'past_due'
export type PlanTier = 'starter' | 'growth' | 'business' | 'enterprise'

export interface AdminUser {
  id: number
  email: string
  full_name: string
  role: AdminRole
  is_staff: boolean
  is_superuser: boolean
}

export interface PlatformStat {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: string
  description?: string
}

export interface SubscriptionBreakdown {
  active: number
  trial: number
  pastDue: number
  total: number
}

export interface PlatformActivity {
  id: string
  type: 'org_registered' | 'payment_overdue' | 'ai_threshold' | 'user_login' | 'system'
  title: string
  description: string
  timestamp: string
  severity: 'info' | 'warning' | 'alert' | 'success'
}

export interface OrganizationMember {
  id: string
  name: string
  email: string
  role: string
  joinedAt: string
}

export interface OrganizationRecord {
  id: string
  name: string
  legalName?: string
  ownerName: string
  ownerEmail: string
  plan: string
  planTier: PlanTier
  status: OrgStatus
  createdAt: string
  currency: string
  timezone: string
  state?: string
  isLiveApiData?: boolean

  // Metadata counts (STRICTLY counts, zero financial amounts)
  counts: {
    customers: number
    invoices: number
    payments: number
    activeReminders: number
    totalUsers: number
  }

  subscription?: {
    planName: string
    billingCycle: 'monthly' | 'annually'
    periodEnd: string
    status: OrgStatus
    trialEndsAt?: string
  }

  usage?: {
    usersUsed: number
    usersLimit: number
    invoicesUsed: number
    invoicesLimit: number
    aiTokensUsed: number
    aiTokensLimit: number
  }

  members?: OrganizationMember[]

  auditLogs?: {
    id: string
    action: string
    actor: string
    timestamp: string
    summary: string
  }[]
}

export interface OrganizationStats {
  total: number
  active: number
  trial: number
  suspended: number
  closed: number
}
