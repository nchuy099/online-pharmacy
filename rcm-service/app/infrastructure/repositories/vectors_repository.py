from typing import Dict, List
import logging
import time

from app.infrastructure.clients.qdrant import get_qdrant_client
from app.config import QDRANT_COLLECTION_NAME

logger = logging.getLogger(__name__)


def fetch_content_candidates(seed_item_ids: List[str], limit_per_seed: int = 20) -> Dict[str, float]:
    qdrant_client = get_qdrant_client()
    if not seed_item_ids or qdrant_client is None:
        logger.info(
            "Skipping content candidates (seed_count=%s, qdrant_ready=%s)",
            len(seed_item_ids),
            qdrant_client is not None,
        )
        return {}

    start = time.perf_counter()
    logger.info(
        "Fetching content candidates for %s seeds (limit_per_seed=%s)",
        len(seed_item_ids),
        limit_per_seed,
    )
    candidates: Dict[str, float] = {}
    for seed_id in seed_item_ids:
        try:
            search_response = qdrant_client.query_points(
                collection_name=QDRANT_COLLECTION_NAME,
                query=seed_id,
                limit=limit_per_seed,
            )
            for point in search_response.points:
                item_id = str(point.id)
                if item_id == str(seed_id):
                    continue
                candidates[item_id] = max(float(point.score), candidates.get(item_id, -1.0))
        except Exception as exc:
            logger.warning("Qdrant content fetch error for item %s: %s", seed_id, exc)

    logger.info(
        "Content candidates fetched in %.2f ms (candidate_count=%s)",
        (time.perf_counter() - start) * 1000,
        len(candidates),
    )
    return candidates
