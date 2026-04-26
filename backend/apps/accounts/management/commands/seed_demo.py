"""
Seed demo data: admin, elders, ministries, ministry leaders,
current fiscal year, and one prior-year approved plan per ministry.
Safe to run multiple times (idempotent).
"""
import datetime
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import Role, User
from apps.ministries.models import FiscalYear, Ministry, ReportWindow
from apps.plans.models import (
    Plan, PlanGoal, PlanOutput, PlanActivity,
    PlanBudgetLine, PlanBudgetAllocation, PlanScheduleEntry,
    PlanStatus,
)

MINISTRIES = [
    ("ሕጻናት ዘርፍ", "Children Ministry", "children"),
    ("ወጣቶች ዘርፍ", "Youth Ministry", "youth"),
    ("ሴቶች ዘርፍ", "Women Ministry", "women"),
    ("አምልኮ ዘርፍ", "Worship Ministry", "worship"),
    ("ወንጌላዊ ዘርፍ", "Evangelism Ministry", "evangelism"),
]

DEMO_ELDERS = [
    ("elder1", "ሽማግሌ አንድ", "elder1@church.et"),
    ("elder2", "ሽማግሌ ሁለት", "elder2@church.et"),
]


class Command(BaseCommand):
    help = "Seed demo data (idempotent)"

    def handle(self, *args, **options):
        self._create_admin()
        self._create_elders()
        ministries = self._create_ministries()
        leaders = self._create_leaders(ministries)
        prior_fy, current_fy = self._create_fiscal_years()
        self._create_plans(ministries, leaders, prior_fy, leaders[0], approved=True)
        self._create_report_windows(ministries, current_fy)
        self.stdout.write(self.style.SUCCESS("✓ Seed complete"))

    def _create_admin(self):
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                username="admin",
                email="admin@church.et",
                password="Admin1234!",
                role=Role.ADMIN,
                full_name_am="አስተዳዳሪ",
            )
            self.stdout.write("  created admin")

    def _create_elders(self):
        for username, full_name, email in DEMO_ELDERS:
            if not User.objects.filter(username=username).exists():
                u = User(
                    username=username, email=email,
                    role=Role.ELDER, full_name_am=full_name,
                )
                u.set_password("Elder1234!")
                u.save()
                self.stdout.write(f"  created elder: {username}")

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

    def _create_leaders(self, ministries: list[Ministry]) -> list[User]:
        leaders = []
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
            else:
                u = User.objects.get(username=username)
            leaders.append(u)
        return leaders

    def _create_fiscal_years(self) -> tuple[FiscalYear, FiscalYear]:
        prior, _ = FiscalYear.objects.get_or_create(
            label="2016 ዓ/ም",
            defaults={
                "starts_on": datetime.date(2023, 9, 11),
                "ends_on": datetime.date(2024, 9, 10),
                "is_current": False,
                "plan_window_open": False,
            },
        )
        current, _ = FiscalYear.objects.get_or_create(
            label="2017 ዓ/ም",
            defaults={
                "starts_on": datetime.date(2024, 9, 11),
                "ends_on": datetime.date(2025, 9, 10),
                "is_current": True,
                "plan_window_open": True,
            },
        )
        return prior, current

    def _create_plans(
        self,
        ministries: list[Ministry],
        leaders: list[User],
        fy: FiscalYear,
        reviewer: User,
        approved: bool,
    ):
        for ministry, leader in zip(ministries, leaders):
            if Plan.objects.filter(ministry=ministry, fiscal_year=fy).exists():
                continue
            plan = Plan.objects.create(
                ministry=ministry,
                fiscal_year=fy,
                status=PlanStatus.APPROVED if approved else PlanStatus.DRAFT,
                introduction=(
                    f"{ministry.name_am} ለ{fy.label} ዓ/ም ዕቅድ ።"
                    " ይህ ዘርፍ ለቤተ ክርስቲያናችን ስኬት ትልቅ ሚና ይጫወታል።"
                ),
                general_objective=(
                    f"በ{fy.label} ዓ/ም የ{ministry.name_am} አገልግሎት "
                    "ደረጃ ከፍ ማድረግ።"
                ),
                assumptions="አስፈላጊ ሀብቶችና ድጋፍ ይኖራል ተብሎ ይገምታል።",
                monitoring_evaluation="በየሩብ ዓመቱ ክትትልና ግምገማ ይደረጋል።",
                submitted_at=timezone.now(),
                submitted_by=leader,
                reviewed_at=timezone.now() if approved else None,
                reviewed_by=reviewer if approved else None,
                review_comment="ዕቅዱ ጸድቋል" if approved else "",
            )
            goal1 = PlanGoal.objects.create(
                plan=plan, order=1,
                title="ሕዝቡን ማሳደግ",
                description="የምዕመኑ ቁጥር ማሳደግ",
            )
            output1 = PlanOutput.objects.create(
                goal=goal1, order=1,
                description="ወርሃዊ ፕሮግራሞች",
                measure="ፕሮግራም", quantity="12",
            )
            PlanActivity.objects.create(output=output1, order=1, description="ወርሃዊ ሴሚናር ማዘጋጀት")
            PlanActivity.objects.create(output=output1, order=2, description="ቡድን ስብሰባ ማካሄድ")

            goal2 = PlanGoal.objects.create(
                plan=plan, order=2,
                title="ሀብት ማሰባሰብ",
                description="ለዘርፉ አስፈላጊ ሀብት ማሰባሰብ",
            )
            PlanOutput.objects.create(
                goal=goal2, order=1,
                description="ልዩ ፕሮጀክቶች",
                measure="ፕሮጀክት", quantity="2",
            )

            PlanBudgetLine.objects.create(
                plan=plan, goal=goal1, row_number=1,
                description="ሴሚናር ወጪ",
                measure="ጊዜ", quantity=Decimal("12"),
                unit_price=Decimal("500"),
            )
            PlanBudgetAllocation.objects.create(
                plan=plan, goal=goal1,
                requested_total=Decimal("6000"),
                q1_budget=Decimal("1500"), q2_budget=Decimal("1500"),
                q3_budget=Decimal("1500"), q4_budget=Decimal("1500"),
            )
            PlanScheduleEntry.objects.create(
                plan=plan, goal=goal1,
                activity_description="ወርሃዊ ሴሚናር",
                q1=True, q2=True, q3=True, q4=True,
            )
            self.stdout.write(f"  created plan: {ministry} — {fy}")

    def _create_report_windows(self, ministries: list[Ministry], fy: FiscalYear):
        for ministry in ministries:
            for quarter in range(1, 5):
                ReportWindow.objects.get_or_create(
                    fiscal_year=fy, ministry=ministry, quarter=quarter,
                    defaults={"is_open": quarter == 1},
                )
