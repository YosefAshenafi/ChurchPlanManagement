from django.db import models


class ReportStatus(models.TextChoices):
    LOCKED = "locked", "ተቆልፏል"
    OPEN = "open", "ክፍት"
    DRAFT = "draft", "ረቂቅ"
    SUBMITTED = "submitted", "ቀርቧል"


class QuarterlyReport(models.Model):
    plan = models.ForeignKey(
        "plans.Plan", on_delete=models.PROTECT, related_name="quarterly_reports"
    )
    quarter = models.PositiveSmallIntegerField(
        choices=(
            (1, "አንደኛ ሩብ ዓመት"),
            (2, "ሁለተኛ ሩብ ዓመት"),
            (3, "ሦስተኛ ሩብ ዓመት"),
            (4, "አራተኛ ሩብ ዓመት"),
        )
    )
    status = models.CharField(
        max_length=16, choices=ReportStatus.choices, default=ReportStatus.LOCKED
    )
    introduction = models.TextField(blank=True, help_text="መግቢያ")
    quantitative_results = models.TextField(
        blank=True, help_text="አሃዛዊ ውጤቶች"
    )
    unplanned_activities = models.TextField(
        blank=True, help_text="በዕቅድ ሳይካተቱ የተከናወኑ ተግባራት"
    )
    challenges = models.TextField(blank=True, help_text="ተግዳሮቶች")
    best_practices = models.TextField(blank=True, help_text="መልካም ልምዶች")
    prayer_topics = models.TextField(blank=True, help_text="የጸሎት/የምስጋና ርዕሶች")
    submitted_at = models.DateTimeField(null=True, blank=True)
    submitted_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submitted_reports",
    )
    last_saved_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("plan", "quarter")
        ordering = ["quarter"]
        verbose_name = "ሩብ ዓመት ሪፖርት"
        verbose_name_plural = "ሩብ ዓመት ሪፖርቶች"

    def __str__(self) -> str:
        return f"{self.plan} — ሩብ ዓመት {self.quarter}"


class ReportActivityProgress(models.Model):
    """Progress entry for each planned goal/activity in a quarterly report."""

    report = models.ForeignKey(
        QuarterlyReport, on_delete=models.CASCADE, related_name="activity_progress"
    )
    goal = models.ForeignKey(
        "plans.PlanGoal", on_delete=models.CASCADE, related_name="progress_entries"
    )
    activity_description = models.CharField(
        max_length=1024, help_text="ዝርዝር ተግባር"
    )
    planned = models.TextField(
        blank=True, help_text="ለሩብ ዓመቱ የታቀዱ ተግባራት"
    )
    completed_percent = models.PositiveSmallIntegerField(
        default=0, help_text="የተከናወነ %"
    )
    note = models.TextField(blank=True, help_text="መግለጫ")
    is_carried_over = models.BooleanField(
        default=False, help_text="ካለፈ ሩብ ዓመት የተሻገረ?"
    )

    class Meta:
        ordering = ["goal__order"]


class ReportBudgetUtilization(models.Model):
    """Budget utilization per goal for a quarterly report."""

    report = models.ForeignKey(
        QuarterlyReport, on_delete=models.CASCADE, related_name="budget_utilization"
    )
    goal = models.ForeignKey(
        "plans.PlanGoal", on_delete=models.CASCADE, related_name="budget_utilization"
    )
    approved_budget = models.DecimalField(
        max_digits=14, decimal_places=2, default=0, help_text="የተፈቀደ በጀት"
    )
    used_budget = models.DecimalField(
        max_digits=14, decimal_places=2, default=0, help_text="ሥራ ላይ የዋለ"
    )
    note = models.TextField(blank=True)

    @property
    def used_percent(self):
        if self.approved_budget > 0:
            return round((self.used_budget / self.approved_budget) * 100, 1)
        return 0

    class Meta:
        unique_together = ("report", "goal")


class CarriedOverTask(models.Model):
    """Tasks that carry over from previous quarters."""

    report = models.ForeignKey(
        QuarterlyReport, on_delete=models.CASCADE, related_name="carried_over_tasks"
    )
    description = models.TextField(help_text="ተግባር")
    note = models.TextField(blank=True)

    class Meta:
        ordering = ["id"]


class NextQuarterPlan(models.Model):
    """Planned activities for the next quarter (section 8 of report)."""

    report = models.ForeignKey(
        QuarterlyReport, on_delete=models.CASCADE, related_name="next_quarter_plans"
    )
    order = models.PositiveSmallIntegerField(default=1)
    description = models.TextField(help_text="ለቀጣዩ ሩብ ዓመት የሚከናወን ተግባር")

    class Meta:
        ordering = ["order"]
