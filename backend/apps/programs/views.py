import logging

from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.accounts.permissions import IsAdminOrElder
from apps.audit.models import AuditLog
from .models import AssemblyProgram
from .serializers import AssemblyProgramListSerializer, AssemblyProgramSerializer

logger = logging.getLogger(__name__)


class AssemblyProgramViewSet(ModelViewSet):
    queryset = AssemblyProgram.objects.prefetch_related("tasks__responsible_ministry").order_by("-created_at")

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsAdminOrElder()]

    def get_serializer_class(self):
        if self.action == "list":
            return AssemblyProgramListSerializer
        return AssemblyProgramSerializer

    def perform_create(self, serializer):
        program = serializer.save(created_by=self.request.user)
        AuditLog.objects.create(
            actor=self.request.user,
            action=AuditLog.ACTION_PROGRAM_CREATE,
            object_type="AssemblyProgram",
            object_id=program.pk,
            detail={"title": program.title, "tasks": program.tasks.count()},
        )
        logger.info("program_created", extra={"program_id": program.pk, "title": program.title})

    def perform_update(self, serializer):
        program = serializer.save()
        AuditLog.objects.create(
            actor=self.request.user,
            action=AuditLog.ACTION_PROGRAM_UPDATE,
            object_type="AssemblyProgram",
            object_id=program.pk,
            detail={"title": program.title, "tasks": program.tasks.count()},
        )
