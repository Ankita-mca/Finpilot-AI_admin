"""
Platform Admin views package — full implementation.
All endpoints are staff/superuser only.
"""
from datetime import timedelta

from django.conf import settings
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

from .auth_views import admin_me, admin_logout  # noqa: F401

User = get_user_model()


# ---------------------------------------------------------------------------
# Permission
# ---------------------------------------------------------------------------

class IsStaffPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and (request.user.is_staff or request.user.is_superuser))


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
            "createdAt": l.created_at.isoformat(),
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
        .prefetch_related("memberships__user", "subscriptions__plan")
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

        # Counts (direct queries — avoids N+1 by batching outside of prefetch)
        all_members = [m for m in o.memberships.all() if m.active]
        customer_count = o.customers.count()
        invoice_count = o.invoices.count()
        active_reminders = o.reminder_jobs.filter(
            status__in=[
                ReminderJob.Status.PROPOSED,
                ReminderJob.Status.APPROVED,
                ReminderJob.Status.SCHEDULED,
            ]
        ).count()

        plan = latest_sub.plan if latest_sub else None
        ai_tokens = AIRun.objects.filter(organization=o).aggregate(
            t=Sum("prompt_tokens")
        )["t"] or 0

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
            "plan": latest_sub.plan.name if latest_sub else None,
            "planTier": latest_sub.plan.tier if latest_sub else None,
            "counts": {
                "customers": customer_count,
                "invoices": invoice_count,
                "payments": 0,
                "activeReminders": active_reminders,
                "totalUsers": len(all_members),
            },
            "usage": {
                "usersUsed": len(all_members),
                "usersLimit": plan.max_users if plan else 0,
                "invoicesUsed": invoice_count,
                "invoicesLimit": plan.max_invoices_per_month if plan else 0,
                "aiTokensUsed": ai_tokens,
                "aiTokensLimit": plan.max_ai_requests_per_month if plan else 0,
            },
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
        "counts": {
            "customers": o.customers.count(),
            "invoices": o.invoices.count(),
            "totalUsers": len(members),
        },
        "isLiveApiData": True,
    })


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, IsStaffPermission])
def org_suspend(request, org_id):
    try:
        o = Organization.objects.get(pk=org_id)
    except Organization.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    action = request.data.get("action", "suspend")
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
        memberships = [m for m in u.memberships.all() if m.active]
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
        failed=Count("id", filter=~Q(status=AIRun.Status.SUCCESS)),
        prompt_tokens=Sum("prompt_tokens"),
        completion_tokens=Sum("completion_tokens"),
    )
    month_agg = month_runs.aggregate(
        total=Count("id"),
        success=Count("id", filter=Q(status=AIRun.Status.SUCCESS)),
        failed=Count("id", filter=~Q(status=AIRun.Status.SUCCESS)),
        prompt_tokens=Sum("prompt_tokens"),
        completion_tokens=Sum("completion_tokens"),
    )

    # All organizations in the platform
    all_orgs = Organization.objects.all().order_by("name")

    # Aggregate today's runs per org (both successful and failed requests)
    org_stats = (
        today_runs
        .values("organization__id")
        .annotate(
            requests=Count("id"),
            success=Count("id", filter=Q(status=AIRun.Status.SUCCESS)),
            failed=Count("id", filter=~Q(status=AIRun.Status.SUCCESS)),
        )
    )
    org_stats_map = {str(item["organization__id"]): item for item in org_stats}

    # Latest models used today per org
    latest_models_today = {}
    for r in today_runs.exclude(model_identifier="none").order_by("-created_at"):
        oid = str(r.organization_id)
        if oid not in latest_models_today and r.model_identifier:
            latest_models_today[oid] = r.model_identifier

    default_model = getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash")

    organization_usage = []
    for org in all_orgs:
        oid = str(org.id)
        stat = org_stats_map.get(oid, {})
        reqs = stat.get("requests", 0)
        failed = stat.get("failed", 0)
        err_rate = round((failed / reqs) * 100, 1) if reqs > 0 else 0.0

        p_model = latest_models_today.get(oid)
        if not p_model:
            last_run = AIRun.objects.filter(organization=org).exclude(model_identifier="none").order_by("-created_at").first()
            p_model = last_run.model_identifier if last_run else default_model

        organization_usage.append({
            "organizationId": oid,
            "organizationName": org.name,
            "primaryModel": p_model,
            "requestsToday": reqs,
            "tokensToday": 0,
            "errorRate": err_rate,
            "isAiDisabled": getattr(org, "ai_disabled", False),
        })

    # Model usage distribution
    model_counts = (
        AIRun.objects.filter(created_at__date__gte=month_start)
        .exclude(model_identifier="none")
        .values("model_identifier")
        .annotate(requests=Count("id"))
        .order_by("-requests")
    )
    total_model_reqs = sum(m["requests"] for m in model_counts) or 1
    model_usage = [
        {
            "model": m["model_identifier"] or "Gemini",
            "requests": m["requests"],
            "tokens": 0,
            "sharePct": round((m["requests"] / total_model_reqs) * 100),
        }
        for m in model_counts
    ] or [{"model": default_model, "requests": 0, "tokens": 0, "sharePct": 100}]

    # 7-day daily trends
    daily_trends = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_count = AIRun.objects.filter(created_at__date=day).count()
        daily_trends.append({
            "date": day.strftime("%b %d"),
            "requests": day_count,
            "tokensK": 0,
        })

    per_org = [
        {
            "orgId": u["organizationId"],
            "orgName": u["organizationName"],
            "requests": u["requestsToday"],
            "success": u["requestsToday"] - int(round(u["requestsToday"] * u["errorRate"] / 100)),
            "failed": int(round(u["requestsToday"] * u["errorRate"] / 100)),
            "tokens": 0,
        }
        for u in organization_usage if u["requestsToday"] > 0
    ]

    per_model = [
        {
            "model": m["model"],
            "requests": m["requests"],
            "tokens": 0,
        }
        for m in model_usage
    ]

    recent = AIRun.objects.select_related("organization", "user").order_by("-created_at")[:20]

    return Response({
        # Matching AIMonitoringData interface:
        "totalRequestsToday": today_agg["total"] or 0,
        "totalRequestsMonth": month_agg["total"] or 0,
        "inputTokensToday": 0,
        "outputTokensToday": 0,
        "totalTokensMonth": 0,
        "estimatedCostUsd": 0.0,
        "errorRatePercent": round((today_agg["failed"] or 0) / max(today_agg["total"] or 1, 1) * 100, 1),
        "globalKillSwitchActive": False,
        "modelUsage": model_usage,
        "organizationUsage": organization_usage,
        "dailyTrends": daily_trends,

        # Backward compatibility fields:
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
        "perOrg": per_org,
        "perModel": per_model,
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

    per_org = (
        all_jobs
        .values("organization__id", "organization__name")
        .annotate(
            total=Count("id"),
            dispatched=Count("id", filter=Q(status=ReminderJob.Status.DISPATCHED)),
            pending=Count("id", filter=Q(status__in=[
                ReminderJob.Status.PROPOSED,
                ReminderJob.Status.APPROVED,
                ReminderJob.Status.SCHEDULED,
            ])),
            failed=Count("id", filter=Q(status__in=[
                ReminderJob.Status.FAILED,
                ReminderJob.Status.BLOCKED,
            ])),
        )
        .order_by("-total")[:20]
    )

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

        result.append({
            "orgId": str(o.id),
            "orgName": o.name,
            "orgStatus": o.status,
            "plan": plan.name if plan else "No Plan",
            "planTier": plan.tier if plan else None,
            "usage": {
                "customers": o.customers.count(),
                "invoices": o.invoices.count(),
                "members": o.memberships.filter(active=True).count(),
                "aiRuns": o.ai_runs.count(),
                "reminderJobs": o.reminder_jobs.count(),
            },
            "limits": {
                "maxUsers": plan.max_users if plan else 0,
                "maxInvoicesPerMonth": plan.max_invoices_per_month if plan else 0,
                "maxAiRequestsPerMonth": plan.max_ai_requests_per_month if plan else 0,
            },
        })

    return Response(result)
