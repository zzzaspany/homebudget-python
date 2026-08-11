import csv
import io
import os
import calendar
import datetime
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, Request, Depends, HTTPException, status, Response, File, UploadFile, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field

from pb_client import pb
from auth import get_current_user, UserProfile
from utils.email_notifier import send_payment_reminder_email
from utils.report_generator import generate_homebudget_pdf_report

app = FastAPI(title="HomeBudget Dashboard")

# Mount static files and templates directories
os.makedirs("static", exist_ok=True)
os.makedirs("templates", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


# Expense Schema for validation
class ExpenseCreate(BaseModel):
    name: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    frequency: str = Field(..., pattern="^(monthly|yearly|quarterly|semi_annual|biweekly)$")
    due_day: int = Field(..., ge=1, le=31)
    due_month: Optional[int] = Field(None, ge=1, le=12)
    category: str = Field(..., min_length=1)
    active: bool = True
    is_variable: bool = False


class ExpenseUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    frequency: Optional[str] = None
    due_day: Optional[int] = None
    due_month: Optional[int] = None
    category: Optional[str] = None
    last_paid_period: Optional[str] = None
    active: Optional[bool] = None
    is_variable: Optional[bool] = None


class PaymentRequest(BaseModel):
    amount_paid: Optional[float] = None


# Date Helpers
def get_days_in_month(year: int, month: int) -> int:
    return calendar.monthrange(year, month)[1]


def calculate_status(expense: Dict[str, Any], today: datetime.date) -> Dict[str, Any]:
    """
    Calculates status ("paid", "overdue", "due_soon", "upcoming"),
    next due date (date object), and days remaining for all supported frequencies.
    """
    if not expense.get("active", True):
        return {"status": "inactive", "due_date": None, "days_left": None}

    frequency = expense.get("frequency", "monthly")
    due_day = int(expense.get("due_day", 1))
    last_paid = expense.get("last_paid_period", "")

    current_year = today.year
    current_month = today.month

    if frequency == "monthly":
        current_period = f"{current_year}-{current_month:02d}"
        if last_paid and last_paid >= current_period:
            next_month = current_month + 1
            next_year = current_year
            if next_month > 12:
                next_month = 1
                next_year += 1
            due_date = datetime.date(
                next_year, next_month, min(due_day, get_days_in_month(next_year, next_month))
            )
            status_val = "paid"
        else:
            due_date = datetime.date(
                current_year, current_month, min(due_day, get_days_in_month(current_year, current_month))
            )
            if today > due_date:
                status_val = "overdue"
            else:
                days_left = (due_date - today).days
                status_val = "due_soon" if days_left <= 5 else "upcoming"

    elif frequency == "quarterly":
        start_m = int(expense.get("due_month", 1) or 1)
        target_months = [(start_m + 3 * k - 1) % 12 + 1 for k in range(4)]
        target_months.sort()

        due_m = next((m for m in target_months if m >= current_month), target_months[0])
        due_y = current_year if due_m >= current_month else current_year + 1
        current_period = f"{due_y}-{due_m:02d}"

        if last_paid and last_paid >= current_period:
            idx = (target_months.index(due_m) + 1) % 4
            next_m = target_months[idx]
            next_y = due_y if idx != 0 else due_y + 1
            due_date = datetime.date(
                next_y, next_m, min(due_day, get_days_in_month(next_y, next_m))
            )
            status_val = "paid"
        else:
            due_date = datetime.date(
                due_y, due_m, min(due_day, get_days_in_month(due_y, due_m))
            )
            if today > due_date:
                status_val = "overdue"
            else:
                days_left = (due_date - today).days
                status_val = "due_soon" if days_left <= 7 else "upcoming"

    elif frequency == "semi_annual":
        start_m = int(expense.get("due_month", 1) or 1)
        target_months = [(start_m - 1) % 12 + 1, (start_m + 5) % 12 + 1]
        target_months.sort()

        due_m = next((m for m in target_months if m >= current_month), target_months[0])
        due_y = current_year if due_m >= current_month else current_year + 1
        current_period = f"{due_y}-{due_m:02d}"

        if last_paid and last_paid >= current_period:
            idx = (target_months.index(due_m) + 1) % 2
            next_m = target_months[idx]
            next_y = due_y if idx != 0 else due_y + 1
            due_date = datetime.date(
                next_y, next_m, min(due_day, get_days_in_month(next_y, next_m))
            )
            status_val = "paid"
        else:
            due_date = datetime.date(
                due_y, due_m, min(due_day, get_days_in_month(due_y, due_m))
            )
            if today > due_date:
                status_val = "overdue"
            else:
                days_left = (due_date - today).days
                status_val = "due_soon" if days_left <= 10 else "upcoming"

    elif frequency == "biweekly":
        current_period = f"{current_year}-W{today.isocalendar()[1]:02d}"
        if last_paid and last_paid >= current_period:
            due_date = today + datetime.timedelta(days=14)
            status_val = "paid"
        else:
            due_date = datetime.date(
                current_year, current_month, min(due_day, get_days_in_month(current_year, current_month))
            )
            if today > due_date:
                status_val = "overdue"
            else:
                days_left = (due_date - today).days
                status_val = "due_soon" if days_left <= 3 else "upcoming"

    else:  # yearly
        due_month = int(expense.get("due_month", 1) or 1)
        current_period = str(current_year)

        if last_paid and last_paid >= current_period:
            due_date = datetime.date(
                current_year + 1, due_month, min(due_day, get_days_in_month(current_year + 1, due_month))
            )
            status_val = "paid"
        else:
            due_date = datetime.date(
                current_year, due_month, min(due_day, get_days_in_month(current_year, due_month))
            )
            if today > due_date:
                status_val = "overdue"
            else:
                days_left = (due_date - today).days
                status_val = "due_soon" if days_left <= 14 else "upcoming"

    days_left = (due_date - today).days
    return {
        "status": status_val,
        "due_date": due_date,
        "days_left": days_left,
    }


@app.get("/", response_class=HTMLResponse)
def get_dashboard(request: Request, current_user: UserProfile = Depends(get_current_user)):
    dev_mode = os.getenv("DEV_MODE", "false").lower() == "true"
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "user": current_user,
            "dev_mode": dev_mode,
        },
    )


