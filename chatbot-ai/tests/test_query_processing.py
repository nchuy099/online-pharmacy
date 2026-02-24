from __future__ import annotations

import asyncio
import pytest

from app.chatbot.application import query_processing as qp
from app.chatbot.domain.state import ChatState


def test_process_query_uses_predicted_intent(monkeypatch):
    async def fake_classify(_user_message: str) -> str:
        return "general_health"

    monkeypatch.setattr(qp, "classify_intent", fake_classify)

    state = ChatState(conversation_id="conv-1", message="thuốc đó")

    asyncio.run(qp.process_query(state))

    assert state.predicted_intent == "general_health"
    assert state.resolved_intent == "general_health"
    assert state.context_decision["retrieve_product_kb"] is False
    assert state.context_decision["load_history"] is True


def test_process_query_blocks_product_retrieval_on_emergency(monkeypatch):
    async def fake_classify(_user_message: str) -> str:
        return "pharmacy_product"

    monkeypatch.setattr(qp, "classify_intent", fake_classify)

    state = ChatState(conversation_id="conv-1", message="Tôi bị khó thở và đau ngực")

    asyncio.run(qp.process_query(state))

    assert state.risk["has_emergency"] is True
    assert state.context_decision["retrieve_product_kb"] is False
    assert state.context_decision["load_runtime_policy"] is True
