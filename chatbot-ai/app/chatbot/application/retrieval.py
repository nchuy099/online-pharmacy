from __future__ import annotations

from pathlib import Path

from app.chatbot.domain.prompts import PRODUCT_RETRIEVAL_QUERY_PROMPT
from app.chatbot.domain.state import ChatState
from app.chatbot.infrastructure import gemini
from app.chatbot.infrastructure.qdrant import search_product_documents


POLICY_FILE = Path(__file__).resolve().parents[3] / "policy" / "policies.md"


def _load_policy_docs() -> list[dict[str, str]]:
    try:
        text = POLICY_FILE.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        text = ""
    if not text:
        return []
    return [{"source": "policies.md", "title": "Chính sách nhà thuốc", "text": text}]


async def _build_product_retrieval_query(state: ChatState) -> str:
    fallback_query = (state.query or state.message or "").strip()
    if not fallback_query:
        return ""

    try:
        rewritten = await gemini.generate_gemini_text(
            model=gemini.DEFAULT_GEMINI_MODEL,
            system_instruction=PRODUCT_RETRIEVAL_QUERY_PROMPT,
            prompt=(
                f"USER_QUERY:\n{fallback_query}\n\n"
                f"CONVERSATION_CONTEXT:\n{state.conversation_context_text or ''}"
            ),
            temperature=0.0,
        )
    except Exception:
        return fallback_query

    rewritten = " ".join((rewritten or "").strip().split())
    return rewritten or fallback_query


async def retrieve_context(state: ChatState) -> None:
    if state.context_decision.get("retrieve_policy_kb"):
        state.context_docs = _load_policy_docs() if state.policy.get("allow_retrieval") else []
        state.references = []
        state.knowledge_context = ""
        return

    if not state.policy.get("allow_retrieval") or not state.context_decision.get("retrieve_product_kb"):
        state.context_docs = []
        state.references = []
        state.knowledge_context = ""
        return

    retrieval_query = await _build_product_retrieval_query(state)
    if not retrieval_query:
        state.context_docs = []
        return

    docs = search_product_documents(
        retrieval_query,
        user_context=state.user_context,
        conversation_context=state.conversation_context,
        top_k_retrieve=3,
        top_k_final=3,
    )

    state.context_docs = [doc for doc in docs if isinstance(doc, dict)]
