"""PDF export for quarterly reports using ReportLab with Amharic font support."""
import io
import os

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

CHURCH = "22 Mazoria Full Gospel Church"
QUARTER_AM = {1: "አንደኛ ሩብ ዓመት", 2: "ሁለተኛ ሩብ ዓመት", 3: "ሦስተኛ ሩብ ዓመት", 4: "አራተኛ ሩብ ዓመት"}

_FONT_REGISTERED = False
_AM_FONT = "NotoSansEthiopic"
_FALLBACK_FONT = "Helvetica"


def _get_am_font() -> str:
    global _FONT_REGISTERED, _AM_FONT
    if _FONT_REGISTERED:
        return _AM_FONT
    font_candidates = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "fonts", "NotoSansEthiopic-Regular.ttf")),
        "/usr/share/fonts/truetype/noto/NotoSansEthiopic-Regular.ttf",
        "/usr/share/fonts/noto/NotoSansEthiopic-Regular.ttf",
    ]
    for path in font_candidates:
        if os.path.exists(path):
            try:
                pdfmetrics.registerFont(TTFont(_AM_FONT, path))
                _FONT_REGISTERED = True
                return _AM_FONT
            except Exception:
                pass
    _AM_FONT = _FALLBACK_FONT
    _FONT_REGISTERED = True
    return _AM_FONT


def _styles():
    am = _get_am_font()
    base = getSampleStyleSheet()
    title = ParagraphStyle(
        "RTitle", parent=base["Title"], fontSize=14, spaceAfter=4,
        fontName=am, textColor=colors.HexColor("#14532D"),
    )
    heading = ParagraphStyle(
        "RHeading", parent=base["Heading2"], fontSize=11,
        spaceBefore=14, spaceAfter=6, fontName=am,
        textColor=colors.HexColor("#14532D"),
    )
    sub = ParagraphStyle(
        "RSub", parent=base["Heading3"], fontSize=10,
        spaceBefore=10, spaceAfter=4, fontName=am,
        textColor=colors.HexColor("#166534"),
    )
    body = ParagraphStyle(
        "RBody", parent=base["Normal"], fontSize=9, leading=14, spaceAfter=6,
        fontName=am,
    )
    label = ParagraphStyle(
        "RLabel", parent=base["Normal"], fontSize=8, fontName=am,
        textColor=colors.HexColor("#64748B"), spaceAfter=2,
    )
    return title, heading, sub, body, label, am


def _divider():
    return HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#D1FAE5"), spaceAfter=6)


def _cell(text: str, am: str) -> Paragraph:
    s = ParagraphStyle("rcell", fontName=am, fontSize=8, leading=11, wordWrap="RTL")
    return Paragraph(str(text).replace("&", "&amp;").replace("<", "&lt;"), s)


