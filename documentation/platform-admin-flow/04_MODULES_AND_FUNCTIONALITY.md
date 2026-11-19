# 04 — Module Features & Interactions

> **Document:** `documentation/platform-admin-flow/04_MODULES_AND_FUNCTIONALITY.md`  
> **Topic:** Detailed Functional Breakdown of all 13 Platform Admin Modules

---

## 1. Dashboard (`Dashboard.tsx`)
- **Route:** `/admin/dashboard`
- **Component File:** `frontend/src/admin/pages/Dashboard.tsx`
- **Purpose:** Executive overview and platform operational heartbeat.
- **Key Features:**
  - **KPI Stat Cards (`AdminStatCard`):**
    * *Total Organizations:* 1,248 (+12.5% MoM).
    * *Total Users:* 8,642 (+8.2% MoM).
    * *Active Subscriptions:* 986 (+6.4% MoM).
    * *AI Requests Today:* 42.8K (+18.3% MoM).
  - **Subscription Health Ring:** Visual distribution breakdown of Active (79%), Free Trial (13%), Past Due (8%), and Closed accounts.
  - **Recent Platform Activity Feed:** Chronological live stream of tenant registrations, subscription upgrades, team member additions, and overdue notices.
  - **Dashboard Toolbar:** "Demo Data Active" pill, manual "Refresh" button, and 30-day date selector.

---

## 2. Organizations Management (`Organizations.tsx` & `OrganizationDetail.tsx`)
- **Routes:** `/admin/organizations` and `/admin/organizations?id=:id`
- **Component Files:** 
  - `frontend/src/admin/pages/Organizations.tsx`
  - `frontend/src/admin/pages/OrganizationDetail.tsx`
- **Purpose:** Centralized directory of all customer business entities.
- **Features & Interactions:**
  - **Search & Filter Toolbar:** Real-time text search (name, owner, email) + status filter (`All`, `Active`, `Trial`, `Suspended`, `Closed`).
  - **Summary Stat Cards:** Total, Active, In Trial, Suspended, and Closed tenant counts.
  - **Data Table:** Name, Legal Entity Name, Owner Contact, Plan Tier, Member Count, Status Badge, and Action Menu.
  - **Row Action Menu (`AdminTableActionMenu`):**
    * *View Details:* Deep-links to `/admin/organizations?id=:id`.
    * *Change Subscription:* Opens tier upgrade/downgrade modal.
    * *Suspend Organization:* Destructive action triggering `AdminConfirmDialog` requiring a documented reason.
    * *Grant Support Access:* Navigates directly to zero-trust session creation.
  - **Organization Detail Drill-down:**
    * Header with back button, legal name, GST state code, and registered date.
    * **Usage Quota Meters:** Invoices created vs plan limit, team members vs limit, and AI tokens consumed.
    * **Member Roster Table:** Name, email, assigned tenant role (Business Owner, Finance Manager, GST Accountant), and join date.
    * **Tenant Audit Trail:** Historical audit records filtered strictly to that organization's operational scope.

---

## 3. Users Directory (`Users.tsx`)
- **Route:** `/admin/users`
- **Component File:** `frontend/src/admin/pages/Users.tsx`
- **Purpose:** Global customer user directory across all registered organizations.
- **Features & Interactions:**
  - **Filters:** Search by name/email + Filter by Organization + Filter by Status (`Active`, `Suspended`, `Pending Invitation`).
  - **Telemetry Shown:** Full Name, Email, Organization Name, Tenant Role, Status, Last Login timestamp, and Active Sessions count.
  - **Actions:**
    * *Deactivate / Suspend User:* Opens `AdminConfirmDialog` to immediately revoke session credentials.
    * *Force Password Reset:* Dispatches reset email.
    * *Unlock Account:* Clears failed login counter lockouts.

---

