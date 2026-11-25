from django.urls import path
from .views import (
    admin_me,
    admin_logout,
    dashboard_view,
    org_list,
    org_detail,
    org_suspend,
    org_ai_toggle,
    user_list,
    subscription_list,
    plan_list,
    audit_log_admin,
    ai_monitoring,
    reminders_overview,
    usage_overview,
)

urlpatterns = [
    # Auth
    path("admin/me/", admin_me),
    path("admin/auth/logout/", admin_logout),

    # Dashboard
    path("admin/dashboard/", dashboard_view),

    # Organizations
    path("admin/orgs/", org_list),
    path("admin/orgs/<uuid:org_id>/", org_detail),
    path("admin/orgs/<uuid:org_id>/suspend/", org_suspend),
    path("admin/orgs/<uuid:org_id>/ai-toggle/", org_ai_toggle),

    # Users
    path("admin/users/", user_list),

    # Subscriptions & Plans
    path("admin/subscriptions/", subscription_list),
    path("admin/plans/", plan_list),

    # Audit Logs
    path("admin/audit-logs/", audit_log_admin),

    # AI Monitoring
    path("admin/ai-monitoring/", ai_monitoring),

    # Reminders
    path("admin/reminders/", reminders_overview),

    # Usage
    path("admin/usage/", usage_overview),
]
