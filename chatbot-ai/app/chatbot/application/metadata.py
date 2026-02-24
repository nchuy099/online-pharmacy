from __future__ import annotations

import json
import logging
from dataclasses import dataclass

from app.chatbot.domain.state import ChatState
from app.chatbot.infrastructure import gemini

logger = logging.getLogger(__name__)


METADATA_SYSTEM_PROMPT = """
Bạn là bộ sinh metadata cho hội thoại nhà thuốc.

Nhiệm vụ:
- Tạo 1 title ngắn, mô tả đúng chủ đề hội thoại hiện tại.
- Tạo 1 summary ngắn, phản ánh mạch hội thoại vừa rồi để dùng làm context sau này.

QUY TẮC:
- Title ngắn, rõ nghĩa, không quá 8 từ.
- Summary ngắn gọn, tối đa 3 câu.
- Không lặp nguyên văn câu chat của user.
- Không thêm markdown.
- Chỉ trả về JSON hợp lệ với 2 khóa: title, summary.

NGUỒN CONTEXT:
- USER_CONTEXT:
{user_context}

- CONVERSATION_CONTEXT:
{conversation_context}

- LAST_USER_MESSAGE:
{user_message}

- LAST_ASSISTANT_REPLY:
{assistant_reply}
"""


@dataclass
class ChatMetadata:
    title: str
    summary: str


def _coerce_json_payload(text: str) -> dict[str, str]:
    raw = (text or "").strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        raw = raw.removeprefix("json").strip()

    try:
        data = json.loads(raw)
    except Exception:
        return {}

    title = str(data.get("title") or "").strip()
    summary = str(data.get("summary") or "").strip()
    return {"title": title, "summary": summary}


def _fallback_title(conversation_context: dict) -> str:
    summary = str(conversation_context.get("summary_text") or conversation_context.get("summary") or "").strip()
    if summary:
        return summary.split(".")[0][:40].strip() or "Tư vấn nhà thuốc"
    recent_turns = conversation_context.get("recent_turns") or []
    if isinstance(recent_turns, list):
        for turn in recent_turns:
            if isinstance(turn, dict):
                content = str(turn.get("content") or "").strip()
                if content:
                    return content.split(".")[0][:40].strip() or "Tư vấn nhà thuốc"
    return "Tư vấn nhà thuốc"


def _fallback_summary(user_message: str, assistant_reply: str) -> str:
    user = " ".join((user_message or "").strip().split())[:120]
    assistant = " ".join((assistant_reply or "").strip().split())[:200]
    if user and assistant:
        return f"Người dùng hỏi: {user}. Trợ lý trả lời: {assistant}"
    return user or assistant or "Đang trao đổi về tư vấn nhà thuốc."


async def generate_chat_metadata(
    state: ChatState,
    assistant_reply: str,
) -> ChatMetadata:
    try:
        system_instruction = gemini.render_prompt(
            METADATA_SYSTEM_PROMPT,
            {
                "user_context": json.dumps(state.user_context, ensure_ascii=False, default=str),
                "conversation_context": json.dumps(state.conversation_context, ensure_ascii=False, default=str),
                "user_message": state.message,
                "assistant_reply": assistant_reply,
            },
        )
        raw = await gemini.generate_gemini_text(
            model=gemini.DEFAULT_GEMINI_MODEL,
            system_instruction=system_instruction,
            prompt="Hãy trả về JSON title/summary ngay bây giờ.",
            temperature=0.2,
        )
        parsed = _coerce_json_payload(raw)
        title = parsed.get("title") or _fallback_title(state.conversation_context)
        summary = parsed.get("summary") or _fallback_summary(state.message, assistant_reply)
        return ChatMetadata(title=title, summary=summary)
    except Exception as exc:
        logger.exception("[chatbot-ai][metadata] generation_failed error=%s", str(exc))
        return ChatMetadata(
            title=_fallback_title(state.conversation_context),
            summary=_fallback_summary(state.message, assistant_reply),
        )