## 4. Subscriptions & Billing Telemetry (`Subscriptions.tsx`)
- **Route:** `/admin/subscriptions`
- **Component File:** `frontend/src/admin/pages/Subscriptions.tsx`
- **Purpose:** Monitor subscription health, billing cycles, renewals, and revenue telemetry.
- **Features & Interactions:**
  - **Key Metrics:** Monthly Recurring Revenue (MRR), Active Paid Subscriptions, In-Trial Tenants, and Overdue Accounts.
  - **Status Tabs:** Quick filter by `All`, `Active`, `In Trial`, `Past Due`, `Cancelled`.
  - **Table Telemetry:** Tenant Name, Plan Name (Starter, Growth, Enterprise), Billing Cycle (Monthly / Annually), Period End Date, Auto-Renew Toggle, and MRR.
  - **Interactive Actions:**
    * *Extend Free Trial:* Extends trial by 7, 14, or 30 days via modal.
    * *Change Plan Tier:* Instantly upgrade or downgrade tenant plan.
    * *Cancel Subscription:* Flag subscription for termination at end of period.

---

## 5. Platform Usage & Quota Overrides (`Usage.tsx`)
- **Route:** `/admin/usage`
- **Component File:** `frontend/src/admin/pages/Usage.tsx`
- **Purpose:** Prevent system abuse, monitor quota consumption, and manage temporary limit exemptions.
- **Features & Interactions:**
  - **Threshold Warnings:** Automatic visual flagging for tenants exceeding 80% and 100% of plan limits.
  - **Tracked Dimensions:**
    * User seats used / allowed.
    * Monthly invoices generated / allowed.
    * AI token consumption / allowed.
    * WhatsApp/SMS reminder messages sent / allowed.
  - **Temporary Limit Override Modal:** Allows platform administrators to grant temporary quota expansions (e.g., +500 invoices for high-volume month-end closing) with documented justification and expiry dates.

---

## 6. AI Monitoring & Cost Governance (`AIMonitoring.tsx`)
- **Route:** `/admin/ai-monitoring`
- **Component File:** `frontend/src/admin/pages/AIMonitoring.tsx`
- **Purpose:** Oversight of LLM token consumption, inference latency, error rates, and API cost control.
- **Features & Interactions:**
  - **Global AI Kill-Switch:** Emergency toggle that immediately suspends all AI assistant API calls across all tenants if an unexpected loop or cost spike occurs.
  - **Telemetry Cards:** Total Requests Today, Input Tokens, Output Tokens, Estimated Spend (USD), and API Error Rate.
  - **Model Breakdown:** Request volume and token distribution across models (Gemini Pro, Gemini Flash, Claude).
  - **Tenant AI Table:** Per-organization token consumption, primary model, error rate, and per-tenant AI disable switch.

---

## 7. Payment Reminders Engine (`Reminders.tsx`)
- **Route:** `/admin/reminders`
- **Component File:** `frontend/src/admin/pages/Reminders.tsx`
- **Purpose:** Health monitoring for the automated invoice payment reminder scheduling engine.
- **Features & Interactions:**
  - **Engine Status Banner:** Active status indicator with a "Pause Scheduler Engine" global control.
  - **Telemetry:** Active reminder schedules, messages queued for dispatch today, success delivery rate (WhatsApp/Email/SMS).
  - **Queue Inspection Table:** Tenant Name, Invoice Ref, Recipient Contact, Target Channel, Scheduled Delivery Time, Retry Count, and Queue Status.
  - **Troubleshooting Actions:** Retry failed reminder message, view dispatch logs, force immediate delivery.

---

## 8. Background Operations & Celery Workers (`Operations.tsx`)
- **Route:** `/admin/operations`
- **Component File:** `frontend/src/admin/pages/Operations.tsx`
- **Purpose:** SRE and DevOps monitoring for asynchronous job queues and scheduled cron tasks.
- **Features & Interactions:**
  - **Worker Cluster Status:** Health of Celery worker nodes, active concurrency, and queue latency.
  - **Job Queue Telemetry:** Ingestion jobs (Excel/CSV bank statements), recurring invoice generation jobs, GST sync tasks, and export compilation.
  - **Queue Action:** Trigger manual retry for failed tasks; flush dead-letter queues.

