"""
Production user seeding: ensures admin (Yosef), elders, ministries, and
ministry leaders exist. Idempotent — safe to run on every deploy.
Does NOT create demo plans, fiscal years, or report windows.
"""
import os

from django.core.management.base import BaseCommand

from apps.accounts.models import Role, User
from apps.ministries.models import Ministry

MINISTRIES = [
    ("ሕጻናት ዘርፍ", "Children Ministry", "children"),
    ("ወጣቶች ዘርፍ", "Youth Ministry", "youth"),
    ("ሴቶች ዘርፍ", "Women Ministry", "women"),
    ("አምልኮ ዘርፍ", "Worship Ministry", "worship"),
    ("ወንጌላዊ ዘርፍ", "Evangelism Ministry", "evangelism"),
]

ELDERS = [
    ("elder1", "ሽማግሌ አንድ", "elder1@church.et"),
    ("elder2", "ሽማግሌ ሁለት", "elder2@church.et"),
]

# Default admin credentials from environment variables
DEFAULT_ADMIN_USERNAME = os.getenv("DEFAULT_ADMIN_USERNAME", "Yosef")
DEFAULT_ADMIN_EMAIL = os.getenv("DEFAULT_ADMIN_EMAIL", "yosef@church.et")
DEFAULT_ADMIN_PASSWORD = os.getenv("DEFAULT_ADMIN_PASSWORD", "P@ssw0rds")
DEFAULT_ADMIN_FULL_NAME_AM = os.getenv("DEFAULT_ADMIN_FULL_NAME_AM", "ዮሴፍ")


class Command(BaseCommand):
    help = "Seed production users (admin, elders, leaders) and ministries. Idempotent."

    def handle(self, *args, **options):
        self.stdout.write(f"  Admin username from env: {DEFAULT_ADMIN_USERNAME}")
        self.stdout.write(f"  Admin email from env: {DEFAULT_ADMIN_EMAIL}")
        self.stdout.write(f"  Password from env: {'SET' if DEFAULT_ADMIN_PASSWORD else 'NOT SET'}")
        self._create_default_admin()
        ministries = self._create_ministries()
        self._create_elders()
        self._create_leaders(ministries)
        self.stdout.write(self.style.SUCCESS("✓ User seed complete"))

    def _create_default_admin(self):
        user, created = User.objects.get_or_create(
            username=DEFAULT_ADMIN_USERNAME,
            defaults={
                "email": DEFAULT_ADMIN_EMAIL,
                "role": Role.ADMIN,
                "full_name_am": DEFAULT_ADMIN_FULL_NAME_AM,
                "is_superuser": True,
                "is_staff": True,
            },
        )
        # Always update password to match current env var (allows password resets)
        user.set_password(DEFAULT_ADMIN_PASSWORD)
        user.email = DEFAULT_ADMIN_EMAIL
        user.role = Role.ADMIN
        user.is_superuser = True
        user.is_staff = True
        user.save()
        
        if created:
            self.stdout.write(f"  created admin: {DEFAULT_ADMIN_USERNAME}")
        else:
            self.stdout.write(f"  updated admin: {DEFAULT_ADMIN_USERNAME}")

    def _create_ministries(self):
        result = []
        for name_am, name_en, slug in MINISTRIES:
            m, created = Ministry.objects.get_or_create(
                slug=slug,
                defaults={"name_am": name_am, "name_en": name_en},
            )
            if created:
                self.stdout.write(f"  created ministry: {name_am}")
            result.append(m)
        return result

    def _create_elders(self):
        for username, full_name, email in ELDERS:
            if not User.objects.filter(username=username).exists():
                u = User(
                    username=username,
                    email=email,
                    role=Role.ELDER,
                    full_name_am=full_name,
                )
                u.set_password("Elder1234!")
                u.save()
                self.stdout.write(f"  created elder: {username}")

    def _create_leaders(self, ministries):
        for i, ministry in enumerate(ministries, start=1):
            username = f"leader{i}"
            if not User.objects.filter(username=username).exists():
                u = User(
                    username=username,
                    email=f"leader{i}@church.et",
                    role=Role.MINISTRY_LEADER,
                    full_name_am=f"ዘርፍ ኃላፊ {i}",
                    ministry=ministry,
                )
                u.set_password("Leader1234!")
                u.save()
                self.stdout.write(f"  created leader: {username} → {ministry}")
