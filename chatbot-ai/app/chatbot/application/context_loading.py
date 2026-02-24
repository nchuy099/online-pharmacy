from __future__ import annotations

from app.chatbot.domain.state import ChatState


def _build_conversation_context_text(conversation_context: dict) -> str:
    lines: list[str] = []
    recent_turns = conversation_context.get("recent_turns") or []
    if isinstance(recent_turns, list):
        for turn in recent_turns[-8:]:
            if not isinstance(turn, dict):
                continue
            role = turn.get("role", "unknown")
            content = turn.get("content", "")
            if content:
                lines.append(f"{role}: {content}")

    summary = conversation_context.get("summary_text") or conversation_context.get("summary")
    if summary:
        lines.append(f"conversation_summary: {summary}")

    return "\n".join(lines)


def load_context(state: ChatState, include_history: bool = True) -> None:
    state.conversation_context_text = (
        _build_conversation_context_text(state.conversation_context) if include_history else ""
    )
