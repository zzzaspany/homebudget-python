from unittest.mock import patch
import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.mark.asyncio
async def test_pwa_static_files():
    """Sprawdza dostępność zasobów aplikacji PWA."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res_manifest = await ac.get("/static/manifest.json")
        res_sw = await ac.get("/static/sw.js")

    assert res_manifest.status_code == 200
    assert "HomeBudget" in res_manifest.text

    assert res_sw.status_code == 200
    assert "CACHE_NAME" in res_sw.text


@pytest.mark.asyncio
@patch("main.pb.get_expenses")
@patch("main.pb.get_payments")
async def test_csv_report_export(mock_get_payments, mock_get_expenses):
    """Sprawdza generowanie i pobieranie raportu w formacie CSV z kodowaniem UTF-8 BOM."""
    mock_get_expenses.return_value = [
        {"id": "e1", "name": "Prąd", "amount": 250.0, "frequency": "monthly", "due_day": 15, "category": "Media", "active": True, "is_variable": True}
    ]
    mock_get_payments.return_value = [
        {"id": "p1", "expense_id": "e1", "amount_paid": 250.0, "date_paid": "2026-08-01", "period": "2026-08", "paid_by": "konrad", "expand": {"expense_id": {"name": "Prąd", "category": "Media"}}}
    ]

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/reports/csv", headers={"X-Forwarded-User": "testuser"})

    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "HOMEBUDGET" in res.text
    assert "Prąd" in res.text


@pytest.mark.asyncio
@patch("main.pb.get_expenses")
@patch("main.pb.get_payments")
async def test_pdf_report_export(mock_get_payments, mock_get_expenses):
    """Sprawdza generowanie pliku PDF przez ReportLab."""
    mock_get_expenses.return_value = [
        {"id": "e1", "name": "Prąd", "amount": 250.0, "frequency": "monthly", "due_day": 15, "category": "Media", "active": True, "is_variable": True}
    ]
    mock_get_payments.return_value = []

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/reports/pdf", headers={"X-Forwarded-User": "testuser"})

    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert res.content.startswith(b"%PDF")
