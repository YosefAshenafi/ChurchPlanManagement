from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import QuarterlyReportViewSet

router = DefaultRouter()
router.register("reports", QuarterlyReportViewSet, basename="report")

urlpatterns = [path("", include(router.urls))]
