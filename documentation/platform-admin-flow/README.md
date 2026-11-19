# FinPilot AI — Platform Admin Panel: Complete Flow & Architecture Documentation

> **Target Audience:** Engineering Team, Product Architects, Security Auditors, and AI Assistants (ChatGPT, Claude).  
> **Repository:** FinPilot AI Platform  
> **Documentation Location:** `documentation/platform-admin-flow/`  
> **Generation Date:** November 2026

---

## 1. Executive Summary

The **FinPilot AI Platform Admin Panel** is an enterprise-grade administrative control plane that operates alongside the multi-tenant FinPilot AI financial SaaS platform. It provides platform operators, site reliability engineers, support teams, and executive administrators with centralized visibility, tenant lifecycle management, usage telemetry, AI cost tracking, and zero-trust support access.

### Core Architectural Guarantees
1. **Strict Tenant Separation:** The Platform Admin portal is decoupled from tenant workspace state. Admin routes reside strictly under `/admin/*`, isolated from customer accounts.
2. **Zero-Trust Financial Privacy Boundary:** Platform staff can view aggregate metrics, telemetry counts, and metadata (e.g., number of invoices, quota usage, status), but **never** see customer financial records, bank statements, or line-item tax invoices.
3. **Multi-Tier Role-Based Access Control (RBAC):** Gated by server-side verification (`is_staff`, `is_superuser`), with granular staff operational roles (`super_admin`, `platform_admin`, `support_agent`, `analyst`).
4. **Dual-Mode Data Strategy:** Live Django REST Framework API endpoints (`/api/v1/admin/*`) backed by high-fidelity fallback telemetry and simulation data for seamless development and offline operation.

---

## 2. Documentation Map

This documentation suite is organized into dedicated reference guides:

