from django.db import models


class Ministry(models.Model):
    """A ministry department of the assembly (children, youth, women, etc.)."""

    name_am = models.CharField(
        max_length=255,
        unique=True,
        help_text="የአገልግሎት ዘርፍ ስም",
    )
    name_en = models.CharField(max_length=255, blank=True)
    slug = models.SlugField(max_length=64, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name_am"]
        verbose_name = "የአገልግሎት ዘርፍ"
        verbose_name_plural = "የአገልግሎት ዘርፎች"

    def __str__(self) -> str:
        return self.name_am


class FiscalYear(models.Model):
    """Ethiopian fiscal year (ዓ/ም)."""

    label = models.CharField(
        max_length=16,
        unique=True,
        help_text="ለምሳሌ 2018 ዓ/ም",
    )
    starts_on = models.DateField()
    ends_on = models.DateField()
    is_current = models.BooleanField(default=False)
    plan_window_open = models.BooleanField(
        default=False,
        help_text="የዕቅድ መቀበያ መስኮት ክፍት ነው?",
    )

    class Meta:
        ordering = ["-starts_on"]
        verbose_name = "የበጀት ዓመት"
        verbose_name_plural = "የበጀት ዓመቶች"

    def __str__(self) -> str:
        return self.label

    def save(self, *args, **kwargs):
        if self.is_current:
            FiscalYear.objects.exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)


class ReportWindow(models.Model):
    """Tracks whether a ministry can submit a quarterly report for a quarter."""

    QUARTER_CHOICES = (
        (1, "አንደኛ ሩብ ዓመት"),
        (2, "ሁለተኛ ሩብ ዓመት"),
        (3, "ሦስተኛ ሩብ ዓመት"),
        (4, "አራተኛ ሩብ ዓመት"),
    )

    fiscal_year = models.ForeignKey(
        FiscalYear, on_delete=models.CASCADE, related_name="report_windows"
    )
    ministry = models.ForeignKey(
        Ministry, on_delete=models.CASCADE, related_name="report_windows"
    )
    quarter = models.PositiveSmallIntegerField(choices=QUARTER_CHOICES)
    is_open = models.BooleanField(default=False)
    opened_at = models.DateTimeField(null=True, blank=True)
    opened_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="opened_windows",
    )

    class Meta:
        unique_together = ("fiscal_year", "ministry", "quarter")
        ordering = ["fiscal_year", "ministry", "quarter"]

    def __str__(self) -> str:
        return f"{self.ministry} — {self.fiscal_year} Q{self.quarter}"
