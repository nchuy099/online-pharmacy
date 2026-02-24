from __future__ import annotations

import logging
import re

from app.chatbot.infrastructure.gemini import DEFAULT_GEMINI_MODEL, generate_gemini_text
from app.chatbot.domain.prompts import INTENT_CLASSIFIER_PROMPT

logger = logging.getLogger(__name__)

INTENT_LABELS = {
    "general_health",
    "pharmacy_product",
    "pharmacy_policy",
}


def normalize_intent_label(raw_intent: str) -> str:
    text = (raw_intent or "").strip().lower()
    normalized = re.sub(r"[^a-z0-9]+", "_", text).strip("_")

    if normalized in INTENT_LABELS:
        return normalized
    return "general_health"


def _is_in_scope_small_talk(user_message: str) -> bool:
    text = re.sub(r"\s+", " ", (user_message or "").strip().lower())
    if not text:
        return False
    return text in {
        "alo",
        "a lô",
        "hi",
        "hello",
        "xin chao",
        "xin chào",
        "chao",
        "chào",
        "chào bạn",
        "cam on",
        "cảm ơn",
        "thanks",
    }


async def classify_intent(user_message: str) -> str:
    if _is_in_scope_small_talk(user_message):
        return "general_health"

    try:
        response = await generate_gemini_text(
            model=DEFAULT_GEMINI_MODEL,
            system_instruction=INTENT_CLASSIFIER_PROMPT,
            prompt=user_message,
            temperature=0.0,
        )
        return normalize_intent_label(response)
    except Exception as e:
        logger.exception("[chatbot-ai][intent] classify_failed error=%s", str(e))
        return "general_health"

