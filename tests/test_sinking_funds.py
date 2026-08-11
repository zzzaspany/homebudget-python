from unittest.mock import patch
import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.mark.asyncio
async def test_dashboard_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/", headers={"X-Forwarded-User": "testuser"})
    assert response.status_code == 200
    assert "homebudget" in response.text


@pytest.mark.asyncio
@patch("main.pb.get_expenses")
@patch("main.pb.get_payments")
async def test_api_expenses_and_sinking_funds(mock_get_payments, mock_get_expenses):
    mock_get_expenses.return_value = [
        {"id": "exp1", "name": "Czynsz", "amount": 1000.0, "frequency": "monthly", "due_day": 10, "category": "Media", "active": True},
        {"id": "exp2", "name": "Ubezpieczenie OC", "amount": 1200.0, "frequency": "yearly", "due_day": 15, "due_month": 5, "category": "Podatki", "active": True},
        {"id": "exp3", "name": "Śmieci", "amount": 300.0, "frequency": "quarterly", "due_day": 1, "due_month": 1, "category": "Media", "active": True},
    ]
    mock_get_payments.return_value = []

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/expenses", headers={"X-Forwarded-User": "testuser"})

    assert response.status_code == 200
    data = response.json()

    kpis = data["kpis"]
    assert kpis["monthly_total"] == 1000.0
    assert kpis["yearly_total"] == 1200.0
    # Prorated = 1000 (monthly) + 1200/12 (yearly) + 300/3 (quarterly) = 1000 + 100 + 100 = 1200.0
    assert kpis["pro_rated_monthly"] == 1200.0
    # Sinking fund = 100 (yearly/12) + 100 (quarterly/3) = 200.0
    assert kpis["sinking_fund_total"] == 200.0

    sinking_items = data["sinking_fund_items"]
    assert len(sinking_items) == 2
