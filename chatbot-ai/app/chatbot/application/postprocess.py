from __future__ import annotations

import os

from app.chatbot.domain.references import build_product_references
from app.chatbot.domain.state import ChatState


def _stable_unique(items: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for item in items:
        if not item or item in seen:
            continue
        seen.add(item)
        ordered.append(item)
    return ordered


def build_context(state: ChatState, web_base_url: str = "") -> None:
    resolved_web_base_url = (web_base_url or os.getenv("FE_CUSTOMER_URL", "")).strip()
    state.references = build_product_references(
        state.context_docs,
        web_base_url=resolved_web_base_url,
    )

    base_context_text = "\n\n".join(
        [
            str(doc.get("text", "")).strip()
            for doc in state.context_docs
            if str(doc.get("text", "")).strip()
        ]
    )

    if state.references:
        reference_lines = ["", "REFERENCE_CANDIDATES:"]
        for ref in state.references[:3]:
            name = str(ref.get("name") or "Sản phẩm")
            url = str(ref.get("url") or "").strip()
            if not url:
                continue
            reference_lines.append(f"- {name}: {url}")
        if len(reference_lines) > 2:
            base_context_text = base_context_text.rstrip() + "\n" + "\n".join(reference_lines)

    state.knowledge_context = base_context_text


def postprocess_reply(state: ChatState) -> None:
    reply = (state.reply or "").strip()

    sources = [ref.get("source", "") for ref in state.references]
    if not state.policy.get("allow_references"):
        sources = []

    state.reply = reply
    state.sources = _stable_unique(sources)
