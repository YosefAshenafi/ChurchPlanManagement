from rest_framework.permissions import BasePermission
from .models import Role


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.ADMIN
        )


class IsElder(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.ELDER
        )


class IsAdminOrElder(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in (Role.ADMIN, Role.ELDER)
        )


class IsMinistryLeader(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.MINISTRY_LEADER
        )
