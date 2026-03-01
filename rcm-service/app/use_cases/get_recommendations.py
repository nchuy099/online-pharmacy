import logging
import time
from typing import List, Optional

from app.domain import recommendation_logic as logic
from app.domain.models import RecResponse
from app.infrastructure.clients.qdrant import load_assets
from app.config import (
    BLEND_DETAIL_CF,
    BLEND_DETAIL_CONTENT,
    BLEND_HOME_ENOUGH_CF,
    BLEND_HOME_ENOUGH_CONTENT,
    BLEND_HOME_LIGHT_CONTENT,
    BLEND_HOME_LIGHT_TREND,
    HISTORY_MIN_DISTINCT_ENOUGH,
)
from app.infrastructure.repositories.events_repository import (
    fetch_item_cf_candidates,
    fetch_trending_scores,
    fetch_user_history_summary,
    fetch_user_recent_item_ids,
)
from app.infrastructure.repositories.vectors_repository import fetch_content_candidates
from app.infrastructure.repositories.products_repository import filter_active_in_stock_ids
from app.api.response_builder import build_response
from app.use_cases.get_trending import fetch_trending_products

logger = logging.getLogger(__name__)


def _filter_scores(scores: dict[str, float], exclude_ids: set[str]) -> dict[str, float]:
    if not scores:
        return {}
    ordered_ids = [item_id for item_id, _ in sorted(scores.items(), key=lambda x: x[1], reverse=True)]
    allowed_ids = set(filter_active_in_stock_ids(ordered_ids))
    return {
        item_id: score
        for item_id, score in scores.items()
        if item_id in allowed_ids and item_id not in exclude_ids
    }


def _recommend_for_product_detail(current_item_id: str, top_k: int) -> List[RecResponse]:
    logger.info("Running product-detail recommendation flow (current_item_id=%s, top_k=%s)", current_item_id, top_k)
    content_scores = fetch_content_candidates([current_item_id], limit_per_seed=max(20, top_k * 3))
    item_cf_scores = fetch_item_cf_candidates([current_item_id], top_n=max(20, top_k * 3))
    exclude_ids = {str(current_item_id)}

    content_scores = _filter_scores(content_scores, exclude_ids=exclude_ids)
    item_cf_scores = _filter_scores(item_cf_scores, exclude_ids=exclude_ids)

    # Product detail fallback order:
    # 1) blended content + item_cf
    # 2) content only
    # 3) trending
    if not item_cf_scores and content_scores:
        logger.info("Product-detail item_cf source is empty, using content-only ranking")
        return build_response(content_scores, "product_detail_content_only", top_k)

    blended = logic.blend_sources(
        source_scores={
            "content": content_scores,
            "item_cf": item_cf_scores,
        },
        source_weights={
            "content": BLEND_DETAIL_CONTENT,
            "item_cf": BLEND_DETAIL_CF,
        },
    )

    if not blended:
        if content_scores:
            logger.info("Product-detail blend is empty, fallback to content-only")
            return build_response(content_scores, "product_detail_content_only", top_k)
        logger.info("Product-detail blend and content are empty, fallback to trending")
        return fetch_trending_products(top_k, exclude_ids=exclude_ids)

    logger.info("Product-detail blend completed (blended_count=%s)", len(blended))
    return build_response(blended, "product_detail", top_k)


def _recommend_for_homepage(user_id: Optional[str], top_k: int) -> List[RecResponse]:
    if not user_id:
        logger.info("No user_id provided, homepage recommendation fallback to trending")
        return fetch_trending_products(top_k)

    logger.info("Running homepage recommendation flow (user_id=%s, top_k=%s)", user_id, top_k)
    summary = fetch_user_history_summary(user_id)
    segment = logic.classify_history_segment(
        distinct_items=summary["distinct_items"],
        meaningful_events=summary["meaningful_events"],
        has_purchase=summary["has_purchase"],
        total_events=summary["total_events"],
        min_distinct_enough=HISTORY_MIN_DISTINCT_ENOUGH,
    )
    logger.info("User %s classified into segment=%s", user_id, segment)

    if segment == "no_history":
        logger.info("Segment no_history, fallback to trending")
        return fetch_trending_products(top_k)

    seed_items = fetch_user_recent_item_ids(user_id, limit=5)
    if not seed_items:
        logger.info("No seed items found for user_id=%s, fallback to trending", user_id)
        return fetch_trending_products(top_k)

    if segment == "light_history":
        content_scores = fetch_content_candidates(seed_items, limit_per_seed=max(20, top_k * 2))
        trending_scores = fetch_trending_scores(top_k=max(50, top_k * 5))
        exclude_ids = set(seed_items)
        content_scores = _filter_scores(content_scores, exclude_ids=exclude_ids)
        trending_scores = _filter_scores(trending_scores, exclude_ids=exclude_ids)
        blended = logic.blend_sources(
            source_scores={
                "content": content_scores,
                "trending": trending_scores,
            },
            source_weights={
                "content": BLEND_HOME_LIGHT_CONTENT,
                "trending": BLEND_HOME_LIGHT_TREND,
            },
        )
        if not blended:
            logger.info("Light-history blend empty, fallback to trending")
            return fetch_trending_products(top_k, exclude_ids=exclude_ids)
        logger.info("Light-history blend completed (blended_count=%s)", len(blended))
        return build_response(blended, "homepage_light_history", top_k)

    item_cf_scores = fetch_item_cf_candidates(seed_items, top_n=max(20, top_k * 3))
    content_scores = fetch_content_candidates(seed_items, limit_per_seed=max(20, top_k * 2))
    exclude_ids = set(seed_items)
    item_cf_scores = _filter_scores(item_cf_scores, exclude_ids=exclude_ids)
    content_scores = _filter_scores(content_scores, exclude_ids=exclude_ids)
    blended = logic.blend_sources(
        source_scores={
            "item_cf": item_cf_scores,
            "content": content_scores,
        },
        source_weights={
            "item_cf": BLEND_HOME_ENOUGH_CF,
            "content": BLEND_HOME_ENOUGH_CONTENT,
        },
    )
    if not blended:
        logger.info("Enough-history blend empty, fallback to trending")
        return fetch_trending_products(top_k, exclude_ids=exclude_ids)

    logger.info("Enough-history blend completed (blended_count=%s)", len(blended))
    return build_response(blended, "homepage_enough_history", top_k)


def get_recommendations(user_id: Optional[str], current_item_id: Optional[str], top_k: int) -> List[RecResponse]:
    request_start = time.perf_counter()
    logger.info(
        "GET /recommendations called (user_id=%s, current_item_id=%s, top_k=%s)",
        user_id,
        current_item_id,
        top_k,
    )
    load_assets()

    if current_item_id:
        result = _recommend_for_product_detail(current_item_id=current_item_id, top_k=top_k)
        logger.info(
            "GET /recommendations completed via product-detail flow in %.2f ms (result_count=%s)",
            (time.perf_counter() - request_start) * 1000,
            len(result),
        )
        return result

    result = _recommend_for_homepage(user_id=user_id, top_k=top_k)
    logger.info(
        "GET /recommendations completed via homepage flow in %.2f ms (result_count=%s)",
        (time.perf_counter() - request_start) * 1000,
        len(result),
    )
    return result
