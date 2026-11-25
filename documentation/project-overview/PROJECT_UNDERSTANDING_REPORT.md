# FinPilot AI — Complete Project Understanding Report

**Generated:** November 23, 2026  
**Prepared by:** Kiro (AI Software Engineer)  
**Purpose:** Read-only analysis of the existing project — no code was modified.

---

## 1. Project Summary

FinPilot AI is an **AI-powered Receivables, Payment Recovery, and Cash Flow Management platform** built for Indian MSMEs. It is a multi-tenant SaaS application where each business (Organization) has its own isolated workspace. The product sits at the intersection of accounting, collections automation, and AI-driven financial analysis.

**Core value proposition:**
- Track outstanding invoices and payments
- Automate payment follow-up reminders (email/WhatsApp)
- AI Assistant for natural language financial queries
- GST-aware invoice management (CGST/SGST/IGST split)
- Platform admin portal for SaaS operations

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.0.0 | UI framework |
| TypeScript | ~5.7.2 | Type safety |
| Vite | ^6.0.7 | Build tool / dev server |
| Tailwind CSS | Inline styles via CSS file | Styling |
| Lucide React | ^0.468.0 | Icon library |
| Recharts | ^2.15.0 | Charts |
| React Markdown | ^9.1.0 | AI answer rendering |
| Vitest | ^5.1.0 | Unit tests |
| Playwright | ^1.64.1 | E2E tests |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python / Django | 5.2.18 | Web framework |
| Django REST Framework | 3.18.3 | REST API |
| PostgreSQL | — | Primary database (via psycopg3) |
| Redis | — | Celery broker + result backend |
| Celery | 5.6.3 | Background task queue |
| OpenAI SDK | 3.40.0 | AI provider integration |
| drf-spectacular | 0.30.0 | OpenAPI/Swagger docs |
| django-celery-beat | 2.9.0 | Periodic task scheduling |
| openpyxl | 3.1.5 | Excel import |
| boto3 | 1.43.120 | S3/MinIO file storage |
| google-auth | 2.37.0 | Google OAuth verification |

### Infrastructure
| Component | Purpose |
|---|---|
| PostgreSQL | Financial data persistence |
| Redis | Celery task queue + results |
| S3/MinIO | File storage (invoice imports) |
| Email provider | Reminder dispatch (console backend in dev) |
| AI provider | OpenAI / Grok / Gemini (configurable via env) |

---

## 3. Project Directory Structure

```
FinPilotAi-latest/
├── backend/                  Django backend
│   ├── config/               Django project config (settings, urls, wsgi, celery)
│   ├── core/                 Core financial models + auth (organizations, customers, invoices, payments)
│   ├── ai_assistant/         AI finance assistant (function calling, tool execution, usage logging)
│   ├── exports/              CSV export endpoints
│   ├── forecast/             Cash flow forecasting
│   ├── imports_app/          CSV/XLSX invoice import with validation
│   ├── messaging/            Message dispatch (email/WhatsApp delivery)
│   ├── notifications/        In-app notification center
│   ├── platform_admin/       Staff-only admin portal backend
│   ├── products/             Product catalog + GST rate management
│   ├── reconciliation/       Bank statement reconciliation
│   ├── reminders/            Reminder templates, policies, job queue
│   └── subscriptions/        Plan definitions + subscription lifecycle
├── frontend/
│   └── src/
│       ├── App.tsx            Main tenant application (single large component file)
│       ├── app/AppRouter.tsx  Top-level router (tenant vs admin portal)
│       ├── lib/api.ts         Typed REST API client
│       ├── components/        Shared components (MarkdownAnswer)
│       ├── styles.css         All CSS (custom properties + component styles)
│       └── admin/             Platform Admin portal
│           ├── pages/         Admin page components (15 pages)
│           ├── components/    Reusable admin UI components (12 components)
│           ├── layouts/       AdminLayout (sidebar + header wrapper)
│           ├── hooks/         useAdminAuth hook
│           ├── services/      adminApi.ts (live), mockDataService.ts (legacy demo data)
│           ├── permissions/   Role permission helpers
│           ├── types/         TypeScript types for admin domain
│           └── styles/        admin.css
├── documentation/            Project documentation (this file lives here)
├── docs/                     Architecture + data model reference docs
├── postman/                  Postman collections
└── docker-compose.yml        Local infrastructure (PostgreSQL, Redis, MinIO)
```

