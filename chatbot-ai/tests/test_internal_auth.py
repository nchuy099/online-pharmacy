from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time

import pytest

from app.security.internal_auth import (
    InternalAuthError,
    decode_and_verify_internal_jwt,
    extract_bearer_token,
)


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _sign_token(secret: str, payload: dict[str, object]) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    signing_input = f"{_b64url(json.dumps(header, separators=(',', ':')).encode())}.{_b64url(json.dumps(payload, separators=(',', ':')).encode())}"
    signature = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()
    return f"{signing_input}.{_b64url(signature)}"


def test_decode_internal_jwt_accepts_valid_token(monkeypatch):
    secret = "test-secret-12345678901234567890"
    monkeypatch.setenv("CHATBOT_INTERNAL_JWT_SECRET", secret)
    monkeypatch.setenv("CHATBOT_INTERNAL_JWT_ISSUER", "smart-pharma-backend")
    monkeypatch.setenv("CHATBOT_INTERNAL_JWT_AUDIENCE", "chatbot-ai")

    token = _sign_token(
        secret,
        {
            "sub": "11111111-1111-1111-1111-111111111111",
            "iss": "smart-pharma-backend",
            "aud": ["chatbot-ai"],
            "conversation_id": "22222222-2222-2222-2222-222222222222",
            "iat": int(time.time()),
            "exp": int(time.time()) + 60,
        },
    )

    payload = decode_and_verify_internal_jwt(token)

    assert payload["sub"] == "11111111-1111-1111-1111-111111111111"
    assert payload["conversation_id"] == "22222222-2222-2222-2222-222222222222"


def test_extract_bearer_token_rejects_missing_header():
    with pytest.raises(InternalAuthError):
        extract_bearer_token(None)
