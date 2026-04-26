import logging

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.accounts.models import Role
from apps.accounts.permissions import IsAdminOrElder, IsMinistryLeader
from apps.audit.models import AuditLog
from apps.ministries.models import FiscalYear
from .models import Plan, PlanStatus
from .serializers import PlanSaveSerializer, PlanSerializer

logger = logging.getLogger(__name__)


class PlanViewSet(ModelViewSet):
    serializer_class = PlanSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Plan.objects.select_related(
            "ministry", "fiscal_year", "submitted_by", "reviewed_by"
        ).prefetch_related(
            "goals__outputs__activities",
            "budget_lines",
            "budget_allocations",
            "schedule_entries",
            "risks",
        )
        if user.role == Role.MINISTRY_LEADER:
            if not user.ministry_id:
                return Plan.objects.none()
            return qs.filter(ministry=user.ministry)
        return qs

    def get_permissions(self):
        if self.action == "create":
            return [IsMinistryLeader()]
        if self.action in ("approve", "return_plan"):
            return [IsAdminOrElder()]
        return super().get_permissions()

    def perform_create(self, serializer):
        user = self.request.user
        if not user.ministry_id:
            raise PermissionDenied("ለዚህ ዘርፍ ተመድቦ አይደለም")
        fy = FiscalYear.objects.filter(is_current=True).first()
        if not fy:
            raise ValidationError("ለአሁን ምንም የበጀት ዓመት አልተቀናጀም")
        if not fy.plan_window_open:
            raise ValidationError("የዕቅድ ማቅረቢያ መስኮቱ አልተከፈተም")
        if Plan.objects.filter(ministry=user.ministry, fiscal_year=fy).exists():
            raise ValidationError("ዕቅዱ አስቀድሞ ተፈጥሯል")
        plan = serializer.save(ministry=user.ministry, fiscal_year=fy)
        AuditLog.objects.create(
            actor=user,
            action=AuditLog.ACTION_PLAN_SAVE,
            object_type="Plan",
            object_id=plan.pk,
        )

    def update(self, request, *args, **kwargs):
        plan = self.get_object()
        self._assert_ministry_owner(request.user, plan)
        self._assert_editable(plan)

        serializer = PlanSaveSerializer(plan, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.ACTION_PLAN_SAVE,
            object_type="Plan",
            object_id=plan.pk,
        )
        logger.info("plan_saved", extra={"plan_id": plan.pk})
        return Response(PlanSerializer(plan).data)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        plan = self.get_object()
        self._assert_ministry_owner(request.user, plan)
        self._assert_editable(plan)
        plan.status = PlanStatus.SUBMITTED
        plan.submitted_at = timezone.now()
        plan.submitted_by = request.user
        plan.save(update_fields=["status", "submitted_at", "submitted_by"])
        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.ACTION_PLAN_SUBMIT,
            object_type="Plan",
            object_id=plan.pk,
        )
        logger.info("plan_submitted", extra={"plan_id": plan.pk})
        return Response(PlanSerializer(plan).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminOrElder])
    def approve(self, request, pk=None):
        plan = self.get_object()
        if plan.status != PlanStatus.SUBMITTED:
            raise ValidationError("ያቀረበ ዕቅድ ብቻ ሊጸድቅ ይችላል")
        plan.status = PlanStatus.APPROVED
        plan.reviewed_at = timezone.now()
        plan.reviewed_by = request.user
        plan.review_comment = request.data.get("comment", "")
        plan.save(update_fields=["status", "reviewed_at", "reviewed_by", "review_comment"])
        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.ACTION_PLAN_APPROVE,
            object_type="Plan",
            object_id=plan.pk,
            detail={"comment": plan.review_comment},
        )
        logger.info("plan_approved", extra={"plan_id": plan.pk})
        return Response(PlanSerializer(plan).data)

    @action(
        detail=True, methods=["post"],
        url_path="return", permission_classes=[IsAdminOrElder]
    )
    def return_plan(self, request, pk=None):
        plan = self.get_object()
        if plan.status != PlanStatus.SUBMITTED:
            raise ValidationError("ያቀረበ ዕቅድ ብቻ ሊመለስ ይችላል")
        comment = request.data.get("comment", "")
        if not comment:
            raise ValidationError({"comment": "አስተያየት ያስፈልጋል"})
        plan.status = PlanStatus.RETURNED
        plan.reviewed_at = timezone.now()
        plan.reviewed_by = request.user
        plan.review_comment = comment
        plan.save(update_fields=["status", "reviewed_at", "reviewed_by", "review_comment"])
        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.ACTION_PLAN_RETURN,
            object_type="Plan",
            object_id=plan.pk,
            detail={"comment": comment},
        )
        logger.info("plan_returned", extra={"plan_id": plan.pk})
        return Response(PlanSerializer(plan).data)

    def _assert_ministry_owner(self, user, plan: Plan):
        if user.role == Role.MINISTRY_LEADER and plan.ministry_id != user.ministry_id:
            raise PermissionDenied("ለዚህ ዘርፍ ዕቅድ ዝዳሰቻ የለዎትም")

    def _assert_editable(self, plan: Plan):
        if plan.status not in (PlanStatus.DRAFT, PlanStatus.RETURNED):
            raise ValidationError(
                "ቀርቦ ወይም ጸድቆ ያለ ዕቅድ ሊስተካከል አይችልም"
            )
