import logging

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from apps.audit.models import AuditLog
from .models import User
from .permissions import IsAdmin
from .serializers import (
    AvatarSerializer,
    PasswordResetSerializer,
    ProfileUpdateSerializer,
    UserCreateSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)

TRACKED_PROFILE_FIELDS = ("first_name", "last_name", "full_name_am", "phone_number", "email")


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user, context={"request": request}).data)


class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        old = {f: getattr(request.user, f, "") for f in TRACKED_PROFILE_FIELDS}
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        new = {f: getattr(user, f, "") for f in TRACKED_PROFILE_FIELDS}
        changed = {f: {"from": old[f], "to": new[f]} for f in TRACKED_PROFILE_FIELDS if old[f] != new[f]}
        password_changed = bool(request.data.get("new_password"))

        if changed:
            AuditLog.objects.create(
                actor=user,
                action=AuditLog.ACTION_PROFILE_UPDATE,
                object_type="User",
                object_id=user.pk,
                detail={"changes": changed},
            )
            logger.info("profile_updated", extra={"user_id": user.pk, "changes": list(changed.keys())})

        if password_changed:
            AuditLog.objects.create(
                actor=user,
                action=AuditLog.ACTION_PASSWORD_RESET,
                object_type="User",
                object_id=user.pk,
                detail={"self_change": True},
            )

        return Response(UserSerializer(user, context={"request": request}).data)


class AvatarUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = AvatarSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        logger.info("avatar_updated", extra={"user_id": user.pk})
        return Response(UserSerializer(user, context={"request": request}).data)


class UserViewSet(ModelViewSet):
    permission_classes = [IsAdmin]
    queryset = User.objects.select_related("ministry").order_by("username")

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        AuditLog.objects.create(
            actor=self.request.user,
            action=AuditLog.ACTION_USER_CREATE,
            object_type="User",
            object_id=user.pk,
            detail={"username": user.username, "role": user.role},
        )
        logger.info("user_created", extra={"username": user.username, "role": user.role})

    def perform_update(self, serializer):
        old_user = self.get_object()
        old = {f: getattr(old_user, f, "") for f in TRACKED_PROFILE_FIELDS}
        user = serializer.save()
        new = {f: getattr(user, f, "") for f in TRACKED_PROFILE_FIELDS}
        changed = {f: {"from": old[f], "to": new[f]} for f in TRACKED_PROFILE_FIELDS if old[f] != new[f]}
        if changed:
            AuditLog.objects.create(
                actor=self.request.user,
                action=AuditLog.ACTION_USER_UPDATE,
                object_type="User",
                object_id=user.pk,
                detail={"username": user.username, "changes": changed},
            )

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        user.is_active = False
        user.save(update_fields=["is_active"])
        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.ACTION_USER_DISABLE,
            object_type="User",
            object_id=user.pk,
            detail={"username": user.username},
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordResetView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk: int):
        user = get_object_or_404(User, pk=pk)
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.ACTION_PASSWORD_RESET,
            object_type="User",
            object_id=user.pk,
            detail={"username": user.username, "reset_by_admin": True},
        )
        logger.info("password_reset", extra={"target_user_id": pk})
        return Response({"detail": "ይለፍ ቃል ተቀይሯል"})
