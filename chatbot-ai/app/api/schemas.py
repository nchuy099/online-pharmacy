from typing import Any, List

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    user_context: dict[str, Any] = Field(default_factory=dict)
    conversation_context: dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    reply: str
    intent: str
    sources: List[str] = Field(default_factory=list)


class ChatMetadataRequest(BaseModel):
    conversation_id: str
    user_context: dict[str, Any] = Field(default_factory=dict)
    conversation_context: dict[str, Any] = Field(default_factory=dict)
    user_message: str = ""
    assistant_reply: str = ""


class ChatMetadataResponse(BaseModel):
    title: str
    summary: str
