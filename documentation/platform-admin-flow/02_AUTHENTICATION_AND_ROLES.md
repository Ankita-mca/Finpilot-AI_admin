# 02 — Authentication, Sessions & Role Verification

> **Document:** `documentation/platform-admin-flow/02_AUTHENTICATION_AND_ROLES.md`  
> **Topic:** Sign-In Sequence, Session Management, Role Enforcement & RBAC Matrix

---

## 1. Authentication Flow: Step-by-Step

The Platform Admin sign-in process is a gated, multi-stage workflow designed to prevent regular tenant users from discovering or authenticating against platform operational interfaces.

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Staff Member
    participant Browser as Browser
    participant Router as AppRouter.tsx
    participant RolePage as RoleSelection.tsx
    participant LoginPage as AdminLogin.tsx
    participant Hook as useAdminAuth.ts
    participant Api as adminApi.ts
    participant BackendAuth as Django Auth (/api/v1/auth/login/)
    participant BackendMe as Django Admin Me (/api/v1/admin/me/)
    participant Dashboard as Dashboard.tsx

    Staff->>Browser: Enters URL: /admin
    Browser->>Router: Mounts AdminPortal
    Router->>RolePage: Renders RoleSelection
    Staff->>RolePage: Selects "Platform Admin"
    RolePage->>Router: Navigates to /admin/login
    Router->>LoginPage: Renders AdminLogin Form
    Staff->>LoginPage: Inputs email (admin@finpilot.ai) & password
    LoginPage->>Hook: login(email, password)
    Hook->>Api: adminApi.login(email, password)
    Api->>BackendAuth: POST /api/v1/auth/login/
    
    alt Invalid Credentials
        BackendAuth-->>Api: 400 Bad Request / 401 Unauthorized
        Api-->>Hook: Throws AdminApiError
        Hook-->>LoginPage: Sets error state
        LoginPage-->>Staff: Displays "Failed to authenticate. Please check your credentials."
    else Valid Credentials
        BackendAuth-->>Api: 200 OK (Session Cookie set)
        Hook->>Api: adminApi.me()
        Api->>BackendMe: GET /api/v1/admin/me/
        
        alt User lacks is_staff and is_superuser
            BackendMe-->>Api: 403 Forbidden ("You do not have Platform Admin privileges.")
            Api-->>Hook: Throws AdminApiError(403)
            Hook->>Api: adminApi.logout()
            Hook-->>LoginPage: Displays "Access Denied: Your account does not have Platform Admin privileges."
        else User is_staff or is_superuser
            BackendMe-->>Api: 200 OK { id, email, role: 'platform_admin'|'super_admin', is_staff: true }
            Api-->>Hook: Returns AdminUser object
            Hook-->>Router: Updates adminUser state (isAuthenticated = true)
            Router->>Dashboard: Renders /admin/dashboard
            Dashboard-->>Staff: Displays Platform Admin Dashboard
        end
    end
