import os
import httpx
from dotenv import load_dotenv

load_dotenv()

PB_URL = os.getenv("POCKETBASE_URL", "https://pocketbase.office.lab")
PB_VERIFY_SSL = os.getenv("PB_VERIFY_SSL", "false").lower() == "true"
POCKETBASE_COLLECTION = os.getenv("POCKETBASE_COLLECTION", "users")
POCKETBASE_USER = os.getenv("POCKETBASE_USER")
POCKETBASE_PASSWORD = os.getenv("POCKETBASE_PASSWORD")


class PocketBaseClient:
    def __init__(self):
        self.client = httpx.Client(base_url=PB_URL, verify=PB_VERIFY_SSL)
        self.token = None

    def _authenticate(self):
        if not POCKETBASE_USER or not POCKETBASE_PASSWORD:
            raise ValueError("PocketBase credentials not configured in environment")

        if POCKETBASE_COLLECTION in ["_superusers", "superusers"]:
            url = "/api/collections/_superusers/auth-with-password"
        else:
            url = f"/api/collections/{POCKETBASE_COLLECTION}/auth-with-password"

        payload = {
            "identity": POCKETBASE_USER,
            "password": POCKETBASE_PASSWORD,
        }
        response = self.client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        self.token = data["token"]
        self.client.headers["Authorization"] = f"Bearer {self.token}"

    def _request(self, method, url, **kwargs):
        if not self.token:
            self._authenticate()

        try:
            response = self.client.request(method, url, **kwargs)
            if response.status_code in [401, 403]:
                # Token might have expired or invalidated, try re-authenticating once
                self._authenticate()
                response = self.client.request(method, url, **kwargs)
            response.raise_for_status()
            if response.status_code == 204 or not response.text.strip():
                return {}
            return response.json()
        except httpx.HTTPStatusError as e:
            print(f"HTTP Error {e.response.status_code} for {method} {url}: {e.response.text}")
            raise

    def get_expenses(self):
        url = "/api/collections/homebudget/records"
        params = {"perPage": 500, "sort": "+name"}
        result = self._request("GET", url, params=params)
        return result.get("items", [])

    def create_expense(self, data):
        url = "/api/collections/homebudget/records"
        payload = {
            "name": data.get("name"),
            "amount": float(data.get("amount", 0)),
            "frequency": data.get("frequency"),
            "due_day": int(data.get("due_day", 1)),
            "due_month": int(data.get("due_month"))
            if data.get("due_month") is not None and data.get("due_month") != ""
            else None,
            "category": data.get("category"),
            "last_paid_period": data.get("last_paid_period", ""),
            "active": data.get("active", True),
            "is_variable": bool(data.get("is_variable", False)),
        }
        return self._request("POST", url, json=payload)

    def update_expense(self, record_id, data):
        url = f"/api/collections/homebudget/records/{record_id}"
        payload = {}
        if "name" in data:
            payload["name"] = data["name"]
        if "amount" in data:
            payload["amount"] = float(data["amount"])
        if "frequency" in data:
            payload["frequency"] = data["frequency"]
        if "due_day" in data:
            payload["due_day"] = int(data["due_day"])
        if "due_month" in data:
            payload["due_month"] = (
                int(data["due_month"])
                if data["due_month"] is not None and data["due_month"] != ""
                else None
            )
        if "category" in data:
            payload["category"] = data["category"]
        if "last_paid_period" in data:
            payload["last_paid_period"] = data["last_paid_period"]
        if "active" in data:
            payload["active"] = bool(data["active"])
        if "is_variable" in data:
            payload["is_variable"] = bool(data["is_variable"])

        return self._request("PATCH", url, json=payload)

    def delete_expense(self, record_id):
        url = f"/api/collections/homebudget/records/{record_id}"
        self._request("DELETE", url)
        return True

    def pay_expense(self, record_id, period):
        return self.update_expense(record_id, {"last_paid_period": period})

    def get_payments(self):
        url = "/api/collections/payments/records"
        params = {
            "perPage": 500,
            "sort": "-created",
            "expand": "expense_id",
        }
        result = self._request("GET", url, params=params)
        return result.get("items", [])

    def create_payment(self, expense_id, amount_paid, date_paid, period, paid_by=None, attachment_filename=None, attachment_bytes=None):
        url = "/api/collections/payments/records"
        data = {
            "expense_id": expense_id,
            "amount_paid": str(amount_paid),
            "date_paid": str(date_paid),
            "period": str(period),
            "paid_by": str(paid_by) if paid_by else "",
        }
        
        if attachment_bytes and attachment_filename:
            files = {"invoice": (attachment_filename, attachment_bytes)}
            if not self.token:
                self._authenticate()
            resp = self.client.post(url, data=data, files=files)
            resp.raise_for_status()
            return resp.json()
        else:
            return self._request("POST", url, json={
                "expense_id": expense_id,
                "amount_paid": float(amount_paid),
                "date_paid": str(date_paid),
                "period": str(period),
                "paid_by": str(paid_by) if paid_by else ""
            })



# Singleton client
pb = PocketBaseClient()
