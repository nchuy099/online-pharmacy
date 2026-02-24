from __future__ import annotations

import base64
import hashlib
import hmac
import json
import asyncio
import time

from app.main import app


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _sign_token(secret: str, payload: dict[str, object]) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    signing_input = f"{_b64url(json.dumps(header, separators=(',', ':')).encode())}.{_b64url(json.dumps(payload, separators=(',', ':')).encode())}"
    signature = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()
    return f"{signing_input}.{_b64url(signature)}"


def test_metadata_endpoint_returns_title_and_summary(monkeypatch):
    from app.api import routes

    secret = "test-secret-12345678901234567890"
    monkeypatch.setenv("CHATBOT_INTERNAL_JWT_SECRET", secret)
    monkeypatch.setenv("CHATBOT_INTERNAL_JWT_ISSUER", "smart-pharma-backend")
    monkeypatch.setenv("CHATBOT_INTERNAL_JWT_AUDIENCE", "chatbot-ai")

    async def fake_generate_chat_metadata(*args, **kwargs):
        class Result:
            title = "Tư vấn ho khan"
            summary = "Người dùng hỏi về ho khan."

        return Result()

    monkeypatch.setattr(routes, "generate_chat_metadata", fake_generate_chat_metadata)

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
    auth_payload = asyncio.run(routes.require_internal_auth(authorization=f"Bearer {token}"))
    assert auth_payload["conversation_id"] == "22222222-2222-2222-2222-222222222222"

    response = asyncio.run(
        routes.chat_metadata_endpoint(
            routes.ChatMetadataRequest(
                conversation_id="22222222-2222-2222-2222-222222222222",
                user_context={"profile": {"full_name": "Nguyen Van A"}},
                conversation_context={"summary_text": "đau đầu"},
                user_message="Xin chào",
                assistant_reply="Chào bạn",
            ),
            auth_payload,
        )
    )

    assert response.title == "Tư vấn ho khan"
    assert response.summary == "Người dùng hỏi về ho khan."
    assert response.model_dump() == {
        "title": "Tư vấn ho khan",
        "summary": "Người dùng hỏi về ho khan.",
    }
