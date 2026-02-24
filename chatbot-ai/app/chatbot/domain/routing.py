from __future__ import annotations

import re
from typing import Any

from app.chatbot.domain.state import ChatState


EMERGENCY_KEYWORDS = (
    "khó thở",
    "kho tho",
    "đau ngực",
    "dau nguc",
    "co giật",
    "co giat",
    "li bì",
    "li bi",
    "lừ đừ",
    "lu du",
    "ngất",
    "ngat",
    "sốt cao không hạ",
    "sot cao khong ha",
    "nôn ra máu",
    "non ra mau",
    "đi ngoài ra máu",
    "di ngoai ra mau",
    "ho ra máu",
    "ho ra mau",
    "đau dữ dội",
    "dau du doi",
    "sưng phù mặt",
    "sung phu mat",
    "sưng môi",
    "sung moi",
    "sưng lưỡi",
    "sung luoi",
    "phản vệ",
    "phan ve",
)

PRODUCT_KB_INTENTS = {
    "pharmacy_product",
}

POLICY_KB_INTENTS = {"pharmacy_policy"}

RUNTIME_POLICY_INTENTS = PRODUCT_KB_INTENTS | POLICY_KB_INTENTS | {"general_health"}

FOLLOW_UP_PATTERN = re.compile(
    r"\b("
    r"vậy|vay|thế|the|nó|no|thuốc đó|thuoc do|loại đó|loai do|"
    r"uống sao|uong sao|dùng sao|dung sao|liều|lieu|"
    r"\d{1,2}\s*tuổi|\d{1,2}\s*ngày|\d{1,2}\s*tuần"
    r")\b",
    flags=re.IGNORECASE,
)


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def evaluate_risk(message: str) -> dict[str, Any]:
    text = _normalize_text(message)
    matched = [keyword for keyword in EMERGENCY_KEYWORDS if keyword in text]
    return {
        "has_emergency": bool(matched),
        "matched_red_flags": matched,
    }


def _looks_like_follow_up(message: str) -> bool:
    text = re.sub(r"\s+", " ", (message or "").strip().lower())
    if not text:
        return False
    if FOLLOW_UP_PATTERN.search(text):
        return True
    return len(text.split()) <= 4 and bool(re.search(r"\d", text))


def route_source(intent: str, has_emergency: bool) -> str:
    if has_emergency:
        return "ESCALATE_TO_PHARMACIST"

    if intent == "pharmacy_product":
        return "PRODUCT_KB"

    if intent == "pharmacy_policy":
        return "POLICY_KB"

    if intent == "general_health":
        return "NO_RETRIEVAL"

    return "NO_RETRIEVAL"


def decide_context_needs(state: ChatState) -> dict[str, bool]:
    has_emergency = bool(state.risk.get("has_emergency"))
    retrieve_product_kb = state.resolved_intent in PRODUCT_KB_INTENTS and not has_emergency
    retrieve_policy_kb = state.resolved_intent in POLICY_KB_INTENTS

    return {
        "retrieve_product_kb": retrieve_product_kb,
        "retrieve_policy_kb": retrieve_policy_kb,
        "load_runtime_policy": state.resolved_intent in RUNTIME_POLICY_INTENTS or has_emergency,
        "load_history": retrieve_product_kb or (
            state.resolved_intent != "pharmacy_policy" and _looks_like_follow_up(state.message)
        ),
    }

