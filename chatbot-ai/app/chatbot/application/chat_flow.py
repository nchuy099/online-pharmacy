from __future__ import annotations

import logging
import time

from app.chatbot.application.context_loading import load_context
from app.chatbot.application.generation import generate_reply
from app.chatbot.application.postprocess import build_context, postprocess_reply
from app.chatbot.application.query_processing import process_query
from app.chatbot.application.retrieval import retrieve_context
from app.chatbot.domain.routing import route_source
from app.chatbot.domain.state import ChatState

logger = logging.getLogger(__name__)


def _log_step(conversation_id: str, step: str, started_at: float, extra: str = "") -> None:
    elapsed_ms = int((time.perf_counter() - started_at) * 1000)
    suffix = f" | {extra}" if extra else ""
    logger.info(
        "[chatbot-ai][flow] conversation_id=%s step=%s done in %dms%s",
        conversation_id,
        step,
        elapsed_ms,
        suffix,
    )


def _evaluate_policy(state: ChatState) -> None:
    if not state.context_decision.get("load_runtime_policy", True):
        state.route = "NO_RETRIEVAL"
        state.policy = {
            "route": state.route,
            "is_red_flag": False,
            "matched_red_flags": [],
            "allow_retrieval": False,
            "allow_references": False,
            "allow_policy_context": False,
        }
        return

    allow_product_retrieval = bool(state.context_decision.get("retrieve_product_kb"))
    allow_policy_retrieval = bool(state.context_decision.get("retrieve_policy_kb"))
    allow_retrieval = allow_product_retrieval or allow_policy_retrieval
    state.route = route_source(
        intent=state.resolved_intent,
        has_emergency=bool(state.risk.get("has_emergency")),
    )
    if not allow_retrieval and state.route in {"PRODUCT_KB", "POLICY_KB"}:
        state.route = "NO_RETRIEVAL"

    state.policy = {
        "route": state.route,
        "is_red_flag": bool(state.risk.get("has_emergency")),
        "matched_red_flags": state.risk.get("matched_red_flags") or [],
        "allow_retrieval": allow_retrieval,
        "allow_references": allow_product_retrieval,
        "allow_policy_context": allow_policy_retrieval,
    }


async def handle_chat(
    conversation_id: str,
    message: str,
    user_context: dict | None = None,
    conversation_context: dict | None = None,
) -> ChatState:
    state = ChatState(
        conversation_id=(conversation_id or "").strip(),
        message=(message or "").strip(),
        user_context=dict(user_context or {}),
        conversation_context=dict(conversation_context or {}),
    )

    if not state.conversation_id:
        raise ValueError("conversation_id is required")
    if not state.message:
        raise ValueError("message is required")

    flow_started_at = time.perf_counter()
    logger.info(
        "[chatbot-ai][flow] conversation_id=%s start message_len=%d",
        state.conversation_id,
        len(state.message),
    )

    step_started_at = time.perf_counter()
    await process_query(state)
    _log_step(
        state.conversation_id,
        "query_processing",
        step_started_at,
        (
            f"intent={state.resolved_intent} "
            f"product_kb={bool(state.context_decision.get('retrieve_product_kb'))} "
            f"policy={bool(state.context_decision.get('load_runtime_policy'))} "
            f"history={bool(state.context_decision.get('load_history'))}"
        ),
    )

    step_started_at = time.perf_counter()
    load_context(state, include_history=True)
    _log_step(
        state.conversation_id,
        "context_load",
        step_started_at,
        f"recent_turns={len((state.conversation_context.get('recent_turns') or []))}",
    )

    step_started_at = time.perf_counter()
    _evaluate_policy(state)
    _log_step(
        state.conversation_id,
        "policy_evaluate",
        step_started_at,
        (
            f"allow_retrieval={bool(state.policy.get('allow_retrieval'))} "
            f"red_flag={bool(state.policy.get('is_red_flag'))} "
            f"route={state.route}"
        ),
    )

    step_started_at = time.perf_counter()
    await retrieve_context(state)
    build_context(state)
    _log_step(
        state.conversation_id,
        "retrieval",
        step_started_at,
        f"docs={len(state.context_docs)} refs={len(state.references)}",
    )

    step_started_at = time.perf_counter()
    await generate_reply(state)
    _log_step(
        state.conversation_id,
        "generation",
        step_started_at,
        f"reply_len={len(state.reply)}",
    )

    step_started_at = time.perf_counter()
    postprocess_reply(state)
    _log_step(
        state.conversation_id,
        "postprocess",
        step_started_at,
        f"sources={len(state.sources)}",
    )

    total_elapsed_ms = int((time.perf_counter() - flow_started_at) * 1000)
    logger.info(
        "[chatbot-ai][flow] conversation_id=%s finish intent=%s total=%dms",
        state.conversation_id,
        state.resolved_intent,
        total_elapsed_ms,
    )

    return state