---

## 4. Frontend Architecture

### Routing
The app uses a **manual router** (no React Router). `AppRouter.tsx` splits traffic at the browser URL:
- Paths starting with `/admin` → `AdminPortal` component (Platform Admin)
- All other paths → `App` component (tenant application)

Admin portal navigation is also manual (`window.history.pushState`), handled inside `AppRouter.tsx` with a large `if/else` chain over pathnames.

### Tenant Application (`App.tsx`)
The entire tenant-facing application lives in a **single large file** (`App.tsx`, ~4000+ lines). It manages:
- Authentication state (login / register / forgot password / Google OAuth)
- Organization creation flow
- Main workspace with sidebar navigation
- All 10+ page views via a `Page` type union and conditional rendering

**Navigation pages available:**
`Overview`, `Invoices`, `Customers`, `Payments`, `Aging report`, `Reminders`, `AI Assistant`, `Settings`, `Notifications`, `Products`, `Customers owing`, `Due in 7 days`

**Commented-out/disabled pages:** `Reconciliation`, `Forecast`, `Audit Log`

### Admin Portal (`admin/`)
Well-structured modular code split across pages, components, layouts, hooks, and services. 15 admin pages, each in its own file.

**Admin pages:**
| Page | Path | Description |
|---|---|---|
| Dashboard | `/admin/dashboard` | Platform KPIs, recent activity |
| Organizations | `/admin/organizations` | Org list + detail view |
| Users | `/admin/users` | All platform users |
| Subscriptions | `/admin/subscriptions` | Subscription records |
| Usage | `/admin/usage` | Per-org usage vs limits |
| AI Monitoring | `/admin/ai-monitoring` | AI usage, tokens, error rates |
| Reminders | `/admin/reminders` | Reminder job overview |
| Operations | `/admin/operations` | Background tasks |
| Audit Logs | `/admin/audit-logs` | Platform-wide audit log |
| Notifications | `/admin/notifications` | Platform notifications |
| Settings | `/admin/settings` | Global platform settings |
| Support Access | `/admin/support-access` | Zero-trust support access |
| Plans | `/admin/plans` | Subscription plan management (super_admin only) |
| Staff Roles | `/admin/staff` | Staff role management (super_admin only) |

### Design System
The app uses a **custom CSS design system** in `styles.css` and `admin/styles/admin.css`. No Tailwind utility classes in JSX — all styling is through custom CSS classes with `--` CSS variables for theming. Colors are sage green / slate gray tones.

---

## 5. Backend Architecture

### Django Apps
| App | Purpose | Status |
|---|---|---|
| `core` | Organizations, memberships, customers, invoices, payments, allocations, audit log, auth | ✅ Complete |
| `products` | Product catalog + GST rate master (rate_bps, HSN/SAC) | ✅ Complete |
| `imports_app` | CSV/XLSX invoice import with validation/preview/commit flow | ✅ Complete |
| `reminders` | Templates, policies, job queue with approval workflow | ✅ Complete |
| `messaging` | MessageLog, dispatch Celery task, exponential backoff | ✅ Complete |
| `reconciliation` | Bank transaction staging, deterministic+fuzzy matching | ✅ Complete |
| `forecast` | 3-scenario cash flow forecast with historical delay calc | ✅ Complete |
| `ai_assistant` | Function-calling LLM assistant, tool execution, metadata logging | ✅ Complete |
| `notifications` | In-app notifications with deduplication | ✅ Complete |
| `subscriptions` | Plan/Subscription/BillingEvent models | ✅ Models complete, billing not integrated |
| `platform_admin` | Staff-only endpoints for SaaS operations | ✅ Complete |
| `exports` | CSV exports for invoices, customers, payments | ✅ Complete |

### Key Architectural Patterns

**Multi-tenancy:** Every request includes an `X-Organization-ID` header. The `HasOrganizationAccess` permission class resolves the organization, verifies the user's active membership, and attaches `request.membership`. Every queryset is scoped to that organization.

**Money handling:** All financial amounts stored and transmitted as **integer minor units (paise)**. `1 INR = 100 paise`. No floating-point arithmetic anywhere.

