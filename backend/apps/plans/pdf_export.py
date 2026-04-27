"""PDF export for annual plans using ReportLab with Amharic font support."""
import io
import os
from decimal import Decimal

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
        "PlanTitle", parent=base["Title"], fontSize=14, spaceAfter=4,
        fontName=am, textColor=colors.HexColor("#1E1B4B"),
    )
    heading = ParagraphStyle(
        "PlanHeading", parent=base["Heading2"], fontSize=11,
        spaceBefore=14, spaceAfter=6, fontName=am,
        textColor=colors.HexColor("#1E1B4B"),
    )
    sub = ParagraphStyle(
        "PlanSub", parent=base["Heading3"], fontSize=10,
        spaceBefore=10, spaceAfter=4, fontName=am,
        textColor=colors.HexColor("#3730A3"),
    )
    body = ParagraphStyle(
        "PlanBody", parent=base["Normal"], fontSize=9, leading=14, spaceAfter=6,
        fontName=am,
    )
    label = ParagraphStyle(
        "PlanLabel", parent=base["Normal"], fontSize=8, fontName=am,
        textColor=colors.HexColor("#64748B"), spaceAfter=2,
    )
    return title, heading, sub, body, label, am


def _divider():
    return HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0"), spaceAfter=6)


def _cell(text: str, am: str) -> Paragraph:
    """Wrap cell text in a Paragraph so it uses the Amharic font."""
    s = ParagraphStyle("cell", fontName=am, fontSize=8, leading=11, wordWrap="RTL")
    return Paragraph(str(text).replace("&", "&amp;").replace("<", "&lt;"), s)


