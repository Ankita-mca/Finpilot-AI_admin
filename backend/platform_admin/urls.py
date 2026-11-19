from django.urls import path
from .views import org_list, user_list, audit_log_admin, admin_me, admin_logout

urlpatterns = [
    path("admin/me/", admin_me),
    path("admin/auth/logout/", admin_logout),
    path("admin/orgs/", org_list),
    path("admin/users/", user_list),
    path("admin/audit-logs/", audit_log_admin),
]
