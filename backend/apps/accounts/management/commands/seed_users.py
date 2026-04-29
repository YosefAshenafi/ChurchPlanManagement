"""
Production user seeding: ensures admin (Yosef), elders, ministries, and
ministry leaders exist. Idempotent — safe to run on every deploy.
Does NOT create demo plans, fiscal years, or report windows.
"""
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


class Command(BaseCommand):
    help = "Seed production users (Yosef admin, elders, leaders) and ministries. Idempotent."

    def handle(self, *args, **options):
        self._create_yosef()
        ministries = self._create_ministries()
        self._create_elders()
        self._create_leaders(ministries)
        self.stdout.write(self.style.SUCCESS("✓ User seed complete"))

    def _create_yosef(self):
        if not User.objects.filter(username="Yosef").exists():
            User.objects.create_superuser(
                username="Yosef",
                email="yosef@church.et",
                password="P@ssw0rds",
                role=Role.ADMIN,
                full_name_am="ዮሴፍ",
            )
            self.stdout.write("  created admin: Yosef")

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