def generate_plan_pdf(plan) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
        title="Annual Plan",
        author=CHURCH,
    )

    title_style, heading_style, sub_style, body_style, label_style, am = _styles()
    story = []

    # ── Cover block ──
    story.append(Paragraph(CHURCH, title_style))
    story.append(Paragraph("ዓመታዊ ዕቅድ (Annual Plan)", title_style))
    story.append(Spacer(1, 6))

    ministry_name = str(plan.ministry)
    fiscal_year = str(plan.fiscal_year)
    status_display = plan.get_status_display()

    meta_data = [
        [_cell("ዘርፍ:", am), _cell(ministry_name, am)],
        [_cell("በጀት ዓ/ም:", am), _cell(fiscal_year, am)],
        [_cell("ሁኔታ:", am), _cell(status_display, am)],
    ]
    if plan.submitted_at:
        meta_data.append([_cell("ቀርቧል:", am), _cell(plan.submitted_at.strftime("%Y-%m-%d"), am)])
    if plan.reviewed_at:
        meta_data.append([_cell("ታይቷል:", am), _cell(plan.reviewed_at.strftime("%Y-%m-%d"), am)])
    if plan.reviewed_by:
        reviewer = plan.reviewed_by.full_name_am or plan.reviewed_by.username
        meta_data.append([_cell("የሽማግሌ ስም:", am), _cell(reviewer, am)])

    meta_table = Table(meta_data, colWidths=[5 * cm, None])
    meta_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(_divider())

    if plan.review_comment:
        story.append(Paragraph("የሽማግሌ አስተያየት:", label_style))
        story.append(Paragraph(plan.review_comment.replace("\n", "<br/>"), body_style))
        story.append(_divider())

    # ── Narrative sections ──
    if plan.introduction:
        story.append(Paragraph("1. መግቢያ", heading_style))
        story.append(Paragraph(plan.introduction.replace("\n", "<br/>").replace("&", "&amp;"), body_style))

    if plan.general_objective:
        story.append(Paragraph("2. አጠቃላይ ዓላማ", heading_style))
        story.append(Paragraph(plan.general_objective.replace("\n", "<br/>").replace("&", "&amp;"), body_style))

    # ── Goals ──
    goals = list(plan.goals.prefetch_related("outputs__activities"))
    if goals:
        story.append(Paragraph("3. ዋና ዋና ግቦችና ዝርዝር ተግባራት", heading_style))
        story.append(_divider())
        for gi, goal in enumerate(goals):
            story.append(Paragraph(f"ግብ {gi + 1}: {goal.title}", sub_style))
            if goal.description:
                story.append(Paragraph(goal.description.replace("&", "&amp;"), body_style))
            for oi, output in enumerate(goal.outputs.all()):
                output_label = f"ውጤት {oi + 1}: {output.description}"
                if output.measure:
                    output_label += f" ({output.measure}: {output.quantity})"
                story.append(Paragraph(output_label.replace("&", "&amp;"), label_style))
                for ai, act in enumerate(output.activities.all()):
                    story.append(Paragraph(f"  {ai + 1}. {act.description}".replace("&", "&amp;"), body_style))

    # ── Budget ──
    budget_lines = list(plan.budget_lines.select_related("goal"))
    if budget_lines:
        story.append(Paragraph("4. ዝርዝር የበጀት ሠንጠረዥ", heading_style))
        col_w = [1 * cm, 6 * cm, 2.5 * cm, 1.5 * cm, 2 * cm, 2 * cm, 2 * cm]
        tbl_data = [[
            _cell("#", am), _cell("ተግባራት", am), _cell("መለኪያ", am),
            _cell("ብዛት", am), _cell("ነጠላ ዋጋ", am), _cell("ጠቅላላ", am), _cell("ማስታወሻ", am),
        ]]
        total_sum = Decimal("0")
        for bl in budget_lines:
            tp = bl.total_price or Decimal("0")
            total_sum += tp
            tbl_data.append([
                _cell(str(bl.row_number), am),
                _cell(bl.description[:60], am),
                _cell(bl.measure, am),
                _cell(str(bl.quantity or ""), am),
                _cell(str(bl.unit_price or ""), am),
                _cell(f"{tp:,.2f}" if tp else "", am),
                _cell(bl.note[:30], am),
            ])
        tbl_data.append([_cell("", am), _cell("ጠቅላላ ድምር", am), _cell("", am), _cell("", am), _cell("", am), _cell(f"{total_sum:,.2f}", am), _cell("", am)])
        tbl = Table(tbl_data, colWidths=col_w, repeatRows=1)
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF2FF")),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -2), 0.25, colors.HexColor("#CBD5E1")),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#F1F5F9")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(tbl)

    # ── Budget allocations ──
    allocations = list(plan.budget_allocations.select_related("goal"))
    if allocations:
        story.append(Paragraph("5. የሩብ ዓመት የበጀት ክፍፍል", sub_style))
        alloc_data = [[
            _cell("ግብ", am), _cell("የተጠየቀ", am),
            _cell("አ/ሩ", am), _cell("ሁ/ሩ", am), _cell("ሦ/ሩ", am), _cell("አ/ሩ", am),
        ]]
        for a in allocations:
            alloc_data.append([
                _cell(str(a.goal) if a.goal else "", am),
                _cell(f"{a.requested_total:,.2f}", am),
                _cell(f"{a.q1_budget:,.2f}", am),
                _cell(f"{a.q2_budget:,.2f}", am),
                _cell(f"{a.q3_budget:,.2f}", am),
                _cell(f"{a.q4_budget:,.2f}", am),
            ])
        alloc_tbl = Table(alloc_data, repeatRows=1)
        alloc_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF2FF")),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(alloc_tbl)

    if plan.assumptions:
        story.append(Paragraph("6. የዕቅዱ ታሳቢዎች", heading_style))
        story.append(Paragraph(plan.assumptions.replace("\n", "<br/>").replace("&", "&amp;"), body_style))

    if plan.monitoring_evaluation:
        story.append(Paragraph("7. የክትትልና ግምገማ ሥራዎች", heading_style))
        story.append(Paragraph(plan.monitoring_evaluation.replace("\n", "<br/>").replace("&", "&amp;"), body_style))

    risks = list(plan.risks.all())
    if risks:
        story.append(Paragraph("8. ሊያጋጥሙ የሚችሉ ተግዳሮቶች እና የመፍትሄ እርምጃ", heading_style))
        risk_data = [[_cell("#", am), _cell("ተግዳሮት", am), _cell("የመፍትሄ እርምጃ", am)]]
        for r in risks:
            risk_data.append([_cell(str(r.order), am), _cell(r.risk[:80], am), _cell(r.mitigation[:80], am)])
        risk_tbl = Table(risk_data, colWidths=[1 * cm, 8 * cm, 8 * cm], repeatRows=1)
        risk_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF2FF")),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(risk_tbl)

    doc.build(story)
    return buffer.getvalue()
