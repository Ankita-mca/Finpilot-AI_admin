# 03 — Navigation Shell & Page Routing

> **Document:** `documentation/platform-admin-flow/03_NAVIGATION_AND_PAGES.md`  
> **Topic:** Route Table, Layout Shell, Topbar Header, Collapsible Sidebar & Breadcrumbs

---

## 1. Complete Route Catalog

All Platform Admin routes are processed within `frontend/src/app/AppRouter.tsx`. Navigation uses HTML5 History pushState and popstate event listeners without requiring heavy external router dependencies.

| Route | Component | Navigation Section | Role Requirement | Description |
|---|---|---|:---:|---|
| `/admin` | `RoleSelection.tsx` | Auth Gateway | Public / Pre-auth | Role selection portal |
| `/admin/login` | `AdminLogin.tsx` | Auth Gateway | Public / Pre-auth | Staff credential submission |
| `/admin/dashboard` | `Dashboard.tsx` | Overview | `platform_admin` / `super_admin` | Main executive overview & KPIs |
| `/admin/organizations` | `Organizations.tsx` | Management | `platform_admin` / `super_admin` | Multi-tenant company directory |
| `/admin/organizations?id=:id` | `OrganizationDetail.tsx` | Management | `platform_admin` / `super_admin` | Tenant drilldown (members, usage, logs) |
| `/admin/users` | `Users.tsx` | Management | `platform_admin` / `super_admin` | Customer user directory across orgs |
| `/admin/subscriptions` | `Subscriptions.tsx` | Management | `platform_admin` / `super_admin` | Tenant subscription & billing health |
| `/admin/usage` | `Usage.tsx` | Management | `platform_admin` / `super_admin` | Quota enforcement & resource usage |
| `/admin/ai-monitoring` | `AIMonitoring.tsx` | Monitoring | `platform_admin` / `super_admin` | Token consumption, costs, & kill-switch |
| `/admin/reminders` | `Reminders.tsx` | Monitoring | `platform_admin` / `super_admin` | WhatsApp/Email scheduler engine health |
| `/admin/operations` | `Operations.tsx` | Monitoring | `platform_admin` / `super_admin` | Background workers (Celery), cron jobs |
| `/admin/audit-logs` | `AuditLogs.tsx` | Monitoring | `platform_admin` / `super_admin` | Platform-wide security audit trail |
| `/admin/notifications` | `Notifications.tsx` | Control | `platform_admin` / `super_admin` | System broadcasts & maintenance notices |
| `/admin/settings` | `Settings.tsx` | Control | `platform_admin` / `super_admin` | Global platform config & maintenance mode |
| `/admin/support-access` | `SupportAccess.tsx` | Control | `platform_admin` / `super_admin` | Zero-trust time-bound tenant access |
| `/admin/plans` | `Plans.tsx` | Super Admin Restricted | `super_admin` **ONLY** | Subscription tiers & pricing editor |
| `/admin/staff` | `StaffRoles.tsx` | Super Admin Restricted | `super_admin` **ONLY** | Staff user roles & permissions editor |

---

## 2. Layout Shell Architecture (`AdminLayout.tsx`)

Every authenticated admin page is wrapped inside `AdminLayout.tsx` (`frontend/src/admin/layouts/AdminLayout.tsx`), ensuring a cohesive enterprise look and feel:

