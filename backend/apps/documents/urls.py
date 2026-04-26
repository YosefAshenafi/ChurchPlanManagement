from django.urls import path
from .views import DocumentDownloadView, DocumentUploadView

urlpatterns = [
    path("documents/upload/", DocumentUploadView.as_view(), name="document-upload"),
    path("documents/<int:pk>/download/", DocumentDownloadView.as_view(), name="document-download"),
]
