# 06 — Flowcharts & Sequence Diagrams

> **Document:** `documentation/platform-admin-flow/06_FLOWCHARTS_AND_DIAGRAMS.md`  
> **Topic:** Mermaid Architecture Diagrams, Sign-In Sequences, RBAC Decision Trees & Workflows

---

## 1. End-to-End Sign In to Platform Admin Dashboard Flow

```mermaid
flowchart TD
    Start(["User Enters /admin"]) --> RoleGate["RoleSelection Portal"]
    RoleGate --> ChooseRole{"Select Operational Role"}
    
    ChooseRole -->|Platform Admin| LoginView["AdminLogin Portal (/admin/login)"]
    ChooseRole -->|Super Admin| RestrictedNotice1["Restricted Banner: Select Platform Admin"]
    ChooseRole -->|Support Agent| RestrictedNotice2["Restricted Banner: Select Platform Admin"]
    ChooseRole -->|Analyst| RestrictedNotice3["Restricted Banner: Select Platform Admin"]
    
    RestrictedNotice1 --> RoleGate
    RestrictedNotice2 --> RoleGate
    RestrictedNotice3 --> RoleGate
    
    LoginView --> SubmitCreds["Submit Email & Password"]
    SubmitCreds --> DjangoLogin["POST /api/v1/auth/login/"]
    
    DjangoLogin --> AuthCheck{"Valid Credentials?"}
    AuthCheck -->|No| LoginError["Show Error: 'Failed to authenticate'"]
    LoginError --> LoginView
    
    AuthCheck -->|Yes| VerifyStaff["GET /api/v1/admin/me/"]
    VerifyStaff --> StaffCheck{"is_staff or is_superuser?"}
    
    StaffCheck -->|No| Denied403["403 Forbidden: Clear Session & Show Access Denied"]
    Denied403 --> LoginView
    
    StaffCheck -->|Yes| StoreSession["Store User Session in useAdminAuth State"]
    StoreSession --> RouteDashboard["Navigate to /admin/dashboard"]
    RouteDashboard --> MountShell["Mount AdminLayout Shell"]
    MountShell --> RenderDashboard["Render Dashboard KPI Cards & Telemetry"]
    RenderDashboard --> Done(["Dashboard Operational"])
```

---

## 2. Authentication & Verification Detailed Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Staff User
    participant Router as AppRouter.tsx
    participant Login as AdminLogin.tsx
    participant Hook as useAdminAuth.ts
    participant ApiClient as adminApi.ts
    participant DjangoAuth as Django Auth (/api/v1/auth/login/)
    participant DjangoMe as Django Admin (/api/v1/admin/me/)
    participant Dashboard as Dashboard.tsx

    Admin->>Router: Navigates to /admin/login
    Router->>Login: Renders login form
    Admin->>Login: Inputs admin@finpilot.ai + password
    Login->>Hook: login("admin@finpilot.ai", password)
    Hook->>ApiClient: login()
    ApiClient->>DjangoAuth: POST /api/v1/auth/login/ { username, password }
    
    alt Credential Failure
        DjangoAuth-->>ApiClient: 401 Unauthorized
        ApiClient-->>Hook: Throw AdminApiError
        Hook-->>Login: Display Error Banner
    else Credential Success
        DjangoAuth-->>ApiClient: 200 OK (Set-Cookie sessionid)
        ApiClient-->>Hook: Auth acknowledged
        Hook->>ApiClient: me()
        ApiClient->>DjangoMe: GET /api/v1/admin/me/ (with session cookie)
        
        alt Unauthorized (Regular Tenant User)
            DjangoMe-->>ApiClient: 403 Forbidden { detail: "Access Denied" }
            ApiClient-->>Hook: Throw 403 Error
            Hook->>ApiClient: logout()
            Hook-->>Login: Display "Access Denied: Lacks Platform Admin privileges"
        else Authorized Staff
            DjangoMe-->>ApiClient: 200 OK { id, role: "platform_admin", is_staff: true }
            ApiClient-->>Hook: Return AdminUser object
            Hook-->>Router: Set adminUser state
            Router->>Dashboard: Render /admin/dashboard
            Dashboard-->>Admin: Show Platform Dashboard
        end
    end
```

---

## 3. RBAC Role Verification & Route Decision Tree

```mermaid
flowchart TD
    RouteRequest["Admin Navigates to Route"] --> CheckAuth{"Is adminUser Authenticated?"}
    
    CheckAuth -->|No| RedirectLogin["Redirect to /admin/login"]
    
    CheckAuth -->|Yes| CheckTargetRoute{"Target Route?"}
    
    CheckTargetRoute -->|/admin/plans OR /admin/staff| SuperAdminCheck{"adminUser.role === 'super_admin'?"}
    CheckTargetRoute -->|Other /admin/* Routes| AllowGeneral["Allow Navigation into AdminLayout"]
    
    SuperAdminCheck -->|Yes| AllowSuper["Render Super Admin Module"]
    SuperAdminCheck -->|No| DenyRedirect["Redirect to /admin/dashboard with Alert Banner"]
```

---

## 4. Dual-Mode Data Pipeline (Live DRF vs Mock Fallback)

```mermaid
flowchart LR
    Component["Admin UI Component"] --> CallApi["adminApi Method Call"]
    CallApi --> FetchLive["Try Live Endpoint (/api/v1/admin/*)"]
    
    FetchLive --> LiveResult{"Endpoint Accessible?"}
    
    LiveResult -->|Yes: 200 OK| MergeLogic["Map Live Records + Merge Mock Extra Telemetry"]
    LiveResult -->|No: Error / Offline| MockFallback["Load Local MOCK Data Store"]
    
    MergeLogic --> ReturnLive["Return { items, stats, isLive: true }"]
    MockFallback --> ReturnMock["Return { items, stats, isLive: false }"]
    
    ReturnLive --> RenderUI["Update React UI State"]
    ReturnMock --> RenderUI
    RenderUI --> Indicator["Toolbar displays 'Live API' or 'Demo Data Active'"]
```

---

## 5. Zero-Trust Support Access Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Platform Admin
    participant UI as SupportAccess.tsx
    participant Service as support_service.py / adminApi
    participant Audit as AuditLog Table
    actor Tenant as Customer Tenant

    Staff->>UI: Selects Tenant + Inputs Ticket ID (e.g. TICKET-9421)
    Staff->>UI: Chooses Duration (e.g., 30 Minutes)
    Staff->>UI: Clicks "Initiate Time-Bound Access"
    UI->>Service: Create Impersonation Token
    Service->>Audit: Log "support.session_started" (Actor, Tenant, Ticket, Time)
    Service-->>UI: Returns Session Token & Expiry Timestamp
    UI-->>Staff: Displays Active Session with Live Countdown Timer
    
    alt Session Normal Expiry
        Note over UI,Service: 30-Minute Timer Elapses
        Service->>Audit: Log "support.session_expired"
        UI-->>Staff: Session Auto-Terminates
    else Staff Revocation
        Staff->>UI: Clicks "Revoke Session"
        UI->>Service: Invalidate Session Token Immediately
        Service->>Audit: Log "support.session_revoked"
        UI-->>Staff: Access Terminated Instantly
    end
```

