# 05 — API Contracts & Data Schemas

> **Document:** `documentation/platform-admin-flow/05_API_AND_DATA_CONTRACTS.md`  
> **Topic:** Backend Endpoints, Request/Response Payloads, Serializers, and TypeScript Domain Models

---

## 1. Backend API Endpoints (`backend/platform_admin/`)

The platform admin backend views are mounted under `api/v1/` in `backend/config/urls.py` via `path("api/v1/", include("platform_admin.urls"))`.

### 1. Staff Session Verification
- **Path:** `GET /api/v1/admin/me/`
- **File:** `backend/platform_admin/views/auth_views.py`
- **Permissions:** `IsAuthenticated`
- **Logic:**
  * If `request.user.is_superuser`: returns role `"super_admin"`.
  * If `request.user.is_staff`: returns role `"platform_admin"`.
  * Otherwise: returns HTTP `403 Forbidden`.
- **Response Payload (200 OK):**
```json
{
  "id": 1,
  "email": "admin@finpilot.ai",
  "full_name": "Platform Administrator",
  "role": "platform_admin",
  "is_staff": true,
  "is_superuser": false
}
```
- **Response Payload (403 Forbidden):**
```json
{
  "detail": "Access Denied: You do not have Platform Admin privileges.",
  "role": null
}
```

---

### 2. Staff Sign Out
- **Path:** `POST /api/v1/admin/auth/logout/`
- **File:** `backend/platform_admin/views/auth_views.py`
- **Permissions:** AllowAny (checks `is_authenticated` internally)
- **Response Payload (200 OK):**
```json
{
  "detail": "Signed out from Platform Admin"
}
```

---

### 3. Multi-Tenant Organizations
- **Path:** `GET /api/v1/admin/orgs/`
- **File:** `backend/platform_admin/views/__init__.py`
- **Permissions:** `IsAuthenticated`, `IsStaffPermission`
- **Response Payload (200 OK):**
```json
[
  {
    "id": "de042d83-8642-40b9-abe3-9f1aae4f28f0",
    "name": "Acme Industries Pvt Ltd",
    "status": "active",
    "default_currency": "INR",
    "created_at": "2026-10-12T10:30:00Z"
  }
]
```

---

### 4. Cross-Tenant Customer Users
- **Path:** `GET /api/v1/admin/users/`
- **File:** `backend/platform_admin/views/__init__.py`
- **Permissions:** `IsAuthenticated`, `IsStaffPermission`
- **Response Payload (200 OK):**
```json
[
  {
    "id": 101,
    "email": "rahul@acme.com",
    "full_name": "Rahul Sharma",
    "is_active": true,
    "date_joined": "2026-10-12T10:30:00Z"
  }
]
```

---

### 5. Platform Audit Logs
- **Path:** `GET /api/v1/admin/audit-logs/`
- **File:** `backend/platform_admin/views/__init__.py`
- **Permissions:** `IsAuthenticated`, `IsStaffPermission`
- **Response Payload (200 OK):**
```json
[
  {
    "id": 501,
    "organization": "Acme Industries Pvt Ltd",
    "actor": "admin@finpilot.ai",
    "action": "org.plan_updated",
    "entity_type": "Organization",
    "entity_id": "de042d83-8642-40b9-abe3-9f1aae4f28f0",
    "summary": "Upgraded tenant to Growth Plan",
    "created_at": "2026-11-19T08:15:00Z"
  }
]
```

---

## 2. Frontend Client Contracts (`adminApi.ts`)

The frontend API client (`frontend/src/admin/services/adminApi.ts`) exposes strongly-typed async methods:

```typescript
export const adminApi = {
  csrf: () => Promise<void>,
  login: (email: string, password: string) => Promise<{ detail: string }>,
  me: () => Promise<AdminUser>,
  logout: () => Promise<void>,
  getOrganizations: () => Promise<{
    items: OrganizationRecord[]
    stats: OrganizationStats
    isLive: boolean
  }>,
  getOrganizationDetail: (id: string) => Promise<OrganizationRecord | null>,
  getDashboardStats: () => Promise<DashboardStats>,
  getSubscriptionOverview: () => Promise<SubscriptionOverviewData>,
  getRecentActivity: () => Promise<PlatformActivity[]>,
}
```

---

## 3. Core TypeScript Domain Interfaces (`admin.types.ts`)

```typescript
export type AdminRole = 'super_admin' | 'platform_admin' | 'support_agent' | 'analyst'
export type OrgStatus = 'active' | 'trial' | 'suspended' | 'closed'
export type PlanTier = 'free' | 'starter' | 'growth' | 'enterprise'

export interface AdminUser {
  id: number | string
  email: string
  full_name?: string
  role: AdminRole
  is_staff?: boolean
  is_superuser?: boolean
  avatar_url?: string
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
  state: string
  isLiveApiData?: boolean
  counts: {
    customers: number
    invoices: number
    payments: number
    activeReminders: number
    totalUsers: number
  }
  subscription: {
    planName: string
    billingCycle: 'monthly' | 'annually'
    periodEnd: string
    status: string
  }
  usage: {
    usersUsed: number
    usersLimit: number
    invoicesUsed: number
    invoicesLimit: number
    aiTokensUsed: number
    aiTokensLimit: number
  }
  members: OrganizationMember[]
  auditLogs: OrganizationAuditLog[]
}

export interface PlatformActivity {
  id: string
  type: 'org_registered' | 'user_login' | 'payment_overdue' | 'system_alert'
  title: string
  description: string
  timestamp: string
  severity: 'info' | 'success' | 'warning' | 'danger'
}
```

