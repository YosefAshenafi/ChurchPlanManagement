from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.views import AvatarUploadView, MeView, ProfileUpdateView


def health(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("api/health/", health, name="health"),
    path("admin/", admin.site.urls),
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", MeView.as_view(), name="me"),
    path("api/auth/profile/", ProfileUpdateView.as_view(), name="profile-update"),
    path("api/auth/avatar/", AvatarUploadView.as_view(), name="avatar-upload"),
    path("api/", include("apps.accounts.urls")),
    path("api/", include("apps.ministries.urls")),
    path("api/", include("apps.plans.urls")),
    path("api/", include("apps.reports.urls")),
    path("api/", include("apps.documents.urls")),
    path("api/", include("apps.audit.urls")),
    path("api/", include("apps.programs.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
