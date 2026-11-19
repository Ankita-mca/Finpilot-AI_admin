/**
 * Centralized Platform Admin Mock & Telemetry Data Service
 * Provides realistic demonstration data across all 14 Platform Admin modules.
 * Explicitly labeled as DEMO / TELEMETRY SIMULATION DATA.
 */
import type {
  OrgStatus, PlanTier, AdminRole
} from '../types/admin.types'

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
  planName: string
  planTier: PlanTier
  status: OrgStatus
  billingCycle: 'monthly' | 'annually'
  periodStart: string
  periodEnd: string
  autoRenew: boolean
  mrrPaise: number // For reference / metadata only
  history: {
    date: string
    event: string
    details: string
  }[]
}

export interface UsageRecord {
  organizationId: string
  organizationName: string
  planTier: PlanTier
  usersUsed: number
  usersLimit: number
  invoicesUsed: number
  invoicesLimit: number
  messagesUsed: number
  messagesLimit: number
  aiTokensUsed: number
  aiTokensLimit: number
  hasWarning: boolean // >80% threshold
  hasExceeded: boolean
  activeOverride?: {
    resourceType: string
    overrideLimit: number
    reason: string
    expiresAt: string
  }
}

export interface AIMonitoringData {
  totalRequestsToday: number
  totalRequestsMonth: number
  inputTokensToday: number
  outputTokensToday: number
  totalTokensMonth: number
  estimatedCostUsd: number
  errorRatePercent: number
  globalKillSwitchActive: boolean
  modelUsage: {
    model: string
    requests: number
    tokens: number
    sharePct: number
  }[]
  organizationUsage: {
    organizationId: string
    organizationName: string
    primaryModel: string
    requestsToday: number
    tokensToday: number
    errorRate: number
    isAiDisabled: boolean
  }[]
  dailyTrends: {
    date: string
    requests: number
    tokensK: number
    errors: number
  }[]
}

export interface ReminderJobRecord {
  id: string
  organizationId: string
  organizationName: string
  channel: 'WhatsApp' | 'Email' | 'SMS'
  status: 'sent' | 'failed' | 'pending' | 'blocked'
  recipientsCount: number
  scheduledAt: string
  completedAt?: string
  failureReason?: string
}

export interface ReminderOverview {
  totalJobs: number
  sentCount: number
  failedCount: number
  pendingCount: number
  blockedCount: number
  automaticRemindersActive: boolean
  channelBreakdown: { channel: string; sent: number; failed: number }[]
  orgActivity: {
    organizationId: string
    organizationName: string
    activeSchedules: number
    dispatchedThisMonth: number
    successRate: number
    status: 'active' | 'paused'
  }[]
}

export interface OperationJobRecord {
  id: string
  type: 'import' | 'export' | 'forecast' | 'reconciliation' | 'reminder_cron'
  organizationName: string
  organizationId: string
  status: 'completed' | 'failed' | 'in_progress' | 'retrying'
  createdAt: string
  durationSec: number
  sanitizedError?: string
  retryCount: number
}

export interface AuditLogRecord {
  id: string
  timestamp: string
  actor: string
  actorRole: string
  action: string
  entityType: string
  entityId: string
  targetOrg?: string
  result: 'success' | 'denied' | 'failed'
  requestId: string
  summary: string
  reason?: string
}

export interface NotificationRecord {
  id: string
  category: 'subscription' | 'usage' | 'ai_error' | 'failed_job' | 'support_access'
  title: string
  message: string
  timestamp: string
  read: boolean
  severity: 'alert' | 'warning' | 'info' | 'success'
  actionUrl?: string
}

export interface PlatformSettingsState {
  globalAiEnabled: boolean
  globalEmailEnabled: boolean
  automaticRemindersEnabled: boolean
  newSignupsEnabled: boolean
  maintenanceMode: boolean
  maintenanceBannerText: string
  defaultTrialDays: number
  aiDailyRateLimitPerOrg: number
  sessionTimeoutMinutes: number
}

export interface SupportAccessRequest {
  id: string
  ticketId: string
  organizationId: string
  organizationName: string
  requestedByAgent: string
  agentEmail: string
  scope: 'read_settings' | 'reconciliation_diagnostics' | 'ingestion_debug'
  reason: string
  status: 'pending' | 'active' | 'expired' | 'revoked'
  requestedAt: string
  expiresAt: string
  approvedBy?: string
}

export interface PlanRecord {
  id: string
  tier: PlanTier
  name: string
  description: string
  priceMonthlyInr: number
  priceAnnualInr: number
  maxUsers: number
  maxInvoicesMonth: number
  maxMessagesMonth: number
  maxAiTokensMonth: number
  activeSubscribers: number
  status: 'active' | 'archived'
}

export interface PlatformStaffRecord {
  id: string
  name: string
  email: string
  role: AdminRole
  status: 'active' | 'suspended'
  twoFactorEnabled: boolean
  lastLogin: string
  createdAt: string
}

