# SPEC-001 — Tenant Users Listing: Exclude Platform Admin Accounts

**Status:** Approved  
**Created:** November 23, 2026  
**Feature area:** Platform Admin → Customers / Users page  

---

## 1. Feature Objective

The Platform Admin "Customers" page (`/admin/users`) must list only **tenant organization users** — people who have signed up and joined at least one business organization via a Membership record.

Platform administrators (Django `is_staff=True`) and superusers (Django `is_superuser=True`) must not appear in this listing. They are managed separately via Staff Management.

---

## 2. Current Implementation

### Backend — `platform_admin/views.py` → `user_list()`

```python
users = User.objects.prefetch_related("memberships__organization").order_by("-date_joined")
```

This fetches **all** Django users with no filter, including staff and superuser accounts.

The result loop serializes every user and includes `isStaff` and `isSuperuser` flags in the response payload.

### Frontend — `adminApi.ts` → `getUsers()`

The mapper falls back when a user has no org memberships:

```typescript
roleInOrg: primaryOrg?.role || (u.isSuperuser ? 'Super Admin' : u.isStaff ? 'Platform Admin' : 'Member'),
organizationName: primaryOrg?.orgName || 'No Organization',
```

This means a superuser with no org membership appears in the table as:
- **Role:** Super Admin  
- **Organization:** No Organization

---

## 3. Bug Description

`superadmin@finpilot.ai` (and any other staff/superuser accounts) appear in the tenant Customers table because the backend does not exclude them from the query.

---

## 4. Required Change

### Backend (the authoritative fix)

Filter the `user_list` queryset to **exclude** users where `is_staff=True` or `is_superuser=True`.

```python
users = User.objects.filter(
    is_staff=False,
    is_superuser=False,
).prefetch_related("memberships__organization").order_by("-date_joined")
```

This is a single-line queryset change. No model changes, no migrations, no other views affected.

### Why backend-only is the right approach

- The backend is the authoritative source. Filtering at the frontend would only hide results visually but still expose staff data via the API response.
- The fix is minimal, reversible, and does not touch any other module.
- No change to user accounts, no deletion, no modification of auth logic.

---

## 5. Functional Requirements

1. `GET /api/v1/admin/users/` must return only users where `is_staff=False` AND `is_superuser=False`.
2. All users with at least one active org Membership must continue to appear.
3. Users who registered but have not yet created an organization (no memberships) should still appear — they are tenant users, just not yet in an org.
4. Staff and superuser accounts must be absent from the response.
5. Existing org/role information for tenant users must remain correct.

---

## 6. Acceptance Criteria

| # | Test | Expected |
|---|---|---|
| AC-1 | Business Owner with active org membership | ✅ Appears |
| AC-2 | Finance Manager / Accountant / Viewer in org | ✅ Appears |
| AC-3 | Regular user with no org yet | ✅ Appears (no org) |
| AC-4 | `is_superuser=True` user | ❌ Does not appear |
| AC-5 | `is_staff=True` user | ❌ Does not appear |
| AC-6 | Org/role info for existing tenant users | ✅ Unchanged |
| AC-7 | Frontend page renders without error | ✅ |

---

## 7. Files Changed

| File | Change |
|---|---|
| `backend/platform_admin/views.py` | Add `.filter(is_staff=False, is_superuser=False)` to `user_list` queryset |

No frontend changes required. No migrations required. No model changes.

---

## 8. Risk Assessment

**Risk:** Low  
- Single-line queryset filter  
- No destructive operation  
- No schema change  
- Fully reversible  
- Does not affect any other endpoint or module  

---

## 9. Out of Scope

- Implementing actual staff management (add/remove staff) — separate feature
- Password reset / session revoke actions (currently demo-only) — separate feature
- Pagination improvements — separate feature
