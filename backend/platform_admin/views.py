"""
Platform administration endpoints.
Only accessible to Django staff/superuser accounts.
No unrestricted access to tenant financial data by default.
"""
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q
from django.utils import timezone
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from core.models import Organization, Membership, AuditLog
from subscriptions.models import Subscription, Plan
from reminders.models import ReminderJob
from ai_assistant.models import AIRun

User = get_user_model()


# ---------------------------------------------------------------------------
# Permission
# ---------------------------------------------------------------------------

class IsStaffPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and (request.user.is_staff or request.user.is_superuser))


def staff_required(fn):
    return api_view(["GET", "POST"])(
        permission_classes([permissions.IsAuthenticated, IsStaffPermission])(fn)
    )


# ---------------------------------------------------------------------------
# Auth views (kept here for backward compat, also in auth_views.py)
# ---------------------------------------------------------------------------

from platform_admin.views.auth_views import admin_me, admin_logout  # noqa: F401,E402


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsStaffPermission])
def dashboard_view(request):
    today = timezone.now().date()
    month_start = today.replace(day=1)

    total_orgs = Organization.objects.count()
    total_users = User.objects.filter(is_active=True).count()
    active_subscriptions = Subscription.objects.filter(status=Subscription.Status.ACTIVE).count()
    trial_subscriptions = Subscription.objects.filter(status=Subscription.Status.TRIAL).count()
    past_due_subscriptions = Subscription.objects.filter(status=Subscription.Status.PAST_DUE).count()

    ai_today = AIRun.objects.filter(created_at__date=today).count()
    ai_month = AIRun.objects.filter(created_at__date__gte=month_start).count()
    ai_errors_today = AIRun.objects.filter(
        created_at__date=today, status=AIRun.Status.FAILED
    ).count()

    # Recent activity from AuditLog
    recent_logs = AuditLog.objects.select_related("actor", "organization").order_by("-created_at")[:10]
    recent_activity = [
        {
            "id": str(l.id),
            "action": l.action,
            "organization": l.organization.name if l.organization else None,
            "actor": l.actor.email if l.actor else "system",
            "summary": l.summary,
            "created_at": l.created_at.isoformat(),
        }
        for l in recent_logs
    ]

    return Response({
        "organizations": {
            "total": total_orgs,
            "active": Organization.objects.filter(status=Organization.Status.ACTIVE).count(),
            "suspended": Organization.objects.filter(status=Organization.Status.SUSPENDED).count(),
        },
        "users": {
            "total": total_users,
        },
        "subscriptions": {
            "active": active_subscriptions,
            "trial": trial_subscriptions,
            "past_due": past_due_subscriptions,
            "total": active_subscriptions + trial_subscriptions + past_due_subscriptions,
        },
        "ai_requests": {
            "today": ai_today,
            "this_month": ai_month,
            "errors_today": ai_errors_today,
        },
        "recent_activity": recent_activity,
    })