**Authentication:** Django session-based authentication + CSRF cookies. JWT is not used. Sessions expire in 30 minutes with `SESSION_SAVE_EVERY_REQUEST = True`.

**Audit logging:** Every financial mutation (create/update/void/reverse) writes an `AuditLog` row with actor, action, entity type/ID, and summary.

---

## 6. Database Schema

### Core Models (`core` app)

| Model | Key Fields | Notes |
|---|---|---|
| `Organization` | id (UUID), name, legal_name, state (GST), status, ai_disabled | Multi-tenant root |
| `Membership` | organization, user, role, active | 5 roles: owner/manager/accountant/collector/viewer |
| `Customer` | id (UUID), organization, name, gstin, state, payment_terms_days, opt_out | GSTIN validated |
| `Invoice` | id (UUID), organization, customer, invoice_number (unique per org), subtotal/discount/tax/total_minor, status (draft/issued/void), source | Financial constraints enforced at DB level |
| `InvoiceItem` | invoice, product (FK), description, quantity, unit_price_minor, gst_rate_bps, gst_cgst/sgst/igst_minor | GST split snapshotted at creation time |
| `Payment` | id (UUID), organization, customer, payment_date, amount_minor, method, idempotency_key | Bank transfer/UPI/cheque/cash/card |
| `PaymentAllocation` | payment, invoice, amount_minor, reversed_at | Soft-reversal (never deleted) |
| `AuditLog` | organization, actor, action, entity_type, entity_id, summary | BigAutoField PK |
| `SocialAccount` | user, provider (google), provider_user_id, email | Google OAuth link |

### Other App Models

| Model | App | Key Purpose |
|---|---|---|
| `Product` | `products` | Product catalog with price_minor, default_gst_rate |
| `GSTRate` | `products` | GST rate master (rate_bps = basis points, e.g. 1800 = 18%) |
| `ImportBatch` | `imports_app` | Tracks file import sessions |
| `ReminderTemplate` | `reminders` | Email/WhatsApp message templates |
| `ReminderPolicy` | `reminders` | Rules: channel, offset_days, approval_mode |
| `ReminderJob` | `reminders` | Individual reminder instance with status lifecycle |
| `MessageLog` | `messaging` | Dispatch records |
| `BankTransaction` | `reconciliation` | Staged bank transactions |
| `ReconciliationMatch` | `reconciliation` | Matched pairs |
| `AIRun` | `ai_assistant` | AI usage metadata (no content stored) |
| `Notification` | `notifications` | In-app notifications |
| `Plan` | `subscriptions` | Plan definitions (starter/growth/business/enterprise) |
| `Subscription` | `subscriptions` | Per-org subscription records |
| `BillingEvent` | `subscriptions` | Immutable billing history |

### Database Constraints
- Invoice numbers are unique per organization (`unique_invoice_number_per_org`)
- All financial amounts have check constraints (subtotal > 0, discount >= 0, etc.)
- Payment allocations are never deleted — reversals use `reversed_at` timestamp
- UUID primary keys on all financial records

---

## 7. Authentication & Authorization

### User Authentication
Two methods supported:
1. **Email/password** — Django's built-in auth. `username` field stores the email (lowercase).
2. **Google OAuth** — Full PKCE-style server-side flow: state → code exchange → ID token verification → SocialAccount link.

Registration does **not** auto-create an organization. After registration, the user is redirected to an org-creation screen (3-step onboarding).

Forgot password is **UI-only** — no backend email delivery.

### Role-Based Access Control
Five tenant roles with graduated permissions:

| Role | Read | Write Financial | Approve Reminders |
|---|---|---|---|
| `owner` | ✅ | ✅ | ✅ |
| `manager` | ✅ | ✅ | ✅ |
| `accountant` | ✅ | ✅ | ❌ |
| `collector` | ✅ | ❌ | ❌ |
| `viewer` | ✅ | ❌ | ❌ |

`WRITE_ROLES = {owner, manager, accountant}`  
`FINANCE_ROLES = {owner, manager}`

### Platform Admin Authorization
The admin portal uses the same session authentication. Access requires `is_staff = True` or `is_superuser = True` on the Django User model. The `/api/v1/admin/me/` endpoint verifies this and returns an `AdminUser` with a `role` field (`platform_admin` or `super_admin`). Pages guarded by `requireAuth()` in the frontend.

