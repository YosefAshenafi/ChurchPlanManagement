from rest_framework.pagination import PageNumberPagination
from rest_framework.viewsets import ReadOnlyModelViewSet

from apps.accounts.permissions import IsAdmin
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


class AuditLogViewSet(ReadOnlyModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = AuditLogSerializer
    pagination_class = AuditLogPagination
    queryset = AuditLog.objects.select_related("actor").order_by("-occurred_at")

    def get_queryset(self):
        qs = super().get_queryset()
        action_filter = self.request.query_params.get("action")
        actor_filter = self.request.query_params.get("actor")
        if action_filter:
            qs = qs.filter(action=action_filter)
        if actor_filter:
            qs = qs.filter(actor__username__icontains=actor_filter)
        return qs