# ---------------------------------------------------------------------------
# Organizations
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsStaffPermission])
def org_list(request):
    orgs = (
        Organization.objects
        .prefetch_related("memberships__user", "subscriptions__plan", "customers", "invoices", "reminder_jobs")
        .order_by("-created_at")
    )

    result = []
    for o in orgs:
        # Owner
        owner_membership = next(
            (m for m in o.memberships.all() if m.role == Membership.Role.OWNER and m.active),
            None
        )
        owner_name = owner_membership.user.get_full_name() if owner_membership else ""
        owner_email = owner_membership.user.email if owner_membership else ""

        # Subscription
        latest_sub = next(iter(o.subscriptions.all()), None)
        sub_data = None
        if latest_sub:
            sub_data = {
                "id": str(latest_sub.id),
                "planName": latest_sub.plan.name,
                "planTier": latest_sub.plan.tier,
                "status": latest_sub.status,
                "periodEnd": latest_sub.period_end.date().isoformat() if latest_sub.period_end else None,
                "trialEndsAt": latest_sub.trial_ends_at.date().isoformat() if latest_sub.trial_ends_at else None,
            }

        # Counts
        all_members = [m for m in o.memberships.all() if m.active]
        active_reminders = sum(
            1 for rj in o.reminder_jobs.all()
            if rj.status in (ReminderJob.Status.PROPOSED, ReminderJob.Status.APPROVED, ReminderJob.Status.SCHEDULED)
        )

        # Plan limits
        plan = latest_sub.plan if latest_sub else None
        usage_data = {
            "usersUsed": len(all_members),
            "usersLimit": plan.max_users if plan else 0,
            "invoicesUsed": o.invoices.count(),
            "invoicesLimit": plan.max_invoices_per_month if plan else 0,
            "aiTokensUsed": AIRun.objects.filter(organization=o).aggregate(
                t=Sum("prompt_tokens") + Sum("completion_tokens")
            )["t"] or 0,
            "aiTokensLimit": plan.max_ai_requests_per_month if plan else 0,
        }

        result.append({
            "id": str(o.id),
            "name": o.name,
            "legalName": o.legal_name,
            "ownerName": owner_name,
            "ownerEmail": owner_email,
            "status": o.status,
            "currency": o.default_currency,
            "timezone": o.timezone,
            "state": o.state,
            "createdAt": o.created_at.isoformat(),
            "subscription": sub_data,
            "counts": {
                "customers": o.customers.count(),
                "invoices": o.invoices.count(),
                "payments": 0,  # Payment model not prefetched for perf
                "activeReminders": active_reminders,
                "totalUsers": len(all_members),
            },
            "usage": usage_data,
            "isLiveApiData": True,
        })

    return Response(result)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsStaffPermission])
def org_detail(request, org_id):
    try:
        o = Organization.objects.prefetch_related(
            "memberships__user", "subscriptions__plan"
        ).get(pk=org_id)
    except Organization.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    # Members
    members = [
        {
            "id": str(m.id),
            "name": m.user.get_full_name(),
            "email": m.user.email,
            "role": m.get_role_display(),
            "joinedAt": m.created_at.date().isoformat() if m.created_at else "",
            "active": m.active,
        }
        for m in o.memberships.filter(active=True)
    ]

    # Subscription
    latest_sub = o.subscriptions.first()
    sub_data = None
    if latest_sub:
        sub_data = {
            "id": str(latest_sub.id),
            "planName": latest_sub.plan.name,
            "planTier": latest_sub.plan.tier,
            "status": latest_sub.status,
            "periodEnd": latest_sub.period_end.date().isoformat() if latest_sub.period_end else None,
            "trialEndsAt": latest_sub.trial_ends_at.date().isoformat() if latest_sub.trial_ends_at else None,
        }

    # Recent audit logs
    logs = AuditLog.objects.filter(organization=o).select_related("actor").order_by("-created_at")[:20]
    audit_logs = [
        {
            "id": str(l.id),
            "action": l.action,
            "actor": l.actor.email if l.actor else "system",
            "summary": l.summary,
            "entityType": l.entity_type,
            "createdAt": l.created_at.isoformat(),
        }
        for l in logs
    ]

    # Owner
    owner_membership = o.memberships.filter(role=Membership.Role.OWNER, active=True).select_related("user").first()

    return Response({
        "id": str(o.id),
        "name": o.name,
        "legalName": o.legal_name,
        "businessEmail": o.business_email,
        "contactPhone": o.contact_phone,
        "country": o.country,
        "state": o.state,
        "currency": o.default_currency,
        "timezone": o.timezone,
        "billingAddress": o.billing_address,
        "status": o.status,
        "createdAt": o.created_at.isoformat(),
        "ownerName": owner_membership.user.get_full_name() if owner_membership else "",
        "ownerEmail": owner_membership.user.email if owner_membership else "",
        "subscription": sub_data,
        "members": members,
        "auditLogs": audit_logs,
        "isLiveApiData": True,
    })


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, IsStaffPermission])
def org_suspend(request, org_id):
    try:
        o = Organization.objects.get(pk=org_id)
    except Organization.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    action = request.data.get("action", "suspend")  # "suspend" or "reactivate"
    reason = request.data.get("reason", "")

    if action == "suspend":
        o.status = Organization.Status.SUSPENDED
        log_action = "org.suspended"
        summary = f"Organization suspended by platform admin. Reason: {reason}" if reason else "Organization suspended by platform admin."
    else:
        o.status = Organization.Status.ACTIVE
        log_action = "org.reactivated"
        summary = "Organization reactivated by platform admin."

    o.save(update_fields=["status", "updated_at"])

    AuditLog.objects.create(
        organization=o,
        actor=request.user,
        action=log_action,
        entity_type="organization",
        entity_id=str(o.id),
        summary=summary,
    )

    return Response({"status": o.status, "detail": "Updated successfully."})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, IsStaffPermission])