---

## 8. Organization & Tenant Management

### Organization Creation Flow
1. User registers (creates account only)
2. Redirected to `CreateOrgScreen` (Step 2 of 3)
3. User fills: org name, business email, phone, state, city, structure, industry, org_size
4. Backend creates `Organization` + `Membership(role=owner)` atomically
5. User enters main workspace

### Tenant Isolation
- **Backend**: `HasOrganizationAccess` permission class enforces org scoping on every request via the `X-Organization-ID` header.
- **Frontend**: The active org ID is stored in React state and passed as a header on every API call.
- **Database**: Every financial record has a direct `organization` FK and all querysets filter by it.

### Multi-org Support
A user can be a member of multiple organizations. `api.me()` returns a list of `organizations[]`. The frontend stores `selectedOrg` state and allows switching organizations.

---

## 9. AI Assistant Workflow

### Architecture
The AI assistant uses **LLM function calling** as the sole routing mechanism. No keyword matching, no hardcoded answers.

```
User question
    → POST /api/v1/assistant/
    → org membership verified
    → ai_disabled check
    → AI provider selected (OpenAI / Grok / Gemini via settings)
    → System prompt + question sent to LLM with tool definitions
    → LLM decides: answer directly OR call tool(s)
    → Backend executes requested tools (org-scoped, read-only)
    → Tool results returned to LLM
    → LLM generates final answer
    → answer + basis metadata returned to frontend
    → AIRun metadata logged (no question/answer content stored)
```

### AI Providers (configurable via env)
- `AI_PROVIDER=openai` → OpenAI GPT-4o-mini
- `AI_PROVIDER=grok` → Grok (via xAI API)
- `AI_PROVIDER=gemini` → Gemini 2.0 Flash (via Google API, raw HTTP to preserve `thought_signature`)

### Available Tools
Defined in `ai_assistant/tools.py` and `ai_assistant/tool_schemas.py`:
- `query_data` — General-purpose flexible query with filters, groupings, aggregations
- `get_receivables_summary` — Outstanding/overdue totals
- `get_top_overdue_customers` — Highest-balance debtors
- `get_invoices_due_range` — Invoices due in a date range
- `get_late_paying_customers` — Historical late-payers
- `get_forecast_summary` — Cash inflow projection
- `get_customer_details` — Full customer info by name
- `get_customer_invoices` — All invoices for a customer
- `get_customer_payments` — Payment history for a customer
- `get_invoice_details` — Invoice by number
- `get_payment_details` — Payment by ID
- `search_customers` — Partial name search
- `get_recent_activity` — Latest transactions

### Safety Rules
- Maximum 6 LLM iterations per request
- All tools are **read-only** — no mutations possible
- Org scoping enforced inside every tool
- AI usage metadata logged to `AIRun` model (tokens, tools used, status)
- If `org.ai_disabled = True`, request is blocked immediately with 403

---

## 10. Platform Admin / Super Admin Workflow

### Access
- Route: `/admin/*`
- Login uses the same credential flow as regular users, then verifies `is_staff` via `/api/v1/admin/me/`
- Two admin roles: `platform_admin` (staff) and `super_admin` (superuser)
- `Plans` and `Staff Roles` pages are restricted to `super_admin` only

