from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FiscalYearViewSet, MinistryViewSet, ReportWindowViewSet

router = DefaultRouter()
router.register("ministries", MinistryViewSet, basename="ministry")
router.register("fiscal-years", FiscalYearViewSet, basename="fiscal-year")
router.register("report-windows", ReportWindowViewSet, basename="report-window")

urlpatterns = [path("", include(router.urls))]
