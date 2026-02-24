from __future__ import annotations

import asyncio
import pytest

from app.chatbot.application import chat_flow


def test_handle_chat_runs_full_flow_with_mocked_adapters(monkeypatch):
    calls: list[str] = []

    async def fake_process_query(state):
        calls.append("process_query")
        state.predicted_intent = "general_health"
        state.resolved_intent = "general_health"
        state.risk = {"has_emergency": False, "matched_red_flags": []}
        state.context_decision = {
            "retrieve_product_kb": False,
            "retrieve_policy_kb": False,
            "load_runtime_policy": False,
            "load_history": False,
        }

    async def fake_retrieve_context(state):
        calls.append("retrieve_context")
        state.context_docs = []

    async def fake_generate_reply(state):
        calls.append("generate_reply")
        state.reply = "Đã xử lý."

    monkeypatch.setattr(chat_flow, "process_query", fake_process_query)
    monkeypatch.setattr(chat_flow, "retrieve_context", fake_retrieve_context)
    monkeypatch.setattr(chat_flow, "generate_reply", fake_generate_reply)

    state = asyncio.run(chat_flow.handle_chat("conv-1", "xin chào", {}, {"recent_turns": []}))

    assert state.reply == "Đã xử lý."
    assert state.route == "NO_RETRIEVAL"
    assert calls == ["process_query", "retrieve_context", "generate_reply"]