```text
+-----------------------------------------------------------------------------------------+
| [FinPilot AI Platform Admin]    [Global Search...]    [(🔔 3)]   [👤 Platform Admin ▼]  |  <- AdminHeader
+---------------------+-------------------------------------------------------------------+
|  OVERVIEW           |  Platform Admin / Management / Organizations                      |  <- AdminBreadcrumb
|  > Dashboard        +-------------------------------------------------------------------+
|                     |                                                                   |
|  MANAGEMENT         |  [Page Content Area: Dynamic Component based on currentPath]     |
|  > Organizations    |                                                                   |
|  > Users            |                                                                   |
|  > Subscriptions    |                                                                   |
|  > Usage            |                                                                   |
|                     |                                                                   |
|  MONITORING         |                                                                   |
|  > AI Monitoring    |                                                                   |
|  > Reminders        |                                                                   |
|  > Operations       |                                                                   |
|  > Audit Logs       |                                                                   |
|                     |                                                                   |
|  CONTROL            |                                                                   |
|  > Notifications    |                                                                   |
|  > Settings         |                                                                   |
|  > Support Access   |                                                                   |
|                     |                                                                   |
|  SUPER ADMIN        |                                                                   |
|  🔒 Plans           |                                                                   |
|  🔒 Staff Roles     |                                                                   |
+---------------------+-------------------------------------------------------------------+
| [Collapse Sidebar]  |                                                                   |
+---------------------+-------------------------------------------------------------------+
```

---

## 3. Sidebar Organization (`AdminSidebar.tsx`)

The sidebar is built with high-contrast navy dark styling (`#0f172a`), clean typography, active green indicators (`#10b981`), and clear category groupings:

1. **Header Brand Pill:** Displays "FinPilot AI" with "PLATFORM ADMIN" role indicator.
2. **Category 1: OVERVIEW**
   - **Dashboard (`/admin/dashboard`):** Icon `LayoutDashboard`.
3. **Category 2: MANAGEMENT**
   - **Organizations (`/admin/organizations`):** Icon `Building2`.
   - **Users (`/admin/users`):** Icon `Users`.
   - **Subscriptions (`/admin/subscriptions`):** Icon `CreditCard`.
   - **Usage (`/admin/usage`):** Icon `BarChart3`.
4. **Category 3: MONITORING**
   - **AI Monitoring (`/admin/ai-monitoring`):** Icon `Bot`.
   - **Reminders (`/admin/reminders`):** Icon `BellRing`.
   - **Operations (`/admin/operations`):** Icon `Server`.
   - **Audit Logs (`/admin/audit-logs`):** Icon `ScrollText`.
5. **Category 4: CONTROL**
   - **Notifications (`/admin/notifications`):** Icon `Bell`.
   - **Settings (`/admin/settings`):** Icon `Settings`.
   - **Support Access (`/admin/support-access`):** Icon `ShieldCheck`.
6. **Category 5: SUPER ADMIN RESTRICTED**
   - **Plans (`/admin/plans`):** Icon `Layers` + `Lock` badge when locked.
   - **Staff Management (`/admin/staff`):** Icon `UserCog` + `Lock` badge when locked.
7. **Footer Controls:**
   - **Collapse/Expand Toggle:** Collapses sidebar into compact icon-only mode with tooltips.
   - **Tenant App Shortcut:** "Back to App" button linking directly to `/` with `ExternalLink` icon.

---

## 4. Header Bar Organization (`AdminHeader.tsx`)

The top header bar provides persistent search, system alerts, and staff identity controls:

### Global Search Field
- Inline search icon with subtle focus ring.
- Live autocomplete dropdown showing matching organizations, users, and audit entities as the staff user types.
- Clicking any result deep-links directly to the relevant resource.

### Notifications Popover
- Notification bell with dynamic red unread counter badge.
- Interactive popover listing urgent alerts:
  * High-priority billing failures (overdue grace periods).
  * System alerts (Celery task queue retries).
  * AI token threshold warnings (>85% organization quota).
- "Mark all as read" button and "View all notifications" direct route link.

### Platform Admin Profile Menu
Clicking the user profile card opens a styled account popover:
- **Header Profile Card:**
  * Staff avatar initial circle.
  * Full name (`Platform Admin` / `Super Admin`).
  * Email address (`admin@finpilot.ai`).
  * Role badge pill (`Platform Admin` or `Super Admin`).
- **Menu Actions:**
  * **Account Settings:** Routes to `/admin/settings`.
  * **Return to Tenant App:** Switches application context back to `/`.
  * **Divider Line:** Visual delimiter.
  * **Sign Out:** Highlighted in red danger styling; terminates session and redirects to `/admin`.

