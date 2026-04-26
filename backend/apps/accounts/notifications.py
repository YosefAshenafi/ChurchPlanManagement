"""Email notification helpers. All sends are fire-and-forget; errors are logged, never raised."""
import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def _enabled() -> bool:
    return getattr(settings, "EMAIL_NOTIFICATIONS_ENABLED", False)


def _emails_for_roles(*roles: str) -> list[str]:
    from apps.accounts.models import User
    return list(
        User.objects.filter(role__in=roles, is_active=True)
        .exclude(email="")
        .values_list("email", flat=True)
    )


def _emails_for_ministry(ministry_id: int) -> list[str]:
    from apps.accounts.models import User, Role
    return list(
        User.objects.filter(
            ministry_id=ministry_id, role=Role.MINISTRY_LEADER, is_active=True
        )
        .exclude(email="")
        .values_list("email", flat=True)
    )


def _send(subject: str, body: str, recipients: list[str]) -> None:
    if not _enabled() or not recipients:
        return
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            fail_silently=False,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("email_send_failed", extra={"error": str(exc), "subject": subject})


# ── Plan events ───────────────────────────────────────────────────────────────

def notify_plan_submitted(plan) -> None:
    recipients = _emails_for_roles("elder", "admin")
    _send(
        subject="ዕቅድ ቀርቧል — 22 ማዞሪያ ሙሉ ወንጌል አጥቢያ",
        body=(
            f"ዕቅድ ቀርቧል\n\n"
            f"ዘርፍ: {plan.ministry}\n"
            f"ዓ/ም: {plan.fiscal_year}\n\n"
            "ለማረጋገጥ ወይም ለመመለስ ስርዓቱን ይጎብኙ።"
        ),
        recipients=recipients,
    )


def notify_plan_approved(plan) -> None:
    recipients = _emails_for_ministry(plan.ministry_id)
    _send(
        subject="ዕቅድዎ ጸድቋል — 22 ማዞሪያ ሙሉ ወንጌል አጥቢያ",
        body=(
            f"ዕቅድዎ ተፈቅዷል\n\n"
            f"ዘርፍ: {plan.ministry}\n"
            f"ዓ/ም: {plan.fiscal_year}\n"
            f"አስተያየት: {plan.review_comment or '—'}"
        ),
        recipients=recipients,
    )


def notify_plan_returned(plan) -> None:
    recipients = _emails_for_ministry(plan.ministry_id)
    _send(
        subject="ዕቅድዎ ለክለሳ ተመልሷል — 22 ማዞሪያ ሙሉ ወንጌል አጥቢያ",
        body=(
            f"ዕቅድዎ ለክለሳ ተመልሷል\n\n"
            f"ዘርፍ: {plan.ministry}\n"
            f"ዓ/ም: {plan.fiscal_year}\n"
            f"አስተያየት: {plan.review_comment or '—'}\n\n"
            "ዕቅዱን ከሽማግሌ አስተያየት አሻሽለው እንደገና ያስገቡ።"
        ),
        recipients=recipients,
    )


# ── Report events ─────────────────────────────────────────────────────────────

QUARTER_AM = {1: "አንደኛ", 2: "ሁለተኛ", 3: "ሦስተኛ", 4: "አራተኛ"}


def notify_report_submitted(report) -> None:
    recipients = _emails_for_roles("elder", "admin")
    quarter_label = QUARTER_AM.get(report.quarter, str(report.quarter))
    _send(
        subject="ሪፖርት ቀርቧል — 22 ማዞሪያ ሙሉ ወንጌል አጥቢያ",
        body=(
            f"ሪፖርት ቀርቧል\n\n"
            f"ዘርፍ: {report.plan.ministry}\n"
            f"ሩብ ዓመት: {quarter_label}\n"
            f"ዓ/ም: {report.plan.fiscal_year}\n\n"
            "ለማስተዳደር ስርዓቱን ይጎብኙ።"
        ),
        recipients=recipients,
    )
