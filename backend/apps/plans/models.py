from django.db import models


class PlanStatus(models.TextChoices):
    DRAFT = "draft", "ረቂቅ"
    SUBMITTED = "submitted", "ቀርቧል"
    APPROVED = "approved", "ጸድቋል"
    RETURNED = "returned", "ለክለሳ ተመልሷል"


class Plan(models.Model):
    ministry = models.ForeignKey(
        "ministries.Ministry", on_delete=models.PROTECT, related_name="plans"
    )
    fiscal_year = models.ForeignKey(
        "ministries.FiscalYear", on_delete=models.PROTECT, related_name="plans"
    )
    status = models.CharField(
        max_length=16, choices=PlanStatus.choices, default=PlanStatus.DRAFT
    )
    introduction = models.TextField(blank=True, help_text="መግቢያ")
    general_objective = models.TextField(blank=True, help_text="አጠቃላይ ዓላማ")
    assumptions = models.TextField(blank=True, help_text="የዕቅዱ ታሳቢዎች")
    monitoring_evaluation = models.TextField(blank=True, help_text="የክትትልና ግምገማ ሥራዎች")
    submitted_at = models.DateTimeField(null=True, blank=True)
    submitted_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submitted_plans",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_plans",
    )
    review_comment = models.TextField(blank=True, help_text="የሽማግሌ አስተያየት")
    last_saved_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("ministry", "fiscal_year")
        ordering = ["-fiscal_year__starts_on"]
        verbose_name = "ዕቅድ"
        verbose_name_plural = "ዕቅዶች"

    def __str__(self) -> str:
        return f"{self.ministry} — {self.fiscal_year}"


class PlanGoal(models.Model):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="goals")
    order = models.PositiveSmallIntegerField(default=1)
    title = models.CharField(max_length=512, help_text="ግብ ርዕስ")
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["order"]
        verbose_name = "ዋና ግብ"
        verbose_name_plural = "ዋና ዋና ግቦች"

    def __str__(self) -> str:
        return f"{self.plan} — ግብ {self.order}"


class PlanOutput(models.Model):
    """An expected output (ውጤት) under a goal, with measure and quantity."""

    goal = models.ForeignKey(PlanGoal, on_delete=models.CASCADE, related_name="outputs")
    order = models.PositiveSmallIntegerField(default=1)
    description = models.CharField(max_length=512, help_text="የሚጠበቅ ውጤት")
    measure = models.CharField(max_length=128, blank=True, help_text="መለኪያ")
    quantity = models.CharField(max_length=64, blank=True, help_text="ብዛት")

    class Meta:
        ordering = ["order"]

    def __str__(self) -> str:
        return f"{self.goal} — ውጤት {self.order}"


class PlanActivity(models.Model):
    """A detailed activity (ዝርዝር ተግባር) under an output, labeled ሀ/ለ/ሐ."""

    output = models.ForeignKey(
        PlanOutput, on_delete=models.CASCADE, related_name="activities"
    )
    order = models.PositiveSmallIntegerField(default=1)
    description = models.CharField(max_length=1024, help_text="ዝርዝር ተግባር")

    class Meta:
        ordering = ["order"]

    def __str__(self) -> str:
        return f"{self.output} — ተግባር {self.order}"


class PlanBudgetLine(models.Model):
    """Line-item budget row for the detailed costing sheet."""

    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="budget_lines")
    goal = models.ForeignKey(
        PlanGoal,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="budget_lines",
    )
    row_number = models.PositiveSmallIntegerField(default=1)
    description = models.CharField(max_length=512, help_text="ተግባራት")
    measure = models.CharField(max_length=64, blank=True, help_text="መለኪያ")
    quantity = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, help_text="ብዛት"
    )
    unit_price = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True, help_text="የነጠላ ዋጋ"
    )
    note = models.CharField(max_length=255, blank=True, help_text="መግለጫ")

    @property
    def total_price(self):
        if self.quantity is not None and self.unit_price is not None:
            return self.quantity * self.unit_price
        return None

    class Meta:
        ordering = ["row_number"]

    def __str__(self) -> str:
        return f"{self.plan} — የበጀት ረድፍ {self.row_number}"


class PlanBudgetAllocation(models.Model):
    """Quarter-by-quarter budget allocation per goal."""

    plan = models.ForeignKey(
        Plan, on_delete=models.CASCADE, related_name="budget_allocations"
    )
    goal = models.ForeignKey(
        PlanGoal, on_delete=models.CASCADE, related_name="budget_allocations"
    )
    requested_total = models.DecimalField(
        max_digits=14, decimal_places=2, default=0, help_text="የተጠየቀ በጀት"
    )
    q1_budget = models.DecimalField(
        max_digits=14, decimal_places=2, default=0, help_text="አንደኛ ሩብ ዓመት"
    )
    q2_budget = models.DecimalField(
        max_digits=14, decimal_places=2, default=0, help_text="ሁለተኛ ሩብ ዓመት"
    )
    q3_budget = models.DecimalField(
        max_digits=14, decimal_places=2, default=0, help_text="ሦስተኛ ሩብ ዓመት"
    )
    q4_budget = models.DecimalField(
        max_digits=14, decimal_places=2, default=0, help_text="አራተኛ ሩብ ዓመት"
    )
    note = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ("plan", "goal")


class PlanScheduleEntry(models.Model):
    """Action plan schedule: which quarters an activity is planned for."""

    plan = models.ForeignKey(
        Plan, on_delete=models.CASCADE, related_name="schedule_entries"
    )
    goal = models.ForeignKey(PlanGoal, on_delete=models.CASCADE)
    activity_description = models.CharField(max_length=1024)
    q1 = models.BooleanField(default=False)
    q2 = models.BooleanField(default=False)
    q3 = models.BooleanField(default=False)
    q4 = models.BooleanField(default=False)

    class Meta:
        ordering = ["goal__order"]


class PlanRisk(models.Model):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="risks")
    order = models.PositiveSmallIntegerField(default=1)
    risk = models.TextField(help_text="ሊያጋጥሙ የሚችሉ ተግዳሮቶች")
    mitigation = models.TextField(blank=True, help_text="የመፍትሄ እርምጃ")

    class Meta:
        ordering = ["order"]
