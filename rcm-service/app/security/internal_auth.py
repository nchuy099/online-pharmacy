from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any

from fastapi import Header, HTTPException


class InternalAuthError(ValueError):
    pass


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _env(name: str, default: str | None = None) -> str:
    value = (os.getenv(name) or default or "").strip()
    return value


def extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise InternalAuthError("Missing internal token")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise InternalAuthError("Missing internal token")

    return token


def decode_and_verify_internal_jwt(token: str) -> dict[str, Any]:
    if not token:
        raise InternalAuthError("Missing internal token")

    secret = _env("RCM_INTERNAL_JWT_SECRET")
    if not secret:
        raise InternalAuthError("Internal auth is not configured")

    parts = token.split(".")
    if len(parts) != 3:
        raise InternalAuthError("Invalid internal token")

    header_raw, payload_raw, signature_raw = parts

    try:
        header = json.loads(_b64url_decode(header_raw))
        payload = json.loads(_b64url_decode(payload_raw))
    except Exception as exc:
        raise InternalAuthError("Invalid internal token") from exc

    if header.get("alg") != "HS256":
        raise InternalAuthError("Invalid internal token")

    signing_input = f"{header_raw}.{payload_raw}".encode("utf-8")
    expected_sig = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    actual_sig = _b64url_decode(signature_raw)
    if not hmac.compare_digest(expected_sig, actual_sig):
        raise InternalAuthError("Invalid internal token")

    exp = payload.get("exp")
    if not isinstance(exp, int) or exp <= int(time.time()):
        raise InternalAuthError("Internal token expired")

    expected_issuer = _env("RCM_INTERNAL_JWT_ISSUER", "smart-pharma-backend")
    if payload.get("iss") != expected_issuer:
        raise InternalAuthError("Invalid internal token")

    expected_audience = _env("RCM_INTERNAL_JWT_AUDIENCE", "rcm-service")
    aud = payload.get("aud")
    aud_values = aud if isinstance(aud, list) else [aud] if aud else []
    if expected_audience not in aud_values:
        raise InternalAuthError("Invalid internal token")

    if not payload.get("sub"):
        raise InternalAuthError("Invalid internal token")

    return payload


def require_internal_request(
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> dict[str, Any]:
    try:
        token = extract_bearer_token(authorization)
        return decode_and_verify_internal_jwt(token)
    except InternalAuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
