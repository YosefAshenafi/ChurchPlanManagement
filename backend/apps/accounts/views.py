import logging

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from apps.audit.models import AuditLog
from .models import User
from .permissions import IsAdmin
from .serializers import (
    PasswordResetSerializer,
    UserCreateSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


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
        logger.info("password_reset", extra={"target_user_id": pk})
        return Response({"detail": "ይለፍ ቃል ተቀይሯል"})
