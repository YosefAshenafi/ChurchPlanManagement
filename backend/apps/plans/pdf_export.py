"""PDF export for annual plans using ReportLab."""
import io
from decimal import Decimal

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

CHURCH = "22 Mazoria Full Gospel Church"


def _styles():
    base = getSampleStyleSheet()
    title = ParagraphStyle(
        "PlanTitle", parent=base["Title"], fontSize=16, spaceAfter=4,
        textColor=colors.HexColor("#1E1B4B"),
    )
    heading = ParagraphStyle(
        "PlanHeading", parent=base["Heading2"], fontSize=11,
        spaceBefore=14, spaceAfter=6, textColor=colors.HexColor("#1E1B4B"),
    )
    sub = ParagraphStyle(
        "PlanSub", parent=base["Heading3"], fontSize=10,
        spaceBefore=10, spaceAfter=4, textColor=colors.HexColor("#3730A3"),
    )
    body = ParagraphStyle(
        "PlanBody", parent=base["Normal"], fontSize=9, leading=14, spaceAfter=6,
    )
    label = ParagraphStyle(
        "PlanLabel", parent=base["Normal"], fontSize=8,
        textColor=colors.HexColor("#64748B"), spaceAfter=2,
    )
    return title, heading, sub, body, label


def _divider():
    return HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0"), spaceAfter=6)


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

    title_style, heading_style, sub_style, body_style, label_style = _styles()
    story = []

    # ── Cover block ──
    story.append(Paragraph(CHURCH, title_style))
    story.append(Paragraph("Annual Plan", title_style))
    story.append(Spacer(1, 6))

    ministry_name = str(plan.ministry)
    fiscal_year = str(plan.fiscal_year)
    status_display = plan.get_status_display()

    meta_data = [
        ["Ministry:", ministry_name],
        ["Fiscal Year:", fiscal_year],
        ["Status:", status_display],
    ]
    if plan.submitted_at:
        meta_data.append(["Submitted:", plan.submitted_at.strftime("%Y-%m-%d")])
    if plan.reviewed_at:
        meta_data.append(["Reviewed:", plan.reviewed_at.strftime("%Y-%m-%d")])

    meta_table = Table(meta_data, colWidths=[5 * cm, None])
    meta_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#64748B")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(_divider())

    if plan.review_comment:
        story.append(Paragraph("Elder Comment:", label_style))
        story.append(Paragraph(plan.review_comment.replace("\n", "<br/>"), body_style))
        story.append(_divider())

    # ── Narrative sections ──
    if plan.introduction:
        story.append(Paragraph("1. Introduction", heading_style))
        story.append(Paragraph(plan.introduction.replace("\n", "<br/>"), body_style))

    if plan.general_objective:
        story.append(Paragraph("2. General Objective", heading_style))
        story.append(Paragraph(plan.general_objective.replace("\n", "<br/>"), body_style))

    # ── Goals ──
    goals = list(plan.goals.prefetch_related("outputs__activities"))
    if goals:
        story.append(Paragraph("3. Goals and Activities", heading_style))
        story.append(_divider())
        for gi, goal in enumerate(goals):
            story.append(Paragraph(f"Goal {gi + 1}: {goal.title}", sub_style))
            if goal.description:
                story.append(Paragraph(goal.description, body_style))
            for oi, output in enumerate(goal.outputs.all()):
                output_label = f"Output {oi + 1}: {output.description}"
                if output.measure:
                    output_label += f" ({output.measure}: {output.quantity})"
                story.append(Paragraph(output_label, label_style))
                for ai, act in enumerate(output.activities.all()):
                    story.append(Paragraph(f"  {ai + 1}. {act.description}", body_style))

    # ── Budget ──
    budget_lines = list(plan.budget_lines.select_related("goal"))
    if budget_lines:
        story.append(Paragraph("4. Budget Detail", heading_style))
        tbl_data = [["#", "Description", "Measure", "Qty", "Unit Price", "Total", "Note"]]
        total_sum = Decimal("0")
        for bl in budget_lines:
            tp = bl.total_price or Decimal("0")
            total_sum += tp
            tbl_data.append([
                str(bl.row_number),
                bl.description[:50],
                bl.measure,
                str(bl.quantity or ""),
                str(bl.unit_price or ""),
                f"{tp:,.2f}" if tp else "",
                bl.note[:30],
            ])
        tbl_data.append(["", "Total", "", "", "", f"{total_sum:,.2f}", ""])
        col_w = [1 * cm, 6 * cm, 2.5 * cm, 1.5 * cm, 2 * cm, 2 * cm, 2 * cm]
        tbl = Table(tbl_data, colWidths=col_w, repeatRows=1)
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF2FF")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -2), 0.25, colors.HexColor("#CBD5E1")),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#F1F5F9")),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(tbl)

    # ── Budget allocations ──
    allocations = list(plan.budget_allocations.select_related("goal"))
    if allocations:
        story.append(Paragraph("5. Quarterly Budget Allocation", sub_style))
        alloc_data = [["Goal", "Requested", "Q1", "Q2", "Q3", "Q4"]]
        for a in allocations:
            alloc_data.append([
                str(a.goal) if a.goal else "",
                f"{a.requested_total:,.2f}",
                f"{a.q1_budget:,.2f}",
                f"{a.q2_budget:,.2f}",
                f"{a.q3_budget:,.2f}",
                f"{a.q4_budget:,.2f}",
            ])
        alloc_tbl = Table(alloc_data, repeatRows=1)
        alloc_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF2FF")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(alloc_tbl)

    if plan.assumptions:
        story.append(Paragraph("6. Assumptions", heading_style))
        story.append(Paragraph(plan.assumptions.replace("\n", "<br/>"), body_style))

    if plan.monitoring_evaluation:
        story.append(Paragraph("7. Monitoring and Evaluation", heading_style))
        story.append(Paragraph(plan.monitoring_evaluation.replace("\n", "<br/>"), body_style))

    risks = list(plan.risks.all())
    if risks:
        story.append(Paragraph("8. Risks and Mitigation", heading_style))
        risk_data = [["#", "Risk", "Mitigation"]]
        for r in risks:
            risk_data.append([str(r.order), r.risk[:80], r.mitigation[:80]])
        risk_tbl = Table(risk_data, colWidths=[1 * cm, 8 * cm, 8 * cm], repeatRows=1)
        risk_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF2FF")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(risk_tbl)

    doc.build(story)
    return buffer.getvalue()
