from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
import os

def generate_invoice_pdf(data):
    os.makedirs("generated", exist_ok=True)
    filepath = f"generated/{data.invoiceNo}.pdf"

    doc = SimpleDocTemplate(
        filepath, pagesize=A4,
        rightMargin=15*mm, leftMargin=15*mm,
        topMargin=15*mm, bottomMargin=15*mm
    )

    indigo       = colors.HexColor("#4F46E5")
    light_indigo = colors.HexColor("#EEF2FF")
    light_gray   = colors.HexColor("#F9FAFB")
    border_gray  = colors.HexColor("#E5E7EB")
    gray         = colors.HexColor("#6B7280")
    dark         = colors.HexColor("#1F2937")
    white        = colors.white

    def style(size=9, color=None, bold=False, align=TA_LEFT):
        return ParagraphStyle(
            "s",
            fontSize=size,
            textColor=color or dark,
            fontName="Helvetica-Bold" if bold else "Helvetica",
            alignment=align,
            leading=size * 1.5,
        )

    elements = []

    # ── HEADER ───────────────────────────────────────────
    header = Table([
        [
            Paragraph(data.business.get("name", "Your Business"), style(18, indigo, bold=True)),
            Paragraph("INVOICE", style(18, dark, bold=True, align=TA_RIGHT)),
        ],
        [
            Paragraph(data.business.get("email", ""), style(9, gray)),
            Paragraph(data.invoiceNo, style(9, gray, align=TA_RIGHT)),
        ],
        [
            Paragraph(data.business.get("phone", ""), style(9, gray)),
            Paragraph(data.date, style(9, gray, align=TA_RIGHT)),
        ],
    ], colWidths=[95*mm, 85*mm])

    header.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING",    (0, 0), (-1, -1), 3),
        ("LINEBELOW",     (0, -1), (-1, -1), 0.5, border_gray),
    ]))
    elements.append(header)
    elements.append(Spacer(1, 6*mm))

    # ── BILL TO ───────────────────────────────────────────
    bill = Table([
        [Paragraph("BILL TO", style(8, gray, bold=True))],
        [Paragraph(data.client.get("name", ""), style(11, dark, bold=True))],
        [Paragraph(data.client.get("email", ""), style(9, gray))],
    ], colWidths=[180*mm])

    bill.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), light_indigo),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
    ]))
    elements.append(bill)
    elements.append(Spacer(1, 6*mm))

    # ── ITEMS TABLE ───────────────────────────────────────
    rows = [[
        Paragraph("Description", style(9, white, bold=True)),
        Paragraph("Qty",         style(9, white, bold=True, align=TA_CENTER)),
        Paragraph("Unit Price",  style(9, white, bold=True, align=TA_RIGHT)),
        Paragraph("Total",       style(9, white, bold=True, align=TA_RIGHT)),
    ]]

    for i, item in enumerate(data.items):
        line_total = item.quantity * item.price
        bg = white if i % 2 == 0 else light_gray
        rows.append([
            Paragraph(item.description or "—", style(9, dark)),
            Paragraph(str(int(item.quantity)), style(9, dark, align=TA_CENTER)),
            Paragraph(f"Rs.{item.price:,.2f}", style(9, dark, align=TA_RIGHT)),
            Paragraph(f"Rs.{line_total:,.2f}", style(9, dark, align=TA_RIGHT)),
        ])

    items_table = Table(rows, colWidths=[90*mm, 22*mm, 34*mm, 34*mm])
    
    item_style = [
        ("BACKGROUND",    (0, 0), (-1, 0),  indigo),
        ("TOPPADDING",    (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("LINEBELOW",     (0, 0), (-1, -1), 0.5, border_gray),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]

    # Alternate row backgrounds
    for i in range(1, len(rows)):
        bg = white if i % 2 == 1 else light_gray
        item_style.append(("BACKGROUND", (0, i), (-1, i), bg))

    items_table.setStyle(TableStyle(item_style))
    elements.append(items_table)
    elements.append(Spacer(1, 4*mm))

    # ── TOTAL ─────────────────────────────────────────────
    total_table = Table([
        [
            Paragraph("Total Amount", style(11, dark, bold=True)),
            Paragraph(f"Rs.{data.total:,.2f}", style(14, indigo, bold=True, align=TA_RIGHT)),
        ]
    ], colWidths=[130*mm, 50*mm])

    total_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), light_indigo),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 12),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(total_table)
    elements.append(Spacer(1, 10*mm))

    # ── FOOTER ────────────────────────────────────────────
    elements.append(Paragraph(
        "Thank you for your business 🙏",
        style(9, gray, align=TA_CENTER)
    ))

    doc.build(elements)
    return filepath