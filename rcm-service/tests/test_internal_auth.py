import base64
import hashlib
import hmac
import json
import pathlib
import sys
import time

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient

from app.domain.models import RecProduct, RecResponse
from app.main import app


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _make_token(secret: str, issuer: str, audience: str, subject: str = "smart-pharma-backend") -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": subject,
        "iss": issuer,
        "aud": [audience],
        "iat": int(time.time()),
        "exp": int(time.time()) + 60,
    }
    header_raw = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_raw = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_raw}.{payload_raw}".encode("utf-8")
    signature = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    return f"{header_raw}.{payload_raw}.{_b64url_encode(signature)}"


def test_recommendations_require_internal_jwt(monkeypatch):
    monkeypatch.setenv("RCM_INTERNAL_JWT_SECRET", "change_me_shared_rcm_internal_secret")
    monkeypatch.setenv("RCM_INTERNAL_JWT_ISSUER", "smart-pharma-backend")
    monkeypatch.setenv("RCM_INTERNAL_JWT_AUDIENCE", "rcm-service")

    client = TestClient(app)
    response = client.get("/api/v1/recommendations")

    assert response.status_code == 401


def test_recommendations_accept_valid_internal_jwt(monkeypatch):
    monkeypatch.setenv("RCM_INTERNAL_JWT_SECRET", "change_me_shared_rcm_internal_secret")
    monkeypatch.setenv("RCM_INTERNAL_JWT_ISSUER", "smart-pharma-backend")
    monkeypatch.setenv("RCM_INTERNAL_JWT_AUDIENCE", "rcm-service")

    import app.api.recommendation as recommendation_module

    recommendation_module.get_recommendations = lambda user_id=None, current_item_id=None, top_k=10: [
        RecResponse(
            product_id="11111111-1111-1111-1111-111111111111",
            score=1.0,
            source="trending",
            product=RecProduct(
                id="11111111-1111-1111-1111-111111111111",
                slug="demo-product",
                name="Demo Product",
            ),
        )
    ]

    token = _make_token(
        "change_me_shared_rcm_internal_secret",
        "smart-pharma-backend",
        "rcm-service",
    )
    client = TestClient(app)
    response = client.get(
        "/api/v1/recommendations?top_k=1",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()[0]["product"]["name"] == "Demo Product"
