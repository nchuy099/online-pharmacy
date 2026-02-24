from __future__ import annotations

from app.chatbot.domain.intent import classify_intent, normalize_intent_label
from app.chatbot.domain.references import resolve_intent_with_session
from app.chatbot.domain.routing import decide_context_needs, evaluate_risk
from app.chatbot.domain.state import ChatState


def apply_session_context(state: ChatState) -> None:
    state.resolved_intent = normalize_intent_label(
        resolve_intent_with_session(
            predicted_intent=state.predicted_intent,
            message=state.query or state.message,
        )
    )
    state.context_decision = decide_context_needs(state)


async def process_query(state: ChatState) -> None:
    state.query = (state.message or "").strip()
    state.predicted_intent = await classify_intent(state.query)
    state.risk = evaluate_risk(state.query)
    apply_session_context(state)
