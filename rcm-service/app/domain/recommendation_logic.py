from __future__ import annotations

from typing import Dict


def classify_history_segment(
    distinct_items: int,
    meaningful_events: int,
    has_purchase: bool,
    total_events: int,
    min_distinct_enough: int = 3,
) -> str:
    if has_purchase or distinct_items >= min_distinct_enough:
        return "enough_history"

    if distinct_items <= 0:
        return "no_history"

    if distinct_items == 1 and meaningful_events == 0 and total_events <= 1:
        return "no_history"

    return "light_history"


def normalize_scores(scores: Dict[str, float]) -> Dict[str, float]:
    if not scores:
        return {}

    values = list(scores.values())
    min_v = min(values)
    max_v = max(values)

    if max_v == min_v:
        return {item_id: 1.0 for item_id in scores}

    spread = max_v - min_v
    return {item_id: (score - min_v) / spread for item_id, score in scores.items()}


def blend_sources(
    source_scores: Dict[str, Dict[str, float]],
    source_weights: Dict[str, float],
) -> Dict[str, float]:
    available_sources = {
        source: scores for source, scores in source_scores.items() if scores
    }
    if not available_sources:
        return {}

    available_weight_sum = sum(source_weights.get(source, 0.0) for source in available_sources)
    if available_weight_sum <= 0:
        return {}

    normalized_by_source = {
        source: normalize_scores(scores) for source, scores in available_sources.items()
    }

    blended: Dict[str, float] = {}
    for source, normalized_scores in normalized_by_source.items():
        adjusted_weight = source_weights.get(source, 0.0) / available_weight_sum
        for item_id, score in normalized_scores.items():
            blended[item_id] = blended.get(item_id, 0.0) + adjusted_weight * score

    return blended
