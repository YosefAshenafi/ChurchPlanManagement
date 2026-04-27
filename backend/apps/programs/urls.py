from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AssemblyProgramViewSet

router = DefaultRouter()
router.register("programs", AssemblyProgramViewSet, basename="program")

urlpatterns = [
    path("", include(router.urls)),
]
