from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    ADMIN = "admin", "አስተዳዳሪ"
    ELDER = "elder", "ሽማግሌ"
    MINISTRY_LEADER = "ministry_leader", "የአገልግሎት ዘርፍ ኃላፊ"


class User(AbstractUser):
    role = models.CharField(
        max_length=32,
        choices=Role.choices,
        default=Role.MINISTRY_LEADER,
    )
    full_name_am = models.CharField(
        max_length=255,
        blank=True,
        help_text="ሙሉ ስም በአማርኛ",
    )
    ministry = models.ForeignKey(
        "ministries.Ministry",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="leaders",
    )

    def is_admin(self) -> bool:
        return self.role == Role.ADMIN

    def is_elder(self) -> bool:
        return self.role == Role.ELDER

    def is_ministry_leader(self) -> bool:
        return self.role == Role.MINISTRY_LEADER

    def __str__(self) -> str:
        return f"{self.username} ({self.role})"