@app.get("/api/expenses")
def api_get_expenses(current_user: UserProfile = Depends(get_current_user)):
    try:
        raw_expenses = pb.get_expenses()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch from database: {str(e)}")

    today = datetime.date.today()

    processed_expenses = []
    overdue_count = 0
    due_soon_count = 0
    monthly_total = 0.0
    yearly_total = 0.0
    sinking_fund_total = 0.0

    category_prorated: Dict[str, float] = {}
    sinking_fund_items: List[Dict[str, Any]] = []

    for item in raw_expenses:
        status_info = calculate_status(item, today)

        exp_dict = {
            "id": item["id"],
            "name": item["name"],
            "amount": item["amount"],
            "frequency": item["frequency"],
            "due_day": item["due_day"],
            "due_month": item.get("due_month"),
            "category": item["category"],
            "last_paid_period": item.get("last_paid_period", ""),
            "active": item.get("active", True),
            "is_variable": item.get("is_variable", False),
            "status": status_info["status"],
            "due_date_str": status_info["due_date"].strftime("%Y-%m-%d") if status_info["due_date"] else None,
            "days_left": status_info["days_left"],
        }
        processed_expenses.append(exp_dict)

        if exp_dict["active"]:
            if exp_dict["status"] == "overdue":
                overdue_count += 1
            elif exp_dict["status"] == "due_soon":
                due_soon_count += 1

            amount = exp_dict["amount"]
            category = exp_dict["category"]
            freq = exp_dict["frequency"]

            # Prorated monthly calculations
            if freq == "monthly":
                monthly_total += amount
                prorated = amount
            elif freq == "biweekly":
                prorated = amount * 26.0 / 12.0
            elif freq == "quarterly":
                prorated = amount / 3.0
                sinking_fund_total += prorated
                sinking_fund_items.append({"name": exp_dict["name"], "monthly_reserve": round(prorated, 2), "frequency": freq, "due_date_str": exp_dict["due_date_str"]})
            elif freq == "semi_annual":
                prorated = amount / 6.0
                sinking_fund_total += prorated
                sinking_fund_items.append({"name": exp_dict["name"], "monthly_reserve": round(prorated, 2), "frequency": freq, "due_date_str": exp_dict["due_date_str"]})
            else:  # yearly
                yearly_total += amount
                prorated = amount / 12.0
                sinking_fund_total += prorated
                sinking_fund_items.append({"name": exp_dict["name"], "monthly_reserve": round(prorated, 2), "frequency": freq, "due_date_str": exp_dict["due_date_str"]})

            category_prorated[category] = category_prorated.get(category, 0.0) + prorated

    # Pro-rated monthly average
    prorated_monthly_total = (
        monthly_total
        + (yearly_total / 12.0)
        + sum(
            exp["amount"] / 3.0
            if exp["frequency"] == "quarterly"
            else (exp["amount"] / 6.0 if exp["frequency"] == "semi_annual" else 0.0)
            for exp in processed_expenses
            if exp["active"] and exp["frequency"] in ["quarterly", "semi_annual"]
        )
    )

    # 1. Doughnut Chart Data (Category breakdown)
    doughnut_chart = {
        "labels": list(category_prorated.keys()),
        "values": [round(v, 2) for v in category_prorated.values()],
    }

    # 2. 12-Month Projections
    projection_chart = []
    month_names = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"]
    curr_month = today.month
    curr_year = today.year

    for i in range(12):
        projected_month = curr_month + i
        projected_year = curr_year
        if projected_month > 12:
            projected_month = (projected_month - 1) % 12 + 1
            projected_year += (curr_month + i - 1) // 12

        month_label = f"{month_names[projected_month - 1]} '{str(projected_year)[2:]}"

        expected_total = 0.0
        for exp in processed_expenses:
            if not exp["active"]:
                continue
            freq = exp["frequency"]
            if freq == "monthly":
                expected_total += exp["amount"]
            elif freq == "yearly" and exp["due_month"] == projected_month:
                expected_total += exp["amount"]
            elif freq == "quarterly":
                sm = int(exp.get("due_month") or 1)
                if (projected_month - sm) % 3 == 0:
                    expected_total += exp["amount"]
            elif freq == "semi_annual":
                sm = int(exp.get("due_month") or 1)
                if (projected_month - sm) % 6 == 0:
                    expected_total += exp["amount"]

        projection_chart.append({
            "label": month_label,
            "amount": round(expected_total, 2),
        })

    # 3. Urgent Notifications
    notifications = []
    for exp in processed_expenses:
        if not exp["active"]:
            continue
        if exp["status"] == "overdue":
            days_overdue = -exp["days_left"]
            msg = f"Po terminie o {days_overdue} dni" if days_overdue != 1 else "Po terminie o 1 dzień"
            notifications.append({
                "id": exp["id"],
                "name": exp["name"],
                "status": "overdue",
                "amount": exp["amount"],
                "frequency": exp["frequency"],
                "days_left": exp["days_left"],
                "due_date_str": exp["due_date_str"],
                "message": msg,
            })
        elif exp["status"] == "due_soon":
            days_left = exp["days_left"]
            msg = f"Termin za {days_left} dni" if days_left != 1 else "Termin za 1 dzień"
            notifications.append({
                "id": exp["id"],
                "name": exp["name"],
                "status": "due_soon",
                "amount": exp["amount"],
                "frequency": exp["frequency"],
                "days_left": exp["days_left"],
                "due_date_str": exp["due_date_str"],
                "message": msg,
            })

    notifications.sort(key=lambda x: x["days_left"])

    return {
        "kpis": {
            "monthly_total": round(monthly_total, 2),
            "yearly_total": round(yearly_total, 2),
            "pro_rated_monthly": round(prorated_monthly_total, 2),
            "sinking_fund_total": round(sinking_fund_total, 2),
            "overdue_count": overdue_count,
            "due_soon_count": due_soon_count,
        },
        "expenses": processed_expenses,
        "doughnut_chart": doughnut_chart,
        "projection_chart": projection_chart,
        "notifications": notifications,
        "sinking_fund_items": sinking_fund_items,
    }