// ============================================================================
// DATA COLLECTIONS (DEMO / SIMULATION)
// ============================================================================

export const MOCK_USERS: UserRecord[] = [
  { id: 'usr-1', name: 'Rahul Sharma', email: 'rahul@acme.com', organizationName: 'Acme Industries Pvt Ltd', organizationId: 'de042d83-8642-40b9-abe3-9f1aae4f28f0', roleInOrg: 'Business Owner', status: 'active', lastLogin: '10 minutes ago', createdAt: '2026-10-12', sessionsActive: 2 },
  { id: 'usr-2', name: 'Priya Verma', email: 'priya.v@acme.com', organizationName: 'Acme Industries Pvt Ltd', organizationId: 'de042d83-8642-40b9-abe3-9f1aae4f28f0', roleInOrg: 'Finance Manager', status: 'active', lastLogin: '3 hours ago', createdAt: '2026-10-15', sessionsActive: 1 },
  { id: 'usr-3', name: 'Ankita Mohanty', email: 'ankitamohanty020@gmail.com', organizationName: 'Vanguard Logistics Corp', organizationId: '0609ee71-f978-4196-9fac-ce5aa0959629', roleInOrg: 'Business Owner', status: 'active', lastLogin: '1 hour ago', createdAt: '2026-11-01', sessionsActive: 3 },
  { id: 'usr-4', name: 'Karan Mehra', email: 'karan@zenithtech.io', organizationName: 'Zenith Tech Solutions', organizationId: '9b3f4120-7a8e-4d22-9844-31eef4a87211', roleInOrg: 'Business Owner', status: 'active', lastLogin: 'Yesterday', createdAt: '2026-11-10', sessionsActive: 1 },
  { id: 'usr-5', name: 'Vikram Chawla', email: 'vikram@apexretail.in', organizationName: 'Apex Retail Distribution', organizationId: '81c0021b-41f2-49da-a212-0fe923984180', roleInOrg: 'Business Owner', status: 'suspended', lastLogin: '12 days ago', createdAt: '2026-08-14', sessionsActive: 0 },
  { id: 'usr-6', name: 'Ritu Mohanty', email: 'ankitamohanty024@gmail.com', organizationName: 'BlueStar Pharma Traders', organizationId: '1ff52f0c-3815-457f-ab36-f5416aed0815', roleInOrg: 'Business Owner', status: 'active', lastLogin: '2 days ago', createdAt: '2026-11-16', sessionsActive: 1 },
  { id: 'usr-7', name: 'Amit Shah', email: 'amit@shahbrothers.in', organizationName: 'Shah Logistics', organizationId: 'sh-101', roleInOrg: 'Accountant', status: 'pending', lastLogin: 'Never', createdAt: '2026-11-17', sessionsActive: 0 },
  { id: 'usr-8', name: 'Deepak Rao', email: 'deepak@deccanmills.com', organizationName: 'Deccan Fabricators & Mills', organizationId: '3f9202ba-94a1-4288-bf12-429910019283', roleInOrg: 'Viewer', status: 'suspended', lastLogin: '45 days ago', createdAt: '2026-05-20', sessionsActive: 0 },
]

export const MOCK_SUBSCRIPTIONS: SubscriptionRecord[] = [
  { id: 'sub-1', organizationId: 'de042d83-8642-40b9-abe3-9f1aae4f28f0', organizationName: 'Acme Industries Pvt Ltd', planName: 'Growth Plan', planTier: 'growth', status: 'active', billingCycle: 'monthly', periodStart: '2026-11-12', periodEnd: '2026-12-12', autoRenew: true, mrrPaise: 499900, history: [{ date: '2026-11-12', event: 'Recurring Renewal', details: 'Paid via Razorpay' }, { date: '2026-10-12', event: 'Initial Upgrade', details: 'Upgraded from Starter' }] },
  { id: 'sub-2', organizationId: '0609ee71-f978-4196-9fac-ce5aa0959629', organizationName: 'Vanguard Logistics Corp', planName: 'Business Plan', planTier: 'business', status: 'active', billingCycle: 'annually', periodStart: '2026-11-01', periodEnd: '2027-11-01', autoRenew: true, mrrPaise: 1499900, history: [{ date: '2026-11-01', event: 'Annual Contract Activated', details: 'Direct Invoice' }] },
  { id: 'sub-3', organizationId: '9b3f4120-7a8e-4d22-9844-31eef4a87211', organizationName: 'Zenith Tech Solutions', planName: 'Starter Plan (Trial)', planTier: 'starter', status: 'trial', billingCycle: 'monthly', periodStart: '2026-11-10', periodEnd: '2026-11-24', autoRenew: false, mrrPaise: 0, history: [{ date: '2026-11-10', event: 'Trial Initialized', details: '14-Day Free Period' }] },
  { id: 'sub-4', organizationId: '81c0021b-41f2-49da-a212-0fe923984180', organizationName: 'Apex Retail Distribution', planName: 'Growth Plan', planTier: 'growth', status: 'past_due', billingCycle: 'monthly', periodStart: '2026-10-14', periodEnd: '2026-11-14', autoRenew: true, mrrPaise: 499900, history: [{ date: '2026-11-14', event: 'Payment Failed', details: 'Attempt 3 of 3 failed' }, { date: '2026-10-14', event: 'Payment Successful', details: 'Razorpay Auto-charge' }] },
  { id: 'sub-5', organizationId: '3f9202ba-94a1-4288-bf12-429910019283', organizationName: 'Deccan Fabricators & Mills', planName: 'Enterprise Plan', planTier: 'enterprise', status: 'closed', billingCycle: 'annually', periodStart: '2025-05-19', periodEnd: '2026-05-19', autoRenew: false, mrrPaise: 4999900, history: [{ date: '2026-05-19', event: 'Terminated', details: 'Voluntary Cancellation' }] },
]

