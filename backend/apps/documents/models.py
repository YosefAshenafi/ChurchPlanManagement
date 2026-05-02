from django.db import models


class AttachedDocument(models.Model):
    """A file attached to either a Plan or a QuarterlyReport."""

    plan = models.ForeignKey(
        "plans.Plan",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="documents",
    )
    report = models.ForeignKey(
        "reports.QuarterlyReport",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="documents",
    )
    original_name = models.CharField(max_length=512)
    storage_key = models.CharField(
        max_length=1024, help_text="Cloudinary public_id"
    )
    content_type = models.CharField(max_length=128)
    size_bytes = models.PositiveBigIntegerField()
    description = models.CharField(
        max_length=512, blank=True, help_text="ሰነዱ መግለጫ በአማርኛ"
    )
    uploaded_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_documents",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]
        verbose_name = "ሰነድ"
        verbose_name_plural = "ሰነዶች"

    def __str__(self) -> str:
        return self.original_name