### Admin API Endpoints (all require `is_staff`)
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/admin/me/` | GET | Verify staff session + return admin user |
| `/api/v1/admin/dashboard/` | GET | Platform KPIs (org/user/subscription/AI counts) |
| `/api/v1/admin/orgs/` | GET | All organizations with counts + subscription info |
| `/api/v1/admin/orgs/<id>/` | GET | Full org detail with members + audit logs |
| `/api/v1/admin/orgs/<id>/suspend/` | POST | Suspend or reactivate organization |
| `/api/v1/admin/orgs/<id>/ai-toggle/` | POST | Enable/disable AI for specific org |
| `/api/v1/admin/users/` | GET | All platform users |
| `/api/v1/admin/subscriptions/` | GET | All subscription records |
| `/api/v1/admin/plans/` | GET | Plan definitions |
| `/api/v1/admin/audit-logs/` | GET | Platform-wide audit log (filterable) |
| `/api/v1/admin/ai-monitoring/` | GET | AI usage stats per org/model |
| `/api/v1/admin/reminders/` | GET | Reminder job overview |
| `/api/v1/admin/usage/` | GET | Per-org usage vs plan limits |

### Mock Data Status
`mockDataService.ts` exists but is a **legacy file**. `adminApi.ts` now calls real backend endpoints directly. The `getOrganizations`, `getUsers`, `getDashboardStats`, etc. all hit live API routes.

---

## 11. API Design

### URL Patterns
All APIs are under `/api/v1/`.

**Tenant APIs** (require `X-Organization-ID` header + active membership):
```
GET/POST   /api/v1/organizations/
GET/PATCH  /api/v1/organizations/{id}/
GET/POST   /api/v1/customers/
POST       /api/v1/customers/{id}/opt-out/
GET/POST   /api/v1/invoices/
POST       /api/v1/invoices/{id}/void/
GET/POST   /api/v1/payments/
POST       /api/v1/payments/{id}/allocations/{alloc_id}/reverse/
GET        /api/v1/dashboard/
GET        /api/v1/reports/aging/
GET        /api/v1/audit-logs/
GET        /api/v1/members/
POST       /api/v1/assistant/
GET/POST   /api/v1/gst-rates/
GET/POST   /api/v1/products/
GET        /api/v1/notifications/
POST       /api/v1/notifications/mark-all-read/
GET        /api/v1/exports/invoices/
GET        /api/v1/exports/customers/
GET        /api/v1/exports/payments/
```

**Auth APIs** (no org header needed):
```
GET   /api/v1/auth/csrf/
POST  /api/v1/auth/register/
POST  /api/v1/auth/login/
POST  /api/v1/auth/logout/
GET   /api/v1/auth/me/
GET   /api/v1/auth/google/
GET   /api/v1/auth/google/callback/
```

**Platform Admin APIs** (require staff session):
```
GET   /api/v1/admin/me/
GET   /api/v1/admin/dashboard/
GET   /api/v1/admin/orgs/
...   (see Section 10)
```

**OpenAPI/Swagger:** Available at `/api/schema/swagger-ui/`

---

## 12. Implemented vs. Incomplete Features

### Fully Implemented (Backend + Frontend Connected)

| Feature | Notes |
|---|---|
| Email/password auth (login, register) | Complete |
| Google OAuth | Complete — including SocialAccount model and flow |
| Organization creation + onboarding | Complete |
| Customer CRUD | Full create/edit/opt-out |
| Invoice CRUD with line items | Full CRUD + void + GST calculation |
| GST-aware invoicing | CGST/SGST/IGST split, rate snapshot, HSN/SAC |
| Product catalog + GST rate master | Full CRUD |
| Payment recording + allocation | With reversal support |
| Dashboard (overview) | Real data: outstanding, overdue, collected, aging |
| Aging report | 5 buckets, real data |
| AI Assistant | Full function-calling flow, 3 provider options |
| Reminder templates + policies | Model complete |
| Notification center | In-app, with mark-all-read |
| CSV/XLSX invoice import | With validation, preview, commit |
| CSV export (invoices, customers, payments) | Direct download |
| Platform Admin portal | 14 pages, all backed by real APIs |
| Org suspension / AI toggle | Backend + frontend |
| Audit logging (platform-wide) | Real-time with filters |
| AI monitoring | Tokens, error rates, per-org breakdown |

### Partially Implemented

| Feature | Status | Gap |
|---|---|---|
| Reminders dispatch | Backend models + Celery task exists | UI only shows policy/template management; actual reminder sending depends on email/WhatsApp credentials |
| Reconciliation | Backend complete | Frontend page is commented out (`/* 'Reconciliation' */` in Page type) |
| Forecast | Backend complete | Frontend page is commented out (`/* 'Forecast' */` in Page type) |
| Subscription billing | Plan/Subscription models exist | No payment gateway integration (Stripe/Razorpay deferred) |
| Operations page (admin) | UI exists | Backend endpoint for Celery task status not found in platform_admin/urls.py |
| Support Access page (admin) | UI exists | No backend endpoint — appears to be UI-only/placeholder |
| Settings page (admin) | UI exists | No backend endpoint for saving global settings |
| Staff Roles page (admin) | UI exists | No backend endpoint for managing staff roles |
| Notifications page (admin) | UI exists | No backend endpoint for platform-level push notifications |
| Forgot password | Frontend only — shows "not active in this build" | No backend email delivery |

### Mock / Static Data

| Feature | Status |
|---|---|
| `mockDataService.ts` | Legacy file; `adminApi.ts` bypasses it and calls real endpoints |
| Dashboard charts | Using `recharts` with real API data |
| Plans page (admin) | Fetches from `/api/v1/admin/plans/` — real data, but plans must be seeded manually |
| `forgot password` email | Simulated 800ms delay, no real email sent |

---

## 13. Existing Documentation

| File | Content |
|---|---|
| `docs/architecture.md` | System diagram + module status table + data flow description |
| `docs/data-model.md` | ER diagram + migration guidance |
| `docs/business-rules.md` | Business rules (not read in this analysis) |
| `docs/setup-decisions.md` | Setup decisions (not read in this analysis) |
| `documentation/platform-admin-flow/` | Full Platform Admin panel flow documentation (8 files incl. HTML guide) |
| `README.md` | Project README |
| `QUICKSTART.md` | Local setup guide |
| `GOOGLE_OAUTH_SETUP.md` | Google OAuth configuration guide |
| `GOOGLE_OAUTH_ORG_ISSUE_FIX.md` | Fix notes for OAuth org creation issue |
| `FIX-AUTH-ERRORS.md` | Auth error fixes |
| `FIXES-APPLIED.md` | Historical fix notes |
| `IMPLEMENTATION_REPORT.txt` | Google OAuth implementation report |
| `IMPLEMENTATION_SUMMARY.md` | Google OAuth technical summary |

---

## 14. Technical Risks & Observations

### Risk 1: Monolithic `App.tsx`
The entire tenant application is one file (~4000+ lines). This is hard to maintain and extend. Future features should introduce component extraction, but that requires a careful refactor to avoid breaking existing state management.

### Risk 2: Commented-out features (Reconciliation, Forecast)
Both modules have complete backends but their frontend pages are commented out of the navigation type. Any future activation requires uncommenting in `App.tsx` and verifying UI still works.

### Risk 3: Missing Backend Endpoints for Several Admin Pages
`Operations`, `SupportAccess`, `Settings`, `StaffRoles`, and `Notifications` admin pages exist in the frontend but have no corresponding backend endpoints. These pages likely show static/empty UI or fail silently.

### Risk 4: Subscription Billing Not Integrated
Plan and Subscription models exist and are used for display/limit purposes, but no payment gateway (Stripe/Razorpay) is wired. Plans must be seeded into the database manually. The `price_monthly_minor`/`price_annually_minor` fields exist but no charge flow is implemented.

### Risk 5: Reminder Dispatch Depends on External Credentials
Reminder jobs enter the queue correctly but actual dispatch requires a configured email provider (`EMAIL_HOST_USER`, etc.) or WhatsApp Business API credentials. In dev, messages go to the console backend.

### Risk 6: Forgot Password Not Functional
The forgot password flow is frontend-only. It shows a success message after a fake 800ms delay. No email is ever sent. This is acknowledged in the UI: "Email delivery is not yet active in this build."

### Risk 7: Page Size Limits on API Calls
Most API calls use `?page_size=200` as a hardcoded limit. Organizations with more than 200 customers, invoices, or payments will silently show incomplete data. Proper pagination or cursor-based loading is not implemented in the frontend.

### Risk 8: AI Provider Configuration
The backend supports 3 AI providers (OpenAI, Grok, Gemini) selectable via `AI_PROVIDER` env var. If no API key is configured, the assistant returns a 503 error — there is no fallback rule-based mode (it was explicitly removed in a past refactor).

### Risk 9: Session Timeout (30 minutes)
`SESSION_COOKIE_AGE = 1800`. Inactive users are logged out after 30 minutes. The frontend handles 401 responses globally via `setUnauthenticatedHandler` and clears auth state, but there is no proactive session-expiry warning in the UI.

### Risk 10: `mockDataService.ts` Is Dead Code
The file exists and is imported nowhere relevant (all `adminApi.ts` methods call real endpoints directly). It can be safely removed but should be confirmed before deletion.

---

## 15. Local Development Setup Summary

Based on `QUICKSTART.md` and configuration files:

**Prerequisites:**
- Python 3.11+, Node.js 18+
- PostgreSQL running locally (or via Docker)
- Redis running locally (or via Docker)
- `docker-compose.yml` available for infrastructure

**Backend startup:**
```bash
cd backend
python -m venv .venv
.venv/Scripts/activate   # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend startup:**
```bash
cd frontend
npm install
npm run dev    # Runs on http://localhost:5173
```

