import datetime
import pytest
from main import calculate_status, get_days_in_month


def test_days_in_month():
    assert get_days_in_month(2026, 2) == 28
    assert get_days_in_month(2024, 2) == 29  # leap year
    assert get_days_in_month(2026, 4) == 30
    assert get_days_in_month(2026, 12) == 31


def test_calculate_status_monthly():
    today = datetime.date(2026, 8, 15)

    # Monthly expense unpaid in current month (due on day 20)
    exp = {"frequency": "monthly", "due_day": 20, "last_paid_period": "2026-07", "active": True}
    res = calculate_status(exp, today)
    assert res["status"] == "due_soon"
    assert res["days_left"] == 5
    assert res["due_date"] == datetime.date(2026, 8, 20)

    # Monthly expense paid for current month
    exp_paid = {"frequency": "monthly", "due_day": 20, "last_paid_period": "2026-08", "active": True}
    res_paid = calculate_status(exp_paid, today)
    assert res_paid["status"] == "paid"
    assert res_paid["due_date"] == datetime.date(2026, 9, 20)

    # Overdue monthly expense (due on day 10)
    exp_overdue = {"frequency": "monthly", "due_day": 10, "last_paid_period": "2026-07", "active": True}
    res_overdue = calculate_status(exp_overdue, today)
    assert res_overdue["status"] == "overdue"
    assert res_overdue["days_left"] < 0


def test_calculate_status_quarterly():
    today = datetime.date(2026, 8, 15)

    # Quarterly expense starting in month 1 (Jan/Apr/Jul/Oct), due_day 10
    # Unpaid for Oct 2026
    exp_upcoming = {"frequency": "quarterly", "due_month": 1, "due_day": 10, "last_paid_period": "2026-07", "active": True}
    res_upcoming = calculate_status(exp_upcoming, today)
    assert res_upcoming["status"] == "upcoming"
    assert res_upcoming["due_date"] == datetime.date(2026, 10, 10)

    # Paid for Oct 2026 -> next is Jan 2027
    exp_paid = {"frequency": "quarterly", "due_month": 1, "due_day": 10, "last_paid_period": "2026-10", "active": True}
    res_paid = calculate_status(exp_paid, today)
    assert res_paid["status"] == "paid"
    assert res_paid["due_date"] == datetime.date(2027, 1, 10)


def test_calculate_status_semi_annual():
    today = datetime.date(2026, 8, 15)

    # Semi-annual starting in month 5 (May/Nov), due day 20
    # Unpaid for Nov 2026
    exp_upcoming = {"frequency": "semi_annual", "due_month": 5, "due_day": 20, "last_paid_period": "2026-05", "active": True}
    res_upcoming = calculate_status(exp_upcoming, today)
    assert res_upcoming["status"] == "upcoming"
    assert res_upcoming["due_date"] == datetime.date(2026, 11, 20)

    # Paid for Nov 2026 -> next is May 2027
    exp_paid = {"frequency": "semi_annual", "due_month": 5, "due_day": 20, "last_paid_period": "2026-11", "active": True}
    res_paid = calculate_status(exp_paid, today)
    assert res_paid["status"] == "paid"
    assert res_paid["due_date"] == datetime.date(2027, 5, 20)


def test_calculate_status_yearly():
    today = datetime.date(2026, 8, 15)

    # Yearly expense in November (due month 11, day 1)
    exp = {"frequency": "yearly", "due_month": 11, "due_day": 1, "last_paid_period": "2025", "active": True}
    res = calculate_status(exp, today)
    assert res["status"] == "upcoming"
    assert res["due_date"] == datetime.date(2026, 11, 1)


def test_calculate_status_inactive():
    today = datetime.date(2026, 8, 15)
    exp = {"frequency": "monthly", "due_day": 1, "active": False}
    res = calculate_status(exp, today)
    assert res["status"] == "inactive"
    assert res["due_date"] is None
