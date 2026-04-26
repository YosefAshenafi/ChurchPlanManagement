import logging

from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.accounts.models import Role
from apps.accounts.permissions import IsMinistryLeader
from apps.audit.models import AuditLog
from apps.ministries.models import ReportWindow
from apps.plans.models import Plan, PlanStatus
from .models import QuarterlyReport, ReportStatus
from .serializers import QuarterlyReportSerializer, ReportSaveSerializer

logger = logging.getLogger(__name__)


class QuarterlyReportViewSet(ModelViewSet):
    serializer_class = QuarterlyReportSerializer

    def get_queryset(self):
        user = self.request.user
        qs = QuarterlyReport.objects.select_related(
            "plan__ministry", "plan__fiscal_year", "submitted_by"
        ).prefetch_related(
            "activity_progress", "budget_utilization",
            "carried_over_tasks", "next_quarter_plans",
        )
        if user.role == Role.MINISTRY_LEADER:
            if not user.ministry_id:
                return QuarterlyReport.objects.none()
            return qs.filter(plan__ministry=user.ministry)
        return qs

    def get_permissions(self):
        if self.action == "create":
            return [IsMinistryLeader()]
        return super().get_permissions()

    def perform_create(self, serializer):
        user = self.request.user
        plan_id = self.request.data.get("plan")
        quarter = self.request.data.get("quarter")

        plan = self._get_own_approved_plan(user, plan_id)
        self._assert_window_open(plan, quarter)

        if QuarterlyReport.objects.filter(plan=plan, quarter=quarter).exists():
            raise ValidationError("ሪፖርቱ አስቀድሞ ተፈጥሯል")

        report = serializer.save(plan=plan, quarter=quarter, status=ReportStatus.DRAFT)
        AuditLog.objects.create(
            actor=user,
            action=AuditLog.ACTION_REPORT_SAVE,
            object_type="QuarterlyReport",
            object_id=report.pk,
        )

    def update(self, request, *args, **kwargs):
        report = self.get_object()
        self._assert_report_owner(request.user, report)
        self._assert_report_editable(report)

        serializer = ReportSaveSerializer(report, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.ACTION_REPORT_SAVE,
            object_type="QuarterlyReport",
            object_id=report.pk,
        )
        logger.info("report_saved", extra={"report_id": report.pk})
        return Response(QuarterlyReportSerializer(report).data)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        report = self.get_object()
        self._assert_report_owner(request.user, report)
        self._assert_report_editable(report)
        report.status = ReportStatus.SUBMITTED
        report.submitted_at = timezone.now()
        report.submitted_by = request.user
        report.save(update_fields=["status", "submitted_at", "submitted_by"])
        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.ACTION_REPORT_SUBMIT,
            object_type="QuarterlyReport",
            object_id=report.pk,
        )
        logger.info("report_submitted", extra={"report_id": report.pk})
        return Response(QuarterlyReportSerializer(report).data)

    def _get_own_approved_plan(self, user, plan_id) -> Plan:
        try:
            plan = Plan.objects.get(pk=plan_id, ministry=user.ministry)
        except Plan.DoesNotExist:
            raise PermissionDenied("ዕቅዱ አልተገኘም ወይም ዝዳሰቻ የለዎትም")
        if plan.status != PlanStatus.APPROVED:
            raise ValidationError("ዕቅዱ አልጸደቀም ስለሆነ ሪፖርት ማቅረብ አይቻልም")
        return plan

    def _assert_window_open(self, plan: Plan, quarter):
        window = ReportWindow.objects.filter(
            fiscal_year=plan.fiscal_year,
            ministry=plan.ministry,
            quarter=quarter,
        ).first()
        if not window or not window.is_open:
            raise ValidationError("የሪፖርት ማቅረቢያ መስኮቱ ያልተከፈተ ነው")

    def _assert_report_owner(self, user, report: QuarterlyReport):
        if (
            user.role == Role.MINISTRY_LEADER
            and report.plan.ministry_id != user.ministry_id
        ):
            raise PermissionDenied("ለዚህ ሪፖርት ዝዳሰቻ የለዎትም")

    def _assert_report_editable(self, report: QuarterlyReport):
        if report.status == ReportStatus.SUBMITTED:
            raise ValidationError("ቀርቦ ያለ ሪፖርት ሊስተካከል አይችልም")
        if report.status == ReportStatus.LOCKED:
            raise ValidationError("ሪፖርት መስኮቱ አልተከፈተም")