---

## 9. Security Audit Logs (`AuditLogs.tsx`)
- **Route:** `/admin/audit-logs`
- **Component File:** `frontend/src/admin/pages/AuditLogs.tsx`
- **Purpose:** Immutable compliance and forensic security log across all tenants and platform staff.
- **Features & Interactions:**
  - **Multi-Vector Filtering:** Filter by Actor (staff email or tenant user), Entity Type (Organization, User, Subscription, Support Access), and Action type.
  - **Table Columns:** Timestamp, Actor, Organization, Action (`auth.login`, `org.suspended`, `plan.updated`, `support.session_started`), Summary, and IP Address.
  - **Compliance Export:** Export filtered log sets to JSON or CSV for audit compliance.

---

## 10. Platform Notifications & Broadcasts (`Notifications.tsx`)
- **Route:** `/admin/notifications`
- **Component File:** `frontend/src/admin/pages/Notifications.tsx`
- **Purpose:** Broadcast global banners, planned maintenance notices, and critical announcements to tenant dashboards.
- **Features & Interactions:**
  - **Broadcast Composer:** Create announcements targeting `All Tenants`, specific `Plan Tiers`, or individual `Organizations`.
  - **Severity Levels:** `Info`, `Warning`, `Critical / Maintenance`.
  - **Schedule Controls:** Specify start and automatic retirement timestamps.

---

## 11. Global Platform Settings (`Settings.tsx`)
- **Route:** `/admin/settings`
- **Component File:** `frontend/src/admin/pages/Settings.tsx`
- **Purpose:** Runtime configuration of platform behavior without requiring backend redeployment.
- **Features & Interactions:**
  - **Maintenance Mode:** System-wide toggle to display maintenance landing pages to tenant users while leaving admin operational.
  - **Security Controls:** Session timeout threshold (15m, 30m, 1h, 4h), staff IP whitelisting rules, and mandatory 2FA enforcement.
  - **Rate Limiting:** Global rate limit thresholds for tenant API consumers.

---

## 12. Support Access & Zero-Trust Impersonation (`SupportAccess.tsx`)
- **Route:** `/admin/support-access`
- **Component File:** `frontend/src/admin/pages/SupportAccess.tsx`
- **Purpose:** Strictly audited, time-bound impersonation for technical support diagnostics.
- **Features & Interactions:**
  - **Session Requirements:** Staff must select target tenant, specify a valid support ticket ID, and choose a duration limit (15m, 30m, 1h, 2h).
  - **Active Sessions Table:** Real-time countdown timer showing remaining valid session minutes.
  - **Emergency Revoke:** Single-click "Revoke Session" modal that immediately invalidates session tokens.
  - **Full Logging:** Every support access grant, extension, and revocation is written directly to the immutable audit log.

---

## 13. Super Admin Restricted Modules (`Plans.tsx` & `StaffRoles.tsx`)
- **Routes:** `/admin/plans` and `/admin/staff`
- **Component Files:**
  - `frontend/src/admin/pages/Plans.tsx`
  - `frontend/src/admin/pages/StaffRoles.tsx`
- **Role Requirement:** `super_admin` **ONLY**.
- **Features:**
  - **Plans Editor:** Configure pricing (INR/USD), feature limits (max users, monthly invoices, token allowances), and self-serve availability.
  - **Staff Management:** Invite internal platform operators, assign operational roles (`platform_admin`, `support_agent`, `analyst`), and revoke staff access.
  - **Platform Admin Behavior:** If a `platform_admin` navigates to either route, they are automatically intercepted and redirected to `/admin/dashboard` with an access denial alert.

