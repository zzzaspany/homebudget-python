"""The SSO header boundary.

The app authenticates nobody itself — it trusts headers Authelia sets in front of it. These pin
down which headers grant access, and that no headers means no access.

Deliberately narrow: this app is on its way out, replaced by the Swift rewrite. Worth covering the
security boundary, not worth covering the rest.
"""

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from auth import get_current_user
from main import app


class FakeRequest:
    def __init__(self, headers=None):
        self.headers = headers or {}


def test_no_headers_is_rejected(monkeypatch):
    monkeypatch.setenv("DEV_MODE", "false")

    with pytest.raises(HTTPException) as raised:
        get_current_user(FakeRequest())

    assert raised.value.status_code == 401


@pytest.mark.parametrize("header", ["Remote-User", "X-Forwarded-User", "X-Auth-User"])
def test_each_accepted_header_identifies_the_caller(header, monkeypatch):
    monkeypatch.setenv("DEV_MODE", "false")

    user = get_current_user(FakeRequest({header: "konrad"}))

    assert user.username == "konrad"


def test_remote_user_wins_over_the_others(monkeypatch):
    monkeypatch.setenv("DEV_MODE", "false")

    user = get_current_user(
        FakeRequest({"Remote-User": "first", "X-Forwarded-User": "second", "X-Auth-User": "third"})
    )

    assert user.username == "first"


def test_dev_mode_grants_an_identity_without_any_header(monkeypatch):
    """DEV_MODE turns the 401 into a signed-in user. It exists so the app runs without Authelia
    in front of it; this test is here so that is explicit rather than discovered in production."""
    monkeypatch.setenv("DEV_MODE", "true")

    user = get_current_user(FakeRequest())

    assert user.username == "konrad"


def test_dev_mode_does_not_override_a_real_identity(monkeypatch):
    monkeypatch.setenv("DEV_MODE", "true")

    user = get_current_user(FakeRequest({"Remote-User": "someone-else"}))

    assert user.username == "someone-else"


def test_name_and_email_fall_back_to_the_username(monkeypatch):
    monkeypatch.setenv("DEV_MODE", "false")

    user = get_current_user(FakeRequest({"Remote-User": "konrad"}))

    assert user.name == "konrad"
    assert user.email == "konrad@office.lab"


def test_supplied_name_and_email_are_used(monkeypatch):
    monkeypatch.setenv("DEV_MODE", "false")

    user = get_current_user(
        FakeRequest(
            {"Remote-User": "konrad", "Remote-Name": "Konrad Z", "Remote-Email": "k@example.com"}
        )
    )

    assert user.name == "Konrad Z"
    assert user.email == "k@example.com"


def test_the_api_refuses_an_unauthenticated_request(monkeypatch):
    """End to end through FastAPI, rather than calling the dependency directly: a route that
    forgot its Depends would still pass the unit tests above."""
    monkeypatch.setenv("DEV_MODE", "false")

    with TestClient(app) as client:
        assert client.get("/api/expenses").status_code == 401