export const MOCK_USAGE: UsageRecord[] = [
  { organizationId: 'de042d83-8642-40b9-abe3-9f1aae4f28f0', organizationName: 'Acme Industries Pvt Ltd', planTier: 'growth', usersUsed: 4, usersLimit: 10, invoicesUsed: 420, invoicesLimit: 500, messagesUsed: 890, messagesLimit: 1000, aiTokensUsed: 460000, aiTokensLimit: 500000, hasWarning: true, hasExceeded: false, activeOverride: { resourceType: 'invoices', overrideLimit: 600, reason: 'Fiscal year-end volume surge', expiresAt: '2026-12-31' } },
  { organizationId: '0609ee71-f978-4196-9fac-ce5aa0959629', organizationName: 'Vanguard Logistics Corp', planTier: 'business', usersUsed: 8, usersLimit: 25, invoicesUsed: 820, invoicesLimit: 2500, messagesUsed: 1200, messagesLimit: 5000, aiTokensUsed: 340000, aiTokensLimit: 1000000, hasWarning: false, hasExceeded: false },
  { organizationId: '9b3f4120-7a8e-4d22-9844-31eef4a87211', organizationName: 'Zenith Tech Solutions', planTier: 'starter', usersUsed: 2, usersLimit: 3, invoicesUsed: 48, invoicesLimit: 50, messagesUsed: 92, messagesLimit: 100, aiTokensUsed: 96000, aiTokensLimit: 100000, hasWarning: true, hasExceeded: false },
  { organizationId: '81c0021b-41f2-49da-a212-0fe923984180', organizationName: 'Apex Retail Distribution', planTier: 'growth', usersUsed: 5, usersLimit: 10, invoicesUsed: 512, invoicesLimit: 500, messagesUsed: 1020, messagesLimit: 1000, aiTokensUsed: 504000, aiTokensLimit: 500000, hasWarning: true, hasExceeded: true },
]

export const MOCK_AI_MONITORING: AIMonitoringData = {
  totalRequestsToday: 1420,
  totalRequestsMonth: 38650,
  inputTokensToday: 1845000,
  outputTokensToday: 620000,
  totalTokensMonth: 78500000,
  estimatedCostUsd: 184.20,
  errorRatePercent: 0.42,
  globalKillSwitchActive: false,
  modelUsage: [
    { model: 'gemini-1.5-flash', requests: 1140, tokens: 1650000, sharePct: 67 },
    { model: 'gemini-1.5-pro', requests: 220, tokens: 710000, sharePct: 29 },
    { model: 'gemini-flash-lite', requests: 60, tokens: 105000, sharePct: 4 },
  ],
  organizationUsage: [
    { organizationId: 'de042d83-8642-40b9-abe3-9f1aae4f28f0', organizationName: 'Acme Industries Pvt Ltd', primaryModel: 'gemini-1.5-flash', requestsToday: 480, tokensToday: 460000, errorRate: 0.2, isAiDisabled: false },
    { organizationId: '0609ee71-f978-4196-9fac-ce5aa0959629', organizationName: 'Vanguard Logistics Corp', primaryModel: 'gemini-1.5-pro', requestsToday: 510, tokensToday: 890000, errorRate: 0.1, isAiDisabled: false },
    { organizationId: '9b3f4120-7a8e-4d22-9844-31eef4a87211', organizationName: 'Zenith Tech Solutions', primaryModel: 'gemini-1.5-flash', requestsToday: 98, tokensToday: 96000, errorRate: 0.8, isAiDisabled: false },
    { organizationId: '81c0021b-41f2-49da-a212-0fe923984180', organizationName: 'Apex Retail Distribution', primaryModel: 'gemini-1.5-flash', requestsToday: 12, tokensToday: 14000, errorRate: 4.2, isAiDisabled: true },
  ],
  dailyTrends: [
    { date: '12 Nov', requests: 1120, tokensK: 1980, errors: 4 },
    { date: '13 Nov', requests: 1280, tokensK: 2150, errors: 6 },
    { date: '14 Nov', requests: 1390, tokensK: 2310, errors: 5 },
    { date: '15 Nov', requests: 940, tokensK: 1540, errors: 2 },
    { date: '16 Nov', requests: 880, tokensK: 1420, errors: 3 },
    { date: '17 Nov', requests: 1480, tokensK: 2600, errors: 7 },
    { date: '18 Nov', requests: 1420, tokensK: 2465, errors: 6 },
  ],
}

