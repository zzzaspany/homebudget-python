import io
from datetime import datetime
from typing import List, Dict, Any

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(54, 30, "HomeBudget — Raport Kosztów Utrzymania Domu")
        page_text = f"Strona {self._pageNumber} z {page_count}"
        self.drawRightString(A4[0] - 54, 30, page_text)
        self.restoreState()


def generate_homebudget_pdf_report(
    kpis: Dict[str, Any],
    expenses: List[Dict[str, Any]],
    payments: List[Dict[str, Any]],
    user_name: str = "Użytkownik",
) -> bytes:
    """
    Generuje oficjalne zestawienie finansowe budżetu domowego w formacie PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "SubTitleStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=16,
    )
    h2_style = ParagraphStyle(
        "H2Style",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=12,
        spaceAfter=8,
    )
    cell_style = ParagraphStyle(
        "CellStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )
    cell_bold_style = ParagraphStyle(
        "CellBoldStyle",
        parent=cell_style,
        fontName="Helvetica-Bold",
    )

    story = []

    # Nagłówek
    story.append(Paragraph("HOMEBUDGET — RAPORT FINANSOWY DOMU", title_style))
    today_str = datetime.now().strftime("%d.%m.%Y %H:%M")
    story.append(Paragraph(f"Wygenerowano: {today_str} | Użytkownik: {user_name}", subtitle_style))
    story.append(Spacer(1, 10))

    # Tabela KPI
    story.append(Paragraph("1. Podsumowanie Wskaźników (KPI)", h2_style))

    kpi_table_data = [
        [
            Paragraph("Średniomiesięczny Budżet", cell_bold_style),
            Paragraph(f"{kpis.get('pro_rated_monthly', 0):.2f} zł", cell_bold_style),
        ],
        [
            Paragraph("Miesięczna Rezerwa (Sinking Fund)", cell_style),
            Paragraph(f"{kpis.get('sinking_fund_total', 0):.2f} zł", cell_style),
        ],
        [
            Paragraph("Zobowiązania Miesięczne", cell_style),
            Paragraph(f"{kpis.get('monthly_total', 0):.2f} zł", cell_style),
        ],
        [
            Paragraph("Suma Zobowiązań Rocznych", cell_style),
            Paragraph(f"{kpis.get('yearly_total', 0):.2f} zł", cell_style),
        ],
    ]

    t_kpi = Table(kpi_table_data, colWidths=[250, 230])
    t_kpi.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("PADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(t_kpi)
    story.append(Spacer(1, 16))

    # Tabela Aktywnych Wydatków
    story.append(Paragraph("2. Wykaz Wydatków Cyklicznych", h2_style))

    exp_headers = ["Nazwa wydatku", "Kwota", "Cykl", "Termin", "Kategoria", "Status"]
    exp_table_data = [[Paragraph(h, cell_bold_style) for h in exp_headers]]

    freq_map = {
        "monthly": "Miesięczny",
        "biweekly": "Co 2 tyg",
        "quarterly": "Kwartalny",
        "semi_annual": "Półroczny",
        "yearly": "Roczny",
    }

    for exp in expenses:
        freq_str = freq_map.get(exp.get("frequency"), exp.get("frequency"))
        status_str = exp.get("status", "").upper()
        due_str = f"Dzień {exp.get('due_day')}"

        exp_table_data.append([
            Paragraph(exp.get("name", ""), cell_bold_style),
            Paragraph(f"{exp.get('amount', 0):.2f} zł", cell_style),
            Paragraph(freq_str, cell_style),
            Paragraph(due_str, cell_style),
            Paragraph(exp.get("category", ""), cell_style),
            Paragraph(status_str, cell_style),
        ])

    t_exp = Table(exp_table_data, colWidths=[120, 70, 70, 70, 90, 60])
    t_exp.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("PADDING", (0, 0), (-1, -1), 5),
        ])
    )
    story.append(t_exp)
    story.append(Spacer(1, 16))

    # Tabela Ostatnich Płatności
    story.append(Paragraph("3. Ostatnie Wpłaty i Zarejestrowane Rachunki", h2_style))

    pay_headers = ["Wydatek", "Kategoria", "Okres", "Kwota", "Data wpłaty", "Opłacił(a)"]
    pay_table_data = [[Paragraph(h, cell_bold_style) for h in pay_headers]]

    for p in payments[:25]:  # Ostatnie 25 wpłat
        pay_table_data.append([
            Paragraph(p.get("expense_name", "-"), cell_style),
            Paragraph(p.get("category", "-"), cell_style),
            Paragraph(p.get("period", "-"), cell_style),
            Paragraph(f"{p.get('amount_paid', 0):.2f} zł", cell_bold_style),
            Paragraph(p.get("date_paid", "-"), cell_style),
            Paragraph(p.get("paid_by", "system"), cell_style),
        ])

    t_pay = Table(pay_table_data, colWidths=[110, 80, 65, 65, 80, 80])
    t_pay.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("PADDING", (0, 0), (-1, -1), 5),
        ])
    )
    story.append(t_pay)

    doc.build(story, canvasmaker=NumberedCanvas)
    return buffer.getvalue()
