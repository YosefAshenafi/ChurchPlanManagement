from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.views import MeView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", MeView.as_view(), name="me"),
    path("api/", include("apps.accounts.urls")),
    path("api/", include("apps.ministries.urls")),
    path("api/", include("apps.plans.urls")),
    path("api/", include("apps.reports.urls")),
    path("api/", include("apps.documents.urls")),
]
