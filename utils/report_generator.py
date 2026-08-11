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
        # We override this inside generate_homebudget_pdf_report dynamically to support closures on lang
        pass


def generate_homebudget_pdf_report(
    kpis: Dict[str, Any],
    expenses: List[Dict[str, Any]],
    payments: List[Dict[str, Any]],
    user_name: str = "Użytkownik",
    lang: str = "pl",
) -> bytes:
    """
    Generuje zestawienie finansowe budżetu domowego w formacie PDF (PL lub EN).
    """
    
    class LocalizedNumberedCanvas(NumberedCanvas):
        def draw_page_number(self, page_count):
            self.saveState()
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748b"))
            if lang == "pl":
                self.drawString(54, 30, "HomeBudget — Raport Kosztów Utrzymania Domu")
                page_text = f"Strona {self._pageNumber} z {page_count}"
            else:
                self.drawString(54, 30, "HomeBudget — Home Maintenance Expense Report")
                page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(A4[0] - 54, 30, page_text)
            self.restoreState()

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

    # Title translations
    report_title = "HOMEBUDGET — RAPORT FINANSOWY DOMU" if lang == "pl" else "HOMEBUDGET — HOME FINANCIAL REPORT"
    generated_text = f"Wygenerowano: {datetime.now().strftime('%d.%m.%Y %H:%M')}" if lang == "pl" else f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    user_text = f"Użytkownik: {user_name}" if lang == "pl" else f"User: {user_name}"
    
    story.append(Paragraph(report_title, title_style))
    story.append(Paragraph(f"{generated_text} | {user_text}", subtitle_style))
    story.append(Spacer(1, 10))

    # section 1
    section1_title = "1. Podsumowanie Wskaźników (KPI)" if lang == "pl" else "1. KPI Summary Indicators"
    story.append(Paragraph(section1_title, h2_style))

    # KPI Labels
    kpi_labels = {
        "prorated": "Średniomiesięczny Budżet" if lang == "pl" else "Average Monthly Budget",
        "sinking": "Miesięczna Rezerwa (Sinking Fund)" if lang == "pl" else "Savings Reserve (Sinking Fund)",
        "monthly": "Zobowiązania Miesięczne" if lang == "pl" else "Monthly Expenses",
        "yearly": "Suma Zobowiązań Rocznych" if lang == "pl" else "Yearly Expenses"
    }

    currency_suffix = "zł" if lang == "pl" else "PLN"

    kpi_table_data = [
        [
            Paragraph(kpi_labels["prorated"], cell_bold_style),
            Paragraph(f"{kpis.get('pro_rated_monthly', 0):.2f} {currency_suffix}", cell_bold_style),
        ],
        [
            Paragraph(kpi_labels["sinking"], cell_style),
            Paragraph(f"{kpis.get('sinking_fund_total', 0):.2f} {currency_suffix}", cell_style),
        ],
        [
            Paragraph(kpi_labels["monthly"], cell_style),
            Paragraph(f"{kpis.get('monthly_total', 0):.2f} {currency_suffix}", cell_style),
        ],
        [
            Paragraph(kpi_labels["yearly"], cell_style),
            Paragraph(f"{kpis.get('yearly_total', 0):.2f} {currency_suffix}", cell_style),
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

    # section 2
    section2_title = "2. Wykaz Wydatków Cyklicznych" if lang == "pl" else "2. List of Recurring Expenses"
    story.append(Paragraph(section2_title, h2_style))

    exp_headers_pl = ["Nazwa wydatku", "Kwota", "Cykl", "Termin", "Kategoria", "Status"]
    exp_headers_en = ["Expense Name", "Amount", "Cycle", "Due Date", "Category", "Status"]
    exp_headers = exp_headers_pl if lang == "pl" else exp_headers_en
    exp_table_data = [[Paragraph(h, cell_bold_style) for h in exp_headers]]

    freq_map_pl = {
        "monthly": "Miesięczny",
        "biweekly": "Co 2 tyg",
        "quarterly": "Kwartalny",
        "semi_annual": "Półroczny",
        "yearly": "Roczny",
    }
    freq_map_en = {
        "monthly": "Monthly",
        "biweekly": "Biweekly",
        "quarterly": "Quarterly",
        "semi_annual": "Semi-annual",
        "yearly": "Yearly",
    }
    freq_map = freq_map_pl if lang == "pl" else freq_map_en

    status_map_pl = {
        "paid": "OPŁACONE",
        "overdue": "ZALEGŁE",
        "due_soon": "WKRÓTCE",
        "upcoming": "NADCHODZĄCE",
        "inactive": "NIEAKTYWNE"
    }
    status_map_en = {
        "paid": "PAID",
        "overdue": "OVERDUE",
        "due_soon": "DUE SOON",
        "upcoming": "UPCOMING",
        "inactive": "INACTIVE"
    }
    status_map = status_map_pl if lang == "pl" else status_map_en

    category_map_en = {
        "Serwisy i Przeglądy": "Maintenance & Inspections",
        "Bufor i Rezerwy": "Buffer & Reserves",
        "Media i Eksploatacja": "Utilities & Operations",
        "Podatki": "Taxes",
        "Kredyt i Ubezpieczenia": "Loans & Insurance",
        "Inne": "Other",
        "Stałe Opłaty": "Fixed Fees",
        "Podatki i Ubezpieczenia": "Taxes & Insurance"
    }

    month_names_pl = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"]
    month_names_en = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    month_names = month_names_pl if lang == "pl" else month_names_en

    for exp in expenses:
        freq_str = freq_map.get(exp.get("frequency"), exp.get("frequency"))
        status_key = exp.get("status", "upcoming")
        status_str = status_map.get(status_key, status_key.upper())
        
        due_day = exp.get("due_day")
        if exp.get("frequency") in ["monthly", "biweekly"]:
            due_str = f"Dzień {due_day}" if lang == "pl" else f"Day {due_day}"
        else:
            due_month = exp.get("due_month", 1) or 1
            month_str = month_names[due_month - 1]
            due_str = f"{due_day} {month_str}"
            
        category_name = exp.get("category", "")
        if lang == "en":
            category_name = category_map_en.get(category_name, category_name)

        exp_table_data.append([
            Paragraph(exp.get("name", ""), cell_bold_style),
            Paragraph(f"{exp.get('amount', 0):.2f} {currency_suffix}", cell_style),
            Paragraph(freq_str, cell_style),
            Paragraph(due_str, cell_style),
            Paragraph(category_name, cell_style),
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

    # section 3
    section3_title = "3. Ostatnie Wpłaty i Zarejestrowane Rachunki" if lang == "pl" else "3. Recent Payments & Logged Bills"
    story.append(Paragraph(section3_title, h2_style))

    pay_headers_pl = ["Wydatek", "Kategoria", "Okres", "Kwota", "Data wpłaty", "Opłacił(a)"]
    pay_headers_en = ["Expense", "Category", "Period", "Amount", "Payment Date", "Paid By"]
    pay_headers = pay_headers_pl if lang == "pl" else pay_headers_en
    pay_table_data = [[Paragraph(h, cell_bold_style) for h in pay_headers]]

    for p in payments[:25]:  # Last 25 entries
        category_name = p.get("category", "-")
        if lang == "en":
            category_name = category_map_en.get(category_name, category_name)
            
        period_str = p.get("period", "-")
        if "-" in period_str and len(period_str) == 7:
            # e.g. 2026-08 -> Aug 2026
            try:
                y, m = period_str.split("-")
                period_str = f"{month_names[int(m)-1]} {y}"
            except:
                pass

        pay_table_data.append([
            Paragraph(p.get("expense_name", "-"), cell_style),
            Paragraph(category_name, cell_style),
            Paragraph(period_str, cell_style),
            Paragraph(f"{p.get('amount_paid', 0):.2f} {currency_suffix}", cell_bold_style),
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

    doc.build(story, canvasmaker=LocalizedNumberedCanvas)
    return buffer.getvalue()