@app.post("/api/expenses")
def api_create_expense(expense: ExpenseCreate, current_user: UserProfile = Depends(get_current_user)):
    try:
        res = pb.create_expense(expense.model_dump())
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create expense: {str(e)}")


@app.put("/api/expenses/{expense_id}")
def api_update_expense(
    expense_id: str, expense: ExpenseUpdate, current_user: UserProfile = Depends(get_current_user)
):
    try:
        update_data = {k: v for k, v in expense.model_dump().items() if v is not None}
        res = pb.update_expense(expense_id, update_data)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update expense: {str(e)}")


@app.delete("/api/expenses/{expense_id}")
def api_delete_expense(expense_id: str, current_user: UserProfile = Depends(get_current_user)):
    try:
        pb.delete_expense(expense_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete expense: {str(e)}")


@app.post("/api/expenses/{expense_id}/pay")
async def api_pay_expense(
    expense_id: str,
    request: Request,
    invoice_file: Optional[UploadFile] = File(None),
    current_user: UserProfile = Depends(get_current_user),
):
    today = datetime.date.today()
    try:
        # Check content-type to parse json or form-data
        amount_paid = None
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            body = await request.json()
            amount_paid = body.get("amount_paid")
        elif "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
            form = await request.form()
            if "amount_paid" in form and form["amount_paid"]:
                amount_paid = float(form["amount_paid"])
            if "invoice_file" in form and isinstance(form["invoice_file"], UploadFile):
                invoice_file = form["invoice_file"]

        raw_expenses = pb.get_expenses()
        expense = next((item for item in raw_expenses if item["id"] == expense_id), None)
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")

        frequency = expense.get("frequency", "monthly")
        last_paid = expense.get("last_paid_period", "")

        current_year = today.year
        current_month = today.month

        if frequency == "monthly":
            current_period = f"{current_year}-{current_month:02d}"
            if not last_paid or last_paid < current_period:
                target_period = current_period
            else:
                lp_year, lp_month = map(int, last_paid.split("-"))
                target_month = lp_month + 1
                target_year = lp_year
                if target_month > 12:
                    target_month = 1
                    target_year += 1
                target_period = f"{target_year}-{target_month:02d}"
        else:
            current_period = str(current_year)
            if not last_paid or last_paid < current_period:
                target_period = current_period
            else:
                target_period = str(int(last_paid) + 1)

        if amount_paid is None:
            amount_paid = expense["amount"]

        att_filename = None
        att_bytes = None
        if invoice_file and invoice_file.filename:
            att_filename = invoice_file.filename
            att_bytes = await invoice_file.read()

        pb.create_payment(
            expense_id=expense_id,
            amount_paid=amount_paid,
            date_paid=today.strftime("%Y-%m-%d"),
            period=target_period,
            paid_by=current_user.username,
            attachment_filename=att_filename,
            attachment_bytes=att_bytes,
        )

        res = pb.pay_expense(expense_id, target_period)
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to record payment: {str(e)}")


@app.get("/api/payments")
def api_get_payments(current_user: UserProfile = Depends(get_current_user)):
    try:
        raw_payments = pb.get_payments()
        processed_payments = []
        for item in raw_payments:
            expense_name = "Nieznana opłata"
            expense_category = "Inne"

            expand = item.get("expand", {})
            expense_ref = expand.get("expense_id", {})
            if expense_ref:
                expense_name = expense_ref.get("name", expense_name)
                expense_category = expense_ref.get("category", expense_category)

            processed_payments.append({
                "id": item["id"],
                "expense_id": item["expense_id"],
                "expense_name": expense_name,
                "category": expense_category,
                "amount_paid": item["amount_paid"],
                "date_paid": item["date_paid"],
                "period": item["period"],
                "paid_by": item.get("paid_by", ""),
            })
        return processed_payments
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch payment history: {str(e)}")


# --- PRICE HISTORY & INFLATION TRACKER ENDPOINT ---
@app.get("/api/expenses/{expense_id}/history")
def api_expense_price_history(expense_id: str, current_user: UserProfile = Depends(get_current_user)):
    """Pobiera historię zmian ceny danej opłaty i wylicza procentową zmianę w czasie (śledzenie inflacji)."""
    try:
        raw_payments = pb.get_payments()
        # Filtrujemy wpłaty dla konkretnego wydatku
        item_payments = [
            p for p in raw_payments if p.get("expense_id") == expense_id
        ]
        item_payments.sort(key=lambda x: x.get("date_paid", ""))

        history = [
            {
                "date_paid": p.get("date_paid"),
                "amount_paid": p.get("amount_paid"),
                "period": p.get("period"),
            }
            for p in item_payments
        ]

        price_change_pct = 0.0
        if len(history) >= 2:
            first_price = history[0]["amount_paid"]
            latest_price = history[-1]["amount_paid"]
            if first_price > 0:
                price_change_pct = round(((latest_price - first_price) / first_price) * 100, 1)

        return {
            "expense_id": expense_id,
            "total_records": len(history),
            "price_change_pct": price_change_pct,
            "history": history,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to calculate price history: {str(e)}")


# --- EMAIL NOTIFICATION ENDPOINT ---
@app.post("/api/notifications/send-email")
def api_send_email_notifications(current_user: UserProfile = Depends(get_current_user)):
    """Ręczne lub automatyczne wyzwolenie wysyłki powiadomień e-mail SMTP z alertami."""
    try:
        dashboard_data = api_get_expenses(current_user)
        notifications = dashboard_data.get("notifications", [])

        if not notifications:
            return {"success": True, "message": "Brak zaległych lub zbliżających się opłat. E-mail nie został wysłany."}

        sent = send_payment_reminder_email(notifications)
        if sent:
            return {"success": True, "message": f"Wysłano powiadomienie e-mail z {len(notifications)} alertami."}
        return {"success": False, "message": "Nie zdołano wysłać powiadomienia e-mail."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Błąd wysyłki e-mail SMTP: {str(e)}")


# --- REPORTS EXPORT ENDPOINTS (PDF & CSV) ---
@app.get("/api/reports/csv")
def api_export_csv_report(current_user: UserProfile = Depends(get_current_user)):
    """Eksport rocznego/miesięcznego zestawienia budżetu domowego do pliku CSV z kodowaniem UTF-8 BOM."""
    try:
        dashboard_data = api_get_expenses(current_user)
        expenses = dashboard_data.get("expenses", [])
        payments = api_get_payments(current_user)
        kpis = dashboard_data.get("kpis", {})

        output = io.StringIO()
        writer = csv.writer(output, delimiter=";")

        writer.writerow(["HOMEBUDGET — RAPORT KOSZTÓW UTRZYMANIA DOMU"])
        writer.writerow(["Data wygenerowania", datetime.datetime.now().strftime("%Y-%m-%d %H:%M")])
        writer.writerow(["Użytkownik", current_user.name])
        writer.writerow([])
        writer.writerow(["PODSUMOWANIE KPI"])
        writer.writerow(["Średniomiesięczny Budżet (zł)", kpis.get("pro_rated_monthly", 0)])
        writer.writerow(["Miesięczna Rezerwa (Sinking Fund) (zł)", kpis.get("sinking_fund_total", 0)])
        writer.writerow(["Zobowiązania Miesięczne (zł)", kpis.get("monthly_total", 0)])
        writer.writerow(["Zobowiązania Roczne (zł)", kpis.get("yearly_total", 0)])
        writer.writerow([])
        writer.writerow(["WYKAZ WYDATKÓW CYKLICZNYCH"])
        writer.writerow(["Nazwa wydatku", "Kwota (zł)", "Częstotliwość", "Dzień płatności", "Miesiąc", "Kategoria", "Rachunek Zmienny", "Status"])

        for exp in expenses:
            writer.writerow([
                exp.get("name"),
                exp.get("amount"),
                exp.get("frequency"),
                exp.get("due_day"),
                exp.get("due_month") or "-",
                exp.get("category"),
                "TAK" if exp.get("is_variable") else "NIE",
                exp.get("status"),
            ])

        writer.writerow([])
        writer.writerow(["HISTORIA WPAŁT I RACHUNKÓW"])
        writer.writerow(["Nazwa wydatku", "Kategoria", "Okres", "Zapłacono (zł)", "Data wpłaty", "Opłacił(a)"])

        for p in payments:
            writer.writerow([
                p.get("expense_name"),
                p.get("category"),
                p.get("period"),
                p.get("amount_paid"),
                p.get("date_paid"),
                p.get("paid_by"),
            ])

        content = "\ufeff" + output.getvalue()
        return Response(
            content=content.encode("utf-8"),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": "attachment; filename=homebudget_raport.csv"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Błąd generowania CSV: {str(e)}")


@app.get("/api/reports/pdf")
def api_export_pdf_report(current_user: UserProfile = Depends(get_current_user)):
    """Generowanie i pobieranie raportu budżetowego w formacie PDF."""
    try:
        dashboard_data = api_get_expenses(current_user)
        expenses = dashboard_data.get("expenses", [])
        payments = api_get_payments(current_user)
        kpis = dashboard_data.get("kpis", {})

        pdf_bytes = generate_homebudget_pdf_report(
            kpis=kpis,
            expenses=expenses,
            payments=payments,
            user_name=current_user.name,
        )

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=homebudget_raport.pdf"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Błąd generowania PDF: {str(e)}")

