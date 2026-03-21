import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from app.domain import recommendation_logic as rec


def test_classify_history_segment_no_history_for_single_view_only():
    segment = rec.classify_history_segment(
        distinct_items=1,
        meaningful_events=0,
        has_purchase=False,
        total_events=1,
    )
    assert segment == "no_history"


def test_classify_history_segment_light_history_for_two_items_without_purchase():
    segment = rec.classify_history_segment(
        distinct_items=2,
        meaningful_events=2,
        has_purchase=False,
        total_events=3,
    )
    assert segment == "light_history"


def test_classify_history_segment_enough_history_for_three_distinct_items():
    segment = rec.classify_history_segment(
        distinct_items=3,
        meaningful_events=2,
        has_purchase=False,
        total_events=4,
    )
    assert segment == "enough_history"


def test_classify_history_segment_enough_history_if_has_purchase():
    segment = rec.classify_history_segment(
        distinct_items=1,
        meaningful_events=1,
        has_purchase=True,
        total_events=1,
    )
    assert segment == "enough_history"


def test_normalize_scores_returns_zeroes_for_empty_or_constant_values():
    assert rec.normalize_scores({}) == {}
    normalized = rec.normalize_scores({"a": 5.0, "b": 5.0})
    assert normalized == {"a": 1.0, "b": 1.0}


def test_blend_sources_redistributes_weight_when_one_source_missing():
    blended = rec.blend_sources(
        source_scores={
            "content": {"p1": 0.9, "p2": 0.3},
            "trending": {},
        },
        source_weights={
            "content": 0.65,
            "trending": 0.35,
        },
    )

    assert set(blended.keys()) == {"p1", "p2"}
    assert blended["p1"] > blended["p2"]
    assert blended["p1"] == 1.0
    assert blended["p2"] == 0.0


def test_blend_sources_merges_items_across_sources():
    blended = rec.blend_sources(
        source_scores={
            "content": {"p1": 0.8, "p2": 0.2},
            "item_cf": {"p2": 0.7, "p3": 0.5},
        },
        source_weights={
            "content": 0.7,
            "item_cf": 0.3,
        },
    )

    assert set(blended.keys()) == {"p1", "p2", "p3"}
    assert blended["p1"] > blended["p2"] > blended["p3"]