export const MOCK_REMINDERS_DATA: ReminderOverview = {
  totalJobs: 1840,
  sentCount: 1680,
  failedCount: 42,
  pendingCount: 88,
  blockedCount: 30,
  automaticRemindersActive: true,
  channelBreakdown: [
    { channel: 'WhatsApp', sent: 1240, failed: 18 },
    { channel: 'Email', sent: 390, failed: 14 },
    { channel: 'SMS', sent: 50, failed: 10 },
  ],
  orgActivity: [
    { organizationId: 'de042d83-8642-40b9-abe3-9f1aae4f28f0', organizationName: 'Acme Industries Pvt Ltd', activeSchedules: 4, dispatchedThisMonth: 480, successRate: 98.2, status: 'active' },
    { organizationId: '0609ee71-f978-4196-9fac-ce5aa0959629', organizationName: 'Vanguard Logistics Corp', activeSchedules: 8, dispatchedThisMonth: 820, successRate: 99.1, status: 'active' },
    { organizationId: '9b3f4120-7a8e-4d22-9844-31eef4a87211', organizationName: 'Zenith Tech Solutions', activeSchedules: 1, dispatchedThisMonth: 42, successRate: 95.0, status: 'active' },
    { organizationId: '81c0021b-41f2-49da-a212-0fe923984180', organizationName: 'Apex Retail Distribution', activeSchedules: 0, dispatchedThisMonth: 0, successRate: 0, status: 'paused' },
  ],
}

export const MOCK_OPERATIONS_JOBS: OperationJobRecord[] = [
  { id: 'job-9841', type: 'import', organizationName: 'Acme Industries Pvt Ltd', organizationId: 'de042d83-8642-40b9-abe3-9f1aae4f28f0', status: 'completed', createdAt: '2026-11-18 14:20', durationSec: 14, retryCount: 0 },
  { id: 'job-9840', type: 'reconciliation', organizationName: 'Vanguard Logistics Corp', organizationId: '0609ee71-f978-4196-9fac-ce5aa0959629', status: 'completed', createdAt: '2026-11-18 13:50', durationSec: 42, retryCount: 0 },
  { id: 'job-9839', type: 'forecast', organizationName: 'Acme Industries Pvt Ltd', organizationId: 'de042d83-8642-40b9-abe3-9f1aae4f28f0', status: 'failed', createdAt: '2026-11-18 11:15', durationSec: 180, sanitizedError: 'Insufficient history data for 90-day projection (code: ERR_INSUFFICIENT_SAMPLES)', retryCount: 2 },
  { id: 'job-9838', type: 'reminder_cron', organizationName: 'System Platform Cron', organizationId: 'system', status: 'completed', createdAt: '2026-11-18 10:00', durationSec: 8, retryCount: 0 },
  { id: 'job-9837', type: 'export', organizationName: 'BlueStar Pharma Traders', organizationId: '1ff52f0c-3815-457f-ab36-f5416aed0815', status: 'completed', createdAt: '2026-11-18 09:30', durationSec: 5, retryCount: 0 },
  { id: 'job-9836', type: 'import', organizationName: 'Apex Retail Distribution', organizationId: '81c0021b-41f2-49da-a212-0fe923984180', status: 'failed', createdAt: '2026-11-17 18:40', durationSec: 62, sanitizedError: 'Malformed CSV header: Missing mandatory GSTIN column (code: ERR_CSV_SCHEMA)', retryCount: 1 },
]

export const MOCK_AUDIT_LOGS: AuditLogRecord[] = [
  { id: 'aud-801', timestamp: '2026-11-18 15:35:23', actor: 'ankitamohanty020@gmail.com', actorRole: 'Platform Admin', action: 'auth.login_failed', entityType: 'user', entityId: 'ankitamohanty020@gmail.com', result: 'denied', requestId: 'req-8f921a', summary: 'Failed login attempt via admin gateway' },
  { id: 'aud-800', timestamp: '2026-11-18 15:20:10', actor: 'admin@finpilot.ai', actorRole: 'Platform Admin', action: 'auth.login', entityType: 'user', entityId: 'usr-admin', result: 'success', requestId: 'req-7a812c', summary: 'Platform admin session established' },
  { id: 'aud-799', timestamp: '2026-11-18 14:10:00', actor: 'rahul@acme.com', actorRole: 'Tenant Owner', action: 'invoice.created', entityType: 'invoice', entityId: 'inv-4821', targetOrg: 'Acme Industries Pvt Ltd', result: 'success', requestId: 'req-6b441e', summary: 'Created new tax invoice document' },
  { id: 'aud-798', timestamp: '2026-11-18 12:45:12', actor: 'platform_ops', actorRole: 'System Cron', action: 'billing.retry_failed', entityType: 'subscription', entityId: 'sub-4', targetOrg: 'Apex Retail Distribution', result: 'failed', requestId: 'req-5c991a', summary: 'Recurring subscription debit attempt failed' },
  { id: 'aud-797', timestamp: '2026-11-18 09:30:00', actor: 'priya.v@acme.com', actorRole: 'Finance Manager', action: 'reminder.dispatched', entityType: 'reminder', entityId: 'rem-912', targetOrg: 'Acme Industries Pvt Ltd', result: 'success', requestId: 'req-4d112b', summary: 'Dispatched automated WhatsApp reminder' },
  { id: 'aud-796', timestamp: '2026-11-17 16:15:00', actor: 'support.agent@finpilot.ai', actorRole: 'Support Agent', action: 'support.access_requested', entityType: 'ticket', entityId: 'tkt-482', targetOrg: 'Acme Industries Pvt Ltd', result: 'success', requestId: 'req-3e440c', summary: 'Requested temporary 2-hour settings diagnostics' },
]

