from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PasswordResetView, UserViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")

urlpatterns = [
    path("", include(router.urls)),
    path("users/<int:pk>/reset-password/", PasswordResetView.as_view(), name="user-reset-password"),
]