| File | Title | Description |
|---|---|---|
| [`01_ARCHITECTURE_OVERVIEW.md`](file:///c:/Users/ankit/OneDrive/Desktop/FinPilotAi-latest/documentation/platform-admin-flow/01_ARCHITECTURE_OVERVIEW.md) | **System Architecture & Data Boundary** | Full system topology, SPA + DRF split, isolation principles, dual-mode API design, and security architecture. |
| [`02_AUTHENTICATION_AND_ROLES.md`](file:///c:/Users/ankit/OneDrive/Desktop/FinPilotAi-latest/documentation/platform-admin-flow/02_AUTHENTICATION_AND_ROLES.md) | **Sign In, Session & Role Verification** | Step-by-step walkthrough from `/admin` entry to session creation, CSRF token handling, server verification, and role gating. |
| [`03_NAVIGATION_AND_PAGES.md`](file:///c:/Users/ankit/OneDrive/Desktop/FinPilotAi-latest/documentation/platform-admin-flow/03_NAVIGATION_AND_PAGES.md) | **Navigation Shell & Page Routing** | Route catalog, `AppRouter` mechanics, `AdminLayout`, `AdminSidebar`, `AdminHeader`, breadcrumb navigation, and mobile drawer. |
| [`04_MODULES_AND_FUNCTIONALITY.md`](file:///c:/Users/ankit/OneDrive/Desktop/FinPilotAi-latest/documentation/platform-admin-flow/04_MODULES_AND_FUNCTIONALITY.md) | **Module Features & Interactions** | Deep dive into all 13 modules (Dashboard, Organizations, Users, Subscriptions, Usage, AI Monitoring, Reminders, Operations, Audit Logs, Settings, Support Access, Plans, Staff). |
| [`05_API_AND_DATA_CONTRACTS.md`](file:///c:/Users/ankit/OneDrive/Desktop/FinPilotAi-latest/documentation/platform-admin-flow/05_API_AND_DATA_CONTRACTS.md) | **API Contracts & Data Schemas** | Backend DRF endpoints, models, serializers, permissions, and frontend `adminApi.ts` client contracts. |
| [`06_FLOWCHARTS_AND_DIAGRAMS.md`](file:///c:/Users/ankit/OneDrive/Desktop/FinPilotAi-latest/documentation/platform-admin-flow/06_FLOWCHARTS_AND_DIAGRAMS.md) | **Visual Flowcharts & Sequence Diagrams** | Complete collection of Mermaid diagrams covering authentication, role verification, navigation, and support access workflows. |

---

## 3. Platform Admin Codebase File Index

### Frontend Implementation (`frontend/src/admin/`)

```text
frontend/src/
├── app/
│   └── AppRouter.tsx                         # Core router separating Tenant App vs Platform Admin portal
└── admin/
    ├── components/
    │   ├── AdminBreadcrumb.tsx               # Contextual breadcrumb trail
    │   ├── AdminButton.tsx                   # Design-system standardized buttons (primary, secondary, outline, ghost, danger)
    │   ├── AdminConfirmDialog.tsx            # Standardized confirmation modals (suspend, revoke, pause, etc.)
    │   ├── AdminDataTable.tsx                # Reusable paginated data table
    │   ├── AdminDropdown.tsx                 # Standardized popover & dropdown menu
    │   ├── AdminHeader.tsx                   # Top navigation bar, search, notification dropdown, profile menu
    │   ├── AdminModal.tsx                    # Shared modal container
    │   ├── AdminSelect.tsx                   # Custom styled single-select dropdown
    │   ├── AdminSidebar.tsx                  # 5-section collapsible sidebar with RBAC indicator & mobile drawer
    │   ├── AdminStatCard.tsx                 # KPI summary stat card with trend indicator
    │   ├── AdminTableActionMenu.tsx          # Consistent 3-dot row action popover
    │   └── StatusBadge.tsx                   # Color-coded status badge for orgs, subscriptions, & jobs
    ├── hooks/
    │   ├── useAdminAuth.ts                   # Platform session verification, login, logout, and error states
    │   └── useAdminPermissions.ts            # Client-side RBAC permission evaluator
    ├── layouts/
    │   └── AdminLayout.tsx                   # Platform Admin main layout container (header + sidebar + body)
    ├── pages/
    │   ├── auth/
    │   │   ├── RoleSelection.tsx             # Staff role entry portal (/admin)
    │   │   ├── AdminLogin.tsx                # Staff credential submission (/admin/login)
    │   │   └── AdminMFA.tsx                  # Multi-factor authentication prompt (ready for hardware key/TOTP)
    │   ├── AIMonitoring.tsx                  # LLM token telemetry, cost breakdown, & global AI kill-switch
    │   ├── AuditLogs.tsx                     # Immutable security audit log viewer
    │   ├── Dashboard.tsx                     # Executive overview, KPI cards, subscription ring, activity feed
    │   ├── Notifications.tsx                 # System announcements & broadcast manager
    │   ├── Operations.tsx                    # Background task workers (Celery), queue health, cron monitor
    │   ├── OrganizationDetail.tsx            # Single tenant drill-down (members, usage limits, audit trail)
    │   ├── Organizations.tsx                 # Multi-tenant directory with status filters & search
    │   ├── Plans.tsx                         # Subscription plan editor (Super Admin restricted)
    │   ├── Reminders.tsx                     # Payment reminder engine monitor (WhatsApp/Email queues)
    │   ├── Settings.tsx                      # Platform runtime settings (maintenance mode, rate limits)
    │   ├── StaffRoles.tsx                    # Staff user administration & role assignment (Super Admin restricted)
    │   ├── Subscriptions.tsx                 # Subscription overview, MRR analytics, plan modifications
    │   ├── SupportAccess.tsx                 # Zero-trust time-bound tenant impersonation & audit
    │   ├── Usage.tsx                         # Aggregate resource consumption quotas & tenant overrides
    │   └── Users.tsx                         # Cross-tenant customer user directory & account status
    ├── permissions/
    │   └── adminRoles.ts                     # RBAC role definitions, descriptions, & permission matrices
    ├── services/
    │   ├── adminApi.ts                       # Dual-mode API client with live DRF endpoints & mock merge
    │   └── mockDataService.ts                # Centralized high-fidelity simulation and telemetry dataset
    ├── styles/
    │   └── admin.css                         # Platform Admin design tokens, glassmorphism, responsive styles
    └── types/
        └── admin.types.ts                    # TypeScript domain definitions for all admin entities
```

### Backend Implementation (`backend/platform_admin/` & `backend/config/`)

```text
backend/
├── config/
│   └── urls.py                               # Base URL routing mounting platform_admin at api/v1/
└── platform_admin/
    ├── apps.py                               # Django AppConfig for platform_admin
    ├── filters.py                            # Custom DRF query filters for admin tables
    ├── models.py                             # Platform admin specific database models
    ├── pagination.py                         # Standardized pagination handlers
    ├── permissions.py                        # IsStaffPermission & future RBAC classes
    ├── serializers.py                        # DRF serializers for admin entities
    ├── urls.py                               # Mounted admin endpoints (/api/v1/admin/*)
    ├── views.py                              # Legacy view exports for backward compatibility
    ├── services/
    │   ├── metric_service.py                 # Telemetry aggregation & platform analytics
    │   └── support_service.py                # Zero-trust support access & session token generation
    ├── tests/
    │   └── test_admin_permissions.py         # Permission and auth test suite
    └── views/
        ├── __init__.py                       # Active DRF view controllers (org_list, user_list, audit_log_admin)
        ├── auth_views.py                     # admin_me & admin_logout session controllers
        ├── ai_views.py                       # Modular stub for AI telemetry
        ├── audit_views.py                    # Modular stub for platform audit logs
        ├── dashboard_views.py                # Modular stub for dashboard metrics
        ├── org_views.py                      # Modular stub for organization management
        ├── plan_views.py                     # Modular stub for pricing plans
        ├── staff_views.py                    # Modular stub for staff access control
        ├── support_views.py                  # Modular stub for zero-trust impersonation
        └── user_views.py                     # Modular stub for user controls
```

---

## 4. Quick Context for External AI (ChatGPT / Claude)

If you are using ChatGPT or Claude to extend or inspect this project, share this prompt summary:

```text
FinPilot AI is a dual-application financial platform:
1. Tenant App: Multi-tenant GST billing, invoicing, payments, bank reconciliation, and cash flow forecasting.
2. Platform Admin: Administrative SaaS control plane (/admin) for staff to monitor all tenants, subscriptions, usage limits, AI costs, and background operations.

Key Boundaries:
- React Frontend: AppRouter.tsx gates /admin routes into AdminPortal, completely separate from the tenant App.tsx.
- Auth Flow: Users visit /admin (RoleSelection.tsx) -> choose Platform Admin -> /admin/login (AdminLogin.tsx) -> authenticate via Django POST /api/v1/auth/login/ -> verify staff privileges via GET /api/v1/admin/me/ (requires is_staff or is_superuser) -> store session and enter /admin/dashboard.
- RBAC: super_admin has full access; platform_admin manages orgs, users, subscriptions, usage, AI, reminders, and audit logs, but is blocked from /admin/plans and /admin/staff.
- Data Isolation: Zero-trust privacy—platform admins can inspect telemetry, usage counts, and metadata, but never tenant invoice contents or sensitive financial records.
- API Design: Dual-mode client (adminApi.ts) connects to live Django DRF endpoints (/api/v1/admin/*) with seamless fallback to simulated telemetry (mockDataService.ts) when running in demo/offline mode.
```

