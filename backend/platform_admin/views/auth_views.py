"""
Platform Admin authentication and session views.
"""
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import logout


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_me(request):
    """
    Returns current authenticated platform staff details.
    Enforces that the user has a platform role (staff or superuser).
    """
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


@api_view(["POST"])
def admin_logout(request):
    """Platform admin logout endpoint."""
    if request.user.is_authenticated:
        logout(request)
    return Response({"detail": "Signed out from Platform Admin"})
