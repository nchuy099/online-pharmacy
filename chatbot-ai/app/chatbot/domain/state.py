from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ChatState:
    conversation_id: str
    message: str
    query: str = ""
    user_context: dict[str, Any] = field(default_factory=dict)
    conversation_context: dict[str, Any] = field(default_factory=dict)
    predicted_intent: str = "general_health"
    resolved_intent: str = "general_health"
    risk: dict[str, Any] = field(default_factory=dict)
    route: str = "NO_RETRIEVAL"
    policy: dict[str, Any] = field(default_factory=dict)
    context_decision: dict[str, bool] = field(default_factory=dict)
    context_docs: list[dict[str, Any]] = field(default_factory=list)
    knowledge_context: str = ""
    conversation_context_text: str = ""
    references: list[dict[str, str]] = field(default_factory=list)
    reply: str = ""
    sources: list[str] = field(default_factory=list)

    @property
    def resolved_user_id(self) -> str | None:
        value = self.user_context.get("resolved_user_id")
        if value:
            return str(value)
        return None


PipelineState = ChatState