```

---

## 2. Component Implementation Details

### Stage 1: Role Selection Portal (`RoleSelection.tsx`)
- **File:** `frontend/src/admin/pages/auth/RoleSelection.tsx`
- **Route:** `/admin`
- **Purpose:** Gateway screen that forces staff to declare their operational role.
- **Available Roles in UI:**
  1. **Platform Admin (Active):** Platform operations & tenant oversight. Proceeding routes user to `/admin/login`.
  2. **Super Admin (Restricted):** Complete system governance. Currently mapped to same backend auth with role elevation.
  3. **Support Agent (Restricted in preview):** Displays notification banner: *"The Support Agent portal is restricted in this release. Please select Platform Admin."*
  4. **Analyst (Restricted in preview):** Displays notification banner: *"The Analyst portal is restricted in this release. Please select Platform Admin."*

### Stage 2: Staff Login (`AdminLogin.tsx`)
- **File:** `frontend/src/admin/pages/auth/AdminLogin.tsx`
- **Route:** `/admin/login`
- **Purpose:** Secure credential entry form.
- **Key Features:**
  - Client-side email RFC 5322 regex validation.
  - Password visibility toggle (`Eye` / `EyeOff` icons).
  - "Remember this device for 30 days" toggle.
  - "Forgot staff credentials?" simulation flow with auto-dismissing confirmation banner.
  - Integrated `AdminButton` with synchronous submission spinner.
  - Auto-redirection: If `adminUser` is already authenticated, `/admin/login` automatically pushes to `/admin/dashboard`.

### Stage 3: Authentication Hook (`useAdminAuth.ts`)
- **File:** `frontend/src/admin/hooks/useAdminAuth.ts`
- **Purpose:** Encapsulates the entire lifecycle of an admin session.
- **Methods:**
  - `checkSession()`: Executes on mount. Calls `adminApi.me()`. If user role does not match `platform_admin` or `super_admin`, sets a 403 Forbidden state.
  - `login(email, password)`: Submits credentials, then invokes `adminApi.me()` to verify staff rights. If unauthorized, immediately triggers `adminApi.logout()` to destroy the unauthorized cookie session.
  - `logout()`: Terminates backend session and clears React state.
  - `clearError()`: Resets transient error messages.

---

## 3. Backend Verification Logic

### The Endpoint: `GET /api/v1/admin/me/`
- **File:** `backend/platform_admin/views/auth_views.py`
- **Permissions Required:** `rest_framework.permissions.IsAuthenticated`

```python
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_me(request):
    user = request.user
    
    # Determine platform role
    if user.is_superuser:
        role = "super_admin"
    elif user.is_staff:
        role = "platform_admin"
    else:
        return Response(
            {"detail": "Access Denied: You do not have Platform Admin privileges.", "role": None},
            status=status.HTTP_403_FORBIDDEN,
        )

    return Response({
        "id": user.id,
        "email": user.email,
        "full_name": user.get_full_name() or user.username,
        "role": role,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
    })
```

### The Sign Out Endpoint: `POST /api/v1/admin/auth/logout/`
- **File:** `backend/platform_admin/views/auth_views.py`
- Flushes the Django session store for the request and expires the session cookie.

---

## 4. Role-Based Access Control (RBAC) Matrix

Defined in `frontend/src/admin/permissions/adminRoles.ts`:

| Permission Capability | Super Admin (`super_admin`) | Platform Admin (`platform_admin`) | Support Agent (`support_agent`) | Analyst (`analyst`) |
|---|:---:|:---:|:---:|:---:|
| **Access Platform Admin UI** | Yes | Yes | Yes (Upcoming) | Yes (Upcoming) |
| **Manage Organizations** | Yes | Yes | Read-Only | Read-Only |
| **Manage Customer Users** | Yes | Yes | Read-Only | No |
| **Manage Subscriptions** | Yes | Yes | No | No |
| **Manage Usage Quotas & Overrides** | Yes | Yes | No | Read-Only |
| **Monitor AI Usage & Costs** | Yes | Yes | No | Read-Only |
| **Toggle Global AI Kill-Switch** | Yes | Yes | No | No |
| **Manage Payment Reminders Engine**| Yes | Yes | No | No |
| **Inspect System Operations / Celery**| Yes | Yes | No | No |
| **Inspect Audit Logs** | Yes | Yes | Yes | Yes |
| **Manage Platform Settings** | Yes | Yes | No | No |
| **Zero-Trust Support Impersonation** | Yes | Yes | Request Only | No |
| **Manage Subscription Plans** | **YES** | **BLOCKED** | **BLOCKED** | **BLOCKED** |
| **Manage Staff Roles & Invites** | **YES** | **BLOCKED** | **BLOCKED** | **BLOCKED** |

---

## 5. Super Admin Gating in UI

Two critical modules are reserved exclusively for **Super Admins**:
1. **Plans Management (`/admin/plans`)**: Creation and pricing updates of subscription tiers.
2. **Staff Management (`/admin/staff`)**: Adding, editing, and revoking staff access.

### Route Guard in `AppRouter.tsx`:
```tsx
if (pathname === '/admin/plans' || pathname === '/admin/staff') {
  if (adminUser && adminUser.role !== 'super_admin') {
    navigate('/admin/dashboard')
  }
  // ...
}
```

### Visual Interceptor in `AdminSidebar.tsx`:
When a `platform_admin` hovers or clicks on a restricted item in the sidebar:
- A lock icon is displayed.
- Clicking the item does not navigate; instead, a notification pops up:  
  *"Super Admin Restricted: '[Module Name]' is inaccessible to Platform Admin role."*