export const MOCK_NOTIFICATIONS: NotificationRecord[] = [
  { id: 'notif-1', category: 'failed_job', title: 'Background Forecast Job Failed', message: 'Job #job-9839 for Acme Industries encountered an insufficient history error.', timestamp: '4 hours ago', read: false, severity: 'alert', actionUrl: '/admin/operations' },
  { id: 'notif-2', category: 'usage', title: 'Organization Near Quota (88%)', message: 'Acme Industries has consumed 460k of 500k allocated Gemini AI tokens.', timestamp: '5 hours ago', read: false, severity: 'warning', actionUrl: '/admin/usage' },
  { id: 'notif-3', category: 'support_access', title: 'Support Access Request Awaiting Review', message: 'Agent Priya Sen requested read-only settings inspection for Ticket #FP-8492.', timestamp: '6 hours ago', read: false, severity: 'info', actionUrl: '/admin/support-access' },
  { id: 'notif-4', category: 'subscription', title: 'Subscription Payment Overdue', message: 'Apex Retail Distribution monthly renewal failed after 3 automated retries.', timestamp: 'Yesterday', read: true, severity: 'warning', actionUrl: '/admin/subscriptions' },
  { id: 'notif-5', category: 'ai_error', title: 'AI Token Threshold Reached', message: 'Apex Retail hit 100% token limit. AI assistant temporarily halted for this tenant.', timestamp: '2 days ago', read: true, severity: 'alert', actionUrl: '/admin/ai-monitoring' },
]

export const MOCK_SETTINGS: PlatformSettingsState = {
  globalAiEnabled: true,
  globalEmailEnabled: true,
  automaticRemindersEnabled: true,
  newSignupsEnabled: true,
  maintenanceMode: false,
  maintenanceBannerText: 'FinPilot AI scheduled platform maintenance is active. Read-only mode enabled.',
  defaultTrialDays: 14,
  aiDailyRateLimitPerOrg: 2000,
  sessionTimeoutMinutes: 60,
}

export const MOCK_SUPPORT_REQUESTS: SupportAccessRequest[] = [
  { id: 'req-1', ticketId: 'FP-8492', organizationId: 'de042d83-8642-40b9-abe3-9f1aae4f28f0', organizationName: 'Acme Industries Pvt Ltd', requestedByAgent: 'Priya Sen', agentEmail: 'priya.sen@finpilot.ai', scope: 'read_settings', reason: 'Customer reported issue connecting custom GST rounding rules', status: 'pending', requestedAt: '2026-11-18 10:30', expiresAt: '2026-11-18 12:30' },
  { id: 'req-2', ticketId: 'FP-8310', organizationId: '0609ee71-f978-4196-9fac-ce5aa0959629', organizationName: 'Vanguard Logistics Corp', requestedByAgent: 'Vikram Joshi', agentEmail: 'vikram.j@finpilot.ai', scope: 'reconciliation_diagnostics', reason: 'Diagnosing unallocated bank payment batch sync failure', status: 'active', requestedAt: '2026-11-18 09:00', expiresAt: '2026-11-18 17:00', approvedBy: 'admin@finpilot.ai' },
  { id: 'req-3', ticketId: 'FP-7901', organizationId: '81c0021b-41f2-49da-a212-0fe923984180', organizationName: 'Apex Retail Distribution', requestedByAgent: 'Priya Sen', agentEmail: 'priya.sen@finpilot.ai', scope: 'ingestion_debug', reason: 'CSV import schema mismatch troubleshooting', status: 'expired', requestedAt: '2026-11-16 14:00', expiresAt: '2026-11-16 16:00', approvedBy: 'admin@finpilot.ai' },
]

