"""PDF export for quarterly reports using ReportLab."""
import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

CHURCH = "22 Mazoria Full Gospel Church"
QUARTER_EN = {
    1: "Q1 (1st Quarter)", 2: "Q2 (2nd Quarter)",
    3: "Q3 (3rd Quarter)", 4: "Q4 (4th Quarter)",
}


def _styles():
    base = getSampleStyleSheet()
    title = ParagraphStyle(
        "RTitle", parent=base["Title"], fontSize=16, spaceAfter=4,
        textColor=colors.HexColor("#14532D"),
    )
    heading = ParagraphStyle(
        "RHeading", parent=base["Heading2"], fontSize=11,
        spaceBefore=14, spaceAfter=6, textColor=colors.HexColor("#14532D"),
    )
    sub = ParagraphStyle(
        "RSub", parent=base["Heading3"], fontSize=10,
        spaceBefore=10, spaceAfter=4, textColor=colors.HexColor("#166534"),
    )
    body = ParagraphStyle(
        "RBody", parent=base["Normal"], fontSize=9, leading=14, spaceAfter=6,
    )
    label = ParagraphStyle(
        "RLabel", parent=base["Normal"], fontSize=8,
        textColor=colors.HexColor("#64748B"), spaceAfter=2,
    )
    return title, heading, sub, body, label


def _divider():
    return HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#D1FAE5"), spaceAfter=6)


def generate_report_pdf(report) -> bytes:
    buffer = io.BytesIO()
    quarter_label = QUARTER_EN.get(report.quarter, f"Q{report.quarter}")
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
        title=f"Quarterly Report {quarter_label}",
        author=CHURCH,
    )

    title_style, heading_style, sub_style, body_style, label_style = _styles()
    story = []

    # ── Cover ──
    story.append(Paragraph(CHURCH, title_style))
    story.append(Paragraph(f"Quarterly Report — {quarter_label}", title_style))
    story.append(Spacer(1, 6))

    meta_data = [
        ["Ministry:", str(report.plan.ministry)],
        ["Fiscal Year:", str(report.plan.fiscal_year)],
        ["Quarter:", quarter_label],
        ["Status:", report.get_status_display()],
    ]
    if report.submitted_at:
        meta_data.append(["Submitted:", report.submitted_at.strftime("%Y-%m-%d")])

    meta_tbl = Table(meta_data, colWidths=[5 * cm, None])
    meta_tbl.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#64748B")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_tbl)
    story.append(_divider())

    # ── Introduction ──
    if report.introduction:
        story.append(Paragraph("1. Introduction", heading_style))
        story.append(Paragraph(report.introduction.replace("\n", "<br/>"), body_style))

    # ── Activity Progress ──
    progress = list(report.activity_progress.select_related("goal"))
    if progress:
        story.append(Paragraph("2. Activity Progress", heading_style))
        prog_data = [["Goal", "Activity", "Planned", "Done %", "Note"]]
        for ap in progress:
            prog_data.append([
                str(ap.goal) if ap.goal else "",
                ap.activity_description[:50],
                (ap.planned or "")[:40],
                f"{ap.completed_percent}%",
                (ap.note or "")[:40],
            ])
        prog_tbl = Table(
            prog_data,
            colWidths=[3 * cm, 5 * cm, 4 * cm, 1.5 * cm, 3 * cm],
            repeatRows=1,
        )
        prog_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#DCFCE7")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
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
        story.append(Paragraph("3. Budget Utilization", heading_style))
        bud_data = [["Goal", "Approved Budget", "Used", "Used %", "Note"]]
        for bu in budget_util:
            bud_data.append([
                str(bu.goal) if bu.goal else "",
                f"{bu.approved_budget:,.2f}",
                f"{bu.used_budget:,.2f}",
                f"{bu.used_percent}%",
                (bu.note or "")[:50],
            ])
        bud_tbl = Table(
            bud_data,
            colWidths=[4 * cm, 3.5 * cm, 3.5 * cm, 2 * cm, 4 * cm],
            repeatRows=1,
        )
        bud_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#DCFCE7")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(bud_tbl)

    # ── Narrative sections ──
    if report.quantitative_results:
        story.append(Paragraph("4. Quantitative Results", heading_style))
        story.append(Paragraph(report.quantitative_results.replace("\n", "<br/>"), body_style))

    if report.unplanned_activities:
        story.append(Paragraph("5. Unplanned Activities", heading_style))
        story.append(Paragraph(report.unplanned_activities.replace("\n", "<br/>"), body_style))

    if report.challenges:
        story.append(Paragraph("6. Challenges", heading_style))
        story.append(Paragraph(report.challenges.replace("\n", "<br/>"), body_style))

    if report.best_practices:
        story.append(Paragraph("7. Best Practices", heading_style))
        story.append(Paragraph(report.best_practices.replace("\n", "<br/>"), body_style))

    if report.prayer_topics:
        story.append(Paragraph("8. Prayer Topics", heading_style))
        story.append(Paragraph(report.prayer_topics.replace("\n", "<br/>"), body_style))

    # ── Carried-over tasks ──
    carried = list(report.carried_over_tasks.all())
    if carried:
        story.append(Paragraph("9. Carried-Over Tasks", heading_style))
        for ct in carried:
            story.append(Paragraph(f"- {ct.description}", body_style))
            if ct.note:
                story.append(Paragraph(f"  Note: {ct.note}", label_style))

    # ── Next quarter plans ──
    next_plans = list(report.next_quarter_plans.all())
    if next_plans:
        story.append(Paragraph("10. Next Quarter Plans", heading_style))
        for np in next_plans:
            story.append(Paragraph(f"{np.order}. {np.description}", body_style))

    doc.build(story)
    return buffer.getvalue()
