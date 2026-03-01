import logging
import time
from typing import List, Optional, Set

from app.domain.models import RecResponse
from app.infrastructure.repositories.events_repository import fetch_trending_scores
from app.infrastructure.repositories.products_repository import filter_active_in_stock_ids
from app.api.response_builder import build_response

logger = logging.getLogger(__name__)


def fetch_trending_products(top_k: int = 10, exclude_ids: Optional[Set[str]] = None) -> List[RecResponse]:
    exclude_ids = exclude_ids or set()
    raw_scores = fetch_trending_scores(top_k=max(50, top_k * 5))
    ordered_ids = [item_id for item_id, _ in sorted(raw_scores.items(), key=lambda x: x[1], reverse=True)]
    allowed_ids = set(filter_active_in_stock_ids(ordered_ids))
    filtered_scores = {
        item_id: score
        for item_id, score in raw_scores.items()
        if item_id in allowed_ids and item_id not in exclude_ids
    }
    return build_response(filtered_scores, "trending", top_k)


def get_trending(top_k: int) -> List[RecResponse]:
    request_start = time.perf_counter()
    logger.info("GET /recommendations/trending called (top_k=%s)", top_k)
    result = fetch_trending_products(top_k)
    logger.info(
        "GET /recommendations/trending completed in %.2f ms (result_count=%s)",
        (time.perf_counter() - request_start) * 1000,
        len(result),
    )
    return result