export const MOCK_PLANS: PlanRecord[] = [
  { id: 'pln-1', tier: 'starter', name: 'Starter Plan', description: 'Essential receivables and reminder tools for solo entrepreneurs and micro-businesses.', priceMonthlyInr: 1499, priceAnnualInr: 14990, maxUsers: 3, maxInvoicesMonth: 50, maxMessagesMonth: 100, maxAiTokensMonth: 100000, activeSubscribers: 18, status: 'active' },
  { id: 'pln-2', tier: 'growth', name: 'Growth Plan', description: 'Comprehensive payment recovery, automated WhatsApp reminders, and AI Assistant for growing MSMEs.', priceMonthlyInr: 4999, priceAnnualInr: 49990, maxUsers: 10, maxInvoicesMonth: 500, maxMessagesMonth: 1000, maxAiTokensMonth: 500000, activeSubscribers: 22, status: 'active' },
  { id: 'pln-3', tier: 'business', name: 'Business Plan', description: 'Advanced reconciliation, high-volume multi-GSTIN workflows, and dedicated collector roles.', priceMonthlyInr: 14999, priceAnnualInr: 149990, maxUsers: 25, maxInvoicesMonth: 2500, maxMessagesMonth: 5000, maxAiTokensMonth: 1000000, activeSubscribers: 8, status: 'active' },
  { id: 'pln-4', tier: 'enterprise', name: 'Enterprise Plan', description: 'Custom ERP integrations, dedicated SLA, custom AI models, and unlimited team seats.', priceMonthlyInr: 49999, priceAnnualInr: 499990, maxUsers: 100, maxInvoicesMonth: 10000, maxMessagesMonth: 25000, maxAiTokensMonth: 5000000, activeSubscribers: 3, status: 'active' },
]

export const MOCK_STAFF: PlatformStaffRecord[] = [
  { id: 'stf-1', name: 'Super Admin Operator', email: 'superadmin@finpilot.ai', role: 'super_admin', status: 'active', twoFactorEnabled: true, lastLogin: '10 minutes ago', createdAt: '2026-01-01' },
  { id: 'stf-2', name: 'Platform Operations Admin', email: 'admin@finpilot.ai', role: 'platform_admin', status: 'active', twoFactorEnabled: true, lastLogin: 'Just now', createdAt: '2026-03-15' },
  { id: 'stf-3', name: 'Priya Sen', email: 'priya.sen@finpilot.ai', role: 'support_agent', status: 'active', twoFactorEnabled: true, lastLogin: '2 hours ago', createdAt: '2026-06-01' },
  { id: 'stf-4', name: 'Vikram Joshi', email: 'vikram.j@finpilot.ai', role: 'support_agent', status: 'active', twoFactorEnabled: false, lastLogin: 'Yesterday', createdAt: '2026-07-10' },
  { id: 'stf-5', name: 'Ananya Roy', email: 'ananya.r@finpilot.ai', role: 'analyst', status: 'active', twoFactorEnabled: true, lastLogin: '3 days ago', createdAt: '2026-08-01' },
  { id: 'stf-6', name: 'Former Contractor', email: 'temp.dev@finpilot.ai', role: 'support_agent', status: 'suspended', twoFactorEnabled: false, lastLogin: '65 days ago', createdAt: '2026-02-10' },
]

// ============================================================================
// APPROVED OVERVIEW DASHBOARD DEMO DATASET
// Explicitly labeled DEMO / TELEMETRY SIMULATION DATA
// ============================================================================

export interface DashboardKpiItem {
  id: string
  title: string
  value: string
  growth: string
  growthType: 'positive' | 'negative' | 'neutral'
  period: string
  iconName: 'Building' | 'Users' | 'CreditCard' | 'BrainCircuit'
}

export interface SubscriptionOverviewData {
  active: number
  trial: number
  pastDue: number
  total: number
  activePct: number
  trialPct: number
  pastDuePct: number
}

export interface PlatformActivityPoint {
  date: string
  signups: number
  activeOrgs: number
}

export interface AiUsageOverviewData {
  totalRequests: string
  inputTokens: string
  outputTokens: string
  totalTokens: string
  failedRequests: number
  errorRate: string
  models: {
    name: string
    sharePct: number
    requests: string
    tokens: string
    color: string
  }[]
  dailyTrend: {
    day: string
    requests: number
    tokensM: number
  }[]
}

export interface OperationalHealthMetric {
  id: string
  title: string
  value: string | number
  status: 'healthy' | 'warning' | 'critical'
  note: string
  targetPath: string
}

export interface ImportantAlertItem {
  id: string
  title: string
  entityName: string
  timestamp: string
  severity: 'warning' | 'critical' | 'alert' | 'info'
  linkPath: string
  linkLabel: string
}

export interface RecentOrgActivityItem {
  id: string
  organizationName: string
  activity: string
  timestamp: string
  status: 'active' | 'trial' | 'pastDue' | 'suspended'
  statusLabel: string
  orgId: string
}