**Environment variables required** (in `backend/.env`):
```
DJANGO_SECRET_KEY=
DB_NAME=finpilot
DB_USER=finpilot
DB_PASSWORD=
DB_HOST=127.0.0.1
OPENAI_API_KEY=   (or GEMINI_API_KEY / GROK_API_KEY)
AI_PROVIDER=openai
GOOGLE_CLIENT_ID=   (optional, for Google OAuth)
GOOGLE_CLIENT_SECRET=  (optional)
```

---

## 16. Summary Table — Feature Completeness

| Category | Feature | Backend | Frontend | Connected |
|---|---|---|---|---|
| Auth | Email/password login | ✅ | ✅ | ✅ |
| Auth | Email/password register | ✅ | ✅ | ✅ |
| Auth | Google OAuth | ✅ | ✅ | ✅ |
| Auth | Forgot password | ❌ | ✅ (UI only) | ❌ |
| Org | Create organization | ✅ | ✅ | ✅ |
| Org | Org settings | ✅ | ✅ | ✅ |
| Customers | CRUD | ✅ | ✅ | ✅ |
| Customers | Opt-out | ✅ | ✅ | ✅ |
| Invoices | CRUD + line items | ✅ | ✅ | ✅ |
| Invoices | GST calculation | ✅ | ✅ | ✅ |
| Invoices | Void | ✅ | ✅ | ✅ |
| Invoices | CSV/XLSX import | ✅ | ✅ | ✅ |
| Invoices | CSV export | ✅ | ✅ | ✅ |
| Payments | Record + allocate | ✅ | ✅ | ✅ |
| Payments | Reverse allocation | ✅ | ✅ | ✅ |
| Payments | CSV export | ✅ | ✅ | ✅ |
| Products | Catalog + GST rates | ✅ | ✅ | ✅ |
| Dashboard | KPI cards | ✅ | ✅ | ✅ |
| Dashboard | Aging report | ✅ | ✅ | ✅ |
| Reminders | Templates + policies | ✅ | ✅ | ✅ |
| Reminders | Dispatch | ✅ (Celery) | ❌ (no UI) | ⚠️ |
| Reconciliation | Bank matching | ✅ | ❌ (commented out) | ❌ |
| Forecast | Cash flow | ✅ | ❌ (commented out) | ❌ |
| AI Assistant | Natural language query | ✅ | ✅ | ✅ |
| Notifications | In-app center | ✅ | ✅ | ✅ |
| Subscriptions | Plan definitions | ✅ | ✅ (admin) | ⚠️ (read-only) |
| Subscriptions | Billing/payment | ❌ | ❌ | ❌ |
| Platform Admin | Dashboard | ✅ | ✅ | ✅ |
| Platform Admin | Organizations | ✅ | ✅ | ✅ |
| Platform Admin | Users | ✅ | ✅ | ✅ |
| Platform Admin | AI Monitoring | ✅ | ✅ | ✅ |
| Platform Admin | Audit Logs | ✅ | ✅ | ✅ |
| Platform Admin | Reminders overview | ✅ | ✅ | ✅ |
| Platform Admin | Usage | ✅ | ✅ | ✅ |
| Platform Admin | Settings | ❌ | ✅ (UI only) | ❌ |
| Platform Admin | Support Access | ❌ | ✅ (UI only) | ❌ |
| Platform Admin | Staff Roles | ❌ | ✅ (UI only) | ❌ |
| Platform Admin | Notifications | ❌ | ✅ (UI only) | ❌ |
| Platform Admin | Operations | ❌ | ✅ (UI only) | ❌ |

---

*This report was generated from a read-only analysis of the codebase. No files were modified.*
