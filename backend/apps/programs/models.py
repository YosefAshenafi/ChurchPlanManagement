from django.db import models


class AssemblyProgram(models.Model):
    """A church assembly program schedule (መርሃ-ግብር) created by an elder."""

    title = models.CharField(max_length=500, help_text="የፕሮግራሙ ርዕስ")
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="programs",
    )
    fiscal_year = models.ForeignKey(
        "ministries.FiscalYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="programs",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "ፕሮግራም"
        verbose_name_plural = "ፕሮግራሞች"

    def __str__(self) -> str:
        return self.title


class ProgramTask(models.Model):
    """A single row in an assembly program schedule."""

    program = models.ForeignKey(
        AssemblyProgram,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    order = models.PositiveIntegerField(default=1)
    description = models.TextField(help_text="ተግባራት")
    date_start = models.DateField(null=True, blank=True, help_text="የጊዜ ሰሌዳ ጀምሮ")
    date_end = models.DateField(null=True, blank=True, help_text="የጊዜ ሰሌዳ እስከ")
    responsible_ministry = models.ForeignKey(
        "ministries.Ministry",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="program_tasks",
        help_text="ፈጻሚ ዘርፍ",
    )
    include_elders = models.BooleanField(
        default=False,
        help_text="ሽማግሌዎችም ይካተታሉ?",
    )
    responsible_label = models.CharField(
        max_length=500,
        blank=True,
        help_text="ፈጻሚ አካል (ነፃ ጽሑፍ)",
    )

    class Meta:
        ordering = ["order"]
        verbose_name = "ፕሮግራም ተግባር"
        verbose_name_plural = "ፕሮግራም ተግባራት"

    def responsible_display(self) -> str:
        parts = []
        if self.responsible_ministry:
            parts.append(self.responsible_ministry.name_am)
        if self.include_elders:
            parts.append("ሽማግሌዎች")
        if self.responsible_label:
            parts.append(self.responsible_label)
        return " / ".join(parts) if parts else "—"

    def __str__(self) -> str:
        return f"{self.order}. {self.description[:60]}"