export const OVERVIEW_DASHBOARD_DATA = {
  isDemoData: true,
  dataNotice: 'Demonstration telemetry dataset for Platform Admin interface verification',

  // Section 4: KPI Summary Cards
  summaryCards: [
    {
      id: 'kpi-orgs',
      title: 'Total Organizations',
      value: '1,248',
      growth: '+12.5%',
      growthType: 'positive' as const,
      period: 'vs previous period',
      iconName: 'Building' as const,
    },
    {
      id: 'kpi-users',
      title: 'Total Customers',
      value: '8,642',
      growth: '+8.2%',
      growthType: 'positive' as const,
      period: 'vs previous period',
      iconName: 'Users' as const,
    },
    {
      id: 'kpi-subscriptions',
      title: 'Active Subscriptions',
      value: '986',
      growth: '+6.4%',
      growthType: 'positive' as const,
      period: 'vs previous period',
      iconName: 'CreditCard' as const,
    },
    {
      id: 'kpi-ai-requests',
      title: 'AI Requests',
      value: '42.8K',
      growth: '+18.3%',
      growthType: 'positive' as const,
      period: 'vs previous period',
      iconName: 'BrainCircuit' as const,
    },
  ],

  // Section 5: Subscription Overview
  subscriptionOverview: {
    active: 986,
    trial: 162,
    pastDue: 100,
    total: 1248,
    activePct: 79.0,
    trialPct: 13.0,
    pastDuePct: 8.0,
  } as SubscriptionOverviewData,

  // Section 6: Platform Activity Trends (7d, 30d, 90d)
  activityTrends: {
    '7d': [
      { date: '12 Nov', signups: 16, activeOrgs: 962 },
      { date: '13 Nov', signups: 19, activeOrgs: 968 },
      { date: '14 Nov', signups: 24, activeOrgs: 974 },
      { date: '15 Nov', signups: 18, activeOrgs: 977 },
      { date: '16 Nov', signups: 22, activeOrgs: 980 },
      { date: '17 Nov', signups: 29, activeOrgs: 983 },
      { date: '18 Nov', signups: 35, activeOrgs: 986 },
    ] as PlatformActivityPoint[],
    '30d': [
      { date: '21 Oct', signups: 12, activeOrgs: 890 },
      { date: '25 Oct', signups: 18, activeOrgs: 905 },
      { date: '29 Oct', signups: 21, activeOrgs: 918 },
      { date: '02 Nov', signups: 25, activeOrgs: 932 },
      { date: '06 Nov', signups: 28, activeOrgs: 946 },
      { date: '10 Nov', signups: 30, activeOrgs: 958 },
      { date: '14 Nov', signups: 24, activeOrgs: 974 },
      { date: '18 Nov', signups: 35, activeOrgs: 986 },
    ] as PlatformActivityPoint[],
    '90d': [
      { date: 'Aug W1', signups: 68, activeOrgs: 780 },
      { date: 'Aug W3', signups: 74, activeOrgs: 812 },
      { date: 'Sep W1', signups: 82, activeOrgs: 845 },
      { date: 'Sep W3', signups: 89, activeOrgs: 880 },
      { date: 'Oct W1', signups: 95, activeOrgs: 915 },
      { date: 'Oct W3', signups: 104, activeOrgs: 948 },
      { date: 'Nov W1', signups: 116, activeOrgs: 970 },
      { date: 'Nov W3', signups: 128, activeOrgs: 986 },
    ] as PlatformActivityPoint[],
  },

  // Section 7: AI Usage Overview
  aiUsage: {
    totalRequests: '42.8K',
    inputTokens: '28.4M',
    outputTokens: '9.6M',
    totalTokens: '38.0M',
    failedRequests: 24,
    errorRate: '0.05%',
    models: [
      { name: 'Gemini 1.5 Flash', sharePct: 68, requests: '29.1K', tokens: '25.8M', color: '#10b981' },
      { name: 'Gemini 1.5 Pro', sharePct: 26, requests: '11.1K', tokens: '9.9M', color: '#3b82f6' },
      { name: 'Gemini Flash-Lite', sharePct: 6, requests: '2.6K', tokens: '2.3M', color: '#8b5cf6' },
    ],
    dailyTrend: [
      { day: 'Wed', requests: 5800, tokensM: 5.1 },
      { day: 'Thu', requests: 6100, tokensM: 5.4 },
      { day: 'Fri', requests: 6400, tokensM: 5.8 },
      { day: 'Sat', requests: 4900, tokensM: 4.2 },
      { day: 'Sun', requests: 4500, tokensM: 3.9 },
      { day: 'Mon', requests: 7200, tokensM: 6.5 },
      { day: 'Tue', requests: 7900, tokensM: 7.1 },
    ],
  } as AiUsageOverviewData,

  // Section 8: Operational Health
  operationalHealth: [
    {
      id: 'ops-1',
      title: 'Failed Background Jobs (24h)',
      value: 2,
      status: 'warning' as const,
      note: '2 reconciliation retry queues active',
      targetPath: '/admin/operations',
    },
    {
      id: 'ops-2',
      title: 'Pending Reminder Jobs',
      value: 48,
      status: 'healthy' as const,
      note: 'Queued for delivery window',
      targetPath: '/admin/reminders',
    },
    {
      id: 'ops-3',
      title: 'Failed Reminder Jobs',
      value: 3,
      status: 'warning' as const,
      note: 'Recipient phone formatting issues',
      targetPath: '/admin/reminders',
    },
    {
      id: 'ops-4',
      title: 'Import / Export Job Status',
      value: '14 Completed / 1 Active',
      status: 'healthy' as const,
      note: 'All schemas verified',
      targetPath: '/admin/operations',
    },
    {
      id: 'ops-5',
      title: 'Platform System Alerts',
      value: 'Operational',
      status: 'healthy' as const,
      note: '99.98% platform SLA compliant',
      targetPath: '/admin/operations',
    },
  ] as OperationalHealthMetric[],

  // Section 9: Important Alerts
  importantAlerts: [
    {
      id: 'alt-trial',
      title: '14-Day Free Trial Ending Within 7 Days',
      entityName: 'Bright Solutions Pvt Ltd (Expires in 4 days)',
      timestamp: 'Today at 09:15 AM',
      severity: 'warning' as const,
      linkPath: '/admin/subscriptions',
      linkLabel: 'Inspect Subscription',
    },
    {
      id: 'alt-pastdue',
      title: 'Recurring Subscription Past-Due',
      entityName: 'Apex Retail Distribution (Attempt 3 failed)',
      timestamp: 'Today at 08:30 AM',
      severity: 'critical' as const,
      linkPath: '/admin/subscriptions',
      linkLabel: 'Manage Billing',
    },
    {
      id: 'alt-usage',
      title: 'Organization Approaching AI Quota (92%)',
      entityName: 'Acme Technologies (460K / 500K Tokens)',
      timestamp: 'Yesterday at 04:12 PM',
      severity: 'warning' as const,
      linkPath: '/admin/usage',
      linkLabel: 'Review Limits',
    },
    {
      id: 'alt-ai-error',
      title: 'AI Service Throttled Rate Limit Warning',
      entityName: 'Vertex Gemini API Endpoint (24 errors handled)',
      timestamp: 'Yesterday at 02:40 PM',
      severity: 'alert' as const,
      linkPath: '/admin/ai-monitoring',
      linkLabel: 'AI Monitoring',
    },
    {
      id: 'alt-job',
      title: 'Failed Background Job in Reconciliation Queue',
      entityName: 'Job #job-9839: Acme Technologies projection',
      timestamp: '18 Nov 11:15 AM',
      severity: 'critical' as const,
      linkPath: '/admin/operations',
      linkLabel: 'View Operations',
    },
  ] as ImportantAlertItem[],

  // Section 10: Recent Organization Activity Table
  recentActivity: [
    {
      id: 'act-1',
      organizationName: 'Acme Technologies',
      activity: 'New organization registered',
      timestamp: '12 minutes ago',
      status: 'active' as const,
      statusLabel: 'Active',
      orgId: 'de042d83-8642-40b9-abe3-9f1aae4f28f0',
    },
    {
      id: 'act-2',
      organizationName: 'Nova Enterprises',
      activity: 'Subscription upgraded to Growth Tier',
      timestamp: '45 minutes ago',
      status: 'active' as const,
      statusLabel: 'Active',
      orgId: 'nova-ent-01',
    },
    {
      id: 'act-3',
      organizationName: 'Bright Solutions',
      activity: 'Started 14-day free trial',
      timestamp: '2 hours ago',
      status: 'trial' as const,
      statusLabel: 'Trial',
      orgId: 'bright-sol-02',
    },
    {
      id: 'act-4',
      organizationName: 'Vanguard Logistics',
      activity: 'Added 4 team members with GST Accountant role',
      timestamp: '4 hours ago',
      status: 'active' as const,
      statusLabel: 'Active',
      orgId: '0609ee71-f978-4196-9fac-ce5aa0959629',
    },
    {
      id: 'act-5',
      organizationName: 'Apex Retail Distribution',
      activity: 'Recurring card payment retry failed — grace period active',
      timestamp: '6 hours ago',
      status: 'pastDue' as const,
      statusLabel: 'Past Due',
      orgId: '81c0021b-41f2-49da-a212-0fe923984180',
    },
  ] as RecentOrgActivityItem[],

  // Section 11: Quick Navigation shortcuts
  quickNavItems: [
    { id: 'nav-orgs', label: 'Organizations', path: '/admin/organizations', icon: 'Building2' },
    { id: 'nav-users', label: 'Customers', path: '/admin/users', icon: 'Users' },
    { id: 'nav-subs', label: 'Subscriptions', path: '/admin/subscriptions', icon: 'CreditCard' },
    { id: 'nav-usage', label: 'Usage', path: '/admin/usage', icon: 'BarChart3' },
    { id: 'nav-ai', label: 'AI Monitoring', path: '/admin/ai-monitoring', icon: 'Bot' },
    { id: 'nav-ops', label: 'Operations', path: '/admin/operations', icon: 'Server' },
    { id: 'nav-audit', label: 'Audit Logs', path: '/admin/audit-logs', icon: 'ScrollText' },
  ],
}