def org_ai_toggle(request, org_id):
    try:
        o = Organization.objects.get(pk=org_id)
    except Organization.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    # Toggle ai_disabled field if it exists, otherwise return 400
    if not hasattr(o, "ai_disabled"):
        return Response({"detail": "ai_disabled field not available. Run migrations first."}, status=400)

    o.ai_disabled = not o.ai_disabled
    o.save(update_fields=["ai_disabled", "updated_at"])

    AuditLog.objects.create(
        organization=o,
        actor=request.user,
        action="org.ai_disabled" if o.ai_disabled else "org.ai_enabled",
        entity_type="organization",
        entity_id=str(o.id),
        summary=f"AI {'disabled' if o.ai_disabled else 'enabled'} for organization by platform admin.",
    )

    return Response({"ai_disabled": o.ai_disabled})


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsStaffPermission])
def user_list(request):
    # Exclude platform staff and superusers — they are managed via Staff Management.
    # This listing is intentionally scoped to tenant organization users only.
    users = User.objects.filter(
        is_staff=False,
        is_superuser=False,
    ).prefetch_related("memberships__organization").order_by("-date_joined")

    result = []
    for u in users:
        memberships = u.memberships.filter(active=True).select_related("organization")
        orgs = [
            {
                "orgId": str(m.organization.id),
                "orgName": m.organization.name,
                "role": m.get_role_display(),
            }
            for m in memberships
        ]
        result.append({
            "id": u.id,
            "email": u.email,
            "fullName": u.get_full_name(),
            "isActive": u.is_active,
            "isStaff": u.is_staff,
            "isSuperuser": u.is_superuser,
            "dateJoined": u.date_joined.isoformat(),
            "lastLogin": u.last_login.isoformat() if u.last_login else None,
            "organizations": orgs,
            "orgCount": len(orgs),
        })

    return Response(result)


# ---------------------------------------------------------------------------
# Subscriptions
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsStaffPermission])
def subscription_list(request):
    subs = Subscription.objects.select_related("organization", "plan").order_by("-created_at")

    return Response([
        {
            "id": str(s.id),
            "organizationId": str(s.organization.id),
            "organizationName": s.organization.name,
            "planId": str(s.plan.id),
            "planName": s.plan.name,
            "planTier": s.plan.tier,
            "status": s.status,
            "trialEndsAt": s.trial_ends_at.isoformat() if s.trial_ends_at else None,
            "periodStart": s.period_start.isoformat() if s.period_start else None,
            "periodEnd": s.period_end.isoformat() if s.period_end else None,
            "cancelledAt": s.cancelled_at.isoformat() if s.cancelled_at else None,
            "createdAt": s.created_at.isoformat(),
        }
        for s in subs
    ])


# ---------------------------------------------------------------------------
# Plans
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsStaffPermission])
def plan_list(request):
    plans = Plan.objects.all().order_by("price_monthly_minor")
    return Response([
        {
            "id": str(p.id),
            "tier": p.tier,
            "name": p.name,
            "description": p.description,
            "maxUsers": p.max_users,
            "maxInvoicesPerMonth": p.max_invoices_per_month,
            "maxAiRequestsPerMonth": p.max_ai_requests_per_month,
            "priceMonthly": p.price_monthly_minor,
            "priceAnnually": p.price_annually_minor,
            "currency": p.currency,
            "active": p.active,
        }
        for p in plans
    ])


