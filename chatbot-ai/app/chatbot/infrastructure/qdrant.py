from __future__ import annotations

import os
from typing import Any

from app.chatbot.infrastructure.gemini import embed_text


_qdrant_client = None


def _get_qdrant_client():
    global _qdrant_client
    if _qdrant_client is None:
        from qdrant_client import QdrantClient

        _qdrant_client = QdrantClient(
            url=os.getenv("QDRANT_URL", ""),
            api_key=os.getenv("QDRANT_API_KEY", ""),
            timeout=5,
            check_compatibility=False,
        )
    return _qdrant_client


def _collection_name() -> str:
    return (os.getenv("QDRANT_COLLECTION") or "products_kb").strip()


def _get_collection_vector_size() -> int:
    try:
        collection_info = _get_qdrant_client().get_collection(_collection_name())
        vectors = collection_info.config.params.vectors
        size = getattr(vectors, "size", None)
        if isinstance(size, int) and size > 0:
            return size
    except Exception:
        pass
    return 768


def _extract_personalization_hints(user_context: dict[str, Any] | None = None) -> list[str]:
    if not user_context:
        return []

    hints: list[str] = []

    profile = user_context.get("profile") or {}
    allergy = profile.get("drug_allergies")
    if allergy:
        hints.append(f"Di ung thuoc can tranh: {allergy}")

    pref = user_context.get("preference") or {}
    preferred_forms = pref.get("preferred_dosage_forms")
    if isinstance(preferred_forms, list) and preferred_forms:
        first = preferred_forms[0]
        if isinstance(first, dict) and first.get("form"):
            hints.append(f"Dang uu tien: {first['form']}")

    price_min = pref.get("preferred_price_min")
    price_max = pref.get("preferred_price_max")
    if price_min is not None and price_max is not None:
        hints.append(f"Khoang gia uu tien: {price_min}-{price_max}")

    return hints


def build_personalized_query(
    query: str,
    user_context: dict[str, Any] | None = None,
    conversation_context: dict[str, Any] | None = None,
) -> str:
    hints = _extract_personalization_hints(user_context)
    if conversation_context:
        summary_text = conversation_context.get("summary_text") or conversation_context.get("summary")
        if summary_text:
            hints.append(f"Ngu canh hoi thoai gan day: {summary_text}")

        safety_flags = conversation_context.get("safety_flags")
        if isinstance(safety_flags, list) and safety_flags:
            hints.append(
                "Co canh bao an toan can uu tien: "
                + ", ".join(str(flag) for flag in safety_flags[:3])
            )
    if not hints:
        return query
    return query + "\n" + "\n".join(hints)


def search_product_documents(
    query: str,
    user_context: dict[str, Any] | None = None,
    conversation_context: dict[str, Any] | None = None,
    top_k_retrieve: int = 3,
    top_k_final: int = 3,
) -> list[dict[str, Any]]:
    personalized_query = build_personalized_query(query, user_context, conversation_context)

    try:
        vector_size = _get_collection_vector_size()
        query_vector = embed_text(personalized_query, output_dimensionality=vector_size)
        search_result = _get_qdrant_client().query_points(
            collection_name=_collection_name(),
            query=query_vector,
            limit=top_k_retrieve,
        ).points

        if not search_result:
            return []

        candidates = [hit.payload for hit in search_result if isinstance(hit.payload, dict)]
        return candidates[:top_k_final]
    except Exception:
        return []