def generate_report_pdf(report) -> bytes:
    buffer = io.BytesIO()
    quarter_label = QUARTER_AM.get(report.quarter, f"ሩብ {report.quarter}")
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
        title=f"Quarterly Report — {quarter_label}",
        author=CHURCH,
    )

    title_style, heading_style, sub_style, body_style, label_style, am = _styles()
    story = []

    # ── Cover ──
    story.append(Paragraph(CHURCH, title_style))
    story.append(Paragraph(f"ሩብ ዓመት ሪፖርት — {quarter_label}", title_style))
    story.append(Spacer(1, 6))

    meta_data = [
        [_cell("ዘርፍ:", am), _cell(str(report.plan.ministry), am)],
        [_cell("በጀት ዓ/ም:", am), _cell(str(report.plan.fiscal_year), am)],
        [_cell("ሩብ ዓመት:", am), _cell(quarter_label, am)],
        [_cell("ሁኔታ:", am), _cell(report.get_status_display(), am)],
    ]
    if report.submitted_at:
        meta_data.append([_cell("ቀርቧል:", am), _cell(report.submitted_at.strftime("%Y-%m-%d"), am)])

    meta_tbl = Table(meta_data, colWidths=[5 * cm, None])
    meta_tbl.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_tbl)
    story.append(_divider())

    # ── Introduction ──
    if report.introduction:
        story.append(Paragraph("1. መግቢያ", heading_style))
        story.append(Paragraph(report.introduction.replace("\n", "<br/>").replace("&", "&amp;"), body_style))

    # ── Activity Progress ──
    progress = list(report.activity_progress.select_related("goal"))
    if progress:
        story.append(Paragraph("2. ለሩብ ዓመቱ የታቀዱ እና የተከናወኑ ተግባራት", heading_style))
        prog_data = [[
            _cell("ግብ", am), _cell("ተግባር", am),
            _cell("ዕቅድ", am), _cell("ተጠናቅቋል %", am), _cell("ማስታወሻ", am),
        ]]
        for ap in progress:
            prog_data.append([
                _cell(str(ap.goal) if ap.goal else "", am),
                _cell(ap.activity_description[:50], am),
                _cell((ap.planned or "")[:40], am),
                _cell(f"{ap.completed_percent}%", am),
                _cell((ap.note or "")[:40], am),
            ])
        prog_tbl = Table(
            prog_data,
            colWidths=[3 * cm, 5 * cm, 4 * cm, 2 * cm, 3 * cm],
            repeatRows=1,
        )
        prog_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#DCFCE7")),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(prog_tbl)

    # ── Budget Utilization ──
    budget_util = list(report.budget_utilization.select_related("goal"))
    if budget_util:
        story.append(Paragraph("3. የበጀት አጠቃቀም", heading_style))
        bud_data = [[
            _cell("ግብ", am), _cell("የጸደቀ በጀት", am),
            _cell("የተጠቀሙ", am), _cell("ጥቅም %", am), _cell("ማስታወሻ", am),
        ]]
        for bu in budget_util:
            bud_data.append([
                _cell(str(bu.goal) if bu.goal else "", am),
                _cell(f"{bu.approved_budget:,.2f}", am),
                _cell(f"{bu.used_budget:,.2f}", am),
                _cell(f"{bu.used_percent}%", am),
                _cell((bu.note or "")[:50], am),
            ])
        bud_tbl = Table(
            bud_data,
            colWidths=[4 * cm, 3.5 * cm, 3.5 * cm, 2 * cm, 4 * cm],
            repeatRows=1,
        )
        bud_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#DCFCE7")),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(bud_tbl)

    if report.quantitative_results:
        story.append(Paragraph("4. አሃዛዊ ውጤቶች", heading_style))
        story.append(Paragraph(report.quantitative_results.replace("\n", "<br/>").replace("&", "&amp;"), body_style))

    if report.unplanned_activities:
        story.append(Paragraph("5. በዕቅድ ሳይካተቱ የተከናወኑ ተግባራት", heading_style))
        story.append(Paragraph(report.unplanned_activities.replace("\n", "<br/>").replace("&", "&amp;"), body_style))

    if report.challenges:
        story.append(Paragraph("6. ተግዳሮቶችና የወሰዷቸው እርምጃዎች", heading_style))
        story.append(Paragraph(report.challenges.replace("\n", "<br/>").replace("&", "&amp;"), body_style))

    if report.best_practices:
        story.append(Paragraph("7. መልካም ልምዶች", heading_style))
        story.append(Paragraph(report.best_practices.replace("\n", "<br/>").replace("&", "&amp;"), body_style))

    if report.prayer_topics:
        story.append(Paragraph("8. የጸሎት/የምስጋና ርዕሶች", heading_style))
        story.append(Paragraph(report.prayer_topics.replace("\n", "<br/>").replace("&", "&amp;"), body_style))

    carried = list(report.carried_over_tasks.all())
    if carried:
        story.append(Paragraph("9. ወደ ቀጣይ ሩብ ዓመት የተወሰዱ ተግባራት", heading_style))
        for ct in carried:
            story.append(Paragraph(f"- {ct.description}".replace("&", "&amp;"), body_style))
            if ct.note:
                story.append(Paragraph(f"  ማስታወሻ: {ct.note}".replace("&", "&amp;"), label_style))

    next_plans = list(report.next_quarter_plans.all())
    if next_plans:
        story.append(Paragraph("10. ለቀጣይ ሩብ ዓመት ዕቅድ", heading_style))
        for np in next_plans:
            story.append(Paragraph(f"{np.order}. {np.description}".replace("&", "&amp;"), body_style))

    doc.build(story)
    return buffer.getvalue()
