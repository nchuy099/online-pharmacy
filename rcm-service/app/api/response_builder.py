from typing import Dict, List
import logging

from app.domain.models import RecResponse
from app.infrastructure.repositories.products_repository import fetch_product_summaries

logger = logging.getLogger(__name__)


def build_response(scores: Dict[str, float], source: str, top_k: int) -> List[RecResponse]:
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
    logger.info(
        "Building response for source=%s top_k=%s candidate_count=%s",
        source,
        top_k,
        len(ranked),
    )
    product_ids = [str(item_id) for item_id, _ in ranked]
    product_map = fetch_product_summaries(product_ids)

    response: List[RecResponse] = []
    for item_id, score in ranked:
        product_id = str(item_id)
        product = product_map.get(product_id)
        if product is None:
            continue
        response.append(
            RecResponse(
                product_id=product_id,
                score=float(score),
                source=source,
                product=product,
            )
        )

    dropped = len(ranked) - len(response)
    if dropped > 0:
        logger.warning(
            "Dropped %s recommendation rows for source=%s due to missing product summaries",
            dropped,
            source,
        )
    logger.info("Built response for source=%s with %s rows", source, len(response))
    return response
