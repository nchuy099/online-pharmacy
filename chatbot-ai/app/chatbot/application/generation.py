from __future__ import annotations

import json
import logging

from app.chatbot.domain.prompts import PHARMACY_SYSTEM_PROMPT
from app.chatbot.domain.state import ChatState
from app.chatbot.infrastructure import gemini

logger = logging.getLogger(__name__)


def build_escalation_reply(state: ChatState) -> str:
    matched = state.risk.get("matched_red_flags") or []
    suffix = f" ({', '.join(matched[:3])})" if matched else ""
    return (
        f"Triệu chứng bạn mô tả có dấu hiệu nguy hiểm{suffix}.\n"
        "Bạn nên liên hệ cấp cứu hoặc đến cơ sở y tế gần nhất ngay, không nên tự dùng thuốc để trì hoãn xử trí."
    )


def _build_policy_guidance(policy: dict) -> str:
    lines: list[str] = []
    if policy.get("is_red_flag"):
        lines.append(
            "- Đây là ca có dấu hiệu nguy cơ cao. Ưu tiên khuyến nghị đi khám/cấp cứu, không gợi ý sản phẩm."
        )
    if policy.get("allow_policy_context"):
        lines.append("- Trả lời chính sách nhà thuốc chỉ dựa trên policy context. Không thêm tham khảo sản phẩm.")
    elif not policy.get("allow_references"):
        lines.append("- Không thêm mục tham khảo sản phẩm trong nội dung trả lời.")
    else:
        lines.append("- Không tự bịa sản phẩm; chỉ trả lời theo knowledge context.")
        lines.append("- Bắt buộc thêm mục tham khảo sản phẩm với tối đa 3 dòng, dùng link Markdown có thể bấm theo dạng: - [Tên sản phẩm](URL).")
        lines.append("- Ưu tiên lấy URL từ REFERENCE_CANDIDATES trong knowledge context.")
    return "\n".join(lines)


def _build_safety_guard(intent: str) -> str:
    if intent not in {"general_health", "pharmacy_product"}:
        return "- Không áp dụng safety guard y tế cho intent chính sách; chỉ trả lời theo chính sách nhà thuốc."
    return "\n".join(
        [
            "- Nếu có dấu hiệu cấp cứu/nguy hiểm như khó thở, đau ngực, co giật, lơ mơ, sốt cao không hạ, nôn/đi ngoài ra máu: khuyên liên hệ cấp cứu hoặc đi khám ngay.",
            "- Không chẩn đoán xác định bệnh và không thay thế bác sĩ/dược sĩ trực tiếp.",
            "- Không đưa liều cụ thể nếu thiếu tuổi, cân nặng, bệnh nền, dị ứng hoặc thuốc đang dùng.",
            "- Không khuyến khích tự ý dùng kháng sinh, corticoid hoặc thuốc kê đơn.",
        ]
    )


async def generate_reply(state: ChatState) -> None:
    if state.route == "ESCALATE_TO_PHARMACIST":
        state.reply = build_escalation_reply(state)
        return

    policy_guidance = _build_policy_guidance(state.policy)
    user_context_str = json.dumps(state.user_context, ensure_ascii=False, default=str)

    try:
        system_instruction = gemini.render_prompt(
            PHARMACY_SYSTEM_PROMPT,
            {
                "knowledge_context": state.knowledge_context,
                "conversation_context": state.conversation_context_text,
                "intent": state.resolved_intent,
                "safety_guard": _build_safety_guard(state.resolved_intent),
                "user_context": user_context_str,
                "policy_guidance": policy_guidance,
            },
        )
        state.reply = await gemini.generate_gemini_text(
            model=gemini.DEFAULT_GEMINI_MODEL,
            system_instruction=system_instruction,
            prompt=state.message,
            temperature=0.2,
        )
    except Exception as e:
        logger.exception("[chatbot-ai][generation] llm_failed error=%s", str(e))
        state.reply = (
            "Tóm tắt\n"
            "Xin lỗi, hệ thống đang gặp sự cố.\n\n"
            "Gợi ý/Thông tin chính\n"
            "Bạn vui lòng thử lại sau ít phút.\n\n"
            "Lưu ý an toàn\n"
            "Nếu triệu chứng đang nặng, hãy liên hệ dược sĩ hoặc cơ sở y tế ngay.\n\n"
            "Khi nào cần gặp bác sĩ\n"
            "Nếu triệu chứng kéo dài hoặc xấu đi, bạn nên đi khám sớm."
        )
