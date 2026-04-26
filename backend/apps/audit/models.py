from django.db import models


class AuditLog(models.Model):
    """Immutable record of every state transition in the system."""

    ACTION_PLAN_SAVE = "plan_save"
    ACTION_PLAN_SUBMIT = "plan_submit"
    ACTION_PLAN_APPROVE = "plan_approve"
    ACTION_PLAN_RETURN = "plan_return"
    ACTION_REPORT_SAVE = "report_save"
    ACTION_REPORT_SUBMIT = "report_submit"
    ACTION_WINDOW_OPEN = "window_open"
    ACTION_WINDOW_CLOSE = "window_close"
    ACTION_USER_CREATE = "user_create"
    ACTION_USER_DISABLE = "user_disable"
    ACTION_MINISTRY_CREATE = "ministry_create"
    ACTION_DOC_UPLOAD = "doc_upload"

    ACTION_CHOICES = (
        (ACTION_PLAN_SAVE, "ዕቅድ ተቀምጧል"),
        (ACTION_PLAN_SUBMIT, "ዕቅድ ቀርቧል"),
        (ACTION_PLAN_APPROVE, "ዕቅድ ጸድቋል"),
        (ACTION_PLAN_RETURN, "ዕቅድ ለክለሳ ተመልሷል"),
        (ACTION_REPORT_SAVE, "ሪፖርት ተቀምጧል"),
        (ACTION_REPORT_SUBMIT, "ሪፖርት ቀርቧል"),
        (ACTION_WINDOW_OPEN, "መስኮት ተከፍቷል"),
        (ACTION_WINDOW_CLOSE, "መስኮት ተዘግቷል"),
        (ACTION_USER_CREATE, "ተጠቃሚ ተፈጥሯል"),
        (ACTION_USER_DISABLE, "ተጠቃሚ ታግዷል"),
        (ACTION_MINISTRY_CREATE, "ዘርፍ ተፈጥሯል"),
        (ACTION_DOC_UPLOAD, "ሰነድ ተጭኗል"),
    )

    actor = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=32, choices=ACTION_CHOICES)
    object_type = models.CharField(max_length=64, blank=True)
    object_id = models.PositiveBigIntegerField(null=True, blank=True)
    detail = models.JSONField(default=dict, blank=True)
    occurred_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-occurred_at"]
        verbose_name = "ኦዲት ምዝገባ"
        verbose_name_plural = "ኦዲት ምዝገቦች"

    def __str__(self) -> str:
        return f"{self.actor} — {self.action} at {self.occurred_at}"
