from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PlanViewSet

router = DefaultRouter()
router.register("plans", PlanViewSet, basename="plan")

urlpatterns = [path("", include(router.urls))]