# ---------------------------------------------------------------------------
# Audit Logs
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsStaffPermission])
def audit_log_admin(request):
    """Platform-level audit log — all organizations."""
    qs = AuditLog.objects.select_related("actor", "organization").order_by("-created_at")

    # Optional filters
    org_id = request.query_params.get("org_id")
    action = request.query_params.get("action")
    days = request.query_params.get("days")

    if org_id:
        qs = qs.filter(organization_id=org_id)
    if action:
        qs = qs.filter(action__icontains=action)
    if days:
        since = timezone.now() - timedelta(days=int(days))
        qs = qs.filter(created_at__gte=since)

    qs = qs[:500]

    return Response([
        {
            "id": l.id,
            "organizationId": str(l.organization.id) if l.organization else None,
            "organization": l.organization.name if l.organization else None,
            "actor": l.actor.email if l.actor else "system",
            "actorId": l.actor.id if l.actor else None,
            "action": l.action,
            "entityType": l.entity_type,
            "entityId": l.entity_id,
            "summary": l.summary,
            "createdAt": l.created_at.isoformat(),
        }
        for l in qs
    ])


# ---------------------------------------------------------------------------
# AI Monitoring
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsStaffPermission])
def ai_monitoring(request):
    today = timezone.now().date()
    month_start = today.replace(day=1)

    today_runs = AIRun.objects.filter(created_at__date=today)
    month_runs = AIRun.objects.filter(created_at__date__gte=month_start)

    today_agg = today_runs.aggregate(
        total=Count("id"),
        success=Count("id", filter=Q(status=AIRun.Status.SUCCESS)),
        failed=Count("id", filter=Q(status=AIRun.Status.FAILED)),
        prompt_tokens=Sum("prompt_tokens"),
        completion_tokens=Sum("completion_tokens"),
    )
    month_agg = month_runs.aggregate(
        total=Count("id"),
        success=Count("id", filter=Q(status=AIRun.Status.SUCCESS)),
        prompt_tokens=Sum("prompt_tokens"),
        completion_tokens=Sum("completion_tokens"),
    )

    # Per-org breakdown (today)
    per_org = (
        today_runs
        .values("organization__id", "organization__name")
        .annotate(
            requests=Count("id"),
            success=Count("id", filter=Q(status=AIRun.Status.SUCCESS)),
            failed=Count("id", filter=Q(status=AIRun.Status.FAILED)),
            tokens=Sum("prompt_tokens") + Sum("completion_tokens"),
        )
        .order_by("-requests")[:20]
    )

    # Per-model breakdown (today)
    per_model = (
        today_runs
        .values("model_identifier")
        .annotate(requests=Count("id"), tokens=Sum("prompt_tokens") + Sum("completion_tokens"))
        .order_by("-requests")[:10]
    )

    # Recent runs
    recent = AIRun.objects.select_related("organization", "user").order_by("-created_at")[:20]

    return Response({
        "today": {
            "total": today_agg["total"] or 0,
            "success": today_agg["success"] or 0,
            "failed": today_agg["failed"] or 0,
            "errorRate": round((today_agg["failed"] or 0) / max(today_agg["total"] or 1, 1) * 100, 1),
            "promptTokens": today_agg["prompt_tokens"] or 0,
            "completionTokens": today_agg["completion_tokens"] or 0,
        },
        "thisMonth": {
            "total": month_agg["total"] or 0,
            "success": month_agg["success"] or 0,
            "promptTokens": month_agg["prompt_tokens"] or 0,
            "completionTokens": month_agg["completion_tokens"] or 0,
        },
        "perOrg": [
            {
                "orgId": str(r["organization__id"]),
                "orgName": r["organization__name"],
                "requests": r["requests"],
                "success": r["success"],
                "failed": r["failed"],
                "tokens": r["tokens"] or 0,
            }
            for r in per_org
        ],
        "perModel": [
            {
                "model": r["model_identifier"] or "unknown",
                "requests": r["requests"],
                "tokens": r["tokens"] or 0,
            }
            for r in per_model
        ],
        "recentRuns": [
            {
                "id": str(r.id),
                "orgName": r.organization.name,
                "userEmail": r.user.email,
                "taskType": r.task_type,
                "model": r.model_identifier,
                "status": r.status,
                "promptTokens": r.prompt_tokens,
                "completionTokens": r.completion_tokens,
                "createdAt": r.created_at.isoformat(),
            }
            for r in recent
        ],
    })


