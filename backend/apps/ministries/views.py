import logging
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.accounts.permissions import IsAdmin, IsAdminOrElder
from apps.audit.models import AuditLog
from .models import FiscalYear, Ministry, ReportWindow
from .serializers import FiscalYearSerializer, MinistrySerializer, ReportWindowSerializer

logger = logging.getLogger(__name__)


class MinistryViewSet(ModelViewSet):
    queryset = Ministry.objects.all()
    serializer_class = MinistrySerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        ministry = serializer.save()
        AuditLog.objects.create(
            actor=self.request.user,
            action=AuditLog.ACTION_MINISTRY_CREATE,
            object_type="Ministry",
            object_id=ministry.pk,
            detail={"name_am": ministry.name_am},
        )
        logger.info("ministry_created", extra={"name_am": ministry.name_am})

    def perform_destroy(self, instance):
        AuditLog.objects.create(
            actor=self.request.user,
            action=AuditLog.ACTION_MINISTRY_DELETE,
            object_type="Ministry",
            object_id=instance.pk,
            detail={"name_am": instance.name_am, "slug": instance.slug},
        )
        logger.info("ministry_deleted", extra={"name_am": instance.name_am})
        instance.delete()


class FiscalYearViewSet(ModelViewSet):
    queryset = FiscalYear.objects.all()
    serializer_class = FiscalYearSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def toggle_plan_window(self, request, pk=None):
        fy = self.get_object()
        fy.plan_window_open = not fy.plan_window_open
        fy.save(update_fields=["plan_window_open"])
        logger.info(
            "plan_window_toggled",
            extra={"fiscal_year": fy.label, "open": fy.plan_window_open},
        )
        return Response(FiscalYearSerializer(fy).data)


class ReportWindowViewSet(ModelViewSet):
    serializer_class = ReportWindowSerializer
    permission_classes = [IsAdminOrElder]

    def get_queryset(self):
        qs = ReportWindow.objects.select_related("ministry", "fiscal_year")
        ministry_id = self.request.query_params.get("ministry")
        fy_id = self.request.query_params.get("fiscal_year")
        if ministry_id:
            qs = qs.filter(ministry_id=ministry_id)
        if fy_id:
            qs = qs.filter(fiscal_year_id=fy_id)
        return qs

    @action(detail=True, methods=["post"])
    def toggle(self, request, pk=None):
        window = self.get_object()
        window.is_open = not window.is_open
        if window.is_open:
            window.opened_at = timezone.now()
            window.opened_by = request.user
        window.save(update_fields=["is_open", "opened_at", "opened_by"])
        action_code = (
            AuditLog.ACTION_WINDOW_OPEN if window.is_open else AuditLog.ACTION_WINDOW_CLOSE
        )
        AuditLog.objects.create(
            actor=request.user,
            action=action_code,
            object_type="ReportWindow",
            object_id=window.pk,
            detail={"ministry": str(window.ministry), "quarter": window.quarter},
        )
        return Response(ReportWindowSerializer(window).data)
