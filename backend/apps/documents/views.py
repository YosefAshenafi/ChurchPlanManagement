import logging
from pathlib import Path

from django.conf import settings
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.models import AuditLog
from apps.plans.models import Plan
from apps.reports.models import QuarterlyReport
from .models import AttachedDocument
from .storage import presigned_url, upload_file

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = set(settings.ALLOWED_DOCUMENT_EXTENSIONS)
MAX_BYTES = settings.MAX_DOCUMENT_BYTES


class DocumentUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response(
                {"detail": "ፋይሉ አልቀረበም"}, status=status.HTTP_400_BAD_REQUEST
            )
        if file.size > MAX_BYTES:
            return Response(
                {"detail": "ፋይሉ 25 MB ይበልጣል"}, status=status.HTTP_400_BAD_REQUEST
            )
        suffix = Path(file.name).suffix.lower()
        if suffix not in ALLOWED_EXTENSIONS:
            return Response(
                {"detail": f"ተፈቅዶ ያልሆነ ፋይል አይነት: {suffix}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        plan_id = request.data.get("plan_id")
        report_id = request.data.get("report_id")
        description = request.data.get("description", "")

        plan = report = None
        if plan_id:
            try:
                plan = Plan.objects.get(pk=plan_id, ministry=request.user.ministry)
            except Plan.DoesNotExist:
                return Response(
                    {"detail": "ዕቅዱ አልተገኘም"}, status=status.HTTP_404_NOT_FOUND
                )
        elif report_id:
            try:
                report = QuarterlyReport.objects.get(
                    pk=report_id, plan__ministry=request.user.ministry
                )
            except QuarterlyReport.DoesNotExist:
                return Response(
                    {"detail": "ሪፖርቱ አልተገኘም"}, status=status.HTTP_404_NOT_FOUND
                )
        else:
            return Response(
                {"detail": "plan_id ወይም report_id ይስጡ"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        key = upload_file(file, file.name, file.content_type or "application/octet-stream")
        doc = AttachedDocument.objects.create(
            plan=plan,
            report=report,
            original_name=file.name,
            storage_key=key,
            content_type=file.content_type or "application/octet-stream",
            size_bytes=file.size,
            description=description,
            uploaded_by=request.user,
        )
        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.ACTION_DOC_UPLOAD,
            object_type="AttachedDocument",
            object_id=doc.pk,
            detail={"key": key, "name": file.name},
        )
        return Response(
            {
                "id": doc.pk,
                "original_name": doc.original_name,
                "description": doc.description,
                "size_bytes": doc.size_bytes,
                "download_url": presigned_url(key),
            },
            status=status.HTTP_201_CREATED,
        )


class DocumentDownloadView(APIView):
    def get(self, request, pk: int):
        try:
            doc = AttachedDocument.objects.get(pk=pk)
        except AttachedDocument.DoesNotExist:
            return Response({"detail": "ሰነዱ አልተገኘም"}, status=status.HTTP_404_NOT_FOUND)

        from apps.accounts.models import Role
        user = request.user
        if user.role == Role.MINISTRY_LEADER:
            ministry = user.ministry
            owns = (
                (doc.plan and doc.plan.ministry == ministry)
                or (doc.report and doc.report.plan.ministry == ministry)
            )
            if not owns:
                return Response({"detail": "ዝዳሰቻ የለዎትም"}, status=status.HTTP_403_FORBIDDEN)

        return Response({"download_url": presigned_url(doc.storage_key)})