# ---------------------------------------------------------------------------
# Reminders
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsStaffPermission])
def reminders_overview(request):
    all_jobs = ReminderJob.objects.select_related("organization", "policy", "customer", "invoice")

    # Org filter
    org_id = request.query_params.get("org_id")
    if org_id:
        all_jobs = all_jobs.filter(organization_id=org_id)

    stats_agg = all_jobs.aggregate(
        total=Count("id"),
        proposed=Count("id", filter=Q(status=ReminderJob.Status.PROPOSED)),
        approved=Count("id", filter=Q(status=ReminderJob.Status.APPROVED)),
        scheduled=Count("id", filter=Q(status=ReminderJob.Status.SCHEDULED)),
        dispatched=Count("id", filter=Q(status=ReminderJob.Status.DISPATCHED)),
        blocked=Count("id", filter=Q(status=ReminderJob.Status.BLOCKED)),
        rejected=Count("id", filter=Q(status=ReminderJob.Status.REJECTED)),
        failed=Count("id", filter=Q(status=ReminderJob.Status.FAILED)),
    )

    # Per-org breakdown
    per_org = (
        all_jobs
        .values("organization__id", "organization__name")
        .annotate(
            total=Count("id"),
            dispatched=Count("id", filter=Q(status=ReminderJob.Status.DISPATCHED)),
            pending=Count("id", filter=Q(status__in=[ReminderJob.Status.PROPOSED, ReminderJob.Status.APPROVED, ReminderJob.Status.SCHEDULED])),
            failed=Count("id", filter=Q(status__in=[ReminderJob.Status.FAILED, ReminderJob.Status.BLOCKED])),
        )
        .order_by("-total")[:20]
    )

    # Recent jobs
    recent = all_jobs.order_by("-created_at")[:30]

    return Response({
        "stats": {
            "total": stats_agg["total"] or 0,
            "proposed": stats_agg["proposed"] or 0,
            "approved": stats_agg["approved"] or 0,
            "scheduled": stats_agg["scheduled"] or 0,
            "dispatched": stats_agg["dispatched"] or 0,
            "blocked": stats_agg["blocked"] or 0,
            "rejected": stats_agg["rejected"] or 0,
            "failed": stats_agg["failed"] or 0,
        },
        "perOrg": [
            {
                "orgId": str(r["organization__id"]),
                "orgName": r["organization__name"],
                "total": r["total"],
                "dispatched": r["dispatched"],
                "pending": r["pending"],
                "failed": r["failed"],
            }
            for r in per_org
        ],
        "recentJobs": [
            {
                "id": str(j.id),
                "orgName": j.organization.name,
                "customerName": j.customer.name,
                "invoiceNumber": j.invoice.invoice_number,
                "channel": j.policy.channel,
                "status": j.status,
                "scheduledDate": j.scheduled_date.isoformat(),
                "dispatchedAt": j.dispatched_at.isoformat() if j.dispatched_at else None,
                "createdAt": j.created_at.isoformat(),
            }
            for j in recent
        ],
    })


# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsStaffPermission])
def usage_overview(request):
    orgs = Organization.objects.prefetch_related("subscriptions__plan").order_by("name")

    result = []
    for o in orgs:
        sub = o.subscriptions.first()
        plan = sub.plan if sub else None

        customer_count = o.customers.count()
        invoice_count = o.invoices.count()
        member_count = o.memberships.filter(active=True).count()
        ai_count = o.ai_runs.count()
        reminder_count = o.reminder_jobs.count()

        result.append({
            "orgId": str(o.id),
            "orgName": o.name,
            "orgStatus": o.status,
            "plan": plan.name if plan else "No Plan",
            "planTier": plan.tier if plan else None,
            "usage": {
                "customers": customer_count,
                "invoices": invoice_count,
                "members": member_count,
                "aiRuns": ai_count,
                "reminderJobs": reminder_count,
            },
            "limits": {
                "maxUsers": plan.max_users if plan else 0,
                "maxInvoicesPerMonth": plan.max_invoices_per_month if plan else 0,
                "maxAiRequestsPerMonth": plan.max_ai_requests_per_month if plan else 0,
            },
        })

    return Response(result)
